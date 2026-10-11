import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Block,
  Text,
  Stat,
  DataTable,
  ProgressList,
  List,
  KV,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

const stepText = (step: (typeof data.chains)[number]["steps"][number]) =>
  `${step.content} · ${step.action} · 输入 ${step.inputs} 项${step.note ? ` · ${step.note}` : ""}`

const issueLabelsFor = (product: string, stepNo: number) =>
  data.issues
    .filter(
      (issue) =>
        (issue.product === product || issue.product === "全部") && issue.step === stepNo,
    )
    .map((issue) => `${issue.id} ${issue.severity}`)

const chunk = <T,>(items: T[], size: number) =>
  items.reduce<T[][]>((rows, item, index) => {
    if (index % size === 0) rows.push([])
    rows[rows.length - 1].push(item)
    return rows
  }, [])

const screenFor = (product: string, stepNo: number) =>
  data.chains
    .find((chain) => chain.product === product)
    ?.steps.find((step) => step.no === stepNo)?.screen ?? ""

const whereFor = (issue: (typeof data.issues)[number]) => {
  if (issue.product !== "全部") {
    return `${issue.product} · 第 ${issue.step} 步 · ${screenFor(issue.product, issue.step)}`
  }
  const screens = Array.from(
    new Set(
      data.chains
        .map((chain) => chain.steps.find((step) => step.no === issue.step)?.screen)
        .filter((screen): screen is string => Boolean(screen)),
    ),
  )
  return `全部产品 · 第 ${issue.step} 步${screens.length ? ` · ${screens.join("、")}` : ""}`
}

const basisLabel = (basis: string) => {
  const issue = data.issues.find((item) => item.id === basis)
  if (issue) {
    const product = issue.product === "全部" ? "全部产品" : issue.product
    return `${issue.id} · ${product} 第 ${issue.step} 步 · ${screenFor(issue.product, issue.step)}`
  }
  const match = basis.match(/^(.+?)第\s*(\d+)\s*步$/)
  if (match) {
    const screen = screenFor(match[1], Number(match[2]))
    return screen ? `${basis} · ${screen}` : basis
  }
  return basis
}

export default function Report() {
  return (
    <Page title={data.title} meta={[data.task, data.scope, data.date]}>
      <Section title="结论" description="三款电商 App 退货流程的一句话判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比产品、分析截图与步骤数的整体口径">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              size={kpi.key === "fewest" ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="分群对比" description="按产品看退货步骤数与输入项">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.products.map((product) => (
            <Stat
              key={product.name}
              span={2}
              value={product.steps}
              unit="步"
              label={product.name}
              captionBelow
              note={`输入项 ${product.inputs} 项 · ${product.verdict}`}
            />
          ))}
        </Grid>
      </Section>

      <Section title="共同模式" description="三款 App 中可复用的做法">
        <Grid cols={9}>
          <Block span={3} rows={2} title="覆盖产品数">
            <ProgressList
              compact
              items={data.patterns.map((pattern) => ({
                label: pattern.name,
                value: pattern.products.length,
                max: 3,
                display: `${pattern.products.length} 款`,
              }))}
            />
          </Block>
          <Block span={6} rows={2} title="做法说明">
            <List
              items={data.patterns.map((pattern) => ({
                title: pattern.name,
                description: `${pattern.products.join("、")} · ${pattern.comment}`,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section
        title="链路明细"
        description="三款 App 从进入退货到提交成功的完整步骤"
        className="gap-12"
      >
        {Array.from(
          { length: Math.max(...data.chains.map((chain) => chain.steps.length)) },
          (_, index) => index + 1,
        ).map((stepNo) => {
          const entries = data.chains.flatMap((chain) => {
            const step = chain.steps.find((item) => item.no === stepNo)
            return step ? [{ chain, step }] : []
          })
          return (
            <Group key={stepNo} title={`第 ${stepNo} 步`}>
              {chunk(entries, 3).map((rowEntries, rowIndex) => (
                <FigureStrip key={rowIndex}>
                  {rowEntries.map(({ chain, step }) => {
                    const issueLabels = issueLabelsFor(chain.product, step.no)
                    return (
                      <Figure key={chain.product}>
                        <FigureImage
                          src={step.image}
                          alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                        />
                        <FigureLabel>
                          {chain.product} · 第 {step.no} 步 · {step.screen}
                          {issueLabels.length > 0 ? ` · ${issueLabels.join("、")}` : ""}
                        </FigureLabel>
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

      <Section title="问题清单" description="走查中发现的问题,按严重度标注">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "where", label: "位置", span: 3 },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重度", span: 2, tone: ["高"] },
          ]}
          rows={data.issues.map((issue) => ({
            ...issue,
            title: `${issue.title} · ${issue.evidence}`,
            where: whereFor(issue),
          }))}
          caption="严重度按影响范围与阻塞程度评定"
        />
      </Section>

      <Section title="下一步" description="三条改造建议及依据">
        <List
          columns={3}
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail ? `${suggestion.detail} · ` : ""}依据:${suggestion.basis
              .map(basisLabel)
              .join(";")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "产品版本",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join(" · "),
            },
          ]}
        />
      </Section>
    </Page>
  )
}
