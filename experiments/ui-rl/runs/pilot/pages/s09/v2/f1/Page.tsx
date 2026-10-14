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

const kpi = Object.fromEntries(data.kpis.map((k) => [k.key, k]))

const productColumns = [
  { key: "name", label: "产品", span: 3 },
  { key: "steps", label: "步骤数", align: "right" as const, span: 2, bar: true },
  { key: "inputs", label: "输入项", align: "right" as const, span: 2, bar: true },
  { key: "verdict", label: "结论", span: 2 },
]

const stageColumns = [
  { key: "stage", label: "环节", span: 3 },
  { key: "青禾银行", label: "青禾银行", span: 2 },
  { key: "远川银行", label: "远川银行", span: 2 },
  { key: "北辰银行", label: "北辰银行", span: 2 },
]

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "product", label: "产品", span: 2 },
  { key: "step", label: "步骤", align: "right" as const, span: 1 },
  { key: "title", label: "问题", span: 2 },
  { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
  { key: "evidence", label: "证据", span: 2 },
]

const issueRows = data.issues.map((issue) => ({
  id: issue.id,
  product: issue.product,
  step: issue.step,
  title: issue.title,
  severity: issue.severity,
  evidence: issue.evidence,
}))

const suggestionItems = data.suggestions.map((s) => ({
  title: s.title,
  description: `${s.detail} · 依据:${s.basis.join("、")}`,
}))

const patternItems = data.patterns.map((p) => ({
  title: p.name,
  description: `出现于 ${p.products.join("、")} · ${p.comment}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["手机银行 App", "2026 年 9 月"]}>
      <Section title="结论" description="三款 App 的流程差异与主要问题">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比规模与结论数字,样本为 2026 年 9 月版本">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpi.fewest.value}
            unit={kpi.fewest.unit}
            label={kpi.fewest.label}
          />
          <Stat
            span={3}
            captionBelow
            value={kpi.products.value}
            unit={kpi.products.unit}
            label={kpi.products.label}
          />
          <Stat
            span={3}
            captionBelow
            value={kpi.issues.value}
            unit={kpi.issues.unit}
            label={kpi.issues.label}
          />
          <Stat
            span={3}
            captionBelow
            value={kpi.screens.value}
            unit={kpi.screens.unit}
            label={kpi.screens.label}
          />
        </Grid>
      </Section>

      <Section title="产品对比" description="步骤数与手工输入项,输入项指用户需要填写的字段">
        <DataTable
          columns={productColumns}
          rows={data.products}
          caption="步骤数为从开户首页到开户成功的屏数;结论为走查后的整体判断"
        />
      </Section>

      <Section title="流程链路" description="三款 App 从首页到开户成功的逐步截图,共 26 屏" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version}`} />
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

      <Section title="环节差异" description="同一环节在三款 App 里的做法对比">
        <DataTable
          columns={stageColumns}
          rows={data.stages}
          caption="身份验证一行显示证件与人脸核验的先后顺序"
        />
      </Section>

      <Section title="可复用模式" description="值得借鉴的做法与出现范围">
        <List numbered items={patternItems} />
      </Section>

      <Section title="问题明细" description="问题按严重度分级,编号供下一步引用">
        <DataTable
          columns={issueColumns}
          rows={issueRows}
          caption="步骤为该问题出现的屏序号;证据为走查时的实际表现"
        />
      </Section>

      <Section title="下一步" description="四条改造建议,依据指向问题编号">
        <List numbered items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="任务、范围与样本口径">
        <KV
          labelCols={2}
          items={[
            { label: "分析任务", value: data.task },
            { label: "覆盖范围", value: data.scope },
            { label: "采集日期", value: data.date },
            { label: "样本量", value: `${kpi.products.value} 款 App、${kpi.screens.value} 屏截图` },
            {
              label: "版本",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join("、"),
            },
          ]}
        />
      </Section>
    </Page>
  )
}
