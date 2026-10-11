import data from "./data.json"
import { Page, Section, Grid, Block, Text, Stat, ProgressList, List, KV } from "@/components/report"

export default function Report() {
  const { nps, segments, satisfaction, pains, quotes, recommendations, sample } = data

  return (
    <Page title={data.title} meta={["会员体验调研", data.period]}>
      <Section title="结论" description="本次调研的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="净推荐值及推荐者、中立者、贬损者构成">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={nps.score}
            size="lg"
            captionBelow
            label="会员净推荐值"
            note={`较上次调研 ${nps.change}`}
          />
          <Stat span={3} value={nps.promoters} unit="%" captionBelow label="推荐者占比" />
          <Stat span={3} value={nps.passives} unit="%" captionBelow label="中立者占比" />
          <Stat span={3} value={nps.detractors} unit="%" captionBelow label="贬损者占比" />
        </Grid>
      </Section>

      <Section title="会员分群" description="四类会员的净推荐值与满意度（5 分制）">
        <Grid cols={9} fields={false} className="items-baseline">
          {segments.map((s) => (
            <Stat
              key={s.name}
              span={2}
              value={s.nps}
              captionBelow
              label={s.name}
              note={`满意度 ${s.csat} · 样本 ${s.n}`}
            />
          ))}
        </Grid>
      </Section>

      <Section title="维度得分" description="六项体验的满意度得分（5 分制），括号内为与上次的差值">
        <Grid cols={9}>
          <Block span={3} title="满意度得分">
            <ProgressList
              compact
              items={satisfaction.map((s) => ({
                label: s.name,
                value: s.score,
                max: 5,
                display: `${s.score}（${s.change}）`,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="痛点占比" description="提及最多的五个问题及提及占比（%）">
        <Grid cols={9}>
          <Block span={3} title="痛点提及占比">
            <ProgressList
              compact
              items={pains.map((p) => ({
                label: p.name,
                value: p.share,
                max: 100,
                display: `${p.share}%`,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="用户原声" description="开放题与访谈中的典型反馈">
        <List
          numbered
          items={quotes.map((q) => ({
            title: q.who,
            description: q.text,
          }))}
        />
      </Section>

      <Section title="下一步" description="针对主要痛点的三条改进建议">
        <List
          columns={3}
          numbered
          items={recommendations.map((r) => ({
            title: r.title,
            description: r.detail,
          }))}
        />
      </Section>

      <Section title="背景信息" description="调研执行情况">
        <KV
          labelCols={2}
          items={[
            { label: "负责团队", value: data.team },
            { label: "有效问卷", value: `${sample.responses} 份` },
            { label: "深度访谈", value: `${sample.interviews} 人` },
            { label: "问卷回收率", value: `${sample.rate}%` },
          ]}
        />
      </Section>
    </Page>
  )
}
