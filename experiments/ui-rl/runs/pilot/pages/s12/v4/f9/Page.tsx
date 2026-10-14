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

const kpi = (key: string) => data.kpis.filter((k) => k.key === key)[0]

export default function Report() {
  const fewest = kpi("fewest")
  const products = kpi("products")
  const screens = kpi("screens")
  const issues = kpi("issues")

  const compareRows = data.products.map((p) => ({
    product: p.name,
    steps: p.steps,
    inputs: p.inputs,
    verdict: p.verdict,
  }))

  const issueRows = data.issues.map((i) => ({
    id: i.id,
    product: i.product,
    step: `第 ${i.step} 步`,
    title: i.title,
    severity: i.severity,
    evidence: i.evidence,
  }))

  return (
    <Page
      title={data.title}
      meta={["星幕视频 · 橙果视频", "2026 年 6 月版本"]}
    >
      <Section title="结论" description="两款 App 取消自动续费的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的总体口径">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={fewest.value}
            unit={fewest.unit}
            label={fewest.label}
          />
          <Stat
            span={2}
            captionBelow
            value={products.value}
            unit={products.unit}
            label={products.label}
          />
          <Stat
            span={2}
            captionBelow
            value={screens.value}
            unit={screens.unit}
            label={screens.label}
          />
          <Stat
            span={2}
            captionBelow
            value={issues.value}
            unit={issues.unit}
            label={issues.label}
          />
        </Grid>
      </Section>

      <Section
        title="链路对比"
        description="两款 App 从「我的」页到关闭成功的每一步"
        className="gap-12"
      >
        <Group title="两款产品对比">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
              { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
              { key: "verdict", label: "结论", span: 3 },
            ]}
            rows={compareRows}
          />
        </Group>

        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                  />
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
                  {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="共性模式" description="两款都出现的路径特征,以及与单款的差别">
        <List
          numbered
          items={data.patterns.map((p) => ({
            title: p.name,
            description: `${p.comment}(${p.products.length === data.products.length ? "涉及两款" : `仅 ${p.products.join("、")}`})`,
          }))}
        />
      </Section>

      <Section title="问题明细" description="3 个问题,严重度从低到高排">
        <Group title="问题清单">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "product", label: "产品", span: 1 },
              { key: "step", label: "步骤", span: 1 },
              { key: "title", label: "问题", span: 2 },
              { key: "severity", label: "严重度", span: 1, levels: ["中", "高"] },
              { key: "evidence", label: "证据", span: 3 },
            ]}
            rows={issueRows}
          />
        </Group>
      </Section>

      <Section title="下一步" description="2 条改动建议,依据对回问题编号">
        <List
          numbered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail}(依据:${s.basis.join("、")})`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与走查口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "产品版本", value: data.chains.map((c) => `${c.product} ${c.version}`).join(" · ") },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
