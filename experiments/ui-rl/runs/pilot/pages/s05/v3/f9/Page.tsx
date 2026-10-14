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

const kpi = (key: string) => data.kpis.find((item) => item.key === key)!

export default function Report() {
  const fewest = kpi("fewest")
  const products = kpi("products")
  const issues = kpi("issues")
  const screens = kpi("screens")

  return (
    <Page
      meta={["星幕视频 7.2.1 / 橙果视频 5.9.0", "2026 年 6 月版本"]}
      title={data.title}
    >
      <Section title="结论" description="两款产品的取消链路对比">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section
        title="核心指标"
        description="步骤数与输入项按截图逐步核对"
        className="gap-12"
      >
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={fewest.value}
            unit={fewest.unit}
            label={fewest.label}
            captionBelow
            size="lg"
            note="橙果视频 5.9.0,星幕视频 8 步"
          />
          <Stat
            span={2}
            value={products.value}
            unit={products.unit}
            label={products.label}
            captionBelow
            note="星幕视频、橙果视频"
          />
          <Stat
            span={2}
            value={issues.value}
            unit={issues.unit}
            label={issues.label}
            captionBelow
            note="高 2 个、中 1 个"
          />
          <Stat
            span={2}
            value={screens.value}
            unit={screens.unit}
            label={screens.label}
            captionBelow
            note="星幕 8 张、橙果 6 张"
          />
        </Grid>
        <Group title="产品对比">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 3 },
              { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
              { key: "inputs", label: "输入项", align: "right", span: 1 },
              { key: "verdict", label: "结论", span: 3 },
            ]}
            rows={data.products.map((product) => ({
              product: product.name,
              steps: product.steps,
              inputs: product.inputs,
              verdict: product.verdict,
            }))}
            caption="步骤数为从「我的」页到关闭成功需要点击的屏数,输入项为链路中必须填写的次数。"
          />
        </Group>
      </Section>

      <Section
        title="共性模式"
        description="4 个模式,3 个两款都有,1 个只在星幕视频出现"
      >
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: `${pattern.comment} · 出现于 ${pattern.products.join("、")}`,
          }))}
        />
      </Section>

      <Section
        title="链路明细"
        description="每款产品一组,按步骤从左到右排开,一行放不下可横向滚动"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule
              label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步 · ${chain.verdict}`}
            />
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
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section
        title="问题清单"
        description="3 个问题,严重度分高、中两级"
      >
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "issue", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues.map((issue) => ({
            product: issue.product,
            step: `第 ${issue.step} 步`,
            issue: issue.title,
            severity: issue.severity,
            evidence: issue.evidence,
          }))}
          caption="「全部」表示两款产品都有该问题;步骤编号指取消链路中的第几步。"
        />
      </Section>

      <Section
        title="下一步"
        description="2 条建议,依据的问题项内联在每条里"
      >
        <List
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} 依据:${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            {
              label: "产品版本",
              value: data.chains
                .map((chain) => `${chain.product} ${chain.version}`)
                .join("、"),
            },
            { label: "分析日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
