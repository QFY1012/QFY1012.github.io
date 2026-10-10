// 第三季度销售复盘 in five styles: consulting report, newspaper, gradient glass, minimal big numbers, cluttered BI.
import { readData, doc, esc, num, bars, line } from "../style-kit.mjs"

const s = readData("sales")
const K = Object.fromEntries(s.kpis.map((k) => [k.key, k]))
const R = s.regions
const P = s.products
const W = s.weekly
const isNeg = (c) => c.startsWith("−")
const val = (c) => parseFloat(c.replace("−", "-").replace("+", ""))
const totalTarget = R.reduce((a, r) => a + r.target, 0) // 29,700
const totalRev = R.reduce((a, r) => a + r.revenue, 0) // 28,600
const gapOf = (r) => r.target - r.revenue
const kv = (k) => `${k.value}`
// findings paired with the action that answers each
const pairs = [[s.findings[0], s.actions[2]], [s.findings[1], s.actions[0]], [s.findings[2], s.actions[1]]]
const weekPts = (label) => W.map((w) => ({ x: label(w.week), y: w.revenue }))
// add <defs> to an svg from the kit
const withDefs = (svg, defs) => svg.replace(/(<svg[^>]*>)/, `$1<defs>${defs}</defs>`)

// ---------- e helpers: SVG charts drawn to a viewBox, scaled to the widget width ----------
function combo({ w = 650, h = 240 }) {
  const [t, r, b, l] = [18, 54, 28, 46]
  const B = h - b, n = W.length, slot = (w - l - r) / n
  const y1 = (v) => B - (v / 2500) * (B - t)
  const y2 = (v) => B - (v / 30000) * (B - t)
  let cum = 0
  const cums = W.map((x) => (cum += x.revenue))
  const cx = (i) => l + slot * (i + 0.5)
  const grid = [0, 500, 1000, 1500, 2000, 2500].map((v, i) => `<line x1="${l}" x2="${w - r}" y1="${y1(v)}" y2="${y1(v)}" stroke="#e3e7ec"/><text x="${l - 6}" y="${y1(v) + 3.5}" text-anchor="end">${num(v)}</text><text x="${w - r + 6}" y="${y1(v) + 3.5}" fill="#e65100">${num(i * 6000)}</text>`).join("")
  const barsSvg = W.map((x, i) => `<rect x="${cx(i) - slot * 0.32}" y="${y1(x.revenue)}" width="${slot * 0.64}" height="${B - y1(x.revenue)}" fill="#26a69a"/>`).join("")
  const lbl = W.map((x, i) => `<text x="${cx(i)}" y="${h - 9}" text-anchor="middle">第${x.week}周</text>`).join("")
  const ln = `<polyline points="${cums.map((v, i) => `${cx(i)},${y2(v)}`).join(" ")}" fill="none" stroke="#ff6f00" stroke-width="2"/>` + cums.map((v, i) => `<circle cx="${cx(i)}" cy="${y2(v)}" r="3" fill="#fff" stroke="#ff6f00" stroke-width="1.5"/>`).join("")
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block;font-size:10px;fill:#66707c">${grid}${barsSvg}${ln}${lbl}<line x1="${l}" x2="${w - r}" y1="${B}" y2="${B}" stroke="#9aa4b0"/></svg>`
}
function grouped({ w = 460, h = 240 }) {
  const [t, r, b, l] = [14, 10, 28, 46]
  const B = h - b, slot = (w - l - r) / R.length
  const y = (v) => B - (v / 10000) * (B - t)
  const grid = [0, 2000, 4000, 6000, 8000, 10000].map((v) => `<line x1="${l}" x2="${w - r}" y1="${y(v)}" y2="${y(v)}" stroke="#e3e7ec"/><text x="${l - 6}" y="${y(v) + 3.5}" text-anchor="end">${num(v)}</text>`).join("")
  const bs = R.map((x, i) => {
    const c = l + slot * (i + 0.5)
    return `<rect x="${c - 23}" y="${y(x.revenue)}" width="22" height="${B - y(x.revenue)}" fill="#3f51b5"/><rect x="${c + 1}" y="${y(x.target)}" width="22" height="${B - y(x.target)}" fill="#ffb300"/><text x="${c}" y="${h - 9}" text-anchor="middle">${x.name}</text>`
  }).join("")
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block;font-size:10px;fill:#66707c">${grid}${bs}<line x1="${l}" x2="${w - r}" y1="${B}" y2="${B}" stroke="#9aa4b0"/></svg>`
}
function diverging({ w = 265, h = 176 }) {
  const lo = -12, hi = 20, x0 = 40, x1 = w - 6
  const x = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0)
  const rowH = (h - 24) / R.length
  const rows = R.map((r, i) => {
    const v = val(r.change), yy = 6 + i * rowH, bh = 14, cy = yy + rowH / 2
    const a = Math.min(x(0), x(v)), bw = Math.abs(x(v) - x(0))
    const lab = v >= 0 ? `<text x="${x(v) + 4}" y="${cy + 3.5}">${r.change}</text>` : `<text x="${x(v) - 4}" y="${cy + 3.5}" text-anchor="end">${r.change}</text>`
    return `<text x="2" y="${cy + 3.5}" fill="#37414d">${r.name}</text><rect x="${a}" y="${cy - bh / 2}" width="${bw}" height="${bh}" fill="${v >= 0 ? "#43a047" : "#e53935"}"/>${lab}`
  }).join("")
  const axis = [-10, 0, 10, 20].map((v) => `<line x1="${x(v)}" x2="${x(v)}" y1="4" y2="${h - 18}" stroke="${v === 0 ? "#9aa4b0" : "#eceff3"}"/><text x="${x(v)}" y="${h - 4}" text-anchor="middle">${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}%</text>`).join("")
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block;font-size:10px;fill:#66707c">${axis}${rows}</svg>`
}
function gauge(v) {
  const L = Math.PI * 90
  return `<svg viewBox="0 0 240 146" width="100%" style="display:block;max-width:240px;margin:0 auto;font-size:11px;fill:#66707c">
<path d="M30 120 A90 90 0 0 1 210 120" fill="none" stroke="#eceff3" stroke-width="22"/>
<path d="M30 120 A90 90 0 0 1 210 120" fill="none" stroke="#8e24aa" stroke-width="22" stroke-dasharray="${(L * v) / 100} 999"/>
<text x="120" y="108" text-anchor="middle" style="font-size:28px;font-weight:600;fill:#4a148c">${v}%</text>
<text x="120" y="132" text-anchor="middle">目标 ${num(totalTarget)} 万元</text>
<text x="30" y="140" text-anchor="middle">0%</text><text x="210" y="140" text-anchor="middle">100%</text></svg>`
}
const pieColors = ["#1e88e5", "#43a047", "#fb8c00", "#e53935", "#8e24aa"]
const conic = (colors) => {
  let a = 0
  return `conic-gradient(${P.map((p, i) => { const s0 = a; a += p.share; return `${colors[i]} ${s0}% ${a}%` }).join(",")})`
}

export default {
  // ---------------------------------------------------------------- a 咨询报告风
  a: doc(`
body{background:#fff;color:#1d2733;font-family:"Noto Sans SC",sans-serif;font-size:15px;line-height:1.7}
.num{font-variant-numeric:tabular-nums}
.wrap{width:1080px;margin:0 auto;padding:64px 0 88px}
.top{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;color:#5a6878;padding-bottom:12px;border-bottom:4px solid #0b2a4a}
.top b{color:#0b2a4a;font-weight:600;letter-spacing:.1em}
h1{font-size:40px;line-height:52px;font-weight:600;color:#0b2a4a;margin-top:36px}
.period{font-size:16px;color:#5a6878;margin-top:6px}
.exec{display:grid;grid-template-columns:168px 1fr;gap:32px;margin-top:40px;padding:26px 0 28px;border-top:1px solid #0b2a4a;border-bottom:1px solid #cfd6df}
.exec h2{font-size:15px;color:#0b2a4a;font-weight:600;line-height:28px}
.exec ol{list-style:none;display:grid;gap:10px}
.exec li{display:grid;grid-template-columns:30px 1fr;font-size:17px;line-height:28px}
.exec li i{font-style:normal;color:#2f6db5;font-weight:600;font-family:"IBM Plex Mono",monospace}
section{margin-top:72px}
.no{font-size:12px;letter-spacing:.14em;color:#2f6db5;font-weight:600}
h2.t{font-size:26px;line-height:38px;font-weight:600;color:#0b2a4a;margin-top:6px}
.ex{margin-top:22px;border-top:1px solid #0b2a4a;padding-top:12px}
.exh{display:flex;justify-content:space-between;align-items:baseline;font-size:14px;margin-bottom:20px}
.exh b{color:#0b2a4a;font-weight:600}.exh span{color:#5a6878;font-size:13px}
.src{margin-top:18px;padding-top:10px;border-top:1px solid #e3e8ee;font-size:12px;line-height:20px;color:#7a8696}
.kpis{display:grid;grid-template-columns:repeat(4,1fr)}
.kpis div{padding:4px 24px 6px}.kpis div:first-child{padding-left:0}.kpis div+div{border-left:1px solid #dfe4ea}
.kpis span{display:block;font-size:14px;color:#5a6878}
.kpis b{display:block;font-size:40px;line-height:52px;font-weight:500;color:#0b2a4a;margin-top:4px}
.kpis small{font-size:15px;font-weight:400;color:#5a6878;margin-left:4px}
.kpis em{font-style:normal;font-size:14px;color:#1f6f43}.kpis em.bad{color:#b42318}
.wk{display:grid;grid-template-columns:1fr 248px;gap:40px;align-items:start}
.side{border-left:3px solid #0b2a4a;padding-left:20px;display:grid;gap:18px}
.side span{display:block;font-size:13px;color:#5a6878}.side b{font-size:24px;font-weight:500;color:#0b2a4a}.side small{font-size:13px;color:#5a6878;margin-left:4px}
.rg>div{display:grid;grid-template-columns:64px 88px 88px 88px 72px 1fr 72px;column-gap:20px;align-items:center;padding:11px 0;border-bottom:1px solid #e6eaef}
.rg>.h{font-size:13px;color:#5a6878;border-bottom:1px solid #0b2a4a;padding:0 0 8px}
.r{text-align:right}
.track{position:relative;height:16px}
.track i{position:absolute;left:0;top:0;bottom:0;background:#b8c5d4}.track i.hl{background:#0b2a4a}
.track u{position:absolute;top:-6px;bottom:-6px;border-left:1px dashed #5a6878}
.focus{color:#0b2a4a;font-weight:600}.bad{color:#b42318}
.stack{display:flex;gap:2px}
.stack>div{min-width:0}
.stack .seg{height:44px;color:#fff;font-size:14px;font-weight:500;display:flex;align-items:center;padding-left:10px}
.stack .nm{font-size:13px;color:#3e4c5e;margin-top:8px;white-space:nowrap}
.pt{margin-top:28px}.pt td,.pt th{padding:9px 0;border-bottom:1px solid #e6eaef;text-align:left;font-weight:400}.pt th{font-size:13px;color:#5a6878;border-bottom:1px solid #0b2a4a}
.pt td.r,.pt th.r{text-align:right}
.fa{display:grid;grid-template-columns:1fr 40px 1fr}
.fa>div{padding:16px 0;border-bottom:1px solid #e6eaef}
.fa .h{font-size:13px;color:#5a6878;border-bottom:1px solid #0b2a4a;padding:0 0 8px}
.fa b{display:block;font-weight:600;color:#0b2a4a}.fa p{color:#3e4c5e;font-size:14px;margin-top:2px}
.fa .ar{color:#2f6db5;text-align:center;font-size:18px;padding-top:15px}
.foot{margin-top:72px;padding-top:12px;border-top:1px solid #cfd6df;display:flex;justify-content:space-between;font-size:12px;color:#7a8696}
`, `<div class="wrap">
<div class="top"><b>季度经营复盘</b><span>${esc(s.org)}　|　${esc(s.period)}</span></div>
<h1>${esc(s.title)}</h1><p class="period">收入增长稳健，缺口集中在两个区域，老客户流失需要尽快止住</p>
<div class="exec"><h2>核心结论</h2><ol>
<li><i>1</i><span>三季度收入 2.86 亿元，同比增长 9.4%，增量主要来自企业版订阅和新签客户。</span></li>
<li><i>2</i><span>目标完成率 96.3%，缺口主要来自南京、合肥两区，两区合计少完成 1,580 万元。</span></li>
<li><i>3</i><span>客户流失率升至 3.1%，集中在签约不满一年的专业版中小企业，需在续约前介入。</span></li></ol></div>

<section><div class="no">01　整体表现</div><h2 class="t">收入同比增长 9.4%，目标完成率却下降 3.7 个百分点</h2>
<div class="ex"><div class="exh"><b>图 1　三季度核心经营指标</b><span>2026 年 7 月至 9 月</span></div>
<div class="kpis">${s.kpis.map((k) => `<div><span>${k.label}</span><b class="num">${kv(k)}<small>${k.unit}</small></b><em class="${k.direction === "down" ? "bad" : ""}">${k.direction === "up" ? "▲" : "▼"} ${k.change}</em></div>`).join("")}</div>
<div class="src">资料来源：${esc(s.org)}，${esc(s.period)}。注：▼ 表示指标向不利方向变化。</div></div></section>

<section><div class="no">02　收入走势</div><h2 class="t">周收入稳步走高，季末稳定在 2,300 万元上下</h2>
<div class="ex"><div class="exh"><b>图 2　每周收入</b><span>单位：万元</span></div>
<div class="wk">${line({ w: 792, h: 260, points: weekPts((w) => `第 ${w} 周`), ticks: [2000, 2100, 2200, 2300, 2400], stroke: "#0b2a4a", grid: "#e6eaef", text: "#7a8696", fill: "rgba(11,42,74,.06)", size: 12, pad: [16, 24, 26, 44], dots: true, last: "2,280", width: 2 })}
<div class="side"><div><span>第 1 周</span><b class="num">2,050</b><small>万元</small></div><div><span>季度高点（第 11 周）</span><b class="num">2,310</b><small>万元</small></div><div><span>第 13 周较第 1 周</span><b class="num">+11.2%</b></div><div><span>13 周合计</span><b class="num">28,600</b><small>万元</small></div></div></div>
<div class="src">资料来源：${esc(s.org)}。注：13 周收入合计与季度收入 2.86 亿元一致。</div></div></section>

<section><div class="no">03　区域</div><h2 class="t">合肥、南京两区拖累整体完成率</h2>
<div class="ex"><div class="exh"><b>图 3　各区域收入、目标与完成率</b><span>单位：万元</span></div>
<div class="rg"><div class="h"><span>区域</span><span class="r">收入</span><span class="r">目标</span><span class="r">缺口</span><span class="r">完成率</span><span>完成率（虚线为 100%）</span><span class="r">同比</span></div>
${R.map((r) => { const hl = r.attain < 95; return `<div><span class="${hl ? "focus" : ""}">${r.name}</span><span class="r num">${num(r.revenue)}</span><span class="r num">${num(r.target)}</span><span class="r num ${hl ? "focus" : ""}">${gapOf(r) > 0 ? num(gapOf(r)) : "—"}</span><span class="r num ${hl ? "focus" : ""}">${r.attain.toFixed(1)}%</span><div class="track"><i class="${hl ? "hl" : ""}" style="width:${(r.attain / 110) * 100}%"></i><u style="left:${(100 / 110) * 100}%"></u></div><span class="r num ${isNeg(r.change) ? "bad" : ""}">${r.change}</span></div>` }).join("")}</div>
<div class="src">注：完成率 = 收入 ÷ 目标；缺口 = 目标 − 收入。南京、合肥合计缺口 1,580 万元，相当于部门季度目标 ${num(totalTarget)} 万元的 5.3%。</div></div></section>

<section><div class="no">04　产品</div><h2 class="t">企业版订阅贡献 43.6% 的收入，增速领先其他产品</h2>
<div class="ex"><div class="exh"><b>图 4　各产品收入构成</b><span>占季度收入比例</span></div>
<div class="stack">${P.map((p, i) => `<div style="width:${p.share}%"><div class="seg num" style="background:${["#0b2a4a", "#2f5f8f", "#6f93b8", "#a9bfd6", "#cfdbe8"][i]};${i > 2 ? "color:#0b2a4a" : ""}">${p.share}%</div><div class="nm">${p.name}</div></div>`).join("")}</div>
<table class="pt"><tr><th>产品</th><th class="r">收入（万元）</th><th class="r">占比</th><th class="r">同比</th></tr>${P.map((p) => `<tr><td>${p.name}</td><td class="r num">${num(p.revenue)}</td><td class="r num">${p.share}%</td><td class="r num ${isNeg(p.change) ? "bad" : ""}">${p.change}</td></tr>`).join("")}</table>
<div class="src">资料来源：${esc(s.org)}。注：企业版贡献了本季度收入增量的六成，主要来自制造业客户。</div></div></section>

<section><div class="no">05　下一步</div><h2 class="t">下一步：补齐合肥团队、提前回访续约、复制企业版经验</h2>
<div class="ex"><div class="exh"><b>图 5　主要发现与对应举措</b><span>按发现排序</span></div>
<div class="fa"><div class="h">发现</div><div class="h"></div><div class="h">举措</div>
${pairs.map(([f, a]) => `<div><b>${esc(f.title)}</b><p>${esc(f.detail)}</p></div><div class="ar">→</div><div><b>${esc(a.title)}</b><p>${esc(a.detail)}</p></div>`).join("")}</div>
<div class="src">资料来源：${esc(s.org)}季度复盘。</div></div></section>
<div class="foot"><span>${esc(s.org)}　·　${esc(s.title)}</span><span>${esc(s.period)}</span></div>
</div>`),

  // ---------------------------------------------------------------- b 报纸版式
  b: doc(`
body{background:#f2eee4;color:#1b1a17;font-family:"Noto Serif SC",serif;font-size:14.5px;line-height:1.85}
.sans{font-family:"Noto Sans SC",sans-serif}
.num{font-variant-numeric:tabular-nums}
.wrap{width:1152px;margin:0 auto;padding:36px 0 56px}
.ear{display:flex;justify-content:space-between;font-family:"Noto Sans SC",sans-serif;font-size:12px;letter-spacing:.12em;color:#4a463e;padding-bottom:8px;border-bottom:1px solid #1b1a17}
.mast{text-align:center;font-weight:600;font-size:88px;line-height:1.2;letter-spacing:.14em;padding:20px 0 16px;margin-right:-.14em}
.dbl{height:6px;border-top:3px solid #1b1a17;border-bottom:1px solid #1b1a17}
.strip{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #1b1a17}
.strip div{padding:7px 14px;font-family:"Noto Sans SC",sans-serif;font-size:13px;display:flex;justify-content:space-between;align-items:baseline}
.strip div+div{border-left:1px solid #b9b2a2}
.strip b{font-family:"Noto Serif SC",serif;font-size:17px;font-weight:600}
.strip em{font-style:normal;font-size:12px;color:#4a463e}
.main{display:grid;grid-template-columns:856px 1fr;column-gap:16px;margin-top:22px}
.kick{font-family:"Noto Sans SC",sans-serif;font-size:12px;letter-spacing:.16em;color:#8a2a1c;font-weight:600}
.hl{font-size:40px;line-height:1.3;font-weight:600;margin-top:6px;text-wrap:balance}
.deck{font-family:"Noto Sans SC",sans-serif;font-size:16.5px;line-height:1.7;color:#3b382f;margin-top:10px;padding-bottom:12px;border-bottom:1px solid #b9b2a2}
.by{font-family:"Noto Sans SC",sans-serif;font-size:12px;color:#6b665a;margin:10px 0 12px}
.cols{column-count:3;column-gap:32px;column-rule:1px solid #c9c2b2;text-align:justify}
.cols p{text-indent:2em;margin-bottom:6px}
.cols p.dc{text-indent:0}
.cols p.dc::first-letter{float:left;font-size:58px;line-height:1;font-weight:600;padding:5px 8px 0 0}
.cols h4{font-family:"Noto Sans SC",sans-serif;font-size:14.5px;font-weight:600;margin:12px 0 4px;break-after:avoid}
figure{break-inside:avoid;border-top:2px solid #1b1a17;border-bottom:1px solid #1b1a17;padding:6px 0 4px;margin:10px 0 12px}
figcaption{font-family:"Noto Sans SC",sans-serif;font-size:12px;line-height:1.5;color:#4a463e}
figcaption b{color:#1b1a17;font-weight:600}
aside{border-left:1px solid #1b1a17;padding-left:16px}
aside h3,.sec h3{font-family:"Noto Sans SC",sans-serif;font-size:12px;letter-spacing:.16em;font-weight:600;border-bottom:2px solid #1b1a17;padding-bottom:4px}
.fig{padding:10px 0;border-bottom:1px solid #c9c2b2}
.fig b{font-size:34px;line-height:1.15;font-weight:600}.fig small{font-size:14px;margin-left:3px}
.fig span{display:block;font-family:"Noto Sans SC",sans-serif;font-size:12.5px;line-height:1.6;color:#4a463e}
.dn{color:#8a2a1c}
.pts{list-style:none}.pts li{padding:9px 0;border-bottom:1px solid #c9c2b2;font-size:13.5px;line-height:1.7;text-align:justify}
.pts li b{font-family:"Noto Sans SC",sans-serif;font-weight:600;display:block}
.sec{display:grid;grid-template-columns:2fr 1fr 1fr;padding-top:14px}
.sec>div{padding:0 16px}.sec>div:first-child{padding-left:0}.sec>div:last-child{padding-right:0}.sec>div+div{border-left:1px solid #c9c2b2}
.sec h2{font-size:22px;line-height:1.4;font-weight:600;margin:10px 0 8px;text-wrap:balance}
.sec p{text-align:justify;text-indent:2em}
table{margin-top:10px;font-family:"Noto Sans SC",sans-serif;font-size:13px}
td,th{padding:5px 0;border-bottom:1px solid #c9c2b2;text-align:right;font-weight:400}
th{font-size:12px;color:#4a463e;border-bottom:1px solid #1b1a17}
td:first-child,th:first-child{text-align:left}
.sm{font-family:"Noto Sans SC",sans-serif;font-size:12.5px;margin-top:12px}
ol.act{list-style:none;counter-reset:a}ol.act li{counter-increment:a;padding:8px 0;border-bottom:1px solid #c9c2b2;text-align:justify}
ol.act li:before{content:counter(a);font-family:"Noto Sans SC",sans-serif;font-weight:600;font-size:12px;border:1px solid #1b1a17;border-radius:50%;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;margin-right:6px;vertical-align:1px}
ol.act b{font-family:"Noto Sans SC",sans-serif;font-weight:600}
.foot{margin-top:22px;border-top:1px solid #1b1a17;padding-top:6px;display:flex;justify-content:space-between;font-family:"Noto Sans SC",sans-serif;font-size:11.5px;color:#4a463e}
`, `<div class="wrap">
<div class="ear"><span>${esc(s.org)}</span><span>${esc(s.period)}</span><span>季度复盘特刊</span></div>
<div class="mast">${esc(s.title)}</div>
<div class="dbl"></div><div class="strip">${s.kpis.map((k) => `<div><span>${k.label}</span><span><b class="num">${k.value}</b> ${k.unit}　<em class="${k.direction === "down" ? "dn" : ""}">${k.change}</em></span></div>`).join("")}</div>
<div class="main"><div>
<div class="kick">头条　季度综述</div>
<div class="hl">企业版拉动收入增长 9.4%，南京、合肥两区未能达标</div>
<div class="deck">${esc(s.summary)}</div>
<div class="by">本报讯　${esc(s.org)}　${esc(s.period)}</div>
<div class="cols">
<p class="dc">三季度，${esc(s.org)}实现收入 2.86 亿元，同比增长 9.4%，目标完成率 96.3%。十三周里，周收入从第 1 周的 2,050 万元一路走高，第 11 周达到 2,310 万元的季度高点，此后稳定在 2,300 万元上下。</p>
<figure>${line({ w: 264, h: 132, points: weekPts((w) => `${w}`), ticks: [2000, 2200, 2400], xEvery: 3, stroke: "#1b1a17", grid: "#d4cdbd", text: "#6b665a", size: 10, pad: [10, 8, 18, 30], width: 1.5, last: "2,280", font: "'Noto Sans SC',sans-serif" })}<figcaption><b>周收入走势</b>　第 1 至第 13 周，单位：万元。</figcaption></figure>
<h4>企业版成主力</h4>
<p>增长主要来自企业版。企业版订阅本季收入 12,480 万元，占全部收入的 43.6%，同比增长 14.2%，贡献了本季度增量的六成，新增收入主要来自制造业客户。</p>
<p>其余产品增长平缓：专业版订阅收入 7,350 万元，增长 6.1%；实施服务收入 4,920 万元，增长 3.5%；培训收入 2,210 万元，同比下降 2.8%。</p>
<h4>区域冷热不均</h4>
<p>六个区域中，上海、杭州、苏州均超额完成目标，完成率分别为 103.7%、102.3% 和 101.5%。宁波完成 98.1%，距目标仅差 50 万元。</p>
<p>南京完成 88.0%，合肥仅完成 66.5%，收入同比下降 6.3%，两区合计缺口 1,580 万元。合肥有两名大客户经理离职，客户跟进一度中断。</p>
<h4>新客多，老客走</h4>
<p>本季新签客户 412 家，同比增长 18.0%。但客户流失率升至 3.1%，上升 0.6 个百分点，流失客户集中在专业版、签约不满一年的中小企业。</p>
</div></div>
<aside><h3>本季数字</h3>
${s.kpis.map((k) => `<div class="fig"><b class="num">${k.value}</b><small>${k.unit}</small><span>${k.label}　<em class="${k.direction === "down" ? "dn" : ""}" style="font-style:normal">${k.change}</em></span></div>`).join("")}
<h3 style="margin-top:18px">三个要点</h3><ul class="pts">${s.findings.map((f) => `<li><b>${esc(f.title)}</b>${esc(f.detail)}</li>`).join("")}</ul></aside>
</div>
<div class="dbl" style="margin-top:24px"></div><div class="sec">
<div><h3>区域</h3><h2>上海、杭州、苏州超额完成，合肥收入同比下降 6.3%</h2>
<p>六个区域合计目标 ${num(totalTarget)} 万元，实际完成 ${num(totalRev)} 万元。宁波以 50 万元之差未达标，南京、合肥缺口最大。</p>
<table><tr><th>区域</th><th>收入（万元）</th><th>目标（万元）</th><th>缺口（万元）</th><th>完成率</th><th>同比</th></tr>${R.map((r) => `<tr><td>${r.name}</td><td class="num">${num(r.revenue)}</td><td class="num">${num(r.target)}</td><td class="num">${gapOf(r) > 0 ? num(gapOf(r)) : "—"}</td><td class="num ${r.attain < 95 ? "dn" : ""}">${r.attain.toFixed(1)}%</td><td class="num ${isNeg(r.change) ? "dn" : ""}">${r.change}</td></tr>`).join("")}</table></div>
<div><h3>产品</h3><h2>企业版订阅占收入四成以上</h2>
<p>五类产品中，企业版增速最快，培训是唯一下滑的产品。</p>
<div class="sm">${bars(P.map((p) => ({ label: p.name, value: p.share, display: `${p.share}%` })), { max: 50, color: "#1b1a17", track: "#ddd6c6", labelW: 64, valueW: 40, h: 7, gap: 9, radius: 0 })}</div>
<figcaption style="margin-top:8px">各产品占季度收入比例。</figcaption></div>
<div><h3>下一步</h3><h2>补人、回访、复制方案</h2>
<ol class="act">${s.actions.map((a) => `<li><b>${esc(a.title)}</b>　${esc(a.detail)}</li>`).join("")}</ol></div>
</div>
<div class="foot"><span>数据：${esc(s.org)}　·　金额单位为万元，另注明者除外</span><span>${esc(s.title)}　·　${esc(s.period)}</span></div>
</div>`),

  // ---------------------------------------------------------------- c 渐变玻璃拟态
  c: doc(`
body{color:#fff;font-family:"Noto Sans SC",sans-serif;font-size:15px;line-height:1.65;background:linear-gradient(135deg,#3a0e8a 0%,#5b34e6 36%,#3f62f0 66%,#1d9fe6 100%);position:relative}
.bg{position:absolute;inset:0;overflow:hidden;z-index:0}
.bg i{position:absolute;border-radius:50%;filter:blur(90px)}
.wrap{position:relative;z-index:1;width:1152px;margin:0 auto;padding:56px 0 72px}
.glass{position:relative;overflow:hidden;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.26);border-radius:20px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 12px 40px rgba(30,10,100,.32),inset 0 1px 0 rgba(255,255,255,.3);padding:24px 26px}
.num{font-variant-numeric:tabular-nums}
.pill{display:inline-flex;gap:10px;align-items:center;font-size:13px;padding:6px 16px;border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);color:rgba(255,255,255,.85)}
.pill i{width:8px;height:8px;border-radius:50%;background:#7cf7d4;box-shadow:0 0 10px #7cf7d4}
h1{font-size:48px;line-height:62px;font-weight:600;margin-top:18px;letter-spacing:.02em;text-shadow:0 4px 24px rgba(20,0,80,.35)}
.lead{font-size:16px;line-height:28px;color:rgba(255,255,255,.72);max-width:780px;margin-top:10px;font-weight:300}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:40px}
.kpi::after{content:"";position:absolute;right:-40px;top:-40px;width:140px;height:140px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.32),rgba(255,255,255,0) 70%)}
.kpi span{font-size:14px;color:rgba(255,255,255,.7)}
.kpi b{display:block;font-size:42px;line-height:54px;font-weight:600;margin-top:8px}
.kpi small{font-size:15px;font-weight:400;margin-left:4px;color:rgba(255,255,255,.75)}
.chip{display:inline-block;margin-top:10px;font-size:12.5px;padding:3px 12px;border-radius:999px;background:rgba(110,255,190,.18);color:#c6ffe4;border:1px solid rgba(110,255,190,.3)}
.chip.dn{background:rgba(255,120,160,.2);color:#ffd2df;border-color:rgba(255,120,160,.35)}
.row{display:grid;gap:24px;margin-top:24px}
.r21{grid-template-columns:2fr 1fr}.r11{grid-template-columns:1fr 1fr}.r3{grid-template-columns:repeat(3,1fr)}
h2{font-size:18px;font-weight:600;display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px}
h2 small{font-size:12.5px;font-weight:400;color:rgba(255,255,255,.6)}
.donut{position:relative;width:184px;height:184px;margin:6px auto 0}
.donut .ring{position:absolute;inset:0;border-radius:50%;-webkit-mask:radial-gradient(circle,transparent 56%,#000 57%);mask:radial-gradient(circle,transparent 56%,#000 57%);box-shadow:0 0 30px rgba(255,255,255,.25)}
.donut .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.donut .c b{font-size:26px;font-weight:600;line-height:32px}.donut .c span{font-size:12px;color:rgba(255,255,255,.65)}
.leg{display:grid;gap:7px;margin-top:20px;font-size:13.5px}
.leg div{display:grid;grid-template-columns:14px 1fr 52px 56px;align-items:center;gap:8px}
.leg i{width:10px;height:10px;border-radius:50%}
.leg .s{text-align:right;color:rgba(255,255,255,.6);font-size:12.5px}
.rg{display:grid;gap:16px}
.rg div.it{display:grid;grid-template-columns:40px 1fr 60px 64px;align-items:center;gap:14px;font-size:14px}
.tr{position:relative;height:10px;border-radius:999px;background:rgba(255,255,255,.14)}
.tr i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#9ee7ff,#e7a8ff);box-shadow:0 0 12px rgba(200,180,255,.7)}
.tr i.lo{background:linear-gradient(90deg,#ffb38a,#ff7eb3);box-shadow:0 0 12px rgba(255,140,180,.7)}
.tr u{position:absolute;top:-4px;bottom:-4px;border-left:1.5px solid rgba(255,255,255,.7)}
.rg .p{text-align:right;font-weight:500}.rg .c{text-align:right;font-size:12.5px;color:rgba(255,255,255,.65)}
.note{font-size:12.5px;color:rgba(255,255,255,.6);margin-top:16px}
.fd{display:grid;gap:18px}
.fd div{display:grid;grid-template-columns:40px 1fr;gap:14px}
.fd em{font-style:normal;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:600;background:linear-gradient(135deg,rgba(255,255,255,.4),rgba(255,255,255,.08));border:1px solid rgba(255,255,255,.35)}
.fd b{display:block;font-weight:600}.fd span{font-size:14px;color:rgba(255,255,255,.68)}
.act b.n{display:block;font-size:44px;line-height:52px;font-weight:600;background:linear-gradient(135deg,#ffffff,#b9c8ff 60%,#ffc6f3);-webkit-background-clip:text;background-clip:text;color:transparent}
.act h3{font-size:18px;font-weight:600;margin-top:8px}.act p{font-size:14px;color:rgba(255,255,255,.7);margin-top:6px}
.foot{margin-top:40px;text-align:center;font-size:12.5px;color:rgba(255,255,255,.5)}
`, `<div class="bg"><i style="left:-120px;top:-160px;width:620px;height:620px;background:rgba(255,92,214,.55)"></i><i style="right:-160px;top:420px;width:680px;height:680px;background:rgba(56,226,255,.45)"></i><i style="left:180px;top:1300px;width:640px;height:640px;background:rgba(160,90,255,.6)"></i><i style="right:120px;bottom:-200px;width:560px;height:560px;background:rgba(255,120,200,.4)"></i></div>
<div class="wrap">
<span class="pill"><i></i>${esc(s.org)} · ${esc(s.period)}</span>
<h1>${esc(s.title)}</h1><p class="lead">${esc(s.summary)}</p>
<div class="grid">${s.kpis.map((k) => `<div class="glass kpi"><span>${k.label}</span><b class="num">${k.value}<small>${k.unit}</small></b><span class="chip ${k.direction === "down" ? "dn" : ""}">${k.direction === "up" ? "↑" : "↓"} ${k.change}</span></div>`).join("")}</div>
<div class="row r21">
<div class="glass"><h2>周收入趋势<small>单位：万元</small></h2>${withDefs(line({ w: 696, h: 352, points: weekPts((w) => `W${w}`), ticks: [2000, 2100, 2200, 2300, 2400], stroke: "#ffffff", grid: "rgba(255,255,255,.14)", text: "rgba(255,255,255,.6)", fill: "url(#gf)", size: 12, pad: [18, 20, 26, 44], width: 2.5, dots: true, last: "2,280" }), `<linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`)}</div>
<div class="glass"><h2>产品收入占比<small>本季度</small></h2>
<div class="donut"><div class="ring" style="background:${conic(["#ffffff", "#c9b8ff", "#8fd3ff", "#ffb3ec", "#7cf7d4"])}"></div><div class="c"><b class="num">2.86</b><span>亿元</span></div></div>
<div class="leg">${P.map((p, i) => `<div><i style="background:${["#ffffff", "#c9b8ff", "#8fd3ff", "#ffb3ec", "#7cf7d4"][i]}"></i><span>${p.name}</span><span class="s num" style="color:#fff">${p.share}%</span><span class="s num">${p.change}</span></div>`).join("")}</div></div>
</div>
<div class="row r11">
<div class="glass"><h2>区域目标完成率<small>白线为 100%</small></h2><div class="rg">
${R.map((r) => `<div class="it"><span>${r.name}</span><div class="tr"><i class="${r.attain < 95 ? "lo" : ""}" style="width:${(r.attain / 110) * 100}%"></i><u style="left:${(100 / 110) * 100}%"></u></div><span class="p num">${r.attain.toFixed(1)}%</span><span class="c num">${r.change}</span></div>`).join("")}</div>
<div class="note">南京、合肥合计缺口 1,580 万元；宁波距目标 50 万元。</div></div>
<div class="glass"><h2>本季发现<small>3 条</small></h2><div class="fd">${s.findings.map((f, i) => `<div><em>${i + 1}</em><p><b>${esc(f.title)}</b><span>${esc(f.detail)}</span></p></div>`).join("")}</div></div>
</div>
<div class="row r3">${s.actions.map((a, i) => `<div class="glass act"><b class="n">0${i + 1}</b><h3>${esc(a.title)}</h3><p>${esc(a.detail)}</p></div>`).join("")}</div>
<div class="foot">${esc(s.org)} · ${esc(s.title)} · ${esc(s.period)}</div>
</div>`),

  // ---------------------------------------------------------------- d 极简大字
  d: doc(`
body{background:#fff;color:#111;font-family:"Noto Sans SC",sans-serif;font-size:15px;line-height:1.7}
.num{font-variant-numeric:tabular-nums}
.wrap{width:1040px;margin:0 auto;padding:96px 0 120px}
header{display:flex;justify-content:space-between;font-size:14px;color:#999}
header b{color:#111;font-weight:500}
.lead{font-size:30px;line-height:48px;font-weight:300;margin:120px 0 96px;max-width:860px}
.row{display:grid;grid-template-columns:1fr 280px;align-items:end;padding:64px 0 56px;border-top:1px solid #ececec}
.big{font-weight:300;font-size:168px;line-height:150px;letter-spacing:-.045em;white-space:nowrap}
.big small{font-size:26px;letter-spacing:0;margin-left:16px;color:#999;font-weight:400}
.meta{padding-bottom:10px;font-size:16px}.meta b{display:block;font-weight:500}.meta span{color:#999}
.meta .dn{color:#b3261e}
.sec{padding:80px 0 0;margin-top:56px;border-top:1px solid #ececec}
.sh{display:grid;grid-template-columns:1fr 280px;margin-bottom:40px}
.sh h2{font-size:15px;font-weight:500}.sh span{font-size:15px;color:#999}
.rg{display:grid;gap:26px}
.rg>div{display:grid;grid-template-columns:72px 1fr 88px 80px;align-items:center;gap:24px}
.ln{position:relative;height:1px;background:#e6e6e6}
.ln i{position:absolute;left:0;top:-1px;height:3px;background:#111}
.ln u{position:absolute;top:-8px;height:17px;border-left:1px solid #bbb}
.rg .r{text-align:right}.grey{color:#999}.red{color:#b3261e}
.pr{display:grid;grid-template-columns:repeat(5,1fr);gap:24px}
.pr b{display:block;font-size:48px;line-height:56px;font-weight:300;letter-spacing:-.03em}
.pr b small{font-size:18px;color:#999;margin-left:2px;letter-spacing:0}
.pr span{display:block;margin-top:8px}.pr em{font-style:normal;color:#999;font-size:14px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:80px}
.two h3{font-size:15px;font-weight:500;margin-bottom:24px}
.two ol{list-style:none;display:grid;gap:28px}
.two li b{display:block;font-weight:500;font-size:17px}.two li span{color:#777}
footer{margin-top:120px;font-size:13px;color:#aaa}
`, `<div class="wrap">
<header><b>${esc(s.title)}</b><span>${esc(s.org)}　${esc(s.period)}</span></header>
<p class="lead">收入增长 9.4%，完成目标的 96.3%。增长来自企业版和新客户，缺口来自南京、合肥两区。</p>
${s.kpis.map((k) => `<div class="row"><div class="big num">${k.value}<small>${k.unit}</small></div><div class="meta"><b>${k.label}</b><span class="${k.key === "churn" || k.key === "attain" ? "dn" : ""}">${k.change}</span></div></div>`).join("")}
<div class="sec"><div class="sh"><h2>周收入</h2><span>万元，第 1 至第 13 周</span></div>
${line({ w: 1040, h: 220, points: weekPts((w) => `${w}`), ticks: [2000, 2200, 2400], stroke: "#111", grid: "#f1f1f1", text: "#aaa", size: 13, pad: [16, 8, 28, 44], width: 1.25, last: "2,280" })}</div>
<div class="sec"><div class="sh"><h2>区域完成率</h2><span>竖线为 100%</span></div><div class="rg">
${R.map((r) => `<div><span>${r.name}</span><div class="ln"><i style="width:${(r.attain / 110) * 100}%"></i><u style="left:${(100 / 110) * 100}%"></u></div><span class="r num ${r.attain < 95 ? "red" : ""}">${r.attain.toFixed(1)}%</span><span class="r num grey">${r.change}</span></div>`).join("")}</div></div>
<div class="sec"><div class="sh"><h2>产品占比</h2><span>同比</span></div><div class="pr">
${P.map((p) => `<div><b class="num">${p.share}<small>%</small></b><span>${p.name}</span><em class="num">${p.change}</em></div>`).join("")}</div></div>
<div class="sec"><div class="two"><div><h3>发现</h3><ol>${s.findings.map((f) => `<li><b>${esc(f.title)}</b><span>${esc(f.detail)}</span></li>`).join("")}</ol></div>
<div><h3>行动</h3><ol>${s.actions.map((a) => `<li><b>${esc(a.title)}</b><span>${esc(a.detail)}</span></li>`).join("")}</ol></div></div></div>
<footer>${esc(s.org)}　·　金额单位：万元</footer>
</div>`),

  // ---------------------------------------------------------------- e 拥挤的企业 BI
  e: doc(`
body{background:#e6eaf0;color:#2b333d;font-family:"Noto Sans SC",sans-serif;font-size:12px;line-height:1.5}
.num{font-variant-numeric:tabular-nums}
.bar{background:#1f3b63;color:#fff;border-bottom:3px solid #ffb300}
.bar .in{width:1152px;margin:0 auto;display:flex;align-items:center;gap:10px;height:48px}
.bar h1{font-size:17px;font-weight:600;margin-right:auto}
.bar h1 span{font-size:12px;font-weight:400;color:#b7c6dc;margin-left:10px}
.f{background:#fff;color:#2b333d;border:1px solid #9fb0c6;border-radius:2px;padding:2px 8px;font-size:12px}
.f:after{content:"▾";margin-left:8px;color:#7a8696}
.btn{background:#ffb300;color:#1f3b63;font-weight:600;border-radius:2px;padding:3px 12px}
.wrap{width:1152px;margin:0 auto;padding:8px 0 24px}
.g{display:grid;grid-template-columns:repeat(12,1fr);gap:6px}
.s3{grid-column:span 3}.s4{grid-column:span 4}.s5{grid-column:span 5}.s7{grid-column:span 7}.s12{grid-column:span 12}
.w{background:#fff;border:1px solid #b9c4d2;box-shadow:0 1px 2px rgba(0,0,0,.08);display:flex;flex-direction:column}
.w>h3{font-size:12px;font-weight:600;color:#fff;padding:4px 8px;display:flex;justify-content:space-between;align-items:center}
.w>h3 i{display:inline-flex;gap:3px}.w>h3 i b{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.85)}
.w>.b{padding:8px;flex:1}
.kpi{color:#fff;border:0;padding:8px 10px;display:grid;grid-template-columns:1fr auto;align-items:end}
.kpi span{font-size:12px;opacity:.9;grid-column:span 2}
.kpi b{font-size:30px;line-height:38px;font-weight:600}.kpi small{font-size:13px;margin-left:3px;font-weight:400}
.kpi em{font-style:normal;font-size:12px;background:rgba(0,0,0,.18);padding:1px 6px;border-radius:2px;margin-bottom:6px}
.sum{background:#fff8e1;border:1px solid #ffca28;border-left:5px solid #ffa000;padding:6px 10px;font-size:12.5px}
.sum b{color:#e65100;margin-right:6px}
.lg{display:flex;gap:14px;font-size:11px;color:#55606d;margin-bottom:4px;flex-wrap:wrap}
.lg span{display:inline-flex;align-items:center;gap:4px}.lg i{width:10px;height:10px;display:inline-block}
.lg i.o{width:14px;height:2px;background:#ff6f00}
table{font-size:12px}td,th{padding:3px 4px;border:1px solid #dde3ea;text-align:right;font-weight:400;white-space:nowrap}
th{background:#eef2f7;color:#47515d;font-weight:500}td:first-child,th:first-child{text-align:left}
.up{color:#2e7d32}.dn{color:#d32f2f}
.c-g{background:#c8e6c9}.c-y{background:#fff59d}.c-r{background:#ffcdd2}
.pie{display:grid;grid-template-columns:118px 1fr;gap:12px;align-items:center}
.pie .d{width:118px;height:118px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #c9d2dd}
.pl{display:grid;gap:4px;font-size:11.5px}.pl div{display:grid;grid-template-columns:10px 1fr auto;gap:6px;align-items:center}.pl i{width:10px;height:10px}
.li{display:grid;gap:6px}.li div{border-left:3px solid var(--c);background:#f6f8fb;padding:4px 8px}.li b{display:block;font-weight:600}
.tag{display:inline-block;font-size:11px;padding:0 5px;border-radius:2px;color:#fff;margin-right:4px}
.foot{margin-top:6px;font-size:11px;color:#6b7684;display:flex;justify-content:space-between}
`, `<div class="bar"><div class="in"><h1>${esc(s.title)}<span>${esc(s.org)}</span></h1><span class="f">期间：${esc(s.period)}</span><span class="f">区域：全部</span><span class="f">产品：全部</span><span class="btn">导出</span></div></div>
<div class="wrap"><div class="g">
<div class="s12 sum"><b>摘要</b>${esc(s.summary)}</div>
${s.kpis.map((k, i) => `<div class="s3 kpi" style="background:${["#1e88e5", "#00897b", "#7cb342", "#f4511e"][i]}"><span>${k.label}</span><b class="num">${k.value}<small>${k.unit}</small></b><em>${k.direction === "up" ? "▲" : "▼"} ${k.change}</em></div>`).join("")}
<div class="w s7"><h3 style="background:#00897b">周收入与累计收入（万元）<i><b></b><b></b><b></b></i></h3><div class="b"><div class="lg"><span><i style="background:#26a69a"></i>周收入（左轴）</span><span><i class="o"></i>累计收入（右轴）</span></div>${combo({ w: 650, h: 236 })}</div></div>
<div class="w s5"><h3 style="background:#3949ab">区域收入与目标（万元）<i><b></b><b></b><b></b></i></h3><div class="b"><div class="lg"><span><i style="background:#3f51b5"></i>收入</span><span><i style="background:#ffb300"></i>目标</span></div>${grouped({ w: 460, h: 236 })}</div></div>
<div class="w s3"><h3 style="background:#e53935">产品收入占比<i><b></b><b></b><b></b></i></h3><div class="b"><div class="pie"><div class="d" style="background:${conic(pieColors)}"></div><div class="pl">${P.map((p, i) => `<div><i style="background:${pieColors[i]}"></i><span>${p.name}</span><span class="num">${p.share}%</span></div>`).join("")}</div></div></div></div>
<div class="w s3"><h3 style="background:#fb8c00">产品明细<i><b></b><b></b><b></b></i></h3><div class="b"><table><tr><th>产品</th><th>收入</th><th>占比</th><th>同比</th></tr>${P.map((p) => `<tr><td>${p.name}</td><td class="num">${num(p.revenue)}</td><td class="num">${p.share}%</td><td class="num ${isNeg(p.change) ? "dn" : "up"}">${p.change}</td></tr>`).join("")}<tr><td><b>合计</b></td><td class="num"><b>${num(P.reduce((a, p) => a + p.revenue, 0))}</b></td><td class="num">100%</td><td class="num up">+9.4%</td></tr></table></div></div>
<div class="w s3"><h3 style="background:#8e24aa">区域完成率<i><b></b><b></b><b></b></i></h3><div class="b"><table><tr><th>区域</th><th>收入</th><th>目标</th><th>完成率</th></tr>${R.map((r) => `<tr><td>${r.name}</td><td class="num">${num(r.revenue)}</td><td class="num">${num(r.target)}</td><td class="num ${r.attain >= 100 ? "c-g" : r.attain >= 90 ? "c-y" : "c-r"}">${r.attain.toFixed(1)}%</td></tr>`).join("")}<tr><td><b>合计</b></td><td class="num"><b>${num(totalRev)}</b></td><td class="num"><b>${num(totalTarget)}</b></td><td class="num c-y">96.3%</td></tr></table></div></div>
<div class="w s3"><h3 style="background:#43a047">区域收入同比<i><b></b><b></b><b></b></i></h3><div class="b"><div class="lg"><span><i style="background:#43a047"></i>增长</span><span><i style="background:#e53935"></i>下降</span></div>${diverging({ w: 265, h: 168 })}</div></div>
<div class="w s3"><h3 style="background:#5e35b1">目标完成率<i><b></b><b></b><b></b></i></h3><div class="b" style="display:flex;flex-direction:column;justify-content:center">${gauge(96.3)}<div style="text-align:center;margin-top:4px">缺口 <b class="dn num">${num(totalTarget - totalRev)}</b> 万元　<span class="dn">▼ 3.7 个百分点</span></div></div></div>
<div class="w s5"><h3 style="background:#d81b60">主要发现<i><b></b><b></b><b></b></i></h3><div class="b"><div class="li">${s.findings.map((f, i) => `<div style="--c:${["#43a047", "#e53935", "#fb8c00"][i]}"><b><span class="tag" style="background:${["#43a047", "#e53935", "#fb8c00"][i]}">${["机会", "风险", "预警"][i]}</span>${esc(f.title)}</b>${esc(f.detail)}</div>`).join("")}</div></div></div>
<div class="w s4"><h3 style="background:#0097a7">行动计划<i><b></b><b></b><b></b></i></h3><div class="b"><table><tr><th>#</th><th style="text-align:left">事项</th><th style="text-align:left">说明</th></tr>${s.actions.map((a, i) => `<tr><td>${i + 1}</td><td style="text-align:left">${esc(a.title)}</td><td style="text-align:left;white-space:normal">${esc(a.detail)}</td></tr>`).join("")}</table></div></div>
</div>
<div class="foot"><span>数据来源：${esc(s.org)}</span><span>金额单位：万元</span></div>
</div>`),
}
