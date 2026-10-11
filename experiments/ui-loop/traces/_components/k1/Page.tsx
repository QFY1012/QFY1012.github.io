import {
  Page,
  Section,
  Group,
  Block,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
  Text,
  Stat,
} from "@/components/report"

const chain = {
  product: "移动端 App",
  version: "v2.4.0",
  steps: [
    { no: 1, screen: "登录", content: "手机号登录", action: "获取验证码", inputs: 2, image: "assets/phone-1.svg" },
    { no: 2, screen: "商品列表", content: "分类商品", action: "筛选排序", inputs: 1, image: "assets/phone-2.svg" },
    { no: 3, screen: "商品详情", content: "图文详情", action: "加入购物车", inputs: 3, image: "assets/phone-3.svg" },
    { no: 4, screen: "购物车", content: "已选商品", action: "调整数量", inputs: 4, image: "assets/phone-4.svg" },
    { no: 5, screen: "订单确认", content: "收货信息", action: "提交订单", inputs: 6, image: "assets/phone-5.svg" },
  ],
}

const views = [
  { name: "原界面", image: "assets/cvd-original.svg" },
  { name: "红色盲", image: "assets/cvd-protanopia.svg" },
  { name: "绿色盲", image: "assets/cvd-deuteranopia.svg" },
  { name: "蓝色盲", image: "assets/cvd-tritanopia.svg" },
]

export default function Report() {
  return (
    <Page title="截图组件" meta={["组件库演示", "2026-10-11"]}>
      <Section title="链路明细" description="一个产品一组,一组一行,横向滚动">
        <Group title={`${chain.product} · ${chain.version}`}>
          <FigureStrip>
            {chain.steps.map((step) => (
              <Figure key={step.no}>
                <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
              </Figure>
            ))}
          </FigureStrip>
        </Group>
      </Section>

      <Section title="模拟视图" description="原界面与三种色觉模拟,和手机截图同排">
        <Block title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲对照;图高一致,宽度随原比例">
          <FigureStrip>
            {views.map((view) => (
              <Figure key={view.name}>
                <FigureImage src={view.image} alt={view.name} />
                <FigureLabel>{view.name}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
        </Block>
      </Section>

      <Section title="对照" description="现有组件的排版风格">
        <Group title="截图规模">
          <Stat value="9" label="本页截图" note="链路 5 步 · 模拟 4 视图" />
          <Text>链路明细和模拟视图共用同一套截图部件:固定高度、原比例显示,一组排成一行横向滚动。</Text>
        </Group>
      </Section>
    </Page>
  )
}
