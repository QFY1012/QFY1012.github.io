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

const chainOf = Object.fromEntries(data.chains.map((c) => [c.product, c]))

// 各产品概况:产品、步骤数、输入项与结论并排一行,链路明细前先看总量差别(E8)
const productRows = data.products.map((p) => ({
  product: p.name,
  steps: p.steps,
  inputs: p.inputs,
  verdict: p.verdict,
}))

// 阶段对比:三家按同一批阶段对齐,一眼看出顺序和屏数的差别
const stageRows = data.stages.map((s) => ({ ...s }))

// 共性:每个做法后面跟着出现在哪几家
const patternItems = data.patterns.map((p) => ({
  title: p.name,
  description: `${p.products.join("、")} · ${p.comment}`,
}))

// 问题:产品与步骤分列(E3),保留唯一编号(E5),严重度用有序等级列
const issueRows = data.issues.map((it) => ({
  no: it.id,
  product: it.product,
  step: it.step,
  title: it.title,
  evidence: it.evidence,
  severity: it.severity,
}))

// 建议:单列纵向编号排,依据(编号)内联在每条里(E2、E5)
const suggestionItems = data.suggestions.map((s) => ({
  title: `${s.id} ${s.title}`,
  description: `${s.detail}(依据:${s.basis.join("、")})`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["线上开户 · 手机银行", "2026 年 9 月版"]}>
      <Section title="结论" description="一句话判断,依据见后续各节">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的整体口径">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("products").value}
            unit={kpi("products").unit}
            label={kpi("products").label}
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("screens").value}
            unit={kpi("screens").unit}
            label={kpi("screens").label}
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
          />
        </Grid>
      </Section>

      <Section title="流程拆分" description="按阶段对齐三家流程" className="gap-12">
        <Group title="各产品概况">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
              { key: "inputs", label: "输入项", align: "right", span: 1 },
              { key: "verdict", label: "结论", span: 4 },
            ]}
            rows={productRows}
          />
        </Group>
        <Group title="阶段对比">
          <DataTable
            columns={[
              { key: "stage", label: "阶段", span: 3 },
              { key: "青禾银行", label: "青禾银行", span: 2 },
              { key: "远川银行", label: "远川银行", span: 2 },
              { key: "北辰银行", label: "北辰银行", span: 2 },
            ]}
            rows={stageRows}
          />
        </Group>
      </Section>

      <Section title="共性与差异" description="三家流程里反复出现的做法">
        <List numbered items={patternItems} />
      </Section>

      <Section title="链路明细" description="每一步一屏,一行放不下可横向滚动" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version} · ${chain.verdict}`} />
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步 ${step.screen}`}
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

      <Section title="问题明细" description={`${data.issues.length} 个问题,按影响排序`}>
        <DataTable
          columns={[
            { key: "no", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="4 条改法,依据对回具体条目">
        <List numbered items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="任务、范围与样本口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "产品版本",
              value: data.chains.map((c) => `${c.product} ${c.version}`).join("、"),
            },
            {
              label: "样本量",
              value: `${kpi("screens").value} 张分析截图,覆盖 3 款 App 的完整链路`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}