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

function stepText(step: (typeof data.chains)[number]["steps"][number]) {
  const base = `${step.content} · ${step.action} · 输入 ${step.inputs} 项`
  return step.note ? `${base} · ${step.note}` : base
}

export default function Report() {
  const issueRows = data.issues.map((issue) => ({
    id: issue.id,
    where: `${issue.product} 第 ${issue.step} 步`,
    title: issue.title,
    evidence: issue.evidence,
    severity: issue.severity,
  }))

  return (
    <Page title={data.title} meta={["协作宝 7.2 · 链工 4.6", "2026 年第三季度"]}>
      <Section title="结论" description="两款产品的完成路径与代价">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的范围与结果计数">
        <Grid cols={12} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={12 / data.kpis.length}
              size="lg"
              captionBelow
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="流程对比" description="整体步数与分环节做法对照" className="gap-12">
        <Group title="整体">
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 2 },
              { key: "steps", label: "步数", span: 2, align: "right" },
              { key: "inputs", label: "输入项", span: 2, align: "right" },
              { key: "verdict", label: "做法", span: 3 },
            ]}
            rows={data.products}
          />
        </Group>
        <Group title="分环节">
          <DataTable
            columns={[
              { key: "stage", label: "环节", span: 3 },
              { key: "协作宝", label: "协作宝", span: 3 },
              { key: "链工", label: "链工", span: 3 },
            ]}
            rows={data.stages}
          />
        </Group>
      </Section>

      <Section title="链路明细" description="逐屏截图与每步操作,共 13 张" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
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
                  <FigureText>{stepText(step)}</FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题" description="按严重度排列的 4 个问题">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "where", label: "位置", span: 2 },
            { key: "title", label: "问题", span: 3 },
            { key: "evidence", label: "依据", span: 2 },
            { key: "severity", label: "严重", span: 1, tone: ["高"] },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="三条改造建议">
        <List
          columns={3}
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: suggestion.detail,
            meta: `依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与走查日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            {
              label: "产品",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join(" · "),
            },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
