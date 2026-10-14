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

const kpi = (key: string) => data.kpis.find((k) => k.key === key)!
const screenshots = `${kpi("screens").value} ${kpi("screens").unit}`

export default function Report() {
  const fewest = kpi("fewest")
  const issues = kpi("issues")
  const screens = kpi("screens")
  const products = kpi("products")

  return (
    <Page title={data.title} meta={[data.scope, data.date]}>
      <Section title="结论" description="关闭会员自动续费的实际路径">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的范围与发现">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={fewest.value}
            unit={fewest.unit}
            captionBelow
            label={fewest.label}
            note="星幕视频要 8 步"
          />
          <Stat
            span={3}
            value={issues.value}
            unit={issues.unit}
            captionBelow
            label={issues.label}
            note="2 个高、1 个中"
          />
          <Stat
            span={3}
            value={screens.value}
            unit={screens.unit}
            captionBelow
            label={screens.label}
            note="星幕视频 8 张、橙果视频 6 张"
          />
          <Stat
            span={3}
            value={products.value}
            unit={products.unit}
            captionBelow
            label={products.label}
            note="星幕视频 7.2.1、橙果视频 5.9.0"
          />
        </Grid>
      </Section>

      <Section title="对比结果" description="链路长度、输入项与结论">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={data.products}
        />
      </Section>

      <Section title="共性模式" description="两款 App 都出现的做法与差别">
        <List
          numbered
          items={data.patterns.map((p) => ({
            title: p.name,
            description: `${p.comment} · 出现于:${p.products.join("、")}`,
          }))}
        />
      </Section>

      <Section title="流程链路" description={`从「我的」页到关闭成功的每一步,共 ${screenshots}`} className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version} · ${chain.verdict}`} />
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
                  {step.note && <FigureText>{step.note}</FigureText>}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题清单" description="3 个问题,按严重度排列">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues}
        />
      </Section>

      <Section title="下一步" description="按问题优先级给出的两条改法">
        <List
          ordered
          divided={false}
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} · 依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与样本">
        <KV
          labelCols={2}
          items={[
            { label: "分析任务", value: data.task },
            { label: "对比范围", value: data.scope },
            { label: "分析日期", value: data.date },
            {
              label: "产品与版本",
              value: data.chains.map((c) => `${c.product} ${c.version}`).join("、"),
            },
            { label: "分析截图", value: `${screenshots}(星幕视频 8 张、橙果视频 6 张)` },
          ]}
        />
      </Section>
    </Page>
  )
}
