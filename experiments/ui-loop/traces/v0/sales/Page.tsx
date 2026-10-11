import data from "./data.json"
import { Page, Section, Grid, Text, Stat, DataTable, TrendChart, List, KV } from "@/components/report"

const kpi = (key: string) => data.kpis.find((k) => k.key === key)!

const regionRows = data.regions.map((r) => ({
  name: r.name,
  revenue: String(r.revenue),
  target: String(r.target),
  attain: r.attain.toFixed(1) + "%",
  change: r.change,
}))

const productRows = data.products.map((p) => ({
  name: p.name,
  revenue: String(p.revenue),
  share: p.share.toFixed(1) + "%",
  change: p.change,
}))

const regionColumns = [
  { key: "name", label: "区域", span: 2 },
  { key: "revenue", label: "收入", align: "right" as const, span: 2 },
  { key: "target", label: "目标", align: "right" as const, span: 2 },
  { key: "attain", label: "完成率", align: "right" as const, span: 2, tone: ["88.0%", "66.5%"] },
  { key: "change", label: "同比", align: "right" as const, span: 1, tone: ["−6.3%"] },
]

const productColumns = [
  { key: "name", label: "产品", span: 3 },
  { key: "revenue", label: "收入", align: "right" as const, span: 2 },
  { key: "share", label: "占比", align: "right" as const, span: 2, bar: true },
  { key: "change", label: "同比", align: "right" as const, span: 2, tone: ["−2.8%"] },
]

export default function Report() {
  return (
    <Page title={data.title} meta={[data.org, data.period]}>
      <Section title="结论" description="本季度整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="同比为与去年同期比较">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpi("revenue").value}
            unit={kpi("revenue").unit}
            label={kpi("revenue").label}
            note={"同比 " + kpi("revenue").change}
          />
          <Stat
            span={2}
            captionBelow
            direction="down"
            value={kpi("attain").value}
            unit={kpi("attain").unit}
            label={kpi("attain").label}
            note={kpi("attain").change}
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("newcust").value}
            unit={kpi("newcust").unit}
            label={kpi("newcust").label}
            note={"同比 " + kpi("newcust").change}
          />
          <Stat
            span={2}
            captionBelow
            direction="down"
            value={kpi("churn").value}
            unit={kpi("churn").unit}
            label={kpi("churn").label}
            note={kpi("churn").change}
          />
        </Grid>
      </Section>

      <Section title="收入走势" description="周收入，单位：万元">
        <TrendChart
          data={data.weekly}
          xKey="week"
          series={[{ key: "revenue", label: "周收入（万元）" }]}
          height="h-48"
          pointLabels="last"
          lastLabel="第 13 周"
          xInterval={2}
        />
      </Section>

      <Section title="区域表现" description="收入与目标对照，单位：万元">
        <DataTable columns={regionColumns} rows={regionRows} caption="完成率低于 100% 的为不达标区域" />
      </Section>

      <Section title="产品结构" description="各产品收入、占比与同比，单位：万元">
        <DataTable columns={productColumns} rows={productRows} />
      </Section>

      <Section title="主要发现" description="本季度三条关键发现">
        <List numbered items={data.findings.map((f) => ({ title: f.title, description: f.detail }))} />
      </Section>

      <Section title="下一步" description="四季度重点动作">
        <List numbered columns={3} items={data.actions.map((a) => ({ title: a.title, description: a.detail }))} />
      </Section>

      <Section title="背景信息" description="负责团队与统计口径">
        <KV
          labelCols={2}
          items={[
            { label: "负责团队", value: data.org },
            { label: "报告周期", value: data.period },
            { label: "覆盖区域", value: data.regions.map((r) => r.name).join("、") },
            { label: "统计周数", value: data.weekly.length + " 周" },
          ]}
        />
      </Section>
    </Page>
  )
}
