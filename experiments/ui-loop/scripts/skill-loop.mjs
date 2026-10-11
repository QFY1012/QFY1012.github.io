// The output-guide loop for one Skill: improve skills/<skill>/guides/ from what the judge
// says about that Skill's pages. The shared layer (design.md, components.md) stays fixed.
//
//   source judge.env && node scripts/skill-loop.mjs --skill flow [--max-rounds 6] [--setup-only]
//
// The Skill's samples are split in skills/split.json: training samples are what the
// Maintainer and Reviser learn from; held-out samples are only used to accept or reject.
//
// Setup: g0 (empty guide) builds every sample from scratch; the Maintainer generalises the
// program checks on the training pages into the first problem list (experience.md).

// Each round (state in skills/<skill>/state.json, so a stopped run resumes):
//   1. Reviser    reads the guide, the 布局问题 in experience.md and changelog.md; changes one rule → guides/c<k>.md
//   2. Edit       the agent edits each current page for that one change (not from scratch),
//                 so differences between the two pages come from the change
//   3. Judge      candidate against current, rubric31, both orders: training 1 round,
//                 held-out 3 rounds; pages the agent left unchanged are not judged
//   4. Gate       accept when no held-out sample is lost, at least half are won, and
//                 program-check findings do not increase
//   5. Maintainer generalises the training judgements into problems → experience.md
//   6. Record     changelog.md entry either way
// Stops after 3 rejected candidates in a row, after --max-rounds, or at a human
// checkpoint every 2 accepted versions.
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { call } from "../../ui-judge/scripts/pairwise-judge.mjs"
import { compare, summarize } from "./compare.mjs"
import { maintain as maintain_ } from "./maintainer.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const SK = arg("skill")
const split = JSON.parse(fs.readFileSync(path.join(ROOT, "skills", "split.json"), "utf8"))[SK]
if (!split) throw new Error("--skill must be one of skills/split.json")
const NAME = split.name, TRAIN = split.train, HOLD = split.holdout, ALL = [...TRAIN, ...HOLD]
const MAX_ROUNDS = Number(arg("max-rounds", "6"))
const KEY = process.env.DEEPSEEK_API_KEY
const DIR = path.join(ROOT, "skills", SK)
const GUIDES = path.join(DIR, "guides")
const STATE = path.join(DIR, "state.json")
const EXP = path.join(DIR, "experience.md")
const LOG = path.join(DIR, "changelog.md")
const read = (f) => fs.readFileSync(f, "utf8")
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), `[${SK}]`, ...a)
const run = (v) => `${SK}-${v}`
const ws = (r, c) => path.join(ROOT, "traces", r, c)
const meta = (r, c) => JSON.parse(read(path.join(ws(r, c), "meta.json")))

const state = fs.existsSync(STATE) ? JSON.parse(read(STATE)) : { current: "g0", currentRun: run("g0"), versions: 0, round: 0, rejected: 0, sinceCheckpoint: 0, history: [] }
const save = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 1))
if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, `# 修改记录 · ${NAME}\n\n每个候选改了什么、对比结果、是否采用;没采用的也保留。\n`)

function generate(r, cases, guide, base, changeFile) {
  const pending = cases.filter((c) => !fs.existsSync(path.join(ws(r, c), "meta.json")))
  if (!pending.length) return
  log(`generate ${r}: ${pending.join(",")}${base ? ` (edit ${base})` : ""}`)
  execFileSync("node", [path.join(ROOT, "scripts", "generate.mjs"), "--run", r, "--cases", pending.join(","),
    "--data", path.join("skills", SK, "data"), "--guide", path.relative(ROOT, path.join(GUIDES, `${guide}.md`)), "--version", guide,
    ...(base ? ["--base", base, "--change", path.relative(ROOT, changeFile)] : [])], { stdio: "inherit", cwd: ROOT })
}
const findings = (r, cases) => cases.reduce((n, c) => n + (meta(r, c).checks?.length ?? 0), 0)
const trainData = () => TRAIN.map((c) => `<${c}.json>\n${read(path.join(DIR, "data", `${c}.json`))}</${c}.json>`).join("\n")

// ---------- Maintainer ----------
// scripts/maintainer.mjs: generalises a stage's findings on the training pages into problems,
// each either 组件不够 or 布局问题 → experience.json / experience.md.
const maintain = (r, stage, base) => maintain_({ skill: SK, run: r, stage, base, guide: path.relative(ROOT, path.join(GUIDES, `${state.current}.md`)) })
  .then((ps) => log(`maintainer (${stage}): ${ps.filter((p) => p.status !== "已解决").length} open problems`))

// ---------- Reviser ----------
async function revise(name) {
  const cur = read(path.join(GUIDES, `${state.current}.md`))
  const sys = `你负责修改「${NAME}」这个 Skill 的输出指南。生成 Agent 按公共规范 design.md 和这份指南为这个 Skill 的报告写页面;judge 用两两比较判断新旧两版谁更好。你每次只改一条规则,改动在留出的验证样本上通过把关才会被采用;验证样本你看不到。

要求:
- 只改输出指南;公共规范和组件库固定不变,不要在指南里重复公共规范已有的内容。
- 只改一处:改写一条已有规则,或新增一条规则。
- 规则写这个 Skill 的数据怎么呈现:哪个字段(写字段名,如 chains、stages)用哪个组件、什么 props、放在哪一节、什么顺序。写成生成 Agent 能照着做、能检查的具体做法,不写「美观」「清晰」这类说法。
- 规则要对这个 Skill 的所有报告都适用:训练样本里数据多少不同(产品个数、步骤数、表格行数),写清楚不同情况怎么做,不要只针对某一份样本。
- 依据问题清单里「布局问题」一栏(「组件不够」不归你管),先解决涉及页数最多的;写明依据哪几个问题(id)。
- 先读修改记录:被拒绝过的改法不要重复;方向对但带出新问题的,在原改法上补足。

只输出 JSON:{"rule":"规则编号(新增的写新编号,如 G3)","old":"被改写的那一整行原文(必须和指南里的一行完全一致;新增规则写空字符串)","new":"新的一整行,以 - **编号 名称**: 开头","basis":["E-01"],"why":"一两句话"}`
  const user = `<公共规范 design.md>\n${read(path.join(ROOT, "design.md"))}\n</公共规范>\n\n<输出指南 当前版 ${state.current}>\n${cur}\n</输出指南>\n\n<训练样本数据>\n${trainData()}\n</训练样本数据>\n\n<问题清单>\n${read(EXP)}\n</问题清单>\n\n<修改记录>\n${read(LOG)}\n</修改记录>`
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = (await call(sys, [{ type: "text", text: user }], { key: KEY })).json
    if (!/^- \*\*G\d+/.test(r.new?.trim() ?? "")) continue
    let next
    if (r.old) {
      if (!cur.includes(r.old)) continue
      next = cur.replace(r.old, r.new.trim())
    } else next = cur.includes("(暂无)") ? cur.replace("(暂无)", r.new.trim()) : cur.trimEnd() + "\n" + r.new.trim() + "\n"
    next = next.replace(/^# 输出指南 .*$/m, `# 输出指南 · ${NAME} ${name}(候选,基于 ${state.current})`)
    fs.writeFileSync(path.join(GUIDES, `${name}.md`), next)
    fs.mkdirSync(path.join(DIR, "changes"), { recursive: true })
    fs.writeFileSync(path.join(DIR, "changes", `${name}.json`), JSON.stringify(r, null, 1))
    log(`reviser ${name}: ${r.rule} — ${r.why}`)
    return r
  }
  throw new Error("reviser gave no applicable change in 3 attempts")
}

// ---------- setup ----------
generate(run("g0"), ALL, "g0")
if (!fs.existsSync(EXP)) await maintain(run("g0"), "program")
if (process.argv.includes("--setup-only")) process.exit(0)

// ---------- rounds ----------
const mark = (x) => (x === "b" ? "赢" : x === "a" ? "输" : "平")
while (state.round < MAX_ROUNDS) {
  if (state.rejected >= 3) { state.stop = "连续 3 个候选未通过把关"; break }
  if (state.sinceCheckpoint >= 2) { state.stop = "人工检查点:请盲排当前版和 g0"; break }
  const k = state.round + 1, cand = `c${k}`, cr = run(cand)
  let change = state.pending?.name === cand ? state.pending.change : null
  if (!change) {
    change = await revise(cand)
    state.pending = { name: cand, change }
    save()
  }
  generate(cr, ALL, cand, state.currentRun, path.join(DIR, "changes", `${cand}.json`))
  const lines = Object.fromEntries(ALL.map((c) => [c, meta(cr, c).changedLines ?? 0]))
  const touched = (cases) => cases.filter((c) => lines[c] > 0)
  await compare(state.currentRun, cr, touched(TRAIN), 1)
  await compare(state.currentRun, cr, touched(HOLD), 3)
  const train = summarize(state.currentRun, cr, touched(TRAIN), 1)
  const gate = summarize(state.currentRun, cr, touched(HOLD), 3)
  const fa = findings(state.currentRun, ALL), fb = findings(cr, ALL)
  const verdicts = Object.values(gate.perCase).map((x) => x.verdict)
  const lost = verdicts.filter((v) => v === "a").length, won = verdicts.filter((v) => v === "b").length
  const need = Math.ceil(HOLD.length / 2)
  const accept = touched(HOLD).length > 0 && lost === 0 && won >= need && fb <= fa
  const why = accept ? "" : !touched(HOLD).length ? "验证样本的页面都没有改动,无法验证" : lost ? `验证样本输了 ${lost} 份` : won < need ? `验证样本只赢 ${won} 份` : `程序检查问题从 ${fa} 个增加到 ${fb} 个`
  if (touched(TRAIN).length) await maintain(cr, "aesthetic", state.currentRun)

  const base = state.current, baseRun = state.currentRun
  if (accept) {
    state.versions++
    const v = `g${state.versions}`
    fs.writeFileSync(path.join(GUIDES, `${v}.md`), read(path.join(GUIDES, `${cand}.md`)).replace(/^# 输出指南 .*$/m, `# 输出指南 · ${NAME} ${v}`))
    state.current = v
    state.currentRun = cr
    state.rejected = 0
    state.sinceCheckpoint++
  } else state.rejected++
  const fmt = (s, cases) => cases.map((c) => (lines[c] ? `${c} ${(s.perCase[c]?.rounds ?? []).map(mark).join("")}` : `${c} 未改动`)).join(",")
  fs.appendFileSync(LOG, `
## 候选 ${cand}(基于 ${base})  结果:${accept ? `采用,成为 ${state.current}` : "未采用"}

改动:规则 ${change.rule}
${change.old ? `  原文:${change.old.trim()}\n` : "  (新增规则)\n"}  改为:${change.new.trim()}
依据:${(change.basis ?? []).join("、")}。${change.why}
改动行数(Page.tsx,相对当前版):${ALL.map((c) => `${c} ${lines[c]}`).join(",")}
训练样本(候选对当前,1 轮):${fmt(train, TRAIN)}
验证样本(3 轮,每轮两种顺序都选同一版才算):${fmt(gate, HOLD)}
程序检查问题:当前 ${fa} 个,候选 ${fb} 个
${accept ? "" : `没采用的原因:${why}\n`}`)
  state.history.push({ round: k, candidate: cand, base, baseRun, change, accept, why, lines, train: train.perCase, gate: gate.perCase, findings: { current: fa, candidate: fb } })
  state.round = k
  delete state.pending
  save()
  log(`round ${k}: ${cand} ${accept ? "accepted as " + state.current : "rejected (" + why + ")"}`)
}
if (!state.stop && state.round >= MAX_ROUNDS) state.stop = `达到轮数上限 ${MAX_ROUNDS}`
save()
log(`stopped: ${state.stop}; current ${state.current}`)
