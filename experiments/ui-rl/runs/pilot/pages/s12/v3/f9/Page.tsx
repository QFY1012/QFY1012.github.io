import { Fragment } from "react"
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

// One kpi by key: the four figures are the same four the upstream skill wrote,
// only the order changes (the leading figure carries the size).
function kpi(key: string) {
  const k = data.kpis.find((x) => x.key === key)!
  return { value: k.value, unit: k.unit, label: k.label }
}

// Issues: product and step stay in their own columns (never one "location"
// cell), the number column is kept so the suggestions can point back at it.
const issueRows = data.issues.map((it) => ({ ...it, step: `第 ${it.step} 步` }))

const patternItems = data.patterns.map((p) => ({
  title: p.name,
  description: `${p.comment}(涉及:${p.products.join("、")})`,
}))

// The basis of a suggestion is written inside the suggestion, as the number of
// the issue it answers.
const suggestionItems = data.suggestions.map((s) => ({
  title: s.title,
  description: `${s.detail} 依据:${s.basis.join("、")}`,
}))

// Header meta: which products the report covers. Task, scope and date stay in
// the closing background section (they are told once, there).
const meta = data.chains.map((c) => `${c.product} ${c.version}`)

export default function Report() {
  return (
    <Page title={data.title} meta={meta}>
      <Section title="结论" description="关闭会员自动续费链路的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比产品、截图量、最短链路与问题计数">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat span={3} size="lg" captionBelow {...kpi("fewest")} />
          <Stat span={2} captionBelow {...kpi("products")} />
          <Stat span={2} captionBelow {...kpi("screens")} />
          <Stat span={2} captionBelow {...kpi("issues")} />
        </Grid>
      </Section>

      <Section title="共性模式" description="两款产品重复出现的做法,以及只在一款出现的做法">
        <List numbered items={patternItems} />
      </Section>

      <Section title="链路明细" description="按步骤顺序列出两款 App 的界面、操作与备注" className="gap-12">
        <Group title="产品对比">
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2 },
              { key: "inputs", label: "输入项", align: "right", span: 2 },
              { key: "verdict", label: "结论", span: 3 },
            ]}
            rows={data.products}
          />
        </Group>
        <Group>
          {data.chains.map((chain) => (
            <Fragment key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version}`} />
              <FigureStrip>
                {chain.steps.map((step) => (
                  <Figure key={step.no}>
                    <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                    <FigureLabel>
                      第 {step.no} 步 · {step.screen}
                    </FigureLabel>
                    <FigureText>
                      {step.content} · {step.action} · 输入 {step.inputs} 项
                    </FigureText>
                    {step.note ? <FigureText>备注:{step.note}</FigureText> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </Fragment>
          ))}
        </Group>
      </Section>

      <Section title="问题" description="按严重度从高到低,证据指向具体步骤">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="按优先级排序,依据指向问题编号与对照步骤">
        <List ordered divided={false} items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="任务、范围与日期口径">
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
