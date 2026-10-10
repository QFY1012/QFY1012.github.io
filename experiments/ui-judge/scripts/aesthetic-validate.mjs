// Validate the stage-3 pairwise judge on new reports it was not tuned on.
//
//   DEEPSEEK_API_KEY=... node scripts/aesthetic-validate.mjs [--repeats 3] [--effort low]
//
// Pages: out/validate/<report>-<n>/ (scripts/render-pages.mjs + cut-pages.py).
// Every pair of layouts of the same report, in both orders, under three conditions:
//   base        no principles, each page as thumbnail + tiles (as in the probe)
//   principles  the six style-independent principles added
//   psbs        principles, the two pages side by side in one image
// Results: out/aesthetic/validate/<cond>__<a>__<b>__r<n>.json (a is shown as A).
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const REPEATS = Number(arg("repeats", "3"))
const EFFORT = arg("effort", "low")
const MODEL = arg("model", "deepseek-flash")
const CONDS = arg("conds", "base,principles,psbs").split(",")
const KEY = process.env.DEEPSEEK_API_KEY
if (!KEY) throw new Error("set DEEPSEEK_API_KEY")
const VDIR = path.join(ROOT, "out", "validate")
const OUT = path.join(ROOT, "out", "aesthetic", "validate")
fs.mkdirSync(OUT, { recursive: true })

// Same wording as scripts/aesthetic.mjs.
const PRINCIPLE_TEXT = `评审标准(与具体风格无关):
1. 装饰必须表达信息:卡片、边框、底色、阴影、颜色只用于区分真正独立的对象或表达状态;能用间距分组的,不必再加容器。
2. 留白要成形:空白应是规整、与网格对齐的整块区域,而不是零碎、不规则的剩余空间;大面积而规整的留白不是缺点。
3. 主次分明:同一水平带里的内容要么同类、分量相同,要么有明显的主次;分量相当的不同内容并排是问题。
4. 疏密一致:同类元素的行距和间距一致,不为凑齐高度而拉开或压缩。
5. 有系统:整页使用统一的间距层级和对齐主轴,字号种类少且层级明确。
6. 精致:图形线条克制,颜色只表达含义;中文使用全角标点,数字字体统一。

`
const system = (principles) => `你是资深 UI 视觉设计评审。下面是同一份报告的两版页面设计 A 和 B,数据相同。只比较视觉设计质量:整体的比例、疏密节奏、主次对比、对齐与留白、组件和字体的精致度。不比较内容。

${principles ? PRINCIPLE_TEXT : ""}
判断哪一版更好。只输出 JSON:{"better":"A" 或 "B","reason":"一两句话"}`

const img = (file) => ({ type: "image_url", image_url: { url: `data:image/png;base64,${fs.readFileSync(file).toString("base64")}` } })
function pageImages(v) {
  const d = path.join(VDIR, v)
  const tiles = JSON.parse(fs.readFileSync(path.join(d, "clean-tiles.json"), "utf8"))
  return [img(path.join(d, "thumb.png")), ...tiles.map((t) => img(path.join(d, t.file)))]
}

async function call(sys, content) {
  const body = { model: MODEL, messages: [{ role: "system", content: sys }, { role: "user", content }], response_format: { type: "json_object" }, reasoning_effort: EFFORT, max_tokens: 32000 }
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
      const msg = j.choices[0].message
      return { json: JSON.parse(msg.content), raw: msg.content, usage: j.usage, latencyMs: Date.now() - t0 }
    } catch (e) {
      if (attempt >= 3) throw e
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt))
    }
  }
}

const pages = fs.readdirSync(VDIR).filter((d) => !d.startsWith("_")).sort()
const reports = [...new Set(pages.map((p) => p.split("-")[0]))]
const jobs = []
for (let r = 1; r <= REPEATS; r++)
  for (const cond of CONDS)
    for (const rep of reports) {
      const ps = pages.filter((p) => p.startsWith(rep + "-"))
      for (const a of ps)
        for (const b of ps) {
          if (a === b) continue
          jobs.push({
            file: `${cond}__${a}__${b}__r${r}.json`,
            run: () => {
              if (cond === "psbs")
                return call(system(true), [
                  { type: "text", text: "下图是两版整页并排、同一比例:左边是 A 版,右边是 B 版。" },
                  img(path.join(VDIR, "_pairs", `${a}__${b}.png`)),
                ])
              const pa = pageImages(a), pb = pageImages(b)
              return call(system(cond === "principles"), [
                { type: "text", text: `A 版:第 1 张为整页缩略图,后 ${pa.length - 1} 张为整页切块。` },
                ...pa,
                { type: "text", text: `B 版:第 1 张为整页缩略图,后 ${pb.length - 1} 张为整页切块。` },
                ...pb,
              ])
            },
          })
        }
    }

let failed = 0, done = 0
const total = jobs.length
async function worker() {
  while (jobs.length) {
    const job = jobs.shift()
    const file = path.join(OUT, job.file)
    if (fs.existsSync(file)) { done++; continue }
    try {
      fs.writeFileSync(file, JSON.stringify({ effort: EFFORT, ...(await job.run()) }, null, 1))
    } catch (e) {
      failed++
      console.error(`FAIL ${job.file}: ${e.message}`)
    }
    if (++done % 20 === 0) console.log(`${done}/${total}`)
  }
}
await Promise.all(Array.from({ length: 10 }, worker))
console.log(`done, ${failed} failed → ${path.relative(ROOT, OUT)}`)
