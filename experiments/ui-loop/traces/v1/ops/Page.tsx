import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Block,
  Text,
  Stat,
  DataTable,
  TrendChart,
  ProgressList,
  List,
} from "@/components/report"

const downChanges = data.categories
  .filter((c) => c.change.startsWith("−") || c.change.startsWith("-"))
  .map((c) => c.change)

export default function Report() {
  return (
    <Page title={data.title} meta={[data.product, data.period]}>
      <Section title="结论" description="本月整体表现与关键变化">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="当月数值,注释为变化幅度">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi, i) => (
            <Stat
              key={kpi.key}
              span={3}
              value={kpi.value}
              label={kpi.label}
              unit={kpi.unit}
              size={i === 0 ? "lg" : undefined}
              captionBelow
              note={kpi.change}
              direction={kpi.direction === "down" ? "down" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="日活走势" description="9 月 1 日至 30 日,单位:万" className="gap-12">
        <Block title="每日日活">
          <TrendChart
            data={data.dauDaily}
            xKey="day"
            series={[{ key: "dau", label: "日活" }]}
            height="h-48"
            pointLabels="last"
            xInterval={5}
          />
        </Block>
        <Group title="周均日活">
          <Grid cols={9} fields={false} className="items-baseline">
            {data.dauWeekly.map((w) => (
              <Stat
                key={w.week}
                span={2}
                value={w.dau}
                unit="万"
                label={w.week}
                captionBelow
              />
            ))}
          </Grid>
        </Group>
      </Section>

      <Section title="拆分" description="渠道为新增用户占比,品类为成交额占比" className="gap-12">
        <Grid cols={9} fields={false}>
          <Block span={3} title="分渠道">
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
        <Grid cols={9} fields={false}>
          <Block span={9} title="分类别">
            <DataTable
              columns={[
                { key: "name", label: "品类", span: 3 },
                { key: "gmv", label: "成交额(万元)", span: 2, align: "right" },
                { key: "change", label: "环比", span: 2, align: "right", tone: downChanges },
                { key: "share", label: "占比", span: 2, align: "right", bar: true },
              ]}
              rows={data.categories}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="发现" description="本月三条主要发现">
        <List
          numbered
          items={data.findings.map((f) => ({ title: f.title, description: f.detail }))}
        />
      </Section>

      <Section title="风险" description="需要持续跟进的两项风险">
        <List
          columns={3}
          metaTone="destructive"
          items={data.risks.map((r) => ({ title: r }))}
        />
      </Section>
    </Page>
  )
}
