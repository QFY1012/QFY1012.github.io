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

const productRows = data.products.map((product) => ({
  product: product.name,
  steps: product.steps,
  inputs: product.inputs,
  verdict: product.verdict,
}))

const issueRows = data.issues.map((issue) => ({
  id: issue.id,
  product: issue.product,
  step: `第 ${issue.step} 步`,
  title: issue.title,
  severity: issue.severity,
  evidence: issue.evidence,
}))

const suggestionItems = data.suggestions.map((suggestion) => ({
  title: suggestion.title,
  description: `${suggestion.detail};依据:${suggestion.basis.join("、")}`,
}))

export default function Report() {
  return (
    <Page title="交互流程挖掘 · 外链分享文件" meta={["企业网盘", "2026 年 9 月"]}>
      <Section title="结论" description="三款产品的分享流程与权限设置差异">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次挖掘的产品、截图与问题数量">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={data.kpis[0].value}
            unit={data.kpis[0].unit}
            label={data.kpis[0].label}
            note="云盒 / 栈盘 / 方舟"
          />
          <Stat
            span={3}
            captionBelow
            value={data.kpis[1].value}
            unit={data.kpis[1].unit}
            label={data.kpis[1].label}
            note="每款 3–5 张"
          />
          <Stat
            span={3}
            captionBelow
            value={data.kpis[2].value}
            unit={data.kpis[2].unit}
            label={data.kpis[2].label}
            note="云盒 4 步,方舟 5 步"
          />
          <Stat
            span={3}
            captionBelow
            value={data.kpis[3].value}
            unit={data.kpis[3].unit}
            label={data.kpis[3].label}
            note="全部出现在云盒"
          />
        </Grid>
      </Section>

      <Section title="产品对比" description="按步骤数与设置输入对照三款产品">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2 },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={productRows}
          caption="步骤数按完成一次外链分享所需的最少操作屏数计;输入项指需要手动填写的字段。"
        />
      </Section>

      <Section
        title="链路明细"
        description="每格一屏,自左向右按操作顺序排列"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version}`} />
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                  />
                  <FigureLabel>
                    第 {step.no} 步 · {step.screen}
                  </FigureLabel>
                  <FigureText>
                    {step.content} · {step.action}
                  </FigureText>
                  {step.note ? <FigureText>备注:{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="按严重度从高到低排列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={issueRows}
          caption="严重度按对用户后果的影响分级;三个问题都出现在云盒。"
        />
      </Section>

      <Section title="下一步" description="每条建议的依据指向具体步骤或问题编号">
        <List ordered items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="本次挖掘的任务、范围与日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "样本量",
              value: `${data.kpis[0].value} 款产品 · ${data.kpis[1].value} 张界面截图`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}