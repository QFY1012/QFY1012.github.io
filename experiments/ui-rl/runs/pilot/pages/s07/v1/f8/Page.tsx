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

const kpiOrder = ["products", "fewest", "issues", "screens"]

export default function Report() {
  const kpis = kpiOrder
    .map((key) => data.kpis.find((kpi) => kpi.key === key))
    .filter((kpi): kpi is (typeof data.kpis)[number] => Boolean(kpi))

  const productRows = data.products.map((product) => ({
    product: product.name,
    steps: product.steps,
    inputs: product.inputs,
    verdict: product.verdict,
  }))

  const stageRows = data.stages.map((stage) => ({
    stage: stage.stage,
    anqin: stage["安沁医院"],
    wangshan: stage["望山医院"],
    chengxin: stage["澄心医院"],
  }))

  const issueRows = data.issues.map((issue) => ({
    id: issue.id,
    product: issue.product,
    step: issue.step,
    title: issue.title,
    evidence: issue.evidence,
    severity: issue.severity,
  }))

  const suggestionItems = data.suggestions.map((suggestion) => ({
    title: suggestion.title,
    description: `${suggestion.detail} · 依据 ${suggestion.basis.join("、")}`,
  }))

  return (
    <Page title={data.title} meta={["3 款医院 App", "2026 年 3 月"]}>
      <Section title="结论" description={data.scope}>
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与发现">
        <Grid cols={12} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              size="lg"
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="3 款 App 的步骤数、手填项数与结论">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "手填项数", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={productRows}
        />
      </Section>

      <Section title="阶段对比" description="同一任务在 6 个阶段的实现差异">
        <DataTable
          columns={[
            { key: "stage", label: "阶段", span: 3 },
            { key: "anqin", label: "安沁医院", span: 2 },
            { key: "wangshan", label: "望山医院", span: 2 },
            { key: "chengxin", label: "澄心医院", span: 2 },
          ]}
          rows={stageRows}
        />
      </Section>

      <Section title="链路明细" description="每个产品一组,按步骤横向排开">
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version}`} />
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                  />
                  <FigureLabel>
                    第 {step.no} 步 · {step.screen}
                  </FigureLabel>
                  <FigureText>
                    {step.content} · {step.action}
                    {step.inputs > 0 ? ` · 输入 ${step.inputs} 项` : ""}
                    {step.note ? ` · ${step.note}` : ""}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题清单" description="4 个问题,严重度按高、中、低标出">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
          caption="问题编号 P1–P4,与下一步建议的依据对应。"
        />
      </Section>

      <Section title="下一步" description="3 条建议,依据对回问题编号">
        <List numbered items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="任务、范围与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "对比产品", value: data.products.map((product) => product.name).join("、") },
            { label: "分析截图", value: `${data.kpis.find((kpi) => kpi.key === "screens")?.value ?? ""} 张` },
            { label: "报告日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
