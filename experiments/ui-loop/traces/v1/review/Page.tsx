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
  BarChart,
  ProgressList,
  List,
  KV,
} from "@/components/report"

export default function Report() {
  const {
    title,
    target,
    date,
    summary,
    score,
    issueCounts,
    dimensions,
    trend,
    issues,
    componentUsage,
    nonstandard,
    recommendations,
    followUp,
  } = data

  return (
    <Page title={title} meta={[target, date]}>
      <Section title="结论" description="整体判断与优先处理方向">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="满分 100；问题数为本次走查发现">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={score.overall}
            label="综合得分"
            captionBelow
            note={`上次 ${score.previous} · 提升 ${score.overall - score.previous} 分`}
            direction="up"
          />
          <Stat
            span={3}
            value={issueCounts.total}
            label="问题总数"
            captionBelow
            note={`严重 ${issueCounts.severe} · 主要 ${issueCounts.major} · 次要 ${issueCounts.minor}`}
          />
          <Stat
            span={3}
            value={issueCounts.fixedSinceLast}
            label="较上次已修复"
            captionBelow
          />
        </Grid>
      </Section>

      <Section title="随时间变化" description="单位：个；按版本统计发现的问题数">
        <TrendChart
          data={trend}
          xKey="version"
          series={[{ key: "issues", label: "问题数" }]}
          height="h-48"
          pointLabels="last"
          yTicks={[23, 30, 32, 35, 37, 41]}
        />
      </Section>

      <Section title="拆分" description="满分 100；组件使用处数按当前页面统计">
        <Grid cols={9}>
          <Block span={3} rows={2} title="分维度得分">
            <ProgressList
              compact
              items={dimensions.map((d) => ({ label: d.name, value: d.score, max: 100 }))}
            />
          </Block>
          <Block span={6} rows={2} title="组件使用处数">
            <BarChart
              data={componentUsage}
              xKey="component"
              series={[{ key: "count", label: "使用处数" }]}
              layout="horizontal"
            />
          </Block>
        </Grid>
      </Section>

      <Section className="gap-12" title="明细" description="严重问题标红，建议为修改方向">
        <Group title="问题清单">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "title", label: "问题", span: 3 },
              { key: "severity", label: "严重程度", span: 1, tone: ["严重"] },
              { key: "location", label: "位置", span: 2 },
              { key: "suggestion", label: "建议", span: 2 },
            ]}
            rows={issues}
          />
        </Group>
        <Group title="不规范用法">
          <DataTable
            columns={[
              { key: "component", label: "组件", span: 2 },
              { key: "detail", label: "不规范说明", span: 5 },
              { key: "count", label: "处数", span: 2, align: "right", bar: true },
            ]}
            rows={nonstandard}
          />
        </Group>
      </Section>

      <Section title="下一步" description="按优先级排序，标注预估工作量与复查安排">
        <Grid cols={9}>
          <Block span={6} rows={2} title="建议">
            <List
              ordered
              divided={false}
              items={recommendations.map((r) => ({ title: r.title, description: r.detail }))}
            />
          </Block>
          <Block span={3} rows={2} title="复查安排">
            <KV
              labelCols={1}
              items={[
                { label: "日期", value: followUp.date },
                { label: "范围", value: followUp.scope },
                { label: "重点", value: followUp.focus },
              ]}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="背景信息" description="本次走查的口径">
        <KV
          labelCols={2}
          items={[
            { label: "走查对象", value: target },
            { label: "走查方法", value: followUp.method },
            { label: "走查人数", value: `${followUp.reviewers} 人` },
            { label: "用时", value: followUp.duration },
          ]}
        />
      </Section>
    </Page>
  )
}
