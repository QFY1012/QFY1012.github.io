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

// The compact progress rows give the name 4.5rem; 客户成功经理 needs a short form.
const SHORT_LABELS: Record<string, string> = { 客户成功经理: "客户成功" }

export default function Report() {
  const positionProgress = data.positions.map((p) => ({
    label: SHORT_LABELS[p.name] ?? p.name,
    value: p.hired,
    max: p.plan,
    display: `${p.hired}/${p.plan}`,
  }))

  return (
    <Page title={data.title} meta={[data.org, data.period]}>
      <Section title="结论" description="三季度整体产出与主要问题">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="整体产出与漏斗转化" className="gap-12">
        <Group>
          <Grid cols={9} fields={false} className="items-baseline">
            <Stat
              span={3}
              size="lg"
              captionBelow
              value={86}
              unit="人"
              label="入职人数"
              note="环比 +13.2%"
            />
            <Stat
              span={3}
              captionBelow
              value={81.1}
              unit="%"
              label="HC 完成率"
              note="环比 −2.6 个百分点"
              direction="down"
            />
            <Stat
              span={3}
              captionBelow
              value={34}
              unit="天"
              label="平均招聘周期"
              note="环比 +4 天"
              direction="down"
            />
            <Stat
              span={3}
              captionBelow
              value={78.9}
              unit="%"
              label="offer 接受率"
              note="环比 −4.1 个百分点"
              direction="down"
            />
          </Grid>
        </Group>
        <Group title="招聘漏斗">
          <DataTable
            columns={[
              { key: "stage", label: "阶段", span: 5 },
              { key: "count", label: "人数", align: "right", span: 4, bar: true },
            ]}
            rows={data.funnel}
          />
        </Group>
      </Section>

      <Section title="时间趋势" description="按自然周统计，单位：份、场">
        <Grid cols={9}>
          <Block span={6} rows={2} title="每周简历投递量">
            <TrendChart
              data={data.weekly}
              xKey="week"
              series={[{ key: "applications", label: "投递量" }]}
              height="fill"
              pointLabels="last"
              xInterval={2}
            />
          </Block>
          <Block span={3} rows={2} title="每周面试场次">
            <TrendChart
              data={data.weekly}
              xKey="week"
              series={[{ key: "interviews", label: "面试场次" }]}
              height="fill"
              pointLabels="last"
              xInterval={3}
            />
          </Block>
        </Grid>
      </Section>

      <Section
        title="拆分"
        description="各岗位 HC 完成率、渠道构成与岗位明细"
        className="gap-12"
      >
        <Group>
          <Grid cols={9}>
            <Block span={3} rows={3} title="HC 完成率">
              <ProgressList compact items={positionProgress} />
            </Block>
            <Block span={6} rows={3} title="渠道构成">
              <DataTable
                columns={[
                  { key: "name", label: "渠道", span: 2 },
                  { key: "hires", label: "入职", align: "right", span: 1 },
                  { key: "share", label: "占比", align: "right", span: 2, bar: true },
                  { key: "cost", label: "成本", align: "right", span: 1 },
                ]}
                rows={data.channels}
              />
            </Block>
          </Grid>
        </Group>
        <Group title="岗位招聘明细">
          <DataTable
            columns={[
              { key: "name", label: "岗位", span: 2 },
              { key: "dept", label: "部门", span: 2 },
              { key: "plan", label: "计划", align: "right", span: 1 },
              { key: "hired", label: "入职", align: "right", span: 1 },
              { key: "pending", label: "待招", align: "right", span: 1 },
              { key: "applications", label: "简历量", align: "right", span: 1 },
              { key: "cycle", label: "周期", align: "right", span: 1 },
            ]}
            rows={data.positions}
          />
        </Group>
      </Section>

      <Section title="主要发现" description="三季度的三条关键结论">
        <List
          numbered
          items={data.findings.map((f) => ({ title: f.title, description: f.detail }))}
        />
      </Section>

      <Section title="风险" description="四季度需要关注的两项风险">
        <List
          columns={3}
          metaTone="destructive"
          items={data.risks.map((r) => ({ description: r, meta: "高" }))}
        />
      </Section>

      <Section title="下一步" description="四季度招聘工作的三项调整">
        <List
          columns={3}
          numbered
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
            { label: "入职人数", value: "86 人" },
          ]}
        />
      </Section>
    </Page>
  )
}
