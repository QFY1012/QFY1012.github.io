// 结账流程 A/B 实验报告 in five styles: statistical forest plot, document, phone column,
// loud KPI tiles, two-column conclusion/evidence.
import { readData, doc, esc, num, pct, bars as kitBars, line as kitLine } from "../style-kit.mjs"

const ab = readData("ab")
const M = ab.metrics
const P = M.find((m) => m.primary)
const S = ab.samples
const total = S.control + S.treatment
const share = (v) => ((v / total) * 100).toFixed(2) + "%"
const last = ab.daily[ab.daily.length - 1]
// day 1 is 9 月 2 日
const points = ab.daily.map((d) => ({ x: `9/${d.day + 1}`, y: d.lift, lo: d.low, hi: d.high }))
const line = (o) => kitLine({ points, ticks: [-4, 0, 4, 8, 12, 16], band: true, zero: true, xEvery: 5, last: pct(last.lift), ...o })
const sig = (m) => (m.significant ? "显著" : "不显著")
const ci = (m) => `${m.ciLow.toFixed(1)}, ${m.ciHigh.toFixed(1)}`.replace(/-/g, "−")
const ciPct = (m) => `${pct(m.ciLow)} ~ ${pct(m.ciHigh)}`
// the verdict without its trailing advice, and the advice alone
const [verdictMain, verdictAdvice] = (() => { const i = ab.verdict.lastIndexOf("，"); return [ab.verdict.slice(0, i) + "。", ab.verdict.slice(i + 1).replace(/。$/, "")] })()
const firstSafe = ab.daily.find((d, i) => ab.daily.slice(i).every((x) => x.low > 0)).day
const segMax = ab.segments.reduce((a, b) => (b.lift > a.lift ? b : a))
const segMin = ab.segments.reduce((a, b) => (b.lift < a.lift ? b : a))

// Forest plot: one row per metric, dot = lift, line = 95% CI, a shared axis with a zero line.
function forest() {
  const W = 1056, head = 40, rowH = 58, foot = 48, H = head + rowH * M.length + foot
  const x0 = 430, x1 = 830, lo = -10, hi = 15, X = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0)
  const ticks = [-10, -5, 0, 5, 10, 15]
  const plotBottom = head + rowH * M.length
  const grid = ticks.map((t) => `<line x1="${X(t)}" x2="${X(t)}" y1="${head}" y2="${plotBottom}" stroke="${t === 0 ? "#4a525c" : "#eceef1"}" ${t === 0 ? 'stroke-dasharray="4 3"' : ""}/><text x="${X(t)}" y="${plotBottom + 20}" text-anchor="middle" class="m">${t > 0 ? "+" : t < 0 ? "−" : ""}${Math.abs(t)}%</text>`).join("")
  const rows = M.map((m, i) => {
    const cy = head + rowH * i + rowH / 2, c = m.significant ? "#24527a" : "#97a0aa"
    return `<line x1="0" x2="${W}" y1="${head + rowH * (i + 1)}" y2="${head + rowH * (i + 1)}" stroke="#e3e6ea"/>
<text x="12" y="${cy + 5}" style="font-size:15px;fill:#1d232b;font-weight:${m.primary ? 600 : 400}">${esc(m.name)}</text>
${m.primary ? `<text x="${12 + 15 * m.name.length + 10}" y="${cy + 4}" style="font-size:11px;fill:#24527a">主要指标</text>` : ""}
<text x="220" y="${cy + 5}" class="m" style="fill:#4a525c">${esc(m.control)} → ${esc(m.treatment)}</text>
<line x1="${X(m.ciLow)}" x2="${X(m.ciHigh)}" y1="${cy}" y2="${cy}" stroke="${c}" stroke-width="${m.significant ? 2 : 1.5}"/>
<line x1="${X(m.ciLow)}" x2="${X(m.ciLow)}" y1="${cy - 5}" y2="${cy + 5}" stroke="${c}" stroke-width="1.5"/><line x1="${X(m.ciHigh)}" x2="${X(m.ciHigh)}" y1="${cy - 5}" y2="${cy + 5}" stroke="${c}" stroke-width="1.5"/>
${m.significant ? `<circle cx="${X(m.lift)}" cy="${cy}" r="${m.primary ? 6.5 : 5}" fill="${c}"/>` : `<circle cx="${X(m.lift)}" cy="${cy}" r="5" fill="#fff" stroke="${c}" stroke-width="1.75"/>`}
<text x="928" y="${cy + 5}" text-anchor="end" class="m" style="font-size:14px;fill:#1d232b;font-weight:500">${pct(m.lift)}</text>
<text x="944" y="${cy + 5}" class="m" style="fill:#6b737d">[${ci(m)}]</text>`
  }).join("")
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;font-family:'Noto Sans SC',sans-serif">
<style>.m{font-family:'IBM Plex Mono',monospace;font-size:13px;fill:#6b737d}.h{font-size:12px;fill:#6b737d;letter-spacing:.04em}</style>
<text x="12" y="24" class="h">指标</text><text x="220" y="24" class="h">对照组 → 实验组</text>
<text x="${X(0) - 10}" y="24" text-anchor="end" class="h">← 实验组更低</text><text x="${X(0) + 10}" y="24" class="h">实验组更高 →</text>
<text x="928" y="24" text-anchor="end" class="h">相对提升</text><text x="944" y="24" class="h">95% 置信区间</text>
${M.map((m, i) => m.primary ? `<rect x="0" y="${head + rowH * i}" width="${W}" height="${rowH}" fill="#f4f6f9"/>` : "").join("")}${grid}
<line x1="0" x2="${W}" y1="${head}" y2="${head}" stroke="#1d232b"/>
${rows}
<line x1="0" x2="${W}" y1="${plotBottom}" y2="${plotBottom}" stroke="#1d232b"/>
<text x="${(x0 + x1) / 2}" y="${H - 4}" text-anchor="middle" class="h">相对提升（%）</text></svg>`
}

// Tick labels over the strips, on the same scale.
const scaleHead = (w = 236, lo = -10, hi = 15) => { const X = (v) => 6 + ((v - lo) / (hi - lo)) * (w - 12); return `<svg width="${w}" height="16" style="display:block;font-family:'IBM Plex Mono',monospace;font-size:11px;fill:#8a8c86">${[-5, 0, 5, 10].map((t) => `<text x="${X(t)}" y="12" text-anchor="middle">${t > 0 ? "+" : t < 0 ? "−" : ""}${Math.abs(t)}%</text>`).join("")}</svg>` }
// A small CI strip for table cells: shared scale, zero tick, dot at the lift.
const strip = (m, { w = 236, h = 22, lo = -10, hi = 15, pos = "#0f6b4f", neg = "#0f6b4f", ns = "#9aa1a8" } = {}) => {
  const X = (v) => 6 + ((v - lo) / (hi - lo)) * (w - 12), c = !m.significant ? ns : m.lift > 0 ? pos : neg
  return `<svg width="${w}" height="${h}" style="display:block"><line x1="6" x2="${w - 6}" y1="${h / 2}" y2="${h / 2}" stroke="#ecebe6"/><line x1="${X(0)}" x2="${X(0)}" y1="2" y2="${h - 2}" stroke="#8b8a85"/>
<line x1="${X(m.ciLow)}" x2="${X(m.ciHigh)}" y1="${h / 2}" y2="${h / 2}" stroke="${c}" stroke-width="3" stroke-linecap="round"/><circle cx="${X(m.lift)}" cy="${h / 2}" r="4.5" fill="${c}" stroke="#fff" stroke-width="1.5"/></svg>`
}

export default {
  // 统计/科学风: forest plot as the hero, figure and table captions, muted ink-and-blue palette.
  a: doc(`
body{background:#fcfcfb;color:#1d232b;font-family:"Noto Sans SC",sans-serif;font-size:15px;line-height:1.75}
.serif{font-family:"Noto Serif SC",serif}.mono{font-family:"IBM Plex Mono",monospace}
.wrap{width:1056px;margin:0 auto;padding:80px 0 96px}
.run{display:flex;justify-content:space-between;font-size:12px;color:#6b737d;letter-spacing:.06em;border-bottom:1px solid #1d232b;padding-bottom:10px}
h1{font-family:"Noto Serif SC",serif;font-weight:600;font-size:34px;line-height:48px;margin-top:40px}
.abs{display:grid;grid-template-columns:96px 1fr;gap:24px;margin-top:28px;font-size:16px;line-height:30px;color:#2f3742}
.abs b{font-family:"Noto Serif SC",serif;font-weight:600;font-size:14px;color:#6b737d;padding-top:1px}
.meta{display:grid;grid-template-columns:repeat(4,auto);justify-content:space-between;margin-top:32px;padding:16px 0;border-top:1px solid #e3e6ea;border-bottom:1px solid #e3e6ea;font-size:14px}
.meta span{display:block;font-size:12px;color:#6b737d}
.meta .mono{font-size:14px}
figure{margin-top:56px}
figcaption,.cap{font-size:13px;line-height:22px;color:#4a525c;margin-top:14px;max-width:880px}
figcaption b,.cap b{font-family:"Noto Serif SC",serif;font-weight:600;color:#1d232b;margin-right:10px}
.legend{display:flex;gap:28px;font-size:12px;color:#6b737d;margin-bottom:14px;justify-content:flex-end}
.legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:-1px}
.two{display:grid;grid-template-columns:600px 1fr;gap:64px;margin-top:64px;align-items:start}
.cap.top{margin:0 0 12px}
table{font-size:14px}
th{font-weight:400;font-size:12px;color:#6b737d;text-align:left;padding:7px 0;border-top:1px solid #1d232b;border-bottom:1px solid #1d232b}
td{padding:8px 0;border-bottom:1px solid #e3e6ea}
tr:last-child td{border-bottom:1px solid #1d232b}
.r{text-align:right}.mono{font-variant-numeric:tabular-nums}
.cap.top.t2{margin-top:36px}
h2{font-family:"Noto Serif SC",serif;font-weight:600;font-size:20px;margin-top:72px;padding-bottom:10px;border-bottom:1px solid #1d232b}
ol{list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:20px;counter-reset:n}
ol li{counter-increment:n;font-size:14px;line-height:24px;color:#4a525c}
ol li:before{content:counter(n);display:block;font-family:"IBM Plex Mono",monospace;font-size:13px;color:#24527a;margin-bottom:6px}
ol b{display:block;font-weight:500;font-size:15px;color:#1d232b;margin-bottom:4px}
.note{margin-top:56px;font-size:12px;color:#6b737d;line-height:20px}
`, `<div class="wrap">
<div class="run"><span>实验报告　·　${esc(ab.owner)}</span><span>${esc(ab.period)}</span></div>
<h1>${esc(ab.title)}</h1>
<div class="abs"><b>摘　要</b><p>${esc(ab.verdict)}实验采用${esc(ab.traffic)}，对照组样本 ${num(S.control)}，实验组样本 ${num(S.treatment)}。五项指标中三项差异显著，客单价与退款率的置信区间包含零。</p></div>
<div class="meta"><div><span>负责团队</span>${esc(ab.owner)}</div><div><span>实验周期</span>9 月 2 日至 22 日（21 天）</div><div><span>分流</span>${esc(ab.traffic)}</div><div><span>样本合计</span><span class="mono" style="color:#1d232b;font-size:14px">${num(total)}</span></div></div>
<figure>
<div class="legend"><span><i style="background:#24527a"></i>显著（区间不含 0）</span><span><i style="border:1.75px solid #97a0aa;background:#fff"></i>不显著</span><span><i style="border-radius:0;width:14px;height:0;border-top:1.5px dashed #4a525c;vertical-align:3px"></i>零效应</span></div>
${forest()}
<figcaption><b>图 1</b>五项指标的相对提升（实验组相对对照组）及其 95% 置信区间。点为点估计，横线为区间。结账页跳出率与退款率为越低越好的指标；跳出率下降 6.9%，退款率区间 [−3.0, 12.6] 跨过零。</figcaption>
</figure>
<div class="two">
<figure style="margin:0">
${line({ w: 600, h: 260, stroke: "#24527a", bandFill: "rgba(36,82,122,.12)", grid: "#eceef1", text: "#6b737d", font: "'IBM Plex Mono',monospace", size: 11, pad: [16, 16, 24, 36] })}
<figcaption><b>图 2</b>支付转化率累计相对提升（%）随实验日期的变化，阴影为 95% 置信区间。自第 ${firstSafe} 天起区间下限持续高于 0；第 21 天为 ${pct(last.lift)} [${last.low.toFixed(1)}, ${last.high.toFixed(1)}]。</figcaption>
</figure>
<div>
<p class="cap top"><b>表 1</b>样本分配</p>
<table><tr><th>组别</th><th class="r">样本量</th><th class="r">占比</th></tr>
<tr><td>对照组</td><td class="r mono">${num(S.control)}</td><td class="r mono">${share(S.control)}</td></tr>
<tr><td>实验组</td><td class="r mono">${num(S.treatment)}</td><td class="r mono">${share(S.treatment)}</td></tr>
<tr><td>合计</td><td class="r mono">${num(total)}</td><td class="r mono">100.00%</td></tr></table>
<p class="cap top t2"><b>表 2</b>支付转化率分群结果</p>
<table><tr><th>分群</th><th class="r">对照组</th><th class="r">实验组</th><th class="r">相对提升</th></tr>
${ab.segments.map((s) => `<tr><td>${esc(s.name)}</td><td class="r mono">${s.control}</td><td class="r mono">${s.treatment}</td><td class="r mono">${pct(s.lift)}</td></tr>`).join("")}</table>
</div></div>
<h2>结论与后续</h2>
<ol>${ab.next.map((n) => `<li><b>${esc(n.title)}</b>${esc(n.detail)}</li>`).join("")}</ol>
<p class="note">注：相对提升 =（实验组 − 对照组）/ 对照组；置信区间为 95% 水平。分群结果未给出置信区间，仅供参考。</p>
</div>`),

  // 文档风: one 760px column, cover strip, property list, callout, inline tables, to-dos.
  b: doc(`
body{background:#fff;color:#37352f;font-family:"Noto Sans SC",sans-serif;font-size:16px;line-height:1.75}
.cover{height:150px;background:linear-gradient(120deg,#e7efe9,#eef0f6)}
.page{width:760px;margin:0 auto;padding-bottom:120px}
.icon{width:72px;height:72px;border-radius:14px;background:#fff;margin-top:-36px;box-shadow:0 0 0 1px rgba(15,15,15,.08),0 2px 6px rgba(15,15,15,.06);display:flex;align-items:flex-end;justify-content:center;gap:7px;padding-bottom:16px}
.icon i{display:block;width:12px;border-radius:3px}
h1{font-size:38px;line-height:52px;font-weight:600;margin-top:24px;color:#2c2b27}
.props{margin-top:20px;display:grid;grid-template-columns:150px 1fr;row-gap:2px;font-size:14px;line-height:34px}
.props dt{color:#91908c}
.chip{display:inline-block;line-height:22px;padding:0 8px;border-radius:4px;font-size:13px;background:#f1f1ef}
.chip.g{background:#dbeddb;color:#1c3829}.chip.b{background:#d3e5ef;color:#183347}
hr{border:0;border-top:1px solid #e9e9e7;margin:24px 0 28px}
.callout{display:flex;gap:14px;background:#edf3ec;border-radius:6px;padding:18px 22px 18px 18px}
.callout .ic{flex:none;width:24px;height:24px;border-radius:50%;background:#448361;color:#fff;font-size:14px;line-height:24px;text-align:center;margin-top:3px}
.callout b{font-weight:600}
h2{font-size:24px;line-height:34px;font-weight:600;margin:44px 0 10px;color:#2c2b27}
h3{font-size:18px;font-weight:500;margin:28px 0 6px}
p{margin:6px 0}
.muted{color:#787774}
table{font-size:14px;line-height:22px;margin:14px 0 8px}
th,td{border:1px solid #e9e9e7;padding:8px 10px;text-align:left}
th{background:#f7f7f5;font-weight:500;color:#5a5955}
.r{text-align:right}.num{font-variant-numeric:tabular-nums}
.tag{display:inline-block;padding:0 6px;border-radius:3px;font-size:12px;line-height:20px}
.tag.y{background:#dbeddb;color:#1c3829}.tag.n{background:#ebeced;color:#5a5955}
.up{color:#448361}.dn{color:#c4554d}
figure{margin:16px 0 4px;border:1px solid #e9e9e7;border-radius:6px;padding:20px 16px 12px}
figcaption{font-size:13px;color:#91908c;margin-top:6px}
ul{padding-left:22px;margin:8px 0}ul li{margin:4px 0}
.todo{display:flex;gap:12px;padding:5px 0}
.todo .box{flex:none;width:16px;height:16px;border:1.5px solid #8f8e8a;border-radius:3px;margin-top:6px}
.todo span{color:#787774}
`, `<div class="cover"></div><div class="page">
<div class="icon"><i style="height:22px;background:#c9cfd6"></i><i style="height:32px;background:#448361"></i></div>
<h1>${esc(ab.title)}</h1>
<dl class="props">
<dt>负责团队</dt><dd><span class="chip b">${esc(ab.owner)}</span></dd>
<dt>实验时间</dt><dd>${esc(ab.period)}</dd>
<dt>分流方式</dt><dd>${esc(ab.traffic)}</dd>
<dt>样本量</dt><dd class="num">对照组 ${num(S.control)}　·　实验组 ${num(S.treatment)}</dd>
<dt>结论</dt><dd><span class="chip g">${esc(verdictAdvice)}</span></dd>
</dl>
<hr>
<div class="callout"><div class="ic">✓</div><div><b>${esc(verdictMain)}</b>${esc(verdictAdvice)}。</div></div>
<h2>核心指标</h2>
<p>主要指标为支付转化率，从 ${P.control} 提升至 ${P.treatment}。五项指标对比如下。</p>
<table><tr><th>指标</th><th class="r">对照组</th><th class="r">实验组</th><th class="r">相对提升</th><th>95% 置信区间</th><th>显著性</th></tr>
${M.map((m) => `<tr><td>${esc(m.name)}${m.primary ? "（主）" : ""}</td><td class="r num">${m.control}</td><td class="r num">${m.treatment}</td><td class="r num">${pct(m.lift)}</td><td class="num">${ciPct(m)}</td><td><span class="tag ${m.significant ? "y" : "n"}">${sig(m)}</span></td></tr>`).join("")}</table>
<ul><li>结账页跳出率从 41.8% 降到 38.9%，下降 6.9%，是变化最明显的指标。</li><li>客单价与退款率的区间都包含 0，暂未看到显著差异。</li></ul>
<h2>累计提升趋势</h2>
<p>支付转化率的累计相对提升在前几天波动较大，第 ${firstSafe} 天起区间下限持续高于 0，此后稳定在 4% 左右。</p>
<figure>${line({ w: 726, h: 230, stroke: "#2383e2", bandFill: "rgba(35,131,226,.12)", grid: "#f0f0ee", text: "#91908c", size: 12, pad: [12, 18, 24, 34] })}
<figcaption>支付转化率累计相对提升（%），阴影为 95% 置信区间</figcaption></figure>
<h2>分群表现</h2>
<table style="width:520px"><tr><th>分群</th><th class="r">对照组</th><th class="r">实验组</th><th class="r">相对提升</th></tr>
${ab.segments.map((s) => `<tr><td>${esc(s.name)}</td><td class="r num">${s.control}</td><td class="r num">${s.treatment}</td><td class="r num">${pct(s.lift)}</td></tr>`).join("")}</table>
<p>${segMax.name}提升最大（${pct(segMax.lift)}），${segMin.name}最小（${pct(segMin.lift)}）；iOS 与 Android 差别不大。</p>
<h2>下一步</h2>
${ab.next.map((n) => `<div class="todo"><div class="box"></div><div>${esc(n.title)}　<span>${esc(n.detail)}</span></div></div>`).join("")}
</div>`),

  // 移动端单列: a 400px column of rounded cards on light grey, desktop width left empty.
  c: doc(`
body{background:#eef0f4;color:#1c1f26;font-family:"Noto Sans SC",sans-serif;font-size:14px;line-height:1.6}
.phone{width:400px;margin:0 auto;padding:20px 16px 48px}
.bar{display:flex;align-items:center;justify-content:space-between;height:44px;font-size:16px;font-weight:500}
.bar i{font-style:normal;font-size:22px;color:#4b5563;width:24px}
.bar span:last-child{width:24px}
.hd{padding:10px 4px 16px}
.hd h1{font-size:21px;line-height:30px;font-weight:600}
.hd p{font-size:12px;color:#7a818c;margin-top:6px}
.card{background:#fff;border-radius:16px;padding:18px;margin-top:12px;box-shadow:0 1px 2px rgba(16,24,40,.05)}
.card h2{font-size:15px;font-weight:600;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center}
.card h2 small{font-size:12px;font-weight:400;color:#9aa1ab}
.hero .lbl{font-size:13px;color:#6b7280}
.hero .big{font-size:44px;line-height:56px;font-weight:600;color:#12a150;margin-top:4px}
.hero .big small{font-size:14px;font-weight:500;background:#e5f6ec;color:#12a150;border-radius:999px;padding:3px 10px;vertical-align:12px;margin-left:8px}
.hero .ci{font-size:12px;color:#6b7280}
.hero .vs{display:flex;gap:8px;margin-top:14px}
.hero .vs div{flex:1;background:#f5f6f8;border-radius:10px;padding:8px 12px;font-size:12px;color:#6b7280}
.hero .vs b{display:block;font-size:17px;color:#1c1f26;font-weight:500}
.verdict{margin-top:14px;font-size:13px;color:#374151;background:#f5f6f8;border-radius:10px;padding:10px 12px}
.sam{display:flex;gap:10px}.sam div{flex:1}.sam b{display:block;font-size:20px;font-weight:600}.sam span{font-size:12px;color:#7a818c}
.split{height:8px;border-radius:4px;background:#f59e0b;margin-top:12px;overflow:hidden}.split i{display:block;height:100%;width:50%;background:#3b82f6}
.row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-top:1px solid #f0f1f4}
.row:first-of-type{border-top:0;padding-top:2px}
.row b{display:block;font-weight:500;font-size:14px}.row span{font-size:12px;color:#8a919c}
.pill{font-size:13px;font-weight:600;border-radius:8px;padding:3px 10px;min-width:64px;text-align:center}
.pill.up{background:#e5f6ec;color:#12a150}.pill.dn{background:#fdecec;color:#d93a3a}.pill.ns{background:#f1f2f4;color:#8a919c}
.step{display:flex;gap:12px;padding:10px 0;border-top:1px solid #f0f1f4}.step:first-of-type{border-top:0;padding-top:0}
.step i{flex:none;font-style:normal;width:22px;height:22px;border-radius:50%;background:#3b82f6;color:#fff;font-size:12px;line-height:22px;text-align:center;margin-top:1px}
.step b{display:block;font-weight:500}.step span{font-size:12px;color:#6b7280}
.foot{text-align:center;font-size:11px;color:#a0a6b0;margin-top:20px}
`, `<div class="phone">
<div class="bar"><i>‹</i><span>实验报告</span><span></span></div>
<div class="hd"><h1>${esc(ab.title)}</h1><p>${esc(ab.owner)} · 9 月 2 日至 22 日 · 50% / 50%</p></div>
<div class="card hero"><div class="lbl">支付转化率（主要指标）</div>
<div class="big">${pct(P.lift)}<small>显著</small></div><div class="ci">95% 置信区间 ${ciPct(P)}</div>
<div class="vs"><div>对照组<b>${P.control}</b></div><div>实验组<b>${P.treatment}</b></div></div>
<div class="verdict">${esc(ab.verdict)}</div></div>
<div class="card"><h2>样本量<small>共 ${num(total)}</small></h2><div class="sam"><div><b>${num(S.control)}</b><span>对照组</span></div><div><b>${num(S.treatment)}</b><span>实验组</span></div></div><div class="split"><i></i></div></div>
<div class="card"><h2>全部指标<small>相对提升</small></h2>
${M.map((m) => `<div class="row"><div><b>${esc(m.name)}</b><span>${m.control} → ${m.treatment}</span></div><div class="pill ${!m.significant ? "ns" : m.lift > 0 ? "up" : "dn"}">${pct(m.lift)}</div></div>`).join("")}</div>
<div class="card"><h2>累计提升<small>支付转化率 %</small></h2>
${line({ w: 332, h: 190, stroke: "#3b82f6", bandFill: "rgba(59,130,246,.14)", grid: "#f0f1f4", text: "#9aa1ab", size: 11, xEvery: 10, pad: [12, 18, 22, 28] })}</div>
<div class="card"><h2>分群提升<small>支付转化率</small></h2>
<div style="font-size:13px">${kitBars(ab.segments.map((s) => ({ label: s.name, value: s.lift, display: pct(s.lift) })), { max: 8, color: "#3b82f6", track: "#eef1f6", labelW: 56, valueW: 44, h: 8, radius: 4, gap: 12 })}</div></div>
<div class="card"><h2>下一步</h2>${ab.next.map((n, i) => `<div class="step"><i>${i + 1}</i><div><b>${esc(n.title)}</b><span>${esc(n.detail)}</span></div></div>`).join("")}</div>
<div class="foot">${esc(ab.period)}</div>
</div>`),

  // 大屏 KPI 色块: gradient header, saturated tiles per metric, heavy shadows, badges everywhere.
  d: doc(`
body{background:#eef1f8;color:#1e2235;font-family:"Noto Sans SC",sans-serif;font-size:14px;line-height:1.6}
.head{background:linear-gradient(120deg,#5b21b6 0%,#2563eb 55%,#06b6d4 100%);color:#fff;padding:44px 0 120px}
.in{width:1152px;margin:0 auto}
.badges{display:flex;gap:8px;flex-wrap:wrap}
.bd{font-size:12px;font-weight:600;padding:4px 12px;border-radius:999px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35)}
.bd.hot{background:#f97316;border-color:#f97316}.bd.ok{background:#22c55e;border-color:#22c55e}
h1{font-size:38px;line-height:52px;font-weight:600;margin-top:16px;text-shadow:0 2px 10px rgba(0,0,0,.25)}
.sub{margin-top:8px;font-size:15px;opacity:.9}
.verdict{margin-top:22px;display:inline-flex;align-items:center;gap:12px;background:rgba(255,255,255,.16);border-radius:14px;padding:12px 20px;font-size:17px;font-weight:500;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)}
.verdict i{font-style:normal;background:#facc15;color:#422006;font-size:13px;font-weight:600;border-radius:8px;padding:2px 10px}
.tiles{display:grid;grid-template-columns:repeat(5,1fr);gap:20px;margin-top:-84px}
.tile{border-radius:18px;padding:20px 20px 18px;color:#fff;box-shadow:0 18px 36px -8px var(--sh);position:relative}
.tile.g{background:linear-gradient(145deg,#22c55e,#059669);--sh:rgba(5,150,105,.55)}
.tile.r{background:linear-gradient(145deg,#f43f5e,#dc2626);--sh:rgba(220,38,38,.5)}
.tile.y{background:linear-gradient(145deg,#fbbf24,#f97316);--sh:rgba(249,115,22,.5)}
.tile .top{display:flex;justify-content:space-between;align-items:center}
.tile .ic{width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.25);text-align:center;line-height:34px;font-size:15px}
.tile .tg{font-size:11px;font-weight:600;background:rgba(255,255,255,.9);border-radius:999px;padding:1px 9px}
.tile.g .tg{color:#047857}.tile.r .tg{color:#b91c1c}.tile.y .tg{color:#c2410c}
.tile .nm{font-size:14px;font-weight:500;margin-top:14px;opacity:.95}
.tile .v{font-size:40px;line-height:50px;font-weight:600;text-shadow:0 2px 8px rgba(0,0,0,.18)}
.tile .s{font-size:12px;opacity:.9}
.tile .ci{margin-top:10px;font-size:12px;background:rgba(0,0,0,.14);border-radius:8px;padding:4px 10px}
.star{position:absolute;top:-10px;left:16px;background:#facc15;color:#422006;font-size:11px;font-weight:600;border-radius:999px;padding:1px 10px;box-shadow:0 4px 10px rgba(0,0,0,.2)}
.grid{display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-top:32px}
.card{background:#fff;border-radius:18px;padding:24px;box-shadow:0 14px 34px -10px rgba(37,56,120,.28)}
.card h2{font-size:18px;font-weight:600;display:flex;align-items:center;gap:10px;margin-bottom:16px}
.card h2:before{content:"";width:6px;height:20px;border-radius:3px;background:linear-gradient(#7c3aed,#06b6d4)}
.card h2 em{font-style:normal;font-size:11px;font-weight:600;color:#fff;background:#7c3aed;border-radius:999px;padding:1px 9px}
.donut{width:180px;height:180px;border-radius:50%;margin:8px auto 0;background:conic-gradient(#7c3aed 0 ${(S.control / total) * 360}deg,#06b6d4 0 360deg);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px -6px rgba(124,58,237,.45)}
.donut div{width:116px;height:116px;border-radius:50%;background:#fff;text-align:center;padding-top:32px;font-size:12px;color:#6b7280}
.donut b{display:block;font-size:20px;color:#1e2235;line-height:28px}
.leg{display:flex;flex-direction:column;gap:8px;margin-top:22px}
.leg div{display:flex;justify-content:space-between;align-items:center;background:#f5f3ff;border-radius:10px;padding:8px 12px;font-weight:500}
.leg div:last-child{background:#ecfeff}
.leg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:8px}
.segs{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:24px}
.seg{border-radius:18px;padding:20px;color:#fff;box-shadow:0 16px 30px -10px var(--sh)}
.seg b{display:block;font-size:34px;line-height:44px;font-weight:600}
.seg .nm{display:flex;justify-content:space-between;align-items:center;font-weight:500}
.seg .nm span{font-size:11px;background:rgba(255,255,255,.28);border-radius:999px;padding:0 9px}
.seg small{font-size:12px;opacity:.9}
.next{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:24px}
.nx{background:#fff;border-radius:18px;padding:22px;box-shadow:0 14px 30px -10px rgba(37,56,120,.28);border-top:5px solid var(--c)}
.nx i{font-style:normal;display:inline-block;width:30px;height:30px;border-radius:50%;background:var(--c);color:#fff;text-align:center;line-height:30px;font-weight:600;box-shadow:0 6px 14px -4px var(--c)}
.nx b{display:block;font-size:16px;margin-top:12px}.nx span{color:#5b6275;font-size:13px}
.st{font-size:20px;font-weight:600;margin-top:40px;display:flex;align-items:center;gap:10px}
.st em{font-style:normal;font-size:12px;color:#fff;background:linear-gradient(90deg,#f97316,#ec4899);border-radius:999px;padding:2px 10px}
.foot{padding:48px 0 56px;text-align:center;color:#8a90a2;font-size:12px}
`, `<div class="head"><div class="in">
<div class="badges"><span class="bd ok">● 已完成</span><span class="bd">A/B 实验</span><span class="bd">21 天</span><span class="bd">${esc(ab.traffic)}</span><span class="bd hot">主要指标显著</span><span class="bd">${esc(ab.owner)}</span></div>
<h1>${esc(ab.title)}</h1>
<div class="sub">${esc(ab.period)}　|　总样本 ${num(total)}</div>
<div class="verdict"><i>结论</i>${esc(ab.verdict)}</div>
</div></div>
<div class="in">
<div class="tiles">${M.map((m) => { const k = !m.significant ? "y" : m.lift > 0 ? "g" : "r"; return `<div class="tile ${k}">${m.primary ? '<span class="star">★ 主要指标</span>' : ""}<div class="top"><span class="ic">${m.lift > 0 ? "▲" : "▼"}</span><span class="tg">${m.significant ? "✓ 显著" : "不显著"}</span></div>
<div class="nm">${esc(m.name)}</div><div class="v">${pct(m.lift)}</div><div class="s">${m.control} → ${m.treatment}</div><div class="ci">CI ${m.ciLow} ~ ${m.ciHigh}</div></div>` }).join("")}</div>
<div class="grid">
<div class="card"><h2>支付转化率累计提升趋势<em>95% CI</em></h2>${line({ w: 704, h: 270, stroke: "#7c3aed", bandFill: "rgba(6,182,212,.16)", fill: "rgba(124,58,237,.10)", grid: "#eef0f6", text: "#8a90a2", size: 12, dots: true, width: 3, range: [-4, 16], pad: [16, 20, 24, 36] })}</div>
<div class="card"><h2>样本分布<em>50/50</em></h2><div class="donut"><div>总样本<b>${num(total)}</b></div></div>
<div class="leg"><div><span><i style="background:#7c3aed"></i>对照组</span><span>${num(S.control)}</span></div><div><span><i style="background:#06b6d4"></i>实验组</span><span>${num(S.treatment)}</span></div></div></div>
</div>
<div class="st">分群表现<em>HOT</em></div>
<div class="segs">${ab.segments.map((s, i) => { const g = [["#f97316", "#ec4899", "rgba(236,72,153,.5)"], ["#8b5cf6", "#6366f1", "rgba(99,102,241,.5)"], ["#06b6d4", "#3b82f6", "rgba(59,130,246,.5)"], ["#10b981", "#14b8a6", "rgba(20,184,166,.5)"]][i]; return `<div class="seg" style="background:linear-gradient(145deg,${g[0]},${g[1]});--sh:${g[2]}"><div class="nm">${esc(s.name)}${s === segMax ? "<span>最高</span>" : ""}</div><b>${pct(s.lift)}</b><small>${s.control} → ${s.treatment}</small></div>` }).join("")}</div>
<div class="st">下一步行动<em>TODO</em></div>
<div class="next">${ab.next.map((n, i) => `<div class="nx" style="--c:${["#7c3aed", "#f97316", "#06b6d4"][i]}"><i>${i + 1}</i><b>${esc(n.title)}</b><span>${esc(n.detail)}</span></div>`).join("")}</div>
<div class="foot">${esc(ab.owner)} · ${esc(ab.title)}</div>
</div>`),

  // 双栏 结论—证据: the decision and next steps on the left, the evidence on the right.
  e: doc(`
body{background:#f7f6f2;color:#1b1d1c;font-family:"Noto Sans SC",sans-serif;font-size:15px;line-height:1.7}
.wrap{width:1152px;margin:0 auto;display:grid;grid-template-columns:448px 1fr;gap:0;padding:64px 0 88px}
.l{padding-right:56px;border-right:1px solid #dcd9d0}
.r{padding-left:56px;min-width:0}
.k{font-size:12px;letter-spacing:.14em;color:#6f716b}
.l h1{font-size:15px;font-weight:500;color:#4c4f49;margin-top:10px}
.say{font-family:"Noto Serif SC",serif;font-weight:600;font-size:26px;line-height:42px;margin-top:20px}
.fig{margin-top:36px;padding:24px 0;border-top:2px solid #1b1d1c;border-bottom:1px solid #dcd9d0}
.fig .lab{font-size:13px;color:#6f716b}
.fig .big{font-family:"Noto Serif SC",serif;font-weight:600;font-size:80px;line-height:96px;color:#0f6b4f;margin-top:4px}
.fig .ci{font-size:14px;color:#4c4f49}
.fig .ci b{font-family:"IBM Plex Mono",monospace;font-weight:500}
.fig .vs{display:flex;gap:32px;margin-top:16px;font-size:13px;color:#6f716b}
.fig .vs b{display:block;font-family:"IBM Plex Mono",monospace;font-weight:500;font-size:18px;color:#1b1d1c}
.dec{display:inline-flex;align-items:center;gap:10px;margin-top:24px;background:#0f6b4f;color:#fff;border-radius:6px;padding:8px 16px;font-weight:500}
.dec:before{content:"";width:8px;height:8px;border-radius:50%;background:#9ee6c7}
h2{font-size:13px;letter-spacing:.14em;color:#6f716b;font-weight:500;margin-top:48px}
.steps{margin-top:14px;display:flex;flex-direction:column}
.steps div{display:grid;grid-template-columns:32px 1fr;padding:14px 0;border-top:1px solid #dcd9d0}
.steps i{font-style:normal;font-family:"IBM Plex Mono",monospace;font-size:13px;color:#0f6b4f;padding-top:2px}
.steps b{display:block;font-weight:500}.steps span{font-size:14px;color:#5a5d57}
.meta{margin-top:40px;display:grid;grid-template-columns:72px 1fr;row-gap:8px;font-size:13px;color:#4c4f49}
.meta dt{color:#8a8c86}
.ev{display:flex;align-items:baseline;gap:14px;padding-bottom:12px;border-bottom:1px solid #dcd9d0}
.ev i{font-style:normal;font-family:"IBM Plex Mono",monospace;font-size:13px;color:#0f6b4f}
.ev h3{font-size:19px;font-weight:600}
.ev em{font-style:normal;margin-left:auto;font-size:13px;color:#8a8c86}
.blk+.blk{margin-top:56px}
.blk p{font-size:14px;color:#4c4f49;margin-top:14px}
.chart{margin-top:20px}
table{font-size:14px;margin-top:8px}
th{font-weight:400;font-size:12px;color:#8a8c86;text-align:left;padding:10px 0 8px}
td{padding:10px 0;border-top:1px solid #e6e3da;vertical-align:middle}
.n{text-align:right;font-family:"IBM Plex Mono",monospace;font-size:13px}
.ns{color:#9aa1a8}
th.n{font-family:inherit;font-size:12px}
.segs{display:grid;grid-template-columns:1fr 1fr;gap:16px 40px;margin-top:20px;font-size:14px}
.segs .s{display:grid;grid-template-columns:1fr auto;row-gap:6px}
.segs .s b{font-weight:500}.segs .s span{font-family:"IBM Plex Mono",monospace;font-size:14px;color:#0f6b4f;font-weight:500}
.segs .s small{grid-column:1/-1;font-size:12px;color:#8a8c86}
.segs .t{grid-column:1/-1;height:6px;background:#e9e6dd;border-radius:3px}.segs .t i{display:block;height:100%;background:#0f6b4f;border-radius:3px}
`, `<div class="wrap">
<aside class="l">
<div class="k">结论</div>
<h1>${esc(ab.title)}</h1>
<p class="say">${esc(verdictMain)}</p>
<div class="fig"><div class="lab">支付转化率 · 相对提升</div><div class="big">${pct(P.lift)}</div>
<div class="ci">95% 置信区间 <b>${ciPct(P)}</b>，${sig(P)}</div>
<div class="vs"><div>对照组<b>${P.control}</b></div><div>实验组<b>${P.treatment}</b></div><div>样本合计<b>${num(total)}</b></div></div></div>
<div class="dec">${esc(verdictAdvice)}</div>
<h2>下一步</h2>
<div class="steps">${ab.next.map((n, i) => `<div><i>0${i + 1}</i><p><b>${esc(n.title)}</b><span>${esc(n.detail)}</span></p></div>`).join("")}</div>
<dl class="meta"><dt>负责团队</dt><dd>${esc(ab.owner)}</dd><dt>实验周期</dt><dd>${esc(ab.period)}</dd><dt>分流</dt><dd>${esc(ab.traffic)}</dd></dl>
</aside>
<main class="r">
<div class="k">证据</div>
<div class="blk" style="margin-top:22px"><div class="ev"><i>E1</i><h3>提升随时间收敛并稳定</h3><em>支付转化率累计提升，%</em></div>
<div class="chart">${line({ w: 648, h: 250, stroke: "#0f6b4f", bandFill: "rgba(15,107,79,.12)", grid: "#e6e3da", text: "#8a8c86", font: "'IBM Plex Mono',monospace", size: 11, pad: [16, 20, 24, 32] })}</div>
<p>阴影为 95% 置信区间。前 5 天区间仍跨过 0，第 ${firstSafe} 天起下限持续为正，第 21 天收窄到 ${pct(last.low)} ~ ${pct(last.high)}。</p></div>
<div class="blk"><div class="ev"><i>E2</i><h3>三项指标显著改善，退款率待观察</h3></div>
<table style="table-layout:fixed"><colgroup><col style="width:124px"><col style="width:92px"><col style="width:92px"><col style="width:76px"><col></colgroup><tr><th>指标</th><th class="n">对照组</th><th class="n">实验组</th><th class="n">提升</th><th style="padding-left:24px">${scaleHead()}</th></tr>
${M.map((m) => `<tr><td${m.primary ? ' style="font-weight:500"' : ""}>${esc(m.name)}</td><td class="n">${m.control}</td><td class="n">${m.treatment}</td><td class="n${m.significant ? "" : " ns"}">${pct(m.lift)}</td><td style="padding-left:24px">${strip(m)}</td></tr>`).join("")}</table>
<p>条形为 95% 置信区间，灰色表示区间包含 0。跳出率下降为改善；客单价与退款率无显著差异。</p></div>
<div class="blk"><div class="ev"><i>E3</i><h3>各分群均为正向，新用户最高</h3><em>支付转化率相对提升</em></div>
<div class="segs">${ab.segments.map((s) => `<div class="s"><b>${esc(s.name)}</b><span>${pct(s.lift)}</span><div class="t"><i style="width:${(s.lift / 8) * 100}%"></i></div><small>${s.control} → ${s.treatment}</small></div>`).join("")}</div></div>
</main></div>`),
}
