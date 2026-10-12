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

const versionOf = (product: string) =>
  data.chains.find((chain) => chain.product === product)?.version ?? ""

export default function Report() {
  return (
    <Page title={data.title} meta={["快送 / 小橙", "2026 年 9 月版本"]}>
      <Section title="背景信息" description="本次挖掘的任务、范围与日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>

      <Section title="结论">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次分析的对象与产出">
        <Grid cols={12} fields={false}>
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
      </Section>

      <Section title="产品对比" description="下单步骤数,单位:步">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2 },
            { key: "verdict", label: "结论", span: 5 },
          ]}
          rows={data.products.map((product) => ({
            name: `${product.name} · ${versionOf(product.name)}`,
            steps: `${product.steps} 步`,
            verdict: product.verdict,
          }))}
        />
      </Section>

      <Section
        title="链路明细"
        description="每步一屏,按操作顺序从左到右"
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
            <Text>
              {`备注:${chain.steps
                .filter((step) => step.note)
                .map((step) => `第 ${step.no} 步 ${step.note}`)
                .join(";")}`}
            </Text>
          </Group>
        ))}
      </Section>

      <Section title="发现问题" description="按严重程度排列,红色为高">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "where", label: "位置", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
          ]}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            title: issue.title,
            where: `${issue.product} · 第 ${issue.step} 步`,
            evidence: issue.evidence,
            severity: issue.severity,
          }))}
          caption="严重度分高、中、低三档,由走查判断给出"
        />
      </Section>

      <Section title="下一步" description="两条改动建议及依据">
        <List
          columns={2}
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
