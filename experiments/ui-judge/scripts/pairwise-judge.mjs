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
//   crowd         principle 2 names both kinds of crowding as a serious defect
//   crowd-anchor  crowd, plus one crowded page shown as a reference (ANCHOR_TEXT)
//   dims          the decoupled DIMENSIONS, judged one by one in one call, then a verdict
//   dims-sep      one call per dimension (systemForDim); the verdict is the majority (scripts/evalset-judge.mjs)
export const ROOMY_2 = "2. 留白要充足且成形:内容挤满页面、各部分之间缺少明显间隔是缺点;空白应是规整、与网格对齐的整块区域,而不是零碎、不规则的剩余空间;大面积而规整的留白不是缺点。"
// Crowding of both kinds the person named: content spread over the full width
// with no room around it, and a block packed with different things that are not
// spaced apart.
export const CROWD_2 = "2. 留白充足且成形:版面要有呼吸空间。拥挤是严重缺点,有两种:一是内容铺满整个页宽、四周不留余地;二是同一区块里塞进多种不同内容,彼此没有拉开间距。不同类内容之间的间距应明显大于同类内容之间的间距。拥挤不能用「紧凑」「统一」「信息完整」来抵消。空白应是规整、与网格对齐的整块区域,而不是零碎、不规则的剩余空间;大面积而规整的留白不是缺点,只放标题的边栏留白也不是。"
export const ANCHOR_TEXT = "参考示例(另一版页面,不参与本次比较):下图是典型的拥挤页面。内容铺满整个页宽、四周没有余地;每个区块都塞得很满,区块之间只隔一条细缝,不同内容之间没有拉开间距。它看起来紧凑、信息完整,但这是差的设计。"
// Decoupled dimensions: each looks at one thing and says what it leaves out,
// so that no two share a concept (spacing amount, spacing relations, alignment,
// emphasis, consistency, ink, finish).
export const DIMENSIONS = [
  { id: "space", name: "空间", look: "有没有呼吸空间:内容是否铺满页宽、四周有无余地;区块里是否塞得太满", skip: "空白的形状、是否对齐" },
  { id: "grouping", name: "分组", look: "间距是否表达关系:组与组之间的距离明显大于组内,一眼看出哪些内容是一组", skip: "空白的总量" },
  { id: "alignment", name: "对齐", look: "元素是否落在少数几条共用的对齐线上,留白是否成整块", skip: "间距的大小" },
  { id: "hierarchy", name: "层级", look: "最重要的信息是否最先被看到;字号、字重种类少,层级清楚", skip: "元素的位置" },
  { id: "consistency", name: "一致", look: "同类元素是否同样处理(间距、字号、组件样式)", skip: "好不好看" },
  { id: "ink", name: "装饰", look: "容器、边框、底色、阴影、线条、颜色是否必要且克制,颜色只表达含义", skip: "排版" },
  { id: "finish", name: "细节", look: "中文全角标点、数字字体统一、文字不截断不溢出", skip: "布局" },
]
const INTRO = "你是资深 UI 视觉设计评审。下面是同一份报告的两版页面设计 A 和 B,数据相同。只比较视觉设计,不比较内容。"
const dimLine = (d, i) => `${i + 1}. ${d.name}:只看${d.look}。不看${d.skip}。`
// One dimension per call: the judge sees no other dimension and gives no overall verdict.
export const systemForDim = (d) => `${INTRO}

这次只比较一个方面——${d.name}。
只看:${d.look}。
不看:${d.skip}。页面在其他方面再好或再差,都不影响这一项。两版在这一方面差不多时回答「平」。

只输出 JSON:{"better":"A"、"B" 或 "平","reason":"一两句话"}`

export function systemFor(cond) {
  if (cond === "dims")
    return `${INTRO}

评审维度(每一维只看一件事):
${DIMENSIONS.map(dimLine).join("\n")}

逐维独立判断:评某一维时只看这一维,不受整体印象和其他维度的影响;两版在不同维度上互有胜负是正常的。每维给出 "A"、"B" 或 "平",再综合判断哪一版更好。
只输出 JSON:{"dims":{${DIMENSIONS.map((d) => `"${d.id}":"A|B|平"`).join(",")}},"better":"A" 或 "B","reason":"一两句话"}`
  if (cond === "principles") return system(true)
  if (cond === "crowd" || cond === "crowd-anchor") return system(true).replace(/^2\. .*$/m, CROWD_2)
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
