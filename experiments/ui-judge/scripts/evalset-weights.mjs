// Try ways of combining per-dimension votes into a verdict, without calling
// the model again: reads the per-dimension answers of a -sep run.
//
//   node scripts/evalset-weights.mjs [--cond dims3-sep]
//
// A dimension votes for a page only when it picks that page in both orders.
// Rules:
//   equal       every dimension one vote
//   weighted    space and grouping 3, consistency and alignment 2, the rest 1
//   priority    space+grouping decide; if tied, consistency+alignment; then the rest
//   no-ink-hier equal votes without hierarchy and ink
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const COND = arg("cond", "dims3-sep")
const DIR = path.join(ROOT, "out", "aesthetic", "evalset", COND)
const key = JSON.parse(fs.readFileSync(path.join(ROOT, "evalset", "key.json"), "utf8")).groups
const human = JSON.parse(fs.readFileSync(path.join(ROOT, "evalset", "human.json"), "utf8"))

const W = { space: 3, grouping: 3, consistency: 2, alignment: 2, hierarchy: 1, ink: 1, finish: 1 }
const TIERS = [["space", "grouping"], ["consistency", "alignment"], ["hierarchy", "ink", "finish"]]
const RULES = {
  equal: (v) => sum(v, () => 1),
  weighted: (v) => sum(v, (k) => W[k]),
  priority: (v) => {
    for (const tier of TIERS) {
      const s = sum(Object.fromEntries(Object.entries(v).filter(([k]) => tier.includes(k))), () => 1)
      if (s) return s
    }
    return 0
  },
  "no-ink-hier": (v) => sum(Object.fromEntries(Object.entries(v).filter(([k]) => k !== "ink" && k !== "hierarchy")), () => 1),
}
// v: dimension → +1 (first page) / −1 (second page); returns the signed total
function sum(v, w) {
  return Object.entries(v).reduce((s, [k, x]) => s + x * w(k), 0)
}

const read = (f) => {
  const p = path.join(DIR, f)
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")).json.dims : null
}
const rows = {}
for (const g of key) {
  const label = Object.fromEntries(Object.entries(g.labels).map(([l, v]) => [v, l]))
  const r = (v) => human[g.id]?.[label[v]]
  const vs = Object.values(g.labels).sort()
  for (let i = 0; i < vs.length; i++)
    for (let j = i + 1; j < vs.length; j++) {
      const [x, y] = [vs[i], vs[j]]
      if (r(x) === r(y)) continue
      const hum = r(x) < r(y) ? 1 : -1
      const set = g.id === "review" ? (x === "V8" || y === "V8" ? "辛相关 9 对" : null) : g.title
      if (!set) continue
      for (let n = 1; n <= 3; n++) {
        const d1 = read(`${g.id}__${x}__${y}__r${n}.json`), d2 = read(`${g.id}__${y}__${x}__r${n}.json`)
        if (!d1 || !d2) continue
        const v = {}
        for (const k of Object.keys(d1)) {
          const a = d1[k] === "A" ? 1 : d1[k] === "B" ? -1 : 0
          const b = d2[k] === "A" ? -1 : d2[k] === "B" ? 1 : 0
          if (a && a === b) v[k] = a
        }
        for (const [name, rule] of Object.entries(RULES)) {
          const s = Math.sign(rule(v))
          const c = ((rows[set] ??= {})[name] ??= { agree: 0, against: 0, none: 0 })
          if (!s) c.none++
          else if (s === hum) c.agree++
          else c.against++
        }
      }
    }
}
console.log(`## ${COND}:不同汇总方式与你的排序(和你一致 / 和你相反 / 分不出)\n`)
console.log(`| 范围 | ${Object.keys(RULES).join(" | ")} |`)
console.log(`|---|${Object.keys(RULES).map(() => "---").join("|")}|`)
for (const [set, byRule] of Object.entries(rows))
  console.log(`| ${set} | ${Object.keys(RULES).map((k) => { const c = byRule[k]; return `${c.agree} / ${c.against} / ${c.none}` }).join(" | ")} |`)
