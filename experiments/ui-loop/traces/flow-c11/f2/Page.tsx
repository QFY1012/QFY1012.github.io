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
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

export default function Report() {
  const productRows = data.chains.map((chain) => ({
    name: chain.product,
    version: chain.version,
    steps: chain.steps.length,
    verdict: chain.verdict,
  }))

  const issueRows = data.issues.map((issue) => ({
    id: issue.id,
    product: issue.product,
    step: issue.step,
    title: issue.title,
    severity: issue.severity,
    evidence: issue.evidence,
  }))

  const noteRows = data.chains.flatMap((chain) =>
    chain.steps
      .filter((step) => step.note)
      .map((step) => ({
        product: chain.product,
        step: step.no,
        note: step.note,
      })),
  )

  return (
    <Page title={data.title} meta={[data.scope, data.date, data.task]}>
      <Section
        title="结论"
        description="两款 App 下单链路的核心差别"
        className="gap-12"
      >
        <Group>
          <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
        </Group>
        <Group title="核心指标">
          <Grid cols={12} fields={false} className="items-baseline">
            {data.kpis.map((kpi) => (
              <Stat
                key={kpi.key}
                span={3}
                size="lg"
                value={kpi.value}
                unit={kpi.unit}
                label={kpi.label}
                captionBelow
              />
            ))}
          </Grid>
        </Group>
      </Section>

      <Section title="产品对比" description="按产品看步骤数与链路判断">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "version", label: "版本", span: 1 },
            { key: "steps", label: "步骤数", span: 2, align: "right", bar: true },
            { key: "verdict", label: "链路判断", span: 4 },
          ]}
          rows={productRows}
        />
      </Section>

      <Section
        title="链路明细"
        description="从购物车到支付成功的逐步截图"
        className="gap-12"
      >
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
                  <FigureText>
                    {step.inputs > 0
                      ? `${step.content} · ${step.action} · 输入 ${step.inputs} 项`
                      : `${step.content} · ${step.action}`}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
        <Group title="步骤备注">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 2 },
              { key: "step", label: "步骤", span: 1, align: "right" },
              { key: "note", label: "备注", span: 6 },
            ]}
            rows={noteRows}
          />
        </Group>
      </Section>

      <Section title="问题" description="链路中发现的可用性问题">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1, align: "right" },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="基于对比与问题给出的改进建议">
        <List
          columns={3}
          numbered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} · 依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>
    </Page>
  )
}
