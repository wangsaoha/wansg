"""画二极管伏安特性曲线（数据来自 ngspice 仿真）。"""
import numpy as np
import matplotlib
import matplotlib.ticker
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager

zh = [f.name for f in font_manager.fontManager.ttflist if 'WenQuanYi Zen Hei' in f.name]
plt.rcParams['font.family'] = ([zh[0]] if zh else []) + ['DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False
plt.rcParams['mathtext.fontset'] = 'dejavusans'

d = np.loadtxt('iv_default.txt'); V, I = d[:, 1], d[:, 3]
b = np.loadtxt('iv_bv.txt'); Vb, Ib = b[:, 1], b[:, 3]

def at_current(target):  # 正向电流达到 target 时的电压
    m = V > 0; return np.interp(target, I[m], V[m])
v_on = at_current(1e-3); v10 = at_current(10e-3)
i_rev = I[np.argmin(np.abs(V + 5))]

fig, ax = plt.subplots(2, 2, figsize=(13, 10))
fig.suptitle('二极管伏安特性曲线（ngspice 仿真，SPICE 默认二极管模型：IS=1e-14 A，N=1）', fontsize=15)

# ① 整体曲线
a = ax[0, 0]; a.plot(V, I * 1e3, color='#C8643F', lw=2)
a.axhline(0, color='k', lw=0.6); a.axvline(0, color='k', lw=0.6)
a.set(xlabel='二极管电压 U_D (V)', ylabel='二极管电流 I_D (mA)', title='① 整体：正向导通、反向截止', xlim=(-10, 1))
a.grid(alpha=0.3)
a.annotate('反向截止区\n电流几乎为 0', xy=(-6, 0), xytext=(-8.5, 15), arrowprops=dict(arrowstyle='->'))
a.annotate('正向导通区', xy=(0.75, 30), xytext=(-3.5, 32), arrowprops=dict(arrowstyle='->'))

# ② 正向放大
a = ax[0, 1]; m = (V > 0) & (V < 0.85)
a.plot(V[m], I[m] * 1e3, color='#C8643F', lw=2)
a.axvline(v_on, ls='--', color='gray'); a.text(v_on - 0.02, 25, f'导通电压≈{v_on:.2f} V\n（I_D=1 mA）', ha='right')
a.axvspan(0, 0.5, color='#8FB8DE', alpha=0.2); a.text(0.25, 35, '死区\n(电流极小)', ha='center')
a.set(xlabel='U_D (V)', ylabel='I_D (mA)', title='② 正向特性（放大）', xlim=(0, 0.85))
a.grid(alpha=0.3)

# ③ 半对数：看指数关系
a = ax[1, 0]; m = V > 0.05
a.semilogy(V[m], I[m], color='#C8643F', lw=2)
a.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda y, _: f'1e{round(np.log10(y))}'))
a.set(xlabel='U_D (V)', ylabel='I_D (A，对数坐标)', title='③ 正向特性（半对数）：I_D 随 U_D 指数增长')
a.grid(alpha=0.3, which='both')
a.text(0.1, 1e-4, '斜率 ≈ 每 60 mV 电流增大 10 倍\n（理想二极管方程 I = IS·(e^(U/U_T) − 1)）')

# ④ 对照：带击穿
a = ax[1, 1]; a.plot(Vb, Ib * 1e3, color='#5A6FA8', lw=2)
a.axhline(0, color='k', lw=0.6); a.axvline(0, color='k', lw=0.6)
a.set(xlabel='U_D (V)', ylabel='I_D (mA)', title='④ 对照：设置反向击穿电压 BV=50 V 时', xlim=(-55, 2), ylim=(-60, 45))
a.annotate('反向击穿区\n(U_D≈-50 V)', xy=(-50, -30), xytext=(-40, -45), arrowprops=dict(arrowstyle='->'))
a.grid(alpha=0.3)

plt.tight_layout(rect=[0, 0, 1, 0.96])
plt.savefig('diode_iv.png', dpi=130)

# 数据表（实验报告用）
pts = [-10, -5, -1, 0, 0.3, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.72, 0.74, 0.76]
with open('iv_table.csv', 'w', encoding='utf-8-sig') as f:
    f.write('U_D (V),I_D (mA)\n')
    for p in pts:
        f.write(f'{p},{np.interp(p, V, I) * 1e3:.6g}\n')
print(f'导通电压(1mA) = {v_on:.3f} V, 10mA 时 = {v10:.3f} V, -5V 时反向电流 = {i_rev:.3e} A')
