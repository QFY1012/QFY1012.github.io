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

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "product", label: "产品", span: 1 },
  { key: "step", label: "步骤", span: 1, align: "right" },
  { key: "title", label: "问题", span: 3 },
  { key: "severity", label: "严重度", span: 1, tone: ["高"] },
  { key: "evidence", label: "证据", span: 2 },
]

export default function Report() {
  return (
    <Page title={data.title} meta={["企业网盘", "2026 年 9 月"]}>
      <Section title="结论" description="外链分享流程的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与产出">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat key={k.key} span={3} size="lg" value={k.value} unit={k.unit} label={k.label} captionBelow />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="每款产品的步骤数与默认值口径">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.products.map((p) => (
            <Stat key={p.name} span={2} value={p.steps} unit="步" label={p.name} note={p.verdict} captionBelow />
          ))}
        </Grid>
      </Section>

      <Section title="流程链路" description="每款产品从文件列表到发送的完整步骤" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                  <FigureLabel>
                    第 {step.no} 步 · {step.screen}
                  </FigureLabel>
                  <FigureText>
                    {step.content} · {step.action} · 输入 {step.inputs} 项{step.note ? ` · ${step.note}` : ""}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="按严重度列出走查发现的问题">
        <DataTable columns={issueColumns} rows={data.issues} caption="严重度分 高 / 中 / 低 三级" />
      </Section>

      <Section title="改进建议" description="依据走查发现给出的调整方向">
        <List
          columns={3}
          numbered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} · 依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            { label: "样本", value: `${data.kpis[1].value} 张分析截图` },
            { label: "产品版本", value: data.chains.map((c) => `${c.product} ${c.version}`).join("、") },
          ]}
        />
      </Section>
    </Page>
  )
}
