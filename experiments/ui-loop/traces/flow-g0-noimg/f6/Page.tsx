import data from "./data.json"
import {
  Page,
  Section,
  Grid,
  Text,
  Stat,
  DataTable,
  List,
  KV,
} from "@/components/report"

const productColumns = [
  { key: "name", label: "产品", span: 2 },
  { key: "steps", label: "步骤数", span: 1, align: "right" as const, bar: true },
  { key: "inputs", label: "输入项", span: 1, align: "right" as const },
  { key: "verdict", label: "结论", span: 5 },
]

const productRows = data.products.map((p) => ({
  name: p.name,
  steps: p.steps,
  inputs: p.inputs,
  verdict: p.verdict,
}))

const stageColumns = [
  { key: "stage", label: "环节", span: 1 },
  { key: "云途", label: "云途", span: 2 },
  { key: "行旅", label: "行旅", span: 2 },
  { key: "飞鱼", label: "飞鱼", span: 2 },
  { key: "北极星", label: "北极星", span: 2 },
]

const stageRows = data.stages.map((s) => ({
  stage: s.stage,
  云途: s.云途,
  行旅: s.行旅,
  飞鱼: s.飞鱼,
  北极星: s.北极星,
}))

const stepColumns = [
  { key: "no", label: "步骤", span: 1, align: "right" as const },
  { key: "screen", label: "页面", span: 2 },
  { key: "content", label: "内容", span: 2 },
  { key: "action", label: "操作", span: 1 },
  { key: "inputs", label: "输入", span: 1, align: "right" as const },
  { key: "note", label: "问题", span: 2 },
]

const patternItems = data.patterns.map((p) => ({
  title: p.name,
  description: p.comment,
  meta: p.products.join("、"),
}))

const issueItems = data.issues.map((i) => ({
  title: `${i.title}(${i.id})`,
  description: `${i.product} 第 ${i.step} 步 · ${i.evidence}`,
  meta: i.severity,
}))

const suggestionItems = data.suggestions.map((s) => ({
  title: s.title,
  description: `依据:${s.basis.join("、")}`,
}))

const backgroundItems = [
  { label: "分析任务", value: data.task },
  { label: "分析范围", value: data.scope },
  {
    label: "产品版本",
    value: data.chains.map((c) => `${c.product} ${c.version}`).join("、"),
  },
  { label: "数据日期", value: data.date },
]

export default function Report() {
  return (
    <Page
      title={data.title}
      meta={["4 款出行 App", "2026 年 9 月版本", data.date]}
    >
      <Section
        title="结论"
        description="四款 App 订一张单程机票的步数与主要差异"
      >
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              size="lg"
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="产品对比"
        description="输入项是需要手动填写的字段数,步骤数含支付"
      >
        <DataTable columns={productColumns} rows={productRows} />
      </Section>

      <Section title="环节对比" description="五个关键环节上的做法差异">
        <DataTable columns={stageColumns} rows={stageRows} />
      </Section>

      <Section title="共性模式" description="四款产品中重复出现的做法">
        <List numbered items={patternItems} />
      </Section>

      <Section
        title="流程明细"
        description="每款产品从首页到支付的实际步骤"
        className="gap-12"
      >
        {data.chains.map((c) => (
          <DataTable
            key={c.product}
            columns={stepColumns}
            rows={c.steps}
            caption={`${c.product} ${c.version} · ${c.verdict}`}
          />
        ))}
      </Section>

      <Section title="问题清单" description="7 个问题,按严重程度分级">
        <List columns={3} items={issueItems} metaTone="destructive" />
      </Section>

      <Section title="下一步" description="四条改进建议及依据">
        <List columns={3} numbered items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="任务、范围与口径">
        <KV labelCols={2} items={backgroundItems} />
      </Section>
    </Page>
  )
}
