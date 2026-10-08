// Builds the hand-made clean spec for each mock report (the "good" sample).
//   node scripts/build-clean.mjs
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"))

function review() {
  const d = read("data/review.json")
  const c = d.issueCounts
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
              { id: "card-score", type: "card", span: 3, children: [
                { id: "stat-score", type: "stat", label: "综合得分", value: String(d.score.overall), unit: `/ ${d.score.max}`, delta: `+${d.score.overall - d.score.previous}`, note: `上次 ${d.score.previous}`, src: ["/score"] } ] },
              { id: "card-total", type: "card", span: 3, children: [
                { id: "stat-total", type: "stat", label: "问题总数", value: String(c.total), note: `主要 ${c.major} · 次要 ${c.minor}`, src: ["/issueCounts/total", "/issueCounts/major", "/issueCounts/minor"] } ] },
              { id: "card-severe", type: "card", span: 3, children: [
                { id: "stat-severe", type: "stat", label: "严重问题", value: String(c.severe), note: "需优先处理", src: ["/issueCounts/severe"] } ] },
              { id: "card-fixed", type: "card", span: 3, children: [
                { id: "stat-fixed", type: "stat", label: "已修复", value: String(c.fixedSinceLast), note: "自上次走查", src: ["/issueCounts/fixedSinceLast"] } ] },
              { id: "card-summary", type: "card", span: 12, title: "结论", children: [
                { id: "text-summary", type: "text", text: d.summary, className: "text-justify", src: ["/summary"] } ] },
              { id: "card-trend", type: "card", span: 8, title: "问题数量趋势", description: "各版本走查发现的问题数", children: [
                { id: "chart-trend", type: "line-chart", xKey: "version", series: [{ key: "issues", label: "问题数" }], data: d.trend, src: ["/trend"] } ] },
              { id: "card-dims", type: "card", span: 4, title: "分维度得分", children: [
                { id: "prog-dims", type: "progress-list", items: d.dimensions.map((x) => ({ label: x.name, value: x.score, display: String(x.score) })), src: ["/dimensions"] } ] },
            ],
          },
        ],
      },
      {
        id: "sec-issues",
        type: "section",
        title: "走查发现",
        children: [
          { id: "grp-issues", type: "group", title: "问题清单", children: [
            { id: "grid-issues", type: "grid", children: [
              { id: "card-issues", type: "card", span: 12, children: [
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
          { id: "grp-components", type: "group", title: "组件使用", children: [
            { id: "grid-components", type: "grid", children: [
              { id: "card-usage", type: "card", span: 7, title: "组件使用次数", children: [
                { id: "chart-usage", type: "bar-chart", layout: "horizontal", height: "h-72", xKey: "component", series: [{ key: "count", label: "次数" }], data: d.componentUsage, src: ["/componentUsage"] } ] },
              { id: "card-nonstd", type: "card", span: 5, title: "不规范用法", children: [
                { id: "list-nonstd", type: "list", items: d.nonstandard.map((x) => ({ title: x.component, description: x.detail, meta: `${x.count} 处` })), src: ["/nonstandard"] } ] },
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
            { id: "card-recs", type: "card", span: 8, title: "优先处理", children: [
              { id: "list-recs", type: "list", items: d.recommendations.map((x) => ({ title: x.title, description: x.detail })), src: ["/recommendations"] } ] },
            { id: "card-follow", type: "card", span: 4, title: "复查安排", children: [
              { id: "kv-follow", type: "kv", className: "gap-y-4", items: [
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
