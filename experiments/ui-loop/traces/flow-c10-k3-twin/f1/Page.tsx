import data from "./data.json"
import {
  Page,
  Section,
  Grid,
  Group,
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

const backgroundItems = [
  { label: "任务", value: data.task },
  { label: "范围", value: data.scope },
  { label: "日期", value: data.date },
]

const productColumns = [
  { key: "name", label: "产品", span: 3 },
  { key: "steps", label: "步骤", align: "right" as const, span: 2, bar: true },
  { key: "inputs", label: "输入项", align: "right" as const, span: 2, bar: true },
  { key: "verdict", label: "判断", span: 2 },
]

const productRows = data.products.map((product) => ({
  name: product.name,
  steps: product.steps,
  inputs: product.inputs,
  verdict: product.verdict,
}))

const stageColumns = [
  { key: "stage", label: "阶段", span: 3 },
  { key: "青禾银行", label: "青禾银行", span: 2 },
  { key: "远川银行", label: "远川银行", span: 2 },
  { key: "北辰银行", label: "北辰银行", span: 2 },
]

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "title", label: "问题", span: 3 },
  { key: "where", label: "位置", span: 2 },
  { key: "evidence", label: "证据", span: 2 },
  { key: "severity", label: "严重度", span: 1, tone: ["高"] },
]

const issueRows = data.issues.map((issue) => ({
  id: issue.id,
  title: issue.title,
  where: `${issue.product}第 ${issue.step} 步`,
  evidence: issue.evidence,
  severity: issue.severity,
}))

const patternItems = data.patterns.map((pattern) => ({
  title: pattern.name,
  description: `${pattern.comment}(出现在 ${pattern.products.join("、")})`,
}))

const suggestionItems = data.suggestions.map((suggestion) => ({
  title: suggestion.title,
  description: `${suggestion.detail}(依据:${suggestion.basis.join("、")})`,
}))

const stepNoteItems = data.chains.flatMap((chain) =>
  chain.steps
    .filter((step) => step.note !== "")
    .map((step) => ({
      title: `${chain.product} 第 ${step.no} 步 · ${step.screen}`,
      description: step.note,
    })),
)

export default function Report() {
  return (
    <Page title={data.title} meta={["手机银行线上开户", "2026 年 9 月"]}>
      <Section title="背景信息" description="本次挖掘的任务、范围与日期">
        <KV items={backgroundItems} labelCols={2} />
      </Section>

      <Section title="结论" description="三家银行的开户链路对比结论">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次挖掘的规模与产出">
        <Grid cols={12} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              captionBelow
              size={kpi.key === "fewest" ? "lg" : undefined}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="3 款 App 的步骤数、输入项与整体判断">
        <DataTable columns={productColumns} rows={productRows} />
      </Section>

      <Section title="阶段对照" description="同一阶段三家银行各自的做法">
        <DataTable columns={stageColumns} rows={data.stages} />
      </Section>

      <Section title="共同模式" description="跨产品重复出现的做法">
        <List numbered items={patternItems} />
      </Section>

      <Section title="链路明细" description="每款 App 按步骤顺序排开,一步一屏" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
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
                  <FigureText>
                    {step.inputs > 0
                      ? `${step.content} · ${step.action} · 输入 ${step.inputs} 项`
                      : `${step.content} · ${step.action}`}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="步骤备注" description="各步操作中值得注意的地方">
        <List numbered items={stepNoteItems} />
      </Section>

      <Section title="问题明细" description="5 个问题的位置与证据">
        <DataTable columns={issueColumns} rows={issueRows} />
      </Section>

      <Section title="下一步" description="给产品与设计的 4 条改动建议">
        <List numbered items={suggestionItems} />
      </Section>
    </Page>
  )
}
