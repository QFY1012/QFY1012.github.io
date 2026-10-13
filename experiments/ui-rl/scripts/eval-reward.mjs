// reward(judge)和人工盲标对比。第 0 阶段测基线,第 1 阶段比较几种 judge。
//
//   node experiments/ui-rl/scripts/eval-reward.mjs [--run baseline-judge[,p1-ia,...]] [--rounds 1] [--labels labels/human.json] [--out reports/phase1-judges.md]
//
// 人工标注:labels/human.json(从标注页的 db 导出的 labels 集合,每条 {pair, round: r1|r2, score: -2..2})。
//   score 以 pairs.json 的左右为准,正数 = 右边更好;0 = 差不多。
// judge 结果:runs/<run>/<pair>__r<n>__<AB|BA>.json(judge-repeat.mjs 写的,right = 换算到 pairs.json 左右的分数,正数 = 右边更好)。
//   只能二选一的 judge right 是 ±1,五档的是 -2..2。
//
// 判法:一轮的值 v = 两种顺序 right 的平均;一对的值 = 各轮 v 的平均,绝对值 ≥ 0.5 算判出,方向即符号。
//   ±1 的 judge 下,这和 loop 的判法一样(两种顺序选同一边才算判出)。
//
// 分两半报(第 1 阶段调 judge 只看 dev,test 留作检验,见 PLAN.md):
//   dev   候选 c1 c2 c3 c5 c8 c11 + flow-g0 的 A/A 对
//   test  候选 c4 c6 c7 c9 c10 c12 + flow-c10-k3、flow-c10-k3-k4 的 A/A 对
//
// 指标:
//   一致率    人工和 judge 都判出的对里,方向一致的比例
//   覆盖率    人工判出的对里,judge 也判出的比例
//   候选级    每个候选在它的 6 对上:人工的多数方向 vs judge 的多数方向(loop 真正用的是这个粒度)
//   顺序不一致 两种顺序方向相反的轮(位置偏差)
//   选 B 比例 所有次判定里选第二个位置的比例(只算判出胜负的)
//   人工自洽  重标的对里,两次方向一致的比例(reward 一致率的上限)
//
// 每个 run 写 runs/<run>/report.md;给了多个 run 时再打印对比表(--out 时写进文件)。
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d)
const RUNS = arg("run", "baseline-judge").split(",")
const OUT = arg("out")
const MAXR = Number(arg("rounds", "999")) // 只用前几轮,让轮数不同的 run 可比
const key = JSON.parse(fs.readFileSync(path.join(ROOT, "labels", "key.json"), "utf8"))
const labelsFile = path.resolve(ROOT, arg("labels", "labels/human.json"))
const human = fs.existsSync(labelsFile) ? JSON.parse(fs.readFileSync(labelsFile, "utf8")) : []
const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0)
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%(${a}/${b})` : "—")
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

const DEV_CAND = new Set(["c1", "c2", "c3", "c5", "c8", "c11"])
const splitOf = (p) => (p.kind === "cand" ? (DEV_CAND.has(p.candidate) ? "dev" : "test") : p.base === "flow-g0" ? "dev" : "test")

// ---- 人工 ----
const H = {}, H2 = {}
for (const l of human) (l.round === "r2" ? H2 : H)[l.pair] = l.score

function load(run) {
  const dir = path.join(ROOT, "runs", run), J = {}
  if (fs.existsSync(dir))
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/^(p\d+)__r(\d+)__(AB|BA)\.json$/)
      if (!m || Number(m[2]) > MAXR) continue
      const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))
      ;((J[m[1]] ??= {})[m[2]] ??= {})[m[3]] = j
    }
  return J
}
function judgeOf(J, pid) {
  const rounds = Object.values(J[pid] ?? {}).filter((r) => r.AB && r.BA)
  const per = rounds.map((r) => (r.AB.right + r.BA.right) / 2)
  const v = avg(per)
  return {
    n: rounds.length, per, v,
    verdict: v !== null && Math.abs(v) >= 0.5 ? sign(v) : 0,
    flips: rounds.filter((r) => sign(r.AB.right) * sign(r.BA.right) < 0).length,
    calls: rounds.flatMap((r) => [r.AB, r.BA]),
  }
}

function evalRun(run) {
  const J = load(run)
  const rows = key.map((p) => ({ ...p, split: splitOf(p), h: H[p.id], h2: H2[p.id], j: judgeOf(J, p.id) }))
  const lines = []
  const say = (s = "") => lines.push(s)
  const M = {} // 对比表用的数

  say(`# reward 对照:${run}`)
  say()
  say(`人工第 1 轮已标 ${rows.filter((r) => r.h !== undefined).length}/${rows.length} 对,重标 ${Object.keys(H2).length} 对;judge 每对平均 ${(rows.reduce((a, r) => a + r.j.n, 0) / rows.length).toFixed(1)} 轮。一对的值绝对值 ≥ 0.5 算判出。`)

  const pairStats = (rs) => {
    const hDec = rs.filter((r) => r.h !== undefined && r.h !== 0)
    const both = hDec.filter((r) => r.j.verdict !== 0)
    const agree = both.filter((r) => sign(r.h) === r.j.verdict)
    const ties = rs.filter((r) => r.h === 0)
    return { hDec, both, agree, ties, tiesDecided: ties.filter((r) => r.j.verdict !== 0) }
  }
  // 候选级:人工 / judge 在这个候选的几对上的多数方向(+1 = 候选更好)
  const toCand = (r, x) => x * (r.candSide === "right" ? 1 : -1)
  const candStats = (rs) => {
    const out = []
    for (const c of [...new Set(rs.map((r) => r.candidate))].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))) {
      const cr = rs.filter((r) => r.candidate === c)
      const hs = cr.filter((r) => r.h !== undefined).map((r) => toCand(r, sign(r.h)))
      const js = cr.filter((r) => r.j.n).map((r) => toCand(r, r.j.verdict))
      const jv = cr.filter((r) => r.j.n).map((r) => toCand(r, r.j.v))
      out.push({ c, accepted: cr[0].accepted, hs, js, hMaj: sign(hs.reduce((a, b) => a + b, 0)), jMaj: sign(js.reduce((a, b) => a + b, 0)), jMean: avg(jv) })
    }
    return out
  }

  for (const split of ["dev", "test"]) {
    const cand = rows.filter((r) => r.kind === "cand" && r.split === split)
    const aa = rows.filter((r) => r.kind === "aa" && r.split === split)
    const s = pairStats(cand), a = pairStats(aa), cs = candStats(cand)
    const csDec = cs.filter((x) => x.hMaj !== 0)
    const csRight = csDec.filter((x) => x.jMaj === x.hMaj)
    M[split] = { agree: [s.agree.length, s.both.length], cover: [s.both.length, s.hDec.length], ties: [s.tiesDecided.length, s.ties.length], cand: [csRight.length, csDec.length], aa: [a.agree.length, a.both.length], aaCover: [a.both.length, a.hDec.length] }
    say()
    say(`## ${split}(候选 ${cand.length} 对 + A/A ${aa.length} 对)`)
    say(`- 一致率:${pct(s.agree.length, s.both.length)};覆盖率:${pct(s.both.length, s.hDec.length)}`)
    say(`- 人工判「差不多」的 ${s.ties.length} 对里 judge 判出胜负:${pct(s.tiesDecided.length, s.ties.length)}`)
    say(`- A/A 对:一致率 ${pct(a.agree.length, a.both.length)},覆盖率 ${pct(a.both.length, a.hDec.length)}`)
    say(`- 候选级(人工多数方向明确的候选里,judge 多数方向相同):${pct(csRight.length, csDec.length)}`)
    say()
    say(`| 候选 | loop | 人工 候选好/平/基线好 | judge 候选好/平/基线好 | judge 均值 | 候选级 |`)
    say(`|---|---|---|---|---|---|`)
    for (const x of cs) {
      const cnt = (xs) => `${xs.filter((v) => v > 0).length} / ${xs.filter((v) => v === 0).length} / ${xs.filter((v) => v < 0).length}`
      const ok = x.hMaj === 0 ? "—" : x.jMaj === x.hMaj ? "✓" : "✗"
      say(`| ${x.c} | ${x.accepted ? "采用" : "拒绝"} | ${cnt(x.hs)} | ${cnt(x.js)} | ${x.jMean === null ? "—" : x.jMean.toFixed(2)} | ${ok} |`)
    }
  }

  // judge 自身
  const all = rows.filter((r) => r.j.n)
  const rnds = all.reduce((a, r) => a + r.j.n, 0), flips = all.reduce((a, r) => a + r.j.flips, 0)
  const calls = all.flatMap((r) => r.j.calls).filter((c) => c.better === "A" || c.better === "B")
  const pickB = calls.filter((c) => c.better === "B").length
  let same = 0, tot = 0
  for (const r of all) if (r.j.verdict && r.j.n > 1) for (const v of r.j.per) if (Math.abs(v) >= 0.5) { tot++; if (sign(v) === r.j.verdict) same++ }
  M.flip = [flips, rnds]; M.pickB = [pickB, calls.length]
  say()
  say(`## judge 自身`)
  say(`- 两种顺序方向相反的轮:${pct(flips, rnds)}`)
  say(`- 判出胜负的判定里选第二个位置(B):${pct(pickB, calls.length)}`)
  if (tot) say(`- 复测一致(多轮时,判出的轮和这对结论一致):${pct(same, tot)}`)

  // 人工自洽
  const re = rows.filter((r) => r.h !== undefined && r.h2 !== undefined)
  if (re.length) {
    say()
    say(`## 人工自洽(重标 ${re.length} 对)`)
    say(`- 方向一致(把「差不多」也当一个方向):${pct(re.filter((r) => sign(r.h) === sign(r.h2)).length, re.length)}`)
    say(`- 两次都判出时方向一致:${pct(re.filter((r) => r.h && r.h2 && sign(r.h) === sign(r.h2)).length, re.filter((r) => r.h && r.h2).length)}`)
  }

  // 校准
  const cand = rows.filter((r) => r.kind === "cand" && r.h !== undefined && r.j.n)
  say()
  say(`## 校准(候选对,judge 值 v,+ = 右边更好)`)
  say(`| v 区间 | 对数 | 人工右边更好 | 人工左边更好 | 差不多 |`)
  say(`|---|---|---|---|---|`)
  for (const [lo, hi] of [[-2, -0.5], [-0.5, 0.5], [0.5, 2.01]]) {
    const b = cand.filter((r) => r.j.v >= lo && r.j.v < hi)
    say(`| ${lo} ~ ${Math.min(hi, 2)} | ${b.length} | ${b.filter((r) => r.h > 0).length} | ${b.filter((r) => r.h < 0).length} | ${b.filter((r) => r.h === 0).length} |`)
  }

  const dir = path.join(ROOT, "runs", run)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, "report.md"), lines.join("\n") + "\n")
  return { run, lines, M, n: all.length }
}

const results = RUNS.map(evalRun)
if (results.length === 1) {
  console.log(results[0].lines.join("\n"))
  console.log(`\n写出 runs/${results[0].run}/report.md`)
} else {
  const f = ([a, b]) => pct(a, b)
  const out = [
    `# judge 对比(${RUNS.join("、")})`,
    "",
    `每对 1 轮 × 两种顺序;一对的值 = 两种顺序的平均,绝对值 ≥ 0.5 算判出。详见各 run 的 report.md。`,
    "",
    `| judge | 已判对数 | dev 一致率 | dev 覆盖率 | dev 候选级 | test 一致率 | test 覆盖率 | test 候选级 | A/A 一致率(dev+test) | 「差不多」被判出(dev+test) | 顺序相反的轮 | 选 B |`,
    `|---|---|---|---|---|---|---|---|---|---|---|---|`,
    ...results.map(({ run, M, n }) => {
      const add = (k) => [M.dev[k][0] + M.test[k][0], M.dev[k][1] + M.test[k][1]]
      return `| ${run} | ${n} | ${f(M.dev.agree)} | ${f(M.dev.cover)} | ${f(M.dev.cand)} | ${f(M.test.agree)} | ${f(M.test.cover)} | ${f(M.test.cand)} | ${f(add("aa"))} | ${f(add("ties"))} | ${f(M.flip)} | ${f(M.pickB)} |`
    }),
  ]
  console.log(out.join("\n"))
  if (OUT) { fs.writeFileSync(path.resolve(ROOT, OUT), out.join("\n") + "\n"); console.log(`\n写出 ${OUT}`) }
}
