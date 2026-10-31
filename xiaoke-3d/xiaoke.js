// 3D 方块版小克（粉丝自制形象）
// makeXiaoke() 返回 { root, setPose(p) }，root 的原点在脚底中心，身高约 8 个单位
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const mat = (c, r = 0.65, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
export const box = (w, h, d, color, r = 0.12) => {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), typeof color === 'string' ? mat(color) : color);
  m.castShadow = true; m.receiveShadow = true; return m;
};
const C = { body: '#D97757', shade: '#B85A3C', light: '#F2A585', eye: '#2A1A14', white: '#FFFFFF', blush: '#FF8FA8', mouth: '#5A2A1E' };

export function makeXiaoke() {
  const root = new THREE.Group();
  const torso = new THREE.Group(); root.add(torso);
  const body = box(10, 6, 6, C.body, 0.45); body.position.y = 5; torso.add(body);
  const belly = box(10.05, 0.8, 6.05, C.shade, 0.2); belly.position.y = 2.4; torso.add(belly);
  const s1 = box(2.4, 0.5, 0.2, C.light, 0.1); s1.position.set(-3.3, 7.3, 3.02); torso.add(s1);
  const s2 = box(0.5, 1.6, 0.2, C.light, 0.1); s2.position.set(-4.25, 6.75, 3.02); torso.add(s2);

  const face = new THREE.Group(); face.position.set(0, 5, 3.05); torso.add(face);
  const eyes = { open: [], happy: [], closed: [] };
  [-2.2, 2.2].forEach((x) => {
    const e = new THREE.Group(); e.position.set(x, 0.6, 0);
    e.add(box(1.2, 2, 0.3, C.eye, 0.15));
    const hi = box(0.5, 0.5, 0.1, C.white, 0.05); hi.position.set(-0.15, 0.55, 0.18); e.add(hi);
    const hi2 = box(0.25, 0.25, 0.1, C.white, 0.03); hi2.position.set(0.3, -0.5, 0.18); e.add(hi2);
    face.add(e); eyes.open.push(e);
    const h = new THREE.Group(); h.position.set(x, 0.6, 0);
    [[-0.55, -0.1], [0, 0.4], [0.55, -0.1]].forEach(([a, b]) => { const m = box(0.55, 0.55, 0.3, C.eye, 0.08); m.position.set(a, b, 0); h.add(m); });
    face.add(h); eyes.happy.push(h);
    const c = box(1.5, 0.4, 0.3, C.eye, 0.1); c.position.set(x, 0.2, 0); face.add(c); eyes.closed.push(c);
    const blush = box(1.3, 0.7, 0.15, C.blush, 0.1); blush.position.set(x * 1.6, -1.3, 0); face.add(blush);
  });
  const mouths = { smile: new THREE.Group(), open: new THREE.Group(), o: new THREE.Group() };
  [[-0.35, 0], [0, -0.3], [0.35, 0]].forEach(([x, y]) => { const m = box(0.35, 0.35, 0.15, C.mouth, 0.05); m.position.set(x, y, 0); mouths.smile.add(m); });
  mouths.open.add(box(1.1, 0.9, 0.15, C.mouth, 0.15));
  const tongue = box(0.7, 0.35, 0.1, C.blush, 0.1); tongue.position.set(0, -0.2, 0.06); mouths.open.add(tongue);
  mouths.o.add(box(0.8, 1.0, 0.15, C.mouth, 0.25));
  Object.values(mouths).forEach((m) => { m.position.set(0, -1.1, 0.05); face.add(m); });

  const arms = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.set(s * 5, 5.5, 0);
    const a = box(2.2, 2, 2.4, C.body, 0.35); a.position.set(s * 1.1, 0, 0); pivot.add(a);
    const ab = box(2.25, 0.5, 2.45, C.shade, 0.15); ab.position.set(s * 1.1, -0.8, 0); pivot.add(ab);
    torso.add(pivot); return pivot;
  });

  const legs = [];
  [-3.5, -1.5, 1.5, 3.5].forEach((x, i) => [-1.6, 1.6].forEach((z, j) => {
    const l = box(1, 2.2, 1, C.shade, 0.2); l.position.set(x, 1.1, z); root.add(l); legs.push({ m: l, phase: (i + j) % 2, x, z });
  }));

  // 侦探帽（默认隐藏）
  const hat = new THREE.Group(); hat.position.y = 8; torso.add(hat);
  const brim = box(11, 0.6, 7.5, '#7A4E2E', 0.25); brim.position.y = 0.3; hat.add(brim);
  const crown = box(7.5, 2.8, 5.5, '#9A6B45', 0.5); crown.position.y = 1.9; hat.add(crown);
  const band = box(7.6, 0.6, 5.6, '#5E3B22', 0.2); band.position.y = 1.0; hat.add(band);
  hat.visible = false;

  function setPose(p = {}) {
    // walk：走路相位（弧度），walkDir：'side' 横着走（螃蟹步）或 'fwd' 向前走
    const q = Object.assign({ lift: 0, squash: 0, armL: 0, armR: 0, eyes: 'open', mouth: 'smile', walk: 0, walkDir: 'side', lookX: 0, hat: null }, p);
    torso.position.y = q.lift;
    torso.scale.set(1 + q.squash, 1 - q.squash, 1 + q.squash);
    arms[0].rotation.z = -q.armL; arms[1].rotation.z = q.armR;
    for (const k in eyes) eyes[k].forEach((e) => (e.visible = k === q.eyes));
    if (q.eyes === 'surprised') { eyes.open.forEach((e) => { e.visible = true; e.scale.set(1.25, 1.25, 1); }); }
    else eyes.open.forEach((e) => e.scale.set(1, 1, 1));
    for (const k in mouths) mouths[k].visible = k === q.mouth;
    face.position.x = q.lookX * 0.8;
    // 两组腿交替：一组抬起往前迈，另一组踩在地上往后蹬
    legs.forEach(({ m, phase, x, z }) => {
      const ph = q.walk + phase * Math.PI;
      const up = q.walk ? Math.max(0, Math.sin(ph)) * 0.9 : 0, swing = q.walk ? -Math.cos(ph) * 0.45 : 0;
      m.position.set(x + (q.walkDir === 'side' ? swing : 0), 1.1 + up, z + (q.walkDir === 'fwd' ? swing : 0));
    });
    if (q.walk) { torso.position.y += Math.abs(Math.sin(q.walk)) * 0.35; torso.rotation.z = q.walkDir === 'side' ? Math.sin(q.walk) * 0.05 : 0; torso.rotation.x = q.walkDir === 'fwd' ? Math.sin(q.walk) * 0.04 : 0; }
    else torso.rotation.set(0, 0, 0);
    hat.visible = q.hat != null; if (hat.visible) hat.position.y = 8 + q.hat;
  }
  setPose();
  return { root, setPose };
}
