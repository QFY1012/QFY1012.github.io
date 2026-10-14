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

const SEVERITY = ["高", "中", "低"]

export default function Report() {
  const kpi = (key: string) => data.kpis.find((item) => item.key === key)
  const count = (level: string) =>
    data.issues.filter((issue) => issue.severity === level).length
  const sortedIssues = [...data.issues].sort(
    (a, b) => SEVERITY.indexOf(a.severity) - SEVERITY.indexOf(b.severity),
  )
  const totalSteps = data.products.reduce((sum, p) => sum + p.steps, 0)
  const fewest = data.products.reduce((a, b) => (b.steps < a.steps ? b : a))
  const longest = data.products.reduce((a, b) => (b.inputs > a.inputs ? b : a))
  const most = data.products.reduce((a, b) => (b.steps > a.steps ? b : a))

  return (
    <Page
      title={data.title}
      meta={["4 款宽带运营商 App · 家庭宽带报装", `2026 年 4 月版本 · ${data.date}`]}
    >
      <Section title="结论" description="四款 App 报装全流程的走查结论">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比范围、样本量与问题总数">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={kpi("products")?.value}
            unit={kpi("products")?.unit}
            label={kpi("products")?.label}
            captionBelow
            note="均为 2026 年 4 月版本"
          />
          <Stat
            span={3}
            size="lg"
            value={kpi("screens")?.value}
            unit={kpi("screens")?.unit}
            label={kpi("screens")?.label}
            captionBelow
            note="覆盖报装全流程,每步一屏"
          />
          <Stat
            span={3}
            size="lg"
            value={kpi("issues")?.value}
            unit={kpi("issues")?.unit}
            label={kpi("issues")?.label}
            captionBelow
            note={`高 ${count("高")} 个 · 中 ${count("中")} 个 · 低 ${count("低")} 个`}
          />
        </Grid>
      </Section>

      <Section
        title="产品对比"
        description={`四款 App 的步骤数、输入项与主要判断;${fewest.name} ${fewest.steps} 步最少,${most.name} ${most.steps} 步最多`}
        className="gap-12"
      >
        <Group title="步骤数(步)与输入项">
          <Grid cols={9} fields={false} className="items-baseline">
            {data.products.map((product) => (
              <Stat
                key={product.name}
                span={2}
                value={product.steps}
                unit="步"
                label={
                  product.name === fewest.name
                    ? kpi("fewest")?.label
                    : product.name
                }
                captionBelow
                note={`输入 ${product.inputs} 项 · ${product.verdict}`}
              />
            ))}
          </Grid>
        </Group>
        <Group title="各阶段做法对照">
          <DataTable
            columns={[
              { key: "stage", label: "阶段", span: 1 },
              { key: "星联宽带", label: "星联宽带", span: 2 },
              { key: "云雀通信", label: "云雀通信", span: 2 },
              { key: "长风云网", label: "长风云网", span: 2 },
              { key: "磐石宽带", label: "磐石宽带", span: 2 },
            ]}
            rows={data.stages}
            caption="表中“第 n 步”为报装流程中的屏序;四款产品的阶段划分相同,差异在于各阶段占几屏、几步。"
          />
        </Group>
      </Section>

      <Section title="共性模式" description="四款产品反复出现的流程套路,以及它带来的隐患">
        <List
          columns={2}
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: pattern.comment,
            meta: `${pattern.products.length} 款 · ${pattern.products.join("、")}`,
          }))}
        />
      </Section>

      <Section
        title="链路明细"
        description={`${data.products.length} 款产品共 ${totalSteps} 步,每步一屏共 ${kpi("screens")?.value} 张截图,按报装顺序横向排列`}
        className="gap-12"
      >
        {data.chains.map((chain) => (
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

      <Section
        title="问题清单"
        description={`共 ${data.issues.length} 个问题,按严重度排序:高 ${count("高")} 个、中 ${count("中")} 个、低 ${count("低")} 个`}
      >
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={sortedIssues.map((issue) => ({
            id: issue.id,
            title: issue.title,
            evidence: issue.evidence,
            product: issue.product,
            step: `第 ${issue.step} 步`,
            severity: issue.severity,
          }))}
          caption={`严重度按对下单结果的影响排:高 ${count("高")} 个、中 ${count("中")} 个、低 ${count("低")} 个;P7 为四款产品共有的问题。`}
        />
      </Section>

      <Section title="改进建议" description="5 条改法,每条注明依据的问题编号">
        <List
          numbered
          columns={3}
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: suggestion.detail,
            meta: `依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与样本口径">
        <KV
          labelCols={2}
          items={[
            { label: "分析任务", value: data.task },
            { label: "覆盖范围", value: data.scope },
            {
              label: "对比产品",
              value: data.chains
                .map((chain) => `${chain.product} ${chain.version}`)
                .join("、"),
            },
            {
              label: "样本量",
              value: `${totalSteps} 步 ${kpi("screens")?.value} 张截图,每步一屏;输入项最多为长风云网 ${longest.inputs} 项`,
            },
            { label: "报告日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}