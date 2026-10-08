// Inject one known defect per sample into the clean spec.
//
//   node scripts/inject.mjs
//
// Writes samples/<report>.clean.json, samples/<report>.<defect>.json and
// samples/manifest.json (ground truth: target check, level, spec ids where
// the problem is). A judge mark counts as located when the marked node is
// one of these spec nodes or sits inside one.
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")

// ---- spec helpers ---------------------------------------------------------
function walk(node, fn, parent = null) {
  fn(node, parent)
  node.children?.forEach((c) => walk(c, fn, node))
}
function find(spec, id) {
  let hit = null
  walk(spec, (n, p) => {
    if (n.id === id) hit = { node: n, parent: p }
  })
  if (!hit) throw new Error(`no spec node ${id}`)
  return hit
}
const node = (spec, id) => find(spec, id).node
function addClass(spec, id, cls, key = "className") {
  const n = node(spec, id)
  n[key] = [n[key], cls].filter(Boolean).join(" ")
}
function remove(spec, id) {
  const { node: n, parent } = find(spec, id)
  parent.children = parent.children.filter((c) => c !== n)
  return n
}
function insert(spec, parentId, child, index = Infinity) {
  const p = node(spec, parentId)
  p.children.splice(Math.min(index, p.children.length), 0, child)
}
function replaceWith(spec, id, repl) {
  const { node: n, parent } = find(spec, id)
  parent.children[parent.children.indexOf(n)] = repl
}

// ---- defects for the review report ----------------------------------------
// check: rubric id. level: "obvious" | "subtle". gt: spec ids of the problem.
const REVIEW = [
  // 2.2 data fidelity
  { id: "2.2-o", check: "2.2", level: "obvious", gt: ["table-issues"],
    what: "问题清单删掉 P03 一行",
    apply: (s) => { const t = node(s, "table-issues"); t.rows = t.rows.filter((r) => r.id !== "P03") } },
  { id: "2.2-s", check: "2.2", level: "subtle", gt: ["prog-dims"],
    what: "分维度得分里“容错”由 58 改成 85",
    apply: (s) => { const it = node(s, "prog-dims").items.find((x) => x.label === "容错"); it.value = 85; it.display = "85" } },

  // 2.3 collision
  { id: "2.3-o", check: "2.3", level: "obvious", gt: ["card-dims", "card-trend"],
    what: "分维度得分卡片左移 64px,与趋势卡片重叠 40px",
    apply: (s) => addClass(s, "card-dims", "-ml-16") },
  { id: "2.3-s", check: "2.3", level: "subtle", gt: ["card-nonstd", "card-usage"],
    what: "不规范用法卡片左移 32px,与左侧卡片重叠 8px",
    apply: (s) => addClass(s, "card-nonstd", "-ml-8") },

  // 3.1 spacing ladder: page 96 / group 48 / card 24
  { id: "3.1-o", check: "3.1", level: "obvious", gt: ["sec-issues", "grp-issues", "grp-components"],
    what: "“走查发现”里两个组之间 16px,小于卡片之间的 24px",
    apply: (s) => addClass(s, "sec-issues", "gap-4") },
  { id: "3.1-s", check: "3.1", level: "subtle", gt: ["grid-components", "card-usage", "card-nonstd"],
    what: "组件使用一行两张卡片之间 16px,低于最小 24px",
    apply: (s) => addClass(s, "grid-components", "gap-4") },

  // 3.2 consistent spacing inside a card
  { id: "3.2-o", check: "3.2", level: "obvious", gt: ["text-issues-note", "card-issues"],
    what: "问题清单卡片里表格与说明文字之间 64px,其余 24px",
    apply: (s) => addClass(s, "text-issues-note", "mt-10") },
  { id: "3.2-s", check: "3.2", level: "subtle", gt: ["text-issues-note", "card-issues"],
    what: "问题清单卡片里表格与说明文字之间 32px,其余 24px",
    apply: (s) => addClass(s, "text-issues-note", "mt-2") },

  // 3.3 equal height in a row
  { id: "3.3-o", check: "3.3", level: "obvious", gt: ["card-dims", "card-trend"],
    what: "趋势图加高到 320px,分维度卡片不再拉伸,比同行卡片矮约 100px",
    apply: (s) => { node(s, "chart-trend").height = "h-80"; addClass(s, "card-dims", "self-start") } },
  { id: "3.3-s", check: "3.3", level: "subtle", gt: ["card-dims", "card-trend"],
    what: "分维度得分卡片不再拉伸,比同行卡片略矮",
    apply: (s) => addClass(s, "card-dims", "self-start") },

  // 3.4 negative space: every row fills 12 columns
  { id: "3.4-o", check: "3.4", level: "obvious", gt: ["grid-components", "card-usage", "card-nonstd"],
    what: "组件使用一行只占 9 列(5 + 4),右侧空 3 列",
    apply: (s) => { node(s, "card-usage").span = 5; node(s, "card-nonstd").span = 4 } },
  { id: "3.4-s", check: "3.4", level: "subtle", gt: ["grid-next", "card-recs", "card-follow"],
    what: "下一步一行只占 11 列(7 + 4),右侧空 1 列",
    apply: (s) => { node(s, "card-recs").span = 7 } },

  // 3.5 whitespace: no large empty area inside a card
  { id: "3.5-o", check: "3.5", level: "obvious", gt: ["card-dims"],
    what: "趋势图加高到 384px,同行的分维度卡片被拉高,下方大片空白",
    apply: (s) => { node(s, "chart-trend").height = "h-96" } },
  { id: "3.5-s", check: "3.5", level: "subtle", gt: ["card-dims"],
    what: "趋势图加高到 288px,分维度卡片下方出现一段空白",
    apply: (s) => { node(s, "chart-trend").height = "h-72" } },

  // 3.6 visual balance within a row / block
  { id: "3.6-o", check: "3.6", level: "obvious", gt: ["card-summary", "text-summary"],
    what: "结论文字限宽 384px,整行卡片内容全部挤在左侧",
    apply: (s) => addClass(s, "text-summary", "max-w-sm") },
  { id: "3.6-s", check: "3.6", level: "subtle", gt: ["card-summary", "text-summary"],
    what: "结论文字限宽 768px,卡片右侧约三分之一空着",
    apply: (s) => addClass(s, "text-summary", "max-w-3xl") },

  // 3.7 justified body text
  { id: "3.7-o", check: "3.7", level: "obvious", gt: ["text-summary"],
    what: "结论正文居中对齐",
    apply: (s) => { node(s, "text-summary").className = "text-center" } },
  { id: "3.7-s", check: "3.7", level: "subtle", gt: ["text-summary"],
    what: "结论正文改为左对齐(右边缘参差)",
    apply: (s) => { node(s, "text-summary").className = "text-left" } },

  // 4.1 grouping
  { id: "4.1-o", check: "4.1", level: "obvious", gt: ["card-nonstd"],
    what: "“不规范用法”(走查发现)被放进“下一步”一节",
    apply: (s) => {
      const c = remove(s, "card-nonstd")
      node(s, "card-usage").span = 12
      c.span = 12
      insert(s, "grid-next", c)
    } },
  { id: "4.1-s", check: "4.1", level: "subtle", gt: ["card-dims", "card-nonstd"],
    what: "“分维度得分”与“不规范用法”互换位置,各自进了不相干的组",
    apply: (s) => {
      const dims = node(s, "card-dims")
      const non = node(s, "card-nonstd")
      replaceWith(s, "card-dims", { ...non, span: 4 })
      replaceWith(s, "card-nonstd", { ...dims, span: 5 })
    } },

  // 4.2 hierarchy: the most prominent thing is the most important
  { id: "4.2-o", check: "4.2", level: "obvious", gt: ["text-issues-note"],
    what: "表格下方的计数说明放大成 30px 粗体,比各节标题还醒目",
    apply: (s) => { node(s, "text-issues-note").className = "text-3xl font-semibold" } },
  { id: "4.2-s", check: "4.2", level: "subtle", gt: ["card-follow", "card-recs"],
    what: "“复查安排”占 8 列主位置,“优先处理”被挤到 4 列",
    apply: (s) => {
      const recs = node(s, "card-recs")
      const follow = node(s, "card-follow")
      const g = node(s, "grid-next")
      g.children = [{ ...follow, span: 8 }, { ...recs, span: 4 }]
    } },

  // 4.3 component fits the data
  { id: "4.3-o", check: "4.3", level: "obvious", gt: ["chart-usage"],
    what: "各组件使用次数(无顺序的类别)用折线图连起来",
    apply: (s) => {
      const c = node(s, "chart-usage")
      c.type = "line-chart"
      delete c.layout
    } },
  { id: "4.3-s", check: "4.3", level: "subtle", gt: ["prog-dims"],
    what: "分维度得分(满分 100)改成键值列表,失去比例对比",
    apply: (s) => {
      const p = node(s, "prog-dims")
      replaceWith(s, "prog-dims", { id: p.id, type: "kv", src: p.src, items: p.items.map((x) => ({ label: x.label, value: x.display })) })
    } },

  // 4.4 same kind of information uses the same component
  { id: "4.4-o", check: "4.4", level: "obvious", gt: ["stat-total", "stat-fixed"],
    what: "四个指标里两个不用指标组件:问题总数改成键值列表,已修复改成一句文字",
    apply: (s) => {
      replaceWith(s, "stat-total", { id: "stat-total", type: "kv", src: ["/issueCounts/total", "/issueCounts/major", "/issueCounts/minor"],
        items: [{ label: "问题总数", value: "23" }, { label: "主要", value: "8" }, { label: "次要", value: "12" }] })
      replaceWith(s, "stat-fixed", { id: "stat-fixed", type: "text", text: "自上次走查以来已修复 9 个问题", src: ["/issueCounts/fixedSinceLast"] })
    } },
  { id: "4.4-s", check: "4.4", level: "subtle", gt: ["stat-fixed"],
    what: "四个指标里“已修复”改成键值列表",
    apply: (s) => {
      replaceWith(s, "stat-fixed", { id: "stat-fixed", type: "kv", src: ["/issueCounts/fixedSinceLast"],
        items: [{ label: "已修复", value: "9" }, { label: "统计范围", value: "自上次走查" }] })
    } },
]

const REPORTS = { review: REVIEW }

const outDir = path.join(ROOT, "samples")
fs.mkdirSync(outDir, { recursive: true })
for (const f of fs.readdirSync(outDir)) if (f.endsWith(".json")) fs.rmSync(path.join(outDir, f))

const manifest = []
for (const [report, defects] of Object.entries(REPORTS)) {
  const clean = JSON.parse(fs.readFileSync(path.join(ROOT, "specs", `${report}.clean.json`), "utf8"))
  fs.writeFileSync(path.join(outDir, `${report}.clean.json`), JSON.stringify(clean))
  manifest.push({ sample: `${report}.clean`, report, defect: null })
  for (const d of defects) {
    const s = structuredClone(clean)
    d.apply(s)
    for (const id of d.gt) find(s, id) // ground truth must exist in the sample
    const name = `${report}.${d.id}`
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(s))
    manifest.push({ sample: name, report, defect: { id: d.id, check: d.check, level: d.level, gt: d.gt, what: d.what } })
  }
}
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1))
console.log(`${manifest.length} samples`)
