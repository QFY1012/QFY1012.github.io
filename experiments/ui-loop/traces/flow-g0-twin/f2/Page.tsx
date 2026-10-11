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
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

// 主指标排在最前(步骤最少),其余按数据顺序排在后面。
const kpis = [data.kpis[2], data.kpis[0], data.kpis[1], data.kpis[3]]

const issueRows = data.issues.map((issue) => ({
  id: issue.id,
  title: issue.title,
  where: `${issue.product} · 第 ${issue.step} 步`,
  severity: issue.severity,
  evidence: issue.evidence,
}))

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "title", label: "问题", span: 3 },
  { key: "where", label: "位置", span: 2 },
  { key: "severity", label: "严重度", span: 1, tone: ["高"] },
  { key: "evidence", label: "证据", span: 2 },
]

export default function Report() {
  return (
    <Page title={data.title} meta={["快送 11.2 · 小橙 8.9", "2026 年 9 月版本"]}>
      <Section title="结论" description="两款 App 下单链路的总体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="链路规模与发现数量">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((kpi, i) => (
            <Stat
              key={kpi.key}
              span={3}
              captionBelow
              size={i === 0 ? "lg" : undefined}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="按产品分群,对照步骤数与主要差别">
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

      <Section
        title="链路明细"
        description="每款产品从购物车到支付成功的逐屏截图"
        className="gap-12"
      >
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
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="发现问题" description="按产品与步骤定位,共 3 个">
        <DataTable
          columns={issueColumns}
          rows={issueRows}
          caption="严重度按对下单链路的影响判定"
        />
      </Section>

      <Section title="下一步" description="按问题优先级给出的改动建议">
        <List
          numbered
          columns={3}
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: suggestion.detail,
            meta: `依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与样本口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            { label: "对比产品", value: "快送 11.2 · 小橙 8.9" },
            { label: "分析截图", value: "9 张" },
            { label: "发现问题", value: "3 个" },
          ]}
        />
      </Section>
    </Page>
  )
}
