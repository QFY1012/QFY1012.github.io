// Validate the stage-3 pairwise judge on new reports it was not tuned on.
//
//   DEEPSEEK_API_KEY=... node scripts/aesthetic-validate.mjs [--repeats 3] [--effort low]
//
// Pages: out/validate/<report>-<n>/ (scripts/render-pages.mjs + cut-pages.py).
// Every pair of layouts of the same report, in both orders, under three conditions:
//   base        no principles, each page as thumbnail + tiles (as in the probe)
//   principles  the six style-independent principles added
//   psbs        principles, the two pages side by side in one image
// Results: out/aesthetic/validate/<cond>__<a>__<b>__r<n>.json (a is shown as A).
import fs from "node:fs"
import path from "node:path"
import { system, img, call as callModel } from "./pairwise-judge.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const REPEATS = Number(arg("repeats", "3"))
const EFFORT = arg("effort", "low")
const MODEL = arg("model", "deepseek-flash")
const CONDS = arg("conds", "base,principles,psbs").split(",")
const KEY = process.env.DEEPSEEK_API_KEY
if (!KEY) throw new Error("set DEEPSEEK_API_KEY")
const VDIR = path.join(ROOT, "out", "validate")
const OUT = path.join(ROOT, "out", "aesthetic", "validate")
fs.mkdirSync(OUT, { recursive: true })

function pageImages(v) {
  const d = path.join(VDIR, v)
  const tiles = JSON.parse(fs.readFileSync(path.join(d, "clean-tiles.json"), "utf8"))
  return [img(path.join(d, "thumb.png")), ...tiles.map((t) => img(path.join(d, t.file)))]
}

const call = (sys, content) => callModel(sys, content, { key: KEY, model: MODEL, effort: EFFORT })

const pages = fs.readdirSync(VDIR).filter((d) => !d.startsWith("_")).sort()
const reports = [...new Set(pages.map((p) => p.split("-")[0]))]
const jobs = []
for (let r = 1; r <= REPEATS; r++)
  for (const cond of CONDS)
    for (const rep of reports) {
      const ps = pages.filter((p) => p.startsWith(rep + "-"))
      for (const a of ps)
        for (const b of ps) {
          if (a === b) continue
          jobs.push({
            file: `${cond}__${a}__${b}__r${r}.json`,
            run: () => {
              if (cond === "psbs")
                return call(system(true), [
                  { type: "text", text: "下图是两版整页并排、同一比例:左边是 A 版,右边是 B 版。" },
                  img(path.join(VDIR, "_pairs", `${a}__${b}.png`)),
                ])
              const pa = pageImages(a), pb = pageImages(b)
              return call(system(cond === "principles"), [
                { type: "text", text: `A 版:第 1 张为整页缩略图,后 ${pa.length - 1} 张为整页切块。` },
                ...pa,
                { type: "text", text: `B 版:第 1 张为整页缩略图,后 ${pb.length - 1} 张为整页切块。` },
                ...pb,
              ])
            },
          })
        }
    }

let failed = 0, done = 0
const total = jobs.length
async function worker() {
  while (jobs.length) {
    const job = jobs.shift()
    const file = path.join(OUT, job.file)
    if (fs.existsSync(file)) { done++; continue }
    try {
      fs.writeFileSync(file, JSON.stringify({ effort: EFFORT, ...(await job.run()) }, null, 1))
    } catch (e) {
      failed++
      console.error(`FAIL ${job.file}: ${e.message}`)
    }
    if (++done % 20 === 0) console.log(`${done}/${total}`)
  }
}
await Promise.all(Array.from({ length: 10 }, worker))
console.log(`done, ${failed} failed → ${path.relative(ROOT, OUT)}`)
