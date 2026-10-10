// Evaluation set for the pairwise aesthetic judge, made the way the agent
// makes pages: one data JSON per report (data/ops.json, data/ab.json), several
// UI specs per data file, rendered by src/render.tsx. The specs differ in the
// decisions the agent owns — grouping, cards or open blocks, column spans,
// component choice, density — not in CSS. The person ranks each group.
//
//   node scripts/build-evalset-specs.mjs   → specs/evalset/<report>-<v>.json
//   node scripts/render.mjs specs/evalset/*.json
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const OUT = path.join(ROOT, "specs", "evalset")
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"))
const ops = read("data/ops.json")
const ab = read("data/ab.json")

const num = (v) => v.toLocaleString("en-US")
const pct = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`
const ci = (m) => `[${pct(m.ciLow)}, ${pct(m.ciHigh)}]`
const kpiStat = (k, i, extra = {}) => ({
  id: `stat-${k.key}`, type: "stat", label: k.label, value: String(k.value), unit: k.unit,
  delta: k.change, direction: k.direction, src: [`/kpis/${i}`], ...extra,
})
const blk = (id, span, rows, title, children, extra = {}) => ({ id, type: "block", span, rows, ...(title && { title }), children, ...extra })
const card = (id, title, children, extra = {}) => ({ id, type: "card", ...(title && { title }), children, ...extra })
const page = (d, meta, children, extra = {}) => ({ id: "page", type: "page", title: d.title, meta, children, ...extra })

// ---------- 运营月报 ----------

const opsMeta = [ops.product, ops.period]
const opsWeekly = { type: "line-chart", xKey: "week", series: [{ key: "dau", label: "日活（万）" }], data: ops.dauWeekly, src: ["/dauWeekly"] }
const opsCatCols = (spans) => [
  { key: "name", label: "品类", span: spans?.[0] },
  { key: "gmv", label: "成交额（万元）", align: "right", span: spans?.[1] },
  { key: "change", label: "环比", align: "right", span: spans?.[2], tone: ["−4.3%"] },
  { key: "share", label: "占比（%）", span: spans?.[3], bar: true },
]
const opsCatRows = ops.categories.map((c) => ({ ...c, gmv: num(c.gmv) }))
const opsChannels = { type: "bar-chart", layout: "horizontal", xKey: "name", series: [{ key: "share", label: "占比（%）" }], data: ops.channels, src: ["/channels"] }

const OPS = {
  // Open blocks on the 9-column field: the conclusion, a figure row, then detail.
  a: page(ops, opsMeta, [
    { id: "sec-overview", type: "section", title: "概览", children: [
      { id: "grp-overview", type: "group", children: [
        { id: "grid-summary", type: "grid", cols: 9, children: [
          blk("blk-summary", 9, 1, null, [{ id: "text-summary", type: "text", text: ops.summary, className: "text-xl leading-9", src: ["/summary"] }]) ] },
        { id: "grid-kpis", type: "grid", cols: 12, className: "items-baseline", children: ops.kpis.map((k, i) =>
          blk(`blk-${k.key}`, 3, 1, null, [kpiStat(k, i, { captionBelow: true, size: i === 0 ? "lg" : undefined, delta: undefined, note: `环比 ${k.change}` })])) },
        { id: "grid-charts", type: "grid", cols: 9, children: [
          blk("blk-dau", 6, 2, "日活跃用户（周均，万）", [{ id: "chart-dau", ...opsWeekly, height: "fill" }]),
          blk("blk-channels", 3, 2, "新增用户渠道", [{ id: "prog-channels", type: "progress-list", compact: true, items: ops.channels.map((c) => ({ label: c.name, value: c.share, max: 40, display: `${c.share}%` })), src: ["/channels"] }]) ] },
      ] } ] },
    { id: "sec-cat", type: "section", title: "品类", description: "成交额前六的品类", children: [
      { id: "grid-cat", type: "grid", cols: 9, children: [
        blk("blk-cat", 9, 2, null, [{ id: "table-cat", type: "table", columns: opsCatCols([2, 2, 2, 3]), rows: opsCatRows, src: ["/categories"] }]) ] } ] },
    { id: "sec-findings", type: "section", title: "发现与风险", children: [
      { id: "grid-findings", type: "grid", cols: 9, children: [
        blk("blk-findings", 6, 2, "主要发现", [{ id: "list-findings", type: "list", divided: false, ordered: true, items: ops.findings.map((f) => ({ title: f.title, description: f.detail })), src: ["/findings"] }]),
        blk("blk-risks", 3, 2, "风险", [{ id: "list-risks", type: "list", divided: false, items: ops.risks.map((r) => ({ title: r })), src: ["/risks"] }]) ] } ] },
  ]),

  // A card dashboard: a KPI row, then cards two or three across.
  b: page(ops, opsMeta, [
    { id: "sec-kpi", type: "section", title: "核心指标", description: ops.summary, className: "gap-6", children: [
      { id: "grp-kpi", type: "group", className: "grid grid-cols-4 gap-4", children: ops.kpis.map((k, i) => card(`card-${k.key}`, null, [kpiStat(k, i)])) } ] },
    { id: "sec-trend", type: "section", title: "用户", className: "gap-6", children: [
      { id: "grp-trend", type: "group", className: "grid grid-cols-3 gap-4", children: [
        card("card-dau", "日活跃用户", [{ id: "chart-dau", ...opsWeekly, height: "h-56" }], { description: "周均，单位万", className: "col-span-2" }),
        card("card-channels", "新增用户渠道", [{ id: "chart-channels", ...opsChannels }], { description: "占比（%）" }) ] } ] },
    { id: "sec-cat", type: "section", title: "品类表现", className: "gap-6", children: [
      card("card-cat", "品类成交额", [{ id: "table-cat", type: "table", columns: opsCatCols(), rows: opsCatRows, src: ["/categories"] }], { badge: "前 6 名" }) ] },
    { id: "sec-findings", type: "section", title: "发现与风险", className: "gap-6", children: [
      { id: "grp-findings", type: "group", className: "grid grid-cols-2 gap-4", children: [
        card("card-findings", "主要发现", [{ id: "list-findings", type: "list", items: ops.findings.map((f) => ({ title: f.title, description: f.detail })), src: ["/findings"] }]),
        card("card-risks", "风险", ops.risks.map((r, i) => ({ id: `alert-risk-${i}`, type: "alert", variant: "destructive", title: r, src: [`/risks/${i}`] })), { contentClassName: "gap-3" }) ] } ] },
  ], { className: "gap-12 py-12" }),

  // Everything in one section and one column, in the order of the data.
  c: page(ops, opsMeta, [
    { id: "sec-all", type: "section", title: "月报", children: [
      { id: "grp-all", type: "group", children: [
        { id: "text-summary", type: "text", text: ops.summary, src: ["/summary"] },
        { id: "kv-kpis", type: "kv", items: ops.kpis.map((k) => ({ label: k.label, value: `${k.value} ${k.unit}（${k.change}）` })), src: ["/kpis"] },
        { id: "chart-dau", type: "bar-chart", xKey: "day", series: [{ key: "dau", label: "日活（万）" }], data: ops.dauDaily, height: "h-60", src: ["/dauDaily"] },
        { id: "chart-channels", type: "bar-chart", xKey: "name", series: [{ key: "share", label: "占比（%）" }], data: ops.channels, height: "h-48", src: ["/channels"] },
        { id: "table-cat", type: "table", columns: opsCatCols(), rows: opsCatRows, src: ["/categories"] },
        { id: "list-findings", type: "list", items: ops.findings.map((f) => ({ title: f.title, description: f.detail })), src: ["/findings"] },
        { id: "badges-risks", type: "badges", items: ops.risks, src: ["/risks"] },
      ] } ] },
  ]),

  // Cards three across, one size whatever the content; only what would not fit spans more.
  d: page(ops, opsMeta, [
    { id: "sec-all", type: "section", title: "本月数据", description: ops.summary, className: "gap-6", children: [
      { id: "grp-all", type: "group", className: "grid grid-cols-3 gap-6", children: [
        ...ops.kpis.map((k, i) => card(`card-${k.key}`, k.label, [kpiStat(k, i, { label: undefined })])),
        card("card-dau", "日活走势", [{ id: "chart-dau", ...opsWeekly, height: "h-40" }]),
        card("card-channels", "渠道", [{ id: "prog-channels", type: "progress-list", items: ops.channels.map((c) => ({ label: c.name, value: c.share, display: `${c.share}%` })), src: ["/channels"] }]),
        card("card-findings", "发现", [{ id: "list-findings", type: "list", items: ops.findings.map((f) => ({ title: f.title, description: f.detail })), src: ["/findings"] }], { className: "col-span-2" }),
        card("card-risks", "风险", [{ id: "list-risks", type: "list", items: ops.risks.map((r) => ({ title: r })), src: ["/risks"] }]),
        card("card-cat", "品类", [{ id: "table-cat", type: "table", columns: opsCatCols(), rows: opsCatRows, src: ["/categories"] }], { className: "col-span-3" }),
      ] } ] },
  ], { className: "gap-12 py-12" }),

  // Organised by finding: each finding is a section with its evidence.
  e: page(ops, opsMeta, [
    { id: "sec-overview", type: "section", title: "概览", children: [
      { id: "grp-overview", type: "group", children: [
        { id: "grid-summary", type: "grid", cols: 9, children: [
          blk("blk-summary", 9, 1, null, [{ id: "text-summary", type: "text", text: ops.summary, className: "text-xl leading-9", src: ["/summary"] }]) ] },
        { id: "grid-kpis", type: "grid", cols: 12, children: ops.kpis.map((k, i) => blk(`blk-${k.key}`, 3, 1, null, [kpiStat(k, i)])) },
      ] } ] },
    { id: "sec-f1", type: "section", title: ops.findings[0].title, children: [
      { id: "grid-f1", type: "grid", cols: 9, children: [
        blk("blk-f1-text", 3, 2, null, [{ id: "text-f1", type: "text", text: ops.findings[0].detail, src: ["/findings/0"] }]),
        blk("blk-dau", 6, 2, "日活跃用户（周均，万）", [{ id: "chart-dau", ...opsWeekly, height: "fill" }]) ] } ] },
    { id: "sec-f2", type: "section", title: ops.findings[1].title, children: [
      { id: "grid-f2", type: "grid", cols: 9, children: [
        blk("blk-f2-text", 9, 1, null, [{ id: "text-f2", type: "text", text: ops.findings[1].detail, src: ["/findings/1"] }]),
        blk("blk-cat", 9, 2, "品类成交额", [{ id: "table-cat", type: "table", columns: opsCatCols([2, 2, 2, 3]), rows: opsCatRows, src: ["/categories"] }]) ] } ] },
    { id: "sec-f3", type: "section", title: ops.findings[2].title, children: [
      { id: "grid-f3", type: "grid", cols: 9, children: [
        blk("blk-f3-text", 3, 2, null, [{ id: "text-f3", type: "text", text: ops.findings[2].detail, src: ["/findings/2"] }]),
        blk("blk-channels", 6, 2, "新增用户渠道（%）", [{ id: "chart-channels", ...opsChannels }]) ] } ] },
    { id: "sec-risks", type: "section", title: "风险", children: [
      { id: "list-risks", type: "list", divided: false, ordered: true, items: ops.risks.map((r) => ({ title: r })), src: ["/risks"] } ] },
  ], { className: "gap-[144px]" }),
  // One 1040px column: title and lead, a ruled KPI row, then sections whose
  // titles sit above a hairline with the unit on the right.
  f: page(ops, [ops.product, ops.period], [
    { id: "grid-kpis", type: "grid", cols: 4, fields: false, ruled: true, children: ops.kpis.map((k, i) =>
      ({ ...kpiStat(k, i, { size: "xl", delta: undefined, note: `环比 ${k.change}` }), span: 1 })) },
    { id: "sec-dau", type: "section", title: "日活跃用户", aside: "单位：万，9 月 1 日至 30 日", children: [
      { id: "chart-dau", type: "line-chart", xKey: "date", series: [{ key: "dau", label: "日活（万）" }], yTicks: [120, 125, 130], xInterval: 6, pointLabels: "last", height: "h-[220px]",
        data: ops.dauDaily.map((d) => ({ date: `9 月 ${d.day} 日`, dau: d.dau })), src: ["/dauDaily"] } ] },
    { id: "sec-cat", type: "section", title: "渠道与品类", aside: "成交额单位：万元", children: [
      { id: "grid-cat", type: "grid", cols: 12, fields: false, className: "gap-x-20", children: [
        blk("blk-channels", 4, undefined, "新增用户来源", [{ id: "prog-channels", type: "progress-list", compact: true, className: "gap-4", items: ops.channels.map((c) => ({ label: c.name, value: c.share, max: 38, display: `${c.share}%` })), src: ["/channels"] }]),
        blk("blk-cat", 8, undefined, "品类成交额", [{ id: "table-cat", type: "table", columns: [
          { key: "name", label: "品类" }, { key: "gmv", label: "成交额", align: "right" },
          { key: "change", label: "环比", align: "right", tone: ["−4.3%"] }, { key: "share", label: "占比", align: "right" } ],
          rows: ops.categories.map((c) => ({ name: c.name, gmv: num(c.gmv), change: c.change, share: `${c.share}%` })), src: ["/categories"] }]) ] } ] },
    { id: "sec-findings", type: "section", title: "发现与风险", children: [
      { id: "list-findings", type: "list", numbered: true, items: ops.findings.map((f) => ({ title: f.title, description: f.detail })), src: ["/findings"] },
      { id: "list-risks", type: "list", columns: 2, metaTone: "destructive", items: ops.risks.map((r) => ({ meta: "风险", description: r })), src: ["/risks"] } ] },
  ], { frame: "column", lead: ops.summary }),
}

// ---------- A/B 实验报告 ----------

const abMeta = [ab.owner, ab.period]
const primary = ab.metrics.find((m) => m.primary)
const total = ab.samples.control + ab.samples.treatment
const abMetricRows = (ms) => ms.map((m) => ({ name: m.name, control: m.control, treatment: m.treatment, lift: pct(m.lift), ci: ci(m), sig: m.significant ? "显著" : "不显著" }))
const abMetricCols = (spans) => [
  { key: "name", label: "指标", span: spans?.[0] },
  { key: "control", label: "对照组", align: "right", span: spans?.[1] },
  { key: "treatment", label: "实验组", align: "right", span: spans?.[2] },
  { key: "lift", label: "相对变化", align: "right", span: spans?.[3] },
  { key: "ci", label: "95% 区间", span: spans?.[4] },
  { key: "sig", label: "结论", span: spans?.[5] },
]
const abDaily = ab.daily.filter((d, i) => i % 3 === 0 || i === ab.daily.length - 1).map((d) => ({ ...d, day: `第 ${d.day} 天` }))
const abLift = { type: "line-chart", xKey: "day", series: [{ key: "lift", label: "累计提升（%）" }], data: abDaily, src: ["/daily"] }
const abLiftBand = { type: "line-chart", xKey: "day", series: [{ key: "lift", label: "累计提升" }, { key: "low", label: "区间下限" }, { key: "high", label: "区间上限" }], data: abDaily, src: ["/daily"] }
const abSegBars = { type: "bar-chart", layout: "horizontal", xKey: "name", series: [{ key: "lift", label: "提升（%）" }], data: ab.segments, src: ["/segments"] }
const abNext = (extra) => ({ id: "list-next", type: "list", items: ab.next.map((n) => ({ title: n.title, description: n.detail })), src: ["/next"], ...extra })

const AB = {
  // Open blocks: the verdict, three figures, the metric table, the trend, segments.
  a: page(ab, abMeta, [
    { id: "sec-verdict", type: "section", title: "结论", children: [
      { id: "grp-verdict", type: "group", children: [
        { id: "grid-verdict", type: "grid", cols: 9, children: [
          blk("blk-verdict", 9, 1, null, [{ id: "text-verdict", type: "text", text: ab.verdict, className: "text-xl leading-9", src: ["/verdict"] }]) ] },
        { id: "grid-figs", type: "grid", cols: 9, className: "items-baseline", children: [
          blk("blk-lift", 3, 1, null, [{ id: "stat-lift", type: "stat", size: "lg", captionBelow: true, label: "支付转化率提升", value: pct(primary.lift).replace("%", ""), unit: "%", note: `95% 区间 ${ci(primary)}`, src: ["/metrics/0"] }]),
          blk("blk-n", 3, 1, null, [{ id: "stat-n", type: "stat", captionBelow: true, label: "样本量", value: (total / 1e4).toFixed(1), unit: "万", note: `对照 ${num(ab.samples.control)} / 实验 ${num(ab.samples.treatment)}`, src: ["/samples"] }]),
          blk("blk-days", 3, 1, null, [{ id: "stat-days", type: "stat", captionBelow: true, label: "实验时长", value: "21", unit: "天", note: ab.traffic, src: ["/period", "/traffic"] }]) ] },
      ] } ] },
    { id: "sec-metrics", type: "section", title: "指标", children: [
      { id: "grp-metrics", type: "group", children: [
        { id: "grid-metrics", type: "grid", cols: 9, children: [
          blk("blk-metrics", 9, 2, null, [{ id: "table-metrics", type: "table", columns: abMetricCols([2, 1, 1, 1, 2, 2]), rows: abMetricRows(ab.metrics), src: ["/metrics"] }]) ] },
        { id: "grid-trend", type: "grid", cols: 9, children: [
          blk("blk-trend", 9, 2, "支付转化率累计提升（%）", [{ id: "chart-trend", ...abLift, height: "fill" }]) ] },
      ] } ] },
    { id: "sec-seg", type: "section", title: "分群", children: [
      { id: "grid-seg", type: "grid", cols: 9, children: [
        blk("blk-seg-bars", 4, 2, "支付转化率提升（%）", [{ id: "chart-seg", ...abSegBars }]),
        blk("blk-seg-table", 5, 2, "支付转化率", [{ id: "table-seg", type: "table", columns: [{ key: "name", label: "分群", span: 1 }, { key: "control", label: "对照组", span: 2 }, { key: "treatment", label: "实验组", span: 2 }], rows: ab.segments, src: ["/segments"] }]) ] } ] },
    { id: "sec-next", type: "section", title: "下一步", children: [
      { id: "grid-next", type: "grid", cols: 9, children: [blk("blk-next", 9, 2, null, [abNext({ divided: false, ordered: true })])] } ] },
  ]),

  // Cards: a verdict alert, figure cards, then one card per topic.
  b: page(ab, abMeta, [
    { id: "sec-verdict", type: "section", title: "结论", className: "gap-6", children: [
      { id: "alert-verdict", type: "alert", title: "建议全量上线", text: ab.verdict, src: ["/verdict"] },
      { id: "grp-figs", type: "group", className: "grid grid-cols-3 gap-4", children: [
        card("card-lift", null, [{ id: "stat-lift", type: "stat", label: "支付转化率提升", value: pct(primary.lift), delta: "显著", note: `95% 区间 ${ci(primary)}`, src: ["/metrics/0"] }]),
        card("card-n", null, [{ id: "stat-n", type: "stat", label: "样本量", value: num(total), note: "两组各 50%", src: ["/samples"] }]),
        card("card-days", null, [{ id: "stat-days", type: "stat", label: "实验时长", value: "21 天", note: "9 月 2 日至 22 日", src: ["/period"] }]) ] } ] },
    { id: "sec-metrics", type: "section", title: "指标对比", className: "gap-6", children: [
      card("card-metrics", "全部指标", [{ id: "table-metrics", type: "table", columns: abMetricCols(), rows: abMetricRows(ab.metrics), src: ["/metrics"] }], { badge: "5 项" }),
      card("card-trend", "支付转化率累计提升", [{ id: "chart-trend", ...abLiftBand, height: "h-64" }], { description: "百分比，含 95% 区间" }) ] },
    { id: "sec-more", type: "section", title: "分群与下一步", className: "gap-6", children: [
      { id: "grp-more", type: "group", className: "grid grid-cols-2 gap-4", children: [
        card("card-seg", "分群提升（%）", [{ id: "chart-seg", ...abSegBars }]),
        card("card-next", "下一步", [abNext()]) ] } ] },
  ], { className: "gap-12 py-12" }),

  // Tables stacked in one section, the daily log included.
  c: page(ab, abMeta, [
    { id: "sec-all", type: "section", title: "实验结果", className: "gap-6", children: [
      { id: "grp-all", type: "group", children: [
        { id: "kv-info", type: "kv", labelCols: 2, items: [
          { label: "负责团队", value: ab.owner }, { label: "实验时间", value: ab.period }, { label: "分流方式", value: ab.traffic },
          { label: "对照组样本", value: num(ab.samples.control) }, { label: "实验组样本", value: num(ab.samples.treatment) } ], src: ["/owner", "/period", "/traffic", "/samples"] },
        { id: "text-verdict", type: "text", text: ab.verdict, src: ["/verdict"] },
        { id: "table-metrics", type: "table", columns: abMetricCols(), rows: abMetricRows(ab.metrics), src: ["/metrics"] },
        { id: "table-seg", type: "table", columns: [{ key: "name", label: "分群" }, { key: "control", label: "对照组" }, { key: "treatment", label: "实验组" }, { key: "lift", label: "提升（%）", align: "right" }], rows: ab.segments, src: ["/segments"] },
        { id: "table-daily", type: "table", caption: "每日累计提升（%）", columns: [{ key: "day", label: "天" }, { key: "lift", label: "累计提升", align: "right" }, { key: "low", label: "下限", align: "right" }, { key: "high", label: "上限", align: "right" }], rows: ab.daily, src: ["/daily"] },
        abNext(),
      ] } ] },
  ], { className: "gap-12 py-12" }),

  // Components picked by habit rather than by the data.
  d: page(ab, abMeta, [
    { id: "sec-overview", type: "section", title: "概览", className: "gap-12", children: [
      { id: "grp-overview", type: "group", children: [
        { id: "badges-facts", type: "badges", items: ["支付转化率 +4.1%", "结果显著", "建议全量", "21 天", `${(total / 1e4).toFixed(1)} 万样本`], src: ["/verdict", "/samples"] },
        { id: "text-verdict", type: "text", text: ab.verdict, src: ["/verdict"] },
        { id: "chart-metrics", type: "bar-chart", xKey: "name", series: [{ key: "lift", label: "相对变化（%）" }], data: ab.metrics, height: "h-60", src: ["/metrics"] },
      ] },
      { id: "grp-trend", type: "group", title: "每日累计提升（%）", children: [
        { id: "chart-trend", type: "bar-chart", xKey: "day", series: [{ key: "lift", label: "累计提升" }, { key: "high", label: "上限" }], data: ab.daily, height: "h-60", src: ["/daily"] } ] },
      { id: "grp-seg", type: "group", title: "分群", children: [
        { id: "chart-seg", type: "line-chart", xKey: "name", series: [{ key: "lift", label: "提升（%）" }], data: ab.segments, height: "h-48", src: ["/segments"] } ] },
      { id: "grp-next", type: "group", title: "下一步", children: [
        { id: "badges-next", type: "badges", items: ab.next.map((n) => n.title), src: ["/next"] } ] },
    ] },
  ], { className: "gap-24" }),

  // Verdict first: the primary metric beside its trend, then the rest smaller.
  e: page(ab, abMeta, [
    { id: "sec-primary", type: "section", title: "主指标", description: "支付转化率", children: [
      { id: "grid-primary", type: "grid", cols: 9, children: [
        blk("blk-lift", 3, 2, null, [
          { id: "stat-lift", type: "stat", size: "lg", label: "相对提升", value: pct(primary.lift), note: `95% 区间 ${ci(primary)}`, src: ["/metrics/0"] },
          { id: "text-verdict", type: "text", text: ab.verdict, src: ["/verdict"] } ], { contentClassName: "gap-6" }),
        blk("blk-trend", 6, 2, "累计提升（%）", [{ id: "chart-trend", ...abLift, height: "fill" }]) ] } ] },
    { id: "sec-secondary", type: "section", title: "其他指标", children: [
      { id: "grid-secondary", type: "grid", cols: 9, children: [
        blk("blk-secondary", 9, 2, null, [{ id: "table-secondary", type: "table", columns: abMetricCols([2, 1, 1, 1, 2, 2]), rows: abMetricRows(ab.metrics.filter((m) => !m.primary)), src: ["/metrics"] }]) ] } ] },
    { id: "sec-seg", type: "section", title: "分群", children: [
      { id: "grid-seg", type: "grid", cols: 9, children: [
        blk("blk-seg", 4, 1, null, [{ id: "prog-seg", type: "progress-list", compact: true, items: ab.segments.map((s) => ({ label: s.name, value: s.lift, max: 8, display: pct(s.lift) })), src: ["/segments"] }]),
        blk("blk-seg-note", 5, 1, null, [{ id: "text-seg", type: "text", text: "新用户提升最大（+6.8%），老用户最小（+2.9%）；iOS 与 Android 接近。", src: ["/segments"] }]) ] } ] },
    { id: "sec-next", type: "section", title: "下一步", children: [abNext({ divided: false, ordered: true })] },
    { id: "sec-info", type: "section", title: "实验信息", children: [
      { id: "kv-info", type: "kv", labelCols: 2, items: [
        { label: "负责团队", value: ab.owner }, { label: "分流方式", value: ab.traffic },
        { label: "样本量", value: `对照 ${num(ab.samples.control)} / 实验 ${num(ab.samples.treatment)}` } ], src: ["/owner", "/traffic", "/samples"] } ] },
  ], { className: "gap-[144px]" }),
  // Swiss frame with sections a field apart: an interval column in the metric
  // table, the trend with its band, segments as figures, next steps across.
  f: page(ab, abMeta, [
    { id: "sec-verdict", type: "section", title: "结论", children: [
      { id: "grp-verdict", type: "group", className: "gap-12", children: [
        { id: "text-verdict", type: "text", text: ab.verdict, className: "text-2xl leading-9 font-light", src: ["/verdict"] },
        { id: "grid-figs", type: "grid", cols: 3, fields: false, children: [
          { id: "stat-lift", type: "stat", span: 1, size: "lg", captionBelow: true, quiet: true, label: "支付转化率，主指标", value: pct(primary.lift), src: ["/metrics/0"] },
          { id: "stat-n", type: "stat", span: 1, size: "lg", captionBelow: true, quiet: true, label: `实验组样本量，对照组 ${num(ab.samples.control)}`, value: num(ab.samples.treatment), src: ["/samples"] },
          { id: "stat-days", type: "stat", span: 1, size: "lg", captionBelow: true, quiet: true, label: ab.traffic, value: "21 天", src: ["/period", "/traffic"] } ] } ] } ] },
    { id: "sec-metrics", type: "section", title: "指标结果", description: "点为提升幅度，线为 95% 置信区间；灰色为不显著。", children: [
      { id: "table-metrics", type: "table", columns: [
        { key: "name", label: "指标", span: 2 },
        { key: "control", label: "对照组", align: "right", span: 1 },
        { key: "treatment", label: "实验组", align: "right", span: 1 },
        { key: "liftText", label: "变化", align: "right", span: 1, muteWhen: { key: "significant", equals: false } },
        { key: "lift", label: "置信区间", span: 2, interval: { low: "ciLow", high: "ciHigh", domain: [-10, 14] }, muteWhen: { key: "significant", equals: false } },
        { key: "ci", label: "区间", align: "right", span: 2, muteWhen: { key: "significant", equals: false } } ],
        rows: ab.metrics.map((m) => ({ name: m.name, control: m.control, treatment: m.treatment, liftText: pct(m.lift), lift: m.lift, ciLow: m.ciLow, ciHigh: m.ciHigh, ci: ci(m), significant: m.significant })),
        src: ["/metrics"] } ] },
    { id: "sec-trend", type: "section", title: "随时间变化", description: "主指标累计提升与 95% 置信区间，第 6 天起区间不再包含 0。", children: [
      { id: "chart-trend", type: "line-chart", xKey: "day", series: [{ key: "lift", label: "累计提升（%）" }], band: { low: "low", high: "high" }, zero: true,
        yTicks: [0, 4, 8, 12, 16], xInterval: 4, pointLabels: "last", lastLabel: pct(primary.lift), height: "h-48",
        data: ab.daily.map((d) => ({ ...d, day: `第 ${d.day} 天` })), src: ["/daily"] } ] },
    { id: "sec-seg", type: "section", title: "分群", description: "支付转化率提升，各群均显著。", children: [
      { id: "grid-seg", type: "grid", cols: 4, fields: false, children: ab.segments.map((g, i) =>
        ({ id: `stat-seg-${i}`, type: "stat", captionBelow: true, quiet: true, label: `${g.name}，${g.control} → ${g.treatment}`, value: pct(g.lift), span: 1, src: [`/segments/${i}`] })) } ] },
    { id: "sec-next", type: "section", title: "下一步", children: [
      { id: "list-next", type: "list", columns: 3, numbered: true, items: ab.next.map((n) => ({ title: n.title, description: n.detail })), src: ["/next"] } ] },
  ], { className: "gap-24" }),
}

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
const strip = (o) => JSON.parse(JSON.stringify(o))
for (const [report, specs] of [["ops", OPS], ["ab", AB]])
  for (const [v, spec] of Object.entries(specs)) fs.writeFileSync(path.join(OUT, `${report}-${v}.json`), JSON.stringify(strip(spec), null, 1))
console.log(fs.readdirSync(OUT).join(" "))
