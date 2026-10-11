import data from "./data.json"
import {
  Page,
  Section,
  Grid,
  Block,
  Text,
  Stat,
  DataTable,
  TrendChart,
  ProgressList,
  List,
  KV,
} from "@/components/report"

const channelItems = data.channels.map((c) => ({
  label: c.name,
  value: c.share,
  max: 100,
  display: `${c.share}%`,
}))

const categoryItems = data.categories.map((c) => ({
  label: c.name,
  value: c.share,
  max: 100,
  display: `${c.share}%`,
}))

const categoryRows = data.categories.map((c) => ({
  name: c.name,
  gmv: c.gmv,
  change: c.change,
  share: c.share,
}))

export default function Report() {
  return (
    <Page title="9 月运营月报" meta={["鲜到家 App", "2026 年 9 月 1 日至 30 日"]}>
      <Section title="结论" description="9 月整体表现与主要问题">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="四项指标与环比 8 月的变化">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value="128.4"
            unit="万"
            label="日活跃用户"
            captionBelow
            note="环比 +6.2%"
          />
          <Stat span={3} value="3.42" unit="亿元" label="成交额" captionBelow note="环比 +11.8%" />
          <Stat
            span={3}
            value="4.7"
            unit="%"
            label="下单转化率"
            captionBelow
            note="环比 −0.3 个百分点"
            direction="down"
          />
          <Stat span={3} value="86.5" unit="元" label="客单价" captionBelow note="环比 +3.1%" />
        </Grid>
      </Section>

      <Section
        className="gap-12"
        title="随时间变化"
        description="日活走势与周均对照，单位：万"
      >
        <TrendChart
          data={data.dauDaily}
          xKey="day"
          series={[{ key: "dau", label: "日活" }]}
          height="h-48"
          xInterval={5}
          pointLabels="last"
        />
        <Grid cols={9} fields={false} className="items-baseline">
          {data.dauWeekly.map((w) => (
            <Stat
              key={w.week}
              span={2}
              value={`${w.dau}`}
              unit="万"
              label={w.week}
              captionBelow
              note="周均日活"
            />
          ))}
        </Grid>
      </Section>

      <Section className="gap-12" title="拆分" description="渠道与品类结构，成交额单位：万元">
        <Grid cols={9} fields={true}>
          <Block span={3} rows={2} title="渠道占比（%）">
            <ProgressList compact items={channelItems} />
          </Block>
          <Block span={6} rows={2} title="品类成交额占比（%）">
            <ProgressList compact items={categoryItems} />
          </Block>
        </Grid>
        <DataTable
          columns={[
            { key: "name", label: "品类", span: 3 },
            { key: "gmv", label: "成交额（万元）", align: "right", span: 3 },
            { key: "change", label: "环比", align: "right", span: 3, tone: ["−4.3%"] },
          ]}
          rows={categoryRows}
        />
      </Section>

      <Section title="主要发现" description="9 月变化的主要归因">
        <List
          numbered
          items={data.findings.map((f) => ({ title: f.title, description: f.detail }))}
        />
      </Section>

      <Section title="风险" description="需要跟进的风险项">
        <List
          columns={3}
          metaTone="destructive"
          items={data.risks.map((r, i) => ({ description: r, meta: i === 0 ? "高" : "中" }))}
        />
      </Section>

      <Section title="背景信息" description="报告范围与关键指标">
        <KV
          labelCols={2}
          items={[
            { label: "产品", value: "鲜到家 App" },
            { label: "报告周期", value: "2026 年 9 月 1 日至 30 日" },
            { label: "关键指标", value: "日活跃用户、成交额、下单转化率、客单价" },
          ]}
        />
      </Section>
    </Page>
  )
}
