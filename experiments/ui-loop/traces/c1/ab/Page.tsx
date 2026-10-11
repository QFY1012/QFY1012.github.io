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

const signed = (v: number) => `${v > 0 ? "+" : ""}${v}%`

export default function Report() {
  const metricRows = data.metrics.map((m) => ({
    name: m.name,
    control: m.control,
    treatment: m.treatment,
    lift: signed(m.lift),
    significant: m.significant,
    ciLow: m.ciLow,
    ciHigh: m.ciHigh,
    ciText: `${m.ciLow}% ~ ${m.ciHigh}%`,
  }))

  const downLifts = metricRows
    .filter((r) => r.lift.startsWith("-"))
    .map((r) => r.lift)

  const metricColumns = [
    { key: "name", label: "指标", span: 2, muteWhen: { key: "significant", equals: false } },
    {
      key: "control",
      label: "对照组",
      align: "right" as const,
      span: 2,
      muteWhen: { key: "significant", equals: false },
    },
    {
      key: "treatment",
      label: "实验组",
      align: "right" as const,
      span: 2,
      muteWhen: { key: "significant", equals: false },
    },
    {
      key: "lift",
      label: "相对提升",
      align: "right" as const,
      span: 1,
      tone: downLifts,
      muteWhen: { key: "significant", equals: false },
    },
    {
      key: "ciText",
      label: "95% 置信区间",
      align: "right" as const,
      span: 1,
      muteWhen: { key: "significant", equals: false },
    },
    {
      key: "ci",
      label: "",
      span: 1,
      interval: { low: "ciLow", high: "ciHigh", domain: [-10, 13] },
    },
  ]

  return (
    <Page title={data.title} meta={[data.owner, data.period]}>
      <Section title="结论" description="本次实验的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.verdict}</Text>
      </Section>

      <Section title="核心指标" description="实验组相对对照组的提升，及 95% 置信区间；不显著的行灰显">
        <DataTable columns={metricColumns} rows={metricRows} />
      </Section>

      <Section title="随时间变化" description="每日支付转化率相对提升（%），阴影为 95% 置信区间">
        <TrendChart
          data={data.daily}
          xKey="day"
          series={[{ key: "lift", label: "支付转化率相对提升" }]}
          band={{ low: "low", high: "high" }}
          zero
          height="h-48"
          pointLabels="last"
          xInterval={3}
          yTicks={[0, 5, 10]}
        />
      </Section>

      <Section title="分群结果" description="各分群支付转化率相对提升，附对照组基准值">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.segments.map((s) => (
            <Stat
              key={s.name}
              span={2}
              value={signed(s.lift)}
              label={`${s.name} ${s.control} → ${s.treatment}`}
              captionBelow
              direction={s.lift < 0 ? "down" : "up"}
            />
          ))}
        </Grid>
      </Section>

      <Section title="下一步" description="上线节奏与后续复查安排">
        <List
          items={data.next.map((n) => ({ title: n.title, description: n.detail }))}
          numbered
          columns={3}
        />
      </Section>

      <Section title="背景信息" description="实验设计与样本">
        <KV
          items={[
            { label: "负责团队", value: data.owner },
            { label: "分流方式", value: data.traffic },
            {
              label: "对照组样本量",
              value: data.samples.control.toLocaleString("en-US"),
            },
            {
              label: "实验组样本量",
              value: data.samples.treatment.toLocaleString("en-US"),
            },
          ]}
          labelCols={2}
        />
      </Section>
    </Page>
  )
}
