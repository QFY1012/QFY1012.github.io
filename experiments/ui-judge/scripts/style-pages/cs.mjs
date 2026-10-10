// 九月客服质检月报 in five styles: helpdesk admin console, report card, formal notice (公文),
// playful chat-themed SaaS, heatmap-centric analysis.
import { readData, doc, esc, num, line } from "../style-kit.mjs"

const D = readData("cs")
const K = Object.fromEntries(D.kpis.map((k) => [k.key, k]))
const T = D.teams
const I = D.issues
const Y = D.daily
const Q = D.qa
const isNeg = (c) => String(c).startsWith("−")
const per = (t) => Math.round(t.sessions / t.agents)
const agents = T.reduce((a, t) => a + t.agents, 0)
const kv = (k) => `${k.value}`

// small polyline that stretches to its box
const spark = (vals, color, h = 34) => {
  const lo = Math.min(...vals), hi = Math.max(...vals), w = 200
  const pts = vals.map((v, i) => `${((i / (vals.length - 1)) * w).toFixed(1)},${(h - 3 - ((v - lo) / (hi - lo)) * (h - 6)).toFixed(1)}`)
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="display:block"><polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`
}
// shade a range of points in a kit line chart (same x mapping as the kit)
const shade = (svg, o) => {
  const [pt, pr, pb, pl] = o.pad
  const x = (i) => pl + (i / (o.n - 1)) * (o.w - pl - pr)
  const x0 = x(o.from) - 6, x1 = x(o.to) + 6
  const rect = `<rect x="${x0.toFixed(1)}" y="${pt - 6}" width="${(x1 - x0).toFixed(1)}" height="${o.h - pt - pb + 6}" fill="${o.fill}"/>`
  const lab = o.label ? `<text x="${((x0 + x1) / 2).toFixed(1)}" y="${pt + 8}" text-anchor="middle" style="fill:${o.color ?? "#888"};font-size:11px">${esc(o.label)}</text>` : ""
  return svg.replace(/(<svg[^>]*>)/, `$1${rect}${lab}`)
}
const PEAK = [13, 18] // index of 9/14 .. 9/19

// ---------------------------------------------------------------- a: helpdesk admin console
const a = (() => {
  const acc = "#3b5bdb"
  const pad = [22, 18, 26, 46], W = 748, H = 250
  const chart = shade(line({ w: W, h: H, points: Y.map((d) => ({ x: d.date, y: d.sessions })), ticks: [1200, 1500, 1800, 2100, 2400], xEvery: 3, stroke: acc, fill: "rgba(59,91,219,.08)", grid: "#eef0f4", text: "#8a90a0", pad, size: 11, last: "1,700", dots: false }),
    { w: W, h: H, pad, n: Y.length, from: PEAK[0], to: PEAK[1], fill: "rgba(240,140,0,.09)", label: "华南仓切换", color: "#b86a00" })
  const kcard = (k, vals, note) => `<div class="card kpi"><div class="l">${esc(k.label)}</div>
<div class="v">${esc(kv(k))}<small>${esc(k.unit)}</small></div>
<div class="ch"><span class="pill ${k.direction === "up" ? "g" : "r"}">${esc(k.change)}</span><span class="vs">较 8 月</span></div>
<div class="sp">${vals ? spark(vals, k.direction === "up" ? "#2f9e6b" : "#d9480f") : note}</div></div>`
  const respDot = (s) => s > 60 ? "r" : s > 45 ? "y" : "g"
  const qaCls = (s) => s >= 88 ? "g" : s < 85 ? "y" : "n"
  return doc(`
body{background:#f4f5f8;font-family:"Noto Sans SC";color:#1f2430;font-size:14px;font-variant-numeric:tabular-nums}
.top{height:56px;background:#fff;border-bottom:1px solid #e3e6ec}
.top .in{max-width:1200px;margin:0 auto;display:flex;align-items:center;height:100%;gap:36px}
.logo{display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px}
.logo i{width:28px;height:28px;border-radius:7px;background:${acc};color:#fff;display:grid;place-items:center;font-style:normal;font-size:14px}
nav{display:flex;height:100%}
nav a{display:flex;align-items:center;padding:0 16px;color:#5b6170;border-bottom:2px solid transparent;margin-bottom:-1px}
nav a.on{color:${acc};border-color:${acc};font-weight:500}
.user{margin-left:auto;display:flex;align-items:center;gap:14px;color:#5b6170;font-size:13px}
.user i{width:30px;height:30px;border-radius:50%;background:#e7ebfb;color:${acc};display:grid;place-items:center;font-style:normal;font-weight:500}
.wrap{max-width:1200px;margin:0 auto;padding:22px 0 40px}
.crumb{color:#8a90a0;font-size:13px}
.head{display:flex;justify-content:space-between;align-items:flex-end;margin:6px 0 16px}
h1{font-size:24px;font-weight:600;letter-spacing:.5px}
.meta{color:#6b7180;margin-top:6px;font-size:13px}
.btns{display:flex;gap:8px}
.btn{height:34px;padding:0 14px;border:1px solid #d7dae1;border-radius:6px;background:#fff;display:inline-flex;align-items:center;font-size:13px;color:#3a4050}
.btn.pri{background:${acc};color:#fff;border-color:${acc}}
.filters{display:flex;gap:8px;margin-bottom:16px;align-items:center}
.chip{border:1px solid #d7dae1;background:#fff;border-radius:6px;padding:5px 12px;font-size:13px;color:#6b7180}
.chip b{font-weight:500;color:#1f2430;margin-left:4px}
.filters .upd{margin-left:auto;font-size:12px;color:#8a90a0}
.note{background:#fff;border:1px solid #e3e6ec;border-radius:10px;padding:14px 18px 14px 18px;line-height:1.8;color:#3a4050;margin-bottom:16px;display:grid;grid-template-columns:72px 1fr;gap:12px}
.note b{color:${acc};font-weight:500;font-size:13px;padding-top:1px}
.grid5{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-bottom:16px}
.card{background:#fff;border:1px solid #e3e6ec;border-radius:10px;padding:18px 20px}
.kpi .l{color:#6b7180;font-size:13px}
.kpi .v{font-size:30px;font-weight:600;margin-top:6px;line-height:1.2}
.kpi .v small{font-size:14px;color:#6b7180;font-weight:400;margin-left:4px}
.kpi .ch{display:flex;align-items:center;gap:8px;margin-top:8px}
.kpi .vs{font-size:12px;color:#9aa0ae}
.kpi .sp{margin-top:12px;height:34px;font-size:12px;color:#6b7180;line-height:1.5}
.pill{display:inline-block;font-size:12px;padding:1px 8px;border-radius:10px;font-weight:500}
.pill.g{background:#e6f6ee;color:#137a48}.pill.r{background:#fdecec;color:#c92a2a}.pill.y{background:#fff4e0;color:#b86a00}.pill.n{background:#eef0f4;color:#3a4050}
.meter{height:6px;border-radius:3px;background:#eef0f4;margin-top:6px;position:relative}
.meter i{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:${acc}}
.meter s{position:absolute;top:-3px;bottom:-3px;width:2px;background:#1f2430}
.row2{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:16px}
.ct{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.ct h2{font-size:15px;font-weight:600}
.ct .sub{font-size:12px;color:#8a90a0}
.tabs{display:flex;background:#f1f3f6;border-radius:6px;padding:2px}
.tabs span{font-size:12px;padding:3px 10px;border-radius:5px;color:#6b7180}
.tabs span.on{background:#fff;color:#1f2430;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.iss{display:flex;flex-direction:column;gap:13px;margin-top:6px}
.iss .r{display:grid;grid-template-columns:76px 1fr 46px 44px;gap:10px;align-items:center;font-size:13px}
.iss .t{height:8px;background:#eef0f4;border-radius:4px}.iss .t i{display:block;height:100%;border-radius:4px;background:${acc}}
.iss .p{text-align:right;font-weight:500}.iss .c{text-align:right;font-size:12px;color:#8a90a0}.iss .c.up{color:#c92a2a}
.iss-note{margin-top:16px;padding-top:12px;border-top:1px dashed #e3e6ec;font-size:12px;color:#6b7180;line-height:1.7}
table{font-size:13px}
th{font-weight:500;color:#6b7180;text-align:left;padding:10px 12px;background:#f8f9fb;border-bottom:1px solid #e3e6ec;font-size:12px}
td{padding:12px;border-bottom:1px solid #eef0f4;vertical-align:middle}
tr:last-child td{border-bottom:0}
th.r,td.r{text-align:right}
.tn{font-weight:500}.tsub{font-size:12px;color:#8a90a0;margin-top:2px}
.sb{display:flex;align-items:center;gap:10px}.sb span{width:52px;text-align:right}.sb i{height:6px;border-radius:3px;background:#c5d0f6;display:block}
.dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:7px;vertical-align:1px}
.dot.g{background:#2f9e6b}.dot.y{background:#f08c00}.dot.r{background:#e03131}
.tcard{padding:0;overflow:hidden}.tcard .ct{padding:16px 20px 4px}
.legend{display:flex;gap:14px;font-size:12px;color:#8a90a0}
.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:16px}
.li{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #eef0f4}
.li:last-child{border-bottom:0;padding-bottom:0}
.li .n{flex:none;width:22px;height:22px;border-radius:6px;background:#e7ebfb;color:${acc};display:grid;place-items:center;font-size:12px;font-weight:600}
.li h3{font-size:14px;font-weight:500;margin-bottom:4px}
.li p{font-size:13px;color:#5b6170;line-height:1.7}
.own{display:inline-block;margin-top:6px;font-size:12px;color:#5b6170;background:#f1f3f6;border-radius:4px;padding:1px 8px}
.risk{background:#fff8eb;border:1px solid #ffe2b0;border-radius:8px;padding:12px 14px;margin-top:10px}
.risk:first-of-type{margin-top:0}
.risk h3{font-size:14px;font-weight:500;color:#8a4b00;margin-bottom:4px}
.risk p{font-size:13px;color:#6b5a3c;line-height:1.7}
.foot{margin-top:22px;font-size:12px;color:#9aa0ae;display:flex;justify-content:space-between}
`, `<div class="top"><div class="in"><div class="logo"><i>澜</i>澜岸服务台</div>
<nav><a>工单</a><a>在线会话</a><a>质检</a><a class="on">报表</a><a>知识库</a><a>设置</a></nav>
<div class="user">客户服务中心<i>质</i></div></div></div>
<div class="wrap">
<div class="crumb">报表 / 质检报表 / 月度</div>
<div class="head"><div><h1>${esc(D.title)}</h1><div class="meta">${esc(D.org)} · 统计周期 ${esc(D.period)}</div></div>
<div class="btns"><span class="btn">订阅邮件</span><span class="btn">导出</span><span class="btn pri">分享报表</span></div></div>
<div class="filters"><span class="chip">时间<b>2026 年 9 月</b></span><span class="chip">渠道<b>全部渠道</b></span><span class="chip">班组<b>全部 ${T.length} 个</b></span><span class="chip">对比<b>上月</b></span><span class="upd">数据更新于 10 月 8 日 09:00</span></div>
<div class="note"><b>本月摘要</b><div>${esc(D.summary)}</div></div>
<div class="grid5">
${kcard(K.sessions, Y.map((d) => d.sessions))}
${kcard(K.fcr, Y.map((d) => d.fcr))}
${kcard(K.response, Y.map((d) => d.firstResponse))}
${kcard(K.csat, null, `目标 92%<div class="meter"><i style="width:${(90.3 / 100) * 100}%"></i><s style="left:92%"></s></div>`)}
<div class="card kpi"><div class="l">质检平均分</div><div class="v">${Q.score}<small>分</small></div>
<div class="ch"><span class="pill g">${esc(Q.change)}</span><span class="vs">较 8 月</span></div>
<div class="sp">抽检 ${num(Q.sampled)} 通（${Q.sampleRate}）<br>红线违规 ${Q.violations} 次</div></div>
</div>
<div class="row2">
<div class="card"><div class="ct"><div><h2>每日会话量</h2><div class="sub">单位：通 · 橙色区间为华南仓系统切换期</div></div><div class="tabs"><span class="on">会话量</span><span>首响时长</span><span>首次解决率</span></div></div>${chart}</div>
<div class="card"><div class="ct"><div><h2>问题分类占比</h2><div class="sub">按会话首个标签统计 · 右侧为较上月变化</div></div></div>
<div class="iss">${I.map((x) => `<div class="r"><span>${esc(x.name)}</span><div class="t"><i style="width:${(x.share / 35) * 100}%;${x.name === "物流配送" ? "background:#f08c00" : ""}"></i></div><span class="p">${x.share}%</span><span class="c ${isNeg(x.change) ? "" : "up"}">${esc(x.change)}</span></div>`).join("")}</div>
<div class="iss-note">物流配送类咨询较上月增加 8.2 个百分点，其余各类占比均有下降。</div></div>
</div>
<div class="card tcard"><div class="ct"><div><h2>班组表现</h2><div class="sub">共 ${T.length} 个班组 · ${agents} 名坐席</div></div><div class="legend"><span><i class="dot g"></i>首响 ≤ 45 秒</span><span><i class="dot y"></i>46–60 秒</span><span><i class="dot r"></i>超过 60 秒</span></div></div>
<table><tr><th style="padding-left:20px">班组</th><th class="r">坐席</th><th>会话量</th><th class="r">人均会话</th><th class="r">首次解决率</th><th>平均首响</th><th class="r">满意度</th><th class="r" style="padding-right:20px">质检得分</th></tr>
${T.map((t) => `<tr><td style="padding-left:20px"><div class="tn">${esc(t.name)}</div><div class="tsub">组长 ${esc(t.lead)}</div></td><td class="r">${t.agents}</td>
<td><div class="sb"><span>${num(t.sessions)}</span><i style="width:${(t.sessions / 14000) * 150}px"></i></div></td><td class="r">${per(t)}</td>
<td class="r">${t.fcr.toFixed(1)}%</td><td><i class="dot ${respDot(t.firstResponse)}"></i>${t.firstResponse} 秒</td><td class="r">${t.csat.toFixed(1)}%</td>
<td class="r" style="padding-right:20px"><span class="pill ${qaCls(t.qa)}">${t.qa.toFixed(1)}</span></td></tr>`).join("")}</table></div>
<div class="row3">
<div class="card"><div class="ct"><h2>本月发现</h2></div>${D.findings.map((f, i) => `<div class="li"><span class="n">${i + 1}</span><div><h3>${esc(f.title)}</h3><p>${esc(f.detail)}</p></div></div>`).join("")}</div>
<div class="card"><div class="ct"><h2>下一步行动</h2></div>${D.actions.map((x, i) => `<div class="li"><span class="n">${i + 1}</span><div><h3>${esc(x.title)}</h3><p>${esc(x.detail)}</p><span class="own">负责：${esc(x.owner)}</span></div></div>`).join("")}</div>
<div class="card"><div class="ct"><h2>风险提示</h2></div>${D.risks.map((r) => `<div class="risk"><h3>${esc(r.title)}</h3><p>${esc(r.detail)}</p></div>`).join("")}</div>
</div>
<div class="foot"><span>口径：首次解决率指无需二次联系即解决的会话占比；平均首响为会话接入至坐席首次回复的时长。</span><span>${esc(D.org)}</span></div>
</div>`)
})()

// ---------------------------------------------------------------- b: report card
const b = (() => {
  const grade = {
    fcr: (v) => v >= 82 ? "A" : v >= 79 ? "B+" : v >= 76 ? "B" : v >= 72 ? "C" : "D",
    resp: (v) => v <= 35 ? "A" : v <= 40 ? "B+" : v <= 45 ? "B" : v <= 55 ? "C" : "D",
    csat: (v) => v >= 93 ? "A" : v >= 91 ? "B+" : v >= 89 ? "B" : v >= 87 ? "C" : "D",
    qa: (v) => v >= 90 ? "A" : v >= 87 ? "B+" : v >= 85 ? "B" : v >= 83 ? "C" : "D",
  }
  const pts = { A: 4, "B+": 3.5, B: 3, C: 2, D: 1 }
  const overall = (gs) => { const m = gs.reduce((a, g) => a + pts[g], 0) / gs.length; return m >= 3.75 ? "A" : m >= 3.25 ? "B+" : m >= 2.75 ? "B" : m >= 2 ? "C" : "D" }
  const gc = (g) => ({ A: "ga", "B+": "gb", B: "gb", C: "gc", D: "gd" })[g]
  const G = (g) => `<span class="g ${gc(g)}">${g}</span>`
  const center = [grade.fcr(78.2), grade.resp(44), grade.csat(90.3), grade.qa(Q.score)]
  const og = overall(center)
  const ink = "#1f2a44", red = "#b3261e"
  const cw = 484, pad = [18, 20, 26, 44]
  const c1 = shade(line({ w: cw, h: 190, points: Y.map((d) => ({ x: d.date, y: d.sessions })), ticks: [1400, 1700, 2000, 2300], xEvery: 5, stroke: ink, grid: "#e4dccb", text: "#7a7264", pad, size: 11, last: false, width: 1.5 }),
    { w: cw, h: 190, pad, n: Y.length, from: PEAK[0], to: PEAK[1], fill: "rgba(179,38,30,.07)" })
  const c2 = shade(line({ w: cw, h: 190, points: Y.map((d) => ({ x: d.date, y: d.firstResponse })), ticks: [30, 40, 50, 60], xEvery: 5, stroke: red, grid: "#e4dccb", text: "#7a7264", pad, size: 11, last: false, width: 1.5 }),
    { w: cw, h: 190, pad, n: Y.length, from: PEAK[0], to: PEAK[1], fill: "rgba(179,38,30,.07)" })
  const shades = ["#1f2a44", "#3d4b6b", "#64708c", "#8e97ab", "#b7bdca", "#d8dce4"]
  const rows = [
    ["会话量", `${K.sessions.value} 通`, K.sessions.change, "—", "业务量指标，不参与评级；月中受仓储切换影响明显。"],
    ["首次解决率", `${K.fcr.value}%`, K.fcr.change, G(grade.fcr(78.2)), "低于 80% 的中心目标，售后服务组拖累较大。"],
    ["平均首响时长", `${K.response.value} 秒`, K.response.change, G(grade.resp(44)), "高峰周首响超过 50 秒，夜班组全月偏慢。"],
    ["客户满意度", `${K.csat.value}%`, K.csat.change, G(grade.csat(90.3)), "物流类会话满意度偏低，拉低整体表现。"],
    ["质检平均分", `${Q.score} 分`, Q.change, G(grade.qa(Q.score)), `高于 ${Q.target} 分合格线，红线违规 ${Q.violations} 次。`],
  ]
  return doc(`
body{background:#e9e3d6;font-family:"Noto Sans SC";color:${ink};font-size:14px;padding:40px 0 48px}
.sheet{width:1120px;margin:0 auto;background:#fbf8f0;border:1px solid #d6ccb6;box-shadow:0 2px 0 #d6ccb6;padding:12px}
.frame{border:3px double #b9ad93;padding:40px 52px 44px}
.topline{display:flex;justify-content:space-between;font-size:12px;color:#7a7264;letter-spacing:1px}
.topline .mono{font-family:"IBM Plex Mono"}
h1{font-family:"Noto Serif SC";font-weight:600;font-size:38px;text-align:center;letter-spacing:10px;margin-top:20px}
.per{text-align:center;color:#7a7264;margin-top:8px;font-size:14px;letter-spacing:1px}
.info{display:grid;grid-template-columns:repeat(5,1fr);border:1px solid #b9ad93;margin-top:28px}
.info div{padding:10px 14px;border-right:1px solid #d6ccb6}
.info div:last-child{border-right:0}
.info span{display:block;font-size:12px;color:#7a7264}
.info b{display:block;font-family:"Noto Serif SC";font-weight:600;font-size:17px;margin-top:2px}
.overall{display:grid;grid-template-columns:230px 1fr;gap:32px;margin-top:30px;align-items:stretch}
.badge{border:1px solid #b9ad93;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px}
.badge .lb{font-size:13px;color:#7a7264;letter-spacing:4px}
.badge .big{width:120px;height:120px;border-radius:50%;border:3px solid ${red};color:${red};font-family:"Noto Serif SC";font-weight:600;font-size:64px;display:grid;place-items:center;margin:12px 0 10px;transform:rotate(-6deg)}
.badge .sc{font-size:13px;color:#4a5068}
.badge .sc b{font-family:"IBM Plex Mono";font-weight:500;font-size:16px;color:${ink}}
.comment{border:1px solid #b9ad93;padding:18px 24px;position:relative}
.comment h3,.sec h2{font-family:"Noto Serif SC";font-weight:600}
.comment h3{font-size:16px;margin-bottom:8px}
.comment p{font-family:"Noto Serif SC";font-size:16px;line-height:34px;background:repeating-linear-gradient(transparent 0 33px,#e0d7c3 33px 34px);text-indent:2em}
.sec{margin-top:36px}
.sec h2{font-size:20px;display:flex;align-items:baseline;gap:12px;padding-bottom:8px;border-bottom:2px solid ${ink};margin-bottom:4px}
.sec h2 small{font-family:"Noto Sans SC";font-weight:400;font-size:12px;color:#7a7264;letter-spacing:0}
table{font-size:14px}
th{font-weight:500;font-size:12px;color:#7a7264;text-align:left;padding:10px 12px;border-bottom:1px solid #b9ad93}
td{padding:11px 12px;border-bottom:1px solid #e0d7c3;vertical-align:middle}
.c{text-align:center}.r{text-align:right}
.mono{font-family:"IBM Plex Mono";font-size:14px}
.neg{color:${red}}.pos{color:#2d6a4f}
.g{display:inline-grid;place-items:center;min-width:34px;height:26px;padding:0 6px;font-family:"Noto Serif SC";font-weight:600;font-size:15px;border-radius:4px}
.ga{background:#dfeee4;color:#2d6a4f}.gb{background:#e2e6ef;color:#2f3d63}.gc{background:#f6e8cc;color:#8a5a00}.gd{background:transparent;color:${red};border:1.5px solid ${red};border-radius:50%;width:30px;min-width:30px;height:30px}
.sub{font-size:13px;color:#4a5068}
.tg td:nth-child(n+4){text-align:center}
.tg .v{font-family:"IBM Plex Mono";font-size:13px;color:#4a5068;margin-right:8px}
.charts{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:14px}
.charts h3{font-size:14px;font-weight:500;margin-bottom:6px}
.charts h3 span{font-weight:400;color:#7a7264;font-size:12px;margin-left:8px}
.stack{display:flex;height:34px;margin-top:16px;border:1px solid ${ink}}
.stack div{height:100%}
.leg{display:grid;grid-template-columns:repeat(6,1fr);margin-top:12px}
.leg div{padding:4px 12px 0 0}
.leg i{display:inline-block;width:10px;height:10px;margin-right:6px;vertical-align:0}
.leg b{display:block;font-family:"IBM Plex Mono";font-weight:500;font-size:18px;margin-top:4px}
.leg span{font-size:12px;color:#7a7264}
.three{display:grid;grid-template-columns:1fr 1fr 1fr;gap:28px;margin-top:16px}
.three h3{font-family:"Noto Serif SC";font-weight:600;font-size:16px;margin-bottom:10px;padding-left:10px;border-left:4px solid ${ink}}
.three ol{list-style:none}
.three li{padding:10px 0;border-bottom:1px dashed #cfc5ae;line-height:1.75;font-size:14px}
.three li b{font-weight:500;display:block}
.three li span{color:#4a5068;font-size:13px}
.three .warn h3{border-color:${red};color:${red}}
.sign{display:flex;justify-content:flex-end;gap:48px;margin-top:40px;align-items:center;font-size:14px;color:#4a5068}
.sign u{display:inline-block;width:120px;border-bottom:1px solid ${ink};text-decoration:none;margin-left:8px}
.stamp{width:104px;height:104px;border-radius:50%;border:2.5px solid rgba(179,38,30,.75);color:rgba(179,38,30,.8);display:grid;place-items:center;font-family:"Noto Serif SC";font-weight:600;font-size:15px;text-align:center;line-height:1.4;transform:rotate(-12deg)}
`, `<div class="sheet"><div class="frame">
<div class="topline"><span>${esc(D.org)}</span><span class="mono">编号 QC-2026-09</span></div>
<h1>九月服务成绩单</h1>
<div class="per">考评期间 ${esc(D.period)}</div>
<div class="info"><div><span>受评单位</span><b>客户服务中心</b></div><div><span>在岗坐席</span><b>${agents} 人</b></div><div><span>抽检会话</span><b>${num(Q.sampled)} 通</b></div><div><span>抽检比例</span><b>${Q.sampleRate}</b></div><div><span>红线违规</span><b>${Q.violations} 次</b></div></div>
<div class="overall"><div class="badge"><div class="lb">综合评定</div><div class="big">${og}</div><div class="sc">质检平均分 <b>${Q.score}</b>（${esc(Q.change)}）</div></div>
<div class="comment"><h3>总评</h3><p>${esc(D.summary)}</p></div></div>

<div class="sec"><h2>一、主要科目<small>等级由高到低为 A、B+、B、C、D</small></h2>
<table><tr><th style="width:150px">科目</th><th class="r" style="width:120px">本月成绩</th><th class="r" style="width:150px">较上月</th><th class="c" style="width:90px">等级</th><th>说明</th></tr>
${rows.map((r) => `<tr><td><b style="font-weight:500">${r[0]}</b></td><td class="r mono">${r[1]}</td><td class="r ${isNeg(r[2]) || r[0] === "平均首响时长" ? "neg" : "pos"}">${esc(r[2])}</td><td class="c">${r[3]}</td><td class="sub">${esc(r[4])}</td></tr>`).join("")}</table></div>

<div class="sec"><h2>二、各班组成绩<small>每格左侧为数值，右侧为等级</small></h2>
<table class="tg"><tr><th>班组</th><th>组长</th><th class="r">坐席 / 会话量</th><th class="c">首次解决率</th><th class="c">平均首响</th><th class="c">满意度</th><th class="c">质检得分</th><th class="c">综合</th></tr>
${T.map((t) => { const gs = [grade.fcr(t.fcr), grade.resp(t.firstResponse), grade.csat(t.csat), grade.qa(t.qa)]; return `<tr><td><b style="font-weight:500">${esc(t.name)}</b></td><td class="sub">${esc(t.lead)}</td><td class="r mono" style="font-size:13px">${t.agents} / ${num(t.sessions)}</td>
<td><span class="v">${t.fcr.toFixed(1)}%</span>${G(gs[0])}</td><td><span class="v">${t.firstResponse} 秒</span>${G(gs[1])}</td><td><span class="v">${t.csat.toFixed(1)}%</span>${G(gs[2])}</td><td><span class="v">${t.qa.toFixed(1)}</span>${G(gs[3])}</td><td>${G(overall(gs))}</td></tr>` }).join("")}</table></div>

<div class="sec"><h2>三、每日走势<small>浅红区间为 9 月 14 日至 19 日仓储切换期</small></h2>
<div class="charts"><div><h3>会话量<span>单位：通</span></h3>${c1}</div><div><h3>平均首响时长<span>单位：秒</span></h3>${c2}</div></div></div>

<div class="sec"><h2>四、咨询构成<small>按问题分类的会话占比，括号内为较上月变化（百分点）</small></h2>
<div class="stack">${I.map((x, i) => `<div style="width:${x.share}%;background:${shades[i]}"></div>`).join("")}</div>
<div class="leg">${I.map((x, i) => `<div><i style="background:${shades[i]}"></i><span>${esc(x.name)}</span><b>${x.share}%</b><span class="${isNeg(x.change) ? "" : "neg"}">（${esc(x.change)}）</span></div>`).join("")}</div></div>

<div class="sec"><h2>五、评语与改进</h2>
<div class="three">
<div><h3>本月观察</h3><ol>${D.findings.map((f) => `<li><b>${esc(f.title)}</b><span>${esc(f.detail)}</span></li>`).join("")}</ol></div>
<div><h3>改进计划</h3><ol>${D.actions.map((x) => `<li><b>${esc(x.title)}</b><span>${esc(x.detail)}（${esc(x.owner)}）</span></li>`).join("")}</ol></div>
<div class="warn"><h3>需要注意</h3><ol>${D.risks.map((r) => `<li><b>${esc(r.title)}</b><span>${esc(r.detail)}</span></li>`).join("")}</ol></div>
</div></div>

<div class="sign"><span>质检组长<u></u></span><span>中心负责人<u></u></span><span>2026 年 10 月 8 日</span><div class="stamp">澜岸家居<br>质检专用</div></div>
</div></div>`)
})()

// ---------------------------------------------------------------- c: formal notice (公文)
const c = (() => {
  const cw = 808, pad = [16, 24, 28, 50]
  const chart = line({ w: cw, h: 230, points: Y.map((d) => ({ x: d.date, y: d.sessions })), ticks: [1400, 1600, 1800, 2000, 2200], xEvery: 3, stroke: "#000", grid: "#d0d0d0", text: "#333", pad, size: 12, font: "'Noto Serif SC'", last: false, width: 1.4, dots: true })
  const cn = ["一", "二", "三", "四", "五", "六", "七"]
  return doc(`
body{background:#dcdcdc;padding:36px 0 60px;font-family:"Noto Serif SC";color:#111}
.paper{width:1000px;margin:0 auto;background:#fff;padding:72px 96px 80px;box-shadow:0 1px 6px rgba(0,0,0,.18)}
.red{color:#c8102e;text-align:center;font-weight:600;font-size:46px;letter-spacing:6px;line-height:1.2}
.no{text-align:center;font-size:17px;margin-top:26px}
.rule{border-top:3px solid #c8102e;margin-top:12px}
.rule2{border-top:1px solid #c8102e;margin-top:3px}
h1{text-align:center;font-weight:600;font-size:26px;line-height:1.6;margin:44px 0 30px}
p{font-size:17px;line-height:2;text-align:justify}
.ind{text-indent:2em}
h2{font-family:"Noto Sans SC";font-weight:500;font-size:18px;margin:22px 0 4px;text-indent:2em}
.bt{font-weight:600}
.cap{text-align:center;font-size:15px;margin:16px 0 8px;font-weight:600}
table{font-family:"Noto Sans SC";font-size:15px;margin-bottom:6px}
th,td{border:1px solid #000;padding:7px 10px;text-align:center}
td:nth-child(-n+2){white-space:nowrap}
th{font-weight:500;background:#f2f2f2}
td.l{text-align:left}
.src{font-size:13px;color:#444;font-family:"Noto Sans SC";margin-bottom:6px}
.fig{display:flex;justify-content:center;margin-top:8px}
.sig{text-align:right;margin-top:48px;font-size:17px;line-height:2;padding-right:2em}
.cc{margin-top:56px;border-top:1px solid #000;border-bottom:1px solid #000;font-size:15px}
.cc div{padding:6px 1em;display:flex;justify-content:space-between}
.cc div+div{border-top:1px solid #000}
`, `<div class="paper">
<div class="red">澜岸家居客户服务中心文件</div>
<div class="no">澜客服质〔2026〕27 号</div>
<div class="rule"></div><div class="rule2"></div>
<h1>关于 2026 年 9 月客服质检情况的通报</h1>
<p>各班组、相关部门：</p>
<p class="ind">为持续提升服务质量，质检组对 ${esc(D.period)}的在线及电话会话进行了统计与抽检，共抽检会话 ${num(Q.sampled)} 通，抽检比例 ${Q.sampleRate}。现将有关情况通报如下：</p>

<h2>一、总体情况</h2>
<p class="ind">${esc(D.summary)}</p>
<div class="cap">表 1　九月主要服务指标</div>
<table><tr><th style="width:28%">指标</th><th>九月</th><th>较八月变化</th><th style="width:34%">备注</th></tr>
${D.kpis.map((k) => `<tr><td>${esc(k.label)}</td><td>${esc(kv(k))} ${esc(k.unit)}</td><td>${esc(k.change)}</td><td class="l">${k.direction === "up" ? "向好" : "需改进"}</td></tr>`).join("")}
<tr><td>质检平均分</td><td>${Q.score} 分</td><td>${esc(Q.change)}</td><td class="l">合格线 ${Q.target} 分；红线违规 ${Q.violations} 次</td></tr></table>

<h2>二、业务量变化情况</h2>
<p class="ind">九月日均会话 ${num(Math.round(51810 / 30))} 通。9 月 14 日至 19 日华南仓切换仓储系统期间，日会话量持续在 1,870 通以上，19 日达到全月最高的 2,200 通；同期平均首响时长升至 51 至 57 秒，首次解决率降至 74.1% 至 75.9%。20 日后各项指标逐步恢复。</p>
<div class="cap">图 1　九月每日会话量（单位：通）</div>
<div class="fig">${chart}</div>

<h2>三、各班组指标情况</h2>
<p class="ind">各班组主要指标见表 2。售前咨询一组各项指标较为均衡；投诉处理组质检得分最高，但因承接疑难件，首次解决率与满意度偏低；夜班组平均首响时长为各组最长。</p>
<div class="cap">表 2　各班组九月主要指标</div>
<table><tr><th>班组</th><th>组长</th><th>坐席数（人）</th><th>会话量（通）</th><th>首次解决率（%）</th><th>平均首响（秒）</th><th>满意度（%）</th><th>质检得分</th></tr>
${T.map((t) => `<tr><td>${esc(t.name)}</td><td>${esc(t.lead)}</td><td>${t.agents}</td><td>${num(t.sessions)}</td><td>${t.fcr.toFixed(1)}</td><td>${t.firstResponse}</td><td>${t.csat.toFixed(1)}</td><td>${t.qa.toFixed(1)}</td></tr>`).join("")}
<tr><td>合计 / 平均</td><td>—</td><td>${agents}</td><td>${num(51810)}</td><td>${K.fcr.value}</td><td>${K.response.value}</td><td>${K.csat.value}</td><td>${Q.score}</td></tr></table>

<h2>四、咨询问题分类情况</h2>
<p class="ind">按会话首个问题标签统计，物流配送类占比最高，较上月上升 8.2 个百分点，其余各类占比均有不同程度下降。</p>
<div class="cap">表 3　九月咨询问题分类占比</div>
<table><tr>${I.map((x) => `<th>${esc(x.name)}</th>`).join("")}</tr><tr>${I.map((x) => `<td>${x.share}%</td>`).join("")}</tr><tr>${I.map((x) => `<td>较上月 ${esc(x.change)}</td>`).join("")}</tr></table>
<div class="src">注：变化单位为百分点。</div>

<h2>五、存在的主要问题</h2>
${D.findings.map((f, i) => `<p class="ind"><span class="bt">（${cn[i]}）${esc(f.title)}。</span>${esc(f.detail)}</p>`).join("")}

<h2>六、下一步工作安排</h2>
${D.actions.map((x, i) => `<p class="ind"><span class="bt">${i + 1}. ${esc(x.title)}。</span>${esc(x.detail)}（责任单位：${esc(x.owner)}）</p>`).join("")}

<h2>七、需关注的风险</h2>
${D.risks.map((r, i) => `<p class="ind"><span class="bt">（${cn[i]}）${esc(r.title)}。</span>${esc(r.detail)}</p>`).join("")}
<p class="ind">请各班组对照本通报查找不足，于 10 月 20 日前将整改措施报质检组。</p>

<div class="sig">澜岸家居客户服务中心<br>2026 年 10 月 8 日</div>
<div class="cc"><div><span>抄送：运营管理部，仓储物流部，人力资源部。</span></div><div><span>澜岸家居客户服务中心质检组</span><span>2026 年 10 月 8 日印发</span></div></div>
</div>`)
})()

// ---------------------------------------------------------------- d: playful chat-themed SaaS
const d = (() => {
  const tiles = [
    { k: K.sessions, bg: "#ffe0e6", fg: "#d6336c", ic: "量" },
    { k: K.fcr, bg: "#d3f5e6", fg: "#0c8a5c", ic: "解" },
    { k: K.response, bg: "#e5defe", fg: "#6741d9", ic: "响" },
    { k: K.csat, bg: "#fff1bf", fg: "#c27c00", ic: "满" },
    { k: { label: "质检平均分", value: Q.score, unit: "分", change: Q.change, direction: "up" }, bg: "#d0ebff", fg: "#1c7ed6", ic: "检" },
  ]
  const pal = ["#ff8787", "#ffa94d", "#ffd43b", "#69db7c", "#74c0fc", "#b197fc"]
  let acc = 0
  const cone = I.map((x, i) => { const s = acc; acc += x.share; return `${pal[i]} ${s}% ${acc}%` }).join(",")
  const max = 2200
  const teamCol = ["#ff8787", "#ffa94d", "#69db7c", "#74c0fc", "#b197fc", "#f783ac"]
  return doc(`
body{background:#fff7f0;font-family:"Noto Sans SC";color:#333;font-size:15px;padding-bottom:50px}
.wrap{width:1160px;margin:0 auto}
.nav{display:flex;align-items:center;justify-content:space-between;padding:22px 0}
.brand{display:flex;align-items:center;gap:10px;font-weight:600;font-size:18px;color:#ff6b6b}
.brand i{width:36px;height:36px;border-radius:12px;background:#ff6b6b;color:#fff;display:grid;place-items:center;font-style:normal}
.nav .p{background:#fff;border-radius:999px;padding:8px 18px;font-size:14px;color:#888;box-shadow:0 2px 8px rgba(255,107,107,.12)}
.hero{text-align:center;padding:24px 0 10px}
.hero h1{font-size:42px;font-weight:600;color:#333}
.hero h1 span{background:linear-gradient(transparent 60%,#ffd8a8 60%);padding:0 4px}
.hero .s{color:#999;margin-top:10px;font-size:15px}
.hello{display:flex;gap:18px;align-items:flex-start;margin:30px auto 0;width:900px}
.ava{flex:none;width:64px;height:64px;border-radius:50%;background:#ffc9c9;border:4px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.08);display:grid;place-items:center;font-size:24px;font-weight:600;color:#e03131}
.bub{background:#fff;border-radius:6px 26px 26px 26px;padding:20px 26px;line-height:1.9;box-shadow:0 6px 20px rgba(255,140,100,.12);color:#555}
.bub .who{font-size:13px;color:#ff8787;font-weight:500;margin-bottom:4px}
.tiles{display:grid;grid-template-columns:repeat(5,1fr);gap:18px;margin-top:40px}
.tile{border-radius:26px;padding:22px 20px;text-align:center}
.tile .ic{width:44px;height:44px;border-radius:50%;background:#fff;margin:0 auto;display:grid;place-items:center;font-weight:600;font-size:18px}
.tile .l{margin-top:12px;font-size:14px;color:#666}
.tile .v{font-size:38px;font-weight:600;margin-top:4px;line-height:1.2}
.tile .v small{font-size:15px;font-weight:500;margin-left:2px}
.tile .c{display:inline-block;margin-top:8px;background:#fff;border-radius:999px;padding:3px 12px;font-size:13px}
.st{text-align:center;font-size:24px;font-weight:600;margin:56px 0 22px}
.st::after{content:"";display:block;width:56px;height:6px;border-radius:3px;background:#ffa94d;margin:10px auto 0}
.row{display:grid;grid-template-columns:7fr 5fr;gap:24px}
.box{background:#fff;border-radius:28px;padding:26px 30px;box-shadow:0 6px 24px rgba(255,140,100,.10)}
.box h3{font-size:17px;font-weight:600;margin-bottom:4px}
.box .h{font-size:13px;color:#aaa;margin-bottom:16px}
.cols{display:flex;align-items:flex-end;gap:5px;height:210px;border-bottom:2px dashed #ffe0cc;padding-bottom:0}
.cols div{flex:1;border-radius:8px 8px 3px 3px;background:#ffc9a8;position:relative}
.cols div.hot{background:#ff8787}
.cols div b{position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-size:12px;font-weight:500;color:#e03131;white-space:nowrap}
.xl{display:flex;gap:5px;margin-top:8px}
.xl span{flex:1;text-align:center;font-size:11px;color:#aaa;white-space:nowrap}
.tip{margin-top:16px;background:#fff4e6;border-radius:14px;padding:10px 16px;font-size:13px;color:#d9480f}
.pie{display:flex;align-items:center;gap:28px}
.donut{flex:none;width:190px;height:190px;border-radius:50%;background:conic-gradient(${cone});display:grid;place-items:center}
.donut div{width:112px;height:112px;border-radius:50%;background:#fff;display:grid;place-items:center;text-align:center;font-size:13px;color:#999;line-height:1.5}
.donut div b{display:block;font-size:26px;color:#333;font-weight:600}
.lg{flex:1;display:flex;flex-direction:column;gap:10px}
.lg div{display:flex;align-items:center;gap:10px;font-size:14px}
.lg i{width:14px;height:14px;border-radius:5px}
.lg b{margin-left:auto;font-weight:600}
.lg em{font-style:normal;font-size:12px;color:#aaa;width:38px;text-align:right}
.lg em.up{color:#e03131}
.teams{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.tm{background:#fff;border-radius:26px;padding:22px 24px;box-shadow:0 6px 24px rgba(255,140,100,.10)}
.tm .tn{display:inline-block;padding:4px 14px;border-radius:999px;color:#fff;font-weight:500;font-size:15px}
.tm .ld{float:right;font-size:13px;color:#aaa;margin-top:5px}
.tm .g{display:grid;grid-template-columns:1fr 1fr;gap:12px 10px;margin-top:18px}
.tm .g div{background:#fafafa;border-radius:14px;padding:10px 12px}
.tm .g span{display:block;font-size:12px;color:#999}
.tm .g b{font-size:20px;font-weight:600}
.tm .g b small{font-size:12px;font-weight:400;color:#999;margin-left:2px}
.tm .q{margin-top:16px;font-size:13px;color:#666;display:flex;align-items:center;gap:10px}
.tm .q .bar{flex:1;height:10px;background:#f1f3f5;border-radius:5px;overflow:hidden}
.tm .q .bar i{display:block;height:100%;border-radius:5px}
.tm .q b{font-weight:600;color:#333}
.chat{width:920px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
.msg{display:flex;gap:14px;align-items:flex-start}
.msg.r{flex-direction:row-reverse}
.msg .ava{width:52px;height:52px;font-size:19px}
.msg.r .ava{background:#d0ebff;color:#1c7ed6}
.msg .bub{max-width:640px}
.msg.r .bub{border-radius:26px 6px 26px 26px;background:#e7f5ff;color:#335}
.bub b{display:block;color:#333;font-weight:600;margin-bottom:2px}
.todo{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.td{background:#fff;border-radius:26px;padding:24px;box-shadow:0 6px 24px rgba(255,140,100,.10);position:relative}
.td .n{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:600;font-size:18px}
.td h4{font-size:17px;font-weight:600;margin:14px 0 6px}
.td p{font-size:14px;color:#777;line-height:1.8}
.td .o{display:inline-block;margin-top:12px;font-size:12px;background:#fff0f6;color:#d6336c;border-radius:999px;padding:3px 12px}
.notes{display:flex;gap:30px;justify-content:center;margin-top:10px}
.note{width:420px;background:#fff3bf;padding:24px 26px 26px;border-radius:4px;box-shadow:0 8px 18px rgba(200,150,0,.18);transform:rotate(-1.5deg)}
.note+.note{transform:rotate(1.2deg);background:#ffe8cc}
.note h4{font-size:17px;font-weight:600;color:#a65f00;margin-bottom:8px}
.note p{line-height:1.8;color:#7a5a20;font-size:14px}
.end{text-align:center;color:#bbb;margin-top:56px;font-size:14px}
`, `<div class="wrap">
<div class="nav"><div class="brand"><i>澜</i>澜岸客服 · 服务小报</div><div class="p">${esc(D.period)}</div></div>
<div class="hero"><h1>九月客服<span>质检月报</span>来啦</h1><div class="s">${esc(D.org)} · 质检组出品</div></div>
<div class="hello"><div class="ava">澜</div><div class="bub"><div class="who">质检小澜</div>嗨，大家好～ ${esc(D.summary)}</div></div>

<div class="tiles">${tiles.map((t) => `<div class="tile" style="background:${t.bg}"><div class="ic" style="color:${t.fg}">${t.ic}</div><div class="l">${esc(t.k.label)}</div><div class="v" style="color:${t.fg}">${esc(kv(t.k))}<small>${esc(t.k.unit)}</small></div><div class="c" style="color:${t.k.direction === "up" ? "#0c8a5c" : "#e03131"}">${t.k.direction === "up" ? "↑" : "↓"} ${esc(t.k.change)}</div></div>`).join("")}</div>

<div class="st">每天都在忙什么</div>
<div class="row">
<div class="box"><h3>每天的会话量</h3><div class="h">单位：通 · 红色柱子是华南仓切换那几天</div>
<div class="cols">${Y.map((x, i) => `<div class="${i >= PEAK[0] && i <= PEAK[1] ? "hot" : ""}" style="height:${(x.sessions / max) * 100}%">${x.sessions === 2200 || x.sessions === 1490 ? `<b>${num(x.sessions)}</b>` : ""}</div>`).join("")}</div>
<div class="xl">${Y.map((x, i) => `<span>${i % 5 === 0 || i === 29 ? x.date : ""}</span>`).join("")}</div>
<div class="tip">9 月 19 日最忙，一天接了 2,200 通；平均首响最长到了 57 秒。</div></div>
<div class="box"><h3>大家都在问什么</h3><div class="h">问题分类占比 · 后面是较上月变化</div>
<div class="pie"><div class="donut"><div><span><b>${I.length}</b>类问题</span></div></div>
<div class="lg">${I.map((x, i) => `<div><i style="background:${pal[i]}"></i>${esc(x.name)}<b>${x.share}%</b><em class="${isNeg(x.change) ? "" : "up"}">${esc(x.change)}</em></div>`).join("")}</div></div></div>
</div>

<div class="st">各个小组的表现</div>
<div class="teams">${T.map((t, i) => `<div class="tm"><span class="tn" style="background:${teamCol[i]}">${esc(t.name)}</span><span class="ld">组长 ${esc(t.lead)} · ${t.agents} 人</span>
<div class="g"><div><span>会话量</span><b>${num(t.sessions)}<small>通</small></b></div><div><span>首次解决率</span><b>${t.fcr.toFixed(1)}<small>%</small></b></div><div><span>平均首响</span><b>${t.firstResponse}<small>秒</small></b></div><div><span>满意度</span><b>${t.csat.toFixed(1)}<small>%</small></b></div></div>
<div class="q">质检得分<div class="bar"><i style="width:${(t.qa - 70) / 30 * 100}%;background:${teamCol[i]}"></i></div><b>${t.qa.toFixed(1)}</b></div></div>`).join("")}</div>

<div class="st">小澜发现了这些</div>
<div class="chat">${D.findings.map((f, i) => `<div class="msg ${i % 2 ? "r" : ""}"><div class="ava">${i % 2 ? "质" : "澜"}</div><div class="bub"><b>${esc(f.title)}</b>${esc(f.detail)}</div></div>`).join("")}</div>

<div class="st">接下来我们要做</div>
<div class="todo">${D.actions.map((x, i) => `<div class="td"><div class="n" style="background:${["#ff8787", "#ffa94d", "#74c0fc"][i]}">${i + 1}</div><h4>${esc(x.title)}</h4><p>${esc(x.detail)}</p><span class="o">${esc(x.owner)}</span></div>`).join("")}</div>

<div class="st">还要小心</div>
<div class="notes">${D.risks.map((r) => `<div class="note"><h4>${esc(r.title)}</h4><p>${esc(r.detail)}</p></div>`).join("")}</div>
<div class="end">有问题随时找质检组～ 我们下个月见</div>
</div>`)
})()

// ---------------------------------------------------------------- e: heatmap-centric analysis
const e = (() => {
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})` }
  const stops = ["#f7f3ee", "#f6dcc0", "#efab73", "#dc6a33", "#a83a14"]
  const heat = (t) => { t = Math.max(0, Math.min(1, t)); const s = t * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(s)); return mix(stops[i], stops[i + 1], s - i) }
  const norm = (vals, invert) => { const lo = Math.min(...vals), hi = Math.max(...vals); return (v) => invert ? (hi - v) / (hi - lo) : (v - lo) / (hi - lo) }
  const rowsDef = [
    { label: "会话量", unit: "通", vals: Y.map((x) => x.sessions), f: (v) => String(v), t: norm(Y.map((x) => x.sessions)) },
    { label: "平均首响", unit: "秒", vals: Y.map((x) => x.firstResponse), f: (v) => String(v), t: norm(Y.map((x) => x.firstResponse)) },
    { label: "首次解决率", unit: "%", vals: Y.map((x) => x.fcr), f: (v) => v.toFixed(1), t: norm(Y.map((x) => x.fcr), true) },
  ]
  const cell = (t, txt) => `<td style="background:${heat(t)};color:${t > 0.62 ? "#fff" : "#3a2a1e"}">${txt}</td>`
  const dayHeat = `<table class="hm"><tr><th class="lab"></th>${Y.map((x, i) => `<th class="${x.weekday === "六" || x.weekday === "日" ? "we" : ""}">${i + 1}<br><span>${x.weekday}</span></th>`).join("")}</tr>
${rowsDef.map((r) => `<tr><th class="lab">${r.label}<span>${r.unit}</span></th>${r.vals.map((v) => cell(r.t(v), r.f(v))).join("")}</tr>`).join("")}</table>`
  // team matrix: deviation from the centre-wide value, oriented so positive = better
  const metrics = [
    { k: "per", label: "人均会话", f: (t) => num(per(t)), v: (t) => per(t), ref: Math.round(51810 / agents), better: 1 },
    { k: "fcr", label: "首次解决率", f: (t) => t.fcr.toFixed(1) + "%", v: (t) => t.fcr, ref: 78.2, better: 1 },
    { k: "resp", label: "平均首响", f: (t) => t.firstResponse + " 秒", v: (t) => t.firstResponse, ref: 44, better: -1 },
    { k: "csat", label: "满意度", f: (t) => t.csat.toFixed(1) + "%", v: (t) => t.csat, ref: 90.3, better: 1 },
    { k: "qa", label: "质检得分", f: (t) => t.qa.toFixed(1), v: (t) => t.qa, ref: Q.score, better: 1 },
  ]
  metrics.forEach((m) => { m.span = Math.max(...T.map((t) => Math.abs(m.v(t) - m.ref))) })
  const dev = (m, t) => ((m.v(t) - m.ref) * m.better) / m.span
  const div = (d) => d >= 0 ? mix("#f4f3f0", "#1f6f66", Math.min(1, d) * 0.9) : mix("#f4f3f0", "#c4501d", Math.min(1, -d) * 0.9)
  const weakest = (t) => metrics.slice(1).reduce((w, m) => dev(m, t) < dev(w, t) ? m : w, metrics[1])
  const teamHeat = `<table class="tm"><tr><th class="l">班组</th><th class="l">组长</th><th class="r">坐席</th><th class="r">会话量</th>${metrics.map((m) => `<th>${m.label}</th>`).join("")}<th class="l">最弱项</th></tr>
<tr class="ref"><td class="l">中心整体</td><td class="l">—</td><td class="r">${agents}</td><td class="r">${num(51810)}</td>${metrics.map((m) => `<td>${m.k === "per" ? num(m.ref) : m.k === "resp" ? m.ref + " 秒" : m.k === "qa" ? m.ref.toFixed(1) : m.ref.toFixed(1) + "%"}</td>`).join("")}<td class="l">—</td></tr>
${T.map((t) => `<tr><td class="l"><b>${esc(t.name)}</b></td><td class="l mut">${esc(t.lead)}</td><td class="r">${t.agents}</td><td class="r">${num(t.sessions)}</td>${metrics.map((m) => { const d = dev(m, t); return `<td class="hc" style="background:${div(d)};color:${Math.abs(d) > 0.6 ? "#fff" : "#222"}">${m.f(t)}</td>` }).join("")}<td class="l wk">${weakest(t).label}</td></tr>`).join("")}</table>`
  const issCol = ["#a83a14", "#dc6a33", "#efab73", "#f2c9a0", "#d9d4cc", "#ebe8e3"]
  // bracket over the peak days: first data column starts after the label column
  const labW = 112, colW = (1200 - labW) / 30
  return doc(`
body{background:#fff;font-family:"Noto Sans SC";color:#1c1c1c;font-size:14px;padding:44px 0 56px}
.wrap{width:1200px;margin:0 auto}
.mono{font-family:"IBM Plex Mono"}
header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:16px;border-bottom:1px solid #1c1c1c}
header h1{font-size:28px;font-weight:600;letter-spacing:.5px}
header .k{font-size:12px;color:#8a8580;margin-bottom:6px;letter-spacing:2px}
header .r{text-align:right;font-size:13px;color:#555;line-height:1.7}
.top{display:grid;grid-template-columns:1fr 600px;gap:40px;margin-top:22px}
.top p{line-height:1.9;color:#333;font-size:15px}
.kp{display:grid;grid-template-columns:repeat(5,1fr);border-top:1px solid #ddd}
.kp div{padding:10px 10px 0 0}
.kp span{display:block;font-size:12px;color:#8a8580}
.kp b{display:block;font-family:"IBM Plex Mono";font-weight:500;font-size:22px;margin-top:4px}
.kp b small{font-family:"Noto Sans SC";font-size:12px;font-weight:400;color:#8a8580;margin-left:2px}
.kp em{font-style:normal;font-size:12px;font-family:"IBM Plex Mono"}
.kp .bad{color:#c4501d}.kp .good{color:#1f6f66}
.sec{margin-top:44px}
.sh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}
.sh h2{font-size:17px;font-weight:600}
.sh h2 i{font-style:normal;font-family:"IBM Plex Mono";color:#c4501d;margin-right:10px;font-weight:500}
.sh .d{font-size:12px;color:#8a8580}
.scale{display:flex;align-items:center;gap:8px;font-size:12px;color:#8a8580}
.scale i{display:block;width:120px;height:10px;background:linear-gradient(90deg,${stops.join(",")})}
.scale i.dv{background:linear-gradient(90deg,#c4501d,#f4f3f0,#1f6f66)}
.brk{position:relative;height:30px;margin-left:${labW}px}
.brk div{position:absolute;bottom:4px;height:10px;border:1px solid #1c1c1c;border-bottom:0;font-size:12px}
.brk span{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#fff;padding:0 6px;font-size:12px}
.hm{table-layout:fixed;border-collapse:separate;border-spacing:2px}
.hm th{font-weight:400;font-size:11px;color:#555;font-family:"IBM Plex Mono";padding:2px 0 6px;line-height:1.3}
.hm th span{font-family:"Noto Sans SC";color:#999}
.hm th.we{color:#1c1c1c;font-weight:500}.hm th.we span{color:#c4501d}
.hm th.lab{width:${labW - 4}px;text-align:left;font-family:"Noto Sans SC";font-size:13px;color:#1c1c1c;font-weight:500;padding:0 8px 0 0}
.hm th.lab span{display:block;font-size:11px;color:#999;font-weight:400}
.hm td{height:46px;text-align:center;font-family:"IBM Plex Mono";font-size:10.5px;padding:0}
.tm{border-collapse:separate;border-spacing:0 2px}
.tm th{font-weight:400;font-size:12px;color:#8a8580;padding:6px 10px;text-align:center;border-bottom:1px solid #1c1c1c}
.tm td{padding:0 12px;height:44px;text-align:center;font-family:"IBM Plex Mono";font-size:13.5px}
.tm .l{text-align:left;font-family:"Noto Sans SC"}.tm .r{text-align:right}
.tm td.l b{font-weight:500}
.tm .mut{color:#8a8580}
.tm td.hc{width:132px;border-left:2px solid #fff}
.tm tr.ref td{background:#f4f3f0;color:#555;height:36px;font-size:12.5px}
.tm .wk{color:#c4501d;font-size:13px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:48px}
.stk{display:flex;height:42px}
.stk div{display:flex;align-items:center;padding-left:8px;font-family:"IBM Plex Mono";font-size:12px;color:#fff;border-right:2px solid #fff}
.il{margin-top:14px}
.il div{display:grid;grid-template-columns:14px 1fr 60px 60px;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid #eee;font-size:13px}
.il i{width:12px;height:12px}
.il b{font-family:"IBM Plex Mono";font-weight:500;text-align:right}
.il em{font-style:normal;font-family:"IBM Plex Mono";font-size:12px;text-align:right;color:#8a8580}
.il em.up{color:#c4501d}
.obs p{line-height:1.85;color:#333;margin-bottom:10px}
.obs p b{font-weight:500}
.cols3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;border-top:1px solid #1c1c1c;padding-top:18px}
.cols3 h3{font-size:13px;font-weight:500;color:#8a8580;letter-spacing:2px;margin-bottom:12px}
.it{display:grid;grid-template-columns:28px 1fr;margin-bottom:16px}
.it .n{font-family:"IBM Plex Mono";color:#c4501d;font-size:13px;padding-top:1px}
.it h4{font-size:15px;font-weight:500;margin-bottom:3px}
.it p{font-size:13px;color:#555;line-height:1.75}
.it .o{font-size:12px;color:#8a8580;margin-top:3px}
.foot{margin-top:28px;padding-top:12px;border-top:1px solid #ddd;font-size:12px;color:#8a8580;line-height:1.8}
`, `<div class="wrap">
<header><div><div class="k">客服质检 · 月度分析</div><h1>${esc(D.title)}</h1></div><div class="r">${esc(D.org)}<br>${esc(D.period)}</div></header>
<div class="top"><p>${esc(D.summary)}</p>
<div class="kp">${D.kpis.map((k) => `<div><span>${esc(k.label)}</span><b>${esc(kv(k))}<small>${esc(k.unit)}</small></b><em class="${k.direction === "up" ? "good" : "bad"}">${esc(k.change)}</em></div>`).join("")}<div><span>质检平均分</span><b>${Q.score}<small>分</small></b><em class="good">${esc(Q.change)}</em></div></div></div>

<div class="sec"><div class="sh"><h2><i>01</i>逐日指标热力图</h2><div class="scale">压力小<i></i>压力大　（会话量越多、首响越长、解决率越低，颜色越深）</div></div>
<div class="brk"><div style="left:${PEAK[0] * colW + 2}px;width:${(PEAK[1] - PEAK[0] + 1) * colW - 2}px"><span>华南仓系统切换　9/14 – 9/19</span></div></div>
${dayHeat}</div>

<div class="sec"><div class="sh"><h2><i>02</i>班组 × 指标</h2><div class="scale">差于中心<i class="dv"></i>优于中心　（以中心整体为基准着色）</div></div>
${teamHeat}</div>

<div class="sec two">
<div><div class="sh"><h2><i>03</i>咨询问题构成</h2><div class="d">占比 / 较上月（百分点）</div></div>
<div class="stk">${I.map((x, i) => `<div style="width:${x.share}%;background:${issCol[i]};color:${i < 3 ? "#fff" : "#555"}">${x.share >= 7 ? x.share + "%" : ""}</div>`).join("")}</div>
<div class="il">${I.map((x, i) => `<div><i style="background:${issCol[i]}"></i><span>${esc(x.name)}</span><b>${x.share}%</b><em class="${isNeg(x.change) ? "" : "up"}">${esc(x.change)}</em></div>`).join("")}</div></div>
<div class="obs"><div class="sh"><h2><i>04</i>读图要点</h2><div class="d">抽检 ${num(Q.sampled)} 通 · 红线违规 ${Q.violations} 次</div></div>
<p><b>热区集中在 14 日至 19 日。</b>三行同时变深，说明会话涌入与首响、解决率的恶化是同一事件；20 日后迅速回落。</p>
<p><b>周末压力略高。</b>周六的会话量普遍高于前后工作日，首响随之上升 3 至 5 秒。</p>
<p><b>班组短板各不相同。</b>夜班组集中在首响，售后服务组集中在首次解决率，投诉处理组的低解决率与其承接疑难件有关。</p></div>
</div>

<div class="sec cols3">
<div><h3>主要发现</h3>${D.findings.map((f, i) => `<div class="it"><span class="n">0${i + 1}</span><div><h4>${esc(f.title)}</h4><p>${esc(f.detail)}</p></div></div>`).join("")}</div>
<div><h3>后续行动</h3>${D.actions.map((x, i) => `<div class="it"><span class="n">0${i + 1}</span><div><h4>${esc(x.title)}</h4><p>${esc(x.detail)}</p><div class="o">负责：${esc(x.owner)}</div></div></div>`).join("")}</div>
<div><h3>风险</h3>${D.risks.map((r, i) => `<div class="it"><span class="n">0${i + 1}</span><div><h4>${esc(r.title)}</h4><p>${esc(r.detail)}</p></div></div>`).join("")}</div>
</div>
<div class="foot">口径：首次解决率为无需二次联系即解决的会话占比；平均首响为会话接入至坐席首次回复的平均秒数；班组着色以中心整体值为基准，按各指标最大偏差归一。</div>
</div>`)
})()

export default { a, b, c, d, e }
