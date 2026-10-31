"""根据 timeline.js 合成整段音效：说话的“叮叮”声 + 各种动作音效。"""
import json, sys
import numpy as np
from sfx import SR, ding, speak, env, save

src = open(sys.argv[1] if len(sys.argv) > 1 else 'timeline.js', encoding='utf-8').read()
TL = json.loads(src[src.index('{'):src.rindex('};') + 1])
out = np.zeros(int(SR * TL['duration']))
rng = np.random.default_rng(7)

def put(t, x, vol=1.0):
    i = int(t * SR); x = x[:max(0, len(out) - i)]
    out[i:i + len(x)] += x * vol

def sweep(f0, f1, dur, vol=0.3, decay=4.0, wave='sine'):
    n = int(SR * dur); t = np.arange(n) / SR
    f = np.geomspace(f0, f1, n); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) if wave == 'sine' else np.sign(np.sin(ph)) * 0.5
    return vol * s * env(n, 0.005, decay)

def noise(dur, vol=0.2, decay=30.0, lp=0.0):
    n = int(SR * dur); x = rng.uniform(-1, 1, n)
    if lp:  # 简单一阶低通，让声音更“闷”
        y = np.zeros(n)
        for i in range(1, n): y[i] = y[i - 1] + lp * (x[i] - y[i - 1])
        x = y / (np.abs(y).max() + 1e-9)
    return vol * x * env(n, 0.002, decay)

def fx(e):
    t, k, p = e['t'], e['type'], e.get('pitch', 1.0)
    if k == 'whistle': put(t, sweep(1800, 500, 0.8, 0.12, 1.5))
    elif k == 'thud': put(t, sweep(160, 50, 0.35, 0.6, 9)); put(t, noise(0.15, 0.15, 25, 0.05))
    elif k == 'boing':
        n = int(SR * 0.45); tt = np.arange(n) / SR
        f = 300 * p * (1 + 0.35 * np.sin(2 * np.pi * 9 * tt) * np.exp(-tt * 5))
        put(t, 0.3 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.005, 7))
    elif k == 'blink': put(t, ding(2400, 0.12, 0.15))
    elif k == 'pop': put(t, sweep(400 * p, 1200 * p, 0.12, 0.35, 25))
    elif k == 'jump': put(t, sweep(300, 1100, 0.3, 0.25, 6))
    elif k == 'typing':
        tt = t
        while tt < e['until']:
            put(tt, noise(0.03, 0.18, 120, 0.4)); tt += rng.uniform(0.05, 0.11)
    elif k == 'steps':
        tt = t
        while tt < e['until']:
            put(tt, sweep(220, 140, 0.08, 0.25, 30)); tt += 0.225
    elif k == 'alarm':
        for i in range(4): put(t + i * 0.3, sweep(880 if i % 2 == 0 else 660, 880 if i % 2 == 0 else 660, 0.15, 0.12, 2, 'square'))
    elif k == 'found':
        for i, f in enumerate([1318.5, 1760.0]): put(t + i * 0.09, ding(f, 0.3, 0.3))
    elif k == 'whoosh': put(t, noise(0.9, 0.18, 3, 0.08) * np.sin(np.linspace(0, np.pi, int(SR * 0.9))))
    elif k == 'success':
        for i, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]): put(t + i * 0.1, ding(f, 0.5, 0.3))
    elif k == 'sparkle':
        tt, notes = t, [1568.0, 1760.0, 2093.0, 2349.3, 2637.0]
        while tt < e['until']:
            put(tt, ding(rng.choice(notes), 0.25, 0.14)); tt += e['every']
    elif k == 'yawn': put(t, sweep(700, 250, 1.0, 0.18, 1.2))
    elif k == 'snore': put(t, noise(1.0, 0.12, 1.5, 0.03) * np.sin(np.linspace(0, np.pi, SR)))
    elif k == 'chime':
        for i, f in enumerate([1568.0, 1318.5, 1046.5]): put(t + i * 0.18, ding(f, 0.8, 0.28))

for e in TL['sfx']: fx(e)
for i, s in enumerate(TL['subtitles']):
    a, _ = speak(s['text'], TL['charStep'], seed=i + 1)
    put(s['t'], a)

out *= 0.9 / max(1e-9, np.abs(out).max())
save('audio.wav', out)
print('ok', len(out) / SR, 's')
