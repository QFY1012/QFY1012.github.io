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

const WEEK_MAX = 130

export default function Report() {
  return (
    <Page title={data.title} meta={[data.product, data.period]}>
      <Section title="结论" description="9 月整体表现的一句话判断">
        <Text span={9} className="text-2xl leading-9 font-light">
          {data.summary}
        </Text>
      </Section>

      <Section title="核心指标" description="与 8 月环比，单位见各指标">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              size={k.key === "gmv" ? "lg" : undefined}
              note={`环比 ${k.change}`}
              direction={k.direction === "down" ? "down" : "up"}
            />
          ))}
        </Grid>
      </Section>

      <Section title="时间趋势" description="日活单位万，周为 9/1–9/30 内的日均">
        <Grid cols={9}>
          <Block span={6} rows={2} title="日活日趋势">
            <TrendChart
              data={data.dauDaily}
              xKey="day"
              series={[{ key: "dau", label: "日活" }]}
              height="fill"
              xInterval={5}
              pointLabels="last"
            />
          </Block>
          <Block span={3} rows={2} title="周日均日活">
            <ProgressList
              compact
              items={data.dauWeekly.map((w) => ({
                label: w.week,
                value: w.dau,
                max: WEEK_MAX,
                display: `${w.dau} 万`,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="拆分" description="各获客渠道占比，单位 %">
        <Grid cols={9} fields={false}>
          <Block span={3} title="渠道结构">
            <ProgressList
              compact
              items={data.channels.map((c) => ({
                label: c.name,
                value: c.share,
                max: 100,
                display: `${c.share}%`,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="明细" description="品类成交额单位万元，占比为占全月成交额">
        <DataTable
          columns={[
            { key: "name", label: "品类", span: 2 },
            { key: "gmv", label: "成交额（万元）", align: "right", span: 2 },
            { key: "change", label: "环比", align: "right", span: 2, tone: ["−4.3%"] },
            { key: "share", label: "占比（%）", align: "right", span: 3, bar: true },
          ]}
          rows={data.categories.map((c) => ({
            name: c.name,
            gmv: c.gmv,
            change: c.change,
            share: c.share,
          }))}
        />
      </Section>

      <Section title="发现" description="本月三条主要发现">
        <List
          numbered
          items={data.findings.map((f) => ({ title: f.title, description: f.detail }))}
        />
      </Section>

      <Section title="风险" description="需要持续关注的风险，按等级标注">
        <List
          columns={3}
          metaTone="destructive"
          items={data.risks.map((r, i) => ({
            description: r,
            meta: i === 0 ? "高" : "中",
          }))}
        />
      </Section>

      <Section title="背景信息" description="报告基本信息">
        <KV
          labelCols={2}
          items={[
            { label: "产品", value: data.product },
            { label: "报告周期", value: data.period },
          ]}
        />
      </Section>
    </Page>
  )
}
