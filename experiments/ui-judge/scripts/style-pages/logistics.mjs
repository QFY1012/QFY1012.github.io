// 物流时效周报 in five styles: transit-map diagram, waybill sheet, light ops status board,
// plain enterprise report, hand-made daily timeline.
import { readData, doc, esc, num, bars, line } from "../style-kit.mjs"

const d = readData("logistics")
const K = Object.fromEntries(d.kpis.map((k) => [k.key, k]))
const D = d.daily
const R = d.routes
const DL = d.delays
const lastWk = D.slice(0, 7), thisWk = D.slice(7)
const rname = (r) => `${r.from}—${r.to}`
const kval = (k) => (k.key === "exceptions" ? num(k.value) : `${k.value}`)
const good = (k) => k.direction === "up"
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0)
const delayed = sum(DL, (x) => x.count)
// label only a few days so 14 points never crowd
const sparse = (idx) => (p, i) => (idx.includes(i) ? p.date : "")
const pts = (key, lab = () => "") => D.map((p, i) => ({ x: lab(p, i), y: p[key] }))
const addAfterOpen = (svg, extra) => svg.replace(/(<svg[^>]*>)/, `$1${extra}`)
const byOntime = [...R].sort((a, b) => b.ontime - a.ontime)

// ============================================================ a  线路图
const A = ["#d6453d", "#2f7fc1", "#3a9d5d", "#e39b2d", "#8a5cb8", "#1c9aa6", "#a4723a"]
function aWeekShade(svg, { w, h, pad }) {
  const [pt, pr, pb, pl] = pad
  const x = (i) => pl + (i / (D.length - 1)) * (w - pl - pr)
  const x0 = (x(6) + x(7)) / 2
  return addAfterOpen(svg, `<rect x="${x0}" y="${pt}" width="${w - pr - x0}" height="${h - pt - pb}" fill="#ece8df"/><text x="${x0 + 6}" y="${pt - 8}" style="fill:#8a8478;font-size:11px">本周</text><text x="${pl}" y="${pt - 8}" style="fill:#8a8478;font-size:11px">上周</text>`)
}
const aChart = (title, unit, key, ticks, color, last) => {
  const o = { w: 360, h: 210, pad: [30, 14, 26, 34] }
  const svg = line({ ...o, points: pts(key, sparse([0, 4, 7, 10, 13])), ticks, stroke: color, grid: "#e2ded5", text: "#8a8478", size: 11, font: "'IBM Plex Mono',monospace", width: 2.25, last, dots: true })
  return `<div class="ch"><div class="cht"><b>${title}</b><span>${unit}</span></div>${aWeekShade(svg, o)}</div>`
}
const aSx = (h) => 16 + (h / 42) * 360
const aRoute = (r, i) => {
  const x1 = aSx(r.hours)
  const grid = [12, 24, 36].map((h) => `<line x1="${aSx(h)}" x2="${aSx(h)}" y1="4" y2="46" stroke="#dcd7cc" stroke-dasharray="2 3"/>`).join("")
  return `<svg width="480" height="48" viewBox="0 0 480 48" style="display:block;font-size:13px">${grid}
<line x1="16" x2="${x1}" y1="32" y2="32" stroke="${A[i]}" stroke-width="8" stroke-linecap="round"/>
<circle cx="16" cy="32" r="7" fill="#fff" stroke="#1e2328" stroke-width="3"/><circle cx="${x1}" cy="32" r="7" fill="#fff" stroke="#1e2328" stroke-width="3"/>
<text x="16" y="15" text-anchor="middle" style="fill:#1e2328;font-weight:500">${r.from}</text><text x="${x1}" y="15" text-anchor="middle" style="fill:#1e2328;font-weight:500">${r.to}</text>
<text x="${x1 + 16}" y="36.5" style="fill:#5d6268;font-family:'IBM Plex Mono',monospace;font-size:12px">${r.hours} h</text></svg>`
}
const aAxis = `<svg width="480" height="20" style="display:block;font-family:'IBM Plex Mono',monospace;font-size:11px;fill:#8a8478">${[0, 12, 24, 36].map((h) => `<text x="${aSx(h)}" y="14" text-anchor="middle">${h}h</text>`).join("")}</svg>`
const aDelayC = ["#d6453d", "#3d434a", "#6b7178", "#979ca2", "#bfc2c6", "#dadcde"]

const a = doc(`
body{background:#f6f4ef;color:#1e2328;font-family:"Noto Sans SC",sans-serif;font-size:15px;line-height:1.65}
.mono{font-family:"IBM Plex Mono",monospace}
.wrap{width:1160px;margin:0 auto;padding:60px 0 64px}
header{display:flex;align-items:center;gap:24px}
.ln{width:78px;height:78px;border-radius:50%;border:8px solid #1e2328;background:#fff;display:flex;align-items:center;justify-content:center;font:500 20px "IBM Plex Mono",monospace;flex:none}
.org{font-size:14px;color:#6b665c;letter-spacing:.06em}
h1{font-size:40px;line-height:50px;font-weight:600;letter-spacing:.02em}
.per{font-size:14px;color:#6b665c}
.strip{display:flex;height:10px;margin-top:30px;border-radius:5px;overflow:hidden;gap:3px}
.strip i{flex:1}
.sum{font-size:16px;line-height:1.85;color:#3a3f45;margin-top:26px;max-width:860px}
.kl{display:grid;grid-template-columns:repeat(4,1fr);position:relative;margin-top:48px}
.kl::before{content:"";position:absolute;left:0;right:0;top:41px;height:6px;border-radius:3px;background:#1e2328}
.st .lb{font-size:14px;color:#6b665c;height:28px}
.st .dot{width:24px;height:24px;border-radius:50%;background:#fff;border:5px solid #1e2328;position:relative;margin-top:4px}
.st .v{font-family:"IBM Plex Mono",monospace;font-size:40px;line-height:48px;font-weight:500;margin-top:14px}
.st .v small{font-family:"Noto Sans SC",sans-serif;font-size:15px;font-weight:400;color:#6b665c;margin-left:6px}
.st .c{font-size:14px;margin-top:2px}
.ok{color:#2f7d4a}.no{color:#c23a32}
section{margin-top:64px}
h2{display:flex;align-items:center;gap:12px;font-size:22px;line-height:32px;font-weight:600}
h2 i{font-style:normal;font:500 13px "IBM Plex Mono",monospace;color:#fff;border-radius:12px;padding:1px 10px;line-height:22px}
.lead{color:#6b665c;font-size:14px;margin:4px 0 0 0}
.charts{display:grid;grid-template-columns:repeat(3,360px);justify-content:space-between;margin-top:26px}
.cht{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #1e2328;padding-bottom:6px;margin-bottom:6px}
.cht b{font-weight:600;font-size:15px}.cht span{font-size:12px;color:#8a8478}
.rt{margin-top:24px}
.rt>div{display:grid;grid-template-columns:44px 480px repeat(3,1fr) 150px;column-gap:24px;align-items:center;padding:8px 0;border-bottom:1px solid #e2ded5}
.rt>.h{font-size:12px;color:#8a8478;border-bottom:2px solid #1e2328;padding:0 0 6px;align-items:end}
.rt .n{width:32px;height:32px;border-radius:50%;color:#fff;font:500 15px/32px "IBM Plex Mono",monospace;text-align:center}
.r{text-align:right}
.rt .mono{font-size:15px}
.seg{display:flex;gap:3px;margin-top:28px}
.seg i{height:16px}
.seg i:first-child{border-radius:8px 0 0 8px}.seg i:last-child{border-radius:0 8px 8px 0}
.dl{display:grid;grid-template-columns:repeat(6,1fr);gap:20px;margin-top:18px}
.dl>div{border-top:3px solid;padding-top:10px}
.dl b{display:block;font-weight:600;font-size:15px}
.dl .p{font:500 24px/32px "IBM Plex Mono",monospace;margin-top:4px}
.dl .q{font-size:12px;color:#8a8478}
.dl p{font-size:13px;color:#5d6268;line-height:1.6;margin-top:6px}
.fd{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-top:24px}
.fd>div{background:#fff;border-radius:10px;padding:22px 24px 24px}
.fd .k{width:30px;height:30px;border-radius:50%;color:#fff;font:500 14px/30px "IBM Plex Mono",monospace;text-align:center}
.fd b{display:block;font-size:17px;font-weight:600;margin-top:14px}
.fd p{font-size:14px;color:#4a5056;margin-top:6px;line-height:1.75}
.two{display:grid;grid-template-columns:1fr 440px;gap:56px;margin-top:24px}
.stops{position:relative;padding-left:40px}
.stops::before{content:"";position:absolute;left:11px;top:10px;bottom:16px;width:6px;border-radius:3px;background:#2f7fc1}
.stops div{position:relative;padding-bottom:22px}
.stops div::before{content:"";position:absolute;left:-38px;top:5px;width:14px;height:14px;border-radius:50%;background:#fff;border:4px solid #1e2328}
.stops b{font-weight:600;font-size:16px}.stops p{font-size:14px;color:#4a5056;margin-top:2px}
.notice{border:2px solid #e39b2d;border-radius:10px;background:#fffaf0;padding:20px 24px}
.notice h3{font-size:14px;font-weight:600;color:#a86a10;letter-spacing:.08em}
.notice div{margin-top:14px}.notice div+div{border-top:1px dashed #e8cf9f;padding-top:14px}
.notice b{font-weight:600}.notice p{font-size:14px;color:#4a5056;margin-top:2px}
footer{margin-top:64px;padding-top:14px;border-top:2px solid #1e2328;display:flex;justify-content:space-between;font-size:12px;color:#8a8478}
`, `<div class="wrap">
<header><div class="ln">W40</div><div><div class="org">${esc(d.org)}</div><h1>${esc(d.title)}</h1><div class="per">${esc(d.period)}</div></div></header>
<div class="strip">${A.map((c) => `<i style="background:${c}"></i>`).join("")}</div>
<p class="sum">${esc(d.summary)}</p>

<div class="kl">${d.kpis.map((k) => `<div class="st"><div class="lb">${k.label}</div><div class="dot"></div><div class="v">${kval(k)}<small>${k.unit}</small></div><div class="c ${good(k) ? "ok" : "no"}">${k.direction === "up" ? "▲" : "▼"} 较上周 ${k.change}</div></div>`).join("")}</div>

<section><h2><i style="background:#2f7fc1">01</i>每日走势</h2><p class="lead">节前三天单量冲高，准时率在 9 月 30 日落到谷底，10 月 3 日起回升</p>
<div class="charts">
${aChart("日单量", "万单", "orders", [15, 20, 25, 30, 35, 40], "#1e2328", "19.8")}
${aChart("准时率", "%", "ontime", [88, 90, 92, 94, 96], "#d6453d", "94.0")}
${aChart("平均时效", "小时", "hours", [28, 30, 32, 34, 36], "#2f7fc1", false)}
</div></section>

<section><h2><i style="background:#3a9d5d">02</i>七条干线表现</h2><p class="lead">线长代表平均时效，越长越慢；按单量排序</p>
<div class="rt"><div class="h"><span></span>${aAxis}<span class="r">单量（万单）</span><span class="r">准时率</span><span class="r">异常件</span><span class="r">准时率环比</span></div>
${R.map((r, i) => `<div><span class="n" style="background:${A[i]}">${i + 1}</span>${aRoute(r, i)}<span class="r mono">${r.orders}</span><span class="r mono ${r.ontime < 91 ? "no" : ""}">${r.ontime}%</span><span class="r mono">${num(r.exceptions)}</span><span class="r ${r.change.startsWith("+") ? "ok" : "no"}">${r.change}</span></div>`).join("")}
</div></section>

<section><h2><i style="background:#d6453d">03</i>延误原因</h2><p class="lead">本周延误件共 ${num(delayed)} 件，中转拥堵占近四成</p>
<div class="seg">${DL.map((x, i) => `<i style="width:${x.share}%;background:${aDelayC[i]}"></i>`).join("")}</div>
<div class="dl">${DL.map((x, i) => `<div style="border-color:${aDelayC[i]}"><b>${x.reason}</b><div class="p">${x.share}%</div><div class="q mono">${num(x.count)} 件</div><p>${x.note}</p></div>`).join("")}</div></section>

<section><h2><i style="background:#8a5cb8">04</i>本周要点</h2>
<div class="fd">${d.findings.map((f, i) => `<div><div class="k" style="background:${["#d6453d", "#8a5cb8", "#3a9d5d"][i]}">${i + 1}</div><b>${f.title}</b><p>${f.detail}</p></div>`).join("")}</div></section>

<section><div class="two"><div><h2><i style="background:#1c9aa6">05</i>下周行动</h2><div class="stops" style="margin-top:24px">${d.actions.map((x) => `<div><b>${x.title}</b><p>${x.detail}</p></div>`).join("")}</div></div>
<div><h2><i style="background:#e39b2d">06</i>运营提示</h2><div class="notice" style="margin-top:24px"><h3>需提前准备的风险</h3>${d.risks.map((x) => `<div><b>${x.title}</b><p>${x.detail}</p></div>`).join("")}</div></div></div></section>

<footer><span>${esc(d.org)} · 线路运营组</span><span>数据截至 10 月 4 日 24:00</span></footer>
</div>`)

// ============================================================ b  运单
function barcode(w, h, seed) {
  let s = seed, x = 0, dark = true, out = ""
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  while (x < w - 6) {
    const bw = 1 + Math.floor(rnd() * 3.6)
    if (dark) out += `<rect x="${x}" y="0" width="${bw}" height="${h}"/>`
    x += bw; dark = !dark
  }
  return `<svg width="${w}" height="${h}" style="display:block;fill:#111">${out}</svg>`
}
function bDaily() {
  const w = 1088, h = 230, l = 48, r = 12, t = 26, b = 44, n = D.length
  const slot = (w - l - r) / n, B = h - b
  const y = (v) => B - (v / 40) * (B - t)
  const grid = [0, 10, 20, 30, 40].map((v) => `<line x1="${l}" x2="${w - r}" y1="${y(v)}" y2="${y(v)}" stroke="${v ? "#ddd" : "#111"}"/><text x="${l - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")
  const bs = D.map((p, i) => {
    const cx = l + slot * (i + 0.5), bw = 34
    return `<rect x="${cx - bw / 2}" y="${y(p.orders)}" width="${bw}" height="${B - y(p.orders)}" fill="${i < 7 ? "url(#hatch)" : "#111"}" stroke="#111"/><text x="${cx}" y="${y(p.orders) - 7}" text-anchor="middle" style="fill:#111">${p.orders}</text><text x="${cx}" y="${h - 24}" text-anchor="middle" style="fill:#111">${p.date}</text><text x="${cx}" y="${h - 8}" text-anchor="middle" style="font-family:'Noto Sans SC';font-size:11px">${p.weekday}</text>`
  }).join("")
  return `<svg width="${w}" height="${h}" style="display:block;font-family:'IBM Plex Mono',monospace;font-size:11px;fill:#777"><defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#111" stroke-width="1.4"/></pattern></defs>${grid}${bs}</svg>`
}
const bSlot = (1088 - 60) / 14
const bOntime = line({ w: 1088, h: 130, points: pts("ontime"), ticks: [88, 92, 96], stroke: "#c8102e", grid: "#e4e4e4", text: "#777", size: 11, font: "'IBM Plex Mono',monospace", pad: [14, 12 + bSlot / 2, 8, 48 + bSlot / 2], dots: true, last: false, width: 2 })
  .replace(/<text x="[\d.]+" y="([\d.]+)" text-anchor="end">/g, (m, yy) => `<text x="40" y="${yy}" text-anchor="end">`)

const b = doc(`
body{background:#e3dccd;color:#111;font-family:"Noto Sans SC",sans-serif;font-size:14px;line-height:1.6}
.mono{font-family:"IBM Plex Mono",monospace}
.sheet{width:1180px;margin:44px auto 56px;background:#fffdf8;border:2px solid #111;position:relative;box-shadow:0 1px 0 #c9bfa9,0 10px 24px rgba(80,60,20,.12)}
.row{display:grid;border-bottom:2px solid #111}
.row>div{padding:14px 18px;border-right:1px solid #111}
.row>div:last-child{border-right:0}
.f{font-size:11px;color:#555;letter-spacing:.08em;display:flex;justify-content:space-between}
.f i{font-style:normal;font-family:"IBM Plex Mono",monospace}
.top{grid-template-columns:330px 1fr 190px}
.brand{font-size:30px;font-weight:600;letter-spacing:.12em;margin-top:6px;line-height:40px}
.brand+div{font-size:14px;margin-top:2px}
.bc{display:flex;flex-direction:column;align-items:center;justify-content:center}
.bc .mono{font-size:13px;letter-spacing:.32em;margin-top:6px}
.big{display:flex;flex-direction:column;justify-content:center;align-items:center;background:#111;color:#fffdf8}
.big b{font:500 58px/1 "IBM Plex Mono",monospace;letter-spacing:-.02em}
.big span{font-size:12px;letter-spacing:.3em;margin-top:8px}
.who{grid-template-columns:1fr 1fr}
.who .v{font-size:17px;font-weight:500;margin-top:4px}
.kp{grid-template-columns:repeat(4,1fr)}
.kp .v{font:500 42px/52px "IBM Plex Mono",monospace;margin-top:8px}
.kp .v small{font:400 14px "Noto Sans SC",sans-serif;margin-left:6px}
.kp .c{display:inline-block;font-size:13px;margin-top:6px;padding:1px 8px;border:1px solid #111}
.kp .c.bad{color:#c8102e;border-color:#c8102e}
.memo p{font-size:15px;line-height:1.85;margin-top:6px}
.blk{padding:16px 18px 18px;border-bottom:2px solid #111;position:relative}
.blk .f{margin-bottom:12px}
.lg{display:flex;gap:22px;font-size:12px;color:#333;margin:4px 0 6px 48px}
.lg i{display:inline-block;width:14px;height:10px;border:1px solid #111;margin-right:6px;vertical-align:-1px}
table{font-size:14px}
th{font-size:11px;font-weight:400;color:#555;letter-spacing:.06em;text-align:left;padding:6px 10px;border:1px solid #111;background:#f3eee2}
td{padding:9px 10px;border:1px solid #111}
td.n,th.n{text-align:right;font-family:"IBM Plex Mono",monospace}
th.n{font-family:"Noto Sans SC",sans-serif}
.red{color:#c8102e}
.tag{display:inline-block;font-size:12px;color:#c8102e;border:1.5px solid #c8102e;padding:0 6px;line-height:20px;transform:rotate(-4deg)}
.code{font-family:"IBM Plex Mono",monospace;font-size:13px}
.dr{display:grid;grid-template-columns:70px 150px 1fr 300px 64px 90px;align-items:center;gap:16px;padding:9px 0;border-bottom:1px dashed #999}
.dr:last-child{border-bottom:0}
.trk{height:14px;border:1px solid #111;background:repeating-linear-gradient(45deg,#fff 0 3px,#ddd 3px 4px)}
.trk i{display:block;height:100%;background:#111}
.cut{position:relative;border-bottom:2px dashed #111;height:0;margin:0}
.cut span{position:absolute;left:50%;top:-11px;transform:translateX(-50%);background:#fffdf8;padding:0 14px;font-size:11px;color:#555;letter-spacing:.3em}
.stub{display:grid;grid-template-columns:1fr 1fr 1fr}
.stub>div{padding:22px 18px 22px;border-right:1px solid #111}
.stub>div:last-child{border-right:0}
.stub ol{list-style:none;margin-top:10px;display:grid;gap:14px}
.stub li{display:grid;grid-template-columns:28px 1fr}
.stub li i{font-style:normal;font-family:"IBM Plex Mono",monospace;font-size:13px;line-height:24px}
.stub b{font-weight:600;font-size:15px}
.stub p{font-size:13px;color:#333;line-height:1.7}
.stub .rk{background:repeating-linear-gradient(-45deg,#fff3f3 0 10px,#fffdf8 10px 20px)}
.stub .rk .f,.stub .rk b{color:#c8102e}
.stamp{position:absolute;right:44px;top:14px;width:128px;height:128px;border:4px double #c8102e;border-radius:50%;color:#c8102e;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-14deg);opacity:.82;mix-blend-mode:multiply}
.stamp b{font-size:21px;font-weight:600;letter-spacing:.1em;line-height:30px}
.stamp span{font-size:12px;border-top:1.5px solid #c8102e;border-bottom:1.5px solid #c8102e;padding:0 6px;margin-top:4px}
.foot{display:flex;justify-content:space-between;padding:10px 18px;font-size:11px;color:#555}
`, `<div class="sheet">
<div class="row top"><div><div class="f"><span>承运</span><i>CARRIER</i></div><div class="brand">青岚速运</div><div>时效周报 · 华东运营中心</div></div>
<div class="bc">${barcode(420, 64, 40)}<div class="mono">QL2026W40-0928-1004</div></div>
<div class="big"><b>W40</b><span>周报联</span></div></div>
<div class="row who"><div><div class="f"><span>报告单位</span><i>01</i></div><div class="v">${esc(d.org)}</div></div><div><div class="f"><span>统计周期</span><i>02</i></div><div class="v">${esc(d.period)}</div></div></div>
<div class="row kp">${d.kpis.map((k, i) => `<div><div class="f"><span>${k.label}</span><i>${String(i + 3).padStart(2, "0")}</i></div><div class="v">${kval(k)}<small>${k.unit}</small></div><span class="c ${good(k) ? "" : "bad"}">较上周 ${k.change}</span></div>`).join("")}</div>
<div class="row memo" style="grid-template-columns:1fr"><div><div class="f"><span>备注 · 本周摘要</span><i>07</i></div><p>${esc(d.summary)}</p></div></div>

<div class="blk"><div class="f"><span>日单量（万单）· 9 月 21 日至 10 月 4 日</span><i>08</i></div><div class="stamp"><b>节前高峰</b><span>准时率 −1.9</span></div>
<div class="lg"><span><i style="background:repeating-linear-gradient(45deg,#fff 0 2px,#111 2px 3px)"></i>上周</span><span><i style="background:#111"></i>本周</span><span><i style="background:#c8102e;height:3px;border:0;vertical-align:3px"></i>准时率（%）</span></div>
${bDaily()}${bOntime}</div>

<div class="blk"><div class="f"><span>干线明细</span><i>09</i></div>
<table><tr><th style="width:90px">线路编号</th><th>始发 → 目的</th><th class="n">单量（万单）</th><th class="n">准时率</th><th class="n">平均时效（小时）</th><th class="n">异常件</th><th class="n">准时率环比</th><th style="width:90px">标记</th></tr>
${R.map((r, i) => `<tr><td class="code">QL-0${i + 1}</td><td>${r.from} → ${r.to}</td><td class="n">${r.orders}</td><td class="n ${r.ontime < 91 ? "red" : ""}">${r.ontime}%</td><td class="n">${r.hours}</td><td class="n">${num(r.exceptions)}</td><td class="n ${r.change.startsWith("+") ? "" : "red"}">${r.change.replace(" 个百分点", " pp")}</td><td>${r.ontime < 91 ? `<span class="tag">重点跟进</span>` : ""}</td></tr>`).join("")}
<tr><td class="code">合计</td><td></td><td class="n"><b>${K.orders.value}</b></td><td class="n"><b>${K.ontime.value}%</b></td><td class="n"><b>${K.hours.value}</b></td><td class="n"><b>${num(K.exceptions.value)}</b></td><td class="n red">−1.9 pp</td><td></td></tr></table></div>

<div class="blk"><div class="f"><span>延误原因代码 · 共 ${num(delayed)} 件</span><i>10</i></div>
${DL.map((x, i) => `<div class="dr"><span class="code">D-0${i + 1}</span><b style="font-weight:600">${x.reason}</b><span style="color:#444;font-size:13px">${x.note}</span><div class="trk"><i style="width:${(x.share / 40) * 100}%"></i></div><span class="mono" style="text-align:right">${x.share}%</span><span class="mono" style="text-align:right;color:#555">${num(x.count)}</span></div>`).join("")}</div>

<div class="cut"><span>回 执 联</span></div>
<div class="stub">
<div><div class="f"><span>本周发现</span><i>11</i></div><ol>${d.findings.map((x, i) => `<li><i>${i + 1}.</i><div><b>${x.title}</b><p>${x.detail}</p></div></li>`).join("")}</ol></div>
<div><div class="f"><span>下周动作</span><i>12</i></div><ol>${d.actions.map((x, i) => `<li><i>${i + 1}.</i><div><b>${x.title}</b><p>${x.detail}</p></div></li>`).join("")}</ol></div>
<div class="rk"><div class="f"><span>注意 · 风险</span><i>13</i></div><ol>${d.risks.map((x, i) => `<li><i>!</i><div><b>${x.title}</b><p>${x.detail}</p></div></li>`).join("")}</ol></div>
</div>
<div class="foot" style="border-top:2px solid #111"><span>${esc(d.org)}</span><span class="mono">QL-OPS-RPT · 第 1 联 / 共 1 联</span></div>
</div>`)

// ============================================================ c  状态看板
const st = (v) => (v >= 94 ? ["正常", "#1f9d55", "#e7f6ec"] : v >= 91 ? ["关注", "#d88b06", "#fdf3df"] : ["告警", "#d63b30", "#fde8e6"])
const cCount = (lab) => R.filter((r) => st(r.ontime)[0] === lab).length
const spark = (key, color, fill) => {
  const ys = D.map((p) => p[key]), lo = Math.min(...ys), hi = Math.max(...ys), m = (hi - lo) * 0.15
  return line({ w: 250, h: 54, points: pts(key), ticks: [], range: [lo - m, hi + m], stroke: color, fill, pad: [6, 4, 4, 4], last: false, width: 1.75 })
}
function cCombo() {
  const w = 760, h = 420, l = 44, r = 48, t = 20, b = 40, n = D.length, B = h - b
  const slot = (w - l - r) / n
  const y1 = (v) => B - (v / 40) * (B - t)
  const y2 = (v) => B - ((v - 86) / 12) * (B - t)
  const cx = (i) => l + slot * (i + 0.5)
  const grid = [0, 10, 20, 30, 40].map((v, i) => `<line x1="${l}" x2="${w - r}" y1="${y1(v)}" y2="${y1(v)}" stroke="#e6eaee"/><text x="${l - 8}" y="${y1(v) + 4}" text-anchor="end">${v}</text><text x="${w - r + 8}" y="${y1(v) + 4}" style="fill:#c0392b">${86 + i * 3}%</text>`).join("")
  const bs = D.map((p, i) => `<rect x="${cx(i) - slot * 0.3}" y="${y1(p.orders)}" width="${slot * 0.6}" height="${B - y1(p.orders)}" rx="2" fill="${i < 7 ? "#c4d3e3" : "#4a78a8"}"/><text x="${cx(i)}" y="${h - 22}" text-anchor="middle">${p.date}</text><text x="${cx(i)}" y="${h - 6}" text-anchor="middle" style="font-family:'Noto Sans SC';font-size:10px">${p.weekday}</text>`).join("")
  const tgt = `<line x1="${l}" x2="${w - r}" y1="${y2(94)}" y2="${y2(94)}" stroke="#1f9d55" stroke-dasharray="5 4"/>`
  const ln = `<polyline points="${D.map((p, i) => `${cx(i)},${y2(p.ontime)}`).join(" ")}" fill="none" stroke="#c0392b" stroke-width="2"/>` + D.map((p, i) => `<circle cx="${cx(i)}" cy="${y2(p.ontime)}" r="3.2" fill="#fff" stroke="#c0392b" stroke-width="1.6"/>`).join("")
  const lo = 9
  const note = `<text x="${cx(lo)}" y="${y2(D[lo].ontime) + 18}" text-anchor="middle" style="fill:#c0392b;font-weight:500;stroke:#fff;stroke-width:4px;paint-order:stroke">${D[lo].ontime}%</text>`
  const sep = `<line x1="${l + slot * 7}" x2="${l + slot * 7}" y1="${t - 6}" y2="${B}" stroke="#9aa6b2" stroke-dasharray="2 3"/><text x="${l + slot * 7 + 6}" y="${t + 4}" style="font-family:'Noto Sans SC'">本周 →</text>`
  return `<svg width="${w}" height="${h}" style="display:block;font-family:'IBM Plex Mono',monospace;font-size:11px;fill:#6b7682">${grid}${bs}${sep}${tgt}${ln}${note}<line x1="${l}" x2="${w - r}" y1="${B}" y2="${B}" stroke="#9aa6b2"/></svg>`
}
const cHeat = (v, lo, hi) => `rgba(192,57,43,${(0.06 + 0.5 * (v - lo) / (hi - lo)).toFixed(2)})`
const cStrip = `<div class="strip">${[["时效 h", "hours", 29, 34], ["异常件", "exceptions", 480, 905]].map(([lab, key, lo, hi]) => `<div class="sr"><span>${lab}</span>${D.map((p) => `<i style="background:${cHeat(p[key], lo, hi)}">${key === "hours" ? p[key].toFixed(1) : p[key]}</i>`).join("")}</div>`).join("")}</div>`
const cDc = ["#c0392b", "#4a78a8", "#d88b06", "#7a8b9c", "#a9b6c3", "#d3dbe3"]
function cDonut() {
  const r = 74, C = 2 * Math.PI * r
  let acc = 0
  const segs = DL.map((x, i) => { const len = (x.share / 100) * C; const s = `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${cDc[i]}" stroke-width="26" stroke-dasharray="${len - 1.5} ${C}" stroke-dashoffset="${-acc}" transform="rotate(-90 100 100)"/>`; acc += len; return s }).join("")
  return `<svg width="200" height="200" style="display:block;flex:none">${segs}<text x="100" y="96" text-anchor="middle" style="font:500 22px 'IBM Plex Mono';fill:#1d2733">${(delayed / 10000).toFixed(1)}</text><text x="100" y="118" text-anchor="middle" style="font-size:12px;fill:#6b7682">万件延误</text></svg>`
}

const c = doc(`
body{background:#e8ecf0;color:#1d2733;font-family:"Noto Sans SC",sans-serif;font-size:14px;line-height:1.55}
.mono{font-family:"IBM Plex Mono",monospace}
.wrap{width:1200px;margin:0 auto;padding:28px 0 36px;display:grid;gap:14px}
.p{background:#fff;border:1px solid #d3dae2;border-radius:6px}
.ph{display:flex;justify-content:space-between;align-items:center;padding:12px 18px;border-bottom:1px solid #e6eaee}
.ph b{font-size:14px;font-weight:600}.ph span{font-size:12px;color:#6b7682}
.bar{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:32px;padding:16px 20px}
.bar h1{font-size:24px;line-height:32px;font-weight:600}
.bar .s{font-size:13px;color:#6b7682}
.lights{display:flex;gap:10px}
.lights div{display:flex;align-items:center;gap:8px;border:1px solid #e1e6eb;border-radius:4px;padding:6px 12px;font-size:13px}
.lights i{width:10px;height:10px;border-radius:50%}
.lights b{font-family:"IBM Plex Mono",monospace;font-weight:500;font-size:16px}
.clock{text-align:right;font-size:12px;color:#6b7682}.clock b{display:block;font:500 18px "IBM Plex Mono",monospace;color:#1d2733}
.brief{display:grid;grid-template-columns:96px 1fr;gap:16px;padding:12px 20px;border-top:1px solid #e6eaee;background:#f7f9fb;border-radius:0 0 6px 6px}
.brief b{font-size:12px;color:#4a78a8;font-weight:600;letter-spacing:.08em;line-height:24px}
.brief p{font-size:14px;line-height:1.75;color:#36414d}
.kp{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.kp .p{padding:14px 18px 10px}
.kh{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#56616d}
.pill{font-size:11px;padding:1px 8px;border-radius:10px;font-weight:500}
.kv{font:500 34px/44px "IBM Plex Mono",monospace;margin-top:6px}
.kv small{font:400 13px "Noto Sans SC",sans-serif;color:#6b7682;margin-left:4px}
.kc{font-size:12px;margin:2px 0 8px}
.mid{display:grid;grid-template-columns:1fr 380px;gap:14px}
.strip{margin-top:10px;display:grid;gap:3px}
.sr{display:grid;grid-template-columns:44px repeat(14,1fr) 48px;gap:3px;align-items:center}
.sr span{font-size:11px;color:#6b7682;line-height:1.2;grid-column:1}
.sr i{font:400 11px/26px "IBM Plex Mono",monospace;font-style:normal;text-align:center;color:#1d2733;border-radius:2px}
.lg{display:flex;gap:16px;font-size:12px;color:#56616d}
.lg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.dn{display:flex;gap:16px;align-items:center;padding:16px 18px 6px}
.dlist{padding:4px 18px 14px}
.dlist div{display:grid;grid-template-columns:12px 1fr 56px 64px;gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid #f0f2f4;font-size:13px}
.dlist div:last-child{border-bottom:0}
.dlist i{width:10px;height:10px;border-radius:2px}
.dlist .mono{text-align:right}
.dlist small{display:block;font-size:11px;color:#8a95a1;line-height:1.4}
.brd th{font-size:12px;font-weight:500;color:#6b7682;text-align:left;padding:9px 14px;background:#f5f7f9;border-bottom:1px solid #e1e6eb}
.brd td{padding:10px 14px;border-bottom:1px solid #eef1f4;font-size:14px}
.brd tr:last-child td{border-bottom:0}
.brd .n{text-align:right;font-family:"IBM Plex Mono",monospace}
.brd th.n{font-family:"Noto Sans SC",sans-serif}
.led{display:inline-block;width:10px;height:10px;border-radius:50%;box-shadow:0 0 0 3px rgba(0,0,0,.05)}
.otb{display:grid;grid-template-columns:52px 1fr;gap:10px;align-items:center}
.otb div{position:relative;height:8px;background:#eef1f4;border-radius:4px}
.otb div i{position:absolute;left:0;top:0;bottom:0;border-radius:4px}
.otb div u{position:absolute;top:-4px;bottom:-4px;border-left:2px solid #1d2733}
.bot{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.log{padding:6px 18px 14px}
.log>div{display:grid;grid-template-columns:4px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid #f0f2f4}
.log>div:last-child{border-bottom:0}
.log i{border-radius:2px}
.log b{font-size:14px;font-weight:600}.log p{font-size:13px;color:#56616d;line-height:1.65;margin-top:2px}
`, `<div class="wrap">
<div class="p"><div class="bar"><div><div class="s">${esc(d.org)} · 线路时效监控</div><h1>${esc(d.title)}</h1><div class="s">${esc(d.period)}</div></div>
<div class="lights">${[["正常", "#1f9d55"], ["关注", "#d88b06"], ["告警", "#d63b30"]].map(([l, col]) => `<div><i style="background:${col}"></i>${l}线路<b>${cCount(l)}</b></div>`).join("")}</div>
<div class="clock">数据截至<b>10/04 24:00</b></div></div>
<div class="brief"><b>本周摘要</b><p>${esc(d.summary)}</p></div></div>

<div class="kp">${d.kpis.map((k) => {
  const [lab, col, bg] = good(k) ? ["正常", "#1f9d55", "#e7f6ec"] : k.key === "ontime" ? ["关注", "#d88b06", "#fdf3df"] : ["告警", "#d63b30", "#fde8e6"]
  const lc = { orders: "#4a78a8", ontime: "#c0392b", hours: "#d88b06", exceptions: "#7a5ca8" }[k.key]
  return `<div class="p"><div class="kh"><span>${k.label}</span><span class="pill" style="color:${col};background:${bg}">${lab}</span></div><div class="kv">${kval(k)}<small>${k.unit}</small></div><div class="kc" style="color:${col}">较上周 ${k.change}</div>${spark(k.key, lc, lc + "18")}</div>`
}).join("")}</div>

<div class="mid"><div class="p"><div class="ph"><b>每日单量与准时率</b><div class="lg"><span><i style="background:#c4d3e3"></i>上周单量</span><span><i style="background:#4a78a8"></i>本周单量（万单）</span><span><i style="background:#c0392b;height:3px;vertical-align:3px"></i>准时率</span><span><i style="border-top:2px dashed #1f9d55;height:0;width:14px;border-radius:0;vertical-align:3px"></i>正常线 94%</span></div></div><div style="padding:14px 20px 16px">${cCombo()}${cStrip}</div></div>
<div class="p"><div class="ph"><b>延误原因构成</b><span>延误件 ${num(delayed)}</span></div><div class="dn">${cDonut()}<div style="font-size:13px;color:#56616d;line-height:1.7">中转拥堵占 <b style="color:#c0392b;font-family:'IBM Plex Mono'">38.4%</b>，集中在嘉兴转运中心；天气与末端运力合计近四成。</div></div>
<div class="dlist">${DL.map((x, i) => `<div><i style="background:${cDc[i]}"></i><span>${x.reason}<small>${x.note}</small></span><span class="mono">${x.share}%</span><span class="mono" style="color:#8a95a1">${num(x.count)}</span></div>`).join("")}</div></div></div>

<div class="p"><div class="ph"><b>干线状态板</b><span>准时率 ≥ 94% 正常 · 91%–94% 关注 · &lt; 91% 告警　竖线为 94%</span></div>
<table class="brd"><tr><th style="width:56px">状态</th><th>线路</th><th class="n">单量（万单）</th><th style="width:300px">准时率</th><th class="n">平均时效</th><th class="n">异常件</th><th class="n">准时率环比</th><th style="width:90px">级别</th></tr>
${byOntime.map((r) => { const [lab, col, bg] = st(r.ontime); return `<tr><td><span class="led" style="background:${col}"></span></td><td><b style="font-weight:500">${r.from}</b> → ${r.to}</td><td class="n">${r.orders}</td><td><div class="otb"><span class="mono">${r.ontime}%</span><div><i style="width:${((r.ontime - 85) / 12) * 100}%;background:${col}"></i><u style="left:${((94 - 85) / 12) * 100}%"></u></div></div></td><td class="n">${r.hours} h</td><td class="n">${num(r.exceptions)}</td><td class="n" style="color:${r.change.startsWith("+") ? "#1f9d55" : "#d63b30"}">${r.change.replace(" 个百分点", " pp")}</td><td><span class="pill" style="color:${col};background:${bg}">${lab}</span></td></tr>` }).join("")}
</table></div>

<div class="bot">
<div class="p"><div class="ph"><b>关键发现</b><span>${d.findings.length} 条</span></div><div class="log">${d.findings.map((x, i) => `<div><i style="background:${["#d63b30", "#d63b30", "#1f9d55"][i]}"></i><div><b>${x.title}</b><p>${x.detail}</p></div></div>`).join("")}</div></div>
<div class="p"><div class="ph"><b>处置动作</b><span>下周执行</span></div><div class="log">${d.actions.map((x) => `<div><i style="background:#4a78a8"></i><div><b>${x.title}</b><p>${x.detail}</p></div></div>`).join("")}</div></div>
<div class="p"><div class="ph"><b>风险预警</b><span>未来 2–3 周</span></div><div class="log">${d.risks.map((x) => `<div><i style="background:#d88b06"></i><div><b>${x.title}</b><p>${x.detail}</p></div></div>`).join("")}</div></div>
</div></div>`)

// ============================================================ d  企业周报（普通）
const dd = doc(`
body{background:#eef1f5;color:#333;font-family:"Noto Sans SC",sans-serif;font-size:15px;line-height:1.7}
.page{width:1120px;margin:32px auto 48px;background:#fff;padding:44px 48px 40px;box-shadow:0 2px 10px rgba(0,0,0,.08)}
h1{font-size:30px;font-weight:600;color:#1f3864;text-align:center}
.sub{text-align:center;color:#888;font-size:14px;margin-top:4px;padding-bottom:20px;border-bottom:1px solid #ddd}
h2{font-size:19px;font-weight:600;color:#1f3864;border-left:4px solid #2f5597;padding-left:10px;line-height:24px;margin:34px 0 16px}
.sum{background:#f6f8fc;padding:14px 18px;border-radius:4px;color:#444}
.kp{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.kp div{background:#eef3fb;border-radius:6px;padding:16px 18px;border-top:3px solid #2f5597}
.kp span{color:#666;font-size:14px}
.kp b{display:block;font-size:30px;color:#2f5597;font-weight:600;margin:4px 0}
.kp small{font-size:14px;color:#666;font-weight:400;margin-left:2px}
.kp em{font-style:normal;font-size:13px}
.up{color:#2e8b57}.dn{color:#d9534f}
.ch2{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.cbox{border:1px solid #e3e3e3;border-radius:4px;padding:12px 14px}
.cbox h4{font-size:14px;font-weight:500;color:#555;margin-bottom:6px}
.t th{background:#2f5597;color:#fff;font-weight:500;padding:8px 10px;font-size:14px;text-align:center}
.t td{padding:8px 10px;border-bottom:1px solid #e5e5e5;text-align:center;font-size:14px}
.t tr:nth-child(odd) td{background:#f7f9fc}
.small td,.small th{font-size:13px;padding:6px 4px}
.small td:first-child{font-weight:500;background:#eef3fb !important}
ol.f{padding-left:22px}
ol.f li{margin-bottom:8px}
ol.f b{color:#1f3864}
.ar{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.box{border:1px solid #cfd9ec;border-radius:6px;padding:16px 20px}
.box h3{font-size:16px;color:#1f3864;margin-bottom:8px}
.box.risk{border-color:#f0c4c2;background:#fdf5f5}.box.risk h3{color:#c0392b}
.box li{margin:0 0 8px 20px;font-size:14px}
.ft{margin-top:36px;text-align:center;color:#aaa;font-size:12px}
`, `<div class="page">
<h1>${esc(d.title)}</h1><div class="sub">${esc(d.org)}　|　${esc(d.period)}</div>

<h2>一、本周概况</h2><div class="sum">${esc(d.summary)}</div>

<h2>二、核心指标</h2>
<div class="kp">${d.kpis.map((k) => `<div><span>${k.label}</span><b>${kval(k)}<small>${k.unit}</small></b><em class="${good(k) ? "up" : "dn"}">环比 ${k.change}</em></div>`).join("")}</div>

<h2>三、每日趋势</h2>
<div class="ch2">
<div class="cbox"><h4>每日单量（万单）</h4>${line({ w: 470, h: 220, points: pts("orders", sparse([0, 3, 6, 9, 13])), ticks: [15, 20, 25, 30, 35, 40], stroke: "#2f5597", grid: "#eee", text: "#999", fill: "rgba(47,85,151,.1)", size: 11, dots: true })}</div>
<div class="cbox"><h4>每日准时率（%）</h4>${line({ w: 470, h: 220, points: pts("ontime", sparse([0, 3, 6, 9, 13])), ticks: [88, 90, 92, 94, 96], stroke: "#ed7d31", grid: "#eee", text: "#999", size: 11, dots: true })}</div>
</div>
<table class="t small" style="margin-top:18px"><tr><th>日期</th>${D.map((p) => `<th>${p.date}</th>`).join("")}</tr>
<tr><td>单量</td>${D.map((p) => `<td>${p.orders}</td>`).join("")}</tr>
<tr><td>准时率</td>${D.map((p) => `<td>${p.ontime}</td>`).join("")}</tr>
<tr><td>时效(h)</td>${D.map((p) => `<td>${p.hours}</td>`).join("")}</tr>
<tr><td>异常件</td>${D.map((p) => `<td>${p.exceptions}</td>`).join("")}</tr></table>

<h2>四、各线路表现</h2>
<table class="t"><tr><th>线路</th><th>单量（万单）</th><th>准时率</th><th>平均时效（小时）</th><th>异常件</th><th>准时率环比</th></tr>
${R.map((r) => `<tr><td>${rname(r)}</td><td>${r.orders}</td><td>${r.ontime}%</td><td>${r.hours}</td><td>${num(r.exceptions)}</td><td class="${r.change.startsWith("+") ? "up" : "dn"}">${r.change}</td></tr>`).join("")}</table>

<h2>五、延误原因分析</h2>
<div style="display:grid;grid-template-columns:1fr 360px;gap:32px;align-items:center">
<div>${bars(DL.map((x) => ({ label: x.reason, value: x.share, display: x.share + "%" })), { max: 40, labelW: 110, h: 18, gap: 14, valueW: 56, radius: 2, colors: ["#2f5597", "#4472c4", "#5b9bd5", "#70ad47", "#ffc000", "#a5a5a5"] })}</div>
<div style="font-size:14px;color:#555;background:#f6f8fc;padding:16px 18px;border-radius:4px">本周延误件合计 <b>${num(delayed)}</b> 件。${DL.slice(0, 3).map((x) => `${x.reason}（${x.note}）${num(x.count)} 件`).join("；")}；其余原因合计 ${num(sum(DL.slice(3), (x) => x.count))} 件。</div>
</div>

<h2>六、主要发现</h2>
<ol class="f">${d.findings.map((x) => `<li><b>${x.title}：</b>${x.detail}</li>`).join("")}</ol>

<h2>七、下一步工作及风险</h2>
<div class="ar"><div class="box"><h3>下一步工作</h3><ul>${d.actions.map((x) => `<li><b>${x.title}</b>：${x.detail}</li>`).join("")}</ul></div>
<div class="box risk"><h3>风险提示</h3><ul>${d.risks.map((x) => `<li><b>${x.title}</b>：${x.detail}</li>`).join("")}</ul></div></div>

<div class="ft">${esc(d.org)} 编制</div>
</div>`)

// ============================================================ e  每日时间线（手工风）
const eCol = (v) => (v >= 94 ? "#27ae60" : v >= 92 ? "#f39c12" : "#e74c3c")
const eCard = (p, i) => {
  const side = i % 2 === 0 ? "l" : "r"
  const card = `<div class="card" style="border-left-color:${eCol(p.ontime)}"><div class="dt">${p.date} ${p.weekday}${p.date === "10/1" ? `<span class="hol">国庆节</span>` : ""}</div><div class="nums"><span>单量 <b>${p.orders}</b> 万</span><span>准时率 <b style="color:${eCol(p.ontime)}">${p.ontime}%</b></span><span>时效 <b>${p.hours}</b>h</span><span>异常 <b>${p.exceptions}</b></span></div></div>`
  return `<div class="tl-row">${side === "l" ? card : "<div></div>"}<div class="tl-dot"><i style="background:${eCol(p.ontime)}"></i></div>${side === "r" ? card : "<div></div>"}</div>`
}
const ePie = (() => { let a = 0; const cs = ["#e74c3c", "#3498db", "#f1c40f", "#9b59b6", "#1abc9c", "#95a5a6"]; return { bg: `conic-gradient(${DL.map((x, i) => { const s0 = a; a += x.share; return `${cs[i]} ${s0}% ${a}%` }).join(",")})`, cs } })()

const e = doc(`
body{background:#f2f2f2;color:#333;font-family:"Noto Sans SC",sans-serif;font-size:15px;line-height:1.6}
.w{width:1100px;margin:0 auto;padding:36px 0 50px}
.hd{text-align:center;background:#fff;border:1px solid #ccc;padding:26px 20px}
.hd h1{font-family:"Noto Serif SC",serif;font-weight:600;font-size:38px;color:#c0392b;letter-spacing:.2em}
.hd p{color:#666;margin-top:6px}
.sum{margin-top:20px;border:2px dashed #3498db;background:#fff;padding:16px 22px;font-size:15px}
.sum b{color:#3498db}
.tt{text-align:center;font-size:24px;font-weight:600;color:#2c3e50;margin:40px 0 18px}
.tt:after{content:"";display:block;width:60px;height:4px;background:#e67e22;margin:8px auto 0}
.kp{display:flex;gap:18px}
.kp div{flex:1;background:#fff;border:3px solid;border-radius:12px;text-align:center;padding:16px 10px}
.kp span{font-size:16px;font-weight:600}
.kp b{display:block;font-size:40px;font-weight:600;line-height:54px}
.kp small{font-size:16px}
.kp em{font-style:normal;font-size:14px;font-weight:500}
.tl{position:relative;background:#fff;border:1px solid #ccc;padding:20px 26px}
.tl:before{content:"";position:absolute;left:50%;top:20px;bottom:20px;width:4px;margin-left:-2px;background:#3498db}
.tl-row{display:grid;grid-template-columns:1fr 50px 1fr;align-items:center;margin-bottom:-14px}
.tl-dot{display:flex;justify-content:center;position:relative}
.tl-dot i{width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #3498db}
.card{background:#fafafa;border:1px solid #ddd;border-left:6px solid;border-radius:6px;padding:8px 14px}
.dt{font-weight:600;font-size:16px;color:#2c3e50}
.hol{background:#e74c3c;color:#fff;font-size:12px;border-radius:3px;padding:1px 6px;margin-left:8px;font-weight:500}
.nums{display:flex;gap:14px;font-size:13px;color:#666;flex-wrap:wrap}
.nums b{color:#333;font-size:15px}
.wk{position:relative;text-align:center;margin:8px 0 26px;z-index:1}
.wk span{background:#e67e22;color:#fff;font-weight:600;padding:4px 18px;border-radius:16px;font-size:14px}
.wk.b{margin-top:26px}
.leg{text-align:center;font-size:13px;color:#666;margin-top:10px}
.leg i{display:inline-block;width:12px;height:12px;border-radius:50%;margin:0 4px 0 14px;vertical-align:-1px}
.rt{background:#fff}
.rt th{background:#3498db;color:#fff;padding:10px;border:1px solid #2980b9;font-size:15px}
.rt td{border:1px solid #bbb;padding:9px 10px;text-align:center}
.pie{display:flex;gap:50px;align-items:center;justify-content:center;background:#fff;border:1px solid #ccc;padding:26px}
.pie .c{width:260px;height:260px;border-radius:50%;border:4px solid #fff;box-shadow:0 0 0 1px #ccc}
.pie ul{list-style:none}
.pie li{margin:8px 0;font-size:15px}
.pie li i{display:inline-block;width:16px;height:16px;margin-right:8px;vertical-align:-2px}
.pie li span{color:#888;font-size:13px;margin-left:6px}
.notes{display:flex;gap:20px}
.notes div{flex:1;background:#fff3b0;padding:18px 18px 20px;box-shadow:2px 3px 6px rgba(0,0,0,.15);border-top:20px solid #f7dc6f}
.notes b{display:block;font-size:17px;color:#7d6608;margin-bottom:6px}
.act{background:#fff;border:1px solid #ccc;padding:18px 30px}
.act li{margin:10px 0 10px 18px}
.risk{margin-top:18px;background:#fdecea;border:2px solid #e74c3c;padding:16px 24px}
.risk h3{color:#e74c3c;font-size:18px}
.risk p{margin-top:8px}
.ft{text-align:center;color:#999;font-size:13px;margin-top:36px}
`, `<div class="w">
<div class="hd"><h1>${esc(d.title)}</h1><p>${esc(d.org)}　　${esc(d.period)}</p></div>
<div class="sum"><b>【本周摘要】</b>${esc(d.summary)}</div>

<div class="tt">本周核心数据</div>
<div class="kp">${d.kpis.map((k, i) => { const col = ["#3498db", "#27ae60", "#e67e22", "#e74c3c"][i]; return `<div style="border-color:${col}"><span style="color:${col}">${k.label}</span><b style="color:${col}">${kval(k)}<small>${k.unit}</small></b><em class="${good(k) ? "" : ""}" style="color:${good(k) ? "#27ae60" : "#e74c3c"}">${good(k) ? "↑" : "↓"} ${k.change}</em></div>` }).join("")}</div>

<div class="tt">每日时间线</div>
<div class="tl">
<div class="wk"><span>上周　9/21 – 9/27</span></div>
${lastWk.map((p, i) => eCard(p, i)).join("")}
<div class="wk b"><span>本周　9/28 – 10/4</span></div>
${thisWk.map((p, i) => eCard(p, i)).join("")}
<div style="height:20px"></div>
</div>
<div class="leg">准时率：<i style="background:#27ae60"></i>≥94%<i style="background:#f39c12"></i>92%–94%<i style="background:#e74c3c"></i>&lt;92%</div>

<div class="tt">各线路表现</div>
<table class="rt"><tr><th>线路</th><th>单量（万单）</th><th>准时率</th><th>平均时效（小时）</th><th>异常件</th><th>环比</th></tr>
${R.map((r) => `<tr><td><b>${r.from} → ${r.to}</b></td><td>${r.orders}</td><td style="background:${r.ontime >= 94 ? "#d5f5e3" : r.ontime >= 92 ? "#fdebd0" : "#fadbd8"}">${r.ontime}%</td><td>${r.hours}</td><td>${num(r.exceptions)}</td><td style="color:${r.change.startsWith("+") ? "#27ae60" : "#e74c3c"}">${r.change}</td></tr>`).join("")}</table>

<div class="tt">延误原因</div>
<div class="pie"><div class="c" style="background:${ePie.bg}"></div><ul>${DL.map((x, i) => `<li><i style="background:${ePie.cs[i]}"></i><b>${x.reason}</b>　${x.share}%<span>（${num(x.count)} 件，${x.note}）</span></li>`).join("")}</ul></div>

<div class="tt">本周发现</div>
<div class="notes">${d.findings.map((x) => `<div><b>${x.title}</b>${x.detail}</div>`).join("")}</div>

<div class="tt">下周计划</div>
<div class="act"><ol>${d.actions.map((x) => `<li><b>${x.title}</b> —— ${x.detail}</li>`).join("")}</ol></div>
<div class="risk"><h3>！风险提示</h3>${d.risks.map((x) => `<p><b>${x.title}：</b>${x.detail}</p>`).join("")}</div>

<div class="ft">—— ${esc(d.org)} ——</div>
</div>`)

export default { a, b, c, d: dd, e }
