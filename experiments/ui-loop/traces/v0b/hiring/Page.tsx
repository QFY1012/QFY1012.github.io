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

type Dir = "up" | "down"
const dirOf = (d: string): Dir => (d === "down" ? "down" : "up")

export default function Report() {
  const [primary, ...rest] = data.kpis
  const channels = data.channels.map((c) => ({ ...c, share: `${c.share}%` }))

  return (
    <Page title={data.title} meta={[data.org, data.period]}>
      <Section title="结论" description="本季度整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="关键数字与上季度对比">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={primary.value}
            unit={primary.unit}
            label={primary.label}
            captionBelow
            size="lg"
            note={`环比 ${primary.change}`}
            direction={dirOf(primary.direction)}
          />
          {rest.map((k) => (
            <Stat
              key={k.key}
              span={2}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              note={`环比 ${k.change}`}
              direction={dirOf(k.direction)}
            />
          ))}
        </Grid>
      </Section>

      <Section title="招聘漏斗" description="从投递到入职,单位:人">
        <DataTable
          columns={[
            { key: "stage", label: "环节", span: 4 },
            { key: "count", label: "人数", span: 5, align: "right", bar: true },
          ]}
          rows={data.funnel}
        />
      </Section>

      <Section title="时间趋势" description="按周统计,共 13 周" className="gap-12">
        <Group title="投递量(份)">
          <TrendChart
            data={data.weekly}
            xKey="week"
            series={[{ key: "applications", label: "投递" }]}
            height="h-48"
            pointLabels="last"
            lastLabel="第 13 周"
          />
        </Group>
        <Group title="面试量(场)">
          <TrendChart
            data={data.weekly}
            xKey="week"
            series={[{ key: "interviews", label: "面试" }]}
            height="h-48"
            pointLabels="last"
            lastLabel="第 13 周"
          />
        </Group>
      </Section>

      <Section title="渠道表现" description="按渠道统计的入职人数、占比与单人成本">
        <Grid cols={9}>
          <Block span={3} rows={2} title="入职占比">
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
          <Block span={6} rows={2} title="产出与成本">
            <DataTable
              columns={[
                { key: "name", label: "渠道", span: 2 },
                { key: "hires", label: "入职(人)", span: 1, align: "right", bar: true },
                { key: "cost", label: "单人成本(万元)", span: 3, align: "right" },
              ]}
              rows={data.channels}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="岗位进展" description="按岗位统计的计划编制、入职进度与招聘周期">
        <DataTable
          columns={[
            { key: "name", label: "岗位", span: 2 },
            { key: "dept", label: "部门", span: 2 },
            { key: "plan", label: "计划", span: 1, align: "right" },
            { key: "hired", label: "入职", span: 1, align: "right", bar: true },
            { key: "pending", label: "待入职", span: 1, align: "right" },
            { key: "applications", label: "简历量", span: 1, align: "right" },
            { key: "cycle", label: "周期(天)", span: 1, align: "right" },
          ]}
          rows={data.positions}
        />
      </Section>

      <Section title="主要发现" description="本季度值得注意的三点">
        <List
          numbered
          items={data.findings.map((f) => ({ title: f.title, description: f.detail }))}
        />
      </Section>

      <Section title="风险提示" description="需要持续关注的两项风险">
        <List
          columns={3}
          metaTone="destructive"
          items={data.risks.map((r) => ({ title: r, meta: "高" }))}
        />
      </Section>

      <Section title="下一步" description="四季度优先推进的三件事">
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
            { label: "简历总量", value: "9,840 份" },
            { label: "发出 offer", value: "109 个" },
            { label: "实际入职", value: "86 人" },
          ]}
        />
      </Section>
    </Page>
  )
}
