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

const metrics = data.metrics

const keyMetrics = metrics.filter((m) => m.primary || m.significant).slice(0, 3)

const metricRows = metrics.map((m) => ({
  name: m.name,
  control: m.control,
  treatment: m.treatment,
  lift: `${m.lift > 0 ? "+" : ""}${m.lift}%`,
  ci: `${m.ciLow}% ~ ${m.ciHigh}%`,
  low: m.ciLow,
  high: m.ciHigh,
  significant: m.significant,
}))

const metricColumns = [
  { key: "name", label: "指标", span: 2, muteWhen: { key: "significant", equals: false } },
  { key: "control", label: "对照组", align: "right" as const, span: 1 },
  { key: "treatment", label: "实验组", align: "right" as const, span: 1 },
  { key: "lift", label: "相对提升", align: "right" as const, span: 1 },
  { key: "ci", label: "95% 置信区间", align: "right" as const, span: 2 },
  {
    key: "range",
    label: "",
    span: 2,
    interval: { low: "low", high: "high", domain: [-10, 13] },
  },
]

export default function Report() {
  return (
    <Page title={data.title} meta={["新版结账流程", data.period]}>
      <Section
        title="结论"
        description="基于全量 50/50 分流、21 天实验数据的一句话判断。"
      >
        <Text className="text-2xl leading-9 font-light">{data.verdict}</Text>
      </Section>

      <Section
        title="核心指标"
        description="以支付转化率为主指标，另列两个显著变化的辅助指标。"
      >
        <Grid cols={9} fields={false} className="items-baseline">
          {keyMetrics.map((m) => (
            <Stat
              key={m.name}
              span={3}
              value={`${m.lift > 0 ? "+" : ""}${m.lift}%`}
              label={m.name}
              size={m.primary ? "lg" : undefined}
              captionBelow
              direction={m.lift < 0 ? "down" : undefined}
              note={`对照组 ${m.control} → 实验组 ${m.treatment}`}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="时间趋势"
        description="每日支付转化率相对提升，阴影为 95% 置信区间。"
      >
        <TrendChart
          data={data.daily}
          xKey="day"
          series={[{ key: "lift", label: "支付转化率相对提升" }]}
          height="h-48"
          band={{ low: "low", high: "high" }}
          zero
          xInterval={3}
          pointLabels="last"
          lastLabel="+4.1%"
        />
      </Section>

      <Section
        title="分群结果"
        description="按用户类型与设备拆分支付转化率提升，均高于对照组。"
      >
        <Grid cols={9} fields={false} className="items-baseline">
          {data.segments.map((s) => (
            <Stat
              key={s.name}
              span={2}
              value={`${s.lift > 0 ? "+" : ""}${s.lift}%`}
              captionBelow
              label={s.name}
              note={`对照组 ${s.control} → 实验组 ${s.treatment}`}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="指标明细"
        description="五个指标的对照值与置信区间，未达显著的行灰显。"
      >
        <DataTable columns={metricColumns} rows={metricRows} />
      </Section>

      <Section title="下一步" description="上线节奏与后续观测安排。">
        <List
          columns={3}
          numbered
          items={data.next.map((n) => ({ title: n.title, description: n.detail }))}
        />
      </Section>

      <Section title="背景信息" description="负责团队、实验周期与分流方式。">
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
