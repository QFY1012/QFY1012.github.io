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

const productRows = [...data.products]
  .sort((a, b) => a.steps - b.steps)
  .map((p) => ({
    name: p.name,
    steps: p.steps,
    inputs: p.inputs,
    verdict: p.verdict,
  }))

const stageRows = data.stages.map((s) => {
  const row = s as unknown as Record<string, string>
  return {
    title: row.stage,
    description: data.products
      .map((p) => `${p.name} ${row[p.name]}`)
      .join(" · "),
  }
})

const patternRows = data.patterns.map((p) => ({
  title: p.name,
  description: `${p.comment}(涉及 ${p.products.join("、")})`,
}))

const issueRows = data.issues.map((i) => ({
  id: i.id,
  product: i.product,
  step: i.step,
  title: i.title,
  evidence: i.evidence,
  severity: i.severity,
}))

const suggestionRows = data.suggestions.map((s) => ({
  title: s.title,
  description: s.detail,
  meta: `依据 ${s.basis.join("、")}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["酒店预订 App · 5 款", "2026 年 4 月版本"]}>
      <Section title="结论" description="五款产品走完下单全流程的差异">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="口径:搜索酒店到支付成功的完整流程">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={8}
            unit="步"
            label="步骤最少(云栖旅行)"
            note="最多的蓝湾预订要 11 步"
          />
          <Stat span={3} captionBelow value={5} unit="个" label="对比产品" />
          <Stat
            span={3}
            captionBelow
            value={8}
            unit="个"
            label="发现问题"
            note="高风险 1 个"
          />
          <Stat span={3} captionBelow value={47} unit="张" label="分析截图" />
        </Grid>
      </Section>

      <Section
        title="产品对比"
        description="步骤数与输入项都是完整下单流程的口径"
      >
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 3 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 2 },
          ]}
          rows={productRows}
          caption="输入项指用户在流程中需要手动填写或选择的字段数,账号自动带出的不计入。"
        />
      </Section>

      <Section
        title="阶段差异"
        description="六个阶段里各产品的做法,逐阶段对照"
      >
        <List numbered items={stageRows} />
      </Section>

      <Section title="共性问题" description="跨产品重复出现的四类问题">
        <List numbered items={patternRows} />
      </Section>

      <Section title="问题明细" description="8 个问题:高 1、中 5、低 2">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 3 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
          caption="严重度按对下单完成与费用预期的影响判定:高为直接影响实付金额,中为多一次操作或信息缺失,低为入口位置问题。"
        />
      </Section>

      <Section
        title="链路明细"
        description="5 条链路共 47 张截图,按步骤顺序横向排开"
      >
        <Group>
          {data.chains.map((chain) => (
            <Group key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步`} />
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

      <Section title="下一步" description="按优先级给出的五条改进建议">
        <List numbered columns={3} items={suggestionRows} />
      </Section>

      <Section title="背景信息" description="产品范围、任务与样本">
        <KV
          labelCols={2}
          items={[
            { label: "报告周期", value: data.date },
            { label: "产品范围", value: data.scope },
            { label: "走查任务", value: data.task },
            {
              label: "样本",
              value: `${data.products.length} 条完整链路,${data.kpis[1].value} 张分析截图`,
            },
            { label: "问题与建议", value: `问题 ${data.issues.length} 个,建议 ${data.suggestions.length} 条` },
          ]}
        />
      </Section>
    </Page>
  )
}
