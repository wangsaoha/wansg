// node preview.js out.png 1 5 9 ...   多个时间点拼成一张小图
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
(async () => {
  const [outp, ...ts] = process.argv.slice(2);
  const server = spawn('python3', ['-m', 'http.server', '8767', '--bind', '127.0.0.1'], { cwd: __dirname, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.error('page error:', e.message));
  await p.goto('http://127.0.0.1:8767/anim.html'); await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  const url = await p.evaluate((ts) => {
    const c = document.createElement('canvas'), cols = Math.min(5, ts.length), rows = Math.ceil(ts.length / cols);
    c.width = cols * 270; c.height = rows * 480; const g = c.getContext('2d');
    ts.forEach((t, i) => { renderFrame(+t); g.drawImage(document.getElementById('out'), (i % cols) * 270, Math.floor(i / cols) * 480, 270, 480); g.fillStyle = '#000'; g.font = 'bold 22px sans-serif'; g.fillText(t + 's', (i % cols) * 270 + 8, Math.floor(i / cols) * 480 + 470); });
    return c.toDataURL('image/png');
  }, ts);
  require('fs').writeFileSync(outp, Buffer.from(url.split(',')[1], 'base64'));
  await b.close(); server.kill();
})();
