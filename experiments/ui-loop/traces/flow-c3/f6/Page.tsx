import data from "./data.json"
import { Page, Section, Grid, Group, Text, Stat, DataTable, List, KV, FigureStrip, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"

const shots = import.meta.glob("./assets/*.png", { eager: true, import: "default" }) as Record<string, string>
const shot = (file: string) => shots[`./${file}`]

const stepIndex = new Map<string, { product: string; no: number; screen: string }>()
data.chains.forEach((chain) =>
  chain.steps.forEach((step) =>
    stepIndex.set(`${chain.product}#${step.no}`, { product: chain.product, no: step.no, screen: step.screen }),
  ),
)

const issueById = new Map(data.issues.map((issue) => [issue.id, issue]))

const expandBasis = (basis: string) => {
  const match = basis.match(/^(.+?)第\s*([0-9、,，\s]+)\s*步$/)
  if (match) {
    const product = match[1].trim()
    const steps = match[2]
      .split(/[、,，\s]+/)
      .filter(Boolean)
      .map((no) => stepIndex.get(`${product}#${Number(no)}`))
      .filter((step): step is { product: string; no: number; screen: string } => Boolean(step))
    if (steps.length) {
      return steps.map((step) => `${step.product} 第 ${step.no} 步 · ${step.screen}`).join(";")
    }
  }
  const issue = issueById.get(basis)
  if (issue) return `${issue.id} ${issue.title}`
  return basis
}

const chainRows = data.chains.flatMap((chain) =>
  chain.steps.map((step) => ({
    product: chain.product,
    no: step.no,
    screen: step.screen,
    content: step.content,
    action: step.action,
    note: step.note,
  })),
)

export default function Report() {
  return (
    <Page title={data.title} meta={[data.scope, data.date]}>
      <Section title="结论" description="四款 App 的流程差异集中在附加产品与乘机人填写">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的产品数、截图量与问题数">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              size={kpi.key === "fewest" ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="按步骤数从多到少排列">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤", span: 2, align: "right", bar: true },
            { key: "inputs", label: "输入项", span: 2, align: "right" },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={data.products}
        />
      </Section>

      <Section title="环节差异" description="同一环节上四款 App 的做法">
        <DataTable
          columns={[
            { key: "stage", label: "环节", span: 1 },
            { key: "云途", label: "云途", span: 2 },
            { key: "行旅", label: "行旅", span: 2 },
            { key: "飞鱼", label: "飞鱼", span: 2 },
            { key: "北极星", label: "北极星", span: 2 },
          ]}
          rows={data.stages}
        />
      </Section>

      <Section title="典型模式" description="值得复用的做法及其代价">
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: `${pattern.comment} 用于 ${pattern.products.join("、")}`,
          }))}
        />
      </Section>

      <Section title="流程明细" description="四个产品的逐屏步骤与备注">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 1 },
            { key: "no", label: "步骤", span: 1, align: "right" },
            { key: "screen", label: "页面", span: 2 },
            { key: "content", label: "内容", span: 2 },
            { key: "action", label: "操作", span: 1 },
            { key: "note", label: "备注", span: 2 },
          ]}
          rows={chainRows}
        />
      </Section>

      <Section title="步骤截图" description="按产品顺序排列的逐屏截图" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} ${chain.version} · ${chain.verdict}`}>
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={shot(step.image)} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description={`${data.issues.length} 个问题的位置、严重程度与证据`}>
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1, align: "right" },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重", span: 1, tone: ["高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={data.issues}
        />
      </Section>

      <Section title="下一步" description="四条改法,依据来自走查证据">
        <List
          columns={1}
          items={data.suggestions.map((suggestion) => ({
            title: `${suggestion.id} ${suggestion.title}`,
            description: [suggestion.detail, `依据:${suggestion.basis.map(expandBasis).join(";")}`]
              .filter(Boolean)
              .join(" "),
          }))}
        />
      </Section>

      <Section title="背景信息" description="走查范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "分析日期", value: data.date },
            { label: "截图量", value: `${data.kpis.find((kpi) => kpi.key === "screens")?.value ?? ""} 张` },
            {
              label: "产品版本",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join(" · "),
            },
          ]}
        />
      </Section>
    </Page>
  )
}
