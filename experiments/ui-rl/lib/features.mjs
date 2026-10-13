// 交互流程挖掘的报告数据:数据特征和校验。
//
// features(d)  程序从报告数据算出的数据特征(训练时经验的条件只能用这些项)
// describe(f)  数据特征写成一句话
// check(d, spec)  校验一份报告数据,返回问题列表(空 = 通过);spec 是生成时的规格,原有数据不传
// assemble(raw)  模型写的原始内容 → 完整报告数据:补步骤编号、截图路径、产品汇总、核心指标(和 ui-loop/skills/make_data.py 的 flow() 一样)

export function features(d) {
  const steps = d.chains.map((c) => c.steps.length)
  const all = d.chains.flatMap((c) => c.steps)
  return {
    products: d.chains.length,
    steps,
    screens: all.length,
    noteRatio: Math.round((100 * all.filter((s) => s.note).length) / all.length) / 100,
    issues: d.issues.length,
    suggestions: d.suggestions.length,
    stages: Boolean(d.stages?.length),
    patterns: Boolean(d.patterns?.length),
    summaryChars: [...d.summary].length,
  }
}

export const describe = (f) =>
  `${f.products} 个产品,每个产品的步骤数 ${f.steps.join(" / ")}(共 ${f.screens} 屏),${Math.round(f.noteRatio * 100)}% 的步骤有备注,` +
  `${f.issues} 个问题,${f.suggestions} 条建议,${f.stages ? "有" : "没有"}阶段对比,${f.patterns ? "有" : "没有"}共性做法,摘要 ${f.summaryChars} 字`

// 真实产品名:报告里的产品都要是虚构的
const REAL = ["微信", "支付宝", "淘宝", "天猫", "京东", "美团", "饿了么", "携程", "飞猪", "去哪儿", "滴滴", "拼多多", "抖音", "快手", "小红书", "闲鱼", "转转", "高德", "百度",
  "钉钉", "飞书", "企业微信", "顺丰", "中通", "圆通", "韵达", "菜鸟", "爱奇艺", "优酷", "腾讯视频", "芒果TV", "哔哩哔哩", "B站", "猫眼", "淘票票", "哈啰", "青桔", "Keep", "超级猿",
  "招商银行", "工商银行", "建设银行", "农业银行", "中国银行", "交通银行", "平安", "浦发", "中信", "民生", "兴业", "微众", "网商银行", "12306", "好大夫", "微医", "丁香", "京东健康",
  "阿里健康", "链家", "贝壳", "58同城", "安居客", "自如", "华住", "如家", "汉庭", "亚朵", "神州租车", "一嗨", "小米", "天猫精灵", "小度", "华为", "苹果", "Apple", "Google"]

const SEVERITY = new Set(["高", "中", "低"])
const str = (x) => typeof x === "string" && x.trim().length > 0

export function check(d, spec) {
  const e = []
  const need = (cond, msg) => { if (!cond) e.push(msg) }
  for (const k of ["title", "task", "scope", "date", "summary"]) need(str(d[k]), `${k} 缺失或为空`)
  need(Array.isArray(d.chains) && d.chains.length >= 2, "chains 至少要有 2 个产品")
  need(Array.isArray(d.issues) && d.issues.length >= 1, "issues 至少 1 个")
  need(Array.isArray(d.suggestions) && d.suggestions.length >= 1, "suggestions 至少 1 条")
  if (e.length) return e

  need(d.title.startsWith("交互流程挖掘 · "), "title 要以「交互流程挖掘 · 」开头")
  need(/^2026-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(d.date), "date 要是 2026-MM-DD")
  const names = d.chains.map((c) => c.product)
  need(new Set(names).size === names.length, "产品名有重复")
  const len = Object.fromEntries(d.chains.map((c) => [c.product, c.steps?.length ?? 0]))
  const scopeN = d.scope.match(/(\d+)\s*款/)
  need(!scopeN || Number(scopeN[1]) === names.length, `scope 写 ${scopeN?.[1]} 款,实际 ${names.length} 个产品`)
  for (const n of names) for (const r of REAL) if (n.includes(r)) e.push(`产品名「${n}」用了真实产品名「${r}」,要虚构`)

  for (const c of d.chains) {
    need(str(c.product) && str(c.version) && str(c.verdict), `产品 ${c.product}:product、version、verdict 都要有`)
    need(Array.isArray(c.steps) && c.steps.length >= 2, `产品 ${c.product}:至少 2 步`)
    for (const [i, s] of (c.steps ?? []).entries()) {
      const at = `${c.product} 第 ${i + 1} 步`
      need(str(s.screen) && str(s.content) && str(s.action), `${at}:screen、content、action 都要有`)
      need(Number.isInteger(s.inputs) && s.inputs >= 0, `${at}:inputs 要是非负整数`)
      need(typeof s.note === "string", `${at}:note 要是字符串(没有备注写空字符串)`)
    }
  }

  // 问题:编号连续,指向真实的产品和步骤;具体产品的问题,那一步的备注要写到这个问题
  d.issues.forEach((x, i) => {
    const at = `问题 ${x.id ?? i + 1}`
    need(x.id === `P${i + 1}`, `${at}:编号要按顺序是 P${i + 1}`)
    need(str(x.title) && str(x.evidence), `${at}:title、evidence 都要有`)
    need(SEVERITY.has(x.severity), `${at}:severity 只能是 高 / 中 / 低`)
    if (x.product === "全部") need(Number.isInteger(x.step) && x.step >= 1 && x.step <= Math.min(...Object.values(len)), `${at}:「全部」的 step 要在每个产品的步骤数以内`)
    else if (!(x.product in len)) e.push(`${at}:产品「${x.product}」不在 chains 里`)
    else {
      need(Number.isInteger(x.step) && x.step >= 1 && x.step <= len[x.product], `${at}:${x.product} 只有 ${len[x.product]} 步,step ${x.step} 不存在`)
      const st = d.chains.find((c) => c.product === x.product).steps[x.step - 1]
      need(!st || str(st.note), `${at}:${x.product} 第 ${x.step} 步的 note 是空的,要写出这个问题的现象`)
    }
  })

  // 建议:编号连续,依据都能对上
  const ids = new Set(d.issues.map((x) => x.id))
  d.suggestions.forEach((x, i) => {
    const at = `建议 ${x.id ?? i + 1}`
    need(x.id === `A${i + 1}`, `${at}:编号要按顺序是 A${i + 1}`)
    need(str(x.title) && typeof x.detail === "string", `${at}:title 要有,detail 要是字符串`)
    need(Array.isArray(x.basis) && x.basis.length > 0, `${at}:basis 至少一项`)
    for (const b of x.basis ?? []) {
      if (/^P\d+$/.test(b)) { need(ids.has(b), `${at}:依据 ${b} 不存在`); continue }
      const m = String(b).match(/^(.+?)第\s*([\d、,和 ]+?)\s*步$/)
      if (!m) { e.push(`${at}:依据「${b}」要写成问题编号(如 P1)或「产品名第 N 步」`); continue }
      if (!(m[1] in len)) { e.push(`${at}:依据「${b}」里的产品不在 chains 里`); continue }
      for (const n of m[2].split(/[、,和 ]+/).filter(Boolean).map(Number)) need(n >= 1 && n <= len[m[1]], `${at}:依据「${b}」:${m[1]} 没有第 ${n} 步`)
    }
  })

  if (d.stages) for (const [i, r] of d.stages.entries()) {
    need(str(r.stage), `阶段对比第 ${i + 1} 行:stage 要有`)
    const keys = Object.keys(r).filter((k) => k !== "stage")
    need(keys.length === names.length && names.every((n) => str(r[n])), `阶段对比「${r.stage}」:要有且只有每个产品各一列(${names.join("、")}),每列都要填`)
  }
  if (d.patterns) for (const p of d.patterns) {
    need(str(p.name) && str(p.comment) && Array.isArray(p.products) && p.products.length > 0, `共性做法「${p.name}」:name、products、comment 都要有`)
    for (const n of p.products ?? []) need(names.includes(n), `共性做法「${p.name}」:产品「${n}」不在 chains 里`)
  }

  // 摘要里的「N 步」「A 到 B 步」要和链路对得上(「第 N 步」不算)
  const counts = Object.values(len), lo = Math.min(...counts), hi = Math.max(...counts)
  for (const m of d.summary.matchAll(/(\d+)\s*(?:到|至|-|—|~)\s*(\d+)\s*步/g))
    need(Number(m[1]) === lo && Number(m[2]) === hi, `摘要写「${m[0]}」,实际步骤数最少 ${lo}、最多 ${hi}`)
  const rest = d.summary.replace(/(\d+)\s*(?:到|至|-|—|~)\s*(\d+)\s*步/g, "")
  for (const m of rest.matchAll(/(第\s*)?(\d+)\s*步/g))
    if (!m[1]) need(counts.includes(Number(m[2])), `摘要写「${m[0]}」,但没有哪个产品是 ${m[2]} 步(各产品:${counts.join("、")})`)

  if (spec) {
    const f = features(d)
    need(f.products === spec.products, `产品要 ${spec.products} 个,现在 ${f.products} 个`)
    for (const c of d.chains) need(c.steps.length >= spec.steps[0] && c.steps.length <= spec.steps[1], `${c.product} 有 ${c.steps.length} 步,要在 ${spec.steps[0]}–${spec.steps[1]} 步之间`)
    need(new Set(f.steps).size > 1 || f.products === 1, "各产品的步骤数要有差别,不能全一样")
    need(f.issues === spec.issues, `问题要 ${spec.issues} 个,现在 ${f.issues} 个`)
    need(f.suggestions === spec.suggestions, `建议要 ${spec.suggestions} 条,现在 ${f.suggestions} 条`)
    need(f.stages === spec.stages, spec.stages ? "要有 stages(阶段对比)" : "不要 stages")
    need(f.patterns === spec.patterns, spec.patterns ? "要有 patterns(共性做法)" : "不要 patterns")
    const [nl, nh] = NOTES[spec.notes]
    need(f.noteRatio >= nl && f.noteRatio <= nh, `有备注的步骤占 ${Math.round(f.noteRatio * 100)}%,要在 ${nl * 100}%–${nh * 100}% 之间`)
    const [sl, sh] = SUMMARY[spec.text]
    need(f.summaryChars >= sl && f.summaryChars <= sh, `摘要 ${f.summaryChars} 字,要在 ${sl}–${sh} 字之间`)
  }
  return e
}

// 规格里「备注多少」「文字详略」对应的范围
export const NOTES = { 少: [0, 0.25], 中: [0.3, 0.6], 多: [0.7, 1] }
export const SUMMARY = { 简短: [40, 80], 适中: [80, 140], 详细: [150, 240] }

export function assemble(raw) {
  const chains = raw.chains.map((c, pi) => ({
    product: c.product, version: c.version, verdict: c.verdict,
    steps: c.steps.map((s, i) => ({ no: i + 1, screen: s.screen, content: s.content, action: s.action, inputs: s.inputs, note: s.note, image: `assets/p${pi + 1}-${String(i + 1).padStart(2, "0")}.png` })),
  }))
  const products = chains.map((c) => ({ name: c.product, steps: c.steps.length, inputs: c.steps.reduce((a, s) => a + s.inputs, 0), verdict: c.verdict }))
  const fewest = products.reduce((a, b) => (b.steps < a.steps ? b : a))
  const d = {
    title: raw.title, task: raw.task, scope: raw.scope, date: raw.date, summary: raw.summary,
    kpis: [
      { key: "products", label: "对比产品", value: chains.length, unit: "个" },
      { key: "screens", label: "分析截图", value: products.reduce((a, p) => a + p.steps, 0), unit: "张" },
      { key: "fewest", label: `步骤最少(${fewest.name})`, value: fewest.steps, unit: "步" },
      { key: "issues", label: "发现问题", value: raw.issues.length, unit: "个" },
    ],
    products, chains,
  }
  if (raw.stages?.length) d.stages = raw.stages
  if (raw.patterns?.length) d.patterns = raw.patterns
  d.issues = raw.issues
  d.suggestions = raw.suggestions
  return d
}
