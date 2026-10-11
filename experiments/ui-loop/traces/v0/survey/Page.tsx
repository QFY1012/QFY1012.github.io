import data from "./data.json"
import { Page, Section, Grid, Block, Text, Stat, DataTable, ProgressList, List, KV } from "@/components/report"

const { title, team, period, summary, sample, nps, satisfaction, pains, segments, quotes, recommendations } = data

const painColumns = [
  { key: "name", label: "不满原因", span: 3 },
  { key: "share", label: "提及占比", align: "right" as const, span: 3, bar: true },
]

const detailColumns = [
  { key: "name", label: "体验维度", span: 4 },
  { key: "score", label: "评分（5 分制）", align: "right" as const, span: 3 },
  { key: "change", label: "环比", align: "right" as const, span: 2, tone: ["−0.2", "−0.4"] },
]

const scoreItems = satisfaction.map((s) => ({
  label: s.name,
  value: s.score,
  max: 5,
  display: `${s.score}`,
}))

const quoteItems = quotes.map((q) => ({ title: q.text, description: q.who }))

const stepItems = recommendations.map((r) => ({ title: r.title, description: r.detail }))

const backgroundItems = [
  { label: "负责团队", value: team },
  { label: "调研周期", value: period },
  { label: "有效问卷", value: `${sample.responses} 份` },
  { label: "深访人数", value: `${sample.interviews} 人` },
  { label: "回收率", value: `${sample.rate}%` },
]

export default function Report() {
  return (
    <Page title={title} meta={[team, period]}>
      <Section title="结论" description="本次调研的一句话判断">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="净推荐值与推荐者结构，口径为全部有效样本">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={nps.score}
            size="lg"
            captionBelow
            label="净推荐值（NPS）"
            note={`${nps.change} 较上次调研`}
          />
          <Stat span={3} value={nps.promoters} unit="%" captionBelow label="推荐者占比" note="评分 9 至 10 分" />
          <Stat span={3} value={nps.detractors} unit="%" captionBelow label="贬损者占比" note="评分 0 至 6 分" />
        </Grid>
      </Section>

      <Section title="拆解" description="按会员分层与体验维度对比，差距集中在老会员与低频会员" className="gap-12">
        <Grid cols={9} fields={false} className="items-baseline">
          {segments.map((s) => (
            <Stat
              span={2}
              key={s.name}
              value={s.nps}
              captionBelow
              label={s.name}
              note={`n=${s.n}，满意度 ${s.csat}`}
            />
          ))}
        </Grid>

        <Grid cols={9} fields={false}>
          <Block span={3} title="满意度评分（5 分制）">
            <ProgressList items={scoreItems} compact />
          </Block>
          <Block span={6} title="不满提及率（%）">
            <DataTable columns={painColumns} rows={pains} />
          </Block>
        </Grid>
      </Section>

      <Section title="明细" description="各体验维度的评分与环比变化">
        <DataTable columns={detailColumns} rows={satisfaction} />
      </Section>

      <Section title="原话" description="四条代表性反馈，来自深访与开放题">
        <List items={quoteItems} numbered />
      </Section>

      <Section title="下一步" description="三条改进动作，按预计影响排序">
        <List items={stepItems} columns={3} numbered />
      </Section>

      <Section title="背景信息" description="调研执行与样本口径">
        <KV items={backgroundItems} labelCols={2} />
      </Section>
    </Page>
  )
}
