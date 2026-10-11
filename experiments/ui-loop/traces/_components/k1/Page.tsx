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
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

// One product's screens, one cell per screen, in step order. The grid fixes the
// cell width and FigureImage holds the phone ratio, so every row of screenshots
// lines up and the step labels sit on the same line.
function Chain({ chain }: { chain: (typeof data.chains)[number] }) {
  return (
    <Group title={`${chain.product} · ${chain.version}`}>
      <Grid cols={4} fields={false}>
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
      </Grid>
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

      <Section title="视图对照" description="一组四张,每张带视图名称,可放进 Grid 或 Block">
        <Block title="逐屏视图" description="同一排法用于原界面与色觉模拟视图;说明文字放在同一块里">
          <Grid cols={4} fields={false}>
            {data.chains[0].steps.slice(0, 4).map((step) => (
              <Figure key={step.no}>
                <FigureImage src={step.image} alt={`${step.screen}视图`} />
                <FigureLabel>{step.screen}</FigureLabel>
              </Figure>
            ))}
          </Grid>
        </Block>
      </Section>
    </Page>
  )
}
