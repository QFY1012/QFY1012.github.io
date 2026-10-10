// Run the stage-3 pairwise judge on the eval set and compare it with the
// person's ranking.
//
//   DEEPSEEK_API_KEY=... node scripts/evalset-judge.mjs [--cond principles] [--repeats 3] [--groups ops,ab,review] [--with V8]
//   node scripts/evalset-judge.mjs --score [--cond principles]
//
// evalset/key.json    groups: blind label → version, and where its images are
// evalset/human.json  the person's rank per label (equal numbers = a tie)
// Pages need thumb.png + clean tiles (scripts/cut-pages.py). Every pair inside a
// group is judged in both orders with the principles; a decision counts only
// when both orders pick the same page.
// --cond picks the prompt variant (scripts/pairwise-judge.mjs); --with keeps only
// the pairs that include that version.
// Results: out/aesthetic/evalset/<cond>/<group>__<a>__<b>__r<n>.json (a is shown as A).
import fs from "node:fs"
import path from "node:path"
import { systemFor, systemForDim, DIMENSIONS, DIMENSIONS_V2, DIMENSIONS_V3, DIMENSIONS_V4, img, call, ANCHOR_TEXT, JUDGE_MODEL, JUDGE_EFFORT } from "./pairwise-judge.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const COND = arg("cond", "principles")
const WITH = arg("with", null)
// Another judge model writes to (and reuses from) its own folders: <cond>@<model>,
// and an effort other than low adds -<effort>.
const TAG = (process.env.JUDGE_MODEL ? `@${JUDGE_MODEL}` : "") + (JUDGE_EFFORT !== "low" ? `-${JUDGE_EFFORT}` : "")
const OUT = path.join(ROOT, "out", "aesthetic", "evalset", COND + TAG)
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

const pagePair = (pa, pb) => [
  { type: "text", text: `A 版:第 1 张为整页缩略图,后 ${pa.length - 1} 张为整页切块。` },
  ...pa,
  { type: "text", text: `B 版:第 1 张为整页缩略图,后 ${pb.length - 1} 张为整页切块。` },
  ...pb,
]

// dims-sep: every dimension in its own call; the page that wins more dimensions
// is "better", equal counts are "平".
async function judgeDims(pa, pb, key, dimensions, reuse = null, redo = []) {
  const dims = {}, raw = {}
  for (const d of dimensions)
    if (reuse && !redo.includes(d.id)) {
      dims[d.id] = reuse.dims[d.id]
      raw[d.id] = reuse.reasons[d.id]
    }
  await Promise.all(dimensions.filter((d) => !(d.id in dims)).map(async (d) => {
    const r = await call(systemForDim(d), pagePair(pa, pb), { key })
    dims[d.id] = r.json.better
    // dimensions that ask for observations keep them with the reason
    raw[d.id] = d.out ? r.json : r.json.reason
  }))
  const n = (x) => Object.values(dims).filter((v) => v === x).length
  const better = n("A") > n("B") ? "A" : n("B") > n("A") ? "B" : "平"
  return { json: { dims, better, reasons: raw } }
}

// dims3v-sep: dims3-sep with two more calls for each of VOTED; that dimension
// takes the majority of the three answers (no majority is "平").
const VOTED = ["space", "grouping"]
async function addVotes(pa, pb, key, base) {
  const dims = { ...base.dims }, votes = {}, more = {}
  await Promise.all(VOTED.map(async (id) => {
    const d = DIMENSIONS_V3.find((x) => x.id === id)
    const rs = await Promise.all([0, 1].map(() => call(systemForDim(d), pagePair(pa, pb), { key })))
    votes[id] = [base.dims[id], ...rs.map((r) => r.json.better)]
    more[id] = rs.map((r) => r.json.reason)
    const c = (x) => votes[id].filter((v) => v === x).length
    dims[id] = c("A") >= 2 ? "A" : c("B") >= 2 ? "B" : "平"
  }))
  const n = (x) => Object.values(dims).filter((v) => v === x).length
  const better = n("A") > n("B") ? "A" : n("B") > n("A") ? "B" : "平"
  return { json: { dims, better, reasons: base.reasons, votes, moreReasons: more } }
}

async function judge() {
  const KEY = process.env.DEEPSEEK_API_KEY
  if (!KEY) throw new Error("set DEEPSEEK_API_KEY")
  fs.mkdirSync(OUT, { recursive: true })
  const jobs = []
  for (let r = 1; r <= REPEATS; r++)
    for (const g of key.filter((g) => GROUPS.includes(g.id)))
      for (const [x, y] of pairsOf(g).filter((p) => !WITH || p.includes(WITH)))
        for (const [a, b] of [[x, y], [y, x]])
          jobs.push({
            file: `${g.id}__${a}__${b}__r${r}.json`,
            run: () => {
              const pa = pageImages(dirOf(g, a)), pb = pageImages(dirOf(g, b))
              if (COND === "dims-sep") return judgeDims(pa, pb, KEY, DIMENSIONS)
              if (COND === "dims2-sep") return judgeDims(pa, pb, KEY, DIMENSIONS_V2)
              if (COND === "dims3-sep") {
                // v3 differs from v2 only in alignment: reuse v2's other answers when present.
                const v2 = path.join(ROOT, "out", "aesthetic", "evalset", "dims2-sep" + TAG, `${g.id}__${a}__${b}__r${r}.json`)
                return judgeDims(pa, pb, KEY, DIMENSIONS_V3, fs.existsSync(v2) ? JSON.parse(fs.readFileSync(v2, "utf8")).json : null, ["alignment"])
              }
              if (COND === "dims4-sep") {
                // v4 differs from v3 only in space and grouping: reuse v3's other answers when present.
                const v3 = path.join(ROOT, "out", "aesthetic", "evalset", "dims3-sep" + TAG, `${g.id}__${a}__${b}__r${r}.json`)
                return judgeDims(pa, pb, KEY, DIMENSIONS_V4, fs.existsSync(v3) ? JSON.parse(fs.readFileSync(v3, "utf8")).json : null, ["space", "grouping"])
              }
              if (COND === "dims3v-sep") {
                const v3 = path.join(ROOT, "out", "aesthetic", "evalset", "dims3-sep" + TAG, `${g.id}__${a}__${b}__r${r}.json`)
                return (fs.existsSync(v3) ? Promise.resolve(JSON.parse(fs.readFileSync(v3, "utf8"))) : judgeDims(pa, pb, KEY, DIMENSIONS_V3))
                  .then((base) => addVotes(pa, pb, KEY, base.json))
              }
              // The crowded reference is a validation page (cramped, every block boxed),
              // not one of the eval-set versions; it shares the A/B report's data.
              const anchor = COND === "crowd-anchor" ? [{ type: "text", text: ANCHOR_TEXT }, img(path.join(ROOT, "out/validate/ab-4/thumb.png"))] : []
              return call(systemFor(COND), [
                ...anchor,
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
        fs.writeFileSync(file, JSON.stringify({ cond: COND, effort: JUDGE_EFFORT, ...(await job.run()) }, null, 1))
      } catch (e) {
        failed++
        console.error(`FAIL ${job.file}: ${e.message}`)
      }
      if (++done % 25 === 0) console.log(`${done}/${total}`)
    }
  }
  // dims-sep sends seven calls per job at once
  await Promise.all(Array.from({ length: COND.endsWith("-sep") ? 5 : 10 }, worker))
  console.log(`done, ${failed} failed → ${path.relative(ROOT, OUT)}`)
}

function score() {
  const human = JSON.parse(fs.readFileSync(path.join(ROOT, "evalset", "human.json"), "utf8"))
  const full = (f) => JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8")).json
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
    for (const [x, y] of pairsOf(g).filter((p) => !WITH || g.id !== "review" || p.includes(WITH))) {
      const hum = r(x) === r(y) ? null : r(x) < r(y) ? x : y
      const cell = []
      for (const n of repeats) {
        const p1 = pick(`${g.id}__${x}__${y}__r${n}.json`), p2 = pick(`${g.id}__${y}__${x}__r${n}.json`)
        if (!p1 || !p2) continue
        let verdict
        if (COND.endsWith("-sep")) {
          // A dimension counts only when it picks the same page in both orders;
          // the page with more such dimensions wins.
          const d1 = full(`${g.id}__${x}__${y}__r${n}.json`).dims, d2 = full(`${g.id}__${y}__${x}__r${n}.json`).dims
          let cx = 0, cy = 0
          for (const k of Object.keys(d1)) {
            const a = d1[k] === "A" ? x : d1[k] === "B" ? y : null
            const b = d2[k] === "A" ? y : d2[k] === "B" ? x : null
            if (a && a === b) a === x ? cx++ : cy++
          }
          verdict = cx > cy ? x : cy > cx ? y : null
        } else {
          const ok = [p1, p2].every((p) => p === "A" || p === "B")
          const w1 = p1 === "A" ? x : y, w2 = p2 === "A" ? y : x
          verdict = ok && w1 === w2 ? w1 : null
        }
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
    console.log(`- ${g.title}:judge ${vs.map((v) => `${label[v]}(${wins[`${g.id}/${v}`] ?? 0})`).join(" ")};你 ${Object.entries(human[g.id] ?? {}).filter(([l]) => l in g.labels).sort((a, b) => a[1] - b[1]).map(([l, n]) => `${l}${n}`).join(" ")}`)
  }
  coupling()
  console.log("\n## 逐对结果(每格为各次重复的判定:选中的版面,或「分」= 两种顺序选得不一样)\n")
  console.log("| 组 | 对比 | 你选 | judge |")
  console.log("|---|---|---|---|")
  for (const d of detail) console.log(`| ${d.join(" | ")} |`)
}

// How independent the dimension (or principle) votes are: the share of
// judgments whose non-tie votes all fall on one side, and how often each
// vote agrees with the verdict.
function coupling() {
  const votes = fs.readdirSync(OUT).map((f) => JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8")).json).filter((j) => j?.dims || j?.principles)
  if (!votes.length) return
  let oneSide = 0
  const withVerdict = {}
  for (const j of votes) {
    const v = j.dims ?? j.principles
    const sides = Object.values(v).filter((x) => x === "A" || x === "B")
    if (sides.length && sides.every((x) => x === sides[0])) oneSide++
    for (const [k, x] of Object.entries(v)) {
      if (x !== "A" && x !== "B") continue
      withVerdict[k] ??= [0, 0]
      withVerdict[k][1]++
      if (x === j.better) withVerdict[k][0]++
    }
  }
  const pct = (a, b) => `${Math.round((100 * a) / b)}%`
  console.log(`\n## 维度之间的耦合(${votes.length} 次判定)\n`)
  console.log(`- 非平的票全部投向同一版:${pct(oneSide, votes.length)}`)
  console.log(`- 各维与结论一致:${Object.entries(withVerdict).map(([k, [a, b]]) => `${k} ${pct(a, b)}(${b})`).join(",")}`)
}

if (process.argv.includes("--score")) score()
else await judge()
