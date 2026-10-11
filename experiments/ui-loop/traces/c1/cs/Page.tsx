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

const last = data.daily[data.daily.length - 1]

export default function Report() {
  return (
    <Page title={data.title} meta={[data.org, data.period]}>
      <Section title="结论" description="本月的总体判断与主要短板">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="环比为 9 月与 8 月对比">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              captionBelow
              value={k.value}
              unit={k.unit}
              label={k.label}
              note={k.change}
              direction={k.direction === "down" ? "down" : "up"}
              size={k.key === "fcr" ? "lg" : undefined}
            />
          ))}
          <Stat
            span={3}
            captionBelow
            value={String(data.qa.score)}
            unit="分"
            label="质检平均分"
            note={data.qa.change}
          />
          <Stat
            span={3}
            captionBelow
            value={data.qa.sampled.toLocaleString("en-US")}
            unit="通"
            label="抽检会话"
            note={`抽样比例 ${data.qa.sampleRate} · 违规 ${data.qa.violations} 通`}
          />
        </Grid>
      </Section>

      <Section title="随时间变化" description="9 月 1 日至 30 日,逐日">
        <Group>
          <Grid cols={9} fields={false}>
            <Block span={9} title="日会话量">
              <TrendChart
                data={data.daily}
                xKey="date"
                series={[{ key: "sessions", label: "会话量" }]}
                height="h-48"
                pointLabels="last"
                lastLabel={last.sessions.toLocaleString("en-US")}
              />
            </Block>
          </Grid>
          <Grid cols={9}>
            <Block span={6} rows={2} title="首次解决率">
              <TrendChart
                data={data.daily}
                xKey="date"
                series={[{ key: "fcr", label: "首次解决率" }]}
                height="fill"
                pointLabels="last"
                lastLabel={`${last.fcr}%`}
              />
            </Block>
            <Block span={3} rows={2} title="平均首响时长">
              <TrendChart
                data={data.daily}
                xKey="date"
                series={[{ key: "firstResponse", label: "平均首响时长" }]}
                height="fill"
                pointLabels="last"
                lastLabel={`${last.firstResponse} 秒`}
              />
            </Block>
          </Grid>
        </Group>
      </Section>

      <Section title="团队表现" description="首次解决率与满意度单位为 %,首响为秒,质检满分 100 分">
        <DataTable
          columns={[
            { key: "name", label: "团队", span: 2 },
            { key: "agents", label: "坐席", align: "right", span: 1 },
            { key: "sessions", label: "会话量", align: "right", span: 1 },
            { key: "fcr", label: "首次解决率", align: "right", span: 2, tone: ["68.2", "74.8"] },
            { key: "firstResponse", label: "首响", align: "right", span: 1, tone: ["71"] },
            { key: "csat", label: "满意度", align: "right", span: 1 },
            { key: "qa", label: "质检", align: "right", span: 1, tone: ["84.6", "83.8"] },
          ]}
          rows={data.teams.map((t) => ({
            name: t.name,
            agents: t.agents,
            sessions: t.sessions.toLocaleString("en-US"),
            fcr: t.fcr,
            firstResponse: t.firstResponse,
            csat: t.csat,
            qa: t.qa,
          }))}
        />
      </Section>

      <Section title="咨询类别" description="占比为会话构成,环比为与 8 月对比(百分点)">
        <Grid cols={9} fields={false}>
          <Block span={3} title="类别占比">
            <ProgressList
              compact
              items={data.issues.map((it) => ({ label: it.name, value: it.share, max: 100 }))}
            />
          </Block>
          <Block span={6} title="环比变化">
            <List
              columns={3}
              items={data.issues.map((it) => ({ title: it.name, description: `环比 ${it.change} 个百分点` }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="主要发现" description="三条值得关注的结论">
        <List
          numbered
          items={data.findings.map((f) => ({ title: f.title, description: f.detail }))}
        />
      </Section>

      <Section title="下一步" description="三项行动与责任人">
        <List
          columns={3}
          numbered
          items={data.actions.map((a) => ({
            title: a.title,
            description: `${a.detail} 责任人:${a.owner}`,
          }))}
        />
      </Section>

      <Section title="风险" description="需要提前准备的两项">
        <List
          columns={3}
          metaTone="destructive"
          items={[
            { title: data.risks[0].title, description: data.risks[0].detail, meta: "高" },
            { title: data.risks[1].title, description: data.risks[1].detail, meta: "中" },
          ]}
        />
      </Section>

      <Section title="背景信息" description="报告口径与团队负责人" className="gap-12">
        <Group>
          <KV
            labelCols={2}
            items={[
              { label: "报告组织", value: data.org },
              { label: "统计周期", value: data.period },
              { label: "质检目标", value: `${data.qa.target} 分` },
            ]}
          />
        </Group>
        <Group title="团队负责人">
          <KV labelCols={2} items={data.teams.map((t) => ({ label: t.name, value: t.lead }))} />
        </Group>
      </Section>
    </Page>
  )
}
