// The function judge: one page at a time, not about looks. Two questions only, the same for
// every Skill: did the page use all of the data, and is it convenient to use?
// rubric31 says which of two pages is better designed; it cannot see what both pages leave
// out, so this judge reads the data next to the page.
//
//   node scripts/function-judge.mjs --run flow-g0 --cases f1,f2 [--repeat 1]
//
// Writes traces/<run>/<case>/function[-<n>].json: {"unused":[...],"inconvenient":[...]}
import fs from "node:fs"
import path from "node:path"
import { call, img } from "../../ui-judge/scripts/pairwise-judge.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")

export const SYSTEM = `你检查一份报告页面的功能,不评价美观。会给你两样东西:上游 Skill 输出的数据 data.json,和按它生成的页面截图(第 1 张是整页缩略图,后面是从上到下的切块)。data.json 里以 assets/ 开头的是图片文件,页面应该把图片本身显示出来。

只判断两件事:

1. 数据有没有用完。data.json 里的每一部分(文字、数字、列表、图片、颜色)是否都在页面上呈现了。被省略的、只呈现了一部分的、原本是图片却只写了文件名或文字说明的、原本是颜色却只写了色值的,都算没用完。逐条列出,写明 data.json 里的位置和页面上的情况。

2. 方不方便操作。读者拿着这页做该做的事:找到某一项,在几项之间对照,看图并对应到文字说明。逐条列出具体的不便:在哪一节、读者想做什么、为什么不方便(要对照的内容隔得很远、图和说明对不上、长列表没有分组、同一件事分散在几处等)。

不要提配色、留白、字号这类美观问题。没有问题就返回空列表。

只输出 JSON:{"unused":[{"path":"data.json 里的位置,如 chains[*].steps[*].image","page":"页面上的情况"}],"inconvenient":[{"where":"页面上的哪一节","task":"读者想做什么","why":"为什么不方便"}]}`

const pageImages = (ws) => [img(path.join(ws, "thumb.png")), ...JSON.parse(fs.readFileSync(path.join(ws, "tiles.json"), "utf8")).map((t) => img(path.join(ws, t.file)))]

export async function functionJudge(run, cases, repeat = 1) {
  const key = process.env.DEEPSEEK_API_KEY
  const jobs = cases.flatMap((c) => Array.from({ length: repeat }, (_, n) => ({ c, file: path.join(ROOT, "traces", run, c, repeat > 1 ? `function-${n + 1}.json` : "function.json") })))
  async function worker() {
    while (jobs.length) {
      const { c, file } = jobs.shift()
      if (fs.existsSync(file)) continue
      const ws = path.join(ROOT, "traces", run, c)
      const imgs = pageImages(ws)
      try {
        const r = await call(SYSTEM, [
          { type: "text", text: `<data.json>\n${fs.readFileSync(path.join(ws, "data.json"), "utf8")}\n</data.json>\n\n页面截图共 ${imgs.length} 张:` }, ...imgs,
        ], { key })
        fs.writeFileSync(file, JSON.stringify(r.json, null, 1))
        console.log(`  需求 judge ${run}/${c} ${path.basename(file, ".json")}:数据没用完 ${r.json.unused?.length ?? 0} 条,不方便 ${r.json.inconvenient?.length ?? 0} 条`)
      } catch (e) {
        console.error(`FAIL ${run}/${c}: ${e.message}`)
      }
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker))
  return Object.fromEntries(cases.map((c) => {
    const f = path.join(ROOT, "traces", run, c, repeat > 1 ? "function-1.json" : "function.json")
    const j = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null
    return [c, j && { unused: j.unused?.length ?? 0, inconvenient: j.inconvenient?.length ?? 0 }]
  }))
}

// The opinions that count on one page: the repeated runs merged, an opinion counts when it is in
// at least 2 of them. Writes traces/<run>/<case>/function-counted.json; the gate compares counts.
const MERGE = `下面是同一个报告页面的几次功能检查结果(每次一份清单:unused 是数据没用完,inconvenient 是不方便操作)。把说的是同一件事的合并成一条,记下它出现在几次检查里。

只输出 JSON:{"issues":[{"kind":"unused 或 inconvenient","what":"一句话","runs":出现次数}]}`
export async function counted(run, cases) {
  const key = process.env.DEEPSEEK_API_KEY
  await Promise.all(cases.map(async (c) => {
    const ws = path.join(ROOT, "traces", run, c)
    const out = path.join(ws, "function-counted.json")
    if (fs.existsSync(out)) return
    const runs = []
    for (let n = 1; fs.existsSync(path.join(ws, `function-${n}.json`)); n++) runs.push(`<第 ${n} 次>\n${fs.readFileSync(path.join(ws, `function-${n}.json`), "utf8")}\n</第 ${n} 次>`)
    const r = await call(MERGE, [{ type: "text", text: runs.join("\n\n") }], { key })
    fs.writeFileSync(out, JSON.stringify({ issues: (r.json.issues ?? []).filter((i) => i.runs >= 2), dropped: (r.json.issues ?? []).filter((i) => i.runs < 2) }, null, 1))
  }))
  return Object.fromEntries(cases.map((c) => [c, JSON.parse(fs.readFileSync(path.join(ROOT, "traces", run, c, "function-counted.json"), "utf8")).issues.length]))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (k, d) => {
    const i = process.argv.indexOf(`--${k}`)
    return i > 0 ? process.argv[i + 1] : d
  }
  console.log(JSON.stringify(await functionJudge(arg("run"), arg("cases").split(","), Number(arg("repeat", "1"))), null, 1))
}
