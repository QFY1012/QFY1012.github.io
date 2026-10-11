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
  const productRows = data.products.map((p) => ({
    name: p.name,
    steps: p.steps,
    verdict: p.verdict,
  }))

  const issueRows = data.issues.map((i) => ({
    location: `${i.id} · ${i.product} 第 ${i.step} 步`,
    title: i.title,
    severity: i.severity,
    evidence: i.evidence,
  }))

  return (
    <Page
      title={data.title}
      meta={["企业网盘", "2026 年 9 月", data.task, data.scope, data.date]}
    >
      {/* 结论 */}
      <Section title="结论" description="本次对比的核心判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      {/* 核心指标 */}
      <Section title="核心指标" description="本次挖掘的样本与结果概览">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat span={3} captionBelow value={3} unit="个" label="对比产品" />
          <Stat span={3} captionBelow value={12} unit="张" label="分析截图" />
          <Stat
            span={3}
            captionBelow
            size="lg"
            value={3}
            unit="步"
            label="步骤最少(栈盘)"
          />
          <Stat span={3} captionBelow value={3} unit="个" label="发现问题" />
        </Grid>
      </Section>

      {/* 产品对比 */}
      <Section title="产品对比" description="3 款企业网盘,按完成分享的步数对比">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数(步)", span: 2, align: "right" },
            { key: "verdict", label: "结论", span: 5 },
          ]}
          rows={productRows}
        />
      </Section>

      {/* 交互链路 */}
      <Section
        title="交互链路"
        description="逐屏拆解从文件到发送的完整流程"
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

      {/* 步骤备注 */}
      <Section title="步骤备注" description="链路各步骤的补充说明">
        <List
          numbered
          columns={2}
          items={data.chains.flatMap((chain) =>
            chain.steps
              .filter((step) => step.note)
              .map((step) => ({
                title: `${chain.product} 第 ${step.no} 步 · ${step.screen}`,
                description: step.note,
              }))
          )}
        />
      </Section>

      {/* 问题建议 */}
      <Section
        title="问题建议"
        description="3 个问题与 2 条改进方向"
        className="gap-12"
      >
        <Group title="问题明细">
          <DataTable
            columns={[
              { key: "location", label: "位置", span: 2 },
              { key: "title", label: "问题", span: 3 },
              { key: "severity", label: "严重度", span: 1, align: "right", tone: ["高"] },
              { key: "evidence", label: "证据", span: 3 },
            ]}
            rows={issueRows}
            caption="严重度按影响范围与用户困惑程度评定"
          />
        </Group>

        <Group title="下一步">
          <List
            columns={3}
            numbered
            items={data.suggestions.map((s) => ({
              title: s.title,
              description: `${s.detail} · 依据:${s.basis.join("、")}`,
            }))}
          />
        </Group>
      </Section>
    </Page>
  )
}
