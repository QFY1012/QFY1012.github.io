import data from "./data.json"
import { Page, Section, Grid, Text, Stat, DataTable, TrendChart, List, KV } from "@/components/report"

export default function Report() {
  const kpis = data.kpis.map((k) => ({
    key: k.key,
    value: String(k.value),
    label: k.label,
    unit: k.unit,
    note: k.change,
    direction: k.direction as "up" | "down",
  }))

  return (
    <Page title={data.title} meta={[data.org, data.period]}>
      <Section title="结论" description="整体表现与主要结论">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="单位见各指标，变动为同比">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((k, i) => (
            <Stat
              key={k.key}
              span={3}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              size={i === 0 ? "lg" : undefined}
              note={k.note}
              direction={k.direction}
            />
          ))}
        </Grid>
      </Section>

      <Section title="收入走势" description="单位：万元，13 周确认收入">
        <TrendChart
          data={data.weekly}
          xKey="week"
          series={[{ key: "revenue", label: "周收入" }]}
          height="h-48"
          yTicks={[2000, 2100, 2200, 2300]}
          pointLabels="last"
        />
      </Section>

      <Section title="区域表现" description="单位：万元，完成率为收入除以目标">
        <DataTable
          columns={[
            { key: "name", label: "区域", span: 1 },
            { key: "revenue", label: "收入", align: "right", span: 2 },
            { key: "target", label: "目标", align: "right", span: 2 },
            { key: "attain", label: "完成率", align: "right", span: 2, tone: ["88.0", "66.5"] },
            { key: "change", label: "同比", align: "right", span: 2 },
          ]}
          rows={data.regions.map((r) => ({
            name: r.name,
            revenue: r.revenue.toLocaleString(),
            target: r.target.toLocaleString(),
            attain: r.attain.toFixed(1),
            change: r.change,
          }))}
        />
      </Section>

      <Section title="产品结构" description="单位：万元，占比为各产品收入占比">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 3 },
            { key: "revenue", label: "收入", align: "right", span: 2 },
            { key: "share", label: "占比 %", align: "right", span: 2, bar: true },
            { key: "change", label: "同比", align: "right", span: 2 },
          ]}
          rows={data.products.map((p) => ({
            name: p.name,
            revenue: p.revenue.toLocaleString(),
            share: p.share,
            change: p.change,
          }))}
        />
      </Section>

      <Section title="主要发现" description="三条关键结论">
        <List
          numbered
          items={data.findings.map((f) => ({ title: f.title, description: f.detail }))}
        />
      </Section>

      <Section title="下一步" description="四季度重点动作">
        <List
          numbered
          columns={3}
          items={data.actions.map((a) => ({ title: a.title, description: a.detail }))}
        />
      </Section>

      <Section title="背景信息" description="报告范围与口径">
        <KV
          labelCols={2}
          items={[
            { label: "负责团队", value: data.org },
            { label: "报告周期", value: data.period },
            { label: "覆盖区域", value: "6 个" },
            { label: "产品线", value: "5 类" },
          ]}
        />
      </Section>
    </Page>
  )
}
