import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Text,
  Stat,
  DataTable,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
  List,
  KV,
} from "@/components/report"

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "product", label: "产品", span: 1 },
  { key: "step", label: "步骤", align: "right", span: 1 },
  { key: "title", label: "问题", span: 2 },
  { key: "evidence", label: "证据", span: 2 },
  { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
]

const issueRows = data.issues.map((issue) => ({
  id: issue.id,
  product: issue.product,
  step: issue.step,
  title: issue.title,
  evidence: issue.evidence,
  severity: issue.severity,
}))

const noteColumns = [
  { key: "product", label: "产品", span: 2 },
  { key: "step", label: "步骤", align: "right", span: 1 },
  { key: "screen", label: "屏幕", span: 2 },
  { key: "note", label: "备注", span: 4 },
]

const noteRows = data.chains.flatMap((chain) =>
  chain.steps
    .filter((step) => step.note)
    .map((step) => ({
      product: chain.product,
      step: step.no,
      screen: step.screen,
      note: step.note,
    })),
)

const suggestionItems = data.suggestions.map((item) => ({
  title: item.title,
  description: `${item.detail} · 依据:${item.basis.join("、")}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["快送 11.2 · 小橙 8.9", "2026-09"]}>
      <Section title="背景信息" description="任务、范围与日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>

      <Section title="结论" description="两款 App 下单链路的核心差别">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比产品、分析截图、步数与问题数">
        <Grid cols={12} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              size="lg"
              captionBelow
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="下单步数,单位:步">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.products.map((product) => (
            <Stat
              key={product.name}
              span={2}
              captionBelow
              value={product.steps}
              unit="步"
              label={product.name}
              note={product.verdict}
            />
          ))}
        </Grid>
      </Section>

      <Section title="链路明细" description="从购物车到支付成功,每屏一图" className="gap-12">
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

      <Section title="步骤备注" description="每步的界面观察,只列有备注的步骤">
        <DataTable
          columns={noteColumns}
          rows={noteRows}
          caption="备注为走查时记录的界面口径;其余步骤无特别观察。"
        />
      </Section>

      <Section title="发现问题" description="快送链路 3 项,按严重度从低到高排列">
        <DataTable
          columns={issueColumns}
          rows={issueRows}
          caption="严重度:低 → 中 → 高,最高一级标红加粗;问题均出现在快送 App 的下单链路。"
        />
      </Section>

      <Section title="下一步" description="两条改进建议及其依据">
        <List items={suggestionItems} numbered columns={2} />
      </Section>
    </Page>
  )
}
