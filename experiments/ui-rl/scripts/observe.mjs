// 每遍结束的观察:验证用报告数据上,「输出指南 + 当前经验清单」和「只有输出指南」各生成 2 版,交叉比较。只记录,不回滚。
//
//   const reports = await observe({ runDir, pass, reports: ["f13", ...], guide, g0 })
//
// 只有输出指南的页面每次都一样,只生成一次(pages/observe-g0/),各遍共用;有经验清单的在 pages/observe-p<pass>/。
// 每份报告数据 2 × 2 = 4 对,每对两种顺序;v 正数 = 有经验清单的那版更好。4 对的平均 ≥ 0.5 = 赢,≤ -0.5 = 输,其余 = 平。
import fs from "node:fs"
import path from "node:path"
import { rollout } from "./rollout.mjs"
import { judgeOnce } from "./score.mjs"

export async function observe({ runDir, pass, reports, guide, g0, log = console.log }) {
  const listDir = path.join(runDir, "pages", `observe-p${pass}`), g0Dir = path.join(runDir, "pages", "observe-g0")
  const judgeDir = path.join(runDir, "observe", `p${pass}`)
  fs.mkdirSync(judgeDir, { recursive: true })
  log(`观察(第 ${pass} 遍结束):验证用 ${reports.join("、")},有经验清单和只有输出指南各 2 版`)
  const made = await Promise.all(reports.map(async (report) => {
    const [L, G] = await Promise.all([
      rollout({ report, guide, dir: path.join(listDir, report), versions: ["v1", "v2"], log }),
      rollout({ report, guide: g0, dir: path.join(g0Dir, report), versions: ["v1", "v2"], log }),
    ])
    return { report, L, G }
  }))
  const out = []
  for (const { report, L, G } of made) {
    const vs = []
    await Promise.all(L.flatMap((l) => G.map(async (g) => {
      const a = await judgeOnce({ v: `L${l.v}`, ws: l.ws }, { v: `G${g.v}`, ws: g.ws }, path.join(judgeDir, `${report}-L${l.v}-G${g.v}-AB.json`), `${report} 有经验 ${l.v} vs 只有指南 ${g.v}`)
      const b = await judgeOnce({ v: `G${g.v}`, ws: g.ws }, { v: `L${l.v}`, ws: l.ws }, path.join(judgeDir, `${report}-L${l.v}-G${g.v}-BA.json`), `${report} 只有指南 ${g.v} vs 有经验 ${l.v}`)
      vs.push((b.score - a.score) / 2)
    })))
    const mean = vs.length ? +(vs.reduce((x, y) => x + y, 0) / vs.length).toFixed(2) : 0
    const verdict = !vs.length ? "没有页面" : mean >= 0.5 ? "赢" : mean <= -0.5 ? "输" : "平"
    out.push({ report, v: vs, mean, verdict })
    log(`  观察 ${report}:${vs.length} 对,平均 ${mean > 0 ? "+" : ""}${mean},有经验清单的${verdict}`)
  }
  return out
}
