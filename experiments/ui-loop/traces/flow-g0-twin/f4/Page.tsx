import data from "./data.json"
import { Page, Section, Group, Grid, Text, Stat, DataTable, List, KV, FigureStrip, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"

const kpis = data.kpis
const products = data.products
const chains = data.chains
const stages = data.stages
const issues = data.issues
const suggestions = data.suggestions

export default function Report() {
  return (
    <Page title={data.title} meta={["交互流程挖掘", data.scope]}>
      <Section title="结论" description="两款产品的路径与判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比产品、截图数量与最少步数">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              size="lg"
              captionBelow
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="流程对比" description="四个环节的做法对照,以及两款产品的步数与输入项数" className="gap-12">
        <Group title="四个环节">
          <DataTable
            columns={[
              { key: "stage", label: "环节", span: 3 },
              { key: "a", label: "协作宝", span: 3 },
              { key: "b", label: "链工", span: 3 },
            ]}
            rows={stages.map((s) => ({
              stage: s.stage,
              a: s["协作宝"],
              b: s["链工"],
            }))}
          />
        </Group>

        <Group title="两款产品">
          <Grid cols={9} fields={false} className="items-baseline">
            {products.map((p) => (
              <Stat
                key={p.name}
                span={2}
                captionBelow
                value={p.steps}
                unit="步"
                label={p.name}
                note={`输入 ${p.inputs} 项 · ${p.verdict}`}
              />
            ))}
          </Grid>
        </Group>
      </Section>

      <Section title="链路明细" description="每个产品按操作顺序排列,共 13 张截图" className="gap-12">
        {chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                  />
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                    {step.note ? ` · ${step.note}` : ""}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题" description="严重程度按高、中、低标注">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1, align: "right" },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重程度", span: 1, tone: ["高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={issues.map((issue) => ({
            id: issue.id,
            product: issue.product,
            step: issue.step,
            title: issue.title,
            severity: issue.severity,
            evidence: issue.evidence,
          }))}
        />
      </Section>

      <Section title="下一步" description="三条改进建议及依据">
        <List
          columns={3}
          numbered
          items={suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} · 依据 ${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与统计口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            {
              label: "版本",
              value: chains.map((c) => `${c.product} ${c.version}`).join("、"),
            },
            { label: "分析截图", value: "13 张(协作宝 8 步、链工 5 步)" },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
