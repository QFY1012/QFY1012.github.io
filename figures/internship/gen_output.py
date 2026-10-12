# 生成输出层自迭代图(output-flow.html)。与 skill-flow 同一套线路语言:轨道是线,节点是站点,信息写在线上。
# 骨架与 Skill 层相同;不同在于检测分两步(程序检查 → 审美 Judge),以及 Maintainer 处的分流:
#   布局问题 → Reviser 只改 UI Spec 的一条规则,留出样本把关(内圈,只影响这个 Skill)
#   组件不够 → 组件 Agent 改组件库,人工审批后合并(下方支路,优先处理,影响所有 Skill)
# 组件库与公共规范在本轮内和 benchmark 一样冻结,loop 只改 UI Spec。
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
    'shield': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    'component': '<path d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/><path d="M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z"/><path d="M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z"/><path d="M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/>',
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


def cell(cx, y0, w, h, kind, t, s='', ic=None):
    """benchmark 里的一格。kind: data(测试数据)、rub(规则,左缘一道强调色)、lib(组件库)。"""
    x0 = cx - w / 2
    cy = y0 + h / 2
    o = [f'<rect class="cell {kind}" x="{x0}" y="{y0}" width="{w}" height="{h}"/>']
    if kind == 'rub':
        o.append(f'<rect class="bar" x="{x0}" y="{y0}" width="2.5" height="{h}"/>')
        o.append(icon('checks', x0 + 19, cy, 12.5, 'ic acc'))
    elif kind == 'lib':
        o.append(icon('component', x0 + 18, cy, 13, 'ic ink'))
    else:
        o.append(icon('db', x0 + 18, cy, 12.5, 'ic data'))
    o.append(f'<text class="cell-t" x="{x0 + 32}" y="{cy + 4.5}">{t}</text>')
    if s:
        o.append(f'<text class="cell-s{" data-s" if kind == "data" else ""}" x="{x0 + w - 10}" y="{cy + 4}" text-anchor="end">{s}</text>')
    return ''.join(o)


# ── 网格 ──────────────────────────────────────────────
# 上排四站(START、生成、程序检查、审美 Judge),下排三站(Maintainer、Reviser、留出把关)
X0, X1, X2, X3 = 305, 478, 652, 825
XB1, XB2, XB3 = 825, 565, 305          # 下排:Maintainer、Reviser、留出把关
YT, YB = 112, 332                      # 轨道上下两条直线
R = (YB - YT) / 2
YM = (YT + YB) / 2
SR = 17                                # 站点半径
g = SR + 5
YON = 430                              # 组件支路

svg = []
add = svg.append

# ── 冻结区:benchmark 与组件库(先画,位于轨道内侧)──────
BX0, BX1, BY0, BY1 = 213, 917, 146, 290
CW, CH = 140, 36
CYM = 224
add(f'<rect class="hatch" x="{BX0}" y="{BY0}" width="{BX1 - BX0}" height="{BY1 - BY0}"/>')
add(icon('lock', BX0 + 22, BY0 + 20, 13, 'ic dim'))
add(f'<text class="core-t" x="{BX0 + 36}" y="{BY0 + 24.5}">Benchmark</text>')
x = BX0 + 36 + tw('Benchmark', 13) + 10
add(f'<text class="core-k" x="{x:.1f}" y="{BY0 + 24}">本轮冻结</text>')
add(f'<text class="core-s" x="{x + 62:.1f}" y="{BY0 + 24.5}">只改 UI Spec</text>')

add(cell(X0, CYM - CH / 2, CW, CH, 'data', '留出样本', '2/6'))
add(cell(X1, CYM - CH - 4, CW, CH, 'data', '训练样本', '4/6'))
add(cell(X1, CYM + 4, CW, CH, 'lib', '组件库 · 规范'))
add(cell(X2, CYM - CH / 2, CW, CH, 'rub', '检查规则'))
add(cell(X3, CYM - CH / 2, CW, CH, 'rub', '审美 rubric'))
add(f'<text class="core-s" x="{X3}" y="{CYM + CH / 2 + 18}" text-anchor="middle">与用户排序一致 93%</text>')

# 供给:训练样本与组件库 → 生成 Agent;检查规则 → 程序检查;rubric → 审美 Judge;留出样本 → 留出把关
add(f'<path class="supply" d="M{X1} {CYM - CH - 4} V{YT + g}" marker-end="url(#ms)"/>')
add(f'<path class="supply" d="M{X2} {CYM - CH / 2} V{YT + g}" marker-end="url(#ms)"/>')
add(f'<path class="supply" d="M{X3} {CYM - CH / 2} V{YT + g}" marker-end="url(#ms)"/>')
add(f'<path class="supply" d="M{X0} {CYM + CH / 2} V{YB - g}" marker-end="url(#ms)"/>')

# ── 轨道 ─────────────────────────────────────────────
for xa, xb in [(X0, X1), (X1, X2), (X2, X3)]:
    add(f'<path class="flow" d="M{xa + g} {YT} H{xb - g}" marker-end="url(#mf)"/>')
add(f'<path class="flow" d="M{X3 + g * 0.7} {YT} A{R} {R} 0 0 1 {XB1 + g * 0.7} {YB}" marker-end="url(#mf)"/>')
add(f'<path class="flow" d="M{XB1 - g} {YB} H{XB2 + g}" marker-end="url(#mf)"/>')
add(f'<path class="flow ac" d="M{XB2 - g} {YB} H{XB3 + g}" marker-end="url(#ma)"/>')
add(f'<path class="flow ac" d="M{XB3 - g * 0.7} {YB} A{R} {R} 0 0 1 {X0 - g * 0.7} {YT}" marker-end="url(#ma)"/>')

# 线上的信息
add(knock((X0 + X1) / 2, YT, 'UI Spec', 11.5, 'info'))
add(store((X1 + X2) / 2, YT, '轨迹库'))
add(knock((X2 + X3) / 2, YT, '全部通过', 11.5, 'info'))
mb1, mb2 = (XB1 + XB2) / 2, (XB2 + XB3) / 2
add(store(mb1, YB, '问题清单'))
add(f'<text class="store-s" x="{mb1}" y="{YB + 30}">布局问题交给 Reviser</text>')
add(store(mb2, YB, '修改记录'))
add(f'<text class="store-s" x="{mb2}" y="{YB + 30}">每个候选都记</text>')
add(f'<text class="store-s" x="{mb2}" y="{YB + 45}">没采用的也保留</text>')
# 两端弧线旁的说明
xr = X3 + g * 0.7 + R + 14
add(f'<text class="side-t" x="{xr}" y="{YM - 12}">两步检测的结果</text>')
add(f'<text class="side-s" x="{xr}" y="{YM + 5}">程序检查报错</text>')
add(f'<text class="side-s" x="{xr}" y="{YM + 21}">两种顺序都提到的问题</text>')
xl = X0 - g * 0.7 - R - 14
add(f'<text class="side-t ac" x="{xl}" y="{YM - 4}" text-anchor="end">更好 → 升级</text>')
add(f'<text class="side-s ac" x="{xl}" y="{YM + 13}" text-anchor="end">否则保留 gN</text>')


# ── 站点 ─────────────────────────────────────────────
def station(cx, cy, kind, ic, name, step):
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
    out.append(f'<text class="st-k{cls}" x="{cx}" y="{sy}">{step}</text>')
    return ''.join(out)


add(station(X0, YT, 'it', 'file', 'UI Spec gN', 'START'))
add(station(X1, YT, 'ag', 'code', '生成 Agent', '01'))
add(station(X2, YT, 'prog', 'ruler', '程序检查', '02'))
add(station(X3, YT, 'ag', 'scale', '审美 Judge', '03'))
add(station(XB1, YB, 'ag', 'search', 'Maintainer', '04'))
add(station(XB2, YB, 'ag', 'pen', 'Reviser', '05'))
add(station(XB3, YB, 'gate', 'shield', '留出把关', '06'))

# ── 组件支路:从 Maintainer 分出,自右向左,合并进组件库 ──
XR_ = 884                               # 支路右侧竖线
XU = 506                                # 接回组件库的竖线
add(f'<path class="on" d="M{XB1 + 12} {YB + 12} Q{XR_} {YB + 22} {XR_} {YB + 56} V{YON - 12} Q{XR_} {YON} {XR_ - 12} {YON} H{800 + 12}" marker-end="url(#ma)"/>')
add(f'<text class="on-k" x="{XR_ + 12}" y="{YB + 66}">组件不够</text>')
add(f'<text class="on-l" x="{XR_ + 12}" y="{YB + 82}">优先处理</text>')
add(f'<text class="on-l" x="{XR_ + 12}" y="{YB + 98}">影响所有 Skill</text>')
lane = [(800, 'ag', '组件 Agent'), (700, 'prog', '程序检查'), (600, 'gate', '人工审批')]
for i, (ox, kind, name) in enumerate(lane):
    if kind == 'prog':
        add(f'<rect class="on-st" x="{ox - 5}" y="{YON - 5}" width="10" height="10" rx="2"/>')
    elif kind == 'gate':
        add(f'<circle class="on-gate" cx="{ox}" cy="{YON}" r="5.5"/>')
    else:
        add(f'<circle class="on-st" cx="{ox}" cy="{YON}" r="5.5"/>')
    add(f'<text class="on-n" x="{ox}" y="{YON + 26}">{name}</text>')
    if i + 1 < len(lane):
        add(f'<path class="on" d="M{ox - 8} {YON} H{lane[i + 1][0] + 12}" marker-end="url(#ma)"/>')
# 接回:向左转上,跨过底部轨道(桥),进入组件库
add(f'<rect class="ko" x="{XU - 5}" y="{YB - 3}" width="10" height="6"/>')
add(f'<path class="on" d="M{600 - 8} {YON} H{XU + 6} Q{XU} {YON} {XU} {YON - 6} V{CYM + CH + 4 + 6}" marker-end="url(#ma)"/>')
add(f'<text class="on-l" x="{XU - 10}" y="{BY1 + 24}" text-anchor="end">合并进组件库</text>')

defs = '''<defs>
  <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="7" class="hatch-ln"/></pattern>
  <marker id="mf" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk"/></marker>
  <marker id="ma" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk ac"/></marker>
  <marker id="ms" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M1 1.5 L9 5 L1 8.5 Z" class="mk soft"/></marker>
</defs>'''

ARIA = ('输出层一次迭代的信息流转,骨架与 Skill 层相同:从 UI Spec gN 出发,生成 Agent 用组件库为训练样本写出页面,'
        '首轮整页生成,之后只改和这次改动有关的地方;程序检查页面的截图与 DOM,全部通过才交给审美 Judge 两两比较,前一步不过不跑下一步。'
        'Maintainer 把两步检测的结果归纳进问题清单,并按现有组件够不够用分流。'
        '布局问题交给 Reviser,只改 UI Spec 的一条规则得到候选;候选在留出样本上一份不输、至少赢一半,才升级为 gN+1,否则保留 gN;'
        'Recorder 为每个候选写修改记录,没采用的也保留,Reviser 每轮先读。'
        '组件不够的问题优先处理:组件 Agent 新增或修改组件,程序检查不过打回、最多 2 次,再经人工审批后合并进组件库,影响所有 Skill,并从程序检查重新检测。'
        'Benchmark 在本轮内冻结:训练样本 4 份、留出样本 2 份,组件库与公共规范、检查规则、审美 rubric 都不改;审美 rubric 与用户排序一致 93%。')


# ── 窄屏:同一套线路语言,纵向排列 ─────────────────────
# 主线竖排;冻结区为右侧阴影竖栏,各格与所供给的站点同行;组件支路在下方,沿右缘接回组件库。
MW = 360
LX, MR = 40, 15                                  # 主线 x、站点半径
MYS = [70, 172, 274, 376, 478, 580, 682]         # START, 01..06
MBX0, MBX1, MBY0, MBY1 = 232, 340, 86, 712      # 冻结竖栏
MCX0, MCW, MCH = 240, 90, 32                     # 格
LN = 224                                         # 组件支路 x
LY = [790, 840, 890]                             # 组件 Agent、程序检查、人工审批
MXR = 352                                        # 接回组件库的竖线

m = []
madd = m.append


def name_end(text, fs=14):
    return LX + 24 + tw(text, fs)


def mcell(cy, kind, t, s=''):
    y0 = cy - MCH / 2
    o = [f'<rect class="cell {kind}" x="{MCX0}" y="{y0}" width="{MCW}" height="{MCH}"/>']
    if kind == 'rub':
        o.append(f'<rect class="bar" x="{MCX0}" y="{y0}" width="2.5" height="{MCH}"/>')
    o.append(f'<text class="cell-t sm" x="{MCX0 + 10}" y="{cy + 4.5}">{t}</text>')
    if s:
        o.append(f'<text class="cell-s data-s" x="{MCX0 + MCW - 7}" y="{cy + 4}" text-anchor="end">{s}</text>')
    return ''.join(o)


madd(f'<rect class="hatch-m" x="{MBX0}" y="{MBY0}" width="{MBX1 - MBX0}" height="{MBY1 - MBY0}"/>')
madd(icon('lock', MBX0 + 14, MBY0 + 18, 12, 'ic dim'))
madd(f'<text class="core-t" x="{MBX0 + 26}" y="{MBY0 + 22.5}">Benchmark</text>')
madd(f'<text class="core-k" x="{MBX0 + 9}" y="{MBY0 + 40}">本轮冻结</text>')
madd(mcell(MYS[1] - 18, 'data', '训练样本', '4/6'))
madd(mcell(MYS[1] + 18, 'lib', '组件库 · 规范'))
madd(mcell(MYS[2], 'rub', '检查规则'))
madd(mcell(MYS[3], 'rub', '审美 rubric'))
madd(f'<text class="m-info sm" x="{MCX0 + 4}" y="{MYS[3] + 32}">与用户排序</text>')
madd(f'<text class="m-info sm" x="{MCX0 + 4}" y="{MYS[3] + 47}">一致 93%</text>')
madd(mcell(MYS[6], 'data', '留出样本', '2/6'))

# 供给:横向指向站名
for cy, nm in [(MYS[1], '生成 Agent'), (MYS[2], '程序检查'), (MYS[3], '审美 Judge'), (MYS[6], '留出把关')]:
    y = cy if cy == MYS[1] else cy + 4
    madd(f'<path class="supply" d="M{MCX0} {y} H{name_end(nm) + 10:.1f}" marker-end="url(#msm)"/>')

# 主线
for i in range(6):
    ac = i == 5
    madd(f'<path class="flow{" ac" if ac else ""}" d="M{LX} {MYS[i] + MR + 5} V{MYS[i + 1] - MR - 5}" marker-end="url(#{"mam" if ac else "mfm"})"/>')
# 回线:06 → START
madd(f'<path class="flow ac" d="M{LX - MR - 4} {MYS[6]} H20 Q14 {MYS[6]} 14 {MYS[6] - 6} V{MYS[0] + 6} Q14 {MYS[0]} 20 {MYS[0]} H{LX - MR - 9}" marker-end="url(#mam)"/>')


def mid(i):
    return (MYS[i] + MYS[i + 1]) / 2


def mstore(cy, name, note):
    w = 30 + tw(name, 12) + 12
    x0 = LX + 22
    return (f'<rect class="store-bg" x="{x0}" y="{cy - 12}" width="{w:.1f}" height="24"/>'
            + icon('db', x0 + 16, cy, 12, 'ic store')
            + f'<text class="store-t" x="{x0 + 29}" y="{cy + 4.3:.1f}">{name}</text>'
            + f'<text class="m-info sm" x="{x0 + w + 8:.1f}" y="{cy + 4}">{note}</text>')


# 线上的信息(写在主线右侧)
madd(f'<text class="m-info" x="{LX + 24}" y="{mid(0) + 4}">UI Spec</text>')
madd(mstore(mid(1), '轨迹库', ''))
madd(f'<text class="m-info" x="{LX + 24}" y="{mid(2) + 4}">全部通过</text>')
madd(f'<text class="m-info" x="{LX + 24}" y="{mid(3) - 4}">两步检测的结果</text>')
madd(f'<text class="m-info sm" x="{LX + 24}" y="{mid(3) + 12}">报错 · 两种顺序都提到的问题</text>')
madd(mstore(mid(4), '问题清单', '布局问题'))
madd(mstore(mid(5), '修改记录', '含未采用的'))


def mstation(cy, kind, ic, nm, step):
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
    out.append(f'<text class="m-k{cls}" x="{LX + 24}" y="{cy - 8}">{step}</text>')
    out.append(f'<text class="m-n{cls}" x="{LX + 24}" y="{cy + 10}">{nm}</text>')
    return ''.join(out)


for cy, kind, ic, nm, step in [(MYS[0], 'it', 'file', 'UI Spec gN', 'START'), (MYS[1], 'ag', 'code', '生成 Agent', '01'),
                               (MYS[2], 'prog', 'ruler', '程序检查', '02'), (MYS[3], 'ag', 'scale', '审美 Judge', '03'),
                               (MYS[4], 'ag', 'search', 'Maintainer', '04'), (MYS[5], 'ag', 'pen', 'Reviser', '05'),
                               (MYS[6], 'gate', 'shield', '留出把关', '06')]:
    madd(mstation(cy, kind, ic, nm, step))
madd(f'<text class="m-info ac" x="{LX + 24}" y="{MYS[6] + 38}">更好 → 升级为新的 gN</text>')
madd(f'<text class="m-info ac sm" x="{LX + 24}" y="{MYS[6] + 54}">否则保留 gN</text>')

# 组件支路:从 Maintainer 站名右侧引出,竖直下行到主线下方,依次经过三站,再沿右缘上行接回组件库
madd(f'<path class="on" d="M{name_end("Maintainer") + 8:.1f} {MYS[4] + 5} H{LN - 8} Q{LN} {MYS[4] + 5} {LN} {MYS[4] + 13} V{LY[0] - 10}" marker-end="url(#mam)"/>')
# 跨过「留出样本」供给线处断开供给线(桥)
madd(f'<rect class="ko" x="{LN - 3}" y="{MYS[6] - 1}" width="6" height="10"/>')
madd(f'<text class="m-on-k" x="{LN + 12}" y="{LY[0] - 52}">组件不够</text>')
madd(f'<text class="m-on-l" x="{LN + 12}" y="{LY[0] - 36}">优先处理</text>')
madd(f'<text class="m-on-l" x="{LN + 12}" y="{LY[0] - 20}">影响所有 Skill</text>')
lane = [('ag', '组件 Agent'), ('prog', '程序检查'), ('gate', '人工审批')]
for i, (kind, nm) in enumerate(lane):
    y = LY[i]
    if kind == 'prog':
        madd(f'<rect class="on-st" x="{LN - 4.5}" y="{y - 4.5}" width="9" height="9" rx="2"/>')
    elif kind == 'gate':
        madd(f'<circle class="on-gate" cx="{LN}" cy="{y}" r="5"/>')
    else:
        madd(f'<circle class="on-st" cx="{LN}" cy="{y}" r="5"/>')
    madd(f'<text class="m-on-n" x="{LN - 14}" y="{y + 4}" text-anchor="end">{nm}</text>')
    if i + 1 < len(LY):
        madd(f'<path class="on" d="M{LN} {y + 8} V{LY[i + 1] - 10}" marker-end="url(#mam)"/>')
madd(f'<path class="on" d="M{LN + 8} {LY[2]} H{MXR - 6} Q{MXR} {LY[2]} {MXR} {LY[2] - 6} V{MYS[1] + 18 + 6} Q{MXR} {MYS[1] + 18} {MXR - 6} {MYS[1] + 18} H{MCX0 + MCW + 6}" marker-end="url(#mam)"/>')
madd(f'<text class="m-on-l" x="{MXR - 10}" y="{LY[2] - 12}" text-anchor="end">合并进组件库</text>')

mdefs = '''<defs>
  <pattern id="hatchm" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="7" class="hatch-ln"/></pattern>
  <marker id="mfm" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk"/></marker>
  <marker id="mam" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk ac"/></marker>
  <marker id="msm" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M1 1.5 L9 5 L1 8.5 Z" class="mk soft"/></marker>
</defs>'''
MH = LY[2] + 30
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
    --data: #ffffff;
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
  .info.mono {{ font-family: var(--font-mono); font-size: 11px; }}
  .side-t {{ font-size: 12.5px; font-weight: 500; fill: var(--ink); }}
  .side-s {{ font-size: 11px; fill: var(--text-dim); }}
  .side-t.ac, .side-s.ac {{ fill: var(--accent); }}

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

  .on {{ fill: none; stroke: var(--accent); stroke-width: 1.3; stroke-dasharray: 4 3; }}
  .on-st {{ fill: var(--accent); }}
  .on-gate {{ fill: var(--bg); stroke: var(--accent); stroke-width: 1.4; }}
  .on-n {{ font-size: 12.5px; font-weight: 500; fill: var(--ink); text-anchor: middle; }}
  .on-s {{ font-size: 11px; fill: var(--text-dim); text-anchor: middle; }}
  .on-s2 {{ font-size: 10.5px; fill: var(--text-dim); }}
  .on-l {{ font-size: 11px; fill: var(--accent); }}
  .on-k {{ font-size: 11.5px; font-weight: 600; letter-spacing: .06em; fill: var(--accent); }}

  /* 图例 */
  .legend {{ display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 24px; margin-top: 30px; font-size: 12px; color: var(--text-dim); }}
  .legend span {{ display: inline-flex; align-items: center; gap: 8px; }}
  .legend i {{ display: inline-block; flex: none; }}
  .lg-it {{ width: 12px; height: 12px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 4px rgba(194,65,12,.12); }}
  .lg-ag {{ width: 12px; height: 12px; border-radius: 50%; background: var(--ink); }}
  .lg-prog {{ width: 11px; height: 11px; border-radius: 3px; background: var(--ink); }}
  .lg-gate {{ width: 12px; height: 12px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--ink); }}
  .lg-flow {{ width: 22px; height: 1.6px; background: var(--track); }}
  .lg-store {{ width: 20px; height: 12px; background: #e4e7ec; }}
  .lg-frozen {{ width: 20px; height: 12px; background: repeating-linear-gradient(45deg, #f1f2f5 0 3px, #e3e5ea 3px 5px); }}
  .lg-rub {{ width: 20px; height: 12px; background: #fff; box-shadow: inset 2.5px 0 0 var(--accent); }}
  .lg-data {{ width: 20px; height: 12px; background: #fff; box-shadow: inset 0 0 0 1px #e3e5ea; }}
  .lg-on {{ width: 22px; height: 0; border-top: 1.3px dashed var(--accent); }}

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
  .m-info.mono {{ font-family: var(--font-mono); font-size: 11px; }}
  .m-info.sm {{ font-size: 10.5px; }}
  .m-info.ac {{ fill: var(--accent); }}
  .m-on-n {{ font-size: 12.5px; font-weight: 500; fill: var(--ink); }}
  .m-on-s {{ font-size: 10.5px; fill: var(--text-dim); }}
  .m-on-l {{ font-size: 10.5px; fill: var(--accent); }}
  .m-on-k {{ font-size: 11px; font-weight: 600; letter-spacing: .06em; fill: var(--accent); }}
</style>
</head>
<body>
<figure>
  <div class="d">
    <svg viewBox="70 44 1010 420" role="img" aria-label="{ARIA}">
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
    <span><i class="lg-on"></i>更新组件</span>
  </div>
</figure>
</body>
</html>
'''

with open(OUT, 'w') as f:
    f.write(html)
print('wrote', OUT)
