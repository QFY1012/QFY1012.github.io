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

export default function Report() {
  return (
    <Page
      title={data.title}
      meta={["手机银行 · 线上开户", data.scope]}
    >
      <Section title="结论" description={data.task}>
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的产品、截图与问题计数">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              size="lg"
              captionBelow
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="步骤按屏计,输入项为需要手动填写的字段数">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "特点", span: 3 },
          ]}
          rows={data.products}
        />
      </Section>

      <Section title="环节对照" description="同一环节在三家 App 里的做法">
        <DataTable
          columns={[
            { key: "stage", label: "环节", span: 2 },
            { key: "青禾银行", label: "青禾银行", span: 2 },
            { key: "远川银行", label: "远川银行", span: 3 },
            { key: "北辰银行", label: "北辰银行", span: 2 },
          ]}
          rows={data.stages}
        />
      </Section>

      <Section
        title="流程链路"
        description="26 张分析截图,按产品分组的逐屏记录"
        className="gap-12"
      >
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
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="5 个问题,按严重度从高到低排列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "依据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={data.issues}
        />
      </Section>

      <Section title="共性做法" description="三家流程里重复出现的做法">
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: pattern.comment,
            meta: `出现在 ${pattern.products.join("、")}`,
          }))}
        />
      </Section>

      <Section title="下一步" description="针对上面的问题给出的改法">
        <List
          numbered
          columns={3}
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: suggestion.detail,
            meta: `依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "覆盖范围", value: data.scope },
            {
              label: "样本",
              value: data.chains
                .map((chain) => `${chain.product} ${chain.steps.length} 屏`)
                .join(" · "),
            },
            { label: "报告日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
