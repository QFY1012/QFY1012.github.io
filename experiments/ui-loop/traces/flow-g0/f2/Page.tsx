import data from "./data.json"
import { Page, Section, Grid, Block, Text, Stat, DataTable, List, KV } from "@/components/report"

const mainKpi = data.kpis.find((k) => k.key === "fewest")
const restKpis = data.kpis.filter((k) => k.key !== "fewest")

const productRows = data.chains.map((c) => ({
  name: `${c.product} ${c.version}`,
  steps: c.steps.length,
  verdict: c.verdict,
}))

const productColumns = [
  { key: "name", label: "产品", span: 3 },
  { key: "steps", label: "步骤数", span: 2, align: "right" as const },
  { key: "verdict", label: "判断", span: 4 },
]

const stepColumns = [
  { key: "no", label: "步", span: 1, align: "right" as const },
  { key: "screen", label: "页面", span: 2 },
  { key: "content", label: "内容", span: 2 },
  { key: "action", label: "操作", span: 2 },
  { key: "note", label: "备注", span: 2 },
]

const issueItems = data.issues.map((it) => ({
  title: it.title,
  description: `${it.product} 第 ${it.step} 步 · ${it.evidence}`,
  meta: it.severity,
}))

const suggestionItems = data.suggestions.map((s) => ({
  title: s.title,
  description: s.detail,
}))

const basisItems = data.suggestions.map((s) => ({
  label: `${s.id} 依据`,
  value: s.basis.join("、"),
}))

const backgroundItems = [
  { label: "分析任务", value: data.task },
  { label: "对比产品", value: data.chains.map((c) => `${c.product} ${c.version}`).join("、") },
  { label: "版本范围", value: data.scope },
  { label: "报告日期", value: data.date },
]

export default function Report() {
  return (
    <Page title={data.title} meta={["快送 · 小橙 外卖 App", "2026 年 9 月"]}>
      <Section title="结论" description="对比范围:快送 11.2 与 小橙 8.9">
        <Text span={9} className="text-2xl leading-9 font-light">
          {data.summary}
        </Text>
      </Section>

      <Section title="核心指标" description="本次流程走查的规模">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={mainKpi.value}
            unit={mainKpi.unit}
            label={mainKpi.label}
            captionBelow
            size="lg"
          />
          {restKpis.map((k) => (
            <Stat key={k.key} span={3} value={k.value} unit={k.unit} label={k.label} captionBelow />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="步骤数与整体判断">
        <DataTable columns={productColumns} rows={productRows} />
      </Section>

      <Section title="链路明细" description="每步的页面、内容与操作" className="gap-12">
        {data.chains.map((c) => (
          <Grid cols={9} fields={false} key={c.product}>
            <Block span={9} title={`${c.product} ${c.version}`} description={c.verdict}>
              <DataTable columns={stepColumns} rows={c.steps} />
            </Block>
          </Grid>
        ))}
      </Section>

      <Section title="发现问题" description={`${data.issues.length} 个问题,按严重程度列出`}>
        <List columns={3} metaTone="destructive" items={issueItems} />
      </Section>

      <Section title="下一步" description={`${data.suggestions.length} 条建议与依据`}>
        <Grid cols={9} fields={false}>
          <List span={6} ordered divided={false} items={suggestionItems} />
          <KV span={3} labelCols={1} items={basisItems} />
        </Grid>
      </Section>

      <Section title="背景信息" description="任务、样本与版本">
        <KV labelCols={2} items={backgroundItems} />
      </Section>
    </Page>
  )
}
