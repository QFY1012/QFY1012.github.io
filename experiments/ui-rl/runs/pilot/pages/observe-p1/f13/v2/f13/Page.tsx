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

const productTableColumns = [
  { key: "product", label: "产品", span: 3 },
  { key: "steps", label: "步骤数", align: "right" as const, span: 2, bar: true },
  { key: "inputs", label: "输入项", align: "right" as const, span: 2, bar: true },
  { key: "verdict", label: "结论", span: 2 },
]

const stageTableColumns = [
  { key: "stage", label: "阶段", span: 3 },
  { key: "qinglan", label: "青岚单车", span: 2 },
  { key: "xunta", label: "迅踏出行", span: 2 },
  { key: "qidian", label: "骑点单车", span: 2, tone: ["199 元,扫码后弹出"] },
]

const issueTableColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "product", label: "产品", span: 2 },
  { key: "step", label: "步骤", align: "right" as const, span: 1 },
  { key: "title", label: "问题", span: 3 },
  { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
]

const kpiOrder = ["fewest", "issues", "products", "screens"]

const kpiNotes: Record<string, string> = {
  products: "青岚单车、迅踏出行、骑点单车",
  screens: "每款 3 至 5 张",
  fewest: "青岚单车、骑点单车各 5 步",
  issues: "P1 高、P2 中",
}

export default function Report() {
  const mainKpi = "fewest"
  const issueCaption = `证据:${data.issues.map((issue) => `${issue.id} ${issue.evidence}`).join("; ")}`

  return (
    <Page title={data.title} meta={["共享单车 App", "2026 年 3 月"]}>
      <Section title="结论" description="首次骑行链路的三款产品差别">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="3 款产品、13 张分析截图,步骤最少的是迅踏出行">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpiOrder.map((key) => {
            const kpi = data.kpis.find((item) => item.key === key)
            if (!kpi) return null
            return (
              <Stat
                key={kpi.key}
                span={kpi.key === mainKpi ? 3 : 2}
                size={kpi.key === mainKpi ? "lg" : undefined}
                value={kpi.value}
                unit={kpi.unit}
                label={kpi.label}
                captionBelow
                note={kpiNotes[kpi.key]}
              />
            )
          })}
        </Grid>
      </Section>

      <Section title="产品对比" description="步骤数含开锁成功页,输入项按需要用户填写的项计" className="gap-12">
        <Group title="步骤与输入项">
          <DataTable
            columns={productTableColumns}
            rows={data.products.map((product) => ({
              product: product.name,
              steps: product.steps,
              inputs: product.inputs,
              verdict: product.verdict,
            }))}
          />
        </Group>
        <Group title="流程阶段">
          <DataTable
            columns={stageTableColumns}
            rows={data.stages.map((stage) => ({
              stage: stage.stage,
              qinglan: stage["青岚单车"],
              xunta: stage["迅踏出行"],
              qidian: stage["骑点单车"],
            }))}
          />
        </Group>
      </Section>

      <Section
        title="链路明细"
        description="每款产品一组,按步骤顺序横向排列,共 13 张截图"
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
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note ? <FigureText className="mt-2">备注:{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="严重度按高、中、低三级;编号供下一步建议引用">
        <DataTable
          columns={issueTableColumns}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            product: issue.product,
            step: issue.step,
            title: issue.title,
            severity: issue.severity,
          }))}
          caption={issueCaption}
        />
      </Section>

      <Section title="下一步" description="每条建议的依据对回问题编号与参照步骤">
        <List
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: `${suggestion.id} · ${suggestion.title}`,
            description: `${suggestion.detail}(依据:${suggestion.basis.join("、")})`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本口径">
        <KV
          labelCols={2}
          items={[
            { label: "报告任务", value: data.task },
            { label: "分析范围", value: data.scope },
            { label: "报告日期", value: data.date },
            {
              label: "产品版本",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join("、"),
            },
          ]}
        />
      </Section>
    </Page>
  )
}
