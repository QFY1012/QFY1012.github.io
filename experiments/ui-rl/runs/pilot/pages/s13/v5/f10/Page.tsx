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

type StageRow = Record<string, string>

const productNames = data.products.map((p) => p.name)

const stageRows = (data.stages as unknown as StageRow[]).flatMap((stage) =>
  productNames.map((name) => ({
    stage: stage.stage,
    product: name,
    approach: stage[name],
  })),
)

export default function Report() {
  return (
    <Page meta={["酒店预订 App"]} title={data.title}>
      <Section title="结论">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的样本量与结果口径">
        <Grid cols={12} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              captionBelow
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              size={kpi.key === "fewest" ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对照" description="五款产品的步骤数、填写项与一句话结论">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "填写项", align: "right", span: 1 },
            { key: "verdict", label: "结论", span: 4 },
          ]}
          rows={data.products}
        />
      </Section>

      <Section title="阶段差异" description="六个流程阶段里各款产品的做法">
        <DataTable
          columns={[
            { key: "stage", label: "阶段", span: 2 },
            { key: "product", label: "产品", span: 2 },
            { key: "approach", label: "做法", span: 5 },
          ]}
          rows={stageRows}
        />
      </Section>

      <Section
        title="链路明细"
        description="每款产品从搜索到支付的逐步截图与备注"
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
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="问题的位置、严重度与证据">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={data.issues}
        />
      </Section>

      <Section title="共性模式" description="跨产品重复出现的做法">
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: `涉及 ${pattern.products.join("、")};${pattern.comment}`,
          }))}
        />
      </Section>

      <Section title="下一步" description="按问题编号对回具体条目的修改建议">
        <List
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} 依据:${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与日期口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "调研范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}