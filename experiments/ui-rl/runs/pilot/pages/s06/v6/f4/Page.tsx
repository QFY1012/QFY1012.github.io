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

const kpi = (key: string) => data.kpis.find((k) => k.key === key)!

export default function Report() {
  const fewest = kpi("fewest")
  const issuesKpi = kpi("issues")
  const products = kpi("products")
  const screens = kpi("screens")

  const stageRows = data.stages.map((s) => ({
    stage: s.stage,
    p1: s["协作宝"],
    p2: s["链工"],
  }))

  const issueRows = data.issues.map((i) => ({
    product: i.product,
    step: i.step,
    title: i.title,
    severity: i.severity,
    evidence: i.evidence,
  }))

  const nextSteps = data.suggestions.map((s) => ({
    title: s.title,
    description: `${s.detail}。依据:${s.basis.join("、")}`,
  }))

  return (
    <Page
      title={data.title}
      meta={["协同办公平台 · 2 款 App", "2026 年第三季度版本 · 2026-09-28"]}
    >
      <Section title="结论" description="同一任务下两款产品的路径相反">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="步骤数、输入项与问题数">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={fewest.value}
            unit={fewest.unit}
            label={fewest.label}
            note="协作宝 8 步"
          />
          <Stat
            span={2}
            size="lg"
            captionBelow
            value={issuesKpi.value}
            unit={issuesKpi.unit}
            label={issuesKpi.label}
            note="高 2 · 中 1 · 低 1"
          />
          <Stat
            span={2}
            captionBelow
            value={products.value}
            unit={products.unit}
            label={products.label}
            note="协作宝 7.2 · 链工 4.6"
          />
          <Stat
            span={2}
            captionBelow
            value={screens.value}
            unit={screens.unit}
            label={screens.label}
            note="每步一屏"
          />
        </Grid>
      </Section>

      <Section title="流程对比" description="同一任务的四个环节,两款产品的做法不同">
        <DataTable
          columns={[
            { key: "stage", label: "环节", span: 3 },
            { key: "p1", label: "协作宝 7.2", span: 3 },
            { key: "p2", label: "链工 4.6", span: 3 },
          ]}
          rows={stageRows}
        />
      </Section>

      <Section title="链路明细" description="每步一屏,共 13 张截图">
        {data.chains.map((chain) => {
          const product = data.products.find((p) => p.name === chain.product)!
          return (
            <Group key={chain.product}>
              <Rule
                label={`${chain.product} · ${chain.version} · 共 ${chain.steps.length} 步 · 输入 ${product.inputs} 项 · ${chain.verdict}`}
              />
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
                      {[step.content, step.action, `输入 ${step.inputs} 项`, step.note]
                        .filter(Boolean)
                        .join(" · ")}
                    </FigureText>
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          )
        })}
      </Section>

      <Section title="问题清单" description="共 4 个问题,按严重度排列">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="三条改进建议及其依据">
        <List ordered items={nextSteps} />
      </Section>

      <Section title="背景信息" description="任务、范围与分析口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "对比产品", value: "协作宝 7.2 · 链工 4.6" },
            { label: "截图口径", value: "每步一屏,共 13 张" },
            { label: "分析日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
