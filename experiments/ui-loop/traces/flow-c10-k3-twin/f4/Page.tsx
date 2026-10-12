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

const kpiCols = 12 / data.kpis.length

export default function Report() {
  return (
    <Page
      title={data.title}
      meta={["协作宝 7.2 / 链工 4.6", "2026 年第三季度版本"]}
    >
      <Section title="背景信息" description="本次走查的任务、范围与时间">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>

      <Section title="结论" description="两款产品的预订思路相反">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与产出">
        <Grid cols={12} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={kpiCols}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              size="lg"
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="链路明细"
        description="从入口到预订成功的完整步骤"
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
                    {step.content} · {step.action}
                    {step.inputs > 0 ? ` · 输入 ${step.inputs} 项` : ""}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section
        title="流程对比"
        description="产品总览与分阶段做法对照"
        className="gap-12"
      >
        <Group title="产品总览">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 2 },
              { key: "steps", label: "步骤", span: 1, align: "right" },
              { key: "inputs", label: "输入项", span: 1, align: "right" },
              { key: "verdict", label: "思路", span: 5 },
            ]}
            rows={data.products.map((product) => ({
              product: product.name,
              steps: product.steps,
              inputs: product.inputs,
              verdict: product.verdict,
            }))}
          />
        </Group>
        <Group title="分阶段对比">
          <DataTable
            columns={[
              { key: "stage", label: "阶段", span: 3 },
              { key: "a", label: "协作宝", span: 3 },
              { key: "b", label: "链工", span: 3 },
            ]}
            rows={data.stages.map((stage) => ({
              stage: stage.stage,
              a: stage["协作宝"],
              b: stage["链工"],
            }))}
          />
        </Group>
      </Section>

      <Section title="明细" description="链路各步的走查备注">
        <Group title="步骤备注">
          <DataTable
            caption="只列有备注的步骤,备注为走查时观察到的现象。"
            columns={[
              { key: "product", label: "产品", span: 2 },
              { key: "step", label: "步骤", span: 1, align: "right" },
              { key: "screen", label: "屏", span: 2 },
              { key: "note", label: "备注", span: 4 },
            ]}
            rows={data.chains.flatMap((chain) =>
              chain.steps
                .filter((step) => step.note !== "")
                .map((step) => ({
                  product: chain.product,
                  step: step.no,
                  screen: step.screen,
                  note: step.note,
                })),
            )}
          />
        </Group>
      </Section>

      <Section title="发现" description="4 个问题都出在协作宝">
        <List
          numbered
          items={data.issues.map((issue) => ({
            title: issue.title,
            description: `严重度 ${issue.severity} · ${issue.product} 第 ${issue.step} 步 · ${issue.evidence}`,
          }))}
        />
      </Section>

      <Section title="下一步" description="三条改进建议及依据">
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
    </Page>
  )
}
