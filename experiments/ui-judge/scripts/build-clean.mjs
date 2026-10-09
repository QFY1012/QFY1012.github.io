// Builds the hand-made clean spec for each mock report (the "good" sample).
//   node scripts/build-clean.mjs
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"))

function review() {
  const d = read("data/review.json")
  const c = d.issueCounts
  // Swiss layout: section titles hang in the left 3 columns, content runs in
  // a 9-column field. Every band is made of whole-column blocks with shared
  // edges; no cards, grouping is done by space alone.
  return {
    id: "page",
    type: "page",
    title: d.title,
    meta: [d.target, `走查日期 ${d.date}`],
    src: ["/title", "/target", "/date"],
    children: [
      {
        id: "sec-overview",
        type: "section",
        title: "概览",
        children: [
          { id: "grp-overview", type: "group", children: [
            // The conclusion, the page's one large text: 20/32, about 43 characters a line.
            { id: "grid-summary", type: "grid", cols: 9, children: [
              { id: "blk-summary", type: "block", span: 9, rows: 1, children: [
                { id: "text-summary", type: "text", text: d.summary, className: "text-xl leading-9 text-justify", src: ["/summary"] } ] },
            ] },
            // Figures first, captions under them; the row aligns on the figures' baselines.
            { id: "grid-figures", type: "grid", cols: 9, className: "items-baseline", children: [
              { id: "blk-score", type: "block", span: 3, rows: 1, children: [
                { id: "stat-score", type: "stat", size: "lg", captionBelow: true, label: "综合得分", value: String(d.score.overall), unit: `/ ${d.score.max}`,
                  note: `上次 ${d.score.previous}，提高 ${d.score.overall - d.score.previous} 分；已修复 ${c.fixedSinceLast} 个问题`, src: ["/score", "/issueCounts/fixedSinceLast"] } ] },
              { id: "blk-total", type: "block", span: 3, rows: 1, children: [
                { id: "stat-total", type: "stat", captionBelow: true, label: "问题总数", value: String(c.total), note: `主要 ${c.major} 个，次要 ${c.minor} 个`, src: ["/issueCounts/total", "/issueCounts/major", "/issueCounts/minor"] } ] },
              { id: "blk-severe", type: "block", span: 3, rows: 1, children: [
                { id: "stat-severe", type: "stat", captionBelow: true, label: "严重问题", value: String(c.severe), note: "需优先处理", src: ["/issueCounts/severe"] } ] },
            ] },
            // The score list sets the height; the trend chart fills it.
            { id: "grid-charts", type: "grid", cols: 9, children: [
              { id: "blk-dims", type: "block", span: 3, rows: 1, title: "分维度得分", children: [
                { id: "prog-dims", type: "progress-list", compact: true, className: "gap-0", items: d.dimensions.map((x) => ({ label: x.name, value: x.score, display: String(x.score) })), src: ["/dimensions"] } ] },
              { id: "blk-trend", type: "block", span: 6, rows: 1, title: "各版本问题数", children: [
                { id: "chart-trend", type: "line-chart", height: "fill", xKey: "version", series: [{ key: "issues", label: "问题数" }], data: d.trend, src: ["/trend"] } ] },
            ] },
          ] },
        ],
      },
      {
        id: "sec-issues",
        type: "section",
        title: "走查发现",
        description: `共 ${c.total} 个问题，此处列出 ${d.issues.length} 个`,
        children: [
          { id: "grp-issues", type: "group", children: [
            { id: "grid-issues", type: "grid", cols: 9, children: [
              { id: "blk-issues", type: "block", span: 9, rows: 2, title: "问题清单", children: [
                { id: "table-issues", type: "table",
                  columns: [
                    { key: "id", label: "编号", span: 1 },
                    { key: "title", label: "问题", span: 3 },
                    { key: "severity", label: "严重程度", span: 1, tone: ["严重"] },
                    { key: "location", label: "位置", span: 1 },
                    { key: "suggestion", label: "建议", span: 3 },
                  ],
                  rows: d.issues, src: ["/issues"] } ] },
              { id: "blk-components", type: "block", span: 9, rows: 2, title: "组件使用", children: [
                { id: "table-components", type: "table",
                  columns: [
                    { key: "component", label: "组件", span: 1 },
                    { key: "count", label: "使用次数", span: 3, bar: true },
                    { key: "nonstd", label: "不规范", span: 1 },
                    { key: "detail", label: "不规范说明", span: 4 },
                  ],
                  // usage joined with the non-standard findings; "—" where none was reported
                  rows: d.componentUsage.map((u) => {
                    const n = d.nonstandard.find((x) => x.component === u.component)
                    return { component: u.component, count: u.count, nonstd: n ? `${n.count} 处` : "—", detail: n ? n.detail : "—" }
                  }),
                  src: ["/componentUsage", "/nonstandard"] } ] },
            ] },
          ] },
        ],
      },
      {
        id: "sec-next",
        type: "section",
        title: "下一步",
        children: [
          { id: "grid-next", type: "grid", cols: 9, children: [
            { id: "blk-recs", type: "block", span: 6, rows: 2, title: "优先处理", children: [
              { id: "list-recs", type: "list", divided: false, ordered: true, items: d.recommendations.map((x) => ({ title: x.title, description: x.detail })), src: ["/recommendations"] } ] },
            { id: "blk-follow", type: "block", span: 3, rows: 2, title: "复查安排", children: [
              { id: "kv-follow", type: "kv", labelCols: 1, items: [
                { label: "日期", value: d.followUp.date },
                { label: "范围", value: d.followUp.scope },
                { label: "重点", value: d.followUp.focus },
                { label: "方法", value: d.followUp.method },
                { label: "参与人数", value: `${d.followUp.reviewers} 人` },
                { label: "预计耗时", value: d.followUp.duration },
              ], src: ["/followUp"] } ] },
          ] },
        ],
      },
    ],
  }
}

fs.mkdirSync(path.join(ROOT, "specs"), { recursive: true })
fs.writeFileSync(path.join(ROOT, "specs", "review.clean.json"), JSON.stringify(review(), null, 1))
console.log("specs/review.clean.json")
