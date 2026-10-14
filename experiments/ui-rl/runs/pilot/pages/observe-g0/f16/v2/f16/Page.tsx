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

const productNames = data.products.map((p) => p.name)

const issueRows = data.issues.map((issue) => ({
  id: issue.id,
  product: issue.product,
  issue: issue.title,
  evidence: issue.evidence,
  severity: issue.severity,
}))

const screens = data.kpis.find((kpi) => kpi.key === "screens")?.value ?? 0

export default function Report() {
  return (
    <Page title={data.title} meta={[data.scope, data.date]}>
      <Section title="结论" description="四款产品都把报装拆成八段,差别在协议和地址各占几屏">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比范围与主要发现">
        <Grid cols={9} fields={false} className="items-baseline">
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

      <Section title="产品对比" description="步骤数与输入项数,按产品排列">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项数", align: "right", span: 2, bar: true },
            { key: "verdict", label: "产品结论", span: 3 },
          ]}
          rows={data.products}
          caption="输入项数为各步骤必填字段的合计;步骤数含提交成功页与装机进度页。"
        />
      </Section>

      <Section title="阶段对比" description="八段流程在各产品的屏数与把关方式">
        <DataTable
          columns={[
            { key: "stage", label: "流程阶段", span: 1 },
            ...productNames.map((name) => ({ key: name, label: name, span: 2 })),
          ]}
          rows={data.stages}
        />
      </Section>

      <Section title="共有模式" description="四款产品重复出现的做法">
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: pattern.comment,
            meta: pattern.products.join("、"),
          }))}
        />
      </Section>

      <Section title="问题明细" description="7 个问题,按严重度标注">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "issue", label: "问题", span: 3 },
            { key: "evidence", label: "依据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
          caption="严重度自高到低为高 2 个、中 4 个、低 1 个;依据为对应步骤的截图记录。"
        />
      </Section>

      <Section title="流程链路" description="4 款产品共 47 张截图,按步骤顺序排开" className="gap-12">
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
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
                  {step.note ? <FigureLabel>{step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="下一步" description="针对上述问题的五条改法">
        <List
          numbered
          columns={3}
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: suggestion.detail,
            meta: `依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="对比范围、版本与口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "对比范围", value: data.scope },
            {
              label: "产品与版本",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join("、"),
            },
            { label: "样本量", value: `${data.products.length} 款产品、${screens} 张截图` },
            { label: "记录日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
