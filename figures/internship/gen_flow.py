# 生成 Skill 层自迭代图(skill-flow.html)。线路图语言:轨道是线,节点是站点,信息写在线上。
# 坐标集中在这里,便于对齐与微调。
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'skill-flow.html')

# Lucide 图标(ISC 许可),24×24 坐标
ICON = {
    'file': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    'bot': '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    'scale': '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'pen': '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    'shield': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
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


# ── 网格 ──────────────────────────────────────────────
C1, C2, C3 = 305, 565, 825          # 三列:站点与 benchmark 三格上下对齐
YT, YB = 112, 332                   # 轨道上下两条直线
R = (YB - YT) / 2
YM = (YT + YB) / 2
SR = 17                             # 站点半径
YON = 430                           # 上线后支路

svg = []
add = svg.append


def knock(cx, cy, text, fs, cls, pad=8):
    """写在线上的信息:底色挖空线条,不加框。"""
    w = tw(text, fs) + pad * 2
    return (f'<rect class="ko" x="{cx - w / 2:.1f}" y="{cy - 9}" width="{w:.1f}" height="18"/>'
            f'<text class="{cls}" x="{cx}" y="{cy + fs * 0.36:.1f}">{text}</text>')


# ── 冻结的 benchmark(先画,位于轨道内侧)──────────────
BX0, BX1, BY0, BY1 = 213, 917, 156, 270
CW, CY0, CH = 144, 200, 46
add(f'<rect class="hatch" x="{BX0}" y="{BY0}" width="{BX1 - BX0}" height="{BY1 - BY0}"/>')
add(icon('lock', BX0 + 22, BY0 + 20, 13, 'ic dim'))
add(f'<text class="core-t" x="{BX0 + 36}" y="{BY0 + 24.5}">Benchmark</text>')
x = BX0 + 36 + tw('Benchmark', 13) + 10
add(f'<text class="core-k" x="{x:.1f}" y="{BY0 + 24}">本轮冻结</text>')
add(f'<text class="core-s" x="{x + 62:.1f}" y="{BY0 + 24.5}">初版与设计师共创</text>')

cells = [
    (C1, 'data', '验证用例', '1/4'),
    (C2, 'data', '训练用例', '3/4'),
    (C3, 'rub', 'Rubric', '检查点'),
]
for cx, kind, t, s in cells:
    x0 = cx - CW / 2
    add(f'<rect class="cell {kind}" x="{x0}" y="{CY0}" width="{CW}" height="{CH}"/>')
    if kind == 'rub':
        add(f'<rect class="bar" x="{x0}" y="{CY0}" width="2.5" height="{CH}"/>')
        add(icon('checks', x0 + 20, CY0 + CH / 2, 13, 'ic acc'))
        tx = x0 + 34
    else:
        add(icon('db', x0 + 19, CY0 + CH / 2, 13, 'ic data'))
        tx = x0 + 33
    add(f'<text class="cell-t" x="{tx}" y="{CY0 + CH / 2 + 4.5}">{t}</text>')
    add(f'<text class="cell-s{" data-s" if kind == "data" else ""}" x="{x0 + CW - 12}" y="{CY0 + CH / 2 + 4}" text-anchor="end">{s}</text>')

# 三路供给:训练用例 → 执行 Agent,Rubric → Judge,验证用例 → 验证把关
for cx, y0, y1 in [(C2, CY0, YT + SR + 5), (C3, CY0, YT + SR + 5), (C1, CY0 + CH, YB - SR - 5)]:
    add(f'<path class="supply" d="M{cx} {y0} V{y1}" marker-end="url(#ms)"/>')

# ── 轨道 ─────────────────────────────────────────────
g = SR + 5
add(f'<path class="flow" d="M{C1 + g} {YT} H{C2 - g}" marker-end="url(#mf)"/>')
add(f'<path class="flow" d="M{C2 + g} {YT} H{C3 - g}" marker-end="url(#mf)"/>')
add(f'<path class="flow" d="M{C3 + g * 0.7} {YT} A{R} {R} 0 0 1 {C3 + g * 0.7} {YB}" marker-end="url(#mf)"/>')
add(f'<path class="flow" d="M{C3 - g} {YB} H{C2 + g}" marker-end="url(#mf)"/>')
add(f'<path class="flow ac" d="M{C2 - g} {YB} H{C1 + g}" marker-end="url(#ma)"/>')
add(f'<path class="flow ac" d="M{C1 - g * 0.7} {YB} A{R} {R} 0 0 1 {C1 - g * 0.7} {YT}" marker-end="url(#ma)"/>')

# 线上的信息
m1, m2 = (C1 + C2) / 2, (C2 + C3) / 2
add(knock(m1, YT, 'SKILL.md', 11.5, 'info mono'))


def store(cx, cy, name):
    """持续积累的库:轨道从中穿过,写入方在前、读取方在后。"""
    w = 30 + tw(name, 12) + 12
    x0 = cx - w / 2
    return (f'<rect class="store-bg" x="{x0:.1f}" y="{cy - 12}" width="{w:.1f}" height="24"/>'
            + icon('db', x0 + 16, cy, 12, 'ic store')
            + f'<text class="store-t" x="{x0 + 29:.1f}" y="{cy + 4.3:.1f}">{name}</text>')


ST_TRACE, ST_EXP, ST_LOG = m2, m2, m1
add(store(ST_TRACE, YT, '轨迹库'))
add(f'<text class="store-s" x="{ST_TRACE}" y="{YT - 22}">执行完写入 · Judge 读取</text>')
add(store(ST_EXP, YB, '经验库'))
add(f'<text class="store-s" x="{ST_EXP}" y="{YB + 30}">成功与失败模式</text>')
add(store(ST_LOG, YB, '修改记录'))
add(f'<text class="store-s" x="{ST_LOG}" y="{YB + 30}">每次修改都留痕</text>')
add(f'<text class="store-s" x="{ST_LOG}" y="{YB + 45}">被拒绝的也保留</text>')
# 两端弧线旁的说明
xr = C3 + g * 0.7 + R + 14
add(f'<text class="side-t" x="{xr}" y="{YM - 12}">判定结果</text>')
add(f'<text class="side-s" x="{xr}" y="{YM + 5}">得分 · 失败说明 · 行号</text>')
add(f'<text class="side-s" x="{xr}" y="{YM + 21}">据行号读取轨迹库中</text>')
add(f'<text class="side-s" x="{xr}" y="{YM + 36}">成功与失败的轨迹</text>')
xl = C1 - g * 0.7 - R - 14
add(f'<text class="side-t ac" x="{xl}" y="{YM - 4}" text-anchor="end">更好 → 升级</text>')
add(f'<text class="side-s ac" x="{xl}" y="{YM + 13}" text-anchor="end">否则保留 vN</text>')


# ── 站点 ─────────────────────────────────────────────
def station(cx, cy, kind, ic, name, step):
    out = []
    if kind == 'it':
        out.append(f'<circle class="halo" cx="{cx}" cy="{cy}" r="{SR + 7}"/>')
    out.append(f'<circle class="st {kind}" cx="{cx}" cy="{cy}" r="{SR}"/>')
    out.append(icon(ic, cx, cy, 15, 'ic ' + ('ink' if kind == 'gate' else 'wh')))
    top = cy < YM
    ny = cy - SR - 18 if top else cy + SR + 26
    sy = ny - 17 if top else ny + 16
    cls = ' ac' if kind == 'it' else ''
    out.append(f'<text class="st-n{cls}" x="{cx}" y="{ny}">{name}</text>')
    out.append(f'<text class="st-k{cls}" x="{cx}" y="{sy}">{step}</text>')
    return ''.join(out)


add(station(C1, YT, 'it', 'file', 'Skill vN', 'START'))
add(station(C2, YT, 'ag', 'bot', '执行 Agent', '01'))
add(station(C3, YT, 'ag', 'scale', 'Judge', '02'))
add(station(C3, YB, 'ag', 'search', 'Maintainer', '03'))
add(station(C2, YB, 'ag', 'pen', 'Reviser', '04'))
add(station(C1, YB, 'gate', 'shield', '验证把关', '05'))

# ── 上线后支路 ───────────────────────────────────────
O1, O2, O3 = C1, 535, 770
add(f'<path class="on" d="M{O1 + 8} {YON} H{O2 - 12}" marker-end="url(#ma)"/>')
add(f'<path class="on" d="M{O2 + 8} {YON} H{O3 - 12}" marker-end="url(#ma)"/>')
# 跨过底部轨道处断开轨道(桥)
add(f'<rect class="ko" x="{O3 - 5}" y="{YB - 3}" width="10" height="6"/>')
add(f'<path class="on" d="M{O3} {YON - 8} V{BY1 + 6}" marker-end="url(#ma)"/>')
add(f'<text class="on-l" x="{O3 - 10}" y="{BY1 + 36}" style="text-anchor:end">补进 benchmark</text>')
add(f'<text class="on-k" x="{O1 - 26}" y="{YON + 4}" text-anchor="end">上线后</text>')
for ox, name in [(O1, 'badcase'), (O2, '人工归因'), (O3, '新 rubric + 新用例')]:
    add(f'<circle class="on-st" cx="{ox}" cy="{YON}" r="5.5"/>')
    add(f'<text class="on-n" x="{ox}" y="{YON + 26}">{name}</text>')

defs = '''<defs>
  <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="7" class="hatch-ln"/></pattern>
  <marker id="mf" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk"/></marker>
  <marker id="ma" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk ac"/></marker>
  <marker id="ms" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M1 1.5 L9 5 L1 8.5 Z" class="mk soft"/></marker>
</defs>'''

ARIA = ('Skill 层一次迭代的信息流转:从 Skill vN 出发,执行 Agent 运行训练用例,执行完把轨迹写入轨迹库;'
        'Judge 从轨迹库读取轨迹,按 rubric 判定并给出得分、失败说明与行号;Maintainer 据行号读取成功与失败的轨迹,归纳根因写入经验库;'
        'Reviser 读取经验库修改出候选 vN+1,每次修改写入修改记录,被拒绝的也保留;验证把关在验证用例上比较,更好则升级,否则保留 vN。'
        '轨迹库、经验库、修改记录持续积累,不随回滚撤销;Benchmark 在本轮内冻结,分别供给训练用例、rubric 与验证用例。'
        '上线后每周:用户反馈的 badcase 经人工归因确认属于 Skill 层后,写出新 rubric,并提取典型 badcase 作为新用例,在迭代开始前按 3:1 补进 benchmark,验证用例中一定含有新用例;之后照常进入同一个循环。')


# ── 窄屏:同一套线路语言,纵向排列 ─────────────────────
# 主线竖排;benchmark 为右侧阴影竖栏,三格与所供给的站点同行;上线后支路自下而上接入。
MW = 360
LX, MR = 40, 15                                  # 主线 x、站点半径
MYS = [70, 172, 274, 390, 492, 610]              # START, 01..05
MBX0, MBX1, MBY0, MBY1 = 236, 354, 100, 670      # benchmark 竖栏
MCX0, MCW, MCH = 249, 92, 34                     # 三格
LN = 200                                         # 上线后支路 x
LY = {'new': 752, 'attr': 806, 'fb': 860}

m = []
madd = m.append


def name_end(text, fs=14):
    return LX + 24 + tw(text, fs)


# benchmark 竖栏
madd(f'<rect class="hatch-m" x="{MBX0}" y="{MBY0}" width="{MBX1 - MBX0}" height="{MBY1 - MBY0}"/>')
madd(icon('lock', MBX0 + 14, MBY0 + 18, 12, 'ic dim'))
madd(f'<text class="core-t" x="{MBX0 + 26}" y="{MBY0 + 22.5}">Benchmark</text>')
madd(f'<text class="core-k" x="{MBX0 + 8}" y="{MBY0 + 40}">本轮冻结</text>')
mcells = [(MYS[1], 'data', '训练用例', '3/4'), (MYS[2], 'rub', 'Rubric', ''), (MYS[5], 'data', '验证用例', '1/4')]
for cy, kind, t, s in mcells:
    y0 = cy - MCH / 2
    madd(f'<rect class="cell {kind}" x="{MCX0}" y="{y0}" width="{MCW}" height="{MCH}"/>')
    if kind == 'rub':
        madd(f'<rect class="bar" x="{MCX0}" y="{y0}" width="2.5" height="{MCH}"/>')
        madd(icon('checks', MCX0 + 17, cy, 12, 'ic acc'))
        madd(f'<text class="cell-t" x="{MCX0 + 29}" y="{cy + 4.5}">{t}</text>')
    else:
        madd(f'<text class="cell-t" x="{MCX0 + 11}" y="{cy + 4.5}">{t}</text>')
        madd(f'<text class="cell-s data-s" x="{MCX0 + MCW - 8}" y="{cy + 4}" text-anchor="end">{s}</text>')

# 三路供给:横向指向站名
for cy, nm in [(MYS[1], '执行 Agent'), (MYS[2], 'Judge'), (MYS[5], '验证把关')]:
    madd(f'<path class="supply" d="M{MCX0} {cy + 4} H{name_end(nm) + 10:.1f}" marker-end="url(#msm)"/>')
# 支路跨过「验证用例」供给线处挖空(桥)

# 主线
for i in range(5):
    ac = i == 4
    madd(f'<path class="flow{" ac" if ac else ""}" d="M{LX} {MYS[i] + MR + 5} V{MYS[i + 1] - MR - 5}" marker-end="url(#{"mam" if ac else "mfm"})"/>')
# 回线:05 → START
madd(f'<path class="flow ac" d="M{LX - MR - 4} {MYS[5]} H20 Q14 {MYS[5]} 14 {MYS[5] - 6} V{MYS[0] + 6} Q14 {MYS[0]} 20 {MYS[0]} H{LX - MR - 9}" marker-end="url(#mam)"/>')

# 线上的信息(写在主线右侧)
def mid(i):
    return (MYS[i] + MYS[i + 1]) / 2


madd(f'<text class="m-info mono" x="{LX + 24}" y="{mid(0) + 4}">SKILL.md</text>')
def mstore(cy, name, note):
    w = 30 + tw(name, 12) + 12
    x0 = LX + 22
    return (f'<rect class="store-bg" x="{x0}" y="{cy - 12}" width="{w:.1f}" height="24"/>'
            + icon('db', x0 + 16, cy, 12, 'ic store')
            + f'<text class="store-t" x="{x0 + 29}" y="{cy + 4.3:.1f}">{name}</text>'
            + f'<text class="m-info sm" x="{x0 + w + 8:.1f}" y="{cy + 4}">{note}</text>')


madd(mstore(mid(1), '轨迹库', '执行完写入'))
madd(f'<text class="m-info" x="{LX + 24}" y="{mid(2) - 14}">判定结果</text>')
madd(f'<text class="m-info sm" x="{LX + 24}" y="{mid(2) + 1}">得分 · 失败说明 · 行号</text>')
madd(f'<text class="m-info sm" x="{LX + 24}" y="{mid(2) + 16}">据行号读取成功与失败轨迹</text>')
madd(mstore(mid(3), '经验库', '成功与失败模式'))
madd(mstore(mid(4), '修改记录', '被拒绝的也保留'))


# 站点
def mstation(cy, kind, ic, nm, step):
    out = []
    if kind == 'it':
        out.append(f'<circle class="halo" cx="{LX}" cy="{cy}" r="{MR + 6}"/>')
    out.append(f'<circle class="st {kind}" cx="{LX}" cy="{cy}" r="{MR}"/>')
    out.append(icon(ic, LX, cy, 13, 'ic ' + ('ink' if kind == 'gate' else 'wh')))
    cls = ' ac' if kind == 'it' else ''
    out.append(f'<text class="m-k{cls}" x="{LX + 24}" y="{cy - 8}">{step}</text>')
    out.append(f'<text class="m-n{cls}" x="{LX + 24}" y="{cy + 10}">{nm}</text>')
    return ''.join(out)


for cy, kind, ic, nm, step in [(MYS[0], 'it', 'file', 'Skill vN', 'START'), (MYS[1], 'ag', 'bot', '执行 Agent', '01'),
                               (MYS[2], 'ag', 'scale', 'Judge', '02'), (MYS[3], 'ag', 'search', 'Maintainer', '03'),
                               (MYS[4], 'ag', 'pen', 'Reviser', '04'), (MYS[5], 'gate', 'shield', '验证把关', '05')]:
    madd(mstation(cy, kind, ic, nm, step))
madd(f'<text class="m-info ac" x="{LX + 24}" y="{MYS[5] + 38}">更好 → 升级为新的 vN</text>')
madd(f'<text class="m-info ac sm" x="{LX + 24}" y="{MYS[5] + 54}">否则保留 vN</text>')

# 上线后支路:自下而上
madd(f'<path class="on" d="M{LN} {LY["fb"] - 8} V{LY["attr"] + 10}" marker-end="url(#mam)"/>')
madd(f'<path class="on" d="M{LN} {LY["attr"] - 8} V{LY["new"] + 10}" marker-end="url(#mam)"/>')
madd(f'<path class="on" d="M{LN + 8} {LY["new"]} H{(MBX0 + MBX1) / 2 - 6} Q{(MBX0 + MBX1) / 2} {LY["new"]} {(MBX0 + MBX1) / 2} {LY["new"] - 6} V{MBY1 + 9}" marker-end="url(#mam)"/>')
madd(f'<text class="m-on-l" x="{(MBX0 + MBX1) / 2 - 8}" y="{LY["new"] - 30}" text-anchor="end">补进 benchmark</text>')
for key, nm in [('new', '新 rubric + 新用例'), ('attr', '人工归因'), ('fb', 'badcase')]:
    y = LY[key]
    madd(f'<circle class="on-st" cx="{LN}" cy="{y}" r="5"/>')
    madd(f'<text class="m-on-n" x="{LN - 14}" y="{y + 4}" text-anchor="end">{nm}</text>')
madd(f'<text class="on-k" x="{LN}" y="{LY["fb"] + 32}" text-anchor="middle">上线后</text>')

mdefs = '''<defs>
  <pattern id="hatchm" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="7" class="hatch-ln"/></pattern>
  <marker id="mfm" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk"/></marker>
  <marker id="mam" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M1 1.2 L9 5 L1 8.8 Z" class="mk ac"/></marker>
  <marker id="msm" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M1 1.5 L9 5 L1 8.5 Z" class="mk soft"/></marker>
</defs>'''
MH = LY['fb'] + 44
mobile = f'<svg viewBox="0 30 {MW} {MH - 30}" role="img" aria-label="{ARIA}">{mdefs}{"".join(m)}</svg>'


html = f'''<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Skill 层自迭代</title>
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
  .store-bg {{ fill: #e4e7ec; }}
  .store-t {{ font-size: 12px; font-weight: 500; fill: var(--ink); }}
  .store-s {{ font-size: 10.5px; fill: var(--text-dim); text-anchor: middle; }}
  .ic.store {{ color: var(--text-dim); }}
  .data-s {{ fill: var(--data-ink); }}
  .ic.data {{ color: var(--data-ink); }}
  .bar.data {{ fill: var(--data-ink); opacity: .55; }}
  .supply {{ fill: none; stroke: var(--supply); stroke-width: 1.2; stroke-dasharray: 2 3; }}

  .st {{ stroke: none; }}
  .st.ag {{ fill: var(--ink); }}
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
  .lg-flow {{ width: 22px; height: 1.6px; background: var(--track); }}
  .lg-frozen {{ width: 20px; height: 12px; background: repeating-linear-gradient(45deg, #f1f2f5 0 3px, #e3e5ea 3px 5px); }}
  .lg-rub {{ width: 20px; height: 12px; background: #fff; box-shadow: inset 2.5px 0 0 var(--accent); }}
  .lg-data {{ width: 20px; height: 12px; background: var(--data); box-shadow: inset 0 0 0 1px #e3e5ea; }}
  .lg-store {{ width: 20px; height: 12px; background: #e4e7ec; }}
  .lg-on {{ width: 22px; height: 0; border-top: 1.3px dashed var(--accent); }}
  figcaption {{ margin-top: 12px; text-align: center; font-size: 12.5px; line-height: 1.7; color: var(--text-dim); }}

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
    <svg viewBox="70 44 1010 420" role="img" aria-label="{ARIA}">
      {defs}
      {''.join(svg)}
    </svg>
  </div>
  <div class="m">{mobile}</div>

  <div class="legend">
    <span><i class="lg-it"></i>迭代对象</span>
    <span><i class="lg-ag"></i>Agent</span>
    <span><i class="lg-flow"></i>流转的信息</span>
    <span><i class="lg-store"></i>持续积累</span>
    <span><i class="lg-frozen"></i>本轮冻结</span>
    <span><i class="lg-rub"></i>Rubric</span>
    <span><i class="lg-data"></i>测试数据</span>
    <span><i class="lg-on"></i>上线后</span>
  </div>
</figure>
</body>
</html>
'''

with open(OUT, 'w') as f:
    f.write(html)
print('wrote', OUT)
