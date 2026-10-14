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

const KPI_ORDER = ["fewest", "issues", "products", "screens"]
const KPI_SPAN: Record<string, number> = { fewest: 3, issues: 2, products: 2, screens: 2 }

export default function Report() {
  const { title, task, scope, date, summary, kpis, products, chains, patterns, issues, suggestions } = data

  const kpi = (key: string) => kpis.find((k) => k.key === key)!
  const orderedKpis = KPI_ORDER.map(kpi)

  const productRows = products.map((p) => ({
    product: p.name,
    steps: p.steps,
    inputs: p.inputs,
    verdict: p.verdict,
  }))

  const issueRows = issues.map((i) => ({
    id: i.id,
    product: i.product,
    step: `第 ${i.step} 步`,
    title: i.title,
    evidence: i.evidence,
    severity: i.severity,
  }))

  const patternItems = patterns.map((p) => ({
    title: p.name,
    description: `${p.comment}(出现于:${p.products.join("、")})`,
  }))

  const suggestionItems = suggestions.map((s) => ({
    title: s.title,
    description: `${s.detail} 依据:${s.basis.join("、")}`,
  }))

  return (
    <Page
      title={title}
      meta={["星幕视频 · 橙果视频", "2026 年 6 月版本", `走查日期 ${date}`]}
    >
      <Section title="结论" description="两款 App 关闭自动续费的链路对比">
        <Text className="text-2xl leading-9 font-light" span={9}>
          {summary}
        </Text>
      </Section>

      <Section title="核心指标" description="本次走查的口径与规模,步骤数按完整关闭链路统计">
        <Grid cols={9} fields={false} className="items-baseline">
          {orderedKpis.map((k, idx) => (
            <Stat
              key={k.key}
              span={KPI_SPAN[k.key]}
              captionBelow
              size={idx === 0 ? "lg" : undefined}
              value={k.value}
              unit={k.unit}
              label={k.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="两款 App 的步骤数、输入项与总体判断">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 1 },
            { key: "verdict", label: "结论", span: 4 },
          ]}
          rows={productRows}
          caption="步骤数含确认页与结果页;输入项指关闭过程中需要用户填写的字段数"
        />
      </Section>

      <Section title="共性规律" description="两款 App 在取消链路上共同出现的设计">
        <List numbered items={patternItems} />
      </Section>

      <Section
        title="链路明细"
        description="按操作顺序逐屏截图,每格为一屏;输入项指该步需要用户填写的字段数"
      >
        <Group>
          {chains.map((chain) => (
            <Group key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version} · ${chain.verdict}`} />
              <FigureStrip>
                {chain.steps.map((step) => (
                  <Figure key={step.no}>
                    <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                    <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                    <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
                    {step.note ? <FigureText>{step.note}</FigureText> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="问题明细" description="严重度按对「尽快关闭自动续费」这一目标的影响划分">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 3 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="每条建议的依据来自问题明细的编号">
        <List numbered items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="样本、版本与走查安排">
        <KV
          labelCols={2}
          items={[
            { label: "走查任务", value: task },
            { label: "产品与版本", value: chains.map((c) => `${c.product} ${c.version}`).join("、") },
            { label: "版本周期", value: scope },
            { label: "走查日期", value: date },
            { label: "样本量", value: `${kpi("screens").value} 张分析截图,共 ${kpi("products").value} 款产品` },
            { label: "关闭步骤", value: products.map((p) => `${p.name} ${p.steps} 步`).join("、") },
          ]}
        />
      </Section>
    </Page>
  )
}
