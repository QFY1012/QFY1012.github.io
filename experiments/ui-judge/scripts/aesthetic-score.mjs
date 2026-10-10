// Score the aesthetic probe.   node scripts/aesthetic-score.mjs [--run probe]
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const i = process.argv.indexOf("--run")
const RUN = i > 0 ? process.argv[i + 1] : "probe"
const DIR = path.join(ROOT, "out", "aesthetic", RUN)

// Same answer key as scripts/aesthetic.mjs.
const EXPECTED = {
  V1: ["A1"], V2: ["A2"], V3: ["A3"], V4: ["A4"], V5: ["A5"], V6: ["A5"],
  V7: ["A6", "A7", "A8"], V8: ["A9"], V9: ["A10"], F: [],
}
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"))
const load = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"))

console.log("## 逐条判定:你否定的理由是否被判出来\n")
console.log("| 版本 | 你的理由 | judge 判为出现的失败模式 | 命中 |")
console.log("|---|---|---|---|")
let hit = 0, total = 0, fpOnF = []
for (const v of Object.keys(EXPECTED)) {
  for (const f of files.filter((f) => f.startsWith(`check__${v}__`))) {
    const fails = (load(f).json.checks ?? []).filter((c) => c.fail === true).map((c) => c.id)
    const exp = EXPECTED[v]
    if (v === "F") fpOnF = fails
    const got = exp.filter((e) => fails.includes(e))
    if (exp.length) { total += exp.length; hit += got.length }
    console.log(`| ${v} | ${exp.join("、") || "(终版)"} | ${fails.join("、") || "无"} | ${exp.length ? `${got.length}/${exp.length}` : `误报 ${fails.length} 条`} |`)
  }
}
console.log(`\n命中 ${hit}/${total};终版误报 ${fpOnF.length} 条\n`)

console.log("## 两版对比:是否选中终版,交换顺序后是否一致\n")
console.log("| 对比 | 终版为 A 时 | 终版为 B 时 | 两次都选终版 |")
console.log("|---|---|---|---|")
let both = 0, n = 0, picksA = 0, picks = 0
for (const v of Object.keys(EXPECTED).filter((v) => v !== "F")) {
  const fa = files.find((f) => f.startsWith(`pair__${v}__FA__`))
  const fb = files.find((f) => f.startsWith(`pair__${v}__FB__`))
  if (!fa || !fb) continue
  const a = load(fa).json.better, b = load(fb).json.better
  for (const x of [a, b]) { picks++; if (x === "A") picksA++ }
  const ok = a === "A" && b === "B"
  n++; if (ok) both++
  console.log(`| F 对 ${v} | 选 ${a}${a === "A" ? "(终版)" : ""} | 选 ${b}${b === "B" ? "(终版)" : ""} | ${ok ? "是" : "否"} |`)
}
console.log(`\n两次都选终版 ${both}/${n};所有判定中选 A 的比例 ${picks ? Math.round((100 * picksA) / picks) : 0}%(50% 附近说明没有位置偏好)`)

// Pooled over repeats with both orders equally represented, so position
// preference cancels out: share of judgments that pick the accepted page.
console.log("\n## 两版对比(合并所有重复,两种顺序各半)\n")
console.log("| 对比 | 终版为 A 时选中终版 | 终版为 B 时选中终版 | 合计选中终版 | 结论 |")
console.log("|---|---|---|---|---|")
for (const v of Object.keys(EXPECTED).filter((v) => v !== "F")) {
  const fa = files.filter((f) => f.startsWith(`pair__${v}__FA__`)).map((f) => load(f).json.better === "A")
  const fb = files.filter((f) => f.startsWith(`pair__${v}__FB__`)).map((f) => load(f).json.better === "B")
  const k = Math.min(fa.length, fb.length)
  if (!k) continue
  const a = fa.slice(0, k), b = fb.slice(0, k)
  const wins = [...a, ...b].filter(Boolean).length
  const share = wins / (2 * k)
  const verdict = share >= 5 / 6 ? "终版胜" : share <= 1 / 6 ? "旧版胜" : "分不出(主要看位置)"
  console.log(`| F 对 ${v} | ${a.filter(Boolean).length}/${k} | ${b.filter(Boolean).length}/${k} | ${wins}/${2 * k} | ${verdict} |`)
}
