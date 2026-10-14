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
const product = (name: string) => data.products.find((item) => item.name === name)!

const productRows = data.products.map((item) => ({
  product: item.name,
  steps: item.steps,
  inputs: item.inputs,
  verdict: item.verdict,
}))

const issueRows = data.issues.map((item) => ({
  id: item.id,
  product: item.product,
  step: item.step,
  title: item.title,
  evidence: item.evidence,
  severity: item.severity,
}))

const suggestionItems = data.suggestions.map((item) => ({
  title: item.title,
  description: `${item.detail};依据:${item.basis.join("、")}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["外卖 App", "下单支付"]}>
      <Section title="结论" description="两款 App 的差异在优惠券">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="口径:一次完整下单流程">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
            captionBelow
            size="lg"
            note={`${data.products[0].name} ${data.products[0].steps} 步`}
          />
          <Stat
            span={2}
            value={kpi("products").value}
            unit={kpi("products").unit}
            label={kpi("products").label}
            captionBelow
            note={data.products.map((item) => item.name).join("、")}
          />
          <Stat
            span={2}
            value={kpi("screens").value}
            unit={kpi("screens").unit}
            label={kpi("screens").label}
            captionBelow
            note="每步一张"
          />
          <Stat
            span={2}
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
            captionBelow
            note="1 高 / 1 中 / 1 低"
          />
        </Grid>
      </Section>

      <Section title="链路明细" description="一步一屏,截图 9 张" className="gap-12">
        <Group title="产品对比">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2 },
              { key: "inputs", label: "输入项", align: "right", span: 2 },
              { key: "verdict", label: "结论", span: 3 },
            ]}
            rows={productRows}
          />
        </Group>
        <Group>
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
                    {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="问题" description="按严重度排列,共 3 个">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "依据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
          caption="严重度分高 / 中 / 低三档;编号用于对应下一步建议"
        />
      </Section>

      <Section title="下一步" description="建议依据对应问题编号">
        <List items={suggestionItems} numbered />
      </Section>

      <Section title="背景信息" description="任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            {
              label: "对比产品",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join(" / "),
            },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}