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

const kpi = (key: string) => data.kpis.find((k) => k.key === key)!
const chainOf = (product: string) => data.chains.find((c) => c.product === product)!

export default function Report() {
  // 结论数字排在首位、放大一级,样本量与背景口径后置(E1)
  const fewest = kpi("fewest")
  const issues = kpi("issues")
  const products = kpi("products")
  const screens = kpi("screens")

  return (
    <Page title={data.title} meta={[data.task, data.scope, data.date]}>
      <Section title="结论" description="两款 App 下单链路的对比判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的口径与结果计数">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={fewest.value}
            unit={fewest.unit}
            label={fewest.label}
            note={`快送 ${chainOf("快送").steps.length} 步`}
          />
          <Stat span={3} captionBelow value={issues.value} unit={issues.unit} label={issues.label} />
          <Stat span={3} captionBelow value={products.value} unit={products.unit} label={products.label} />
          <Stat span={3} captionBelow value={screens.value} unit={screens.unit} label={screens.label} />
        </Grid>
      </Section>

      <Section title="产品对照" description="步骤数统计到支付成功;输入项指下单过程中需要填写的字段数">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2 },
            { key: "inputs", label: "输入项", align: "right", span: 2 },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={data.products.map((p) => ({
            product: p.name,
            steps: p.steps,
            inputs: p.inputs,
            verdict: p.verdict,
          }))}
        />
      </Section>

      <Section
        title="链路"
        description="从购物车到支付成功,按步骤顺序;每屏标注内容、操作与输入项"
        className="gap-12"
      >
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
                  <FigureLabel>
                    第 {step.no} 步 · {step.screen}
                  </FigureLabel>
                  <FigureText>
                    {`${step.content} · ${step.action} · 输入 ${step.inputs} 项`}
                    {step.note ? `。${step.note}` : ""}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题" description="按严重度从高到低;编号用于下一步建议的依据引用">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            product: issue.product,
            step: `第 ${issue.step} 步`,
            title: issue.title,
            severity: issue.severity,
            evidence: issue.evidence,
          }))}
        />
      </Section>

      <Section title="下一步" description="依据写在各条建议里,对回问题表编号与对照做法">
        <List
          numbered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail}(依据:${s.basis.join("、")})`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次走查的任务、范围、日期与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            { label: "产品版本", value: data.chains.map((c) => `${c.product} ${c.version}`).join(" · ") },
          ]}
        />
      </Section>
    </Page>
  )
}