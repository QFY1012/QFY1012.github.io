import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Text,
  Stat,
  List,
  KV,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

// 每一步的备注单独成组：图下的说明保持一行，产品组的栏底才齐平。
const stepNotes = data.chains.flatMap((chain) =>
  chain.steps
    .filter((step) => step.note)
    .map((step) => ({
      title: `${chain.product} 第 ${step.no} 步 · ${step.screen}`,
      description: step.note,
    })),
)

export default function Report() {
  return (
    <Page title={data.title} meta={["2 款外卖 App", "2026 年 9 月"]}>
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

      <Section title="结论" description="两款 App 下单链路的一句话判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与结果">
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

      <Section title="产品对比" description="两款 App 的链路步数与结论">
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

      <Section title="链路明细" description="从购物车到支付成功，逐步截图" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步：${step.screen}`} />
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>
                    {`${step.content} · ${step.action}${step.inputs > 0 ? ` · 输入 ${step.inputs} 项` : ""}`}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
        <Group title="步骤备注">
          <List ordered divided={false} items={stepNotes} />
        </Group>
      </Section>

      <Section title="问题" description="3 个问题，按严重度标注">
        <List
          columns={3}
          metaTone="destructive"
          items={data.issues.map((issue) => ({
            title: `${issue.id} ${issue.title}`,
            description: `${issue.product} 第 ${issue.step} 步 · ${issue.evidence}`,
            meta: issue.severity,
          }))}
        />
      </Section>

      <Section title="下一步" description="两条建议及依据">
        <List
          columns={3}
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} · 依据：${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>
    </Page>
  )
}
