// 第 0 阶段 0.5:reward(judge)和人工盲标对比。
//
//   node experiments/ui-rl/scripts/eval-reward.mjs [--run baseline-judge] [--labels labels/human.json]
//
// 人工标注:labels/human.json(从标注页的 db 导出的 labels 集合,每条 {pair, round: r1|r2, score: -2..2})。
//   score 以 pairs.json 的左右为准,正数 = 右边更好;0 = 差不多。
// judge 结果:runs/<run>/<pair>__r<n>__<AB|BA>.json(judge-repeat.mjs 写的,right = +1 右边更好 / -1 左边更好)。
//
// 判法(和 loop 一致):一轮里两种顺序选同一边才算判出,否则这一轮「分」;一对的结论 = 各轮判出的多数,平票算没判出。
// 另算一个连续分 m = 所有次判定 right 的平均(-1..1),用来看校准。
//
// 输出 runs/<run>/report.md 并打印:
//   一致率    人工和 judge 都判出的对里,方向一致的比例
//   覆盖率    人工判出的对里,judge 也判出的比例
//   复测一致  同一对各轮(判出的轮)和这对多数结论一致的比例
//   A/A 误判  同一指南两次生成的对里,judge 判出胜负的比例
//   人工自洽  重标的对里,两次方向一致的比例(这是 reward 一致率的上限)
//   和 loop 的取舍对照:人工更喜欢候选的比例,按 loop 当时采用 / 拒绝分开
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d)
const RUN = arg("run", "baseline-judge")
const DIR = path.join(ROOT, "runs", RUN)
const key = JSON.parse(fs.readFileSync(path.join(ROOT, "labels", "key.json"), "utf8"))
const labelsFile = path.resolve(ROOT, arg("labels", "labels/human.json"))
const human = fs.existsSync(labelsFile) ? JSON.parse(fs.readFileSync(labelsFile, "utf8")) : []
const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0)
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%(${a}/${b})` : "—")

// ---- 人工 ----
const H = {}, H2 = {}
for (const l of human) (l.round === "r2" ? H2 : H)[l.pair] = l.score

// ---- judge ----
const J = {}
if (fs.existsSync(DIR))
  for (const f of fs.readdirSync(DIR)) {
    const m = f.match(/^(p\d+)__r(\d+)__(AB|BA)\.json$/)
    if (!m) continue
    const j = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"))
    ;((J[m[1]] ??= {})[m[2]] ??= {})[m[3]] = j.right
  }
function judgeOf(pid) {
  const rounds = Object.values(J[pid] ?? {}).filter((r) => r.AB !== undefined && r.BA !== undefined)
  const calls = rounds.flatMap((r) => [r.AB, r.BA])
  const per = rounds.map((r) => (r.AB === r.BA ? r.AB : 0))
  const net = per.reduce((a, b) => a + b, 0)
  return { n: rounds.length, per, verdict: sign(net), mean: calls.length ? calls.reduce((a, b) => a + b, 0) / calls.length : null }
}

const rows = key.map((p) => ({ ...p, h: H[p.id], h2: H2[p.id], j: judgeOf(p.id) }))
const cand = rows.filter((r) => r.kind === "cand"), aa = rows.filter((r) => r.kind === "aa")
const lines = []
const say = (s = "") => { lines.push(s); console.log(s) }

say(`# reward 对照:${RUN}`)
say()
say(`人工第 1 轮已标 ${rows.filter((r) => r.h !== undefined).length}/${rows.length} 对,重标 ${Object.keys(H2).length} 对;judge 每对平均 ${(rows.reduce((a, r) => a + r.j.n, 0) / rows.length).toFixed(1)} 轮。`)
say()

// 一致率 / 覆盖率(候选对)
const hDec = cand.filter((r) => r.h !== undefined && r.h !== 0)
const both = hDec.filter((r) => r.j.verdict !== 0)
const agree = both.filter((r) => sign(r.h) === r.j.verdict)
const strong = hDec.filter((r) => Math.abs(r.h) === 2), strongBoth = strong.filter((r) => r.j.verdict !== 0)
say(`## 候选对(${cand.length} 对)`)
say(`- 一致率:${pct(agree.length, both.length)}(人工和 judge 都判出的对里方向一致)`)
say(`- 覆盖率:${pct(both.length, hDec.length)}(人工判出的对里 judge 也判出)`)
say(`- 人工「明显更好」的对:一致 ${pct(strongBoth.filter((r) => sign(r.h) === r.j.verdict).length, strongBoth.length)},覆盖 ${pct(strongBoth.length, strong.length)}`)
say(`- 人工判「差不多」的对:${cand.filter((r) => r.h === 0).length} 对,judge 在其中判出胜负 ${pct(cand.filter((r) => r.h === 0 && r.j.verdict !== 0).length, cand.filter((r) => r.h === 0).length)}`)

// 复测一致
let same = 0, tot = 0, splitR = 0, allR = 0
for (const r of rows) {
  for (const v of r.j.per) { allR++; if (v === 0) splitR++ }
  if (r.j.verdict === 0) continue
  for (const v of r.j.per) if (v !== 0) { tot++; if (v === r.j.verdict) same++ }
}
say()
say(`## judge 自身`)
say(`- 复测一致:${pct(same, tot)}(判出的轮里,和这对多数结论一致)`)
say(`- 两种顺序不一致(「分」)的轮:${pct(splitR, allR)}`)
say(`- A/A 误判:${pct(aa.filter((r) => r.j.verdict !== 0).length, aa.filter((r) => r.j.n).length)}(同一指南两次生成,judge 却判出胜负)`)
const aaH = aa.filter((r) => r.h !== undefined)
say(`- A/A 对上人工判出胜负:${pct(aaH.filter((r) => r.h !== 0).length, aaH.length)}(生成本身的差异人能不能看出来)`)

// 人工自洽
const re = rows.filter((r) => r.h !== undefined && r.h2 !== undefined)
say()
say(`## 人工自洽(重标 ${re.length} 对)`)
say(`- 方向一致(把「差不多」也当一个方向):${pct(re.filter((r) => sign(r.h) === sign(r.h2)).length, re.length)}`)
say(`- 两次都判出时方向一致:${pct(re.filter((r) => r.h && r.h2 && sign(r.h) === sign(r.h2)).length, re.filter((r) => r.h && r.h2).length)}`)
say(`- 分数完全相同:${pct(re.filter((r) => r.h === r.h2).length, re.length)}`)

// 校准:连续分 m 分档
say()
say(`## 校准(候选对,judge 连续分 m = 各次判定的平均,+1 = 全选右边)`)
say(`| m 区间 | 对数 | 人工认为右边更好 | 人工认为左边更好 | 差不多 |`)
say(`|---|---|---|---|---|`)
for (const [lo, hi] of [[-1, -0.6], [-0.6, -0.2], [-0.2, 0.2], [0.2, 0.6], [0.6, 1.01]]) {
  const b = cand.filter((r) => r.h !== undefined && r.j.mean !== null && r.j.mean >= lo && r.j.mean < hi)
  say(`| ${lo} ~ ${Math.min(hi, 1)} | ${b.length} | ${b.filter((r) => r.h > 0).length} | ${b.filter((r) => r.h < 0).length} | ${b.filter((r) => r.h === 0).length} |`)
}

// 和 loop 当时的取舍对照
const prefCand = (r) => sign(r.h) * (r.candSide === "right" ? 1 : -1) // +1 = 人工更喜欢候选
say()
say(`## 人工怎么看 loop 的取舍(按候选)`)
say(`| 候选 | loop | 人工:候选更好 / 差不多 / 基线更好 | judge 本次:候选赢 / 分 / 基线赢 |`)
say(`|---|---|---|---|`)
for (const c of [...new Set(cand.map((r) => r.candidate))].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))) {
  const rs = cand.filter((r) => r.candidate === c)
  const hs = rs.filter((r) => r.h !== undefined).map(prefCand)
  const js = rs.map((r) => r.j.verdict * (r.candSide === "right" ? 1 : -1))
  say(`| ${c} | ${rs[0].accepted ? "采用" : "拒绝"} | ${hs.filter((x) => x > 0).length} / ${hs.filter((x) => x === 0).length} / ${hs.filter((x) => x < 0).length} | ${js.filter((x) => x > 0).length} / ${js.filter((x) => x === 0).length} / ${js.filter((x) => x < 0).length} |`)
}

fs.mkdirSync(DIR, { recursive: true })
fs.writeFileSync(path.join(DIR, "report.md"), lines.join("\n") + "\n")
console.log(`\n写出 ${path.relative(process.cwd(), path.join(DIR, "report.md"))}`)
