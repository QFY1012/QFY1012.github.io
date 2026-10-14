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
  Section,
  Stat,
  Text,
} from "@/components/report"

const kpi = (key: string) => data.kpis.find((k) => k.key === key) ?? { key, label: "", value: 0, unit: "" }

export default function Report() {
  const products = kpi("products")
  const fewest = kpi("fewest")
  const found = kpi("issues")
  const screens = kpi("screens")

  const productRows = data.products.map((p) => ({
    product: p.name,
    steps: p.steps,
    inputs: p.inputs,
    verdict: p.verdict,
  }))

  const issueRows = data.issues.map((issue) => ({
    issue: issue.title,
    where: `${issue.id} · ${issue.product} · 第 ${issue.step} 步`,
    severity: issue.severity,
    evidence: issue.evidence,
  }))

  const severityCounts = data.issues.reduce<Record<string, number>>((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] ?? 0) + 1
    return acc
  }, {})
  const severityNote = Object.entries(severityCounts)
    .map(([level, count]) => `${level} ${count} 个`)
    .join("、")

  return (
    <Page title={data.title} meta={[data.scope, data.date]}>
      <Section title="结论" description="对比两款寄件 App 的下单步骤与信息填写">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的规模与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={products.value}
            unit={products.unit}
            label={products.label}
            note={data.products.map((p) => p.name).join("、")}
          />
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={fewest.value}
            unit={fewest.unit}
            label={fewest.label}
            note={`闪兔快递 ${data.products[0].steps} 步`}
          />
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={found.value}
            unit={found.unit}
            label={found.label}
            note={severityNote}
          />
        </Grid>
      </Section>

      <Section title="产品对比" description="单位:步 / 项;输入项是用户要填写的字段数">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项数", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={productRows}
        />
      </Section>

      <Section title="流程明细" description="每款 App 从首页到预约成功,按步骤从左到右" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
            <Text>{chain.verdict}</Text>
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
      </Section>

      <Section title="发现问题" description={`共 ${data.issues.length} 个,按严重度排列`}>
        <DataTable
          columns={[
            { key: "issue", label: "问题", span: 3 },
            { key: "where", label: "位置", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="针对发现问题的改动建议与依据">
        <Grid cols={9} fields={false}>
          <List
            span={6}
            ordered
            divided={false}
            items={data.suggestions.map((s) => ({ title: s.title, description: s.detail }))}
          />
          <KV
            span={3}
            labelCols={1}
            items={[{ label: "依据", value: data.suggestions.map((s) => s.basis.join("、")).join(";") }]}
          />
        </Grid>
      </Section>

      <Section title="背景信息" description="本次走查的任务、样本与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "对比产品", value: data.chains.map((c) => `${c.product} ${c.version}`).join("、") },
            { label: "分析截图", value: `${screens.value} ${screens.unit}` },
          ]}
        />
      </Section>
    </Page>
  )
}
