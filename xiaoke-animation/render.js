// 用法：
//   node render.js preview 1.2 5 10 ...   导出指定秒数的截图到 preview/
//   node render.js video                  渲染整段视频到 frames.mp4（无声）
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const TL = require('./timeline.js');

(async () => {
  const [mode, ...args] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.resolve(__dirname, 'anim.html'));
  await page.evaluate(() => document.fonts.ready);
  const grab = async (t) => {
    const url = await page.evaluate((t) => { renderFrame(t); return document.getElementById('c').toDataURL('image/png'); }, t);
    return Buffer.from(url.split(',')[1], 'base64');
  };
  if (mode === 'preview') {
    fs.mkdirSync(path.join(__dirname, 'preview'), { recursive: true });
    for (const s of args) fs.writeFileSync(path.join(__dirname, 'preview', `t${s}.png`), await grab(+s));
  } else {
    const n = TL.duration * TL.fps;
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(TL.fps), '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', path.join(__dirname, 'frames.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = 0; f < n; f++) {
      const buf = await grab(f / TL.fps);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (f % 150 === 0) console.log(`frame ${f}/${n}`);
    }
    ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  }
  await browser.close();
})();
