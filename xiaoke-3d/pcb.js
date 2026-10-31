// 3D 电路板：基于 555 多谐振荡器的 LED 闪烁电路（为了画面做了简化）
// 板子坐标：x ∈ [-11, 11]，z ∈ [-16, 16]，板面 y = 0
// makePCB() 返回 { root, parts, setState(s) }
import * as THREE from 'three';
import { mat, box } from './xiaoke.js';

export const BW = 22, BD = 32, PX = 64; // 板子尺寸（单位）与贴图分辨率（像素/单位）
const P = (x, z) => [(x + BW / 2) * PX, (z + BD / 2) * PX];

// ---------- 电路数据 ----------
// U1 = NE555（DIP-8）。下排 1..4，上排 8..5
const U1 = { x: 0, z: -6 };
const pin = (n) => n <= 4 ? [U1.x - 1.5 + (n - 1), U1.z + 1.6] : [U1.x + 1.5 - (n - 5), U1.z - 1.6];

// 笑脸 LED：两只眼睛各 1 颗，嘴巴 6 颗；分成 4 串，每串 2 颗 + 1 个 330Ω 限流电阻
// 下标：0 左眼，1 右眼，2..7 嘴巴从左到右
const MOUTH = Array.from({ length: 6 }, (_, i) => { const a = (25 + i * 26) * Math.PI / 180; return [-5.2 * Math.cos(a), 6.6 + 4.2 * Math.sin(a)]; });
const LED_POS = [[-3.2, 3.4], [3.2, 3.4], ...MOUTH];
const STRINGS = [[0, 2], [3, 4], [6, 5], [1, 7]];
// 每颗 LED 两个脚：A（正极，靠上）和 K（负极，靠下）
const LA = (i) => [LED_POS[i][0], LED_POS[i][1] - 0.45];
const LK = (i) => [LED_POS[i][0], LED_POS[i][1] + 0.45];
const R_LED_X = [-6, -2, 2, 6];

// 走线：{ pts, layer: 'top' | 'bot', net, order }  order 用来控制“画线”动画的先后
export const TRACES = [];
const T = (net, layer, ...pts) => TRACES.push({ net, layer, pts, order: TRACES.length });
// 电源
T('bat', 'top', [-8.7, -14.2], [-8.7, -15.2], [-4, -15.2], [-4, -14.2]);       // J1+ → SW1
T('vcc', 'top', [-2, -14.2], [-2, -12.2]);                                      // SW1 → VCC 母线
T('vcc', 'top', [-9, -12.2], [9, -12.2]);
T('gnd', 'top', [-10, -13], [-10, 14.5], [10, 14.5], [10, -10]);                // GND 环
T('gnd', 'bot', [-7.3, -14.2], [-7.3, -13], [-10, -13]);                        // J1- → GND
// 555 周边
T('vcc', 'bot', pin(8), [pin(8)[0], -12.2]);                                    // 8 → VCC
T('vcc', 'bot', pin(4), [2.6, pin(4)[1]], [2.6, -12.2]);                        // 4 → VCC
T('ctl', 'top', pin(5), [4.2, pin(5)[1]]);                                      // 5 → C2
T('gnd', 'top', [5.4, pin(5)[1]], [10, pin(5)[1]]);                             // C2 → GND
T('vcc', 'top', [-6, -9.6], [-6, -12.2]);                                       // R1 → VCC
T('dis', 'top', [-3, -9.6], [pin(7)[0], -9.6], pin(7));                         // R1 → 7
T('dis', 'top', [-4.5, -7.4], [-4.5, -8.4], [pin(7)[0], -8.4]);                 // R2 → 7
T('thr', 'bot', [-4.5, -4.4], [-4.5, -3.2], [pin(2)[0], -3.2], pin(2));         // R2 → 2（走背面，避开 1 脚的地线）
T('thr', 'bot', pin(6), [pin(6)[0], -6], [pin(2)[0], -6], pin(2));              // 6 ↔ 2
T('thr', 'top', [-6.2, -4.4], [-4.5, -4.4]);                                    // C1+ → R2
T('gnd', 'top', [-7.8, -4.4], [-10, -4.4]);                                     // C1- → GND
T('gnd', 'top', pin(1), [pin(1)[0], -2.4], [-10, -2.4]);                        // 1 → GND
T('out', 'top', pin(3), [pin(3)[0], -1.4]);                                     // 3 → OUT 母线
T('out', 'top', [-6, -1.4], [6, -1.4]);
// LED 串
STRINGS.forEach((s, k) => {
  const rx = R_LED_X[k];
  const first = LA(s[0]);
  T('led' + k, k === 1 || k === 2 ? 'bot' : 'top', [rx, 1.6], [rx, (first[1] + 1.6) / 2], [first[0], (first[1] + 1.6) / 2], first);
  for (let i = 0; i < s.length - 1; i++) T('led' + k, 'top', LK(s[i]), LA(s[i + 1]));
  const last = LK(s[s.length - 1]);
  if (k === 0) T('gnd', 'top', last, [-10, last[1]]);
  else if (k === 3) T('gnd', 'top', last, [10, last[1]]);
  else T('gnd', 'top', last, [last[0], 14.5]);
});
// 短路：一坨焊锡把 OUT 母线和 GND 线连在了一起（剧情用）
export const SHORT = { a: [-3.5, -2.4], b: [-3.5, -1.4], at: [-3.5, -1.9] };

export const PADS = [];
const pad = (x, z, sq) => PADS.push({ x, z, sq });
for (let n = 1; n <= 8; n++) pad(...pin(n), n === 1);
[[-8.7, -14.2], [-7.3, -14.2], [-4, -14.2], [-2, -14.2], [-6, -9.6], [-3, -9.6], [-4.5, -7.4], [-4.5, -4.4],
  [-6.2, -4.4], [-7.8, -4.4], [4.2, -7.6], [5.4, -7.6]].forEach(([x, z]) => pad(x, z));
R_LED_X.forEach((x) => { pad(x, -1.4); pad(x, 1.6); });
LED_POS.forEach((_, i) => { pad(...LA(i)); pad(...LK(i), true); });
// 过孔：背面走线接到顶层母线的地方
export const VIAS = [[pin(8)[0], -12.2], [2.6, -12.2], [-10, -13]];

const LABELS = [
  ['J1 +9V', -8, -15.9], ['SW1', -3, -15.9], ['U1 NE555', 3.4, -4.1], ['R1 10k', -4.5, -10.5], ['R2', -5.75, -6.3],
  ['C1 10µ', -7, -3.3], ['C2 10n', 7.4, -8.6], ['R3 330', -7.9, 0.1], ['R4', -2.9, 0.1], ['R5', 1.1, 0.1], ['R6', 5.1, 0.1],
];

// ---------- 贴图 ----------
function boardTexture() {
  const cv = document.createElement('canvas'); cv.width = BW * PX; cv.height = BD * PX;
  const g = cv.getContext('2d');
  return { cv, g, tex: new THREE.CanvasTexture(cv) };
}

function drawBoard(g, s) {
  const W = BW * PX, H = BD * PX;
  g.fillStyle = '#1C7A47'; g.fillRect(0, 0, W, H);
  // 细微的纹理
  for (let i = 0; i < 2500; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1, y = (Math.sin(i * 78.233) * 43758.5453 % 1 + 1) % 1;
    g.fillStyle = i % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.04)'; g.fillRect(x * W, y * H, 6, 6);
  }
  const lw = 0.42 * PX;
  const line = (pts, color, w = lw) => {
    g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](...P(...p))); g.stroke();
  };
  // 按进度画出部分走线
  const partial = (pts, k) => {
    if (k >= 1) return pts;
    const segs = []; let total = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); total += d; }
    let left = total * k; const out = [pts[0]];
    for (let i = 1; i < pts.length && left > 0; i++) {
      const d = segs[i - 1], f = Math.min(1, left / d);
      out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]); left -= d;
    }
    return out;
  };
  const shown = (tr) => clamp01(s.traces * TRACES.length - tr.order);
  // 底层走线（隔着阻焊层看，颜色暗一些）
  TRACES.filter((t) => t.layer === 'bot').forEach((t) => { const k = shown(t); if (k > 0) line(partial(t.pts, k), '#2E6B3E'); });
  TRACES.filter((t) => t.layer === 'top').forEach((t) => { const k = shown(t); if (k > 0) line(partial(t.pts, k), '#B8862E'); });
  if (s.short) {
    // 连锡
    line([SHORT.a, SHORT.b], '#D9DCE0', lw * 1.6);
  }
  // 焊盘
  PADS.forEach(({ x, z, sq }) => {
    const [px, py] = P(x, z); g.fillStyle = '#E2C77C';
    if (sq) g.fillRect(px - 20, py - 20, 40, 40); else { g.beginPath(); g.arc(px, py, 20, 0, 7); g.fill(); }
    g.fillStyle = '#4A3A20'; g.beginPath(); g.arc(px, py, 8, 0, 7); g.fill();
  });
  VIAS.forEach(([x, z]) => {
    const [px, py] = P(x, z); g.fillStyle = '#E2C77C'; g.beginPath(); g.arc(px, py, 17, 0, 7); g.fill();
    g.fillStyle = '#2A2A2A'; g.beginPath(); g.arc(px, py, 7, 0, 7); g.fill();
  });
  // 安装孔
  [[-9.6, -15], [9.6, -15], [-9.6, 15], [9.6, 15]].forEach(([x, z]) => {
    const [px, py] = P(x, z); g.fillStyle = '#E2C77C'; g.beginPath(); g.arc(px, py, 42, 0, 7); g.fill();
    g.fillStyle = '#2A2A2A'; g.beginPath(); g.arc(px, py, 26, 0, 7); g.fill();
  });
  // 丝印
  g.fillStyle = '#F4F4EE'; g.strokeStyle = '#F4F4EE'; g.lineWidth = 4;
  g.font = 'bold 34px "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  LABELS.forEach(([t, x, z]) => g.fillText(t, ...P(x, z)));
  g.strokeRect(...P(U1.x - 2.4, U1.z - 2.4), 4.8 * PX, 4.8 * PX);
  g.font = 'bold 44px "DejaVu Sans", sans-serif'; g.fillText('XIAOKE-555 BLINKY v1.0', ...P(0, 15.5));
  LED_POS.forEach(([x, z]) => { g.beginPath(); g.arc(...P(x, z), 0.75 * PX, 0, 7); g.stroke(); });
  // 自定义丝印
  g.font = 'bold 110px "WenQuanYi Zen Hei", sans-serif'; g.fillText('呆唯', ...P(-6.2, 12.0));
  const heart = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  const [hx, hy] = P(-3.3, 11.4);
  heart.forEach((row, j) => [...row].forEach((c, i) => { if (c === '#') g.fillRect(hx + i * 11, hy + j * 11, 10, 10); }));
}

function drawGlow(g, s) {
  const W = BW * PX, H = BD * PX;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (s.glow <= 0) return;
  g.strokeStyle = `rgba(255,200,90,${s.glow})`; g.lineWidth = 0.42 * PX; g.lineCap = 'round'; g.lineJoin = 'round';
  TRACES.filter((t) => t.layer === 'top').forEach((t) => {
    if (s.glowNets && !s.glowNets.includes(t.net.replace(/\d/, ''))) return;
    g.beginPath(); t.pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](...P(...p))); g.stroke();
  });
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));

// ---------- 3D 元件 ----------
function resistor(len, bands) {
  const g = new THREE.Group();
  const lead = mat('#C9CCD1', 0.3, { metalness: 0.8 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, len - 1.6, 6, 16), mat('#E6CFA0', 0.5));
  body.rotation.z = Math.PI / 2; body.position.y = 0.75; body.castShadow = true; g.add(body);
  bands.forEach((c, i) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.16, 20), mat(c, 0.5));
    b.rotation.z = Math.PI / 2; b.position.set(-0.55 + i * 0.36, 0.75, 0); g.add(b);
  });
  [-1, 1].forEach((s) => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.08), lead); h.position.set(s * (len / 2 - 0.45), 0.75, 0); g.add(h);
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.08), lead); v.position.set(s * (len / 2 - 0.2), 0.38, 0); g.add(v);
  });
  return g;
}

function haloTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(cv);
}

export function makePCB() {
  const root = new THREE.Group();
  const parts = {};

  // 板子
  const bt = boardTexture(), gt = boardTexture();
  bt.tex.colorSpace = THREE.SRGBColorSpace; bt.tex.anisotropy = 8;
  const topMat = new THREE.MeshStandardMaterial({ map: bt.tex, roughness: 0.45, emissiveMap: gt.tex, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 1.0 });
  const sideMat = mat('#145C35', 0.5);
  const board = new THREE.Mesh(new THREE.BoxGeometry(BW, 1.0, BD), [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]);
  board.position.y = -0.5; board.receiveShadow = true; board.castShadow = true; root.add(board);
  parts.board = board;

  const comps = new THREE.Group(); root.add(comps);
  const place = (obj, x, z, name, ry = 0) => { obj.position.set(x, 0, z); obj.rotation.y = ry; obj.traverse((o) => { if (o.isMesh) o.castShadow = true; }); comps.add(obj); parts[name] = obj; obj.userData.home = obj.position.clone(); return obj; };

  // J1：电池接口
  const j1 = new THREE.Group();
  const jb = box(2.8, 1.6, 1.8, '#F2F0E8', 0.15); jb.position.y = 0.8; j1.add(jb);
  [[-0.7, '#D23B3B'], [0.7, '#2A2A2A']].forEach(([x, c]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4, 10), mat(c, 0.6)); w.rotation.x = Math.PI / 2; w.position.set(x, 1.0, -2.6); j1.add(w); });
  place(j1, -8, -14.2, 'J1');
  // SW1：拨动开关
  const sw = new THREE.Group();
  const sb = box(2.8, 1.2, 1.6, '#2B2B30', 0.15); sb.position.y = 0.6; sw.add(sb);
  const knob = box(0.8, 0.9, 0.7, '#F2F0E8', 0.12); knob.position.set(-0.6, 1.4, 0); sw.add(knob); parts.knob = knob;
  place(sw, -3, -14.2, 'SW1');
  // U1：NE555
  const u1 = new THREE.Group();
  const ub = box(4.4, 1.1, 2.6, '#1E1E22', 0.1); ub.position.y = 1.0; u1.add(ub);
  const notch = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16, 1, false, 0, Math.PI), mat('#0E0E10')); notch.position.set(-2.2, 1.56, 0); notch.rotation.y = Math.PI / 2; u1.add(notch);
  const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12), mat('#3A3A40')); dot.position.set(-1.6, 1.56, 0.75); u1.add(dot);
  const pinMat = mat('#C9CCD1', 0.3, { metalness: 0.8 });
  for (let i = 0; i < 4; i++) [-1, 1].forEach((s) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.0, 0.25), pinMat); p.position.set(-1.5 + i, 0.5, s * 1.45); u1.add(p); });
  // 芯片上的字
  const lc = document.createElement('canvas'); lc.width = 256; lc.height = 128; const lg = lc.getContext('2d');
  lg.fillStyle = '#C8C8C8'; lg.font = 'bold 54px "DejaVu Sans", sans-serif'; lg.textAlign = 'center'; lg.textBaseline = 'middle'; lg.fillText('NE555', 128, 64);
  const lt = new THREE.CanvasTexture(lc); lt.colorSpace = THREE.SRGBColorSpace;
  const lp = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ map: lt, transparent: true }));
  lp.rotation.x = -Math.PI / 2; lp.position.y = 1.57; u1.add(lp);
  place(u1, U1.x, U1.z, 'U1');
  // 电阻
  place(resistor(3, ['#8B5A2B', '#1A1A1A', '#E8862A', '#C8A040']), -4.5, -9.6, 'R1');
  place(resistor(3, ['#F2D23A', '#7A3FB0', '#E8862A', '#C8A040']), -4.5, -5.9, 'R2', Math.PI / 2);
  R_LED_X.forEach((x, i) => place(resistor(3, ['#E8862A', '#E8862A', '#8B5A2B', '#C8A040']), x, 0.1, 'R' + (3 + i), Math.PI / 2));
  // C1：电解电容
  const c1 = new THREE.Group();
  const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 2.6, 28), mat('#2B4A9C', 0.35)); cb.position.y = 1.3; c1.add(cb);
  const ct = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.05, 28), mat('#C9CCD1', 0.3, { metalness: 0.7 })); ct.position.y = 2.62; c1.add(ct);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 0.96, 2.5, 28, 1, true, -0.4, 0.8), mat('#D8DDE8', 0.4)); stripe.position.y = 1.3; c1.add(stripe);
  place(c1, -7, -4.4, 'C1');
  // C2：瓷片电容
  const c2 = new THREE.Group();
  const cc = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 14), mat('#E8A23A', 0.45)); cc.scale.set(1, 1.1, 0.45); cc.position.y = 1.3; c2.add(cc);
  [-0.6, 0.6].forEach((x) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), pinMat); l.position.set(x * 0.6, 0.35, 0); c2.add(l); });
  place(c2, 4.8, -7.6, 'C2');

  // LED
  const halo = haloTexture();
  parts.leds = LED_POS.map(([x, z], i) => {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color: '#C8141E', roughness: 0.2, transparent: true, opacity: 0.95, emissive: new THREE.Color('#FF1A10'), emissiveIntensity: 0 });
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.9, 20), m); b.position.y = 0.55; g.add(b);
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), m); d.position.y = 1.0; g.add(d);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.15, 20), m); rim.position.y = 0.15; g.add(rim);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: '#FF2A1A', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.scale.set(3, 3, 1); sp.position.y = 1.0; g.add(sp);
    g.userData.mat = m; g.userData.halo = sp;
    return place(g, x, z, 'D' + (i + 1));
  });

  let lastKey = null;
  function setState(s) {
    s = Object.assign({ traces: 1, glow: 0, glowNets: null, leds: 0, ledMask: null, short: false, knob: 0 }, s);
    // 贴图只在板面内容变化时重画（LED 亮灭不需要重画）
    const key = JSON.stringify([s.traces, s.glow, s.glowNets, s.short]);
    if (key !== lastKey) { lastKey = key; drawBoard(bt.g, s); bt.tex.needsUpdate = true; drawGlow(gt.g, s); gt.tex.needsUpdate = true; }
    parts.leds.forEach((l, i) => {
      const on = s.ledMask ? s.ledMask[i] * s.leds : s.leds;
      l.userData.mat.emissiveIntensity = on * 1.6; l.userData.halo.material.opacity = on * 0.75;
    });
    knob.position.x = -0.6 + s.knob * 1.2;
  }
  setState({});
  return { root, parts, setState };
}
