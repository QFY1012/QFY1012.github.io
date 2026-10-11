// The component branch. Problems that the Maintainer generalises from any of the three stages
// (program checks, the 需求 judge, the 审美 judge) as 组件不够 (skills/<skill>/experience.json)
// go to the component agent. It adds what
// is missing, built from shadcn/ui the way shadcn builds things (small composable parts, no
// configuration props), in the style of the existing components, and draws a demo page. A person
// reviews the demo: approves it, sends feedback for another round, or edits the code directly.
// Nothing reaches the shared library before approval.
//
//   node scripts/component-loop.mjs propose                         the agent builds k<n> and its demo
//   node scripts/component-loop.mjs revise k1 "意见"                 another round with the reviewer's feedback
//   node scripts/component-loop.mjs approve k1                      merge; every Skill's pages are edited for it
//   node scripts/component-loop.mjs reject k1 "原因"                 the next proposal reads it
//
// The work happens in a copy of the library, traces/_components/k<n>/: app/ (the library), shadcn/
// (vendor/shadcn, read-only reference), components.md, and one sample the problems were seen on.
// A reviewer who edits the code directly edits traces/_components/k<n>/app and then approves.
// Program checks run on the demo page and on the component code before the review.
// Review material: library/k<n>.md and library/k<n>-demo.png. Every version is kept in
// library/k<n>/r<round>/ (the demo page and its screenshots, the patch, the review notes, the
// feedback that started it), so the whole process can be shown later. Everything is in library/changelog.md.
import fs from "node:fs"
import path from "node:path"
import { execFileSync, spawnSync } from "node:child_process"
import { runAgent, SHOOT, SANDBOX } from "./agent.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const LIB = path.join(ROOT, "library")
const STATE = path.join(LIB, "state.json")
const LOG = path.join(LIB, "changelog.md")
const SHADCN = path.join(ROOT, "vendor", "shadcn", "new-york-v4")
const read = (f) => fs.readFileSync(f, "utf8")
const [cmd, k, note] = process.argv.slice(2)
fs.mkdirSync(LIB, { recursive: true })
const state = fs.existsSync(STATE) ? JSON.parse(read(STATE)) : { next: 1, proposals: {} }
const save = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 1))
if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, "# 组件库修改记录\n\n组件库是公共层,改动影响所有 Skill。每一项改动由组件 Agent 做出示例,人工审批后才合并;没采用的也记在这里。\n")
const split = JSON.parse(read(path.join(ROOT, "skills", "split.json")))
const wsOf = (name) => path.join(ROOT, "traces", "_components", name)
const privOf = (name, n) => path.join(ROOT, "traces", "_components", ".private", `${name}-${n}`)

const designA = read(path.join(ROOT, "design.md")).match(/## A 基础[\s\S]*?(?=\n## B)/)?.[0] ?? ""
export const SYSTEM = (requests, rejected) => `你维护报告页面的组件库。生成 Agent 用组件库写报告页面;页面经过程序检查、需求 judge、审美 judge,Maintainer 把检测意见归纳成问题,下面这些被归为「组件不够」:组件库缺能力,怎么排都解决不了。你要补上这项能力。

工作目录:
- app/src/components/report/:报告组件(index.tsx 导出,内容组件的绘制在 render.tsx)。生成 Agent 只从 @/components/report import。
- app/src/components/ui/:shadcn/ui 的基础组件。
- app/src/index.css:tokens(颜色、字体、圆角),不能改。
- components.md:组件库说明,生成 Agent 只读这份说明来用组件。
- shadcn/:shadcn/ui new-york-v4 全部组件的源码(只读参考,不能联网);shadcn/index.json 列出每个组件的文件和依赖,missing 不为空的不能用。
- data.json 和 assets/:一份真实的样本数据,用来做演示页。

规则:
1. 只改需要的地方:补上缺的能力,已有的组件和它们的用法一律不改。
2. 写法和 shadcn 一样:做成几个可以组合的小部件,每个部件是一个函数组件,带 data-slot,接受 className 和原生属性(...props),用 cn() 合并 className。不加用来切换样式或结构的配置 props,怎么组合由页面决定。
3. 先找 shadcn/ 里有没有能用的部件:有就复制到 app/src/components/ui/,再按规范改样式,复制来的部件和你新写的代码一样必须全部符合规范(shadcn 原版带阴影、底色,有的字号不在规范里);没有合适的,才直接用 Radix 原语(import { X } from "radix-ui")写。
4. 风格和现有组件一致:看 report/render.tsx 和 report/index.tsx 里现有组件的字号、文字灰度、线条、间距、对齐,照着用;颜色、字号只用 token 类名和规范 A 部分的几级;不加卡片、底色和阴影。
5. 新部件从 app/src/components/report/index.tsx 导出。
6. 在 components.md 里补上:有哪些部件、什么时候用、最小的组合示例。
7. 程序检查和代码检查是为了发现问题,不是要绕过的关卡:不要为了让检查通过去改写法、藏元素,也不要在文件系统里找检查脚本或参考答案。觉得检查结果和需求冲突,照需求做,在结束时的说明里写清楚冲突在哪。

工具只能访问工作目录,bash 在沙箱里运行、不能联网。

<规范 A 部分(页面和组件共用的基础)>
${designA}
</规范 A 部分>

<组件不够的问题>
${requests.map((r) => `- [${r.skill},${r.stage},${r.pages.length} 页] ${r.problem}\n  场景:${r.scenes}`).join("\n")}
</组件不够的问题>${rejected ? `

<之前没被采用的组件改动>
${rejected}
</之前没被采用的组件改动>` : ""}`

export const PROMPT = `请补上上面的问题需要的组件能力:
1. 读 components.md、现有报告组件的代码和 shadcn/index.json,决定用哪个 shadcn 部件(或 Radix 原语)、拆成哪几个部件。
2. 写组件,更新 components.md。
3. 写演示页 Page.tsx:用 data.json 和 assets/ 的真实数据,把原来呈现不了的内容用新部件呈现出来,其余内容用现有组件排,让人能看出新部件和现有组件放在一起是否统一。
4. 用 bash 运行 \`node \$SHOOT .\` 构建、截图、检查,用 read 看 thumb.png 和切块,不对就改。检查最多运行 6 次。
5. 结束时说明:新部件叫什么、各管什么、来自哪个 shadcn 部件或 Radix 原语、怎么组合;需求里哪些没做及原因。`

// The Maintainer's open 组件不够 problems of every Skill.
function collect() {
  return Object.entries(split).flatMap(([sk, sp]) => {
    const f = path.join(ROOT, "skills", sk, "experience.json")
    return fs.existsSync(f) ? JSON.parse(read(f)).problems.filter((p) => p.cause === "组件不够" && p.status !== "已解决").map((p) => ({ ...p, sk, skill: sp.name })) : []
  })
}

const diff = (a, b) => spawnSync("git", ["diff", "--no-index", "--no-color", a, b], { encoding: "utf8" }).stdout.replaceAll(path.dirname(a), "").replaceAll(path.dirname(b), "")
const libDiff = (ws) => diff(path.join(ROOT, "app", "src"), path.join(ws, "app", "src")) + diff(path.join(ROOT, "components.md"), path.join(ws, "components.md"))

// Program checks on the component code: existing code and tokens unchanged; every new line
// (files copied from shadcn included) uses tokens and the type scale, no shadows or backgrounds.
function lintComponents(ws) {
  const out = []
  const src = path.join(ws, "app", "src")
  const files = spawnSync("git", ["diff", "--no-index", "--name-only", path.join(ROOT, "app", "src"), src], { encoding: "utf8" }).stdout.split("\n").filter((f) => f.startsWith(src) && /\.(tsx?|css)$/.test(f))
  for (const f of files) {
    const rel = path.relative(src, f)
    if (rel === "index.css") { out.push({ file: rel, msg: "改了 tokens(index.css);tokens 不能改" }); continue }
    const old = path.join(ROOT, "app", "src", rel)
    const before = fs.existsSync(old) ? read(old).split("\n") : []
    const now = read(f).split("\n")
    const nowSet = new Set(now), beforeSet = new Set(before)
    const removed = before.filter((l) => l.trim() && !nowSet.has(l))
    if (removed.length) out.push({ file: rel, msg: `删改了 ${removed.length} 行已有代码(第一处:${removed[0].trim().slice(0, 80)});已有组件不能改,只能新增` })
    now.forEach((line, i) => {
      if (beforeSet.has(line)) return
      const add = (msg) => out.push({ file: rel, line: i + 1, msg })
      if (/#[0-9a-fA-F]{3,8}\b|\b(?:oklch|rgba?|hsla?)\(/.test(line)) add("写了颜色值;颜色只能用 tokens(text-foreground、text-muted-foreground、border-border、text-destructive 等)")
      const c = line.match(/\b(?:text|bg|border|fill|stroke|ring|outline)-(?:red|green|blue|slate|gray|zinc|neutral|stone|orange|amber|yellow|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d+)?\b/)
      if (c) add(`颜色类名 ${c[0]} 不是 token`)
      for (const m of line.matchAll(/\btext-(base|lg|4xl|6xl|7xl|8xl|9xl)\b/g)) add(`字号 ${m[0]} 不在规范的几级里`)
      for (const m of line.matchAll(/\bshadow(?:-\w+)?\b/g)) if (m[0] !== "shadow-none") add(`用了阴影 ${m[0]}`)
      if (/\bbg-(card|muted|accent|secondary|popover)\b/.test(line)) add("加了底色;规范不用卡片和底色")
    })
  }
  return out
}

const shoot = (ws) => {
  if (!fs.existsSync(path.join(ws, "Page.tsx"))) return [{ check: "演示页", msg: "没有写出演示页 Page.tsx" }]
  execFileSync(SANDBOX, [ws, `node ${SHOOT} .`], { stdio: "ignore" })
  return JSON.parse(read(path.join(ws, "checks.json")))
}

// Runs the agent, then the checks; findings go back to the agent at most twice.
async function build(name, prompt) {
  const p = state.proposals[name]
  const ws = wsOf(name)
  const sys = SYSTEM(JSON.parse(read(path.join(ws, "requests.json"))), p.rejected ?? "")
  const round = (p.rounds?.length ?? 0) + 1
  let run = await runAgent({
    name, ws, priv: privOf(name, round), system: sys, maxShoots: 6, prompt,
    nudges: ["你还没有写出演示页 Page.tsx。请写出并运行检查。"], missing: () => !fs.existsSync(path.join(ws, "Page.tsx")),
  })
  let checks, lint
  for (let back = 0; ; back++) {
    fs.renameSync(path.join(ws, "session.jsonl"), path.join(ws, `session-${round}${back ? `-${back}` : ""}.jsonl`))
    checks = shoot(ws)
    lint = lintComponents(ws)
    if ((!checks.length && !lint.length) || back === 2) break
    console.log(`${name}: back to the agent (${checks.length} demo checks, ${lint.length} component checks)`)
    run = await runAgent({
      name, ws, priv: privOf(name, `${round}-${back + 1}`), system: sys, maxShoots: 4,
      prompt: `检查出下面的问题,请修改组件和演示页,改完运行检查。\n\n<演示页程序检查>\n${JSON.stringify(checks, null, 1)}\n</演示页程序检查>\n\n<组件代码检查>\n${JSON.stringify(lint, null, 1)}\n</组件代码检查>`,
    })
  }
  if (fs.existsSync(path.join(ws, "thumb.png"))) fs.copyFileSync(path.join(ws, "thumb.png"), path.join(LIB, `${name}-demo.png`))
  const patch = libDiff(ws)
  fs.writeFileSync(path.join(LIB, `${name}.patch`), patch)
  p.rounds = [...(p.rounds ?? []), { feedback: prompt === PROMPT ? null : note, summary: run.summary, checks, lint, usage: run.usage, seconds: run.seconds }]
  p.status = "待审"
  save()
  const list = (xs) => (xs.length ? xs.map((x) => `- ${x.file ? `${x.file}${x.line ? `:${x.line}` : ""} ` : ""}${x.msg}`).join("\n") : "无问题")
  fs.writeFileSync(path.join(LIB, `${name}.md`), `# 组件改动 ${name}(待审,第 ${round} 版)

组件 Agent 做出的示例,合并前需要人工审批:
- 通过:\`node scripts/component-loop.mjs approve ${name}\`
- 写意见让 Agent 再改一版:\`node scripts/component-loop.mjs revise ${name} "意见"\`
- 自己改代码:直接改 \`traces/_components/${name}/app/\`,改完再 approve
- 不采用:\`node scripts/component-loop.mjs reject ${name} "原因"\`

## 示例效果

演示页用 ${p.demo} 的真实数据,新部件和现有组件放在同一页:

![演示页](${name}-demo.png)

切块截图在 \`traces/_components/${name}/tile-*.png\`。

## 组件 Agent 的说明

${run.summary}

## 需求(Maintainer 归纳的「组件不够」问题,${p.requests} 条)

${JSON.parse(read(path.join(ws, "requests.json"))).map((r) => `- **${r.skill} ${r.id}**(${r.stage},${r.pages.join("、")}):${r.problem}\n  - 场景:${r.scenes}`).join("\n")}

## 检查

演示页程序检查:
${list(checks)}

组件代码检查(已有代码和 tokens 不改;新增代码只用 token、规范的字号,无阴影和底色;从 shadcn 复制来的文件也查):
${list(lint)}

## 改动

\`\`\`diff
${patch}
\`\`\`
`)
  archive(name, round, prompt === PROMPT ? null : note)
  console.log(`${name}: ready for review, library/${name}.md`)
}

// One version of a component change, kept for good: library/<name>/r<round>/.
function archive(name, round, feedback) {
  const ws = wsOf(name), dir = path.join(LIB, name, `r${round}`)
  fs.mkdirSync(dir, { recursive: true })
  for (const f of ["Page.tsx", "shot.png", "thumb.png", "checks.json", "components.md"]) if (fs.existsSync(path.join(ws, f))) fs.copyFileSync(path.join(ws, f), path.join(dir, f))
  fs.copyFileSync(path.join(LIB, `${name}.patch`), path.join(dir, "change.patch"))
  fs.copyFileSync(path.join(LIB, `${name}.md`), path.join(dir, "review.md"))
  if (feedback) fs.writeFileSync(path.join(dir, "feedback.md"), `# 第 ${round} 版的起因:审批意见\n\n${feedback}\n`)
}

async function propose() {
  const pending = Object.entries(state.proposals).find(([, p]) => p.status === "待审")
  if (pending) return console.log(`${pending[0]} is waiting for review; one change at a time`)
  const requests = collect()
  if (!requests.length) return console.log("no 组件不够 problems")
  const name = `k${state.next}`
  const ws = wsOf(name)
  fs.rmSync(ws, { recursive: true, force: true })
  fs.mkdirSync(ws, { recursive: true })
  fs.cpSync(path.join(ROOT, "app"), path.join(ws, "app"), { recursive: true })
  fs.cpSync(SHADCN, path.join(ws, "shadcn"), { recursive: true })
  fs.copyFileSync(path.join(ROOT, "components.md"), path.join(ws, "components.md"))
  // Demo data: a sample of the problem seen on the most pages.
  const top = [...requests].sort((a, b) => b.pages.length - a.pages.length)[0]
  const sk = top.sk, demoCase = top.pages[0], demo = `${sk}/${demoCase}`
  fs.copyFileSync(path.join(ROOT, "skills", sk, "data", `${demoCase}.json`), path.join(ws, "data.json"))
  if (fs.existsSync(path.join(ROOT, "skills", sk, "data", demoCase))) fs.cpSync(path.join(ROOT, "skills", sk, "data", demoCase), path.join(ws, "assets"), { recursive: true })
  fs.writeFileSync(path.join(ws, "tsconfig.json"), JSON.stringify({ compilerOptions: { jsx: "react-jsx", resolveJsonModule: true } }))
  fs.writeFileSync(path.join(ws, "requests.json"), JSON.stringify(requests, null, 1))
  const rejected = Object.entries(state.proposals).filter(([, p]) => p.status === "未采用").map(([n, p]) => `${n}:${(p.rounds?.at(-1)?.summary ?? "").slice(0, 600)}\n  没采用的原因:${p.reason}`).join("\n")
  state.proposals[name] = { status: "制作中", demo, requests: requests.length, rejected }
  state.next++
  save()
  console.log(`${name}: ${requests.length} problems; demo on ${demo}`)
  await build(name, PROMPT)
}

function merge(name) {
  const p = state.proposals[name]
  const ws = wsOf(name)
  // The reviewer may have edited the code: check once more, and record what was merged.
  const lint = lintComponents(ws)
  if (lint.length) console.log(`${name}: component checks still report ${lint.length} findings (merged anyway, approved by the reviewer):\n${lint.map((x) => `  ${x.file}:${x.line ?? ""} ${x.msg}`).join("\n")}`)
  const patch = libDiff(ws)
  fs.writeFileSync(path.join(LIB, `${name}.patch`), patch)
  fs.cpSync(path.join(ws, "app", "src", "components"), path.join(ROOT, "app", "src", "components"), { recursive: true })
  fs.copyFileSync(path.join(ws, "components.md"), path.join(ROOT, "components.md"))
  p.status = "采用"
  save()
  const summary = p.rounds.at(-1).summary
  fs.appendFileSync(LOG, `\n## ${name}  结果:采用(${p.rounds.length} 版)\n\n需求 ${p.requests} 条。示例和说明见 library/${name}.md,改动见 library/${name}.patch。${p.rounds.slice(1).map((r, i) => `\n- 第 ${i + 2} 版的审批意见:${r.feedback}`).join("")}\n\n${summary}\n`)
  // Every Skill's current pages, edited for the change; checks start again from the program checks.
  const change = path.join(LIB, `${name}.change.json`)
  fs.writeFileSync(change, JSON.stringify({ kind: "component", name, summary }, null, 1))
  for (const sk of Object.keys(split)) {
    const stFile = path.join(ROOT, "skills", sk, "state.json")
    const st = fs.existsSync(stFile) ? JSON.parse(read(stFile)) : { current: "g0", currentRun: `${sk}-g0`, versions: 0, round: 0, rejected: 0, sinceCheckpoint: 0, history: [] }
    const next = `${st.currentRun}-${name}`
    const cases = [...split[sk].train, ...split[sk].holdout]
    console.log(`edit ${st.currentRun} → ${next}`)
    execFileSync("node", [path.join(ROOT, "scripts", "generate.mjs"), "--run", next, "--cases", cases.join(","), "--data", path.join("skills", sk, "data"),
      "--guide", path.join("skills", sk, "guides", `${st.current}.md`), "--version", st.current, "--base", st.currentRun, "--change", path.relative(ROOT, change)], { stdio: "inherit", cwd: ROOT })
    st.currentRun = next
    st.components = [...(st.components ?? []), name]
    fs.writeFileSync(stFile, JSON.stringify(st, null, 1))
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const p = state.proposals[k]
  if (cmd === "propose") await propose()
  else if (!["revise", "approve", "reject"].includes(cmd)) throw new Error('usage: propose | revise k1 "意见" | approve k1 | reject k1 "原因"')
  else if (p?.status !== "待审") throw new Error(`${k} is not waiting for review`)
  else if (cmd === "revise") await build(k, `审批意见:${note}\n\n请按意见修改组件和演示页(只改意见涉及的地方),改完运行检查,结束时说明改了什么。`)
  else if (cmd === "approve") merge(k)
  else {
    p.status = "未采用"
    p.reason = note ?? ""
    save()
    fs.appendFileSync(LOG, `\n## ${k}  结果:未采用(${p.rounds.length} 版)\n\n需求 ${p.requests} 条。示例和说明见 library/${k}.md。\n\n没采用的原因:${note ?? ""}\n`)
  }
}
