// Progress of the eval-set judge runs, as two JSON tables for the progress
// dashboard: one row per run, one row per run and group.
//
//   node scripts/progress.mjs <out dir>   → <out dir>/runs.json, groups.json, and both in progress.json
//
// A run is a results folder (out/aesthetic/evalset/<cond>[@model]). Done =
// result files for the group's current versions; total = pairs × 2 orders ×
// 3 repeats. Agreement comes from evalset-judge.mjs --score.
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

const ROOT = path.resolve(import.meta.dirname, "..")
const DIR = path.join(ROOT, "out", "aesthetic", "evalset")
const OUT = process.argv[2] ?? "."
const REPEATS = 3
const RUNS = [
  { id: "v41-principles", label: "新模型 · 6 条原则", cond: "principles", model: "deepseek-v4.1-flash" },
  { id: "v41-dims4", label: "新模型 · 第 4 版 7 维", cond: "dims4-sep", model: "deepseek-v4.1-flash" },
  { id: "old-principles", label: "旧模型 · 6 条原则", cond: "principles" },
  { id: "old-dims4", label: "旧模型 · 第 4 版 7 维", cond: "dims4-sep" },
]
const key = JSON.parse(fs.readFileSync(path.join(ROOT, "evalset", "key.json"), "utf8")).groups
const procs = (() => { try { return execSync("ps -eo args", { encoding: "utf8" }) } catch { return "" } })()
const now = Date.now()

// Agreement per group title from the score table: | 组 | agree | against | split | … |
function scores(run) {
  const env = { ...process.env, ...(run.model ? { JUDGE_MODEL: run.model } : {}) }
  if (!run.model) delete env.JUDGE_MODEL
  let out = ""
  try { out = execSync(`node scripts/evalset-judge.mjs --score --cond ${run.cond}`, { cwd: ROOT, env, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }) } catch { return {} }
  const res = {}
  for (const line of out.split("\n")) {
    const m = line.match(/^\| ([^|]+) \| \d+%\((\d+)\/(\d+)\) \| \d+%\((\d+)\/\d+\) \| \d+%\((\d+)\/\d+\) \|/)
    if (m) res[m[1].trim()] = { agree: +m[2], against: +m[4], split: +m[5] }
  }
  return res
}

const runs = [], groups = []
for (const run of RUNS) {
  const dir = path.join(DIR, run.cond + (run.model ? `@${run.model}` : ""))
  if (!fs.existsSync(dir)) continue
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"))
  const sc = scores(run)
  let done = 0, total = 0, recent = 0
  for (const g of key) {
    const vs = new Set(Object.values(g.labels))
    const n = vs.size, t = n * (n - 1) * REPEATS
    const mine = files.filter((f) => {
      const [gid, a, b] = f.split("__")
      return gid === g.id && vs.has(a) && vs.has(b)
    })
    for (const f of mine) if (now - fs.statSync(path.join(dir, f)).mtimeMs < 10 * 60_000) recent++
    done += mine.length
    total += t
    const s = sc[g.title] ?? { agree: 0, against: 0, split: 0 }
    const decided = s.agree + s.against
    groups.push({
      key: `${run.id}/${g.id}`, run: run.label, group: g.title, done: mine.length, total: t,
      agree: s.agree, against: s.against, split: s.split,
      agreement: decided ? +(s.agree / decided).toFixed(3) : null,
    })
  }
  const running = procs.split("\n").some((p) => p.includes("evalset-judge.mjs") && p.includes(`--cond ${run.cond}`) && !p.includes("--score")) &&
    // the new and old model runs share a cond; a running process belongs to the one whose folder grew lately
    recent > 0
  const rate = recent / 10
  runs.push({
    id: run.id, run: run.label, done, total,
    status: done >= total ? "完成" : running ? "运行中" : "已停止",
    perMinute: +rate.toFixed(1),
    etaMinutes: running && rate > 0 ? Math.round((total - done) / rate) : null,
    updatedAt: new Date(now).toISOString(),
  })
}
fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, "runs.json"), JSON.stringify(runs, null, 1))
fs.writeFileSync(path.join(OUT, "groups.json"), JSON.stringify(groups, null, 1))
fs.writeFileSync(path.join(OUT, "progress.json"), JSON.stringify({ updatedAt: new Date(now).toISOString(), runs, groups }))
console.log(runs.map((r) => `${r.run} ${r.done}/${r.total} ${r.status}`).join(" | "))
