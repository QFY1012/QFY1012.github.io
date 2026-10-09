// Builds the hand-made clean spec for each mock report (the "good" sample).
//   node scripts/build-clean.mjs
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"))

function review() {
  const d = read("data/review.json")
  const c = d.issueCounts
  // Cards only where items are parallel, independent objects meant to be
  // compared (the four indicators). Everything else is an unboxed block.
  return {
    id: "page",
    type: "page",
    title: d.title,
    subtitle: `${d.target} · ${d.date}`,
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
              // Band 1: the four indicators, parallel objects, so cards.
              { id: "card-score", type: "card", span: 3, children: [
                { id: "stat-score", type: "stat", label: "综合得分", value: String(d.score.overall), unit: `/ ${d.score.max}`, delta: `+${d.score.overall - d.score.previous}`, note: `上次 ${d.score.previous}`, src: ["/score"] } ] },
              { id: "card-total", type: "card", span: 3, children: [
                { id: "stat-total", type: "stat", label: "问题总数", value: String(c.total), note: `主要 ${c.major} · 次要 ${c.minor}`, src: ["/issueCounts/total", "/issueCounts/major", "/issueCounts/minor"] } ] },
              { id: "card-severe", type: "card", span: 3, children: [
                { id: "stat-severe", type: "stat", label: "严重问题", value: String(c.severe), note: "需优先处理", src: ["/issueCounts/severe"] } ] },
              { id: "card-fixed", type: "card", span: 3, children: [
                { id: "stat-fixed", type: "stat", label: "已修复", value: String(c.fixedSinceLast), note: "自上次走查", src: ["/issueCounts/fixedSinceLast"] } ] },
              // Band 2: three 4-column blocks. The conclusion sets the band height
              // (16px text, 4 columns); the score list spreads its rows and the
              // trend chart grows to the same height, so all three are solid
              // rectangles with shared top and bottom edges.
              { id: "blk-summary", type: "block", span: 4, title: "结论", children: [
                { id: "text-summary", type: "text", text: d.summary, className: "text-base leading-7 text-justify", src: ["/summary"] } ] },
              { id: "blk-dims", type: "block", span: 4, title: "分维度得分", children: [
                { id: "prog-dims", type: "progress-list", compact: true, className: "flex-1 justify-between gap-2", items: d.dimensions.map((x) => ({ label: x.name, value: x.score, display: String(x.score) })), src: ["/dimensions"] } ] },
              { id: "blk-trend", type: "block", span: 4, title: "各版本问题数", children: [
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
                    { key: "id", label: "编号" },
                    { key: "title", label: "问题" },
                    { key: "severity", label: "严重程度" },
                    { key: "location", label: "位置" },
                    { key: "suggestion", label: "建议" },
                  ],
                  rows: d.issues, src: ["/issues"] },
                { id: "text-issues-note", type: "text", text: `共 ${c.total} 个问题,此处列出 ${d.issues.length} 个`, className: "text-muted-foreground", src: ["/issueCounts/total", "/issues"] } ] },
            ] },
          ] },
          { id: "grp-components", type: "group", children: [
            { id: "grid-components", type: "grid", children: [
              { id: "blk-components", type: "block", span: 12, title: "组件使用", children: [
                { id: "table-components", type: "table",
                  columns: [
                    { key: "component", label: "组件" },
                    { key: "count", label: "使用次数", bar: true },
                    { key: "nonstd", label: "不规范" },
                    { key: "detail", label: "不规范说明" },
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
              { id: "list-recs", type: "list", className: "flex-1 justify-between", items: d.recommendations.map((x) => ({ title: x.title, description: x.detail })), src: ["/recommendations"] } ] },
            { id: "blk-follow", type: "block", span: 4, title: "复查安排", children: [
              { id: "kv-follow", type: "kv", className: "flex-1 content-between gap-y-4", items: [
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
