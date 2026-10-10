// Compare the pairwise judge with the person's ranking on the validation reports.
//
//   node scripts/aesthetic-validate-score.mjs
//
// validate/key.json    blind label (甲乙丙丁) → page, per report
// validate/human.json  the person's ranks per label, e.g. {"ops":{"甲":2,"乙":1,...}}
// A decision is one repeat of one pair judged in both orders. It counts only when
// both orders pick the same page (the rule we adopted); otherwise it is a split.
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const DIR = path.join(ROOT, "out", "aesthetic", "validate")
const key = JSON.parse(fs.readFileSync(path.join(ROOT, "validate", "key.json"), "utf8"))
const human = JSON.parse(fs.readFileSync(path.join(ROOT, "validate", "human.json"), "utf8"))
const NAME = { base: "无原则", principles: "写入原则", psbs: "原则 + 两版并排" }
const files = fs.readdirSync(DIR)
const pick = (f) => {
  try { return JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")).json.better } catch { return null }
}
const conds = [...new Set(files.map((f) => f.split("__")[0]))]
const repeats = [...new Set(files.map((f) => f.match(/__r(\d+)\.json$/)[1]))].sort()

// human preference per page pair: page → rank (lower is better)
const rank = {}
for (const [rep, m] of Object.entries(key)) for (const [label, page] of Object.entries(m)) rank[page] = { rep, label, r: human[rep]?.[label] }

const pairs = []
for (const rep of Object.keys(key)) {
  const ps = Object.values(key[rep]).sort()
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) pairs.push([ps[i], ps[j]])
}

const rows = []
const detail = {}
for (const cond of conds) {
  let agree = 0, against = 0, split = 0, tieSkip = 0, pickA = 0, picks = 0
  for (const [x, y] of pairs) {
    const hx = rank[x].r, hy = rank[y].r
    const hum = hx === hy ? null : hx < hy ? x : y
    const cell = []
    for (const r of repeats) {
      const p1 = pick(`${cond}__${x}__${y}__r${r}.json`) // x shown as A
      const p2 = pick(`${cond}__${y}__${x}__r${r}.json`) // y shown as A
      if (!p1 || !p2) continue
      for (const p of [p1, p2]) { picks++; if (p === "A") pickA++ }
      const w1 = p1 === "A" ? x : y
      const w2 = p2 === "A" ? y : x
      const verdict = w1 === w2 ? w1 : null
      cell.push(verdict ? rank[verdict].label : "分")
      if (!hum) { tieSkip++; continue }
      if (!verdict) split++
      else if (verdict === hum) agree++
      else against++
    }
    ;(detail[`${rank[x].rep}: ${rank[x].label} 对 ${rank[y].label}`] ??= { human: hum ? rank[hum].label : "平" })[cond] = cell.join(" ")
  }
  const n = agree + against + split
  const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%(${a}/${b})` : "–")
  rows.push([NAME[cond] ?? cond, pct(agree, n), pct(against, n), pct(split, n), pct(agree, agree + against), pct(pickA, picks)])
}

console.log("## 和你的排序是否一致(每次判定 = 一对版面按两种顺序各判一次)\n")
console.log("| 条件 | 两次都选你更喜欢的 | 两次都选另一版 | 两次不一致 | 选得出时的一致率 | 选 A 的比例 |")
console.log("|---|---|---|---|---|---|")
for (const r of rows) console.log(`| ${r.join(" | ")} |`)
console.log("\n## 逐对结果(每格为各次重复的判定:选中的版面,或「分」= 两种顺序选得不一样)\n")
console.log(`| 对比 | 你选 | ${conds.map((c) => NAME[c] ?? c).join(" | ")} |`)
console.log(`|---|---|${conds.map(() => "---").join("|")}|`)
for (const [k, v] of Object.entries(detail)) console.log(`| ${k} | ${v.human} | ${conds.map((c) => v[c] ?? "").join(" | ")} |`)
