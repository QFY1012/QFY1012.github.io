// The pairwise judge between two generation runs, page by page. Both stage judges work the same way:
// show the two versions side by side, ask which is better and what the better one still gets
// wrong. Each comparison is asked in both orders; a decision needs both orders to pick the same
// page (otherwise 拿不定), and a remaining problem counts when both orders name it.
//   aesthetic  审美 judge: rubric31, which is better designed; forced choice
//   function   需求 judge: which is more convenient to use (find, compare, match picture and text); may be 一样
//
//   node scripts/compare.mjs --kind function --a <run> --b <run> --cases f1,f3 [--rounds 1]
//
// Writes traces/_compare/<a>__<b>/ (aesthetic) or traces/_compare/function/<a>__<b>/ (function):
// <case>__r<n>__<AB|BA>.json, and <case>__r<n>__next.json with the remaining problems both orders name.
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { spawnSync } from "node:child_process"
import { systemRubric31Next, call, img } from "../../ui-judge/scripts/pairwise-judge.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
// variant (需求 judge only, for trying ways to show the pair): side = both versions in one image, A left
// and B right; tasks = list what the reader does in each version before deciding.
const dirOf = (a, b, kind, variant) => path.join(ROOT, "traces", "_compare", ...(kind === "function" ? [variant ? `function-${variant}` : "function"] : []), `${a}__${b}`)

// rubric31 as calibrated, plus one question at the end: what the better page still gets wrong.
export const systemAesthetic = systemRubric31Next

const FUNCTION = `你比较同一份报告的两版页面 A 和 B 哪版更方便使用,不评价美观。会给你上游数据 data.json 和两版的截图(每版先是整页缩略图,再是从上到下的切块;两版开头完全相同的切块会略去)。

方便使用指:读者拿着这页做该做的事——找到某一项、在几项之间对照、看图并对应到文字说明——需要的翻找和来回对照少。不考虑配色、留白、字号这类美观问题。

1. 判断哪版更方便,或者一样。写清更方便在哪里:哪一节、读者做什么事时少了哪些翻找。
2. 列出更方便的那版还剩的不方便(一样时列两版共有的):在哪一节、读者想做什么、为什么不方便。没有就返回空列表。

只输出 JSON:{"better":"A 或 B 或 一样","reason":"一两句话","next":[{"where":"页面上的哪一节","task":"读者想做什么","why":"为什么不方便"}]}`
export const SYSTEM_FUNCTION = FUNCTION
export const systemFunction = (variant) => variant === "side"
  ? FUNCTION.replace("和两版的截图(每版先是整页缩略图,再是从上到下的切块;两版开头完全相同的切块会略去)", "和两版并排的截图:每张图左半是 A 版、右半是 B 版;第 1 张是两版的整页缩略图,后面是从上到下、同一高度的切块(两版开头完全相同的切块会略去)")
  : variant === "tasks"
    ? FUNCTION.replace("1. 判断哪版更方便", "1. 先列出读者拿这页要做的几件主要事情,逐件写 A、B 两版各自怎么做、要翻找和对照多少。\n2. 再判断哪版更方便")
      .replace("2. 列出更方便的那版", "3. 列出更方便的那版").replace('只输出 JSON:{"better"', '只输出 JSON:{"tasks":[{"task":"读者要做的事","A":"A 版怎么做","B":"B 版怎么做"}],"better"')
    : FUNCTION

const PAIR = `下面是对同一对页面的两次比较各自列出的「更好那版还剩的问题」。把两次里说的是同一件事的配对,只输出两次都提到的,每条写成一句话。

只输出 JSON:{"issues":[{"what":"一句话"}]}`

const tiles = (ws) => JSON.parse(fs.readFileSync(path.join(ws, "tiles.json"), "utf8"))
const hash = (f) => crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex")
// Tiles are cut from the top at fixed offsets, so the tiles before the first change are byte for byte
// the same in both versions; the 需求 judge skips them (the thumbnails still show the whole page).
function firstChange(wsA, wsB) {
  const [ta, tb] = [tiles(wsA), tiles(wsB)]
  let i = 0
  while (i < ta.length && i < tb.length && hash(path.join(wsA, ta[i].file)) === hash(path.join(wsB, tb[i].file))) i++
  return i === ta.length && i === tb.length ? 0 : i
}
const version = (ws, label, from) => {
  const t = tiles(ws).slice(from)
  return [{ type: "text", text: `${label} 版:第 1 张为整页缩略图,后 ${t.length} 张为${from ? `从第 ${from + 1} 张起的切块(前面的两版相同,略去)` : "整页切块"}。` },
    img(path.join(ws, "thumb.png")), ...t.map((x) => img(path.join(ws, x.file)))]
}

// Both versions in one image per band of the page (scripts/side.py), made once per page and order.
function sideBySide(wx, wy, from, out) {
  if (!fs.existsSync(path.join(out, "side-0.png"))) {
    const r = spawnSync("python3", [path.join(ROOT, "scripts", "side.py"), wx, wy, String(from), out], { encoding: "utf8" })
    if (r.status) throw new Error(`side.py: ${r.stderr.slice(0, 200)}`)
  }
  const files = fs.readdirSync(out).filter((f) => /^side-\d+\.png$/.test(f)).sort((x, y) => Number(x.match(/\d+/)) - Number(y.match(/\d+/)))
  return [{ type: "text", text: `第 1 张为两版整页缩略图并排,后 ${files.length - 1} 张为${from ? `从第 ${from + 1} 段起` : "整页"}同一高度的切块并排;每张左半是 A 版、右半是 B 版。` }, ...files.map((f) => img(path.join(out, f)))]
}

export async function compare(a, b, cases, rounds = 3, kind = "aesthetic", { variant, next = true } = {}) {
  const KEY = process.env.DEEPSEEK_API_KEY
  const dir = dirOf(a, b, kind, variant)
  fs.mkdirSync(dir, { recursive: true })
  const sys = kind === "function" ? systemFunction(variant) : systemAesthetic()
  const name = kind === "function" ? "需求 judge" : "审美 judge"
  const jobs = []
  for (const c of cases)
    for (let r = 1; r <= rounds; r++)
      for (const order of ["AB", "BA"]) jobs.push({ file: path.join(dir, `${c}__r${r}__${order}.json`), c, r, order })
  const all = [...jobs]
  const todo = all.filter((j) => !fs.existsSync(j.file)).length
  console.log(`  ${name} ${a} 对 ${b}:${cases.join(",")},每页 ${rounds} 轮 × 两种顺序,要跑 ${todo} 次(已有的跳过)`)
  let done = 0
  async function worker() {
    while (jobs.length) {
      const { file, c, r, order } = jobs.shift()
      if (fs.existsSync(file)) continue
      const [x, y] = order === "AB" ? [a, b] : [b, a]
      const wx = path.join(ROOT, "traces", x, c), wy = path.join(ROOT, "traces", y, c)
      const from = kind === "function" ? firstChange(wx, wy) : 0
      const shots = variant === "side" ? sideBySide(wx, wy, from, path.join(dir, "img", `${c}__${order}`)) : [...version(wx, "A", from), ...version(wy, "B", from)]
      const content = [...(kind === "function" ? [{ type: "text", text: `<data.json>\n${fs.readFileSync(path.join(wx, "data.json"), "utf8")}\n</data.json>` }] : []), ...shots]
      const label = `${name} ${c} 第 ${r} 轮 ${order}`
      const t0 = Date.now()
      console.log(`  ${label} 开始(${content.filter((p) => p.type === "image_url").length} 张图)`)
      try {
        const res = await call(sys, content, { key: KEY, label })
        fs.writeFileSync(file, JSON.stringify({ A: x, B: y, ...res }, null, 1))
        const w = res.json.better === "A" ? x : res.json.better === "B" ? y : "一样"
        console.log(`  ${label}:更好的是 ${w},还剩问题 ${res.json.next?.length ?? 0} 条(${Math.round((Date.now() - t0) / 1000)} 秒;本批 ${++done}/${todo})`)
      } catch (e) {
        console.log(`  ✗ ${label} 失败:${e.message.slice(0, 120)}`)
      }
    }
  }
  // Failed comparisons are asked again after a wait: a missing order would leave that round undecided.
  for (let pass = 0; pass < 4; pass++) {
    const missing = all.filter((j) => !fs.existsSync(j.file))
    if (!missing.length) break
    if (pass) {
      const wait = 60 * 2 ** (pass - 1)
      console.log(`  ${name}:还缺 ${missing.length} 次,等 ${wait} 秒后补跑(第 ${pass} 轮)`)
      await new Promise((r) => setTimeout(r, wait * 1000))
    }
    jobs.splice(0, jobs.length, ...missing)
    await Promise.all(Array.from({ length: 8 }, worker))
  }
  const missing = all.filter((j) => !fs.existsSync(j.file))
  if (missing.length) throw new Error(`${name} 没跑完:${missing.map((j) => path.basename(j.file)).join("、")}`)
  if (!next) return
  await pairNext(a, b, cases, rounds, kind)
  const s = summarize(a, b, cases, rounds, kind)
  for (const [c, v] of Object.entries(s.perCase)) console.log(`  ${name} ${c}:${v.rounds.map((x) => (x === "b" ? b : x === "a" ? a : x)).join("、")} → ${v.verdict === "b" ? b : v.verdict === "a" ? a : "平"}`)
  return s
}

// The remaining problems both orders of a round name, for the version both orders picked.
async function pairNext(a, b, cases, rounds, kind) {
  const dir = dirOf(a, b, kind)
  const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))
  for (const c of cases)
    for (let r = 1; r <= rounds; r++) {
      const out = path.join(dir, `${c}__r${r}__next.json`)
      if (fs.existsSync(out)) continue
      const ab = read(`${c}__r${r}__AB.json`), ba = read(`${c}__r${r}__BA.json`)
      const p1 = pickedOrSame(ab), p2 = pickedOrSame(ba)
      const of = p1 === p2 ? p1 : null
      let issues = []
      const l1 = ab.json.next ?? [], l2 = ba.json.next ?? []
      if (of && l1.length && l2.length) {
        const fmt = (l) => l.map((i) => `- ${[i.where, i.task, i.why, i.problem].filter(Boolean).join(";")}`).join("\n")
        const res = await call(PAIR, [{ type: "text", text: `<第 1 次>\n${fmt(l1)}\n</第 1 次>\n\n<第 2 次>\n${fmt(l2)}\n</第 2 次>` }], { key: process.env.DEEPSEEK_API_KEY, label: `配对 ${c} 第 ${r} 轮的剩余问题` })
        issues = res.json.issues ?? []
      }
      fs.writeFileSync(out, JSON.stringify({ of, issues }, null, 1))
      console.log(`  ${kind === "function" ? "需求" : "审美"} judge ${c} 第 ${r} 轮:${of ? `两种顺序都选 ${of}` : "两种顺序选的不一样"},两次都提到的剩余问题 ${issues.length} 条`)
    }
}
const pickedOrSame = (j) => (j?.json?.better === "A" ? j.A : j?.json?.better === "B" ? j.B : j?.json?.better === "一样" ? "一样" : null)

// The remaining problems that count, per case and round: {of: run or 一样 or null, issues}.
export function nextProblems(a, b, cases, rounds = 1, kind = "aesthetic") {
  const dir = dirOf(a, b, kind)
  const out = {}
  for (const c of cases)
    for (let r = 1; r <= rounds; r++) {
      const f = path.join(dir, `${c}__r${r}__next.json`)
      if (fs.existsSync(f)) (out[c] ??= []).push(JSON.parse(fs.readFileSync(f, "utf8")))
    }
  return out
}

// Which run a judgement picked ("A"/"B" mapped back to run names), or null.
const picked = (j) => (j?.json?.better === "A" ? j.A : j?.json?.better === "B" ? j.B : null)

export function summarize(a, b, cases, rounds = 3, kind = "aesthetic") {
  const dir = dirOf(a, b, kind)
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
export function observations(a, b, cases, rounds = 1, kind = "aesthetic") {
  const dir = dirOf(a, b, kind)
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
  const kind = arg("kind", "aesthetic"), a = arg("a"), b = arg("b"), cases = arg("cases").split(","), rounds = Number(arg("rounds", "3"))
  await compare(a, b, cases, rounds, kind)
  for (const [c, rs] of Object.entries(nextProblems(a, b, cases, rounds, kind))) {
    console.log(`\n== ${c}`)
    rs.forEach((x, i) => { console.log(`  第 ${i + 1} 轮:${x.of ? `两种顺序都选 ${x.of}` : "两种顺序选的不一样"}`); for (const q of x.issues) console.log(`    - ${q.what}`) })
  }
}
