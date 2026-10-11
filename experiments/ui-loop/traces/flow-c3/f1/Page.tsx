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

// 阶段对比:阶段 + 三家银行的做法,列宽合计 9
const stageColumns = [
  { key: "stage", label: "阶段", span: 3 },
  { key: "青禾银行", label: "青禾银行", span: 2 },
  { key: "远川银行", label: "远川银行", span: 2 },
  { key: "北辰银行", label: "北辰银行", span: 2 },
]

// 问题明细:编号 / 严重度 / 位置 / 问题 / 证据,列宽合计 9
const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "severity", label: "严重度", span: 1, tone: ["高"] },
  { key: "where", label: "位置", span: 2 },
  { key: "title", label: "问题", span: 3 },
  { key: "evidence", label: "证据", span: 2 },
]

// 产品在 chains 里的先后顺序,用于问题排序;找不到对应产品的排在最后
const productOrder = new Map(data.chains.map((chain, i) => [chain.product, i]))

// 位置写法:同产品同步骤的截图,取 chains 里的 screen
const whereOf = (it: (typeof data.issues)[number]) => {
  const chain = data.chains.find((c) => c.product === it.product)
  const step = chain?.steps.find((s) => s.no === it.step)
  return step ? `${it.product} 第 ${it.step} 步 · ${step.screen}` : `${it.product} 第 ${it.step} 步`
}

// 链路截图上的问题编号:命中 issues 里 product 与 step 都相同的条目
const issueIdAt = (product: string, step: number) =>
  data.issues.find((it) => it.product === product && it.step === step)?.id

const issueRows = [...data.issues]
  .sort((a, b) => {
    const oa = productOrder.get(a.product) ?? Number.MAX_SAFE_INTEGER
    const ob = productOrder.get(b.product) ?? Number.MAX_SAFE_INTEGER
    if (oa !== ob) return oa - ob
    return a.step - b.step
  })
  .map((it) => ({
    id: it.id,
    where: whereOf(it),
    title: it.title,
    severity: it.severity,
    evidence: it.evidence,
  }))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.task, data.scope, data.date]}>
      <Section title="结论" description="三家银行 App 的开户流程对比">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比范围与总体规模">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              size={k.key === "fewest" ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="三家银行的步骤数与输入项">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.products.map((p) => (
            <Stat
              key={p.name}
              span={2}
              value={p.steps}
              unit="步"
              label={p.name}
              captionBelow
              note={`输入 ${p.inputs} 项 · ${p.verdict}`}
            />
          ))}
        </Grid>
      </Section>

      <Section title="阶段对比" description="五个阶段,三家银行的做法">
        <DataTable columns={stageColumns} rows={data.stages} />
      </Section>

      <Section title="共性规律" description="三家银行重复出现的做法">
        <List
          numbered
          items={data.patterns.map((p) => ({
            title: `${p.name}(${p.products.join("、")})`,
            description: p.comment,
          }))}
        />
      </Section>

      <Section title="流程明细" description="三家银行的开户步骤,从左到右按顺序" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version} · ${chain.verdict}`}>
            <FigureStrip>
              {[...chain.steps]
                .sort((a, b) => a.no - b.no)
                .map((step) => {
                  const issueId = issueIdAt(chain.product, step.no)
                  return (
                    <Figure key={step.no}>
                      <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                      <FigureLabel>
                        第 {step.no} 步 · {step.screen}
                        {issueId ? ` · ${issueId}` : ""}
                      </FigureLabel>
                      <FigureText>
                        {step.content} · {step.action} · 输入 {step.inputs} 项
                      </FigureText>
                      {step.note ? <FigureText>{step.note}</FigureText> : null}
                    </Figure>
                  )
                })}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="五个问题,按产品与步骤排列">
        <DataTable columns={issueColumns} rows={issueRows} />
      </Section>

      <Section title="下一步" description="四条建议及其依据">
        <List
          ordered
          divided={false}
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.id} · ${s.detail} · 依据 ${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与日期">
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
