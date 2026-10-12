// The Maintainer of one Skill: turns what a check stage says about the training pages into a
// short list of problems, each one either 组件不够 (the library lacks a component) or 布局问题
// (the components are there, the page puts them together badly; fixed in the output guide).
// It generalises; it does not list: the same problem on many pages, or in several runs of the
// judge, is one problem with its evidence. The list is the experience library
// (skills/<skill>/experience.json and .md): the Reviser takes the 布局问题, the component agent
// the 组件不够 problems. Each call updates the list: recurring problems gain evidence, problems
// that no longer show up are marked solved.
//
//   source judge.env && node scripts/maintainer.mjs --skill flow --run flow-g0 --stage program|aesthetic [--base flow-g0]
//
// Stages, in order (a page goes on only when it passes): program checks (checks.json), then the
// 需求 judge and the 审美 judge, both pairwise comparisons of --base against --run (compare.mjs):
// which version is better, why, and the remaining problems both orders name. Only training
// samples are read; held-out samples are for the gate.
import fs from "node:fs"
import path from "node:path"
import { call } from "../../ui-judge/scripts/pairwise-judge.mjs"
import { observations, nextProblems } from "./compare.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const read = (f) => fs.readFileSync(f, "utf8")
const STAGE = { program: "程序检查", function: "需求 judge", aesthetic: "审美 judge" }

export const SYSTEM = (name) => `你是「${name}」这个 Skill 的 Maintainer。生成 Agent 按公共规范 design.md、这个 Skill 的输出指南和组件库 components.md 为报告写页面。页面依次经过两步检测:程序检查、审美 judge(哪版更好看),审美 judge 是两版页面两两比较、每次按两种顺序各比一次。会给你某一步在训练样本每一页上的原始意见,同一个问题往往在很多页、很多次检查里重复出现。

你的任务是归纳问题,不是罗列意见:
1. 合并:说的是同一件事的意见合并成一个问题,不管它出现在哪一页、哪一次检查。问题用一句话写清楚:页面上什么地方不对、对看报告的人有什么影响。写成对这个 Skill 的所有报告都成立的说法,不写某一页的行号、变量名这类细节。
2. 算数:程序检查的结果每条都算。judge 的比较只记当前版的问题:两种顺序都提到的剩余问题算数;两种顺序都判当前版输时,让它输的做法是问题;让一版赢的做法写进相关问题的 good 里作参考。
3. 归因,只分两类,标准是「现有组件够不够用」:
   - 组件不够:components.md 里没有能做到的组件,怎么排都解决不了;或者问题出在组件自己的样式上(组件里写死的对齐、粗细、颜色、间距、滚动条等),页面按正常写法用这个组件就会出现,哪怕页面能换别的组件绕开,也算组件不够。problem 只写一句:「<页面的哪一部分>要展示<什么内容>,但组件库缺少<什么样的组件>,所以无法展示」,不写后果和页面现在的写法(那些放进 evidence)。
   - 布局问题:现有组件够用,是页面选的组件、组合和排法有问题。
   依据必须来自给你的 components.md、Page.tsx 或 judge 的意见。分不清时看 Page.tsx:出问题的样式页面里没写、是组件自己决定的,就是组件不够。
4. 更新:已有的问题清单一并给你。同一个问题再次出现就沿用它的 id,更新页数和证据;只解决了一部分的,原问题 status 写「已解决」,没解决的部分作为新问题、用新 id;这一步的原始意见里已经没有它的,status 写「已解决」(只对同一步的问题这样判断,别的步骤的问题原样保留);新问题用新 id。
5. 证据:每个问题写出现在哪几页,以及两三条原始意见的摘要。

只输出 JSON:{"problems":[{"id":"P-01","stage":"程序检查 或 审美 judge","problem":"一句话","cause":"组件不够 或 布局问题","good":"赢的做法,没有写空字符串","pages":["f1"],"evidence":["f1:原始意见摘要"],"status":"未解决 或 已解决"}]}`

// A judge stage's comparisons, page by page: pairs maps a page to the two runs compared on it
// (a page the last candidate left unchanged keeps its earlier comparison). Both orders' verdicts
// and reasons, and the remaining problems both orders name.
export function judgeInput(stage, pairs, current) {
  return Object.entries(pairs).map(([c, [a, b]]) => {
    const obs = observations(a, b, [c], 1, stage).map((o) => ({ 顺序: o.order, A: o.A, B: o.B, ...o.judgement }))
    const next = nextProblems(a, b, [c], 1, stage)[c]?.[0] ?? {}
    return `<页面 ${c}:${a} 对 ${b},${current}>\n<两种顺序的比较>\n${JSON.stringify(obs, null, 1)}\n</两种顺序的比较>\n<两种顺序都提到的剩余问题(of 是两种顺序都选的那版)>\n${JSON.stringify(next, null, 1)}\n</两种顺序都提到的剩余问题>\n</页面 ${c}>`
  }).join("\n\n")
}

// What one stage said about each training page.
function stageInput(stage, run, cases, pairs, current) {
  const ws = (c) => path.join(ROOT, "traces", run, c)
  // In a judge stage, with the current pages' code, so a problem can be traced to the page or to a component.
  if (stage !== "program") return `${judgeInput(stage, pairs, current)}\n\n${cases.map((c) => `<当前版 ${run} 的 Page.tsx,页面 ${c}>\n${read(path.join(ws(c), "Page.tsx"))}\n</当前版 Page.tsx>`).join("\n\n")}`
  return cases.map((c) => [`<页面 ${c}>`, `<程序检查>\n${fs.existsSync(path.join(ws(c), "checks.json")) ? read(path.join(ws(c), "checks.json")) : "[]"}\n</程序检查>`,
    `<Page.tsx>\n${read(path.join(ws(c), "Page.tsx"))}\n</Page.tsx>`, `</页面 ${c}>`].join("\n")).join("\n\n")
}

// A list the model sometimes writes as one string.
const list = (x) => (Array.isArray(x) ? x : x ? [String(x)] : [])

// experience.json and the experience.md the Reviser and the component agent read.
function save(dir, name, exp) {
  fs.writeFileSync(path.join(dir, "experience.json"), JSON.stringify(exp, null, 1))
  const { problems } = exp
  const open = problems.filter((p) => p.status !== "已解决")
  const line = (p) => `- **${p.id}**(${p.stage},${p.pages.length} 页):${p.problem}${p.good ? `\n  - 赢的做法:${p.good}` : ""}\n  - 证据:${p.evidence.join(";")}`
  fs.writeFileSync(path.join(dir, "experience.md"), [
    `# 问题清单 · ${name}`, "",
    `Maintainer 从训练样本的检测结果归纳,每步更新(最近一次:${exp.updated.run},${exp.updated.stage})。Reviser 读「布局问题」,组件 Agent 读「组件不够」。改了什么、成没成功在修改记录 changelog.md(修改记录员写)。`, "",
    "## 组件不够", "", ...open.filter((p) => p.cause === "组件不够").map(line), "",
    "## 布局问题", "", ...open.filter((p) => p.cause === "布局问题").map(line), "",
    "## 已解决", "", ...problems.filter((p) => p.status === "已解决").map((p) => `- **${p.id}**(${p.stage}):${p.problem}`), "",
  ].join("\n"))
}

export async function maintain({ skill, run, stage, guide, pairs, current }) {
  const split = JSON.parse(read(path.join(ROOT, "skills", "split.json")))[skill]
  const dir = path.join(ROOT, "skills", skill)
  const expJson = path.join(dir, "experience.json")
  const prev = fs.existsSync(expJson) ? JSON.parse(read(expJson)).problems : []
  const data = split.train.map((c) => `<${c}.json>\n${read(path.join(dir, "data", `${c}.json`))}</${c}.json>`).join("\n")
  const user = `<components.md>\n${read(path.join(ROOT, "components.md"))}\n</components.md>\n\n<公共规范 design.md>\n${read(path.join(ROOT, "design.md"))}\n</公共规范>\n\n<输出指南>\n${read(path.resolve(ROOT, guide))}\n</输出指南>\n\n<训练样本数据>\n${data}\n</训练样本数据>\n\n<已有的问题清单>\n${JSON.stringify(prev, null, 1)}\n</已有的问题清单>\n\n<这一步:${STAGE[stage]},页面版本 ${run}>\n${stageInput(stage, run, split.train, pairs, current)}\n</这一步>`
  // The reply is printed as it arrives, so the terminal shows the Maintainer at work.
  process.stdout.write(`\n── Maintainer · ${split.name} · ${STAGE[stage]} · ${run}\n`)
  const r = await call(SYSTEM(split.name), [{ type: "text", text: user }], { key: process.env.DEEPSEEK_API_KEY, label: `Maintainer ${split.name}`, onThink: (s) => process.stdout.write(`[思考中… ${s} 秒]\n`), onText: (t) => process.stdout.write(t) })
  process.stdout.write("\n")
  const problems = list(r.json.problems).map((p) => ({ ...p, pages: list(p.pages), evidence: list(p.evidence) }))
  save(dir, split.name, { skill, updated: { run, stage: STAGE[stage] }, problems })
  return problems
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (k, d) => {
    const i = process.argv.indexOf(`--${k}`)
    return i > 0 ? process.argv[i + 1] : d
  }
  const skill = arg("skill")
  const state = path.join(ROOT, "skills", skill, "state.json")
  const current = fs.existsSync(state) ? JSON.parse(read(state)).current : "g0"
  const run = arg("run"), base = arg("base"), train = JSON.parse(read(path.join(ROOT, "skills", "split.json")))[skill].train
  const problems = await maintain({ skill, run, stage: arg("stage", "program"), guide: arg("guide", `skills/${skill}/guides/${current}.md`), pairs: Object.fromEntries(train.map((c) => [c, [base, run]])), current: `当前版是 ${arg("current", base)}` })
  for (const p of problems) console.log(`${p.id} [${p.cause}] ${p.status} ${p.pages.join(",")}: ${p.problem}`)
}
