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
  List,
  KV,
} from "@/components/report"

const daily = data.daily
const risks = data.risks
const riskLevels = ["高", "中"]

export default function Report() {
  return (
    <Page title={data.title} meta={[data.org, data.period]}>
      <Section title="本周结论">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本周四项指标与环比变化">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              size="lg"
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              note={`环比 ${k.change}`}
              direction={k.direction === "down" ? "down" : "up"}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="时间趋势"
        description="9 月 21 日至 10 月 4 日，按天统计"
        className="gap-12"
      >
        <Grid cols={9}>
          <Block span={6} rows={2} title="准时率">
            <TrendChart
              data={daily}
              xKey="date"
              series={[{ key: "ontime", label: "准时率 (%)" }]}
              height="fill"
              pointLabels="last"
            />
          </Block>
          <Block span={3} rows={2} title="平均时效">
            <TrendChart
              data={daily}
              xKey="date"
              series={[{ key: "hours", label: "平均时效 (小时)" }]}
              height="fill"
              pointLabels="last"
              xInterval={3}
            />
          </Block>
        </Grid>
        <Grid cols={9}>
          <Block span={6} rows={2} title="单量">
            <TrendChart
              data={daily}
              xKey="date"
              series={[{ key: "orders", label: "单量 (万单)" }]}
              height="fill"
              pointLabels="last"
            />
          </Block>
          <Block span={3} rows={2} title="异常件">
            <TrendChart
              data={daily}
              xKey="date"
              series={[{ key: "exceptions", label: "异常件 (件)" }]}
              height="fill"
              pointLabels="last"
              xInterval={3}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="延误拆解" description="按延误原因统计的占比与件数">
        <DataTable
          columns={[
            { key: "reason", label: "延误原因", span: 2 },
            { key: "note", label: "说明", span: 3 },
            { key: "share", label: "占比", align: "right", span: 2, bar: true },
            { key: "count", label: "件数", align: "right", span: 2, bar: true },
          ]}
          rows={data.delays.map((d) => ({
            reason: d.reason,
            note: d.note,
            share: `${d.share}%`,
            count: d.count,
          }))}
        />
      </Section>

      <Section
        title="线路明细"
        description="单量单位万单，时效单位小时；环比为本周对上周"
      >
        <DataTable
          columns={[
            { key: "route", label: "线路", span: 2 },
            { key: "orders", label: "单量", align: "right", span: 2, bar: true },
            { key: "ontime", label: "准时率", align: "right", span: 1 },
            { key: "hours", label: "时效", align: "right", span: 1 },
            { key: "exceptions", label: "异常件", align: "right", span: 1 },
            { key: "change", label: "环比", align: "right", span: 2 },
          ]}
          rows={data.routes.map((r) => ({
            route: `${r.from} → ${r.to}`,
            orders: r.orders,
            ontime: `${r.ontime}%`,
            hours: r.hours,
            exceptions: r.exceptions,
            change: r.change,
          }))}
        />
      </Section>

      <Section title="主要发现" description="从本周数据中得到的三条判断">
        <List
          numbered
          items={data.findings.map((f) => ({
            title: f.title,
            description: f.detail,
          }))}
        />
      </Section>

      <Section title="下一步" description="下周优先推进的三项动作">
        <List
          numbered
          columns={3}
          items={data.actions.map((a) => ({
            title: a.title,
            description: a.detail,
          }))}
        />
      </Section>

      <Section title="风险提示" description="可能影响下周时效的两项风险">
        <List
          columns={3}
          metaTone="destructive"
          items={risks.map((r, i) => ({
            title: r.title,
            description: r.detail,
            meta: riskLevels[i],
          }))}
        />
      </Section>

      <Section title="背景信息" description="团队、周期与统计口径">
        <KV
          labelCols={2}
          items={[
            { label: "负责团队", value: data.org },
            { label: "报告周期", value: data.period },
            { label: "覆盖线路", value: `${data.routes.length} 条干线` },
            { label: "统计口径", value: "按天统计，含上周同期对照" },
          ]}
        />
      </Section>
    </Page>
  )
}
