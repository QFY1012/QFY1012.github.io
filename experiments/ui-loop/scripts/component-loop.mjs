// The component branch of the loop: problems attributed to the component library become
// one library change at a time, reviewed by a person before it is merged.
//
//   node scripts/component-loop.mjs propose --runs flow-g0,cvd-g0
//   node scripts/component-loop.mjs approve k1      merge, then edit every Skill's pages for it
//   node scripts/component-loop.mjs reject k1 "原因"
//
// propose  collects the issues attributed to 组件库 (traces/<run>/<case>/attribution-*.json),
//          gives the component agent a copy of the library (traces/_components/k<n>/app) and
//          components.md, and lets it add one capability (a new component or new props),
//          document it, and build a demo page on real sample data. Writes library/k<n>.md for
//          review (requests, the agent's account, the diff, the demo) and waits.
// approve  copies the candidate library and components.md over the shared ones, records it,
//          and has the generator edit each Skill's current pages for the change (edit mode):
//          traces/<run>-k<n>/. Their program checks are the regression check.
// reject   records why; the next proposal reads the record.
// Everything is in library/changelog.md, accepted or not.
import fs from "node:fs"
import path from "node:path"
import { execFileSync, spawnSync } from "node:child_process"
import { runAgent, SHOOT, SANDBOX } from "./agent.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const LIB = path.join(ROOT, "library")
const STATE = path.join(LIB, "state.json")
const LOG = path.join(LIB, "changelog.md")
const read = (f) => fs.readFileSync(f, "utf8")
const [cmd, k, reason] = process.argv.slice(2)
const arg = (key, d) => {
  const i = process.argv.indexOf(`--${key}`)
  return i > 0 ? process.argv[i + 1] : d
}
fs.mkdirSync(LIB, { recursive: true })
const state = fs.existsSync(STATE) ? JSON.parse(read(STATE)) : { next: 1, proposals: {} }
const save = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 1))
if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, "# 组件库修改记录\n\n组件库是公共层,改动影响所有 Skill。每一项改动由组件 Agent 提出、用户审核;没采用的也记在这里。\n")
const split = JSON.parse(read(path.join(ROOT, "skills", "split.json")))
const skillOf = (run) => Object.keys(split).find((s) => run.startsWith(`${s}-`))

const SYSTEM = (requests, rejected) => `你维护报告页面的组件库。生成 Agent 只能用组件库里的组件写报告页面;页面上的问题经过归因,下面这些被判定为「组件库」的问题:组件库缺能力,改页面写法解决不了。

工作目录:
- app/src/components/report/index.tsx:报告组件(框架组件和内容组件)。内容组件的绘制在 render.tsx。
- app/src/components/ui/:基础组件(Radix / shadcn),可以用,不要改。
- app/src/index.css:tokens(颜色、字体、圆角),不要改。
- components.md:组件库说明,生成 Agent 只读这份说明来用组件。
- data.json 和 assets/:一份真实的样本数据,用来做演示页。

你的任务:
1. 读这些问题,判断它们需要的是哪一项能力。一次只做一项:新增一个组件,或给已有组件加 props。问题里的建议只是参考,按组件库的整体设计来定名字和 props,props 尽量少。
2. 实现,写在 index.tsx(需要时 render.tsx)。遵守下面的规范 A 部分和现有写法:组件根元素带 data-slot;尺寸取 24 的倍数(小间距取 8 的倍数);颜色、字号只来自 tokens 和规范已有的几级;不加卡片、底色和阴影;能用基础组件就用基础组件。不要改变其他组件现有的样子和行为。
3. 在 components.md 里补上它:props、什么时候用、一个最小用法示例。
4. 写演示页 Page.tsx:用 data.json 和新组件,把原来呈现不了的内容用新组件呈现出来(其他内容用现有组件简单排一下即可)。用 bash 运行 \`node \$SHOOT .\` 构建、截图、检查,用 read 看 thumb.png 和切块,不对就改。检查最多运行 6 次。
5. 结束时说明:做了哪项能力、名字和 props、为什么这样设计、对问题里哪些需求没有做以及原因。

工具只能访问工作目录,bash 在沙箱里运行、不能联网。

<规范 A 部分>
${read(path.join(ROOT, "design.md")).match(/## A 基础[\s\S]*?(?=\n## B)/)?.[0] ?? ""}
</规范 A 部分>

<归因为组件库的问题>
${requests.map((r) => `- [${r.run}/${r.case}] ${r.what}\n  需要:${r.fix}`).join("\n")}
</归因为组件库的问题>${rejected ? `

<之前被拒绝的组件改动>
${rejected}
</之前被拒绝的组件改动>` : ""}`

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

const diff = (a, b) => spawnSync("git", ["diff", "--no-index", "--no-color", a, b], { encoding: "utf8" }).stdout.replaceAll(path.dirname(a) + "/", "").replaceAll(path.dirname(b) + "/", "")

if (cmd === "propose") {
  const runs = arg("runs").split(",")
  const requests = collect(runs)
  if (!requests.length) throw new Error("no issues attributed to 组件库")
  const name = `k${state.next}`
  const ws = path.join(ROOT, "traces", "_components", name)
  fs.rmSync(ws, { recursive: true, force: true })
  fs.mkdirSync(ws, { recursive: true })
  fs.cpSync(path.join(ROOT, "app"), path.join(ws, "app"), { recursive: true })
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
  const rejected = Object.entries(state.proposals).filter(([, p]) => p.status === "未采用").map(([n, p]) => `${n}:${p.summary?.slice(0, 300)}\n  被拒绝的原因:${p.reason}`).join("\n")
  console.log(`${name}: ${requests.length} requests from ${Object.keys(count).length} pages; demo on ${demo}`)

  const run = await runAgent({
    name, ws, priv: path.join(ROOT, "traces", "_components", ".private", name), system: SYSTEM(requests, rejected), maxShoots: 6,
    prompt: `请按说明给组件库加上这一项能力,并做演示页。`,
    nudges: [`你还没有写出演示页 Page.tsx。请写出并运行检查。`], missing: () => !fs.existsSync(path.join(ws, "Page.tsx")),
  })
  let checks = []
  if (fs.existsSync(path.join(ws, "Page.tsx"))) {
    execFileSync(SANDBOX, [ws, `node ${SHOOT} .`], { stdio: "ignore" })
    checks = JSON.parse(read(path.join(ws, "checks.json")))
  }
  const patch = diff(path.join(ROOT, "app", "src"), path.join(ws, "app", "src")) + diff(path.join(ROOT, "components.md"), path.join(ws, "components.md"))
  fs.writeFileSync(path.join(LIB, `${name}.patch`), patch)
  fs.writeFileSync(path.join(ws, "meta.json"), JSON.stringify({ name, demo, requests: requests.length, ...run, checks }, null, 1))
  state.proposals[name] = { status: "待审核", demo, requests: requests.length, summary: run.summary, checks }
  state.next++
  save()
  fs.writeFileSync(path.join(LIB, `${name}.md`), `# 组件改动 ${name}(待审核)

## 需求:归因为「组件库」的问题(${requests.length} 条,来自 ${Object.keys(count).length} 页)

${requests.map((r) => `- **${r.run}/${r.case}**(${r.stage === "program" ? "程序检查" : "功能 judge"}):${r.what}\n  - 需要:${r.fix}`).join("\n")}

## 组件 Agent 的说明

${run.summary}

## 演示页

用 ${demo} 的数据。截图:\`traces/_components/${name}/thumb.png\`。程序检查:${checks.length ? checks.map((c) => c.msg).join(";") : "无问题"}

## 改动(组件库代码和 components.md)

\`\`\`diff
${patch}
\`\`\`
`)
  console.log(`${name}: proposed, ${checks.length} check findings; review library/${name}.md`)
} else if (cmd === "approve") {
  const p = state.proposals[k]
  if (p?.status !== "待审核") throw new Error(`${k} is not waiting for review`)
  const ws = path.join(ROOT, "traces", "_components", k)
  fs.cpSync(path.join(ws, "app", "src", "components", "report"), path.join(ROOT, "app", "src", "components", "report"), { recursive: true })
  fs.copyFileSync(path.join(ws, "components.md"), path.join(ROOT, "components.md"))
  p.status = "采用"
  save()
  fs.appendFileSync(LOG, `\n## ${k}  结果:采用\n\n需求 ${p.requests} 条(见 library/${k}.md)。演示页用 ${p.demo}。\n\n${p.summary}\n`)
  // Every Skill's current pages, edited for the change.
  const change = path.join(LIB, `${k}.change.json`)
  fs.writeFileSync(change, JSON.stringify({ kind: "component", name: k, summary: p.summary }, null, 1))
  for (const sk of Object.keys(split)) {
    const stFile = path.join(ROOT, "skills", sk, "state.json")
    const st = fs.existsSync(stFile) ? JSON.parse(read(stFile)) : { current: "g0", currentRun: `${sk}-g0`, versions: 0, round: 0, rejected: 0, sinceCheckpoint: 0, history: [] }
    const next = `${st.currentRun}-${k}`
    const cases = [...split[sk].train, ...split[sk].holdout]
    console.log(`edit ${st.currentRun} → ${next}`)
    execFileSync("node", [path.join(ROOT, "scripts", "generate.mjs"), "--run", next, "--cases", cases.join(","), "--data", path.join("skills", sk, "data"),
      "--guide", path.join("skills", sk, "guides", `${st.current}.md`), "--version", st.current, "--base", st.currentRun, "--change", path.relative(ROOT, change)], { stdio: "inherit", cwd: ROOT })
    st.currentRun = next
    st.components = [...(st.components ?? []), k]
    fs.writeFileSync(stFile, JSON.stringify(st, null, 1))
  }
} else if (cmd === "reject") {
  const p = state.proposals[k]
  if (p?.status !== "待审核") throw new Error(`${k} is not waiting for review`)
  p.status = "未采用"
  p.reason = reason ?? ""
  save()
  fs.appendFileSync(LOG, `\n## ${k}  结果:未采用\n\n需求 ${p.requests} 条(见 library/${k}.md)。\n\n${p.summary}\n\n没采用的原因:${p.reason}\n`)
} else throw new Error("usage: propose --runs a,b | approve k1 | reject k1 \"原因\"")
