// Measure density on one page at a time, with no second page to compare
// against: how many groups of information each tile holds and how much of it is
// blank. Pairwise, the judge read the page shown second as half a tenth emptier
// and its counts sat on their own noise; measured alone and repeated, the
// numbers carry no position and can be averaged.
//
//   DEEPSEEK_API_KEY=... node scripts/measure-density.mjs [--repeats 3] [--groups ops,ab]
//   node scripts/measure-density.mjs --summary
//
// Results: out/aesthetic/density@<model>-<effort>/<page>__r<n>.json
import fs from "node:fs"
import path from "node:path"
import { img, call, JUDGE_MODEL, JUDGE_EFFORT } from "./pairwise-judge.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const key = JSON.parse(fs.readFileSync(path.join(ROOT, "evalset", "key.json"), "utf8")).groups
const human = JSON.parse(fs.readFileSync(path.join(ROOT, "evalset", "human.json"), "utf8"))
const GROUPS = arg("groups", key.filter((g) => !g.heldout).map((g) => g.id).join(",")).split(",")
const REPEATS = Number(arg("repeats", "3"))
const OUT = path.join(ROOT, "out", "aesthetic", `density@${JUDGE_MODEL}-${JUDGE_EFFORT}`)
const dirOf = (g, v) => path.join(ROOT, g.src === "out/render" ? "out/evalset" : g.src, v)

export const SYSTEM_DENSITY = `你是 UI 版式测量员。下面是一份报告页面从上到下的整页切块,每张约一屏,相邻两张有少量重叠。只测量,不评价好坏。

对每一张切块,按顺序各量两个数:
1. 信息组数:一个信息组是读的时候当作一件事的一块,如一个小标题连同它下面的图、表或文字、一排并列的指标、一组并列的发现。一组跨两张切块时,按它在这一张里露出的部分算。
2. 空白成数:这张切块里空白约占几成(0–10),页面四周的边距也算空白。

只输出 JSON:{"tiles":[{"groups":数字,"blank":数字,"what":"这张里的信息组,逐个简述"}]}`

const pagesOf = () => key.filter((g) => GROUPS.includes(g.id)).flatMap((g) => Object.entries(g.labels).map(([l, v]) => ({ g, l, v })))

async function measure() {
  const KEY = process.env.DEEPSEEK_API_KEY
  if (!KEY) throw new Error("set DEEPSEEK_API_KEY")
  fs.mkdirSync(OUT, { recursive: true })
  const jobs = []
  for (let r = 1; r <= REPEATS; r++)
    for (const { g, v } of pagesOf())
      jobs.push({ file: `${v}__r${r}.json`, dir: dirOf(g, v) })
  let done = 0, failed = 0
  async function worker() {
    while (jobs.length) {
      const job = jobs.shift(), file = path.join(OUT, job.file)
      if (fs.existsSync(file)) { done++; continue }
      try {
        const tiles = JSON.parse(fs.readFileSync(path.join(job.dir, "clean-tiles.json"), "utf8"))
        const content = tiles.map((t) => img(path.join(job.dir, t.file)))
        fs.writeFileSync(file, JSON.stringify({ tiles: tiles.length, ...(await call(SYSTEM_DENSITY, content, { key: KEY })) }, null, 1))
      } catch (e) {
        failed++
        console.error("FAIL", job.file, e.message.slice(0, 200))
      }
      if (++done % 10 === 0) console.log(`${done}/${done + jobs.length}`)
    }
  }
  await Promise.all(Array.from({ length: 10 }, worker))
  console.log(`done, ${failed} failed → ${OUT}`)
}

// Per page: fullest tile's group count and emptiest tile's blank share (last
// tile aside), mean and spread over repeats, next to the person's rank.
function summary() {
  for (const { g, l, v } of pagesOf()) {
    const rs = fs.existsSync(OUT) ? fs.readdirSync(OUT).filter((f) => f.startsWith(`${v}__r`)) : []
    const m = rs.map((f) => JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8"))).map((r) => {
      const t = r.json.tiles, body = t.length > 1 ? t.slice(0, -1) : t
      if (t.length !== r.tiles) return null
      return { full: Math.max(...t.map((x) => x.groups)), empty: Math.max(...body.map((x) => x.blank)) }
    }).filter(Boolean)
    const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length
    const sd = (xs) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)))
    if (!m.length) continue
    const f = m.map((x) => x.full), e = m.map((x) => x.empty)
    console.log(`${g.id.padEnd(13)}${l}#${String(human[g.id][l]).padEnd(3)}${v.padEnd(16)}最满一屏 ${mean(f).toFixed(1)}±${sd(f).toFixed(1)} 组 | 最空一屏 ${mean(e).toFixed(1)}±${sd(e).toFixed(1)} 成 | ${m.length} 次`)
  }
}

if (process.argv.includes("--summary")) summary()
else await measure()
