// The component branch of the loop: problems attributed to the component library become
// one library change at a time, built on shadcn/ui, reviewed by a person twice.
//
//   node scripts/component-loop.mjs propose --runs flow-g0,cvd-g0   ① the agent writes a plan
//   node scripts/component-loop.mjs approve k1                      plan ok → ②③④ implement, check, style check
//                                                                    implementation ok → ⑥ merge, edit every Skill's pages
//   node scripts/component-loop.mjs reject k1 "原因"                 at either review; the next proposal reads it
//
// ① Plan: from the issues attributed to 组件库 (traces/<run>/<case>/attribution-*.json), the
//    component agent picks one capability and writes plan.md: which shadcn component (or, when
//    shadcn has none, which Radix primitive), what goes into ui/, the report component and its
//    props, how each Skill would use it, and how it matches the existing components' style.
//    Review material: library/k<n>-plan.md.
// ② Implement in a copy of the library (traces/_components/k<n>/app): shadcn source copied
//    from vendor/shadcn (like `shadcn add`) and then adapted to the spec (shadcn's own classes have
//    shadows, backgrounds and off-grid sizes), the report component on top of it, using tokens only;
//    components.md updated; a demo page on real sample data next to existing components.
// ③ Program checks on the component code (colours only from tokens, the type scale, 8px steps,
//    no shadows or cards) and on the demo page.
// ④ Style check: a model compares the new component with the existing ones on the demo page;
//    any mismatch goes back to the agent (at most 2 times).
// ⑤ Review material: library/k<n>.md (plan, the agent's account, checks, diff, demo).
// ⑥ Merge into app/ and components.md; the generator edits each Skill's current pages for the
//    change (traces/<run>-k<n>/), whose checks start again from the program checks.
// Everything is in library/changelog.md, accepted or not.
import fs from "node:fs"
import path from "node:path"
import { execFileSync, spawnSync } from "node:child_process"
import { runAgent, SHOOT, SANDBOX } from "./agent.mjs"
import { call, img } from "../../ui-judge/scripts/pairwise-judge.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const LIB = path.join(ROOT, "library")
const STATE = path.join(LIB, "state.json")
const LOG = path.join(LIB, "changelog.md")
const SHADCN = path.join(ROOT, "vendor", "shadcn", "new-york-v4")
const read = (f) => fs.readFileSync(f, "utf8")
const [cmd, k, reason] = process.argv.slice(2)
const arg = (key, d) => {
  const i = process.argv.indexOf(`--${key}`)
  return i > 0 ? process.argv[i + 1] : d
}
fs.mkdirSync(LIB, { recursive: true })
const state = fs.existsSync(STATE) ? JSON.parse(read(STATE)) : { next: 1, proposals: {} }
const save = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 1))
if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, "# 组件库修改记录\n\n组件库是公共层,改动影响所有 Skill。每一项改动由组件 Agent 提出,用户先审方案、再审实现;没采用的也记在这里。\n")
const split = JSON.parse(read(path.join(ROOT, "skills", "split.json")))
const skillOf = (run) => Object.keys(split).find((s) => run.startsWith(`${s}-`))
const wsOf = (name) => path.join(ROOT, "traces", "_components", name)

const shadcnIndex = JSON.parse(read(path.join(SHADCN, "index.json")))
const RADIX = fs.readdirSync(path.join(ROOT, "node_modules", "@radix-ui")).filter((d) => d.startsWith("react-") && !/^react-(use-|compose-refs|context|collection|id|primitive|slot|presence|portal|direction|popper|arrow|dismissable-layer|focus-guards|focus-scope|roving-focus|visually-hidden)/.test(d))
  .map((d) => d.slice(6).split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(""))

const designA = read(path.join(ROOT, "design.md")).match(/## A 基础[\s\S]*?(?=\n## B)/)?.[0] ?? ""
const SYSTEM = (requests, rejected) => `你维护报告页面的组件库。生成 Agent 只能用组件库里的组件写报告页面;页面上的问题经过归因,下面这些被判定为「组件库」的问题:组件库缺能力,改页面写法解决不了。

工作目录:
- app/src/components/ui/:基础组件,全部是 shadcn/ui(new-york-v4)原版。
- app/src/components/report/index.tsx:报告组件(框架组件和内容组件),内容组件的绘制在 render.tsx。生成 Agent 用的是这一层。
- app/src/index.css:tokens(颜色、字体、圆角),不要改。
- components.md:组件库说明,生成 Agent 只读这份说明来用组件。
- shadcn/:shadcn/ui new-york-v4 全部组件的源码(只读副本,你不能联网),依赖的包都已安装;shadcn/index.json 列出每个组件的文件和依赖。ui/ 下的文件复制到 app/src/components/ui/,hooks/ 下的复制到 app/src/hooks/。
- data.json 和 assets/:一份真实的样本数据,用来做演示页。

组件怎么来,按这个顺序:
1. 先用 shadcn:shadcn 里有合适的组件,就把它的源码复制到 app/src/components/ui/(和 shadcn add 一样),再按规范改它的样式:shadcn 原版带阴影、底色,有的字号和尺寸不在规范里,这些都要改;结构、行为、data-slot、导出的组件和 props 保持不变。报告组件再基于它组合。
2. shadcn 里没有合适的,才直接调用 Radix 原语(import { X } from "radix-ui")来写,写法和 shadcn 一致:函数组件、data-slot、cn() 合并 className、只用 token 类名。
3. 不管哪种,风格都要和现有组件统一:同样的字号几级、灰度层级、线条、间距、对齐,颜色只来自 tokens;不加卡片、底色和阴影。不要改变现有组件的样子和行为。

一次只做一项能力:新增一个报告组件,或给已有报告组件加 props。问题里的建议只是参考,按组件库的整体设计定名字和 props,props 尽量少。

工具只能访问工作目录,bash 在沙箱里运行、不能联网。

<可直接调用的 Radix 原语>
${RADIX.join("、")}
</可直接调用的 Radix 原语>

<规范 A 部分(页面和组件共用的基础)>
${designA}
</规范 A 部分>

<归因为组件库的问题>
${requests.map((r) => `- [${r.run}/${r.case}] ${r.what}\n  需要:${r.fix}`).join("\n")}
</归因为组件库的问题>${rejected ? `

<之前被拒绝的组件改动>
${rejected}
</之前被拒绝的组件改动>` : ""}`

const PLAN_PROMPT = `先只写方案,不写代码。读需求、components.md、现有组件代码和 shadcn/index.json,写 plan.md:
1. 要做的能力:一句话,以及它解决上面哪些问题。
2. 来源:用哪个 shadcn 组件(复制哪些文件到 ui/);shadcn 里没有合适的,写用哪个 Radix 原语、为什么 shadcn 的不合适。
3. 报告组件:名字、props(类型和默认值)、放在哪(index.tsx 还是 render.tsx)。
4. 两个 Skill 里各怎么用:各写一段最小的 JSX 示例(交互流程挖掘的链路截图;色觉无障碍分析的原界面和三种色盲模拟)。
5. 风格怎么和现有组件统一:用哪些 token、字号、间距、线条,和哪个现有组件对齐。
写完就结束。`

const IMPL_PROMPT = (plan, note) => `方案已经审核通过${note ? `,审核意见:${note}` : ""}。按方案实现:

<方案>
${plan}
</方案>

1. 按来源规则把 shadcn 源码复制进 app/src/components/ui/ 并按规范改样式(或按 shadcn 的写法用 Radix 原语写),再写报告组件。
2. 在 components.md 里补上:props、什么时候用、最小用法示例。
3. 写演示页 Page.tsx:用 data.json,把原来呈现不了的内容用新组件呈现出来,其余内容用现有组件排(演示页要能看出新组件和现有组件放在一起是否统一)。
4. 用 bash 运行 \`node \$SHOOT .\` 构建、截图、检查,用 read 看 thumb.png 和切块,不对就改。检查最多运行 6 次。
5. 结束时说明:做了哪项能力、来自哪个 shadcn 组件或 Radix 原语、名字和 props、和方案有什么不同、需求里哪些没做及原因。`

function collect(runs) {
  const out = []
  for (const run of runs)
    for (const c of fs.readdirSync(path.join(ROOT, "traces", run))) {
      for (const stage of ["program", "function"]) {
        const f = path.join(ROOT, "traces", run, c, `attribution-${stage}.json`)
        if (!fs.existsSync(f)) continue
        for (const i of JSON.parse(read(f)).issues ?? []) if (i.cause === "组件库") out.push({ run, case: c, stage, what: i.what, fix: i.fix })
      }
    }
  return out
}

const diff = (a, b) => spawnSync("git", ["diff", "--no-index", "--no-color", a, b], { encoding: "utf8" }).stdout.replaceAll(path.dirname(a), "").replaceAll(path.dirname(b), "")
const libDiff = (ws) => diff(path.join(ROOT, "app", "src"), path.join(ws, "app", "src")) + diff(path.join(ROOT, "components.md"), path.join(ws, "components.md"))

// ③ Program checks on the component code: the lines the change adds to app/src.
// Files copied from shadcn are checked like any other: shadcn's own classes have shadows,
// backgrounds and sizes the spec doesn't allow, so they have to be adapted.
function lintComponents(ws) {
  const out = []
  const src = path.join(ws, "app", "src")
  const files = spawnSync("git", ["diff", "--no-index", "--name-only", path.join(ROOT, "app", "src"), src], { encoding: "utf8" }).stdout.split("\n").filter((f) => f.startsWith(src) && /\.(tsx?|css)$/.test(f))
  for (const f of files) {
    const rel = path.relative(src, f)
    if (rel === "index.css") { out.push({ file: rel, msg: "改了 tokens(index.css);tokens 只由用户改" }); continue }
    if ((rel.startsWith("components/ui/") || rel.startsWith("hooks/")) && fs.existsSync(path.join(ROOT, "app", "src", rel))) { out.push({ file: rel, msg: "改了已有的 ui/ 或 hooks/ 文件;已有的不能改" }); continue }
    const before = fs.existsSync(path.join(ROOT, "app", "src", rel)) ? new Set(read(path.join(ROOT, "app", "src", rel)).split("\n")) : new Set()
    read(f).split("\n").forEach((line, i) => {
      if (before.has(line)) return
      const add = (msg) => out.push({ file: rel, line: i + 1, msg })
      if (/#[0-9a-fA-F]{3,8}\b|\b(?:oklch|rgba?|hsla?)\(/.test(line)) add("写了颜色值;颜色只能用 tokens(text-foreground、text-muted-foreground、border-border、text-destructive 等)")
      const c = line.match(/\b(?:text|bg|border|fill|stroke|ring|outline)-(?:red|green|blue|slate|gray|zinc|neutral|stone|orange|amber|yellow|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d+)?\b/)
      if (c) add(`颜色类名 ${c[0]} 不是 token`)
      for (const m of line.matchAll(/\btext-(base|lg|4xl|6xl|7xl|8xl|9xl)\b/g)) add(`字号 ${m[0]} 不在规范的几级里`)
      for (const m of line.matchAll(/\[(\d+)px\]/g)) if (Number(m[1]) % 8) add(`尺寸 ${m[1]}px 不是 8 的倍数`)
      for (const m of line.matchAll(/\bshadow(?:-\w+)?\b/g)) if (m[0] !== "shadow-none") add(`用了阴影 ${m[0]}`)
      if (/\bbg-(card|muted|accent|secondary|popover)\b/.test(line)) add("加了底色;规范不用卡片和底色")
    })
  }
  return out
}

// New ui/ and hooks/ files against the shadcn originals they came from: the adaptation, for review.
function fromShadcn(ws) {
  const src = path.join(ws, "app", "src")
  return ["components/ui", "hooks"].flatMap((d) => (fs.existsSync(path.join(src, d)) ? fs.readdirSync(path.join(src, d)).map((f) => `${d}/${f}`) : []))
    .filter((rel) => !fs.existsSync(path.join(ROOT, "app", "src", rel)) && fs.existsSync(path.join(SHADCN, rel.replace(/^components\//, ""))))
    .map((rel) => diff(path.join(SHADCN, rel.replace(/^components\//, "")), path.join(src, rel)) || `${rel}:和 shadcn 原版相同\n`).join("")
}

// ④ Style check: the new component next to the existing ones on the demo page.
const STYLE = `你检查组件库里新加的组件和现有组件风格是否统一。会给你演示页截图(新组件和现有组件放在同一页上)、这次改动的代码 diff 和规范 A 部分。

逐项比较新组件和现有组件:字号和字重、文字灰度层级、线条粗细和颜色、间距和对齐、圆角、有没有现有组件没有的装饰(底色、边框框住、阴影、图标风格不同)。只列出确实不一致的地方,每条写明在哪、新组件是什么样、现有组件是什么样、该怎么改。完全统一就返回空列表。不要评价页面的排版和内容。

只输出 JSON:{"issues":[{"where":"演示页哪里","what":"不一致的地方","fix":"怎么改"}]}`
async function styleCheck(ws, patch) {
  const imgs = [img(path.join(ws, "thumb.png")), ...JSON.parse(read(path.join(ws, "tiles.json"))).map((t) => img(path.join(ws, t.file)))]
  const r = await call(STYLE, [{ type: "text", text: `<规范 A 部分>\n${designA}\n</规范 A 部分>\n\n<diff>\n${patch.slice(0, 60000)}\n</diff>\n\n演示页截图(第 1 张整页,后面是切块):` }, ...imgs], { key: process.env.DEEPSEEK_API_KEY })
  return r.json.issues ?? []
}

const shoot = (ws) => {
  execFileSync(SANDBOX, [ws, `node ${SHOOT} .`], { stdio: "ignore" })
  return JSON.parse(read(path.join(ws, "checks.json")))
}

async function propose() {
  const runs = arg("runs").split(",")
  const requests = collect(runs)
  if (!requests.length) throw new Error("no issues attributed to 组件库")
  const name = `k${state.next}`
  const ws = wsOf(name)
  fs.rmSync(ws, { recursive: true, force: true })
  fs.mkdirSync(ws, { recursive: true })
  fs.cpSync(path.join(ROOT, "app"), path.join(ws, "app"), { recursive: true })
  fs.cpSync(SHADCN, path.join(ws, "shadcn"), { recursive: true })
  fs.copyFileSync(path.join(ROOT, "components.md"), path.join(ws, "components.md"))
  // Demo data: the sample with the most component requests.
  const count = requests.reduce((m, r) => ({ ...m, [`${r.run}/${r.case}`]: (m[`${r.run}/${r.case}`] ?? 0) + 1 }), {})
  const demo = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0]
  const [demoRun, demoCase] = demo.split("/")
  const sk = skillOf(demoRun)
  fs.copyFileSync(path.join(ROOT, "skills", sk, "data", `${demoCase}.json`), path.join(ws, "data.json"))
  if (fs.existsSync(path.join(ROOT, "skills", sk, "data", demoCase))) fs.cpSync(path.join(ROOT, "skills", sk, "data", demoCase), path.join(ws, "assets"), { recursive: true })
  fs.writeFileSync(path.join(ws, "tsconfig.json"), JSON.stringify({ compilerOptions: { jsx: "react-jsx", resolveJsonModule: true } }))
  fs.writeFileSync(path.join(ws, "requests.json"), JSON.stringify(requests, null, 1))
  const rejected = Object.entries(state.proposals).filter(([, p]) => p.status === "未采用").map(([n, p]) => `${n}:${(p.plan ?? "").slice(0, 600)}\n  被拒绝的原因:${p.reason}`).join("\n")
  console.log(`${name}: ${requests.length} requests from ${Object.keys(count).length} pages; demo on ${demo}`)
  const run = await runAgent({
    name: `${name}-plan`, ws, priv: path.join(ROOT, "traces", "_components", ".private", `${name}-plan`), system: SYSTEM(requests, rejected), maxShoots: 0,
    prompt: PLAN_PROMPT, nudges: ["你还没有写出 plan.md。请现在写出。"], missing: () => !fs.existsSync(path.join(ws, "plan.md")),
  })
  fs.renameSync(path.join(ws, "session.jsonl"), path.join(ws, "session-plan.jsonl"))
  const plan = fs.existsSync(path.join(ws, "plan.md")) ? read(path.join(ws, "plan.md")) : "(没有写出方案)"
  state.proposals[name] = { status: "方案待审", demo, requests: requests.length, runs, plan, planRun: run }
  state.next++
  save()
  fs.writeFileSync(path.join(LIB, `${name}-plan.md`), `# 组件改动 ${name}:方案(待审)\n\n## 需求:归因为「组件库」的问题(${requests.length} 条,来自 ${Object.keys(count).length} 页)\n\n${requests.map((r) => `- **${r.run}/${r.case}**(${r.stage === "program" ? "程序检查" : "功能 judge"}):${r.what}\n  - 需要:${r.fix}`).join("\n")}\n\n## 方案\n\n${plan}\n`)
  console.log(`${name}: plan written; review library/${name}-plan.md`)
}

async function implement(name, note) {
  const p = state.proposals[name]
  const ws = wsOf(name)
  const requests = JSON.parse(read(path.join(ws, "requests.json")))
  const priv = (n) => path.join(ROOT, "traces", "_components", ".private", `${name}-${n}`)
  const sys = SYSTEM(requests, "")
  let run = await runAgent({
    name, ws, priv: priv("impl"), system: sys, maxShoots: 6, prompt: IMPL_PROMPT(p.plan, note),
    nudges: ["你还没有写出演示页 Page.tsx。请写出并运行检查。"], missing: () => !fs.existsSync(path.join(ws, "Page.tsx")),
  })
  let rounds = [], checks = [], lint = [], style = []
  for (let back = 0; ; back++) {
    checks = fs.existsSync(path.join(ws, "Page.tsx")) ? shoot(ws) : [{ check: "演示页", msg: "没有写出演示页" }]
    lint = lintComponents(ws)
    style = checks.some((c) => c.check === "能渲染") ? [] : await styleCheck(ws, libDiff(ws))
    rounds.push({ checks, lint, style, summary: run.summary })
    if (!checks.length && !lint.length && !style.length) break
    if (back === 2) break
    // Back to the agent with what the checks found.
    console.log(`${name}: back to the agent (${checks.length} page checks, ${lint.length} component checks, ${style.length} style issues)`)
    fs.renameSync(path.join(ws, "session.jsonl"), path.join(ws, `session-impl-${back + 1}.jsonl`))
    run = await runAgent({
      name, ws, priv: priv(`fix${back + 1}`), system: sys, maxShoots: 4,
      prompt: `你上一次实现的组件和演示页检查出下面的问题,请修改(只改组件和演示页,改完运行检查)。\n\n<演示页程序检查>\n${JSON.stringify(checks, null, 1)}\n</演示页程序检查>\n\n<组件代码检查>\n${JSON.stringify(lint, null, 1)}\n</组件代码检查>\n\n<风格一致检查>\n${JSON.stringify(style, null, 1)}\n</风格一致检查>\n\n<方案>\n${p.plan}\n</方案>`,
    })
  }
  const patch = libDiff(ws)
  fs.writeFileSync(path.join(LIB, `${name}.patch`), patch)
  Object.assign(p, { status: "实现待审", note: note ?? "", summary: run.summary, checks, lint, style, backs: rounds.length - 1 })
  save()
  const list = (xs) => (xs.length ? xs.map((x) => `- ${x.file ? `${x.file}${x.line ? `:${x.line}` : ""} ` : ""}${x.where ? `${x.where}:` : ""}${x.msg ?? x.what}${x.fix ? `(${x.fix})` : ""}`).join("\n") : "无问题")
  fs.writeFileSync(path.join(LIB, `${name}.md`), `# 组件改动 ${name}:实现(待审)

方案见 library/${name}-plan.md${note ? `;审核意见:${note}` : ""}。打回修改 ${rounds.length - 1} 次。

## 组件 Agent 的说明

${run.summary}

## 检查

演示页(${p.demo} 的数据,截图 \`traces/_components/${name}/thumb.png\`)程序检查:
${list(checks)}

组件代码检查(只用 token、字号几级、8 的倍数、无阴影和底色;从 shadcn 复制来的文件也查):
${list(lint)}

## 对 shadcn 原版改了什么

\`\`\`diff
${fromShadcn(ws) || "(没有从 shadcn 复制的文件)"}
\`\`\`

风格一致检查(新组件和现有组件放在演示页上比较):
${list(style)}

## 改动(组件库代码和 components.md)

\`\`\`diff
${patch}
\`\`\`
`)
  console.log(`${name}: implemented; review library/${name}.md`)
}

function merge(name) {
  const p = state.proposals[name]
  const ws = wsOf(name)
  fs.cpSync(path.join(ws, "app", "src", "components"), path.join(ROOT, "app", "src", "components"), { recursive: true })
  if (fs.existsSync(path.join(ws, "app", "src", "hooks"))) fs.cpSync(path.join(ws, "app", "src", "hooks"), path.join(ROOT, "app", "src", "hooks"), { recursive: true })
  fs.copyFileSync(path.join(ws, "components.md"), path.join(ROOT, "components.md"))
  p.status = "采用"
  save()
  fs.appendFileSync(LOG, `\n## ${name}  结果:采用\n\n需求 ${p.requests} 条。方案见 library/${name}-plan.md,实现见 library/${name}.md,改动见 library/${name}.patch。\n\n${p.summary}\n`)
  // Every Skill's current pages, edited for the change.
  const change = path.join(LIB, `${name}.change.json`)
  fs.writeFileSync(change, JSON.stringify({ kind: "component", name, summary: p.summary }, null, 1))
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

if (cmd === "propose") await propose()
else if (cmd === "approve") {
  const p = state.proposals[k]
  if (p?.status === "方案待审") await implement(k, reason)
  else if (p?.status === "实现待审") merge(k)
  else throw new Error(`${k} is not waiting for review`)
} else if (cmd === "reject") {
  const p = state.proposals[k]
  if (!["方案待审", "实现待审"].includes(p?.status)) throw new Error(`${k} is not waiting for review`)
  const stage = p.status === "方案待审" ? "方案" : "实现"
  p.status = "未采用"
  p.reason = `${stage}被拒绝:${reason ?? ""}`
  save()
  fs.appendFileSync(LOG, `\n## ${k}  结果:未采用(${stage}阶段)\n\n需求 ${p.requests} 条。方案见 library/${k}-plan.md${stage === "实现" ? `,实现见 library/${k}.md` : ""}。\n\n没采用的原因:${reason ?? ""}\n`)
} else throw new Error('usage: propose --runs a,b | approve k1 ["审核意见"] | reject k1 "原因"')
