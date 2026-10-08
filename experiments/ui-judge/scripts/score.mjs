// Score judge results against the injected ground truth.
//
//   node scripts/score.mjs [--run pilot]
//
// Per defect sample, a run counts as
//   识别  the judge reported the injected check
//   定位  ...and at least one of its nodes is a ground-truth spec node or inside one
//   察觉  any finding (whatever check) located on the ground truth
// On the clean sample every finding is a false positive (误报).
// 一致  share of (sample, mode) where all repeats agree on 定位.
// Writes out/judge/<run>/report.md and summary.json.
import fs from "node:fs"
import path from "node:path"

import { CHECKS } from "./rubric.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const RUN = arg("run", "pilot")
const DIR = path.join(ROOT, "out", "judge", RUN)
const MODES = ["shot", "dom", "both", "geo"]
const MODE_NAME = { shot: "只截图", dom: "只 DOM", both: "截图+DOM", geo: "截图+DOM+几何" }

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "samples", "manifest.json"), "utf8"))
const bySample = Object.fromEntries(manifest.map((m) => [m.sample, m]))

// spec id -> parent spec id, per sample
const specParents = {}
function specParentMap(sample) {
  if (specParents[sample]) return specParents[sample]
  const spec = JSON.parse(fs.readFileSync(path.join(ROOT, "samples", `${sample}.json`), "utf8"))
  const map = {}
  const walk = (n, p) => {
    map[n.id] = p
    n.children?.forEach((c) => walk(c, n.id))
  }
  walk(spec, null)
  return (specParents[sample] = map)
}

// nid -> nearest spec id at or above it, per sample
const owners = {}
function ownerMap(sample) {
  if (owners[sample]) return owners[sample]
  const dom = JSON.parse(fs.readFileSync(path.join(ROOT, "out", "render", sample, "dom.json"), "utf8"))
  const byNid = Object.fromEntries(dom.nodes.map((n) => [n.nid, n]))
  const map = {}
  for (const n of dom.nodes) {
    let cur = n
    while (cur && !cur.spec) cur = byNid[cur.parent]
    map[n.nid] = cur?.spec ?? null
  }
  return (owners[sample] = map)
}

function located(sample, finding, gt) {
  const own = ownerMap(sample)
  const par = specParentMap(sample)
  return finding.nodes.some((nid) => {
    for (let s = own[nid]; s; s = par[s]) if (gt.includes(s)) return true
    return false
  })
}

// ---- collect ----------------------------------------------------------------
const results = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".json") && f !== "summary.json")
  .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")))

const rows = []
for (const r of results) {
  const m = bySample[r.sample]
  if (!m) continue
  const valid = r.findings.filter((f) => f.invalidNodes.length < f.nodes.length)
  const row = {
    sample: r.sample,
    mode: r.mode,
    repeat: r.repeat,
    findings: r.findings.length,
    invalidNodeShare: r.findings.length ? r.findings.reduce((a, f) => a + f.invalidNodes.length / Math.max(1, f.nodes.length), 0) / r.findings.length : 0,
    tokens: r.usage?.total_tokens ?? 0,
    latencyMs: r.latencyMs,
  }
  if (m.defect) {
    const { check, gt, level } = m.defect
    row.check = check
    row.level = level
    row.detect = valid.some((f) => f.check === check)
    row.locate = valid.some((f) => f.check === check && located(r.sample, f, gt))
    row.notice = valid.some((f) => located(r.sample, f, gt))
    row.offTarget = valid.filter((f) => !located(r.sample, f, gt)).length
  } else {
    row.clean = true
    row.fpChecks = valid.map((f) => f.check)
  }
  rows.push(row)
}

// ---- aggregate ----------------------------------------------------------------
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : "–")
const sum = (xs, f) => xs.reduce((a, x) => a + (f(x) ? 1 : 0), 0)
const lines = []
lines.push(`# Judge 实验结果:${RUN}`, "")
lines.push(`样本 ${new Set(rows.map((r) => r.sample)).size} 个,判定 ${rows.length} 次。每格为 定位率(识别率),分母为该检查项该档位的样本数 × 重复次数。`, "")

for (const level of ["obvious", "subtle"]) {
  lines.push(`## 定位率(识别率):${level === "obvious" ? "明显" : "轻微"}缺陷`, "")
  lines.push(`| 检查项 | ${MODES.map((m) => MODE_NAME[m]).join(" | ")} |`)
  lines.push(`|---|${MODES.map(() => "---").join("|")}|`)
  for (const c of CHECKS) {
    const cells = MODES.map((mode) => {
      const xs = rows.filter((r) => r.check === c.id && r.level === level && r.mode === mode)
      return xs.length ? `${pct(sum(xs, (r) => r.locate), xs.length)} (${pct(sum(xs, (r) => r.detect), xs.length)})` : "–"
    })
    lines.push(`| ${c.id} ${c.name} | ${cells.join(" | ")} |`)
  }
  lines.push("")
}

lines.push("## 察觉率(问题位置被标出,检查项可以不对)", "")
lines.push(`| 检查项 | ${MODES.map((m) => MODE_NAME[m]).join(" | ")} |`)
lines.push(`|---|${MODES.map(() => "---").join("|")}|`)
for (const c of CHECKS) {
  const cells = MODES.map((mode) => {
    const xs = rows.filter((r) => r.check === c.id && r.mode === mode)
    return xs.length ? pct(sum(xs, (r) => r.notice), xs.length) : "–"
  })
  lines.push(`| ${c.id} ${c.name} | ${cells.join(" | ")} |`)
}
lines.push("")

lines.push("## 误报与稳定性", "")
lines.push(`| 指标 | ${MODES.map((m) => MODE_NAME[m]).join(" | ")} |`)
lines.push(`|---|${MODES.map(() => "---").join("|")}|`)
const per = (f) => MODES.map((mode) => f(rows.filter((r) => r.mode === mode))).join(" | ")
lines.push(`| 好样本每次误报条数 | ${per((xs) => {
  const c = xs.filter((r) => r.clean)
  return c.length ? (c.reduce((a, r) => a + r.fpChecks.length, 0) / c.length).toFixed(1) : "–"
})} |`)
lines.push(`| 缺陷样本每次额外标记条数 | ${per((xs) => {
  const d = xs.filter((r) => !r.clean)
  return d.length ? (d.reduce((a, r) => a + r.offTarget, 0) / d.length).toFixed(1) : "–"
})} |`)
lines.push(`| 无效编号占比 | ${per((xs) => (xs.length ? `${Math.round((100 * xs.reduce((a, r) => a + r.invalidNodeShare, 0)) / xs.length)}%` : "–"))} |`)
lines.push(`| 重复判定一致率(定位) | ${per((xs) => {
  const groups = {}
  for (const r of xs.filter((r) => !r.clean)) (groups[r.sample] ??= []).push(r.locate)
  const g = Object.values(groups).filter((v) => v.length > 1)
  return g.length ? pct(g.filter((v) => v.every((x) => x === v[0])).length, g.length) : "–"
})} |`)
lines.push(`| 平均 token / 耗时 | ${per((xs) => (xs.length ? `${Math.round(xs.reduce((a, r) => a + r.tokens, 0) / xs.length)} / ${Math.round(xs.reduce((a, r) => a + r.latencyMs, 0) / xs.length / 1000)}s` : "–"))} |`)
lines.push("")

const fp = {}
for (const r of rows.filter((r) => r.clean)) for (const c of r.fpChecks) (fp[r.mode] ??= {})[c] = (fp[r.mode][c] ?? 0) + 1
lines.push("## 好样本上被误报的检查项(次数)", "")
for (const mode of MODES) {
  const e = Object.entries(fp[mode] ?? {}).sort()
  lines.push(`- ${MODE_NAME[mode]}:${e.length ? e.map(([c, n]) => `${c}×${n}`).join(",") : "无"}`)
}
lines.push("")

fs.writeFileSync(path.join(DIR, "report.md"), lines.join("\n"))
fs.writeFileSync(path.join(DIR, "summary.json"), JSON.stringify(rows, null, 1))
console.log(lines.join("\n"))
