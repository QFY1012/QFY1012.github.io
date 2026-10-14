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

const kpi = Object.fromEntries(data.kpis.map((k) => [k.key, k]))

export default function Report() {
  const [a, b] = data.products
  const [chainA, chainB] = data.chains

  return (
    <Page title={data.title} meta={[data.scope, data.date]}>
      <Section title="结论" description="两款产品预订会议室的思路相反">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次分析的范围与发现">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat span={3} size="lg" captionBelow value={kpi.fewest.value} unit={kpi.fewest.unit} label={kpi.fewest.label} />
          <Stat span={2} captionBelow value={kpi.issues.value} unit={kpi.issues.unit} label={kpi.issues.label} />
          <Stat span={2} captionBelow value={kpi.products.value} unit={kpi.products.unit} label={kpi.products.label} />
          <Stat span={2} captionBelow value={kpi.screens.value} unit={kpi.screens.unit} label={kpi.screens.label} />
        </Grid>
      </Section>

      <Section title="产品对比" description="两款产品各需几步、各填几项">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 1 },
            { key: "inputs", label: "输入项", align: "right", span: 1 },
            { key: "verdict", label: "预订思路", span: 5 },
          ]}
          rows={data.products.map((p) => ({ name: p.name, steps: p.steps, inputs: p.inputs, verdict: p.verdict }))}
        />
      </Section>

      <Section title="阶段对比" description="同一阶段,两款产品的做法不同">
        <DataTable
          columns={[
            { key: "stage", label: "阶段", span: 3 },
            { key: "a", label: a.name, span: 3 },
            { key: "b", label: b.name, span: 3 },
          ]}
          rows={data.stages.map((s) => ({ stage: s.stage, a: s["协作宝"], b: s["链工"] }))}
        />
      </Section>

      <Section title="流程链路" description="每一步一屏,按操作顺序排列" className="gap-12">
        {[chainA, chainB].map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version}`} />
            <FigureStrip>
              {chain.steps.map((s) => (
                <Figure key={s.no}>
                  <FigureImage src={s.image} alt={`${chain.product} 第 ${s.no} 步:${s.screen}`} />
                  <FigureLabel>第 {s.no} 步 · {s.screen}</FigureLabel>
                  <FigureText>{[s.content, s.action, `输入 ${s.inputs} 项`, s.note].filter(Boolean).join(" · ")}</FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题清单" description={`共 ${data.issues.length} 个,按严重度从高到低`}>
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "evidence", label: "依据", span: 3 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={data.issues.map((it) => ({
            product: it.product,
            step: it.step,
            title: it.title,
            evidence: it.evidence,
            severity: it.severity,
          }))}
        />
      </Section>

      <Section title="下一步" description="按优先级排列,依据写在每条里">
        <List
          numbered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} · 依据 ${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="分析口径与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "对比产品", value: `${a.name} ${chainA.version}、${b.name} ${chainB.version}` },
            { label: "分析截图", value: `${kpi.screens.value} 张` },
          ]}
        />
      </Section>
    </Page>
  )
}