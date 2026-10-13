// 训练的打分:一组页面两两比较(judge ia5,和第 1 阶段一样的做法),得到每版的分。
//
//   await scoreGroup({ pages: [{ v, ws }], dir: "runs/<run>/steps/s01/judge" })
//
// 每对按两种顺序各判一次,v = 两次的平均(-2..2,正数 = 编号靠后的那版更好)。每次判定存在 <dir>/<va>-<vb>-<AB|BA>.json,已有的跳过。
// 每版的分 = 它在各对里的得分之和(6 版时 -10..10);|v| ≥ 0.5 的对算判出了高下(和第 1 阶段一样)。
// 每版的评语:judge 在涉及这版的每次判定里的结论、理由和各条标准,A / B 换成「这版」「第 N 版」。
import fs from "node:fs"
import path from "node:path"
import { call } from "../../ui-judge/scripts/pairwise-judge.mjs"
import { JUDGES } from "../lib/judges.mjs"

const JUDGE = JUDGES.ia5
const MODEL = process.env.JUDGE_MODEL ?? "deepseek-v4.1-flash"
const EFFORT = process.env.JUDGE_EFFORT ?? "high"
const num = (v) => v.replace(/^v/, "")

// 判一次:A、B 两版的工作目录,结果存到 file(已有就直接读)。返回 { score(B 比 A 好多少,-2..2), json }
export async function judgeOnce(A, B, file, label) {
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"))
  const res = await call(JUDGE.system(), JUDGE.content(A.ws, B.ws), { key: process.env.DEEPSEEK_API_KEY, model: MODEL, effort: EFFORT, label })
  const r = { A: A.v, B: B.v, score: JUDGE.score(res.json), json: res.json, usage: res.usage, latencyMs: res.latencyMs }
  fs.writeFileSync(file, JSON.stringify(r, null, 1))
  return r
}

export async function scoreGroup({ pages, dir, workers = 30, log = console.log }) {
  fs.mkdirSync(dir, { recursive: true })
  const pairs = []
  for (let i = 0; i < pages.length; i++) for (let j = i + 1; j < pages.length; j++) pairs.push([pages[i], pages[j]])
  const jobs = pairs.flatMap(([p, q]) => [
    { A: p, B: q, order: "AB", file: path.join(dir, `${p.v}-${q.v}-AB.json`) },
    { A: q, B: p, order: "BA", file: path.join(dir, `${p.v}-${q.v}-BA.json`) },
  ])
  const todo = jobs.filter((j) => !fs.existsSync(j.file))
  log(`  打分:${pages.length} 版,${pairs.length} 对 × 两种顺序 = ${jobs.length} 次判定,要跑 ${todo.length} 次`)
  let n = 0
  const total = todo.length
  await Promise.all(Array.from({ length: Math.min(workers, todo.length) }, async () => {
    while (todo.length) {
      const j = todo.shift()
      const label = `第 ${num(j.A.v)} 版(A) vs 第 ${num(j.B.v)} 版(B)`
      const { json } = await judgeOnce(j.A, j.B, j.file, label)
      log(`    ${label}:${json.better === "一样" ? "一样" : `${json.better} ${json.degree || "稍好"}`}(${++n}/${total})`)
    }
  }))

  // 汇总:每对的 v、每版的分和评语
  const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"))
  const score = Object.fromEntries(pages.map((p) => [p.v, 0]))
  const notes = Object.fromEntries(pages.map((p) => [p.v, []]))
  const pairOut = []
  for (const [p, q] of pairs) {
    const ab = read(path.join(dir, `${p.v}-${q.v}-AB.json`)), ba = read(path.join(dir, `${p.v}-${q.v}-BA.json`))
    const v = (ab.score - ba.score) / 2 // 正数 = q 更好
    score[p.v] -= v
    score[q.v] += v
    pairOut.push({ a: p.v, b: q.v, v, ab: ab.score, ba: -ba.score })
    for (const r of [ab, ba]) for (const [self, other] of [[r.A, r.B], [r.B, r.A]]) {
      const side = (x) => (x === "A" ? r.A : x === "B" ? r.B : null)
      const who = (x) => (side(x) === self ? "这版" : side(x) === other ? `第 ${num(other)} 版` : x)
      notes[self].push({
        other: other, asA: r.A === self,
        verdict: r.json.better === "一样" ? "一样" : `${who(r.json.better)}${r.json.degree === "明显" ? "明显更好" : "稍好"}`,
        reason: r.json.reason,
        criteria: (r.json.criteria ?? []).filter((c) => c.better && c.better !== "无关").map((c) => ({ no: c.no, better: c.better === "一样" ? "一样" : who(c.better), why: c.why })),
      })
    }
  }
  const decided = pairOut.filter((x) => Math.abs(x.v) >= 0.5).length
  const out = { pages: pages.map((p) => p.v), pairs: pairOut, score, decided, notes }
  log(`  打分结果:${pages.map((p) => `第 ${num(p.v)} 版 ${score[p.v] > 0 ? "+" : ""}${+score[p.v].toFixed(1)}`).join(",")};${pairOut.length} 对里判出高下 ${decided} 对`)
  return out
}
