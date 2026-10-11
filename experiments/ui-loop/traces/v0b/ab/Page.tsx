import data from "./data.json"
import {
  Page,
  Section,
  Grid,
  Text,
  Stat,
  DataTable,
  TrendChart,
  List,
  KV,
} from "@/components/report"

const pct = (n: number) => `${n > 0 ? "+" : ""}${n}%`

export default function Report() {
  const metricColumns = [
    { key: "name", label: "指标", span: 2 },
    { key: "control", label: "对照组", align: "right" as const, span: 1 },
    { key: "treatment", label: "实验组", align: "right" as const, span: 1 },
    {
      key: "lift",
      label: "提升",
      align: "right" as const,
      span: 1,
      tone: ["-6.9%"],
    },
    {
      key: "ci",
      label: "95% 区间",
      span: 2,
      interval: { low: "low", high: "high", domain: [-10, 15] },
    },
    { key: "ciText", label: "", align: "right" as const, span: 2 },
  ]

  const metricRows = data.metrics.map((m) => ({
    name: m.name,
    control: m.control,
    treatment: m.treatment,
    lift: pct(m.lift),
    low: m.ciLow,
    high: m.ciHigh,
    ciText: `${m.ciLow}% ~ ${m.ciHigh}%`,
    significant: m.significant,
  }))

  const segmentItems = data.segments.map((s) => ({
    value: pct(s.lift),
    label: s.name,
    note: `对照 ${s.control} → 实验 ${s.treatment}`,
    direction: (s.lift < 0 ? "down" : undefined) as "down" | undefined,
  }))

  return (
    <Page title={data.title} meta={[data.owner, data.period]}>
      <Section
        title="结论"
        description="基于 21 天全量 50% / 50% 分流实验的判断"
      >
        <Text className="text-2xl leading-9 font-light">{data.verdict}</Text>
      </Section>

      <Section
        title="核心指标"
        description="支付转化率为主指标，区间为 95% 置信区间；灰显行表示差异不显著"
      >
        <DataTable
          columns={metricColumns}
          rows={metricRows}
          caption="对照组与实验组对照，提升为相对变化"
        />
      </Section>

      <Section
        title="随时间变化"
        description="支付转化率相对提升的逐日走势，阴影为 95% 置信区间"
      >
        <TrendChart
          data={data.daily}
          xKey="day"
          series={[{ key: "lift", label: "支付转化率提升" }]}
          height="h-48"
          band={{ low: "low", high: "high" }}
          zero
          xInterval={3}
          pointLabels="last"
        />
      </Section>

      <Section
        title="分群结果"
        description="各分群的支付转化率相对提升，注释为对照组与实验组数值"
      >
        <Grid cols={9} fields={false} className="items-baseline">
          {segmentItems.map((s) => (
            <Stat
              key={s.label}
              span={2}
              value={s.value}
              label={s.label}
              captionBelow
              note={s.note}
              direction={s.direction}
            />
          ))}
        </Grid>
      </Section>

      <Section title="下一步" description="上线节奏与后续复核安排">
        <List
          items={data.next.map((n) => ({
            title: n.title,
            description: n.detail,
          }))}
          columns={3}
          numbered
        />
      </Section>

      <Section title="背景信息" description="实验设计与样本口径">
        <KV
          labelCols={2}
          items={[
            { label: "负责团队", value: data.owner },
            { label: "实验周期", value: data.period },
            { label: "分流方式", value: data.traffic },
            {
              label: "样本量",
              value: `对照组 ${data.samples.control} / 实验组 ${data.samples.treatment}`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}
