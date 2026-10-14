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

const KPI_ORDER = ["fewest", "issues", "products", "screens"]
const KPI_SPAN = { fewest: 3, issues: 2, products: 2, screens: 2 }

export default function Report() {
  const kpis = KPI_ORDER.map((key) => data.kpis.find((k) => k.key === key)).filter(
    (k): k is (typeof data.kpis)[number] => Boolean(k),
  )

  const productRows = data.products.map((p) => ({
    product: p.name,
    steps: p.steps,
    inputs: p.inputs,
    verdict: p.verdict,
  }))

  const issueRows = data.issues.map((i) => ({
    id: i.id,
    product: i.product,
    step: `第 ${i.step} 步`,
    title: i.title,
    evidence: i.evidence,
    severity: i.severity,
  }))

  return (
    <Page title={data.title} meta={[data.task, data.scope]}>
      <Section title="结论" description="下单支付链路的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的规模与发现">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((k) => (
            <Stat
              key={k.key}
              span={KPI_SPAN[k.key as keyof typeof KPI_SPAN]}
              size={k.key === "fewest" ? "lg" : undefined}
              captionBelow
              value={k.value}
              unit={k.unit}
              label={k.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="两款 App 的步骤数、手填项数与结论">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2 },
            { key: "inputs", label: "手填项数", align: "right", span: 2 },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={productRows}
        />
      </Section>

      <Section title="链路明细" description="每个产品一组,按步骤顺序横向排开">
        <Group>
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
                    {step.note ? <FigureText>{step.note}</FigureText> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="问题清单" description="按严重度从高到低">
        <DataTable
          caption="问题编号 P1–P3;下一步建议的依据按编号对回本表条目。"
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="两条建议,依据对回问题编号">
        <List
          numbered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} · 依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "报告日期", value: data.date },
            { label: "对比产品", value: data.products.map((p) => p.name).join("、") },
            { label: "分析截图", value: `${data.kpis.find((k) => k.key === "screens")?.value} 张` },
          ]}
        />
      </Section>
    </Page>
  )
}
