// Probe: can the judge make the stage-3 (aesthetic) calls?
//
//   DEEPSEEK_API_KEY=... node scripts/aesthetic.mjs [--run probe] [--effort low] [--repeats 1]
//
// Samples are the page versions rejected during review plus the accepted one,
// rendered into out/versions/<V>/ (thumb.png, clean-*.png, dom.json).
//   check  every failure mode A1–A10 judged true/false on one page, with nodes
//   pair   the accepted page against each rejected one, in both orders
// Results: out/aesthetic/<run>/*.json; summary printed at the end.
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const RUN = arg("run", "probe")
const EFFORT = arg("effort", "low")
const REPEATS = Number(arg("repeats", "1"))
const MODEL = arg("model", "deepseek-flash")
const KEY = process.env.DEEPSEEK_API_KEY
if (!KEY) throw new Error("set DEEPSEEK_API_KEY")
const VDIR = path.join(ROOT, "out", "versions")
const OUT = path.join(ROOT, "out", "aesthetic", RUN)
fs.mkdirSync(OUT, { recursive: true })

// The reason each version was rejected, as failure-mode ids (the answer key).
const EXPECTED = {
  V1: ["A1"], V2: ["A2"], V3: ["A3"], V4: ["A4"], V5: ["A5"], V6: ["A5"],
  V7: ["A6", "A7", "A8"], V8: ["A9"], V9: ["A10"], F: [],
}

const MODES = [
  ["A1", "多余装饰", "卡片、边框、底色、阴影、颜色、编号等没有表达任何信息,只是装饰。"],
  ["A2", "图形粗重", "图表或图形的线条、色块过粗过重,或用了不表达含义的颜色,显得不精致。"],
  ["A3", "组件内部疏密失当", "组件内部的间距过松或过紧,和页面其他地方的节奏不协调(如条形图的条与条之间)。"],
  ["A4", "同带不齐、出现空洞", "同一水平带里并排的块,底边差距明显,留下一块不成形的空白。"],
  ["A5", "文字块不成形", "文字只占了格子的一部分、旁边留出无意义的空列,或者为了凑满格子而放大字号、拉长行宽。"],
  ["A6", "内容被挤压或裁切", "图表、文字被压缩得过小或过扁,或有文字被裁掉。"],
  ["A7", "为凑高度拉稀行距", "为了和旁边的块等高,把列表或文字的行距拉开,显得松散。"],
  ["A8", "同带无主次", "同一水平带里几块分量相当,却是性质不同的内容,看不出主次。"],
  ["A9", "没有统一系统", "整页的间距没有统一的节奏和层级,没有清晰的对齐主轴,各部分像零散地摆在一起。"],
  ["A10", "字体不讲究", "中文里夹着半角标点、数字字体与正文不协调、字重使用不当等排字问题。"],
]
const modeText = MODES.map(([id, name, def]) => `- ${id} ${name}:${def}`).join("\n")

function img(file) {
  return { type: "image_url", image_url: { url: `data:image/png;base64,${fs.readFileSync(file).toString("base64")}` } }
}
function pageImages(v) {
  const d = path.join(VDIR, v)
  const tiles = JSON.parse(fs.readFileSync(path.join(d, "clean-tiles.json"), "utf8"))
  return { thumb: img(path.join(d, "thumb.png")), tiles: tiles.map((t) => img(path.join(d, t.file))), ranges: tiles.map((t) => `y=${t.y}–${t.y + t.h}`) }
}
function domText(v) {
  const dom = JSON.parse(fs.readFileSync(path.join(VDIR, v, "dom.json"), "utf8"))
  return dom.nodes
    .map((n) => [n.nid, n.slot, `parent=${n.parent ?? "-"}`, `x=${n.x} y=${n.y} w=${n.w} h=${n.h}`, n.text ? `font=${n.fontSize}px/${n.fontWeight} text="${n.text}"` : ""].filter(Boolean).join(" "))
    .join("\n")
}

const SYSTEM_CHECK = `你是资深 UI 视觉设计评审。你只评判一个报告页面的视觉设计质量(排版、比例、节奏、精致度),不评判内容是否正确。

逐条判断页面是否出现下列失败模式。每条只回答出现(true)或没出现(false);出现时用 DOM 清单中的节点编号标出问题最集中的元素(编号必须真实存在),并用一句话说明。

${modeText}

只输出 JSON:{"checks":[{"id":"A1","fail":false,"nodes":[],"reason":""}, ...]},A1 到 A10 每条都要给出。`

const SYSTEM_PAIR = `你是资深 UI 视觉设计评审。下面是同一份报告的两版页面设计 A 和 B,数据相同。只比较视觉设计质量:整体的比例、疏密节奏、主次对比、对齐与留白、组件和字体的精致度。不比较内容。

判断哪一版更好。只输出 JSON:{"better":"A" 或 "B","reason":"一两句话"}`

async function call(system, content) {
  const body = { model: MODEL, messages: [{ role: "system", content: system }, { role: "user", content }], response_format: { type: "json_object" }, reasoning_effort: EFFORT, max_tokens: 32000 }
  for (let attempt = 0; ; attempt++) {
    const t0 = Date.now()
    try {
      const r = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(600_000),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 300)}`)
      const msg = j.choices[0].message
      return { json: JSON.parse(msg.content), raw: msg.content, usage: j.usage, latencyMs: Date.now() - t0 }
    } catch (e) {
      if (attempt >= 3) throw e
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt))
    }
  }
}

const jobs = []
const versions = Object.keys(EXPECTED)
for (let r = 1; r <= REPEATS; r++) {
  for (const v of versions) {
    jobs.push({
      file: `check__${v}__r${r}.json`,
      run: async () => {
        const p = pageImages(v)
        const content = [
          { type: "text", text: `第 1 张图是整页缩略图(看整体);后面 ${p.tiles.length} 张是从上到下的整页切块(看细节,${p.ranges.join(";")},相邻两张重叠 64px,左边缘对应页面 x=96)。\n\n【DOM 清单】编号 组件 父节点 位置尺寸 字号/字重 文字\n${domText(v)}` },
          p.thumb,
          ...p.tiles,
        ]
        return call(SYSTEM_CHECK, content)
      },
    })
  }
  for (const v of versions.filter((x) => x !== "F")) {
    for (const order of ["FA", "FB"]) {
      // FA: the accepted page is A; FB: the accepted page is B
      const [a, b] = order === "FA" ? ["F", v] : [v, "F"]
      jobs.push({
        file: `pair__${v}__${order}__r${r}.json`,
        run: async () => {
          const pa = pageImages(a)
          const pb = pageImages(b)
          const content = [
            { type: "text", text: `A 版:第 1 张为整页缩略图,后 ${pa.tiles.length} 张为整页切块。` },
            pa.thumb,
            ...pa.tiles,
            { type: "text", text: `B 版:第 1 张为整页缩略图,后 ${pb.tiles.length} 张为整页切块。` },
            pb.thumb,
            ...pb.tiles,
          ]
          return call(SYSTEM_PAIR, content)
        },
      })
    }
  }
}

let failed = 0
async function worker() {
  while (jobs.length) {
    const job = jobs.shift()
    const file = path.join(OUT, job.file)
    if (fs.existsSync(file)) continue
    try {
      const res = await job.run()
      fs.writeFileSync(file, JSON.stringify({ effort: EFFORT, ...res }, null, 1))
    } catch (e) {
      failed++
      console.error(`FAIL ${job.file}: ${e.message}`)
    }
  }
}
await Promise.all(Array.from({ length: 10 }, worker))
console.log(`done, ${failed} failed → ${path.relative(ROOT, OUT)}`)
