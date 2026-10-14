import data from "./data.json"
import {
  Page,
  Section,
  Grid,
  Group,
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

type Kpi = { key: string; label: string; value: number; unit: string }

const kpiMap: Record<string, Kpi> = {}
for (const k of data.kpis) kpiMap[k.key] = k

const lead = kpiMap["fewest"]!
const products = kpiMap["products"]!
const issues = kpiMap["issues"]!
const shots = kpiMap["screens"]!

const chainA = data.chains[0]
const chainB = data.chains[1]

const severeCount = data.issues.filter((i) => i.severity === "高").length
const midCount = data.issues.filter((i) => i.severity === "中").length

const productNote = `${chainA.product} ${chainA.steps.length} 步`
const versionNote = `${chainA.product} ${chainA.version} · ${chainB.product} ${chainB.version}`
const issueNote = `高 ${severeCount} 个 · 中 ${midCount} 个`
const shotNote = `${chainA.product} ${chainA.steps.length} 张 · ${chainB.product} ${chainB.steps.length} 张`

export default function Report() {
  return (
    <Page title={data.title} meta={["智能音箱 App", "2026 年 3 月"]}>
      <Section
        title="结论"
        description="智能音箱接入 Wi-Fi 并绑定 App 的流程对比"
      >
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section
        title="核心指标"
        description={`${products.value} 款 App、${shots.value} 屏截图的规模与结果`}
      >
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={lead.value}
            unit={lead.unit}
            label={lead.label}
            note={productNote}
          />
          <Stat
            span={2}
            captionBelow
            value={products.value}
            unit={products.unit}
            label={products.label}
            note={versionNote}
          />
          <Stat
            span={2}
            captionBelow
            value={issues.value}
            unit={issues.unit}
            label={issues.label}
            note={issueNote}
          />
          <Stat
            span={2}
            captionBelow
            value={shots.value}
            unit={shots.unit}
            label={shots.label}
            note={shotNote}
          />
        </Grid>
      </Section>

      <Section title="产品对比" description="步骤数、输入项与结论,按产品并排">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={data.products}
        />
      </Section>

      <Section title="阶段对比" description={`同一任务在 ${data.stages.length} 个阶段上的做法差异`}>
        <DataTable
          columns={[
            { key: "stage", label: "阶段", span: 3 },
            { key: chainA.product, label: `${chainA.product} ${chainA.version}`, span: 3 },
            { key: chainB.product, label: `${chainB.product} ${chainB.version}`, span: 3 },
          ]}
          rows={data.stages}
        />
      </Section>

      <Section
        title="链路明细"
        description={`按产品分组,一屏一格,共 ${shots.value} 屏`}
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version} · ${chain.verdict}`} />
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
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description={`${issues.value} 个问题,高 ${severeCount} 个、中 ${midCount} 个`}>
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={data.issues}
        />
      </Section>

      <Section title="下一步" description="建议依据对回问题编号">
        <List
          ordered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} · 依据:${s.basis.join("、")}`,
            meta: s.id,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围、版本与日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "对比范围", value: data.scope },
            { label: "产品与版本", value: versionNote },
            { label: "分析日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
