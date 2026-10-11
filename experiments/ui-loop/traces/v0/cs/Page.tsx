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

export default function Report() {
  return (
    <Page title={data.title} meta={[data.org, data.period]}>
      <Section title="结论" description="九月服务水平与质检结果的总体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section
        title="核心指标"
        description="全中心 9 月累计，环比与上月对比"
        className="gap-12"
      >
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              size="lg"
              captionBelow
              value={k.value}
              unit={k.unit}
              label={k.label}
              note={`环比 ${k.change}`}
              direction={k.direction === "down" ? "down" : "up"}
            />
          ))}
        </Grid>
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={`${data.qa.score}`}
            unit="分"
            label="质检平均分"
            note={`较上月 ${data.qa.change}，目标 ${data.qa.target} 分`}
          />
          <Stat
            span={3}
            captionBelow
            value={data.qa.sampled.toLocaleString("en-US")}
            unit="通"
            label="抽检样本"
            note={`覆盖率 ${data.qa.sampleRate}`}
          />
          <Stat
            span={3}
            captionBelow
            value={`${data.qa.violations}`}
            unit="例"
            label="严重违规"
            note="全月抽检累计"
          />
        </Grid>
      </Section>

      <Section
        title="每日趋势"
        description="9 月 1 日至 30 日逐日数据；9 月 14 日至 19 日仓储切换期间会话量冲高，首次解决率回落，平均首响升至 50 秒以上"
      >
        <Grid cols={9} fields={false}>
          <Block span={9} title="会话量（通）">
            <TrendChart
              data={data.daily}
              xKey="date"
              series={[{ key: "sessions", label: "会话量" }]}
              height="h-48"
              pointLabels="last"
              xInterval={3}
            />
          </Block>
          <Block span={9} title="首次解决率（%）">
            <TrendChart
              data={data.daily}
              xKey="date"
              series={[{ key: "fcr", label: "首次解决率" }]}
              height="h-48"
              pointLabels="last"
              xInterval={3}
            />
          </Block>
          <Block span={9} title="平均首响时长（秒）">
            <TrendChart
              data={data.daily}
              xKey="date"
              series={[{ key: "firstResponse", label: "平均首响时长" }]}
              height="h-48"
              pointLabels="last"
              xInterval={3}
            />
          </Block>
        </Grid>
      </Section>

      <Section
        title="分群"
        description="六个团队的首次解决率，注释为团队满意度与平均首响时长"
      >
        <Grid cols={9} fields={false} className="items-baseline">
          {data.teams.map((t) => (
            <Stat
              key={t.name}
              span={2}
              captionBelow
              value={`${t.fcr}`}
              unit="%"
              label={t.name}
              note={`满意度 ${t.csat}% · 首响 ${t.firstResponse} 秒`}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="分维度"
        description="团队质检得分与咨询类别占比，占比为 9 月全月会话口径"
      >
        <Grid cols={9}>
          <Block span={3} rows={2} title="团队质检得分（分）">
            <ProgressList
              compact
              items={data.teams.map((t) => ({
                label: t.name,
                value: t.qa,
                max: 100,
                display: `${t.qa}`,
              }))}
            />
          </Block>
          <Block span={6} rows={2} title="咨询类别占比与环比">
            <DataTable
              columns={[
                { key: "name", label: "类别", span: 2 },
                { key: "share", label: "占比（%）", span: 2, align: "right", bar: true },
                { key: "change", label: "环比（个百分点）", span: 2, align: "right" },
              ]}
              rows={data.issues}
            />
          </Block>
        </Grid>
      </Section>

      <Section
        title="明细"
        description="各团队全月服务指标；会话量为通，首次解决率与满意度为百分比"
      >
        <DataTable
          columns={[
            { key: "name", label: "团队", span: 2 },
            { key: "lead", label: "主管", span: 1 },
            { key: "agents", label: "坐席", span: 1, align: "right" },
            { key: "sessions", label: "会话量", span: 2, align: "right", bar: true },
            { key: "fcr", label: "首次解决率", span: 2, align: "right" },
            { key: "csat", label: "满意度", span: 1, align: "right" },
          ]}
          rows={data.teams}
        />
      </Section>

      <Section title="发现" description="九月最值得关注的三个变化">
        <List
          numbered
          items={data.findings.map((f) => ({
            title: f.title,
            description: f.detail,
          }))}
        />
      </Section>

      <Section title="风险" description="十月需要提前防范的两项风险">
        <List
          columns={3}
          items={data.risks.map((r) => ({
            title: r.title,
            description: r.detail,
          }))}
        />
      </Section>

      <Section title="下一步" description="三项行动与负责人，10 月内落地">
        <List
          columns={3}
          numbered
          items={data.actions.map((a) => ({
            title: a.title,
            description: a.detail,
            meta: a.owner,
          }))}
        />
      </Section>

      <Section title="背景信息" description="报告口径与样本说明">
        <KV
          labelCols={2}
          items={[
            { label: "负责团队", value: data.org },
            { label: "统计周期", value: data.period },
            { label: "会话总量", value: `${data.kpis[0].value} 通` },
            {
              label: "抽检样本",
              value: `${data.qa.sampled.toLocaleString("en-US")} 通，覆盖率 ${data.qa.sampleRate}`,
            },
            { label: "质检目标", value: `${data.qa.target} 分` },
            { label: "严重违规", value: `${data.qa.violations} 例` },
          ]}
        />
      </Section>
    </Page>
  )
}
