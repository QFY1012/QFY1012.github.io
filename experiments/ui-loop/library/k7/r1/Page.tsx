import {
  Page,
  Section,
  Group,
  Block,
  Text,
  Stat,
  DataTable,
  ProgressList,
  List,
  KV,
  Rule,
  FigureCompare,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

// Product comparison: the step count is a count, so it is drawn as a bar.
const products = [
  { product: "结算台", steps: 7, manual: 3 },
  { product: "门店助手", steps: 5, manual: 2 },
  { product: "代理门户", steps: 3, manual: 1 },
  { product: "海外站", steps: 2, manual: 0 },
]

// Issue detail: severity is an ordered scale (high / medium / low).
const issues = [
  { issue: "步骤数超出基线", severity: "高", owner: "流程" },
  { issue: "返回后丢失输入", severity: "中", owner: "表单" },
  { issue: "按钮文案不一致", severity: "低", owner: "文案" },
  { issue: "缺省值未预填", severity: "中", owner: "表单" },
]

// Counts by colour-vision type: the counts are small, and they differ.
const byType = [
  { label: "红色盲", value: 6, display: "6" },
  { label: "绿色盲", value: 9, display: "9" },
  { label: "蓝色盲", value: 2, display: "2" },
]

const views = [
  { name: "原界面", image: "assets/view-original.svg" },
  { name: "红色盲模拟", image: "assets/view-protan.svg" },
  { name: "绿色盲模拟", image: "assets/view-deutan.svg" },
  { name: "蓝色盲模拟", image: "assets/view-tritan.svg" },
]

export default function Report() {
  return (
    <Page title="报告组件:计数、严重度、对照图与分组" meta={["组件演示", "2026-10-12"]}>
      <Section title="计数条" description="数字后面接一条按量程画的条,条长就是数值">
        <Group title="表格里的计数">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 4 },
              { key: "steps", label: "步骤数", align: "right", span: 3, bar: true },
              { key: "manual", label: "人工环节", align: "right", span: 2 },
            ]}
            rows={products}
            caption="步骤数为结算链路里的必填屏数,人工环节指需要人工确认的屏数。"
          />
        </Group>
        <Group title="按色觉类型的问题数">
          <ProgressList items={byType} compact />
        </Group>
        <Group title="纵向计数列表">
          <ProgressList items={byType} />
        </Group>
      </Section>

      <Section title="严重度" description="严重度是连续层级,高、中、低三级要读得出顺序">
        <Group title="问题明细">
          <DataTable
            columns={[
              { key: "issue", label: "问题", span: 5 },
              { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
              { key: "owner", label: "归属", span: 2 },
            ]}
            rows={issues}
          />
        </Group>
      </Section>

      <Section title="色觉模拟" description="原界面与三种色觉模拟,四张要在一屏内对照">
        <Group title="色觉模拟">
          <FigureCompare>
            {views.map((view) => (
              <Figure key={view.name}>
                <FigureImage src={view.image} alt={view.name} />
                <FigureLabel>{view.name}</FigureLabel>
              </Figure>
            ))}
          </FigureCompare>
        </Group>
        <Group title="图下带说明">
          <FigureCompare>
            <Figure>
              <FigureImage src={views[0].image} alt={views[0].name} />
              <FigureLabel>{views[0].name}</FigureLabel>
              <FigureText>结算漏斗按渠道分组,四个系列用四种颜色。</FigureText>
            </Figure>
            <Figure>
              <FigureImage src={views[1].image} alt={views[1].name} />
              <FigureLabel>{views[1].name}</FigureLabel>
              <FigureText>红色盲下直连与门店两个系列几乎同色。</FigureText>
            </Figure>
            <Figure>
              <FigureImage src={views[2].image} alt={views[2].name} />
              <FigureLabel>{views[2].name}</FigureLabel>
              <FigureText>绿色盲下代理与海外两个系列难以区分。</FigureText>
            </Figure>
            <Figure>
              <FigureImage src={views[3].image} alt={views[3].name} />
              <FigureLabel>{views[3].name}</FigureLabel>
              <FigureText>蓝色盲下门店与直连的色差变小。</FigureText>
            </Figure>
          </FigureCompare>
        </Group>
      </Section>

      <Section title="分组" description="一节里的子块要能一眼看出分成几块">
        <Group title="颜色调整">
          <Text>把系列色换成分辨度更高的一组,并保留深浅顺序。</Text>
          <KV items={[{ label: "调整系列", value: "4" }, { label: "新增对比度", value: "2" }]} />
        </Group>
        <Group title="按问题处理">
          <List
            items={[
              { title: "合并重复屏", description: "结算台第 3、4 步合并" },
              { title: "预填缺省值", description: "门店助手表单" },
            ]}
          />
        </Group>
      </Section>

      <Section title="现有组件" description="同一页里其它数字和文字的样式">
        <Group>
          <Rule label="结算台 · v2.4" />
          <Block title="本期结论">
            <Stat value="14" label="受影响问题" note="较上期" delta="-3" direction="down" />
            <Text>问题数下降 3 项,严重度以「中」为主。</Text>
          </Block>
        </Group>
      </Section>
    </Page>
  )
}
