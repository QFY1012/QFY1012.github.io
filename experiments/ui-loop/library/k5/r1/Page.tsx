import {
  Page,
  Section,
  Group,
  Text,
  Stat,
  DataTable,
  ProgressList,
  List,
  Rule,
  FigureCompare,
  Figure,
  FigureImage,
  FigureLabel,
} from "@/components/report"

// 严重度按高、中、低排列:tone 的顺序就是轻重顺序。
const severity = ["高", "中", "低"]

const issues = [
  { screen: "首页", detail: "状态标签只用颜色区分", level: "高" },
  { screen: "对比度明细", detail: "阈值参考线缺失", level: "中" },
  { screen: "问题分布", detail: "条形无基线或刻度", level: "低" },
  { screen: "设置", detail: "次要文字对比度不足", level: "中" },
  { screen: "帮助", detail: "图表系列只用颜色区分", level: "高" },
]

const views = [
  { name: "原界面", image: "assets/cvd-original.svg" },
  { name: "红色盲模拟", image: "assets/cvd-protanopia.svg" },
  { name: "绿色盲模拟", image: "assets/cvd-deuteranopia.svg" },
  { name: "蓝色盲模拟", image: "assets/cvd-tritanopia.svg" },
]

// 三条共用 max = 5 的刻度,长度可以直接比较。
const byType = [
  { label: "红色盲", value: 4, max: 5, display: "4" },
  { label: "绿色盲", value: 2, max: 5, display: "2" },
  { label: "蓝色盲", value: 1, max: 5, display: "1" },
]

const contrast = [
  { element: "正文 / 背景", contrast: 12.6, level: "达标" },
  { element: "次要文字 / 背景", contrast: 4.1, level: "不达标" },
  { element: "状态标签 / 背景", contrast: 6.8, level: "达标" },
  { element: "图表网格线 / 背景", contrast: 2.3, level: "不达标" },
  { element: "按钮文字 / 背景", contrast: 8.9, level: "达标" },
]

export default function Report() {
  return (
    <Page title="色觉无障碍检查" meta={["示例产品 · 3.2.0", "2026-10-12"]}>
      <Section title="问题明细" description="严重度用颜色与字重两个通道">
        <Group title="按界面">
          <DataTable
            columns={[
              { key: "screen", label: "界面", span: 3 },
              { key: "detail", label: "问题", span: 4 },
              { key: "level", label: "严重度", tone: severity, span: 2 },
            ]}
            rows={issues}
            caption="严重度按高、中、低排列;颜色之外,字重与点标记同时表示轻重。"
          />
        </Group>
      </Section>

      <Section title="色觉模拟" description="原界面与三种色觉模拟">
        <Group title="一组四张">
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

      <Section title="按色觉类型的问题数" description="共用基线,条上带刻度">
        <Group title="问题数">
          <ProgressList items={byType} compact />
        </Group>
      </Section>

      <Section title="对比度明细" description="条形标出 4.5 的达标阈值">
        <Group title="按元素">
          <DataTable
            columns={[
              { key: "element", label: "元素", span: 3 },
              { key: "contrast", label: "对比度", align: "right", span: 4, bar: { max: 15, threshold: 4.5, ticks: [0, 5, 10, 15] } },
              { key: "level", label: "级别", tone: ["不达标"], span: 2 },
            ]}
            rows={contrast}
            caption="参考线为 4.5:1 的达标阈值;条形按 0–15 的刻度绘制。"
          />
        </Group>
      </Section>

      <Section title="现有组件" description="样式对照">
        <Group title="数字与文字">
          <Stat value="3" label="待修复问题" unit="项" />
          <Stat value="42" label="检查项" size="lg" />
          <Text className="text-2xl leading-9 font-light">红色只表示不达标;轻重与达标由字重和刻度承载。</Text>
        </Group>
        <Group title="修复项">
          <Rule label="按优先级" />
          <List
            numbered
            items={[
              { title: "严重度加第二通道", description: "字重与点标记同时编码轻重" },
              { title: "条形加基线与刻度", description: "长度可比较,阈值可对照" },
            ]}
          />
        </Group>
      </Section>
    </Page>
  )
}
