"""1N4148 伏安特性，并和 SPICE 默认（理想）二极管对比。"""
import numpy as np
import matplotlib
import matplotlib.ticker
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager

zh = [f.name for f in font_manager.fontManager.ttflist if 'WenQuanYi Zen Hei' in f.name]
plt.rcParams['font.family'] = ([zh[0]] if zh else []) + ['DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

r = np.loadtxt('iv_1n4148.txt'); V, I = r[:, 1], r[:, 3]
d = np.loadtxt('iv_default.txt'); Vd, Id = d[:, 1], d[:, 3]
A, B = '#C8643F', '#8A8A8A'

def v_at(Vx, Ix, target):
    m = Vx > 0; return np.interp(target, Ix[m], Vx[m])
def i_at(Vx, Ix, v): return np.interp(v, Vx, Ix)

fig, ax = plt.subplots(2, 2, figsize=(13, 10))
fig.suptitle('1N4148 伏安特性曲线（ngspice 仿真）', fontsize=15)

a = ax[0, 0]; a.plot(V, I * 1e3, color=A, lw=2)
a.axhline(0, color='k', lw=0.6); a.axvline(0, color='k', lw=0.6)
a.set(xlabel='二极管电压 U_D (V)', ylabel='二极管电流 I_D (mA)', title='① 整体：正向导通、反向截止、反向击穿', xlim=(-110, 5), ylim=(-60, 50))
a.annotate('反向击穿\n(约 -100 V)', xy=(-100.5, -30), xytext=(-85, -45), arrowprops=dict(arrowstyle='->'))
a.annotate('反向截止区：漏电流只有 nA 级', xy=(-50, 0), xytext=(-75, 20), arrowprops=dict(arrowstyle='->'))
a.annotate('正向导通', xy=(0.8, 30), xytext=(-30, 38), arrowprops=dict(arrowstyle='->'))
a.grid(alpha=0.3)

a = ax[0, 1]; m = (V > 0) & (V < 1.0); md = (Vd > 0) & (Vd < 1.0)
a.plot(V[m], I[m] * 1e3, color=A, lw=2, label='1N4148')
a.plot(Vd[md], Id[md] * 1e3, color=B, lw=1.6, ls='--', label='默认（理想）模型')
von, vond = v_at(V, I, 1e-3), v_at(Vd, Id, 1e-3)
a.axvline(von, color=A, ls=':'); a.text(von - 0.02, 30, f'1N4148\n1 mA 时 {von:.2f} V', ha='right', color=A)
a.set(xlabel='U_D (V)', ylabel='I_D (mA)', title='② 正向特性：和理想模型对比', xlim=(0, 1.0))
a.legend(loc='upper left'); a.grid(alpha=0.3)

a = ax[1, 0]; m = V > 0.02; md = Vd > 0.02
a.semilogy(V[m], I[m], color=A, lw=2, label='1N4148（N=1.752）')
a.semilogy(Vd[md], Id[md], color=B, lw=1.6, ls='--', label='默认模型（N=1）')
a.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda y, _: f'1e{round(np.log10(y))}'))
a.set(xlabel='U_D (V)', ylabel='I_D (A，对数坐标)', title='③ 半对数：1N4148 斜率更缓，大电流时被串联电阻 RS 压弯')
a.legend(loc='lower right'); a.grid(alpha=0.3, which='both')

# ④ 关键数据和数据手册对照
a = ax[1, 1]; a.axis('off')
rows = [
    ['项目', '1N4148 仿真', '数据手册'],
    ['正向压降 @ 1 mA', f'{v_at(V, I, 1e-3):.3f} V', '—'],
    ['正向压降 @ 10 mA', f'{v_at(V, I, 10e-3):.3f} V', '≤ 1.0 V（最大值）'],
    ['正向压降 @ 40 mA', f'{v_at(V, I, 40e-3):.3f} V', '—'],
    ['反向电流 @ -20 V', f'{-i_at(V, I, -20) * 1e9:.2f} nA', '≤ 25 nA（最大值）'],
    ['反向电流 @ -75 V', f'{-i_at(V, I, -75) * 1e9:.2f} nA', '≤ 5 µA（最大值）'],
    ['反向击穿电压', '约 100 V', '≥ 100 V @ 100 µA'],
]
t = a.table(cellText=rows[1:], colLabels=rows[0], loc='center', cellLoc='center', colWidths=[0.36, 0.3, 0.34])
t.auto_set_font_size(False); t.set_fontsize(12); t.scale(1, 2.2)
for (r_, c), cell in t.get_celld().items():
    if r_ == 0: cell.set_facecolor('#F2E3D8'); cell.set_text_props(weight='bold')
a.set_title('④ 关键数据（和数据手册规格对照）')
a.text(0.5, 0.02, '模型参数：IS=2.52nA  N=1.752  RS=0.568Ω  BV=100V\n数据手册给的是最大值，仿真值在规格范围内', ha='center', transform=a.transAxes, color='#555')

plt.tight_layout(rect=[0, 0, 1, 0.96])
plt.savefig('diode_1n4148.png', dpi=130)

pts = [-100, -75, -20, -5, 0, 0.3, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85]
with open('iv_1n4148_table.csv', 'w', encoding='utf-8-sig') as f:
    f.write('U_D (V),I_D (mA)\n')
    for p in pts: f.write(f'{p},{i_at(V, I, p) * 1e3:.6g}\n')
for r_ in rows[1:]: print(r_)
