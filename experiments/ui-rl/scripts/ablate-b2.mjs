// 对照实验:把经验写进规范以后,经验清单还有没有用。
//   gen/design-b2.md   只改了 B2(E1:关键数字一行排满、结论数字打头)
//   gen/design-b2b9.md 再改了 B9(E2:下一步几条排几列,4 条及以上单列、依据写进条目)
//
//   source judge.env && node scripts/ablate-b2.mjs --run pilot [--pass 1] [--design design-b2b9.md]
//
// 验证用报告数据 f13–f16 上,「g0 + 改过的规范」各生成 2 版(pages/ablate-<规范名去掉 design->/),
// 和第 <pass> 遍观察里「g0 + 经验清单」的 2 版(pages/observe-p<pass>/,用原规范)交叉比较:每份 4 对,每对两种顺序。
// v 正数 = 有经验清单的那版更好;判法、记分和 observe.mjs 一样。结果在 runs/<run>/ablate-<…>/。
import fs from "node:fs"
import path from "node:path"
import { rollout } from "./rollout.mjs"
import { judgeOnce } from "./score.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d)
const DIR = path.join(ROOT, "runs", arg("run", "pilot")), PASS = arg("pass", "1")
const G0 = path.join(ROOT, "gen", "guides", "g0.md"), DESIGN = path.join(ROOT, "gen", arg("design", "design-b2.md"))
const TAG = "ablate-" + path.basename(DESIGN, ".md").replace(/^design-/, "")
const REPORTS = ["f13", "f14", "f15", "f16"]
const outDir = path.join(DIR, TAG), pageDir = path.join(DIR, "pages", TAG)
fs.mkdirSync(outDir, { recursive: true })

const ver = (ws) => path.basename(path.dirname(ws))
const listed = (report) => ["v1", "v2"].map((v) => ({ v, ws: path.join(DIR, "pages", `observe-p${PASS}`, report, v, report) })).filter(({ ws }) => fs.existsSync(path.join(ws, "thumb.png")))

console.log(`对照实验:有经验清单(第 ${PASS} 遍观察的页面) vs 只有 g0 + ${path.basename(DESIGN)},${REPORTS.join("、")}`)
const made = await Promise.all(REPORTS.map(async (report) => ({ report, L: listed(report), B: await rollout({ report, guide: G0, design: DESIGN, dir: path.join(pageDir, report), versions: ["v1", "v2"] }) })))
const out = []
for (const { report, L, B } of made) {
  const vs = []
  await Promise.all(L.flatMap((l) => B.map(async (b) => {
    const tag = `${report}-L${l.v}-B${b.v}`
    const x = await judgeOnce({ v: `L${l.v}`, ws: l.ws }, { v: `B${b.v}`, ws: b.ws }, path.join(outDir, `${tag}-AB.json`), `${report} 有经验 ${l.v} vs ${TAG} ${b.v}`)
    const y = await judgeOnce({ v: `B${b.v}`, ws: b.ws }, { v: `L${l.v}`, ws: l.ws }, path.join(outDir, `${tag}-BA.json`), `${report} ${TAG} ${b.v} vs 有经验 ${l.v}`)
    vs.push({ l: l.v, b: b.v, v: (y.score - x.score) / 2 })
  })))
  const mean = vs.length ? +(vs.reduce((s, x) => s + x.v, 0) / vs.length).toFixed(2) : 0
  const verdict = !vs.length ? "没有页面" : mean >= 0.5 ? "赢" : mean <= -0.5 ? "输" : "平"
  out.push({ report, pairs: vs, mean, verdict })
  console.log(`  ${report}:${vs.length} 对,平均 ${mean > 0 ? "+" : ""}${mean},有经验清单的${verdict}`)
}
fs.writeFileSync(path.join(outDir, "result.json"), JSON.stringify({ pass: PASS, design: path.relative(ROOT, DESIGN), reports: out }, null, 1))
const all = out.flatMap((r) => r.pairs.map((p) => p.v))
console.log(`合计 ${all.length} 对,平均 ${(all.reduce((s, x) => s + x, 0) / all.length).toFixed(2)};有经验清单的赢 ${out.filter((r) => r.verdict === "赢").length} 份、平 ${out.filter((r) => r.verdict === "平").length} 份、输 ${out.filter((r) => r.verdict === "输").length} 份`)
