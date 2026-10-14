import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Text,
  Stat,
  DataTable,
  List,
  KV,
  Rule,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

const PRODUCT_NAMES = ["云栖旅行", "栖岸酒店", "途鹿出行", "蓝湾预订", "泊客旅行"]

const kpi = (key: string) => data.kpis.find((item) => item.key === key)!

const totalSteps = data.chains.reduce((sum, chain) => sum + chain.steps.length, 0)

const chainBlocks = data.chains.flatMap((chain) => {
  const inputs = chain.steps.reduce((sum, step) => sum + step.inputs, 0)
  return [
    <Rule key={`rule-${chain.product}`} label={`${chain.product} · ${chain.version}`} />,
    <FigureStrip key={`strip-${chain.product}`}>
      {chain.steps.map((step) => (
        <Figure key={step.no}>
          <FigureImage
            src={step.image}
            alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
          />
          <FigureLabel>{`第 ${step.no} 步 · ${step.screen}`}</FigureLabel>
          <FigureText>{`${step.content} · ${step.action} · 输入 ${step.inputs} 项`}</FigureText>
          {step.note ? <FigureText>{step.note}</FigureText> : null}
        </Figure>
      ))}
    </FigureStrip>,
    <Text key={`verdict-${chain.product}`}>
      {`${chain.verdict};全程 ${chain.steps.length} 步,填写项合计 ${inputs} 项。`}
    </Text>,
  ]
})

const productRows = data.products.map((product) => ({
  name: product.name,
  steps: product.steps,
  inputs: product.inputs,
  verdict: product.verdict,
}))

const stageItems = data.stages.map((stage) => ({
  title: stage.stage,
  description: PRODUCT_NAMES.map(
    (name) => `${name}:${(stage as Record<string, string>)[name]}`,
  ).join(" · "),
}))

const patternItems = data.patterns.map((pattern) => ({
  title: pattern.name,
  description: `${pattern.comment};涉及 ${pattern.products.join("、")}`,
}))

const issueRows = data.issues.map((issue) => ({
  id: issue.id,
  product: `${issue.product} · 第 ${issue.step} 步`,
  title: issue.title,
  evidence: issue.evidence,
  severity: issue.severity,
}))

const suggestionItems = data.suggestions.map((suggestion) => ({
  title: `${suggestion.id} ${suggestion.title}`,
  description: `${suggestion.detail};依据:${suggestion.basis.join("、")}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["酒店预订 App(5 款)", "2026 年 4 月版本"]}>
      <Section title="结论" description="五款产品从搜索到支付的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本组对比的产品数、样本量与主要发现">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
            captionBelow
            note="其余四款 9 到 11 步"
          />
          <Stat
            span={3}
            value={kpi("products").value}
            unit={kpi("products").unit}
            label={kpi("products").label}
            captionBelow
            note="均为国内主流预订应用"
          />
          <Stat
            span={3}
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
            captionBelow
            note="高 1 个 · 中 5 个 · 低 2 个"
          />
          <Stat
            span={3}
            value={kpi("screens").value}
            unit={kpi("screens").unit}
            label={kpi("screens").label}
            captionBelow
            note={`与 ${totalSteps} 个步骤一一对应`}
          />
        </Grid>
      </Section>

      <Section
        title="流程差异"
        description="步骤数、填写项数与六段流程的做法差异"
        className="gap-12"
      >
        <Group title="各产品步骤数与填写项">
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", span: 2, align: "right", bar: true },
              { key: "inputs", label: "填写项", span: 2, align: "right", bar: true },
              { key: "verdict", label: "一句话判定", span: 3 },
            ]}
            rows={productRows}
            caption="步骤数按从进入首页到出现预订成功页计;填写项是各屏必填输入项之和。"
          />
        </Group>
        <Group title="六段流程的做法差异">
          <List items={stageItems} />
        </Group>
      </Section>

      <Section title="共性规律" description="跨产品重复出现的四类做法">
        <List numbered items={patternItems} />
      </Section>

      <Section title="链路明细" description="每款产品从搜索到预订成功的逐屏截图">
        <Group>{chainBlocks}</Group>
      </Section>

      <Section title="问题明细" description="8 个问题的严重度与判断依据">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品与步骤", span: 2 },
            { key: "title", label: "问题", span: 3 },
            { key: "evidence", label: "依据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
          caption="严重度按影响范围与用户能否自行规避分高、中、低三级;步骤号对应链路明细里的屏序。"
        />
      </Section>

      <Section title="下一步" description="五条改法与各自的依据">
        <List numbered columns={3} items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="任务、版本与样本口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "对比产品", value: data.products.map((product) => product.name).join("、") },
            { label: "版本", value: data.scope },
            { label: "走查日期", value: data.date },
            { label: "样本", value: `${totalSteps} 个步骤、${kpi("screens").value} 张截图,每步一张` },
            {
              label: "阶段划分",
              value: data.stages.map((stage) => stage.stage).join("、"),
            },
          ]}
        />
      </Section>
    </Page>
  )
}