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
  Rule,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

export default function Report() {
  const { title, task, scope, date, summary, kpis, products, chains, patterns, issues, suggestions } = data

  const kpi = (key: string) => kpis.find((item) => item.key === key)!
  const fewest = kpi("fewest")
  const productCount = kpi("products")
  const screenCount = kpi("screens")
  const issueCount = kpi("issues")

  const highIssues = issues.filter((issue) => issue.severity === "高").length
  const maxSteps = Math.max(...products.map((product) => product.steps))

  return (
    <Page title={title} meta={["星幕视频、橙果视频", "2026 年 6 月版本 · 2026-06-18"]}>
      <Section title="结论" description="取消自动续费链路的整体判断">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="2 款视频 App · 14 张分析截图 · 2026 年 6 月版本">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={fewest.value}
            unit={fewest.unit}
            captionBelow
            label={fewest.label}
            note={`星幕视频 ${products[0].steps} 步`}
          />
          <Stat span={2} value={productCount.value} unit={productCount.unit} captionBelow label={productCount.label} />
          <Stat
            span={2}
            value={issueCount.value}
            unit={issueCount.unit}
            captionBelow
            label={issueCount.label}
            note={`高 ${highIssues} 个 · 中 ${issues.length - highIssues} 个`}
          />
          <Stat span={2} value={screenCount.value} unit={screenCount.unit} captionBelow label={screenCount.label} />
        </Grid>
      </Section>

      <Section title="分群对比" description="两款 App 的取消步骤数、输入项与结论" className="gap-12">
        <Group title="分群结果">
          <Grid cols={9} fields={false}>
            {products.map((product) => (
              <Stat
                key={product.name}
                span={2}
                value={product.steps}
                unit="步"
                captionBelow
                label={product.name}
                note={`输入 ${product.inputs} 项 · ${product.verdict}`}
              />
            ))}
          </Grid>
        </Group>
        <Group title="取消步骤数">
          <Grid cols={9} fields={false}>
            <Block span={3}>
              <ProgressList
                compact
                items={products.map((product) => ({
                  label: product.name,
                  value: product.steps,
                  max: maxSteps,
                }))}
              />
            </Block>
          </Grid>
        </Group>
      </Section>

      <Section title="共性模式" description="两款 App 链路里重复出现的做法">
        <List
          numbered
          items={patterns.map((pattern) => ({
            title: pattern.name,
            description: `${pattern.comment} 涉及 ${pattern.products.join("、")}。`,
          }))}
        />
      </Section>

      <Section title="链路明细" description="按步骤排开的截图、操作与输入项" className="gap-12">
        {chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步`} />
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
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="3 个问题的产品、步骤与严重度" className="gap-12">
        <Group title="问题清单">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "product", label: "产品", span: 2 },
              { key: "step", label: "步骤", align: "right", span: 1 },
              { key: "title", label: "问题", span: 3 },
              { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
            ]}
            rows={issues.map((issue) => ({
              id: issue.id,
              product: issue.product,
              step: `第 ${issue.step} 步`,
              title: issue.title,
              severity: issue.severity,
            }))}
            caption="严重度分高、中两级;依据见下。"
          />
        </Group>
        <Group title="问题依据">
          <List
            numbered
            items={issues.map((issue) => ({
              title: `${issue.id} · ${issue.product} 第 ${issue.step} 步`,
              description: issue.evidence,
            }))}
          />
        </Group>
      </Section>

      <Section title="下一步" description="两条改动建议与依据">
        <List
          ordered
          items={suggestions.map((suggestion) => ({
            title: `${suggestion.id} · ${suggestion.title}`,
            description: `${suggestion.detail}。依据:${suggestion.basis.join("、")}。`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "范围", value: scope },
            { label: "日期", value: date },
            {
              label: "产品与版本",
              value: chains.map((chain) => `${chain.product} ${chain.version}`).join("、"),
            },
            { label: "分析截图", value: `${screenCount.value} ${screenCount.unit}` },
          ]}
        />
      </Section>
    </Page>
  )
}
