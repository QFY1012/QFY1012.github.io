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

const KPI_ORDER = ["fewest", "issues", "products", "screens"]

export default function Report() {
  return (
    <Page title={data.title}>
      <Section title="结论" description="下单链路的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="两款 App 的链路规模与问题数,样本与产品数在后">
        <Grid cols={9} fields={false} className="items-baseline">
          {KPI_ORDER.map((key) => {
            const item = data.kpis.find((kpi) => kpi.key === key)
            if (!item) return null
            const primary = key === "fewest"
            return (
              <Stat
                key={key}
                span={primary ? 3 : 2}
                size={primary ? "lg" : undefined}
                captionBelow
                label={item.label}
                value={item.value}
                unit={item.unit}
              />
            )
          })}
        </Grid>
      </Section>

      <Section
        title="链路"
        description="一个产品一行,按步骤顺序横向排开,产品之间以细线分组"
        className="gap-12"
      >
        <Group title="产品对比">
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
              { key: "inputs", label: "输入项", align: "right", span: 1 },
              { key: "verdict", label: "结论", span: 4 },
            ]}
            rows={data.products}
          />
        </Group>

        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version} · ${chain.verdict}`} />
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
                  {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题" description="按产品与步骤分列定位,严重度分低、中、高三级">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={data.issues}
        />
      </Section>

      <Section title="下一步" description="每条一句,依据对回上方问题编号">
        <List
          numbered
          items={data.suggestions.map((item) => ({
            title: item.title,
            description: `${item.detail} · 依据:${item.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次分析的任务、范围与日期">
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