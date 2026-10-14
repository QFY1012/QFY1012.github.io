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

// E1: the four core metrics stay on one row — the conclusion figure first at the
// large size, the sample size (analysis screenshots) last, so no item drops to a
// second row. The four spans add up to the 9 content columns.
const KPI_ORDER = ["fewest", "products", "issues", "screens"]
const kpi = (key: string) => data.kpis.find((k) => k.key === key)!

export default function Report() {
  return (
    <Page title={data.title} meta={["企业网盘 · 外链分享", "2026 年 9 月版本"]}>
      <Section title="结论" description={data.task}>
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比规模与问题计数">
        <Grid cols={9} fields={false} className="items-baseline">
          {KPI_ORDER.map((key, i) => {
            const k = kpi(key)
            return (
              <Stat
                key={k.key}
                span={i === 0 ? 3 : 2}
                size={i === 0 ? "lg" : undefined}
                value={k.value}
                unit={k.unit}
                label={k.label}
                captionBelow
              />
            )
          })}
        </Grid>
      </Section>

      <Section title="产品对比" description="每款产品的步骤数与结论">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.products.map((p) => (
            <Stat
              key={p.name}
              span={3}
              value={p.steps}
              unit="步"
              label={p.name}
              captionBelow
              note={`输入 ${p.inputs} 项 · ${p.verdict}`}
            />
          ))}
        </Grid>
      </Section>

      <Section title="流程链路" description="一个产品一组,按步骤顺序排列" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product}>
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

      <Section title="问题" description="云盒流程中发现的问题">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues.map((it) => ({ ...it, step: `第 ${it.step} 步` }))}
        />
      </Section>

      <Section title="下一步" description="改进建议与依据">
        <List
          numbered
          columns={3}
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail}(依据:${s.basis.join("、")})`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与时间">
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
