import data from "./data.json"
import { Page, Section, Grid, Block, Text, Stat, DataTable, ProgressList, List, KV } from "@/components/report"

const painsColumns = [
  { key: "name", label: "不满项", span: 4 },
  { key: "share", label: "提及占比（%）", align: "right" as const, span: 2, bar: true },
]

export default function Report() {
  return (
    <Page title={data.title} meta={[data.team, data.period]}>
      <Section title="结论" description={`问卷 ${data.sample.responses} 份、深访 ${data.sample.interviews} 人。`}>
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="净推荐值为主指标，其余两项为口径拆解。">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={data.nps.score}
            label="净推荐值（NPS）"
            captionBelow
            note={`较上次 ${data.nps.change}`}
          />
          <Stat
            span={3}
            value={data.nps.promoters}
            unit="%"
            label="推荐者占比"
            captionBelow
            note={`中立者 ${data.nps.passives}%`}
          />
          <Stat
            span={3}
            value={data.nps.detractors}
            unit="%"
            label="贬损者占比"
            captionBelow
          />
        </Grid>
      </Section>

      <Section title="分群" description="按会员阶段与活跃度拆分，老会员和低频会员的净推荐值最低。">
        <Grid cols={9} fields={false}>
          {data.segments.map((s) => (
            <Stat
              key={s.name}
              span={2}
              value={s.nps}
              label={s.name}
              note={`n=${s.n}，CSAT ${s.csat}`}
            />
          ))}
        </Grid>
      </Section>

      <Section title="分维度" description="满意度为 5 分制、括号内为环比；不满占比为多选题。">
        <Grid cols={9}>
          <Block span={3} rows={2} title="满意度得分（5 分制）">
            <ProgressList
              compact
              items={data.satisfaction.map((s) => ({
                label: s.name,
                value: s.score,
                max: 5,
                display: `${s.score.toFixed(1)}（${s.change}）`,
              }))}
            />
          </Block>
          <Block span={6} rows={2} title="不满占比">
            <DataTable columns={painsColumns} rows={data.pains} />
          </Block>
        </Grid>
      </Section>

      <Section title="反馈" description="开放题与深访记录中的原话。">
        <List
          numbered
          items={data.quotes.map((q) => ({ title: q.text, description: q.who }))}
        />
      </Section>

      <Section title="下一步" description="三条改进方向，按影响面排序。">
        <List
          columns={3}
          numbered
          items={data.recommendations.map((r) => ({ title: r.title, description: r.detail }))}
        />
      </Section>

      <Section title="背景信息" description="本次调研的执行口径。">
        <KV
          labelCols={2}
          items={[
            { label: "负责团队", value: data.team },
            { label: "调研周期", value: data.period },
            { label: "问卷样本", value: `${data.sample.responses} 份` },
            { label: "深度访谈", value: `${data.sample.interviews} 人` },
            { label: "有效回收率", value: `${data.sample.rate}%` },
          ]}
        />
      </Section>
    </Page>
  )
}
