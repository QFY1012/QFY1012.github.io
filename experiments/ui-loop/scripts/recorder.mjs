// The Recorder of one Skill: keeps the change record (skills/<skill>/record.json, rendered to
// changelog.md). The Maintainer keeps only the current problems; this agent writes, for every
// candidate, accepted or not, what the change made the pages do and whether that worked:
// 成功 / 失败 / 没效果, what it solved and what it broke on the training pages, counting only what
// both orders of the comparison say. The Reviser reads the record before changing a rule.
// Of the held-out samples only the gate's results are written down (by the code, not the agent).
//
//   source judge.env && node scripts/recorder.mjs --skill flow --backfill     record state.json's history again
import fs from "node:fs"
import path from "node:path"
import { call } from "../../ui-judge/scripts/pairwise-judge.mjs"
import { observations } from "./compare.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const read = (f) => fs.readFileSync(f, "utf8")
const STAGE = { program: "程序检查", function: "需求 judge", aesthetic: "审美 judge" }
const list = (x) => (Array.isArray(x) ? x : x ? [String(x)] : [])

const SYSTEM = (name) => `你是「${name}」这个 Skill 的修改记录员。Reviser 每次改输出指南的一条规则,生成 Agent 按新规则改页面,然后在训练页上比较改动前后两版,每页按两种顺序各比一次。你给这次改动写一条记录,下次改规则的人先读它:失败的做法不再试,成功的做法保留。

1. 做法:一句话写这次让页面怎么做,写读者看得懂的话,不抄规则原文。
2. 效果:只记两种顺序都这么说的,只有一种顺序说的不算。解决了什么、带出了什么新问题,一条一句话,写清在页面哪一节。
3. 结论:成功(改后更好,带出的问题比解决的轻)、失败(改后更差,或带出的问题比解决的重)、没效果(两版差不多,或两种顺序说法不一致)。门禁采没采用另外记,不影响你的结论。
4. 教训:一句话,下次改规则该保留什么、避开什么。

只输出 JSON:{"practice":"一句话","result":"成功 或 失败 或 没效果","solved":["一句话"],"broke":["一句话"],"lesson":"一句话"}`

// Each order's judgement with A/B replaced by 改动前/改动后, so the two orders read alike.
function judgeEvidence(stage, base, run, cases) {
  const side = (o, v) => (v === "A" ? (o.A === base ? "改动前" : "改动后") : v === "B" ? (o.B === base ? "改动前" : "改动后") : v)
  return cases.map((c) => {
    const os = observations(base, run, [c], 1, stage).map((o) => {
      const j = o.judgement
      return {
        顺序: o.order === "AB" ? "改动前先给" : "改动后先给",
        更好: side(o, j.better),
        理由: j.reason,
        ...(j["1"] ? { 各条: Object.fromEntries(Object.keys(j).filter((k) => /^\d+$/.test(k)).map((k) => [k, { ...j[k], better: side(o, j[k].better) }])) } : {}),
        ...(j.checks ? { 上一轮的问题: list(j.checks).map((k) => ({ 问题: k.problem, 改动前: o.A === base ? k.A : k.B, 改动后: o.A === base ? k.B : k.A })) } : {}),
        ...(j.worse ? { 更不方便: list(j.worse).map((w) => ({ 哪版: side(o, w.version), 哪一节: w.where, 为什么: w.why })) } : {}),
        剩余问题: list(j.next),
      }
    })
    return `<页面 ${c}>\n${JSON.stringify(os, null, 1)}\n</页面 ${c}>`
  }).join("\n\n")
}
function checkEvidence(base, run, cases) {
  const f = (r, c) => path.join(ROOT, "traces", r, c, "checks.json")
  const checks = (r, c) => (fs.existsSync(f(r, c)) ? read(f(r, c)) : "[]")
  return cases.map((c) => `<页面 ${c}>\n<改动前的程序检查>\n${checks(base, c)}\n</改动前的程序检查>\n<改动后的程序检查>\n${checks(run, c)}\n</改动后的程序检查>\n</页面 ${c}>`).join("\n\n")
}

// The gate's results on the held-out samples, in one line per check.
const mark = (x) => (x === "b" ? "赢" : x === "a" ? "输" : "平")
function gateLines(g, hold) {
  return [`程序检查问题 ${g.program.current} → ${g.program.candidate} 个`,
    ...["function", "aesthetic"].filter((k) => g[k]).map((k) => `${STAGE[k]}(候选对当前版,3 轮):${hold.map((c) => (g[k][c] ? `${c} ${g[k][c].rounds.map(mark).join("")}` : `${c} 未改动`)).join(",")}`)]
}

function load(dir) {
  const f = path.join(dir, "record.json")
  return fs.existsSync(f) ? JSON.parse(read(f)) : { entries: [] }
}
function save(dir, name, rec) {
  fs.writeFileSync(path.join(dir, "record.json"), JSON.stringify(rec, null, 1))
  const entry = (e) => e.stageEnd
    ? `## 「${e.stageEnd}」阶段结束:${e.why}\n\n进入「${e.next}」。`
    : [`## ${e.candidate}(${e.stage},基于 ${e.base})· ${e.result ?? "未记录"} · 门禁${e.accepted ? "采用" : "未采用"}`, "",
      `- 做法:${e.practice ?? "(训练页都没改动)"}`,
      `- 规则:${e.rule}${e.old ? "(改写)" : "(新增)"},针对 ${list(e.basis).join("、") || "无"}`,
      ...(e.practice ? [`- 解决了:${list(e.solved).join(";") || "无"}`, `- 带出的问题:${list(e.broke).join(";") || "无"}`] : []),
      `- 门禁(验证页):${e.gate.join(";")}${e.accepted ? "" : `。没采用:${e.why}`}`,
      ...(e.lesson ? [`- 教训:${e.lesson}`] : [])].join("\n")
  fs.writeFileSync(path.join(dir, "changelog.md"), [`# 修改记录 · ${name}`, "",
    "修改记录员给每个候选写一条:做法、结论(成功 / 失败 / 没效果,只看训练页上两种顺序都这么说的效果)、教训;门禁结果另记。", "",
    ...rec.entries.map(entry), ""].join("\n\n").replace(/\n{3,}/g, "\n\n"))
}

export async function record({ skill, stage, base, baseRun, run, candidate, change, gate, cases }) {
  const split = JSON.parse(read(path.join(ROOT, "skills", "split.json")))[skill]
  const dir = path.join(ROOT, "skills", skill)
  const e = { candidate, stage: STAGE[stage], base, rule: change.rule, old: !!change.old, basis: list(change.basis), accepted: gate.accept, why: gate.why ?? "", gate: gateLines(gate, split.holdout) }
  if (cases.length) {
    const user = `<改动 ${candidate}>\n规则 ${change.rule}${change.old ? `\n原文:${change.old}` : "(新增)"}\n改为:${change.new}\n针对的问题:${JSON.stringify(change.problems ?? list(change.basis), null, 1)}\nReviser 的理由:${change.why}\n</改动>\n\n<训练页上改动前后的比较,${STAGE[stage]}>\n${stage === "program" ? checkEvidence(baseRun, run, cases) : judgeEvidence(stage, baseRun, run, cases)}\n</训练页>`
    process.stdout.write(`\n── 修改记录员 · ${split.name} · ${candidate}\n`)
    const r = await call(SYSTEM(split.name), [{ type: "text", text: user }], { key: process.env.DEEPSEEK_API_KEY, label: `修改记录员 ${split.name}`, onThink: (s) => process.stdout.write(`[思考中… ${s} 秒]\n`), onText: (t) => process.stdout.write(t) })
    process.stdout.write("\n")
    Object.assign(e, { practice: r.json.practice ?? "", result: r.json.result ?? "", solved: list(r.json.solved), broke: list(r.json.broke), lesson: r.json.lesson ?? "" })
  }
  const rec = load(dir)
  rec.entries = [...rec.entries.filter((x) => x.candidate !== candidate), e]
  save(dir, split.name, rec)
  return e
}

// A stage ended: one line in the record.
export function recordStage(skill, stage, next, why) {
  const split = JSON.parse(read(path.join(ROOT, "skills", "split.json")))[skill]
  const dir = path.join(ROOT, "skills", skill)
  const rec = load(dir)
  rec.entries.push({ stageEnd: STAGE[stage], next: STAGE[next], why })
  save(dir, split.name, rec)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (k) => {
    const i = process.argv.indexOf(`--${k}`)
    return i > 0 ? process.argv[i + 1] : null
  }
  const skill = arg("skill")
  if (!process.argv.includes("--backfill")) throw new Error("usage: --skill <skill> --backfill")
  const dir = path.join(ROOT, "skills", skill)
  const state = JSON.parse(read(path.join(dir, "state.json")))
  const train = JSON.parse(read(path.join(ROOT, "skills", "split.json")))[skill].train
  // The old changelog.md gives the order of stage ends and candidates (state.json keeps no stage ends).
  const old = read(path.join(dir, "changelog.md")).match(/^## .*$/gm) ?? []
  const key = Object.fromEntries(Object.entries(STAGE).map(([k, v]) => [v, k]))
  console.log(`按 state.json 的 ${state.history.length} 个候选重写 ${skill} 的修改记录`)
  fs.writeFileSync(path.join(dir, "record.json"), JSON.stringify({ entries: [] }))
  for (const line of old) {
    const s = line.match(/^## 「(.+)」阶段结束:(.+)$/)
    if (s) { const k = key[s[1]]; recordStage(skill, k, Object.keys(STAGE)[Object.keys(STAGE).indexOf(k) + 1], s[2]); continue }
    const h = state.history.find((x) => line.startsWith(`## 候选 ${x.candidate}(`))
    if (!h) continue
    const cases = train.filter((c) => (h.lines?.[c] ?? 0) > 0)
    const e = await record({ skill, stage: h.stage, base: h.base, baseRun: h.baseRun, run: `${skill}-${h.candidate}`, candidate: h.candidate, change: h.change, gate: h.gate, cases })
    console.log(`${h.candidate}:${e.result || "训练页没改动"} · 门禁${e.accepted ? "采用" : "未采用"}`)
  }
}
