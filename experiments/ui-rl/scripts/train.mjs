// 第 3 阶段:训练(照 Training-Free GRPO,做法见 PLAN.md 第 5 节)。
//
//   source judge.env && node experiments/ui-rl/scripts/train.mjs --run pilot [--passes 2] [--seed 1] [--steps 1] [--versions 6]
//
// 训练用报告数据取 data/split.json 的 flow.pilot.train,每遍打乱顺序;每份报告数据走一步:
//   1. 生成:用「输出指南 g0 + 当前经验清单」写 6 版页面(rollout.mjs)
//   2. 打分:judge 两两比较,每版的分(score.mjs);一对都没判出高下就跳过这一步
//   3. Maintainer:总结每版、整组比较、更新模式清单(maintainer.mjs)
//   4. Recorder:记下这一步生成时用的每条经验的效果(recorder.mjs)
//   5. Reviser:按可用的模式和修改记录改经验清单(reviser.mjs);Recorder 记下改动
// 每遍结束在验证用报告数据上观察(observe.mjs)。
// --steps N:只跑到第 N 步就停(试跑用)。中断后重跑同一命令,做完的部分跳过。
//
// runs/<run>/
//   lists/s<NN>.json       第 NN 步之后的经验清单(s00 是空的)
//   steps/s<NN>/           guide.md(这一步生成用的指南)、judge/、score.json、summaries/、compare.json、patterns-merge.json、reviser.json
//   pages/s<NN>/v<k>/<报告数据>/   生成的页面(只有 Page.tsx、缩略图、meta.json 等进仓库)
//   patterns.json/.md      模式清单;record.json/.md 修改记录;list.md 当前经验清单
import fs from "node:fs"
import path from "node:path"
import { features, describe } from "../lib/features.mjs"
import { rollout, DATA } from "./rollout.mjs"
import { scoreGroup } from "./score.mjs"
import { summarize, compare, updatePatterns, loadPatterns } from "./maintainer.mjs"
import { revise } from "./reviser.mjs"
import { loadRecord, recordEffects, recordChanges, saveRecord } from "./recorder.mjs"
import { observe } from "./observe.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d)
const RUN = arg("run")
if (!RUN) throw new Error("--run <名字> 必须给")
if (!process.env.DEEPSEEK_API_KEY) throw new Error("set DEEPSEEK_API_KEY (source judge.env)")
const PASSES = Number(arg("passes", "2")), SEED = Number(arg("seed", "1")), MAX_STEPS = Number(arg("steps", "0"))
const VERSIONS = Array.from({ length: Number(arg("versions", "6")) }, (_, i) => `v${i + 1}`)
const DIR = path.join(ROOT, "runs", RUN)
const G0 = path.join(ROOT, "..", "ui-loop", "skills", "flow", "guides", "g0.md")
const g0 = fs.readFileSync(G0, "utf8")
const split = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "split.json"), "utf8")).flow.pilot
const pad = (n) => String(n).padStart(2, "0")
const log = (...a) => console.log(...a)

// 每遍的顺序:按 seed 打乱(mulberry32)
function shuffled(a, seed) {
  let t = seed >>> 0
  const rnd = () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296 }
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] }
  return b
}
const plan = Array.from({ length: PASSES }, (_, p) => shuffled(split.train, SEED * 100 + p + 1).map((report) => ({ pass: p + 1, report })))
  .flat().map((x, i) => ({ ...x, step: i + 1 }))

const listFile = (n) => path.join(DIR, "lists", `s${pad(n)}.json`)
const loadList = (n) => (n === 0 ? { items: [], next: 1 } : JSON.parse(fs.readFileSync(listFile(n), "utf8")))
// 生成用的指南:经验清单空时就是 g0 原文
const guideText = (list) => (list.items.length ? `${g0.trimEnd()}\n\n## 经验\n\n写页面前先读这些经验;和上面的规则冲突时,以经验为准。\n\n${list.items.map((e) => `- [${e.id}] ${e.text}`).join("\n")}\n` : g0)
const renderList = (list, step) => `# 经验清单(第 ${step} 步之后)\n\n${list.items.length ? list.items.map((e) => `- **${e.id}** ${e.text}(依据 ${e.patterns.join("、")};第 ${e.since} 步加入)`).join("\n") : "(空)"}\n`

fs.mkdirSync(path.join(DIR, "lists"), { recursive: true })
fs.writeFileSync(path.join(DIR, "plan.json"), JSON.stringify({ passes: PASSES, seed: SEED, versions: VERSIONS.length, train: split.train, val: split.val, steps: plan }, null, 1))
log(`训练 ${RUN}:${PASSES} 遍 × ${split.train.length} 份 = ${plan.length} 步,每步 ${VERSIONS.length} 版${MAX_STEPS ? `;这次只跑到第 ${MAX_STEPS} 步` : ""}`)
log(`顺序:${plan.map((s) => `${s.step}.${s.report}`).join(" ")}`)

const recordFile = path.join(DIR, "record.json"), patternsFile = path.join(DIR, "patterns.json")

// 每遍的最后一步之后:用改完的经验清单在验证用报告数据上观察
async function afterStep({ step, pass, list, sdir }) {
  const last = plan.filter((s) => s.pass === pass).at(-1).step
  if (step !== last || loadRecord(recordFile).observe.some((o) => o.pass === pass)) return
  const guide = path.join(sdir, "guide-after.md")
  fs.writeFileSync(guide, guideText(list))
  const reports = await observe({ runDir: DIR, pass, reports: split.val, guide, g0: G0, log })
  const rec = loadRecord(recordFile)
  rec.observe.push({ pass, afterStep: step, listSize: list.items.length, reports })
  saveRecord(recordFile, rec, list)
}
for (const { step, pass, report } of plan) {
  if (MAX_STEPS && step > MAX_STEPS) break
  if (fs.existsSync(listFile(step))) {
    log(`第 ${step} 步(${report})已做完,跳过`)
    await afterStep({ step, pass, list: loadList(step), sdir: path.join(DIR, "steps", `s${pad(step)}`) })
    continue
  }
  const t0 = Date.now()
  const sdir = path.join(DIR, "steps", `s${pad(step)}`)
  fs.mkdirSync(sdir, { recursive: true })
  const prev = loadList(step - 1)
  const record = loadRecord(recordFile)
  const featuresText = describe(features(JSON.parse(fs.readFileSync(path.join(DATA, `${report}.json`), "utf8"))))
  log(`\n===== 第 ${step} 步(第 ${pass} 遍):${report}(${featuresText});经验清单 ${prev.items.length} 条`)

  // 1. 生成
  const guide = path.join(sdir, "guide.md")
  fs.writeFileSync(guide, guideText(prev))
  log(`1. 生成 ${VERSIONS.length} 版`)
  const pages = await rollout({ report, guide, dir: path.join(DIR, "pages", `s${pad(step)}`), versions: VERSIONS, log })
  if (pages.length < 2) throw new Error(`第 ${step} 步只写成了 ${pages.length} 版,停止`)

  // 2. 打分
  log(`2. 打分`)
  const scored = await scoreGroup({ pages, dir: path.join(sdir, "judge"), log })
  fs.writeFileSync(path.join(sdir, "score.json"), JSON.stringify(scored, null, 1))
  const stepInfo = { step, pass, report, pages: pages.length, scores: Object.fromEntries(Object.entries(scored.score).map(([v, x]) => [v, +x.toFixed(1)])), decided: scored.decided, pairs: scored.pairs.length }
  if (!scored.decided) {
    log(`一对都没判出高下,这一步不总结、不改经验清单`)
    record.steps.push({ ...stepInfo, skipped: true })
    fs.writeFileSync(listFile(step), JSON.stringify(prev, null, 1))
    saveRecord(recordFile, record, prev)
    await afterStep({ step, pass, list: prev, sdir })
    continue
  }

  // 3. Maintainer
  log(`3. Maintainer`)
  const sums = await summarize({ pages, scored, featuresText, list: prev, dir: path.join(sdir, "summaries"), log })
  const cmp = await compare({ pages, scored, sums, featuresText, file: path.join(sdir, "compare.json"), log })
  const touched = await updatePatterns({ file: patternsFile, cmp, step, report, featuresText, scored, opsFile: path.join(sdir, "patterns-merge.json"), log })

  // 4. Recorder:这一步生成时用的经验的效果
  recordEffects(record, { step, report, list: prev, sums, score: scored.score })

  // 5. Reviser,Recorder 记下改动
  log(`4. Reviser`)
  const { list, ops } = await revise({ list: prev, book: loadPatterns(patternsFile), touched, record, guideText: g0, file: path.join(sdir, "reviser.json"), log })
  for (const e of list.items) e.since ??= step
  recordChanges(record, { step, report, ops })
  record.steps.push({ ...stepInfo, patterns: touched, ops: ops.length })
  fs.writeFileSync(listFile(step), JSON.stringify(list, null, 1))
  fs.writeFileSync(path.join(DIR, "list.md"), renderList(list, step))
  saveRecord(recordFile, record, list)
  log(`第 ${step} 步完成,${Math.round((Date.now() - t0) / 60000)} 分钟;经验清单 ${list.items.length} 条`)

  await afterStep({ step, pass, list, sdir })
}
log(`\n结束。经验清单:${path.relative(process.cwd(), path.join(DIR, "list.md"))};模式清单:patterns.md;修改记录:record.md`)
