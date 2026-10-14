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

const productRows = data.products.map((p) => ({
  product: p.name,
  steps: p.steps,
  inputs: p.inputs,
  verdict: p.verdict,
}))

const issueRows = data.issues.map((i) => ({
  product: i.product,
  step: i.step,
  title: i.title,
  severity: i.severity,
  evidence: i.evidence,
}))

const suggestionItems = data.suggestions.map((s) => ({
  title: s.title,
  description: `${s.detail} · 依据 ${s.basis.join("、")}`,
}))

const backgroundItems = [
  { label: "任务", value: data.task },
  { label: "范围", value: data.scope },
  {
    label: "对比产品",
    value: data.chains.map((c) => `${c.product} ${c.version}`).join("、"),
  },
  { label: "分析截图", value: `${data.kpis.find((k) => k.key === "screens")?.value ?? 13} 张` },
  { label: "分析日期", value: data.date },
]

export default function Report() {
  return (
    <Page title={data.title} meta={["协同办公平台 · 会议室预订", "2 款产品 · 2026 Q3 版本", data.date]}>
      <Section title="结论" description="同一任务下两款产品的路径差异">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的规模与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={5}
            unit="步"
            label="步骤最少(链工)"
            note="协作宝 8 步,少 3 步"
          />
          <Stat span={2} captionBelow value={2} unit="个" label="对比产品" note="协作宝 7.2、链工 4.6" />
          <Stat span={2} captionBelow value={4} unit="个" label="发现问题" note="高 2、中 1、低 1" />
          <Stat span={2} captionBelow value={13} unit="张" label="分析截图" note="协作宝 8 张、链工 5 张" />
        </Grid>
      </Section>

      <Section title="拆分" description="按产品与阶段对照两种做法" className="gap-12">
        <Group title="两款产品的做法与代价">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
              { key: "inputs", label: "输入项", align: "right", span: 2 },
              { key: "verdict", label: "做法", span: 3 },
            ]}
            rows={productRows}
          />
        </Group>
        <Group title="四个阶段的对照">
          <DataTable
            columns={[
              { key: "stage", label: "阶段", span: 3 },
              { key: "协作宝", label: "协作宝", span: 3 },
              { key: "链工", label: "链工", span: 3 },
            ]}
            rows={data.stages}
            caption="阶段口径:从进入预订入口到预订成功的关键环节"
          />
        </Group>
      </Section>

      <Section title="明细" description="协作宝路径上的问题,按严重度排">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={issueRows}
          caption="4 个问题均出现在协作宝的 8 步路径上,链工未复现"
        />
      </Section>

      <Section title="链路" description="每款产品从入口到预订成功的步骤">
        <Group>
          {data.chains.map((chain) => (
            <Group key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version}`} />
              <FigureStrip>
                {chain.steps.map((step) => (
                  <Figure key={step.no}>
                    <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                    <FigureLabel>
                      第 {step.no} 步 · {step.screen}
                    </FigureLabel>
                    <FigureText>
                      {step.content} · {step.action} · 输入 {step.inputs} 项{step.note ? ` · ${step.note}` : ""}
                    </FigureText>
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="下一步" description="三条改动建议,依据为链路步骤与问题编号">
        <List numbered items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="任务、范围与样本量">
        <KV labelCols={2} items={backgroundItems} />
      </Section>
    </Page>
  )
}
