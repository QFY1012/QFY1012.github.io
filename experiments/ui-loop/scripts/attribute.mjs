// Attribution: for each page, merge the function judge's repeated runs and decide, for every
// opinion that holds up (in at least 2 of the runs), which layer it belongs to:
//   组件库  the component library cannot do it (a missing component or prop)  → change components (shared layer)
//   组合    the components can do it, the page uses or arranges them wrongly   → change the Skill's output guide
//   没照做  the spec or guide already says it, Page.tsx does not follow        → no rule change, recorded
//
//   node scripts/attribute.mjs --run flow-g0 --cases f1,f2 --guide skills/flow/guides/g0.md [--stage program|function] [--runs 3]
//
// The checks run in order and a page goes on only when it passes: program checks, then the
// function judge, then the aesthetic judge. --stage program attributes the program-check
// findings only; --stage function also reads traces/<run>/<case>/function-<n>.json.
// Writes traces/<run>/<case>/attribution-<stage>.json.
import fs from "node:fs"
import path from "node:path"
import { call } from "../../ui-judge/scripts/pairwise-judge.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const read = (f) => fs.readFileSync(f, "utf8")

export const SYSTEM = `你负责给报告页面的问题归因。会给你:功能 judge 对同一页的几次检查结果(每次一份清单:unused 是数据没用完,inconvenient 是不方便操作)、程序检查的结果(构建、组件库、统一刻度、数据忠实,带 Page.tsx 行号)、页面代码 Page.tsx、组件库说明 components.md、公共规范 design.md、这个 Skill 的输出指南。

步骤:
1. 合并:几份清单里说的是同一件事的合并成一条,记下它出现在几次检查里。
2. 出现次数不到 2 次的放进 dropped,不归因。程序检查的结果是确定的,每条都要归因(kind 写 program,runs 写 0)。
3. 其余每条判断出在哪一层,标准是「现有组件库能不能解决」:
   - 组件库:components.md 里没有能做到的组件或 props(例如要显示图片,但没有图片组件;要显示颜色本身,但不允许写颜色)。写明缺什么能力。
   - 组合:现有组件和 props 能解决,只是页面用错了组件或排法不对。写明该用哪个组件、怎么改;再看输出指南和公共规范里有没有相关规则:没有写「缺规则」,有但写得不清楚写「规则不清楚」。
   - 没照做:公共规范或输出指南里已经写清楚了,Page.tsx 没照做。写明是哪条规则。
   依据必须引用 components.md、design.md、输出指南或 Page.tsx 里的具体内容。

只输出 JSON:{"issues":[{"kind":"unused 或 inconvenient 或 program","what":"一句话说清问题","runs":出现次数,"cause":"组件库 或 组合 或 没照做","evidence":"依据","fix":"组件库:缺什么能力;组合:用哪个组件怎么改,以及缺规则还是规则不清楚;没照做:哪条规则"}],"dropped":[{"what":"一句话","runs":1}]}`

export async function attribute(run, cases, guideFile, stage = "function", runs = 3) {
  if (stage === "program") runs = 0
  const key = process.env.DEEPSEEK_API_KEY
  const shared = `<components.md>\n${read(path.join(ROOT, "components.md"))}\n</components.md>\n\n<design.md>\n${read(path.join(ROOT, "design.md"))}\n</design.md>\n\n<输出指南>\n${read(path.resolve(ROOT, guideFile))}\n</输出指南>`
  await Promise.all(cases.map(async (c) => {
    const ws = path.join(ROOT, "traces", run, c)
    const out = path.join(ws, `attribution-${stage}.json`)
    if (fs.existsSync(out)) return
    const results = Array.from({ length: runs }, (_, n) => path.join(ws, `function-${n + 1}.json`)).filter(fs.existsSync).map((f, n) => `<第 ${n + 1} 次检查>\n${read(f)}\n</第 ${n + 1} 次检查>`)
    try {
      const checks = fs.existsSync(path.join(ws, "checks.json")) ? read(path.join(ws, "checks.json")) : "[]"
      const r = await call(SYSTEM, [{ type: "text", text: `${results.join("\n\n")}\n\n<程序检查>\n${checks}\n</程序检查>\n\n<Page.tsx>\n${read(path.join(ws, "Page.tsx"))}\n</Page.tsx>\n\n${shared}` }], { key })
      fs.writeFileSync(out, JSON.stringify(r.json, null, 1))
    } catch (e) {
      console.error(`FAIL ${run}/${c}: ${e.message}`)
    }
  }))
  return Object.fromEntries(cases.map((c) => {
    const f = path.join(ROOT, "traces", run, c, `attribution-${stage}.json`)
    const j = fs.existsSync(f) ? JSON.parse(read(f)) : { issues: [] }
    const by = (k) => j.issues.filter((i) => i.cause === k).length
    return [c, { 组件库: by("组件库"), 组合: by("组合"), 没照做: by("没照做"), dropped: j.dropped?.length ?? 0 }]
  }))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (k, d) => {
    const i = process.argv.indexOf(`--${k}`)
    return i > 0 ? process.argv[i + 1] : d
  }
  console.log(JSON.stringify(await attribute(arg("run"), arg("cases").split(","), arg("guide"), arg("stage", "function"), Number(arg("runs", "3"))), null, 1))
}
