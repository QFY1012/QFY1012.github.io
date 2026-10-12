# 生成输出层自迭代图(output-flow.html)。与 skill-flow 同一套线路语言:轨道是线,节点是站点,信息写在线上。
# 输出层的迭代对象是组件库与 design.md;用例是冻结的 JSON,只评呈现。
# 检查分两类:几何与排字由程序测量(方站),要读内容的交给 Judge(圆站);升级与否由审美把关两两比较决定。
# 下方支路:审美 Judge 先与设计师的排序校准,在留出集上验证后才写入审美原则。
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'output-flow.html')

# Lucide 图标(ISC 许可),24×24 坐标
ICON = {
    'component': '<path d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/><path d="M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z"/><path d="M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z"/><path d="M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/>',
    'code': '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
    'ruler': '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
    'eye': '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="1"/><path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0"/>',
    'pen': '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    'compare': '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/>',
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


def cell(x0, y0, w, h, kind, t, s, fs_t=12.5):
    """benchmark 里的一格。kind: data(测试数据)或 rub(规则,左缘一道强调色)。"""
    o = [f'<rect class="cell {kind}" x="{x0}" y="{y0}" width="{w}" height="{h}"/>']
    cy = y0 + h / 2
    if kind == 'rub':
        o.append(f'<rect class="bar" x="{x0}" y="{y0}" width="2.5" height="{h}"/>')
        o.append(icon('checks', x0 + 19, cy, 12.5, 'ic acc'))
    else:
        o.append(icon('db', x0 + 18, cy, 12.5, 'ic data'))
    o.append(f'<text class="cell-t" x="{x0 + 32}" y="{cy + 4.5}" style="font-size:{fs_t}px">{t}</text>')
    if s:
        o.append(f'<text class="cell-s{" data-s" if kind == "data" else ""}" x="{x0 + w - 10}" y="{cy + 4}" text-anchor="end">{s}</text>')
    return ''.join(o)


# ── 网格(与 skill-flow 相同)────────────────────────────
C1, C2, C3 = 305, 565, 825          # 三列:站点与 benchmark 各格上下对齐
YT, YB = 112, 332                   # 轨道上下两条直线
R = (YB - YT) / 2
YM = (YT + YB) / 2
SR = 17                             # 站点半径
YON = 430                           # 校准支路
g = SR + 5

svg = []
add = svg.append

# ── 冻结的 benchmark(先画,位于轨道内侧)──────────────
BX0, BX1, BY0, BY1 = 213, 917, 146, 284
CW, CH = 144, 36
CYM = 224                           # 各格的竖向中线
add(f'<rect class="hatch" x="{BX0}" y="{BY0}" width="{BX1 - BX0}" height="{BY1 - BY0}"/>')
add(icon('lock', BX0 + 22, BY0 + 20, 13, 'ic dim'))
add(f'<text class="core-t" x="{BX0 + 36}" y="{BY0 + 24.5}">Benchmark</text>')
x = BX0 + 36 + tw('Benchmark', 13) + 10
add(f'<text class="core-k" x="{x:.1f}" y="{BY0 + 24}">本轮冻结</text>')
add(f'<text class="core-s" x="{x + 62:.1f}" y="{BY0 + 24.5}">JSON 冻结，只评呈现</text>')

# C1 两格叠放:验证用例在上,审美原则在下(校准支路从下方接入)
add(cell(C1 - CW / 2, CYM - CH - 4, CW, CH, 'data', '验证用例', '1/4'))
add(cell(C1 - CW / 2, CYM + 4, CW, CH, 'rub', '审美原则', ''))
add(cell(C2 - CW / 2, CYM - CH / 2, CW, CH, 'data', '训练用例', '3/4'))
add(cell(C3 - CW / 2, CYM - CH / 2, CW, CH, 'rub', '规范检查', ''))

# 供给:训练用例 → 生成 Agent;规范检查 → 程序(测量项)与 Judge(判读项);验证用例与审美原则 → 审美把关
add(f'<path class="supply" d="M{C2} {CYM - CH / 2} V{YT + g}" marker-end="url(#ms)"/>')
add(f'<path class="supply" d="M{C3} {CYM - CH / 2} V{YT + g}" marker-end="url(#ms)"/>')
add(f'<path class="supply" d="M{C3} {CYM + CH / 2} V{YB - g}" marker-end="url(#ms)"/>')
add(f'<path class="supply" d="M{C1} {CYM + CH + 4} V{YB - g}" marker-end="url(#ms)"/>')
add(f'<text class="sup-l" x="{C3 + 8}" y="{(CYM - CH / 2 + YT + g) / 2 + 4}">测量项</text>')
add(f'<text class="sup-l" x="{C3 + 8}" y="{(CYM + CH / 2 + YB - g) / 2 + 4}">判读项</text>')

# ── 轨道 ─────────────────────────────────────────────
add(f'<path class="flow" d="M{C1 + g} {YT} H{C2 - g}" marker-end="url(#mf)"/>')
add(f'<path class="flow" d="M{C2 + g} {YT} H{C3 - g}" marker-end="url(#mf)"/>')
add(f'<path class="flow" d="M{C3 + g * 0.7} {YT} A{R} {R} 0 0 1 {C3 + g * 0.7} {YB}" marker-end="url(#mf)"/>')
add(f'<path class="flow" d="M{C3 - g} {YB} H{C2 + g}" marker-end="url(#mf)"/>')
add(f'<path class="flow ac" d="M{C2 - g} {YB} H{C1 + g}" marker-end="url(#ma)"/>')
add(f'<path class="flow ac" d="M{C1 - g * 0.7} {YB} A{R} {R} 0 0 1 {C1 - g * 0.7} {YT}" marker-end="url(#ma)"/>')

# 线上的信息
m1, m2 = (C1 + C2) / 2, (C2 + C3) / 2
add(knock(m1, YT, '组件 · design.md', 11.5, 'info'))
add(knock(m2, YT, 'HTML', 11.5, 'info mono'))
add(f'<text class="store-s" x="{m2}" y="{YT - 22}">渲染 → 截图 + 编号 DOM</text>')
add(knock(m2, YB, '问题清单', 11.5, 'info'))
add(f'<text class="store-s" x="{m2}" y="{YB + 30}">检查项 · 节点 · 理由</text>')
add(knock(m1, YB, '候选 vN+1', 11.5, 'info ac'))
add(f'<text class="store-s" x="{m1}" y="{YB + 30}">改组件库或 design.md</text>')
# 两端弧线旁的说明
xr = C3 + g * 0.7 + R + 14
add(f'<text class="side-t" x="{xr}" y="{YM - 12}">不过线的检查项</text>')
add(f'<text class="side-s" x="{xr}" y="{YM + 5}">测量值 · 节点编号</text>')
add(f'<text class="side-s" x="{xr}" y="{YM + 21}">连同截图交给 Judge</text>')
xl = C1 - g * 0.7 - R - 14
add(f'<text class="side-t ac" x="{xl}" y="{YM - 12}" text-anchor="end">两种顺序都胜出</text>')
add(f'<text class="side-s ac" x="{xl}" y="{YM + 5}" text-anchor="end">→ 升级为新的 vN</text>')
add(f'<text class="side-s ac" x="{xl}" y="{YM + 21}" text-anchor="end">否则保留 vN</text>')


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


add(station(C1, YT, 'it', 'component', '组件库 + design.md vN', 'START'))
add(station(C2, YT, 'ag', 'code', '生成 Agent', '01'))
add(station(C3, YT, 'prog', 'ruler', '程序检查', '02'))
add(station(C3, YB, 'ag', 'eye', 'Judge', '03'))
add(station(C2, YB, 'ag', 'pen', 'Reviser', '04'))
add(station(C1, YB, 'gate', 'compare', '审美把关', '05'))

# ── 校准支路:自右向左,接入审美原则 ──────────────────
O1, O2, O3 = C3, 590, 355
add(f'<path class="on" d="M{O1 - 8} {YON} H{O2 + 12}" marker-end="url(#ma)"/>')
add(f'<path class="on" d="M{O2 - 8} {YON} H{O3 + 12}" marker-end="url(#ma)"/>')
# 跨过底部轨道处断开轨道(桥)
add(f'<rect class="ko" x="{O3 - 5}" y="{YB - 3}" width="10" height="6"/>')
add(f'<path class="on" d="M{O3} {YON - 8} V{CYM + CH + 4 + 6}" marker-end="url(#ma)"/>')
add(f'<text class="on-l" x="{O3 + 10}" y="{YB + 66}">写入审美原则</text>')
add(f'<text class="on-k" x="{O1 + 26}" y="{YON + 4}">校准 Judge</text>')
for ox, name, sub in [(O1, '设计师盲排', '13 组页面 · 每组 5–6 版'), (O2, '对齐偏好', '逐对讲清选择的理由'),
                      (O3, '留出集验证', '4 组 · 两两一致率 89%')]:
    add(f'<circle class="on-st" cx="{ox}" cy="{YON}" r="5.5"/>')
    add(f'<text class="on-n" x="{ox}" y="{YON + 26}">{name}</text>')
    add(f'<text class="on-s" x="{ox}" y="{YON + 42}">{sub}</text>')

defs = '''<defs>
  <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="7" class="hatch-ln"/></pattern>
  <marker id="mf" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk"/></marker>
  <marker id="ma" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk ac"/></marker>
  <marker id="ms" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M1 1.5 L9 5 L1 8.5 Z" class="mk soft"/></marker>
</defs>'''

ARIA = ('输出层一次迭代的信息流转:从组件库与 design.md 的 vN 出发,生成 Agent 用组件把训练用例(冻结的 JSON)排成 HTML 页面;'
        '页面渲染后得到截图和编号 DOM,程序检查测量几何与排字,如间距刻度、网格、对齐、碰撞,给出不过线的检查项、测量值与节点编号;'
        'Judge 连同截图判读要读内容的检查项,如分组、层级、组件与数据是否匹配,输出问题清单(检查项、节点、理由);'
        'Reviser 据此修改组件库或 design.md,得到候选 vN+1;审美把关在验证用例上把新旧两版两两比较,两种顺序都选新版才升级,否则保留 vN。'
        'Benchmark 在本轮内冻结:训练用例与验证用例按 3:1 划分,规范检查分为程序测量项与 Judge 判读项,审美原则供审美把关使用。'
        '审美原则先经校准:设计师对 13 组页面(每组 5 到 6 版)盲排,逐对讲清选择的理由以对齐偏好,'
        '再在 4 组留出页面上验证,与设计师排序的两两一致率为 89%,之后才写入审美原则。')


# ── 窄屏:同一套线路语言,纵向排列 ─────────────────────
# 主线竖排;benchmark 为右侧阴影竖栏,各格与所供给的站点同行;校准支路自下而上接入。
MW = 360
LX, MR = 40, 15                                  # 主线 x、站点半径
MYS = [70, 172, 274, 390, 492, 618]              # START, 01..05
MBX0, MBX1, MBY0, MBY1 = 236, 354, 100, 680      # benchmark 竖栏
MCX0, MCW, MCH = 249, 92, 34                     # 格
LN = 200                                         # 校准支路 x
LY = {'val': 762, 'align': 816, 'rank': 870}

m = []
madd = m.append


def name_end(text, fs=14):
    return LX + 24 + tw(text, fs)


def mcell(y0, h, kind, t, s):
    o = [f'<rect class="cell {kind}" x="{MCX0}" y="{y0}" width="{MCW}" height="{h}"/>']
    cy = y0 + h / 2
    if kind == 'rub':
        o.append(f'<rect class="bar" x="{MCX0}" y="{y0}" width="2.5" height="{h}"/>')
        o.append(icon('checks', MCX0 + 17, cy, 12, 'ic acc'))
        o.append(f'<text class="cell-t" x="{MCX0 + 29}" y="{cy + 4.5}">{t}</text>')
    else:
        o.append(f'<text class="cell-t" x="{MCX0 + 11}" y="{cy + 4.5}">{t}</text>')
        o.append(f'<text class="cell-s data-s" x="{MCX0 + MCW - 8}" y="{cy + 4}" text-anchor="end">{s}</text>')
    return ''.join(o)


madd(f'<rect class="hatch-m" x="{MBX0}" y="{MBY0}" width="{MBX1 - MBX0}" height="{MBY1 - MBY0}"/>')
madd(icon('lock', MBX0 + 14, MBY0 + 18, 12, 'ic dim'))
madd(f'<text class="core-t" x="{MBX0 + 26}" y="{MBY0 + 22.5}">Benchmark</text>')
madd(f'<text class="core-k" x="{MBX0 + 8}" y="{MBY0 + 40}">本轮冻结</text>')
madd(mcell(MYS[1] - MCH / 2, MCH, 'data', '训练用例', '3/4'))
madd(mcell(MYS[2] - MCH / 2, MYS[3] - MYS[2] + MCH, 'rub', '规范检查', ''))   # 一格跨两站:测量项与判读项
madd(mcell(MYS[5] - MCH - 4, MCH, 'data', '验证用例', '1/4'))
madd(mcell(MYS[5] + 4, MCH, 'rub', '审美原则', ''))

# 供给:横向指向站名
for cy, nm in [(MYS[1], '生成 Agent'), (MYS[2], '程序检查'), (MYS[3], 'Judge')]:
    madd(f'<path class="supply" d="M{MCX0} {cy + 4} H{name_end(nm) + 10:.1f}" marker-end="url(#msm)"/>')
madd(f'<path class="supply" d="M{MCX0} {MYS[5]} H{name_end("审美把关") + 10:.1f}" marker-end="url(#msm)"/>')

# 主线
for i in range(5):
    ac = i == 4
    madd(f'<path class="flow{" ac" if ac else ""}" d="M{LX} {MYS[i] + MR + 5} V{MYS[i + 1] - MR - 5}" marker-end="url(#{"mam" if ac else "mfm"})"/>')
# 回线:05 → START
madd(f'<path class="flow ac" d="M{LX - MR - 4} {MYS[5]} H20 Q14 {MYS[5]} 14 {MYS[5] - 6} V{MYS[0] + 6} Q14 {MYS[0]} 20 {MYS[0]} H{LX - MR - 9}" marker-end="url(#mam)"/>')


def mid(i):
    return (MYS[i] + MYS[i + 1]) / 2


# 线上的信息(写在主线右侧)
madd(f'<text class="m-info" x="{LX + 24}" y="{mid(0) + 4}">组件 · design.md</text>')
madd(f'<text class="m-info mono" x="{LX + 24}" y="{mid(1) - 4}">HTML</text>')
madd(f'<text class="m-info sm" x="{LX + 24}" y="{mid(1) + 12}">截图 + 编号 DOM</text>')
madd(f'<text class="m-info" x="{LX + 24}" y="{mid(2) - 4}">不过线的检查项</text>')
madd(f'<text class="m-info sm" x="{LX + 24}" y="{mid(2) + 12}">测量值 · 节点编号</text>')
madd(f'<text class="m-info" x="{LX + 24}" y="{mid(3) - 4}">问题清单</text>')
madd(f'<text class="m-info sm" x="{LX + 24}" y="{mid(3) + 12}">检查项 · 节点 · 理由</text>')
madd(f'<text class="m-info ac" x="{LX + 24}" y="{mid(4) - 4}">候选 vN+1</text>')
madd(f'<text class="m-info sm" x="{LX + 24}" y="{mid(4) + 12}">改组件库或 design.md</text>')


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


for cy, kind, ic, nm, step in [(MYS[0], 'it', 'component', '组件库 + design.md vN', 'START'),
                               (MYS[1], 'ag', 'code', '生成 Agent', '01'),
                               (MYS[2], 'prog', 'ruler', '程序检查', '02'), (MYS[3], 'ag', 'eye', 'Judge', '03'),
                               (MYS[4], 'ag', 'pen', 'Reviser', '04'), (MYS[5], 'gate', 'compare', '审美把关', '05')]:
    madd(mstation(cy, kind, ic, nm, step))
madd(f'<text class="m-info ac" x="{LX + 24}" y="{MYS[5] + 38}">两种顺序都胜出 → 升级</text>')
madd(f'<text class="m-info ac sm" x="{LX + 24}" y="{MYS[5] + 54}">否则保留 vN</text>')

# 校准支路:自下而上,接入 benchmark 底部的审美原则
BC = (MBX0 + MBX1) / 2
madd(f'<path class="on" d="M{LN} {LY["rank"] - 8} V{LY["align"] + 10}" marker-end="url(#mam)"/>')
madd(f'<path class="on" d="M{LN} {LY["align"] - 8} V{LY["val"] + 10}" marker-end="url(#mam)"/>')
madd(f'<path class="on" d="M{LN + 8} {LY["val"]} H{BC - 6} Q{BC} {LY["val"]} {BC} {LY["val"] - 6} V{MBY1 + 9}" marker-end="url(#mam)"/>')
madd(f'<text class="m-on-l" x="{BC - 8}" y="{LY["val"] - 30}" text-anchor="end">写入审美原则</text>')
for key, nm, sub in [('val', '留出集验证', '一致率 89%'), ('align', '对齐偏好', '逐对讲理由'), ('rank', '设计师盲排', '13 组页面')]:
    y = LY[key]
    madd(f'<circle class="on-st" cx="{LN}" cy="{y}" r="5"/>')
    madd(f'<text class="m-on-n" x="{LN - 14}" y="{y}" text-anchor="end">{nm}</text>')
    madd(f'<text class="m-on-s" x="{LN - 14}" y="{y + 15}" text-anchor="end">{sub}</text>')
madd(f'<text class="on-k" x="{LN}" y="{LY["rank"] + 32}" text-anchor="middle">校准 Judge</text>')

mdefs = '''<defs>
  <pattern id="hatchm" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="7" class="hatch-ln"/></pattern>
  <marker id="mfm" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk"/></marker>
  <marker id="mam" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk ac"/></marker>
  <marker id="msm" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M1 1.5 L9 5 L1 8.5 Z" class="mk soft"/></marker>
</defs>'''
MH = LY['rank'] + 44
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
  .info.ac {{ fill: var(--accent); }}
  .side-t {{ font-size: 12.5px; font-weight: 500; fill: var(--ink); }}
  .side-s {{ font-size: 11px; fill: var(--text-dim); }}
  .side-t.ac, .side-s.ac {{ fill: var(--accent); }}
  .sup-l {{ font-size: 10.5px; fill: var(--text-dim); }}

  .hatch {{ fill: url(#hatch); }}
  .hatch-bg {{ fill: #f1f2f5; }} .hatch-ln {{ stroke: #e3e5ea; stroke-width: 2; }}
  .core-t {{ font-size: 13px; font-weight: 600; fill: var(--ink); }}
  .core-k {{ font: 600 10px var(--font-mono); letter-spacing: .16em; fill: var(--text-dim); }}
  .core-s {{ font-size: 11px; fill: var(--text-dim); }}
  .cell.data {{ fill: var(--data); }}
  .cell.rub {{ fill: #fff; }}
  .bar {{ fill: var(--accent); }}
  .cell-t {{ font-size: 12.5px; font-weight: 500; fill: var(--ink); }}
  .cell-s {{ font: 11px var(--font-mono); fill: var(--text-dim); }}
  .store-s {{ font-size: 10.5px; fill: var(--text-dim); text-anchor: middle; }}
  .data-s {{ fill: var(--data-ink); }}
  .ic.data {{ color: var(--data-ink); }}
  .supply {{ fill: none; stroke: var(--supply); stroke-width: 1.2; stroke-dasharray: 2 3; }}

  .st {{ stroke: none; }}
  .st.ag {{ fill: var(--ink); }}
  .st.prog {{ fill: var(--ink); }}
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
  .on-n {{ font-size: 12.5px; font-weight: 500; fill: var(--ink); text-anchor: middle; }}
  .on-s {{ font-size: 11px; fill: var(--text-dim); text-anchor: middle; }}
  .on-l {{ font-size: 11px; fill: var(--accent); }}
  .on-k {{ font-size: 11.5px; font-weight: 600; letter-spacing: .06em; fill: var(--accent); }}

  /* 图例 */
  .legend {{ display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 24px; margin-top: 30px; font-size: 12px; color: var(--text-dim); }}
  .legend span {{ display: inline-flex; align-items: center; gap: 8px; }}
  .legend i {{ display: inline-block; flex: none; }}
  .lg-it {{ width: 12px; height: 12px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 4px rgba(194,65,12,.12); }}
  .lg-ag {{ width: 12px; height: 12px; border-radius: 50%; background: var(--ink); }}
  .lg-prog {{ width: 11px; height: 11px; border-radius: 3px; background: var(--ink); }}
  .lg-flow {{ width: 22px; height: 1.6px; background: var(--track); }}
  .lg-frozen {{ width: 20px; height: 12px; background: repeating-linear-gradient(45deg, #f1f2f5 0 3px, #e3e5ea 3px 5px); }}
  .lg-rub {{ width: 20px; height: 12px; background: #fff; box-shadow: inset 2.5px 0 0 var(--accent); }}
  .lg-data {{ width: 20px; height: 12px; background: var(--data); box-shadow: inset 0 0 0 1px #e3e5ea; }}
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
</style>
</head>
<body>
<figure>
  <div class="d">
    <svg viewBox="70 44 1010 446" role="img" aria-label="{ARIA}">
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
    <span><i class="lg-frozen"></i>本轮冻结</span>
    <span><i class="lg-rub"></i>规则</span>
    <span><i class="lg-data"></i>测试数据</span>
    <span><i class="lg-on"></i>校准</span>
  </div>
</figure>
</body>
</html>
'''

with open(OUT, 'w') as f:
    f.write(html)
print('wrote', OUT)
