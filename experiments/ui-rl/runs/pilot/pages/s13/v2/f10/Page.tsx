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

type Stage = (typeof data.stages)[number]

const stageValue = (stage: Stage, product: string) =>
  (stage as unknown as Record<string, string>)[product]

const productRows = data.products.map((p) => ({
  name: p.name,
  steps: p.steps,
  inputs: p.inputs,
  verdict: p.verdict,
}))

const issueRows = data.issues.map((i) => ({
  id: i.id,
  product: i.product,
  step: `第 ${i.step} 步`,
  title: i.title,
  severity: i.severity,
  evidence: i.evidence,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["酒店预订 App", "2026 年 4 月"]}>
      <Section title="结论" description="从搜索酒店到支付下单的全流程判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section
        title="核心指标"
        description="5 款产品、47 张截图,最短 8 步、最长 11 步"
      >
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={8}
            unit="步"
            label={data.kpis[2].label}
            captionBelow
          />
          <Stat span={2} value={5} unit="个" label="对比产品" captionBelow />
          <Stat span={2} value={47} unit="张" label="分析截图" captionBelow />
          <Stat span={2} value={8} unit="个" label="发现问题" captionBelow />
        </Grid>
      </Section>

      <Section
        title="产品对照"
        description="步骤数按从首页到预订成功的屏数计,输入项为全流程填写字段总数"
      >
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={productRows}
        />
      </Section>

      <Section
        title="阶段对比"
        description="全流程分 6 个阶段,逐款对照各产品的做法差异"
        className="gap-12"
      >
        {data.stages.map((stage) => (
          <Group key={stage.stage} title={stage.stage}>
            <KV
              labelCols={2}
              items={data.products.map((p) => ({
                label: p.name,
                value: stageValue(stage, p.name),
              }))}
            />
          </Group>
        ))}
      </Section>

      <Section
        title="链路明细"
        description="每款产品的全部屏按步骤顺序排列,组内加注本步备注"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步`} />
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
                  {step.note ? <FigureText>备注 · {step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section
        title="共性问题"
        description="跨产品重复出现的四类问题"
      >
        <List
          numbered
          items={data.patterns.map((p) => ({
            title: p.name,
            description: `涉及 ${p.products.join("、")} · ${p.comment}`,
          }))}
        />
      </Section>

      <Section
        title="问题明细"
        description="8 个问题,证据对回链路步骤编号"
      >
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section
        title="下一步"
        description="建议的依据对回问题明细的编号"
      >
        <List
          numbered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} 依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="口径与前序信息">
        <KV
          labelCols={2}
          items={[
            { label: "分析任务", value: data.task },
            { label: "覆盖范围", value: data.scope },
            { label: "采集日期", value: data.date },
            { label: "截图样本", value: "47 张,一步一屏" },
          ]}
        />
      </Section>
    </Page>
  )
}