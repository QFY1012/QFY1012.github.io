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

const num = (n: number) => n.toLocaleString("en-US")

export default function Report() {
  const { title, org, period, summary, kpis, funnel, weekly, positions, channels, findings, actions, risks } = data

  const funnelItems = funnel.map((f) => ({
    label: f.stage,
    value: f.count,
    max: funnel[0].count,
    display: num(f.count),
  }))

  const cycleItems = [...positions]
    .sort((a, b) => b.cycle - a.cycle)
    .map((p) => ({ label: p.name, value: p.cycle, max: 60, display: `${p.cycle} 天` }))

  const positionColumns = [
    { key: "name", label: "岗位", span: 2 },
    { key: "dept", label: "部门", span: 2 },
    { key: "plan", label: "计划", span: 1, align: "right" as const },
    { key: "hired", label: "入职", span: 1, align: "right" as const },
    { key: "pending", label: "待招", span: 1, align: "right" as const },
    { key: "applications", label: "简历", span: 2, align: "right" as const, bar: true },
  ]

  const channelColumns = [
    { key: "name", label: "渠道", span: 3 },
    { key: "hires", label: "入职人数", span: 2, align: "right" as const },
    { key: "share", label: "占比", span: 2, align: "right" as const, bar: true },
    { key: "cost", label: "单人成本", span: 2, align: "right" as const },
  ]

  return (
    <Page title={title} meta={[org, period]}>
      <Section title="结论" description="全公司口径,含社招与校招">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="四项核心指标,变化为同比">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              size={k.key === "hires" ? "lg" : undefined}
              note={k.change}
              direction={k.direction === "down" ? "down" : "up"}
            />
          ))}
        </Grid>
      </Section>

      <Section title="招聘节奏" description="每周投递与面试量,以及从投递到入职五个阶段的人数">
        <Grid cols={9}>
          <Block span={3} rows={2} title="招聘漏斗">
            <ProgressList compact items={funnelItems} />
          </Block>
          <Block span={6} rows={2} title="每周投递与面试">
            <TrendChart
              data={weekly}
              xKey="week"
              series={[
                { key: "applications", label: "投递" },
                { key: "interviews", label: "面试" },
              ]}
              height="fill"
              pointLabels="last"
            />
          </Block>
        </Grid>
      </Section>

      <Section
        title="岗位进展"
        description="各在招岗位的 HC 计划、入职、待招人数与简历量,以及平均招聘周期(天)"
        className="gap-12"
      >
        <Group>
          <DataTable columns={positionColumns} rows={positions} />
        </Group>
        <Group>
          <Grid cols={9} fields={false}>
            <Block span={3} title="平均招聘周期(天)">
              <ProgressList compact items={cycleItems} />
            </Block>
          </Grid>
        </Group>
      </Section>

      <Section title="渠道效果" description="各渠道入职人数、占比(%)与单人招聘成本(万元)">
        <DataTable columns={channelColumns} rows={channels} />
      </Section>

      <Section title="主要发现" description="本季度招聘的三个主要发现">
        <List numbered items={findings.map((f) => ({ title: f.title, description: f.detail }))} />
      </Section>

      <Section title="风险" description="四季度需要提前应对的两点">
        <List columns={3} items={risks.map((r) => ({ description: r }))} />
      </Section>

      <Section title="下一步" description="四季度招聘的三个动作">
        <List
          numbered
          columns={3}
          items={actions.map((a) => ({ title: a.title, description: a.detail }))}
        />
      </Section>

      <Section title="背景信息" description="报告主体、统计周期与覆盖岗位">
        <KV
          labelCols={2}
          items={[
            { label: "负责团队", value: org },
            { label: "统计周期", value: period },
            { label: "覆盖岗位", value: positions.map((p) => p.name).join("、") },
          ]}
        />
      </Section>
    </Page>
  )
}
