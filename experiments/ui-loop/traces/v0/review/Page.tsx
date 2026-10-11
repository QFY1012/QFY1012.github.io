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

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description="整体可用，问题集中在筛选区与批量操作">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="得分满分 100，问题按严重程度分级">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={data.score.overall}
            label="综合得分"
            captionBelow
            note={`上次 ${data.score.previous} · 满分 ${data.score.max}`}
          />
          <Stat
            span={3}
            value={data.issueCounts.total}
            label="待处理问题"
            captionBelow
            note={`严重 ${data.issueCounts.severe} · 主要 ${data.issueCounts.major} · 次要 ${data.issueCounts.minor}`}
          />
          <Stat
            span={3}
            value={data.issueCounts.fixedSinceLast}
            label="已修复"
            captionBelow
            note="较上次走查"
          />
        </Grid>
      </Section>

      <Section title="随时间变化" description="近六个版本待处理问题数，持续下降">
        <Grid cols={9}>
          <Block span={6} rows={2} title="各版本问题数">
            <TrendChart
              data={data.trend}
              xKey="version"
              series={[{ key: "issues", label: "问题数" }]}
              height="fill"
              pointLabels="last"
              lastLabel="23"
            />
          </Block>
          <Block span={3} rows={2} title="逐版本明细">
            <DataTable
              columns={[
                { key: "version", label: "版本", span: 1 },
                { key: "issues", label: "问题数", span: 2, align: "right", bar: true },
              ]}
              rows={data.trend}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="分维度" description="各维度得分与组件使用次数">
        <Grid cols={9} fields={false}>
          <Block span={3} title="维度得分">
            <ProgressList
              compact
              items={data.dimensions.map((d) => ({
                label: d.name,
                value: d.score,
                max: 100,
              }))}
            />
          </Block>
          <Block span={6} title="组件使用次数">
            <DataTable
              columns={[
                { key: "component", label: "组件", span: 3 },
                { key: "count", label: "次数", span: 3, align: "right", bar: true },
              ]}
              rows={data.componentUsage}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="明细" description="按严重程度排序的问题与规范偏差" className="gap-12">
        <Group title="问题清单">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "title", label: "问题", span: 3 },
              { key: "severity", label: "严重程度", span: 1, tone: ["严重"] },
              { key: "location", label: "位置", span: 1 },
              { key: "suggestion", label: "建议", span: 3 },
            ]}
            rows={data.issues}
          />
        </Group>
        <Group title="规范偏差">
          <DataTable
            columns={[
              { key: "component", label: "组件", span: 2 },
              { key: "detail", label: "偏差说明", span: 4 },
              { key: "count", label: "处数", span: 3, align: "right", bar: true },
            ]}
            rows={data.nonstandard}
          />
        </Group>
      </Section>

      <Section title="下一步" description="按优先级排期，走查后一周复查">
        <Grid cols={9} fields={false}>
          <List
            span={6}
            ordered
            divided={false}
            items={data.recommendations.map((r) => ({
              title: r.title,
              description: r.detail,
            }))}
          />
          <KV
            span={3}
            labelCols={1}
            items={[
              { label: "复查日期", value: data.followUp.date },
              { label: "范围", value: data.followUp.scope },
              { label: "重点", value: data.followUp.focus },
              { label: "方式", value: data.followUp.method },
              { label: "人数", value: `${data.followUp.reviewers} 人` },
              { label: "时长", value: data.followUp.duration },
            ]}
          />
        </Grid>
      </Section>

      <Section title="背景信息" description="走查对象与口径">
        <KV
          labelCols={2}
          items={[
            { label: "走查对象", value: data.target },
            { label: "走查日期", value: data.date },
            {
              label: "问题总数",
              value: `${data.issueCounts.total} 条（严重 ${data.issueCounts.severe}、主要 ${data.issueCounts.major}、次要 ${data.issueCounts.minor}）`,
            },
            { label: "已修复", value: `${data.issueCounts.fixedSinceLast} 条` },
          ]}
        />
      </Section>
    </Page>
  )
}
