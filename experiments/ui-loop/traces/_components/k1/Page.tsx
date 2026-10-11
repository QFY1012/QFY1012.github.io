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
  List,
  Figure,
  FigureRow,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

// 色觉无障碍分析的一组四张:原界面和三种色盲模拟,1200×760,和手机截图比例不同。
const cvdViews = [
  { name: "原界面", image: "assets/cvd-c1/original.png" },
  { name: "红色盲", image: "assets/cvd-c1/protanopia.png" },
  { name: "绿色盲", image: "assets/cvd-c1/deuteranopia.png" },
  { name: "蓝色盲", image: "assets/cvd-c1/tritanopia.png" },
]

// One product's screens, one Figure per screen, in step order. The FigureRow
// scrolls sideways and FigureImage holds one height, so every screenshot lines
// up and the step labels sit on the same line without the row widening the page.
function Chain({ chain }: { chain: (typeof data.chains)[number] }) {
  return (
    <Group title={`${chain.product} · ${chain.version}`}>
      <FigureRow>
        {chain.steps.map((step) => (
          <Figure key={step.no}>
            <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
            <FigureLabel>
              第 {step.no} 步 · {step.screen}
            </FigureLabel>
            <FigureText>
              {step.content} · {step.action} · 输入 {step.inputs} 项
              {step.note ? ` · ${step.note}` : ""}
            </FigureText>
          </Figure>
        ))}
      </FigureRow>
    </Group>
  )
}

export default function Report() {
  return (
    <Page title={data.title} meta={[data.task, data.scope, data.date]}>
      <Section title="结论" description="三家银行的开户流程对比">
        <Group>
          <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
        </Group>
        <Group>
          <Grid cols={4} fields={false}>
            {data.kpis.map((kpi) => (
              <Stat key={kpi.key} value={kpi.value} label={kpi.label} unit={kpi.unit} size="lg" captionBelow />
            ))}
          </Grid>
        </Group>
      </Section>

      <Section title="产品对比" description="步骤数、输入项与整体结论">
        <Group>
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 3 },
              { key: "steps", label: "步骤", align: "right", span: 2 },
              { key: "inputs", label: "输入项", align: "right", span: 2 },
              { key: "verdict", label: "结论", span: 2 },
            ]}
            rows={data.products}
          />
        </Group>
      </Section>

      <Section title="交互链路" description="每个产品一组,一格一屏,按步骤顺序">
        {data.chains.map((chain) => (
          <Chain key={chain.product} chain={chain} />
        ))}
      </Section>

      <Section title="阶段对比" description="同一阶段三家银行的做法">
        <Group>
          <DataTable
            columns={[
              { key: "stage", label: "阶段", span: 3 },
              { key: "青禾银行", label: "青禾银行", span: 2 },
              { key: "远川银行", label: "远川银行", span: 2 },
              { key: "北辰银行", label: "北辰银行", span: 2 },
            ]}
            rows={data.stages}
          />
        </Group>
      </Section>

      <Section title="常见模式" description="值得沿用的做法">
        <Group>
          <List
            items={data.patterns.map((pattern) => ({
              title: pattern.name,
              description: `${pattern.comment} · 产品:${pattern.products.join("、")}`,
            }))}
          />
        </Group>
      </Section>

      <Section title="问题" description="按严重度排列">
        <Group>
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "product", label: "产品", span: 2 },
              { key: "step", label: "步骤", align: "right", span: 1 },
              { key: "title", label: "问题", span: 2 },
              { key: "severity", label: "严重度", span: 1, tone: ["高"] },
              { key: "evidence", label: "证据", span: 2 },
            ]}
            rows={data.issues}
          />
        </Group>
      </Section>

      <Section title="建议" description="按优先级排列">
        <Group>
          <List
            ordered
            items={data.suggestions.map((suggestion) => ({
              title: suggestion.title,
              description: `${suggestion.detail} · 依据:${suggestion.basis.join("、")}`,
            }))}
          />
        </Group>
      </Section>

      <Section title="视图对照" description="一组截图一行横向滚动,图同一高度、按原比例显示,不裁剪">
        <Block title="逐屏视图" description="同一排法用于原界面与色觉模拟视图;说明文字放在同一块里">
          <FigureRow>
            {data.chains[0].steps.slice(0, 4).map((step) => (
              <Figure key={step.no}>
                <FigureImage src={step.image} alt={`${step.screen}视图`} />
                <FigureLabel>{step.screen}</FigureLabel>
              </Figure>
            ))}
          </FigureRow>
        </Block>
        <Block title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照(1200×760,和手机截图比例不同)">
          <FigureRow>
            {cvdViews.map((view) => (
              <Figure key={view.name}>
                <FigureImage src={view.image} alt={view.name} />
                <FigureLabel>{view.name}</FigureLabel>
              </Figure>
            ))}
          </FigureRow>
        </Block>
      </Section>
    </Page>
  )
}
