// Validation samples for the stage-3 pairwise judge: two new reports, four
// layouts each, in different styles (not only the Swiss grid the probe was
// tuned on). The person ranks the four layouts of each report; the judge
// compares every pair. Mock data only.
//
//   node scripts/build-validate.mjs      → validate/pages/<report>-<n>.html
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const OUT = path.join(ROOT, "validate", "pages")
fs.mkdirSync(OUT, { recursive: true })

// ---------- data ----------

const round1 = (v) => Math.round(v * 10) / 10
const OPS = {
  title: "9 月运营月报",
  product: "鲜到家 App",
  period: "2026 年 9 月 1 日至 30 日",
  summary: "9 月日活与成交额继续增长，乳品烘焙增速最快；下单转化率小幅回落，主要来自新渠道用户。",
  kpis: [
    { label: "日活跃用户", value: "128.4", unit: "万", delta: "+6.2%", up: true },
    { label: "成交额", value: "3.42", unit: "亿元", delta: "+11.8%", up: true },
    { label: "下单转化率", value: "4.7", unit: "%", delta: "−0.3 个百分点", up: false },
    { label: "客单价", value: "86.5", unit: "元", delta: "+3.1%", up: true },
  ],
  dau: Array.from({ length: 30 }, (_, i) => round1(121 + i * 0.28 + 2.2 * Math.sin((i * 2 * Math.PI) / 7 + 1) + 0.6 * Math.sin(i * 1.7))),
  channels: [
    ["应用商店", 38],
    ["信息流广告", 27],
    ["社交分享", 18],
    ["搜索", 11],
    ["其他", 6],
  ],
  categories: [
    ["水果", "8,920", "+14.2%", 25.9],
    ["蔬菜", "6,150", "+9.8%", 17.8],
    ["肉禽蛋", "5,870", "+6.1%", 17.0],
    ["乳品烘焙", "4,230", "+18.5%", 12.3],
    ["海鲜水产", "3,960", "−4.3%", 11.5],
    ["粮油调味", "2,880", "+2.7%", 8.4],
  ],
  findings: [
    ["日活增长来自老用户回流", "中秋节前一周日活达到月内高点 131.6 万，回流用户占新增日活的 62%。"],
    ["乳品烘焙成为增长最快的品类", "早餐套餐上线后，乳品烘焙成交额环比增长 18.5%，复购率 41%。"],
    ["新渠道用户转化偏低", "信息流广告带来的新用户下单转化率仅 2.1%，拉低了整体转化率。"],
  ],
  risks: ["海鲜水产成交额连续两个月下降，需排查供应与价格。", "10 月国庆期间配送运力紧张，预计履约时长增加。"],
}

const AB = {
  title: "新版结账流程 A/B 实验报告",
  owner: "交易体验组",
  period: "2026 年 9 月 2 日至 22 日，共 21 天",
  traffic: "全量用户 50% / 50% 分流",
  samples: ["412,380", "411,906"],
  verdict: "新版结账流程使支付转化率提升 4.1%，结果显著，建议全量上线。",
  metrics: [
    // name, control, treatment, lift, ci low, ci high, significant, primary
    ["支付转化率", "3.62%", "3.77%", 4.1, 2.3, 5.9, true, true],
    ["人均支付金额", "3.12 元", "3.23 元", 3.5, 1.2, 5.8, true, false],
    ["结账页跳出率", "41.8%", "38.9%", -6.9, -8.7, -5.1, true, false],
    ["客单价", "86.2 元", "85.7 元", -0.6, -1.8, 0.6, false, false],
    ["退款率", "2.1%", "2.2%", 4.8, -3.0, 12.6, false, false],
  ],
  // cumulative lift of the primary metric by day, with its 95% interval
  daily: Array.from({ length: 21 }, (_, i) => {
    const est = round1(4.1 + 2.8 * Math.exp(-i / 4) * Math.cos(i * 0.9))
    const hw = round1(7 / Math.sqrt(i + 1) + 0.6)
    return [est, round1(est - hw), round1(est + hw)]
  }),
  segments: [
    ["新用户", 6.8, "4.0% → 4.27%"],
    ["老用户", 2.9, "3.48% → 3.58%"],
    ["iOS", 4.4, "3.95% → 4.12%"],
    ["Android", 3.8, "3.31% → 3.44%"],
  ],
  next: [
    ["10 月 9 日起全量上线", "分三批放量，每批观察 2 天支付转化率与退款率。"],
    ["继续观察退款率", "区间仍较宽，全量后按周复核，超过 2.5% 回滚。"],
    ["针对老用户做第二轮实验", "老用户提升较小，下一轮测试默认支付方式记忆。"],
  ],
}

// Half-width punctuation for the sample with careless typesetting.
const halfWidth = (s) => s.replace(/，/g, ", ").replace(/；/g, "; ").replace(/：/g, ": ").replace(/。/g, ". ").replace(/（/g, "(").replace(/）/g, ")")

// ---------- charts (inline SVG) ----------

function scale(d0, d1, r0, r1) {
  return (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0)
}

function lineChart(data, o) {
  const { w, h, min, max, pad = [16, 8, 24, 32], stroke = "#111", sw = 1.5, grid = 0, gridColor = "#e5e5e5", ticks = [], area, dots = 0, xlabels = [], font = 12, labelColor = "#737373", band } = o
  const [pt, pr, pb, pl] = pad
  const x = scale(0, data.length - 1, pl, w - pr)
  const y = scale(min, max, h - pb, pt)
  let s = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;font-size:${font}px">`
  for (const t of ticks) {
    if (grid) s += `<line x1="${pl}" x2="${w - pr}" y1="${y(t)}" y2="${y(t)}" stroke="${gridColor}" stroke-width="${grid}"/>`
    s += `<text x="${pl - 8}" y="${y(t) + 4}" text-anchor="end" fill="${labelColor}">${t}</text>`
  }
  for (const [i, t] of xlabels) s += `<text x="${x(i)}" y="${h - 6}" text-anchor="${i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}" fill="${labelColor}">${t}</text>`
  if (band) {
    const top = band.map((b, i) => `${x(i)},${y(b[1])}`).join(" ")
    const bot = band.map((b, i) => `${x(i)},${y(b[0])}`).reverse().join(" ")
    s += `<polygon points="${top} ${bot}" fill="${o.bandFill ?? "rgba(0,0,0,.08)"}"/>`
  }
  if (o.zero !== undefined) s += `<line x1="${pl}" x2="${w - pr}" y1="${y(o.zero)}" y2="${y(o.zero)}" stroke="${o.zeroColor ?? "#a3a3a3"}" stroke-width="1" ${o.zeroDash ? 'stroke-dasharray="3 3"' : ""}/>`
  const pts = data.map((v, i) => `${x(i)},${y(v)}`).join(" ")
  if (area) s += `<polygon points="${pl},${h - pb} ${pts} ${w - pr},${h - pb}" fill="${area}"/>`
  s += `<polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`
  if (dots) for (const [i, v] of data.entries()) s += `<circle cx="${x(i)}" cy="${y(v)}" r="${dots}" fill="${o.dotFill ?? stroke}"/>`
  if (o.last) {
    const i = data.length - 1
    s += `<circle cx="${x(i)}" cy="${y(data[i])}" r="3" fill="${stroke}"/><text x="${x(i) - 6}" y="${y(data[i]) - 10}" text-anchor="end" fill="${o.lastColor ?? stroke}" style="font-weight:500">${o.last}</text>`
  }
  return s + "</svg>"
}

function hBars(rows, o) {
  const { w, rowH = 28, bar = 8, labelW = 88, valueW = 40, fill = "#111", track, colors, font = 13, radius = 0, color = "#404040", gap } = o
  const h = rows.length * rowH
  const max = o.max ?? Math.max(...rows.map((r) => r[1]))
  const x = scale(0, max, 0, w - labelW - valueW)
  let s = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;font-size:${font}px">`
  rows.forEach(([label, v], i) => {
    const cy = i * rowH + rowH / 2
    s += `<text x="0" y="${cy + 4}" fill="${color}">${label}</text>`
    if (track) s += `<rect x="${labelW}" y="${cy - bar / 2}" width="${w - labelW - valueW}" height="${bar}" rx="${radius}" fill="${track}"/>`
    s += `<rect x="${labelW}" y="${cy - bar / 2}" width="${x(v)}" height="${bar}" rx="${radius}" fill="${colors ? colors[i % colors.length] : fill}"/>`
    s += `<text x="${w}" y="${cy + 4}" text-anchor="end" fill="${color}" style="font-variant-numeric:tabular-nums">${v}%</text>`
  })
  return s + "</svg>"
}

function donut(rows, o) {
  const { size = 160, thick = 22, colors } = o
  const r = size / 2 - thick / 2
  const c = 2 * Math.PI * r
  const total = rows.reduce((a, b) => a + b[1], 0)
  let s = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block"><g transform="rotate(-90 ${size / 2} ${size / 2})">`
  let off = 0
  rows.forEach(([, v], i) => {
    const len = (v / total) * c
    s += `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${colors[i]}" stroke-width="${thick}" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-off}"/>`
    off += len
  })
  s += `</g>`
  if (o.center) s += `<text x="${size / 2}" y="${size / 2 - 2}" text-anchor="middle" style="font-size:22px;font-weight:600" fill="#111">${o.center[0]}</text><text x="${size / 2}" y="${size / 2 + 18}" text-anchor="middle" style="font-size:12px" fill="#737373">${o.center[1]}</text>`
  return s + "</svg>"
}

// Lift with 95% interval per metric, on one shared axis.
function forest(rows, o) {
  const { w, rowH = 40, labelW = 0, min = -10, max = 14, color = "#111", muted = "#a3a3a3", sigColor, font = 12, axis = true, tickColor = "#737373" } = o
  const h = rows.length * rowH + (axis ? 24 : 0)
  const x = scale(min, max, labelW, w - 8)
  let s = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;font-size:${font}px">`
  s += `<line x1="${x(0)}" x2="${x(0)}" y1="0" y2="${rows.length * rowH}" stroke="${o.zeroColor ?? "#d4d4d4"}" stroke-width="1"/>`
  rows.forEach((m, i) => {
    const [name, , , lift, lo, hi, sig] = m
    const cy = i * rowH + rowH / 2
    const c = sig ? sigColor ?? color : muted
    if (labelW) s += `<text x="0" y="${cy + 4}" fill="${color}">${name}</text>`
    s += `<line x1="${x(lo)}" x2="${x(hi)}" y1="${cy}" y2="${cy}" stroke="${c}" stroke-width="${o.lineW ?? 1.5}"/>`
    s += `<circle cx="${x(lift)}" cy="${cy}" r="${o.dot ?? 3.5}" fill="${c}"/>`
  })
  if (axis) for (let t = Math.ceil(min / 4) * 4; t <= max; t += 4) s += `<text x="${x(t)}" y="${h - 6}" text-anchor="middle" fill="${tickColor}">${t > 0 ? "+" : ""}${t}%</text>`
  return s + "</svg>"
}

// ---------- page shell ----------

const FONTS = `
<link rel="stylesheet" href="/node_modules/@fontsource/noto-sans-sc/300.css">
<link rel="stylesheet" href="/node_modules/@fontsource/noto-sans-sc/400.css">
<link rel="stylesheet" href="/node_modules/@fontsource/noto-sans-sc/500.css">
<link rel="stylesheet" href="/node_modules/@fontsource/noto-sans-sc/600.css">
<link rel="stylesheet" href="/node_modules/@fontsource/noto-sans-sc/700.css">
<style>
${[300, 400, 500, 600, 700]
  .map((w) => `@font-face{font-family:"Latin Metric";font-weight:${w};font-display:block;size-adjust:105%;unicode-range:U+0000-00FF,U+2013-2014,U+2018-201D,U+2026;src:url("/node_modules/@fontsource/barlow/files/barlow-latin-${w}-normal.woff2") format("woff2")}`)
  .join("\n")}
*{box-sizing:border-box;margin:0;padding:0}
body{-webkit-font-smoothing:antialiased;text-spacing-trim:trim-start}
table{border-collapse:collapse}
.num{font-variant-numeric:tabular-nums}
</style>`

function page(title, css, body, { fonts = true } = {}) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${title}</title>${fonts ? FONTS : "<style>*{box-sizing:border-box;margin:0;padding:0}table{border-collapse:collapse}</style>"}<style>${css}</style></head><body>${body}</body></html>`
}
const SANS = `"Latin Metric","Noto Sans SC",sans-serif`
const dayLabels = (n, every, fmt) => Array.from({ length: n }, (_, i) => i).filter((i) => i % every === 0).map((i) => [i, fmt(i)])

// ---------- 运营月报 ----------

// 1. Dashboard: everything in white cards on a grey ground, coloured accents.
function ops1() {
  const d = OPS
  const accents = ["#4f46e5", "#0891b2", "#d97706", "#16a34a"]
  const chColors = ["#4f46e5", "#0891b2", "#f59e0b", "#10b981", "#cbd5e1"]
  const css = `
body{background:#f3f4f6;font-family:${SANS};color:#111827;font-size:14px;line-height:1.6}
.wrap{width:1200px;margin:0 auto;padding:40px 0 56px}
header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px}
h1{font-size:26px;font-weight:700;line-height:1.3}
.sub{color:#6b7280;font-size:13px;margin-top:4px}
.tag{background:#eef2ff;color:#4338ca;font-size:12px;font-weight:500;padding:4px 10px;border-radius:999px}
.card{background:#fff;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.05),0 1px 3px rgba(0,0,0,.08);padding:20px 24px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:20px}
.kpi{display:flex;gap:14px;align-items:flex-start}
.ico{width:40px;height:40px;border-radius:10px;flex:none}
.kl{color:#6b7280;font-size:13px}
.kv{font-size:28px;font-weight:600;line-height:1.25;margin-top:2px}
.kv small{font-size:14px;font-weight:500;color:#6b7280;margin-left:4px}
.pill{display:inline-block;margin-top:8px;font-size:12px;font-weight:500;padding:2px 8px;border-radius:999px}
.up{background:#dcfce7;color:#15803d}.down{background:#fee2e2;color:#b91c1c}
.row{display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px}
h2{font-size:15px;font-weight:600;margin-bottom:12px;display:flex;justify-content:space-between}
h2 span{font-weight:400;color:#9ca3af;font-size:12px}
.legend{display:grid;gap:8px;margin-top:16px}
.legend div{display:flex;align-items:center;gap:8px;font-size:13px}
.legend i{width:10px;height:10px;border-radius:3px;display:inline-block}
.legend b{margin-left:auto;font-weight:500}
.dn{display:flex;justify-content:center}
table{width:100%}
th{font-size:12px;color:#6b7280;font-weight:500;text-align:left;background:#f9fafb;padding:10px 12px}
td{padding:11px 12px;border-top:1px solid #f3f4f6}
td.r,th.r{text-align:right}
.neg{color:#dc2626}.pos{color:#16a34a}
.share{display:flex;align-items:center;gap:8px}
.share i{display:block;height:6px;border-radius:3px;background:#a5b4fc}
.two{display:grid;grid-template-columns:2fr 1fr;gap:20px}
.f{border-left:3px solid #6366f1;padding:2px 0 2px 14px;margin-bottom:16px}
.f:last-child{margin-bottom:0}
.f b{display:block;font-weight:600}
.f p{color:#4b5563;font-size:13px}
.risk li{list-style:none;padding:10px 12px;background:#fff7ed;border-radius:8px;color:#9a3412;font-size:13px;margin-bottom:10px}
`
  const body = `<div class="wrap">
<header><div><h1>${d.title}</h1><div class="sub">${d.product} · ${d.period}</div></div><span class="tag">月度报告</span></header>
<div class="card" style="margin-bottom:20px;color:#374151">${d.summary}</div>
<div class="kpis">${d.kpis
    .map((k, i) => `<div class="card kpi"><div class="ico" style="background:${accents[i]}1f;border:2px solid ${accents[i]}55"></div><div><div class="kl">${k.label}</div><div class="kv num">${k.value}<small>${k.unit}</small></div><span class="pill ${k.up ? "up" : "down"}">${k.up ? "▲" : "▼"} ${k.delta}</span></div></div>`)
    .join("")}</div>
<div class="row">
<div class="card"><h2>日活跃用户趋势 <span>单位：万</span></h2>${lineChart(d.dau, { w: 728, h: 240, min: 115, max: 135, ticks: [115, 120, 125, 130, 135], grid: 1, gridColor: "#f3f4f6", stroke: "#4f46e5", sw: 2.5, area: "rgba(79,70,229,.08)", xlabels: dayLabels(30, 5, (i) => `9/${i + 1}`), pad: [12, 8, 28, 36], labelColor: "#9ca3af" })}</div>
<div class="card"><h2>新增用户渠道 <span>占比</span></h2><div class="dn">${donut(d.channels, { size: 150, thick: 24, colors: chColors, center: ["4.82", "万新增"] })}</div><div class="legend">${d.channels.map(([n, v], i) => `<div><i style="background:${chColors[i]}"></i>${n}<b class="num">${v}%</b></div>`).join("")}</div></div>
</div>
<div class="card" style="margin-bottom:20px"><h2>品类成交额 <span>单位：万元</span></h2><table><tr><th>品类</th><th class="r">成交额</th><th class="r">环比</th><th style="width:260px">占比</th></tr>${d.categories
    .map(([n, g, m, s]) => `<tr><td>${n}</td><td class="r num">${g}</td><td class="r num ${m.startsWith("−") ? "neg" : "pos"}">${m}</td><td><div class="share"><i style="width:${s * 6}px"></i><span class="num">${s}%</span></div></td></tr>`)
    .join("")}</table></div>
<div class="two"><div class="card"><h2>主要发现</h2>${d.findings.map(([t, p]) => `<div class="f"><b>${t}</b><p>${p}</p></div>`).join("")}</div>
<div class="card"><h2>风险提示</h2><ul class="risk">${d.risks.map((r) => `<li>${r}</li>`).join("")}</ul></div></div>
</div>`
  return page(d.title, css, body)
}

// 2. Editorial: no containers, one column of reading, rules and type carry the structure.
function ops2() {
  const d = OPS
  const css = `
body{background:#fff;font-family:${SANS};color:#171717;font-size:15px;line-height:26px}
.wrap{width:1040px;margin:0 auto;padding:88px 0 104px}
.eyebrow{font-size:13px;color:#737373;letter-spacing:.02em}
h1{font-size:44px;line-height:56px;font-weight:600;margin-top:12px;letter-spacing:-.01em}
.lead{font-size:20px;line-height:34px;color:#404040;max-width:760px;margin-top:24px;font-weight:300}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);margin-top:64px;border-top:1px solid #171717}
.kpi{padding:16px 24px 0 0}
.kpi+.kpi{padding-left:24px;border-left:1px solid #e5e5e5}
.kl{font-size:13px;color:#737373}
.kv{font-size:44px;line-height:56px;font-weight:300;margin-top:8px}
.kv small{font-size:15px;margin-left:4px;color:#525252;font-weight:400}
.kd{font-size:13px;color:#525252}
.kd.neg{color:#b91c1c}
section{margin-top:88px}
h2{font-size:22px;line-height:32px;font-weight:600}
.note{font-size:13px;color:#737373}
.head{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #e5e5e5;padding-bottom:12px;margin-bottom:24px}
.cols{display:grid;grid-template-columns:320px 1fr;gap:80px}
h3{font-size:15px;font-weight:600;margin-bottom:12px}
table{width:100%}
th{font-size:13px;font-weight:400;color:#737373;text-align:left;padding-bottom:8px;border-bottom:1px solid #171717}
td{height:41px;border-bottom:1px solid #e5e5e5}
.r{text-align:right}
.neg{color:#b91c1c}
ol{list-style:none;counter-reset:f}
ol li{counter-increment:f;display:grid;grid-template-columns:48px 1fr;padding:20px 0;border-bottom:1px solid #e5e5e5}
ol li::before{content:counter(f, decimal-leading-zero);font-size:13px;color:#737373}
ol b{font-weight:600}
ol p{color:#525252;margin-top:4px}
.risks{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:24px;color:#525252}
.risks p::before{content:"风险";display:block;font-size:13px;color:#b91c1c;margin-bottom:4px}
`
  const body = `<div class="wrap">
<div class="eyebrow">${d.product} · ${d.period}</div>
<h1>${d.title}</h1>
<p class="lead">${d.summary}</p>
<div class="kpis">${d.kpis.map((k) => `<div class="kpi"><div class="kl">${k.label}</div><div class="kv num">${k.value}<small>${k.unit}</small></div><div class="kd ${k.up ? "" : "neg"}">环比 ${k.delta}</div></div>`).join("")}</div>
<section><div class="head"><h2>日活跃用户</h2><span class="note">单位：万，9 月 1 日至 30 日</span></div>
${lineChart(d.dau, { w: 1040, h: 220, min: 115, max: 135, ticks: [120, 125, 130], grid: 1, gridColor: "#f0f0f0", stroke: "#171717", sw: 1.5, xlabels: dayLabels(30, 7, (i) => `9 月 ${i + 1} 日`), pad: [8, 0, 28, 32], labelColor: "#a3a3a3", last: "131.2" })}</section>
<section><div class="head"><h2>渠道与品类</h2><span class="note">成交额单位：万元</span></div>
<div class="cols"><div><h3>新增用户来源</h3>${hBars(d.channels, { w: 320, rowH: 41, bar: 4, labelW: 96, valueW: 44, fill: "#171717", track: "#f0f0f0", font: 14, color: "#262626" })}</div>
<div><h3>品类成交额</h3><table><tr><th>品类</th><th class="r">成交额</th><th class="r">环比</th><th class="r">占比</th></tr>${d.categories.map(([n, g, m, s]) => `<tr><td>${n}</td><td class="r num">${g}</td><td class="r num ${m.startsWith("−") ? "neg" : ""}">${m}</td><td class="r num">${s}%</td></tr>`).join("")}</table></div></div></section>
<section><div class="head"><h2>发现与风险</h2></div>
<ol>${d.findings.map(([t, p]) => `<li><div><b>${t}</b><p>${p}</p></div></li>`).join("")}</ol>
<div class="risks">${d.risks.map((r) => `<p>${r}</p>`).join("")}</div></section>
</div>`
  return page(d.title, css, body)
}

// 3. Careless: mixed containers and colours, uneven spacing, system font, half-width punctuation.
function ops3() {
  const d = JSON.parse(halfWidth(JSON.stringify(OPS)))
  const rainbow = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"]
  const css = `
body{background:#fff;font-family:"WenQuanYi Zen Hei",sans-serif;color:#222;font-size:14px;line-height:1.5}
.wrap{width:1180px;margin:0 auto;padding:20px 0 40px}
.banner{background:linear-gradient(90deg,#3b82f6,#8b5cf6,#ec4899);color:#fff;padding:28px 32px;border-radius:16px;text-align:center}
.banner h1{font-size:32px}
.banner p{opacity:.9;margin-top:6px}
.sum{margin:18px 0 30px;padding:12px;border:1px dashed #94a3b8;border-radius:4px;font-size:15px}
.kpis{display:flex;gap:12px}
.kpi{flex:1;color:#fff;border-radius:8px;padding:14px 18px;box-shadow:0 4px 10px rgba(0,0,0,.15)}
.kpi .v{font-size:34px;font-weight:bold}
.kpi .d{font-size:12px;background:rgba(255,255,255,.25);display:inline-block;padding:1px 6px;border-radius:4px}
.mid{display:flex;gap:30px;margin-top:22px;align-items:flex-start}
.box{border:2px solid #e2e8f0;border-radius:6px;padding:12px}
.box h2{font-size:17px;text-align:center;margin-bottom:8px;color:#1e3a8a}
.left{flex:1.4}.right{flex:1}
table{width:100%;margin-top:36px;border:1px solid #cbd5e1}
caption{font-size:18px;font-weight:bold;text-align:left;padding:8px 0;color:#7c3aed}
th{background:#1e3a8a;color:#fff;padding:8px;border:1px solid #cbd5e1}
td{padding:6px 8px;border:1px solid #cbd5e1;text-align:center}
tr:nth-child(odd) td{background:#eff6ff}
.bottom{display:flex;gap:16px;margin-top:20px}
.find{flex:2;background:#fefce8;border:1px solid #fde047;border-radius:10px;padding:16px 20px}
.find h2,.risk h2{font-size:20px;margin-bottom:6px}
.find li{margin:6px 0 6px 20px}
.risk{flex:1;background:#fef2f2;border:1px solid #fecaca;padding:10px;border-radius:2px}
.risk p{margin:8px 0;color:#b91c1c}
`
  const kcol = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]
  const body = `<div class="wrap">
<div class="banner"><h1>${d.title}</h1><p>${d.product} | ${d.period}</p></div>
<div class="sum"><b>摘要: </b>${d.summary}</div>
<div class="kpis">${d.kpis.map((k, i) => `<div class="kpi" style="background:${kcol[i]}"><div>${k.label}</div><div class="v">${k.value} ${k.unit}</div><span class="d">${k.delta}</span></div>`).join("")}</div>
<div class="mid"><div class="box left"><h2>日活跃用户趋势(万)</h2>${lineChart(d.dau, { w: 620, h: 260, min: 110, max: 140, ticks: [110, 115, 120, 125, 130, 135, 140], grid: 1, gridColor: "#cbd5e1", stroke: "#ef4444", sw: 3, dots: 4, dotFill: "#fff", xlabels: dayLabels(30, 3, (i) => `9-${i + 1}`), pad: [10, 10, 26, 40], labelColor: "#334155" })}</div>
<div class="box right"><h2>渠道分布</h2>${hBars(d.channels, { w: 390, rowH: 52, bar: 30, labelW: 90, valueW: 40, colors: rainbow, radius: 6, font: 14, color: "#111" })}</div></div>
<table><caption>各品类成交额(万元)</caption><tr><th>品类</th><th>成交额</th><th>环比</th><th>占比</th></tr>${d.categories.map(([n, g, m, s]) => `<tr><td>${n}</td><td>${g}</td><td style="color:${m.startsWith("−") ? "red" : "green"};font-weight:bold">${m}</td><td>${s}%</td></tr>`).join("")}</table>
<div class="bottom"><div class="find"><h2>📌 主要发现</h2><ul>${d.findings.map(([t, p]) => `<li><b>${t}: </b>${p}</li>`).join("")}</ul></div>
<div class="risk"><h2>⚠ 风险</h2>${d.risks.map((r) => `<p>• ${r}</p>`).join("")}</div></div>
</div>`
  return page(d.title, css, body, { fonts: false })
}

// 4. Plausible but loose: no cards, yet uneven widths, a hole beside the chart,
//    weak heading contrast, irregular section spacing.
function ops4() {
  const d = OPS
  const css = `
body{background:#fafafa;font-family:${SANS};color:#262626;font-size:14px;line-height:22px}
.wrap{width:1160px;margin:0 auto;padding:48px 0 64px}
h1{font-size:22px;font-weight:600}
.meta{color:#737373;margin-top:4px}
.sum{margin-top:28px;font-size:15px;max-width:1160px}
.kpis{display:flex;gap:40px;margin-top:40px}
.kpi{border-bottom:2px solid #d4d4d4;padding-bottom:12px}
.kpi:nth-child(1){width:240px}.kpi:nth-child(2){width:200px}.kpi:nth-child(3){width:300px}.kpi:nth-child(4){width:180px}
.kl{color:#737373;font-size:13px}
.kv{font-size:30px;line-height:40px;font-weight:500}
.kv small{font-size:14px;color:#737373}
.kd{font-size:12px;color:#737373}
h2{font-size:16px;font-weight:600;margin-bottom:16px}
.mid{display:flex;gap:56px;margin-top:88px;align-items:flex-start}
.mid>div:first-child{width:700px}
.mid>div:last-child{flex:1}
.ch{display:grid;gap:14px}
.ch div{display:flex;justify-content:space-between;border-bottom:1px dotted #d4d4d4;padding-bottom:6px}
table{width:100%;margin-top:24px}
th{font-size:12px;color:#737373;font-weight:500;text-align:left;padding:6px 0;border-bottom:1px solid #d4d4d4}
td{padding:9px 0;border-bottom:1px solid #ececec}
.neg{color:#dc2626}
.bottom{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:56px}
.bottom p{margin-bottom:12px}
.bottom b{font-weight:600}
.risk{background:#fff;border:1px solid #e5e5e5;padding:16px}
`
  const body = `<div class="wrap">
<h1>${d.title}</h1><div class="meta">${d.product} / ${d.period}</div>
<p class="sum">${d.summary}</p>
<div class="kpis">${d.kpis.map((k) => `<div class="kpi"><div class="kl">${k.label}</div><div class="kv num">${k.value}<small> ${k.unit}</small></div><div class="kd ${k.up ? "" : "neg"}">${k.delta}</div></div>`).join("")}</div>
<div class="mid"><div><h2>日活跃用户趋势</h2>${lineChart(d.dau, { w: 700, h: 300, min: 115, max: 135, ticks: [115, 120, 125, 130, 135], grid: 1, gridColor: "#d4d4d4", stroke: "#2563eb", sw: 2, dots: 2.5, xlabels: dayLabels(30, 5, (i) => `9/${i + 1}`), pad: [10, 8, 28, 36] })}</div>
<div><h2>渠道</h2><div class="ch">${d.channels.map(([n, v]) => `<div><span>${n}</span><span class="num">${v}%</span></div>`).join("")}</div></div></div>
<div style="margin-top:32px"><h2>品类成交额（万元）</h2><table><tr><th>品类</th><th>成交额</th><th>环比</th><th>占比</th></tr>${d.categories.map(([n, g, m, s]) => `<tr><td>${n}</td><td class="num">${g}</td><td class="num ${m.startsWith("−") ? "neg" : ""}">${m}</td><td class="num">${s}%</td></tr>`).join("")}</table></div>
<div class="bottom"><div><h2>发现</h2>${d.findings.map(([t, p]) => `<p><b>${t}。</b>${p}</p>`).join("")}</div>
<div class="risk"><h2>风险</h2>${d.risks.map((r) => `<p>${r}</p>`).join("")}</div></div>
</div>`
  return page(d.title, css, body)
}

// ---------- A/B 实验报告 ----------

const fmtLift = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`
const fmtCI = (lo, hi) => `[${fmtLift(lo)}, ${fmtLift(hi)}]`

// 1. Memo: one narrow reading column, a tinted verdict callout, quiet tables.
function ab1() {
  const d = AB
  const css = `
body{background:#fff;font-family:${SANS};color:#1f1f1f;font-size:15px;line-height:26px}
.wrap{width:760px;margin:0 auto;padding:80px 0 96px}
h1{font-size:32px;line-height:44px;font-weight:600}
.meta{display:grid;grid-template-columns:96px 1fr;margin-top:24px;font-size:14px;color:#525252;row-gap:2px}
.meta dt{color:#8a8a8a}
.verdict{margin-top:40px;background:#f0fdf4;border-radius:8px;padding:20px 24px;font-size:17px;line-height:30px}
.verdict b{display:block;font-size:13px;color:#15803d;font-weight:600;line-height:20px;margin-bottom:4px}
h2{font-size:20px;line-height:30px;font-weight:600;margin-top:56px;margin-bottom:16px}
p.t{color:#404040}
table{width:100%;font-size:14px}
th{font-weight:500;color:#8a8a8a;text-align:left;padding:8px 0;border-bottom:1px solid #e5e5e5}
td{padding:10px 0;border-bottom:1px solid #f0f0f0}
.r{text-align:right}
.sig{color:#15803d}.ns{color:#a3a3a3}
.cap{font-size:13px;color:#8a8a8a;margin-top:8px}
ol{padding-left:0;list-style:none;counter-reset:n}
ol li{counter-increment:n;padding-left:32px;position:relative;margin-bottom:16px}
ol li::before{content:counter(n);position:absolute;left:0;top:0;color:#8a8a8a}
ol b{font-weight:600}
ol p{color:#525252}
`
  const body = `<div class="wrap">
<h1>${d.title}</h1>
<dl class="meta"><dt>负责团队</dt><dd>${d.owner}</dd><dt>实验周期</dt><dd>${d.period}</dd><dt>分流</dt><dd>${d.traffic}</dd><dt>样本量</dt><dd class="num">对照组 ${d.samples[0]} 人，实验组 ${d.samples[1]} 人</dd></dl>
<div class="verdict"><b>结论</b>${d.verdict}</div>
<h2>指标结果</h2>
<table><tr><th>指标</th><th class="r">对照组</th><th class="r">实验组</th><th class="r">变化</th><th class="r">95% 置信区间</th></tr>${d.metrics.map((m) => `<tr><td>${m[0]}${m[7] ? "（主指标）" : ""}</td><td class="r num">${m[1]}</td><td class="r num">${m[2]}</td><td class="r num ${m[6] ? "sig" : "ns"}">${fmtLift(m[3])}</td><td class="r num ${m[6] ? "" : "ns"}">${fmtCI(m[4], m[5])}</td></tr>`).join("")}</table>
<p class="cap">绿色为显著（p &lt; 0.05），灰色为不显著。</p>
<h2>主指标随时间的变化</h2>
<p class="t">累计提升在第 8 天后稳定在 4% 左右，置信区间逐日收窄，第 6 天起不再包含 0。</p>
${lineChart(d.daily.map((x) => x[0]), { w: 760, h: 220, min: -6, max: 16, ticks: [-4, 0, 4, 8, 12, 16], band: d.daily.map((x) => [x[1], x[2]]), bandFill: "rgba(21,128,61,.1)", stroke: "#15803d", sw: 1.5, zero: 0, xlabels: dayLabels(21, 5, (i) => `第 ${i + 1} 天`), pad: [12, 8, 28, 32], labelColor: "#a3a3a3" })}
<h2>分群表现</h2>
<table><tr><th>用户群</th><th class="r">支付转化率</th><th class="r">提升</th></tr>${d.segments.map(([n, l, c]) => `<tr><td>${n}</td><td class="r num">${c}</td><td class="r num sig">${fmtLift(l)}</td></tr>`).join("")}</table>
<h2>下一步</h2>
<ol>${d.next.map(([t, p]) => `<li><b>${t}</b><p>${p}</p></li>`).join("")}</ol>
</div>`
  return page(d.title, css, body)
}

// 2. Showcase: dark hero, gradient headline number, a colourful card per metric.
function ab2() {
  const d = AB
  const tops = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444"]
  const css = `
body{background:#f8fafc;font-family:${SANS};color:#0f172a;font-size:14px;line-height:22px}
.hero{background:#0f172a;color:#fff;padding:56px 0 64px}
.in{width:1180px;margin:0 auto}
.hero .k{font-size:13px;color:#94a3b8}
.hero h1{font-size:30px;line-height:40px;font-weight:600;margin-top:8px}
.big{display:flex;gap:48px;align-items:flex-end;margin-top:32px}
.big .n{font-size:88px;line-height:88px;font-weight:700;background:linear-gradient(90deg,#4ade80,#22d3ee);-webkit-background-clip:text;color:transparent}
.big p{font-size:17px;line-height:28px;color:#cbd5e1;max-width:520px}
.chips{display:flex;gap:12px;margin-top:32px}
.chip{border:1px solid #334155;border-radius:999px;padding:6px 14px;font-size:13px;color:#cbd5e1}
.body{width:1180px;margin:-32px auto 0;padding-bottom:72px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.card{background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(15,23,42,.08);padding:22px 24px;border-top:4px solid}
.card .l{font-size:13px;color:#64748b}
.card .v{font-size:32px;line-height:40px;font-weight:700;margin-top:6px}
.card .row{display:flex;justify-content:space-between;margin-top:12px;font-size:13px;color:#64748b}
.badge{display:inline-block;font-size:12px;padding:2px 10px;border-radius:999px;margin-top:10px}
.y{background:#dcfce7;color:#166534}.n{background:#f1f5f9;color:#64748b}
.wide{display:grid;grid-template-columns:3fr 2fr;gap:20px;margin-top:20px}
.panel{background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(15,23,42,.08);padding:24px}
h2{font-size:17px;font-weight:600;margin-bottom:16px}
.seg{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.seg div{background:#f1f5f9;border-radius:10px;padding:14px 16px}
.seg b{display:block;font-size:24px;line-height:32px;color:#0891b2}
.next{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px}
.step{background:linear-gradient(135deg,#eef2ff,#f0fdfa);border-radius:14px;padding:22px 24px}
.step i{font-style:normal;display:inline-flex;width:28px;height:28px;border-radius:50%;background:#6366f1;color:#fff;align-items:center;justify-content:center;font-size:13px;font-weight:600}
.step b{display:block;margin-top:12px;font-size:15px}
.step p{color:#475569;margin-top:4px}
`
  const body = `<div class="hero"><div class="in"><div class="k">${d.owner} · 实验报告</div><h1>${d.title}</h1>
<div class="big"><div class="n num">+4.1%</div><p>${d.verdict}</p></div>
<div class="chips"><span class="chip">${d.period}</span><span class="chip">${d.traffic}</span><span class="chip num">样本 ${d.samples[0]} / ${d.samples[1]}</span></div></div></div>
<div class="body"><div class="grid">${d.metrics.map((m, i) => `<div class="card" style="border-top-color:${tops[i]}"><div class="l">${m[0]}</div><div class="v num">${fmtLift(m[3])}</div><div class="row"><span>对照 ${m[1]}</span><span>实验 ${m[2]}</span></div><span class="badge ${m[6] ? "y" : "n"}">${m[6] ? "显著" : "不显著"} ${fmtCI(m[4], m[5])}</span></div>`).join("")}</div>
<div class="wide"><div class="panel"><h2>支付转化率累计提升</h2>${lineChart(d.daily.map((x) => x[0]), { w: 620, h: 230, min: -6, max: 16, ticks: [-4, 0, 4, 8, 12, 16], grid: 1, gridColor: "#f1f5f9", band: d.daily.map((x) => [x[1], x[2]]), bandFill: "rgba(99,102,241,.15)", stroke: "#6366f1", sw: 2.5, dots: 3, zero: 0, xlabels: dayLabels(21, 4, (i) => `D${i + 1}`), pad: [10, 8, 28, 32], labelColor: "#94a3b8" })}</div>
<div class="panel"><h2>分群提升</h2><div class="seg">${d.segments.map(([n, l, c]) => `<div>${n}<b class="num">${fmtLift(l)}</b><span style="font-size:12px;color:#64748b">${c}</span></div>`).join("")}</div></div></div>
<div class="next">${d.next.map(([t, p], i) => `<div class="step"><i>${i + 1}</i><b>${t}</b><p>${p}</p></div>`).join("")}</div></div>`
  return page(d.title, css, body)
}

// 3. Grid: 12 columns, section titles hang in the left 3, light figures, no containers.
function ab3() {
  const d = AB
  const css = `
body{background:#fff;font-family:${SANS};color:#171717;font-size:14px;line-height:24px}
.wrap{width:1152px;margin:0 auto;padding:72px 0 120px}
.g{display:grid;grid-template-columns:repeat(12,1fr);column-gap:24px}
.l{grid-column:span 3}.r{grid-column:span 9}
header{min-height:144px}
header .l{font-size:12px;color:#737373;line-height:24px}
h1{font-size:48px;line-height:60px;font-weight:500}
section{margin-top:96px}
h2{font-size:20px;line-height:24px;font-weight:500}
.side{font-size:12px;color:#737373;margin-top:12px;line-height:20px}
.verdict{font-size:24px;line-height:36px;font-weight:300}
.figs{display:grid;grid-template-columns:repeat(3,1fr);column-gap:24px;margin-top:48px}
.fv{font-size:48px;line-height:60px;font-weight:300}
.fl{font-size:12px;color:#737373}
.mt{display:grid;grid-template-columns:repeat(9,1fr);column-gap:24px}
.mrow{display:contents}
.mrow>*{height:40px;display:flex;align-items:center;border-bottom:1px solid #e5e5e5}
.hd>*{color:#737373;font-size:12px;border-bottom-color:#171717}
.c2{grid-column:span 2}.c1{grid-column:span 1}.c3{grid-column:span 3}
.rt{justify-content:flex-end}
.ns{color:#a3a3a3}
.segs{display:grid;grid-template-columns:repeat(4,1fr);column-gap:24px}
.segs .fv{font-size:30px;line-height:36px}
.next{display:grid;grid-template-columns:repeat(3,1fr);column-gap:24px}
.next b{font-weight:600;display:block}
.next p{color:#525252}
.next i{font-style:normal;font-size:12px;color:#737373;display:block}
`
  const fw = 264 * 3 + 24 * 2
  const body = `<div class="wrap">
<header class="g"><div class="l">${d.owner}<br>${d.period}</div><div class="r"><h1>${d.title}</h1></div></header>
<section class="g"><div class="l"><h2>结论</h2></div><div class="r"><p class="verdict">${d.verdict}</p>
<div class="figs"><div><div class="fv num">+4.1%</div><div class="fl">支付转化率，主指标</div></div><div><div class="fv num">${d.samples[1]}</div><div class="fl">实验组样本量，对照组 ${d.samples[0]}</div></div><div><div class="fv num">21 天</div><div class="fl">${d.traffic}</div></div></div></div></section>
<section class="g"><div class="l"><h2>指标结果</h2><p class="side">点为提升幅度，线为 95% 置信区间；灰色为不显著。</p></div><div class="r"><div class="mt">
<div class="mrow hd"><span class="c2">指标</span><span class="c1 rt">对照组</span><span class="c1 rt">实验组</span><span class="c1 rt">变化</span><span class="c2">置信区间</span><span class="c2 rt">区间</span></div>
${d.metrics.map((m) => `<div class="mrow"><span class="c2">${m[0]}</span><span class="c1 rt num">${m[1]}</span><span class="c1 rt num">${m[2]}</span><span class="c1 rt num ${m[6] ? "" : "ns"}">${fmtLift(m[3])}</span><span class="c2">${forest([m], { w: 168, rowH: 39, axis: false, min: -10, max: 14, color: "#171717", muted: "#c4c4c4", zeroColor: "#d4d4d4" })}</span><span class="c2 rt num ${m[6] ? "" : "ns"}">${fmtCI(m[4], m[5])}</span></div>`).join("")}
</div></div></section>
<section class="g"><div class="l"><h2>随时间变化</h2><p class="side">主指标累计提升与 95% 置信区间，第 6 天起区间不再包含 0。</p></div><div class="r">${lineChart(d.daily.map((x) => x[0]), { w: fw, h: 192, min: -6, max: 16, ticks: [0, 4, 8, 12, 16], band: d.daily.map((x) => [x[1], x[2]]), bandFill: "rgba(0,0,0,.06)", stroke: "#171717", sw: 1.5, zero: 0, xlabels: dayLabels(21, 5, (i) => `第 ${i + 1} 天`), pad: [8, 0, 24, 32], labelColor: "#a3a3a3", last: "+4.1%" })}</div></section>
<section class="g"><div class="l"><h2>分群</h2><p class="side">支付转化率提升，各群均显著。</p></div><div class="r"><div class="segs">${d.segments.map(([n, l, c]) => `<div><div class="fv num">${fmtLift(l)}</div><div class="fl">${n}，${c}</div></div>`).join("")}</div></div></section>
<section class="g"><div class="l"><h2>下一步</h2></div><div class="r"><div class="next">${d.next.map(([t, p], i) => `<div><i>0${i + 1}</i><b>${t}</b><p>${p}</p></div>`).join("")}</div></div></section>
</div>`
  return page(d.title, css, body)
}

// 4. Cramped: full width, small type, every block boxed with a grey title bar.
function ab4() {
  const d = AB
  const css = `
body{background:#e5e7eb;font-family:${SANS};color:#111;font-size:12px;line-height:18px}
.wrap{width:1400px;margin:0 auto;padding:12px 0}
.top{background:#fff;border:1px solid #9ca3af;padding:6px 10px;display:flex;justify-content:space-between;align-items:center}
h1{font-size:16px;font-weight:600}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px}
.box{background:#fff;border:1px solid #9ca3af}
.box h2{background:#d1d5db;font-size:12px;font-weight:600;padding:3px 8px;border-bottom:1px solid #9ca3af}
.box .c{padding:6px 8px}
.box+.box{margin-top:6px}
table{width:100%}
th,td{border:1px solid #d1d5db;padding:2px 6px;text-align:left}
th{background:#f3f4f6;font-weight:600}
.y{color:#16a34a;font-weight:600}.n{color:#9ca3af}
.kv{display:grid;grid-template-columns:80px 1fr;gap:2px 8px}
.kv dt{color:#6b7280}
.verdict{background:#fef9c3;border:1px solid #facc15;padding:6px 8px;font-weight:600}
li{margin-left:16px}
`
  const body = `<div class="wrap">
<div class="top"><h1>${d.title}</h1><span>${d.owner} | ${d.period}</span></div>
<div class="cols"><div>
<div class="box"><h2>实验信息</h2><div class="c"><dl class="kv"><dt>周期</dt><dd>${d.period}</dd><dt>分流</dt><dd>${d.traffic}</dd><dt>对照组</dt><dd class="num">${d.samples[0]}</dd><dt>实验组</dt><dd class="num">${d.samples[1]}</dd></dl></div></div>
<div class="box"><h2>结论</h2><div class="c"><div class="verdict">${d.verdict}</div></div></div>
<div class="box"><h2>指标结果</h2><div class="c"><table><tr><th>指标</th><th>对照组</th><th>实验组</th><th>变化</th><th>95% 置信区间</th><th>显著</th></tr>${d.metrics.map((m) => `<tr><td>${m[0]}</td><td class="num">${m[1]}</td><td class="num">${m[2]}</td><td class="num">${fmtLift(m[3])}</td><td class="num">${fmtCI(m[4], m[5])}</td><td class="${m[6] ? "y" : "n"}">${m[6] ? "是" : "否"}</td></tr>`).join("")}</table></div></div>
<div class="box"><h2>置信区间</h2><div class="c">${forest(d.metrics, { w: 670, rowH: 22, labelW: 90, color: "#111", sigColor: "#2563eb", muted: "#9ca3af", font: 11, dot: 3, lineW: 2 })}</div></div>
</div><div>
<div class="box"><h2>支付转化率累计提升</h2><div class="c">${lineChart(d.daily.map((x) => x[0]), { w: 670, h: 150, min: -6, max: 16, ticks: [-5, 0, 5, 10, 15], grid: 1, gridColor: "#d1d5db", band: d.daily.map((x) => [x[1], x[2]]), bandFill: "rgba(37,99,235,.15)", stroke: "#2563eb", sw: 2, dots: 2, zero: 0, xlabels: dayLabels(21, 2, (i) => `${i + 1}`), pad: [6, 4, 18, 26], font: 10, labelColor: "#374151" })}</div></div>
<div class="box"><h2>分群</h2><div class="c"><table><tr><th>用户群</th><th>转化率</th><th>提升</th></tr>${d.segments.map(([n, l, c]) => `<tr><td>${n}</td><td class="num">${c}</td><td class="num y">${fmtLift(l)}</td></tr>`).join("")}</table></div></div>
<div class="box"><h2>下一步</h2><div class="c"><ol>${d.next.map(([t, p]) => `<li><b>${t}</b>：${p}</li>`).join("")}</ol></div></div>
</div></div></div>`
  return page(d.title, css, body)
}

const PAGES = { "ops-1": ops1, "ops-2": ops2, "ops-3": ops3, "ops-4": ops4, "ab-1": ab1, "ab-2": ab2, "ab-3": ab3, "ab-4": ab4 }
for (const [name, fn] of Object.entries(PAGES)) fs.writeFileSync(path.join(OUT, `${name}.html`), fn())
console.log(`${Object.keys(PAGES).length} pages → ${path.relative(ROOT, OUT)}`)
