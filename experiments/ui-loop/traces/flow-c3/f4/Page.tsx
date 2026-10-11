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

type Chain = (typeof data.chains)[number]
type Step = Chain["steps"][number]
type Issue = (typeof data.issues)[number]

function screenOf(product: string, step: number) {
  const chain = data.chains.find((item) => item.product === product)
  return chain?.steps.find((item) => item.no === step)?.screen ?? ""
}

function issueWhere(issue: Issue) {
  if (issue.product === "全部") {
    const screens = [
      ...new Set(
        data.chains
          .map((chain) => screenOf(chain.product, issue.step))
          .filter((screen) => screen !== ""),
      ),
    ]
    return `全部产品 · 第 ${issue.step} 步${screens.length > 0 ? ` · ${screens.join("、")}` : ""}`
  }
  const screen = screenOf(issue.product, issue.step)
  return `${issue.product} · 第 ${issue.step} 步${screen ? ` · ${screen}` : ""}`
}

function basisText(basis: string) {
  const issue = data.issues.find((item) => item.id === basis)
  if (issue) {
    return `${issue.id} · ${issue.product} 第 ${issue.step} 步 · ${screenOf(
      issue.product,
      issue.step,
    )}`
  }
  const match = basis.match(/^(.+?第\s*[0-9]+(?:\s*[、,，]\s*[0-9]+)*\s*步)$/)
  if (match) {
    const nos = match[1].match(/[0-9]+/g) ?? []
    const product = match[1].split("第")[0]
    const screens = nos
      .map((no) => screenOf(product, Number(no)))
      .filter((screen) => screen !== "")
    return screens.length > 0 ? `${basis} · ${screens.join("、")}` : basis
  }
  return basis
}

function stepText(step: Step) {
  const base = `${step.content} · ${step.action} · 输入 ${step.inputs} 项`
  return step.note ? `${base} · ${step.note}` : base
}

function stepIssues(product: string, step: Step) {
  return data.issues.filter(
    (issue) =>
      (issue.product === product || issue.product === "全部") && issue.step === step.no,
  )
}

function chunk<T>(items: T[], size: number) {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size))
  }
  return rows
}

export default function Report() {
  const issueRows = data.issues.map((issue) => ({
    id: issue.id,
    where: issueWhere(issue),
    title: `${issue.title}(${issue.evidence})`,
    severity: issue.severity,
  }))

  return (
    <Page title={data.title} meta={["协作宝 7.2 · 链工 4.6", "2026 年第三季度"]}>
      <Section title="结论" description="两款产品的完成路径与代价">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的范围与结果计数">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
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
        {Array.from(
          { length: Math.max(...data.chains.map((chain) => chain.steps.length)) },
          (_, index) => index + 1,
        ).map((no) => {
          const entries = data.chains
            .map((chain) => ({
              chain,
              step: chain.steps.find((item) => item.no === no),
            }))
            .filter((entry): entry is { chain: Chain; step: Step } => Boolean(entry.step))
          return (
            <Group key={no} title={`第 ${no} 步`}>
              {chunk(entries, 3).map((row, rowIndex) => (
                <FigureStrip key={rowIndex}>
                  {row.map(({ chain, step }) => {
                    const issues = stepIssues(chain.product, step)
                    const label = `${chain.product} · 第 ${step.no} 步 · ${step.screen}${
                      issues.length > 0
                        ? ` · ${issues
                            .map((issue) => `${issue.id} ${issue.severity}`)
                            .join("、")}`
                        : ""
                    }`
                    return (
                      <Figure key={chain.product}>
                        <FigureImage
                          src={step.image}
                          alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                        />
                        <FigureLabel>{label}</FigureLabel>
                        <FigureText>{stepText(step)}</FigureText>
                      </Figure>
                    )
                  })}
                </FigureStrip>
              ))}
            </Group>
          )
        })}
      </Section>

      <Section title="问题清单" description="4 个问题的位置与严重度">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "where", label: "位置", span: 3 },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重度", span: 2, tone: ["高"] },
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
            description: `${suggestion.detail} 依据:${suggestion.basis
              .map(basisText)
              .join(";")}`,
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
