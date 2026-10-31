"""宣传片配乐：柔和的钢琴分解和弦 + 铺底和声 + 简单混响（全部用代码合成）。"""
import sys
import numpy as np
sys.path.insert(0, '../xiaoke-animation')
from sfx import SR, save

DUR = 40.0
out = np.zeros(int(SR * (DUR + 3)))
rng = np.random.default_rng(3)
midi = lambda n: 440.0 * 2 ** ((n - 69) / 12)

def put(t, x, v=1.0):
    i = int(t * SR); x = x[:len(out) - i]; out[i:i + len(x)] += x * v

def piano(n, dur=2.2, v=0.2):
    f = midi(n); N = int(SR * dur); t = np.arange(N) / SR
    a = np.minimum(1, t / 0.006)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 1.6)
         + 0.45 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3.5)
         + 0.18 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 6)
         + 0.06 * np.sin(2 * np.pi * 4.01 * f * t) * np.exp(-t * 9))
    return v * a * s

def pad(notes, dur, v=0.035):
    N = int(SR * dur); t = np.arange(N) / SR
    env = np.minimum(1, t / 1.2) * np.minimum(1, (dur - t) / 1.2)
    s = sum(np.sin(2 * np.pi * midi(n) * t) + 0.3 * np.sin(2 * np.pi * midi(n) * 1.003 * t + 1) for n in notes)
    return v * env * s

# 和弦（MIDI 音高）：随场景切换
CHORDS = [
    (0, 'Fmaj7', [53, 57, 60, 64]), (4, 'G6', [55, 59, 62, 64]), (8, 'Em7', [52, 55, 59, 62]),
    (12, 'Am7', [57, 60, 64, 67]), (16, 'Fmaj7', [53, 57, 60, 64]), (20, 'G', [55, 59, 62, 67]),
    (24, 'Em7', [52, 55, 59, 62]), (26.5, 'Am7', [57, 60, 64, 67]), (29, 'Fmaj7', [53, 57, 60, 64]),
    (32, 'G', [55, 59, 62, 67]), (35, 'Cmaj9', [48, 55, 59, 62, 64]),
]
BEAT = 0.75  # 80 BPM
for i, (st, _, notes) in enumerate(CHORDS):
    end = CHORDS[i + 1][0] if i + 1 < len(CHORDS) else DUR
    put(st, pad([n - 12 for n in notes[:3]], end - st + 1.2))
    if st >= 35:  # 结尾：一个慢慢散开的大和弦
        for j, n in enumerate(notes + [notes[1] + 12, notes[3] + 12]): put(st + 0.6 + j * 0.12, piano(n + 12, 5.0, 0.13))
        continue
    # 分解和弦：上行 1-3-5-7-5-3…，开头和结尾两段更稀疏
    pattern = [0, 1, 2, 3, 2, 1, 2, 3]
    tt, k = st + (0.9 if st == 0 else 0), 0
    while tt < end - 0.05:
        if not (st < 4 and k % 2) and not (29 <= st < 35 and k % 2):
            n = notes[pattern[k % len(pattern)]] + 12
            put(tt, piano(n, 2.4, 0.11 * rng.uniform(0.8, 1.05)))
        tt += BEAT / 2 if 8 <= st < 29 else BEAT; k += 1
    put(st, piano(notes[0], 3.0, 0.12))  # 每个和弦一个低音

# 开头打字的轻微键盘声
for i in range(6):
    n = int(SR * 0.02); put(0.9 + i * 0.16, rng.uniform(-1, 1, n) * np.exp(-np.arange(n) / SR * 300) * 0.05)
# 小克出现时一声清脆的铃
put(37.8, piano(84, 2.5, 0.08)); put(37.9, piano(88, 2.5, 0.06))

# 混响：几组短延迟 + 一个长回声
dry = out.copy()
for d, g in [(0.031, 0.35), (0.047, 0.3), (0.073, 0.25), (0.113, 0.2), (0.167, 0.15), (0.375, 0.18), (0.75, 0.08)]:
    k = int(d * SR); out[k:] += dry[:-k] * g
out = out[:int(SR * DUR)]
fade = np.ones_like(out); n = int(SR * 1.5); fade[-n:] = np.linspace(1, 0, n); out *= fade
out *= 0.85 / np.abs(out).max()
save('music.wav', out)
print('ok')
