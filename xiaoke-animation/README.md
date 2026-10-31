# 小克 40 秒动画（粉丝自制，非官方）

成品：`xiaoke_40s.mp4`（1080×1920 竖屏，30fps，带音效，无背景音乐）

## 重新生成
```bash
python3 audio.py                 # 合成音效 → audio.wav
node render.js video             # 渲染画面 → frames.mp4
ffmpeg -y -i frames.mp4 -i audio.wav -c:v copy -c:a aac -b:a 160k -shortest xiaoke_40s.mp4
node render.js preview 5 12 30   # 只导出几张截图预览
```

## 文件
- `timeline.js`：字幕和音效的时间点（改这里，画面和声音一起变）
- `xiaoke.js`：小克的形象和表情
- `anim.html`：每一幕的动画
- `sfx.py` / `audio.py`：用代码合成的音效
