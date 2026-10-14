import data from "./data.json"
import { Page, Section, Group, Grid, Text, Stat, DataTable, List, KV, Rule, FigureStrip, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"

export default function Report() {
  const kpi = (key: string) => data.kpis.find((k) => k.key === key)!
  const fewest = kpi("fewest")
  const products = kpi("products")
  const issues = kpi("issues")
  const screens = kpi("screens")

  return (
    <Page title={data.title} meta={["协同办公 App", "2026 年第三季度版本", data.date]}>
      <Section title="结论" description="同一任务在 2 款产品上的完成路径判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="步数口径为完成一次预订所需的屏数;截图来自 2 款产品 2026 年第三季度版本">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat span={3} size="lg" captionBelow value={fewest.value} unit={fewest.unit} label={fewest.label} note="协作宝 8 步" />
          <Stat span={2} captionBelow value={products.value} unit={products.unit} label={products.label} />
          <Stat span={2} captionBelow value={issues.value} unit={issues.unit} label={issues.label} />
          <Stat span={2} captionBelow value={screens.value} unit={screens.unit} label={screens.label} />
        </Grid>
      </Section>

      <Section title="阶段对比" description="按四个关键阶段对照两款产品的做法">
        <DataTable
          columns={[
            { key: "stage", label: "阶段", span: 3 },
            { key: "协作宝", label: "协作宝", span: 3 },
            { key: "链工", label: "链工", span: 3 },
          ]}
          rows={data.stages}
        />
      </Section>

      <Section title="流程链路" description="按操作顺序排列,图注为每屏的内容、操作与输入项数" className="gap-12">
        {data.chains.map((chain) => {
          const info = data.products.find((p) => p.name === chain.product)!
          return (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步 · 输入 ${info.inputs} 项 · ${chain.verdict}`} />
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>{`${step.content} · ${step.action} · 输入 ${step.inputs} 项`}</FigureText>
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
          )
        })}
      </Section>

      <Section title="问题明细" description="严重度按对完成预订的影响判定,依据为该问题的现场证据">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "依据", span: 3 },
          ]}
          rows={data.issues}
        />
      </Section>

      <Section title="下一步" description="每条建议标注依据(链路步骤或问题编号)">
        <List
          numbered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail};依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与数据日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "产品版本", value: data.chains.map((c) => `${c.product} ${c.version}`).join("、") },
            { label: "数据日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
