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

const productRows = data.products.map((p) => ({
  name: p.name,
  steps: p.steps,
  inputs: p.inputs,
  verdict: p.verdict,
}))

const stageRows = data.stages.map((s) => ({
  stage: s.stage,
  qinglan: s["青岚单车"],
  xunta: s["迅踏出行"],
  qidian: s["骑点单车"],
}))

const issueRows = data.issues.map((i) => ({
  id: i.id,
  product: i.product,
  step: i.step,
  issue: `${i.title}。${i.evidence}`,
  severity: i.severity,
}))

const versionText = data.chains.map((c) => `${c.product} ${c.version}`).join("、")

export default function Report() {
  return (
    <Page
      title={data.title}
      meta={[data.scope, `分析日期 ${data.date}`]}
    >
      <Section title="结论" description="任务:新用户从注册到扫码开锁的首次骑行链路">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="3 款 App,共 13 张链路截图">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              size="lg"
              captionBelow
              value={k.value}
              unit={k.unit}
              label={k.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="链路对比" description="步数和输入项越少,首次骑行门槛越低">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2 },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={productRows}
          caption="步骤数 = 从打开 App 到开锁成功的屏数;输入项 = 链路中需用户填写的字段数"
        />
      </Section>

      <Section title="阶段对比" description="同一阶段,三家 App 的做法">
        <DataTable
          columns={[
            { key: "stage", label: "阶段", span: 3 },
            { key: "qinglan", label: "青岚单车", span: 2 },
            { key: "xunta", label: "迅踏出行", span: 2 },
            { key: "qidian", label: "骑点单车", span: 2 },
          ]}
          rows={stageRows}
          caption="青岚单车 4.2.1、迅踏出行 3.8.0、骑点单车 5.0.4,均为 2026 年 3 月版本"
        />
      </Section>

      <Section
        title="链路明细"
        description="一个产品一组,按步骤顺序横向排开"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version} · 共 ${chain.steps.length} 步`} />
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

      <Section title="问题" description="挡在开锁前的两道门槛">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "issue", label: "问题", span: 4 },
            {
              key: "severity",
              label: "严重度",
              span: 1,
              levels: ["中", "高"],
            },
          ]}
          rows={issueRows}
          caption="严重度:高 = 用户站在车边被迫填表,车锁已被占用;中 = 开锁前多出支付或跳转"
        />
      </Section>

      <Section title="下一步" description="两条改动,均以对照产品的做法为依据" className="gap-12">
        <List
          numbered
          columns={2}
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: s.detail,
            meta: `依据:${s.basis.join(" · ")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="范围与口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            { label: "对比产品", value: versionText },
            {
              label: "样本",
              value: `${data.kpis[0].value} 款 App、${data.kpis[1].value} 张截图、${data.kpis[3].value} 个问题`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}
