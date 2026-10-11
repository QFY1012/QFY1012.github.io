// Does a way of asking lower the 需求 judge's pull toward the version shown second?
// Re-asks every comparison already in traces/_compare/function/ (same pages, rounds and orders)
// with a variant of compare.mjs, then counts per variant how often both orders agree, and how
// often both pick the second-shown (B) or the first-shown (A) version, whatever its content.
//
//   source judge.env && node scripts/bias-test.mjs --variant focus     run, then score
//   node scripts/bias-test.mjs --score                       score what is there
//
// focus needs the problems each candidate set out to fix: traces/_compare/function-focus/targets.json
// ({"<a>__<b>": ["problem", ...]}); pairs without targets (the twin comparisons) are left out.
import fs from "node:fs"
import path from "node:path"
import { compare } from "./compare.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const CMP = path.join(ROOT, "traces", "_compare")
const BASE = path.join(CMP, "function")
const arg = (k) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : null
}

// The comparisons to repeat: per pair of runs, per page, how many rounds both orders were asked.
const pairs = fs.readdirSync(BASE).map((d) => {
  const [a, b] = d.split("__")
  const rounds = {}
  for (const f of fs.readdirSync(path.join(BASE, d))) {
    const m = f.match(/^(.+)__r(\d+)__BA\.json$/)
    if (m && fs.existsSync(path.join(BASE, d, `${m[1]}__r${m[2]}__AB.json`))) rounds[m[1]] = Math.max(rounds[m[1]] ?? 0, Number(m[2]))
  }
  return { a, b, rounds }
})
const total = pairs.reduce((n, p) => n + Object.values(p.rounds).reduce((x, y) => x + y, 0), 0)

const variant = arg("variant")
const targets = variant === "focus" ? JSON.parse(fs.readFileSync(path.join(CMP, "function-focus", "targets.json"), "utf8")) : null
if (variant) {
  console.log(`变体 ${variant}:重问 ${pairs.length} 对版本上的 ${total} 次比较(每次两种顺序)`)
  for (const [i, { a, b, rounds }] of pairs.entries()) {
    const focus = targets?.[`${a}__${b}`]
    if (targets && !focus) { console.log(`━━ ${i + 1}/${pairs.length} ${a} 对 ${b}:没有上一轮的问题,跳过`); continue }
    console.log(`━━ ${i + 1}/${pairs.length} ${a} 对 ${b}`)
    for (const n of [...new Set(Object.values(rounds))]) await compare(a, b, Object.keys(rounds).filter((c) => rounds[c] === n), n, "function", { variant, next: false, focus })
  }
}

// Per variant: the verdict of each comparison (run name, 一样, or a position pattern).
const pick = (f) => {
  const j = JSON.parse(fs.readFileSync(f, "utf8"))
  return { better: j.json.better, run: j.json.better === "A" ? j.A : j.json.better === "B" ? j.B : j.json.better }
}
function verdicts(dir) {
  const out = {}
  for (const { a, b, rounds } of pairs)
    for (const [c, n] of Object.entries(rounds))
      for (let r = 1; r <= n; r++) {
        const f = (o) => path.join(dir, `${a}__${b}`, `${c}__r${r}__${o}.json`)
        if (!fs.existsSync(f("AB")) || !fs.existsSync(f("BA"))) continue
        const x = pick(f("AB")), y = pick(f("BA"))
        out[`${a}__${b}/${c}/r${r}`] = x.better === "B" && y.better === "B" ? "都选后放的" : x.better === "A" && y.better === "A" ? "都选先放的" : x.run === y.run ? x.run : "其他"
      }
  return out
}
const base = verdicts(BASE)
const rows = [["原来", base], ...fs.readdirSync(CMP).filter((d) => d.startsWith("function-")).map((d) => [d.slice(9), verdicts(path.join(CMP, d))])]
console.log(`\n| 方式 | 比完的 | 两种顺序一致 | 都选后放的 | 都选先放的 | 原来一致的里结论相同 | 原来一致的里结论相反 |\n|---|---|---|---|---|---|---|`)
for (const [name, v] of rows) {
  const ks = Object.keys(v), pos = (x) => x === "都选后放的" || x === "都选先放的" || x === "其他"
  const fixed = Object.keys(base).filter((k) => !pos(base[k]) && k in v)
  console.log(`| ${name} | ${ks.length}/${total} | ${ks.filter((k) => !pos(v[k])).length} | ${ks.filter((k) => v[k] === "都选后放的").length} | ${ks.filter((k) => v[k] === "都选先放的").length} | ${fixed.filter((k) => v[k] === base[k]).length}/${fixed.length} | ${fixed.filter((k) => !pos(v[k]) && v[k] !== base[k]).length} |`)
}
