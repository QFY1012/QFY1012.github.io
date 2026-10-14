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

const kpiOrder = ["fewest", "products", "screens", "issues"]
const kpiSpans = [3, 2, 2, 2]

export default function Report() {
  const kpis = kpiOrder.map((key) => data.kpis.find((kpi) => kpi.key === key)!)
  const screens = data.kpis.find((kpi) => kpi.key === "screens")!

  return (
    <Page title={data.title} meta={["星幕视频 · 橙果视频", "2026 年 6 月版本"]}>
      <Section title="结论">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="规模与结论数字,主指标为步骤最少的产品">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((kpi, index) => (
            <Stat
              key={kpi.key}
              span={kpiSpans[index]}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              size={kpi.key === "fewest" ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="产品对比"
        description="按产品并排步骤数与输入项,输入项指需要用户填写的表单"
      >
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={data.products}
          caption="步骤数从「我的」页起算,含最后的关闭成功页;输入项指关闭链路中需要用户填写的项数"
        />
      </Section>

      <Section
        title="链路明细"
        description="每个产品一组,按操作顺序横向排列,一步一屏"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version}`} />
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no} className="gap-6">
                  <Figure>
                    <FigureImage
                      src={step.image}
                      alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                    />
                    <FigureLabel>
                      第 {step.no} 步 · {step.screen}
                    </FigureLabel>
                    <FigureText>
                      {step.inputs > 0
                        ? `${step.content} · ${step.action} · 输入 ${step.inputs} 项`
                        : `${step.content} · ${step.action}`}
                    </FigureText>
                  </Figure>
                  {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section
        title="共有模式"
        description="两款产品共同的做法,以及只有星幕视频采用的做法"
      >
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: `${pattern.comment} · 涉及:${pattern.products.join("、")}`,
          }))}
        />
      </Section>

      <Section
        title="问题清单"
        description="按严重度排出顺序,编号用于在下一步建议中回指"
      >
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues}
          caption="步骤号对应该产品链路明细中的第几步;严重度越高表示越阻断关闭流程"
        />
      </Section>

      <Section title="下一步" description="每条建议的依据用问题编号回指具体条目">
        <List
          ordered
          items={data.suggestions.map((suggestion) => ({
            title: `${suggestion.id} ${suggestion.title}`,
            description: `${suggestion.detail} 依据:${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与样本口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "版本",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join("、"),
            },
            { label: "样本量", value: `${screens.value} 张分析截图,覆盖 2 条完整关闭链路` },
          ]}
        />
      </Section>
    </Page>
  )
}