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

const kpi = (key: string) => data.kpis.find((item) => item.key === key)!

const chainOf = (product: string) =>
  data.chains.find((chain) => chain.product === product)!

export default function Report() {
  const productRows = data.products.map((product) => ({
    product: product.name,
    version: chainOf(product.name).version,
    steps: product.steps,
    verdict: product.verdict,
  }))

  const issueRows = data.issues.map((issue) => ({
    id: issue.id,
    product: issue.product,
    step: `第 ${issue.step} 步`,
    issue: `${issue.title} —— ${issue.evidence}`,
    severity: issue.severity,
  }))

  return (
    <Page title={data.title} meta={[data.scope, data.date]}>
      <Section title="结论" description="两款 App 从购物车到支付成功的走查判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比规模、链路步数与问题数,单位见各数字">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
            note="快送 5 步"
          />
          <Stat
            span={3}
            captionBelow
            value={kpi("products").value}
            unit={kpi("products").unit}
            label={kpi("products").label}
            note="快送 11.2 · 小橙 8.9"
          />
          <Stat
            span={3}
            captionBelow
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
            note="快送 3 个 · 小橙 0 个"
          />
          <Stat
            span={3}
            captionBelow
            value={kpi("screens").value}
            unit={kpi("screens").unit}
            label={kpi("screens").label}
            note="快送 5 张 · 小橙 4 张"
          />
        </Grid>
      </Section>

      <Section title="链路对比" description="两款 App 的步骤数与优惠券处理方式,逐屏对照">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "version", label: "版本", span: 2, align: "right" },
            { key: "steps", label: "步骤数", span: 2, align: "right", bar: true },
            { key: "verdict", label: "优惠券处理", span: 3 },
          ]}
          rows={productRows}
          caption="步骤数指从购物车到支付成功需要经过的屏数。"
        />
      </Section>

      <Section title="链路明细" description="每一步的屏、内容与操作,共 9 张截图">
        <Group>
          {data.chains.flatMap((chain) => [
            <Rule
              key={`${chain.product}-rule`}
              label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步 · ${chain.verdict}`}
            />,
            <FigureStrip key={`${chain.product}-strip`}>
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
                    {step.note ? ` · ${step.note}` : ""}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>,
          ])}
        </Group>
      </Section>

      <Section title="问题清单" description="3 个问题集中在快送,按产品与步骤分列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "issue", label: "问题与证据", span: 4 },
            { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
          caption="步骤序号对应「链路明细」中的步号,证据为该步的走查观察;严重度按高、中、低三级标注。"
        />
      </Section>

      <Section title="下一步" description="2 条改动建议,依据指向问题编号与对照步">
        <List
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: `${suggestion.id} · ${suggestion.title}`,
            description: `${suggestion.detail} · 依据:${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务口径、分析范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "对比范围", value: data.scope },
            { label: "分析日期", value: data.date },
            {
              label: "产品与版本",
              value: data.chains
                .map((chain) => `${chain.product} ${chain.version}`)
                .join(" · "),
            },
            {
              label: "截图样本",
              value: `${kpi("screens").value} 张(${data.chains
                .map((chain) => `${chain.product} ${chain.steps.length} 张`)
                .join("、")})`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}