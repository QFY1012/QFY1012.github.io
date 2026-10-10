// Run the stage-3 pairwise judge on the eval set and compare it with the
// person's ranking.
//
//   DEEPSEEK_API_KEY=... node scripts/evalset-judge.mjs [--repeats 3] [--groups ops,ab,review]
//   node scripts/evalset-judge.mjs --score
//
// evalset/key.json    groups: blind label → version, and where its images are
// evalset/human.json  the person's rank per label (equal numbers = a tie)
// Pages need thumb.png + clean tiles (scripts/cut-pages.py). Every pair inside a
// group is judged in both orders with the principles; a decision counts only
// when both orders pick the same page.
// Results: out/aesthetic/evalset/<group>__<a>__<b>__r<n>.json (a is shown as A).
import fs from "node:fs"
import path from "node:path"
import { system, img, call } from "./pairwise-judge.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const OUT = path.join(ROOT, "out", "aesthetic", "evalset")
const key = JSON.parse(fs.readFileSync(path.join(ROOT, "evalset", "key.json"), "utf8")).groups
const GROUPS = arg("groups", key.map((g) => g.id).join(",")).split(",")
const REPEATS = Number(arg("repeats", "3"))
// The ops and ab versions are cut in out/evalset; the review versions in place.
const dirOf = (g, v) => path.join(ROOT, g.src === "out/render" ? "out/evalset" : g.src, v)

function pageImages(dir) {
  const tiles = JSON.parse(fs.readFileSync(path.join(dir, "clean-tiles.json"), "utf8"))
  return [img(path.join(dir, "thumb.png")), ...tiles.map((t) => img(path.join(dir, t.file)))]
}
const pairsOf = (g) => {
  const vs = Object.values(g.labels).sort()
  return vs.flatMap((a, i) => vs.slice(i + 1).map((b) => [a, b]))
}

if (process.argv.includes("--score")) score()
else await judge()

async function judge() {
  const KEY = process.env.DEEPSEEK_API_KEY
  if (!KEY) throw new Error("set DEEPSEEK_API_KEY")
  fs.mkdirSync(OUT, { recursive: true })
  const jobs = []
  for (let r = 1; r <= REPEATS; r++)
    for (const g of key.filter((g) => GROUPS.includes(g.id)))
      for (const [x, y] of pairsOf(g))
        for (const [a, b] of [[x, y], [y, x]])
          jobs.push({
            file: `${g.id}__${a}__${b}__r${r}.json`,
            run: () => {
              const pa = pageImages(dirOf(g, a)), pb = pageImages(dirOf(g, b))
              return call(system(true), [
                { type: "text", text: `A 版:第 1 张为整页缩略图,后 ${pa.length - 1} 张为整页切块。` },
                ...pa,
                { type: "text", text: `B 版:第 1 张为整页缩略图,后 ${pb.length - 1} 张为整页切块。` },
                ...pb,
              ], { key: KEY })
            },
          })
  let failed = 0, done = 0
  const total = jobs.length
  async function worker() {
    while (jobs.length) {
      const job = jobs.shift()
      const file = path.join(OUT, job.file)
      if (fs.existsSync(file)) { done++; continue }
      try {
        fs.writeFileSync(file, JSON.stringify({ effort: "low", ...(await job.run()) }, null, 1))
      } catch (e) {
        failed++
        console.error(`FAIL ${job.file}: ${e.message}`)
      }
      if (++done % 25 === 0) console.log(`${done}/${total}`)
    }
  }
  await Promise.all(Array.from({ length: 10 }, worker))
  console.log(`done, ${failed} failed → ${path.relative(ROOT, OUT)}`)
}

function score() {
  const human = JSON.parse(fs.readFileSync(path.join(ROOT, "evalset", "human.json"), "utf8"))
  const pick = (f) => {
    try { return JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8")).json.better } catch { return null }
  }
  const repeats = [...new Set(fs.readdirSync(OUT).map((f) => f.match(/__r(\d+)\.json$/)?.[1]).filter(Boolean))].sort()
  const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%(${a}/${b})` : "–")
  const rows = [], detail = [], wins = {}
  for (const g of key) {
    const label = Object.fromEntries(Object.entries(g.labels).map(([l, v]) => [v, l]))
    const r = (v) => human[g.id]?.[label[v]]
    let agree = 0, against = 0, split = 0, onTies = 0, tieSplit = 0
    for (const [x, y] of pairsOf(g)) {
      const hum = r(x) === r(y) ? null : r(x) < r(y) ? x : y
      const cell = []
      for (const n of repeats) {
        const p1 = pick(`${g.id}__${x}__${y}__r${n}.json`), p2 = pick(`${g.id}__${y}__${x}__r${n}.json`)
        if (!p1 || !p2) continue
        const w1 = p1 === "A" ? x : y, w2 = p2 === "A" ? y : x
        const verdict = w1 === w2 ? w1 : null
        cell.push(verdict ? label[verdict] : "分")
        if (verdict) wins[`${g.id}/${verdict}`] = (wins[`${g.id}/${verdict}`] ?? 0) + 1
        if (!hum) { onTies++; if (!verdict) tieSplit++; continue }
        if (!verdict) split++
        else if (verdict === hum) agree++
        else against++
      }
      detail.push([g.id, `${label[x]}(${x}) 对 ${label[y]}(${y})`, hum ? label[hum] : "平", cell.join(" ")])
    }
    const n = agree + against + split
    rows.push([g.title, pct(agree, n), pct(against, n), pct(split, n), pct(agree, agree + against), pct(tieSplit, onTies)])
  }
  console.log("## 和你的排序是否一致(一次判定 = 一对版面按两种顺序各判一次)\n")
  console.log("| 组 | 两次都选你更喜欢的 | 两次都选另一版 | 两次不一致 | 选得出时的一致率 | 你判平的对里两次不一致 |")
  console.log("|---|---|---|---|---|---|")
  for (const row of rows) console.log(`| ${row.join(" | ")} |`)
  console.log("\n## judge 的排名(按两种顺序都胜出的次数)与你的排名\n")
  for (const g of key) {
    const label = Object.fromEntries(Object.entries(g.labels).map(([l, v]) => [v, l]))
    const vs = Object.values(g.labels).sort((a, b) => (wins[`${g.id}/${b}`] ?? 0) - (wins[`${g.id}/${a}`] ?? 0))
    console.log(`- ${g.title}:judge ${vs.map((v) => `${label[v]}(${wins[`${g.id}/${v}`] ?? 0})`).join(" ")};你 ${Object.entries(human[g.id]).sort((a, b) => a[1] - b[1]).map(([l, n]) => `${l}${n}`).join(" ")}`)
  }
  console.log("\n## 逐对结果(每格为各次重复的判定:选中的版面,或「分」= 两种顺序选得不一样)\n")
  console.log("| 组 | 对比 | 你选 | judge |")
  console.log("|---|---|---|---|")
  for (const d of detail) console.log(`| ${d.join(" | ")} |`)
}
