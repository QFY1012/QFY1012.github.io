import {
  Page,
  Section,
  Group,
  Text,
  Stat,
  DataTable,
  ProgressList,
  List,
  KV,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
  FigureGrid,
  Rule,
} from "@/components/report"

// Chain detail: one product per group, steps in order. The two products are
// separated by a Rule, whose hairline is the same 1px as the table's row lines.
const chainA = [
  { no: 1, image: "assets/chain-a-1.svg", screen: "订单确认", text: "核对收货信息", action: "提交订单", inputs: 3 },
  { no: 2, image: "assets/chain-a-2.svg", screen: "支付方式", text: "选择支付渠道", action: "确认支付", inputs: 2 },
  { no: 3, image: "assets/chain-a-3.svg", screen: "支付结果", text: "等待商家接单", action: "查看订单", inputs: 0 },
  { no: 4, image: "assets/chain-a-4.svg", screen: "转化漏斗", text: "下单到完成逐步流失", action: "下钻步骤", inputs: 0 },
]
const chainB = [
  { no: 1, image: "assets/chain-b-1.svg", screen: "选座", text: "选择场次座位", action: "锁定座位", inputs: 2 },
  { no: 2, image: "assets/chain-b-2.svg", screen: "确认订单", text: "核对票档优惠", action: "去支付", inputs: 2 },
  { no: 3, image: "assets/chain-b-3.svg", screen: "出票成功", text: "取票码已生成", action: "查看票券", inputs: 0 },
]

// Colour-vision comparison: the original interface plus three simulations.
const views = [
  { name: "原界面", image: "assets/cvd-original.svg" },
  { name: "红色盲模拟", image: "assets/cvd-protan.svg" },
  { name: "绿色盲模拟", image: "assets/cvd-deuteran.svg" },
  { name: "蓝色盲模拟", image: "assets/cvd-tritan.svg" },
]

export default function Report() {
  return (
    <Page title="组件补充演示" meta={["组件库 · 报告页", "2026-10-12"]}>
      <Section title="口径注释" description="表格下方的口径说明与表格左边缘对齐,不再居中游离">
        <Group title="混淆色判定 · CIEDE2000">
          <DataTable
            columns={[
              { key: "pair", label: "色对", span: 3 },
              { key: "de", label: "ΔE00", align: "right", span: 2 },
              { key: "verdict", label: "判定", span: 2, tone: ["不达标"] },
              { key: "count", label: "样本", align: "right", span: 2 },
            ]}
            rows={[
              { pair: "红 / 绿", de: 1.2, verdict: "不达标", count: 14 },
              { pair: "绿 / 棕", de: 3.8, verdict: "通过", count: 22 },
              { pair: "蓝 / 紫", de: 5.1, verdict: "通过", count: 12 },
            ]}
            caption="ΔE00 < 2.0 视为不可辨;样本 n=48,取自 2026-09 的会话。"
          />
        </Group>
      </Section>

      <Section title="链路分组" description="不同产品的截图组之间用一条细线分隔,线宽与表格行线一致">
        <Group>
          <Rule label="产品 A · v2.4" />
          <FigureStrip>
            {chainA.map((step) => (
              <Figure key={step.no}>
                <FigureImage src={step.image} alt={`产品 A 第 ${step.no} 步:${step.screen}`} />
                <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                <FigureText>{step.text} · {step.action} · 输入 {step.inputs} 项</FigureText>
              </Figure>
            ))}
          </FigureStrip>
          <Rule label="产品 B · v1.9" />
          <FigureStrip>
            {chainB.map((step) => (
              <Figure key={step.no}>
                <FigureImage src={step.image} alt={`产品 B 第 ${step.no} 步:${step.screen}`} />
                <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                <FigureText>{step.text} · {step.action} · 输入 {step.inputs} 项</FigureText>
              </Figure>
            ))}
          </FigureStrip>
        </Group>
      </Section>

      <Section title="问题分布" description="计数用细条表示,与页面细线同重,不与正文争夺视觉重量">
        <Group title="按色盲类型">
          <ProgressList
            compact
            items={[
              { label: "红色盲", value: 14, max: 16, display: "14" },
              { label: "绿色盲", value: 16, max: 16, display: "16" },
              { label: "蓝色盲", value: 6, max: 16, display: "6" },
            ]}
          />
        </Group>
        <Group title="按页面">
          <DataTable
            columns={[
              { key: "page", label: "页面", span: 3 },
              { key: "count", label: "问题数", align: "right", bar: true, span: 3 },
              { key: "share", label: "占比", align: "right", span: 3 },
            ]}
            rows={[
              { page: "c1 系列色", count: 14, share: "40%" },
              { page: "c2 地图", count: 12, share: "34%" },
              { page: "c3 模拟视图", count: 9, share: "26%" },
            ]}
            caption="同一问题跨页出现时按首次出现的页面计入。"
          />
        </Group>
      </Section>

      <Section title="色觉模拟" description="四张对照图按列宽铺满,每行两张,图内文字与状态细节可辨">
        <Group title="原界面与三种色觉模拟">
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

      <Section title="现有组件对照" description="同一套字号、颜色与间距,新增部件与它们并排仍是一条线">
        <Group title="规模">
          <Stat value="48" label="受检页面" size="lg" note="其中 6 页含色觉模拟" />
        </Group>
        <Group title="口径">
          <KV
            items={[
              { label: "样本", value: "2026-09" },
              { label: "阈值", value: "ΔE00 ≥ 2.0" },
            ]}
            labelCols={2}
          />
          <List
            divided={false}
            items={[
              { title: "先按页面分组", description: "同一页面内的问题连续排列" },
              { title: "再按严重度排序", description: "不可辨优先于可辨" },
            ]}
          />
          <Text>注释与正文同字号时靠颜色区分层级,不靠字号。</Text>
        </Group>
      </Section>
    </Page>
  )
}
