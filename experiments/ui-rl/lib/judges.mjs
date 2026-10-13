// 第 1 阶段要比较的几种 judge。每种给出:system prompt、一对页面的输入、把回答换算成分数。
//
// 分数一律按「B 比 A 好多少」给:+2 B 明显更好,+1 B 稍好,0 差不多,-1 A 稍好,-2 A 明显更好。
// 只能二选一的判法(rubric31)只有 ±1;能说「一样」的(需求 judge)是 ±1 / 0。
//
//   rubric31  ui-loop 的审美 judge,原样(只看截图,强制二选一)
//   func      ui-loop 早期的需求 judge:哪版更方便使用,可以说一样;给 data.json,两版开头相同的切块略去
//   ia        新标准(docs/criteria.md 第 1–6 条):信息组织优先、版面整齐其次,五档
//   ia31      新标准 + rubric31 的 7 条作为平局时的参考,五档
//   ia2       ia31 + 两条取舍规则(标准冲突时前面的条优先;只换了写法、信息的组织没变判一样),输入不变
//   ia2s      ia2 的标准,输入换成按节对齐:两版整页缩略图 + 逐节交替给 A、B 的截图,两版相同的节略去(cache/sections,先跑 section-crops.mjs)
//   ia3s      ia2s 去掉两条取舍规则(标准同 ia31,输入同 ia2s)
//   ia4s      按人工理由重写的 5 条(去掉「简练」和 rubric31 的视觉细节,不加取舍规则),输入同 ia2s
//   ia4v      ia4s + rubric31 的视觉细节(只在信息组织和版面都分不出高下时参考)
//   ia5       定下来的版本:信息组织 4 条 + 视觉一节(rubric31 的 7 条,「同类组件一致」并入「一组指标一行排满」的例子),输入同 ia2s。
//             ia4v 只调了结构,没有单独重跑
//   ia2p      ia2s,但不同的节把 A、B 左右拼成一张图(左 A 右 B),没有先后
//   ia2g      ia2s,但总体给 1–9 的分(5 = 一样),同一请求采 3 次取平均
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { execFileSync } from "node:child_process"
import { img, RUBRIC_31 } from "../../ui-judge/scripts/pairwise-judge.mjs"
import { systemAesthetic, SYSTEM_FUNCTION } from "../../ui-loop/scripts/compare.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")

const tiles = (ws) => JSON.parse(fs.readFileSync(path.join(ws, "tiles.json"), "utf8"))
const hash = (f) => crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex")
// 两版从上往下第一张不同的切块(和 ui-loop/scripts/compare.mjs 的 firstChange 一样)
function firstChange(wa, wb) {
  const [ta, tb] = [tiles(wa), tiles(wb)]
  let i = 0
  while (i < ta.length && i < tb.length && hash(path.join(wa, ta[i].file)) === hash(path.join(wb, tb[i].file))) i++
  return i === ta.length && i === tb.length ? 0 : i
}
const version = (ws, label, from = 0) => {
  const t = tiles(ws).slice(from)
  return [{ type: "text", text: `${label} 版:第 1 张为整页缩略图,后 ${t.length} 张为${from ? `从第 ${from + 1} 张起的切块(前面的两版相同,略去)` : "整页切块"}。` },
    img(path.join(ws, "thumb.png")), ...t.map((x) => img(path.join(ws, x.file)))]
}
const dataOf = (ws) => ({ type: "text", text: `<data.json>\n${fs.readFileSync(path.join(ws, "data.json"), "utf8")}\n</data.json>` })

// ---------------------------------------------------------------- 新标准
const IA = `你比较同一份报告的两版页面 A 和 B 哪版更好。会给你上游数据 data.json 和两版的截图(每版先是整页缩略图,再是从上到下的切块)。两版用的是同一套组件库,区别在于信息怎么组织、怎么排。

按下面的标准比,前面的比后面的重要:先看信息组织,信息组织分不出高下再看版面整齐。

一、信息组织(主要依据)
1. 相关的信息放在一起:内容上互相解释的东西挨着放(例如截图和它的备注、结论和支撑它的核心指标),读者不用来回翻找。
2. 不同性质的信息分开:元信息(任务、范围、日期这类背景信息)不和结论、发现混在同一节。
3. 主次决定位置和占地:结论、核心指标这类最重要的内容在前面、显眼;背景信息这类次要内容放后面或压缩,不占前面的大块空间。
4. 合在一起之后分得清:不同类别的内容放进同一块后,要一眼看出哪个是哪个(例如步骤说明和备注)。
5. 简练:同样的信息,用更少的空间和层级表达更好;没有信息量的块不占大面积。

二、版面整齐(次要依据)
6. 同类的项目排列整齐:例如一组指标一行排满,不出现单独掉到下一行的一项。
%EXTRA%
做法:
1. 先找出两版不同的地方(两版常常只差一两处),写清是哪一节、各是什么样。
2. 逐条看上面的标准:这些不同之处让哪版在这一条上更好,或者一样。没有涉及的条写「无关」。
3. 综合判断:哪版更好、好多少。「明显」指读者一眼能感到的差别;「稍好」指仔细比才看得出;两版差别不影响阅读,或各有好坏抵消,判「一样」。

只输出 JSON:{"diff":"两版不同的地方","criteria":[{"no":1,"better":"A 或 B 或 一样 或 无关","why":"一句话"}],"better":"A 或 B 或 一样","degree":"明显 或 稍好(一样时写空)","reason":"一两句话"}`

const VISUAL = `
三、视觉细节(只在前面都分不出高下时参考)
${RUBRIC_31.map((c, i) => `${7 + i}. ${c.name}:${c.rule}`).join("\n")}
`

// ---------------------------------------------------------------- 第 1 阶段第 2 版
const IA31 = IA.replace("%EXTRA%", VISUAL).replace("信息组织分不出高下再看版面整齐。", "信息组织分不出高下再看版面整齐,都分不出再看视觉细节。")
const RULES = `
取舍规则:
- 一版在某条上好、在另一条上差时,按条目顺序取舍,前面的条优先。特别是第 1、4 条(相关的放一起、合在一起后分得清)上的好处,不会因为多占了一些空间(第 5 条)或次要信息占地稍多(第 3 条)而被抵消;第 3、5 条只在出现大块没有信息的空白时才算明显的缺点。
- 两版的差别只是同一块内容换了写法或形式(例如表格换成列表、「第 3 步」换成「3」、列数不同),而信息怎么分组、放在哪、和什么挨着都没变时,判「一样」。
`
const IA2 = IA31.replace("\n做法:", `${RULES}\n做法:`)
// 按节对齐输入要改的两句(ia2s、ia3s 共用)
const sectionInput = (t) => t
  .replace("会给你上游数据 data.json 和两版的截图(每版先是整页缩略图,再是从上到下的切块)。", "会给你上游数据 data.json、两版的整页缩略图,再按节逐一对照两版的截图:两版完全相同的节只写一句、不给图;不同的节先给 A 版这一节、再给 B 版这一节;只有一版有的节会注明。")
  .replace("1. 先找出两版不同的地方(两版常常只差一两处),写清是哪一节、各是什么样。", "1. 先看标了「两版不同」或「只有一版有」的节,写清各是什么样;再看缩略图,注意节的增减和先后顺序有没有变。")
const IA2S = sectionInput(IA2)
// 第 1 阶段第 3 版:只留人工理由里有依据的标准,按理由里出现的多少排先后
const IA4 = IA.replace(/按下面的标准比[\s\S]*?%EXTRA%\n/, `按下面的标准比,前面的比后面的重要:先看信息组织,信息组织分不出高下再看版面。

一、信息组织(主要依据)
1. 相关的信息放在一起:内容上互相解释的东西挨着放(例如截图和它的备注、结论和支撑它的核心指标),读者不用来回翻找。
2. 合在一起之后分得清、好读:不同类别的内容放进同一块后,一眼看得出哪条属于哪一类、哪个对象(例如步骤说明和备注、不同产品的备注)。
3. 不同性质的信息分开:元信息(任务、范围、日期这类背景信息)不和结论、发现混在一起。
4. 主次决定位置:结论、核心指标在前面、显眼;背景信息这类次要内容不占前面的大块空间。

二、版面(次要依据)
5. 同类的项目排列整齐:例如一组指标一行排满,不出现单独掉到下一行的一项。

`)
const IA4S = sectionInput(IA4)
// 定下来的版本:版面那一条并进视觉一节的「同类组件一致」
const VISUAL5 = RUBRIC_31.map((c, i) => `${5 + i}. ${c.name}:${c.name === "同类组件一致" ? `${c.rule};例如一组指标一行排满,不出现单独掉到下一行的一项` : c.rule}`).join("\n")
const IA5 = IA4
  .replace("先看信息组织,信息组织分不出高下再看版面。", "先看信息组织,信息组织分不出高下再看视觉。")
  .replace(/二、版面\(次要依据\)\n5\. [^\n]*\n/, `二、视觉(次要依据)\n${VISUAL5}\n`)
const IA5S = sectionInput(IA5)
// ia5 的评判标准(不含做法和输出格式),训练时 Maintainer 和 Reviser 用它作学习目标
export const CRITERIA = IA5.slice(IA5.indexOf("按下面的标准比"), IA5.indexOf("\n\n做法"))
const IA4V = sectionInput(IA4
  .replace("信息组织分不出高下再看版面。", "信息组织分不出高下再看版面,都分不出再看视觉细节。")
  .replace("\n\n做法:", `\n\n三、视觉细节(只在前面都分不出高下时参考)\n${RUBRIC_31.map((c, i) => `${6 + i}. ${c.name}:${c.rule}`).join("\n")}\n\n做法:`))
const IA3S = sectionInput(IA31)

const IA2P = IA2S.replace("不同的节先给 A 版这一节、再给 B 版这一节", "不同的节把两版的这一节左右并排拼成一张图,左边是 A 版、右边是 B 版")
const IA2G = IA2S
  .replace(/3\. 综合判断:.*\n/, "3. 综合判断,给一个 1–9 的分:1 = A 明显更好,3 = A 稍好,5 = 一样,7 = B 稍好,9 = B 明显更好,2、4、6、8 是中间的程度。「明显」指读者一眼能感到的差别;「稍好」指仔细比才看得出;两版差别不影响阅读,或各有好坏抵消,给 5。拿不准倾向哪边时,给靠近 5 的分。\n")
  .replace(`"better":"A 或 B 或 一样","degree":"明显 或 稍好(一样时写空)",`, `"score":1 到 9 的整数,`)

// 训练生成的页面把按节截图存在自己的工作目录 <ws>/sections/;标注集的页面在 cache/sections/<run>/<case>/
const sections = (ws) => {
  const own = path.join(ws, "sections", "sections.json")
  const f = fs.existsSync(own) ? own : path.join(ROOT, "cache", "sections", path.basename(path.dirname(ws)), path.basename(ws), "sections.json")
  if (!fs.existsSync(f)) throw new Error(`没有按节截图:${f}(先跑 scripts/section-crops.mjs)`)
  return JSON.parse(fs.readFileSync(f, "utf8")).map((s) => ({ ...s, dir: path.dirname(f) }))
}
// 按节标题对齐(最长公共子序列),返回 [{a, b}],缺的一边为 null
function align(A, B) {
  const n = A.length, m = B.length, L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i].title === B[j].title ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const out = []
  let i = 0, j = 0
  while (i < n || j < m) {
    if (i < n && j < m && A[i].title === B[j].title) out.push({ a: A[i++], b: B[j++] })
    else if (j >= m || (i < n && L[i + 1][j] >= L[i][j + 1])) out.push({ a: A[i++], b: null })
    else out.push({ a: null, b: B[j++] })
  }
  return out
}
// 同一节的 A、B 左右拼成一张(每一张切片配对;某边张数少时那边留白),缓存在 cache/sbs
function sideBySide(a, b) {
  const n = Math.max(a.files.length, b.files.length), out = []
  for (let k = 0; k < n; k++) {
    const fa = a.files[k] ? path.join(a.dir, a.files[k]) : "-", fb = b.files[k] ? path.join(b.dir, b.files[k]) : "-"
    const f = path.join(ROOT, "cache", "sbs", crypto.createHash("sha1").update(`${fa}|${fb}`).digest("hex") + ".png")
    if (!fs.existsSync(f)) {
      fs.mkdirSync(path.dirname(f), { recursive: true })
      execFileSync("python3", [path.join(ROOT, "scripts", "side-by-side.py"), fa, fb, f])
    }
    out.push(img(f))
  }
  return out
}
function bySection(wa, wb, { sbs = false } = {}) {
  const shots = (s) => s.files.map((f) => img(path.join(s.dir, f)))
  const out = [dataOf(wa),
    { type: "text", text: "A 版整页缩略图:" }, img(path.join(wa, "thumb.png")),
    { type: "text", text: "B 版整页缩略图:" }, img(path.join(wb, "thumb.png"))]
  align(sections(wa), sections(wb)).forEach(({ a, b }, k) => {
    const head = `第 ${k + 1} 节「${(a ?? b).title}」`
    if (a && b && a.hash === b.hash) out.push({ type: "text", text: `${head}:两版相同,略去。` })
    else if (a && b && sbs) out.push({ type: "text", text: `${head}:两版不同,左边是 A 版,右边是 B 版:` }, ...sideBySide(a, b))
    else if (a && b) out.push({ type: "text", text: `${head}:两版不同。A 版:` }, ...shots(a), { type: "text", text: `${head} B 版:` }, ...shots(b))
    else out.push({ type: "text", text: `${head}:只有 ${a ? "A" : "B"} 版有这一节。` }, ...shots(a ?? b))
  })
  return out
}

// 1–9 换算到 -2..2(B 比 A 好多少)
const gradedScore = (j) => (Number(j.score) - 5) / 2

const iaScore = (j) => {
  const s = j.better === "B" ? 1 : j.better === "A" ? -1 : 0
  return s * (s && /明显/.test(j.degree ?? "") ? 2 : 1)
}

export const JUDGES = {
  rubric31: {
    system: () => systemAesthetic(),
    content: (wa, wb) => [...version(wa, "A"), ...version(wb, "B")],
    score: (j) => (j.better === "B" ? 1 : j.better === "A" ? -1 : 0),
  },
  func: {
    system: () => SYSTEM_FUNCTION,
    content: (wa, wb) => { const from = firstChange(wa, wb); return [dataOf(wa), ...version(wa, "A", from), ...version(wb, "B", from)] },
    score: (j) => (j.better === "B" ? 1 : j.better === "A" ? -1 : 0),
  },
  ia: {
    system: () => IA.replace("%EXTRA%", ""),
    content: (wa, wb) => [dataOf(wa), ...version(wa, "A"), ...version(wb, "B")],
    score: iaScore,
  },
  ia31: {
    system: () => IA31,
    content: (wa, wb) => [dataOf(wa), ...version(wa, "A"), ...version(wb, "B")],
    score: iaScore,
  },
  ia2: {
    system: () => IA2,
    content: (wa, wb) => [dataOf(wa), ...version(wa, "A"), ...version(wb, "B")],
    score: iaScore,
  },
  ia2s: {
    system: () => IA2S,
    content: bySection,
    score: iaScore,
  },
  ia3s: {
    system: () => IA3S,
    content: bySection,
    score: iaScore,
  },
  ia4s: {
    system: () => IA4S,
    content: bySection,
    score: iaScore,
  },
  ia4v: {
    system: () => IA4V,
    content: bySection,
    score: iaScore,
  },
  ia5: {
    system: () => IA5S,
    content: bySection,
    score: iaScore,
  },
  ia2p: {
    system: () => IA2P,
    content: (wa, wb) => bySection(wa, wb, { sbs: true }),
    score: iaScore,
  },
  ia2g: {
    system: () => IA2G,
    content: bySection,
    score: gradedScore,
    samples: 3,
  },
}
