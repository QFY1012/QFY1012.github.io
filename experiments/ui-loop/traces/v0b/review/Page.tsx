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

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "title", label: "问题", span: 3 },
  { key: "severity", label: "严重程度", span: 1, tone: ["严重"] },
  { key: "location", label: "位置", span: 2 },
  { key: "suggestion", label: "建议", span: 2 },
]

const issueRows = data.issues.map((item) => ({
  id: item.id,
  title: item.title,
  severity: item.severity,
  location: item.location,
  suggestion: item.suggestion,
}))

const nonstandardColumns = [
  { key: "component", label: "组件", span: 2 },
  { key: "detail", label: "问题", span: 5 },
  { key: "count", label: "处数", span: 2, align: "right" as const, bar: true },
]

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description="本次走查的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="关键数字与问题分布">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={data.score.overall}
            unit="分"
            label="综合得分"
            note={`上次 ${data.score.previous}，满分 ${data.score.max}`}
          />
          <Stat
            span={3}
            captionBelow
            value={data.issueCounts.total}
            unit="个"
            label="未关闭问题"
            note={`严重 ${data.issueCounts.severe} · 主要 ${data.issueCounts.major} · 次要 ${data.issueCounts.minor}`}
          />
          <Stat
            span={3}
            captionBelow
            value={data.issueCounts.fixedSinceLast}
            unit="个"
            label="较上次修复"
            note="上一版本走查后已修复"
          />
        </Grid>
      </Section>

      <Section title="随时间变化" description="各版本未关闭问题数，单位：个">
        <TrendChart
          data={data.trend}
          xKey="version"
          series={[{ key: "issues", label: "未关闭问题数" }]}
          height="h-48"
          pointLabels="last"
        />
      </Section>

      <Section title="分维度" description="五个维度得分，满分 100">
        <Grid cols={9} fields={false}>
          <Block span={3} title="各维度得分">
            <ProgressList
              compact
              items={data.dimensions.map((item) => ({
                label: item.name,
                value: item.score,
                max: data.score.max,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="分类别" description="组件使用量与不规范用法，单位：处">
        <Grid cols={9} fields={false}>
          <Block span={3} title="组件使用量">
            <ProgressList
              compact
              items={data.componentUsage.map((item) => ({
                label: item.component,
                value: item.count,
                max: data.componentUsage[0].count,
                display: String(item.count),
              }))}
            />
          </Block>
          <Block span={6} title="不规范用法">
            <DataTable columns={nonstandardColumns} rows={data.nonstandard} />
          </Block>
        </Grid>
      </Section>

      <Section title="明细" description="严重与主要问题逐条列出">
        <DataTable columns={issueColumns} rows={issueRows} />
      </Section>

      <Section title="下一步" description="建议排期与复查安排" className="gap-12">
        <Grid cols={9} fields={false}>
          <Block span={6} title="建议">
            <List
              ordered
              divided={false}
              items={data.recommendations.map((item) => ({
                title: item.title,
                description: item.detail,
              }))}
            />
          </Block>
          <Block span={3} title="复查安排">
            <KV
              labelCols={1}
              items={[
                { label: "日期", value: data.followUp.date },
                { label: "范围", value: data.followUp.scope },
                { label: "重点", value: data.followUp.focus },
                { label: "方式", value: data.followUp.method },
                { label: "走查人", value: `${data.followUp.reviewers} 人` },
                { label: "时长", value: data.followUp.duration },
              ]}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="背景信息" description="走查范围与执行方式">
        <KV
          labelCols={2}
          items={[
            { label: "走查对象", value: data.target },
            { label: "走查日期", value: data.date },
            { label: "走查范围", value: data.followUp.scope },
            { label: "走查重点", value: data.followUp.focus },
            { label: "走查方法", value: data.followUp.method },
            { label: "走查人数", value: `${data.followUp.reviewers} 人` },
            { label: "走查时长", value: data.followUp.duration },
          ]}
        />
      </Section>
    </Page>
  )
}
