"""1N4007（整流二极管）伏安特性，并和 1N4148、默认模型对比。"""
import numpy as np
import matplotlib
import matplotlib.ticker
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager

zh = [f.name for f in font_manager.fontManager.ttflist if 'WenQuanYi Zen Hei' in f.name]
plt.rcParams['font.family'] = ([zh[0]] if zh else []) + ['DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

f = np.loadtxt('iv_1n4007_fwd.txt'); V, I = f[:, 1], f[:, 3]
r = np.loadtxt('iv_1n4007_rev.txt'); Vr, Ir = r[:, 1], r[:, 3]
s = np.loadtxt('iv_1n4148.txt'); Vs, Is_ = s[:, 1], s[:, 3]
d = np.loadtxt('iv_default.txt'); Vd, Id = d[:, 1], d[:, 3]
A, S, D = '#3E6FB0', '#C8643F', '#8A8A8A'

def v_at(Vx, Ix, target): m = Vx > 0; return np.interp(target, Ix[m], Vx[m])
def i_at(Vx, Ix, v): return np.interp(v, Vx, Ix)

fig, ax = plt.subplots(2, 2, figsize=(13, 10))
fig.suptitle('1N4007（整流二极管）伏安特性曲线（ngspice 仿真）', fontsize=15)

# ① 正向大电流
a = ax[0, 0]; a.plot(V, I, color=A, lw=2)
a.axhline(1, color='gray', ls=':'); a.text(0.05, 1.02, '额定平均电流 1 A', color='gray')
v1a = v_at(V, I, 1.0); a.axvline(v1a, color=A, ls='--'); a.text(v1a - 0.2, 0.75, f'1 A 时\n{v1a:.2f} V', ha='right', color=A)
a.set(xlabel='二极管电压 U_D (V)', ylabel='二极管电流 I_D (A)', title='① 正向特性：能通过 1 A 的大电流', xlim=(0, 1.0), ylim=(0, 1.15))
a.grid(alpha=0.3)

# ② 小电流下三种二极管对比
a = ax[0, 1]
for Vx, Ix, c, ls, lab in [(V, I, A, '-', '1N4007（整流）'), (Vs, Is_, S, '-', '1N4148（开关）'), (Vd, Id, D, '--', '默认（理想）模型')]:
    m = (Vx > 0) & (Vx < 0.9); a.plot(Vx[m], Ix[m] * 1e3, color=c, ls=ls, lw=2 if ls == '-' else 1.6, label=lab)
a.set(xlabel='U_D (V)', ylabel='I_D (mA)', title='② 小电流区：三种二极管对比', xlim=(0, 0.9), ylim=(0, 45))
a.legend(loc='upper left'); a.grid(alpha=0.3)

# ③ 反向：1000 V 才击穿
a = ax[1, 0]; a.plot(Vr, Ir * 1e3, color=A, lw=2)
a.axhline(0, color='k', lw=0.6)
a.annotate('反向击穿\n(约 -1000 V)', xy=(-1000.5, -5), xytext=(-850, -8), arrowprops=dict(arrowstyle='->'))
a.annotate('反向截止：0 ~ -1000 V\n漏电流极小', xy=(-500, 0), xytext=(-700, 3), arrowprops=dict(arrowstyle='->'))
a.set(xlabel='U_D (V)', ylabel='I_D (mA)', title='③ 反向特性：耐压 1000 V（1N4148 只有 100 V）', xlim=(-1080, 20), ylim=(-11, 6))
a.grid(alpha=0.3)

# ④ 数据
a = ax[1, 1]; a.axis('off')
rows = [
    ['项目', '1N4007 仿真', '数据手册', '1N4148 仿真'],
    ['正向压降 @ 1 mA', f'{v_at(V, I, 1e-3):.3f} V', '—', f'{v_at(Vs, Is_, 1e-3):.3f} V'],
    ['正向压降 @ 10 mA', f'{v_at(V, I, 10e-3):.3f} V', '—', f'{v_at(Vs, Is_, 10e-3):.3f} V'],
    ['正向压降 @ 100 mA', f'{v_at(V, I, 0.1):.3f} V', '—', '—'],
    ['正向压降 @ 1 A', f'{v1a:.3f} V', '≤ 1.1 V', '超出额定'],
    ['反向电流 @ -500 V', f'{-i_at(Vr, Ir, -500) * 1e9:.2f} nA', '—', '已击穿'],
    ['反向电流 @ -1000 V', f'{-i_at(Vr, Ir, -1000) * 1e6:.2f} µA', '≤ 5 µA', '已击穿'],
    ['反向耐压', '约 1000 V', '1000 V', '约 100 V'],
]
t = a.table(cellText=rows[1:], colLabels=rows[0], loc='center', cellLoc='center', colWidths=[0.3, 0.24, 0.2, 0.24])
t.auto_set_font_size(False); t.set_fontsize(11.5); t.scale(1, 2.1)
for (r_, c), cell in t.get_celld().items():
    if r_ == 0: cell.set_facecolor('#DCE6F2'); cell.set_text_props(weight='bold')
a.set_title('④ 关键数据（和数据手册、1N4148 对照）')
a.text(0.5, 0.0, '模型参数：IS=76.9pA  N=1.45  RS=42mΩ  BV=1000V  IBV=5µA\nIBV=5µA 定义了击穿点：电压超过 1000V 后电流急剧增大',
       ha='center', transform=a.transAxes, color='#555')

plt.tight_layout(rect=[0, 0, 1, 0.96])
plt.savefig('diode_1n4007.png', dpi=130)

with open('iv_1n4007_table.csv', 'w', encoding='utf-8-sig') as fo:
    fo.write('U_D (V),I_D (mA)\n')
    for p in [-1000, -900, -500, -100, -10]: fo.write(f'{p},{i_at(Vr, Ir, p) * 1e3:.6g}\n')
    for p in [0, 0.3, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9]: fo.write(f'{p},{i_at(V, I, p) * 1e3:.6g}\n')
for r_ in rows[1:]: print(r_)
