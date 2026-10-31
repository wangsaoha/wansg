// 小克：像素风小螃蟹角色（粉丝自制形象）
// drawXiaoke(ctx, cx, groundY, u, pose)
//   cx, groundY: 角色脚底中心点；u: 一个像素格的大小
//   pose: { sx, sy, rot, eyes, mouth, armL, armR, legs, blush, lookX, lookY }

const XK = {
  body: '#D97757',
  shade: '#B85A3C',
  light: '#F2A585',
  eye: '#2A1A14',
  white: '#FFFFFF',
  blush: '#FF8FA8',
  mouth: '#5A2A1E',
};

function drawXiaoke(ctx, cx, groundY, u, pose = {}) {
  const p = Object.assign({
    sx: 1, sy: 1, rot: 0,
    eyes: 'open',      // open | closed | happy | surprised | sleep
    mouth: 'smile',    // smile | open | o | none | flat
    armL: 0, armR: 0,  // 手臂抬起量（格），正数向上
    legs: 0,           // 走路相位（弧度），0 表示站立
    blush: 1,
    lookX: 0, lookY: 0,
  }, pose);

  ctx.save();
  ctx.translate(cx, groundY);
  ctx.rotate(p.rot);
  ctx.scale(p.sx, p.sy);
  // 以脚底中心为原点，角色宽 14 格、高 8 格
  ctx.translate(-7 * u, -8 * u);

  const r = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * u, y * u, w * u, h * u); };

  // 腿：四条小短腿，走路时交替抬起
  const legX = [3, 5, 8, 10];
  legX.forEach((x, i) => {
    const lift = p.legs ? Math.max(0, Math.sin(p.legs + (i % 2) * Math.PI)) * 0.8 : 0;
    r(x, 6 - lift, 1, 2 - lift * 0.3, XK.shade);
  });

  // 手臂
  r(0, 2 - p.armL, 2, 2, XK.body);
  r(0, 3.4 - p.armL, 2, 0.6, XK.shade);
  r(12, 2 - p.armR, 2, 2, XK.body);
  r(12, 3.4 - p.armR, 2, 0.6, XK.shade);

  // 身体
  r(2, 0, 10, 6, XK.body);
  r(2, 5.2, 10, 0.8, XK.shade);
  r(2.6, 0.5, 2.2, 0.6, XK.light);
  r(2.6, 0.5, 0.6, 1.6, XK.light);

  // 眼睛
  const ex = [4.2, 8.6], ey = 1.9;
  ex.forEach((x) => {
    const X = x + p.lookX * 0.4, Y = ey + p.lookY * 0.3;
    if (p.eyes === 'open' || p.eyes === 'surprised') {
      const big = p.eyes === 'surprised' ? 0.35 : 0;
      r(X - big / 2, Y - big, 1.2 + big, 2 + big * 2, XK.eye);
      r(X + 0.15, Y + 0.2 - big, 0.5, 0.5, XK.white);
      r(X + 0.75 + big / 2, Y + 1.3, 0.25, 0.25, XK.white);
    } else if (p.eyes === 'happy') {
      // ^ ^ 形状
      r(X - 0.2, Y + 1.0, 0.5, 0.5, XK.eye);
      r(X + 0.3, Y + 0.5, 0.6, 0.5, XK.eye);
      r(X + 0.9, Y + 1.0, 0.5, 0.5, XK.eye);
    } else if (p.eyes === 'closed' || p.eyes === 'sleep') {
      r(X - 0.1, Y + 1.2, 1.4, 0.4, XK.eye);
    }
  });

  // 腮红
  if (p.blush > 0) {
    ctx.globalAlpha = p.blush * 0.85;
    r(2.8, 3.9, 1.3, 0.7, XK.blush);
    r(9.9, 3.9, 1.3, 0.7, XK.blush);
    ctx.globalAlpha = 1;
  }

  // 嘴巴
  const mx = 6.5 + p.lookX * 0.3, my = 4.0;
  if (p.mouth === 'smile') {
    r(mx, my + 0.3, 0.3, 0.3, XK.mouth);
    r(mx + 0.3, my + 0.6, 0.4, 0.3, XK.mouth);
    r(mx + 0.7, my + 0.3, 0.3, 0.3, XK.mouth);
  } else if (p.mouth === 'open') {
    r(mx, my + 0.2, 1, 0.9, XK.mouth);
    r(mx + 0.2, my + 0.75, 0.6, 0.35, XK.blush);
  } else if (p.mouth === 'o') {
    r(mx + 0.15, my + 0.1, 0.7, 0.9, XK.mouth);
  } else if (p.mouth === 'flat') {
    r(mx, my + 0.5, 1, 0.3, XK.mouth);
  }

  ctx.restore();
}

if (typeof module !== 'undefined') module.exports = { drawXiaoke, XK };
