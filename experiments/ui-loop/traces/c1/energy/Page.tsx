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

const { kpis, daily, buildings, uses, pue, alerts, findings, actions, risks } = data
const [total, intensity, pv, peak] = kpis
const riskLevels = ["高", "中"]

export default function Report() {
  return (
    <Page title={data.title} meta={[data.org, data.period]}>
      <Section
        title="结论"
        description="十月整体用电环比下降，光伏占比创新高，峰时负荷与 C 栋空调能效是下月重点。"
      >
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="全园区月度汇总，环比为与九月对比。">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={total.value}
            unit={total.unit}
            label={total.label}
            captionBelow
            note={`环比 ${total.change}`}
            direction={total.direction as "up" | "down"}
          />
          <Stat
            span={3}
            value={intensity.value}
            unit={intensity.unit}
            label={intensity.label}
            captionBelow
            note={`环比 ${intensity.change}`}
            direction={intensity.direction as "up" | "down"}
          />
          <Stat
            span={3}
            value={pv.value}
            unit={pv.unit}
            label={pv.label}
            captionBelow
            note={`环比 ${pv.change}`}
            direction={pv.direction as "up" | "down"}
          />
          <Stat
            span={3}
            value={peak.value}
            unit={peak.unit}
            label={peak.label}
            captionBelow
            note={`环比 ${peak.change}`}
            direction={peak.direction as "up" | "down"}
          />
        </Grid>
      </Section>

      <Section
        title="日度走势"
        description="按日统计，用电量单位为兆瓦时，峰时占比为当日峰时段用电占比。"
      >
        <Grid cols={9}>
          <Block span={6} rows={2} title="日用电量（兆瓦时）">
            <TrendChart
              data={daily}
              xKey="date"
              series={[{ key: "mwh", label: "用电量" }]}
              height="fill"
              pointLabels="last"
            />
          </Block>
          <Block span={3} rows={2} title="峰时用电占比（%）">
            <TrendChart
              data={daily}
              xKey="date"
              series={[{ key: "peak", label: "峰时占比" }]}
              height="fill"
              pointLabels="last"
            />
          </Block>
        </Grid>
      </Section>

      <Section
        title="拆分"
        description="按楼栋与用途拆分，面积单位为平方米，用电量单位为万千瓦时。"
        className="gap-12"
      >
        <Group title="楼栋用电">
          <DataTable
            columns={[
              { key: "name", label: "楼栋", span: 2 },
              { key: "area", label: "面积（平方米）", align: "right", span: 2 },
              { key: "kwh", label: "用电量（万千瓦时）", align: "right", span: 2 },
              { key: "change", label: "环比", align: "right", span: 1 },
              { key: "intensity", label: "单位面积能耗", align: "right", span: 2 },
            ]}
            rows={buildings}
          />
        </Group>
        <Group title="用电结构">
          <Grid cols={9}>
            <Block span={3}>
              <ProgressList
                compact
                items={uses.map((u) => ({ label: u.name, value: u.share, display: `${u.share}%` }))}
              />
            </Block>
          </Grid>
        </Group>
      </Section>

      <Section title="能效预警" description="数据中心 PUE 与本月需量预警记录。">
        <Grid cols={9}>
          <Block span={3} title="数据中心 PUE">
            <Stat value={String(pue.value)} label="数据中心 PUE" captionBelow note={`环比 ${pue.change}，目标 ${pue.target}`} />
          </Block>
          <Block span={6} title="需量预警">
            <List
              numbered
              items={alerts.map((a) => ({
                title: `${a.date} ${a.time}`,
                description: a.text,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="主要发现" description="本月三条主要观察。">
        <List numbered items={findings.map((f) => ({ title: f.title, description: f.text }))} />
      </Section>

      <Section title="风险" description="下月需重点关注的两项风险及等级。">
        <List
          columns={3}
          metaTone="destructive"
          items={risks.map((r, i) => ({
            title: r.title,
            description: r.text,
            meta: riskLevels[i] ?? "中",
          }))}
        />
      </Section>

      <Section title="下一步" description="十一月节能措施与负责团队。">
        <List
          numbered
          columns={3}
          items={actions.map((a) => ({
            title: a.title,
            description: a.text,
            meta: a.owner,
          }))}
        />
      </Section>

      <Section title="背景信息" description="统计口径与负责团队。">
        <KV
          labelCols={2}
          items={[
            { label: "负责团队", value: data.org },
            { label: "统计周期", value: data.period },
            { label: "统计天数", value: `${daily.length} 天` },
            { label: "计量单元", value: `${buildings.length} 个（5 栋 + 公共区域）` },
            { label: "数据口径", value: `日用电量单位为${data.dailyUnit}，占比为占全园区总用电比例` },
          ]}
        />
      </Section>
    </Page>
  )
}
