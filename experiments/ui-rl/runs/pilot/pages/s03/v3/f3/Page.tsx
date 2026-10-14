import data from "./data.json"
import {
  DataTable,
  Figure,
  FigureImage,
  FigureLabel,
  FigureStrip,
  FigureText,
  Grid,
  Group,
  KV,
  List,
  Page,
  Rule,
  Section,
  Stat,
  Text,
} from "@/components/report"

const { title, task, scope, date, summary, kpis, products, chains, issues, suggestions } = data

// 四项核心指标排在一行:结论数字(步骤最少)在最前并放大,样本量(产品、截图)放在末尾。
const KPI_ORDER = ["fewest", "issues", "products", "screens"]
const KPI_NOTES: Record<string, string> = {
  fewest: "云盒 4 步、方舟 5 步",
  issues: "均出现在云盒",
}

export default function Report() {
  const kpiRows = KPI_ORDER.flatMap((key) => kpis.filter((k) => k.key === key))
  const issueRows = issues.map((it) => ({ ...it, position: `${it.product} · 第 ${it.step} 步` }))

  return (
    <Page title={title} meta={[task, scope, date]}>
      <Section title="结论" description="外链分享流程的整体判断">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="计数单位:个、张、步">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpiRows.map((k, i) => (
            <Stat
              key={k.key}
              span={i === 0 ? 3 : 2}
              captionBelow
              size={i === 0 ? "lg" : undefined}
              value={k.value}
              unit={k.unit}
              label={k.label}
              note={KPI_NOTES[k.key]}
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
          caption="步骤数按产品统计;三款产品的必填输入项均为 0。"
        />
      </Section>

      <Section title="链路明细" description="每款产品一组,按步骤顺序横向排列" className="gap-12">
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

      <Section title="问题明细" description="严重度从低到高排列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "position", label: "位置", span: 2 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="两条改动建议及其依据">
        <List
          columns={2}
          numbered
          items={suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail}。依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、对比范围与日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "对比范围", value: scope },
            { label: "产品与版本", value: chains.map((c) => `${c.product} ${c.version}`).join("、") },
            { label: "报告日期", value: date },
          ]}
        />
      </Section>
    </Page>
  )
}
