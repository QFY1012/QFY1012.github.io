import {
  Page,
  Section,
  Group,
  Grid,
  Block,
  Stat,
  DataTable,
  ProgressList,
  List,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
  FigureRow,
  FigureGrid,
  GroupMarker,
  TableNote,
  BarList,
} from "@/components/report"

// ---- test data for the new parts -------------------------------------------

const problems = [
  { id: "C1-01", issue: "红色盲下「提交」与「取消」对比不足", level: "严重", users: 128 },
  { id: "C1-02", issue: "色带图例仅用红绿区分", level: "严重", users: 96 },
  { id: "C1-03", issue: "选中态与默认态色差过小", level: "一般", users: 54 },
  { id: "C2-01", issue: "告警文字与背景对比不足", level: "一般", users: 41 },
  { id: "C2-02", issue: "地图路况色阶不可辨", level: "轻微", users: 12 },
]

const problemCols = [
  { key: "id", label: "编号", span: 2 },
  { key: "issue", label: "问题", span: 4 },
  { key: "level", label: "严重度", tone: ["严重"] },
  { key: "users", label: "受影响用户", align: "right" as const, span: 2 },
]

const seriesRows = [
  { name: "品牌红", usage: "主按钮 / 错误", contrast: "4.6:1" },
  { name: "状态绿", usage: "成功 / 在线", contrast: "3.9:1" },
  { name: "信息蓝", usage: "链接 / 图表", contrast: "5.1:1" },
]

const seriesCols = [
  { key: "name", label: "系列", span: 3 },
  { key: "usage", label: "用途", span: 4 },
  { key: "contrast", label: "对比度", align: "right" as const, span: 2 },
]

const visionItems = [
  { label: "红色盲", value: 18 },
  { label: "绿色盲", value: 11 },
  { label: "蓝色盲", value: 4 },
]

const chain = [
  {
    product: "产品 A · v2.1",
    steps: [
      { no: 1, image: "assets/chain-a-1.svg", screen: "选择出行方式", content: "三种出行方式", action: "点选其一", inputs: 0 },
      { no: 2, image: "assets/chain-a-2.svg", screen: "确认路线", content: "换乘与步行信息", action: "确认出发", inputs: 0 },
      { no: 3, image: "assets/chain-a-3.svg", screen: "导航中", content: "实时路段提示", action: "结束导航", inputs: 0 },
    ],
  },
  {
    product: "产品 B · v1.4",
    steps: [
      { no: 1, image: "assets/chain-b-1.svg", screen: "行程列表", content: "历史行程", action: "查看详情", inputs: 0 },
      { no: 2, image: "assets/chain-b-2.svg", screen: "到达提醒", content: "到达与耗时", action: "完成", inputs: 0 },
    ],
  },
]

const simViews = [
  { name: "原界面", image: "assets/sim-original.svg" },
  { name: "红色盲模拟", image: "assets/sim-protan.svg" },
  { name: "绿色盲模拟", image: "assets/sim-deutan.svg" },
  { name: "蓝色盲模拟", image: "assets/sim-tritan.svg" },
]

const stripViews = [
  { name: "原始配色", image: "assets/strip-1.svg" },
  { name: "模拟配色", image: "assets/strip-2.svg" },
  { name: "对比度检查", image: "assets/strip-3.svg" },
]

export default function Report() {
  return (
    <Page title="色觉无障碍报告 · 新增部件演示" meta={["组件库演示", "2026-10"]}>
      <Section title="表格口径注释" description="注释与表格左边缘对齐">
        <Group title="问题表格">
          <Block>
            <DataTable columns={problemCols} rows={problems} />
            <TableNote>口径:严重 = 阻断主流程或信息不可辨;一般 = 需绕行;轻微 = 观感下降。取色自 375×812 与 1200×760 截图,色差阈值 CIEDE2000 ΔE &gt; 2.3。</TableNote>
          </Block>
        </Group>
      </Section>

      <Section title="链路明细分组" description="组间用与表格行线同宽的标记">
        <Group>
          {chain.map((g) => (
            <Group key={g.product}>
              <GroupMarker>{g.product}</GroupMarker>
              <FigureStrip>
                {g.steps.map((s) => (
                  <Figure key={s.no}>
                    <FigureImage src={s.image} alt={`${g.product} 第 ${s.no} 步:${s.screen}`} />
                    <FigureLabel>第 {s.no} 步 · {s.screen}</FigureLabel>
                    <FigureText>{s.content} · {s.action} · 输入 {s.inputs} 项</FigureText>
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="系列色" description="各色觉类型的问题数">
        <Grid cols={9} fields={false}>
          <Block span={5} title="系列色">
            <DataTable columns={seriesCols} rows={seriesRows} />
            <TableNote>取色说明:自截图逐像素取值,取三处以上同色区域的众数;对比度按 WCAG 2.1 相对亮度计算。</TableNote>
          </Block>
          <Block span={4} title="按色觉类型">
            <BarList items={visionItems} max={20} ticks={[0, 10, 20]} />
          </Block>
        </Grid>
      </Section>

      <Section title="色觉模拟" description="原界面与三种色觉模拟对照">
        <Group title="四张对照图 · 每行两张">
          <FigureGrid cols={2}>
            {simViews.map((v) => (
              <Figure key={v.name}>
                <FigureImage src={v.image} alt={v.name} />
                <FigureLabel>{v.name}</FigureLabel>
              </Figure>
            ))}
          </FigureGrid>
        </Group>
        <Group title="横向截图条 · 不露滚动条">
          <FigureRow>
            {stripViews.map((v) => (
              <Figure key={v.name}>
                <FigureImage src={v.image} alt={v.name} />
                <FigureLabel>{v.name}</FigureLabel>
              </Figure>
            ))}
          </FigureRow>
        </Group>
      </Section>

      <Section title="现有组件对照" description="新增部件的字号、颜色与间距与它们保持一致">
        <Grid cols={9} fields={false}>
          <Block span={3}>
            <Stat value="33" label="受影响问题" note="较上版 +5" />
          </Block>
          <Block span={3}>
            <Stat value="4" label="严重" direction="down" note="阻断主流程" />
          </Block>
          <Block span={3}>
            <ProgressList
              compact
              items={[
                { label: "已修复", value: 21, max: 33 },
                { label: "待修复", value: 12, max: 33 },
              ]}
            />
          </Block>
        </Grid>
        <Group title="问题清单">
          <List
            numbered
            items={[
              { title: "红色盲下主按钮不可辨", description: "品牌红与状态红对比不足" },
              { title: "图例仅用颜色区分", description: "缺少形状或文字标签" },
            ]}
          />
        </Group>
      </Section>
    </Page>
  )
}
