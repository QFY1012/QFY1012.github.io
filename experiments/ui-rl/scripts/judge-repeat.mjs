// 第 0 阶段 0.4:用 ui-loop 现在的审美 judge(rubric31,两版强制二选一)把标注集的每对页面重复判几遍。
//
//   source judge.env && JUDGE_MODEL=deepseek-v4.1-flash JUDGE_EFFORT=high \
//     node experiments/ui-rl/scripts/judge-repeat.mjs [--run baseline-judge] [--rounds 5] [--workers 8] [--pairs p01,p02]
//
// 判法和 loop 里完全一样:每版给整页缩略图 + 全部 640px 切块(来自 ui-loop/traces 的工作区),
// 每轮按 A/B、B/A 两种顺序各判一次。先跑完第 1 轮的全部对,再跑第 2 轮……额度中途用完时,已跑完的轮次是完整的。
// 已有结果的跳过,可以断点续跑。
//
// 写出 experiments/ui-rl/runs/<run>/<pair>__r<n>__<AB|BA>.json:
//   { pair, round, order, A, B(运行名), better: "A"|"B", right: +1|-1(按 pairs.json 的左右,+1 = 右边更好), json, usage }
import fs from "node:fs"
import path from "node:path"
import { call, img } from "../../ui-judge/scripts/pairwise-judge.mjs"
import { systemAesthetic } from "../../ui-loop/scripts/compare.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const TRACES = path.join(ROOT, "..", "ui-loop", "traces")
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d)
const RUN = arg("run", "baseline-judge")
const ROUNDS = Number(arg("rounds", "5"))
const WORKERS = Number(arg("workers", "8"))
const KEY = process.env.DEEPSEEK_API_KEY
if (!KEY) throw new Error("set DEEPSEEK_API_KEY (source judge.env)")

const key = JSON.parse(fs.readFileSync(path.join(ROOT, "labels", "key.json"), "utf8"))
const only = arg("pairs") ? new Set(arg("pairs").split(",")) : null
const pairs = key.filter((p) => !only || only.has(p.id))
const OUT = path.join(ROOT, "runs", RUN)
fs.mkdirSync(OUT, { recursive: true })

// 和 ui-loop/scripts/compare.mjs 的 version() 相同:缩略图 + 全部切块
const version = (ws, label) => {
  const tiles = JSON.parse(fs.readFileSync(path.join(ws, "tiles.json"), "utf8"))
  return [{ type: "text", text: `${label} 版:第 1 张为整页缩略图,后 ${tiles.length} 张为整页切块。` },
    img(path.join(ws, "thumb.png")), ...tiles.map((t) => img(path.join(ws, t.file)))]
}
const sides = (p) => (p.candSide === "left" ? { left: p.cand, right: p.base } : { left: p.base, right: p.cand })

const jobs = []
for (let r = 1; r <= ROUNDS; r++)
  for (const p of pairs)
    for (const order of ["AB", "BA"]) jobs.push({ p, r, order, file: path.join(OUT, `${p.id}__r${r}__${order}.json`) })
const todo = jobs.filter((j) => !fs.existsSync(j.file))
const N = todo.length
console.log(`审美 judge(${process.env.JUDGE_MODEL ?? "默认模型"},effort ${process.env.JUDGE_EFFORT ?? "默认"}):${pairs.length} 对 × ${ROUNDS} 轮 × 两种顺序 = ${jobs.length} 次,要跑 ${todo.length} 次(已有的跳过)`)

let done = 0, failed = 0
const sys = systemAesthetic()
async function worker() {
  while (todo.length) {
    const { p, r, order, file } = todo.shift()
    const { left, right } = sides(p)
    const [A, B] = order === "AB" ? [left, right] : [right, left]
    const label = `${p.id} 第 ${r} 轮 ${order}`
    const t0 = Date.now()
    console.log(`  ${label} 开始`)
    try {
      const content = [...version(path.join(TRACES, A, p.case), "A"), ...version(path.join(TRACES, B, p.case), "B")]
      const res = await call(sys, content, { key: KEY, label })
      const better = res.json.better
      const pick = better === "A" ? A : better === "B" ? B : null
      const rightBetter = pick === right ? 1 : pick === left ? -1 : 0
      fs.writeFileSync(file, JSON.stringify({ pair: p.id, round: r, order, A, B, better, right: rightBetter, json: res.json, usage: res.usage, latencyMs: res.latencyMs }, null, 1))
      console.log(`  ${label}:选 ${better ?? "?"}(${rightBetter > 0 ? "右" : rightBetter < 0 ? "左" : "无"})${Math.round((Date.now() - t0) / 1000)} 秒,本次 ${++done}/${N}`)
    } catch (e) {
      failed++
      console.log(`  ✗ ${label} 失败:${String(e.message).slice(0, 160)}`)
      // 额度用完(402/403)时别的请求也会失败,停下来
      if (/\b(401|402|403)\b/.test(e.message)) { console.log("  额度或鉴权出错,停止。补充后重跑同一命令即可续跑。"); todo.length = 0 }
    }
  }
}
await Promise.all(Array.from({ length: WORKERS }, worker))
const have = jobs.filter((j) => fs.existsSync(j.file)).length
console.log(`结束:本次完成 ${done} 次,失败 ${failed} 次;共有 ${have}/${jobs.length} 次结果,在 ${path.relative(process.cwd(), OUT)}`)
