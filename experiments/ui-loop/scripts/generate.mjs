// The generator agent: reads a report's data.json, writes Page.tsx with the
// component library following design.md, and checks its own page with shoot.mjs.
// Built on pi (@mariozechner/pi-coding-agent) with its read / write / edit / bash tools.
// read / write / edit are limited to the workspace; every bash command runs in
// scripts/sandbox.sh, which sees only the workspace and the read-only build tooling,
// has no API keys in its environment and no network.
//
//   source judge.env && node scripts/generate.mjs --run r0-v0 --cases ops,sales [--design design.md] [--version v0]
//     [--data skills/flow/data] [--guide skills/flow/guides/g0.md]      a Skill's data and output guide
//     [--base flow-g0 --change change.json]                              edit the base run's pages for one rule change
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
import { getModel } from "@mariozechner/pi-ai"
import {
  AuthStorage, createAgentSession, createExtensionRuntime, ModelRegistry, SessionManager, SettingsManager,
  createBashToolDefinition, createEditToolDefinition, createReadToolDefinition, createWriteToolDefinition,
} from "@mariozechner/pi-coding-agent"

const ROOT = path.resolve(import.meta.dirname, "..")
const DATA = path.resolve(ROOT, process.argv.includes("--data") ? process.argv[process.argv.indexOf("--data") + 1] : "../ui-judge/data")
const SHOOT = path.join(ROOT, "scripts", "shoot.mjs")
const SANDBOX = path.join(ROOT, "scripts", "sandbox.sh")
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
const EFFORT = process.env.GEN_EFFORT ?? "high"
const GUIDE = arg("guide") ? path.resolve(ROOT, arg("guide")) : null
const BASE = arg("base")
const CHANGE = arg("change") ? JSON.parse(fs.readFileSync(path.resolve(ROOT, arg("change")), "utf8")) : null

const KEY = process.env.DEEPSEEK_API_KEY
if (!KEY) throw new Error("set DEEPSEEK_API_KEY (source judge.env)")
// The judge's endpoint and model, through pi's OpenAI-compatible client.
const base = getModel("deepseek", "deepseek-v4-flash")
const model = {
  ...base,
  id: process.env.GEN_MODEL ?? process.env.JUDGE_MODEL ?? "deepseek-v4.1-flash",
  baseUrl: (process.env.JUDGE_URL ?? "https://api.deepseek.com/chat/completions").replace(/\/chat\/completions$/, ""),
  input: ["text", "image"],
  compat: { ...base.compat, thinkingFormat: "openai" },
}

const design = fs.readFileSync(DESIGN, "utf8")
const components = fs.readFileSync(path.join(ROOT, "components.md"), "utf8")
const guide = GUIDE ? fs.readFileSync(GUIDE, "utf8") : null
const designHash = createHash("sha256").update(design).digest("hex").slice(0, 8)
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

const loader = {
  getExtensions: () => ({ extensions: [], errors: [], runtime: createExtensionRuntime() }),
  getSkills: () => ({ skills: [], diagnostics: [] }),
  getPrompts: () => ({ prompts: [], diagnostics: [] }),
  getThemes: () => ({ themes: [], diagnostics: [] }),
  getAgentsFiles: () => ({ agentsFiles: [] }),
  getSystemPrompt: system,
  getAppendSystemPrompt: () => [],
  extendResources: () => {},
  reload: async () => {},
}

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
  const ws = path.join(ROOT, "traces", RUN, name)
  if (fs.existsSync(path.join(ws, "meta.json"))) return console.log(`${name}: already done`)
  fs.rmSync(ws, { recursive: true, force: true })
  fs.mkdirSync(ws, { recursive: true })
  fs.copyFileSync(path.join(DATA, `${name}.json`), path.join(ws, "data.json"))
  // Images the data refers to as assets/<file>.
  if (fs.existsSync(path.join(DATA, name))) fs.cpSync(path.join(DATA, name), path.join(ws, "assets"), { recursive: true })
  // Edit mode: start from the base run's page and its screenshots.
  const baseWs = BASE ? path.join(ROOT, "traces", BASE, name) : null
  if (baseWs) for (const f of fs.readdirSync(baseWs)) if (f === "Page.tsx" || f === "checks.json" || f === "tiles.json" || f.endsWith(".png")) fs.copyFileSync(path.join(baseWs, f), path.join(ws, f))

  // Page.tsx outside a TypeScript project would pick up the site's Astro tsconfig.
  fs.writeFileSync(path.join(ws, "tsconfig.json"), JSON.stringify({ compilerOptions: { jsx: "react-jsx", resolveJsonModule: true } }))

  // read / write / edit: only inside the workspace.
  const inside = (p, only) => {
    const abs = path.resolve(ws, p ?? "")
    return only ? abs === path.join(ws, only) : abs === ws || abs.startsWith(ws + path.sep)
  }
  const fence = (def, only) => ({
    ...def,
    execute: (id, params, ...rest) =>
      inside(params.path, only)
        ? def.execute(id, params, ...rest)
        : Promise.reject(new Error(only ? `只能写 ${only}` : "只能访问工作目录内的文件")),
  })
  // bash: every command runs in the sandbox; checks past the limit are refused.
  let shoots = 0
  const q = (x) => `'${x.replace(/'/g, `'\\''`)}'`
  const bash = createBashToolDefinition(ws, {
    spawnHook: ({ command }) => {
      if (/node\s+("?\$SHOOT"?|\S*shoot\.mjs)/.test(command) && ++shoots > MAX_SHOOTS) command = `echo "检查已运行 ${MAX_SHOOTS} 次,不能再运行;请结束。"`
      return { command: `${q(SANDBOX)} ${q(ws)} ${q(command)}`, cwd: ws, env: { PATH: process.env.PATH } }
    },
  })

  // Session file and credentials live outside the workspace, so the sandbox never sees them.
  const priv = path.join(ROOT, "traces", RUN, ".private", name)
  fs.rmSync(priv, { recursive: true, force: true })
  fs.mkdirSync(priv, { recursive: true })
  const auth = AuthStorage.create(path.join(priv, "auth.json"))
  auth.setRuntimeApiKey("deepseek", KEY)
  const sessionManager = SessionManager.create(ws, priv)
  const { session } = await createAgentSession({
    cwd: ws,
    agentDir: path.join(priv, "pi"),
    model,
    thinkingLevel: EFFORT,
    authStorage: auth,
    modelRegistry: ModelRegistry.inMemory(auth),
    resourceLoader: loader,
    noTools: "builtin",
    customTools: [fence(createReadToolDefinition(ws)), fence(createWriteToolDefinition(ws)), fence(createEditToolDefinition(ws)), bash],
    sessionManager,
    settingsManager: SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: true, maxRetries: 3 } }),
  })

  const t0 = Date.now()
  session.subscribe((e) => {
    if (e.type === "tool_execution_start") console.log(`${name}: ${e.toolName} ${String(e.args?.path ?? e.args?.command ?? "").slice(0, 70)}`)
  })
  await session.prompt(!baseWs ? `请为这份报告生成页面。报告数据在 data.json。`
    : CHANGE ? `工作目录里的 Page.tsx 是按上一版输出指南写好的页面,thumb.png 是它的截图。输出指南这次只改了一条规则:
${CHANGE.old ? `原文:${CHANGE.old.trim()}\n改为:${CHANGE.new.trim()}` : `新增:${CHANGE.new.trim()}`}

请按这条规则修改 Page.tsx:只改和这条规则有关的地方,其他部分保持原样;如果页面已经符合这条规则,就不要改,直接结束。改了就运行检查。`
    : `工作目录里的 Page.tsx 是已经写好的页面。检查它是否符合规范和输出指南,需要的话修改。`)
  // The model sometimes ends a turn after long thinking without writing anything.
  for (let nudge = 0; nudge < 2 && !fs.existsSync(path.join(ws, "Page.tsx")); nudge++) {
    console.log(`${name}: no Page.tsx yet, nudge ${nudge + 1}`)
    await session.prompt(`你还没有写出 Page.tsx。请现在用 write 写出页面,然后运行检查。`)
  }

  // Shoot once more so the stored screenshots and checks match the final Page.tsx.
  let final = []
  if (fs.existsSync(path.join(ws, "Page.tsx"))) {
    execFileSync(SANDBOX, [ws, `node ${SHOOT} .`], { stdio: "ignore" })
    final = JSON.parse(fs.readFileSync(path.join(ws, "checks.json"), "utf8"))
  }
  const usage = session.messages.filter((m) => m.role === "assistant").reduce((u, m) => ({ input: u.input + (m.usage?.input ?? 0), output: u.output + (m.usage?.output ?? 0) }), { input: 0, output: 0 })
  const sessionFile = session.sessionFile
  if (sessionFile && fs.existsSync(sessionFile)) fs.renameSync(sessionFile, path.join(ws, "session.jsonl"))
  fs.rmSync(priv, { recursive: true, force: true })
  fs.writeFileSync(path.join(ws, "meta.json"), JSON.stringify({
    case: name, design: { version: VERSION, file: path.relative(ROOT, DESIGN), sha: designHash },
    guide: GUIDE ? { file: path.relative(ROOT, GUIDE), sha: guideHash } : null, base: BASE ?? null, change: CHANGE,
    changedLines: baseWs ? lineDiff(path.join(baseWs, "Page.tsx"), path.join(ws, "Page.tsx")) : null,
    model: model.id, effort: EFFORT, shoots, seconds: Math.round((Date.now() - t0) / 1000), usage,
    stop: session.messages.at(-1)?.stopReason, checks: final,
    summary: session.messages.filter((m) => m.role === "assistant").at(-1)?.content?.filter((c) => c.type === "text").map((c) => c.text).join("") ?? "",
  }, null, 1))
  session.dispose()
  console.log(`${name}: done, ${shoots} shoots, ${final.length} check findings`)
}

await Promise.all(CASES.map((c) => generate(c).catch((e) => console.error(`${c}: FAIL ${e.stack ?? e}`))))
