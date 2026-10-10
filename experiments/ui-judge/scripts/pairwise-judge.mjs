// The stage-3 pairwise judge: prompt and API call, shared by the validation
// run (scripts/aesthetic-validate.mjs) and the eval set (scripts/evalset-judge.mjs).
import fs from "node:fs"

// Same wording as scripts/aesthetic.mjs.
export const PRINCIPLE_TEXT = `评审标准(与具体风格无关):
1. 装饰必须表达信息:卡片、边框、底色、阴影、颜色只用于区分真正独立的对象或表达状态;能用间距分组的,不必再加容器。
2. 留白要成形:空白应是规整、与网格对齐的整块区域,而不是零碎、不规则的剩余空间;大面积而规整的留白不是缺点。
3. 主次分明:同一水平带里的内容要么同类、分量相同,要么有明显的主次;分量相当的不同内容并排是问题。
4. 疏密一致:同类元素的行距和间距一致,不为凑齐高度而拉开或压缩。
5. 有系统:整页使用统一的间距层级和对齐主轴,字号种类少且层级明确。
6. 精致:图形线条克制,颜色只表达含义;中文使用全角标点,数字字体统一。

`
export const system = (principles) => `你是资深 UI 视觉设计评审。下面是同一份报告的两版页面设计 A 和 B,数据相同。只比较视觉设计质量:整体的比例、疏密节奏、主次对比、对齐与留白、组件和字体的精致度。不比较内容。

${principles ? PRINCIPLE_TEXT : ""}
判断哪一版更好。只输出 JSON:{"better":"A" 或 "B","reason":"一两句话"}`

// Variants under test on the eval set (scripts/evalset-judge.mjs --cond):
//   principles    the prompt above (baseline)
//   roomy         principle 2 also names crowding as a defect
//   perprinciple  the same principles, compared one by one before the verdict
export const ROOMY_2 = "2. 留白要充足且成形:内容挤满页面、各部分之间缺少明显间隔是缺点;空白应是规整、与网格对齐的整块区域,而不是零碎、不规则的剩余空间;大面积而规整的留白不是缺点。"
export function systemFor(cond) {
  if (cond === "principles") return system(true)
  if (cond === "roomy") return system(true).replace(/^2\. .*$/m, ROOMY_2)
  if (cond === "perprinciple")
    return system(true).replace(
      /判断哪一版更好。只输出 JSON:.*$/m,
      '先按六条标准逐条比较两版,每条给出 "A"、"B" 或 "平";再综合判断哪一版更好。只输出 JSON:{"principles":{"1":"A|B|平","2":"…","3":"…","4":"…","5":"…","6":"…"},"better":"A" 或 "B","reason":"一两句话"}',
    )
  throw new Error(`unknown cond ${cond}`)
}

export const img = (file) => ({ type: "image_url", image_url: { url: `data:image/png;base64,${fs.readFileSync(file).toString("base64")}` } })

export async function call(sys, content, { key, model = "deepseek-flash", effort = "low" }) {
  const body = { model, messages: [{ role: "system", content: sys }, { role: "user", content }], response_format: { type: "json_object" }, reasoning_effort: effort, max_tokens: 32000 }
  for (let attempt = 0; ; attempt++) {
    const t0 = Date.now()
    try {
      const r = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
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
