import {
  DataTable,
  Figure,
  FigureImage,
  FigureLabel,
  FigureStrip,
  FigureText,
  Grid,
  KV,
  List,
  Page,
  Rule,
  Section,
  Stat,
  Text,
} from "@/components/report"
import data from "./data.json"

type Step = {
  no: number
  screen: string
  content: string
  action: string
  inputs: number
  note: string
  image: string
}

type Chain = {
  product: string
  version: string
  verdict: string
  steps: Step[]
}

const chains = data.chains as Chain[]

// 核心指标:结论数字(步骤最少 6 步)排首位并放大,其余三项同尺寸排在后面。
const [productsKpi, screensKpi, fewestKpi, issuesKpi] = data.kpis
const stats = [
  { ...fewestKpi, span: 3, size: "lg" as const },
  { ...productsKpi, span: 2, size: undefined },
  { ...screensKpi, span: 2, size: undefined },
  { ...issuesKpi, span: 2, size: undefined },
]

export default function Report() {
  return (
    <Page title={data.title} meta={chains.map((chain) => `${chain.product} ${chain.version}`)}>
      <Section title="结论" description="取消链路的长度与入口位置">
        <Text className="text-2xl leading-9">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的口径与规模">
        <Grid cols={9} fields={false} className="items-baseline">
          {stats.map((stat) => (
            <Stat
              key={stat.key}
              span={stat.span}
              captionBelow
              size={stat.size}
              value={stat.value}
              unit={stat.unit}
              label={stat.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="链路对比" description="每一步的截图与操作" className="gap-12">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 1 },
            { key: "steps", label: "步骤数", span: 1 },
            { key: "inputs", label: "输入项", span: 1 },
            { key: "verdict", label: "结论", span: 6 },
          ]}
          rows={data.products.map((product) => ({
            product: product.name,
            steps: `${product.steps} 步`,
            inputs: `${product.inputs} 项`,
            verdict: product.verdict,
          }))}
        />

        {chains.map((chain) => (
          <div key={chain.product} className="flex flex-col gap-6">
            <Rule label={chain.product} />
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                  <FigureLabel>
                    第 {step.no} 步 · {step.screen}
                  </FigureLabel>
                  <FigureText>{step.content}</FigureText>
                  <FigureText>
                    操作:{step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note && <FigureLabel className="mt-2">备注 · {step.note}</FigureLabel>}
                </Figure>
              ))}
            </FigureStrip>
          </div>
        ))}
      </Section>

      <Section title="共性模式" description="两款 App 在取消链路上重复出现的做法">
        <List
          columns={2}
          items={data.patterns.map((pattern) => ({
            meta: `适用:${pattern.products.join(" / ")}`,
            title: pattern.name,
            description: pattern.comment,
          }))}
        />
      </Section>

      <Section title="问题清单" description="3 个问题,按严重程度排列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["中", "高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            product: issue.product,
            step: `第 ${issue.step} 步`,
            title: issue.title,
            severity: issue.severity,
            evidence: issue.evidence,
          }))}
        />
      </Section>

      <Section title="改进建议" description="依据编号对回问题清单">
        <List
          ordered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} 依据:${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息">
        <KV
          labelCols={1}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}