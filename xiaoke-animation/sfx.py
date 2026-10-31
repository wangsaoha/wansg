"""用代码合成音效（不依赖外部素材）。"""
import numpy as np, wave

SR = 44100
NOTES = [1046.5, 1174.7, 1318.5, 1568.0, 1760.0]  # C6 D6 E6 G6 A6 五声音阶

def env(n, attack=0.003, decay=25.0):
    t = np.arange(n) / SR
    a = np.minimum(1, t / attack)
    return a * np.exp(-t * decay)

def ding(freq, dur=0.16, vol=0.35):
    n = int(SR * dur); t = np.arange(n) / SR
    tone = np.sin(2*np.pi*freq*t) + 0.35*np.sin(2*np.pi*freq*2*t) + 0.12*np.sin(2*np.pi*freq*3.01*t)
    return vol * tone * env(n)

def speak(text, step=0.085, seed=0):
    """每个字一声“叮”，标点处停顿。返回 (音频, 每个字出现的时间)。"""
    rng = np.random.default_rng(seed)
    times, t = [], 0.0
    for ch in text:
        times.append(t)
        t += step * (3 if ch in '，。！？～…,.!?~' else 1)
    out = np.zeros(int(SR * (t + 0.3)))
    for ch, st in zip(text, times):
        if ch in '，。！？～…,.!?~ ':
            continue
        s = ding(rng.choice(NOTES) * rng.uniform(0.98, 1.02))
        i = int(st * SR); out[i:i+len(s)] += s
    return out, times

def save(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())

if __name__ == '__main__':
    a, _ = speak('你好呀！我是小克～', seed=1)
    b, _ = speak('写代码？交给我！', seed=2)
    gap = np.zeros(int(SR * 0.5))
    save('ding_sample.wav', np.concatenate([gap, a, gap, b, gap]))
