// Pairwise judge between two generation runs, report by report, with the final
// rubric (rubric31). Each comparison is judged in both orders; a decision needs
// both orders to pick the same page, otherwise it is 拿不定.
//
//   node scripts/compare.mjs --a <run> --b <run> --cases ops,sales [--rounds 3]
//
// Writes traces/_compare/<a>__<b>/<case>__r<n>__<AB|BA>.json and prints / returns a summary.
import fs from "node:fs"
import path from "node:path"
import { systemRubric31, call, img } from "../../ui-judge/scripts/pairwise-judge.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const pageImages = (ws) => [img(path.join(ws, "thumb.png")), ...JSON.parse(fs.readFileSync(path.join(ws, "tiles.json"), "utf8")).map((t) => img(path.join(ws, t.file)))]

export async function compare(a, b, cases, rounds = 3) {
  const KEY = process.env.DEEPSEEK_API_KEY
  const dir = path.join(ROOT, "traces", "_compare", `${a}__${b}`)
  fs.mkdirSync(dir, { recursive: true })
  const sys = systemRubric31()
  const jobs = []
  for (const c of cases)
    for (let r = 1; r <= rounds; r++)
      for (const order of ["AB", "BA"]) {
        const file = path.join(dir, `${c}__r${r}__${order}.json`)
        jobs.push({ file, c, order })
      }
  async function worker() {
    while (jobs.length) {
      const { file, c, order } = jobs.shift()
      if (fs.existsSync(file)) continue
      const [x, y] = order === "AB" ? [a, b] : [b, a]
      const px = pageImages(path.join(ROOT, "traces", x, c)), py = pageImages(path.join(ROOT, "traces", y, c))
      try {
        const r = await call(sys, [
          { type: "text", text: `A 版:第 1 张为整页缩略图,后 ${px.length - 1} 张为整页切块。` }, ...px,
          { type: "text", text: `B 版:第 1 张为整页缩略图,后 ${py.length - 1} 张为整页切块。` }, ...py,
        ], { key: KEY })
        fs.writeFileSync(file, JSON.stringify({ A: x, B: y, ...r }, null, 1))
      } catch (e) {
        console.error(`FAIL ${path.basename(file)}: ${e.message}`)
      }
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker))
  return summarize(a, b, cases, rounds)
}

// Which run a judgement picked ("A"/"B" mapped back to run names), or null.
const picked = (j) => (j?.json?.better === "A" ? j.A : j?.json?.better === "B" ? j.B : null)

export function summarize(a, b, cases, rounds = 3) {
  const dir = path.join(ROOT, "traces", "_compare", `${a}__${b}`)
  const read = (f) => (fs.existsSync(path.join(dir, f)) ? JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) : null)
  const perCase = {}
  let wa = 0, wb = 0, split = 0
  for (const c of cases) {
    const rs = []
    for (let r = 1; r <= rounds; r++) {
      const ab = read(`${c}__r${r}__AB.json`), ba = read(`${c}__r${r}__BA.json`)
      if (!ab || !ba) continue
      const p1 = picked(ab), p2 = picked(ba)
      const win = p1 && p1 === p2 ? p1 : null
      rs.push(win === b ? "b" : win === a ? "a" : "分")
      if (win === b) wb++; else if (win === a) wa++; else split++
    }
    const nb = rs.filter((x) => x === "b").length, na = rs.filter((x) => x === "a").length
    perCase[c] = { rounds: rs, verdict: nb > na ? "b" : na > nb ? "a" : "平" }
  }
  return { a, b, perCase, wins: { a: wa, b: wb, split } }
}

// The judge's observations, for the maintainer: per case and round, both orders.
export function observations(a, b, cases, rounds = 1) {
  const dir = path.join(ROOT, "traces", "_compare", `${a}__${b}`)
  const out = []
  for (const c of cases)
    for (let r = 1; r <= rounds; r++)
      for (const order of ["AB", "BA"]) {
        const f = path.join(dir, `${c}__r${r}__${order}.json`)
        if (!fs.existsSync(f)) continue
        const j = JSON.parse(fs.readFileSync(f, "utf8"))
        out.push({ case: c, order, A: j.A, B: j.B, judgement: j.json })
      }
  return out
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (k, d) => {
    const i = process.argv.indexOf(`--${k}`)
    return i > 0 ? process.argv[i + 1] : d
  }
  const s = await compare(arg("a"), arg("b"), arg("cases").split(","), Number(arg("rounds", "3")))
  console.log(JSON.stringify(s, null, 1))
}
