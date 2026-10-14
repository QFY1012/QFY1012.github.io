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

const productColumns = [
  { key: "product", label: "产品", span: 2 },
  { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
  { key: "inputs", label: "输入项数", align: "right", span: 2, bar: true },
  { key: "verdict", label: "结论", span: 3 },
]

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "title", label: "问题", span: 2 },
  { key: "where", label: "位置", span: 2 },
  { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
  { key: "evidence", label: "证据", span: 3 },
]

export default function Report() {
  const { title, task, scope, date, summary, kpis, products, chains, patterns, issues, suggestions } = data

  return (
    <Page title={title} meta={[scope, date]}>
      <Section title="结论" description="三款 App 的整体判断">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="对比范围与发现总量">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              size="lg"
              value={kpi.value}
              label={kpi.label}
              unit={kpi.unit}
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="步骤数和输入项数,条越长流程越长">
        <DataTable
          columns={productColumns}
          rows={products.map((p) => ({
            product: p.name,
            steps: p.steps,
            inputs: p.inputs,
            verdict: p.verdict,
          }))}
        />
      </Section>

      <Section
        title="流程链路"
        description="一格一屏,按步骤顺序从左到右;一行放不下可横向滚动"
        className="gap-12"
      >
        {chains.map((chain) => (
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
                  <FigureText>{`${step.content} · ${step.action} · 输入 ${step.inputs} 项`}</FigureText>
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="共性规律" description="三款 App 一致的走法和各自的不同">
        <List
          numbered
          items={patterns.map((pattern) => ({
            title: pattern.name,
            description: `${pattern.comment}(覆盖 ${pattern.products.length} 款:${pattern.products.join("、")})`,
          }))}
        />
      </Section>

      <Section title="发现问题" description="按严重度排列,证据落在具体步骤上">
        <DataTable
          columns={issueColumns}
          rows={issues.map((issue) => ({
            id: issue.id,
            title: issue.title,
            where: `${issue.product} 第 ${issue.step} 步`,
            severity: issue.severity,
            evidence: issue.evidence,
          }))}
        />
      </Section>

      <Section title="下一步" description="每条建议对应上面的问题">
        <List
          numbered
          columns={3}
          items={suggestions.map((item) => ({
            title: item.title,
            description: `${item.detail}(依据 ${item.basis.join("、")})`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次对比的口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "范围", value: scope },
            { label: "产品与版本", value: chains.map((c) => `${c.product} ${c.version}`).join(" · ") },
            { label: "对比产品", value: `${kpis[0].value} ${kpis[0].unit}` },
            { label: "分析截图", value: `${kpis[1].value} ${kpis[1].unit}` },
            { label: "报告日期", value: date },
          ]}
        />
      </Section>
    </Page>
  )
}