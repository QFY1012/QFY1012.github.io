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

const stepsOf = (product: string) =>
  chainOf(product).steps.map((step) => (
    <Figure key={step.no}>
      <FigureImage src={step.image} alt={`${product} 第 ${step.no} 步:${step.screen}`} />
      <FigureLabel>
        第 {step.no} 步 · {step.screen}
      </FigureLabel>
      <FigureText>
        {step.content} · {step.action}
      </FigureText>
      {step.note ? <FigureText>备注:{step.note}</FigureText> : null}
    </Figure>
  ))

const productRows = data.products.map((p) => ({
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
  evidence: i.evidence,
  severity: i.severity,
}))

const suggestionItems = data.suggestions.map((s) => ({
  title: `${s.id} ${s.title}`,
  description: `${s.detail};依据:${s.basis.join("、")}`,
}))

export default function Report() {
  const fewest = kpi("fewest")
  const products = kpi("products")
  const screens = kpi("screens")
  const issues = kpi("issues")

  return (
    <Page title={data.title} meta={["外卖 App"]}>
      <Section title="结论" description="2 款 App 的下单链路屏数与优惠券处理差异">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次分析的规模与结果计数">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={fewest.value}
            label={fewest.label}
            unit={fewest.unit}
            size="lg"
            captionBelow
          />
          <Stat
            span={2}
            value={products.value}
            label={products.label}
            unit={products.unit}
            captionBelow
          />
          <Stat
            span={2}
            value={screens.value}
            label={screens.label}
            unit={screens.unit}
            captionBelow
          />
          <Stat
            span={2}
            value={issues.value}
            label={issues.label}
            unit={issues.unit}
            captionBelow
          />
        </Grid>
      </Section>

      <Section
        title="链路"
        description="一个产品一组,按步骤顺序横向排开"
        className="gap-12"
      >
        <Group title="产品对比">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2 },
              { key: "inputs", label: "输入项", align: "right", span: 2 },
              { key: "verdict", label: "结论", span: 3 },
            ]}
            rows={productRows}
            caption="步骤数为从购物车到支付成功的屏数;输入项为链路中需要用户填写的表单项数"
          />
        </Group>
        <Group title="链路截图">
          <Rule label={`${chainOf("快送").product} · ${chainOf("快送").version}`} />
          <FigureStrip>{stepsOf("快送")}</FigureStrip>
          <Rule label={`${chainOf("小橙").product} · ${chainOf("小橙").version}`} />
          <FigureStrip>{stepsOf("小橙")}</FigureStrip>
        </Group>
      </Section>

      <Section title="问题" description="3 个问题,按对完成下单的影响从高到低">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "依据", span: 2 },
            { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
          caption="严重度按对完成下单的影响排序;步骤对回上节的链路截图"
        />
      </Section>

      <Section title="下一步" description="2 条建议,依据对回问题编号与对照产品的步骤">
        <List ordered divided={false} items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="任务、范围、日期与版本口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "产品版本",
              value: data.chains.map((c) => `${c.product} ${c.version}`).join(" · "),
            },
          ]}
        />
      </Section>
    </Page>
  )
}
