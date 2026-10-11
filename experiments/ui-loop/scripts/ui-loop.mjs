// The UI loop for one Skill's report pages: improve the Skill's output guide (skills/<skill>/guides/)
// from what the checks say about its pages. The shared spec (design.md) stays fixed; the component
// library changes only through the component branch (scripts/component-loop.mjs, approved by a person).
//
//   source judge.env && node scripts/ui-loop.mjs --skill flow [--max-rounds 12] [--stage-rounds 4] [--checkpoint 2]
//
// The Skill's samples are split in skills/split.json: training samples are what the Maintainer
// and the Reviser learn from; held-out samples are only used to accept or reject a change.
//
// Three stages, in order; the pages move to the next stage when they pass this one:
//   program    program checks (shoot.mjs)                       pass: no findings on any page
//   function   需求 judge: which version is more convenient     pass: no open 需求 problem on the training pages
//   aesthetic  审美 judge: rubric31, which is better designed    (last stage; runs until a stop)
// Both judges compare two versions of a page (compare.mjs), in both orders: a verdict counts when
// both orders pick the same version, and the better version's remaining problems count when both
// orders name them. After each stage's checks the Maintainer generalises the training pages'
// findings into problems, each 组件不够 or 布局问题 (experience.json / experience.md); in a judge
// stage, the first look compares the current pages with a second generation of the same guide.
//
// Each round (state in skills/<skill>/state.json, so a stopped run resumes):
//   1. Reviser    reads the guide, the 布局问题 and changelog.md; changes one rule → guides/c<k>.md
//   2. Edit       the agent edits each current page for that one change (not from scratch)
//   3. Gate       on the held-out samples:
//                   program    fewer findings, no page with more
//                   function   需求 judge, 3 rounds: no sample lost, at least half won; program checks not worse
//                   aesthetic  审美 judge, the same; program checks and 需求 judge not worse (no sample lost)
//   4. Maintainer on the training pages (compared once, current against candidate; pages left
//                 unchanged keep their earlier comparison): the problem list, and what the change
//                 fixed and broke → 「试过的改法」
//   5. Record     changelog.md entry either way
// When only 组件不够 problems are open, the loop stops and waits for the component branch; after a
// merge (component-loop.mjs approve) the pages it edited become the current run, and the loop
// checks them again from this stage.
// A stage ends early (moving on, with what is left recorded) after --stage-rounds rounds or 3
// rejected candidates in a row. The loop stops after --max-rounds, or at a human checkpoint
// every --checkpoint accepted versions (default 2; 0 turns it off).
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { call } from "../../ui-judge/scripts/pairwise-judge.mjs"
import { compare, summarize } from "./compare.mjs"
import { maintain as maintain_, attempt } from "./maintainer.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const SK = arg("skill")
const split = JSON.parse(fs.readFileSync(path.join(ROOT, "skills", "split.json"), "utf8"))[SK]
if (!split) throw new Error("--skill must be one of skills/split.json")
const NAME = split.name, TRAIN = split.train, HOLD = split.holdout, ALL = [...TRAIN, ...HOLD]
const MAX_ROUNDS = Number(arg("max-rounds", "12"))
const STAGE_ROUNDS = Number(arg("stage-rounds", "4"))
// Stop for a person to blind-rank the current version against g0 after this many accepted versions; 0: never.
const CHECKPOINT = Number(arg("checkpoint", "2"))
const KEY = process.env.DEEPSEEK_API_KEY
const DIR = path.join(ROOT, "skills", SK)
const GUIDES = path.join(DIR, "guides")
const STATE = path.join(DIR, "state.json")
const EXP = path.join(DIR, "experience.md")
const LOG = path.join(DIR, "changelog.md")
const STAGES = ["program", "function", "aesthetic"]
const STAGE_NAME = { program: "程序检查", function: "需求 judge", aesthetic: "审美 judge" }
const read = (f) => fs.readFileSync(f, "utf8")
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), `[${SK}]`, ...a)
const run = (v) => `${SK}-${v}`
const ws = (r, c) => path.join(ROOT, "traces", r, c)
const meta = (r, c) => JSON.parse(read(path.join(ws(r, c), "meta.json")))

const state = fs.existsSync(STATE) ? JSON.parse(read(STATE)) : { current: "g0", currentRun: run("g0"), versions: 0, round: 0, rejected: 0, sinceCheckpoint: 0, history: [] }
state.stage ??= "program"
state.stageRounds ??= 0
const save = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 1))
if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, `# 修改记录 · ${NAME}\n\n每个候选改了什么、检测结果、是否采用;没采用的也保留。\n`)

function generate(r, cases, guide, base, changeFile) {
  const pending = cases.filter((c) => !fs.existsSync(path.join(ws(r, c), "meta.json")))
  if (!pending.length) return
  log(`generate ${r}: ${pending.join(",")}${base ? ` (edit ${base})` : ""}`)
  execFileSync("node", [path.join(ROOT, "scripts", "generate.mjs"), "--run", r, "--cases", pending.join(","),
    "--data", path.join("skills", SK, "data"), "--guide", path.relative(ROOT, path.join(GUIDES, `${guide}.md`)), "--version", guide,
    ...(base ? ["--base", base, "--change", path.relative(ROOT, changeFile)] : [])], { stdio: "inherit", cwd: ROOT })
}
const trainData = () => TRAIN.map((c) => `<${c}.json>\n${read(path.join(DIR, "data", `${c}.json`))}</${c}.json>`).join("\n")

// ---------- checks ----------
const findings = (r, cases) => Object.fromEntries(cases.map((c) => [c, meta(r, c).checks?.length ?? 0]))
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0)

// ---------- Maintainer ----------
// scripts/maintainer.mjs: generalises a stage's findings on the training pages into problems,
// each either 组件不够 or 布局问题 → experience.json / experience.md. In a judge stage it reads the
// comparisons in state.judged (page → the two runs last compared on it), about the current run.
async function maintain(current) {
  const pairs = state.judged?.[state.stage]
  const ps = await maintain_({ skill: SK, run: state.currentRun, stage: state.stage, guide: path.relative(ROOT, path.join(GUIDES, `${state.current}.md`)), pairs, current })
  state.maintained = { run: state.currentRun, stage: state.stage }
  save()
  // The whole list, so the terminal shows what the Maintainer concluded.
  log(`maintainer (${STAGE_NAME[state.stage]}, ${state.currentRun}): ${ps.filter((p) => p.status !== "已解决").length} 个未解决问题`)
  for (const p of ps) console.log(`  ${p.id} [${p.cause}] ${p.status} ${p.stage} · ${p.pages.join(",")}\n    ${p.problem}${p.good ? `\n    赢的做法:${p.good}` : ""}${(p.evidence ?? []).map((e) => `\n    - ${e}`).join("")}`)
  return ps
}
const open = (pick) => {
  const f = path.join(DIR, "experience.json")
  return fs.existsSync(f) ? JSON.parse(read(f)).problems.filter((p) => p.status !== "已解决" && pick(p)) : []
}
// Compare two runs on training pages. remember: the comparison is about the current pages (the
// first look, or an accepted candidate), so the Maintainer reads it for those pages from now on.
// focus: in the 需求 stage, the problems the candidate set out to fix; the judge checks them first.
async function judgeTrain(a, b, cases, remember, focus) {
  log(`训练页 ${cases.join(",")} 上比较 ${a} 和 ${b}(${STAGE_NAME[state.stage]},1 轮 × 两种顺序${focus ? `,先核对 ${focus.length} 个上一轮的问题` : ""})`)
  await compare(a, b, cases, 1, state.stage, { focus })
  if (!remember) return
  state.judged ??= {}
  state.judged[state.stage] = { ...(state.judged[state.stage] ?? {}), ...Object.fromEntries(cases.map((c) => [c, [a, b]])) }
  save()
}

// ---------- Reviser ----------
async function revise(name) {
  const cur = read(path.join(GUIDES, `${state.current}.md`))
  const sys = `你负责修改「${NAME}」这个 Skill 的输出指南。生成 Agent 按公共规范 design.md、组件库 components.md 和这份指南为这个 Skill 的报告写页面。页面依次经过程序检查、需求 judge(哪版更方便操作)、审美 judge(哪版更好看),两个 judge 都是新旧两版两两比较,现在在「${STAGE_NAME[state.stage]}」这一步。你每次只改一条规则,改动在留出的验证样本上通过把关才会被采用;验证样本你看不到。

要求:
- 只改输出指南;公共规范和组件库不归你改,不要在指南里重复公共规范已有的内容。
- 只改一处:改写一条已有规则,或新增一条规则。
- 规则写这个 Skill 的数据怎么呈现:哪个字段(写字段名,如 chains、stages)用哪个组件、放在哪一节、什么顺序、怎么排。只用 components.md 里有的组件。写成生成 Agent 能照着做、能检查的具体做法,不写「美观」「清晰」这类说法。
- 规则要对这个 Skill 的所有报告都适用:训练样本里数据多少不同(产品个数、步骤数、表格行数),写清楚不同情况怎么做,不要只针对某一份样本。
- 依据问题清单里「布局问题」一栏(「组件不够」不归你管),先解决这一步和前面几步的问题,其中涉及页数最多的优先;写明依据哪几个问题(id)。
- 先读问题清单里的「试过的改法」和修改记录:每个试过的改法在训练页上解决了什么、带出了什么新问题、为什么没采用都在那里。原样被拒绝过的改法不要重复;方向对但带出新问题的,在原改法上补足;不要因为一次没采用就放弃一个问题,先看它为什么没过。

只输出 JSON:{"rule":"规则编号(新增的写新编号,如 G3)","old":"被改写的那一整行原文(必须和指南里的一行完全一致;新增规则写空字符串)","new":"新的一整行,以 - **编号 名称**: 开头","basis":["P-01"],"why":"一两句话"}`
  const user = `<公共规范 design.md>\n${read(path.join(ROOT, "design.md"))}\n</公共规范>\n\n<components.md>\n${read(path.join(ROOT, "components.md"))}\n</components.md>\n\n<输出指南 当前版 ${state.current}>\n${cur}\n</输出指南>\n\n<训练样本数据>\n${trainData()}\n</训练样本数据>\n\n<问题清单>\n${read(EXP)}\n</问题清单>\n\n<修改记录>\n${read(LOG)}\n</修改记录>`
  for (let n = 0; n < 3; n++) {
    // Streamed, like the Maintainer, so the terminal shows the Reviser at work.
    process.stdout.write(`\n── Reviser · ${NAME} · ${name}${n ? `(第 ${n + 1} 次)` : ""}\n`)
    const r = (await call(sys, [{ type: "text", text: user }], { key: KEY, label: `Reviser ${name}`, onThink: (s) => process.stdout.write(`[思考中… ${s} 秒]\n`), onText: (t) => process.stdout.write(t) })).json
    process.stdout.write("\n")
    if (!/^- \*\*G\d+/.test(r.new?.trim() ?? "")) { log(`reviser ${name}: 回复里没有 - **G<编号>** 开头的新规则,重写`); continue }
    let next
    if (r.old) {
      if (!cur.includes(r.old)) { log(`reviser ${name}: 要改写的原文在指南里找不到,重写`); continue }
      next = cur.replace(r.old, r.new.trim())
    } else next = cur.includes("(暂无)") ? cur.replace("(暂无)", r.new.trim()) : cur.trimEnd() + "\n" + r.new.trim() + "\n"
    next = next.replace(/^# 输出指南 .*$/m, `# 输出指南 · ${NAME} ${name}(候选,基于 ${state.current})`)
    fs.writeFileSync(path.join(GUIDES, `${name}.md`), next)
    fs.mkdirSync(path.join(DIR, "changes"), { recursive: true })
    // The problems this change sets out to fix, in their words now: the 需求 judge checks them first.
    const basis = Object.fromEntries(open(() => true).map((p) => [p.id, p.problem]))
    r.problems = (r.basis ?? []).filter((id) => basis[id]).map((id) => ({ id, problem: basis[id] }))
    fs.writeFileSync(path.join(DIR, "changes", `${name}.json`), JSON.stringify(r, null, 1))
    log(`reviser ${name}: ${r.rule} — ${r.why}`)
    return r
  }
  throw new Error("reviser gave no applicable change in 3 attempts")
}

// ---------- gate ----------
const mark = (x) => (x === "b" ? "赢" : x === "a" ? "输" : "平")
const worse = (a, b) => HOLD.filter((c) => b[c] > a[c])
const focusOf = (change) => (state.stage === "function" && change.problems?.length ? change.problems.map((p) => p.problem) : undefined)
async function gate(base, cand, touched, change) {
  log(`门禁:验证页 ${HOLD.join(",")},${base}(当前版)对 ${cand}(候选)`)
  const fp = [findings(base, HOLD), findings(cand, HOLD)]
  log(`门禁 · 程序检查:${HOLD.map((c) => `${c} ${fp[0][c]}→${fp[1][c]}`).join(",")}`)
  const out = { program: { current: sum(fp[0]), candidate: sum(fp[1]) } }
  if (state.stage === "program") {
    const bad = worse(...fp)
    return { ...out, accept: out.program.candidate < out.program.current && !bad.length, why: bad.length ? `程序检查问题在 ${bad.join("、")} 上变多` : out.program.candidate >= out.program.current ? `验证样本的程序检查问题没有减少(${out.program.current} → ${out.program.candidate})` : "" }
  }
  if (out.program.candidate > out.program.current) return { ...out, accept: false, why: `程序检查问题从 ${out.program.current} 个增加到 ${out.program.candidate} 个` }
  const hold = touched.filter((c) => HOLD.includes(c))
  if (!hold.length) return { ...out, accept: false, why: "验证样本的页面都没有改动,无法验证" }
  // This stage's judge decides; the 需求 judge, an earlier stage in the 审美 stage, only must not lose.
  for (const kind of STAGES.slice(1, STAGES.indexOf(state.stage) + 1)) {
    log(`门禁 · ${STAGE_NAME[kind]}:验证页 ${hold.join(",")},3 轮 × 两种顺序`)
    // 需求 judge in its own stage: check the problems the change set out to fix first.
    await compare(base, cand, hold, 3, kind, { focus: kind === state.stage ? focusOf(change) : undefined })
    const g = summarize(base, cand, hold, 3, kind)
    out[kind] = g.perCase
    const verdicts = Object.values(g.perCase).map((x) => x.verdict)
    const lost = verdicts.filter((v) => v === "a").length, won = verdicts.filter((v) => v === "b").length, need = Math.ceil(HOLD.length / 2)
    log(`门禁 · ${STAGE_NAME[kind]}:${hold.map((c) => `${c} ${g.perCase[c].rounds.map(mark).join("")}`).join(",")}(赢 ${won} 份,输 ${lost} 份)`)
    if (lost) return { ...out, accept: false, why: `${STAGE_NAME[kind]}在验证样本上输了 ${lost} 份` }
    if (kind === state.stage) return { ...out, accept: won >= need, why: won < need ? `${STAGE_NAME[kind]}在验证样本上只赢 ${won} 份` : "" }
  }
}

// ---------- the loop ----------
generate(run("g0"), ALL, "g0")
const nextStage = (why, passed = false) => {
  const i = STAGES.indexOf(state.stage)
  // Every page passed this stage: what the Maintainer still had open for it is solved.
  const f = path.join(DIR, "experience.json")
  if (passed && fs.existsSync(f)) {
    const ex = JSON.parse(fs.readFileSync(f, "utf8"))
    for (const p of ex.problems) if (p.stage === STAGE_NAME[state.stage] && p.status !== "已解决") p.status = "已解决"
    fs.writeFileSync(f, JSON.stringify(ex, null, 1))
  }
  fs.appendFileSync(LOG, `\n## 「${STAGE_NAME[state.stage]}」阶段结束:${why}\n\n进入「${STAGE_NAME[STAGES[i + 1]]}」。\n`)
  log(`stage ${state.stage} → ${STAGES[i + 1]}: ${why}`)
  state.stage = STAGES[i + 1]
  state.stageRounds = 0
  state.rejected = 0
  save()
}

while (true) {
  if (state.round >= MAX_ROUNDS) { state.stop = `达到轮数上限 ${MAX_ROUNDS}`; break }
  if (CHECKPOINT && state.sinceCheckpoint >= CHECKPOINT) { state.stop = "人工检查点:请盲排当前版和 g0"; break }
  // A stage ends when every page passes it, or when it has run out of rounds.
  if (state.stage === "program") {
    log(`检查当前版 ${state.currentRun} 是否全部通过「程序检查」`)
    if (sum(findings(state.currentRun, ALL)) === 0) { nextStage("所有页面都通过", true); continue }
  }
  if (state.stage !== "aesthetic") {
    if (state.stageRounds >= STAGE_ROUNDS || state.rejected >= 3) { nextStage(state.rejected >= 3 ? "连续 3 个候选没通过" : `已跑 ${STAGE_ROUNDS} 轮`); continue }
  } else if (state.rejected >= 3) { state.stop = "连续 3 个候选未通过把关"; break }
  // The current pages, generalised in this stage (again after a component merge or a stage change).
  if (state.maintained?.run !== state.currentRun || state.maintained?.stage !== state.stage) {
    log(`归纳当前版 ${state.currentRun} 在「${STAGE_NAME[state.stage]}」这一步的问题(训练页 ${TRAIN.join(",")})`)
    if (state.stage !== "program") {
      // The first look in a judge stage: the current pages against a second generation of the same guide.
      const twin = `${state.currentRun}-twin`
      if (!fs.existsSync(path.join(ROOT, "traces", twin))) {
        log(`生成 ${twin}:按当前指南 ${state.current} 再写一遍训练页,用来和当前版比较`)
        execFileSync("node", [path.join(ROOT, "scripts", "generate.mjs"), "--run", twin, "--cases", TRAIN.join(","), "--data", path.join("skills", SK, "data"), "--guide", path.relative(ROOT, path.join(GUIDES, `${state.current}.md`)), "--version", state.current], { stdio: "inherit", cwd: ROOT })
      }
      state.judged = { ...state.judged, [state.stage]: {} }
      await judgeTrain(state.currentRun, twin, TRAIN, true)
      await maintain(`两版都按当前指南生成,都是当前版`)
    } else await maintain()
  }
  // A judge stage passes when the training pages have no open problem from it.
  if (state.stage !== "program" && !open((p) => p.stage === STAGE_NAME[state.stage]).length) {
    if (state.stage === "aesthetic") { state.stop = "训练页上没有算数的审美问题了"; break }
    nextStage("训练页上没有算数的需求问题", true)
    continue
  }
  const layout = open((p) => p.cause === "布局问题"), parts = open((p) => p.cause === "组件不够")
  if (!layout.length) {
    if (parts.length) { state.stop = `只剩「组件不够」的问题(${parts.map((p) => p.id).join("、")}),等组件分支:node scripts/component-loop.mjs propose`; break }
    if (state.stage === "aesthetic") { state.stop = "审美阶段没有可改的问题"; break }
    nextStage("训练样本上没有可改的问题(留出样本仍未全部通过)")
    continue
  }

  const k = state.round + 1, cand = `c${k}`, cr = run(cand)
  log(`━━ 第 ${k} 轮(${STAGE_NAME[state.stage]}):候选 ${cand},基于 ${state.current}(${state.currentRun})`)
  let change = state.pending?.name === cand ? state.pending.change : null
  if (!change) {
    change = await revise(cand)
    state.pending = { name: cand, change }
    save()
  }
  generate(cr, ALL, cand, state.currentRun, path.join(DIR, "changes", `${cand}.json`))
  const lines = Object.fromEntries(ALL.map((c) => [c, meta(cr, c).changedLines ?? 0]))
  const touched = ALL.filter((c) => lines[c] > 0)
  const g = await gate(state.currentRun, cr, touched, change)
  // What the change did on the training pages, accepted or not: a tried change for the next Reviser.
  const trainTouched = touched.filter((c) => TRAIN.includes(c))
  log(`门禁结果:${g.accept ? "采用" : `未采用(${g.why})`};接着在训练页 ${trainTouched.join(",") || "(都没改动)"} 上看这次改动的效果`)
  if (state.stage !== "program" && trainTouched.length) await judgeTrain(state.currentRun, cr, trainTouched, g.accept, focusOf(change))
  const tried = trainTouched.length ? await attempt({ skill: SK, stage: state.stage, base: state.currentRun, run: cr, candidate: cand, change, accepted: g.accept, why: g.why, cases: trainTouched }) : null

  const base = state.current, baseRun = state.currentRun, stage = state.stage
  if (g.accept) {
    state.versions++
    const v = `g${state.versions}`
    fs.writeFileSync(path.join(GUIDES, `${v}.md`), read(path.join(GUIDES, `${cand}.md`)).replace(/^# 输出指南 .*$/m, `# 输出指南 · ${NAME} ${v}`))
    state.current = v
    state.currentRun = cr
    state.rejected = 0
    state.sinceCheckpoint++
  } else state.rejected++
  state.stageRounds++
  // The problem list is about the current run: refreshed from this round's comparisons when the
  // candidate became the current run (judge stages); a rejected candidate leaves only its tried change.
  if (state.stage !== "program") {
    if (g.accept && trainTouched.length) await maintain(`当前版是 ${state.currentRun}`)
    else state.maintained = { run: state.currentRun, stage: state.stage }
  }
  fs.appendFileSync(LOG, `
## 候选 ${cand}(基于 ${base},${STAGE_NAME[stage]}阶段)  结果:${g.accept ? `采用,成为 ${state.current}` : "未采用"}

改动:规则 ${change.rule}
${change.old ? `  原文:${change.old.trim()}\n` : "  (新增规则)\n"}  改为:${change.new.trim()}
依据:${(change.basis ?? []).join("、")}。${change.why}
改动行数(Page.tsx,相对当前版):${ALL.map((c) => `${c} ${lines[c]}`).join(",")}
验证样本程序检查问题:当前 ${g.program.current} 个,候选 ${g.program.candidate} 个
${["function", "aesthetic"].filter((k) => g[k]).map((k) => `验证样本${STAGE_NAME[k]}(候选对当前版,3 轮,每轮两种顺序都选同一版才算):${HOLD.map((c) => (g[k][c] ? `${c} ${g[k][c].rounds.map(mark).join("")}` : `${c} 未改动`)).join(",")}\n`).join("")}${g.accept ? "" : `没采用的原因:${g.why}\n`}${tried ? `训练页上的效果(Maintainer):解决了 ${tried.fixed.join("、") || "无"};没解决 ${tried.unfixed.join("、") || "无"};新问题:${tried.new.join(";") || "无"}。${tried.lesson}\n` : ""}`)
  state.history.push({ round: k, stage, candidate: cand, base, baseRun, change, accept: g.accept, why: g.why, lines, gate: g })
  state.round = k
  delete state.pending
  save()
  log(`round ${k} (${stage}): ${cand} ${g.accept ? "accepted as " + state.current : "rejected (" + g.why + ")"}`)
}
save()
log(`stopped: ${state.stop}; current ${state.current} (${state.currentRun}), stage ${state.stage}`)
