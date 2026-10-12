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

const versionOf = (name: string) =>
  data.chains.find((chain) => chain.product === name)?.version ?? ""

export default function Report() {
  return (
    <Page title={data.title} meta={["快送 · 小橙", "2026 年 9 月"]}>
      <Section title="背景信息" description="任务、范围与日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>

      <Section title="结论" description="两款 App 下单链路的主要差别">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与结果">
        <Grid cols={12} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              size="lg"
              span={3}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="同一任务,两款 App 的步骤数与结论">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.products.map((product) => (
            <Stat
              key={product.name}
              value={product.steps}
              unit="步"
              label={`${product.name} ${versionOf(product.name)}`}
              captionBelow
              note={product.verdict}
              span={2}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="链路明细"
        description="每一步的界面、操作与输入项"
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
          <List
            items={data.chains.flatMap((chain) =>
              chain.steps
                .filter((step) => step.note)
                .map((step) => ({
                  title: `${chain.product} 第 ${step.no} 步 · ${step.screen}`,
                  description: step.note,
                }))
            )}
          />
        </Group>
      </Section>

      <Section title="问题明细" description="3 个问题,均出现在快送链路">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "evidence", label: "证据", span: 2 },
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

      <Section title="下一步" description="按依据给出的两条改动建议">
        <List
          numbered
          columns={2}
          items={data.suggestions.map((item) => ({
            title: item.title,
            description: `${item.detail} · 依据 ${item.basis.join("、")}`,
          }))}
        />
      </Section>
    </Page>
  )
}
