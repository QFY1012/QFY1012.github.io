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

const kpi = (key: string) => data.kpis.find((k) => k.key === key)!
const stages = data.stages as Record<string, string>[]

const longest = data.products.reduce((a, b) => (b.steps > a.steps ? b : a))
const severity = data.issues.reduce<Record<string, number>>((m, i) => ({ ...m, [i.severity]: (m[i.severity] ?? 0) + 1 }), {})

export default function Report() {
  const fewest = kpi("fewest")
  const products = kpi("products")
  const screens = kpi("screens")
  const issues = kpi("issues")

  return (
    <Page title={data.title} meta={["5 款酒店预订 App · 2026 年 4 月版本", data.date]}>
      <Section title="结论" description="五款产品从搜索到支付的整体判断">
        <Text span={9} className="text-2xl leading-9 font-light">
          {data.summary}
        </Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与结论数字">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={fewest.value}
            unit={fewest.unit}
            label={fewest.label}
            note={`最长 ${longest.steps} 步,${longest.name}`}
          />
          <Stat
            span={3}
            captionBelow
            value={issues.value}
            unit={issues.unit}
            label={issues.label}
            note={`高 ${severity["高"]} 个,中 ${severity["中"]} 个,低 ${severity["低"]} 个`}
          />
          <Stat span={3} captionBelow value={products.value} unit={products.unit} label={products.label} note="2026 年 4 月版本" />
          <Stat span={3} captionBelow value={screens.value} unit={screens.unit} label={screens.label} note="5 条链路,每步一屏" />
        </Grid>
      </Section>

      <Section title="流程对比" description="步骤数为首页到预订成功的屏数,填写项为全流程输入字段合计">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "填写项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={data.products.map((p) => ({ product: p.name, steps: p.steps, inputs: p.inputs, verdict: p.verdict }))}
          caption="步骤数与填写项按本次走查的记录统计,不含加载与弹窗以外的系统页。"
        />
      </Section>

      <Section title="阶段差异" description="六个阶段里各产品的做法,按阶段横向比" className="gap-12">
        {stages.map((stage) => (
          <Group key={stage.stage} title={stage.stage}>
            <KV labelCols={2} items={data.products.map((p) => ({ label: p.name, value: stage[p.name] }))} />
          </Group>
        ))}
      </Section>

      <Section title="共性模式" description="跨产品重复出现的做法,涉及产品越多越值得先改">
        <DataTable
          columns={[
            { key: "name", label: "模式", span: 3 },
            { key: "products", label: "涉及产品", span: 2 },
            { key: "comment", label: "说明", span: 4 },
          ]}
          rows={data.patterns.map((p) => ({ name: p.name, products: p.products.join("、"), comment: p.comment }))}
        />
      </Section>

      <Section title="问题明细" description="8 个问题及其所在步骤,严重度分高、中、低三级">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues.map((i) => ({ product: i.product, step: i.step, severity: i.severity, title: i.title, evidence: i.evidence }))}
          caption="步骤编号是该产品链路里的屏序号;严重度按低、中、高三级。"
        />
      </Section>

      <Section title="链路明细" description="每款产品从首页到预订成功的逐屏截图,一行内横向滚动">
        <Group>
          {data.chains.map((chain) => (
            <Fragment key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version} · ${chain.verdict}`} />
              <FigureStrip>
                {chain.steps.map((step) => (
                  <Figure key={step.no}>
                    <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                    <FigureLabel>
                      第 {step.no} 步 · {step.screen}
                    </FigureLabel>
                    <FigureText>{`${step.content} · ${step.action} · 输入 ${step.inputs} 项`}</FigureText>
                    {step.note ? <FigureLabel>{step.note}</FigureLabel> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </Fragment>
          ))}
        </Group>
      </Section>

      <Section title="下一步" description="按影响面排序的修改建议,依据指问题编号或对照步骤">
        <List
          numbered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} 依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次走查的任务、范围与日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "样本", value: `${data.products.length} 款产品,${kpi("screens").value} 张截图` },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
