// Ask the LLM judge to find and mark UI problems on rendered samples.
//
//   DEEPSEEK_API_KEY=... node scripts/judge.mjs [--run pilot] [--modes shot,dom,both,geo]
//                                               [--repeats 3] [--only review.3.4-o,...]
//                                               [--effort low|high|max]
//
// Modes (the JSON data is always given):
//   shot  numbered screenshot only
//   dom   numbered DOM list only
//   both  screenshot + DOM list
//   geo   screenshot + DOM list + program geometry (layout gaps, type levels)
//
// Results: out/judge/<run>/<sample>__<mode>__r<k>.json (skipped if present).
import fs from "node:fs"
import path from "node:path"

import { CHECKS, rubricText } from "./rubric.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const RUN = arg("run", "pilot")
const MODES = arg("modes", "shot,dom,both,geo").split(",")
const REPEATS = Number(arg("repeats", "3"))
const ONLY = arg("only", "")
const MODEL = arg("model", "deepseek-flash")
const CONCURRENCY = Number(arg("concurrency", "8"))
const EFFORT = arg("effort", "low")
const KEY = process.env.DEEPSEEK_API_KEY
if (!KEY) throw new Error("set DEEPSEEK_API_KEY")

const OUT = path.join(ROOT, "out", "judge", RUN)
fs.mkdirSync(OUT, { recursive: true })

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "samples", "manifest.json"), "utf8"))
const samples = manifest.filter((m) => !ONLY || ONLY.split(",").includes(m.sample))

// ---- inputs ---------------------------------------------------------------
function domText(nodes) {
  return nodes
    .map((n) => {
      const parts = [n.nid, n.slot, `parent=${n.parent ?? "-"}`, `x=${n.x} y=${n.y} w=${n.w} h=${n.h}`]
      if (n.colSpan) parts.push(`colSpan=${n.colSpan}`)
      if (n.text) {
        parts.push(`font=${n.fontSize}px/${n.fontWeight}`)
        if (n.textAlign) parts.push(`align=${n.textAlign}`)
        parts.push(`text="${n.text}"`)
      }
      return parts.join(" ")
    })
    .join("\n")
}

function geoText(geo) {
  const layout = geo.layout
    .map((l) => {
      let s = `${l.container} ${l.slot}: ${l.gaps[0].between[0]}`
      for (const g of l.gaps) s += ` -${g.dir}${g.gap}- ${g.between[1]}`
      return s
    })
    .join("\n")
  const type = geo.typeLevels
    .map((t) => `L${t.level} ${t.fontSize}px/${t.fontWeight} ×${t.count}: ${t.nids.slice(0, 12).join(" ")}${t.nids.length > 12 ? " …" : ""}`)
    .join("\n")
  return `【布局与间距】每行为一个容器及其子节点,-y24- 表示上下间距 24px,-x24- 表示左右间距 24px\n${layout}\n\n【字号层级】由大到小\n${type}`
}

const SYSTEM = `你是资深 UI 设计评审。你要检查一个由组件库自动生成的报告页面,找出违反检查项的地方,并用节点编号标出问题元素。

页面规范:shadcn/ui 组件库;1152px 宽的 12 列网格,列间距 24px,基础单位 8px。

检查项:
${rubricText()}

要求:
1. 只报告确实违反检查项的问题;没有问题就返回空列表。不要报告检查项以外的问题。
2. 每个问题必须给出出问题的节点编号(只能使用输入中真实存在的编号),标到最能说明问题的元素上,可以标多个。
3. 同一检查项在不同位置出现,分成多条报告。
4. 只输出 JSON,格式:{"findings":[{"check":"3.4","nodes":["n12","n30"],"reason":"一句话说明"}]}`

function userContent(sample, mode) {
  const dir = path.join(ROOT, "out", "render", sample.sample)
  const dom = JSON.parse(fs.readFileSync(path.join(dir, "dom.json"), "utf8"))
  const data = fs.readFileSync(path.join(ROOT, "data", `${sample.report}.json`), "utf8")
  const parts = [`【JSON 数据】页面要呈现的全部信息\n${data}`]
  if (mode !== "shot") parts.push(`【DOM 清单】每行一个节点:编号 组件 父节点 位置尺寸(px,页面坐标) 字号/字重 对齐 文字\n${domText(dom.nodes)}`)
  if (mode === "geo") parts.push(geoText(JSON.parse(fs.readFileSync(path.join(dir, "geometry.json"), "utf8"))))
  if (mode !== "dom") {
    const ranges = dom.tiles.map((t, i) => `图 ${i + 1}:y=${t.y}–${t.y + t.h}`).join(";")
    parts.push(`【截图】整页截图从上到下切成 ${dom.tiles.length} 张,相邻两张重叠 64px(${ranges})。每张宽 1248px,左边缘对应页面 x=${dom.clipX}。洋红色小标签是节点编号,标在节点左上角的正上方。`)
  }
  const content = [{ type: "text", text: parts.join("\n\n") }]
  if (mode !== "dom") {
    for (const t of dom.tiles) {
      const png = fs.readFileSync(path.join(dir, t.file)).toString("base64")
      content.push({ type: "image_url", image_url: { url: `data:image/png;base64,${png}` } })
    }
  }
  // Node ids the judge can legitimately cite in this mode.
  const valid = mode === "shot" ? dom.nodes.filter((n) => n.spec).map((n) => n.nid) : dom.nodes.map((n) => n.nid)
  return { content, valid }
}

// ---- call -----------------------------------------------------------------
async function call(content) {
  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content },
    ],
    response_format: { type: "json_object" },
    reasoning_effort: EFFORT,
    max_tokens: 32000,
  }
  for (let attempt = 0; ; attempt++) {
    const t0 = Date.now()
    try {
      const r = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(600_000),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 300)}`)
      return { ...j, latencyMs: Date.now() - t0 }
    } catch (e) {
      if (attempt >= 3) throw e
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt))
    }
  }
}

function parse(text, valid) {
  let obj
  try {
    obj = JSON.parse(text)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    obj = m ? JSON.parse(m[0]) : { findings: [] }
  }
  const validSet = new Set(valid)
  return (obj.findings ?? []).map((f) => {
    const nodes = (f.nodes ?? []).map(String)
    return {
      check: String(f.check),
      nodes,
      invalidNodes: nodes.filter((n) => !validSet.has(n)),
      knownCheck: CHECKS.some((c) => c.id === String(f.check)),
      reason: f.reason,
    }
  })
}

// ---- run ------------------------------------------------------------------
const jobs = []
for (const s of samples) for (const mode of MODES) for (let r = 1; r <= REPEATS; r++) jobs.push({ s, mode, r })

let done = 0
let failed = 0
async function worker() {
  while (jobs.length) {
    const { s, mode, r } = jobs.shift()
    const file = path.join(OUT, `${s.sample}__${mode}__r${r}.json`)
    if (fs.existsSync(file)) {
      done++
      continue
    }
    try {
      const { content, valid } = userContent(s, mode)
      const res = await call(content)
      const msg = res.choices[0].message
      const findings = parse(msg.content, valid)
      fs.writeFileSync(
        file,
        JSON.stringify({ sample: s.sample, mode, repeat: r, model: MODEL, effort: EFFORT, finish: res.choices[0].finish_reason, findings, raw: msg.content, reasoning: msg.reasoning_content, usage: res.usage, latencyMs: res.latencyMs }, null, 1),
      )
    } catch (e) {
      failed++
      console.error(`FAIL ${s.sample} ${mode} r${r}: ${e.message}`)
    }
    done++
    if (done % 10 === 0) console.log(`${done} done${failed ? `, ${failed} failed` : ""}`)
  }
}
const total = jobs.length
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
console.log(`finished ${total} jobs, ${failed} failed → ${path.relative(ROOT, OUT)}`)
