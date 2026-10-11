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
} from "@/components/report"

// 组件库没有图片组件,链路截图用原生 img 元素渲染,宽度随栏宽缩放。
const Img: any = "img"

const chainColumns = [
  { key: "no", label: "步骤", span: 1 },
  { key: "screen", label: "页面", span: 2 },
  { key: "content", label: "页面内容", span: 2 },
  { key: "action", label: "操作", span: 2 },
  { key: "note", label: "备注", span: 2 },
]

const productColumns = [
  { key: "name", label: "产品", span: 2 },
  { key: "steps", label: "下单步骤", span: 2, align: "right" as const },
  { key: "inputs", label: "输入项", span: 2, align: "right" as const },
  { key: "verdict", label: "流程结论", span: 3 },
]

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "title", label: "问题", span: 2 },
  { key: "where", label: "位置", span: 2 },
  { key: "severity", label: "严重度", span: 1, tone: ["高"] },
  { key: "evidence", label: "证据", span: 3 },
]

export default function Report() {
  return (
    <Page title={data.title} meta={["外卖 App · 快送 / 小橙", "2026 年 9 月"]}>
      <Section title="结论" description={data.task}>
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="两款 App 的对比规模与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              size="lg"
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="下单步骤与流程结论对照">
        <DataTable
          columns={productColumns}
          rows={data.products.map((product) => ({
            name: product.name,
            steps: `${product.steps} 步`,
            inputs: `${product.inputs} 项`,
            verdict: product.verdict,
          }))}
        />
      </Section>

      <Section
        title="链路明细"
        description="从购物车到支付成功的每一步"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group
            key={chain.product}
            title={`${chain.product} ${chain.version} · ${chain.steps.length} 步`}
          >
            <Grid cols={12} fields={false}>
              {chain.steps.map((step) => (
                <Block
                  key={step.no}
                  span={2}
                  title={`${step.no} ${step.screen}`}
                  description={step.action}
                >
                  <Img
                    src={step.image}
                    alt={`${chain.product} ${step.screen}`}
                    className="block w-full"
                  />
                </Block>
              ))}
            </Grid>
            <DataTable
              columns={chainColumns}
              rows={chain.steps.map((step) => ({
                no: step.no,
                screen: step.screen,
                content: step.content,
                action: step.action,
                note: step.note || "—",
              }))}
            />
          </Group>
        ))}
      </Section>

      <Section title="问题" description="严重度分高、中、低,高为红色">
        <DataTable
          columns={issueColumns}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            title: issue.title,
            where: `${issue.product} · 第 ${issue.step} 步`,
            severity: issue.severity,
            evidence: issue.evidence,
          }))}
        />
      </Section>

      <Section title="下一步" description="按问题优先级给出的改进建议">
        <List
          numbered
          columns={3}
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: suggestion.detail,
            meta: `依据 ${suggestion.basis.join(" / ")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与样本口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            {
              label: "对比产品",
              value: data.chains
                .map((chain) => `${chain.product} ${chain.version}`)
                .join(" / "),
            },
            { label: "分析截图", value: "9 张" },
            { label: "报告日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
