import data from "./data.json"
import {
  DataTable,
  Figure,
  FigureImage,
  FigureLabel,
  FigureStrip,
  FigureText,
  Group,
  Grid,
  KV,
  List,
  Page,
  Section,
  Stat,
  Text,
} from "@/components/report"

export default function Report() {
  const patterns = data.patterns.map((pattern) => ({
    name: pattern.name,
    products: pattern.products.join("、"),
    comment: pattern.comment,
  }))

  const suggestions = data.suggestions.map((suggestion) => ({
    title: suggestion.title,
    description: `${suggestion.detail}。依据 · ${suggestion.basis.join("、")}`,
  }))

  const stageColumns = [
    { key: "stage", label: "阶段", span: 4 },
    ...data.products.map((product) => ({ key: product.name, label: product.name, span: 1 })),
  ]

  return (
    <Page title={data.title} meta={["酒店预订 App", "2026 年 4 月"]}>
      <Section title="结论" description="五款产品从搜索到支付 8 至 11 步,差别集中在搜索条件、房型政策与填写信息三段">
        <Group>
          <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
          <Grid cols={9} fields={false} className="items-baseline">
            <Stat
              span={3}
              size="lg"
              value="8–11"
              unit="步"
              label="从搜索到支付的全流程步骤"
              captionBelow
              note="云栖旅行 8 步最短,蓝湾预订 11 步最长"
            />
          </Grid>
        </Group>
      </Section>

      <Section title="核心指标" description="本轮对比产品、分析截图与发现问题的口径汇总">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi, index) => (
            <Stat
              key={kpi.key}
              span={index === 0 ? 3 : 2}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对照" description="按步骤数从少到多并排各产品的步骤、输入项与结论">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right" as const, span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right" as const, span: 2 },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={data.products}
          caption="口径:步骤数与输入项按每款产品从首页到预订成功的全部屏统计,每屏一张截图"
        />
      </Section>

      <Section title="阶段对比" description="六个阶段并排五款产品的做法,同一格为该产品在这一段的表现">
        <DataTable
          columns={stageColumns}
          rows={data.stages}
          caption="同一格是该产品在这一阶段的做法,口径为从首页到预订成功的全部屏"
        />
      </Section>

      <Section title="共性问题" description="跨产品重复出现、并已造成具体问题的四类模式">
        <DataTable
          columns={[
            { key: "name", label: "模式", span: 3 },
            { key: "products", label: "涉及产品", span: 3 },
            { key: "comment", label: "说明", span: 3 },
          ]}
          rows={patterns}
        />
      </Section>

      <Section title="流程链路" description="每款产品从首页到预订成功的逐步截图,备注为走查发现" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
                  {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="共 8 个问题,编号 P1–P8 供下一步建议引用">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right" as const, span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={data.issues}
          caption="严重度按最严重的一项定级:高为影响付款或退款,中为多一次操作或价格不透明,低为提示文案缺位"
        />
      </Section>

      <Section title="下一步" description="五条改动建议,依据对回问题编号与具体步骤">
        <List numbered items={suggestions} />
      </Section>

      <Section title="背景信息" description="任务、范围与分析样本口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "分析日期", value: data.date },
            { label: "样本", value: "5 款产品共 47 个步骤,每个步骤一张截图" },
          ]}
        />
      </Section>
    </Page>
  )
}