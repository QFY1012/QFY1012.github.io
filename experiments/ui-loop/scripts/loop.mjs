// The output-layer loop: improve design.md from what the judge says about the pages.
//
//   source judge.env && node scripts/loop.mjs [--max-rounds 10]
//
// Each round (state in loop-state.json, so a stopped run resumes where it was):
//   1. Reviser    reads design vN, experience.md and changelog.md; changes one rule in
//                 B or C (rewrite or add) → candidate design designs/c<k>.md
//   2. Generate   the agent builds every training and validation report with the candidate
//   3. Judge      candidate against current, rubric31, both orders:
//                 training reports 1 round (to learn from), validation reports 3 rounds (the gate)
//   4. Maintainer reads the training judgements and program checks → experience.md
//   5. Gate       accept when the candidate loses no validation report, wins at least half
//                 of them, and adds no program-check findings; else keep vN
//   6. Record     changelog.md entry either way
// Before round 1, v0 is generated twice on the training reports and the two are compared:
// where two pages from the same rules differ, the rules leave something open.
// Stops after 3 rejected candidates in a row, after --max-rounds, or at a human checkpoint
// (every 2 accepted versions), where the person blind-ranks current against v0.
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { call } from "../../ui-judge/scripts/pairwise-judge.mjs"
import { compare, summarize, observations } from "./compare.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const TRAIN = ["ops", "ab", "sales", "survey", "review", "hiring"]
const VALID = ["finance", "cs", "logistics", "energy"]
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const MAX_ROUNDS = Number(arg("max-rounds", "10"))
const KEY = process.env.DEEPSEEK_API_KEY
const STATE = path.join(ROOT, "loop-state.json")
const DESIGNS = path.join(ROOT, "designs")
const EXP = path.join(ROOT, "experience.md")
const LOG = path.join(ROOT, "changelog.md")
const read = (f) => fs.readFileSync(f, "utf8")
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

const state = fs.existsSync(STATE) ? JSON.parse(read(STATE)) : { current: "v0", versions: 0, round: 0, rejected: 0, sinceCheckpoint: 0, history: [] }
const save = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 1))
fs.mkdirSync(DESIGNS, { recursive: true })
if (!fs.existsSync(path.join(DESIGNS, "v0.md"))) fs.copyFileSync(path.join(ROOT, "design.md"), path.join(DESIGNS, "v0.md"))

function generate(run, cases) {
  const pending = cases.filter((c) => !fs.existsSync(path.join(ROOT, "traces", run, c, "meta.json")))
  if (!pending.length) return
  log(`generate ${run}: ${pending.join(",")}`)
  execFileSync("node", [path.join(ROOT, "scripts", "generate.mjs"), "--run", run, "--cases", pending.join(","), "--design", path.join("designs", `${run.replace(/b$/, "")}.md`), "--version", run], { stdio: "inherit", cwd: ROOT })
}
const findings = (run, cases) => cases.reduce((n, c) => n + (JSON.parse(read(path.join(ROOT, "traces", run, c, "meta.json"))).checks?.length ?? 0), 0)
const checksOf = (run, cases) => Object.fromEntries(cases.map((c) => [c, JSON.parse(read(path.join(ROOT, "traces", run, c, "meta.json"))).checks ?? []]))

// ---------- Maintainer ----------
async function maintain(a, b, label) {
  const obs = observations(a, b, TRAIN, 1)
  const sys = `你是设计规范的维护者。生成 Agent 按设计规范 design.md 为每份报告写页面;judge 把同一份报告的两版页面两两比较(按两种顺序各判一次),逐条写下观察。你的任务是从这些比较里归纳经验:哪些做法让页面输了、哪些让页面赢了,以及和 design.md 的哪条规则有关(规则写得不清楚、缺规则,或规则本身不好)。

已有的经验库会一并给你。更新它:新出现的模式加一条;已有的模式再次出现就补上证据;被新证据推翻的改写。每条经验必须有证据(哪份报告、哪一版、judge 的哪条观察),没有证据的不要写。只归纳页面设计上的问题,不评论数据内容。

只输出 JSON:{"entries":[{"id":"E-01","kind":"失败模式 或 成功模式","pattern":"一句话描述做法和后果","rule":"相关规则编号,如 C5;没有对应规则写 无","evidence":["ops:v0 第 2 屏…"],"count":出现次数}]}`
  const user = `<design.md>\n${read(path.join(DESIGNS, `${state.current}.md`))}\n</design.md>\n\n<经验库>\n${fs.existsSync(EXP) ? read(EXP) : "(空)"}\n</经验库>\n\n<本轮比较:${label}>\n${JSON.stringify(obs, null, 1)}\n</本轮比较>\n\n<程序检查>\n${JSON.stringify({ [a]: checksOf(a, TRAIN), [b]: checksOf(b, TRAIN) }, null, 1)}\n</程序检查>`
  const r = await call(sys, [{ type: "text", text: user }], { key: KEY })
  const md = ["# 经验库", "", "Maintainer 从 judge 的比较和程序检查里归纳,每轮更新。Reviser 改规范前先读。", ""]
  for (const e of r.json.entries ?? []) md.push(`- **${e.id}**(${e.kind},规则 ${e.rule},${e.count} 次):${e.pattern}`, `  - 证据:${(e.evidence ?? []).join(";")}`)
  fs.writeFileSync(EXP, md.join("\n") + "\n")
  log(`maintainer: ${(r.json.entries ?? []).length} entries`)
}

// ---------- Reviser ----------
async function revise(name) {
  const cur = read(path.join(DESIGNS, `${state.current}.md`))
  const sys = `你负责修改设计规范 design.md。生成 Agent 按它为报告写页面,judge 用两两比较判断新旧两版谁更好。你每次只改一条规则,改动在验证报告上通过把关才会被采用。

要求:
- 只改 B、C 两部分;A 部分(基础)和组件库固定不变。
- 只改一处:改写一条已有规则,或在 B、C 末尾新增一条规则。
- 依据经验库里证据最多、还没解决的问题;写明依据哪几条经验。
- 先读修改记录:被拒绝过的改法不要重复;方向对但带出新问题的,在原改法上补足。
- 规则要写成生成 Agent 能照着做、能检查的具体做法(组件、props、列数、间距),不写"美观""协调"这类说法。

只输出 JSON:{"rule":"规则编号(新增的写新编号,如 C7)","old":"被改写的那一整行原文(必须和 design.md 里的一行完全一致;新增规则写空字符串)","new":"新的一整行,格式同 design.md(以 - **编号 名称**: 开头)","basis":["E-01"],"why":"一两句话"}`
  const user = `<design.md 当前版 ${state.current}>\n${cur}\n</design.md>\n\n<经验库>\n${read(EXP)}\n</经验库>\n\n<修改记录>\n${read(LOG)}\n</修改记录>`
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = (await call(sys, [{ type: "text", text: user }], { key: KEY })).json
    let next
    if (r.old) {
      if (!cur.includes(r.old) || /^- \*\*A\d/.test(r.old.trim())) continue
      next = cur.replace(r.old, r.new)
    } else {
      if (!/^- \*\*[BC]\d+/.test(r.new.trim())) continue
      const sec = r.new.trim().startsWith("- **B") ? "\n## C 页面组装" : null
      next = sec ? cur.replace(sec, `${r.new.trim()}\n${sec}`) : cur.trimEnd() + "\n" + r.new.trim() + "\n"
    }
    next = next.replace(/^# 报告页面设计规范 .*$/m, `# 报告页面设计规范 ${name}(候选,基于 ${state.current})`)
    fs.writeFileSync(path.join(DESIGNS, `${name}.md`), next)
    log(`reviser ${name}: ${r.rule} — ${r.why}`)
    return r
  }
  throw new Error("reviser gave no applicable change in 3 attempts")
}

// ---------- the loop ----------
generate("v0", [...TRAIN, ...VALID])
if (!fs.existsSync(EXP)) {
  // Two generations from the same v0: where they differ, the rules leave something open.
  generate("v0b", TRAIN)
  await compare("v0", "v0b", TRAIN, 1)
  await maintain("v0", "v0b", "同一份 v0 规范生成两次,两版的差别")
}

while (state.round < MAX_ROUNDS) {
  if (state.rejected >= 3) { state.stop = "连续 3 个候选未通过把关"; break }
  if (state.sinceCheckpoint >= 2) { state.stop = "人工检查点:请盲排当前版和 v0"; break }
  const k = state.round + 1
  const cand = `c${k}`
  let change = state.pending?.name === cand ? state.pending.change : null
  if (!change) {
    change = await revise(cand)
    state.pending = { name: cand, change }
    save()
  }
  generate(cand, [...TRAIN, ...VALID])
  await compare(state.current, cand, TRAIN, 1)
  const gate = await compare(state.current, cand, VALID, 3)
  const train = summarize(state.current, cand, TRAIN, 1)
  const fa = findings(state.current, [...TRAIN, ...VALID]), fb = findings(cand, [...TRAIN, ...VALID])
  const verdicts = Object.values(gate.perCase).map((x) => x.verdict)
  const lost = verdicts.filter((v) => v === "a").length, won = verdicts.filter((v) => v === "b").length
  const accept = lost === 0 && won >= Math.ceil(VALID.length / 2) && fb <= fa
  const why = accept ? "" : lost ? `验证报告输了 ${lost} 份` : won < Math.ceil(VALID.length / 2) ? `验证报告只赢 ${won} 份` : `程序检查问题从 ${fa} 个增加到 ${fb} 个`
  await maintain(state.current, cand, `候选 ${cand} 对当前版 ${state.current}`)

  const base = state.current
  if (accept) {
    state.versions++
    const v = `v${state.versions}`
    fs.copyFileSync(path.join(DESIGNS, `${cand}.md`), path.join(DESIGNS, `${v}.md`))
    fs.writeFileSync(path.join(DESIGNS, `${v}.md`), read(path.join(DESIGNS, `${v}.md`)).replace(/^# 报告页面设计规范 .*$/m, `# 报告页面设计规范 ${v}`))
    fs.cpSync(path.join(ROOT, "traces", cand), path.join(ROOT, "traces", v), { recursive: true })
    state.current = v
    state.rejected = 0
    state.sinceCheckpoint++
  } else state.rejected++
  const fmt = (s) => Object.entries(s.perCase).map(([c, x]) => `${c} ${x.rounds.map((r) => (r === "b" ? "赢" : r === "a" ? "输" : "分")).join("")}`).join(",")
  fs.appendFileSync(LOG, `
## 候选 ${cand}(基于 ${base})  结果:${accept ? `采用,成为 ${state.current}` : "未采用"}

改动:规则 ${change.rule}
${change.old ? `  原文:${change.old.trim()}\n` : "  (新增规则)\n"}  改为:${change.new.trim()}
依据:${(change.basis ?? []).join("、")}。${change.why}
训练对比(候选对当前,1 轮):赢 ${train.wins.b} / 输 ${train.wins.a} / 拿不定 ${train.wins.split}
验证对比(3 轮,每轮两种顺序都选同一版才算):${fmt(gate)};合计赢 ${gate.wins.b} / 输 ${gate.wins.a} / 拿不定 ${gate.wins.split}
程序检查问题:当前 ${fa} 个,候选 ${fb} 个
${accept ? "" : `没采用的原因:${why}\n`}`)
  state.history.push({ round: k, candidate: cand, base, change, accept, gate: gate.perCase, wins: gate.wins, train: train.wins, findings: { current: fa, candidate: fb } })
  state.round = k
  delete state.pending
  save()
  log(`round ${k}: ${cand} ${accept ? "accepted as " + state.current : "rejected (" + why + ")"}`)
}
if (!state.stop && state.round >= MAX_ROUNDS) state.stop = `达到轮数上限 ${MAX_ROUNDS}`
save()
log(`stopped: ${state.stop}; current ${state.current}`)
