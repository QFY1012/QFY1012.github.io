// One pi agent session in a workspace, shared by the page generator and the component agent.
// read / write / edit are limited to the workspace; every bash command runs in
// scripts/sandbox.sh (only the workspace is writable, no API keys, no network).
// The session file and credentials live in <priv>, outside the workspace.
import fs from "node:fs"
import path from "node:path"
import { getModel } from "@mariozechner/pi-ai"
import {
  AuthStorage, createAgentSession, createExtensionRuntime, ModelRegistry, SessionManager, SettingsManager,
  createBashToolDefinition, createEditToolDefinition, createReadToolDefinition, createWriteToolDefinition,
} from "@mariozechner/pi-coding-agent"

const ROOT = path.resolve(import.meta.dirname, "..")
export const SHOOT = path.join(ROOT, "scripts", "shoot.mjs")
export const SANDBOX = path.join(ROOT, "scripts", "sandbox.sh")
export const EFFORT = process.env.GEN_EFFORT ?? "high"

// The judge's endpoint and model, through pi's OpenAI-compatible client.
const base = getModel("deepseek", "deepseek-v4-flash")
export const model = {
  ...base,
  id: process.env.GEN_MODEL ?? process.env.JUDGE_MODEL ?? "deepseek-v4.1-flash",
  baseUrl: (process.env.JUDGE_URL ?? "https://api.deepseek.com/chat/completions").replace(/\/chat\/completions$/, ""),
  input: ["text", "image"],
  compat: { ...base.compat, thinkingFormat: "openai" },
}

// Runs prompt, then each nudge while missing() is still true. Returns what meta.json records.
export async function runAgent({ name, ws, priv, system, prompt, nudges = [], missing = () => false, maxShoots = 5, stream = false, effort = EFFORT }) {
  const KEY = process.env.DEEPSEEK_API_KEY
  if (!KEY) throw new Error("set DEEPSEEK_API_KEY (source judge.env)")
  const loader = {
    getExtensions: () => ({ extensions: [], errors: [], runtime: createExtensionRuntime() }),
    getSkills: () => ({ skills: [], diagnostics: [] }),
    getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }),
    getAgentsFiles: () => ({ agentsFiles: [] }),
    getSystemPrompt: () => system,
    getAppendSystemPrompt: () => [],
    extendResources: () => {},
    reload: async () => {},
  }
  const inside = (p) => {
    const abs = path.resolve(ws, p ?? "")
    return abs === ws || abs.startsWith(ws + path.sep)
  }
  const fence = (def) => ({
    ...def,
    execute: (id, params, ...rest) => (inside(params.path) ? def.execute(id, params, ...rest) : Promise.reject(new Error("只能访问工作目录内的文件"))),
  })
  // bash: every command runs in the sandbox; checks past the limit are refused.
  let shoots = 0
  const q = (x) => `'${x.replace(/'/g, `'\\''`)}'`
  const bash = createBashToolDefinition(ws, {
    spawnHook: ({ command }) => {
      const isShoot = /node\s+("?\$SHOOT"?|\S*shoot\.mjs)/.test(command)
      // ui-rl 加的:只允许用 node 运行检查脚本。自己写脚本截图、渲染会绕过检查次数的限制(试跑时有一版因此写了 20 分钟还没结束)
      if (!isShoot && command.split(/[;&|\n]+|\$\(|`/).some((seg) => /^\s*(?:\w+=\S*\s+)*(node|npx|npm|bun|deno|python3?)(\s|$)/.test(seg))) command = `echo "只能用 node $SHOOT . 检查页面,不能运行别的脚本;看页面用 read 读截图。"`
      else if (isShoot && ++shoots > maxShoots) command = `echo "检查已运行 ${maxShoots} 次,不能再运行;请结束。"`
      return { command: `${q(SANDBOX)} ${q(ws)} ${q(command)}`, cwd: ws, env: { PATH: process.env.PATH } }
    },
  })
  fs.rmSync(priv, { recursive: true, force: true })
  fs.mkdirSync(priv, { recursive: true })
  const auth = AuthStorage.create(path.join(priv, "auth.json"))
  auth.setRuntimeApiKey("deepseek", KEY)
  const { session } = await createAgentSession({
    cwd: ws,
    agentDir: path.join(priv, "pi"),
    model,
    thinkingLevel: effort,
    authStorage: auth,
    modelRegistry: ModelRegistry.inMemory(auth),
    resourceLoader: loader,
    noTools: "builtin",
    customTools: [fence(createReadToolDefinition(ws)), fence(createWriteToolDefinition(ws)), fence(createEditToolDefinition(ws)), bash],
    sessionManager: SessionManager.create(ws, priv),
    // A request the endpoint does not answer within 60 seconds is dropped and retried (the SDK
    // default waits 10 minutes). The deadline is for the response to start; a long streamed reply is not cut.
    // ui-rl:ui-loop 原来是 10 秒。读了 9 张以上截图后,中转站常常 10 秒以上才开始回复,10 秒会把它当成超时、重发,
    // 试跑时每版浪费 2–5 次、每次 30 多秒,v2 连续 4 次后会话中断。改成和 judge 一样的 60 秒。
    settingsManager: SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: true, maxRetries: 3, provider: { timeoutMs: 60_000 } } }),
  })
  const t0 = Date.now()
  // stream: print the reply to stdout as it arrives (text and tool calls; thinking only marked), with the wait
  // before it starts; for one agent at a time (parallel agents would interleave). Otherwise one
  // line per tool call.
  const hhmmss = () => new Date().toLocaleTimeString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" })
  let asked = 0, kind = ""
  const say = (k, text) => {
    if (k !== kind) process.stdout.write(`\n[${k}] `)
    kind = k
    process.stdout.write(text)
  }
  session.subscribe((e) => {
    if (!stream) {
      if (e.type === "tool_execution_start") console.log(`${name}: ${e.toolName} ${String(e.args?.path ?? e.args?.command ?? "").slice(0, 70)}`)
      return
    }
    if (e.type === "turn_start") {
      asked = Date.now()
      kind = ""
      process.stdout.write(`\n\n── ${name} ${hhmmss()} 请求模型`)
    } else if (e.type === "message_update") {
      const a = e.assistantMessageEvent
      if (a.type === "start") process.stdout.write(`,${((Date.now() - asked) / 1000).toFixed(0)} 秒后开始回复`)
      // Thinking is not printed, only marked.
      else if (a.type === "thinking_start") say("思考中…", "")
      else if (a.type === "text_delta") say("回复", a.delta)
    } else if (e.type === "tool_execution_start") {
      kind = ""
      process.stdout.write(`\n[工具] ${e.toolName} ${String(e.args?.path ?? e.args?.command ?? "").slice(0, 200)}`)
    } else if (e.type === "message_end" && e.message.role === "assistant") {
      const u = e.message.usage ?? {}
      process.stdout.write(`\n── ${hhmmss()} 本步 ${((Date.now() - asked) / 1000).toFixed(0)} 秒,输出 ${u.output ?? "?"} token${e.message.errorMessage ? `,出错:${e.message.errorMessage}` : ""}`)
    }
  })
  await session.prompt(prompt)
  // The model sometimes ends a turn after long thinking without writing anything.
  for (const n of nudges) {
    if (!missing()) break
    console.log(`${name}: nudge`)
    await session.prompt(n)
  }
  const usage = session.messages.filter((m) => m.role === "assistant").reduce((u, m) => ({ input: u.input + (m.usage?.input ?? 0), output: u.output + (m.usage?.output ?? 0) }), { input: 0, output: 0 })
  const sessionFile = session.sessionFile
  if (sessionFile && fs.existsSync(sessionFile)) fs.renameSync(sessionFile, path.join(ws, "session.jsonl"))
  fs.rmSync(priv, { recursive: true, force: true })
  const out = {
    model: model.id, effort, shoots, seconds: Math.round((Date.now() - t0) / 1000), usage,
    stop: session.messages.at(-1)?.stopReason,
    summary: session.messages.filter((m) => m.role === "assistant").at(-1)?.content?.filter((c) => c.type === "text").map((c) => c.text).join("") ?? "",
  }
  session.dispose()
  return out
}
