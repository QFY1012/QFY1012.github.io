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

const kpis = [
  { ...data.kpis[2], size: "lg" as const },
  data.kpis[0],
  data.kpis[3],
  data.kpis[1],
]

const productRows = data.products.map((p) => ({
  name: p.name,
  steps: p.steps,
  inputs: p.inputs,
  verdict: p.verdict,
}))

const issueRows = data.issues.map((issue) => ({
  id: issue.id,
  product: issue.product,
  step: `第 ${issue.step} 步`,
  title: issue.title,
  evidence: issue.evidence,
  severity: issue.severity,
}))

const suggestionItems = data.suggestions.map((s) => ({
  title: s.title,
  description: `${s.detail} · 依据:${s.basis.join("、")}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["快送 · 小橙"]}>
      <Section title="结论" description="外卖从购物车到支付成功的链路对比结论">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与结果,样本为 9 张流程截图">
        <Grid cols={12} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              captionBelow
              size={kpi.size}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="链路"
        description="按步骤从左到右排开,一格一屏;截图下标注内容与操作"
        className="gap-12"
      >
        <Group title="产品对比">
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
              { key: "inputs", label: "输入项", align: "right", span: 2 },
              { key: "verdict", label: "结论", span: 3 },
            ]}
            rows={productRows}
          />
        </Group>

        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version} 的下单链路`}>
            <Rule label={`${chain.product} · ${chain.version} · 共 ${chain.steps.length} 步`} />
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
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note ? <FigureText>备注 · {step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题" description="3 个问题按严重度从高到低排列,证据取自链路截图">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="两条改动建议,依据对回链路步骤与问题编号">
        <List ordered items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="本次走查的任务、范围与日期">
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
