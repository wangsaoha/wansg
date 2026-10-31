// 时间轴：画面（anim.html）和音效（audio.py）共用这一份，保证声画同步
const TL = {
  "duration": 40,
  "fps": 30,
  "charStep": 0.085,
  "subtitles": [
    { "t": 2.6, "end": 4.0, "text": "咦？" },
    { "t": 6.0, "end": 9.0, "text": "你好呀！我是小克～" },
    { "t": 10.0, "end": 14.8, "text": "写代码？交给我！" },
    { "t": 16.0, "end": 20.8, "text": "啊！有 bug！" },
    { "t": 23.8, "end": 26.8, "text": "找到你了～修好啦！" },
    { "t": 34.6, "end": 37.8, "text": "今天也辛苦啦…" }
  ],
  "sfx": [
    { "t": 0.0, "type": "whistle" },
    { "t": 0.8, "type": "thud" },
    { "t": 0.85, "type": "boing" },
    { "t": 1.35, "type": "boing", "pitch": 1.3 },
    { "t": 2.4, "type": "blink" },
    { "t": 4.0, "type": "pop", "pitch": 1.2 },
    { "t": 9.2, "type": "pop" },
    { "t": 9.8, "type": "typing", "until": 14.6 },
    { "t": 15.2, "type": "alarm" },
    { "t": 15.3, "type": "jump" },
    { "t": 21.2, "type": "pop" },
    { "t": 21.5, "type": "steps", "until": 23.4 },
    { "t": 23.6, "type": "found" },
    { "t": 24.2, "type": "whoosh" },
    { "t": 25.5, "type": "success" },
    { "t": 27.0, "type": "sparkle", "until": 33.0, "every": 0.5 },
    { "t": 33.3, "type": "yawn" },
    { "t": 35.5, "type": "snore" },
    { "t": 37.2, "type": "snore" },
    { "t": 38.3, "type": "chime" }
  ]
};
if (typeof module !== 'undefined') module.exports = TL;
