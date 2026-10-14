import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Block,
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

const kpiOrder = ["fewest", "issues", "products", "screens"]
const kpis = kpiOrder
  .map((key) => data.kpis.find((kpi) => kpi.key === key))
  .filter(Boolean) as typeof data.kpis

export default function Report() {
  const productRows = data.products.map((product) => ({
    product: product.name,
    steps: product.steps,
    inputs: product.inputs,
    verdict: product.verdict,
  }))

  const issueRows = data.issues.map((issue) => ({
    id: issue.id,
    product: issue.product,
    step: `第 ${issue.step} 步`,
    title: issue.title,
    severity: issue.severity,
    evidence: issue.evidence,
  }))

  const suggestionItems = data.suggestions.map((suggestion) => ({
    title: `${suggestion.id} ${suggestion.title}`,
    description: suggestion.detail,
  }))

  const basisItems = data.suggestions.map((suggestion) => ({
    label: suggestion.id,
    value: suggestion.basis.join("、"),
  }))

  return (
    <Page
      title={data.title}
      meta={["企业网盘 · 3 款", "2026 年 9 月版本"]}
    >
      <Section
        title="结论"
        description="同一任务下三款产品的流程差异"
      >
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section
        title="核心指标"
        description="对比产品、步骤数、发现问题的数量"
        className="gap-12"
      >
        <Grid cols={12} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              size={kpi.key === "fewest" ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="产品对照"
        description="同一条任务下的步骤数与结论"
      >
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 1 },
            { key: "verdict", label: "一句话判断", span: 4 },
          ]}
          rows={productRows}
          caption={`口径:同一条任务「生成外链并发给同事」,${
            data.scope
          },${data.date} 采集。`}
        />
      </Section>

      <Section
        title="流程链路"
        description="一款产品一组,按步骤横向排开"
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
                    {step.content} · {step.action}
                  </FigureText>
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section
        title="问题明细"
        description="严重度从低到高排列,依据所在步骤和截图"
      >
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={issueRows}
          caption="严重度由影响范围与可恢复性判定:高为权限被意外放开,中为额外点击,低为缺少反馈。"
        />
      </Section>

      <Section
        title="下一步"
        description="两条改进建议,右侧为对应依据"
      >
        <Grid cols={9} fields={false}>
          <Block span={6} title="建议">
            <List items={suggestionItems} ordered divided={false} />
          </Block>
          <Block span={3} title="依据">
            <KV items={basisItems} labelCols={1} />
          </Block>
        </Grid>
      </Section>

      <Section
        title="背景信息"
        description="任务、范围与样本量"
      >
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "分析日期", value: data.date },
            {
              label: "样本",
              value: `${data.products.length} 款产品 · ${data.chains.reduce(
                (total, chain) => total + chain.steps.length,
                0,
              )} 张步骤截图`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}