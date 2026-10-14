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

const kpiOf = (key: string) => data.kpis.find((k) => k.key === key)!
const productNames = data.products.map((p) => p.name)
const bySteps = [...data.products].sort((a, b) => a.steps - b.steps)
const stageCell = (row: unknown, name: string) => (row as Record<string, string>)[name]

export default function Report() {
  const sentences = data.summary.split("。").filter((s) => s.trim().length > 0)
  const lead = `${sentences[0]}。`
  const body = `${sentences.slice(1).join("。")}。`

  return (
    <Page title={data.title} meta={["酒店预订 App"]}>
      <Section title="结论" description="五款产品从搜索到支付的全流程判断" className="gap-12">
        <Text className="text-2xl leading-9 font-light">{lead}</Text>
        <Text>{body}</Text>
      </Section>

      <Section title="核心指标" description="步骤最少与最多相差 3 步">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpiOf("fewest").value}
            unit={kpiOf("fewest").unit}
            label={kpiOf("fewest").label}
            note="最多 11 步(蓝湾预订)"
          />
          <Stat
            span={3}
            captionBelow
            value={kpiOf("products").value}
            unit={kpiOf("products").unit}
            label={kpiOf("products").label}
          />
          <Stat
            span={3}
            captionBelow
            value={kpiOf("screens").value}
            unit={kpiOf("screens").unit}
            label={kpiOf("screens").label}
          />
          <Stat
            span={3}
            captionBelow
            value={kpiOf("issues").value}
            unit={kpiOf("issues").unit}
            label={kpiOf("issues").label}
          />
        </Grid>
      </Section>

      <Section title="产品对照" description="按步骤数从少到多,输入项为全流程必填字段合计">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={bySteps}
          caption="步骤数为从首页搜索到预订成功的屏数;输入项为全流程必填字段合计。"
        />
      </Section>

      <Section
        title="链路明细"
        description="五款产品共 47 屏,一格一屏按步骤顺序排开"
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
                  <FigureLabel>{`第 ${step.no} 步 · ${step.screen}`}</FigureLabel>
                  <FigureText>
                    {step.inputs > 0
                      ? `${step.content} · ${step.action} · 输入 ${step.inputs} 项`
                      : `${step.content} · ${step.action}`}
                  </FigureText>
                  {step.note ? <FigureText>{`备注:${step.note}`}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="阶段对比" description="同一阶段五款产品的做法差异">
        <Grid cols={9} fields={false}>
          {data.stages.map((stage) => (
            <Block key={stage.stage} span={3} title={stage.stage}>
              <List
                divided={false}
                items={productNames.map((name) => ({
                  title: name,
                  description: stageCell(stage, name),
                }))}
              />
            </Block>
          ))}
        </Grid>
      </Section>

      <Section title="共性模式" description="至少两款产品重复出现的问题">
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: pattern.comment,
            meta: pattern.products.join(" · "),
          }))}
        />
      </Section>

      <Section title="问题明细" description="8 个问题的位置、证据与严重度">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={data.issues}
          caption="严重度按低→中→高排序,最高一级标红加粗;编号用于下一步建议的依据。"
        />
      </Section>

      <Section title="下一步" description="5 条建议,依据对回问题编号">
        <List
          ordered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: suggestion.detail,
            meta: `${suggestion.id} · 依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与执行日期">
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