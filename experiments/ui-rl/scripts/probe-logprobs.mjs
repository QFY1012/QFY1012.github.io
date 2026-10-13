// 第 0 阶段 0.1:看 judge 端点能不能返回评分 token 的概率(logprobs)。
//
//   source judge.env && node experiments/ui-rl/scripts/probe-logprobs.mjs [--url <endpoint>] [--model <model>]
//
// 发一个带两张截图的小比较,要模型最后只输出一个 1–9 的数字,分别试:
//   思考模式 high / 不思考,流式 / 非流式。
// 每种组合打印:请求是否成功、返回里有没有 logprobs、最后那个数字位置的 top_logprobs(1–9 的概率和期望)。
// 结果也写到 experiments/ui-rl/runs/probe/<时间>.json。
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d)
const URL = arg("url", process.env.JUDGE_URL ?? "https://api.deepseek.com/chat/completions")
const MODEL = arg("model", process.env.JUDGE_MODEL ?? "deepseek-v4.1-flash")
const KEY = process.env.DEEPSEEK_API_KEY
if (!KEY) throw new Error("set DEEPSEEK_API_KEY (source judge.env)")

// 一对真实页面的缩略图(第 0 阶段标注集里的第一对)
const pairs = JSON.parse(fs.readFileSync(path.join(ROOT, "labels", "pairs.json"), "utf8"))
const img = (f) => ({ type: "image_url", image_url: { url: `data:image/webp;base64,${fs.readFileSync(path.join(ROOT, "labels", "pages", f)).toString("base64")}` } })
const SYS = "你比较同一份报告的两版页面 A 和 B 哪版设计更好。先简短想一想,最后只输出一个数字,不要输出任何别的内容:1 = A 明显更好,5 = 差不多,9 = B 明显更好。"
const content = [{ type: "text", text: "A:" }, img(pairs[0].left), { type: "text", text: "B:" }, img(pairs[0].right), { type: "text", text: "只输出一个 1–9 的数字。" }]

// 最后一个是 1–9 数字的 token 位置,取它的 top_logprobs
function digitDist(lp) {
  if (!lp?.length) return null
  for (let i = lp.length - 1; i >= 0; i--) {
    if (/^\s*[1-9]\s*$/.test(lp[i].token)) {
      const probs = {}
      for (const t of lp[i].top_logprobs ?? []) {
        const d = t.token.trim()
        if (/^[1-9]$/.test(d)) probs[d] = (probs[d] ?? 0) + Math.exp(t.logprob)
      }
      const mass = Object.values(probs).reduce((a, b) => a + b, 0)
      const E = mass ? Object.entries(probs).reduce((s, [d, p]) => s + Number(d) * p, 0) / mass : null
      return { token: lp[i].token, top: lp[i].top_logprobs?.length ?? 0, probs, mass: +mass.toFixed(3), expected: E && +E.toFixed(3) }
    }
  }
  return { token: null }
}

async function probe({ think, stream }) {
  const label = `${think ? "思考 high" : "不思考"} · ${stream ? "流式" : "非流式"}`
  console.log(`开始:${label}`)
  const body = {
    model: MODEL, messages: [{ role: "system", content: SYS }, { role: "user", content }],
    logprobs: true, top_logprobs: 20, max_tokens: 8000, stream,
    ...(think ? { reasoning_effort: "high" } : { thinking: { type: "disabled" } }),
  }
  const t0 = Date.now()
  try {
    const r = await fetch(URL, { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (!r.ok) {
      const err = `${r.status} ${(await r.text()).slice(0, 300)}`
      console.log(`  失败:${err}`)
      return { label, ok: false, err }
    }
    let text = "", lp = [], reasoning = 0
    if (!stream) {
      const j = await r.json()
      const ch = j.choices?.[0]
      text = ch?.message?.content ?? ""
      reasoning = (ch?.message?.reasoning_content ?? "").length
      lp = ch?.logprobs?.content ?? []
    } else {
      const dec = new TextDecoder()
      let buf = ""
      for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true })
        let i
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i).trim()
          buf = buf.slice(i + 1)
          if (!line.startsWith("data:") || line.includes("[DONE]")) continue
          const ch = JSON.parse(line.slice(5)).choices?.[0]
          if (ch?.delta?.content) text += ch.delta.content
          if (ch?.delta?.reasoning_content) reasoning += ch.delta.reasoning_content.length
          if (ch?.logprobs?.content) lp.push(...ch.logprobs.content)
        }
      }
    }
    const dist = digitDist(lp)
    const res = { label, ok: true, seconds: Math.round((Date.now() - t0) / 1000), text: text.trim().slice(0, 80), reasoningChars: reasoning, logprobTokens: lp.length, dist }
    console.log(`  完成(${res.seconds} 秒):回答「${res.text}」,思考 ${reasoning} 字,logprobs ${lp.length} 个 token`)
    console.log(`  数字位置:${dist ? JSON.stringify(dist) : "没有 logprobs"}`)
    return res
  } catch (e) {
    console.log(`  出错:${e.message}`)
    return { label, ok: false, err: e.message }
  }
}

console.log(`端点 ${URL.replace(/\/\/([^/]+)/, (m, h) => `//${h}`)},模型 ${MODEL}`)
const results = []
for (const think of [true, false]) for (const stream of [false, true]) results.push(await probe({ think, stream }))
const out = path.join(ROOT, "runs", "probe")
fs.mkdirSync(out, { recursive: true })
const file = path.join(out, `${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
fs.writeFileSync(file, JSON.stringify({ url: URL, model: MODEL, results }, null, 1))
console.log(`写出 ${path.relative(process.cwd(), file)}`)
