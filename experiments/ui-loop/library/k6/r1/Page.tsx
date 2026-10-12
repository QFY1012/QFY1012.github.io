import {
  Page,
  Section,
  Group,
  Text,
  Stat,
  List,
  DataTable,
  ProgressList,
  FigureCompare,
  Figure,
  FigureImage,
  FigureLabel,
  Rule,
} from "@/components/report"

// 色觉模拟的四张对照图:原界面加三种模拟。同一块屏幕,只有状态色变化。
const views = [
  { name: "原界面", image: "assets/cvd-original.svg" },
  { name: "绿色盲模拟", image: "assets/cvd-deuteranopia.svg" },
  { name: "红色盲模拟", image: "assets/cvd-protanopia.svg" },
  { name: "蓝色盲模拟", image: "assets/cvd-tritanopia.svg" },
]

// 按色觉类型的问题数:满值 5,三条共用一条基线。
const byType = [
  { label: "绿色盲", value: 3, max: 5, display: "3" },
  { label: "红色盲", value: 2, max: 5, display: "2" },
  { label: "蓝色盲", value: 0, max: 5, display: "0" },
]

// 产品对比:步骤数列带计数条,条长是步数与最多步数之比。
const productColumns = [
  { key: "product", label: "产品", span: 3 },
  { key: "version", label: "版本", span: 2 },
  { key: "steps", label: "步骤数", span: 4, bar: true },
]

const productRows = [
  { product: "产品 A", version: "3.2.1", steps: 5 },
  { product: "产品 B", version: "1.8.0", steps: 4 },
  { product: "产品 C", version: "2.0.0", steps: 1 },
]

const findings = [
  {
    title: "状态色是唯一的通道",
    description: "正常与严重只靠红绿区分,模拟图里两者并成同一种黄褐,灰度打印也读不出差别。",
  },
  {
    title: "步骤数与颜色无关",
    description: "步骤数改用长度编码,条长对基线,模拟后仍可读。",
  },
]

export default function Report() {
  return (
    <Page title="色觉无障碍组件演示" meta={["组件库 · k6", "2026-10-12"]}>
      <Section title="色觉模拟" description="原界面与三种模拟,一屏内读完">
        <Group title="四张对照图">
          <FigureCompare>
            {views.map((view) => (
              <Figure key={view.name}>
                <FigureImage src={view.image} alt={view.name} />
                <FigureLabel>{view.name}</FigureLabel>
              </Figure>
            ))}
          </FigureCompare>
          <Text>四张图同一高度排成两列,宽度随原比例,整组不超过一屏;同一个色块在四种视图里的样子并排可读。</Text>
        </Group>
      </Section>

      <Section title="问题分布" description="按色觉类型统计">
        <Group title="按色觉类型的问题数">
          <ProgressList compact items={byType} />
          <Text>三条共用同一条基线,条长是计数与满值 5 之比;0 与 2、2 与 3 的差别由长度给出,不再靠颜色。</Text>
        </Group>
        <Group title="产品对比">
          <DataTable
            columns={productColumns}
            rows={productRows}
            caption="步骤数为该产品主流程的步数;条长按本列最大值 5 折算,不是百分比。"
          />
        </Group>
      </Section>

      <Section title="现有组件对照" description="同一套字号、颜色与间距">
        <Group title="结论句与数字">
          <Text className="text-2xl leading-9 font-light">色觉无障碍问题集中在状态色,不在文字。</Text>
          <Stat value="20" label="检查页面" unit="个" note="覆盖三色觉类型" />
        </Group>
        <Group title="发现">
          <List items={findings} numbered />
        </Group>
        <Rule label="以上为示例数据" />
      </Section>
    </Page>
  )
}
