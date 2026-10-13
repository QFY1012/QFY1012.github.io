// 第 2 阶段:准备交互流程挖掘的报告数据。
//
//   source judge.env && node experiments/ui-rl/data/gen-data.mjs [--ids f7,f8] [--workers 6]
//
// 1. 原有 f1–f6 已在 data/flow 里(2026-10-13 从 ui-loop/skills/flow/data 一次性复制过来,连同截图),这里只校验。
//    f6 有两处原数据的错,复制时改掉了:摘要「6 到 9 步」→「5 到 9 步」(各产品实际 5–9 步);问题 P6 指向的
//    云途第 6 步原来没有备注,补了「没有常用乘机人,每次手动填 3 项」。ui-loop 里的原文件没动,第 0 阶段的页面是用原文件生成的。
// 2. 新写 f7–f24:按 SPECS 的规格(产品数、步骤数、问题数、有没有阶段对比和共性做法、备注多少、文字详略)让模型写原始内容,
//    程序校验(lib/features.mjs 的 check),不通过把问题发回去改,最多改 2 次;通过后补齐派生字段(assemble),画截图。
//    已有 <id>.json 的跳过。每次请求和回复存在 cache/gen-data/。
// 3. 写 data/flow/specs.json(每份的规格和算出的数据特征)和 data/split.json。
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { call } from "../lib/llm.mjs"
import { features, describe, check, assemble, NOTES, SUMMARY } from "../lib/features.mjs"
import { phone, BRAND } from "./draw.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const OUT = path.join(ROOT, "data", "flow")
const CACHE = path.join(ROOT, "cache", "gen-data")
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d)
const MODEL = process.env.GEN_DATA_MODEL ?? "deepseek-v4.1-flash"
const KEY = process.env.DEEPSEEK_API_KEY

// 每份新数据的规格。tier:小 / 中 / 大;steps:每个产品的步骤数范围;notes:有备注的步骤多少;text:摘要详略
const S = (topic, tier, products, steps, issues, suggestions, stages, patterns, notes, text) => ({ topic, tier, products, steps, issues, suggestions, stages, patterns, notes, text })
const SPECS = {
  f7: S("寄快递(下单到预约上门取件)", "小", 2, [3, 4], 2, 1, false, false, "少", "简短"),
  f8: S("医院预约挂号", "中", 3, [5, 7], 4, 3, true, false, "中", "适中"),
  f9: S("取消视频会员自动续费", "中", 2, [6, 9], 3, 2, false, true, "多", "适中"),
  f10: S("酒店预订(搜索到支付)", "大", 5, [8, 11], 8, 5, true, true, "多", "详细"),
  f11: S("电影选座购票", "中", 4, [5, 7], 5, 3, true, true, "少", "适中"),
  f12: S("高校选课", "中", 3, [7, 9], 4, 3, false, false, "中", "详细"),
  f13: S("共享单车首次骑行(注册到开锁)", "小", 3, [3, 5], 2, 2, true, false, "中", "简短"),
  f14: S("智能音箱配网", "中", 2, [5, 8], 3, 3, true, false, "少", "简短"),
  f15: S("租车取车(下单到取车验车)", "中", 3, [6, 8], 5, 4, false, true, "多", "详细"),
  f16: S("家庭宽带报装", "大", 4, [10, 14], 7, 5, true, true, "中", "详细"),
  f17: S("健身房团课预约", "中", 4, [5, 6], 4, 3, false, false, "中", "适中"),
  f18: S("二手平台发布闲置", "中", 3, [5, 9], 3, 2, true, true, "中", "简短"),
  f19: S("注销账号", "小", 2, [4, 5], 1, 1, false, true, "少", "简短"),
  f20: S("在线问诊(选医生到拿到处方)", "中", 2, [7, 9], 4, 3, true, true, "多", "适中"),
  f21: S("跨行转账", "中", 3, [5, 7], 5, 4, false, false, "少", "详细"),
  f22: S("家政保洁预约", "大", 5, [6, 9], 6, 4, true, false, "多", "适中"),
  f23: S("物业报修", "小", 2, [3, 4], 2, 2, false, false, "多", "适中"),
  f24: S("信用卡在线申请", "大", 4, [12, 15], 6, 4, false, true, "中", "详细"),
}
// 划分:原有 f1–f6 都放训练(第 0、1 阶段反复用过);小中大三档在每组里都有。试点只用前一部分。
const SPLIT = {
  train: ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12"],
  val: ["f13", "f14", "f15", "f16", "f17", "f18"],
  test: ["f19", "f20", "f21", "f22", "f23", "f24"],
  pilot: { train: ["f1", "f2", "f3", "f4", "f7", "f8", "f9", "f10"], val: ["f13", "f14", "f15", "f16"] },
}
const SYSTEM = `你在模拟「交互流程挖掘」Skill 的输出,写一份虚构但前后一致的报告数据(JSON)。

这个 Skill 做的事:同一个任务(例如线上开户),对比 2–5 款产品完成它的逐屏链路;每一屏都有分析,再按阶段比较各产品,归纳共性做法、问题和建议。产品名、品牌都是虚构的。

输出一个 JSON 对象,字段如下(示例见用户消息):
- title:「交互流程挖掘 · 〈任务短名〉」
- task:一句话说清楚分析的任务
- scope:「N 款〈产品类别〉App,2026 年 M 月版本」,N 等于产品数
- date:「2026-MM-DD」
- summary:一段话的结论:各产品的关键差别和最重要的问题。提到步骤数时要和链路一致(「N 步」必须是某个产品的步骤数;「A 到 B 步」必须是最少到最多)
- chains:每个产品一项 {product, version, verdict, steps}
  - verdict:一句话评价这个产品的流程,不超过 16 字
  - steps:按顺序的每一屏 {screen, content, action, inputs, note}
    - screen:这一屏的名字,用常见叫法(首页、填写信息、选择时间、确认订单、支付、提交成功……),最后一步一般是成功或完成页
    - content:屏上有什么,2–4 项,用顿号分隔
    - action:用户在这一屏做什么进入下一步
    - inputs:这一屏要用户填写或输入的字段数(整数,没有就是 0)
    - note:分析备注,写这一屏的问题或好的做法;没有就写空字符串 ""
- stages(规格要求才写):按阶段对比,每行 {stage, 〈每个产品名〉: 简短描述},每个产品都要有一列
- patterns(规格要求才写):共性做法,每项 {name, products: [产品名…], comment}
- issues:问题,每项 {id, product, step, title, severity, evidence}
  - id 按顺序 P1、P2……;product 是某个产品名,所有产品都有的写「全部」;step 是这个产品里出问题的那一步的序号(从 1 数)
  - 指向具体产品的问题,那一步的 note 必须写出这个问题的现象
  - severity 只能是 高、中、低;evidence 写具体证据,要和链路里的数据一致
- suggestions:建议,每项 {id, title, detail, basis}
  - id 按顺序 A1、A2……;basis 是依据列表,每项是问题编号(如 "P1")或「〈产品名〉第 N 步」(参考的好做法,可以写「第 1、2 步」)

要求:
- 内容要像真实的产品分析:每屏的内容、操作、填写项数合理;各产品的差别具体;问题和建议有因果。
- 不用真实的 App 或公司名。
- 标点照示例:中文里用半角逗号「,」和冒号,数字和中文之间加空格,句号用「。」。
- 只输出 JSON,不要别的文字。`

// 示例:f1 的原始内容(去掉程序会算的字段)
const raw = (d) => ({
  title: d.title, task: d.task, scope: d.scope, date: d.date, summary: d.summary,
  chains: d.chains.map((c) => ({ product: c.product, version: c.version, verdict: c.verdict, steps: c.steps.map(({ screen, content, action, inputs, note }) => ({ screen, content, action, inputs, note })) })),
  ...(d.stages && { stages: d.stages }), ...(d.patterns && { patterns: d.patterns }),
  issues: d.issues, suggestions: d.suggestions,
})
const EXAMPLE = JSON.stringify(raw(JSON.parse(fs.readFileSync(path.join(OUT, "f1.json"), "utf8"))), null, 1)

const specText = (s) => {
  const [nl, nh] = NOTES[s.notes], [sl, sh] = SUMMARY[s.text]
  return [
    `- 任务:${s.topic}`,
    `- 产品数:${s.products} 个`,
    `- 每个产品的步骤数:${s.steps[0]}–${s.steps[1]} 步,各产品之间要有差别`,
    `- 问题:${s.issues} 个;建议:${s.suggestions} 条`,
    `- 阶段对比 stages:${s.stages ? "要写" : "不写"};共性做法 patterns:${s.patterns ? "要写" : "不写"}`,
    `- 有备注(note 不为空)的步骤占全部步骤的 ${nl * 100}%–${nh * 100}%`,
    `- 摘要 summary:${sl}–${sh} 个字`,
  ].join("\n")
}

const log = (...a) => console.log(...a)

async function generate(id) {
  const spec = SPECS[id]
  const first = `按下面的规格写一份新的报告数据:\n${specText(spec)}\n\n示例(另一个任务,只参考格式和写法,不要照抄内容):\n${EXAMPLE}`
  let content = first, last = null
  for (let attempt = 0; attempt <= 2; attempt++) {
    const label = `${id} 第 ${attempt + 1} 次`
    log(`  ${label}:请求开始`)
    const t0 = Date.now()
    const res = await call(SYSTEM, content, { key: KEY, model: MODEL, effort: "high", label })
    fs.writeFileSync(path.join(CACHE, `${id}-${attempt + 1}.json`), JSON.stringify({ content, reply: res.json, usage: res.usage }, null, 1))
    last = res.json
    let errs
    try { errs = check(last, spec) } catch (e) { errs = [`结构不对,校验程序出错:${e.message}`] }
    log(`  ${label}:${Math.round((Date.now() - t0) / 1000)} 秒,${errs.length ? `${errs.length} 个问题` : "校验通过"}`)
    for (const x of errs) log(`     ✗ ${x}`)
    if (!errs.length) return last
    content = `${first}\n\n你上一次的输出:\n${JSON.stringify(last, null, 1)}\n\n程序校验发现这些问题:\n${errs.map((x) => `- ${x}`).join("\n")}\n\n改正这些问题,其他内容尽量不动,输出完整的 JSON。`
  }
  throw new Error(`${id}:改了 2 次仍没通过校验`)
}

async function draw(browser, id, d) {
  const dir = path.join(OUT, id)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const page = await browser.newPage({ viewport: { width: 375, height: 760 } })
  for (const [pi, c] of d.chains.entries())
    for (const st of c.steps) {
      await page.setContent(phone(c.product, st, BRAND[pi]))
      await page.screenshot({ path: path.join(dir, path.basename(st.image)) })
    }
  await page.close()
}

fs.mkdirSync(OUT, { recursive: true })
fs.mkdirSync(CACHE, { recursive: true })

// 1. 原有 f1–f6
for (const n of [1, 2, 3, 4, 5, 6]) {
  const id = `f${n}`
  const d = JSON.parse(fs.readFileSync(path.join(OUT, `${id}.json`), "utf8"))
  const errs = check(d)
  if (errs.length) throw new Error(`${id} 校验没通过:${errs.join(";")}`)
  log(`原有 ${id}:${describe(features(d))}`)
}

// 2. 新写的
const want = arg("ids") ? arg("ids").split(",") : Object.keys(SPECS)
const todo = want.filter((id) => !fs.existsSync(path.join(OUT, `${id}.json`)))
log(`新写 ${want.length} 份,要生成 ${todo.length} 份(已有的跳过),模型 ${MODEL}`)
if (todo.length && !KEY) throw new Error("set DEEPSEEK_API_KEY (source judge.env)")
const { chromium } = createRequire(path.join(ROOT, "gen", "package.json"))("playwright-core")
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
let ok = 0, bad = 0
try {
  const queue = [...todo]
  await Promise.all(Array.from({ length: Number(arg("workers", "6")) }, async () => {
    while (queue.length) {
      const id = queue.shift()
      log(`开始 ${id}:${SPECS[id].topic}(${SPECS[id].tier})`)
      try {
        const d = assemble(await generate(id))
        const errs = check(d, SPECS[id])
        if (errs.length) throw new Error(`补齐字段后校验没通过:${errs.join(";")}`)
        await draw(browser, id, d)
        fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(d, null, 1) + "\n")
        log(`完成 ${id}:${describe(features(d))},截图 ${features(d).screens} 张`)
        ok++
      } catch (e) {
        bad++
        log(`✗ ${id} 失败:${e.message}`)
      }
    }
  }))
} finally {
  await browser.close()
}

// 3. 规格、数据特征、划分
const specs = {}
for (const f of fs.readdirSync(OUT).filter((x) => /^f\d+\.json$/.test(x)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))) {
  const id = f.replace(".json", "")
  const d = JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8"))
  specs[id] = { ...(SPECS[id] ?? { topic: d.task, tier: "原有" }), features: features(d) }
}
fs.writeFileSync(path.join(OUT, "specs.json"), JSON.stringify(specs, null, 1) + "\n")
fs.writeFileSync(path.join(ROOT, "data", "split.json"), JSON.stringify({ flow: SPLIT }, null, 1) + "\n")
log(`结束:本次生成成功 ${ok} 份,失败 ${bad} 份;共有 ${Object.keys(specs).length} 份报告数据在 ${path.relative(process.cwd(), OUT)}`)
