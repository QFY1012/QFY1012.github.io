// Recorder:修改记录(程序,不调 LLM)。Reviser 每一步先读它;人看它了解每条经验怎么来的、有没有用。
//
// runs/<run>/record.json:
//   changes  经验清单的每处改动 { step, report, op, id, before, after, patterns, conflict, reason }
//   effects  每条经验的效果数据 { E1: [{ step, report, followers: [分数], others: [分数] }] }:
//            生成时经验清单里有这条的每一步,同一组里照这条做的页面(Maintainer 标的)和没照做的页面各自的分数;只记两边都有的组
//   steps    每一步的概况;observe 每遍结束在验证用报告数据上的观察
// 效果的结论:两边累计都至少 3 版时,照做的平均分比没照做的高 1 以上 = 有效,低 1 以上 = 失败,其余 = 看不出;不到 3 版 = 数据不够。
import fs from "node:fs"

export const loadRecord = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { changes: [], effects: {}, steps: [], observe: [] })

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length
export function verdict(entries) {
  const f = entries.flatMap((x) => x.followers), o = entries.flatMap((x) => x.others)
  if (f.length < 3 || o.length < 3) return { verdict: "数据不够", n: 0, followers: f.length, others: o.length }
  const mf = mean(f), mo = mean(o), d = mf - mo
  return { verdict: d >= 1 ? "有效" : d <= -1 ? "失败" : "看不出", n: f.length + o.length, followers: f.length, others: o.length, mf: +mf.toFixed(1), mo: +mo.toFixed(1) }
}

// 这一步生成时用的经验清单 list,Maintainer 标出的每版照了哪几条 sums,每版的分 score
export function recordEffects(record, { step, report, list, sums, score }) {
  for (const e of list.items) {
    const followers = [], others = []
    for (const [v, s] of Object.entries(sums)) ((s.followed ?? []).includes(e.id) ? followers : others).push(+score[v].toFixed(1))
    if (followers.length && others.length) (record.effects[e.id] ??= []).push({ step, report, followers, others })
  }
}

export function recordChanges(record, { step, report, ops }) {
  for (const o of ops) record.changes.push({ step, report, ...o })
}

export function saveRecord(file, record, list) {
  fs.writeFileSync(file, JSON.stringify(record, null, 1))
  fs.writeFileSync(file.replace(/\.json$/, ".md"), render(record, list))
}

function render(record, list) {
  const L = ["# 修改记录", "", "Recorder 写的。Reviser 每一步先读;效果:同一组里照这条经验做的页面和没照做的页面,平均分谁高(两边各至少 3 版才下结论,差 1 分以上算有效或失败)。", ""]
  L.push("## 当前经验清单", "")
  if (!list.items.length) L.push("(空)", "")
  for (const e of list.items) {
    const v = verdict(record.effects[e.id] ?? [])
    L.push(`- **${e.id}** ${e.text}  `, `  依据 ${e.patterns.join("、")};效果:${v.verdict}${v.n ? `(照做 ${v.followers} 版平均 ${v.mf},没照做 ${v.others} 版平均 ${v.mo})` : `(照做 ${v.followers} 版、没照做 ${v.others} 版)`}${e.conflict ? `;和输出指南冲突:${e.conflict}` : ""}`)
  }
  L.push("", "## 每处改动", "")
  if (!record.changes.length) L.push("(还没有)")
  for (const c of record.changes) L.push(`- 第 ${c.step} 步(${c.report})${{ add: "新增", update: "修改", delete: "删除" }[c.op]} ${c.id}:${c.op === "update" ? `「${c.before}」→「${c.after}」` : `「${c.after || c.before}」`};依据 ${c.patterns.join("、") || "无"};${c.reason}${c.conflict ? `;和输出指南冲突:${c.conflict}` : ""}`)
  L.push("", "## 每一步", "", "| 步 | 遍 | 报告数据 | 各版分数 | 判出高下的对 | 模式清单 | 经验清单改动 |", "|---|---|---|---|---|---|---|")
  for (const s of record.steps) L.push(`| ${s.step} | ${s.pass} | ${s.report} | ${Object.entries(s.scores ?? {}).map(([v, x]) => `${v.slice(1)}:${x > 0 ? "+" : ""}${x}`).join(" ")} | ${s.decided}/${s.pairs} | ${s.skipped ? "跳过(一对都没判出高下)" : (s.patterns ?? []).join("、") || "无"} | ${s.ops ?? 0} |`)
  if (record.observe.length) {
    L.push("", "## 每遍结束:验证用报告数据上「输出指南 + 经验清单」vs「只有输出指南」", "", "| 遍 | 报告数据 | 4 对的平均(正数 = 有经验清单的更好) | 结论 |", "|---|---|---|---|")
    for (const o of record.observe) for (const r of o.reports) L.push(`| ${o.pass} | ${r.report} | ${r.mean > 0 ? "+" : ""}${r.mean} | ${r.verdict} |`)
  }
  return L.join("\n") + "\n"
}
