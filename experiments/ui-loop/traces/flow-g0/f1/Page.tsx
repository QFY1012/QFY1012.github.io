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

const stepColumns = [
  { key: "no", label: "步骤", span: 1, align: "right" as const },
  { key: "screen", label: "页面", span: 2 },
  { key: "content", label: "内容", span: 2 },
  { key: "action", label: "操作", span: 2 },
  { key: "note", label: "备注", span: 2 },
]

const stageColumns = [
  { key: "stage", label: "环节", span: 3 },
  { key: "青禾银行", label: "青禾银行", span: 2 },
  { key: "远川银行", label: "远川银行", span: 2 },
  { key: "北辰银行", label: "北辰银行", span: 2 },
]

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "product", label: "产品", span: 2 },
  { key: "step", label: "步骤", span: 1, align: "right" as const },
  { key: "title", label: "问题", span: 2 },
  { key: "evidence", label: "证据", span: 2 },
  { key: "severity", label: "严重度", span: 1, tone: ["高"] },
]

export default function Report() {
  return (
    <Page
      title={data.title}
      meta={["手机银行线上开立二类账户", "3 款银行 App", "2026 年 9 月"]}
    >
      <Section title="结论" description="3 款银行 App 开户流程的横向对比">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的规模与口径">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={2}
              size="lg"
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="流程对比" description="步骤数、输入项与各环节做法" className="gap-12">
        <Group title="步骤与输入项">
          <Grid cols={9} fields={false} className="items-baseline">
            {data.products.map((product) => (
              <Stat
                key={product.name}
                span={3}
                value={product.steps}
                unit="步"
                label={product.name}
                note={`${product.inputs} 项输入 · ${product.verdict}`}
              />
            ))}
          </Grid>
        </Group>
        <Group title="各环节做法">
          <DataTable columns={stageColumns} rows={data.stages} />
        </Group>
      </Section>

      <Section title="流程明细" description="每一步的页面、操作与备注" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
            <DataTable columns={stepColumns} rows={chain.steps} />
          </Group>
        ))}
      </Section>

      <Section title="共性模式" description="值得复用的做法">
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: pattern.comment,
            meta: pattern.products.join("、"),
          }))}
        />
      </Section>

      <Section title="问题明细" description="按严重度排列的 5 个问题">
        <DataTable columns={issueColumns} rows={data.issues} />
      </Section>

      <Section title="下一步" description="按优先级给出的 4 条建议">
        <Grid cols={9} fields={false} className="items-start">
          <Block span={6} title="建议">
            <List
              ordered
              divided={false}
              items={data.suggestions.map((suggestion) => ({
                title: suggestion.title,
                description: suggestion.detail,
              }))}
            />
          </Block>
          <Block span={3} title="依据">
            <KV
              labelCols={1}
              items={data.suggestions.map((suggestion) => ({
                label: suggestion.id,
                value: suggestion.basis.join("、"),
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="背景信息" description="任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "产品版本",
              value: data.chains
                .map((chain) => `${chain.product} ${chain.version}`)
                .join("、"),
            },
          ]}
        />
      </Section>
    </Page>
  )
}
