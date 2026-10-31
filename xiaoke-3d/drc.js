// 走线检查：按铜皮几何关系算出真实连通关系，报告短路（不同网络连在一起）和断路（同一网络断成几段）
const { chromium } = require('playwright');
const { spawn } = require('child_process');

const TW = 0.42, PR = 20 / 64, VR = 17 / 64, CLEAR = 0.1;
function segDist(a, b, c, d) { // 两条线段的最短距离
  const pd = (p, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz; let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz); };
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return 0;
  return Math.min(pd(a, c, d), pd(b, c, d), pd(c, a, b), pd(d, a, b));
}

(async () => {
  const server = spawn('python3', ['-m', 'http.server', '8766', '--bind', '127.0.0.1'], { cwd: __dirname, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://127.0.0.1:8766/pcb.html');
  const data = await p.evaluate(async () => { const m = await import('./pcb.js'); return { T: m.TRACES, P: m.PADS, V: m.VIAS }; });
  await b.close(); server.kill();

  // 元素：每段走线、每个焊盘（两层都有）、每个过孔（两层都有）
  const el = [];
  data.T.forEach((t, ti) => { for (let i = 1; i < t.pts.length; i++) el.push({ kind: 'seg', layer: t.layer, a: t.pts[i - 1], b: t.pts[i], r: TW / 2, net: t.net, ti }); });
  data.P.forEach((q) => el.push({ kind: 'pad', layer: 'both', a: [q.x, q.z], b: [q.x, q.z], r: PR }));
  data.V.forEach((v) => el.push({ kind: 'via', layer: 'both', a: v, b: v, r: VR }));
  const par = el.map((_, i) => i); const find = (i) => (par[i] === i ? i : (par[i] = find(par[i])));
  const near = [];
  for (let i = 0; i < el.length; i++) for (let j = i + 1; j < el.length; j++) {
    const A = el[i], B = el[j];
    if (A.layer !== 'both' && B.layer !== 'both' && A.layer !== B.layer) continue;
    if (A.kind !== 'seg' && B.kind !== 'seg') continue;
    const d = segDist(A.a, A.b, B.a, B.b) - A.r - B.r;
    if (d <= 0.001) par[find(i)] = find(j);
    else if (d < CLEAR) near.push([i, j, d]);
  }
  const groups = {};
  el.forEach((e, i) => { const r = find(i); (groups[r] ||= { nets: new Set(), n: 0 }); if (e.net) groups[r].nets.add(e.net.startsWith('led') ? e.net + '#' + e.ti : e.net); groups[r].n++; });
  let bad = 0;
  // 短路：一组铜皮里出现两个不同网络（led 串内部各段本来就是不同节点，单独看）
  for (const g of Object.values(groups)) {
    const nets = [...g.nets];
    if (nets.length > 1) { console.log('短路:', nets.join(' + ')); bad++; }
  }
  // 断路：非 LED 网络应该只有一组铜皮
  const netGroups = {};
  el.forEach((e, i) => { if (e.net && !e.net.startsWith('led')) (netGroups[e.net] ||= new Set()).add(find(i)); });
  for (const [n, s] of Object.entries(netGroups)) if (s.size > 1) { console.log(`断路: ${n} 分成了 ${s.size} 段`); bad++; }
  // 没有接任何线的焊盘
  el.forEach((e, i) => { if (e.kind === 'pad' && groups[find(i)].n === 1) { console.log('悬空焊盘:', e.a); bad++; } });
  near.forEach(([i, j, d]) => { const A = el[i], B = el[j]; if (find(i) !== find(j)) { console.log(`间距太近 ${d.toFixed(2)}:`, A.net || A.kind, A.a, B.net || B.kind, B.a); bad++; } });
  console.log(bad ? `共 ${bad} 个问题` : '检查通过：没有短路、断路、悬空焊盘');
  console.log('网络:', Object.entries(netGroups).map(([n, s]) => n + '×' + s.size).join(' '));
})();
