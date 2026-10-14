import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Text,
  Stat,
  DataTable,
  Rule,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
  List,
  KV,
} from "@/components/report"

const kpi = Object.fromEntries(data.kpis.map((k) => [k.key, k])) as Record<
  string,
  { key: string; label: string; value: number; unit: string }
>

const highCount = data.issues.filter((i) => i.severity === "高").length
const midCount = data.issues.filter((i) => i.severity === "中").length

const productRows = data.products.map((p) => ({
  product: p.name,
  steps: p.steps,
  inputs: p.inputs,
  verdict: p.verdict,
}))

const issueRows = data.issues.map((i) => ({
  id: i.id,
  product: i.product,
  step: i.step,
  title: i.title,
  severity: i.severity,
  evidence: i.evidence,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["线上开户", "2026 年 9 月"]}>
      <Section title="结论" description="三家银行线上开户流程的总体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次挖掘的对比范围与主要发现">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={String(kpi.fewest.value)}
            unit={kpi.fewest.unit}
            label={kpi.fewest.label}
            size="lg"
            captionBelow
            note="远川银行 12.1.3"
          />
          <Stat
            span={2}
            value={String(kpi.issues.value)}
            unit={kpi.issues.unit}
            label={kpi.issues.label}
            captionBelow
            note={`高 ${highCount} · 中 ${midCount}`}
          />
          <Stat
            span={2}
            value={String(kpi.products.value)}
            unit={kpi.products.unit}
            label={kpi.products.label}
            captionBelow
            note="青禾 · 远川 · 北辰"
          />
          <Stat
            span={2}
            value={String(kpi.screens.value)}
            unit={kpi.screens.unit}
            label={kpi.screens.label}
            captionBelow
            note="覆盖全部 3 家"
          />
        </Grid>
      </Section>

      <Section
        title="产品对比"
        description="按产品对比步骤数与输入项，口径为开户全流程"
      >
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={productRows}
          caption="步骤数按开户流程中的屏数计，输入项为该产品全流程需用户填写的字段数合计"
        />
      </Section>

      <Section
        title="阶段对比"
        description="同一开户阶段，三家 App 的做法差异"
      >
        <DataTable
          columns={[
            { key: "stage", label: "开户阶段", span: 3 },
            { key: "青禾银行", label: "青禾银行", span: 2 },
            { key: "远川银行", label: "远川银行", span: 2 },
            { key: "北辰银行", label: "北辰银行", span: 2 },
          ]}
          rows={data.stages}
          caption="三家都把开户拆成身份验证、填写资料、绑卡、设密码四段，差别在顺序和每段的屏数"
        />
      </Section>

      <Section
        title="链路明细"
        description="各产品开户全流程逐步截图，一格一屏"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule
              label={`${chain.product} · ${chain.version} · ${chain.verdict}`}
            />
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步：${step.screen}`}
                  />
                  <FigureLabel>
                    第 {step.no} 步 · {step.screen}
                  </FigureLabel>
                  <FigureText>
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note ? (
                    <FigureText>备注：{step.note}</FigureText>
                  ) : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section
        title="共同模式"
        description="三家流程中重复出现、可直接借鉴的做法"
      >
        <List
          numbered
          columns={3}
          items={data.patterns.map((p) => ({
            title: p.name,
            description: p.comment,
            meta: p.products.join(" · "),
          }))}
        />
      </Section>

      <Section
        title="问题明细"
        description="按严重度列出发现的问题，编号用于下一步建议引用"
      >
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            {
              key: "severity",
              label: "严重度",
              span: 1,
              levels: ["低", "中", "高"],
            },
            { key: "evidence", label: "依据", span: 2 },
          ]}
          rows={issueRows}
          caption="编号 P1—P5 与下一步建议中的依据对应；严重度越高越靠后排序"
        />
      </Section>

      <Section title="下一步" description="针对上述问题与模式的改进建议">
        <List
          ordered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: s.detail,
            meta: `依据：${s.basis.join(" · ")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次挖掘的任务、范围与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "对比产品",
              value: data.chains
                .map((c) => `${c.product} ${c.version}`)
                .join("、"),
            },
            {
              label: "样本量",
              value: `${kpi.products.value} 款 App，${kpi.screens.value} 张分析截图`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}