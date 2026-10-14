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

const kpi = Object.fromEntries(data.kpis.map((k) => [k.key, k])) as Record<
  string,
  { label: string; value: number; unit: string }
>

export default function Report() {
  return (
    <Page title={data.title} meta={[data.products.map((p) => p.name).join(" · ")]}>
      <Section title="结论" description="三款企业网盘外链分享流程的判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的规模与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            {...kpi.fewest}
          />
          <Stat span={2} captionBelow {...kpi.products} />
          <Stat span={2} captionBelow {...kpi.screens} />
          <Stat span={2} captionBelow {...kpi.issues} />
        </Grid>
      </Section>

      <Section title="产品对比" description="各产品的步骤数、输入项与结论">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2 },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={data.products}
          caption="步骤数统计分享开始到发出链接的界面数;输入项指流程中需要填写的字段,三款产品均为 0。"
        />
      </Section>

      <Section title="链路明细" description="每步的界面、操作与备注">
        <Group>
          {data.chains.map((chain) => (
            <Group key={chain.product} title={`${chain.product} · ${chain.version} · ${chain.verdict}`}>
              <FigureStrip>
                {chain.steps.map((step) => (
                  <Figure key={step.no}>
                    <FigureImage
                      src={step.image}
                      alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                    />
                    <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                    <FigureText>{step.content} · {step.action}</FigureText>
                    {step.note ? <FigureText>备注 · {step.note}</FigureText> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="问题明细" description="问题、位置与严重度">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={data.issues}
          caption="严重度从低到高排列;步骤指该产品分享流程中的第几步。"
        />
      </Section>

      <Section title="下一步" description="每条建议的依据对回具体步骤与问题编号">
        <Group>
          <List
            ordered
            items={data.suggestions.map((s) => ({
              title: s.title,
              description: `${s.detail} · 依据:${s.basis.join("、")}`,
            }))}
          />
        </Group>
      </Section>

      <Section title="背景信息" description="任务、范围与日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}