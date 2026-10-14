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

const productColumns = [
  { key: "name", label: "产品", span: 3 },
  { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
  { key: "inputs", label: "首次填写项", align: "right", span: 2, bar: true },
  { key: "verdict", label: "结论", span: 2 },
]

const stageColumns = [
  { key: "stage", label: "阶段", span: 3 },
  { key: "安沁医院", label: "安沁医院", span: 2 },
  { key: "望山医院", label: "望山医院", span: 2 },
  { key: "澄心医院", label: "澄心医院", span: 2 },
]

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "product", label: "产品", span: 2 },
  { key: "stepLabel", label: "步骤", align: "right", span: 1 },
  { key: "title", label: "问题", span: 2 },
  { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
  { key: "evidence", label: "证据", span: 2 },
]

export default function Report() {
  const issues = data.issues.map((it) => ({ ...it, stepLabel: `第 ${it.step} 步` }))
  return (
    <Page title={data.title} meta={[data.scope, data.date]}>
      <Section title="结论" description={data.task}>
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比范围与这次走查的产出">
        <Grid cols={12} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat key={k.key} span={3} value={k.value} unit={k.unit} label={k.label} size="lg" captionBelow />
          ))}
        </Grid>
      </Section>

      <Section title="拆分" description="按产品、按阶段对比三家的做法" className="gap-12">
        <Group title="分产品">
          <DataTable columns={productColumns} rows={data.products} />
        </Group>
        <Group title="分阶段">
          <DataTable columns={stageColumns} rows={data.stages} />
        </Group>
      </Section>

      <Section title="流程明细" description="每款产品从首页到预约成功的每一步,一行内可横向滚动" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                  <FigureLabel>
                    第 {step.no} 步 · {step.screen}
                  </FigureLabel>
                  <FigureText>{step.content}</FigureText>
                  <FigureText>
                    {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题清单" description="按产品与步骤分列,严重度从低到高">
        <DataTable columns={issueColumns} rows={issues} />
      </Section>

      <Section title="下一步" description="按优先级排列的改动建议">
        <List
          ordered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} 依据:${s.basis.join("、")}`,
            meta: s.id,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            { label: "产品与版本", value: data.chains.map((c) => `${c.product} ${c.version}`).join("、") },
          ]}
        />
      </Section>
    </Page>
  )
}