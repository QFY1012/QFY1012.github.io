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

const unitRows = data.units.map((u) => ({
  name: u.name,
  revenue: u.revenue,
  budget: u.budget,
  attain: u.attain,
  margin: u.margin,
  yoy: u.yoy,
}))

const expenseRows = data.expenses.map((e) => ({
  name: e.name,
  value: e.value,
  budget: e.budget,
  share: e.share,
  attain: e.attain,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.org, data.period]}>
      <Section title="结论" description="9 月经营与现金流总体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="环比为与 8 月对比，同比为与上年同期对比">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={1.42}
            unit="亿元"
            label="营业收入"
            note="同比 +11.6%"
            direction="up"
          />
          <Stat
            span={2}
            captionBelow
            value={34.8}
            unit="%"
            label="综合毛利率"
            note="环比 +1.2 个百分点"
            direction="up"
          />
          <Stat
            span={2}
            captionBelow
            value={1860}
            unit="万元"
            label="经营现金净流入"
            note="环比 −14.3%"
            direction="down"
          />
          <Stat
            span={2}
            captionBelow
            value={68}
            unit="天"
            label="应收周转天数"
            note="环比 +7 天"
            direction="down"
          />
        </Grid>
      </Section>

      <Section title="月度走势" description="近 12 个月营业收入与经营现金净流入，单位：万元">
        <Grid cols={9}>
          <Block span={6} rows={2} title="营业收入">
            <TrendChart
              data={data.monthly}
              xKey="label"
              series={[{ key: "revenue", label: "营业收入" }]}
              height="fill"
              pointLabels="last"
            />
          </Block>
          <Block span={3} rows={2} title="经营现金净流入">
            <TrendChart
              data={data.monthly}
              xKey="label"
              series={[{ key: "cash", label: "经营现金净流入" }]}
              height="fill"
              zero
              pointLabels="last"
            />
          </Block>
        </Grid>
      </Section>

      <Section title="事业部" description="各事业部收入与预算（万元）、预算完成率、毛利率及同比（%）">
        <DataTable
          columns={[
            { key: "name", label: "事业部", span: 3 },
            { key: "revenue", label: "收入", align: "right", span: 1 },
            { key: "budget", label: "预算", align: "right", span: 1 },
            { key: "attain", label: "完成率", align: "right", span: 2, bar: true },
            { key: "margin", label: "毛利率", align: "right", span: 1 },
            { key: "yoy", label: "同比", align: "right", span: 1 },
          ]}
          rows={unitRows}
        />
      </Section>

      <Section title="费用结构" description="期间费用合计 3,140 万元，金额与预算单位：万元，销售费用超预算 8.4%">
        <DataTable
          columns={[
            { key: "name", label: "费用项目", span: 3 },
            { key: "value", label: "金额", align: "right", span: 1 },
            { key: "budget", label: "预算", align: "right", span: 1 },
            { key: "share", label: "占比", align: "right", span: 2, bar: true },
            { key: "attain", label: "完成率", align: "right", span: 2, bar: true },
          ]}
          rows={expenseRows}
        />
      </Section>

      <Section title="应收账款" description="应收账款余额与本月回款，单位：万元">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={23700}
            unit="万元"
            label="应收账款余额"
            note="较上月 +1,940 万元"
          />
          <Stat span={3} captionBelow value={18.6} unit="%" label="90 天以上账龄占比" />
          <Stat span={3} captionBelow value={12480} unit="万元" label="本月回款" />
        </Grid>
      </Section>

      <Section title="主要发现" description="9 月经营中的三项关键变化">
        <List
          numbered
          items={data.findings.map((f) => ({ title: f.title, description: f.text }))}
        />
      </Section>

      <Section title="风险提示" description="四季度需重点关注的两项风险">
        <List
          columns={3}
          metaTone="destructive"
          items={data.risks.map((r) => ({
            title: r.title,
            description: r.text,
            meta: r.level,
          }))}
        />
      </Section>

      <Section title="下一步" description="三项待办事项与责任部门、完成时限">
        <List
          columns={3}
          numbered
          items={data.actions.map((a) => ({
            title: a.text,
            meta: `${a.owner} · ${a.due}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="报表编制单位与统计区间">
        <KV
          labelCols={2}
          items={[
            { label: "编制单位", value: data.org },
            { label: "报告期间", value: data.period },
          ]}
        />
      </Section>
    </Page>
  )
}
