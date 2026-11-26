"""按示波器网格（横 10 格、竖 8 格）画图 8.3、图 8.4，方便照着画到实验报告上。"""
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager

zh = [f.name for f in font_manager.fontManager.ttflist if 'WenQuanYi Zen Hei' in f.name]
plt.rcParams['font.family'] = ([zh[0]] if zh else []) + ['DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

def scope(ax, title):
    ax.set_xlim(0, 10); ax.set_ylim(-4, 4)
    ax.set_xticks(range(11)); ax.set_yticks(range(-4, 5))
    ax.grid(True, color='#999', lw=0.8)
    ax.axhline(0, color='#555', lw=1.2); ax.axvline(5, color='#555', lw=1.2)
    ax.set_xticklabels([]); ax.set_yticklabels([])
    ax.set_facecolor('#FBFBF6'); ax.set_title(title, fontsize=13)

def load(fn, tdiv, t0):
    d = np.loadtxt(fn); t = (d[:, 0] - t0) / tdiv
    m = (t >= 0) & (t <= 10); return t[m], d[m, 1], d[m, 3]

fig, ax = plt.subplots(1, 2, figsize=(14, 6.4))
# 图 8.3：过零比较器，Ui 0.5V/格，Uo 2V/格，0.2ms/格
t, ui, uo = load('cmp.txt', 0.2e-3, 3e-3)
scope(ax[0], '图 8.3  过零比较器输入 Ui 和输出 Uo')
ax[0].plot(t, ui / 0.5, color='#D4A017', lw=2.2, label='Ui（CH1，0.5 V/格）：正弦 1 kHz，峰峰值 2 V')
ax[0].plot(t, uo / 2.0, color='#2E7DC9', lw=2.2, label='Uo（CH2，2 V/格）：方波 ±6.6 V')
ax[0].text(0.1, -3.75, '时基 0.2 ms/格', fontsize=11)
ax[0].legend(loc='upper center', bbox_to_anchor=(0.5, -0.02), fontsize=10.5, frameon=False)

# 图 8.4：方波发生器，Uo 2V/格，2.5ms/格；同时画出电容电压
t, ua, uo = load('sq.txt', 2.5e-3, 150e-3)
scope(ax[1], '图 8.4  方波发生电路输出 Uo 波形')
ax[1].plot(t, uo / 2.0, color='#2E7DC9', lw=2.2, label='Uo（2 V/格）：方波 ±6.75 V，约 74.5 Hz')
ax[1].plot(t, ua / 2.0, color='#C8643F', lw=1.6, ls='--', label='电容电压 Uc（参考，可不画）：±6.1 V')
ax[1].text(0.1, -3.75, '时基 2.5 ms/格', fontsize=11)
ax[1].legend(loc='upper center', bbox_to_anchor=(0.5, -0.02), fontsize=10.5, frameon=False)

plt.tight_layout()
plt.savefig('waves.png', dpi=130)
