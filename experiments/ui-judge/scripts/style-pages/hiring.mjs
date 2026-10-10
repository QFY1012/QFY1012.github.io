// 第三季度招聘报告 in five styles: HR SaaS product report, kanban board, infographic poster,
// corporate intranet portal, storyline timeline.
import { readData, doc, esc, num, bars, line } from "../style-kit.mjs"

const d = readData("hiring")
const K = Object.fromEntries(d.kpis.map((k) => [k.key, k]))
const F = d.funnel
const W = d.weekly
const P = d.positions
const C = d.channels
const conv = F.map((f, i) => (i ? (f.count / F[i - 1].count) * 100 : null))
const lost = F.map((f, i) => (i ? F[i - 1].count - f.count : null))
const overall = (F[F.length - 1].count / F[0].count) * 100
const rate = (p) => (p.hired / p.plan) * 100
const status = (p) => (rate(p) >= 90 ? "done" : rate(p) >= 70 ? "on" : "late")
const statusText = { done: "基本完成", on: "推进中", late: "滞后" }
const totalPlan = P.reduce((a, p) => a + p.plan, 0)
const totalHired = P.reduce((a, p) => a + p.hired, 0)
const totalPending = P.reduce((a, p) => a + p.pending, 0)
const totalApps = W.reduce((a, w) => a + w.applications, 0)
const totalInt = W.reduce((a, w) => a + w.interviews, 0)
const peak = W.reduce((m, w) => (w.applications > m.applications ? w : m), W[0])
const f1 = (v) => v.toFixed(1)
const good = (k) => k.direction === "up"
const appPts = (lab) => W.map((w) => ({ x: lab(w.week), y: w.applications }))
const intPts = (lab) => W.map((w) => ({ x: lab(w.week), y: w.interviews }))
const conic = (colors, gap = 0) => {
  let a = 0
  return `conic-gradient(${C.map((c, i) => { const s0 = a; a += c.share; return `${colors[i]} ${s0}% ${a - gap}%${gap ? `,transparent ${a - gap}% ${a}%` : ""}` }).join(",")})`
}

// ============================================================ c helpers: infographic poster
function funnelSvg() {
  const w = 1100, cx = 550, H = 410, top = 820, bot = 230, lh = 74, step = 84
  const wd = (y) => top - ((top - bot) * y) / H
  const cols = ["#d9623b", "#e0844a", "#e7a93b", "#5f9e8f", "#2f7f7a"]
  return `<svg width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" style="display:block;font-family:'Noto Sans SC';">${F.map((f, i) => {
    const y0 = i * step, y1 = y0 + lh, ym = (y0 + y1) / 2
    const pts = `${cx - wd(y0) / 2},${y0} ${cx + wd(y0) / 2},${y0} ${cx + wd(y1) / 2},${y1} ${cx - wd(y1) / 2},${y1}`
    const r = cx + wd(ym) / 2 + 20, l = cx - wd(ym) / 2 - 20
    const right = i ? `<line x1="${r}" x2="${r + 34}" y1="${ym}" y2="${ym}" stroke="#3b2a20" stroke-dasharray="2 3"/><text x="${r + 42}" y="${ym - 4}" style="font-size:22px;font-weight:600;fill:${cols[i]}">${f1(conv[i])}%</text><text x="${r + 42}" y="${ym + 18}" style="font-size:13px;fill:#7a6656">来自上一阶段</text>` : `<text x="${r + 6}" y="${ym + 6}" style="font-size:14px;fill:#7a6656">全部投递 100%</text>`
    const left = i ? `<text x="${l}" y="${ym - 2}" text-anchor="end" style="font-size:13px;fill:#7a6656">此处流失</text><text x="${l}" y="${ym + 18}" text-anchor="end" style="font-size:18px;fill:#3b2a20;font-weight:500">${num(lost[i])}</text>` : `<text x="${l}" y="${ym + 6}" text-anchor="end" style="font-size:14px;fill:#7a6656">起点</text>`
    return `<polygon points="${pts}" fill="${cols[i]}"/><text x="${cx}" y="${ym - 6}" text-anchor="middle" style="font-size:28px;font-weight:600;fill:#fff">${num(f.count)}</text><text x="${cx}" y="${ym + 20}" text-anchor="middle" style="font-size:14px;fill:#fff;opacity:.92">${esc(f.stage)}</text>${right}${left}`
  }).join("")}</svg>`
}
const chCols = ["#d9623b", "#e7a93b", "#2f7f7a", "#8a5a9e", "#5b8fc7", "#b9a89a"]
function people() {
  const dots = []
  C.forEach((c, i) => { for (let k = 0; k < c.hires; k++) dots.push(chCols[i]) })
  return `<div class="ppl">${dots.map((c) => `<i style="background:${c}"></i>`).join("")}</div>`
}
function pictoRow(p) {
  const cells = []
  for (let k = 0; k < p.plan; k++) cells.push(k < p.hired ? "f" : k < p.hired + p.pending ? "p" : "e")
  return `<div class="pr"><div class="pn"><b>${esc(p.name)}</b><span>${esc(p.dept)}</span></div><div class="cells">${cells.map((c) => `<i class="${c}"></i>`).join("")}</div><div class="pv"><b>${p.hired}</b>/${p.plan}<span>${p.cycle} 天</span></div></div>`
}

// ============================================================ d helpers
const portalBars = () => F.map((f) => `<div class="fb"><span>${esc(f.stage)}</span><div class="fbt"><div style="width:${Math.max(0.6, (f.count / F[0].count) * 100)}%"></div></div><em>${num(f.count)}</em></div>`).join("")

export default {
  // ---------------------------------------------------------------- a HR SaaS 产品报表页
  a: doc(`
body{background:#f5f6f8;color:#1f2329;font-family:"Noto Sans SC",sans-serif;font-size:14px;line-height:1.6}
.num{font-variant-numeric:tabular-nums}
.bar{height:56px;background:#fff;border-bottom:1px solid #e4e6ea}
.in{width:1168px;margin:0 auto}
.bar .in{display:flex;align-items:center;height:56px;gap:40px}
.logo{display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px;color:#1f2329}
.logo i{width:26px;height:26px;border-radius:7px;background:#3b5bdb;position:relative;display:block}
.logo i:after{content:"";position:absolute;left:7px;top:7px;width:12px;height:12px;border-radius:50% 50% 50% 0;background:#fff}
.nav{display:flex;gap:28px;height:56px}
.nav span{display:flex;align-items:center;color:#646a73;border-bottom:2px solid transparent}
.nav span.on{color:#3b5bdb;border-color:#3b5bdb;font-weight:500}
.sr{margin-left:auto;display:flex;align-items:center;gap:16px}
.search{width:240px;height:32px;border-radius:8px;background:#f2f3f5;color:#8f959e;font-size:13px;display:flex;align-items:center;padding:0 12px}
.av{width:30px;height:30px;border-radius:50%;background:#e8edff;color:#3b5bdb;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center}
main{padding:24px 0 64px}
.crumb{font-size:13px;color:#8f959e}
.head{display:flex;align-items:flex-end;justify-content:space-between;margin-top:8px}
h1{font-size:24px;line-height:34px;font-weight:600}
.meta{display:flex;gap:8px;margin-top:8px;font-size:12px}
.meta span{padding:2px 10px;border-radius:999px;background:#eceef1;color:#4e5969}
.meta span.ok{background:#e3f7ec;color:#1a7f4b}
.btns{display:flex;gap:8px}
.btn{height:34px;padding:0 16px;border-radius:8px;border:1px solid #d9dce1;background:#fff;display:flex;align-items:center;font-size:13px;color:#1f2329}
.btn.p{background:#3b5bdb;border-color:#3b5bdb;color:#fff}
.grid{display:grid;gap:16px;margin-top:16px}
.card{background:#fff;border:1px solid #e6e8ec;border-radius:12px;padding:20px 24px}
.ch{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px}
.ch h3{font-size:15px;font-weight:600}
.ch span{font-size:12px;color:#8f959e}
.k4{grid-template-columns:repeat(4,1fr);margin-top:20px}
.kpi .l{font-size:13px;color:#646a73}
.kpi .v{font-size:30px;line-height:40px;font-weight:600;margin-top:6px}
.kpi .v small{font-size:14px;font-weight:400;color:#646a73;margin-left:4px}
.kpi .c{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12px;color:#8f959e}
.pill{padding:1px 8px;border-radius:6px;font-size:12px;font-weight:500}
.pill.g{background:#e3f7ec;color:#1a7f4b}.pill.r{background:#fdecec;color:#c4362c}
.sum{display:grid;grid-template-columns:120px 1fr;gap:24px;align-items:start}
.sum .tag{font-size:13px;font-weight:600;color:#3b5bdb;display:flex;align-items:center;gap:8px}
.sum .tag:before{content:"";width:8px;height:8px;border-radius:2px;background:#3b5bdb}
.sum p{font-size:14.5px;line-height:1.85;color:#373c43}
.pipe{display:grid;grid-template-columns:1fr 72px 1fr 72px 1fr 72px 1fr 72px 1fr;align-items:stretch}
.stg{background:#f7f8fa;border-radius:10px;padding:14px 16px}
.stg .n{font-size:13px;color:#646a73}
.stg .v{font-size:26px;line-height:36px;font-weight:600;margin-top:2px}
.stg .t{height:6px;border-radius:3px;background:#e6e9f0;margin-top:12px}
.stg .t i{display:block;height:100%;border-radius:3px;background:#3b5bdb}
.stg.last{background:#eef2ff}
.arr{display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:12px;color:#8f959e;gap:2px}
.arr b{font-size:14px;color:#1f2329;font-weight:600}
.arr i{font-style:normal;color:#b5bac2;font-size:16px;line-height:1}
.two{grid-template-columns:1fr 372px}
.seg{display:flex;background:#f2f3f5;border-radius:8px;padding:3px;font-size:12px}
.seg span{padding:3px 12px;border-radius:6px;color:#646a73}.seg span.on{background:#fff;color:#1f2329;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.mini{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px;padding-top:14px;border-top:1px solid #f0f1f3}
.mini span{display:block;font-size:12px;color:#8f959e}.mini b{font-size:18px;font-weight:600}
.sub{font-size:13px;color:#646a73;margin:16px 0 4px}
.donut{display:flex;align-items:center;gap:20px}
.ring{width:132px;height:132px;border-radius:50%;position:relative;flex:none}
.ring:after{content:"";position:absolute;inset:22px;border-radius:50%;background:#fff}
.ring div{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring b{font-size:24px;line-height:28px;font-weight:600}.ring span{font-size:12px;color:#8f959e}
.lg{flex:1;display:grid;gap:7px;font-size:13px}
.lg div{display:grid;grid-template-columns:10px 1fr 44px;gap:8px;align-items:center}
.lg i{width:8px;height:8px;border-radius:2px}
.lg em{font-style:normal;text-align:right;color:#646a73}
.cost{margin-top:18px;border-top:1px solid #f0f1f3;padding-top:12px}
.cost div{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#4e5969}
.cost b{font-weight:500;color:#1f2329}
table{font-size:14px}
th{font-size:12px;color:#8f959e;font-weight:400;text-align:left;padding:0 12px 10px;border-bottom:1px solid #eceef1}
td{padding:13px 12px;border-bottom:1px solid #f2f3f5;vertical-align:middle}
tr:last-child td{border-bottom:0}
th:first-child,td:first-child{padding-left:0}
td .ps{font-size:12px;color:#8f959e}
.r{text-align:right}
.prog{display:flex;align-items:center;gap:10px}
.prog .t{width:150px;height:6px;border-radius:3px;background:#eceef1}
.prog .t i{display:block;height:100%;border-radius:3px}
.st{font-size:12px;padding:2px 8px;border-radius:6px}
.st.done{background:#e3f7ec;color:#1a7f4b}.st.on{background:#e8edff;color:#3b5bdb}.st.late{background:#fdecec;color:#c4362c}
.three{grid-template-columns:repeat(3,1fr)}
.it{display:grid;grid-template-columns:24px 1fr;gap:10px;padding:10px 0;border-top:1px solid #f2f3f5}
.it:first-of-type{border-top:0;padding-top:0}
.it i{width:22px;height:22px;border-radius:6px;background:#e8edff;color:#3b5bdb;font-style:normal;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;margin-top:1px}
.it b{display:block;font-weight:600;font-size:14px}.it p{font-size:13px;color:#646a73;line-height:1.7;margin-top:2px}
.act .it i{background:#e3f7ec;color:#1a7f4b}
.risk .it i{background:#fff4e0;color:#c27400}
.foot{margin-top:24px;font-size:12px;color:#8f959e;display:flex;justify-content:space-between}
`, `<div class="bar"><div class="in"><div class="logo"><i></i>青禾 · 招聘洞察</div>
<div class="nav"><span>职位</span><span>候选人</span><span>面试</span><span class="on">报表</span><span>设置</span></div>
<div class="sr"><div class="search">搜索职位、候选人</div><div class="av">HR</div></div></div></div>
<main><div class="in">
<div class="crumb">报表中心 / 季度报告 / 2026 Q3</div>
<div class="head"><div><h1>${esc(d.title)}</h1><div class="meta"><span>${esc(d.period)}</span><span>${esc(d.org)}</span><span class="ok">已发布</span></div></div>
<div class="btns"><div class="btn">分享</div><div class="btn">订阅更新</div><div class="btn p">导出 PDF</div></div></div>

<div class="grid k4">${d.kpis.map((k) => `<div class="card kpi"><div class="l">${esc(k.label)}</div><div class="v num">${k.value}<small>${k.unit}</small></div><div class="c"><span class="pill ${good(k) ? "g" : "r"}">${k.change.startsWith("−") ? "↓" : "↑"} ${esc(k.change)}</span>较上季度</div></div>`).join("")}</div>

<div class="grid"><div class="card sum"><div class="tag">本季概览</div><p>${esc(d.summary)}</p></div></div>

<div class="grid"><div class="card"><div class="ch"><h3>招聘漏斗</h3><span>整体转化率 ${overall.toFixed(2)}%（投递 → 入职）</span></div>
<div class="pipe">${F.map((f, i) => `${i ? `<div class="arr"><i>→</i><b>${f1(conv[i])}%</b>转化</div>` : ""}<div class="stg${i === F.length - 1 ? " last" : ""}"><div class="n">${esc(f.stage)}</div><div class="v num">${num(f.count)}</div><div class="t"><i style="width:${Math.max(2, (f.count / F[0].count) * 100)}%"></i></div></div>`).join("")}</div></div></div>

<div class="grid two"><div class="card"><div class="ch"><h3>每周投递与面试</h3><div class="seg"><span class="on">按周</span><span>按月</span></div></div>
<div class="sub" style="margin-top:0">投递量（份）</div>
${line({ w: 704, h: 200, points: appPts((w) => `第${w}周`), ticks: [500, 600, 700, 800, 900, 1000], stroke: "#3b5bdb", grid: "#f0f1f3", text: "#8f959e", fill: "rgba(59,91,219,.07)", pad: [14, 20, 24, 40], width: 2, last: false })}
<div class="sub">面试量（场）</div>
${line({ w: 704, h: 120, points: intPts((w) => `第${w}周`), ticks: [50, 75, 100], stroke: "#12a28c", grid: "#f0f1f3", text: "#8f959e", pad: [12, 20, 24, 40], width: 2, dots: true, last: false })}
<div class="mini"><div><span>周均投递</span><b class="num">${num(Math.round(totalApps / W.length))}</b></div><div><span>投递峰值</span><b class="num">第 ${peak.week} 周 · ${num(peak.applications)}</b></div><div><span>面试总量</span><b class="num">${num(totalInt)} 场</b></div></div></div>
<div class="card"><div class="ch"><h3>入职渠道</h3><span>按入职人数</span></div>
<div class="donut"><div class="ring" style="background:${conic(["#3b5bdb", "#6f8cf0", "#12a28c", "#f0a43a", "#a98be0", "#c9ced6"])}"><div><b class="num">${totalHired}</b><span>入职人数</span></div></div>
<div class="lg">${C.map((c, i) => `<div><i style="background:${["#3b5bdb", "#6f8cf0", "#12a28c", "#f0a43a", "#a98be0", "#c9ced6"][i]}"></i><span>${esc(c.name)}</span><em class="num">${f1(c.share)}%</em></div>`).join("")}</div></div>
<div class="cost"><div style="color:#8f959e;font-size:12px"><span>渠道</span><span>入职 · 单人成本</span></div>${C.map((c) => `<div><span>${esc(c.name)}</span><span><b class="num">${c.hires} 人</b> · ${c.cost} 万元</span></div>`).join("")}</div></div></div>

<div class="grid"><div class="card"><div class="ch"><h3>各岗位招聘进度</h3><span>计划 ${totalPlan} 人 · 已入职 ${totalHired} 人 · 在途 offer ${totalPending} 个</span></div>
<table><tr><th>岗位</th><th>招聘进度</th><th class="r">完成率</th><th class="r">在途 offer</th><th class="r">投递量</th><th class="r">平均周期</th><th>状态</th></tr>
${P.map((p) => { const s = status(p); return `<tr><td><div style="font-weight:500">${esc(p.name)}</div><div class="ps">${esc(p.dept)}</div></td><td><div class="prog"><div class="t"><i style="width:${rate(p)}%;background:${s === "late" ? "#e5534b" : s === "on" ? "#3b5bdb" : "#1fa463"}"></i></div><span class="num">${p.hired} / ${p.plan}</span></div></td><td class="r num">${f1(rate(p))}%</td><td class="r num">${p.pending}</td><td class="r num">${num(p.applications)}</td><td class="r num">${p.cycle} 天</td><td><span class="st ${s}">${statusText[s]}</span></td></tr>` }).join("")}</table></div></div>

<div class="grid three">
<div class="card"><div class="ch"><h3>关键发现</h3></div>${d.findings.map((f, i) => `<div class="it"><i>${i + 1}</i><div><b>${esc(f.title)}</b><p>${esc(f.detail)}</p></div></div>`).join("")}</div>
<div class="card act"><div class="ch"><h3>下一步行动</h3><span>四季度</span></div>${d.actions.map((f, i) => `<div class="it"><i>${i + 1}</i><div><b>${esc(f.title)}</b><p>${esc(f.detail)}</p></div></div>`).join("")}</div>
<div class="card risk"><div class="ch"><h3>风险提示</h3></div>${d.risks.map((r) => `<div class="it"><i>!</i><div><p style="color:#373c43;margin:0">${esc(r)}</p></div></div>`).join("")}</div>
</div>
<div class="foot"><span>数据来源：招聘系统 · 统计截至 2026 年 9 月 30 日</span><span>最后更新：2026-10-08</span></div>
</div></main>`),

  // ---------------------------------------------------------------- b 看板 / 任务板
  b: doc(`
body{background:#f7f8f9;color:#172b4d;font-family:"Noto Sans SC",sans-serif;font-size:13px;line-height:1.5}
.num{font-variant-numeric:tabular-nums}
.wrap{width:1200px;margin:0 auto;padding:20px 0 48px}
.bh{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#fff;border:1px solid #dfe1e6;border-radius:8px}
.bh h1{font-size:18px;font-weight:600}
.star{color:#f5a623;font-size:16px}
.bh .tg{font-size:12px;background:#e9f2ff;color:#0c66e4;padding:1px 8px;border-radius:3px}
.bh .sp{margin-left:auto;display:flex;gap:8px;align-items:center}
.chip{border:1px solid #dfe1e6;border-radius:4px;padding:3px 10px;font-size:12px;color:#44546f;background:#fff}
.avs{display:flex}
.avs i{width:26px;height:26px;border-radius:50%;border:2px solid #fff;margin-left:-6px;font-style:normal;font-size:11px;color:#fff;display:flex;align-items:center;justify-content:center}
.lane{margin-top:22px}
.lh{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#44546f;margin-bottom:8px;letter-spacing:.04em}
.lh em{font-style:normal;font-weight:400;color:#8590a2}
.cols{display:grid;gap:10px;align-items:start}
.col{background:#ebecf0;border-radius:8px;padding:8px}
.col>h4{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:600;padding:4px 6px 8px;color:#172b4d}
.col>h4 span{font-size:11px;background:#dcdfe4;color:#44546f;border-radius:10px;padding:0 7px;font-weight:500}
.cd{background:#fff;border-radius:6px;box-shadow:0 1px 1px rgba(9,30,66,.25),0 0 1px rgba(9,30,66,.31);padding:10px 12px;margin-top:8px}
.cd:first-of-type{margin-top:0}
.lb{display:inline-block;font-size:11px;font-weight:600;padding:0 8px;border-radius:3px;margin-right:4px;line-height:18px}
.lb.b{background:#cce0ff;color:#0055cc}.lb.g{background:#baf3db;color:#216e4e}.lb.y{background:#f8e6a0;color:#7f5f01}.lb.r{background:#ffd5d2;color:#ae2e24}.lb.p{background:#dfd8fd;color:#5e4db2}.lb.gr{background:#dcdfe4;color:#44546f}
.big{font-size:24px;font-weight:600;line-height:32px}
.big small{font-size:12px;font-weight:400;color:#626f86;margin-left:3px}
.muted{color:#626f86;font-size:12px}
.pb{height:4px;background:#ebecf0;border-radius:2px;margin-top:8px}.pb i{display:block;height:100%;border-radius:2px}
.foot{display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:12px;color:#626f86}
.ini{width:22px;height:22px;border-radius:50%;font-size:10px;color:#fff;display:flex;align-items:center;justify-content:center}
.kp{display:grid;grid-template-columns:repeat(4,1fr) 1.6fr;gap:10px}
.kp .cd{margin:0}
.note{background:#fff7d6;box-shadow:0 1px 1px rgba(9,30,66,.2)}
.note p{font-size:13px;line-height:1.7;margin-top:4px;color:#3b3a2f}
.cd h5{font-size:13.5px;font-weight:600;margin-top:6px}
.cd p{font-size:12.5px;color:#44546f;margin-top:3px;line-height:1.65}
.chk{display:flex;gap:10px;margin-top:8px;font-size:11.5px;color:#626f86}
.chk span{display:flex;align-items:center;gap:4px}
`, `<div class="wrap">
<div class="bh"><h1>${esc(d.title)} · 复盘看板</h1><span class="star">★</span><span class="tg">${esc(d.period)}</span><span class="tg" style="background:#f1f2f4;color:#44546f">${esc(d.org)}</span>
<div class="sp"><span class="chip">全部部门 ▾</span><span class="chip">本季度 ▾</span><div class="avs"><i style="background:#1f845a">招</i><i style="background:#0c66e4">HR</i><i style="background:#ae4787">研</i><i style="background:#946f00">+4</i></div></div></div>

<div class="lane"><div class="lh">本季指标 <em>· 与上季度对比</em></div>
<div class="kp">${d.kpis.map((k) => `<div class="cd"><span class="lb ${good(k) ? "g" : "r"}">${good(k) ? "向好" : "需关注"}</span><div class="muted" style="margin-top:6px">${esc(k.label)}</div><div class="big num">${k.value}<small>${k.unit}</small></div><div class="muted">${esc(k.change)}</div></div>`).join("")}
<div class="cd note"><span class="lb y">置顶 · 摘要</span><p>${esc(d.summary)}</p></div></div></div>

<div class="lane"><div class="lh">招聘阶段 <em>· 候选人数量与阶段转化</em></div>
<div class="cols" style="grid-template-columns:repeat(5,1fr)">${F.map((f, i) => `<div class="col"><h4>${esc(f.stage)}<span class="num">${num(f.count)}</span></h4>
<div class="cd"><span class="lb b">阶段 ${i + 1}</span><div class="big num" style="margin-top:4px">${num(f.count)}<small>${i === 2 ? "场" : i === 3 ? "个" : i === 4 ? "人" : "份"}</small></div><div class="pb"><i style="width:${Math.max(1.5, (f.count / F[0].count) * 100)}%;background:#579dff"></i></div></div>
<div class="cd">${i ? `<span class="lb ${conv[i] > 40 ? "g" : conv[i] > 20 ? "y" : "r"}">转化 ${f1(conv[i])}%</span><div class="muted" style="margin-top:6px">较上一阶段流失 ${num(lost[i])}</div>` : `<span class="lb gr">起点</span><div class="muted" style="margin-top:6px">周均投递 ${num(Math.round(totalApps / W.length))} 份</div>`}</div></div>`).join("")}</div></div>

<div class="lane"><div class="lh">岗位进度 <em>· 按 HC 完成率分组，共 ${P.length} 个岗位</em></div>
<div class="cols" style="grid-template-columns:repeat(3,1fr)">${["late", "on", "done"].map((s) => { const ps = P.filter((p) => status(p) === s); const col = { late: "#e2483d", on: "#e2b203", done: "#22a06b" }[s]; return `<div class="col" style="border-top:3px solid ${col}"><h4>${statusText[s]}${s === "late" ? "（低于 70%）" : s === "on" ? "（70%–90%）" : "（90% 以上）"}<span>${ps.length}</span></h4>${ps.map((p) => `<div class="cd"><span class="lb ${p.dept === "研发中心" ? "b" : p.dept === "智能平台部" || p.dept === "数据部" ? "p" : "gr"}">${esc(p.dept)}</span><h5>${esc(p.name)}</h5>
<div class="pb"><i style="width:${rate(p)}%;background:${col}"></i></div>
<div class="chk"><span>入职 <b class="num" style="color:#172b4d">${p.hired}/${p.plan}</b></span><span>在途 offer ${p.pending}</span><span>投递 ${num(p.applications)}</span></div>
<div class="foot"><span>平均周期 ${p.cycle} 天</span><span class="num" style="font-weight:600;color:${col}">${f1(rate(p))}%</span></div></div>`).join("")}</div>` }).join("")}</div></div>

<div class="lane"><div class="lh">数据 <em>· 每周趋势与入职渠道</em></div>
<div class="cols" style="grid-template-columns:1fr 1fr 380px">
<div class="col"><h4>每周投递量<span>份</span></h4><div class="cd">${line({ w: 350, h: 190, points: appPts((w) => `${w}周`), ticks: [500, 700, 900], stroke: "#0c66e4", grid: "#ebecf0", text: "#8590a2", xEvery: 2, size: 11, pad: [14, 14, 22, 34], fill: "rgba(12,102,228,.08)", last: false })}</div></div>
<div class="col"><h4>每周面试量<span>场</span></h4><div class="cd">${line({ w: 350, h: 190, points: intPts((w) => `${w}周`), ticks: [50, 75, 100], stroke: "#6e5dc6", grid: "#ebecf0", text: "#8590a2", xEvery: 2, size: 11, pad: [14, 14, 22, 34], dots: true, last: false })}</div></div>
<div class="col"><h4>入职渠道<span>${totalHired} 人</span></h4><div class="cd">${bars(C.map((c) => ({ label: c.name, value: c.share, display: `${c.hires} 人` })), { max: 35, color: "#22a06b", track: "#ebecf0", labelW: 60, valueW: 40, h: 8, gap: 10 })}
<div class="muted" style="margin-top:10px;border-top:1px solid #ebecf0;padding-top:8px">单人成本：${C.map((c) => `${esc(c.name)} ${c.cost} 万`).join("，")}</div></div></div>
</div></div>

<div class="lane"><div class="lh">复盘 <em>· 发现、待办与风险</em></div>
<div class="cols" style="grid-template-columns:repeat(3,1fr)">
<div class="col"><h4>关键发现<span>${d.findings.length}</span></h4>${d.findings.map((f) => `<div class="cd"><span class="lb b">发现</span><h5>${esc(f.title)}</h5><p>${esc(f.detail)}</p></div>`).join("")}</div>
<div class="col"><h4>下一步（待办）<span>${d.actions.length}</span></h4>${d.actions.map((a, i) => `<div class="cd"><span class="lb g">Q4</span><span class="lb gr">待开始</span><h5>${esc(a.title)}</h5><p>${esc(a.detail)}</p><div class="foot"><span>☐ 0/1</span><div class="ini" style="background:${["#1f845a", "#0c66e4", "#ae4787"][i]}">${["招", "HR", "研"][i]}</div></div></div>`).join("")}</div>
<div class="col"><h4>风险<span>${d.risks.length}</span></h4>${d.risks.map((r) => `<div class="cd"><span class="lb r">高风险</span><p style="color:#172b4d;margin-top:6px">${esc(r)}</p></div>`).join("")}</div>
</div></div>
</div>`),

  // ---------------------------------------------------------------- c 信息图海报
  c: doc(`
body{background:#fbf4ea;color:#3b2a20;font-family:"Noto Sans SC",sans-serif;font-size:15px;line-height:1.7}
.num{font-variant-numeric:tabular-nums}
.wrap{width:1100px;margin:0 auto;padding:72px 0 80px}
.kick{text-align:center;font-size:13px;letter-spacing:.3em;color:#a0522d}
h1{text-align:center;font-family:"Noto Serif SC",serif;font-weight:600;font-size:64px;line-height:80px;margin-top:14px;letter-spacing:.04em}
.per{text-align:center;font-size:16px;color:#7a6656;margin-top:6px}
.dots{display:flex;justify-content:center;gap:8px;margin-top:22px}.dots i{width:10px;height:10px;border-radius:50%}
.lead{width:820px;margin:28px auto 0;text-align:center;font-size:17px;line-height:1.95;color:#4d3a2e}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:56px}
.kc{text-align:center}
.circ{width:184px;height:184px;border-radius:50%;margin:0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}
.circ:after{content:"";position:absolute;inset:14px;border-radius:50%;background:#fbf4ea}
.circ>*{position:relative;z-index:1}
.circ b{font-size:44px;line-height:50px;font-weight:600}.circ small{font-size:15px;margin-left:2px;font-weight:400}
.circ span{font-size:14px;color:#7a6656}
.kc p{margin-top:12px;font-size:14px}
.kc p em{font-style:normal;font-weight:600}
h2{font-family:"Noto Serif SC",serif;font-weight:600;font-size:34px;line-height:46px;text-align:center}
.sec{margin-top:96px}
.sec>.s{text-align:center;color:#7a6656;font-size:15px;margin-top:6px}
.sec .body{margin-top:36px}
.wk{display:grid;grid-template-columns:680px 1fr;gap:40px}
.wk h4,.box h4{font-size:15px;font-weight:600;margin-bottom:8px}
.wk h4 span{font-weight:400;color:#7a6656;font-size:13px;margin-left:8px}
.ppl{display:grid;grid-template-columns:repeat(22,1fr);gap:9px;width:550px}
.ppl i{width:18px;height:18px;border-radius:50%;display:block}
.chs{display:grid;grid-template-columns:550px 1fr;gap:56px;align-items:center}
.cl{display:grid;gap:12px}
.cl div{display:grid;grid-template-columns:14px 80px 1fr 80px;gap:10px;align-items:baseline}
.cl i{width:12px;height:12px;border-radius:50%;align-self:center}
.cl b{font-size:22px;font-weight:600}
.cl span{color:#7a6656;font-size:13px}
.pr{display:grid;grid-template-columns:150px 1fr 120px;gap:20px;align-items:center;padding:12px 0;border-bottom:1px dashed #e2d3bf}
.pn b{display:block;font-size:16px;font-weight:600;line-height:22px}.pn span{font-size:12px;color:#7a6656}
.cells{display:flex;flex-wrap:wrap;gap:6px}
.cells i{width:18px;height:18px;border-radius:50%;display:block}
.cells i.f{background:#2f7f7a}.cells i.p{background:#fbf4ea;border:2px solid #2f7f7a;box-shadow:inset 0 0 0 3px #fbf4ea;background-color:#e7a93b}.cells i.e{border:2px dashed #d3bfa5}
.pv{text-align:right;font-size:14px;color:#7a6656}.pv b{font-size:24px;color:#3b2a20;font-weight:600}
.pv span{display:block;font-size:12px}
.key{display:flex;justify-content:center;gap:28px;font-size:13px;color:#7a6656;margin-top:20px}
.key span{display:flex;align-items:center;gap:6px}
.key i{width:14px;height:14px;border-radius:50%;display:inline-block}
.fd{display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
.fd div{text-align:center}
.fd b{display:block;font-family:"Noto Serif SC",serif;font-size:56px;line-height:64px;color:#d9623b}
.fd h3{font-size:19px;font-weight:600;margin-top:8px}
.fd p{font-size:14.5px;color:#5c4a3e;margin-top:6px}
.end{display:grid;grid-template-columns:1.3fr 1fr;gap:24px;margin-top:96px}
.box{border-radius:20px;padding:32px 36px}
.box.a{background:#f6e2cc}.box.r{background:#3b2a20;color:#fbf4ea}
.box h4{font-family:"Noto Serif SC",serif;font-size:24px;margin-bottom:16px}
.box li{list-style:none;display:grid;grid-template-columns:36px 1fr;margin-top:14px}
.box li i{font-style:normal;width:26px;height:26px;border-radius:50%;background:#d9623b;color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center}
.box.r li i{background:#e7a93b;color:#3b2a20}
.box li b{display:block;font-weight:600}.box li p{font-size:14px;opacity:.85}
.foot{text-align:center;font-size:12px;color:#a08b78;margin-top:56px}
`, `<div class="wrap">
<div class="kick">${esc(d.org)}</div>
<h1>${esc(d.title)}</h1>
<div class="per">${esc(d.period)}</div>
<div class="dots">${["#d9623b", "#e0844a", "#e7a93b", "#5f9e8f", "#2f7f7a"].map((c) => `<i style="background:${c}"></i>`).join("")}</div>
<p class="lead">${esc(d.summary)}</p>

<div class="kpis">${d.kpis.map((k, i) => { const col = ["#2f7f7a", "#d9623b", "#e7a93b", "#8a5a9e"][i]; const pctv = k.unit === "%" ? k.value : 100; return `<div class="kc"><div class="circ" style="background:conic-gradient(${col} 0 ${pctv}%,#ead9c4 ${pctv}% 100%)"><b class="num">${k.value}<small>${k.unit}</small></b><span>${esc(k.label)}</span></div><p>较上季度 <em style="color:${good(k) ? "#2f7f7a" : "#c0452a"}">${esc(k.change)}</em></p></div>` }).join("")}</div>

<div class="sec"><h2>从 9,840 份简历到 86 位新同事</h2><div class="s">整体转化率 ${overall.toFixed(2)}%，相当于每 114 份简历产生 1 位新同事</div>
<div class="body">${funnelSvg()}</div></div>

<div class="sec"><h2>13 周里的招聘节奏</h2><div class="s">第 ${peak.week} 周迎来投递高峰（${num(peak.applications)} 份），面试量随之同步起伏</div>
<div class="body wk"><div><h4>每周投递<span>份</span></h4>${line({ w: 680, h: 250, points: appPts((w) => `第${w}周`), ticks: [500, 600, 700, 800, 900, 1000], stroke: "#d9623b", grid: "#ead9c4", text: "#a08b78", fill: "rgba(217,98,59,.14)", dots: true, width: 2.5, size: 12, pad: [16, 28, 24, 40], last: false })}</div>
<div><h4>每周面试<span>场</span></h4>${line({ w: 380, h: 250, points: intPts((w) => `${w}`), ticks: [50, 60, 70, 80, 90, 100], stroke: "#2f7f7a", grid: "#ead9c4", text: "#a08b78", fill: "rgba(47,127,122,.12)", width: 2.5, size: 12, pad: [16, 16, 24, 34], xEvery: 2, last: false })}</div></div></div>

<div class="sec"><h2>入职的 ${totalHired} 人从哪里来</h2><div class="s">每个圆点代表一位新同事</div>
<div class="body chs">${people()}<div class="cl">${C.map((c, i) => `<div><i style="background:${chCols[i]}"></i><span style="color:#3b2a20;font-size:15px">${esc(c.name)}</span><b class="num">${c.hires}<span> 人 · ${f1(c.share)}%</span></b><span style="text-align:right">${c.cost} 万元/人</span></div>`).join("")}</div></div></div>

<div class="sec"><h2>每个岗位走到了哪一步</h2><div class="s">全公司计划 ${totalPlan} 人，已入职 ${totalHired} 人，HC 完成率 ${K.hc.value}%</div>
<div class="body">${P.map(pictoRow).join("")}
<div class="key"><span><i style="background:#2f7f7a"></i>已入职</span><span><i style="background:#e7a93b;border:2px solid #2f7f7a"></i>offer 在途</span><span><i style="border:2px dashed #d3bfa5"></i>仍空缺</span><span>右侧为平均招聘周期</span></div></div></div>

<div class="sec"><h2>三个发现</h2><div class="body fd">${d.findings.map((f, i) => `<div><b>0${i + 1}</b><h3>${esc(f.title)}</h3><p>${esc(f.detail)}</p></div>`).join("")}</div></div>

<div class="end"><div class="box a"><h4>接下来做什么</h4><ul>${d.actions.map((a, i) => `<li><i>${i + 1}</i><div><b>${esc(a.title)}</b><p>${esc(a.detail)}</p></div></li>`).join("")}</ul></div>
<div class="box r"><h4>需要警惕</h4><ul>${d.risks.map((r) => `<li><i>!</i><p style="opacity:.92">${esc(r)}</p></li>`).join("")}</ul></div></div>
<div class="foot">${esc(d.org)} · 数据统计截至 2026 年 9 月 30 日</div>
</div>`),

  // ---------------------------------------------------------------- d 企业内网门户
  d: doc(`
body{background:#dfe5ec;color:#333;font-family:"Noto Sans SC",sans-serif;font-size:13px;line-height:1.6}
.num{font-variant-numeric:tabular-nums}
.page{width:1200px;margin:0 auto;background:#fff;border-left:1px solid #c3ccd6;border-right:1px solid #c3ccd6}
.hd{display:flex;align-items:center;justify-content:space-between;padding:14px 20px}
.lg{display:flex;align-items:center;gap:10px}
.lg i{width:40px;height:40px;background:#1d5fae;color:#fff;font-style:normal;font-family:"Noto Serif SC",serif;font-size:18px;display:flex;align-items:center;justify-content:center;font-weight:600}
.lg b{font-size:20px;color:#1d5fae;font-family:"Noto Serif SC",serif}
.lg span{display:block;font-size:11px;color:#888;letter-spacing:.08em}
.hd .u{font-size:12px;color:#666}.hd .u a{color:#1d5fae}
.nv{background:linear-gradient(#f9f9f9,#dcdcdc);border-top:1px solid #c8c8c8;border-bottom:1px solid #b5b5b5;display:flex;padding-left:10px}
.nv span{padding:7px 22px;font-size:13px;color:#333;border-right:1px solid #c8c8c8}
.nv span.on{background:#fff;color:#1d5fae;font-weight:600;border-bottom:1px solid #fff;margin-bottom:-1px}
.crumb{padding:8px 20px;font-size:12px;color:#666;border-bottom:1px dotted #ccc;display:flex;justify-content:space-between}
.crumb em{font-style:normal;color:#d0021b}
.ct{padding:16px 20px 24px}
h1{text-align:center;font-size:21px;color:#1d3b66;margin:8px 0 4px}
.info{text-align:center;font-size:12px;color:#888;padding-bottom:12px;border-bottom:2px solid #1d5fae;margin-bottom:16px}
.info span{margin:0 10px}
.panel{border:1px solid #b8c9de;margin-bottom:14px}
.ph{background:linear-gradient(#f1f6fc,#d6e3f3);border-bottom:1px solid #b8c9de;padding:5px 10px;font-weight:600;color:#1d4f91;font-size:13px;display:flex;align-items:center;gap:6px}
.ph:before{content:"";width:6px;height:6px;background:#1d5fae}
.ph span{margin-left:auto;font-weight:400;color:#7a8ba3;font-size:12px}
.pb{padding:10px 12px}
.pb p.ind{text-indent:2em;font-size:13.5px;line-height:1.9}
.tb td,.tb th{border:1px solid #c9d3df;padding:5px 8px;text-align:center}
.tb th{background:#eef3f9;font-weight:600;color:#2b3f5c}
.tb tr:nth-child(odd) td{background:#fafbfd}
.tb td.l{text-align:left}
.g{color:#2e8b2e;font-weight:600}.rd{color:#d0021b;font-weight:600}.or{color:#e07b00;font-weight:600}
.row{display:flex;gap:14px;align-items:flex-start}
.row>.panel{flex:1}
.fb{display:grid;grid-template-columns:70px 1fr 56px;gap:8px;align-items:center;margin-top:6px;font-size:12px}
.fbt{height:16px;background:#f0f0f0;border:1px solid #ddd}
.fbt div{height:100%;background:linear-gradient(#5b9bd5,#2e75b6)}
.fb em{font-style:normal;text-align:right}
.pie{width:150px;height:150px;border-radius:50%;border:1px solid #999;flex:none}
.charts{display:flex;gap:20px;justify-content:space-between}
.cap{text-align:center;font-size:12px;color:#555;margin-top:4px}
.lst{padding-left:24px}
.lst li{margin:5px 0;font-size:13px}
.lst li b{color:#1d3b66}
.warn{background:#fffbe6;border:1px solid #f0d58c;padding:8px 12px;margin-top:2px}
.warn li{color:#7a5a00}
.ft{background:#f0f0f0;border-top:1px solid #ccc;text-align:center;font-size:12px;color:#888;padding:12px;line-height:1.8}
.att{font-size:12px;margin-top:8px}.att a{color:#1d5fae;text-decoration:underline;margin-right:16px}
`, `<div class="page">
<div class="hd"><div class="lg"><i>青</i><div><b>青禾科技 · 企业内部门户</b><span>QINGHE INTRANET PORTAL</span></div></div><div class="u">欢迎您，招聘管理员 &nbsp;|&nbsp; <a>个人设置</a> &nbsp;|&nbsp; <a>修改密码</a> &nbsp;|&nbsp; <a>退出</a></div></div>
<div class="nv"><span>首页</span><span>公司公告</span><span>规章制度</span><span class="on">人力资源</span><span>行政服务</span><span>IT 服务台</span><span>知识库</span><span>通讯录</span></div>
<div class="crumb"><span>当前位置：首页 &gt; 人力资源 &gt; 招聘管理 &gt; 季度报告</span><em>【通知】请各部门于 10 月 20 日前提交四季度用人计划</em></div>
<div class="ct">
<h1>关于 2026 年${esc(d.title)}的通报</h1>
<div class="info"><span>发布部门：${esc(d.org)}</span><span>统计周期：${esc(d.period)}</span><span>发布日期：2026-10-08</span><span>浏览次数：326</span></div>

<div class="panel"><div class="ph">一、报告摘要</div><div class="pb"><p class="ind">${esc(d.summary)}</p></div></div>

<div class="panel"><div class="ph">二、核心指标<span>单位见表</span></div><div class="pb"><table class="tb"><tr><th>序号</th><th>指标名称</th><th>本季度</th><th>单位</th><th>较上季度</th><th>评价</th></tr>
${d.kpis.map((k, i) => `<tr><td>${i + 1}</td><td>${esc(k.label)}</td><td class="num"><b>${k.value}</b></td><td>${k.unit}</td><td class="${good(k) ? "g" : "rd"}">${esc(k.change)}</td><td class="${good(k) ? "g" : "or"}">${good(k) ? "良好" : "需关注"}</td></tr>`).join("")}</table></div></div>

<div class="row">
<div class="panel"><div class="ph">三、招聘漏斗</div><div class="pb"><table class="tb"><tr><th>阶段</th><th>人数</th><th>阶段转化率</th><th>流失人数</th></tr>
${F.map((f, i) => `<tr><td>${esc(f.stage)}</td><td class="num">${num(f.count)}</td><td class="num">${i ? f1(conv[i]) + "%" : "—"}</td><td class="num">${i ? num(lost[i]) : "—"}</td></tr>`).join("")}
<tr><td><b>整体</b></td><td colspan="3"><b>投递至入职转化率 ${overall.toFixed(2)}%</b></td></tr></table>
<div style="margin-top:10px">${portalBars()}</div></div></div>
<div class="panel"><div class="ph">四、入职渠道分布</div><div class="pb"><div style="display:flex;gap:16px;align-items:center"><div class="pie" style="background:${conic(["#4472c4", "#ed7d31", "#a5a5a5", "#ffc000", "#5b9bd5", "#70ad47"])}"></div>
<table class="tb"><tr><th>渠道</th><th>入职</th><th>占比</th><th>单人成本(万)</th></tr>${C.map((c, i) => `<tr><td class="l"><span style="display:inline-block;width:10px;height:10px;background:${["#4472c4", "#ed7d31", "#a5a5a5", "#ffc000", "#5b9bd5", "#70ad47"][i]};margin-right:6px"></span>${esc(c.name)}</td><td class="num">${c.hires}</td><td class="num">${f1(c.share)}%</td><td class="num">${c.cost}</td></tr>`).join("")}</table></div></div></div>
</div>

<div class="panel"><div class="ph">五、每周投递及面试情况<span>第 1 周至第 13 周</span></div><div class="pb"><div class="charts">
<div>${line({ w: 560, h: 230, points: appPts((w) => `${w}`), ticks: [500, 600, 700, 800, 900, 1000], stroke: "#0066cc", grid: "#dddddd", text: "#555", dots: true, width: 2, size: 11, pad: [14, 20, 24, 40], last: false })}<div class="cap">图 1　每周投递量（份）</div></div>
<div>${line({ w: 560, h: 230, points: intPts((w) => `${w}`), ticks: [50, 60, 70, 80, 90, 100], stroke: "#ff6600", grid: "#dddddd", text: "#555", dots: true, width: 2, size: 11, pad: [14, 20, 24, 40], last: false })}<div class="cap">图 2　每周面试量（场）</div></div>
</div></div></div>

<div class="panel"><div class="ph">六、各岗位招聘进度明细</div><div class="pb"><table class="tb"><tr><th>序号</th><th>岗位名称</th><th>所属部门</th><th>计划人数</th><th>已入职</th><th>在途 offer</th><th>收到简历</th><th>HC 完成率</th><th>平均周期（天）</th><th>进度状态</th></tr>
${P.map((p, i) => { const s = status(p); return `<tr><td>${i + 1}</td><td class="l">${esc(p.name)}</td><td>${esc(p.dept)}</td><td class="num">${p.plan}</td><td class="num">${p.hired}</td><td class="num">${p.pending}</td><td class="num">${num(p.applications)}</td><td class="num ${s === "late" ? "rd" : s === "done" ? "g" : ""}">${f1(rate(p))}%</td><td class="num">${p.cycle}</td><td class="${s === "late" ? "rd" : s === "done" ? "g" : "or"}">${statusText[s]}</td></tr>` }).join("")}
<tr><td colspan="3"><b>合计</b></td><td class="num"><b>${totalPlan}</b></td><td class="num"><b>${totalHired}</b></td><td class="num"><b>${totalPending}</b></td><td class="num"><b>${num(totalApps)}</b></td><td class="num"><b>${K.hc.value}%</b></td><td class="num"><b>${K.cycle.value}</b></td><td>—</td></tr></table></div></div>

<div class="panel"><div class="ph">七、主要发现</div><div class="pb"><ol class="lst">${d.findings.map((f) => `<li><b>${esc(f.title)}：</b>${esc(f.detail)}</li>`).join("")}</ol></div></div>
<div class="panel"><div class="ph">八、下一步工作安排</div><div class="pb"><ol class="lst">${d.actions.map((f) => `<li><b>${esc(f.title)}：</b>${esc(f.detail)}</li>`).join("")}</ol></div></div>
<div class="panel"><div class="ph">九、风险提示</div><div class="pb"><div class="warn"><ol class="lst">${d.risks.map((r) => `<li>${esc(r)}</li>`).join("")}</ol></div>
<div class="att">附件：<a>2026Q3 招聘数据明细.xlsx</a><a>四季度用人计划模板.docx</a></div></div></div>
</div>
<div class="ft">版权所有 © 2026 青禾科技 人力资源部　|　技术支持：信息中心　|　内部资料，请勿外传<br>建议使用 1280×800 以上分辨率浏览</div>
</div>`),

  // ---------------------------------------------------------------- e 故事线 / 时间轴
  e: doc(`
body{background:#fbfaf6;color:#1c2321;font-family:"Noto Sans SC",sans-serif;font-size:15px;line-height:1.75}
.num{font-variant-numeric:tabular-nums}
.mono{font-family:"IBM Plex Mono",monospace}
.wrap{width:1120px;margin:0 auto;padding:72px 0 96px}
.kick{font-size:13px;color:#6b726f;letter-spacing:.06em}
h1{font-family:"Noto Serif SC",serif;font-weight:600;font-size:46px;line-height:60px;margin-top:12px}
.sub{font-family:"Noto Serif SC",serif;font-size:22px;color:#2f5d50;margin-top:6px}
.lead{max-width:800px;margin-top:24px;font-size:16.5px;line-height:1.95;color:#3a4441}
.kp{display:grid;grid-template-columns:repeat(4,1fr);margin-top:40px;border-top:1px solid #1c2321;border-bottom:1px solid #e3e1da}
.kp div{padding:16px 20px 18px}.kp div:first-child{padding-left:0}.kp div+div{border-left:1px solid #e3e1da}
.kp span{font-size:13px;color:#6b726f;display:block}
.kp b{font-size:32px;line-height:44px;font-weight:500}.kp small{font-size:14px;color:#6b726f;margin-left:4px;font-weight:400}
.kp em{display:block;font-style:normal;font-size:13px}
.up{color:#2f7a4f}.dn{color:#b0472e}
.tl{position:relative;margin-top:72px;padding-left:112px}
.tl:before{content:"";position:absolute;left:39px;top:8px;bottom:8px;width:2px;background:#d6d3c8}
.ch{position:relative;padding-bottom:28px}
.node{position:absolute;left:-112px;top:2px;width:80px;height:80px;border-radius:50%;background:#2f5d50;color:#fbfaf6;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.2}
.node b{font-family:"IBM Plex Mono",monospace;font-size:22px;font-weight:500}
.node span{font-size:11px;opacity:.8}
.ch h2{font-family:"Noto Serif SC",serif;font-weight:600;font-size:30px;line-height:40px;display:flex;align-items:baseline;gap:16px}
.ch h2 .mono{font-size:30px;color:#2f5d50;font-weight:500}
.ch h2 small{font-size:15px;color:#6b726f;font-family:"Noto Sans SC";font-weight:400}
.ch>p{max-width:820px;margin-top:10px;color:#3a4441}
.blk{margin-top:24px;background:#fff;border:1px solid #e3e1da;border-radius:4px;padding:24px 28px}
.blk h4{font-size:14px;font-weight:600;display:flex;justify-content:space-between}
.blk h4 span{font-weight:400;color:#6b726f;font-size:13px}
.drop{position:relative;margin:4px 0 36px;color:#8a8f8b;font-size:14px;display:flex;align-items:center;gap:12px}
.drop:before{content:"";position:absolute;left:-80px;top:50%;width:16px;height:16px;margin-top:-8px;border-radius:50%;background:#fbfaf6;border:2px dashed #b9b5a8}
.drop b{color:#b0472e;font-weight:500}
.call{margin-top:20px;border-left:3px solid #b5803a;background:#f5efe2;padding:14px 20px;max-width:880px}
.call span{font-size:12px;color:#8a6a2f;letter-spacing:.08em}
.call b{display:block;font-family:"Noto Serif SC",serif;font-size:18px;margin-top:2px}
.call p{font-size:14.5px;color:#4b4a42;margin-top:2px}
.split{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.acc{display:flex;height:40px;margin-top:14px;border-radius:2px;overflow:hidden}
.acc div{display:flex;align-items:center;padding-left:12px;color:#fff;font-size:14px}
.big{font-size:44px;line-height:52px;font-weight:500}
.big small{font-size:15px;color:#6b726f;margin-left:4px;font-weight:400}
table{font-size:14px}
th{font-size:12px;color:#6b726f;font-weight:400;text-align:left;padding:0 10px 8px;border-bottom:1px solid #1c2321}
td{padding:10px;border-bottom:1px solid #eeece5}
th:first-child,td:first-child{padding-left:0}
.r{text-align:right}
.hb{height:8px;background:#eeece5;position:relative;width:140px;display:inline-block;vertical-align:middle;margin-right:10px}
.hb i{position:absolute;left:0;top:0;bottom:0;background:#2f5d50}
.hb u{position:absolute;top:0;bottom:0;background:#9cb8ae}
.stk{display:flex;height:14px;margin-top:12px}
.stk div{height:100%}
.chl{display:grid;grid-template-columns:repeat(3,1fr);gap:10px 24px;margin-top:16px}
.chl div{font-size:13.5px;display:grid;grid-template-columns:10px 1fr auto;gap:8px;align-items:center;border-bottom:1px solid #eeece5;padding-bottom:6px}
.chl i{width:10px;height:10px;border-radius:2px}
.chl em{font-style:normal;color:#6b726f}
.next{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:22px}
.next div{border-top:2px solid #2f5d50;padding-top:12px}
.next b{font-family:"Noto Serif SC",serif;font-size:18px;font-weight:600}
.next p{font-size:14px;color:#4b5250;margin-top:4px}
.risk{margin-top:24px;display:grid;grid-template-columns:96px 1fr;gap:20px;padding:16px 0;border-top:1px solid #e3e1da;border-bottom:1px solid #e3e1da}
.risk h5{font-size:14px;color:#b0472e;font-weight:600}
.risk li{list-style:none;font-size:14.5px;color:#3a4441;padding-left:16px;position:relative}
.risk li+li{margin-top:6px}
.risk li:before{content:"";position:absolute;left:0;top:11px;width:6px;height:6px;background:#b0472e;border-radius:50%}
.end .node{background:#b5803a}
.foot{margin-top:48px;font-size:12px;color:#8a8f8b}
`, `<div class="wrap">
<div class="kick">${esc(d.org)}　·　${esc(d.period)}</div>
<h1>${esc(d.title)}</h1>
<div class="sub">一份简历的旅程：从 ${num(F[0].count)} 份投递到 ${totalHired} 位新同事</div>
<p class="lead">${esc(d.summary)}</p>
<div class="kp">${d.kpis.map((k) => `<div><span>${esc(k.label)}</span><b class="num">${k.value}<small>${k.unit}</small></b><em class="${good(k) ? "up" : "dn"}">${k.change.startsWith("−") ? "↓" : "↑"} ${esc(k.change)}</em></div>`).join("")}</div>

<div class="tl">
<div class="ch"><div class="node"><b>01</b><span>投递</span></div>
<h2>投递<span class="mono">${num(F[0].count)}</span><small>份简历</small></h2>
<p>七月中旬校招与社招同时启动，第 ${peak.week} 周投递量达到 ${num(peak.applications)} 份的峰值，之后回落到每周 700 份上下；九月底随着新一批职位发布又回升了一轮。研发与销售岗合计吸引了超过一半的简历。</p>
<div class="blk"><h4>每周投递量<span>单位：份</span></h4>${line({ w: 950, h: 240, points: appPts((w) => `第 ${w} 周`), ticks: [500, 600, 700, 800, 900, 1000], stroke: "#2f5d50", grid: "#eeece5", text: "#8a8f8b", fill: "rgba(47,93,80,.08)", width: 2, dots: true, size: 12, pad: [14, 24, 24, 40], last: false })}</div>
</div>
<div class="drop">筛掉 <b class="num">${num(lost[1])}</b> 份 · 简历通过率 ${f1(conv[1])}%</div>

<div class="ch"><div class="node"><b>02</b><span>筛选</span></div>
<h2>筛选通过<span class="mono">${num(F[1].count)}</span><small>份</small></h2>
<p>简历量最大的是销售代表和后端工程师，但简历多并不意味着好招：算法工程师 860 份简历最终只入职了 4 人。</p>
<div class="blk"><h4>各岗位收到的简历<span>单位：份</span></h4><div style="margin-top:14px">${bars([...P].sort((a, b) => b.applications - a.applications).map((p) => ({ label: p.name, value: p.applications, display: num(p.applications) })), { max: 2800, color: "#2f5d50", track: "#eeece5", labelW: 96, valueW: 56, h: 10, gap: 12, radius: 0 })}</div></div>
</div>
<div class="drop">未进入面试 <b class="num">${num(lost[2])}</b> 人 · 面试邀约率 ${f1(conv[2])}%</div>

<div class="ch"><div class="node"><b>03</b><span>面试</span></div>
<h2>面试<span class="mono">${num(F[2].count)}</span><small>场</small></h2>
<p>每周面试量在 60 到 90 场之间，基本跟随投递量变化。真正的瓶颈出现在面试之后。</p>
<div class="blk"><h4>每周面试量<span>单位：场</span></h4>${line({ w: 950, h: 180, points: intPts((w) => `第 ${w} 周`), ticks: [50, 75, 100], stroke: "#b5803a", grid: "#eeece5", text: "#8a8f8b", width: 2, dots: true, size: 12, pad: [14, 24, 24, 40], last: false })}</div>
<div class="call"><span>发现 · 03</span><b>${esc(d.findings[2].title)}</b><p>${esc(d.findings[2].detail)}</p></div>
</div>
<div class="drop">未获 offer <b class="num">${num(lost[3])}</b> 人 · 面试通过率 ${f1(conv[3])}%</div>

<div class="ch"><div class="node"><b>04</b><span>offer</span></div>
<h2>发出 offer<span class="mono">${F[3].count}</span><small>个</small></h2>
<p>109 个 offer 中 86 人已经入职，${totalPending} 个仍在途，其余 ${F[3].count - F[4].count - totalPending} 人拒绝。offer 接受率 ${K.accept.value}%，比上季度下降 4.1 个百分点，被截走的候选人集中在算法岗。</p>
<div class="blk split"><div><h4>offer 去向</h4><div class="acc"><div style="width:${K.accept.value}%;background:#2f5d50">已入职 ${F[4].count}</div><div style="width:${(totalPending / F[3].count) * 100}%;background:#9cb8ae"></div><div style="flex:1;background:#c9a978">拒绝 ${F[3].count - F[4].count - totalPending}</div></div><div style="font-size:13px;color:#6b726f;margin-top:8px">浅色为在途 ${totalPending} 个，预计 10 月内陆续到岗</div></div>
<div style="padding-left:20px;border-left:1px solid #eeece5"><h4>offer 接受率</h4><div class="big num">${K.accept.value}<small>%</small></div><div class="dn" style="font-size:13px">↓ ${esc(K.accept.change)}</div></div></div>
<div class="call"><span>发现 · 02</span><b>${esc(d.findings[1].title)}</b><p>${esc(d.findings[1].detail)}</p></div>
</div>
<div class="drop">未入职 <b class="num">${num(lost[4])}</b> 人 · 整体转化率 ${overall.toFixed(2)}%</div>

<div class="ch"><div class="node"><b>05</b><span>入职</span></div>
<h2>入职<span class="mono">${F[4].count}</span><small>位新同事</small></h2>
<p>全公司计划招聘 ${totalPlan} 人，HC 完成率 ${K.hc.value}%。销售与前端岗位基本按计划补齐，算法和数据岗明显落后；平均招聘周期 ${K.cycle.value} 天，比上季度多了 4 天。</p>
<div class="blk"><h4>各岗位进度<span>深色为已入职，浅色为在途 offer</span></h4>
<table style="margin-top:12px"><tr><th>岗位</th><th>部门</th><th>进度</th><th class="r">计划</th><th class="r">已入职</th><th class="r">在途</th><th class="r">完成率</th><th class="r">平均周期</th></tr>
${P.map((p) => `<tr><td>${esc(p.name)}</td><td style="color:#6b726f">${esc(p.dept)}</td><td><span class="hb"><i style="width:${rate(p)}%"></i><u style="left:${rate(p)}%;width:${(p.pending / p.plan) * 100}%"></u></span></td><td class="r num">${p.plan}</td><td class="r num">${p.hired}</td><td class="r num">${p.pending}</td><td class="r num ${status(p) === "late" ? "dn" : ""}">${f1(rate(p))}%</td><td class="r num">${p.cycle} 天</td></tr>`).join("")}</table></div>
<div class="blk"><h4>他们从哪里来<span>按入职人数 · 单人成本</span></h4>
<div class="stk">${C.map((c, i) => `<div style="width:${c.share}%;background:${["#2f5d50", "#5d8c7d", "#b5803a", "#d6b77f", "#8aa1b5", "#c9c5b8"][i]}"></div>`).join("")}</div>
<div class="chl">${C.map((c, i) => `<div><i style="background:${["#2f5d50", "#5d8c7d", "#b5803a", "#d6b77f", "#8aa1b5", "#c9c5b8"][i]}"></i><span>${esc(c.name)} <b class="num">${c.hires}</b> 人 · ${f1(c.share)}%</span><em class="num">${c.cost} 万元/人</em></div>`).join("")}</div></div>
<div class="call"><span>发现 · 01</span><b>${esc(d.findings[0].title)}</b><p>${esc(d.findings[0].detail)}</p></div>
</div>

<div class="ch end" style="padding-bottom:0"><div class="node"><b>Q4</b><span>下一季</span></div>
<h2>下一站<small>四季度要做的三件事</small></h2>
<div class="next">${d.actions.map((a) => `<div><b>${esc(a.title)}</b><p>${esc(a.detail)}</p></div>`).join("")}</div>
<div class="risk"><h5>风险</h5><ul>${d.risks.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>
</div>
</div>
<div class="foot">数据来源：${esc(d.org)}招聘系统，统计截至 2026 年 9 月 30 日。</div>
</div>`),
}
