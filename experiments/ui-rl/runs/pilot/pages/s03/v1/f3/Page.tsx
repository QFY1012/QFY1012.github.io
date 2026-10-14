import data from "./data.json"
import {
  DataTable,
  Figure,
  FigureImage,
  FigureLabel,
  FigureStrip,
  FigureText,
  Group,
  Grid,
  KV,
  List,
  Page,
  Rule,
  Section,
  Stat,
  Text,
} from "@/components/report"

const { title, task, scope, date, summary, kpis, products, chains, issues, suggestions } = data

// E1: the four core figures share one row; the verdict number leads and the
// sample size (screenshots) comes last.
const KPI_ORDER = ["fewest", "issues", "products", "screens"]
const KPI_NOTES: Record<string, string> = {
  fewest: "云盒 4 步、方舟 5 步",
  issues: "均出现在云盒",
}

export default function Report() {
  const kpiRows = KPI_ORDER.flatMap((key) => kpis.filter((k) => k.key === key))
  const issueRows = issues.map((issue) => ({ ...issue, position: `${issue.product} · 第 ${issue.step} 步` }))

  return (
    <Page title={title} meta={[task, scope, date]}>
      <Section title="结论" description="外链分享流程的整体判断">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="计数单位:个、张、步">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpiRows.map((kpi, i) => (
            <Stat
              key={kpi.key}
              span={i === 0 ? 3 : 2}
              captionBelow
              size={i === 0 ? "lg" : undefined}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              note={KPI_NOTES[kpi.key]}
            />
          ))}
        </Grid>
      </Section>

      <Section title="流程对比" description="同一条任务下的步骤数与流程结论">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", span: 2, align: "right", bar: true },
            { key: "verdict", label: "流程结论", span: 5 },
          ]}
          rows={products}
          caption="三款产品的必填输入项均为 0;步骤数按单次外链分享统计。"
        />
      </Section>

      <Section title="链路明细" description="每款产品一组,按步骤顺序排列" className="gap-12">
        {chains.map((chain) => (
          <Group key={chain.product} title={chain.verdict}>
            <Rule label={`${chain.product} · ${chain.version}`} />
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
                  {step.note && <FigureText>{step.note}</FigureText>}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="严重度由低到高:低、中、高">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "position", label: "位置", span: 2 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
          caption="位置指问题出现的产品与步骤。"
        />
      </Section>

      <Section title="下一步" description="两条改动建议及其依据">
        <List
          columns={2}
          numbered
          items={suggestions.map((item) => ({
            title: item.title,
            description: `${item.detail}。依据:${item.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "对比范围", value: scope },
            { label: "产品与版本", value: chains.map((chain) => `${chain.product} ${chain.version}`).join("、") },
            { label: "报告日期", value: date },
          ]}
        />
      </Section>
    </Page>
  )
}
