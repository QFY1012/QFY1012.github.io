import data from "./data.json"
import { Page, Section, Group, Grid, Text, Stat, DataTable, List, KV, FigureStrip, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"

const productRows = data.products.map((p) => ({
  product: p.name,
  steps: p.steps,
  inputs: p.inputs,
  verdict: p.verdict,
}))

const issueRows = data.issues.map((i) => ({
  id: i.id,
  where: `${i.product} · 第 ${i.step} 步`,
  title: i.title,
  evidence: i.evidence,
  severity: i.severity,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.scope, `走查日期 ${data.date}`]}>
      <Section title="结论" description={data.task}>
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="口径:步骤数从首页算到预约成功,输入项按用户需要填写的字段计">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat span={3} value={data.kpis[0].value} unit={data.kpis[0].unit} label={data.kpis[0].label} size="lg" captionBelow />
          <Stat span={3} value={data.kpis[1].value} unit={data.kpis[1].unit} label={data.kpis[1].label} size="lg" captionBelow />
          <Stat span={3} value={data.kpis[2].value} unit={data.kpis[2].unit} label={data.kpis[2].label} size="lg" captionBelow note="闪兔快递 4 步" />
          <Stat span={3} value={data.kpis[3].value} unit={data.kpis[3].unit} label={data.kpis[3].label} size="lg" captionBelow />
        </Grid>
      </Section>

      <Section title="产品对比" description="两款 App 的步骤数、输入项与流程判断">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "流程判断", span: 3 },
          ]}
          rows={productRows}
        />
      </Section>

      <Section title="流程明细" description="每款 App 从首页到预约成功,按步骤顺序横向排开">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version} · ${chain.verdict}`}>
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="共 2 个问题,严重度分低、中两级">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "where", label: "位置", span: 2 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "依据", span: 2 },
            { key: "severity", label: "严重度", span: 2, levels: ["低", "中"] },
          ]}
          rows={issueRows}
          caption="严重度按对填写成本与流程顺畅度的影响判定"
        />
      </Section>

      <Section title="下一步" description="针对上面问题的改动建议">
        <List
          numbered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail}(依据 ${s.basis.join("、")})`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次走查的范围、样本与时间">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "版本", value: data.chains.map((c) => `${c.product} ${c.version}`).join("、") },
            { label: "走查日期", value: data.date },
            { label: "分析截图", value: `${data.kpis[1].value} 张` },
          ]}
        />
      </Section>
    </Page>
  )
}
