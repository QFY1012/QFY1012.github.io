import data from "./data.json"
import { Page, Section, Group, Grid, Text, Stat, DataTable, List, KV, Rule, FigureStrip, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"

export default function Report() {
  const productRows = data.chains.map((chain) => ({ name: chain.product, version: chain.version, steps: chain.steps.length, verdict: chain.verdict }))

  return (
    <Page title={data.title} meta={["快送 11.2 · 小橙 8.9", "2026 年 9 月"]}>
      <Section title="结论" description="两款 App 下单链路的核心差别">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次挖掘的样本与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat key={kpi.key} span={2} size="lg" value={kpi.value} unit={kpi.unit} label={kpi.label} captionBelow />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="按产品看步骤数与链路判断">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "version", label: "版本", span: 1 },
            { key: "steps", label: "步骤数", span: 2, align: "right", bar: true },
            { key: "verdict", label: "链路判断", span: 4 },
          ]}
          rows={productRows}
        />
      </Section>

      <Section title="链路明细" description="从购物车到支付成功的逐步截图" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version} · ${chain.verdict}`} />
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                  <FigureLabel>
                    第 {step.no} 步 · {step.screen}
                  </FigureLabel>
                  <FigureText>
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note ? <FigureLabel>{step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题" description="链路中发现的可用性问题">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1, align: "right" },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues}
        />
      </Section>

      <Section title="下一步" description="基于对比与问题给出的改进建议">
        <List
          columns={Math.min(3, data.suggestions.length)}
          numbered
          items={data.suggestions.map((s) => ({ title: s.title, description: `${s.detail} · 依据:${s.basis.join("、")}` }))}
        />
      </Section>

      <Section title="背景" description="任务、范围与版本信息">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            { label: "版本", value: "快送 11.2 · 小橙 8.9" },
          ]}
        />
      </Section>
    </Page>
  )
}
