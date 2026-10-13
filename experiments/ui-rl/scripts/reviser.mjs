// Reviser:每一步按模式清单和修改记录改经验清单。对应论文的单组更新(每步只有一份报告数据,不需要整批合并)。
//
//   const { list, ops } = await revise({ ... })
//
// 只给它「可用的模式」:布局类、至少在 2 份报告数据里出现过(程序筛)。这一步新加或补了出处的标「新」。
// 什么时候调用:有标「新」的可用模式,或者有效果为「失败」的经验;都没有就不改。
// 它给出的操作由程序检查后执行:编号要存在、依据的模式要可用、经验不超过 50 字(要求 40 字,超出一点只提示);不合格的操作丢掉并打印原因。
// 经验清单 runs/<run>/lists/s<NN>.json:{ items: [{ id, text, patterns, conflict, since }], next }
import fs from "node:fs"
import { call } from "../../ui-judge/scripts/pairwise-judge.mjs"
import { PREAMBLE, reportsOf } from "./maintainer.mjs"
import { verdict } from "./recorder.mjs"

const MODEL = process.env.TRAIN_MODEL ?? "deepseek-v4.1-flash"

const SYS = `${PREAMBLE}

现在根据模式清单更新经验清单。经验清单会接在输出指南后面放进生成 Agent 的提示词,告诉它怎么写页面。

会给你:
- 输出指南:生成 Agent 已经在照着做的规则。
- 当前经验清单:每条带依据的模式和效果。效果是 Recorder 统计的:同一组里照这条做的页面和没照做的页面,平均分谁高;「有效」「失败」「看不出」,或者「数据不够」。
- 已删除的经验和删除原因。
- 可用的模式:至少在 2 份报告数据里出现过的布局模式,带出处(哪几份报告数据、它们的数据特征、哪几版、分数、judge 评语)。标了「新」的是这一步新出现或新补了出处的。

要求:
1. 效果是「失败」的经验,必须修改或删除。
2. 对每条标了「新」的可用模式,和当前经验清单比,决定一个操作:
   - add:清单里没有这种做法,新增一条。
   - update:清单里已有相关的经验,这条模式让它更准确、或补充了前提条件,修改那一条(保留编号)。
   - delete:这条模式和某条经验相反,而且证据更多,删掉那条经验。
   - none:清单已经涵盖,或者证据不足,不改。
3. 经验的写法:一句话,不超过 40 字,写具体的排版做法(哪部分、怎么排),不写空泛的原则。需要前提条件才成立的,写成「当〈条件〉时,〈做法〉」,条件只能用数据特征里有的项(产品数、每个产品的步骤数、有备注的步骤比例、有没有阶段对比、有没有共性做法、问题数、建议数);普遍成立的不加条件。失败模式写成对应的正确做法,或「不要……」。
4. 和输出指南冲突的经验(做法和指南里的某条规则相反),在 conflict 里写出冲突的是指南里的哪句;不冲突写空。
5. 已删除的经验,没有新的出处不要加回来。
6. patterns 写这次操作依据的模式编号,只能用可用的模式。

只输出 JSON:{"ops":[{"op":"add 或 update 或 delete 或 none","id":"要改或删的经验编号,add 和 none 写 null","text":"经验(delete 和 none 写空)","patterns":["S1","F2"],"conflict":"","reason":"一句话"}]}`

export const eligible = (book) => book.patterns.filter((p) => p.category === "布局" && reportsOf(p).size >= 2)

const effectText = (record, id) => {
  const e = verdict(record.effects[id] ?? [])
  return e.n ? `${e.verdict}(照做的 ${e.followers} 版平均 ${e.mf},没照做的 ${e.others} 版平均 ${e.mo})` : "数据不够(还没有一组里既有照做的、又有没照做的)"
}

export async function revise({ list, book, touched, record, guideText, file, log = console.log }) {
  const usable = eligible(book)
  const fresh = usable.filter((p) => touched.includes(p.id))
  const failed = list.items.filter((e) => verdict(record.effects[e.id] ?? []).verdict === "失败")
  if (!fresh.length && !failed.length) {
    log(`  Reviser:没有新的可用模式(可用 ${usable.length} 条,这一步新加或补出处的 ${touched.length} 条都还不到 2 份报告数据),也没有失败的经验,不改`)
    return { list, ops: [], skipped: true }
  }
  let json
  if (fs.existsSync(file)) json = JSON.parse(fs.readFileSync(file, "utf8")).json
  else {
    const deleted = record.changes.filter((c) => c.op === "delete")
    const user = `<输出指南>
${guideText}
</输出指南>

<当前经验清单>
${list.items.length ? list.items.map((e) => `[${e.id}] ${e.text}(依据 ${e.patterns.join("、")};效果:${effectText(record, e.id)}${e.conflict ? `;和输出指南冲突:${e.conflict}` : ""})`).join("\n") : "(空)"}
</当前经验清单>

<已删除的经验>
${deleted.length ? deleted.map((c) => `[${c.id}] ${c.before}(第 ${c.step} 步删除:${c.reason})`).join("\n") : "(无)"}
</已删除的经验>

<可用的模式>
${usable.length ? usable.map((p) => `${p.id}(${p.kind}${touched.includes(p.id) ? ",新" : ""}):${p.text}
  出现在 ${reportsOf(p).size} 份报告数据:
${p.sources.map((s) => `  - ${s.report}(${s.features}):第 ${s.versions.join("、")} 版,分数 ${s.scores.join("、")}${s.condition ? `;条件:${s.condition}` : ""};judge:${s.judge}`).join("\n")}`).join("\n") : "(无)"}
</可用的模式>`
    log(`  Reviser:新的可用模式 ${fresh.map((p) => p.id).join("、") || "无"},失败的经验 ${failed.map((e) => e.id).join("、") || "无"}`)
    json = (await call(SYS, user, { key: process.env.DEEPSEEK_API_KEY, model: MODEL, effort: "high", label: "Reviser" })).json
    fs.writeFileSync(file, JSON.stringify({ input: user, json }, null, 1))
  }

  // 程序检查后执行
  const next = { items: list.items.map((e) => ({ ...e })), next: list.next }
  const ok = new Set(usable.map((p) => p.id))
  const applied = []
  for (const o of json.ops ?? []) {
    const op = String(o.op ?? "").toLowerCase()
    if (op === "none") continue
    const text = String(o.text ?? "").trim()
    const pats = (o.patterns ?? []).filter((id) => ok.has(id))
    const cur = next.items.find((e) => e.id === o.id)
    const drop = (why) => log(`  Reviser:丢掉一个操作(${why}):${JSON.stringify(o)}`)
    if (op === "add" || op === "update") {
      if (!text) { drop("没有经验文字"); continue }
      if ([...text].length > 50) { drop(`经验 ${[...text].length} 字,超过 50 字`); continue }
      if (!pats.length) { drop("没有依据可用的模式"); continue }
      if ([...text].length > 40) log(`  Reviser:提示:经验 ${[...text].length} 字,超过要求的 40 字`)
    }
    if (op === "add") {
      const e = { id: `E${next.next++}`, text, patterns: pats, conflict: o.conflict ?? "", since: null }
      next.items.push(e)
      applied.push({ op, id: e.id, before: "", after: text, patterns: pats, conflict: e.conflict, reason: o.reason ?? "" })
    } else if (op === "update") {
      if (!cur) { drop(`经验 ${o.id} 不存在`); continue }
      applied.push({ op, id: cur.id, before: cur.text, after: text, patterns: pats, conflict: o.conflict ?? "", reason: o.reason ?? "" })
      Object.assign(cur, { text, patterns: [...new Set([...cur.patterns, ...pats])], conflict: o.conflict ?? "" })
    } else if (op === "delete") {
      if (!cur) { drop(`经验 ${o.id} 不存在`); continue }
      applied.push({ op, id: cur.id, before: cur.text, after: "", patterns: pats, conflict: "", reason: o.reason ?? "" })
      next.items = next.items.filter((e) => e !== cur)
    } else drop("操作不认识")
  }
  for (const a of applied) log(`  Reviser:${{ add: "新增", update: "修改", delete: "删除" }[a.op]} ${a.id}:${a.after || a.before}`)
  if (!applied.length) log(`  Reviser:没有改动`)
  return { list: next, ops: applied }
}
