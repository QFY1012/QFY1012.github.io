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

// 结论数字(步骤最少)放首位,只放大这一处
const kpiOrder = ["fewest", "products", "screens", "issues"]
const kpis = kpiOrder.map((key) => data.kpis.find((kpi) => kpi.key === key)!)

const productRows = data.products.map((product) => ({
  product: product.name,
  steps: product.steps,
  inputs: product.inputs,
  verdict: product.verdict,
}))

const issueRows = data.issues.map((issue) => ({
  id: issue.id,
  product: issue.product,
  step: `第 ${issue.step} 步`,
  title: issue.title,
  evidence: issue.evidence,
  severity: issue.severity,
}))

const suggestionItems = data.suggestions.map((suggestion) => ({
  title: `${suggestion.id} · ${suggestion.title}`,
  description: `${suggestion.detail};依据:${suggestion.basis.join("、")}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["企业网盘", "2026 年 9 月"]}>
      <Section title="结论" description="外链分享流程的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section
        title="核心指标"
        description="产品数、截图量、步数与问题数"
        className="gap-12"
      >
        <Grid cols={12} fields={false} className="items-baseline">
          {kpis.map((kpi, index) => (
            <Stat
              key={kpi.key}
              span={3}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              size={index === 0 ? "lg" : undefined}
            />
          ))}
        </Grid>
        <Group title="产品对照">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
              { key: "inputs", label: "输入项", align: "right", span: 1 },
              { key: "verdict", label: "结论", span: 4 },
            ]}
            rows={productRows}
          />
        </Group>
      </Section>

      <Section
        title="链路明细"
        description="每款产品从发起到发送的步骤;图高统一,可横向滚动"
        className="gap-12"
      >
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
                  </FigureText>
                  {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题" description="严重度从低到高排列,最高一级标红">
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
          caption="编号与下一步建议的依据一一对应;3 个问题均在云盒"
        />
      </Section>

      <Section title="下一步" description="依据对回问题编号与产品步骤">
        <List ordered items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="任务、范围与日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}