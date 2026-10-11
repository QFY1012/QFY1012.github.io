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

const { kpis, daily, buildings, uses, alerts, findings, actions, risks } = data

export default function Report() {
  return (
    <Page title={data.title} meta={[data.org, data.period]}>
      <Section title="结论" description="本月总览">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="环比为与九月的比较">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpis[0].value}
            unit={kpis[0].unit}
            label={kpis[0].label}
            note={`环比 ${kpis[0].change}`}
            direction="down"
          />
          <Stat
            span={3}
            captionBelow
            value={kpis[1].value}
            unit={kpis[1].unit}
            label={kpis[1].label}
            note={`环比 ${kpis[1].change} 千瓦时/平方米`}
            direction="down"
          />
          <Stat
            span={3}
            captionBelow
            value={kpis[2].value}
            unit={kpis[2].unit}
            label={kpis[2].label}
            note={`环比 ${kpis[2].change}`}
            direction="up"
          />
          <Stat
            span={3}
            captionBelow
            value={kpis[3].value}
            unit={kpis[3].unit}
            label={kpis[3].label}
            note={`环比 ${kpis[3].change}`}
            direction="up"
          />
        </Grid>
      </Section>

      <Section title="用电走势" description="日粒度，用电量单位：兆瓦时" className="gap-12">
        <Group title="日用电量">
          <TrendChart
            data={daily}
            xKey="date"
            series={[{ key: "mwh", label: "日用电量" }]}
            height="h-48"
            yTicks={[80, 100, 120]}
            pointLabels="last"
          />
        </Group>
        <Group title="光伏与峰时用电占比（%）">
          <TrendChart
            data={daily}
            xKey="date"
            series={[
              { key: "pv", label: "光伏发电占比" },
              { key: "peak", label: "峰时用电占比" },
            ]}
            height="h-48"
            pointLabels="last"
          />
        </Group>
      </Section>

      <Section title="能耗拆分" description="按楼栋与用能类型拆分">
        <Grid cols={9}>
          <Block span={6} title="分栋用电">
            <DataTable
              columns={[
                { key: "name", label: "楼栋", span: 2 },
                { key: "area", label: "面积", align: "right", span: 1 },
                { key: "kwh", label: "用电量", align: "right", span: 1 },
                { key: "intensity", label: "单位面积能耗", align: "right", span: 1 },
                { key: "change", label: "环比", align: "right", span: 1, tone: ["+3.4%"] },
              ]}
              rows={buildings}
              caption="面积：平方米；用电量：万千瓦时；单位面积能耗：千瓦时/平方米"
            />
          </Block>
          <Block span={3} title="用能结构">
            <ProgressList
              compact
              items={uses.map((u) => ({
                label: u.name,
                value: u.share,
                max: 100,
                display: `${u.share}%`,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="运行明细" description="数据中心能效与园区需量预警">
        <Grid cols={9} fields={false}>
          <Block span={3} title="数据中心 PUE">
            <Stat
              captionBelow
              value={String(data.pue.value)}
              label="电源使用效率"
              note={`目标 ${data.pue.target} · 环比 ${data.pue.change}`}
              direction="down"
            />
          </Block>
          <Block span={6} title="需量预警">
            <DataTable
              columns={[
                { key: "date", label: "日期", span: 1 },
                { key: "time", label: "时间", span: 1 },
                { key: "text", label: "预警内容", span: 4 },
              ]}
              rows={alerts}
              caption="需量预警线 9,500 千瓦"
            />
          </Block>
        </Grid>
      </Section>

      <Section title="主要发现" description="本月三条主要发现">
        <List
          numbered
          items={findings.map((f) => ({ title: f.title, description: f.text }))}
        />
      </Section>

      <Section title="风险提示" description="需要持续关注的两项风险">
        <List
          columns={3}
          metaTone="destructive"
          items={[
            { title: risks[0].title, description: risks[0].text, meta: "中" },
            { title: risks[1].title, description: risks[1].text, meta: "高" },
          ]}
        />
      </Section>

      <Section title="下一步" description="十一月节能措施与责任团队">
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

      <Section title="背景信息" description="统计口径与负责团队">
        <KV
          labelCols={2}
          items={[
            { label: "负责团队", value: data.org },
            { label: "统计周期", value: data.period },
            { label: "数据口径", value: `日粒度 31 天，用电量单位：${data.dailyUnit}` },
            { label: "覆盖范围", value: "5 栋楼宇与公共区域，共 6 个计费单元" },
            { label: "需量预警线", value: "9,500 千瓦" },
          ]}
        />
      </Section>
    </Page>
  )
}
