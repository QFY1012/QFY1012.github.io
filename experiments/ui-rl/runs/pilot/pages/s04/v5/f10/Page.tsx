import { Fragment } from "react"

import data from "./data.json"
import {
  DataTable,
  Figure,
  FigureImage,
  FigureLabel,
  FigureStrip,
  FigureText,
  Grid,
  Group,
  KV,
  List,
  Page,
  Rule,
  Section,
  Stat,
  Text,
} from "@/components/report"

// 结论数字(步骤最少)放大前置,样本量(产品数、截图数)后置,四项一行排满。
const kpi = Object.fromEntries(data.kpis.map((k) => [k.key, k]))

const products = data.products
const stages = data.stages as Record<string, string>[]
const chains = data.chains

// 问题按严重度排开:没有颜色通道时,顺序就是等级。
const SEVERITY_RANK: Record<string, number> = { 高: 0, 中: 1, 低: 2 }
const issues = [...data.issues].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])

export default function Report() {
  return (
    <Page title={data.title} meta={[data.scope, data.date]}>
      <Section title="结论" description="五款产品从搜索到支付的判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次挖掘的分析量与主要结论">
        <Grid cols={4} fields={false} className="items-baseline">
          <Stat
            captionBelow
            size="lg"
            value={kpi.fewest.value}
            unit={kpi.fewest.unit}
            label={kpi.fewest.label}
            note="全组区间 8 到 11 步"
          />
          <Stat captionBelow value={kpi.issues.value} unit={kpi.issues.unit} label={kpi.issues.label} />
          <Stat captionBelow value={kpi.products.value} unit={kpi.products.unit} label={kpi.products.label} />
          <Stat captionBelow value={kpi.screens.value} unit={kpi.screens.unit} label={kpi.screens.label} />
        </Grid>
      </Section>

      <Section title="流程对比" description="主链路步骤数与全程手动填写项">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "填写项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={products.map((p) => ({
            product: p.name,
            steps: p.steps,
            inputs: p.inputs,
            verdict: p.verdict,
          }))}
          caption="步骤数按从搜索到预订成功的主链路计;填写项为全程需要手动输入的字段数。"
        />
      </Section>

      <Section title="阶段差异" description="六个阶段里五款产品各自的做法" className="gap-12">
        {stages.map((stage) => (
          <Group key={stage.stage} title={stage.stage}>
            <KV labelCols={2} items={products.map((p) => ({ label: p.name, value: stage[p.name] }))} />
          </Group>
        ))}
      </Section>

      <Section title="共性问题" description="跨产品重复出现的模式与涉及产品">
        <List
          numbered
          items={data.patterns.map((p) => ({
            title: p.name,
            description: `${p.comment} 涉及 ${p.products.join("、")}`,
          }))}
        />
      </Section>

      <Section title="链路明细" description="每款产品从搜索到预订成功的逐步截图">
        <Group>
          {chains.map((chain) => (
            <Fragment key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version}`} />
              <FigureStrip>
                {chain.steps.map((step) => (
                  <Figure key={step.no}>
                    <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                    <FigureLabel>{`第 ${step.no} 步 · ${step.screen}`}</FigureLabel>
                    <FigureText>{`${step.content} · ${step.action} · 输入 ${step.inputs} 项`}</FigureText>
                    {step.note !== "" && <FigureText>{step.note}</FigureText>}
                  </Figure>
                ))}
              </FigureStrip>
            </Fragment>
          ))}
        </Group>
      </Section>

      <Section title="问题" description="八项问题的位置、严重度与证据,按严重度排列">
        <List
          columns={3}
          items={issues.map((issue) => ({
            meta: `严重度 ${issue.severity}`,
            title: `${issue.id} · ${issue.product} 第 ${issue.step} 步 · ${issue.title}`,
            description: issue.evidence,
          }))}
        />
      </Section>

      <Section title="下一步" description="按优先级给出的五条改动建议">
        <List
          numbered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} 依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与分析日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "覆盖范围", value: data.scope },
            { label: "分析日期", value: data.date },
            { label: "产品与版本", value: chains.map((c) => `${c.product} ${c.version}`).join(" · ") },
            { label: "样本量", value: `${kpi.products.value} 款产品、${kpi.screens.value} 张分析截图` },
          ]}
        />
      </Section>
    </Page>
  )
}
