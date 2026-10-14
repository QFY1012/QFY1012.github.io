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

const productNames = data.products.map((p) => p.name)

const stageRows = data.stages.flatMap((stage) =>
  productNames.map((name) => ({
    stage: stage.stage,
    product: name,
    detail: (stage as Record<string, string>)[name],
  })),
)

const kpi = (key: string) => data.kpis.find((k) => k.key === key)!

export default function Report() {
  return (
    <Page title={data.title} meta={["酒店预订 App", "2026 年 4 月"]}>
      <Section title="结论" description="五款产品从搜索到支付的完整走查">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比产品、截图与问题的总量">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={kpi("products").value}
            unit={kpi("products").unit}
            label={kpi("products").label}
            size="lg"
            captionBelow
          />
          <Stat
            span={2}
            value={kpi("screens").value}
            unit={kpi("screens").unit}
            label={kpi("screens").label}
            captionBelow
          />
          <Stat
            span={2}
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
            captionBelow
          />
          <Stat
            span={2}
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
            captionBelow
          />
        </Grid>
      </Section>

      <Section title="产品对照" description="步骤数与填写项为全流程计数">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "填写项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={data.products}
        />
      </Section>

      <Section title="链路明细" description="每个产品按步骤顺序排开,备注单起一行" className="gap-12">
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
                  {step.note ? <FigureText>备注 · {step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="分阶段对比" description="六个阶段 × 五款产品的做法">
        <DataTable
          columns={[
            { key: "stage", label: "阶段", span: 2 },
            { key: "product", label: "产品", span: 2 },
            { key: "detail", label: "做法", span: 5 },
          ]}
          rows={stageRows}
        />
      </Section>

      <Section title="共性问题" description="跨产品重复出现、优先要修的模式">
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: `${pattern.comment}　涉及:${pattern.products.join("、")}`,
          }))}
        />
      </Section>

      <Section title="问题明细" description="编号在下一步建议中作为依据引用">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues}
        />
      </Section>

      <Section title="下一步" description="每条建议的依据写编号对回问题明细">
        <List
          ordered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail}　依据:${suggestion.basis.join(" · ")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本口径">
        <KV
          labelCols={2}
          items={[
            { label: "测试任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "报告日期", value: data.date },
            {
              label: "产品与版本",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join("、"),
            },
          ]}
        />
      </Section>
    </Page>
  )
}