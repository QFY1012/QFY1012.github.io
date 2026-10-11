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

export default function Report() {
  const regions = data.regions.map((r) => ({ ...r, attain: r.attain.toFixed(1) }))

  return (
    <Page title={data.title} meta={[data.org, data.period]}>
      <Section title="结论" description="本季度整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="季度收入、目标完成率、新签客户与客户流失率">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={data.kpis[0].value}
            unit={data.kpis[0].unit}
            label={data.kpis[0].label}
            note={data.kpis[0].change}
            direction="up"
          />
          <Stat
            span={3}
            captionBelow
            value={data.kpis[1].value}
            unit={data.kpis[1].unit}
            label={data.kpis[1].label}
            note={data.kpis[1].change}
            direction="down"
          />
          <Stat
            span={3}
            captionBelow
            value={data.kpis[2].value}
            unit={data.kpis[2].unit}
            label={data.kpis[2].label}
            note={data.kpis[2].change}
            direction="up"
          />
          <Stat
            span={3}
            captionBelow
            value={data.kpis[3].value}
            unit={data.kpis[3].unit}
            label={data.kpis[3].label}
            note={data.kpis[3].change}
            direction="down"
          />
        </Grid>
      </Section>

      <Section title="时间趋势" description="周收入，单位：万元">
        <TrendChart
          span={9}
          data={data.weekly}
          xKey="week"
          series={[{ key: "revenue", label: "周收入" }]}
          height="h-48"
          xInterval={1}
          pointLabels="last"
        />
      </Section>

      <Section title="区域表现" description="各区收入与目标（万元）、达成率与同比">
        <Grid cols={9} fields={false} className="items-start">
          <Block span={6} title="各区收入与目标">
            <DataTable
              columns={[
                { key: "name", label: "区域", span: 1 },
                { key: "revenue", label: "收入", align: "right", span: 2 },
                { key: "target", label: "目标", align: "right", span: 1 },
                {
                  key: "attain",
                  label: "达成率",
                  align: "right",
                  span: 1,
                  tone: ["88.0%", "66.5%"],
                },
                { key: "change", label: "同比", align: "right", span: 1, tone: ["−6.3%"] },
              ]}
              rows={regions.map((r) => ({ ...r, attain: `${r.attain}%` }))}
            />
          </Block>
          <Block span={3} title="达成率">
            <ProgressList
              compact
              items={regions.map((r) => ({
                label: r.name,
                value: Number(r.attain),
                max: 110,
                display: `${r.attain}%`,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="产品结构" description="各产品线收入结构，单位：万元">
        <Grid cols={9} fields={false}>
          <Block span={9} title="产品收入、占比与同比">
            <DataTable
              columns={[
                { key: "name", label: "产品", span: 2 },
                { key: "revenue", label: "收入", align: "right", span: 2 },
                { key: "share", label: "占比 (%)", align: "right", span: 2, bar: true },
                { key: "change", label: "同比", align: "right", span: 3, tone: ["−2.8%"] },
              ]}
              rows={data.products}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="主要发现" description="本季度三点主要发现">
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

      <Section title="背景信息" description="报告口径与负责团队">
        <KV
          labelCols={2}
          items={[
            { label: "负责团队", value: data.org },
            { label: "报告周期", value: data.period },
          ]}
        />
      </Section>
    </Page>
  )
}
