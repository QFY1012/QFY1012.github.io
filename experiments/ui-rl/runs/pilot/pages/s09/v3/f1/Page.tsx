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

const kpiOf = (key: string) =>
  data.kpis.find((item) => item.key === key) ?? data.kpis[0]

// 结论数字(步骤最少)放首位并放大,其余三项同层
const KPI_LAYOUT: { key: string; span: number; size?: "lg" }[] = [
  { key: "fewest", span: 3, size: "lg" },
  { key: "products", span: 2 },
  { key: "screens", span: 2 },
  { key: "issues", span: 2 },
]

const productColumns = [
  { key: "name", label: "产品", span: 2 },
  { key: "steps", label: "步骤数", align: "right" as const, span: 2, bar: true },
  { key: "inputs", label: "输入项", align: "right" as const, span: 2, bar: true },
  { key: "verdict", label: "流程结论", span: 3 },
]

const stageColumns = [
  { key: "stage", label: "阶段", span: 3 },
  { key: "青禾银行", label: "青禾银行", span: 2 },
  { key: "远川银行", label: "远川银行", span: 2 },
  { key: "北辰银行", label: "北辰银行", span: 2 },
]

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "product", label: "产品", span: 2 },
  { key: "step", label: "步骤", align: "right" as const, span: 1 },
  { key: "title", label: "问题", span: 2 },
  { key: "evidence", label: "证据", span: 2 },
  { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
]

export default function Report() {
  return (
    <Page title={data.title} meta={["手机银行线上开户"]}>
      <Section title="结论" description="开户流程的整体判断与主要差异">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="3 款银行 App、26 张截图的口径">
        <Grid cols={9} fields={false} className="items-baseline">
          {KPI_LAYOUT.map(({ key, span, size }) => {
            const item = kpiOf(key)
            return (
              <Stat
                key={key}
                span={span}
                value={item.value}
                unit={item.unit}
                label={item.label}
                captionBelow
                size={size}
              />
            )
          })}
        </Grid>
      </Section>

      <Section
        title="产品对比"
        description="步骤数、输入项数与各阶段做法"
        className="gap-12"
      >
        <Group title="产品规模">
          <DataTable
            columns={productColumns}
            rows={data.products}
            caption="步骤数为开户流程的屏数;输入项为该流程要求用户填写的字段数"
          />
        </Group>
        <Group title="各阶段做法">
          <DataTable
            columns={stageColumns}
            rows={data.stages}
            caption="同一阶段在各产品中的屏数与交互做法"
          />
        </Group>
        <Group title="共性规律">
          <List
            numbered
            items={data.patterns.map((pattern) => ({
              title: `${pattern.name}(${pattern.products.join("、")})`,
              description: pattern.comment,
            }))}
          />
        </Group>
      </Section>

      <Section
        title="链路明细"
        description="按产品分组的 26 张步骤截图"
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
                    {step.inputs > 0
                      ? `${step.content} · ${step.action} · 输入 ${step.inputs} 项`
                      : `${step.content} · ${step.action}`}
                  </FigureText>
                  {step.note ? <FigureText>备注 · {step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题清单" description="5 个问题,严重度分高、中两级">
        <DataTable
          columns={issueColumns}
          rows={data.issues}
          caption="编号 P1–P5 与下一步建议的依据对应"
        />
      </Section>

      <Section title="下一步" description="4 条改进建议及依据">
        <List
          ordered
          items={data.suggestions.map((suggestion) => ({
            title: `${suggestion.id} · ${suggestion.title}`,
            description: `${suggestion.detail} · 依据 · ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与样本口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "分析日期", value: data.date },
            {
              label: "样本",
              value: "3 款银行 App 的完整开户链路,共 26 张分析截图",
            },
          ]}
        />
      </Section>
    </Page>
  )
}