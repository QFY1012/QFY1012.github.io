// The Maintainer of one Skill: turns what a check stage says about the training pages into a
// short list of problems, each one either 组件不够 (the library lacks a component) or 布局问题
// (the components are there, the page puts them together badly; fixed in the output guide).
// It generalises; it does not list: the same problem on many pages, or in several runs of the
// 需求 judge, is one problem with its evidence. The list is the experience library
// (skills/<skill>/experience.json and .md): the Reviser takes the 布局问题, the component agent
// the 组件不够 problems. Each call updates the list: recurring problems gain evidence, problems
// that no longer show up are marked solved.
//
//   source judge.env && node scripts/maintainer.mjs --skill flow --run flow-g0 --stage program|function|aesthetic [--base flow-g0]
//
// Stages, in order (a page goes on only when it passes): program checks (checks.json), the 需求
// judge (function-<n>.json, 3 runs a page), the 审美 judge (pairwise observations of --base
// against --run, from compare.mjs). Only training samples are read; held-out samples are for the gate.
import fs from "node:fs"
import path from "node:path"
import { call } from "../../ui-judge/scripts/pairwise-judge.mjs"
import { observations } from "./compare.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const read = (f) => fs.readFileSync(f, "utf8")
const STAGE = { program: "程序检查", function: "需求 judge", aesthetic: "审美 judge" }

export const SYSTEM = (name) => `你是「${name}」这个 Skill 的 Maintainer。生成 Agent 按公共规范 design.md、这个 Skill 的输出指南和组件库 components.md 为报告写页面。页面依次经过三步检测:程序检查、需求 judge(数据有没有用完、方不方便操作)、审美 judge(两版页面两两比较)。会给你某一步在训练样本每一页上的原始意见,同一个问题往往在很多页、很多次检查里重复出现。

你的任务是归纳问题,不是罗列意见:
1. 合并:说的是同一件事的意见合并成一个问题,不管它出现在哪一页、哪一次检查。问题用一句话写清楚:页面上什么地方不对、对看报告的人有什么影响。写成对这个 Skill 的所有报告都成立的说法,不写某一页的行号、变量名这类细节。
2. 算数:程序检查的结果每条都算。需求 judge 每页跑了几次,一条意见在同一页至少 2 次检查里出现才算数;只出现 1 次的不归纳。审美 judge 的比较里,让一版输掉的做法是问题;让一版赢的做法写进相关问题的 good 里作参考。
3. 归因,只分两类,标准是「现有组件够不够用」:
   - 组件不够:components.md 里没有能做到的组件,怎么排都解决不了。problem 只写一句:「<页面的哪一部分>要展示<什么内容>,但组件库缺少<什么样的组件>,所以无法展示」,不写后果和页面现在的写法(那些放进 evidence)。
   - 布局问题:现有组件够用,是页面选的组件、组合和排法有问题。
   依据必须来自给你的 components.md、Page.tsx 或 judge 的意见。
4. 更新:已有的问题清单一并给你。同一个问题再次出现就沿用它的 id,更新页数和证据;这一步的原始意见里已经没有它的,status 写「已解决」(只对同一步的问题这样判断,别的步骤的问题原样保留);新问题用新 id。
5. 证据:每个问题写出现在哪几页,以及两三条原始意见的摘要。

只输出 JSON:{"problems":[{"id":"P-01","stage":"程序检查 或 需求 judge 或 审美 judge","problem":"一句话","cause":"组件不够 或 布局问题","good":"审美阶段赢的做法,没有写空字符串","pages":["f1"],"evidence":["f1:原始意见摘要"],"status":"未解决 或 已解决"}]}`

// What one stage said about each training page.
function stageInput(stage, run, cases, base) {
  const ws = (c) => path.join(ROOT, "traces", run, c)
  if (stage === "aesthetic") return `<审美 judge:${base}(A 或 B 中的一版)对 ${run} 的两两比较>\n${JSON.stringify(observations(base, run, cases, 1), null, 1)}\n</审美 judge>`
  return cases.map((c) => {
    const parts = [`<页面 ${c}>`]
    if (stage === "program") parts.push(`<程序检查>\n${fs.existsSync(path.join(ws(c), "checks.json")) ? read(path.join(ws(c), "checks.json")) : "[]"}\n</程序检查>`)
    else for (let n = 1; fs.existsSync(path.join(ws(c), `function-${n}.json`)); n++) parts.push(`<需求 judge 第 ${n} 次>\n${read(path.join(ws(c), `function-${n}.json`))}\n</需求 judge 第 ${n} 次>`)
    parts.push(`<Page.tsx>\n${read(path.join(ws(c), "Page.tsx"))}\n</Page.tsx>`, `</页面 ${c}>`)
    return parts.join("\n")
  }).join("\n\n")
}

export async function maintain({ skill, run, stage, base, guide }) {
  const split = JSON.parse(read(path.join(ROOT, "skills", "split.json")))[skill]
  const dir = path.join(ROOT, "skills", skill)
  const expJson = path.join(dir, "experience.json")
  const prev = fs.existsSync(expJson) ? JSON.parse(read(expJson)).problems : []
  const data = split.train.map((c) => `<${c}.json>\n${read(path.join(dir, "data", `${c}.json`))}</${c}.json>`).join("\n")
  const user = `<components.md>\n${read(path.join(ROOT, "components.md"))}\n</components.md>\n\n<公共规范 design.md>\n${read(path.join(ROOT, "design.md"))}\n</公共规范>\n\n<输出指南>\n${read(path.resolve(ROOT, guide))}\n</输出指南>\n\n<训练样本数据>\n${data}\n</训练样本数据>\n\n<已有的问题清单>\n${JSON.stringify(prev, null, 1)}\n</已有的问题清单>\n\n<这一步:${STAGE[stage]},页面版本 ${run}>\n${stageInput(stage, run, split.train, base)}\n</这一步>`
  // The reply is printed as it arrives, so the terminal shows the Maintainer at work.
  process.stdout.write(`\n── Maintainer · ${split.name} · ${STAGE[stage]} · ${run}\n`)
  const r = await call(SYSTEM(split.name), [{ type: "text", text: user }], { key: process.env.DEEPSEEK_API_KEY, onThink: () => process.stdout.write("[思考中…]\n"), onText: (t) => process.stdout.write(t) })
  process.stdout.write("\n")
  const problems = r.json.problems ?? []
  fs.writeFileSync(expJson, JSON.stringify({ skill, updated: { run, stage: STAGE[stage] }, problems }, null, 1))
  const open = problems.filter((p) => p.status !== "已解决")
  const line = (p) => `- **${p.id}**(${p.stage},${p.pages.length} 页):${p.problem}${p.good ? `\n  - 赢的做法:${p.good}` : ""}\n  - 证据:${p.evidence.join(";")}`
  fs.writeFileSync(path.join(dir, "experience.md"), [
    `# 问题清单 · ${split.name}`, "",
    `Maintainer 从训练样本的检测结果归纳,每步更新(最近一次:${run},${STAGE[stage]})。Reviser 读「布局问题」,组件 Agent 读「组件不够」。`, "",
    "## 组件不够", "", ...open.filter((p) => p.cause === "组件不够").map(line), "",
    "## 布局问题", "", ...open.filter((p) => p.cause === "布局问题").map(line), "",
    "## 已解决", "", ...problems.filter((p) => p.status === "已解决").map((p) => `- **${p.id}**(${p.stage}):${p.problem}`), "",
  ].join("\n"))
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
  const problems = await maintain({ skill, run: arg("run"), stage: arg("stage", "program"), base: arg("base"), guide: arg("guide", `skills/${skill}/guides/${current}.md`) })
  for (const p of problems) console.log(`${p.id} [${p.cause}] ${p.status} ${p.pages.join(",")}: ${p.problem}`)
}
