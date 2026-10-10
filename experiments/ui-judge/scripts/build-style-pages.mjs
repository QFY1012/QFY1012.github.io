// Five pages for the 运营月报 data in styles the renderer does not make
// (editorial, dark dashboard, sidebar contents, brand band, dense terminal),
// written as plain HTML so the style is free. The judge only sees the
// screenshots, so this tests whether its taste carries across styles.
//
//   node scripts/build-style-pages.mjs   → out/style/style-<v>/{page.html,shot.png}
// The screenshot matches the renderer's: a 1440px viewport, clipped to the
// middle 1248px.
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright-core"

const ROOT = path.resolve(import.meta.dirname, "..")
const OUT = path.join(ROOT, "out", "style")
const ops = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "ops.json"), "utf8"))
const font = (pkg, w) => `<link rel="stylesheet" href="file://${path.join(ROOT, "node_modules", "@fontsource", pkg, `${w}.css`)}">`
const FONTS = [300, 400, 500, 600].map((w) => font("noto-sans-sc", w)).join("") +
  [400, 600].map((w) => font("noto-serif-sc", w)).join("") + [400, 500].map((w) => font("ibm-plex-mono", w)).join("")
const num = (v) => v.toLocaleString("en-US")
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
const doc = (css, body) => `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">${FONTS}<style>
*{box-sizing:border-box;margin:0;padding:0}
body{-webkit-font-smoothing:antialiased;text-spacing-trim:trim-start}
table{border-collapse:collapse;width:100%}
${css}</style></head><body>${body}</body></html>`

// Daily active users as an SVG line: y ticks 120/125/130, x labels weekly, the last point labelled.
function line({ w, h, stroke, grid, text, fill, font = "inherit", size = 12, pad = [16, 40, 24, 32] }) {
  const [pt, pr, pb, pl] = pad
  const d = ops.dauDaily, lo = 118, hi = 134
  const x = (i) => pl + (i / (d.length - 1)) * (w - pl - pr)
  const y = (v) => pt + (1 - (v - lo) / (hi - lo)) * (h - pt - pb)
  const pts = d.map((p, i) => `${x(i).toFixed(1)},${y(p.dau).toFixed(1)}`)
  const ticks = [120, 125, 130].map((v) => `<line x1="${pl}" x2="${w - pr}" y1="${y(v)}" y2="${y(v)}" stroke="${grid}"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")
  const xs = [0, 7, 14, 21, 28].map((i) => `<text x="${x(i)}" y="${h - 4}" text-anchor="middle">9/${d[i].day}</text>`).join("")
  const last = d[d.length - 1]
  const area = fill ? `<polygon points="${pl},${h - pb} ${pts.join(" ")} ${w - pr},${h - pb}" fill="${fill}"/>` : ""
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;font-family:${font};font-size:${size}px;fill:${text}">${ticks}${xs}${area}
<polyline points="${pts.join(" ")}" fill="none" stroke="${stroke}" stroke-width="1.75" stroke-linejoin="round"/>
<circle cx="${x(d.length - 1)}" cy="${y(last.dau)}" r="3.5" fill="${stroke}"/><text x="${x(d.length - 1) - 8}" y="${y(last.dau) - 10}" text-anchor="end" style="fill:${stroke};font-weight:500">${last.dau}</text></svg>`
}
// Horizontal bars as rows: label, a bar scaled to max, the value.
const bars = (items, { max, color, track, labelW = 72, h = 6, gap = 14, valueW = 44, radius = 3 }) =>
  `<div style="display:flex;flex-direction:column;gap:${gap}px">${items.map((it) => `<div style="display:grid;grid-template-columns:${labelW}px 1fr ${valueW}px;align-items:center;gap:12px">
<span>${esc(it.label)}</span><div style="height:${h}px;background:${track};border-radius:${radius}px"><div style="height:100%;width:${(it.value / max) * 100}%;background:${color};border-radius:${radius}px"></div></div><span class="num" style="text-align:right">${esc(it.display)}</span></div>`).join("")}</div>`
const channels = ops.channels.map((c) => ({ label: c.name, value: c.share, display: `${c.share}%` }))
const k = ops.kpis

const PAGES = {
  // Editorial: warm paper, serif titles and figures, numbered sections under rules.
  a: doc(`
body{background:#f7f4ee;color:#1d1b18;font-family:"Noto Sans SC",sans-serif;font-size:15px;line-height:1.75}
.serif{font-family:"Noto Serif SC",serif}
.wrap{width:1040px;margin:0 auto;padding:96px 0 120px}
.kicker{font-size:12px;letter-spacing:.18em;color:#8a8378}
h1{font-family:"Noto Serif SC",serif;font-weight:600;font-size:56px;line-height:72px;margin-top:20px}
.lead{font-family:"Noto Serif SC",serif;font-size:21px;line-height:38px;color:#4a453e;width:760px;margin-top:28px}
.figs{display:grid;grid-template-columns:repeat(4,1fr);margin-top:64px;border-top:2px solid #1d1b18;border-bottom:1px solid #d8d1c4}
.fig{padding:24px 24px 28px 0}.fig+.fig{padding-left:24px;border-left:1px solid #d8d1c4}
.fig b{display:block;font-family:"Noto Serif SC",serif;font-weight:400;font-size:46px;line-height:56px}
.fig small{font-size:15px;margin-left:4px;color:#6f685d}
.fig span{display:block;font-size:13px;color:#6f685d;margin-top:4px}.down{color:#b4442f!important}
section{margin-top:96px}
.sh{display:flex;align-items:baseline;gap:20px;border-top:1px solid #1d1b18;padding-top:18px;margin-bottom:36px}
.sh i{font-style:normal;font-family:"Noto Serif SC",serif;color:#8a8378}
.sh h2{font-family:"Noto Serif SC",serif;font-weight:600;font-size:28px;line-height:40px}
.sh em{font-style:normal;margin-left:auto;font-size:13px;color:#8a8378}
.two{display:grid;grid-template-columns:340px 1fr;gap:64px}
.two p{font-family:"Noto Serif SC",serif;font-size:17px;line-height:32px;color:#3b3731}
td,th{padding:10px 0;border-bottom:1px solid #ddd6c9;text-align:left;font-weight:400}
th{font-size:13px;color:#8a8378;border-bottom:1px solid #1d1b18}
.r{text-align:right}.num{font-variant-numeric:tabular-nums}
.three{display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
.three b{display:block;font-family:"Noto Serif SC",serif;font-size:40px;line-height:48px;color:#b4442f;font-weight:400}
.three h3{font-family:"Noto Serif SC",serif;font-size:19px;line-height:30px;margin-top:12px;font-weight:600}
.three p{color:#4a453e;margin-top:8px}
.note{margin-top:48px;padding-top:20px;border-top:1px solid #d8d1c4;font-size:14px;color:#6f685d;display:grid;gap:8px}
`, `<div class="wrap">
<div class="kicker">${esc(ops.product)} / ${esc(ops.period)}</div>
<h1>${esc(ops.title)}</h1><p class="lead">${esc(ops.summary)}</p>
<div class="figs">${k.map((x) => `<div class="fig"><b>${x.value}<small>${x.unit}</small></b><span>${x.label}</span><span class="${x.direction === "down" ? "down" : ""}">环比 ${x.change}</span></div>`).join("")}</div>
<section><div class="sh"><i>01</i><h2>日活跃用户</h2><em>单位：万</em></div>${line({ w: 1040, h: 240, stroke: "#1d1b18", grid: "#e2dbcf", text: "#8a8378", font: "'Noto Serif SC',serif", size: 13 })}</section>
<section><div class="sh"><i>02</i><h2>品类与渠道</h2><em>成交额单位：万元</em></div><div class="two">
<div><p>${esc(ops.findings[1].detail)}</p><div style="margin-top:40px;font-size:14px">${bars(channels, { max: 40, color: "#1d1b18", track: "#e6dfd2", h: 3, radius: 0, labelW: 84 })}</div><div style="font-size:13px;color:#8a8378;margin-top:12px">新增用户来源</div></div>
<table><tr><th>品类</th><th class="r">成交额</th><th class="r">环比</th><th class="r">占比</th></tr>${ops.categories.map((c) => `<tr><td>${c.name}</td><td class="r num">${num(c.gmv)}</td><td class="r num" style="${c.change.startsWith("−") ? "color:#b4442f" : ""}">${c.change}</td><td class="r num">${c.share}%</td></tr>`).join("")}</table></div></section>
<section><div class="sh"><i>03</i><h2>本月发现</h2></div><div class="three">${ops.findings.map((f, i) => `<div><b>${"一二三"[i]}</b><h3>${esc(f.title)}</h3><p>${esc(f.detail)}</p></div>`).join("")}</div>
<div class="note">${ops.risks.map((r) => `<span>※ ${esc(r)}</span>`).join("")}</div></section>
</div>`),

  // Dark dashboard: cards on a near-black ground, one blue accent.
  b: doc(`
body{background:#0e1015;color:#e8eaf0;font-family:"Noto Sans SC",sans-serif;font-size:14px;line-height:1.6}
.wrap{width:1152px;margin:0 auto;padding:48px 0 64px}
.top{display:flex;align-items:center;justify-content:space-between}
h1{font-size:24px;font-weight:600}.top span{font-size:13px;color:#8b92a3;border:1px solid #2a2f3a;border-radius:999px;padding:4px 14px}
.sum{color:#a3a9b8;margin-top:8px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:28px}
.card{background:#161920;border:1px solid #232733;border-radius:12px;padding:20px 22px}
.card h3{font-size:13px;font-weight:500;color:#8b92a3;margin-bottom:12px}
.v{font-size:30px;font-weight:500;letter-spacing:-.01em}.v small{font-size:13px;color:#8b92a3;margin-left:4px;font-weight:400}
.chg{display:inline-block;margin-top:10px;font-size:12px;padding:2px 8px;border-radius:6px;background:rgba(80,200,140,.12);color:#5fd39a}
.chg.down{background:rgba(255,110,100,.12);color:#ff8a80}
.s2{grid-column:span 2}.s3{grid-column:span 3}
td,th{padding:9px 0;border-bottom:1px solid #232733;text-align:left;font-weight:400}th{color:#8b92a3;font-size:12px}
.r{text-align:right}.num{font-variant-numeric:tabular-nums}
.f{display:flex;flex-direction:column;gap:16px}.f b{font-weight:500;display:block}.f span{color:#a3a9b8}
.risk{display:flex;gap:10px;color:#f3c26b}.risk:before{content:"!";flex:none;width:18px;height:18px;border-radius:50%;background:rgba(243,194,107,.15);text-align:center;font-size:12px;line-height:18px}
`, `<div class="wrap">
<div class="top"><h1>${esc(ops.title)}</h1><span>${esc(ops.product)} · ${esc(ops.period)}</span></div>
<p class="sum">${esc(ops.summary)}</p>
<div class="grid">${k.map((x) => `<div class="card"><h3>${x.label}</h3><div class="v num">${x.value}<small>${x.unit}</small></div><span class="chg ${x.direction === "down" ? "down" : ""}">${x.change}</span></div>`).join("")}
<div class="card s3"><h3>日活跃用户（万）</h3>${line({ w: 812, h: 220, stroke: "#6aa8ff", grid: "#232733", text: "#6b7282", fill: "rgba(106,168,255,.10)" })}</div>
<div class="card"><h3>新增用户渠道</h3><div style="margin-top:20px">${bars(channels, { max: 40, color: "#6aa8ff", track: "#232733", labelW: 76, gap: 18 })}</div></div>
<div class="card s2"><h3>品类成交额（万元）</h3><table><tr><th>品类</th><th class="r">成交额</th><th class="r">环比</th><th class="r">占比</th></tr>${ops.categories.map((c) => `<tr><td>${c.name}</td><td class="r num">${num(c.gmv)}</td><td class="r num" style="color:${c.change.startsWith("−") ? "#ff8a80" : "#5fd39a"}">${c.change}</td><td class="r num">${c.share}%</td></tr>`).join("")}</table></div>
<div class="card s2"><h3>主要发现</h3><div class="f">${ops.findings.map((f) => `<div><b>${esc(f.title)}</b><span>${esc(f.detail)}</span></div>`).join("")}</div>
<h3 style="margin-top:24px">风险</h3><div class="f">${ops.risks.map((r) => `<div class="risk">${esc(r)}</div>`).join("")}</div></div>
</div></div>`),

  // Sidebar contents: the title and a numbered table of contents in a left rail, the report on the right.
  c: doc(`
body{background:#fff;color:#18181b;font-family:"Noto Sans SC",sans-serif;font-size:15px;line-height:1.7}
.wrap{width:1152px;margin:0 auto;display:grid;grid-template-columns:240px 1fr;gap:64px;padding:72px 0 96px}
aside{border-right:1px solid #e4e4e7;padding-right:32px}
aside .m{font-size:13px;color:#71717a;line-height:22px}
aside h1{font-size:26px;line-height:36px;font-weight:600;margin:12px 0 40px}
nav{display:flex;flex-direction:column;gap:12px;font-size:14px;color:#71717a}
nav span{display:grid;grid-template-columns:28px 1fr}nav .on{color:#18181b;font-weight:500}
main{display:flex;flex-direction:column;gap:64px;min-width:0}
.lead{font-size:20px;line-height:34px;font-weight:300;color:#3f3f46;max-width:720px}
.figs{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.figs b{display:block;font-size:34px;line-height:44px;font-weight:300}.figs small{font-size:13px;color:#71717a;margin-left:4px}
.figs span{display:block;font-size:13px;color:#71717a}.down{color:#dc2626!important}
h2{font-size:20px;font-weight:600;padding-bottom:12px;border-bottom:1px solid #e4e4e7;margin-bottom:24px;display:flex;gap:12px}
h2 i{font-style:normal;color:#a1a1aa;font-weight:400;font-variant-numeric:tabular-nums}
td,th{padding:9px 0;border-bottom:1px solid #f0f0f2;text-align:left;font-weight:400}th{color:#71717a;font-size:13px}
.r{text-align:right}.num{font-variant-numeric:tabular-nums}
.two{display:grid;grid-template-columns:1fr 1.4fr;gap:56px}
ol{list-style:none;display:flex;flex-direction:column;gap:20px}ol b{display:block;font-weight:600}ol span{color:#52525b}
.risk{margin-top:28px;background:#fef2f2;color:#991b1b;padding:16px 20px;border-radius:8px;font-size:14px;display:grid;gap:6px}
`, `<div class="wrap"><aside><div class="m">${esc(ops.product)}</div><div class="m">${esc(ops.period)}</div><h1>${esc(ops.title)}</h1>
<nav>${["核心指标", "日活跃用户", "渠道与品类", "发现与风险"].map((t, i) => `<span class="${i === 0 ? "on" : ""}"><span>${String(i + 1).padStart(2, "0")}</span>${t}</span>`).join("")}</nav></aside>
<main><p class="lead">${esc(ops.summary)}</p>
<div><h2><i>01</i>核心指标</h2><div class="figs">${k.map((x) => `<div><b class="num">${x.value}<small>${x.unit}</small></b><span>${x.label}</span><span class="${x.direction === "down" ? "down" : ""}">环比 ${x.change}</span></div>`).join("")}</div></div>
<div><h2><i>02</i>日活跃用户</h2>${line({ w: 848, h: 220, stroke: "#18181b", grid: "#f0f0f2", text: "#a1a1aa" })}</div>
<div><h2><i>03</i>渠道与品类</h2><div class="two"><div>${bars(channels, { max: 40, color: "#18181b", track: "#f0f0f2", h: 4, labelW: 84 })}</div>
<table><tr><th>品类</th><th class="r">成交额（万元）</th><th class="r">环比</th><th class="r">占比</th></tr>${ops.categories.map((c) => `<tr><td>${c.name}</td><td class="r num">${num(c.gmv)}</td><td class="r num" style="${c.change.startsWith("−") ? "color:#dc2626" : ""}">${c.change}</td><td class="r num">${c.share}%</td></tr>`).join("")}</table></div></div>
<div><h2><i>04</i>发现与风险</h2><ol>${ops.findings.map((f) => `<li><b>${esc(f.title)}</b><span>${esc(f.detail)}</span></li>`).join("")}</ol>
<div class="risk">${ops.risks.map((r) => `<span>${esc(r)}</span>`).join("")}</div></div>
</main></div>`),

  // Brand band: a deep green band with the title and figures, then light tinted blocks.
  d: doc(`
body{background:#fff;color:#14231f;font-family:"Noto Sans SC",sans-serif;font-size:15px;line-height:1.7}
.band{background:#0f4c44;color:#f2f7f5}
.in{width:1040px;margin:0 auto}
.band .in{padding:64px 0 56px}
.band .m{font-size:13px;color:rgba(242,247,245,.7)}
h1{font-size:44px;line-height:56px;font-weight:600;margin-top:10px}
.lead{font-size:19px;line-height:32px;font-weight:300;color:rgba(242,247,245,.85);max-width:760px;margin-top:16px}
.figs{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:48px}
.figs div{background:rgba(255,255,255,.08);border-radius:12px;padding:18px 20px}
.figs b{display:block;font-size:34px;line-height:44px;font-weight:400}.figs small{font-size:13px;opacity:.7;margin-left:4px}
.figs span{display:block;font-size:13px;opacity:.75}.figs .down{color:#ffc4a8;opacity:1}
.body{padding:72px 0 96px;display:flex;flex-direction:column;gap:64px}
h2{font-size:22px;font-weight:600;margin-bottom:20px}h2 small{font-size:13px;font-weight:400;color:#5c6f69;margin-left:12px}
.tint{background:#f1f6f4;border-radius:14px;padding:28px}
.two{display:grid;grid-template-columns:1.5fr 1fr;gap:24px}
td,th{padding:9px 0;border-bottom:1px solid #dbe6e2;text-align:left;font-weight:400}th{color:#5c6f69;font-size:13px}
.r{text-align:right}.num{font-variant-numeric:tabular-nums}
.three{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.three b{display:block;font-weight:600;margin-top:8px}.three i{font-style:normal;font-size:13px;color:#0f4c44;font-weight:600}.three span{color:#3d514b}
.risk{display:flex;gap:12px;align-items:baseline}.risk em{font-style:normal;font-size:12px;background:#fde7d9;color:#b4501d;border-radius:6px;padding:1px 8px;flex:none}
`, `<div class="band"><div class="in"><div class="m">${esc(ops.product)} · ${esc(ops.period)}</div><h1>${esc(ops.title)}</h1><p class="lead">${esc(ops.summary)}</p>
<div class="figs">${k.map((x) => `<div><b class="num">${x.value}<small>${x.unit}</small></b><span>${x.label}</span><span class="${x.direction === "down" ? "down" : ""}">环比 ${x.change}</span></div>`).join("")}</div></div></div>
<div class="in body">
<div><h2>日活跃用户<small>单位：万</small></h2><div class="tint">${line({ w: 984, h: 220, stroke: "#0f4c44", grid: "#dbe6e2", text: "#7b8d87", fill: "rgba(15,76,68,.08)" })}</div></div>
<div class="two"><div><h2>品类成交额<small>万元</small></h2><table><tr><th>品类</th><th class="r">成交额</th><th class="r">环比</th><th class="r">占比</th></tr>${ops.categories.map((c) => `<tr><td>${c.name}</td><td class="r num">${num(c.gmv)}</td><td class="r num" style="${c.change.startsWith("−") ? "color:#b4501d" : ""}">${c.change}</td><td class="r num">${c.share}%</td></tr>`).join("")}</table></div>
<div><h2>新增用户渠道</h2><div class="tint">${bars(channels, { max: 40, color: "#0f4c44", track: "#dbe6e2", gap: 18, labelW: 84 })}</div></div></div>
<div><h2>本月发现</h2><div class="three">${ops.findings.map((f, i) => `<div class="tint"><i>发现 ${i + 1}</i><b>${esc(f.title)}</b><span>${esc(f.detail)}</span></div>`).join("")}</div>
<div style="display:grid;gap:10px;margin-top:28px">${ops.risks.map((r) => `<div class="risk"><em>风险</em>${esc(r)}</div>`).join("")}</div></div>
</div>`),

  // Dense terminal: small type, monospace figures, hairline panels, the whole report in about one screen.
  e: doc(`
body{background:#fbfbfa;color:#111;font-family:"Noto Sans SC",sans-serif;font-size:12.5px;line-height:1.55}
.num,.mono{font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums}
.wrap{width:1152px;margin:0 auto;padding:32px 0 48px}
.top{display:flex;align-items:baseline;gap:16px;border-bottom:2px solid #111;padding-bottom:8px}
h1{font-size:18px;font-weight:600}.top span{color:#6b6b6b}.top .mono{margin-left:auto}
.sum{padding:10px 0;border-bottom:1px solid #d9d9d6;color:#333}
.g{display:grid;grid-template-columns:repeat(4,1fr);border-left:1px solid #d9d9d6}
.p{border-right:1px solid #d9d9d6;border-bottom:1px solid #d9d9d6;padding:10px 12px}
.p h3{font-size:11px;font-weight:500;color:#6b6b6b;letter-spacing:.06em;margin-bottom:6px}
.v{font-size:26px;line-height:32px}.v small{font-size:12px;color:#6b6b6b;margin-left:4px}
.up{color:#0a7a3e}.dn{color:#c0261b}
.s2{grid-column:span 2}.s3{grid-column:span 3}
td,th{padding:4px 0;border-bottom:1px solid #ececea;text-align:left;font-weight:400}th{color:#6b6b6b;font-size:11px}
.r{text-align:right}
.f div{padding:6px 0;border-bottom:1px solid #ececea}.f b{font-weight:600;margin-right:8px}
`, `<div class="wrap">
<div class="top"><h1>${esc(ops.title)}</h1><span>${esc(ops.product)}</span><span class="mono">2026-09-01 — 2026-09-30</span></div>
<div class="sum">${esc(ops.summary)}</div>
<div class="g">${k.map((x) => `<div class="p"><h3>${x.label}</h3><div class="v num">${x.value}<small>${x.unit}</small></div><div class="num ${x.direction === "down" ? "dn" : "up"}">${x.change}</div></div>`).join("")}
<div class="p s3"><h3>日活跃用户（万）</h3>${line({ w: 836, h: 170, stroke: "#111", grid: "#ececea", text: "#8a8a8a", font: "'IBM Plex Mono',monospace", size: 11, pad: [12, 40, 20, 32] })}</div>
<div class="p"><h3>新增用户渠道</h3><div style="margin-top:8px">${bars(channels, { max: 40, color: "#111", track: "#ececea", h: 8, gap: 8, labelW: 64, radius: 0 })}</div></div>
<div class="p s2"><h3>品类成交额（万元）</h3><table><tr><th>品类</th><th class="r">成交额</th><th class="r">环比</th><th class="r">占比</th></tr>${ops.categories.map((c) => `<tr><td>${c.name}</td><td class="r num">${num(c.gmv)}</td><td class="r num ${c.change.startsWith("−") ? "dn" : "up"}">${c.change}</td><td class="r num">${c.share}</td></tr>`).join("")}</table></div>
<div class="p s2"><h3>发现</h3><div class="f">${ops.findings.map((f, i) => `<div><span class="mono">${i + 1}. </span><b>${esc(f.title)}</b>${esc(f.detail)}</div>`).join("")}</div>
<h3 style="margin-top:10px">风险</h3><div class="f">${ops.risks.map((r) => `<div class="dn">${esc(r)}</div>`).join("")}</div></div>
</div></div>`),
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
for (const [v, html] of Object.entries(PAGES)) {
  const dir = path.join(OUT, `style-${v}`)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, "page.html"), html)
  await page.goto(`file://${path.join(dir, "page.html")}`)
  await page.evaluate(() => document.fonts.ready)
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  await page.screenshot({ path: path.join(dir, "shot.png"), clip: { x: 96, y: 0, width: 1248, height }, fullPage: true })
  console.log(`style-${v}`, height)
}
await browser.close()
