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
export async function runAgent({ name, ws, priv, system, prompt, nudges = [], missing = () => false, maxShoots = 5 }) {
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
      if (/node\s+("?\$SHOOT"?|\S*shoot\.mjs)/.test(command) && ++shoots > maxShoots) command = `echo "检查已运行 ${maxShoots} 次,不能再运行;请结束。"`
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
    thinkingLevel: EFFORT,
    authStorage: auth,
    modelRegistry: ModelRegistry.inMemory(auth),
    resourceLoader: loader,
    noTools: "builtin",
    customTools: [fence(createReadToolDefinition(ws)), fence(createWriteToolDefinition(ws)), fence(createEditToolDefinition(ws)), bash],
    sessionManager: SessionManager.create(ws, priv),
    settingsManager: SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: true, maxRetries: 3 } }),
  })
  const t0 = Date.now()
  // live.md in <priv>: the reply being streamed (thinking and text), so a long step can be read
  // before it ends; the session file only gets a reply once it is complete.
  const live = path.join(priv, "live.md")
  let lastLive = 0
  session.subscribe((e) => {
    if (e.type === "tool_execution_start") console.log(`${name}: ${e.toolName} ${String(e.args?.path ?? e.args?.command ?? "").slice(0, 70)}`)
    if (e.type === "message_update" && Date.now() - lastLive > 5000) {
      lastLive = Date.now()
      const parts = (e.message.content ?? []).map((c) => c.type === "thinking" ? `[thinking]\n${c.thinking}` : c.type === "text" ? c.text : c.type === "toolCall" ? `[tool ${c.name}] ${JSON.stringify(c.arguments ?? {}).slice(0, 2000)}` : "")
      fs.writeFileSync(live, `${new Date().toISOString()}\n\n${parts.join("\n\n")}`)
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
    model: model.id, effort: EFFORT, shoots, seconds: Math.round((Date.now() - t0) / 1000), usage,
    stop: session.messages.at(-1)?.stopReason,
    summary: session.messages.filter((m) => m.role === "assistant").at(-1)?.content?.filter((c) => c.type === "text").map((c) => c.text).join("") ?? "",
  }
  session.dispose()
  return out
}
