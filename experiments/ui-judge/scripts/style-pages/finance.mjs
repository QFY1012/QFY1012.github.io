// 2026 年 9 月财务月报 in five styles: annual-report print, ledger statement,
// Swiss grid poster, soft pastel cards, spreadsheet export.
import { readData, doc, esc, num, bars, line, pct } from "../style-kit.mjs"

const f = readData("finance")
const K = Object.fromEntries(f.kpis.map((k) => [k.key, k]))
const M = f.monthly
const U = f.units
const E = f.expenses
const R = f.receivables
const sum = (xs, k) => xs.reduce((a, x) => a + x[k], 0)
const uRev = sum(U, "revenue"), uBud = sum(U, "budget")
const uAtt = (uRev / uBud) * 100
const eTot = sum(E, "value"), eBud = sum(E, "budget")
const eAtt = (eTot / eBud) * 100
const eRatio = (eTot / uRev) * 100
const kv = (k) => (k.value >= 1000 ? num(k.value) : String(k.value))
const good = (k) => k.direction === "up"
const mom = M.map((m, i) => (i ? (m.revenue / M[i - 1].revenue - 1) * 100 : null))
const ytd = M.filter((m) => m.month.startsWith("2026")).reduce((a, m) => a + m.revenue, 0)
const cum = (() => { let c = 0; return M.map((m) => (c += m.cash)) })()
const signed = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + num(Math.abs(v))
const revPts = M.map((m) => ({ x: m.label, y: m.revenue }))
const marPts = M.map((m) => ({ x: m.label, y: m.margin }))

// vertical columns; negatives hang below zero
function cols({ w, h, data, ticks, pad = [16, 12, 26, 44], color = "#111", negColor, hi, hiColor, grid = "#e5e5e5", text = "#888", font = "inherit", size = 12, bw = 0.62, values = false, fmt = num, valueColor, axis = true, rx = 0, baseColor }) {
  const [pt, pr, pb, pl] = pad, lo = ticks[0], top = ticks[ticks.length - 1]
  const y = (v) => pt + (1 - (v - lo) / (top - lo)) * (h - pt - pb)
  const slot = (w - pl - pr) / data.length
  const base = y(Math.max(lo, Math.min(0, top)))
  const g = ticks.map((v) => `<line x1="${pl}" x2="${w - pr}" y1="${y(v)}" y2="${y(v)}" stroke="${grid}"/>` + (axis ? `<text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>` : "")).join("")
  const b = data.map((d, i) => {
    const x = pl + slot * i + (slot * (1 - bw)) / 2, yv = y(d.y), t = Math.min(yv, base), hh = Math.abs(base - yv)
    const c = d.y < 0 && negColor ? negColor : hi != null && hi === i ? hiColor : (d.color ?? color)
    const lab = values ? `<text x="${(x + (slot * bw) / 2).toFixed(1)}" y="${(d.y < 0 ? base + hh + 14 : yv - 6).toFixed(1)}" text-anchor="middle" style="fill:${(typeof valueColor === "function" ? valueColor(d, i) : valueColor) ?? text}">${fmt(d.y)}</text>` : ""
    return `<rect x="${x.toFixed(1)}" y="${t.toFixed(1)}" width="${(slot * bw).toFixed(1)}" height="${Math.max(hh, 0.5).toFixed(1)}" rx="${rx}" fill="${c}"/>${lab}`
  }).join("")
  const xl = data.map((d, i) => `<text x="${(pl + slot * (i + 0.5)).toFixed(1)}" y="${h - 6}" text-anchor="middle">${esc(d.x)}</text>`).join("")
  const z = lo < 0 ? `<line x1="${pl}" x2="${w - pr}" y1="${base}" y2="${base}" stroke="${baseColor ?? text}"/>` : ""
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;font-family:${font};font-size:${size}px;fill:${text}">${g}${b}${z}${xl}</svg>`
}

// ring (or pie, when t ≈ 2r) of shares
function ring({ size = 200, r = 76, t = 26, items, colors, gap = 0, center = "" }) {
  const C = 2 * Math.PI * r, c = size / 2
  let off = 0
  const segs = items.map((it, i) => {
    const len = (C * it.share) / 100
    const s = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${colors[i]}" stroke-width="${t}" stroke-dasharray="${Math.max(len - gap, 0.1).toFixed(2)} ${(C - len + gap).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${c} ${c})"/>`
    off += len
    return s
  }).join("")
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block">${segs}${center}</svg>`
}

// ======================================================================
// A — annual-report print: centered serif masthead, numbered chapters,
// figure captions, hairline tables, one oxblood accent on cream paper.
// ======================================================================
function pageA() {
  const ink = "#24211d", mute = "#7a7266", acc = "#8a2e22", grn = "#2f5a44", rule = "#d3c9b8"
  const css = `
body{background:#f3eee4;color:${ink};font-family:"Noto Serif SC",serif}
.page{width:1040px;margin:0 auto;padding:78px 0 70px}
.co{text-align:center;font:500 13px "Noto Sans SC";letter-spacing:.32em;color:${mute}}
.title{text-align:center;font-size:46px;font-weight:600;letter-spacing:.06em;margin:20px 0 12px}
.per{text-align:center;font:400 14px "Noto Sans SC";color:${mute};letter-spacing:.08em}
.dbl{border-top:3px double ${ink};margin-top:34px}
.kick{text-align:center;font:500 12px "Noto Sans SC";letter-spacing:.42em;color:${acc};margin-top:42px}
.lead{width:820px;margin:18px auto 0;font-size:17px;line-height:2.05;text-align:justify}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid ${ink};border-bottom:1px solid ${ink};margin-top:50px}
.kpi{text-align:center;padding:28px 12px 26px}
.kpi+.kpi{border-left:1px solid ${rule}}
.kpi .l{font:400 13px "Noto Sans SC";color:${mute};letter-spacing:.12em}
.kpi .v{font-size:44px;font-weight:600;margin:12px 0 8px;line-height:1}
.kpi .v small{font-size:16px;font-weight:400;margin-left:4px;color:${mute}}
.kpi .c{font:400 13px "Noto Sans SC"}
.good{color:${grn}}.bad{color:${acc}}
h2{display:flex;align-items:baseline;gap:16px;font-size:26px;font-weight:600;margin:76px 0 0;padding-bottom:12px;border-bottom:1px solid ${ink}}
h2 b{color:${acc};font-weight:600}
h2 span{margin-left:auto;font:400 13px "Noto Sans SC";color:${mute}}
.sub{font-size:15px;line-height:1.95;color:#4a453d;margin:18px 0 28px;width:860px}
figure{margin:0}
figcaption{font:400 13px "Noto Sans SC";color:${mute};margin-top:8px;padding-top:8px;border-top:1px solid ${rule}}
figcaption b{color:${ink};font-weight:500;margin-right:10px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:56px;margin-top:44px}
table{font-size:15px}
th{font:500 13px "Noto Sans SC";color:${mute};text-align:right;padding:10px 12px;border-bottom:1px solid ${ink}}
th:first-child,td:first-child{text-align:left;padding-left:0}
td{padding:14px 12px;text-align:right;border-bottom:1px solid ${rule};font-variant-numeric:tabular-nums}
tr.tot td{border-top:1px solid ${ink};border-bottom:3px double ${ink};font-weight:600}
.note{font:400 12px "Noto Sans SC";color:${mute};margin-top:12px;line-height:1.7}
.exp{display:grid;grid-template-columns:560px 1fr;gap:64px;align-items:start}
.er{display:grid;grid-template-columns:72px 1fr 64px 64px;gap:14px;align-items:center;padding:13px 0;border-bottom:1px solid ${rule};font-size:15px}
.er.h{font:500 12px "Noto Sans SC";color:${mute};border-bottom:1px solid ${ink};padding:8px 0}
.er .n{text-align:right;font-variant-numeric:tabular-nums}
.trk{position:relative;height:10px;background:#e6dfd2}
.trk i{position:absolute;inset:0 auto 0 0;background:${ink}}
.trk u{position:absolute;top:-5px;bottom:-5px;width:2px;background:${acc}}
.state{font-size:30px;line-height:1.55;font-weight:600}
.state em{font-style:normal;color:${acc}}
.shares{margin-top:26px;display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid ${rule}}
.shares div{padding:12px 0 0;font:400 13px "Noto Sans SC";color:${mute}}
.shares b{display:block;font:600 22px "Noto Serif SC";color:${ink};margin-top:4px}
.cash{display:grid;grid-template-columns:640px 1fr;gap:56px;align-items:start}
dl{display:grid;grid-template-columns:1fr auto;border-top:1px solid ${ink}}
dt,dd{padding:15px 0;border-bottom:1px solid ${rule};font-size:15px}
dt{color:#4a453d}
dd{text-align:right;font-weight:600;font-variant-numeric:tabular-nums}
dd small{font:400 12px "Noto Sans SC";color:${mute};margin-left:4px}
.finds{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:30px}
.finds div{border-top:2px solid ${ink};padding-top:16px}
.finds .no{font:500 12px "Noto Sans SC";color:${acc};letter-spacing:.2em}
.finds h3{font-size:19px;font-weight:600;margin:8px 0 10px}
.finds p{font-size:15px;line-height:1.9;color:#4a453d;text-align:justify}
h4{font:500 13px "Noto Sans SC";letter-spacing:.3em;color:${mute};margin:52px 0 0}
.acts td{text-align:left;vertical-align:top;line-height:1.8}
.acts td.i{width:44px;color:${acc};font-weight:600}
.acts td.o{width:200px;font:400 13px/1.9 "Noto Sans SC";color:${mute}}
.acts td.d{width:120px;text-align:right;font:400 13px/1.9 "Noto Sans SC"}
.risks{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:22px}
.risk{border-left:3px solid ${acc};padding:4px 0 4px 22px}
.risk .lv{font:500 12px "Noto Sans SC";color:${acc};letter-spacing:.15em}
.risk h3{font-size:18px;font-weight:600;margin:6px 0 8px}
.risk p{font-size:15px;line-height:1.9;color:#4a453d;text-align:justify}
.foot{margin-top:80px;padding-top:16px;border-top:3px double ${ink};display:flex;justify-content:space-between;font:400 12px "Noto Sans SC";color:${mute};letter-spacing:.06em}
`
  const kpis = f.kpis.map((k) => `<div class="kpi"><div class="l">${esc(k.label)}</div><div class="v">${kv(k)}<small>${esc(k.unit)}</small></div><div class="c ${good(k) ? "good" : "bad"}">${esc(k.note)} ${esc(k.change)}</div></div>`).join("")
  const unitRows = U.map((u) => `<tr><td>${esc(u.name)}</td><td>${num(u.revenue)}</td><td>${num(u.budget)}</td><td class="${u.revenue < u.budget ? "bad" : ""}">${signed(u.revenue - u.budget)}</td><td class="${u.attain < 100 ? "bad" : ""}">${u.attain.toFixed(1)}%</td><td>${u.margin.toFixed(1)}%</td><td>${esc(u.yoy)}</td></tr>`).join("")
  const maxE = 1400
  const exp = E.map((e) => `<div class="er"><span>${esc(e.name)}</span><div class="trk"><i style="width:${(e.value / maxE) * 100}%"></i><u style="left:${(e.budget / maxE) * 100}%"></u></div><span class="n">${num(e.value)}</span><span class="n ${e.attain > 100 ? "bad" : ""}">${e.attain.toFixed(1)}%</span></div>`).join("")
  const body = `<div class="page">
<div class="co">${esc(f.org)}</div>
<h1 class="title">${esc(f.title)}</h1>
<div class="per">报告期间 ${esc(f.period)}　·　单位：人民币</div>
<div class="dbl"></div>
<div class="kick">致 管 理 层</div>
<p class="lead">${esc(f.summary)}</p>
<div class="kpis">${kpis}</div>

<h2><b>一</b>收入与盈利<span>单位：万元 / %</span></h2>
<p class="sub">9 月营业收入 ${num(M[11].revenue)} 万元，为年内单月最高，仅次于去年 12 月的年末结算高点；2026 年 1—9 月累计收入 ${num(ytd)} 万元。毛利率自 8 月低点回升，主要得益于工业机器人高毛利机型出货占比提高。</p>
<figure>${line({ w: 1040, h: 300, points: revPts, ticks: [8000, 10000, 12000, 14000, 16000], stroke: ink, grid: "#ddd4c4", text: mute, fill: "rgba(138,46,34,.06)", font: "Noto Sans SC", size: 12, last: num(M[11].revenue), pad: [18, 24, 26, 52], width: 2, dots: true })}
<figcaption><b>图 1</b>近十二个月营业收入（2025 年 10 月—2026 年 9 月）</figcaption></figure>
<div class="two">
<figure>${line({ w: 492, h: 210, points: marPts, ticks: [31, 32, 33, 34, 35, 36], stroke: acc, grid: "#ddd4c4", text: mute, font: "Noto Sans SC", size: 12, xEvery: 2, last: `${M[11].margin}%`, pad: [16, 16, 24, 36] })}
<figcaption><b>图 2</b>综合毛利率（%）</figcaption></figure>
<figure>${cols({ w: 492, h: 210, data: M.slice(1).map((m, i) => ({ x: m.label, y: +mom[i + 1].toFixed(1) })), ticks: [-40, -20, 0, 20, 40], color: "#6d665b", negColor: acc, grid: "#ddd4c4", text: mute, font: "Noto Sans SC", size: 12, pad: [14, 8, 24, 40], bw: 0.5, baseColor: ink })}
<figcaption><b>图 3</b>营业收入环比变化（%）</figcaption></figure>
</div>

<h2><b>二</b>分事业部预算执行<span>单位：万元</span></h2>
<p class="sub">五个事业部合计实现收入 ${num(uRev)} 万元，月度预算完成率 ${uAtt.toFixed(1)}%。自动化产线事业部受两个项目验收推迟影响，完成率仅 89.4%，毛利率亦为各事业部最低。</p>
<table><thead><tr><th>事业部</th><th>本月收入</th><th>月度预算</th><th>差异</th><th>完成率</th><th>毛利率</th><th>同比增长</th></tr></thead>
<tbody>${unitRows}<tr class="tot"><td>合计</td><td>${num(uRev)}</td><td>${num(uBud)}</td><td class="bad">${signed(uRev - uBud)}</td><td>${uAtt.toFixed(1)}%</td><td>${K.margin.value}%</td><td>${K.revenue.change}</td></tr></tbody></table>
<p class="note">注：完成率 = 本月收入 ÷ 月度预算；差异为负表示未达预算。各事业部毛利率按事业部口径核算，合计行为公司综合毛利率。</p>

<h2><b>三</b>期间费用<span>单位：万元</span></h2>
<div class="exp" style="margin-top:28px">
<div><div class="er h"><span>科目</span><span>实际（竖线为预算）</span><span class="n">实际</span><span class="n">执行率</span></div>${exp}</div>
<div><p class="state">期间费用合计 ${num(eTot)} 万元，占收入 ${eRatio.toFixed(1)}%，预算执行率 <em>${eAtt.toFixed(1)}%</em>。</p>
<p class="sub" style="width:auto;margin:16px 0 0">超支集中在销售费用，其余三项均控制在预算以内。</p>
<div class="shares">${E.map((e) => `<div>${esc(e.name)}<b>${e.share.toFixed(1)}%</b></div>`).join("")}</div></div>
</div>

<h2><b>四</b>现金流与应收账款<span>单位：万元</span></h2>
<div class="cash" style="margin-top:30px">
<figure>${cols({ w: 640, h: 260, data: M.map((m) => ({ x: m.label, y: m.cash })), ticks: [-1000, 0, 1000, 2000, 3000, 4000], color: "#6d665b", negColor: acc, hi: 11, hiColor: ink, grid: "#ddd4c4", text: mute, font: "Noto Sans SC", size: 12, pad: [14, 8, 26, 50], bw: 0.56, baseColor: ink })}
<figcaption><b>图 4</b>经营活动现金净流量；1—2 月为春节前集中付款期</figcaption></figure>
<dl>
<dt>本月经营现金净流入</dt><dd>${num(K.cash.value)}<small>万元</small></dd>
<dt>本月回款</dt><dd>${num(R.collected)}<small>万元</small></dd>
<dt>应收账款余额</dt><dd>${(R.balance / 1e4).toFixed(2)}<small>亿元</small></dd>
<dt>较上月增加</dt><dd class="bad">${num(R.change)}<small>万元</small></dd>
<dt>账龄 90 天以上占比</dt><dd class="bad">${R.over90}<small>%</small></dd>
<dt>应收周转天数</dt><dd>${R.dso}<small>天</small></dd>
</dl>
</div>

<h2><b>五</b>主要发现与后续安排</h2>
<div class="finds">${f.findings.map((x, i) => `<div><div class="no">发现 ${"一二三"[i]}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div>`).join("")}</div>
<h4>后续行动</h4>
<table class="acts" style="margin-top:8px"><tbody>${f.actions.map((a, i) => `<tr><td class="i">${i + 1}.</td><td>${esc(a.text)}</td><td class="o">${esc(a.owner)}</td><td class="d">${esc(a.due)}前</td></tr>`).join("")}</tbody></table>
<h4>风险提示</h4>
<div class="risks">${f.risks.map((r) => `<div class="risk"><div class="lv">风险等级 · ${esc(r.level)}</div><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p></div>`).join("")}</div>

<div class="foot"><span>${esc(f.org)}</span><span>本报告数据为管理口径，未经审计</span><span>2026 年 10 月 10 日</span></div>
</div>`
  return doc(css, body)
}

// ======================================================================
// B — ledger / statement: report number block, monospace figures,
// accounting parentheses for negatives, ruled rows, review stamp, sign-off.
// ======================================================================
function pageB() {
  const g = "#24553f", ink = "#1f2a24", mute = "#5f6f64", red = "#b3261e", line_ = "#c9d6c6"
  const acct = (v) => (v < 0 ? `<span class="neg">(${num(-v)})</span>` : num(v))
  const css = `
body{background:#e4eae1;color:${ink};font-family:"Noto Sans SC",sans-serif;font-size:14px}
.sheet{width:1160px;margin:44px auto;background:#fbfcf7;border:1px solid #b7c5b3;box-shadow:0 2px 0 #d3dccf,0 4px 0 #c6d1c2;position:relative}
.mono,td.n,th.n{font-family:"IBM Plex Mono",monospace}
.head{display:grid;grid-template-columns:1fr 400px;gap:40px;padding:36px 44px 26px;border-bottom:3px double ${g}}
.org{font-size:13px;color:${mute};letter-spacing:.08em}
h1{font-size:30px;font-weight:600;color:${g};margin:8px 0 6px;letter-spacing:.04em}
.sub{color:${mute};font-size:13px}
.meta{font-size:12.5px;border:1px solid ${line_}}
.meta td{padding:6px 12px;border-bottom:1px dotted ${line_}}
.meta td:first-child{color:${mute};width:112px;white-space:nowrap;background:#f1f5ee}
.meta tr:last-child td{border-bottom:0}
.sec{padding:26px 44px 6px}
h2{font-size:15px;font-weight:600;color:${g};display:flex;align-items:center;gap:10px;margin-bottom:12px}
h2::after{content:"";flex:1;border-top:1px solid ${line_}}
.memo{border-left:4px solid ${g};background:#f0f5ec;padding:14px 18px;line-height:1.9;font-size:14px}
table.l{font-size:13.5px}
table.l th{background:#e9f0e5;color:${g};font-weight:500;font-size:12.5px;padding:8px 10px;text-align:left;border-top:1px solid ${g};border-bottom:1px solid ${g}}
table.l th.n{text-align:right;font-family:"Noto Sans SC"}
table.l td{padding:7px 10px;border-bottom:1px solid ${line_}}
table.l td.n{text-align:right}
table.l tr:nth-child(even) td{background:#f5f8f2}
table.l tr.tot td{font-weight:600;border-top:1px solid ${ink};border-bottom:3px double ${ink};background:#fbfcf7}
.neg{color:${red}}
.sum{display:grid;grid-template-columns:1fr 1fr;gap:0 40px}
.row{display:flex;align-items:baseline;gap:8px;padding:9px 0;border-bottom:1px dotted #9fb39b}
.row .lab{white-space:nowrap}
.row .dots{flex:1}
.row .val{font-family:"IBM Plex Mono";font-size:18px;font-weight:500}
.row .u{color:${mute};font-size:12px;width:34px}
.row .chg{font-family:"IBM Plex Mono";font-size:12.5px;width:96px;text-align:right}
.up{color:${g}}
.chart{border:1px solid ${line_};padding:10px 12px 6px;margin-bottom:14px;background:#fff}
.chart .t{font-size:12.5px;color:${mute};margin-bottom:4px;display:flex;justify-content:space-between}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.stack{display:flex;height:22px;border:1px solid ${g};margin:12px 0 6px}
.stack div{height:100%}
.legend{display:flex;gap:22px;font-size:12.5px;color:${mute}}
.legend i{display:inline-block;width:10px;height:10px;margin-right:6px;vertical-align:-1px}
ol.notes{list-style:none;counter-reset:n}
ol.notes li{counter-increment:n;display:grid;grid-template-columns:64px 150px 1fr;gap:10px;padding:9px 0;border-bottom:1px solid ${line_};line-height:1.75}
ol.notes li::before{content:"附注 " counter(n);font-family:"IBM Plex Mono";font-size:12.5px;color:${g}}
ol.notes b{font-weight:600}
.stamp{position:absolute;right:470px;top:26px;width:132px;height:132px;border:3px solid rgba(179,38,30,.72);border-radius:50%;color:rgba(179,38,30,.78);display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-14deg);font-weight:600;font-size:14px;line-height:1.5;letter-spacing:.08em}
.stamp::before{content:"";position:absolute;inset:5px;border:1px solid rgba(179,38,30,.6);border-radius:50%}
.stamp b{font-size:20px}
.stamp span{font-family:"IBM Plex Mono";font-size:11px;font-weight:500}
.sign{display:grid;grid-template-columns:repeat(4,1fr);gap:30px;padding:34px 44px 38px;margin-top:22px;border-top:3px double ${g};font-size:13px;color:${mute}}
.sign div{border-bottom:1px solid ${ink};padding-bottom:22px}
.lvl{display:inline-block;font-size:12px;padding:0 6px;border:1px solid ${red};color:${red};margin-right:8px}
`
  const sumRows = f.kpis.map((k) => `<div class="row"><span class="lab">${esc(k.label)}</span><span class="dots"></span><span class="val">${kv(k)}</span><span class="u">${esc(k.unit)}</span><span class="chg ${good(k) ? "up" : "neg"}">${esc(k.change)}</span></div>`).join("")
  const monthRows = M.map((m, i) => `<tr><td class="n" style="text-align:left">${m.month}</td><td class="n">${num(m.revenue)}</td><td class="n">${mom[i] == null ? "—" : mom[i] < 0 ? `<span class="neg">(${Math.abs(mom[i]).toFixed(1)}%)</span>` : mom[i].toFixed(1) + "%"}</td><td class="n">${m.margin.toFixed(1)}%</td><td class="n">${acct(m.cash)}</td><td class="n">${acct(cum[i])}</td></tr>`).join("")
  const unitRows = U.map((u) => `<tr><td>${esc(u.name)}</td><td class="n">${num(u.budget)}</td><td class="n">${num(u.revenue)}</td><td class="n">${acct(u.revenue - u.budget)}</td><td class="n">${u.attain.toFixed(1)}%</td><td class="n">${u.margin.toFixed(1)}%</td><td class="n">${esc(u.yoy.replace("+", ""))}</td></tr>`).join("")
  const expRows = E.map((e) => `<tr><td>${esc(e.name)}</td><td class="n">${num(e.budget)}</td><td class="n">${num(e.value)}</td><td class="n">${acct(e.budget - e.value)}</td><td class="n">${e.attain.toFixed(1)}%</td><td class="n">${e.share.toFixed(1)}%</td></tr>`).join("")
  const ec = [g, "#6c9a7f", "#a9c4ad", "#d9a441"]
  const body = `<div class="sheet">
<div class="head"><div><div class="org">${esc(f.org)}</div><h1>${esc(f.title)}</h1><div class="sub">管理报表 · 月度经营与资金情况</div></div>
<table class="meta mono"><tr><td>报告编号</td><td>CC-FIN-2026-09</td></tr><tr><td>报告期间</td><td>2026-09-01 至 2026-09-30</td></tr><tr><td>币种 / 单位</td><td>人民币 / 万元</td></tr><tr><td>编制日期</td><td>2026-10-10</td></tr></table></div>
<div class="stamp"><span>CC-FIN</span><b>已复核</b>财务管理部<span>2026.10.10</span></div>

<div class="sec"><h2>本期摘要</h2><div class="memo">${esc(f.summary)}</div></div>
<div class="sec"><h2>主要指标</h2><div class="sum">${sumRows}</div></div>

<div class="sec"><h2>一、月度收入及经营现金流</h2>
<div class="grid2">
<div class="chart"><div class="t"><span>营业收入走势</span><span class="mono">万元</span></div>${line({ w: 508, h: 190, points: revPts, ticks: [8000, 10000, 12000, 14000, 16000], stroke: g, grid: "#e3eadf", text: mute, font: "IBM Plex Mono", size: 11, xEvery: 1, pad: [14, 14, 22, 48], width: 1.5, dots: true, last: num(M[11].revenue) })}</div>
<div class="chart"><div class="t"><span>经营活动现金净流量</span><span class="mono">万元</span></div>${cols({ w: 508, h: 190, data: M.map((m) => ({ x: m.label, y: m.cash })), ticks: [-1000, 0, 1000, 2000, 3000, 4000], color: "#6c9a7f", negColor: red, grid: "#e3eadf", text: mute, font: "IBM Plex Mono", size: 11, pad: [12, 6, 22, 48], bw: 0.55 })}</div>
</div>
<table class="l"><thead><tr><th>月份</th><th class="n">营业收入</th><th class="n">环比</th><th class="n">综合毛利率</th><th class="n">经营现金净流</th><th class="n">累计现金净流</th></tr></thead><tbody>${monthRows}
<tr class="tot"><td>近 12 个月合计</td><td class="n">${num(sum(M, "revenue"))}</td><td class="n"></td><td class="n"></td><td class="n">${num(sum(M, "cash"))}</td><td class="n"></td></tr></tbody></table></div>

<div class="sec"><h2>二、分事业部收入与预算执行（2026 年 9 月）</h2>
<table class="l"><thead><tr><th>事业部</th><th class="n">月度预算</th><th class="n">本月实际</th><th class="n">差异</th><th class="n">完成率</th><th class="n">毛利率</th><th class="n">同比增长</th></tr></thead><tbody>${unitRows}
<tr class="tot"><td>合计</td><td class="n">${num(uBud)}</td><td class="n">${num(uRev)}</td><td class="n">${acct(uRev - uBud)}</td><td class="n">${uAtt.toFixed(1)}%</td><td class="n">${K.margin.value}%</td><td class="n">${K.revenue.change.replace("+", "")}</td></tr></tbody></table></div>

<div class="sec"><h2>三、期间费用</h2>
<table class="l"><thead><tr><th>科目</th><th class="n">月度预算</th><th class="n">本月实际</th><th class="n">预算结余</th><th class="n">执行率</th><th class="n">构成占比</th></tr></thead><tbody>${expRows}
<tr class="tot"><td>合计</td><td class="n">${num(eBud)}</td><td class="n">${num(eTot)}</td><td class="n">${acct(eBud - eTot)}</td><td class="n">${eAtt.toFixed(1)}%</td><td class="n">100.0%</td></tr></tbody></table>
<div class="stack">${E.map((e, i) => `<div style="width:${e.share}%;background:${ec[i]}"></div>`).join("")}</div>
<div class="legend">${E.map((e, i) => `<span><i style="background:${ec[i]}"></i>${esc(e.name)} ${e.share.toFixed(1)}%</span>`).join("")}<span style="margin-left:auto">期间费用率 <b class="mono">${eRatio.toFixed(1)}%</b></span></div></div>

<div class="sec"><h2>四、应收账款</h2>
<div class="sum">
<div class="row"><span class="lab">期末应收账款余额</span><span class="dots"></span><span class="val">${num(R.balance)}</span><span class="u">万元</span><span class="chg neg">+${num(R.change)}</span></div>
<div class="row"><span class="lab">本月回款</span><span class="dots"></span><span class="val">${num(R.collected)}</span><span class="u">万元</span><span class="chg"></span></div>
<div class="row"><span class="lab">账龄 90 天以上占比</span><span class="dots"></span><span class="val">${R.over90}</span><span class="u">%</span><span class="chg"></span></div>
<div class="row"><span class="lab">应收周转天数</span><span class="dots"></span><span class="val">${R.dso}</span><span class="u">天</span><span class="chg neg">${esc(K.dso.change)}</span></div>
</div></div>

<div class="sec"><h2>五、附注及后续事项</h2>
<ol class="notes">${f.findings.map((x) => `<li><b>${esc(x.title)}</b><span>${esc(x.text)}</span></li>`).join("")}</ol>
<table class="l" style="margin-top:18px"><thead><tr><th style="width:56px">序号</th><th>后续事项</th><th style="width:200px">责任部门</th><th style="width:110px">完成时限</th></tr></thead><tbody>${f.actions.map((a, i) => `<tr><td class="n" style="text-align:left">${String(i + 1).padStart(2, "0")}</td><td>${esc(a.text)}</td><td>${esc(a.owner)}</td><td>${esc(a.due)}</td></tr>`).join("")}</tbody></table>
<div style="margin-top:18px">${f.risks.map((r) => `<div style="padding:9px 0;border-bottom:1px solid ${line_};line-height:1.75"><span class="lvl">风险 · ${esc(r.level)}</span><b>${esc(r.title)}：</b>${esc(r.text)}</div>`).join("")}</div></div>

<div class="sign"><div>编制人：</div><div>复核人：</div><div>财务负责人：</div><div>日期：2026 年 10 月 10 日</div></div>
</div>`
  return doc(css, body)
}

// ======================================================================
// C — Swiss grid poster: 12-column grid, heavy black rules, one red,
// giant numerals, columns-as-units, block bar for cost structure.
// ======================================================================
function pageC() {
  const red = "#e1251b", ink = "#0d0d0d", mute = "#6b6b6b"
  const css = `
body{background:#fff;color:${ink};font-family:"Noto Sans SC",sans-serif}
.w{width:1200px;margin:0 auto;padding:56px 0 64px}
.g{display:grid;grid-template-columns:repeat(12,1fr);column-gap:24px}
.hero .big{grid-column:1/8;font-size:220px;font-weight:600;line-height:.8;letter-spacing:-.04em;color:${red}}
.hero .big small{font-size:44px;letter-spacing:0;margin-left:10px;color:${ink}}
.hero .t{grid-column:8/13;align-self:end}
.hero h1{font-size:44px;font-weight:600;line-height:1.15;letter-spacing:-.01em}
.hero .m{font-size:14px;color:${mute};margin-top:16px;line-height:1.8}
.cap{grid-column:1/8;font-size:15px;margin-top:26px;font-weight:500}
.cap b{color:${red}}
.bar8{height:10px;background:${ink};margin:30px 0 0}
.intro{margin-top:30px}
.intro p{grid-column:1/8;font-size:20px;line-height:1.75;font-weight:400}
.intro .ks{grid-column:9/13;display:flex;flex-direction:column}
.k{border-top:2px solid ${ink};padding:10px 0 16px;display:grid;grid-template-columns:1fr auto;align-items:end}
.k .l{font-size:13px;color:${mute};grid-column:1/3}
.k .v{font-size:46px;font-weight:600;line-height:1.1;letter-spacing:-.02em}
.k .v small{font-size:16px;font-weight:500;margin-left:4px}
.k .c{font-size:14px;font-weight:500;padding-bottom:8px}
.r{color:${red}}
.sh{display:flex;align-items:baseline;gap:20px;border-top:2px solid ${ink};margin-top:72px;padding-top:12px}
.sh .no{font-size:64px;font-weight:600;color:${red};line-height:1;letter-spacing:-.03em}
.sh h2{font-size:28px;font-weight:600}
.sh span{margin-left:auto;font-size:13px;color:${mute}}
.blk{margin-top:28px}
.rev{grid-column:1/9}
.side{grid-column:9/13}
.side .k:first-child{border-top-width:2px}
.lab{font-size:13px;color:${mute};margin-bottom:10px}
.units{margin-top:28px}
.unit{grid-column:span 12;}
.u5{display:grid;grid-template-columns:repeat(5,1fr);column-gap:24px;margin-top:28px}
.u{border-top:6px solid ${ink};padding-top:14px}
.u.miss{border-top-color:${red}}
.u h3{font-size:18px;font-weight:600}
.u .rv{font-size:44px;font-weight:600;letter-spacing:-.02em;margin-top:18px;line-height:1}
.u .rv small{font-size:14px;font-weight:500;margin-left:3px}
.u .bd{font-size:13px;color:${mute};margin-top:8px}
.at{margin-top:22px;font-size:13px;color:${mute}}
.at b{display:block;font-size:28px;color:${ink};font-weight:600;letter-spacing:-.01em}
.u.miss .at b{color:${red}}
.trk{position:relative;height:8px;background:#e6e6e6;margin-top:10px}
.trk i{position:absolute;left:0;top:0;bottom:0;background:${ink}}
.u.miss .trk i{background:${red}}
.trk u{position:absolute;left:${(100 / 120) * 100}%;top:-6px;bottom:-6px;width:2px;background:${ink}}
.u dl{display:grid;grid-template-columns:1fr auto;margin-top:22px;font-size:14px}
.u dt,.u dd{padding:8px 0;border-top:1px solid #d6d6d6}
.u dt{color:${mute}}
.u dd{font-weight:600;text-align:right}
.blocks{display:flex;height:150px;margin-top:28px;gap:4px}
.blocks div{color:#fff;padding:14px 16px;font-size:34px;font-weight:600;letter-spacing:-.02em;display:flex;align-items:flex-end}
.el{display:grid;grid-template-columns:repeat(4,1fr);column-gap:24px;margin-top:18px}
.el div{border-top:2px solid ${ink};padding-top:10px;font-size:14px;line-height:1.7}
.el i{display:inline-block;width:12px;height:12px;margin-right:8px;vertical-align:-1px}
.el b{font-size:22px;font-weight:600;display:block}
.cash{grid-column:1/9}
.rec{grid-column:9/13}
.f3{display:grid;grid-template-columns:repeat(3,1fr);column-gap:24px;margin-top:28px}
.f3 div{border-top:2px solid ${ink};padding-top:14px}
.f3 .n{font-size:96px;font-weight:600;line-height:.9;letter-spacing:-.05em;color:${red}}
.f3 h3{font-size:22px;font-weight:600;margin:18px 0 10px}
.f3 p{font-size:15px;line-height:1.8;color:#333}
.end{margin-top:56px}
.acts{grid-column:1/8}
.acts h3,.risks h3{font-size:15px;font-weight:600;padding-bottom:10px;border-bottom:2px solid ${ink}}
.act{display:grid;grid-template-columns:44px 1fr 110px;column-gap:16px;padding:14px 0;border-bottom:1px solid #d6d6d6;font-size:15px;line-height:1.7}
.act .i{font-weight:600;color:${red};font-size:20px;line-height:1.3}
.act .d{font-size:13px;text-align:right;font-weight:500}
.act .o{display:block;font-size:12.5px;color:${mute};margin-top:4px}
.risks{grid-column:8/13}
.rk{background:${red};color:#fff;padding:18px 20px 20px;margin-top:14px}
.rk.mid{background:${ink}}
.rk .lv{font-size:12px;font-weight:500;letter-spacing:.2em;opacity:.85}
.rk h4{font-size:20px;font-weight:600;margin:6px 0 8px}
.rk p{font-size:14px;line-height:1.75}
.foot{display:flex;justify-content:space-between;border-top:10px solid ${ink};margin-top:64px;padding-top:12px;font-size:12.5px;color:${mute}}
`
  const others = [K.margin, K.cash, K.dso].map((k) => `<div class="k"><div class="l">${esc(k.label)}</div><div class="v">${kv(k)}<small>${esc(k.unit)}</small></div><div class="c ${good(k) ? "" : "r"}">${esc(k.change)}</div></div>`).join("")
  const unitsHtml = U.map((u) => `<div class="u ${u.attain < 100 ? "miss" : ""}"><h3>${esc(u.name)}</h3><div class="rv">${num(u.revenue)}<small>万元</small></div><div class="bd">预算 ${num(u.budget)} · 差异 ${signed(u.revenue - u.budget)}</div>
<div class="at">预算完成率<b>${u.attain.toFixed(1)}%</b><div class="trk"><i style="width:${(u.attain / 120) * 100}%"></i><u></u></div></div>
<dl><dt>毛利率</dt><dd>${u.margin.toFixed(1)}%</dd><dt>同比</dt><dd>${esc(u.yoy)}</dd><dt>收入占比</dt><dd>${((u.revenue / uRev) * 100).toFixed(1)}%</dd></dl></div>`).join("")
  const bc = [red, ink, "#7a7a7a", "#c4c4c4"]
  const body = `<div class="w">
<div class="g hero"><div class="big">1.42<small>亿元</small></div><div class="t"><h1>2026 年 9 月<br>财务月报</h1><div class="m">${esc(f.org)}<br>${esc(f.period)}</div></div>
<div class="cap">营业收入 · 同比 <b>${esc(K.revenue.change)}</b> · 环比 <b>${pct(mom[11])}</b></div></div>
<div class="bar8"></div>
<div class="g intro"><p>${esc(f.summary)}</p><div class="ks">${others}</div></div>

<div class="sh"><div class="no">01</div><h2>收入与毛利率</h2><span>近 12 个月 · 万元</span></div>
<div class="g blk"><div class="rev">${cols({ w: 792, h: 330, data: M.map((m) => ({ x: m.label, y: m.revenue })), ticks: [0, 4000, 8000, 12000, 16000], color: ink, hi: 11, hiColor: red, grid: "#e2e2e2", text: mute, font: "Noto Sans SC", size: 12, pad: [22, 0, 26, 46], bw: 0.68, values: true, valueColor: (d, i) => (i === 11 ? red : ink) })}</div>
<div class="side"><div class="lab">综合毛利率 %</div>${line({ w: 376, h: 190, points: marPts, ticks: [31, 33, 35, 37], stroke: red, grid: "#e2e2e2", text: mute, font: "Noto Sans SC", size: 12, xEvery: 3, last: `${M[11].margin}%`, pad: [14, 8, 24, 30], width: 2.5 })}
<div class="k" style="margin-top:18px"><div class="l">2026 年 1—9 月累计收入</div><div class="v">${num(ytd)}<small>万元</small></div></div></div></div>

<div class="sh"><div class="no">02</div><h2>事业部预算执行</h2><span>9 月 · 合计完成率 ${uAtt.toFixed(1)}%</span></div>
<div class="u5">${unitsHtml}</div>

<div class="sh"><div class="no">03</div><h2>期间费用结构</h2><span>合计 ${num(eTot)} 万元 · 费用率 ${eRatio.toFixed(1)}% · 预算执行 ${eAtt.toFixed(1)}%</span></div>
<div class="blocks">${E.map((e, i) => `<div style="flex:none;width:calc(${e.share}% - 3px);background:${bc[i]};${i === 3 ? "color:" + ink : ""}">${e.share >= 10 ? e.share.toFixed(1) + "%" : ""}</div>`).join("")}</div>
<div class="el">${E.map((e, i) => `<div><i style="background:${bc[i]}"></i>${esc(e.name)}<b>${num(e.value)} 万元</b>预算 ${num(e.budget)} · 执行 <span class="${e.attain > 100 ? "r" : ""}">${e.attain.toFixed(1)}%</span> · 占比 ${e.share.toFixed(1)}%</div>`).join("")}</div>

<div class="sh"><div class="no">04</div><h2>现金流与应收</h2><span>万元</span></div>
<div class="g blk"><div class="cash"><div class="lab">经营活动现金净流量</div>${cols({ w: 792, h: 250, data: M.map((m) => ({ x: m.label, y: m.cash })), ticks: [-1000, 0, 1000, 2000, 3000, 4000], color: ink, negColor: red, grid: "#e2e2e2", text: mute, font: "Noto Sans SC", size: 12, pad: [20, 0, 26, 46], bw: 0.68, values: true, valueColor: (d) => (d.y < 0 ? red : ink), baseColor: ink })}</div>
<div class="rec">
<div class="k"><div class="l">应收账款余额</div><div class="v">${(R.balance / 1e4).toFixed(2)}<small>亿元</small></div><div class="c r">+${num(R.change)} 万</div></div>
<div class="k"><div class="l">账龄 90 天以上占比</div><div class="v r">${R.over90}<small>%</small></div></div>
<div class="k"><div class="l">应收周转天数</div><div class="v">${R.dso}<small>天</small></div><div class="c r">${esc(K.dso.change)}</div></div>
<div class="k"><div class="l">本月回款</div><div class="v">${num(R.collected)}<small>万元</small></div></div>
</div></div>

<div class="sh"><div class="no">05</div><h2>结论</h2></div>
<div class="f3">${f.findings.map((x, i) => `<div><div class="n">${String(i + 1).padStart(2, "0")}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div>`).join("")}</div>
<div class="g end"><div class="acts"><h3>下一步行动</h3>${f.actions.map((a, i) => `<div class="act"><span class="i">${i + 1}</span><span>${esc(a.text)}<span class="o">${esc(a.owner)}</span></span><span class="d">${esc(a.due)}</span></div>`).join("")}</div>
<div class="risks"><h3>风险</h3>${f.risks.map((r) => `<div class="rk ${r.level === "高" ? "" : "mid"}"><div class="lv">风险等级 ${esc(r.level)}</div><h4>${esc(r.title)}</h4><p>${esc(r.text)}</p></div>`).join("")}</div></div>

<div class="foot"><span>${esc(f.org)}</span><span>管理口径 · 未经审计</span><span>2026.10.10</span></div>
</div>`
  return doc(css, body)
}

// ======================================================================
// D — soft pastel cards: warm off-white, rounded tinted cards, ring chart,
// friendly copy, airy spacing.
// ======================================================================
function pageD() {
  const txt = "#3d3b36", mute = "#8c877d"
  const sage = "#8fb39a", peach = "#eaa98a", lav = "#a99bd1", sky = "#86b4cf", sand = "#e6c36f"
  const tint = { sage: "#e3ede4", peach: "#fbe9df", lav: "#ebe7f5", sky: "#e1edf4" }
  const css = `
body{background:#f5f2ec;color:${txt};font-family:"Noto Sans SC",sans-serif;font-weight:400}
.w{width:1180px;margin:0 auto;padding:52px 0 60px}
.top{display:flex;justify-content:space-between;align-items:flex-end}
.pill{display:inline-block;background:${tint.sage};color:#4f7a5c;border-radius:99px;padding:5px 14px;font-size:13px;font-weight:500}
h1{font-size:38px;font-weight:500;margin:14px 0 6px;letter-spacing:.01em}
.org{color:${mute};font-size:14px}
.date{color:${mute};font-size:13px;text-align:right;line-height:1.8}
.card{background:#fff;border-radius:22px;padding:26px 28px;box-shadow:0 1px 2px rgba(60,50,30,.04),0 8px 24px rgba(60,50,30,.05)}
.sum{margin-top:28px;background:${tint.sage};box-shadow:none;font-size:16px;line-height:1.95;color:#3f4d42;display:grid;grid-template-columns:150px 1fr;gap:24px}
.sum h2{font-size:15px;font-weight:500;color:#4f7a5c}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:20px}
.kpi{border-radius:22px;padding:22px 24px}
.kpi .l{font-size:14px;color:${txt};opacity:.75}
.kpi .v{font-size:40px;font-weight:500;margin-top:12px;line-height:1.1}
.kpi .v small{font-size:15px;font-weight:400;margin-left:4px;opacity:.7}
.chip{display:inline-block;margin-top:14px;font-size:12.5px;border-radius:99px;padding:3px 10px;background:rgba(255,255,255,.7)}
.row{display:grid;gap:20px;margin-top:20px}
.card h3{font-size:17px;font-weight:500;display:flex;justify-content:space-between;align-items:baseline}
.card h3 small{font-size:13px;font-weight:400;color:${mute}}
.hint{font-size:13.5px;color:${mute};margin:6px 0 16px;line-height:1.7}
.ringw{display:flex;align-items:center;gap:22px;margin-top:10px}
.lg{display:flex;flex-direction:column;gap:12px;font-size:14px;flex:1}
.lg div{white-space:nowrap;display:grid;grid-template-columns:12px 1fr auto;gap:10px;align-items:center}
.lg i{width:12px;height:12px;border-radius:50%}
.lg b{font-weight:500}
.ctr{font-family:"Noto Sans SC"}
table{font-size:14px;margin-top:18px}
th{font-weight:400;color:${mute};font-size:12.5px;text-align:right;padding:8px 6px;border-bottom:1px solid #eee8de}
th:first-child,td:first-child{text-align:left}
td{padding:10px 6px;text-align:right;border-bottom:1px solid #f2ede4}
tr:last-child td{border-bottom:0}
.tag{display:inline-block;border-radius:99px;padding:2px 9px;font-size:12.5px}
.ok{background:${tint.sage};color:#4f7a5c}
.no{background:${tint.peach};color:#b0603c}
.mini{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:16px}
.mini div{background:#f8f6f1;border-radius:14px;padding:12px 14px;font-size:13px;color:${mute}}
.mini b{display:block;font-size:22px;font-weight:500;color:${txt};margin-top:2px}
.fs{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px}
.f .dot{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:500;font-size:15px;color:#fff}
.f h4{font-size:17px;font-weight:500;margin:16px 0 8px}
.f p{font-size:14.5px;line-height:1.85;color:#5d5a52}
.ac{display:grid;grid-template-columns:1fr auto;gap:6px 16px;padding:16px 0;border-bottom:1px dashed #e7e1d5}
.ac:last-child{border-bottom:0;padding-bottom:0}
.ac p{font-size:15px;line-height:1.75}
.ac .o{font-size:12.5px;color:${mute}}
.ac .due{grid-row:1/3;grid-column:2;align-self:start;background:${tint.sky};color:#3f6f8c;border-radius:99px;padding:4px 12px;font-size:12.5px;white-space:nowrap}
.rk{background:${tint.peach};border-radius:16px;padding:16px 18px;margin-top:14px}
.rk.m{background:#fbf3dc}
.rk h4{font-size:15.5px;font-weight:500;display:flex;gap:10px;align-items:center}
.rk h4 span{font-size:12px;background:#fff;border-radius:99px;padding:1px 9px;color:#b0603c}
.rk.m h4 span{color:#a07a1c}
.rk p{font-size:14px;line-height:1.8;margin-top:6px;color:#5d5a52}
.foot{text-align:center;color:${mute};font-size:12.5px;margin-top:40px}
`
  const kc = [tint.sage, tint.sky, tint.peach, tint.lav]
  const kpis = f.kpis.map((k, i) => `<div class="kpi" style="background:${kc[i]}"><div class="l">${esc(k.label)}</div><div class="v">${kv(k)}<small>${esc(k.unit)}</small></div><span class="chip">${esc(k.note)} ${esc(k.change)}</span></div>`).join("")
  const ecol = [peach, sky, sage, lav]
  const rg = ring({ size: 164, r: 62, t: 20, items: E, colors: ecol, gap: 3, center: `<text x="82" y="77" text-anchor="middle" style="font-size:13px;fill:${mute}">期间费用</text><text x="82" y="103" text-anchor="middle" style="font-size:22px;fill:${txt};font-weight:500">${num(eTot)}</text>` })
  const ucol = [sage, sky, peach, lav, sand]
  const body = `<div class="w">
<div class="top"><div><span class="pill">月度财务 · 2026.09</span><h1>9 月财务月报</h1><div class="org">${esc(f.org)}</div></div><div class="date">${esc(f.period)}<br>金额单位：万元</div></div>
<div class="card sum"><h2>本月小结</h2><p>${esc(f.summary)}</p></div>
<div class="kpis">${kpis}</div>

<div class="row" style="grid-template-columns:1fr 410px">
<div class="card"><h3>营业收入趋势<small>近 12 个月 · 万元</small></h3><p class="hint">9 月收入创年内新高，较 8 月增长 ${mom[11].toFixed(1)}%。</p>
${line({ w: 682, h: 290, points: revPts, ticks: [8000, 10000, 12000, 14000, 16000], stroke: "#6e9d7c", grid: "#f0ebe2", text: "#a8a296", fill: "rgba(143,179,154,.22)", font: "Noto Sans SC", size: 12, pad: [16, 18, 26, 50], width: 2.5, last: num(M[11].revenue) })}</div>
<div class="card"><h3>费用构成<small>9 月</small></h3>
<div class="ringw">${rg}<div class="lg">${E.map((e, i) => `<div><i style="background:${ecol[i]}"></i><span>${esc(e.name)}</span><b>${e.share.toFixed(1)}%</b></div>`).join("")}</div></div>
<div class="mini"><div>费用率<b>${eRatio.toFixed(1)}%</b></div><div>预算执行<b>${eAtt.toFixed(1)}%</b></div></div>
<p class="hint" style="margin:14px 0 0">销售费用 ${num(E[0].value)} 万元，超预算 ${(E[0].attain - 100).toFixed(1)}%，其余科目均在预算内。</p></div>
</div>

<div class="row" style="grid-template-columns:1fr 1fr">
<div class="card"><h3>各事业部收入<small>预算完成率 ${uAtt.toFixed(1)}%</small></h3>
<div style="margin-top:20px;font-size:14px">${bars(U.map((u) => ({ label: u.name, value: u.revenue, display: num(u.revenue) })), { max: 5600, colors: ucol, track: "#f3efe7", labelW: 80, h: 12, gap: 14, valueW: 52, radius: 6 })}</div>
<table><thead><tr><th>事业部</th><th>预算</th><th>完成率</th><th>毛利率</th><th>同比</th></tr></thead><tbody>${U.map((u) => `<tr><td>${esc(u.name)}</td><td>${num(u.budget)}</td><td><span class="tag ${u.attain >= 100 ? "ok" : "no"}">${u.attain.toFixed(1)}%</span></td><td>${u.margin.toFixed(1)}%</td><td>${esc(u.yoy)}</td></tr>`).join("")}</tbody></table></div>
<div class="card"><h3>毛利率与现金流<small>近 12 个月</small></h3>
<p class="hint">毛利率回升至 ${K.margin.value}%；经营现金流入 ${num(K.cash.value)} 万元，较上月有所回落。</p>
${line({ w: 520, h: 150, points: marPts, ticks: [31, 33, 35, 37], stroke: "#8a7bc0", grid: "#f0ebe2", text: "#a8a296", font: "Noto Sans SC", size: 12, xEvery: 2, pad: [12, 16, 24, 34], width: 2.5, last: `${M[11].margin}%` })}
<div style="height:14px"></div>
${cols({ w: 520, h: 160, data: M.map((m) => ({ x: m.label, y: m.cash })), ticks: [-1000, 0, 1000, 2000, 3000, 4000], color: "#a9cbe0", negColor: peach, hi: 11, hiColor: "#5f97b8", grid: "#f0ebe2", text: "#a8a296", font: "Noto Sans SC", size: 12, pad: [10, 4, 24, 46], bw: 0.55, rx: 4, baseColor: "#d8d1c4" })}
<div class="mini"><div>应收账款余额<b>${(R.balance / 1e4).toFixed(2)} 亿元</b></div><div>周转天数<b>${R.dso} 天</b></div><div>90 天以上占比<b>${R.over90}%</b></div><div>本月回款<b>${num(R.collected)} 万元</b></div></div></div>
</div>

<div class="fs">${f.findings.map((x, i) => `<div class="card f"><div class="dot" style="background:${[sage, peach, lav][i]}">${i + 1}</div><h4>${esc(x.title)}</h4><p>${esc(x.text)}</p></div>`).join("")}</div>

<div class="row" style="grid-template-columns:1fr 420px">
<div class="card"><h3>接下来要做的事</h3>${f.actions.map((a) => `<div class="ac"><p>${esc(a.text)}</p><span class="due">${esc(a.due)}</span><span class="o">${esc(a.owner)}</span></div>`).join("")}</div>
<div class="card"><h3>需要留意的风险</h3>${f.risks.map((r) => `<div class="rk ${r.level === "高" ? "" : "m"}"><h4>${esc(r.title)}<span>${esc(r.level)}</span></h4><p>${esc(r.text)}</p></div>`).join("")}</div>
</div>
<div class="foot">${esc(f.org)} · 数据为管理口径，未经审计</div>
</div>`
  return doc(css, body)
}

// ======================================================================
// E — spreadsheet export: a worksheet pasted to the web, row numbers and
// column letters, gridlines, fill-colored cells, default-palette charts.
// ======================================================================
function pageE() {
  const blue = "#4472c4", orange = "#ed7d31", gray = "#a5a5a5", gold = "#ffc000"
  const widths = [160, 124, 124, 124, 124, 124, 124, 138, 138]
  const L = "ABCDEFGHI"
  let rn = 0
  const tr = (cells, cls = "", h) => `<tr class="${cls}"${h ? ` style="height:${h}px"` : ""}><td class="rh">${++rn}</td>${cells}</tr>`
  const blank = () => tr(`<td colspan="9"></td>`)
  const sec = (t) => tr(`<td colspan="9" class="sec">${esc(t)}</td>`)
  const c = (v, cls = "") => `<td class="${cls}">${v}</td>`
  const pad = (n) => Array.from({ length: n }, () => "<td></td>").join("")
  const chartBox = (title, svg, legend, w) => `<div class="chart" style="width:${w}px"><div class="ct">${esc(title)}</div>${svg}<div class="cl">${legend}</div></div>`
  const lgd = (items) => items.map(([n, col]) => `<span><i style="background:${col}"></i>${esc(n)}</span>`).join("")
  const css = `
body{background:#fff;font-family:"Noto Sans SC",sans-serif;font-size:13px;color:#000}
.app{width:1216px;margin:0 auto;padding:18px 0 0}
.fx{display:flex;border:1px solid #c6c6c6;font-size:13px;height:28px;align-items:center}
.fx .nb{width:96px;border-right:1px solid #c6c6c6;padding:0 8px;height:100%;display:flex;align-items:center}
.fx .f{padding:0 10px;color:#555;font-style:italic;border-right:1px solid #c6c6c6;height:100%;display:flex;align-items:center}
.fx .v{padding:0 10px;font-family:"IBM Plex Mono";font-size:12.5px}
table.ws{table-layout:fixed;width:1216px;border-collapse:collapse;margin-top:6px}
.ws td,.ws th{border:1px solid #d9d9d9;height:24px;padding:2px 6px;overflow:hidden;white-space:nowrap;vertical-align:bottom}
.ws th{background:#efefef;color:#444;font-weight:400;text-align:center;font-size:12px}
.ws td.rh{background:#efefef;color:#444;text-align:center;font-size:12px;width:36px;vertical-align:middle}
.ws td.wrap{white-space:normal;line-height:1.7;vertical-align:top;padding:6px}
.t1{font-size:20px;font-weight:600;color:#1f3864}
.sec{background:#d9e1f2;font-weight:600;color:#1f3864;font-size:14px}
.hd td{background:#4472c4;color:#fff;font-weight:600;text-align:center}
.hd td.rh{background:#efefef;color:#444;font-weight:400}
.r{text-align:right}
.ctr{text-align:center}
.b{font-weight:600}
.y{background:#fff2cc}
.gd{background:#c6efce;color:#006100}
.bd{background:#ffc7ce;color:#9c0006}
.red{color:#c00000}
.tot td{font-weight:600;border-top:2px solid #000}
.tot td.rh{border-top:1px solid #d9d9d9;font-weight:400}
.db{position:relative}
.db i{position:absolute;left:0;top:3px;bottom:3px;background:linear-gradient(90deg,#638ec6,#c5d7ef);opacity:.85}
.db span{position:relative}
.charts{display:flex;gap:18px;padding:10px 6px;align-items:flex-start;vertical-align:top}
.chart{border:1px solid #bfbfbf;background:#fff;padding:8px 10px 8px;box-shadow:1px 1px 0 #e3e3e3}
.ct{text-align:center;font-size:15px;color:#595959;margin-bottom:4px}
.cl{display:flex;justify-content:center;gap:16px;font-size:12px;color:#595959;margin-top:2px}
.cl i{display:inline-block;width:9px;height:9px;margin-right:5px}
.tabs{display:flex;border-top:1px solid #c6c6c6;margin-top:10px;background:#f3f3f3;font-size:12.5px}
.tabs span{padding:6px 18px;border-right:1px solid #c6c6c6;color:#444}
.tabs span.on{background:#fff;color:#217346;font-weight:600;border-bottom:2px solid #217346}
`
  const head = `<tr><th style="width:36px"></th>${widths.map((w, i) => `<th style="width:${w}px">${L[i]}</th>`).join("")}</tr>`
  const rows = []
  rows.push(tr(`<td colspan="9" class="t1">${esc(f.org.split(" · ")[0])}　${esc(f.title)}</td>`, "", 34))
  rows.push(tr(`<td colspan="5">编制部门：财务管理部　　报告期间：${esc(f.period)}</td><td colspan="4" class="r">金额单位：万元</td>`))
  rows.push(blank())
  rows.push(sec("一、本月概况"))
  rows.push(tr(`<td colspan="9" class="wrap">${esc(f.summary)}</td>`, "", 62))
  rows.push(blank())
  rows.push(sec("二、主要指标"))
  rows.push(tr(`<td>指标</td><td>本月</td><td>单位</td><td>变动</td><td>比较</td><td>状态</td>${pad(3)}`, "hd"))
  f.kpis.forEach((k) => rows.push(tr(`${c(esc(k.label))}${c(kv(k), "r y b")}${c(esc(k.unit), "ctr")}${c(esc(k.change), "r")}${c(esc(k.note), "ctr")}${c(good(k) ? "正常" : "关注", `ctr ${good(k) ? "gd" : "bd"}`)}${pad(3)}`)))
  rows.push(blank())
  rows.push(sec("三、月度收入、毛利率及现金流"))
  rows.push(tr(`<td>月份</td><td>营业收入</td><td>毛利率</td><td>经营现金流</td>${pad(5)}`, "hd"))
  const revChart = cols({ w: 560, h: 262, data: M.map((m) => ({ x: m.label, y: m.revenue })), ticks: [0, 2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000], color: blue, grid: "#d9d9d9", text: "#595959", font: "Noto Sans SC", size: 11, pad: [10, 8, 22, 46], bw: 0.6 })
  M.forEach((m, i) => rows.push(tr(`${c(m.month)}${c(num(m.revenue), "r")}${c(m.margin.toFixed(1) + "%", "r")}${c(m.cash < 0 ? `<span class="red">-${num(-m.cash)}</span>` : num(m.cash), "r")}${i === 0 ? `<td colspan="5" rowspan="13" style="vertical-align:top;padding:4px 8px;border-color:#d9d9d9">${chartBox("营业收入（万元）", revChart, lgd([["营业收入", blue]]), 580)}</td>` : ""}`)))
  rows.push(tr(`${c("合计", "b")}${c(num(sum(M, "revenue")), "r b")}${c("", "")}${c(num(sum(M, "cash")), "r b")}`, "tot"))
  rows.push(blank())
  rows.push(sec("四、分事业部预算执行"))
  rows.push(tr(`<td>事业部</td><td>月度预算</td><td>本月实际</td><td>差异</td><td>完成率</td><td>毛利率</td><td>同比</td>${pad(2)}`, "hd"))
  U.forEach((u) => rows.push(tr(`${c(esc(u.name))}${c(num(u.budget), "r")}${c(num(u.revenue), "r")}${c(u.revenue - u.budget < 0 ? `<span class="red">-${num(u.budget - u.revenue)}</span>` : num(u.revenue - u.budget), "r")}<td class="r db"><i style="width:${Math.min(u.attain, 110) / 1.1}%"></i><span>${u.attain.toFixed(1)}%</span></td>${c(u.margin.toFixed(1) + "%", "r")}${c(esc(u.yoy), "r")}${pad(2)}`)))
  rows.push(tr(`${c("合计")}${c(num(uBud), "r")}${c(num(uRev), "r")}${c(`<span class="red">-${num(uBud - uRev)}</span>`, "r")}${c(uAtt.toFixed(1) + "%", "r")}${c(K.margin.value + "%", "r")}${c(esc(K.revenue.change), "r")}${pad(2)}`, "tot"))
  rows.push(blank())
  rows.push(sec("五、期间费用"))
  rows.push(tr(`<td>科目</td><td>月度预算</td><td>本月实际</td><td>超支(+)/节约(-)</td><td>执行率</td><td>占比</td>${pad(3)}`, "hd"))
  E.forEach((e) => rows.push(tr(`${c(esc(e.name))}${c(num(e.budget), "r")}${c(num(e.value), "r")}${c((e.value - e.budget > 0 ? "+" : "") + num(e.value - e.budget), `r ${e.value > e.budget ? "bd" : ""}`)}${c(e.attain.toFixed(1) + "%", `r ${e.attain > 100 ? "bd" : ""}`)}${c(e.share.toFixed(1) + "%", "r")}${pad(3)}`)))
  rows.push(tr(`${c("合计")}${c(num(eBud), "r")}${c(num(eTot), "r")}${c("+" + num(eTot - eBud), "r")}${c(eAtt.toFixed(1) + "%", "r")}${c("100.0%", "r")}${pad(3)}`, "tot"))
  rows.push(tr(`${c("费用率")}${c(eRatio.toFixed(1) + "%", "r y b")}${pad(7)}`))
  rows.push(blank())
  rows.push(sec("六、应收账款"))
  rows.push(tr(`${c("应收账款余额")}${c(num(R.balance), "r y b")}${c("较上月")}${c("+" + num(R.change), "r red")}${c("本月回款")}${c(num(R.collected), "r")}${pad(3)}`))
  rows.push(tr(`${c("90天以上占比")}${c(R.over90 + "%", "r bd")}${c("周转天数")}${c(R.dso, "r")}${c("较上月")}${c(esc(K.dso.change), "r red")}${pad(3)}`))
  const cashChart = cols({ w: 560, h: 230, data: M.map((m) => ({ x: m.label, y: m.cash })), ticks: [-1000, 0, 1000, 2000, 3000, 4000], color: orange, grid: "#d9d9d9", text: "#595959", font: "Noto Sans SC", size: 11, pad: [10, 8, 22, 46], bw: 0.6, baseColor: "#bfbfbf" })
  const pie = ring({ size: 220, r: 50, t: 100, items: E, colors: [blue, orange, gray, gold] })
  rows.push(tr(`<td colspan="9" class="charts" style="height:300px"><div style="display:flex;gap:22px">${chartBox("经营活动现金净流量（万元）", cashChart, lgd([["经营现金流", orange]]), 580)}${chartBox("9月期间费用构成", `<div style="display:flex;justify-content:center;padding:6px 0">${pie}</div>`, lgd(E.map((e, i) => [`${e.name} ${e.share}%`, [blue, orange, gray, gold][i]])), 420)}</div></td>`))
  rows.push(blank())
  rows.push(sec("七、重点发现"))
  f.findings.forEach((x, i) => rows.push(tr(`<td colspan="2" class="b">${i + 1}. ${esc(x.title)}</td><td colspan="7" class="wrap">${esc(x.text)}</td>`)))
  rows.push(blank())
  rows.push(sec("八、下步工作安排"))
  rows.push(tr(`<td>责任部门</td><td colspan="6">工作内容</td><td colspan="2">完成时间</td>`, "hd"))
  f.actions.forEach((a) => rows.push(tr(`<td class="wrap">${esc(a.owner)}</td><td colspan="6" class="wrap">${esc(a.text)}</td><td colspan="2" class="ctr">${esc(a.due)}</td>`)))
  rows.push(blank())
  rows.push(sec("九、风险提示"))
  f.risks.forEach((r) => rows.push(tr(`${c(`风险等级：${esc(r.level)}`, `ctr ${r.level === "高" ? "bd" : "y"}`)}<td colspan="8" class="wrap red"><b>${esc(r.title)}</b>　${esc(r.text)}</td>`)))
  rows.push(blank())
  rows.push(tr(`<td colspan="3">制表：财务管理部</td><td colspan="3">审核：</td><td colspan="3">日期：2026/10/10</td>`))
  rows.push(blank())
  const body = `<div class="app">
<div class="fx"><span class="nb">B9</span><span class="f">fx</span><span class="v">=ROUND(C39/10000,2)</span></div>
<table class="ws">${head}${rows.join("")}</table>
<div class="tabs"><span class="on">9月月报</span><span>收入明细</span><span>费用明细</span><span>应收台账</span><span>预算</span><span>+</span></div>
</div>`
  return doc(css, body)
}

export default { a: pageA(), b: pageB(), c: pageC(), d: pageD(), e: pageE() }
