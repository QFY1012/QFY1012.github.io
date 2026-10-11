// Single-page scoring with the rubric31 criteria, to compare with pairwise judging.
//
//   DEEPSEEK_API_KEY=... node scripts/single-judge.mjs [--repeats 3] [--groups ab,ops]
//   node scripts/single-judge.mjs --pairs     # turn the scores into pair files for compare.py
//
// The judge sees one page (thumbnail + tiles, as in the pairwise runs) and scores each
// criterion 1–5 and the page 1–10. --pairs writes, for every pair and repeat, the file
// compare.py reads: the page with the higher overall score is "better", equal scores
// are "平"; each criterion likewise. Both orders get the same answer, since a single
// page's score does not depend on what it is shown next to.
// Results: out/aesthetic/single/single31@<model>-<effort>/<group>__<version>__r<n>.json
// Pair files: out/aesthetic/evalset/single31@<model>-<effort>/
import fs from "node:fs"
import path from "node:path"
import { RUBRIC_31, img, call, JUDGE_MODEL, JUDGE_EFFORT } from "./pairwise-judge.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const TAG = (process.env.JUDGE_MODEL ? `@${JUDGE_MODEL}` : "") + (JUDGE_EFFORT !== "low" ? `-${JUDGE_EFFORT}` : "")
const OUT = path.join(ROOT, "out", "aesthetic", "single", "single31" + TAG)
const PAIR_OUT = path.join(ROOT, "out", "aesthetic", "evalset", "single31" + TAG)
const key = JSON.parse(fs.readFileSync(path.join(ROOT, "evalset", "key.json"), "utf8")).groups
const GROUPS = arg("groups", key.map((g) => g.id).join(",")).split(",")
const REPEATS = Number(arg("repeats", "3"))
const dirOf = (g, v) => path.join(ROOT, g.src === "out/render" ? "out/evalset" : g.src, v)

// Criterion 1 of rubric31 is written as a comparison ("比哪版更合适"); here it is
// the same standard stated for one page. The other six are rules a page meets or not.
const CRITERIA = RUBRIC_31.map((p, i) => i === 0 ? {
  ...p,
  rule: "whitespace 是否合适,太少和太多都是缺点。太少指:每屏(每张切块)超过三种内容模块,一段正文、一组 KPI 数字、一张图表、一张表格、一个列表各算一种;或模块之间的 section spacing 不到两个正文 line-height。太多指:某一屏只有一两行字或一张小图,大半是空白。太少比太多更严重;不太少也不太多时,模块之间、页面四周留白越从容越好",
} : p)

export const systemSingle = () => `你是资深 UI 视觉设计评审。下面是一份报告的一版页面设计。只评视觉设计质量,不评内容。

评审标准:
${CRITERIA.map((p, i) => `${i + 1}. ${p.name}:${p.rule}。反例:${p.bad}。`).join("\n")}

逐条评分:每条先写下观察,再打 1–5 分(5 = 完全做到,挑不出问题;4 = 基本做到,有一两处小问题;3 = 有明显问题;2 = 问题多;1 = 完全没做到)。七条评完后,综合给整页打 1–10 分(10 = 可以直接交付的优秀设计;7 = 合格但有明显可改之处;5 = 问题较多;3 及以下 = 不可用)。
只输出 JSON:{${CRITERIA.map((p, i) => `"${i + 1}":{"obs":"${p.see}","score":1-5}`).join(",")},"score":1-10,"reason":"一两句话"}`

function pageImages(dir) {
  const tiles = JSON.parse(fs.readFileSync(path.join(dir, "clean-tiles.json"), "utf8"))
  return [img(path.join(dir, "thumb.png")), ...tiles.map((t) => img(path.join(dir, t.file)))]
}

async function judge() {
  const KEY = process.env.DEEPSEEK_API_KEY
  if (!KEY) throw new Error("set DEEPSEEK_API_KEY")
  fs.mkdirSync(OUT, { recursive: true })
  const sys = systemSingle()
  const jobs = []
  for (let r = 1; r <= REPEATS; r++)
    for (const g of key.filter((g) => GROUPS.includes(g.id)))
      for (const v of Object.values(g.labels).sort())
        jobs.push({ file: `${g.id}__${v}__r${r}.json`, dir: dirOf(g, v) })
  let failed = 0, done = 0
  const total = jobs.length
  async function worker() {
    while (jobs.length) {
      const job = jobs.shift()
      const file = path.join(OUT, job.file)
      if (fs.existsSync(file)) { done++; continue }
      try {
        const pa = pageImages(job.dir)
        const r = await call(sys, [{ type: "text", text: `第 1 张为整页缩略图,后 ${pa.length - 1} 张为整页切块。` }, ...pa], { key: KEY })
        if (typeof r.json.score !== "number") throw new Error("no overall score")
        fs.writeFileSync(file, JSON.stringify({ cond: "single31", effort: JUDGE_EFFORT, ...r }, null, 1))
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

// Write pair files in the pairwise format so compare.py can score single-page runs.
function pairs() {
  fs.mkdirSync(PAIR_OUT, { recursive: true })
  const read = (f) => JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8")).json
  let n = 0
  for (const f of fs.readdirSync(OUT)) {
    const m = f.match(/^(.+?)__(.+?)__r(\d+)\.json$/)
    if (!m) continue
    const [, g, x, r] = m
    for (const f2 of fs.readdirSync(OUT)) {
      const m2 = f2.match(/^(.+?)__(.+?)__r(\d+)\.json$/)
      if (!m2 || m2[1] !== g || m2[3] !== r || m2[2] === x) continue
      const a = read(f), b = read(f2)
      const cmp = (p, q) => (p > q ? "A" : q > p ? "B" : "平")
      const json = { better: cmp(a.score, b.score), scores: [a.score, b.score] }
      for (let k = 1; k <= 7; k++) json[k] = { A: a[k]?.obs, B: b[k]?.obs, better: cmp(a[k]?.score, b[k]?.score) }
      fs.writeFileSync(path.join(PAIR_OUT, `${g}__${x}__${m2[2]}__r${r}.json`), JSON.stringify({ cond: "single31", json }, null, 1))
      n++
    }
  }
  console.log(`${n} pair files → ${path.relative(ROOT, PAIR_OUT)}`)
}

if (process.argv.includes("--pairs")) pairs()
else if (process.argv.includes("--print")) console.log(systemSingle())
else judge()
