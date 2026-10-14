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

const kpi = (key: string) => data.kpis.find((item) => item.key === key)!

export default function Report() {
  return (
    <Page title={data.title} meta={["2 款智能音箱 App", "2026 年 3 月版本"]}>
      <Section title="结论" description="两款 App 的配网流程对比">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="规模与结果" className="gap-12">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={kpi("products").value}
            unit={kpi("products").unit}
            label={kpi("products").label}
          />
          <Stat
            span={3}
            size="lg"
            value={kpi("screens").value}
            unit={kpi("screens").unit}
            label={kpi("screens").label}
          />
        </Grid>
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
          />
          <Stat
            span={3}
            size="lg"
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
          />
        </Grid>
      </Section>

      <Section title="分产品" description="步骤数、输入项与判定">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2 },
            { key: "verdict", label: "判定", span: 3 },
          ]}
          rows={data.products.map((product) => ({
            product: product.name,
            steps: product.steps,
            inputs: product.inputs,
            verdict: product.verdict,
          }))}
        />
      </Section>

      <Section title="阶段对比" description="按配网阶段对比两款 App 的做法">
        <DataTable
          columns={[
            { key: "stage", label: "阶段", span: 3 },
            { key: "p1", label: "聆动音箱", span: 3 },
            { key: "p2", label: "云雀音箱", span: 3 },
          ]}
          rows={data.stages.map((stage) => ({
            stage: stage.stage,
            p1: stage["聆动音箱"],
            p2: stage["云雀音箱"],
          }))}
        />
      </Section>

      <Section
        title="链路明细"
        description="两款 App 的完整步骤,共 13 屏"
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
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                    {step.note ? ` · 备注:${step.note}` : ""}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="发现" description="两款 App 共 3 个问题,2 个为高">
        <List
          numbered
          metaTone="destructive"
          items={data.issues.map((issue) => ({
            title: `${issue.id} · ${issue.title}`,
            description: `${issue.product} 第 ${issue.step} 步 · ${issue.evidence}`,
            meta: issue.severity,
          }))}
        />
      </Section>

      <Section title="下一步" description="3 条改进建议">
        <List
          numbered
          columns={3}
          items={data.suggestions.map((suggestion) => ({
            title: `${suggestion.id} · ${suggestion.title}`,
            description: suggestion.detail,
            meta: `依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "产品", value: "聆动音箱 3.2.0、云雀音箱 1.8.5" },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}