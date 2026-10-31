# 3D 方块版小克 · 画电路板（粉丝自制，非官方）

成品：`xiaoke_pcb_40s.mp4`（1080×1920 竖屏，30fps，带音效，无背景音乐）

## 文件
- `xiaoke.js`：3D 小克（表情、螃蟹步、侦探帽）
- `pcb.js`：555 LED 闪烁电路板（元件、走线、丝印、连锡）
- `stage.js`：灯光、桌面、镜头等共用舞台
- `anim.html`：40 秒剧情；`timeline.js`：字幕和音效时间点
- `drc.js`：走线检查（短路、断路、悬空焊盘）
- `pcb.html` / `walk.html` / `index.html`：定妆图、走路测试、环绕小样

## 重新生成
```bash
npm install
node drc.js                                   # 检查走线
python3 ../xiaoke-animation/audio.py timeline.js   # 合成音效 → audio.wav
PAGE=anim.html node render.js video 40 frames.mp4  # 渲染画面
ffmpeg -y -i frames.mp4 -i audio.wav -c:v copy -c:a aac -b:a 160k -shortest xiaoke_pcb_40s.mp4
node preview.js out.png 5 12 20                # 只看几个时间点
```

电路：NE555 多谐振荡器（R1 10k、R2 47k、C1 10µF，约 1.4Hz），驱动 4 串 LED（每串 2 颗 + 330Ω）。
板子只为动画设计，没有经过真正的 PCB 软件检查，不能直接打样。
