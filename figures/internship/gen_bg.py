# 生成背景图与方案图(bg-flow.html)。与 skill-flow 同一套线路语言:线是流程,站点是可检查的环节。
# 图 A:原有 Skill —— 多个流程缠在一起,从输入一路到整份报告,中间没有站点。
# 图 B:拆解与分层 —— 原子 Skill 各走一条线,有检查点;以 JSON 为界分成 Skill 层与输出层,各自评测与自迭代。
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bg-flow.html')

ICON = {
    'file': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    'refresh': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'checks': '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    'braces': '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
}


def icon(name, cx, cy, size, cls='ic'):
    k = size / 24
    return f'<g class="{cls}" transform="translate({cx - size / 2:.2f} {cy - size / 2:.2f}) scale({k:.4f})">{ICON[name]}</g>'


def tw(text, fs):
    return sum(fs if ord(c) > 0x2e80 else fs * 0.58 for c in text)


def knock(cx, cy, text, fs, cls, pad=8):
    w = tw(text, fs) + pad * 2
    return (f'<rect class="ko" x="{cx - w / 2:.1f}" y="{cy - 9}" width="{w:.1f}" height="18"/>'
            f'<text class="{cls}" x="{cx}" y="{cy + fs * 0.36:.1f}">{text}</text>')


def sbend(x0, y0, x1, y1):
    """水平切线的 S 形过渡。"""
    d = (x1 - x0) * 0.5
    return f'C{x0 + d:.1f} {y0:.1f} {x1 - d:.1f} {y1:.1f} {x1:.1f} {y1:.1f}'


def term(cx, cy):
    """线路端点:小空心环。"""
    return f'<circle class="term" cx="{cx}" cy="{cy}" r="6"/>'


def span(x0, x1, y):
    """范围线:两端短竖,细横线。"""
    return f'<path class="dim" d="M{x0} {y - 4} V{y + 4} M{x0} {y} H{x1} M{x1} {y - 4} V{y + 4}"/>'


def fork(x0, yc, cx, items):
    """从报告分出两支,各指向一个结论。items: [(标题, [说明行])],上一支、下一支。"""
    (t1, l1), (t2, l2) = items
    b1, b2 = yc - 28, yc + 48          # 两个标题基线
    c1, c2 = b1 - 5.5, b2 - 5.5        # 标题视觉中线
    xs, xe = x0 + 6, cx - 14
    o = [f'<path class="cause" d="M{x0} {yc} H{xs} {sbend(xs, yc, xs + 30, c1)} H{xe}" marker-end="url(#aa)"/>',
         f'<path class="cause" d="M{xs} {yc} {sbend(xs, yc, xs + 30, c2)} H{xe}" marker-end="url(#aa)"/>',
         f'<text class="c-t" x="{cx}" y="{b1}">{t1}</text>',
         f'<text class="c-t" x="{cx}" y="{b2}">{t2}</text>']
    for k, t in enumerate(l1):
        o.append(f'<text class="c-s" x="{cx}" y="{b1 + 22 + k * 18}">{t}</text>')
    for k, t in enumerate(l2):
        o.append(f'<text class="c-s" x="{cx}" y="{b2 + 22 + k * 18}">{t}</text>')
    return ''.join(o)


def mfork(xc, y0, items):
    """窄屏:报告下方分成左右两支。"""
    (t1, l1), (t2, l2) = items
    X1, X2 = xc - 9, 244               # 两个结论的左缘;左支直落在第一个字上
    ys, ye = y0 + 8, y0 + 50
    o = [f'<path class="cause" d="M{xc} {y0} V{ye}" marker-end="url(#aa)"/>',
         f'<path class="cause" d="M{xc} {ys} {vbend(xc, ys, X2 + 9, ys + 34)} V{ye}" marker-end="url(#aa)"/>']
    for X, t, ls in [(X1, t1, l1), (X2, t2, l2)]:
        o.append(f'<text class="c-t" x="{X}" y="{ye + 26}">{t}</text>')
        for k, line in enumerate(ls):
            o.append(f'<text class="c-s" x="{X}" y="{ye + 50 + k * 18}">{line}</text>')
    return ''.join(o)


def report(x, y, messy):
    """报告缩略:白纸,无描边。messy=True:左缘不齐、字号不一、色块压字、一行溢出纸外。"""
    W, H = 56, 72
    o = [f'<rect class="paper-sh" x="{x + 3}" y="{y + 3}" width="{W}" height="{H}"/>',
         f'<rect class="paper" x="{x}" y="{y}" width="{W}" height="{H}"/>']
    if messy:
        bars = [  # (dx, dy, w, h, cls)
            (13, 8, 27, 5.5, 'pi'),
            (6, 18, 36, 2.4, 'pd'), (10, 23, 44, 2.4, 'pd'),
            (27, 27, 22, 15, 'pa'),
            (5, 31, 18, 3.6, 'pi2'), (9, 37.5, 26, 2.4, 'pd'),
            (16, 46, 31, 2.4, 'pd'), (4, 51, 66, 2.4, 'pd'),
            (11, 58, 13, 6, 'pi2'), (28, 60, 20, 2.4, 'pd'),
        ]
    else:
        bars = [
            (8, 9, 26, 4, 'pi'), (8, 17, 40, 2.4, 'pd'), (8, 22, 30, 2.4, 'pd'),
            (8, 30, 40, 19, 'pb'), (8, 55, 40, 2.4, 'pd'), (8, 60, 24, 2.4, 'pd'),
        ]
    for dx, dy, w, h, c in bars:
        o.append(f'<rect class="{c}" x="{x + dx}" y="{y + dy}" width="{w}" height="{h}"/>')
    if not messy:  # 图表块里的柱,底边对齐
        for i, hh in enumerate([6, 10, 8, 13]):
            o.append(f'<rect class="pc" x="{x + 14 + i * 8}" y="{y + 46 - hh}" width="5" height="{hh}"/>')
    return ''.join(o), W, H


# ════════════════════════════════════════════════════════════
# 图 A:原有 Skill
# ════════════════════════════════════════════════════════════
a = []
A = a.append
YC = 150
XI = 90                      # 输入
BX0, BX1 = 170, 590          # 缠绕段(一个 Skill 的范围)
RX = 640                     # 报告左缘
LANES = [-28, -14, 0, 14, 28]

# 缠绕:相邻互换与跨道跳线交替,两端疏、中段密
swaps = [
    [(0, 1), (3, 4)], [(1, 2)], [(0, 2), (3, 4)], [(1, 3)], [(2, 4), (0, 1)],
    [(0, 3)], [(1, 4), (2, 3)], [(0, 2)], [(1, 3), (0, 4)], [(2, 3)], [(0, 1), (3, 4)],
]
cols = len(swaps)
cw = (BX1 - BX0 - 70) / cols
perm = list(range(5))
history = [perm[:]]
for sw in swaps:
    lane_of = perm[:]
    for p, q in sw:
        i, j = lane_of.index(p), lane_of.index(q)
        lane_of[i], lane_of[j] = lane_of[j], lane_of[i]
    perm = lane_of
    history.append(perm[:])

ends = []
for i in range(5):
    y0 = YC + LANES[history[0][i]]
    x = BX0 + 35
    d = f'M{x} {y0}'
    for c in range(cols):
        ya = YC + LANES[history[c][i]]
        yb = YC + LANES[history[c + 1][i]]
        d += f' {sbend(x, ya, x + cw, yb)}' if ya != yb else f' H{x + cw:.1f}'
        x += cw
    yl = YC + LANES[history[-1][i]]
    A(f'<path class="case" d="{d}"/><path class="proc" d="{d}"/>')   # 先铺底色再画线,交叉处留缝
    ends.append(f'M{BX0} {YC} {sbend(BX0, YC, BX0 + 35, y0)} M{x:.1f} {yl} {sbend(x, yl, BX1, YC)}')
A(f'<path class="proc" d="M{XI + 7} {YC} H{BX0} M{BX1} {YC} H{RX - 12} {" ".join(ends)}"/>')
A(f'<path class="proc" d="M{RX - 16} {YC} H{RX - 6}" marker-end="url(#ak)"/>')
A(term(XI, YC))
A(f'<text class="t-n" x="{XI}" y="{YC + 30}" text-anchor="middle">输入</text>')

# 上:一个 Skill 的范围
A(span(BX0, BX1, YC - 58))
A(f'<text class="h-t" x="{BX0}" y="{YC - 94}">原有 Skill</text>')
A(f'<text class="h-s" x="{BX0}" y="{YC - 75}">体量庞大 · 职责混杂 · 多个流程紧密耦合</text>')
# 下:评测
A(f'<text class="n-t" x="{BX0}" y="{YC + 75}">从输入一路执行到报告,中间没有可以单独检查的环节</text>')

# 报告
rp, RW, RH = report(RX, YC - 36, True)
A(rp)
A(f'<text class="t-n" x="{RX + RW / 2}" y="{YC + 60}" text-anchor="middle">整份报告</text>')

# 结论
CX = 784
PROB = [('难以维护', ['更新后难以判断效果好坏', '出现问题无法定位到具体环节']), ('格式混乱', ['体验差'])]
A(fork(RX + RW + 22, YC, CX, PROB))

A_VB = '50 30 920 240'

# ════════════════════════════════════════════════════════════
# 图 B:拆解与分层(报告与结论两列与图 A 对齐)
# ════════════════════════════════════════════════════════════
b = []
B = b.append
YC2 = 176
XI2 = XI
ST = 192                     # 原子 Skill 站点列
CKS = (282, 352)             # 过程检查点
RES = 422                    # 结果 JSON
BAR = 470                    # 两层边界
OST = 530                    # 输出层站点
OX = RX                      # 报告左缘,与图 A 同列
LN = [-57, -19, 19, 57]
TOP, BOT = YC2 - 122, YC2 + 98   # 页眉范围线、页脚基线


def it_station(cx, cy):
    return (f'<circle class="halo" cx="{cx}" cy="{cy}" r="12.5"/><circle class="it" cx="{cx}" cy="{cy}" r="8.5"/>'
            + icon('refresh', cx, cy, 9.5, 'ic wh'))


for k, dy in enumerate(LN):
    y = YC2 + dy
    B(f'<path class="proc" d="M{XI2 + 7} {YC2} H{XI2 + 26} {sbend(XI2 + 26, YC2, ST - 30, y)} H{BAR - 3}"/>')
    B(it_station(ST, y))
    for cx in CKS:
        B(f'<circle class="ck" cx="{cx}" cy="{y}" r="4.5"/>')
    B(f'<rect class="js" x="{RES - 4.5}" y="{y - 4.5}" width="9" height="9"/>')
B(term(XI2, YC2))
B(f'<text class="t-n" x="{XI2}" y="{YC2 + 30}" text-anchor="middle">输入</text>')

# 最上一条线的站名
yt = YC2 + LN[0] - 22
B(f'<text class="k ac" x="{ST}" y="{yt - 17}" text-anchor="middle">自迭代</text>')
B(f'<text class="s-n" x="{ST}" y="{yt}" text-anchor="middle">原子 Skill</text>')
B(f'<text class="s-n" x="{(CKS[0] + CKS[1]) / 2}" y="{yt}" text-anchor="middle">过程检查点</text>')
B(f'<text class="s-n" x="{RES}" y="{yt}" text-anchor="middle">结果</text>')

# 两层边界:贯穿全图的细线,接线段加粗
B(f'<path class="divider" d="M{BAR} {TOP - 46} V{BOT + 8}"/>')
B(f'<rect class="bar" x="{BAR - 2.5}" y="{YC2 + LN[0] - 14}" width="5" height="{LN[-1] - LN[0] + 28}"/>')
B(knock(BAR, yt - 4, 'JSON', 12, 'j-t', pad=7))

# 输出层
B(f'<path class="proc" d="M{BAR + 3} {YC2} H{OX - 12}" marker-end="url(#ak)"/>')
B(it_station(OST, YC2))
B(f'<text class="k ac" x="{OST}" y="{YC2 - 24}" text-anchor="middle">自迭代</text>')
rp, RW, RH = report(OX, YC2 - 36, False)
B(rp)
B(f'<text class="t-n" x="{OX + RW / 2}" y="{YC2 + 60}" text-anchor="middle">报告</text>')

# 页眉:两层各自的职责
for x0, x1, t, s_ in [(BX0, BAR - 16, 'Skill 层', '分析判断'), (BAR + 16, BX1, '输出层', '呈现')]:
    B(span(x0, x1, TOP))
    B(f'<text class="h-t" x="{x0}" y="{TOP - 36}">{t}</text>')
    B(f'<text class="h-s" x="{x0}" y="{TOP - 17}">{s_}</text>')
# 页脚:两层各自的评测
for x0, t in [(BX0, '按检查点逐项判定'), (BAR + 16, 'JSON 冻结,只评呈现')]:
    B(f'<text class="k" x="{x0}" y="{BOT}">评测</text>')
    B(f'<text class="n-t" x="{x0 + 34}" y="{BOT + 1}">{t}</text>')

# 结论
SOLV = [('便于维护', ['更新后可以判断效果好坏', '出现问题可以定位到具体环节']), ('格式统一', ['呈现交给输出层'])]
B(fork(OX + RW + 22, YC2, CX, SOLV))

B_VB = '50 0 920 304'

# ════════════════════════════════════════════════════════════
# 窄屏:同一套画法纵向排列,说明文字放在右侧
# ════════════════════════════════════════════════════════════
def vbend(x0, y0, x1, y1):
    d = (y1 - y0) * 0.5
    return f'C{x0:.1f} {y0 + d:.1f} {x1:.1f} {y1 - d:.1f} {x1:.1f} {y1:.1f}'


def vspan(x, y0, y1):
    return f'<path class="dim" d="M{x - 4} {y0} H{x + 4} M{x} {y0} V{y1} M{x - 4} {y1} H{x + 4}"/>'


MX = 78                                   # 主轴
# ── 图 A 窄屏 ──
ma = []
MA = ma.append
MY0, MY1 = 80, 388                        # 缠绕段
MRY = 420                                 # 报告上缘
mcw = (MY1 - MY0 - 70) / cols
mends = []
for i in range(5):
    x0 = MX + LANES[history[0][i]]
    y = MY0 + 35
    d = f'M{x0} {y}'
    for c in range(cols):
        xa = MX + LANES[history[c][i]]
        xb = MX + LANES[history[c + 1][i]]
        d += f' {vbend(xa, y, xb, y + mcw)}' if xa != xb else f' V{y + mcw:.1f}'
        y += mcw
    xl = MX + LANES[history[-1][i]]
    MA(f'<path class="case" d="{d}"/><path class="proc" d="{d}"/>')
    mends.append(f'M{MX} {MY0} {vbend(MX, MY0, x0, MY0 + 35)} M{xl} {y:.1f} {vbend(xl, y, MX, MY1)}')
MA(f'<path class="proc" d="M{MX} 47 V{MY0} M{MX} {MY1} V{MRY - 12} {" ".join(mends)}"/>')
MA(f'<path class="proc" d="M{MX} {MRY - 16} V{MRY - 6}" marker-end="url(#ak)"/>')
MA(term(MX, 40))
MA(f'<text class="t-n" x="{MX + 18}" y="{44.5}">输入</text>')
MCOL = 148
MA(vspan(MCOL - 12, MY0, MY1))
MA(f'<text class="h-t" x="{MCOL}" y="{MY0 + 16}">原有 Skill</text>')
MA(f'<text class="h-s" x="{MCOL}" y="{MY0 + 38}">体量庞大 · 职责混杂</text>')
MA(f'<text class="h-s" x="{MCOL}" y="{MY0 + 56}">多个流程紧密耦合</text>')
MA(f'<text class="n-t" x="{MCOL}" y="{MY1 - 24}">从输入一路执行到报告,</text>')
MA(f'<text class="n-t" x="{MCOL}" y="{MY1 - 5}">中间没有可以单独检查的环节</text>')
rp, RW, RH = report(MX - 28, MRY, True)
MA(rp)
MA(f'<text class="t-n" x="{MX + 46}" y="{MRY + 30}">整份报告</text>')
MCY = MRY + RH + 16
MA(mfork(MX, MCY, PROB))
MA_VB = f'0 18 360 {MCY + 124 - 18}'

# ── 图 B 窄屏 ──
mb = []
MB = mb.append
MLX = [30, 62, 94, 126]                   # 四条原子 Skill 线
MST, MCK, MRES, MBAR = 116, (176, 228), 276, 312
MOST, MRY2 = 364, 452
SCOL = 150                                # 站名列
LCOL = 234                                # 层名列
for x in MLX:
    MB(f'<path class="proc" d="M{MX} 47 V56 {vbend(MX, 56, x, MST - 26)} V{MBAR - 3}"/>')
    MB(it_station(x, MST))
    for cy in MCK:
        MB(f'<circle class="ck" cx="{x}" cy="{cy}" r="4.5"/>')
    MB(f'<rect class="js" x="{x - 4.5}" y="{MRES - 4.5}" width="9" height="9"/>')
MB(term(MX, 40))
MB(f'<text class="t-n" x="{MX + 18}" y="{44.5}">输入</text>')
MB(f'<text class="k ac" x="{SCOL}" y="{MST - 6}">自迭代</text>')
MB(f'<text class="s-n" x="{SCOL}" y="{MST + 11}">原子 Skill</text>')
MB(f'<text class="s-n" x="{SCOL}" y="{(MCK[0] + MCK[1]) / 2 + 4}">过程检查点</text>')
MB(f'<text class="s-n" x="{SCOL}" y="{MRES + 4}">结果</text>')
# 边界
MB(f'<path class="divider" d="M8 {MBAR} H352"/>')
MB(f'<rect class="bar" x="{MLX[0] - 14}" y="{MBAR - 2.5}" width="{MLX[-1] - MLX[0] + 28}" height="5"/>')
MB(knock(SCOL + 18, MBAR, 'JSON', 12, 'j-t', pad=7))
# 输出层
MB(f'<path class="proc" d="M{MX} {MBAR + 3} V{MRY2 - 12}" marker-end="url(#ak)"/>')
MB(it_station(MX, MOST))
MB(f'<text class="k ac" x="{MX + 22}" y="{MOST + 4}">自迭代</text>')
rp, RW, RH = report(MX - 28, MRY2, False)
MB(rp)
MB(f'<text class="t-n" x="{MX + 46}" y="{MRY2 + 30}">报告</text>')
# 层名与评测
for y0, y1, t, s_, ev in [(MST - 26, MBAR - 16, 'Skill 层', '分析判断', '按检查点逐项判定'),
                          (MBAR + 16, MRY2 - 16, '输出层', '呈现', 'JSON 冻结,只评呈现')]:
    MB(vspan(LCOL - 12, y0, y1))
    MB(f'<text class="h-t" x="{LCOL}" y="{y0 + 16}">{t}</text>')
    MB(f'<text class="h-s" x="{LCOL}" y="{y0 + 36}">{s_}</text>')
    MB(f'<text class="k" x="{LCOL}" y="{y1 - 24}">评测</text>')
    MB(f'<text class="n-t" x="{LCOL}" y="{y1 - 5}">{ev}</text>')
MCY2 = MRY2 + RH + 16
MB(mfork(MX, MCY2, SOLV))
MB_VB = f'0 18 360 {MCY2 + 124 - 18}'

ARIA_A = ('原有 Skill:体量庞大、职责混杂,多个流程紧密耦合在同一个 Skill 中,从输入一路执行到整份报告,'
          '中间没有可以单独检查的环节。由此带来两个问题:一是难以维护,更新后难以判断效果好坏,出现问题无法定位到具体环节;二是格式混乱,体验差。')
ARIA_B = ('拆解与分层:原有流程拆成多个原子 Skill,每条线上有过程检查点和结果;分析判断归 Skill 层,呈现归输出层,两层以 JSON 为界。'
          'Skill 层按检查点逐项判定,输出层在 JSON 冻结的前提下只评呈现,两层各自评测与自迭代。'
          '由此一是便于维护,更新后可以判断效果好坏,出现问题可以定位到具体环节;二是格式统一,呈现交给输出层。')


def scoped(svg_body, defs_, prefix):
    return defs_.replace('id="', f'id="{prefix}').replace('url(#', f'url(#{prefix}') + svg_body.replace('url(#', f'url(#{prefix}')


defs = '''<defs>
  <pattern id="hatchA" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="7" class="hatch-ln"/></pattern>
  <marker id="ak" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk"/></marker>
  <marker id="ag" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk g"/></marker>
  <marker id="aa" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk ac"/></marker>
</defs>'''

CSS = '''
  :root {
    --bg: #f6f7f9; --ink: #171b26; --text-dim: #666d7e; --text-dimmer: #8a92a6;
    --track: #b9bfcb; --proc: #a2a8b5; --accent: #c2410c;
    --font-body: 'PingFang SC', 'Noto Sans SC', 'WenQuanYi Zen Hei', 'Microsoft YaHei', sans-serif;
    --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--ink); font-family: var(--font-body); padding: 56px 16px; -webkit-font-smoothing: antialiased; }
  figure { max-width: 1000px; margin: 0 auto 96px; }
  svg { display: block; width: 100%; height: auto; font-family: var(--font-body); overflow: visible; }
  .ko { fill: var(--bg); }
  .case { fill: none; stroke: var(--bg); stroke-width: 5; }
  .proc { fill: none; stroke: var(--proc); stroke-width: 1.5; }
  .lane { fill: none; stroke: var(--track); stroke-width: 1.6; }
  .mk { fill: var(--proc); } .mk.g { fill: var(--track); } .mk.ac { fill: var(--accent); }
  .term { fill: var(--bg); stroke: var(--ink); stroke-width: 1.6; }
  .dim { fill: none; stroke: var(--text-dimmer); stroke-width: 1; }
  .cause { fill: none; stroke: var(--accent); stroke-width: 1.4; }
  .k.ac { fill: var(--accent); }
  .k { font: 600 10px var(--font-mono); letter-spacing: .16em; fill: var(--text-dimmer); }
  .s-n { font-size: 12px; fill: var(--text-dim); }
  .divider { fill: none; stroke: #dfe2e8; stroke-width: 1; }
  .t-n { font-size: 13px; font-weight: 500; fill: var(--ink); }
  .h-t { font-size: 15px; font-weight: 600; fill: var(--ink); }
  .h-s { font-size: 12px; fill: var(--text-dim); }
  .n-t { font-size: 12.5px; font-weight: 500; fill: var(--ink); }
  .n-s { font-size: 11.5px; fill: var(--text-dim); }
  .c-t { font-size: 16px; font-weight: 600; fill: var(--accent); }
  .c-s { font-size: 12px; fill: var(--text-dim); }
  .j-t { font: 600 12px var(--font-mono); fill: var(--ink); letter-spacing: .04em; text-anchor: middle; }
  .paper { fill: #fff; } .paper-sh { fill: #e4e7ec; }
  .pi { fill: var(--ink); } .pi2 { fill: #8a92a6; } .pd { fill: #c9ced8; } .pa { fill: #f2d4c4; } .pb { fill: #f1f2f5; } .pc { fill: #b9bfcb; }
  .it { fill: var(--accent); } .halo { fill: var(--accent); opacity: .12; }
  .ck { fill: var(--bg); stroke: var(--ink); stroke-width: 1.4; }
  .js { fill: var(--ink); }
  .bar { fill: var(--ink); }
  .ic { fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .ic.wh { color: #fff; }
  .m { display: none; }
  @media (max-width: 820px) {
    body { padding: 40px 16px; }
    figure { margin-bottom: 72px; }
    .d { display: none; }
    .m { display: block; max-width: 400px; margin: 0 auto; }
  }
  .hatch-bg { fill: #f1f2f5; } .hatch-ln { stroke: #e3e5ea; stroke-width: 2; }
'''

html = f'''<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>背景与方案</title>
<style>{CSS}</style>
</head>
<body>
<figure>
  <div class="d"><svg viewBox="{A_VB}" role="img" aria-label="{ARIA_A}">{scoped(''.join(a), defs, 'a-')}</svg></div>
  <div class="m"><svg viewBox="{MA_VB}" role="img" aria-label="{ARIA_A}">{scoped(''.join(ma), defs, 'ma-')}</svg></div>
</figure>
<figure>
  <div class="d"><svg viewBox="{B_VB}" role="img" aria-label="{ARIA_B}">{scoped(''.join(b), defs, 'b-')}</svg></div>
  <div class="m"><svg viewBox="{MB_VB}" role="img" aria-label="{ARIA_B}">{scoped(''.join(mb), defs, 'mb-')}</svg></div>
</figure>
</body>
</html>
'''
with open(OUT, 'w') as f:
    f.write(html)
print('wrote', OUT)
