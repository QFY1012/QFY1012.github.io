// The generator agent: reads a report's data.json, writes Page.tsx with the
// component library following design.md, and checks its own page with shoot.mjs.
// The agent session and its sandbox are in scripts/agent.mjs.
//
// ui-rl 的副本:从 ui-loop/scripts/generate.mjs 原样复制(2026-10-13),只改了 --data 的默认目录(ui-rl/data/flow)
// 和加了 --traces(页面写到哪个目录)。agent.mjs 改了两处:等模型开始回复的时限 10 秒 → 60 秒;沙箱里只能用 node 运行
// 检查脚本。训练由 ui-rl/scripts/rollout.mjs 调用。
//
//   source judge.env && node scripts/generate.mjs --run r0-v0 --cases ops,sales [--design design.md] [--version v0]
//     [--data skills/flow/data] [--guide skills/flow/guides/g0.md]      a Skill's data and output guide
//     [--base flow-g0 --change change.json]                              edit the base run's pages for one change:
//                                                                        a guide rule, or (kind "component") a component library change
//     [--traces <dir>]                                                   where the workspaces go (default traces/)
//
// One workspace per report in traces/<run>/<case>/ (the trajectory store):
//   data.json        the upstream Skill output (copied from ../ui-judge/data/)
//   Page.tsx         the agent's page
//   shot.png, thumb.png, tile-N.png, checks.json   from the last shoot
//   session.jsonl    the whole agent session (pi's session file)
//   meta.json        design version, model, shoots, tokens, time, final checks
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { runAgent, SHOOT, SANDBOX } from "./agent.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const DATA = path.resolve(ROOT, process.argv.includes("--data") ? process.argv[process.argv.indexOf("--data") + 1] : "../data/flow")
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const RUN = arg("run")
if (!RUN) throw new Error("--run <name> is required")
const CASES = arg("cases", "ops").split(",")
const DESIGN = path.resolve(ROOT, arg("design", "design.md"))
const VERSION = arg("version", "v0")
const MAX_SHOOTS = Number(arg("max-shoots", "5"))
const GUIDE = arg("guide") ? path.resolve(ROOT, arg("guide")) : null
const BASE = arg("base")
const CHANGE = arg("change") ? JSON.parse(fs.readFileSync(path.resolve(ROOT, arg("change")), "utf8")) : null
const TRACES = path.resolve(ROOT, arg("traces", "traces"))

const design = fs.readFileSync(DESIGN, "utf8")
const components = fs.readFileSync(path.join(ROOT, "components.md"), "utf8")
const guide = GUIDE ? fs.readFileSync(GUIDE, "utf8") : null
const designHash = createHash("sha256").update(design).digest("hex").slice(0, 8)
const componentsHash = createHash("sha256").update(components).digest("hex").slice(0, 8)
const guideHash = guide ? createHash("sha256").update(guide).digest("hex").slice(0, 8) : null

const system = () => `你是报告页面的前端设计师。工作目录里有上游分析 Skill 输出的 data.json,你要用组件库写出这份报告的页面 Page.tsx。

工作方式:
1. 读 data.json,想清楚每条信息属于哪一类内容(规范 B 部分)、放在哪一节(规范 C 部分)${guide ? ",并照输出指南的规则做" : ""}。
2. 用 write 写出 Page.tsx。如果工作目录里已经有 Page.tsx,先读它和 thumb.png,在它的基础上用 edit 修改。
3. 用 bash 运行 \`node \$SHOOT .\`:它会构建页面、截图,并做程序检查(构建、组件库、统一刻度、数据忠实、元素越界),问题带行号。
4. 用 read 看 thumb.png(整页)和需要细看的 tile-N.png,对照规范检查自己的页面;有程序检查问题或不符合规范的地方就改,改完再运行一次。
5. 页面符合规范、程序检查通过后就结束,最后用一两句话说明页面的结构。检查最多运行 ${MAX_SHOOTS} 次。

只用组件库里的组件。数据里有组件库表达不了的内容(例如组件库没有能显示的组件)时,不要自己写 HTML 标签或用别的写法绕过,把它先用现有组件尽量呈现,并在最后的说明里写清楚:缺什么组件、要显示的是什么数据。

工具只能访问工作目录,bash 在沙箱里运行、不能联网。页面只写在 Page.tsx 里;组件和规范的全部信息都在下面,不需要查看其他文件。

<design.md>
${design}
</design.md>

<components.md>
${components}
</components.md>${guide ? `

<输出指南>
${guide}
</输出指南>` : ""}`

// Lines of Page.tsx that differ from the base page (removed + added), by longest common subsequence.
function lineDiff(a, b) {
  if (!fs.existsSync(a) || !fs.existsSync(b)) return null
  const x = fs.readFileSync(a, "utf8").split("\n"), y = fs.readFileSync(b, "utf8").split("\n")
  let prev = new Array(y.length + 1).fill(0)
  for (let i = 1; i <= x.length; i++) {
    const cur = [0]
    for (let j = 1; j <= y.length; j++) cur[j] = x[i - 1] === y[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1])
    prev = cur
  }
  return x.length + y.length - 2 * prev[y.length]
}

async function generate(name) {
  const ws = path.join(TRACES, RUN, name)
  if (fs.existsSync(path.join(ws, "meta.json"))) return console.log(`${name}: already done`)
  console.log(`${name}: 开始${BASE ? `改页面(在 ${BASE} 上改)` : "写页面"}`)
  fs.rmSync(ws, { recursive: true, force: true })
  fs.mkdirSync(ws, { recursive: true })
  fs.copyFileSync(path.join(DATA, `${name}.json`), path.join(ws, "data.json"))
  // Images the data refers to as assets/<file>.
  if (fs.existsSync(path.join(DATA, name))) fs.cpSync(path.join(DATA, name), path.join(ws, "assets"), { recursive: true })
  // Edit mode: start from the base run's page and its screenshots.
  const baseWs = BASE ? path.join(TRACES, BASE, name) : null
  if (baseWs) for (const f of fs.readdirSync(baseWs)) if (f === "Page.tsx" || f === "checks.json" || f === "tiles.json" || f.endsWith(".png")) fs.copyFileSync(path.join(baseWs, f), path.join(ws, f))

  // Page.tsx outside a TypeScript project would pick up the site's Astro tsconfig.
  fs.writeFileSync(path.join(ws, "tsconfig.json"), JSON.stringify({ compilerOptions: { jsx: "react-jsx", resolveJsonModule: true } }))

  const prompt = !baseWs ? `请为这份报告生成页面。报告数据在 data.json。`
    : CHANGE?.kind === "component" ? `工作目录里的 Page.tsx 是已经写好的页面,thumb.png 是它的截图。组件库这次有一项改动(上面的组件库说明已经是改动后的版本):
${CHANGE.summary}

请按这项改动修改 Page.tsx:只改和它有关的地方(例如原来没法呈现、或绕过组件库自己画的内容,改用新组件),其他部分保持原样;如果页面用不上这项改动,就不要改,直接结束。改了就运行检查。`
    : CHANGE ? `工作目录里的 Page.tsx 是按上一版输出指南写好的页面,thumb.png 是它的截图。输出指南这次只改了一条规则:
${CHANGE.old ? `原文:${CHANGE.old.trim()}\n改为:${CHANGE.new.trim()}` : `新增:${CHANGE.new.trim()}`}

请按这条规则修改 Page.tsx:只改和这条规则有关的地方,其他部分保持原样;如果页面已经符合这条规则,就不要改,直接结束。改了就运行检查。`
    : `工作目录里的 Page.tsx 是已经写好的页面。检查它是否符合规范和输出指南,需要的话修改。`
  const run = await runAgent({
    name, ws, priv: path.join(TRACES, RUN, ".private", name), system: system(), prompt, maxShoots: MAX_SHOOTS,
    nudges: [`你还没有写出 Page.tsx。请现在用 write 写出页面,然后运行检查。`, `你还没有写出 Page.tsx。请现在用 write 写出页面,然后运行检查。`],
    missing: () => !fs.existsSync(path.join(ws, "Page.tsx")),
  })

  // Shoot once more so the stored screenshots and checks match the final Page.tsx.
  let final = []
  if (fs.existsSync(path.join(ws, "Page.tsx"))) {
    execFileSync(SANDBOX, [ws, `node ${SHOOT} .`], { stdio: "ignore" })
    final = JSON.parse(fs.readFileSync(path.join(ws, "checks.json"), "utf8"))
  }
  fs.writeFileSync(path.join(ws, "meta.json"), JSON.stringify({
    case: name, design: { version: VERSION, file: path.relative(ROOT, DESIGN), sha: designHash }, components: componentsHash,
    guide: GUIDE ? { file: path.relative(ROOT, GUIDE), sha: guideHash } : null, base: BASE ?? null, change: CHANGE,
    changedLines: baseWs ? lineDiff(path.join(baseWs, "Page.tsx"), path.join(ws, "Page.tsx")) : null,
    ...run, checks: final,
  }, null, 1))
  // A model call that errored (no quota, endpoint down) or never wrote a page is a failure, not a page.
  if (run.stop === "error" || !fs.existsSync(path.join(ws, "Page.tsx"))) throw new Error(`${name}: 模型调用出错或没写出 Page.tsx(stop=${run.stop}),看 ${path.relative(ROOT, ws)}/session.jsonl`)
  console.log(`${name}: done, ${run.shoots} shoots, ${final.length} check findings`)
}

// A page that failed stops the caller (the loop would otherwise judge pages that were never written).
const failed = []
await Promise.all(CASES.map((c) => generate(c).catch((e) => { failed.push(c); console.error(`${c}: FAIL ${e.stack ?? e}`) })))
if (failed.length) { console.error(`没写完的页面:${failed.join(",")},停止`); process.exit(1) }
