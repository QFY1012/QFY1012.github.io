# 生成输出层自迭代图(output-flow.html)。与 skill-flow 同一套线路语言:轨道是线,节点是站点,信息写在线上。
# 骨架与 Skill 层相同:冻结的 benchmark → 生成 → 检测 → 归纳问题 → 修改 → 把关 → 升级或保留。
# 不同之处:检测分两步(程序检查 → 审美 Judge);迭代对象有两个(UI Spec 与组件库),
# Maintainer 写出问题清单后分成两条平级、结构相同的轨道:
#   内轨 布局问题 → Reviser 改 UI Spec 的一条规则 → 修改记录 → 验证把关 → UI Spec(只影响这个 Skill)
#   外轨 组件不够 → 组件 Agent 改组件库 → 修改记录 → 人工审批 → 组件库(影响所有 Skill)
# UI Spec 与组件库是两个迭代对象,各在一条轨道的末端;两条回线汇合后一起进入生成 Agent。
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'output-flow.html')

# Lucide 图标(ISC 许可),24×24 坐标
ICON = {
    'file': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    'code': '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
    'ruler': '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
    'scale': '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'pen': '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    'component': '<path d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/><path d="M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z"/><path d="M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z"/><path d="M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/>',
    'shield': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'db': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
    'checks': '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
}


def icon(name, cx, cy, size, cls='ic'):
    k = size / 24
    return f'<g class="{cls}" transform="translate({cx - size / 2:.2f} {cy - size / 2:.2f}) scale({k:.4f})">{ICON[name]}</g>'


def tw(text, fs):
    """粗略估计文字宽度:中文≈1em,其余≈0.58em。"""
    return sum(fs if ord(c) > 0x2e80 else fs * 0.58 for c in text)


def knock(cx, cy, text, fs, cls, pad=8):
    """写在线上的信息:底色挖空线条,不加框。"""
    w = tw(text, fs) + pad * 2
    return (f'<rect class="ko" x="{cx - w / 2:.1f}" y="{cy - 9}" width="{w:.1f}" height="18"/>'
            f'<text class="{cls}" x="{cx}" y="{cy + fs * 0.36:.1f}">{text}</text>')


def store(cx, cy, name):
    """持续积累的库:轨道从中穿过。"""
    w = 30 + tw(name, 12) + 12
    x0 = cx - w / 2
    return (f'<rect class="store-bg" x="{x0:.1f}" y="{cy - 12}" width="{w:.1f}" height="24"/>'
            + icon('db', x0 + 16, cy, 12, 'ic store')
            + f'<text class="store-t" x="{x0 + 29:.1f}" y="{cy + 4.3:.1f}">{name}</text>')


def sbend(x0, y0, x1, y1):
    """水平切线的 S 形过渡。"""
    d = (x1 - x0) * 0.5
    return f'C{x0 + d:.1f} {y0:.1f} {x1 - d:.1f} {y1:.1f} {x1:.1f} {y1:.1f}'


def vbend(x0, y0, x1, y1):
    """竖直切线的 S 形过渡。"""
    d = (y1 - y0) * 0.5
    return f'C{x0:.1f} {y0 + d:.1f} {x1:.1f} {y1 - d:.1f} {x1:.1f} {y1:.1f}'


# ── 网格 ──────────────────────────────────────────────
X1, X2, X3 = 540, 682, 825             # 上排:生成、程序检查、审美 Judge
XM, XS, XF = 825, 745, 688             # Maintainer、问题清单、分叉点
XA, XR, XG, XO = 590, 482, 375, 270    # 两条轨道共用的列:Agent、修改记录、把关、迭代对象
YT, YB, YO = 112, 332, 460             # 上排、内轨、外轨
R = (YB - YT) / 2                      # 内轨回线半径
RO = (YO - YT) / 2                     # 外轨回线半径
YM = (YT + YB) / 2
SR = 17                                # 站点半径
g = SR + 5
XJ = XO - g * 0.7                      # 两条回线的汇合点

svg = []
add = svg.append

# ── 冻结的 benchmark(先画,位于轨道内侧)──────────────
BX0, BX1, BY0, BY1 = 213, 917, 156, 282
CW, CY0, CH = 124, 200, 46
add(f'<rect class="hatch" x="{BX0}" y="{BY0}" width="{BX1 - BX0}" height="{BY1 - BY0}"/>')
add(icon('lock', BX0 + 22, BY0 + 20, 13, 'ic dim'))
add(f'<text class="core-t" x="{BX0 + 36}" y="{BY0 + 24.5}">Benchmark</text>')
x = BX0 + 36 + tw('Benchmark', 13) + 10
add(f'<text class="core-k" x="{x:.1f}" y="{BY0 + 24}">本轮冻结</text>')
add(f'<text class="core-s" x="{x + 62:.1f}" y="{BY0 + 24.5}">样本与评测标准</text>')

cells = [(XG, 'data', '验证样本', '2/6'), (X1, 'data', '训练样本', '4/6'),
         (X2, 'rub', '检查规则', ''), (X3, 'rub', '审美 rubric', '')]
for cx, kind, t, s in cells:
    x0 = cx - CW / 2
    add(f'<rect class="cell" x="{x0}" y="{CY0}" width="{CW}" height="{CH}"/>')
    if kind == 'rub':
        add(f'<rect class="bar" x="{x0}" y="{CY0}" width="2.5" height="{CH}"/>')
        add(icon('checks', x0 + 19, CY0 + CH / 2, 13, 'ic acc'))
        tx = x0 + 33
    else:
        add(icon('db', x0 + 18, CY0 + CH / 2, 13, 'ic data'))
        tx = x0 + 32
    add(f'<text class="cell-t" x="{tx}" y="{CY0 + CH / 2 + 4.5}">{t}</text>')
    if s:
        add(f'<text class="cell-s data-s" x="{x0 + CW - 10}" y="{CY0 + CH / 2 + 4}" text-anchor="end">{s}</text>')
add(f'<text class="core-s" x="{X3}" y="{CY0 + CH + 18}" text-anchor="middle">与用户排序一致 93%</text>')

# 供给:训练样本 → 生成 Agent,检查规则 → 程序检查,rubric → 审美 Judge,验证样本 → 验证把关
for cx in (X1, X2, X3):
    add(f'<path class="supply" d="M{cx} {CY0} V{YT + g}" marker-end="url(#ms)"/>')
add(f'<path class="supply" d="M{XG} {CY0 + CH} V{YB - g}" marker-end="url(#ms)"/>')

# ── 轨道 ─────────────────────────────────────────────
# 两个迭代对象各自的回线(流转的信息)在左上汇合,一起进入生成 Agent
for y, rr in [(YB, R), (YO, RO)]:
    add(f'<path class="flow" d="M{XJ} {y} A{rr} {rr} 0 0 1 {XJ} {YT}"/>')
add(f'<path class="flow" d="M{XJ} {YT} H{X1 - g}" marker-end="url(#mf)"/>')
for xa, xb in [(X1, X2), (X2, X3)]:
    add(f'<path class="flow" d="M{xa + g} {YT} H{xb - g}" marker-end="url(#mf)"/>')
add(f'<path class="flow" d="M{X3 + g * 0.7} {YT} A{R} {R} 0 0 1 {XM + g * 0.7} {YB}" marker-end="url(#mf)"/>')
# Maintainer → 问题清单 → 分叉:内轨直行,外轨经 S 弯下到外轨
add(f'<path class="flow" d="M{XM - g} {YB} H{XA + g}" marker-end="url(#mf)"/>')
add(f'<path class="flow" d="M{XF} {YB} {sbend(XF, YB, XF - 50, YO)} H{XA + g}" marker-end="url(#mf)"/>')
# 改出候选之后:两条轨道同样用强调色,经把关升级各自的对象
for y in (YB, YO):
    add(f'<path class="flow ac" d="M{XA - g} {y} H{XG + g}" marker-end="url(#ma)"/>')
    add(f'<path class="flow ac" d="M{XG - g} {y} H{XO + g}" marker-end="url(#ma)"/>')

# 线上的信息
add(knock((XJ + X1 - g) / 2, YT, 'UI Spec · 组件库', 11.5, 'info'))
add(knock((X1 + X2) / 2, YT, '页面', 11.5, 'info'))
add(knock((X2 + X3) / 2, YT, '全部通过', 11.5, 'info'))
add(store(XS, YB, '问题清单'))
add(f'<text class="fork-l" x="{(XA + g + XF) / 2}" y="{YB - 13}">布局问题</text>')
add(f'<text class="fork-l" x="{XF - 18}" y="{YO - 34}" style="text-anchor:start">组件不够</text>')
for y, note in [(YB, '每个候选都记'), (YO, '每个组件改动都记')]:
    add(store(XR, y, '修改记录'))
    add(f'<text class="store-s" x="{XR}" y="{y + 30}">{note}</text>')
    add(f'<text class="store-s" x="{XR}" y="{y + 45}">没采用的也保留</text>')
# 右侧弧线旁的说明
xr = X3 + g * 0.7 + R + 14
add(f'<text class="side-t" x="{xr}" y="{YM - 12}">两步检测的结果</text>')
add(f'<text class="side-s" x="{xr}" y="{YM + 5}">程序检查报错</text>')
add(f'<text class="side-s" x="{xr}" y="{YM + 21}">两种顺序都提到的问题</text>')


# ── 站点 ─────────────────────────────────────────────
def station(cx, cy, kind, ic, name, step='', note=''):
    out = []
    if kind == 'it':
        out.append(f'<circle class="halo" cx="{cx}" cy="{cy}" r="{SR + 7}"/>')
    if kind == 'prog':  # 程序:方站
        s = SR - 1.5
        out.append(f'<rect class="st prog" x="{cx - s}" y="{cy - s}" width="{2 * s}" height="{2 * s}" rx="5"/>')
    else:
        out.append(f'<circle class="st {kind}" cx="{cx}" cy="{cy}" r="{SR}"/>')
    out.append(icon(ic, cx, cy, 15, 'ic ' + ('ink' if kind == 'gate' else 'wh')))
    top = cy < YM
    ny = cy - SR - 18 if top else cy + SR + 26
    sy = ny - 17 if top else ny + 16
    cls = ' ac' if kind == 'it' else ''
    out.append(f'<text class="st-n{cls}" x="{cx}" y="{ny}">{name}</text>')
    if step:
        out.append(f'<text class="st-k{cls}" x="{cx}" y="{sy}">{step}</text>')
    if note:
        out.append(f'<text class="st-note" x="{cx}" y="{sy + 18}">{note}</text>')
    return ''.join(out)


add(station(X1, YT, 'ag', 'code', '生成 Agent', '01'))
add(station(X2, YT, 'prog', 'ruler', '程序检查', '02'))
add(station(X3, YT, 'ag', 'scale', '审美 Judge', '03'))
add(station(XM, YB, 'ag', 'search', 'Maintainer', '04'))
add(station(XA, YB, 'ag', 'pen', 'Reviser', '05'))
add(station(XG, YB, 'gate', 'shield', '验证把关', '06', '更好才升级'))
add(station(XO, YB, 'it', 'file', 'UI Spec gN'))
add(station(XA, YO, 'ag', 'component', '组件 Agent', '05'))
add(station(XG, YO, 'gate', 'user', '人工审批', '06', '通过才合并'))
add(station(XO, YO, 'it', 'component', '组件库 kN'))

defs = '''<defs>
  <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="7" class="hatch-ln"/></pattern>
  <marker id="mf" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk"/></marker>
  <marker id="ma" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk ac"/></marker>
  <marker id="ms" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M1 1.5 L9 5 L1 8.5 Z" class="mk soft"/></marker>
</defs>'''

ARIA = ('输出层一次迭代的信息流转,骨架与 Skill 层相同,但迭代对象有两个:UI Spec 和组件库。'
        '两者一起交给生成 Agent,为训练样本写出页面;程序检查全部通过后,审美 Judge 把新旧两版两两比较。'
        'Maintainer 把两步检测的结果归纳进问题清单,按现有组件够不够用分成两条平级的轨道:'
        '布局问题交给 Reviser,改 UI Spec 的一条规则,写入修改记录,在验证样本上更好才升级 UI Spec;'
        '组件不够交给组件 Agent,新增或修改组件,写入修改记录,人工审批通过才合并进组件库。'
        '两条轨道的修改记录都保留没采用的改动。'
        'Benchmark 在本轮内冻结:训练样本 4 份、验证样本 2 份、检查规则与审美 rubric;审美 rubric 与用户排序一致 93%。')


# ── 窄屏:同一套线路语言,纵向排列 ─────────────────────
# 主线竖排到问题清单后分叉:布局问题一段在上,组件不够一段在下,两段结构相同;
# 每段末尾是各自的迭代对象,两条回线(流转的信息)在顶部汇合,进入生成 Agent。
# 冻结区为右侧阴影竖栏,各格与所供给的站点同行。
MW = 360
LX, MR = 56, 15                                  # 主线 x、站点半径
MJ = 80                                          # 两条回线的汇合点
MYS = [172, 274, 376, 478]                       # 01..04
MSY = 530                                        # 问题清单
MFY = 566                                        # 分叉
MA = [646, 726, 806, 886]                        # 内段:Reviser、修改记录、验证把关、UI Spec
MO = [986, 1066, 1146, 1226]                     # 外段:组件 Agent、修改记录、人工审批、组件库
MBX0, MBX1, MBY0, MBY1 = 236, 344, 96, 836       # 冻结竖栏
MCX0, MCW, MCH = 245, 90, 34
MBR = 200                                        # 外段支路竖线 x
LA, LO = 30, 14                                  # 两条回线 x

m = []
madd = m.append


def name_end(text, fs=14):
    return LX + 24 + tw(text, fs)


def mcell(cy, kind, t, s=''):
    y0 = cy - MCH / 2
    o = [f'<rect class="cell" x="{MCX0}" y="{y0}" width="{MCW}" height="{MCH}"/>']
    if kind == 'rub':
        o.append(f'<rect class="bar" x="{MCX0}" y="{y0}" width="2.5" height="{MCH}"/>')
    o.append(f'<text class="cell-t sm" x="{MCX0 + 11}" y="{cy + 4.5}">{t}</text>')
    if s:
        o.append(f'<text class="cell-s data-s" x="{MCX0 + MCW - 8}" y="{cy + 4}" text-anchor="end">{s}</text>')
    return ''.join(o)


madd(f'<rect class="hatch-m" x="{MBX0}" y="{MBY0}" width="{MBX1 - MBX0}" height="{MBY1 - MBY0}"/>')
madd(icon('lock', MBX0 + 14, MBY0 + 18, 12, 'ic dim'))
madd(f'<text class="core-t" x="{MBX0 + 26}" y="{MBY0 + 22.5}">Benchmark</text>')
madd(f'<text class="core-k" x="{MBX0 + 9}" y="{MBY0 + 40}">本轮冻结</text>')
madd(mcell(MYS[0], 'data', '训练样本', '4/6'))
madd(mcell(MYS[1], 'rub', '检查规则'))
madd(mcell(MYS[2], 'rub', '审美 rubric'))
madd(f'<text class="m-info sm" x="{MCX0 + 4}" y="{MYS[2] + 34}">与用户排序</text>')
madd(f'<text class="m-info sm" x="{MCX0 + 4}" y="{MYS[2] + 49}">一致 93%</text>')
madd(mcell(MA[2], 'data', '验证样本', '2/6'))

# 供给:横向指向站名
for cy, nm in [(MYS[0], '生成 Agent'), (MYS[1], '程序检查'), (MYS[2], '审美 Judge'), (MA[2], '验证把关')]:
    madd(f'<path class="supply" d="M{MCX0} {cy + 4} H{name_end(nm) + 10:.1f}" marker-end="url(#msm)"/>')
# 外段支路跨过「验证样本」供给线处断开供给线(桥)
madd(f'<rect class="ko" x="{MBR - 3}" y="{MA[2] - 1}" width="6" height="10"/>')

# 两条回线:内段在里(x=LA),外段在外(x=LO),在顶部汇合后进入主线
for ys, lx in [(MA, LA), (MO, LO)]:
    madd(f'<path class="flow" d="M{LX - MR - 4} {ys[3]} H{lx + 6} Q{lx} {ys[3]} {lx} {ys[3] - 6} V{MJ + 6} Q{lx} {MJ} {lx + 6} {MJ} H{LX - 8} Q{LX} {MJ} {LX} {MJ + 8}"/>')
madd(f'<path class="flow" d="M{LX} {MJ + 8} V{MYS[0] - MR - 5}" marker-end="url(#mfm)"/>')
# 主线:01 → 04 → 问题清单 → 分叉
for i in range(3):
    madd(f'<path class="flow" d="M{LX} {MYS[i] + MR + 5} V{MYS[i + 1] - MR - 5}" marker-end="url(#mfm)"/>')
madd(f'<path class="flow" d="M{LX} {MYS[3] + MR + 5} V{MA[0] - MR - 5}" marker-end="url(#mfm)"/>')
# 外段:分叉后向右,沿内段右侧下行,再回到主线列
YJ = MO[0] - 50
madd(f'<path class="flow" d="M{LX} {MFY - 8} Q{LX} {MFY} {LX + 8} {MFY} H{MBR - 8} Q{MBR} {MFY} {MBR} {MFY + 8} V{YJ - 8} Q{MBR} {YJ} {MBR - 8} {YJ} H{LX + 8} Q{LX} {YJ} {LX} {YJ + 8} V{MO[0] - MR - 5}" marker-end="url(#mfm)"/>')
# 改出候选之后:两段同样用强调色,经把关升级各自的对象
for ys in (MA, MO):
    madd(f'<path class="flow ac" d="M{LX} {ys[0] + MR + 5} V{ys[2] - MR - 5}" marker-end="url(#mam)"/>')
    madd(f'<path class="flow ac" d="M{LX} {ys[2] + MR + 5} V{ys[3] - MR - 5}" marker-end="url(#mam)"/>')


def mstore(cy, name, note=''):
    w = 30 + tw(name, 12) + 12
    x0 = LX + 22
    o = (f'<rect class="store-bg" x="{x0}" y="{cy - 12}" width="{w:.1f}" height="24"/>'
         + icon('db', x0 + 16, cy, 12, 'ic store')
         + f'<text class="store-t" x="{x0 + 29}" y="{cy + 4.3:.1f}">{name}</text>')
    if note:
        o += f'<text class="m-info sm" x="{x0 + w + 8:.1f}" y="{cy + 4}">{note}</text>'
    return o


# 线上的信息(写在主线右侧)
madd(f'<text class="m-info" x="{LX + 24}" y="{(MJ + MYS[0]) / 2 + 8}">UI Spec · 组件库</text>')
madd(f'<text class="m-info" x="{LX + 24}" y="{(MYS[0] + MYS[1]) / 2 + 4}">页面</text>')
madd(f'<text class="m-info" x="{LX + 24}" y="{(MYS[1] + MYS[2]) / 2 + 4}">全部通过</text>')
madd(f'<text class="m-info" x="{LX + 24}" y="{(MYS[2] + MYS[3]) / 2 - 4}">两步检测的结果</text>')
madd(f'<text class="m-info sm" x="{LX + 24}" y="{(MYS[2] + MYS[3]) / 2 + 12}">报错 · 两种顺序都提到的问题</text>')
madd(mstore(MSY, '问题清单'))
madd(f'<text class="m-fork" x="{LX + 14}" y="{MFY + 32}">布局问题</text>')
madd(f'<text class="m-fork" x="{MBR - 12}" y="{MFY + 32}" text-anchor="end">组件不够</text>')
madd(mstore(MA[1], '修改记录'))
madd(mstore(MO[1], '修改记录'))


def mstation(cy, kind, ic, nm, step=''):
    out = []
    if kind == 'it':
        out.append(f'<circle class="halo" cx="{LX}" cy="{cy}" r="{MR + 6}"/>')
    if kind == 'prog':
        s = MR - 1.5
        out.append(f'<rect class="st prog" x="{LX - s}" y="{cy - s}" width="{2 * s}" height="{2 * s}" rx="4.5"/>')
    else:
        out.append(f'<circle class="st {kind}" cx="{LX}" cy="{cy}" r="{MR}"/>')
    out.append(icon(ic, LX, cy, 13, 'ic ' + ('ink' if kind == 'gate' else 'wh')))
    cls = ' ac' if kind == 'it' else ''
    if step:
        out.append(f'<text class="m-k{cls}" x="{LX + 24}" y="{cy - 8}">{step}</text>')
        out.append(f'<text class="m-n{cls}" x="{LX + 24}" y="{cy + 10}">{nm}</text>')
    else:
        out.append(f'<text class="m-n{cls}" x="{LX + 24}" y="{cy + 5}">{nm}</text>')
    return ''.join(out)


for cy, kind, ic, nm, step in [(MYS[0], 'ag', 'code', '生成 Agent', '01'), (MYS[1], 'prog', 'ruler', '程序检查', '02'),
                               (MYS[2], 'ag', 'scale', '审美 Judge', '03'), (MYS[3], 'ag', 'search', 'Maintainer', '04'),
                               (MA[0], 'ag', 'pen', 'Reviser', '05'), (MA[2], 'gate', 'shield', '验证把关', '06'),
                               (MA[3], 'it', 'file', 'UI Spec gN', ''),
                               (MO[0], 'ag', 'component', '组件 Agent', '05'), (MO[2], 'gate', 'user', '人工审批', '06'),
                               (MO[3], 'it', 'component', '组件库 kN', '')]:
    madd(mstation(cy, kind, ic, nm, step))
madd(f'<text class="m-info ac" x="{LX + 24}" y="{MA[2] + 28}">更好才升级</text>')
madd(f'<text class="m-info ac" x="{LX + 24}" y="{MO[2] + 28}">通过才合并</text>')

mdefs = '''<defs>
  <pattern id="hatchm" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="7" class="hatch-ln"/></pattern>
  <marker id="mfm" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk"/></marker>
  <marker id="mam" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk ac"/></marker>
  <marker id="msm" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M1 1.5 L9 5 L1 8.5 Z" class="mk soft"/></marker>
</defs>'''
MH = MO[3] + 40
mobile = f'<svg viewBox="0 30 {MW} {MH - 30}" role="img" aria-label="{ARIA}">{mdefs}{"".join(m)}</svg>'


html = f'''<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>输出层自迭代</title>
<style>
  /* 取自官网 home.css 浅色主题;直接铺在页面上。图标:Lucide(ISC) */
  :root {{
    --bg: #f6f7f9;
    --ink: #171b26;
    --text-dim: #666d7e;
    --text-dimmer: #8a92a6;
    --track: #b9bfcb;
    --supply: #b9bfcb;
    --accent: #c2410c;
    --data-ink: #666d7e;
    --font-body: 'PingFang SC', 'Noto Sans SC', 'WenQuanYi Zen Hei', 'Microsoft YaHei', sans-serif;
    --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ background: var(--bg); color: var(--ink); font-family: var(--font-body); padding: 48px 16px; -webkit-font-smoothing: antialiased; }}
  figure {{ max-width: 1000px; margin: 0 auto; }}

  .d svg {{ display: block; width: 100%; height: auto; font-family: var(--font-body); overflow: visible; }}
  .ko {{ fill: var(--bg); }}
  .flow {{ fill: none; stroke: var(--track); stroke-width: 1.6; }}
  .flow.ac {{ stroke: var(--accent); }}
  .mk {{ fill: var(--track); }} .mk.ac {{ fill: var(--accent); }} .mk.soft {{ fill: var(--supply); }}
  .info {{ font-size: 11.5px; fill: var(--text-dim); text-anchor: middle; }}
  .side-t {{ font-size: 12.5px; font-weight: 500; fill: var(--ink); }}
  .side-s {{ font-size: 11px; fill: var(--text-dim); }}
  .fork-l {{ font-size: 11.5px; font-weight: 500; fill: var(--ink); text-anchor: middle; }}

  .hatch {{ fill: url(#hatch); }}
  .hatch-bg {{ fill: #f1f2f5; }} .hatch-ln {{ stroke: #e3e5ea; stroke-width: 2; }}
  .core-t {{ font-size: 13px; font-weight: 600; fill: var(--ink); }}
  .core-k {{ font: 600 10px var(--font-mono); letter-spacing: .16em; fill: var(--text-dim); }}
  .core-s {{ font-size: 11px; fill: var(--text-dim); }}
  .cell {{ fill: #fff; }}
  .bar {{ fill: var(--accent); }}
  .cell-t {{ font-size: 12.5px; font-weight: 500; fill: var(--ink); }}
  .cell-t.sm {{ font-size: 12px; }}
  .cell-s {{ font: 11px var(--font-mono); fill: var(--text-dim); }}
  .store-bg {{ fill: #e4e7ec; }}
  .store-t {{ font-size: 12px; font-weight: 500; fill: var(--ink); }}
  .store-s {{ font-size: 10.5px; fill: var(--text-dim); text-anchor: middle; }}
  .ic.store {{ color: var(--text-dim); }}
  .data-s {{ fill: var(--data-ink); }}
  .ic.data {{ color: var(--data-ink); }}
  .supply {{ fill: none; stroke: var(--supply); stroke-width: 1.2; stroke-dasharray: 2 3; }}

  .st {{ stroke: none; }}
  .st.ag, .st.prog {{ fill: var(--ink); }}
  .st.it {{ fill: var(--accent); }}
  .st.gate {{ fill: var(--bg); stroke: var(--ink); stroke-width: 1.5; }}
  .halo {{ fill: var(--accent); opacity: .12; }}
  .ic {{ fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }}
  .ic.wh {{ color: #fff; }} .ic.ink {{ color: var(--ink); }} .ic.dim {{ color: var(--text-dimmer); }} .ic.acc {{ color: var(--accent); }}
  .st-n {{ font-size: 14px; font-weight: 500; fill: var(--ink); text-anchor: middle; }}
  .st-k {{ font: 600 10px var(--font-mono); letter-spacing: .16em; fill: var(--text-dimmer); text-anchor: middle; }}
  .st-n.ac, .st-k.ac {{ fill: var(--accent); }}
  .st-note {{ font-size: 11px; fill: var(--accent); text-anchor: middle; }}

  /* 图例 */
  .legend {{ display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 24px; margin-top: 30px; font-size: 12px; color: var(--text-dim); }}
  .legend span {{ display: inline-flex; align-items: center; gap: 8px; }}
  .legend i {{ display: inline-block; flex: none; }}
  .lg-it {{ width: 12px; height: 12px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 4px rgba(194,65,12,.12); }}
  .lg-ag {{ width: 12px; height: 12px; border-radius: 50%; background: var(--ink); }}
  .lg-prog {{ width: 11px; height: 11px; border-radius: 3px; background: var(--ink); }}
  .lg-flow {{ width: 22px; height: 1.6px; background: var(--track); }}
  .lg-store {{ width: 20px; height: 12px; background: #e4e7ec; }}
  .lg-frozen {{ width: 20px; height: 12px; background: repeating-linear-gradient(45deg, #f1f2f5 0 3px, #e3e5ea 3px 5px); }}
  .lg-rub {{ width: 20px; height: 12px; background: #fff; box-shadow: inset 2.5px 0 0 var(--accent); }}
  .lg-data {{ width: 20px; height: 12px; background: #fff; box-shadow: inset 0 0 0 1px #e3e5ea; }}

  /* 窄屏:纵向线路 */
  .m {{ display: none; }}
  @media (max-width: 720px) {{
    body {{ padding: 32px 16px; }}
    .d {{ display: none; }}
    .m {{ display: block; max-width: 400px; margin: 0 auto; }}
  }}
  .m svg {{ display: block; width: 100%; height: auto; font-family: var(--font-body); overflow: visible; }}
  .hatch-m {{ fill: url(#hatchm); }}
  .m-n {{ font-size: 14px; font-weight: 500; fill: var(--ink); }}
  .m-k {{ font: 600 9.5px var(--font-mono); letter-spacing: .16em; fill: var(--text-dimmer); }}
  .m-n.ac, .m-k.ac {{ fill: var(--accent); }}
  .m-info {{ font-size: 11.5px; fill: var(--text-dim); }}
  .m-info.sm {{ font-size: 10.5px; }}
  .m-info.ac {{ fill: var(--accent); font-size: 11px; }}
  .m-fork {{ font-size: 11.5px; font-weight: 500; fill: var(--ink); }}
</style>
</head>
<body>
<figure>
  <div class="d">
    <svg viewBox="70 44 1010 512" role="img" aria-label="{ARIA}">
      {defs}
      {''.join(svg)}
    </svg>
  </div>
  <div class="m">{mobile}</div>

  <div class="legend">
    <span><i class="lg-it"></i>迭代对象</span>
    <span><i class="lg-ag"></i>Agent</span>
    <span><i class="lg-prog"></i>程序</span>
    <span><i class="lg-flow"></i>流转的信息</span>
    <span><i class="lg-store"></i>持续积累</span>
    <span><i class="lg-frozen"></i>本轮冻结</span>
    <span><i class="lg-rub"></i>规则</span>
    <span><i class="lg-data"></i>测试数据</span>
  </div>
</figure>
</body>
</html>
'''

with open(OUT, 'w') as f:
    f.write(html)
print('wrote', OUT)
