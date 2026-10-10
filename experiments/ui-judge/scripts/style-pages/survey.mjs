// 会员体验调研报告 in five styles: warm rounded, academic paper, quote-led editorial,
// masonry cards (busy), dark neon (flashy, weakest).
import { readData, doc, esc, num, bars as kitBars } from "../style-kit.mjs"

const s = readData("survey")
const sign = (c) => (c.startsWith("−") ? "neg" : c.startsWith("+") ? "pos" : "zero")
const q = s.quotes
const sat = s.satisfaction
const pains = s.pains
const sat0 = (name) => sat.find((x) => x.name === name)
const pain0 = (name) => pains.find((x) => x.name === name)

// ---------------------------------------------------------------- a 温暖圆角
const A_PASTEL = ["#fde3d3", "#dcefe2", "#e5e0f6", "#fbefc8"]
const a = doc(`
body{background:#f8f1e5;color:#3b322a;font-family:"Noto Sans SC",sans-serif;font-size:15px;line-height:1.7;text-wrap:pretty}
.wrap{width:1104px;margin:0 auto;padding:72px 0 96px}
.chip{display:inline-flex;gap:10px;align-items:center;background:#fde3d3;color:#a5532c;border-radius:999px;padding:5px 16px;font-size:13px;font-weight:500}
.chip i{width:6px;height:6px;border-radius:50%;background:#e98a5c}
h1{font-size:44px;line-height:58px;font-weight:600;margin-top:20px;letter-spacing:.01em}
.lead{font-size:18px;line-height:32px;color:#6b5e51;max-width:960px;margin-top:14px}
.panel{background:#fffbf4;border:1px solid #f0e4d1;border-radius:20px;padding:28px 32px;box-shadow:0 10px 30px -18px rgba(140,100,50,.35)}
.panel h2{font-size:17px;font-weight:600;display:flex;align-items:center;gap:10px;margin-bottom:20px}
.panel h2 small{font-size:13px;font-weight:400;color:#9a8b7b;margin-left:auto}
.dot{width:10px;height:10px;border-radius:4px;flex:none}
.row{display:grid;gap:20px;margin-top:20px}
.r1{grid-template-columns:1.35fr 1fr;margin-top:44px}.r2{grid-template-columns:1fr 1fr}
.big{display:flex;align-items:flex-end;gap:16px}
.big b{font-size:76px;line-height:76px;font-weight:600;letter-spacing:-.02em}
.pill{display:inline-block;font-size:13px;line-height:22px;border-radius:999px;padding:0 10px;font-weight:500;white-space:nowrap}
.pos{background:#dcefe2;color:#2f7650}.neg{background:#fbe0d7;color:#b04f35}.zero{background:#efe7da;color:#8a7c6c}
.stack{display:flex;height:18px;border-radius:999px;overflow:hidden;margin-top:28px;gap:3px}
.stack span:nth-child(1){background:#9fd3b6}.stack span:nth-child(2){background:#f5d88e}.stack span:nth-child(3){background:#f2a58f}
.legend{display:flex;gap:28px;margin-top:14px;font-size:14px;color:#6b5e51}.legend span{display:flex;align-items:center;gap:8px}
.legend b{color:#3b322a;font-weight:600}
.note{font-size:13px;color:#9a8b7b;margin-top:18px}
.samp{display:flex;flex-direction:column;gap:14px}
.samp div{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#f8f1e5;border-radius:14px;padding:12px 20px}
.samp b{font-size:28px;line-height:36px;font-weight:600;order:2}.samp span{color:#6b5e51}
.sat{display:flex;flex-direction:column;gap:16px}
.sat div{display:grid;grid-template-columns:76px 1fr 32px 56px;gap:12px;align-items:center}
.track{height:10px;background:#f1e8da;border-radius:999px}.track i{display:block;height:100%;border-radius:999px;background:#f0b48d}
.sat .lo{background:#ee9a85}.sat .hi{background:#93cdb0}
.num{font-variant-numeric:tabular-nums}.sat .pill{text-align:center}
.segs{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.seg{border-radius:20px;padding:22px 24px}
.seg h3{font-size:14px;font-weight:500;color:#5a4e42}
.seg b{display:block;font-size:40px;line-height:50px;font-weight:600;margin-top:10px}
.seg b small{font-size:13px;font-weight:400;color:#6b5e51;margin-left:6px}
.seg p{display:flex;justify-content:space-between;font-size:13px;color:#6b5e51;margin-top:8px;border-top:1px dashed rgba(90,70,50,.2);padding-top:10px}
.quotes{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.qt{background:#fffbf4;border:1px solid #f0e4d1;border-radius:20px;padding:24px 28px 22px 72px;position:relative}
.qt:before{content:"“";position:absolute;left:24px;top:12px;font-family:"Noto Serif SC",serif;font-size:56px;line-height:56px;color:#f0b48d}
.qt p{font-size:17px;line-height:30px}.qt span{display:block;font-size:13px;color:#9a8b7b;margin-top:10px}
.recs{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.rec{background:#fffbf4;border:1px solid #f0e4d1;border-radius:20px;padding:26px 28px}
.rec i{display:inline-flex;width:34px;height:34px;border-radius:12px;align-items:center;justify-content:center;font-style:normal;font-weight:600}
.rec h3{font-size:18px;font-weight:600;margin-top:16px}.rec p{color:#6b5e51;margin-top:6px}
.sec{font-size:22px;font-weight:600;margin:56px 0 18px}
`, `<div class="wrap">
<span class="chip"><i></i>${esc(s.team)} · ${esc(s.period)}</span>
<h1>${esc(s.title)}</h1><p class="lead">${esc(s.summary)}</p>
<div class="row r1">
<div class="panel"><h2><span class="dot" style="background:#9fd3b6"></span>净推荐值<small>取值范围 −100 至 100</small></h2>
<div class="big"><b class="num">${s.nps.score}</b><span class="pill pos" style="margin-bottom:10px">比上次 ${s.nps.change}</span></div>
<div class="stack"><span style="width:${s.nps.promoters}%"></span><span style="width:${s.nps.passives}%"></span><span style="width:${s.nps.detractors}%"></span></div>
<div class="legend"><span><span class="dot" style="background:#9fd3b6"></span>推荐者 <b>${s.nps.promoters}%</b></span><span><span class="dot" style="background:#f5d88e"></span>中立者 <b>${s.nps.passives}%</b></span><span><span class="dot" style="background:#f2a58f"></span>贬损者 <b>${s.nps.detractors}%</b></span></div>
<p class="note">净推荐值 = 推荐者占比 − 贬损者占比 = ${s.nps.promoters} − ${s.nps.detractors}</p></div>
<div class="panel"><h2><span class="dot" style="background:#c9bff0"></span>这次听了谁的声音</h2>
<div class="samp"><div><b class="num">${num(s.sample.responses)}</b><span>有效问卷（份）</span></div><div><b class="num">${s.sample.interviews}</b><span>会员深度访谈（位）</span></div><div><b class="num">${s.sample.rate}%</b><span>问卷回收率</span></div></div></div>
</div>
<div class="row r2">
<div class="panel"><h2><span class="dot" style="background:#f0b48d"></span>各项满意度<small>5 分制 · 较上次</small></h2>
<div class="sat">${sat.map((x) => `<div><span>${esc(x.name)}</span><span class="track"><i class="${x.score >= 4.3 ? "hi" : x.score < 3.5 ? "lo" : ""}" style="width:${(x.score / 5) * 100}%"></i></span><span class="num" style="text-align:right;font-weight:600">${x.score.toFixed(1)}</span><span class="pill ${sign(x.change)}">${x.change}</span></div>`).join("")}</div></div>
<div class="panel"><h2><span class="dot" style="background:#f2a58f"></span>大家最常提到的不满<small>提及比例</small></h2>
${kitBars(pains.map((p) => ({ label: p.name, value: p.share, display: `${p.share}%` })), { max: 40, color: "#f2a58f", track: "#f1e8da", h: 10, radius: 999, labelW: 112, valueW: 44, gap: 20 })}
<p class="note" style="margin-top:22px">“退款要等太久”是最集中的抱怨，约每 5 位受访会员就有 2 位提到。</p></div>
</div>
<div class="sec">不同会员的感受</div>
<div class="segs">${s.segments.map((g, i) => `<div class="seg" style="background:${A_PASTEL[i]}"><h3>${esc(g.name)}</h3><b class="num">${g.nps}<small>净推荐值</small></b><p><span>满意度 ${g.csat.toFixed(1)}</span><span class="num">${num(g.n)} 人</span></p></div>`).join("")}</div>
<div class="sec">会员原话</div>
<div class="quotes">${q.map((x) => `<div class="qt"><p>${esc(x.text)}</p><span>${esc(x.who)}</span></div>`).join("")}</div>
<div class="sec">我们打算这样做</div>
<div class="recs">${s.recommendations.map((r, i) => `<div class="rec"><i style="background:${A_PASTEL[i]}">${i + 1}</i><h3>${esc(r.title)}</h3><p>${esc(r.detail)}</p></div>`).join("")}</div>
</div>`)

// ---------------------------------------------------------------- b 学术论文风
const B_W = 760
const fig1 = (() => {
  const h = 70, top = 8, bh = 34
  const parts = [["推荐者", s.nps.promoters, "#3a3a3a", "#fff"], ["中立者", s.nps.passives, "#9a9a9a", "#fff"], ["贬损者", s.nps.detractors, "#dcdcdc", "#222"]]
  let x = 0
  const segs = parts.map(([n, v, f, t]) => {
    const w = (v / 100) * B_W, x0 = x
    x += w
    return `<rect x="${x0}" y="${top}" width="${w}" height="${bh}" fill="${f}" stroke="#222" stroke-width="1"/><text x="${x0 + w / 2}" y="${top + 22}" text-anchor="middle" fill="${t}">${n} ${v}%</text>`
  }).join("")
  const ticks = [0, 25, 50, 75, 100].map((v) => `<line x1="${(v / 100) * (B_W - 1) + .5}" x2="${(v / 100) * (B_W - 1) + .5}" y1="${top + bh}" y2="${top + bh + 5}" stroke="#222"/><text x="${Math.min(Math.max((v / 100) * B_W, 10), B_W - 16)}" y="${h - 2}" text-anchor="middle">${v}%</text>`).join("")
  return `<svg width="${B_W}" height="${h}" viewBox="0 0 ${B_W} ${h}" style="display:block;font-family:'Noto Serif SC',serif;font-size:13px;fill:#222">${segs}${ticks}</svg>`
})()
const fig2 = (() => {
  const lw = 132, pr = 40, rowH = 34, top = 6, w = B_W, plotW = w - lw - pr, h = top + pains.length * rowH + 30
  const xs = (v) => lw + (v / 40) * plotW
  const grid = [0, 10, 20, 30, 40].map((v) => `<line x1="${xs(v)}" x2="${xs(v)}" y1="${top}" y2="${top + pains.length * rowH}" stroke="${v ? "#ddd" : "#222"}"/><text x="${xs(v)}" y="${h - 6}" text-anchor="middle">${v}%</text>`).join("")
  const rows = pains.map((p, i) => {
    const y = top + i * rowH
    return `<text x="${lw - 12}" y="${y + 22}" text-anchor="end">${esc(p.name)}</text><rect x="${lw}" y="${y + 8}" width="${xs(p.share) - lw}" height="18" fill="#5a5a5a"/><text x="${xs(p.share) + 6}" y="${y + 22}">${p.share}</text>`
  }).join("")
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;font-family:'Noto Serif SC',serif;font-size:13px;fill:#222">${grid}${rows}<line x1="${lw}" x2="${w - pr}" y1="${top + pains.length * rowH}" y2="${top + pains.length * rowH}" stroke="#222"/></svg>`
})()
const b = doc(`
body{background:#e8e6e1;color:#1a1a1a;font-family:"Noto Serif SC",serif;font-size:16px;line-height:1.9;text-wrap:pretty}
.paper{width:960px;margin:56px auto 72px;background:#fff;padding:72px 100px 64px;box-shadow:0 1px 3px rgba(0,0,0,.12),0 12px 32px -16px rgba(0,0,0,.25)}
.run{display:flex;justify-content:space-between;font-size:12px;color:#666;border-bottom:1px solid #999;padding-bottom:6px;margin-bottom:48px}
h1{font-size:30px;line-height:44px;font-weight:600;text-align:center}
.au{text-align:center;margin-top:14px;font-size:16px}.af{text-align:center;font-size:13px;color:#555;margin-top:2px}
.abs{margin-top:36px;border:1px solid #1a1a1a;padding:18px 24px 16px;font-size:14.5px;line-height:1.85}
.abs b{font-weight:600}.kw{margin-top:8px}
h2{font-size:19px;font-weight:600;margin:40px 0 12px}
h3{font-size:16px;font-weight:600;margin:24px 0 8px}
p{text-indent:2em;text-align:justify}
figure{margin:28px 0 24px}
figcaption,.cap{font-size:14px;text-align:center;margin-top:10px}
.cap{margin:24px 0 8px}
table{font-size:14.5px}
.tl{border-top:2px solid #1a1a1a;border-bottom:2px solid #1a1a1a}
.tl th{font-weight:600;border-bottom:1px solid #1a1a1a;padding:6px 12px;text-align:left}
.tl td{padding:5px 12px}
.tl .r{text-align:right}.num{font-variant-numeric:tabular-nums}
.tn{font-size:13px;color:#444;margin-top:6px}
blockquote{margin:12px 0 0 2em;padding-left:16px;border-left:2px solid #bbb;font-size:15px;line-height:1.8;color:#333}
blockquote span{display:block;text-align:right;font-size:13px;color:#666}
ol{list-style:none;counter-reset:r;margin-top:8px}
ol li{counter-increment:r;padding-left:2.4em;position:relative;margin-top:6px}
ol li:before{content:"（" counter(r) "）";position:absolute;left:0}
.ref{margin-top:48px;border-top:1px solid #999;padding-top:10px;font-size:12.5px;color:#555;line-height:1.7}
`, `<div class="paper">
<div class="run"><span>${esc(s.team)} · 调研报告</span><span>${esc(s.period)}</span></div>
<h1>${esc(s.title)}</h1>
<div class="au">${esc(s.team)}</div><div class="af">调研时间：${esc(s.period)}</div>
<div class="abs"><b>摘要：</b>本文基于 ${num(s.sample.responses)} 份有效问卷（回收率 ${s.sample.rate}%）与 ${s.sample.interviews} 位会员的深度访谈，考察会员对配送、商品、价格、App、客服与退款六个方面的评价。结果显示，会员净推荐值为 ${s.nps.score}，比上次调研高 ${s.nps.change.replace("+", "")} 分；配送准时得分最高（${sat[0].score}），退款流程得分最低（${sat[5].score}），且降幅最大（${sat[5].change}）。不满集中在老会员与低频会员。据此提出小额退款免审、缺货替换先确认与老会员优先客服三项建议。
<div class="kw"><b>关键词：</b>净推荐值；满意度；退款流程；客服响应；会员分群</div></div>

<h2>1. 调研方法</h2>
<p>本次调研于 ${esc(s.period)}进行，面向全体会员发放线上问卷，共回收有效问卷 ${num(s.sample.responses)} 份，回收率为 ${s.sample.rate}%。另从受访者中选取 ${s.sample.interviews} 位会员进行深度访谈，用于解释问卷中的评分差异。满意度采用 5 分制，净推荐值按推荐者占比减去贬损者占比计算。</p>

<h2>2. 结果</h2>
<h3>2.1 净推荐值</h3>
<p>受访会员中推荐者占 ${s.nps.promoters}%，中立者占 ${s.nps.passives}%，贬损者占 ${s.nps.detractors}%，净推荐值为 ${s.nps.score}（见图 1），比上次调研提高 ${s.nps.change.replace("+", "")} 分。</p>
<figure>${fig1}<figcaption>图 1　推荐者、中立者与贬损者占比（n = ${num(s.sample.responses)}）</figcaption></figure>
<h3>2.2 各维度满意度</h3>
<p>六个维度中，配送准时与商品新鲜得分在 4.3 分以上；客服响应与退款流程低于 3.5 分，且均较上次下降（见表 1）。App 好用的提升幅度最大，为 ${sat0("App 好用").change} 分。</p>
<div class="cap">表 1　各维度满意度得分</div>
<table class="tl"><tr><th>维度</th><th class="r">得分</th><th class="r">较上次</th><th class="r">排序</th></tr>${sat.map((x, i) => `<tr><td>${esc(x.name)}</td><td class="r num">${x.score.toFixed(1)}</td><td class="r num">${x.change}</td><td class="r num">${i + 1}</td></tr>`).join("")}</table>
<div class="tn">注：得分为 5 分制均值，“较上次”为与上次调研得分之差。</div>
<h3>2.3 主要不满</h3>
<p>在开放题中，提及最多的不满是“退款要等太久”（${pains[0].share}%），其次为“客服排队长”（${pains[1].share}%），二者均与满意度最低的两个维度对应（见图 2）。</p>
<figure>${fig2}<figcaption>图 2　各项不满的提及比例（%）</figcaption></figure>
<h3>2.4 会员分群</h3>
<p>新会员的净推荐值最高（${s.segments[0].nps}），老会员与低频会员明显偏低，分别为 ${s.segments[1].nps} 与 ${s.segments[3].nps}（见表 2）。</p>
<div class="cap">表 2　不同会员分群的评价</div>
<table class="tl"><tr><th>分群</th><th class="r">样本量</th><th class="r">净推荐值</th><th class="r">满意度</th></tr>${s.segments.map((g) => `<tr><td>${esc(g.name)}</td><td class="r num">${num(g.n)}</td><td class="r num">${g.nps}</td><td class="r num">${g.csat.toFixed(1)}</td></tr>`).join("")}</table>
<div class="tn">注：按入会时长与下单频次两种口径分群，口径之间有重叠，样本量之和不等于总样本。</div>

<h2>3. 访谈摘录</h2>
<p>深度访谈中的典型表述如下，可与上述评分相互印证。</p>
${q.map((x) => `<blockquote>${esc(x.text)}<span>——${esc(x.who)}</span></blockquote>`).join("")}

<h2>4. 建议</h2>
<p>针对退款、缺货替换与客服三类问题，提出以下建议：</p>
<ol>${s.recommendations.map((r) => `<li><b>${esc(r.title)}。</b>${esc(r.detail)}</li>`).join("")}</ol>
<div class="ref">数据来源：${esc(s.team)}会员体验问卷与深度访谈，${esc(s.period)}。</div>
</div>`)

// ---------------------------------------------------------------- c 引语主导
const c = doc(`
body{background:#f3efe7;color:#121110;font-family:"Noto Sans SC",sans-serif;font-size:14px;line-height:1.7;text-wrap:pretty}
.in{width:1152px;margin:0 auto}
.mast{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #121110;padding:28px 0 12px;font-size:12px;letter-spacing:.16em}
.mast b{font-weight:600}
.kick{font-size:12px;letter-spacing:.2em;color:#c2361b;font-weight:600}
.hero{padding:88px 0 72px;position:relative}
.qm{font-family:"Noto Serif SC",serif;font-weight:600;color:#c2361b;font-size:200px;line-height:200px;height:104px;display:block;margin:28px 0 0 -10px}
.q1{font-family:"Noto Serif SC",serif;font-weight:600;font-size:84px;line-height:116px;letter-spacing:-.01em;width:1100px}
.who{font-size:14px;letter-spacing:.12em;margin-top:28px;color:#5d574f}
.who:before{content:"";display:inline-block;width:40px;height:1px;background:#121110;vertical-align:middle;margin-right:14px}
.facts{display:grid;grid-template-columns:repeat(3,1fr);border-top:3px solid #121110;margin-top:64px}
.facts div{padding:20px 28px 0 0}.facts div+div{padding-left:28px;border-left:1px solid #bdb5a8}
.facts b{display:block;font-weight:300;font-size:56px;line-height:64px;letter-spacing:-.02em}
.facts span{display:block;color:#5d574f;margin-top:6px;font-size:14px}
.red{color:#c2361b}
.band{background:#121110;color:#f3efe7}
.band .in{display:grid;grid-template-columns:260px 1fr;gap:64px;padding:96px 0;align-items:center}
.side{border-top:1px solid #f3efe7;padding-top:18px}
.side .kick{color:#ef8a6f}
.side b{display:block;font-weight:300;font-size:88px;line-height:96px;margin-top:20px;letter-spacing:-.03em}
.side b small{font-size:20px;margin-left:8px;letter-spacing:0}
.side span{display:block;font-size:14px;color:#b7afa3}
.q2{font-family:"Noto Serif SC",serif;font-weight:600;font-size:68px;line-height:100px;text-indent:-.5em}
.band .who{color:#b7afa3}.band .who:before{background:#f3efe7}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:72px;padding:96px 0 80px;border-bottom:1px solid #121110}
.pair>div{display:flex;flex-direction:column}.pair .stat{margin-top:auto}.pair .who{margin-bottom:36px}
.pair .q3{font-family:"Noto Serif SC",serif;font-weight:600;font-size:44px;line-height:64px;margin-top:20px}
.pair .q3:before{content:"“";color:#c2361b;margin-left:-.5em}
.stat{display:flex;gap:24px;margin-top:32px;border-top:1px solid #121110;padding-top:16px}
.stat div{flex:1}.stat b{display:block;font-size:40px;line-height:48px;font-weight:300}
.stat span{color:#5d574f;font-size:13px}
.data{display:grid;grid-template-columns:1fr 1fr 1fr;gap:48px;padding:56px 0 64px}
.data h4{font-size:12px;letter-spacing:.2em;font-weight:600;border-bottom:1px solid #121110;padding-bottom:8px;margin-bottom:14px}
td,th{padding:6px 0;border-bottom:1px solid #d6cfc3;text-align:left;font-weight:400;font-size:13.5px}th{color:#5d574f;font-size:12px}
.r{text-align:right}.num{font-variant-numeric:tabular-nums}
.stk{display:flex;height:10px;margin:8px 0 12px}.stk span:nth-child(1){background:#121110}.stk span:nth-child(2){background:#bdb5a8}.stk span:nth-child(3){background:#c2361b}
.lg{display:flex;justify-content:space-between;font-size:13px;color:#5d574f}
.recs{display:grid;grid-template-columns:repeat(3,1fr);gap:48px;padding:0 0 104px}
.recs i{font-style:normal;font-family:"Noto Serif SC",serif;font-size:15px;color:#c2361b}
.recs h3{font-family:"Noto Serif SC",serif;font-weight:600;font-size:28px;line-height:40px;margin-top:6px}
.recs p{color:#3d3832;margin-top:10px;font-size:15px;line-height:1.8}
.rh{display:flex;justify-content:space-between;align-items:baseline;border-top:3px solid #121110;padding-top:14px;margin-bottom:36px}
.rh h2{font-family:"Noto Serif SC",serif;font-weight:600;font-size:22px}
`, `<div class="in"><div class="mast"><b>${esc(s.title)}</b><span>${esc(s.team)} ／ ${esc(s.period)}</span><span>${num(s.sample.responses)} 份问卷 · ${s.sample.interviews} 位深访</span></div>
<div class="hero"><div class="kick">最大的不满：退款</div><span class="qm">“</span>
<div class="q1">${esc(q[0].text)}</div><div class="who">${esc(q[0].who)}</div>
<div class="facts"><div><b class="num red">${sat0("退款流程").score}</b><span>退款流程满意度，六个维度中最低</span></div><div><b class="num">${sat0("退款流程").change}</b><span>较上次调研，降幅最大</span></div><div><b class="num">${pain0("退款要等太久").share}%</b><span>受访会员提到“退款要等太久”</span></div></div></div></div>
<div class="band"><div class="in"><div class="side"><div class="kick">最受认可：配送</div><b class="num">${sat0("配送准时").score}<small>${sat0("配送准时").change}</small></b><span>配送准时满意度，六个维度中最高</span>
<b class="num" style="margin-top:36px">${s.nps.score}<small>${s.nps.change}</small></b><span>净推荐值，比上次调研高 ${s.nps.change.replace("+", "")} 分</span></div>
<div><div class="q2">“${esc(q[1].text).replace("，", "，<br>")}”</div><div class="who">${esc(q[1].who)}</div></div></div></div>
<div class="in"><div class="pair">
<div><div class="kick">缺货替换</div><div class="q3">${esc(q[2].text).replace("，", "，<br>")}”</div><div class="who">${esc(q[2].who)}</div>
<div class="stat"><div><b class="num">${pain0("缺货替换不提醒").share}%</b><span>提到缺货替换不提醒</span></div><div><b class="num">${s.segments[1].nps}</b><span>老会员净推荐值，低于整体 ${s.nps.score - s.segments[1].nps} 分</span></div></div></div>
<div><div class="kick">客服</div><div class="q3">${esc(q[3].text).replace("，", "，<br>").replace("里找", "里<br>找")}”</div><div class="who">${esc(q[3].who)}</div>
<div class="stat"><div><b class="num">${pain0("客服排队长").share}%</b><span>提到客服排队长</span></div><div><b class="num">${sat0("客服响应").score}</b><span>客服响应满意度，较上次 ${sat0("客服响应").change}</span></div></div></div>
</div>
<div class="data">
<div><h4>净推荐值构成</h4><div style="font-size:15px">推荐者减去贬损者：${s.nps.promoters}% − ${s.nps.detractors}% = <b>${s.nps.score}</b></div>
<div class="stk"><span style="width:${s.nps.promoters}%"></span><span style="width:${s.nps.passives}%"></span><span style="width:${s.nps.detractors}%"></span></div>
<div class="lg"><span>推荐者 ${s.nps.promoters}%</span><span>中立者 ${s.nps.passives}%</span><span>贬损者 ${s.nps.detractors}%</span></div>
<div style="margin-top:22px;font-size:13px;color:#5d574f">问卷回收率 ${s.sample.rate}%，另有 ${s.sample.interviews} 位会员接受深度访谈。</div></div>
<div><h4>六项满意度（5 分制）</h4><table><tr><th>维度</th><th class="r">得分</th><th class="r">较上次</th></tr>${sat.map((x) => `<tr><td>${esc(x.name)}</td><td class="r num">${x.score.toFixed(1)}</td><td class="r num ${sign(x.change) === "neg" ? "red" : ""}">${x.change}</td></tr>`).join("")}</table></div>
<div><h4>会员分群</h4><table><tr><th>分群</th><th class="r">人数</th><th class="r">净推荐值</th><th class="r">满意度</th></tr>${s.segments.map((g) => `<tr><td>${esc(g.name.replace(/（.*）/, ""))}</td><td class="r num">${num(g.n)}</td><td class="r num ${g.nps < 30 ? "red" : ""}">${g.nps}</td><td class="r num">${g.csat.toFixed(1)}</td></tr>`).join("")}</table>
<div style="margin-top:12px;font-size:12px;color:#5d574f;line-height:1.6">新会员指半年内入会，老会员一年以上；高频为每周 2 单以上，低频为每月 2 单以下。</div></div>
</div>
<div class="rh"><h2>接下来做什么</h2><span class="kick">三项建议</span></div>
<div class="recs">${s.recommendations.map((r, i) => `<div><i>0${i + 1}</i><h3>${esc(r.title)}</h3><p>${esc(r.detail)}</p></div>`).join("")}</div>
</div>`)

// ---------------------------------------------------------------- d 卡片瀑布流
const D_COL = ["#3b82f6", "#f97316", "#10b981", "#8b5cf6", "#ec4899", "#14b8a6", "#eab308", "#ef4444"]
let di = 0
const dc = () => D_COL[di++ % D_COL.length]
const card = (tag, inner, extra = "") => { const k = dc(); return `<div class="c" style="--k:${k};${extra}"><span class="tag">${tag}</span>${inner}</div>` }
const d = doc(`
body{background:#eef1f6;color:#1f2937;font-family:"Noto Sans SC",sans-serif;font-size:14px;line-height:1.6}
.wrap{width:1152px;margin:0 auto;padding:36px 0 56px}
.bar{display:flex;align-items:center;gap:10px;margin-bottom:22px;flex-wrap:wrap}
.bar b{font-size:20px;font-weight:600;margin-right:12px}
.bar span{font-size:13px;border-radius:999px;padding:3px 14px;background:#fff;border:1px solid #d6dbe4;color:#4b5563}
.bar span.on{background:#1f2937;color:#fff;border-color:#1f2937}
.bar em{margin-left:auto;font-style:normal;font-size:12px;color:#6b7280}
.grid{column-count:3;column-gap:18px}
.c{break-inside:avoid;background:#fff;border-radius:12px;padding:16px 18px 18px;margin-bottom:18px;border-top:4px solid var(--k);box-shadow:0 2px 6px rgba(15,23,42,.08)}
.tag{display:inline-block;font-size:11px;font-weight:500;border-radius:4px;padding:0 8px;line-height:20px;color:var(--k);background:color-mix(in srgb,var(--k) 12%,#fff)}
.c h3{font-size:15px;font-weight:600;margin-top:8px}
.c .v{font-size:42px;line-height:52px;font-weight:600;color:var(--k);margin-top:6px}
.c .v small{font-size:15px;font-weight:500;margin-left:4px;color:#6b7280}
.c p{color:#4b5563;margin-top:6px}
.c .mini{height:8px;border-radius:4px;background:#eef1f6;margin-top:10px}.c .mini i{display:block;height:100%;border-radius:4px;background:var(--k)}
.up{color:#059669;font-weight:500}.dn{color:#dc2626;font-weight:500}.fl{color:#6b7280;font-weight:500}
.hero{background:linear-gradient(135deg,#6366f1,#ec4899);color:#fff;border-top:0}
.hero h1{font-size:30px;line-height:40px;font-weight:600;margin-top:10px}.hero p{color:rgba(255,255,255,.88)}
.hero .tag{background:rgba(255,255,255,.2);color:#fff}
.quote{background:#fffbea}
.quote blockquote{font-size:17px;line-height:30px;margin-top:8px;font-weight:500}
.quote blockquote:before{content:"“";font-size:40px;line-height:0;vertical-align:-14px;color:var(--k);margin-right:4px;font-family:"Noto Serif SC",serif}
.rec{background:#f0fdf4}
.foot{font-size:12px;color:#9ca3af;margin-top:6px}
.stars{letter-spacing:2px;color:var(--k);font-size:16px;margin-top:4px}
`, `<div class="wrap">
<div class="bar"><b>调研看板</b>${["全部", "核心指标", "满意度", "痛点", "分群", "原话", "建议"].map((t, i) => `<span class="${i ? "" : "on"}">${t}</span>`).join("")}<em>共 31 张卡片 · ${esc(s.period)}</em></div>
<div class="grid">
${card("报告", `<h1>${esc(s.title)}</h1><p>${esc(s.team)}</p><p>${esc(s.summary)}</p>`).replace('class="c"', 'class="c hero"')}
${card("核心", `<h3>净推荐值</h3><div class="v">${s.nps.score}</div><p>比上次调研 <span class="up">${s.nps.change}</span></p>`)}
${card("样本", `<h3>有效问卷</h3><div class="v">${num(s.sample.responses)}<small>份</small></div>`)}
${q.slice(0, 1).map((x) => card("原话", `<blockquote>${esc(x.text)}</blockquote><div class="foot">${esc(x.who)}</div>`).replace('class="c"', 'class="c quote"')).join("")}
${card("推荐者", `<h3>推荐者占比</h3><div class="v">${s.nps.promoters}%</div><div class="mini"><i style="width:${s.nps.promoters}%"></i></div>`)}
${sat.slice(0, 2).map((x) => card("满意度", `<h3>${esc(x.name)}</h3><div class="v">${x.score.toFixed(1)}<small>/ 5</small></div><div class="stars">${"★".repeat(Math.round(x.score))}${"☆".repeat(5 - Math.round(x.score))}</div><p>较上次 <span class="${sign(x.change) === "pos" ? "up" : sign(x.change) === "neg" ? "dn" : "fl"}">${x.change}</span></p>`)).join("")}
${card("痛点 TOP1", `<h3>${esc(pains[0].name)}</h3><div class="v">${pains[0].share}%</div><p>受访会员提到这一点，排在所有不满的第一位。</p><div class="mini"><i style="width:${pains[0].share}%"></i></div>`)}
${card("样本", `<h3>深度访谈</h3><div class="v">${s.sample.interviews}<small>位</small></div>`)}
${card("中立者", `<h3>中立者占比</h3><div class="v">${s.nps.passives}%</div><div class="mini"><i style="width:${s.nps.passives}%"></i></div>`)}
${card("分群", `<h3>${esc(s.segments[0].name)}</h3><div class="v">${s.segments[0].nps}<small>NPS</small></div><p>${num(s.segments[0].n)} 人 · 满意度 ${s.segments[0].csat}</p>`)}
${s.recommendations.slice(0, 1).map((r, i) => card(`建议 ${i + 1}`, `<h3>${esc(r.title)}</h3><p>${esc(r.detail)}</p>`).replace('class="c"', 'class="c rec"')).join("")}
${sat.slice(2, 4).map((x) => card("满意度", `<h3>${esc(x.name)}</h3><div class="v">${x.score.toFixed(1)}<small>/ 5</small></div><p>较上次 <span class="${sign(x.change) === "pos" ? "up" : sign(x.change) === "neg" ? "dn" : "fl"}">${x.change}</span></p>`)).join("")}
${q.slice(1, 2).map((x) => card("原话", `<blockquote>${esc(x.text)}</blockquote><div class="foot">${esc(x.who)}</div>`).replace('class="c"', 'class="c quote"')).join("")}
${card("贬损者", `<h3>贬损者占比</h3><div class="v">${s.nps.detractors}%</div><div class="mini"><i style="width:${s.nps.detractors}%"></i></div><p>打 0 至 6 分的会员</p>`)}
${pains.slice(1, 3).map((p, i) => card(`痛点 TOP${i + 2}`, `<h3>${esc(p.name)}</h3><div class="v">${p.share}%</div><div class="mini"><i style="width:${p.share}%"></i></div>`)).join("")}
${card("分群", `<h3>${esc(s.segments[1].name)}</h3><div class="v">${s.segments[1].nps}<small>NPS</small></div><p>${num(s.segments[1].n)} 人 · 满意度 ${s.segments[1].csat}</p><p>四个分群中样本最多，净推荐值比新会员低 ${s.segments[0].nps - s.segments[1].nps} 分。</p>`)}
${card("样本", `<h3>问卷回收率</h3><div class="v">${s.sample.rate}%</div>`)}
${q.slice(2, 3).map((x) => card("原话", `<blockquote>${esc(x.text)}</blockquote><div class="foot">${esc(x.who)}</div>`).replace('class="c"', 'class="c quote"')).join("")}
${sat.slice(4, 6).map((x) => card("满意度", `<h3>${esc(x.name)}</h3><div class="v">${x.score.toFixed(1)}<small>/ 5</small></div><div class="stars">${"★".repeat(Math.round(x.score))}${"☆".repeat(5 - Math.round(x.score))}</div><p>较上次 <span class="dn">${x.change}</span></p>`)).join("")}
${s.recommendations.slice(1, 2).map((r) => card("建议 2", `<h3>${esc(r.title)}</h3><p>${esc(r.detail)}</p>`).replace('class="c"', 'class="c rec"')).join("")}
${card("分群", `<h3>${esc(s.segments[2].name)}</h3><div class="v">${s.segments[2].nps}<small>NPS</small></div><p>${num(s.segments[2].n)} 人 · 满意度 ${s.segments[2].csat}</p>`)}
${pains.slice(3).map((p, i) => card(`痛点 TOP${i + 4}`, `<h3>${esc(p.name)}</h3><div class="v">${p.share}%</div>`)).join("")}
${q.slice(3).map((x) => card("原话", `<blockquote>${esc(x.text)}</blockquote><div class="foot">${esc(x.who)}</div>`).replace('class="c"', 'class="c quote"')).join("")}
${card("分群", `<h3>${esc(s.segments[3].name)}</h3><div class="v">${s.segments[3].nps}<small>NPS</small></div><p>${num(s.segments[3].n)} 人 · 满意度 ${s.segments[3].csat}</p>`)}
${s.recommendations.slice(2).map((r) => card("建议 3", `<h3>${esc(r.title)}</h3><p>${esc(r.detail)}</p>`).replace('class="c"', 'class="c rec"')).join("")}
</div></div>`)

// ---------------------------------------------------------------- e 暗色霓虹
const ebar = (v, max) => `<div class="eb"><i style="width:${(v / max) * 100}%"></i></div>`
const e = doc(`
body{background:#05030b;color:#cfefff;font-family:"Noto Sans SC",sans-serif;font-size:14px;line-height:1.7;
background-image:radial-gradient(900px 600px at 10% -5%,rgba(255,40,210,.28),transparent 60%),radial-gradient(900px 700px at 95% 8%,rgba(0,230,255,.22),transparent 60%),radial-gradient(1000px 800px at 50% 100%,rgba(140,40,255,.22),transparent 60%),linear-gradient(rgba(0,230,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,230,255,.05) 1px,transparent 1px);
background-size:auto,auto,auto,40px 40px,40px 40px}
.mono{font-family:"IBM Plex Mono",monospace}
.wrap{width:1152px;margin:0 auto;padding:56px 0 80px}
.kick{font-family:"IBM Plex Mono",monospace;font-size:13px;color:#00e6ff;letter-spacing:.14em;text-shadow:0 0 8px rgba(0,230,255,.9)}
.grad{background:linear-gradient(90deg,#00e6ff,#a35cff 50%,#ff2bd6);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 10px rgba(255,43,214,.55)) drop-shadow(0 0 22px rgba(0,230,255,.35))}
h1{font-size:56px;line-height:72px;font-weight:600;margin-top:12px;letter-spacing:.02em}
.lead{color:#ff9cf0;margin-top:10px;font-size:16px;max-width:860px;text-shadow:0 0 10px rgba(255,43,214,.7)}
.p{background:rgba(12,6,30,.72);border:1px solid rgba(0,230,255,.55);border-radius:6px;padding:22px 24px;box-shadow:0 0 0 1px rgba(255,43,214,.18),0 0 26px rgba(0,230,255,.28),inset 0 0 28px rgba(0,230,255,.10)}
.p.m{border-color:rgba(255,43,214,.6);box-shadow:0 0 0 1px rgba(0,230,255,.15),0 0 26px rgba(255,43,214,.32),inset 0 0 28px rgba(255,43,214,.10)}
.p h2{font-family:"IBM Plex Mono","Noto Sans SC",monospace;font-size:14px;font-weight:500;letter-spacing:.16em;color:#ff5ce3;text-shadow:0 0 8px rgba(255,43,214,.9);margin-bottom:18px}
.p h2:before{content:"▍";color:#00e6ff;margin-right:6px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:40px}
.stats b{display:block;font-family:"IBM Plex Mono",monospace;font-weight:500;font-size:52px;line-height:64px}
.stats .lab{color:#8fb7c9;font-size:13px}
.stats em{font-style:normal;font-family:"IBM Plex Mono",monospace;color:#3dffa8;text-shadow:0 0 8px rgba(61,255,168,.9);margin-left:8px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px}
.eb{height:10px;background:rgba(255,255,255,.06);border-radius:999px;box-shadow:inset 0 0 0 1px rgba(0,230,255,.15)}
.eb i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#00e6ff,#ff2bd6);box-shadow:0 0 8px #ff2bd6,0 0 18px rgba(0,230,255,.8)}
.rows{display:flex;flex-direction:column;gap:16px}
.rows div{display:grid;grid-template-columns:110px 1fr 48px 52px;gap:14px;align-items:center}
.rows .v{font-family:"IBM Plex Mono",monospace;text-align:right;color:#fff;text-shadow:0 0 8px rgba(0,230,255,.9)}
.rows .d{font-family:"IBM Plex Mono",monospace;font-size:12px;text-align:right}
.pos{color:#3dffa8;text-shadow:0 0 8px rgba(61,255,168,.8)}.neg{color:#ff4d7a;text-shadow:0 0 8px rgba(255,77,122,.9)}.zero{color:#8fb7c9}
.stk{display:flex;height:22px;gap:4px;margin:6px 0 16px}
.stk i{display:block;border-radius:3px}
.stk i:nth-child(1){background:#00e6ff;box-shadow:0 0 14px #00e6ff}.stk i:nth-child(2){background:#a35cff;box-shadow:0 0 14px #a35cff}.stk i:nth-child(3){background:#ff2bd6;box-shadow:0 0 14px #ff2bd6}
.lg{display:flex;gap:28px;font-family:"IBM Plex Mono","Noto Sans SC",monospace;font-size:13px}
td,th{padding:9px 0;border-bottom:1px solid rgba(0,230,255,.18);text-align:left;font-weight:400}
th{font-family:"IBM Plex Mono","Noto Sans SC",monospace;font-size:12px;color:#00e6ff;letter-spacing:.1em;text-shadow:0 0 6px rgba(0,230,255,.8)}
.r{text-align:right}td.num{font-family:"IBM Plex Mono",monospace;color:#fff}
.hot{color:#ff5ce3!important;text-shadow:0 0 8px rgba(255,43,214,.9)}
.qs{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px}
.qs .p p{font-size:19px;line-height:32px;color:#ffd6f8;text-shadow:0 0 12px rgba(255,43,214,.75)}
.qs .p span{display:block;margin-top:10px;font-family:"IBM Plex Mono","Noto Sans SC",monospace;font-size:12px;color:#00e6ff;text-shadow:0 0 6px rgba(0,230,255,.8)}
.recs{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px}
.recs b{display:block;font-family:"IBM Plex Mono",monospace;font-size:34px;line-height:40px;font-weight:500}
.recs h3{font-size:18px;font-weight:600;color:#fff;margin-top:10px;text-shadow:0 0 10px rgba(0,230,255,.8)}
.recs p{color:#a9c8d8;margin-top:6px}
.sec{margin-top:48px}
`, `<div class="wrap">
<div class="kick">// ${esc(s.team)} :: ${esc(s.period)}</div>
<h1><span class="grad">${esc(s.title)}</span></h1>
<p class="lead">${esc(s.summary)}</p>
<div class="stats">
<div class="p"><span class="lab">净推荐值</span><b><span class="grad">${s.nps.score}</span><em>${s.nps.change}</em></b></div>
<div class="p m"><span class="lab">推荐者占比</span><b><span class="grad">${s.nps.promoters}%</span></b></div>
<div class="p"><span class="lab">有效问卷</span><b><span class="grad">${num(s.sample.responses)}</span></b></div>
<div class="p m"><span class="lab">回收率 · 深访 ${s.sample.interviews} 人</span><b><span class="grad">${s.sample.rate}%</span></b></div>
</div>
<div class="g2">
<div class="p m"><h2>NPS 构成</h2><div class="stk"><i style="width:${s.nps.promoters}%"></i><i style="width:${s.nps.passives}%"></i><i style="width:${s.nps.detractors}%"></i></div>
<div class="lg"><span style="color:#00e6ff;text-shadow:0 0 8px #00e6ff">推荐者 ${s.nps.promoters}%</span><span style="color:#c39bff;text-shadow:0 0 8px #a35cff">中立者 ${s.nps.passives}%</span><span style="color:#ff5ce3;text-shadow:0 0 8px #ff2bd6">贬损者 ${s.nps.detractors}%</span></div>
<h2 style="margin-top:30px">会员分群</h2><table><tr><th>分群</th><th class="r">样本</th><th class="r">NPS</th><th class="r">CSAT</th></tr>${s.segments.map((g) => `<tr><td>${esc(g.name)}</td><td class="r num">${num(g.n)}</td><td class="r num ${g.nps < 30 ? "hot" : ""}">${g.nps}</td><td class="r num">${g.csat.toFixed(1)}</td></tr>`).join("")}</table></div>
<div class="p"><h2>满意度 / 5 分制</h2><div class="rows">${sat.map((x) => `<div><span>${esc(x.name)}</span>${ebar(x.score, 5)}<span class="v">${x.score.toFixed(1)}</span><span class="d ${sign(x.change)}">${x.change}</span></div>`).join("")}</div>
<h2 style="margin-top:30px">痛点提及率</h2><div class="rows">${pains.map((p) => `<div style="grid-template-columns:110px 1fr 48px"><span>${esc(p.name)}</span>${ebar(p.share, 40)}<span class="v">${p.share}%</span></div>`).join("")}</div></div>
</div>
<div class="kick sec">// 用户原话</div>
<div class="qs">${q.map((x, i) => `<div class="p ${i % 3 ? "" : "m"}"><p>“${esc(x.text)}”</p><span>&gt; ${esc(x.who)}</span></div>`).join("")}</div>
<div class="kick sec">// 行动建议</div>
<div class="recs">${s.recommendations.map((r, i) => `<div class="p ${i === 1 ? "m" : ""}"><b><span class="grad">0${i + 1}</span></b><h3>${esc(r.title)}</h3><p>${esc(r.detail)}</p></div>`).join("")}</div>
</div>`)

export default { a, b, c, d, e }
