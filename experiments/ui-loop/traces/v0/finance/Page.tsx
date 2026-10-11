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
  KV,
} from "@/components/report"

const revenueSeries = [{ key: "revenue", label: "营业收入 / 万元" }]
const marginSeries = [{ key: "margin", label: "综合毛利率 / %" }]
const cashSeries = [{ key: "cash", label: "经营现金净流入 / 万元" }]

export default function Report() {
  return (
    <Page title={data.title} meta={[data.org, data.period]}>
      <Section title="结论" description="9 月经营概况与四季度关注重点">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="单位:亿元、%、万元、天;同比与环比口径">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              size={k.key === "revenue" ? "lg" : undefined}
              note={`${k.note} ${k.change}`}
              direction={k.direction === "down" ? "down" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="月度趋势"
        description="近 12 个月营业收入、综合毛利率与经营现金净流入"
        className="gap-12"
      >
        <Group title="营业收入 / 万元">
          <TrendChart
            data={data.monthly}
            xKey="label"
            series={revenueSeries}
            height="h-48"
            pointLabels="last"
          />
        </Group>
        <Grid cols={9}>
          <Block span={6} rows={2} title="综合毛利率 / %">
            <TrendChart
              data={data.monthly}
              xKey="label"
              series={marginSeries}
              height="fill"
              pointLabels="last"
            />
          </Block>
          <Block span={3} rows={2} title="经营现金净流入 / 万元">
            <TrendChart
              data={data.monthly}
              xKey="label"
              series={cashSeries}
              height="fill"
              zero
              pointLabels="last"
            />
          </Block>
        </Grid>
      </Section>

      <Section title="分部收入" description="各事业部收入、预算完成率、毛利率与同比,单位:万元">
        <DataTable
          columns={[
            { key: "name", label: "事业部", span: 2 },
            { key: "revenue", label: "收入 / 万元", align: "right", span: 2, bar: true },
            { key: "budget", label: "预算 / 万元", align: "right", span: 2 },
            { key: "attain", label: "预算完成率 / %", align: "right", span: 1 },
            { key: "margin", label: "毛利率 / %", align: "right", span: 1 },
            { key: "yoy", label: "同比", align: "right", span: 1 },
          ]}
          rows={data.units}
        />
      </Section>

      <Section
        title="费用结构"
        description="期间费用合计 3,140 万元,销售费用超出月度预算 8.4%"
      >
        <Grid cols={9} fields={false}>
          <Block span={3} title="费用构成占比">
            <ProgressList
              compact
              items={data.expenses.map((e) => ({
                label: e.name,
                value: e.share,
                max: 50,
                display: `${e.share.toFixed(1)}%`,
              }))}
            />
          </Block>
          <Block span={6} title="费用与预算 / 万元">
            <DataTable
              columns={[
                { key: "name", label: "费用项", span: 2 },
                { key: "value", label: "金额", align: "right", span: 2, bar: true },
                { key: "budget", label: "预算", align: "right", span: 1 },
                { key: "attain", label: "完成率 / %", align: "right", span: 1 },
              ]}
              rows={data.expenses}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="应收账款" description="期末余额 2.37 亿元,周转天数 68 天">
        <DataTable
          columns={[
            { key: "item", label: "项目", span: 4 },
            { key: "value", label: "数值", align: "right", span: 2 },
            { key: "note", label: "说明", span: 3 },
          ]}
          rows={[
            { item: "应收账款余额", value: "23,700 万元", note: "较上月增加 1,940 万元" },
            { item: "账龄 90 天以上占比", value: "18.6%", note: "占应收账款余额比重" },
            { item: "应收周转天数", value: "68 天", note: "环比延长 7 天" },
            { item: "本月回款", value: "12,480 万元", note: "9 月实际回款金额" },
          ]}
        />
      </Section>

      <Section title="主要发现" description="9 月经营中的三项关键变化">
        <List
          numbered
          items={data.findings.map((f) => ({ title: f.title, description: f.text }))}
        />
      </Section>

      <Section title="风险" description="四季度需跟踪的两项风险">
        <List
          columns={3}
          metaTone="destructive"
          items={data.risks.map((r) => ({
            title: r.title,
            description: r.text,
            meta: `${r.level}风险`,
          }))}
        />
      </Section>

      <Section title="下一步" description="三项行动、责任部门与完成时间">
        <List
          numbered
          columns={3}
          items={data.actions.map((a) => ({
            title: a.text,
            description: `${a.owner} · ${a.due}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="报告主体、口径与覆盖范围">
        <KV
          labelCols={2}
          items={[
            { label: "报告主体", value: "澄川智能装备有限公司" },
            { label: "编制部门", value: "财务管理部" },
            { label: "报告期间", value: data.period },
            {
              label: "覆盖范围",
              value:
                "5 个事业部(工业机器人、数控系统、自动化产线、智能仓储、售后与服务)",
            },
            { label: "对比口径", value: "同比(去年同期)、环比(上月)、月度预算" },
            { label: "金额单位", value: "万元,占比为金额口径" },
          ]}
        />
      </Section>
    </Page>
  )
}
