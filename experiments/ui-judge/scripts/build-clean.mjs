// Builds the hand-made clean spec for each mock report (the "good" sample).
//   node scripts/build-clean.mjs
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"))

function review() {
  const d = read("data/review.json")
  const c = d.issueCounts
  // A mosaic on the 12-column grid: every band is made of whole-column
  // blocks that share top and bottom edges. No cards: nothing here needs to be
  // set apart as a separate object, space does the grouping.
  return {
    id: "page",
    type: "page",
    title: d.title,
    subtitle: `${d.target},走查日期 ${d.date}`,
    src: ["/title", "/target", "/date"],
    children: [
      {
        id: "sec-overview",
        type: "section",
        title: "概览",
        children: [
          {
            id: "grid-overview",
            type: "grid",
            children: [
              // Band 1: the verdict. The conclusion is the page's one large text;
              // the score sits beside it and spreads to the same height.
              { id: "blk-summary", type: "block", span: 8, title: "结论", children: [
                { id: "text-summary", type: "text", text: d.summary, className: "text-xl leading-8 text-justify", src: ["/summary"] } ] },
              { id: "blk-score", type: "block", span: 4, title: "综合得分", contentClassName: "justify-end", children: [
                { id: "stat-score", type: "stat", size: "lg", value: String(d.score.overall), unit: `/ ${d.score.max}`, delta: `+${d.score.overall - d.score.previous}`, note: `上次 ${d.score.previous}`, src: ["/score"] } ] },
              // Band 2: three counts, 4 columns each.
              { id: "blk-total", type: "block", span: 4, children: [
                { id: "stat-total", type: "stat", label: "问题总数", value: String(c.total), note: `其中主要 ${c.major} 个,次要 ${c.minor} 个`, src: ["/issueCounts/total", "/issueCounts/major", "/issueCounts/minor"] } ] },
              { id: "blk-severe", type: "block", span: 4, children: [
                { id: "stat-severe", type: "stat", label: "严重问题", value: String(c.severe), note: "需优先处理", src: ["/issueCounts/severe"] } ] },
              { id: "blk-fixed", type: "block", span: 4, children: [
                { id: "stat-fixed", type: "stat", label: "已修复", value: String(c.fixedSinceLast), note: "自上次走查", src: ["/issueCounts/fixedSinceLast"] } ] },
              // Band 3: scores by dimension set the height, the trend chart fills it.
              { id: "blk-dims", type: "block", span: 4, title: "分维度得分", children: [
                { id: "prog-dims", type: "progress-list", compact: true, items: d.dimensions.map((x) => ({ label: x.name, value: x.score, display: String(x.score) })), src: ["/dimensions"] } ] },
              { id: "blk-trend", type: "block", span: 8, title: "各版本问题数", children: [
                { id: "chart-trend", type: "line-chart", height: "fill", xKey: "version", series: [{ key: "issues", label: "问题数" }], data: d.trend, src: ["/trend"] } ] },
            ],
          },
        ],
      },
      {
        id: "sec-issues",
        type: "section",
        title: "走查发现",
        children: [
          { id: "grp-issues", type: "group", children: [
            { id: "grid-issues", type: "grid", children: [
              { id: "blk-issues", type: "block", span: 12, title: "问题清单", children: [
                { id: "table-issues", type: "table",
                  columns: [
                    { key: "id", label: "编号", span: 1 },
                    { key: "title", label: "问题", span: 4 },
                    { key: "severity", label: "严重程度", span: 2, tone: ["严重"] },
                    { key: "location", label: "位置", span: 2 },
                    { key: "suggestion", label: "建议", span: 3 },
                  ],
                  rows: d.issues, src: ["/issues"] },
                { id: "text-issues-note", type: "text", text: `共 ${c.total} 个问题,此处列出 ${d.issues.length} 个`, className: "text-xs text-muted-foreground", src: ["/issueCounts/total", "/issues"] } ] },
            ] },
          ] },
          { id: "grp-components", type: "group", children: [
            { id: "grid-components", type: "grid", children: [
              { id: "blk-components", type: "block", span: 12, title: "组件使用", children: [
                { id: "table-components", type: "table",
                  columns: [
                    { key: "component", label: "组件", span: 2 },
                    { key: "count", label: "使用次数", span: 4, bar: true },
                    { key: "nonstd", label: "不规范", span: 2 },
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
          { id: "grid-next", type: "grid", children: [
            { id: "blk-recs", type: "block", span: 8, title: "优先处理", children: [
              { id: "list-recs", type: "list", items: d.recommendations.map((x) => ({ title: x.title, description: x.detail })), src: ["/recommendations"] } ] },
            { id: "blk-follow", type: "block", span: 4, title: "复查安排", children: [
              { id: "kv-follow", type: "kv", className: "flex-1 content-between", items: [
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
