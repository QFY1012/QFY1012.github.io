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
  List,
  KV,
} from "@/components/report"

export default function Report() {
  const routeRows = data.routes.map((r) => ({
    route: `${r.from}—${r.to}`,
    orders: r.orders,
    ontime: r.ontime,
    hours: r.hours,
    exceptions: r.exceptions,
    change: r.change,
  }))

  const delayRows = data.delays.map((d) => ({
    reason: d.reason,
    note: d.note,
    share: d.share,
    count: d.count,
  }))

  return (
    <Page title={data.title} meta={[data.org, data.period]}>
      <Section
        title="结论"
        description="节前高峰推高单量、压低准时率，10 月 3 日起各项指标已回升。"
      >
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section
        title="核心指标"
        description="本周为 9 月 28 日至 10 月 4 日，环比对照上一周（9/21 – 9/27）。"
      >
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value="92.7"
            unit="%"
            label="准时率"
            captionBelow
            size="lg"
            note="环比 −1.9 个百分点"
            direction="down"
          />
          <Stat
            span={3}
            value="186.4"
            unit="万单"
            label="本周单量"
            captionBelow
            note="环比 +6.8%"
          />
          <Stat
            span={3}
            value="31.9"
            unit="小时"
            label="平均时效"
            captionBelow
            note="环比 +2.4 小时"
            direction="down"
          />
          <Stat
            span={3}
            value="4812"
            unit="件"
            label="异常件"
            captionBelow
            note="环比 +23.5%"
            direction="down"
          />
        </Grid>
      </Section>

      <Section
        title="时效走势"
        description="按发件日统计，含前一周对照；单位为 %、万单、小时。"
        className="gap-12"
      >
        <Group title="准时率（%）">
          <TrendChart
            data={data.daily}
            xKey="date"
            series={[{ key: "ontime", label: "准时率" }]}
            height="h-48"
            pointLabels="last"
            xInterval={2}
          />
        </Group>
        <Group>
          <Grid cols={9}>
            <Block span={6} rows={2} title="日均单量（万单）">
              <TrendChart
                data={data.daily}
                xKey="date"
                series={[{ key: "orders", label: "单量" }]}
                height="fill"
                pointLabels="last"
                xInterval={2}
              />
            </Block>
            <Block span={3} rows={2} title="平均时效（小时）">
              <TrendChart
                data={data.daily}
                xKey="date"
                series={[{ key: "hours", label: "时效" }]}
                height="fill"
                pointLabels="last"
                xInterval={4}
              />
            </Block>
          </Grid>
        </Group>
      </Section>

      <Section
        title="线路时效"
        description="单量单位万单，时效单位小时；环比对照上一周。"
      >
        <DataTable
          columns={[
            { key: "route", label: "线路", span: 2 },
            { key: "orders", label: "单量", align: "right", span: 1 },
            { key: "ontime", label: "准时率", align: "right", span: 2 },
            { key: "hours", label: "时效", align: "right", span: 1 },
            { key: "exceptions", label: "异常件", align: "right", span: 1 },
            {
              key: "change",
              label: "环比",
              align: "right",
              span: 2,
              tone: [
                "−1.2 个百分点",
                "−3.1 个百分点",
                "−0.9 个百分点",
                "−4.4 个百分点",
                "−2.6 个百分点",
              ],
            },
          ]}
          rows={routeRows}
        />
      </Section>

      <Section
        title="延误归因"
        description="延误件按原因归类，占比为该原因占全部延误件的比例。"
      >
        <DataTable
          columns={[
            { key: "reason", label: "原因", span: 2 },
            { key: "note", label: "说明", span: 4 },
            { key: "share", label: "占比（%）", align: "right", span: 2, bar: true },
            { key: "count", label: "件数", align: "right", span: 1 },
          ]}
          rows={delayRows}
        />
      </Section>

      <Section title="主要发现" description="本周三个值得关注的现象。">
        <List
          numbered
          items={data.findings.map((f) => ({
            title: f.title,
            description: f.detail,
          }))}
        />
      </Section>

      <Section title="风险提示" description="下周及双十一前的两项风险。">
        <List
          columns={3}
          metaTone="destructive"
          items={data.risks.map((r) => ({
            title: r.title,
            description: r.detail,
            meta: "高",
          }))}
        />
      </Section>

      <Section title="下一步" description="已定或即将落地的三项动作。">
        <List
          columns={3}
          numbered
          items={data.actions.map((a) => ({
            title: a.title,
            description: a.detail,
          }))}
        />
      </Section>

      <Section title="背景信息" description="报告口径与覆盖范围。">
        <KV
          labelCols={2}
          items={[
            { label: "负责团队", value: data.org },
            { label: "报告周期", value: data.period },
            { label: "对照周期", value: "9/21 – 9/27" },
            { label: "覆盖线路", value: "7 条" },
          ]}
        />
      </Section>
    </Page>
  )
}
