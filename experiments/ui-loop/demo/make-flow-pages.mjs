// Mock iteration demo for the 交互流程挖掘 Skill: writes one Page.tsx per page version (made with
// the component library, data from skills/flow/data/f2.json) and renders each with scripts/shoot.mjs.
// g0 is rendered with the component library as it was before k3 (the component round), the rest with
// the current library. Then measures where each section sits, so the demo page can mark the change.
//
//   node demo/make-flow-pages.mjs
import fs from "node:fs"
import path from "node:path"
import http from "node:http"
import { execFileSync } from "node:child_process"
import { chromium } from "playwright-core"

const ROOT = path.resolve(import.meta.dirname, "..")
const OUT = path.join(ROOT, "demo", "flow-pages")
const g0 = { k: 0, kpi: "row3", sugg: "cols3", notes: "mixed", concl: "long", issues: "six" }
const V = { g0 }
V.g1 = { ...V.g0, k: 1 }
V.g2 = { ...V.g1, kpi: "row4" }
V.c3 = { ...V.g2, sugg: "table" }
V.g3 = { ...V.g2, sugg: "fit" }
V.c5 = { ...V.g3, notes: "dropped" }
V.g4 = { ...V.g3, notes: "fixed" }
V.c7 = { ...V.g4, concl: "stat" }
V.g5 = { ...V.g4, concl: "split" }
V.c9 = { ...V.g5, issues: "list" }
V.g6 = { ...V.g5, issues: "four" }

function page(v) {
  const concl = {
    long: `      <Section title="结论" description="两款 App 下单链路的核心差别">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>`,
    stat: `      <Section title="结论" description="两款 App 下单链路的核心差别">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat span={3} size="lg" value="少 1 屏" label="小橙比快送" captionBelow />
          <Text span={6}>{data.summary}</Text>
        </Grid>
      </Section>`,
    split: `      <Section title="结论" description="两款 App 下单链路的核心差别" className="gap-6">
        <Text className="text-2xl leading-9 font-light">{data.summary.split(":")[0] + ":"}</Text>
        <Text>{data.summary.split(":").slice(1).join(":")}</Text>
      </Section>`,
  }[v.concl]
  const kpiSpan = v.kpi === "row4" ? 2 : 3
  const note = {
    mixed: `                  {step.note ? <FigureLabel>{step.note}</FigureLabel> : null}\n`,
    dropped: "",
    fixed: `                  <FigureLabel>{step.note ? \`问题:\${step.note}\` : "问题:无"}</FigureLabel>\n`,
  }[v.notes]
  const figures = `<FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={\`\${chain.product} 第 \${step.no} 步:\${step.screen}\`} />
                  <FigureLabel>
                    第 {step.no} 步 · {step.screen}
                  </FigureLabel>
                  <FigureText>
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
${note}                </Figure>
              ))}
            </FigureStrip>`
  // Before the component round there is no Rule: each chain is a Group with a long bold title.
  const chains = v.k
    ? `      <Section title="链路明细" description="从购物车到支付成功的逐步截图" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={\`\${chain.product} · \${chain.version} · \${chain.verdict}\`} />
            ${figures}
          </Group>
        ))}
      </Section>`
    : `      <Section title="链路明细" description="从购物车到支付成功的逐步截图">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={\`\${chain.product} · \${chain.version} · \${chain.verdict}\`}>
            ${figures}
          </Group>
        ))}
      </Section>`
  const issues = {
    six: `        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1, align: "right" },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues}
        />`,
    list: `        <List
          numbered
          items={data.issues.map((i) => ({ title: \`\${i.id} · \${i.title}\`, description: \`\${i.product} 第 \${i.step} 步 · 严重度 \${i.severity} · \${i.evidence}\` }))}
        />`,
    four: `        <DataTable
          columns={[
            { key: "title", label: "问题", span: 3 },
            { key: "where", label: "位置", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues.map((i) => ({ title: \`\${i.id} · \${i.title}\`, where: \`\${i.product} · 第 \${i.step} 步\`, severity: i.severity, evidence: i.evidence }))}
        />`,
  }[v.issues]
  const sugg = {
    cols3: `        <List
          columns={3}
          numbered
          items={data.suggestions.map((s) => ({ title: s.title, description: \`\${s.detail} · 依据:\${s.basis.join("、")}\` }))}
        />`,
    fit: `        <List
          columns={Math.min(3, data.suggestions.length)}
          numbered
          items={data.suggestions.map((s) => ({ title: s.title, description: \`\${s.detail} · 依据:\${s.basis.join("、")}\` }))}
        />`,
    table: `        <DataTable
          columns={[
            { key: "title", label: "建议", span: 2 },
            { key: "detail", label: "做法", span: 4 },
            { key: "basis", label: "依据", span: 3 },
          ]}
          rows={data.suggestions.map((s) => ({ title: s.title, detail: s.detail, basis: s.basis.join("、") }))}
        />`,
  }[v.sugg]
  return `import data from "./data.json"
import { Page, Section, Group, Grid, Text, Stat, DataTable, List, KV, ${v.k ? "Rule, " : ""}FigureStrip, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"

export default function Report() {
  const productRows = data.chains.map((chain) => ({ name: chain.product, version: chain.version, steps: chain.steps.length, verdict: chain.verdict }))

  return (
    <Page title={data.title} meta={["快送 11.2 · 小橙 8.9", "2026 年 9 月"]}>
${concl}

      <Section title="核心指标" description="本次挖掘的样本与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat key={kpi.key} span={${kpiSpan}} size="lg" value={kpi.value} unit={kpi.unit} label={kpi.label} captionBelow />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="按产品看步骤数与链路判断">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "version", label: "版本", span: 1 },
            { key: "steps", label: "步骤数", span: 2, align: "right", bar: true },
            { key: "verdict", label: "链路判断", span: 4 },
          ]}
          rows={productRows}
        />
      </Section>

${chains}

      <Section title="问题" description="链路中发现的可用性问题">
${issues}
      </Section>

      <Section title="下一步" description="基于对比与问题给出的改进建议">
${sugg}
      </Section>

      <Section title="背景" description="任务、范围与版本信息">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            { label: "版本", value: "快送 11.2 · 小橙 8.9" },
          ]}
        />
      </Section>
    </Page>
  )
}
`
}

// The component library before k3, for g0.
const PREK = path.join(OUT, "_app-before-k3")
if (!fs.existsSync(path.join(PREK, "index.html"))) {
  console.log("取出 k3 之前的组件库(d269e01 的上一版)")
  fs.mkdirSync(PREK, { recursive: true })
  const tar = execFileSync("git", ["archive", "d269e01^", "app"], { cwd: ROOT, maxBuffer: 1 << 28 })
  execFileSync("tar", ["-x", "--strip-components=1", "-C", PREK], { input: tar })
}

const boxes = {}
for (const [name, v] of Object.entries(V)) {
  const ws = path.join(OUT, name)
  fs.mkdirSync(ws, { recursive: true })
  fs.writeFileSync(path.join(ws, "Page.tsx"), page(v))
  fs.copyFileSync(path.join(ROOT, "skills", "flow", "data", "f2.json"), path.join(ws, "data.json"))
  fs.cpSync(path.join(ROOT, "traces", "flow-g0", "f2", "assets"), path.join(ws, "assets"), { recursive: true })
  fs.writeFileSync(path.join(ws, "tsconfig.json"), JSON.stringify({ compilerOptions: { jsx: "react-jsx", resolveJsonModule: true } }))
  if (!v.k && !fs.existsSync(path.join(ws, "app"))) fs.symlinkSync(PREK, path.join(ws, "app"))
  console.log(`── 渲染 ${name}${v.k ? "" : "(k3 之前的组件)"}`)
  execFileSync("node", [path.join(ROOT, "scripts", "shoot.mjs"), ws], { stdio: "inherit", cwd: ROOT })
  boxes[name] = await measure(path.join(ws, ".build"))
  console.log(`   ${name}:页高 ${boxes[name].height}px,${Object.keys(boxes[name].sections).length} 节`)
}
fs.writeFileSync(path.join(OUT, "boxes.json"), JSON.stringify(boxes, null, 1))
console.log(`写好 ${Object.keys(V).length} 版页面,截图和节的位置在 ${path.relative(ROOT, OUT)}`)

// Where each section sits in shot.png (same clip as shoot.mjs: 1248px wide from x=48).
async function measure(dir) {
  const MIME = { ".png": "image/png", ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json" }
  const server = http.createServer((req, res) => {
    const p = path.join(dir, decodeURIComponent(new URL(req.url, "http://x").pathname))
    if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return res.writeHead(404).end()
    res.writeHead(200, { "content-type": MIME[path.extname(p)] ?? "application/octet-stream" })
    fs.createReadStream(p).pipe(res)
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`)
    await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 30000 })
    return await page.evaluate(() => {
      const x0 = (1440 - 1152) / 2 - 48
      const sections = {}
      for (const s of document.querySelectorAll("[data-slot=section]")) {
        const r = s.getBoundingClientRect(), t = s.querySelector("h2")?.textContent ?? ""
        sections[t] = { x: r.left - x0 + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height }
      }
      return { width: 1248, height: Math.ceil(document.documentElement.scrollHeight), sections }
    })
  } finally {
    await browser.close()
    server.close()
  }
}
