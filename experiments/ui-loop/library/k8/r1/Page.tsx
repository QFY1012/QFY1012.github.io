import {
  Page,
  Section,
  Group,
  Text,
  Stat,
  DataTable,
  BarChart,
  ProgressList,
  List,
  KV,
  FigureCompare,
  Figure,
  FigureImage,
  FigureLabel,
} from "@/components/report"

// Test data for the component demo: the six problems in the brief, each on a
// page of its own data. A demo, not a report: no data.json.
const products = [
  { name: "移动端 3.0", steps: 5, severity: "高" },
  { name: "桌面端 3.0", steps: 4, severity: "中" },
  { name: "平板端 2.4", steps: 3, severity: "低" },
  { name: "小程序 1.8", steps: 2, severity: "低" },
]

const confusion = [
  { pair: "红 / 绿", complete: 18, hard: 12, slight: 7, none: 3 },
  { pair: "绿 / 棕", complete: 15, hard: 14, slight: 9, none: 4 },
  { pair: "蓝 / 紫", complete: 9, hard: 8, slight: 6, none: 2 },
  { pair: "红 / 棕", complete: 7, hard: 6, slight: 4, none: 1 },
]

const views = [
  { name: "原界面", image: "assets/phone-original.svg" },
  { name: "红色盲", image: "assets/phone-protan.svg" },
  { name: "绿色盲", image: "assets/phone-deutan.svg" },
  { name: "蓝色盲", image: "assets/phone-tritan.svg" },
]

const byType = [
  { label: "红色盲", value: 6 },
  { label: "绿色盲", value: 9 },
  { label: "蓝色盲", value: 2 },
]

export default function Report() {
  return (
    <Page title="色觉无障碍检查" meta={["示例产品 · 3.0", "2026 Q3 · 12 个视图"]}>
      <Section title="结论">
        <Text className="text-2xl leading-9 font-light">
          计数按量程画在同一条基线上,等级靠字重排出顺序,四张对照图一屏读完。
        </Text>
      </Section>

      <Section title="产品对比" description="步骤数与严重度">
        <Group>
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 4 },
              { key: "steps", label: "步骤数", align: "right", span: 3, bar: true },
              { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
            ]}
            rows={products}
            caption="步骤数为结账主链路的最少点击数,量程 0 到 5。"
          />
        </Group>
      </Section>

      <Section title="颜色混淆" description="按色对统计的问题数">
        <Group title="各类色对的问题数">
          <BarChart
            data={confusion}
            xKey="pair"
            series={[
              { key: "complete", label: "完全混淆" },
              { key: "hard", label: "需仔细分辨" },
              { key: "slight", label: "轻微" },
              { key: "none", label: "几乎不混淆" },
            ]}
          />
        </Group>
      </Section>

      <Section title="色觉模拟" description="原界面与三种模拟">
        <Group title="一屏对照">
          <FigureCompare>
            {views.map((view) => (
              <Figure key={view.name}>
                <FigureImage src={view.image} alt={view.name} />
                <FigureLabel>{view.name}</FigureLabel>
              </Figure>
            ))}
          </FigureCompare>
        </Group>
      </Section>

      <Section title="问题分布" description="按色觉类型">
        <Group title="受影响问题数">
          <ProgressList items={byType} compact />
        </Group>
      </Section>

      <Section title="对照" description="页面其它数字与文字">
        <Group title="概览">
          <KV
            items={[
              { label: "检查视图", value: "12" },
              { label: "通过", value: "8" },
              { label: "不通过", value: "4" },
            ]}
            labelCols={3}
          />
          <Stat value="8" label="通过视图" note="共 12 个,4 个待修" />
          <List
            items={[
              { title: "结账按钮对比度", description: "3.1:1,低于 4.5:1" },
              { title: "状态标签仅用颜色", description: "缺少文字或图标" },
            ]}
          />
        </Group>
      </Section>
    </Page>
  )
}
