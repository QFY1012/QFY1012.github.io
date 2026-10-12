// Demo page for the parts this round touches. It shows the components the
// requirements name — the table (severity tone + caption), the count bars, the
// screenshot strip and the comparison grid — plus one short section of older
// parts to check type, rules and spacing against.
import { Fragment } from "react"

import {
  Block,
  DataTable,
  Figure,
  FigureGrid,
  FigureImage,
  FigureLabel,
  FigureStrip,
  FigureText,
  Grid,
  Group,
  KV,
  List,
  Page,
  ProgressList,
  Rule,
  Section,
  Stat,
} from "@/components/report"

// ---- 测试数据 ----

// 严重度一列:tone 标红「严重」并加一档字重,所以灰度下仍读得出轻重。
const findings = [
  { id: "C-01", screen: "色觉自测 · 图版页", finding: "红绿图版底点混成一片", severity: "严重", people: "1,284" },
  { id: "C-02", screen: "分析后台 · 混淆色", finding: "ΔE 4.2 的两块并排，无标注", severity: "严重", people: "986" },
  { id: "C-03", screen: "通勤热力 · 地图", finding: "拥堵与畅通只靠红绿区分", severity: "中等", people: "742" },
  { id: "C-04", screen: "检测结果 · 建议", finding: "段落对比度 3.1:1，低于 4.5:1", severity: "中等", people: "517" },
  { id: "C-05", screen: "分享卡片", finding: "12px 灰字放大后仍偏浅", severity: "轻微", people: "203" },
]

// span 按 9 列网格给,加起来正好一行。
const findingColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "screen", label: "界面", span: 2 },
  { key: "finding", label: "问题", span: 4 },
  { key: "severity", label: "严重度", span: 1, tone: ["严重"] },
  { key: "people", label: "影响人数", span: 1, align: "right" },
]

// 计数:细条,与表格行线同重。
const byType = [
  { label: "红色盲", value: 128, max: 128, display: "128" },
  { label: "绿色盲", value: 96, max: 128, display: "96" },
  { label: "蓝色盲", value: 41, max: 128, display: "41" },
]

// 链路:一个产品一组,一组一行,图高一致、比例各异,超出宽度横向滚动。
const chains = [
  {
    product: "色觉自测",
    version: "iOS 3.2",
    steps: [
      { no: 1, screen: "首页", image: "assets/phone-home.svg", content: "说明检测时长与光线要求", action: "点「开始检测」", inputs: 0 },
      { no: 2, screen: "图版页", image: "assets/phone-test.svg", content: "展示第 4 张图版", action: "输入数字或跳过", inputs: 1 },
      { no: 3, screen: "结果页", image: "assets/phone-result.svg", content: "给出三型色觉的筛查结论", action: "查看分析报告", inputs: 0 },
      { no: 4, screen: "报告页", image: "assets/analysis-overview.svg", content: "把结论展开成混淆色与问题清单", action: "下钻到问题明细", inputs: 0 },
    ],
  },
  {
    product: "分析后台",
    version: "Web 2.0",
    steps: [
      { no: 1, screen: "问题明细", image: "assets/analysis-issues.svg", content: "按严重度排出待修问题", action: "批量指派", inputs: 2 },
      { no: 2, screen: "色板对比", image: "assets/analysis-colors.svg", content: "并排原色板与三型模拟", action: "导出建议", inputs: 0 },
      { no: 3, screen: "分享卡片", image: "assets/phone-share.svg", content: "把结论发给团队", action: "复制链接", inputs: 0 },
    ],
  },
]

// 色觉模拟:同一界面的四种色觉视图。
const views = [
  { name: "原界面", image: "assets/sim-original.svg" },
  { name: "红色盲模拟", image: "assets/sim-protanopia.svg" },
  { name: "绿色盲模拟", image: "assets/sim-deuteranopia.svg" },
  { name: "蓝色盲模拟", image: "assets/sim-tritanopia.svg" },
]

export default function Report() {
  return (
    <Page title="色觉无障碍组件演示" meta={["报告组件库", "演示页", "2026-10-12"]}>
      {/* tone:严重度一列同时给颜色和字重,灰度打印与色弱读者也能读出轻重 */}
      <Section title="严重度" description="tone 在标红之外把字重加粗：标红的值比普通文字重，灰度打印和色弱读者也读得出轻重">
        <Group>
          <DataTable
            columns={findingColumns}
            rows={findings}
            caption="口径：CIEDE2000，ΔE 低于 10 记为不可辨；影响人数为 2026-09 去重用户数。"
          />
        </Group>
      </Section>

      {/* ProgressList:细条只承载计数,不抢正文 */}
      <Section title="计数条形" description="细条与表格行线同重，颜色比轨道深一档，只承载计数，不与正文争视觉重量">
        <Group>
          <ProgressList compact items={byType} />
        </Group>
      </Section>

      {/* FigureStrip:图高一致、比例各异;滚动条只在悬停时出现 */}
      <Section title="链路明细" description="不同比例的截图并排对齐，超出宽度横向滚动；滚动条只在悬停时出现，静止时图下没有多余的横条">
        <Group>
          {chains.map((chain) => (
            <Fragment key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version}`} />
              <FigureStrip>
                {chain.steps.map((step) => (
                  <Figure key={step.no}>
                    <FigureImage src={step.image} alt={`${chain.product}第 ${step.no} 步：${step.screen}`} />
                    <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                    <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
                  </Figure>
                ))}
              </FigureStrip>
            </Fragment>
          ))}
        </Group>
      </Section>

      {/* FigureGrid:一组四张,两列铺满内容列宽,图内文字可辨 */}
      <Section title="色觉模拟" description="一组四张，每行两张铺满内容列宽，左右边缘与表格对齐，图内文字与状态细节可辨">
        <Group title="通勤热力 · 中心城区 · 早高峰">
          <FigureGrid>
            {views.map((view) => (
              <Figure key={view.name}>
                <FigureImage src={view.image} alt={view.name} />
                <FigureLabel>{view.name}</FigureLabel>
              </Figure>
            ))}
          </FigureGrid>
        </Group>
      </Section>

      {/* 对照:现有部件,核对字号、行高与细线 */}
      <Section title="对照" description="现有部件，用来核对字号、行高与细线是否和上面几组一致">
        <Grid fields={false}>
          <Block span={3} title="大数字">
            <Stat value="1,284" label="受影响用户" note="2026-09 去重" />
          </Block>
          <Block span={3} title="下降">
            <Stat value="4.2" label="最易混淆 ΔE" note="低于阈值 10" direction="down" />
          </Block>
          <Block span={3} title="键值">
            <KV items={[{ label: "样本", value: "1,284" }, { label: "周期", value: "2026-09" }, { label: "阈值", value: "ΔE 10" }]} />
          </Block>
        </Grid>
        <List
          numbered
          items={[
            { title: "颜色之外留一个通道", description: "字重、位置、文字本身都能带状态，不必只靠红" },
            { title: "细线只做分组", description: "分组标记用 Rule，与表格行线同宽" },
            { title: "注释落在表格左边缘", description: "口径写进 caption，不在表尾居中漂一条小字" },
          ]}
        />
      </Section>
    </Page>
  )
}
