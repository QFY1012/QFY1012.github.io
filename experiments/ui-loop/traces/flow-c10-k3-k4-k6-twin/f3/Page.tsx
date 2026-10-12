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

export default function Report() {
  const { title, task, scope, date, summary, kpis, products, chains, issues, suggestions } = data

  return (
    <Page title={title} meta={["3 款企业网盘", "2026 年 9 月"]}>
      <Section title="背景信息" description="本次走查的任务、范围与时间">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "范围", value: scope },
            { label: "日期", value: date },
          ]}
        />
      </Section>

      <Section title="结论" description="三款网盘分享流程的总体判断">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的规模与结果,单位见各项">
        <Grid cols={12} fields={false} className="items-baseline">
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

      <Section title="分产品" description="每款产品的步骤数与流程判断">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", span: 2, align: "right" },
            { key: "verdict", label: "流程判断", span: 5 },
          ]}
          rows={products.map((product) => ({
            product: product.name,
            steps: product.steps,
            verdict: product.verdict,
          }))}
          caption="步骤数按从发起分享到发送完成的界面数统计,不含确认弹窗"
        />
      </Section>

      <Section
        title="链路明细"
        description="每款产品一条链路,按步骤顺序排列,截图同高"
        className="gap-12"
      >
        {chains.map((chain) => (
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

      <Section title="步骤备注" description="链路中值得记录的步骤,不写进截图">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", span: 2 },
            { key: "screen", label: "界面", span: 2 },
            { key: "note", label: "备注", span: 3 },
          ]}
          rows={chains.flatMap((chain) =>
            chain.steps
              .filter((step) => step.note)
              .map((step) => ({
                product: `${chain.product} · ${chain.version}`,
                step: `第 ${step.no} 步`,
                screen: step.screen,
                note: step.note,
              }))
          )}
        />
      </Section>

      <Section title="问题" description="三处影响分享流程的问题,按严重程度排列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "where", label: "位置", span: 2 },
            { key: "severity", label: "严重", span: 1, tone: ["高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={issues.map((issue) => ({
            id: issue.id,
            title: issue.title,
            where: `${issue.product} · 第 ${issue.step} 步`,
            severity: issue.severity,
            evidence: issue.evidence,
          }))}
          caption="严重程度按对分享结果的影响划分,高表示权限与预期不符"
        />
      </Section>

      <Section title="下一步" description="按问题给出的改进建议">
        <List
          numbered
          columns={3}
          items={suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail},依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>
    </Page>
  )
}
