// 调模型(OpenAI 兼容接口,流式):从 ui-judge/scripts/pairwise-judge.mjs 复制(2026-10-13),ui-rl 不再依赖那个目录。
// 改了两处:等开始回复的时限 60 秒 → 120 秒;回复不是合法 JSON 时,错误信息里带上出错位置前后的原文。
import fs from "node:fs"

export const img = (file) => ({ type: "image_url", image_url: { url: `data:image/png;base64,${fs.readFileSync(file).toString("base64")}` } })

// JUDGE_URL / JUDGE_MODEL switch to another OpenAI-compatible endpoint and model;
// JUDGE_EFFORT sets reasoning_effort (providers differ in how much "low" thinks).
export const JUDGE_URL = process.env.JUDGE_URL ?? "https://api.deepseek.com/chat/completions"
export const JUDGE_MODEL = process.env.JUDGE_MODEL ?? "deepseek-flash"
export const JUDGE_EFFORT = process.env.JUDGE_EFFORT ?? "low"
// JUDGE_MAX_TOKENS caps one reply, thinking included (the endpoint accepts far more than 32000).
export const JUDGE_MAX_TOKENS = Number(process.env.JUDGE_MAX_TOKENS ?? 131072)
// The reply is streamed. A request is dropped and sent again when nothing arrives: 60 seconds for
// the first bytes (reading a dozen screenshots takes the endpoint more than 10), then 10 seconds
// between chunks once the reply has started. A long reply that keeps arriving is not cut.
// ui-rl:试点时中转站忙,带十几张截图的请求常常 60 秒以上才开始回复;等开始回复的时限改成 120 秒(JUDGE_FIRST_MS 可调)。
const FIRST_MS = Number(process.env.JUDGE_FIRST_MS ?? 120_000), IDLE_MS = 10_000
// onText: called with each piece of the reply as it arrives. Thinking is not passed: onThink(seconds) is
// called when it starts and every 30 seconds while it lasts, so a long think still shows progress.
export async function call(sys, content, { key, model = JUDGE_MODEL, effort = JUDGE_EFFORT, onText, onThink, label }) {
  const body = { model, messages: [{ role: "system", content: sys }, { role: "user", content }], response_format: { type: "json_object" }, reasoning_effort: effort, max_tokens: JUDGE_MAX_TOKENS, stream: true, stream_options: { include_usage: true } }
  for (let attempt = 0; ; attempt++) {
    const t0 = Date.now()
    const ac = new AbortController()
    let idle = setTimeout(() => ac.abort(new Error(`${FIRST_MS / 1000} 秒没有开始回复`)), FIRST_MS)
    const alive = () => { clearTimeout(idle); idle = setTimeout(() => ac.abort(new Error("10 秒没有收到回复")), IDLE_MS) }
    try {
      const r = await fetch(JUDGE_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ac.signal,
      })
      if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 300)}`)
      let buf = "", text = "", usage, thought = 0, finish
      const dec = new TextDecoder()
      for await (const chunk of r.body) {
        // Keep-alive lines (": ...") before the reply starts do not count as the reply.
        if (text || /"delta"/.test(dec.decode(chunk, { stream: false }))) alive()
        buf += dec.decode(chunk, { stream: true })
        let i
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i).trim()
          buf = buf.slice(i + 1)
          if (!line.startsWith("data:")) continue
          const data = line.slice(5).trim()
          if (data === "[DONE]") continue
          const j = JSON.parse(data)
          const d = j.choices?.[0]?.delta ?? {}
          if (d.reasoning_content && !text && Date.now() - thought >= 30_000) { thought = Date.now(); onThink?.(Math.round((thought - t0) / 1000)) }
          if (d.content) { text += d.content; onText?.(d.content) }
          if (j.usage) usage = j.usage
          if (j.choices?.[0]?.finish_reason) finish = j.choices[0].finish_reason
        }
      }
      if (!text) throw new Error(`服务端返回空回复(finish_reason ${finish ?? "无"},输出 ${usage?.completion_tokens ?? 0} token)`)
      // Some replies wrap the JSON in a ```json fence despite response_format.
      const reply = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "")
      try {
        return { json: JSON.parse(reply), raw: text, usage, latencyMs: Date.now() - t0 }
      } catch (e) {
        // ui-rl 加的:解析失败时把出错位置前后的原文带进错误信息,看得出是哪里写坏了
        const at = Number(e.message.match(/position (\d+)/)?.[1] ?? 0)
        throw new Error(`${e.message};原文 …${reply.slice(Math.max(0, at - 60), at + 40)}…`)
      }
    } catch (e) {
      if (attempt >= 3) throw e
      // Say so, so a slow or failing endpoint is visible while it happens.
      if (label) console.log(`  ↻ ${label}:第 ${attempt + 1} 次请求失败(${String(e.message).slice(0, 220)}),${2 * 2 ** attempt} 秒后重试`)
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt))
    } finally {
      clearTimeout(idle)
    }
  }
}
