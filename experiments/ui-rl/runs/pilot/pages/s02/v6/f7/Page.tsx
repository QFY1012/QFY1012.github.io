import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Text,
  Stat,
  DataTable,
  List,
  KV,
  Rule,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

const kpiSpans: Record<string, number> = { products: 2, screens: 2, fewest: 3, issues: 2 }

export default function Report() {
  const { title, task, scope, date, summary, kpis, products, chains, issues, suggestions } = data

  const productNames = products.map((p) => p.name)

  const productRows = products.map((p) => ({
    name: p.name,
    steps: p.steps,
    inputs: p.inputs,
    verdict: p.verdict,
  }))

  const productColumns = [
    { key: "name", label: "产品", span: 2 },
    { key: "steps", label: "步骤数", align: "right" as const, span: 2, bar: true },
    { key: "inputs", label: "输入项", align: "right" as const, span: 2 },
    { key: "verdict", label: "判断", span: 3 },
  ]

  const issueRows = issues.map((i) => ({
    id: i.id,
    product: i.product,
    step: `第 ${i.step} 步`,
    title: i.title,
    evidence: i.evidence,
    severity: i.severity,
  }))

  const issueColumns = [
    { key: "id", label: "编号", span: 1 },
    { key: "product", label: "产品", span: 1 },
    { key: "step", label: "步骤", span: 1 },
    { key: "title", label: "问题", span: 2 },
    { key: "evidence", label: "依据", span: 3 },
    { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
  ]

  const suggestionItems = suggestions.map((s) => ({
    title: `${s.id} ${s.title}`,
    description: `${s.detail} 依据:${s.basis.join("、")}`,
  }))

  return (
    <Page title={title} meta={[task, scope]}>
      <Section title="结论" description="两家在同一任务上的流程长度与重复输入">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的对比范围与产出">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((k) => (
            <Stat
              key={k.key}
              span={kpiSpans[k.key]}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              size={k.key === "fewest" ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="步骤数与表单负担的横向对照">
        <Group title="下单到预约成功">
          <DataTable
            columns={productColumns}
            rows={productRows}
            caption="步骤数为从寄件首页到预约成功页的屏数,输入项为该流程中用户需要填写的字段数。"
          />
        </Group>
      </Section>

      <Section
        title="流程链路"
        description="每个产品一组,按步骤从左到右;备注是该步暴露的问题"
        className="gap-12"
      >
        {chains.map((chain) => (
          <Group key={chain.product}>
            <Rule
              label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步 · 输入 ${chain.steps.reduce((sum, s) => sum + s.inputs, 0)} 项`}
            />
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                  />
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>
                    {step.content} · {step.action}
                    {step.inputs > 0 ? ` · 输入 ${step.inputs} 项` : ""}
                  </FigureText>
                  {step.note ? <FigureLabel>备注:{step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="按严重度排,依据是复现出来的步骤">
        <DataTable columns={issueColumns} rows={issueRows} />
      </Section>

      <Section title="下一步" description="针对问题给出的改动建议与依据">
        <List numbered items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="走查的任务、范围与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "对比范围", value: scope },
            { label: "走查日期", value: date },
            { label: "分析截图", value: `7 张(${productNames.map((name, i) => `${name} ${chains[i].steps.length} 张`).join("、")})` },
          ]}
        />
      </Section>
    </Page>
  )
}