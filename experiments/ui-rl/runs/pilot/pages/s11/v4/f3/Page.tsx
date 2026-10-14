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
  const { title, task, scope, date, summary, kpis, products, chains, issues, suggestions } = data

  const versions = chains.map((chain) => `${chain.product} ${chain.version}`).join("、")

  const issueRows = issues.map((issue) => ({
    id: issue.id,
    product: issue.product,
    step: `第 ${issue.step} 步`,
    title: issue.title,
    severity: issue.severity,
    evidence: issue.evidence,
  }))

  return (
    <Page title={title} meta={["企业网盘 · 外链分享"]}>
      <Section title="结论" description="外链分享流程的整体判断">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的产出规模">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((kpi, index) => (
            <Stat
              key={kpi.key}
              span={index === 0 ? 3 : 2}
              captionBelow
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              size={index === 0 ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对照" description="各产品的步骤数、输入项与流程结论">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 1 },
            { key: "verdict", label: "结论", span: 4 },
          ]}
          rows={products}
          caption="输入项是需要手动填写的字段数,三款产品全流程均为 0;步骤数含生成链接与发送两步。"
        />
      </Section>

      <Section title="链路明细" description="每步一屏,按产品分组的完整操作路径" className="gap-12">
        {chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version} · ${chain.verdict}`} />
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>{step.content} · {step.action}</FigureText>
                  {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题清单" description="三处可优化点,按严重度排列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={issueRows}
          caption="严重度按高、中、低三级;编号用于下一步建议的依据对照。"
        />
      </Section>

      <Section title="下一步" description="两条改动建议,依据对回上节编号">
        <List
          numbered
          items={suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} · 依据:${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "范围", value: scope },
            { label: "日期", value: date },
            { label: "对比产品", value: versions },
          ]}
        />
      </Section>
    </Page>
  )
}