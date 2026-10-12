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
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

export default function Report() {
  const backgrounds = [
    { label: "任务", value: data.task },
    { label: "范围", value: data.scope },
    { label: "日期", value: data.date },
  ]

  const productRows = data.products.map((product) => ({
    name: product.name,
    steps: String(product.steps),
    verdict: product.verdict,
  }))

  const noteRows = data.chains.flatMap((chain) =>
    chain.steps
      .filter((step) => step.note)
      .map((step) => ({
        product: chain.product,
        step: `第 ${step.no} 步`,
        note: step.note,
      })),
  )

  const issueRows = data.issues.map((issue) => ({
    id: issue.id,
    location: `${issue.product} · 第 ${issue.step} 步`,
    title: issue.title,
    severity: issue.severity,
    evidence: issue.evidence,
  }))

  return (
    <Page title={data.title} meta={["3 款企业网盘", "2026 年 9 月"]}>
      <Section title="背景信息" description="任务、范围与日期">
        <KV items={backgrounds} labelCols={2} />
      </Section>

      <Section title="结论" description="三款产品的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的规模与结果">
        <Grid cols={12} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              size="lg"
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="按完成一次外链分享的步骤数">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤", span: 2, align: "right" },
            { key: "verdict", label: "结论", span: 5 },
          ]}
          rows={productRows}
        />
      </Section>

      <Section
        title="链路明细"
        description="每款产品一组,按操作步骤从左到右排列"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
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
                    {step.inputs > 0
                      ? `${step.content} · ${step.action} · 输入 ${step.inputs} 项`
                      : `${step.content} · ${step.action}`}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
        <Group title="步骤备注">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 2 },
              { key: "step", label: "步骤", span: 2, align: "right" },
              { key: "note", label: "备注", span: 5 },
            ]}
            rows={noteRows}
          />
        </Group>
      </Section>

      <Section title="问题" description="3 个问题,按严重度排列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "location", label: "位置", span: 2 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="两条改进建议">
        <List
          columns={2}
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} · 依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>
    </Page>
  )
}
