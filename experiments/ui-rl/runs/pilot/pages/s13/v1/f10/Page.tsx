import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Stat,
  Text,
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

// 结论数字排第一并放大(步骤最少),背景口径的数字(产品数、截图数)排到后面
const KPI_ORDER = ["fewest", "issues", "products", "screens"]
const KPI_SPANS = [3, 2, 2, 2]
const kpis = KPI_ORDER.map((key) => data.kpis.find((k) => k.key === key)!)

const STAGE_PRODUCTS = ["云栖旅行", "栖岸酒店", "途鹿出行", "蓝湾预订", "泊客旅行"]
const stages = data.stages as unknown as Record<string, string>[]

const productColumns = [
  { key: "name", label: "产品", span: 2 },
  { key: "steps", label: "步骤数", align: "right" as const, span: 2, bar: true },
  { key: "inputs", label: "填写项", align: "right" as const, span: 2 },
  { key: "verdict", label: "结论", span: 3 },
]

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "product", label: "产品", span: 2 },
  { key: "step", label: "步骤", span: 1 },
  { key: "problem", label: "问题", span: 4 },
  { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
]

const issueRows = data.issues.map((it) => ({
  id: it.id,
  product: it.product,
  step: `第 ${it.step} 步`,
  problem: `${it.title}:${it.evidence}`,
  severity: it.severity,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["酒店预订 App"]}>
      <Section title="结论" description="五款产品从搜索到支付的主要判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的样本与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((kpi, i) => (
            <Stat
              key={kpi.key}
              span={KPI_SPANS[i]}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              size={i === 0 ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对照" description="按从搜索到支付的步骤数排列">
        <DataTable columns={productColumns} rows={data.products} />
      </Section>

      <Section title="阶段对比" description="同一阶段里各产品的做法">
        <List
          ordered
          items={stages.map((stage) => ({
            title: stage.stage,
            description: STAGE_PRODUCTS.map((p) => `${p}:${stage[p]}`).join(" · "),
          }))}
        />
      </Section>

      <Section title="共性模式" description="跨产品重复出现的四类做法">
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: `${pattern.comment}(涉及 ${pattern.products.join("、")})`,
          }))}
        />
      </Section>

      <Section title="发现问题" description="按产品与步骤定位,共 8 个">
        <DataTable
          columns={issueColumns}
          rows={issueRows}
          caption="问题按影响面从高到低编号,严重度分低、中、高三级,高为最高一级。"
        />
      </Section>

      <Section title="链路明细" description="每款产品从搜索到支付的分步截图" className="gap-12">
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
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
                  {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="下一步" description="按影响面排序的修改建议">
        <List
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} 依据 · ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与产品版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "产品版本",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join("、"),
            },
          ]}
        />
      </Section>
    </Page>
  )
}