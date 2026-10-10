// 十月园区能耗月报 in five styles: an infographic with one palette for the uses,
// a plain document with a label column, a compact single column, a card
// dashboard, and a numbered intranet report built from tables.
import { readData, doc, esc, num, line, bars } from "../style-kit.mjs"

const D = readData("energy")
const K = Object.fromEntries(D.kpis.map((k) => [k.key, k]))
const Y = D.daily
const B = D.buildings
const U = D.uses
const isNeg = (c) => String(c).startsWith("−")
const HOT = [7, 11] // 10/8 .. 10/12
const mwh = Y.map((d) => ({ x: d.date, y: d.mwh }))

// daily use as columns, solar share drawn as a lighter cap; hot days marked
const columns = ({ w, h, color, solar, hot, grid = "#e8e8e8", text = "#888", size = 11, pad = [14, 8, 22, 34] }) => {
  const [pt, pr, pb, pl] = pad, n = Y.length, bw = (w - pl - pr) / n
  const y = (v) => pt + (1 - v / 140) * (h - pt - pb)
  const g = [0, 35, 70, 105, 140].map((v) => `<line x1="${pl}" x2="${w - pr}" y1="${y(v)}" y2="${y(v)}" stroke="${grid}"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")
  const hs = hot ? `<rect x="${pl + HOT[0] * bw}" y="${pt}" width="${(HOT[1] - HOT[0] + 1) * bw}" height="${h - pt - pb}" fill="${hot}"/>` : ""
  const cs = Y.map((d, i) => {
    const x = pl + i * bw + bw * 0.18, ww = bw * 0.64
    const top = y(d.mwh), pv = solar ? y(d.pv) - y(0) : 0
    return `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${ww.toFixed(1)}" height="${(y(0) - top).toFixed(1)}" fill="${color}"/>` +
      (solar ? `<rect x="${x.toFixed(1)}" y="${(y(0) + pv).toFixed(1)}" width="${ww.toFixed(1)}" height="${(-pv).toFixed(1)}" fill="${solar}"/>` : "")
  }).join("")
  const xs = Y.map((d, i) => i % 5 === 0 || i === n - 1 ? `<text x="${pl + i * bw + bw / 2}" y="${h - 5}" text-anchor="middle">${d.date}</text>` : "").join("")
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;font-size:${size}px;fill:${text}">${hs}${g}${cs}${xs}</svg>`
}

// ---------------------------------------------------------------- a: infographic, one palette
const a = (() => {
  const P = ["#1f6f5c", "#2f9c7f", "#6cc3a6", "#e3b04b", "#d9822b", "#b9b3a6"] // uses, fixed order
  const ink = "#16302a", sun = "#e3b04b", hot = "rgba(217,130,43,.12)"
  const stack = `<div class="stack">${U.map((u, i) => `<i style="width:${u.share}%;background:${P[i]}"></i>`).join("")}</div>
<div class="leg">${U.map((u, i) => `<span><b style="background:${P[i]}"></b>${esc(u.name)}<em>${u.share}%</em></span>`).join("")}</div>`
  const maxI = Math.max(...B.map((b) => b.kwh))
  return doc(`
body{background:#f6f3ec;font-family:"Noto Sans SC";color:${ink};font-size:14px;font-variant-numeric:tabular-nums}
.wrap{max-width:1056px;margin:0 auto;padding:56px 0 64px}
.org{font-size:13px;color:#5e7069;letter-spacing:1px}
h1{font-family:"Noto Serif SC";font-weight:600;font-size:40px;margin:10px 0 6px;letter-spacing:2px}
.per{color:#5e7069;font-size:13px}
.lead{font-size:16px;line-height:1.9;margin-top:22px;max-width:860px}
.big{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:36px;border-top:3px solid ${ink}}
.big div{padding:18px 18px 0 0}
.big .l{font-size:13px;color:#5e7069}
.big .v{font-size:40px;font-weight:300;margin-top:4px;line-height:1.1}
.big .v small{font-size:14px;margin-left:4px;color:#5e7069}
.big .c{font-size:13px;margin-top:6px}.big .c.good{color:#1f6f5c}.big .c.bad{color:#c0532a}
h2{font-family:"Noto Serif SC";font-weight:600;font-size:22px;margin:56px 0 6px;display:flex;align-items:baseline;gap:14px}
h2 span{font-family:"Noto Sans SC";font-weight:400;font-size:13px;color:#5e7069}
.sub{font-size:13px;color:#5e7069;margin-bottom:16px}
.stack{display:flex;height:34px;border-radius:4px;overflow:hidden;margin-top:14px}
.leg{display:flex;flex-wrap:wrap;gap:8px 26px;margin-top:14px;font-size:13px}
.leg b{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:7px;vertical-align:-1px}
.leg em{font-style:normal;color:#5e7069;margin-left:6px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:48px}
.bld{display:flex;flex-direction:column;gap:14px;margin-top:6px}
.bld .r{display:grid;grid-template-columns:140px 1fr 64px 60px;gap:12px;align-items:center;font-size:13px}
.bld .t{height:12px;background:#e7e1d4;border-radius:6px}.bld .t i{display:block;height:100%;border-radius:6px;background:#2f9c7f}
.bld .r.warn .t i{background:#d9822b}
.bld .ch{text-align:right;color:#1f6f5c}.bld .ch.up{color:#c0532a}
.pue{display:flex;align-items:center;gap:28px;margin-top:6px}
.ring{width:150px;height:150px;border-radius:50%;background:conic-gradient(#2f9c7f 0 ${(1.4 / 1.42) * 100}%,#e7e1d4 0);display:grid;place-items:center}
.ring div{width:112px;height:112px;border-radius:50%;background:#f6f3ec;display:grid;place-items:center;text-align:center}
.ring b{font-size:30px;font-weight:400;display:block}.ring span{font-size:12px;color:#5e7069}
.pue p{font-size:14px;line-height:1.9}
.alerts{margin-top:18px;display:flex;flex-direction:column;gap:10px}
.alerts div{border-left:3px solid #d9822b;padding:4px 0 4px 12px;font-size:13px;line-height:1.7}
.alerts b{font-weight:500;color:#c0532a;margin-right:8px}
.three{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-top:8px}
.f .n{width:34px;height:34px;border-radius:50%;background:${ink};color:#f6f3ec;display:grid;place-items:center;font-family:"Noto Serif SC";font-size:16px}
.f h3{font-size:16px;font-weight:500;margin:14px 0 8px}
.f p{font-size:13px;line-height:1.85;color:#3c4f49}
.f .own{display:inline-block;margin-top:10px;font-size:12px;color:#1f6f5c;border:1px solid #9fcdbd;border-radius:12px;padding:1px 10px}
.risk{margin-top:44px;background:${ink};color:#f6f3ec;border-radius:6px;padding:24px 28px;display:grid;grid-template-columns:120px 1fr 1fr;gap:28px}
.risk h4{font-family:"Noto Serif SC";font-size:18px;font-weight:600;color:${sun}}
.risk b{font-weight:500;display:block;margin-bottom:6px}.risk p{font-size:13px;line-height:1.8;color:#cfd8d4}
.foot{margin-top:40px;font-size:12px;color:#8a958f}
`, `<div class="wrap">
<div class="org">${esc(D.org)}</div>
<h1>${esc(D.title)}</h1><div class="per">${esc(D.period)}</div>
<p class="lead">${esc(D.summary)}</p>
<div class="big">${D.kpis.map((k) => `<div><div class="l">${esc(k.label)}</div><div class="v">${esc(k.value)}<small>${esc(k.unit)}</small></div><div class="c ${k.good ? "good" : "bad"}">${esc(k.change)} 较九月</div></div>`).join("")}</div>
<h2>每天用了多少电<span>单位：兆瓦时</span></h2>
<div class="sub">绿色为当日用电，金色为其中的光伏发电；浅橙色为 10 月 8 日至 12 日高温补班期。</div>
${columns({ w: 1056, h: 250, color: "#2f9c7f", solar: sun, hot, text: "#5e7069", grid: "#e2dccf" })}
<h2>电用在了哪里<span>按用途分项计量</span></h2>
${stack}
<div class="two">
<div><h2>各楼栋<span>万千瓦时 · 较九月</span></h2>
<div class="bld">${B.map((b) => `<div class="r ${isNeg(b.change) ? "" : "warn"}"><span>${esc(b.name)}</span><div class="t"><i style="width:${(b.kwh / maxI) * 100}%"></i></div><span style="text-align:right">${b.kwh}</span><span class="ch ${isNeg(b.change) ? "" : "up"}">${esc(b.change)}</span></div>`).join("")}</div></div>
<div><h2>数据中心 PUE<span>目标 ${D.pue.target}</span></h2>
<div class="pue"><div class="ring"><div><span>PUE</span><b>${D.pue.value}</b><span>${esc(D.pue.change)}</span></div></div>
<p>冷通道封闭完成六成，PUE 较九月回落 0.06，距目标还差 0.02。</p></div>
<div class="alerts">${D.alerts.map((x) => `<div><b>${esc(x.date)} ${esc(x.time)}</b>${esc(x.text)}</div>`).join("")}</div></div>
</div>
<h2>三个发现</h2>
<div class="three">${D.findings.map((f, i) => `<div class="f"><div class="n">${i + 1}</div><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></div>`).join("")}</div>
<h2>十一月要做的事</h2>
<div class="three">${D.actions.map((f, i) => `<div class="f"><div class="n">${"甲乙丙"[i]}</div><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p><span class="own">${esc(f.owner)}</span></div>`).join("")}</div>
<div class="risk"><h4>需要留意</h4>${D.risks.map((r) => `<div><b>${esc(r.title)}</b><p>${esc(r.text)}</p></div>`).join("")}</div>
<div class="foot">数据来源：园区能源管理平台分项计量，光伏为并网电表读数。</div>
</div>`)
})()

// ---------------------------------------------------------------- b: plain document, label column, roomy
const b = (() => {
  const sec = (label, note, body, gap) => `<section style="margin-top:${gap}px"><div class="lab"><h2>${esc(label)}</h2>${note ? `<p>${esc(note)}</p>` : ""}</div><div class="body">${body}</div></section>`
  return doc(`
body{background:#fff;font-family:"Noto Sans SC";color:#111;font-size:14px;font-variant-numeric:tabular-nums}
.wrap{max-width:1100px;margin:0 auto;padding:64px 0 96px}
.top{display:grid;grid-template-columns:220px 1fr}
.top .m{font-size:12px;color:#777;line-height:1.7}
h1{font-size:34px;font-weight:500}
section{display:grid;grid-template-columns:220px 1fr}
.lab h2{font-size:16px;font-weight:500}
.lab p{font-size:12px;color:#888;margin-top:6px;line-height:1.7;padding-right:28px}
.body p.t{font-size:15px;line-height:1.9;max-width:720px}
.k{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.k .l{font-size:12px;color:#888}.k .v{font-size:34px;font-weight:300;margin-top:6px}.k .v small{font-size:13px;color:#888;margin-left:3px}
.k .c{font-size:12px;color:#888;margin-top:4px}
table{font-size:13px}
th{font-weight:400;color:#888;text-align:left;padding:8px 0;border-bottom:1px solid #ddd}
td{padding:10px 0;border-bottom:1px solid #f0f0f0}
th.r,td.r{text-align:right}
.li{display:flex;flex-direction:column;gap:18px;max-width:640px}
.li b{font-weight:500;display:block;margin-bottom:4px}.li span{color:#555;line-height:1.8;font-size:13px}
`, `<div class="wrap">
<div class="top"><div class="m">${esc(D.org)}<br>${esc(D.period)}</div><h1>${esc(D.title)}</h1></div>
${sec("概述", "", `<p class="t">${esc(D.summary)}</p>`, 120)}
${sec("核心指标", "均与九月比较", `<div class="k">${D.kpis.map((k) => `<div><div class="l">${esc(k.label)}</div><div class="v">${esc(k.value)}<small>${esc(k.unit)}</small></div><div class="c">${esc(k.change)}</div></div>`).join("")}</div>`, 96)}
${sec("每日用电", "单位：兆瓦时。10 月 8 日至 12 日为高温补班期。", line({ w: 880, h: 220, points: mwh, ticks: [70, 90, 110, 130], xEvery: 5, stroke: "#111", grid: "#eee", text: "#999", last: true }), 160)}
${sec("用途构成", "按分项计量", bars(U.map((u) => ({ label: u.name, value: u.share, display: `${u.share}%` })), { max: 40, color: "#111", track: "#eee", labelW: 80, gap: 14 }), 220)}
${sec("楼栋", "万千瓦时", `<table><tr><th>楼栋</th><th class="r">用电量</th><th class="r">较九月</th><th class="r">单位面积能耗</th></tr>${B.map((x) => `<tr><td>${esc(x.name)}</td><td class="r">${x.kwh}</td><td class="r">${esc(x.change)}</td><td class="r">${x.intensity}</td></tr>`).join("")}</table>`, 130)}
${sec("数据中心", "", `<p class="t">PUE ${D.pue.value}，较九月 ${esc(D.pue.change)}，目标 ${D.pue.target}。本月两次需量预警：${D.alerts.map((x) => `${esc(x.date)} ${esc(x.time)}，${esc(x.text)}`).join("；")}。</p>`, 240)}
${sec("发现", "", `<div class="li">${D.findings.map((f) => `<div><b>${esc(f.title)}</b><span>${esc(f.text)}</span></div>`).join("")}</div>`, 110)}
${sec("下月计划", "", `<div class="li">${D.actions.map((f, i) => `<div><b>${i + 1}　${esc(f.title)}</b><span>${esc(f.text)}（${esc(f.owner)}）</span></div>`).join("")}</div>`, 180)}
${sec("风险", "", `<div class="li">${D.risks.map((f) => `<div><b>${esc(f.title)}</b><span>${esc(f.text)}</span></div>`).join("")}</div>`, 120)}
</div>`)
})()

// ---------------------------------------------------------------- c: compact single column
const c = (() => {
  const acc = "#b4441f"
  return doc(`
body{background:#fff;font-family:"Noto Sans SC";color:#151515;font-size:14px;font-variant-numeric:tabular-nums}
.wrap{max-width:1000px;margin:0 auto;padding:52px 0 60px}
.m{font-size:12px;color:#777}
h1{font-size:30px;font-weight:600;margin:8px 0 12px}
.lead{font-size:15px;line-height:1.85;color:#333;max-width:900px}
.k{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #151515;margin-top:28px}
.k div{padding:14px 16px 0 0;border-right:1px solid #e5e5e5;padding-left:16px}.k div:first-child{padding-left:0}.k div:last-child{border-right:0}
.k .l{font-size:12px;color:#777}.k .v{font-size:30px;font-weight:300;margin-top:4px}.k .v small{font-size:13px;color:#777;margin-left:3px}
.k .c{font-size:12px;color:#777;margin-top:2px}.k .c.bad{color:${acc}}
h2{font-size:17px;font-weight:600;margin:40px 0 4px;padding-top:12px;border-top:1px solid #e5e5e5;display:flex;justify-content:space-between;align-items:baseline}
h2 span{font-size:12px;font-weight:400;color:#888}
.sub{font-size:12px;color:#888;margin-bottom:12px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:40px}
table{font-size:13px}
th{font-weight:400;color:#888;text-align:left;padding:6px 0;border-bottom:1px solid #ddd;font-size:12px}
td{padding:8px 0;border-bottom:1px solid #f0f0f0}
th.r,td.r{text-align:right}td.bad{color:${acc}}
.f3{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.f3 .n{font-size:12px;color:#888}.f3 b{display:block;font-weight:500;margin:4px 0 6px}.f3 p{font-size:13px;color:#444;line-height:1.75}
.f3 .o{font-size:12px;color:#888;margin-top:6px}
.al{font-size:13px;line-height:1.8;color:#333;margin-top:14px}.al b{color:${acc};font-weight:500;margin-right:6px}
`, `<div class="wrap">
<div class="m">${esc(D.org)} · ${esc(D.period)}</div>
<h1>${esc(D.title)}</h1>
<p class="lead">${esc(D.summary)}</p>
<div class="k">${D.kpis.map((k) => `<div><div class="l">${esc(k.label)}</div><div class="v">${esc(k.value)}<small>${esc(k.unit)}</small></div><div class="c ${k.good ? "" : "bad"}">${esc(k.change)}</div></div>`).join("")}</div>
<h2>每日用电<span>兆瓦时 · 浅色区为 10/8–10/12 高温补班</span></h2>
${columns({ w: 1000, h: 210, color: "#151515", hot: "rgba(180,68,31,.08)", text: "#888", grid: "#eee" })}
<div class="two">
<div><h2>用途构成<span>分项计量</span></h2>${bars(U.map((u) => ({ label: u.name, value: u.share, display: `${u.share}%` })), { max: 40, color: "#151515", track: "#eee", labelW: 70, gap: 11 })}</div>
<div><h2>数据中心与需量<span>PUE 目标 ${D.pue.target}</span></h2>
<div style="font-size:30px;font-weight:300">${D.pue.value}<small style="font-size:13px;color:#777;margin-left:6px">PUE · 较九月 ${esc(D.pue.change)}</small></div>
<div class="al">${D.alerts.map((x) => `<div><b>${esc(x.date)} ${esc(x.time)}</b>${esc(x.text)}</div>`).join("")}</div></div>
</div>
<h2>各楼栋<span>万千瓦时</span></h2>
<table><tr><th>楼栋</th><th class="r">建筑面积（平方米）</th><th class="r">用电量</th><th class="r">较九月</th><th class="r">单位面积能耗</th></tr>${B.map((x) => `<tr><td>${esc(x.name)}</td><td class="r">${num(x.area)}</td><td class="r">${x.kwh}</td><td class="r ${isNeg(x.change) ? "" : "bad"}">${esc(x.change)}</td><td class="r">${x.intensity}</td></tr>`).join("")}</table>
<h2>发现</h2>
<div class="f3">${D.findings.map((f, i) => `<div><div class="n">0${i + 1}</div><b>${esc(f.title)}</b><p>${esc(f.text)}</p></div>`).join("")}</div>
<h2>十一月计划与风险</h2>
<div class="f3">${D.actions.map((f, i) => `<div><div class="n">0${i + 1}</div><b>${esc(f.title)}</b><p>${esc(f.text)}</p><div class="o">${esc(f.owner)}</div></div>`).join("")}</div>
<div class="al" style="margin-top:18px">${D.risks.map((r) => `<div><b>风险</b>${esc(r.title)}：${esc(r.text)}</div>`).join("")}</div>
</div>`)
})()

// ---------------------------------------------------------------- d: card dashboard, a colour per card
const d = (() => {
  const C = ["#4c6ef5", "#12b886", "#fab005", "#f03e3e", "#7950f2", "#15aabf"]
  const donut = (() => {
    let acc = 0
    const seg = U.map((u, i) => { const s = `${C[i]} ${acc}% ${acc + u.share}%`; acc += u.share; return s }).join(",")
    return `<div style="width:150px;height:150px;border-radius:50%;background:conic-gradient(${seg});display:grid;place-items:center"><div style="width:96px;height:96px;border-radius:50%;background:#fff;display:grid;place-items:center;text-align:center;font-size:12px;color:#868e96"><div><b style="display:block;font-size:20px;color:#212529">335.6</b>万千瓦时</div></div></div>`
  })()
  return doc(`
body{background:#f1f3f5;font-family:"Noto Sans SC";color:#212529;font-size:14px;font-variant-numeric:tabular-nums}
.wrap{max-width:1200px;margin:0 auto;padding:24px 0 40px}
.hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
h1{font-size:22px;font-weight:600}.hd .m{font-size:13px;color:#868e96;margin-top:4px}
.tag{display:inline-block;font-size:12px;border-radius:12px;padding:3px 12px;margin-left:6px;color:#fff}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.kc{border-radius:12px;padding:18px 20px;color:#fff}
.kc .l{font-size:13px;opacity:.85}.kc .v{font-size:30px;font-weight:600;margin-top:6px}.kc .v small{font-size:13px;font-weight:400;margin-left:4px;opacity:.85}
.kc .c{display:inline-block;margin-top:8px;font-size:12px;background:rgba(255,255,255,.22);border-radius:10px;padding:1px 8px}
.card{background:#fff;border-radius:12px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.card h2{font-size:15px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.card h2 i{width:4px;height:14px;border-radius:2px;display:inline-block}
.row{display:grid;gap:16px;margin-top:16px}
.sum{background:#fff4e6;border:1px solid #ffd8a8;border-radius:12px;padding:14px 18px;line-height:1.8;margin-top:16px;font-size:13px}
.leg{display:flex;flex-direction:column;gap:9px;font-size:13px}
.leg b{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px}
table{font-size:13px}th{font-weight:500;color:#868e96;text-align:left;padding:8px 10px;background:#f8f9fa;font-size:12px}td{padding:9px 10px;border-bottom:1px solid #f1f3f5}
th.r,td.r{text-align:right}
.pill{display:inline-block;font-size:12px;border-radius:10px;padding:1px 8px}.pill.g{background:#d3f9d8;color:#2b8a3e}.pill.r{background:#ffe3e3;color:#c92a2a}
.it{padding:10px 12px;border-radius:8px;margin-bottom:10px;font-size:13px;line-height:1.7}
.it b{display:block;font-weight:600;margin-bottom:2px}
`, `<div class="wrap">
<div class="hd"><div><h1>${esc(D.title)}<span class="tag" style="background:#4c6ef5">月报</span><span class="tag" style="background:#12b886">已发布</span></h1><div class="m">${esc(D.org)} · ${esc(D.period)}</div></div><span class="tag" style="background:#212529">导出 PDF</span></div>
<div class="g4">${D.kpis.map((k, i) => `<div class="kc" style="background:${C[i]}"><div class="l">${esc(k.label)}</div><div class="v">${esc(k.value)}<small>${esc(k.unit)}</small></div><span class="c">${esc(k.change)}</span></div>`).join("")}</div>
<div class="sum"><b>本月摘要：</b>${esc(D.summary)}</div>
<div class="row" style="grid-template-columns:2fr 1fr">
<div class="card"><h2><i style="background:#4c6ef5"></i>每日用电（兆瓦时）</h2>${line({ w: 740, h: 220, points: mwh, ticks: [70, 90, 110, 130], xEvery: 5, stroke: "#4c6ef5", fill: "rgba(76,110,245,.12)", grid: "#f1f3f5", text: "#adb5bd", last: true })}</div>
<div class="card"><h2><i style="background:#12b886"></i>用途构成</h2><div style="display:flex;gap:20px;align-items:center">${donut}<div class="leg">${U.map((u, i) => `<span><b style="background:${C[i]}"></b>${esc(u.name)} ${u.share}%</span>`).join("")}</div></div></div>
</div>
<div class="row" style="grid-template-columns:3fr 2fr">
<div class="card"><h2><i style="background:#fab005"></i>楼栋排行</h2><table><tr><th>楼栋</th><th class="r">万千瓦时</th><th class="r">变化</th><th class="r">单位面积</th></tr>${B.map((x) => `<tr><td>${esc(x.name)}</td><td class="r">${x.kwh}</td><td class="r"><span class="pill ${isNeg(x.change) ? "g" : "r"}">${esc(x.change)}</span></td><td class="r">${x.intensity}</td></tr>`).join("")}</table></div>
<div class="card"><h2><i style="background:#7950f2"></i>PUE 与预警</h2>
<div style="display:flex;gap:16px;margin-bottom:12px"><div class="kc" style="background:#7950f2;flex:1;padding:14px 16px"><div class="l">PUE</div><div class="v" style="font-size:26px">${D.pue.value}</div><span class="c">${esc(D.pue.change)}</span></div><div class="kc" style="background:#15aabf;flex:1;padding:14px 16px"><div class="l">目标</div><div class="v" style="font-size:26px">${D.pue.target}</div><span class="c">差 0.02</span></div></div>
${D.alerts.map((x) => `<div class="it" style="background:#ffe3e3"><b style="color:#c92a2a">⚠ ${esc(x.date)} ${esc(x.time)}</b>${esc(x.text)}</div>`).join("")}</div>
</div>
<div class="row" style="grid-template-columns:1fr 1fr 1fr">
<div class="card"><h2><i style="background:#f03e3e"></i>本月发现</h2>${D.findings.map((f, i) => `<div class="it" style="background:${["#edf2ff", "#fff0f6", "#fff9db"][i]}"><b>${esc(f.title)}</b>${esc(f.text)}</div>`).join("")}</div>
<div class="card"><h2><i style="background:#12b886"></i>下月行动</h2>${D.actions.map((f) => `<div class="it" style="background:#ebfbee"><b>${esc(f.title)}</b>${esc(f.text)}<br><span class="pill g">${esc(f.owner)}</span></div>`).join("")}</div>
<div class="card"><h2><i style="background:#fab005"></i>风险提示</h2>${D.risks.map((f) => `<div class="it" style="background:#fff4e6"><b style="color:#e8590c">${esc(f.title)}</b>${esc(f.text)}</div>`).join("")}</div>
</div>
</div>`)
})()

// ---------------------------------------------------------------- e: numbered intranet report, tables
const e = (() => {
  const blue = "#1d4f91"
  const daily = (from, to) => `<table class="t"><tr><th>日期</th>${Y.slice(from, to).map((x) => `<th class="r">${x.date}</th>`).join("")}</tr>
<tr><td>用电（兆瓦时）</td>${Y.slice(from, to).map((x) => `<td class="r">${x.mwh}</td>`).join("")}</tr>
<tr><td>光伏（兆瓦时）</td>${Y.slice(from, to).map((x) => `<td class="r">${x.pv}</td>`).join("")}</tr>
<tr><td>峰时占比（%）</td>${Y.slice(from, to).map((x) => `<td class="r">${x.peak}</td>`).join("")}</tr></table>`
  return doc(`
body{background:#e9edf2;font-family:"Noto Sans SC";color:#222;font-size:13px;font-variant-numeric:tabular-nums}
.paper{max-width:1100px;margin:20px auto;background:#fff;border:1px solid #c9d1dc;padding:28px 36px 36px}
.bar{background:${blue};color:#fff;padding:8px 14px;font-size:13px;display:flex;justify-content:space-between}
h1{text-align:center;font-size:24px;font-weight:600;margin:20px 0 6px;color:${blue}}
.m{text-align:center;color:#666;font-size:12px;margin-bottom:18px}
h2{font-size:14px;font-weight:600;color:#fff;background:${blue};padding:5px 10px;margin:18px 0 8px}
p{line-height:1.8}
table.t{font-size:12px;margin-top:4px}
.t th{background:#eef2f8;font-weight:500;padding:5px 6px;border:1px solid #c9d1dc;text-align:left}
.t td{padding:5px 6px;border:1px solid #dbe1ea}
.t th.r,.t td.r{text-align:right}
.t td.bad{color:#c00}
ol{padding-left:20px;line-height:1.9}
.note{font-size:12px;color:#666;margin-top:6px}
`, `<div class="paper">
<div class="bar"><span>栖川科技园 · 物业能源管理部</span><span>内部资料 · 注意保存</span></div>
<h1>${esc(D.title)}</h1><div class="m">统计周期：${esc(D.period)}　编制：能源管理部　发布日期：2026 年 11 月 3 日</div>
<h2>一、总体情况</h2><p>${esc(D.summary)}</p>
<h2>二、主要指标</h2>
<table class="t"><tr><th>序号</th><th>指标</th><th class="r">本月</th><th>单位</th><th class="r">较上月</th><th>评价</th></tr>${D.kpis.map((k, i) => `<tr><td>${i + 1}</td><td>${esc(k.label)}</td><td class="r">${esc(k.value)}</td><td>${esc(k.unit)}</td><td class="r ${k.good ? "" : "bad"}">${esc(k.change)}</td><td>${k.good ? "向好" : "需关注"}</td></tr>`).join("")}</table>
<h2>三、逐日用电</h2>${daily(0, 16)}${daily(16, 31)}<div class="note">注：10 月 8 日至 12 日为高温补班期。</div>
<h2>四、分楼栋用电</h2>
<table class="t"><tr><th>序号</th><th>楼栋</th><th class="r">建筑面积（平方米）</th><th class="r">用电量（万千瓦时）</th><th class="r">较上月</th><th class="r">单位面积能耗</th></tr>${B.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.name)}</td><td class="r">${num(x.area)}</td><td class="r">${x.kwh}</td><td class="r ${isNeg(x.change) ? "" : "bad"}">${esc(x.change)}</td><td class="r">${x.intensity}</td></tr>`).join("")}</table>
<h2>五、分项用电</h2>
<table class="t"><tr>${U.map((u) => `<th class="r">${esc(u.name)}</th>`).join("")}</tr><tr>${U.map((u) => `<td class="r">${u.share}%</td>`).join("")}</tr></table>
<h2>六、数据中心与需量</h2><p>数据中心 PUE ${D.pue.value}，较上月 ${esc(D.pue.change)}，目标 ${D.pue.target}。本月需量预警 ${D.alerts.length} 次：${D.alerts.map((x) => `${esc(x.date)} ${esc(x.time)} ${esc(x.text)}`).join("；")}。</p>
<h2>七、主要发现</h2><ol>${D.findings.map((f) => `<li><b>${esc(f.title)}。</b>${esc(f.text)}</li>`).join("")}</ol>
<h2>八、下月工作安排</h2><ol>${D.actions.map((f) => `<li><b>${esc(f.title)}</b>（责任：${esc(f.owner)}）。${esc(f.text)}</li>`).join("")}</ol>
<h2>九、风险提示</h2><ol>${D.risks.map((f) => `<li><b>${esc(f.title)}：</b>${esc(f.text)}</li>`).join("")}</ol>
</div>`)
})()

export default { a, b, c, d, e }
