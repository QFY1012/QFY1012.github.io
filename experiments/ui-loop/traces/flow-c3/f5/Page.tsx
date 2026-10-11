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

// G1:问题明细与链路明细用同一套「位置」写法互相指向
const issueAt = (product: string, step: number) =>
  data.issues.find((issue) => issue.product === product && issue.step === step)

// G1:命中问题、但在 steps 里没有 image 的步骤,在 FigureStrip 前用一行 Text 列出
const missingImageIssues = (chain: (typeof data.chains)[number]) =>
  data.issues
    .filter(
      (issue) =>
        issue.product === chain.product &&
        !chain.steps.some((step) => step.no === issue.step && step.image),
    )
    .sort((a, b) => a.step - b.step)
    .map((issue) => {
      const screen = chain.steps.find((step) => step.no === issue.step)?.screen
      return `${issue.id} 第 ${issue.step} 步${screen ? ` · ${screen}` : ""}`
    })

const orderedIssues = data.issues
  .map((issue, index) => ({ issue, index }))
  .sort((a, b) => {
    const ai = data.chains.findIndex((chain) => chain.product === a.issue.product)
    const bi = data.chains.findIndex((chain) => chain.product === b.issue.product)
    const av = ai === -1 ? Number.MAX_SAFE_INTEGER : ai
    const bv = bi === -1 ? Number.MAX_SAFE_INTEGER : bi
    if (av !== bv) return av - bv
    if (a.issue.step !== b.issue.step) return a.issue.step - b.issue.step
    return a.index - b.index
  })
  .map(({ issue }) => {
    const screen = data.chains
      .find((chain) => chain.product === issue.product)
      ?.steps.find((step) => step.no === issue.step)?.screen
    return {
      ...issue,
      where: screen
        ? `${issue.product} 第 ${issue.step} 步 · ${screen}`
        : `${issue.product} 第 ${issue.step} 步`,
    }
  })

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
        description="三款 App 从进入退货到提交成功的完整步骤,命中问题的步骤标注问题编号"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group
            key={chain.product}
            title={`${chain.product} · ${chain.version} · ${chain.verdict}`}
          >
            {missingImageIssues(chain).length > 0 && (
              <Text>{missingImageIssues(chain).join("、")}</Text>
            )}
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                  />
                  <FigureLabel>
                    {`第 ${step.no} 步 · ${step.screen}${
                      issueAt(chain.product, step.no) ? ` · ${issueAt(chain.product, step.no)!.id}` : ""
                    }`}
                  </FigureLabel>
                  <FigureText>{stepText(step)}</FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section
        title="发现问题"
        description="走查中发现的问题,位置与链路明细对应,严重度按影响范围评定"
      >
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "where", label: "位置", span: 3 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={orderedIssues}
          caption="位置写作「产品 第 N 步 · 屏名」,与链路明细的步骤标注一致"
        />
      </Section>

      <Section title="下一步" description="三条改造建议及依据">
        <List
          columns={3}
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail ? `${suggestion.detail} · ` : ""}依据:${suggestion.basis.join("、")}`,
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
