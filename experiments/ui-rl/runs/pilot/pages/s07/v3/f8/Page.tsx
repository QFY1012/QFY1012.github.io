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

// 核心指标:数字放大前置,样本量(分析截图)放到最后一项。
const KPI_ORDER = ["products", "fewest", "issues", "screens"]

export default function Report() {
  const kpi = (key: string) => data.kpis.find((k) => k.key === key)!
  const inputsOf = (name: string) => data.products.find((p) => p.name === name)?.inputs ?? 0

  return (
    <Page title={data.title} meta={["安沁、望山、澄心医院 App", data.date]}>
      <Section title="结论" description="三款 App 的手机端挂号流程逐屏对比,差别在入口位置与就诊人填法。">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的规模与结果计数。">
        <Grid cols={9} fields={false} className="items-baseline">
          {KPI_ORDER.map((key) => {
            const k = kpi(key)
            return (
              <Stat
                key={k.key}
                span={2}
                size="lg"
                value={k.value}
                unit={k.unit}
                label={k.label}
                captionBelow
              />
            )
          })}
        </Grid>
      </Section>

      <Section title="阶段对比" description="同一段流程上三家的做法,一列一款 App。">
        <DataTable
          columns={[
            { key: "stage", label: "流程阶段", span: 3 },
            { key: "安沁医院", label: "安沁医院", span: 2 },
            { key: "望山医院", label: "望山医院", span: 2 },
            { key: "澄心医院", label: "澄心医院", span: 2 },
          ]}
          rows={data.stages}
        />
      </Section>

      <Section
        title="链路明细"
        description="一款 App 一组,按步骤横向排开;图下列出该产品需要注意的点。"
        className="gap-12"
      >
        {data.chains.map((chain) => {
          const notes = chain.steps
            .filter((s) => s.note)
            .map((s) => ({ title: `第 ${s.no} 步 · ${s.screen}`, description: s.note }))
          return (
            <Group key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version}`} />
              <Text>
                {`${chain.verdict},共 ${chain.steps.length} 步,就诊人信息 ${inputsOf(chain.product)} 项`}
              </Text>
              <FigureStrip>
                {chain.steps.map((step) => (
                  <Figure key={step.no}>
                    <FigureImage
                      src={step.image}
                      alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                    />
                    <FigureLabel>
                      {`第 ${step.no} 步 · ${step.screen}`}
                    </FigureLabel>
                    <FigureText>
                      {`${step.content} · ${step.action} · 输入 ${step.inputs} 项`}
                    </FigureText>
                  </Figure>
                ))}
              </FigureStrip>
              <Group title="需要注意的点">
                <List numbered items={notes} />
              </Group>
            </Group>
          )
        })}
      </Section>

      <Section title="问题清单" description="按产品与步骤定位,编号在下一步建议里引用。">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={data.issues.map((issue) => ({ ...issue, step: `第 ${issue.step} 步` }))}
        />
      </Section>

      <Section title="下一步" description="针对问题清单的三条改动建议,依据指回问题编号。">
        <List
          ordered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail}。依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本。">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "产品版本",
              value: data.chains.map((c) => `${c.product} ${c.version}`).join("、"),
            },
          ]}
        />
      </Section>
    </Page>
  )
}