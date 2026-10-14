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

// 核心指标:结论数字排在首位并放大,样本量(产品数、截图数)后置。
const KPI_ORDER = ["fewest", "issues", "products", "screens"]

// 严重度是一列有序等级,从低到高。
const SEVERITY_LEVELS = ["低", "中", "高"]

export default function Report() {
  const kpi = (key: string) => data.kpis.find((k) => k.key === key)!
  const severityCount = (level: string) => data.issues.filter((i) => i.severity === level).length
  const mostSteps = data.products.reduce((a, b) => (b.steps > a.steps ? b : a))
  const products = data.products.map((p) => p.name)

  const kpiNotes: Record<string, string> = {
    fewest: `四款中最少;${mostSteps.name} ${mostSteps.steps} 步最多`,
    issues: `高 ${severityCount("高")} 个、中 ${severityCount("中")} 个、低 ${severityCount("低")} 个`,
    products: "四款运营商 App 同期走查",
    screens: "覆盖首页到装机进度的全流程",
  }

  const issueRows = data.issues.map((it) => ({
    id: it.id,
    product: it.product,
    step: `第 ${it.step} 步`,
    severity: it.severity,
    title: it.title,
    evidence: it.evidence,
  }))

  const patternRows = data.patterns.map((p) => ({
    name: p.name,
    products: p.products.join("、"),
    comment: p.comment,
  }))

  return (
    <Page title={data.title} meta={["宽带运营商 App"]}>
      <Section title="结论" description="四款 App 报装链路的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="步骤按屏计,输入项按用户需填写的字段计" className="gap-12">
        <Grid cols={9} fields={false} className="items-baseline">
          {KPI_ORDER.map((key) => {
            const k = kpi(key)
            return (
              <Stat
                key={k.key}
                span={2}
                captionBelow
                size={key === "fewest" ? "lg" : undefined}
                value={k.value}
                unit={k.unit}
                label={k.label}
                note={kpiNotes[key]}
              />
            )
          })}
        </Grid>
        <Group title="四款产品对照">
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", span: 2, bar: true },
              { key: "inputs", label: "输入项", span: 2, bar: true },
              { key: "verdict", label: "结论", span: 3 },
            ]}
            rows={data.products}
            caption="步骤数含首页与装机进度页;输入项为整条链路需要用户填写的字段数"
          />
        </Group>
      </Section>

      <Section title="分阶段对比" description="同一步骤在四款 App 上的做法对照">
        <DataTable
          columns={[
            { key: "stage", label: "阶段", span: 1 },
            ...products.map((name) => ({ key: name, label: name, span: 2 })),
          ]}
          rows={data.stages}
        />
      </Section>

      <Section title="报装链路" description="每款 App 从首页到装机进度逐屏,备注标在步骤说明下方">
        <Group>
          {data.chains.flatMap((chain) => [
            <Rule key={`${chain.product}-rule`} label={`${chain.product} · ${chain.version}`} />,
            <FigureStrip key={`${chain.product}-strip`}>
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
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note && <FigureLabel>备注</FigureLabel>}
                  {step.note && <FigureText>{step.note}</FigureText>}
                </Figure>
              ))}
            </FigureStrip>,
          ])}
        </Group>
      </Section>

      <Section title="共性模式" description="多款 App 重复出现的流程做法">
        <DataTable
          columns={[
            { key: "name", label: "模式", span: 2 },
            { key: "products", label: "涉及产品", span: 3 },
            { key: "comment", label: "说明", span: 4 },
          ]}
          rows={patternRows}
        />
      </Section>

      <Section title="问题明细" description="严重度由高到低,证据对回链路步骤">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "severity", label: "严重度", span: 1, levels: SEVERITY_LEVELS },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="每条建议的依据指回上节的问题编号">
        <List
          numbered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail}。依据 ${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "产品与版本",
              value: data.chains.map((c) => `${c.product} ${c.version}`).join("、"),
            },
          ]}
        />
      </Section>
    </Page>
  )
}