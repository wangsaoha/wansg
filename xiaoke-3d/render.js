// 用法：node render.js still 1.2 out.png   |   node render.js video 6 out.mp4
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');

(async () => {
  const [mode, a, out] = process.argv.slice(2);
  const server = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], { cwd: __dirname, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto('http://127.0.0.1:8765/index.html');
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  const grab = async (t, dur) => {
    const url = await page.evaluate(([t, dur]) => { renderFrame(t, dur); return document.querySelector('canvas').toDataURL('image/png'); }, [t, dur]);
    return Buffer.from(url.split(',')[1], 'base64');
  };
  try {
    if (mode === 'still') fs.writeFileSync(out, await grab(+a, 6));
    else {
      const dur = +a, fps = 30, n = dur * fps;
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', out], { stdio: ['pipe', 'inherit', 'inherit'] });
      for (let f = 0; f < n; f++) {
        const buf = await grab(f / fps, dur);
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
        if (f % 30 === 0) console.log(`frame ${f}/${n}`);
      }
      ff.stdin.end(); await new Promise((r) => ff.on('close', r));
    }
  } finally { await browser.close(); server.kill(); }
})();
