// Compare the base aesthetic run with the ablations.
//   node scripts/aesthetic-compare.mjs probe abl-nodom abl-sbs abl-principles abl-high
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const runs = process.argv.slice(2)
const NAME = { probe: "基线", "abl-nodom": "去掉 DOM", "abl-sbs": "两版并排", "abl-principles": "写入原则", "abl-high": "高推理强度" }
const EXPECTED = {
  V1: ["A1"], V2: ["A2"], V3: ["A3"], V4: ["A4"], V5: ["A5"], V6: ["A5"],
  V7: ["A6", "A7", "A8"], V8: ["A9"], V9: ["A10"], F: [],
}
// Taste calls the base run missed vs concrete ones it got.
const TASTE = new Set(["A1", "A3", "A5", "A6", "A7", "A8", "A9"])

const rows = []
for (const run of runs) {
  const dir = path.join(ROOT, "out", "aesthetic", run)
  if (!fs.existsSync(dir)) continue
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"))
  const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).json
  let tHit = 0, tTot = 0, cHit = 0, cTot = 0, fp = 0, fRuns = 0
  for (const f of files.filter((f) => f.startsWith("check__"))) {
    const v = f.split("__")[1]
    const fails = new Set((load(f).checks ?? []).filter((c) => c.fail === true).map((c) => c.id))
    if (v === "F") { fRuns++; fp += fails.size; continue }
    for (const e of EXPECTED[v]) {
      if (TASTE.has(e)) { tTot++; if (fails.has(e)) tHit++ } else { cTot++; if (fails.has(e)) cHit++ }
    }
  }
  let wins = 0, total = 0, pickA = 0, stable = 0, pairs = 0
  for (const v of Object.keys(EXPECTED).filter((v) => v !== "F")) {
    const fa = files.filter((f) => f.startsWith(`pair__${v}__FA__`)).map((f) => load(f).better)
    const fb = files.filter((f) => f.startsWith(`pair__${v}__FB__`)).map((f) => load(f).better)
    const k = Math.min(fa.length, fb.length)
    if (!k) continue
    const w = fa.slice(0, k).filter((x) => x === "A").length + fb.slice(0, k).filter((x) => x === "B").length
    wins += w; total += 2 * k
    pickA += [...fa.slice(0, k), ...fb.slice(0, k)].filter((x) => x === "A").length
    pairs++; if (w >= (2 * k * 5) / 6) stable++
  }
  const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%(${a}/${b})` : "–")
  rows.push([NAME[run] ?? run, pct(tHit, tTot), pct(cHit, cTot), fRuns ? (fp / fRuns).toFixed(1) : "–", pct(wins, total), total ? pct(pickA, total) : "–", pairs ? `${stable}/${pairs}` : "–"])
}
console.log("| 条件 | 取舍类判出率 | 客观类判出率 | 终版每次误报 | 两版对比选中终版 | 选 A 的比例 | 稳定选中终版的对数 |")
console.log("|---|---|---|---|---|---|---|")
for (const r of rows) console.log(`| ${r.join(" | ")} |`)
console.log("\n取舍类:A1 卡片多余、A3 疏密、A5 文字块、A6–A8 挤压/拉稀/主次、A9 系统;客观类:A2 颜色、A4 错位、A10 标点。")
console.log("稳定选中终版:两种顺序合计至少 5/6 选中终版。选 A 的比例接近 50% 说明位置偏好被抵消。")
