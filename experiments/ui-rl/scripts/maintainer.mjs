// Maintainer:每一步把这组页面归纳成成功模式、失败模式,累积进模式清单。
// 对应论文(Training-Free GRPO)的单条总结 + 组内对比;论文对比完写成经验就丢掉,这里留下来维护成模式清单。
//
//   const sums = await summarize({ ... })   每版一次:排版决定、judge 怎么评、照了经验清单的哪几条、还能怎么改
//   const cmp = await compare({ ... })      整组一次:高分和低分差在哪 → 成功模式、失败模式(最多 4 条)
//   await updatePatterns({ ... })           一次:新模式和清单里已有的对上(同一做法补出处,没有就新加)
//
// 模式清单 runs/<run>/patterns.json:{ patterns: [{ id, kind: 成功|失败, category: 布局|组件不够, text, sources: [...] }], next: { S, F } }
// 每条出处:{ step, report, features(数据特征), versions, scores, condition, judge }
import fs from "node:fs"
import path from "node:path"
import { call } from "../../ui-judge/scripts/pairwise-judge.mjs"
import { CRITERIA } from "../lib/judges.mjs"

const MODEL = process.env.TRAIN_MODEL ?? "deepseek-v4.1-flash"
const llm = (sys, user, label) => call(sys, user, { key: process.env.DEEPSEEK_API_KEY, model: MODEL, effort: "high", label }).then((r) => r.json)
const num = (v) => v.replace(/^v/, "")
const signed = (x) => `${x > 0 ? "+" : ""}${+x.toFixed(1)}`

export const PREAMBLE = `你的最终目标是从生成 Agent 以往写的页面里提炼经验,用来指导它以后怎么写页面。

<生成 Agent 的任务>
输入:「交互流程挖掘」Skill 输出的报告数据(data.json:一个任务下几款产品的逐屏链路、每屏的分析备注、阶段对比、共性做法、问题和建议)。
输出:用组件库写出的报告页面(Page.tsx)。
</生成 Agent 的任务>

<学习目标>
让页面的信息组织和视觉更好,好坏按下面 judge 的标准判断。要提炼的是通用、简洁的排版经验:页面怎么组织、怎么排;不管报告数据的内容本身对不对。

${CRITERIA}
</学习目标>`

const SUMMARY_SYS = `${PREAMBLE}

现在分析其中一版页面。会给你:报告数据的数据特征、data.json、这版的 Page.tsx、这版在同一份数据的几版里的分数和名次、judge 把这版和其他各版两两比较时的评语、当前的经验清单。

要求:
1. 写出这版的排版决定:节的顺序;每一节放了哪些数据、用什么组件、怎么排(例如几列、表格还是卡片、截图和备注的位置、各产品怎么并列)。只写排版,不复述数据内容。每条一句,写成「〈哪部分〉:〈怎么做的〉」。
2. 归纳 judge 对这版的评价:在哪些标准上比别的版本好、哪些上差,引用评语里的具体说法。
3. 标出这版照做了经验清单里的哪几条:页面确实按这条做了才算;经验的条件不满足、和这版无关的不算。经验清单是空的就写空数组。
4. 一两句话:这版还可以怎么改进(只说和学习目标有关的)。

只输出 JSON:{"decisions":["…"],"judge":"…","followed":["E1"],"improve":"…"}`

const COMPARE_SYS = `${PREAMBLE}

现在比较同一份报告数据的几版页面,找出高分和低分版本在排版上的差别,归纳成成功模式和失败模式。

会给你:数据特征,每版页面的总结(排版决定、judge 的评价、分数)。分数是这版和其他每版两两比较的得分之和,越高越好。

要求:
1. 指出哪几版好、哪几版差,各一句理由。
2. 直接对比高分和低分版本:哪些排版决定造成了分数的差别。只看高分和低分版本之间确实不同的决定;各版都一样的决定不算。
3. 归纳模式,最多 4 条:
   - 成功模式:高分版本做了、低分版本没做的排版决定。失败模式:低分版本做了、高分版本没做的排版决定。
   - 每条写成具体的排版做法(哪部分、怎么排),不写数据内容,不超过 40 字。
   - versions 写体现这条的是哪几版;judge 写评语里支持它的说法。
   - 失败模式要分类:「布局」= 换一种用现有组件的排法就能避免;「组件不够」= 现有组件做不到,怎么排都避免不了。成功模式都写「布局」。
   - 只在某些数据下才成立的(例如产品多、步骤多、备注多时),把前提写进 condition,只能用数据特征里有的项(产品数、每个产品的步骤数、有备注的步骤比例、有没有阶段对比、有没有共性做法、问题数、建议数);和数据无关就写空。
   - 分数差别很小、看不出是哪个决定造成的,就少写或不写,不要硬凑。

只输出 JSON:{"good":["第 2 版:…"],"bad":["第 5 版:…"],"comparison":"…","patterns":[{"kind":"成功 或 失败","category":"布局 或 组件不够","text":"…","condition":"…","versions":[2,4],"judge":"…"}]}`

const MERGE_SYS = `你维护一份排版模式清单,里面是成功模式和失败模式,每条累积它在哪些报告数据里出现过。

现在有几条新归纳出的模式。逐条判断它和清单里已有的哪一条是同一个排版做法:
- 说法不同、做法相同,算同一条。
- 同一件事的成功和失败两面算两条(例如成功模式「备注贴着对应截图」和失败模式「备注集中放在最后」是两条)。成功模式只能对上成功模式,失败模式只能对上失败模式。
- 只是有关、但做法不同,不算同一条。
是同一条就写那条的编号;清单里没有就写 null。如果是同一条、并且新的说法更准确具体,在 text 里写合并后的说法(不超过 40 字),否则 text 写空。

只输出 JSON:{"matches":[{"new":1,"same_as":"S3 或 null","text":""}]}`

const listText = (list) => (list.items.length ? list.items.map((e) => `[${e.id}] ${e.text}`).join("\n") : "(空)")

function notesText(notes, v) {
  return notes.map((x) => {
    const pos = x.asA ? `这版作 A、第 ${num(x.other)} 版作 B` : `第 ${num(x.other)} 版作 A、这版作 B`
    const crit = x.criteria.map((c) => `${c.no}(${c.better}):${c.why}`).join(";")
    return `- 和第 ${num(x.other)} 版比(${pos}):${x.verdict}。${x.reason ?? ""}${crit ? ` 各标准:${crit}` : ""}`
  }).join("\n")
}

export async function summarize({ pages, scored, featuresText, list, dir, log = console.log }) {
  fs.mkdirSync(dir, { recursive: true })
  const order = [...pages].sort((a, b) => scored.score[b.v] - scored.score[a.v])
  const all = pages.map((p) => `第 ${num(p.v)} 版 ${signed(scored.score[p.v])}`).join(",")
  const out = {}
  await Promise.all(pages.map(async (p) => {
    const f = path.join(dir, `${p.v}.json`)
    if (fs.existsSync(f)) return (out[p.v] = JSON.parse(fs.readFileSync(f, "utf8")).json)
    const user = `<数据特征>${featuresText}</数据特征>

<data.json>
${fs.readFileSync(path.join(p.ws, "data.json"), "utf8")}
</data.json>

<Page.tsx>
${fs.readFileSync(path.join(p.ws, "Page.tsx"), "utf8")}
</Page.tsx>

<分数>这一版是第 ${num(p.v)} 版,分数 ${signed(scored.score[p.v])},在 ${pages.length} 版里排第 ${order.indexOf(p) + 1}(各版分数:${all})。分数是和其他每版两两比较的得分之和,范围 -${2 * (pages.length - 1)} 到 ${2 * (pages.length - 1)}。</分数>

<judge 评语>
${notesText(scored.notes[p.v], p.v)}
</judge 评语>

<经验清单>
${listText(list)}
</经验清单>`
    log(`  Maintainer:总结第 ${num(p.v)} 版`)
    const json = await llm(SUMMARY_SYS, user, `Maintainer 总结第 ${num(p.v)} 版`)
    const ids = new Set(list.items.map((e) => e.id))
    json.followed = (json.followed ?? []).filter((id) => ids.has(id))
    fs.writeFileSync(f, JSON.stringify({ input: user, json }, null, 1))
    out[p.v] = json
    log(`  Maintainer:第 ${num(p.v)} 版总结完,${json.decisions?.length ?? 0} 条排版决定,照了经验 ${json.followed.join("、") || "无"}`)
  }))
  return out
}

export async function compare({ pages, scored, sums, featuresText, file, log = console.log }) {
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8")).json
  const order = [...pages].sort((a, b) => scored.score[b.v] - scored.score[a.v])
  const user = `<数据特征>${featuresText}</数据特征>

<各版页面>
${order.map((p) => `第 ${num(p.v)} 版(分数 ${signed(scored.score[p.v])}):
排版决定:
${(sums[p.v].decisions ?? []).map((d) => `- ${d}`).join("\n")}
judge 的评价:${sums[p.v].judge}
还可以改进:${sums[p.v].improve}`).join("\n\n")}
</各版页面>`
  log(`  Maintainer:整组比较`)
  const json = await llm(COMPARE_SYS, user, "Maintainer 整组比较")
  const valid = new Set(pages.map((p) => Number(num(p.v))))
  json.patterns = (json.patterns ?? []).filter((x) => x.text && ["成功", "失败"].includes(x.kind)).slice(0, 4).map((x) => ({
    ...x, category: x.kind === "成功" ? "布局" : x.category === "组件不够" ? "组件不够" : "布局",
    versions: (x.versions ?? []).map(Number).filter((n) => valid.has(n)),
  }))
  fs.writeFileSync(file, JSON.stringify({ input: user, json }, null, 1))
  log(`  Maintainer:归纳出 ${json.patterns.length} 条模式:${json.patterns.map((x) => `${x.kind}「${x.text}」`).join(";")}`)
  return json
}

export function loadPatterns(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { patterns: [], next: { S: 1, F: 1 } }
}

// 新模式并进清单;返回这一步新加或补了出处的编号
export async function updatePatterns({ file, cmp, step, report, featuresText, scored, opsFile, log = console.log }) {
  const book = loadPatterns(file)
  if (!cmp.patterns.length) return []
  // 这一步已经并进去了(中断后重跑):不重复加
  const already = book.patterns.filter((p) => p.sources.some((s) => s.step === step)).map((p) => p.id)
  if (already.length) return already
  let matches
  if (fs.existsSync(opsFile)) matches = JSON.parse(fs.readFileSync(opsFile, "utf8")).json.matches
  else if (!book.patterns.length) matches = cmp.patterns.map((_, i) => ({ new: i + 1, same_as: null, text: "" }))
  else {
    const user = `<已有的模式>
${book.patterns.map((p) => `${p.id}(${p.kind}${p.category === "组件不够" ? ",组件不够" : ""}):${p.text}`).join("\n")}
</已有的模式>

<新的模式>
${cmp.patterns.map((p, i) => `${i + 1}(${p.kind}${p.category === "组件不够" ? ",组件不够" : ""}):${p.text}${p.condition ? `(条件:${p.condition})` : ""}`).join("\n")}
</新的模式>`
    log(`  Maintainer:新模式和模式清单对照`)
    const json = await llm(MERGE_SYS, user, "Maintainer 对照模式清单")
    fs.writeFileSync(opsFile, JSON.stringify({ input: user, json }, null, 1))
    matches = json.matches ?? []
  }
  const touched = []
  cmp.patterns.forEach((p, i) => {
    const m = matches.find((x) => Number(x.new) === i + 1)
    const same = m?.same_as && book.patterns.find((q) => q.id === m.same_as && q.kind === p.kind)
    const source = {
      step, report, features: featuresText, versions: p.versions,
      scores: p.versions.map((n) => +scored.score[`v${n}`].toFixed(1)), condition: p.condition ?? "", judge: p.judge ?? "",
    }
    if (same) {
      if (!same.sources.some((s) => s.step === step)) same.sources.push(source)
      if (m.text) same.text = m.text
      touched.push(same.id)
      log(`  模式清单:${same.id} 补出处(${report})`)
    } else {
      const key = p.kind === "成功" ? "S" : "F"
      const id = `${key}${book.next[key]++}`
      book.patterns.push({ id, kind: p.kind, category: p.category, text: p.text, sources: [source] })
      touched.push(id)
      log(`  模式清单:新加 ${id}(${p.kind}${p.category === "组件不够" ? ",组件不够" : ""}):${p.text}`)
    }
  })
  fs.writeFileSync(file, JSON.stringify(book, null, 1))
  fs.writeFileSync(file.replace(/\.json$/, ".md"), renderPatterns(book))
  return [...new Set(touched)]
}

export const reportsOf = (p) => new Set(p.sources.map((s) => s.report))

export function renderPatterns(book) {
  const part = (title, list) => [`## ${title}`, "", ...list.flatMap((p) => [
    `### ${p.id} ${p.text}`, "", `出现在 ${reportsOf(p).size} 份报告数据里${p.category === "组件不够" ? ";组件不够(不交给 Reviser)" : ""}。`, "",
    ...p.sources.map((s) => `- 第 ${s.step} 步 ${s.report}(${s.features}):第 ${s.versions.join("、")} 版,分数 ${s.scores.join("、")}${s.condition ? `;条件:${s.condition}` : ""}。judge:${s.judge}`), ""])]
  return ["# 模式清单", "", "Maintainer 每一步从一组页面里归纳,一直累积。至少在 2 份报告数据里出现过的布局模式,Reviser 才用。", "",
    ...part("成功模式", book.patterns.filter((p) => p.kind === "成功")), ...part("失败模式", book.patterns.filter((p) => p.kind === "失败"))].join("\n") + "\n"
}
