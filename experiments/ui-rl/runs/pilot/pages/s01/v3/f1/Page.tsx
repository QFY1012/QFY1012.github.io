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

export default function Report() {
  const {
    title,
    task,
    scope,
    date,
    summary,
    kpis,
    products,
    chains,
    stages,
    patterns,
    issues,
    suggestions,
  } = data

  const kpiSpan: Record<string, number> = {
    products: 2,
    screens: 2,
    fewest: 3,
    issues: 2,
  }

  const productRows = products.map((p) => ({
    name: p.name,
    steps: p.steps,
    inputs: p.inputs,
    verdict: p.verdict,
  }))

  const productColumns = [
    { key: "name", label: "产品", span: 3 },
    { key: "steps", label: "步骤数", align: "right" as const, span: 2, bar: true },
    { key: "inputs", label: "输入项", align: "right" as const, span: 2 },
    { key: "verdict", label: "流程判断", span: 2 },
  ]

  const stageColumns = [
    { key: "stage", label: "环节", span: 3 },
    ...products.map((p) => ({ key: p.name, label: p.name, span: 2 })),
  ]

  const issueRows = issues.map((issue) => ({
    id: issue.id,
    product: issue.product,
    step: `第 ${issue.step} 步`,
    title: issue.title,
    evidence: issue.evidence,
    severity: issue.severity,
  }))

  const issueColumns = [
    { key: "id", label: "编号", span: 1 },
    { key: "product", label: "产品", span: 2 },
    { key: "step", label: "步骤", span: 1 },
    { key: "title", label: "问题", span: 2 },
    { key: "evidence", label: "复现依据", span: 2 },
    { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
  ]

  const patternItems = patterns.map((pattern) => ({
    title: pattern.name,
    description: pattern.comment,
    meta: pattern.products.join("、"),
  }))

  const suggestionItems = suggestions.map((suggestion) => ({
    title: `${suggestion.id} ${suggestion.title}`,
    description: `${suggestion.detail} · 依据:${suggestion.basis.join("、")}`,
  }))

  const highIssues = issues.filter((issue) => issue.severity === "高").length
  const midIssues = issues.length - highIssues

  return (
    <Page title={title} meta={[task, scope, `走查日期 ${date}`]}>
      <Section
        title="结论"
        description="三家银行都把开户拆成身份验证、填写资料、绑卡、设密码四段"
      >
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的对比范围与产出">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={kpiSpan[kpi.key]}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              size={kpi.key === "fewest" ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="三家的流程长度与表单负担">
        <DataTable
          columns={productColumns}
          rows={productRows}
          caption="步骤数为从开户首页到成功页的屏数;输入项为该流程中需要用户手填的字段数。"
        />
      </Section>

      <Section title="环节对比" description="同一环节在三家的做法与位置">
        <DataTable
          columns={stageColumns}
          rows={stages}
          caption="按开户流程的四个环节排列,「身份验证」栏标出人脸与证件的先后顺序。"
        />
      </Section>

      <Section
        title="流程链路"
        description="每个产品一组,按步骤从左到右;备注是该步发现的问题"
        className="gap-12"
      >
        {chains.map((chain) => (
          <Group key={chain.product}>
            <Rule
              label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步 · 输入 ${chain.steps.reduce((sum, step) => sum + step.inputs, 0)} 项`}
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
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note ? <FigureLabel>备注:{step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="共性模式" description="三家在同一环节上重复出现的做法">
        <List items={patternItems} numbered />
      </Section>

      <Section title="问题明细" description="按严重度排,依据是复现出来的步骤">
        <DataTable
          columns={issueColumns}
          rows={issueRows}
          caption="严重度:高为会中断或推翻已完成步骤,中为增加操作成本但不中断流程。"
        />
      </Section>

      <Section title="下一步" description="针对问题给出的改动建议与依据">
        <List items={suggestionItems} numbered />
      </Section>

      <Section title="背景信息" description="走查的任务、范围与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "对比范围", value: scope },
            {
              label: "产品版本",
              value: chains.map((chain) => `${chain.product} ${chain.version}`).join(" / "),
            },
            { label: "走查日期", value: date },
            { label: "分析截图", value: `${kpis[1].value} 张` },
            {
              label: "发现问题",
              value: `${issues.length} 个(高 ${highIssues}、中 ${midIssues})`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}
