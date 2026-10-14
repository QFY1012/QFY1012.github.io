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

export default function Report() {
  const { title, task, scope, date, summary, kpis, products, chains, stages, issues, suggestions } =
    data as any

  const productRows = products.map((p: any) => ({
    product: p.name,
    steps: p.steps,
    inputs: p.inputs,
    path: p.verdict,
  }))

  const stageRows = stages.map((s: any) => ({
    stage: s.stage,
    a: s["协作宝"],
    b: s["链工"],
  }))

  const issueRows = issues.map((it: any) => ({
    id: it.id,
    product: it.product,
    step: `第 ${it.step} 步`,
    title: it.title,
    severity: it.severity,
    evidence: it.evidence,
  }))

  const suggestionItems = suggestions.map((s: any) => ({
    title: s.title,
    description: `${s.detail}。依据:${s.basis.join("、")}`,
  }))

  return (
    <Page title={title} meta={["协同办公平台", "2026 年第三季度"]}>
      <Section title="结论" description="两款产品的路径判断">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的规模与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={kpis[2].value}
            unit={kpis[2].unit}
            label={kpis[2].label}
            size="lg"
            captionBelow
            note="协作宝 8 步"
          />
          <Stat span={2} value={kpis[0].value} unit={kpis[0].unit} label={kpis[0].label} captionBelow />
          <Stat span={2} value={kpis[3].value} unit={kpis[3].unit} label={kpis[3].label} captionBelow />
          <Stat span={2} value={kpis[1].value} unit={kpis[1].unit} label={kpis[1].label} captionBelow />
        </Grid>
      </Section>

      <Section title="拆分" description="按产品与环节对照" className="gap-12">
        <Group title="两款产品的路径">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2 },
              { key: "inputs", label: "输入项数", align: "right", span: 2 },
              { key: "path", label: "路径特点", span: 3 },
            ]}
            rows={productRows}
          />
        </Group>
        <Group title="按环节对照">
          <DataTable
            columns={[
              { key: "stage", label: "环节", span: 3 },
              { key: "a", label: "协作宝", span: 3 },
              { key: "b", label: "链工", span: 3 },
            ]}
            rows={stageRows}
          />
        </Group>
      </Section>

      <Section title="明细" description="发现的问题与逐步界面" className="gap-12">
        <Group title="发现的问题">
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
            caption="严重度从低到高排列,最高一级标红加粗"
          />
        </Group>
        <Group title="流程链路">
          <Rule label={`${chains[0].product} · ${chains[0].version}`} />
          <FigureStrip>
            {chains[0].steps.map((step: any) => (
              <Figure key={step.no}>
                <FigureImage
                  src={step.image}
                  alt={`${chains[0].product} 第 ${step.no} 步:${step.screen}`}
                />
                <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                <FigureText>
                  {step.content} · {step.action} · 输入 {step.inputs} 项
                  {step.note ? ` · ${step.note}` : ""}
                </FigureText>
              </Figure>
            ))}
          </FigureStrip>
          <Rule label={`${chains[1].product} · ${chains[1].version}`} />
          <FigureStrip>
            {chains[1].steps.map((step: any) => (
              <Figure key={step.no}>
                <FigureImage
                  src={step.image}
                  alt={`${chains[1].product} 第 ${step.no} 步:${step.screen}`}
                />
                <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                <FigureText>
                  {step.content} · {step.action} · 输入 {step.inputs} 项
                  {step.note ? ` · ${step.note}` : ""}
                </FigureText>
              </Figure>
            ))}
          </FigureStrip>
        </Group>
      </Section>

      <Section title="下一步" description="依据链路与问题给出的改进建议">
        <List numbered items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "范围", value: scope },
            {
              label: "产品版本",
              value: chains.map((c: any) => `${c.product} ${c.version}`).join(" · "),
            },
            { label: "日期", value: date },
          ]}
        />
      </Section>
    </Page>
  )
}