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

const kpiOrder = ["fewest", "issues", "products", "screens"]

export default function Report() {
  const kpi = (key: string) => data.kpis.find((item) => item.key === key)

  const stageColumns = [
    { key: "stage", label: "环节", span: 1 },
    ...data.products.map((product) => ({
      key: product.name,
      label: product.name,
      span: 2,
    })),
  ]

  return (
    <Page
      meta={[data.products.map((product) => product.name).join(" · ")]}
      title={data.title}
    >
      <Section
        title="结论"
        description="走查覆盖从首页入口到装机进度页的完整报装链路"
      >
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与结果">
        <Grid cols={12} fields={false} className="items-baseline">
          {kpiOrder.map((key, index) => {
            const item = kpi(key)
            if (!item) return null
            return (
              <Stat
                key={item.key}
                span={3}
                value={item.value}
                unit={item.unit}
                label={item.label}
                captionBelow
                size={index === 0 ? "lg" : undefined}
              />
            )
          })}
        </Grid>
      </Section>

      <Section
        title="流程对比"
        description="步骤数为从首页入口到装机进度页的屏数,输入项为一屏内要填写的字段数"
      >
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "主要特征", span: 3 },
          ]}
          rows={data.products.map((product) => ({
            name: product.name,
            steps: product.steps,
            inputs: product.inputs,
            verdict: product.verdict,
          }))}
        />
      </Section>

      <Section
        title="环节对照"
        description="从开始前说明到提交后的九段环节,四款产品各自的做法"
      >
        <DataTable columns={stageColumns} rows={data.stages} />
      </Section>

      <Section title="共性模式" description="四款产品里反复出现的流程做法">
        <DataTable
          columns={[
            { key: "name", label: "模式", span: 3 },
            { key: "products", label: "涉及产品", span: 3 },
            { key: "comment", label: "说明", span: 3 },
          ]}
          rows={data.patterns.map((pattern) => ({
            name: pattern.name,
            products: pattern.products.join("、"),
            comment: pattern.comment,
          }))}
        />
      </Section>

      <Section
        title="链路明细"
        description="每款产品按步骤顺序排列的截图,有备注的步骤在说明下另起一行"
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
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note ? <FigureLabel>备注:{step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section
        title="问题清单"
        description="7 个问题按编号列出,严重度分高、中、低三级"
      >
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            product: issue.product,
            step: issue.step,
            title: issue.title,
            severity: issue.severity,
            evidence: issue.evidence,
          }))}
          caption="步骤为该产品内的屏序号;严重度从高到低为高、中、低"
        />
      </Section>

      <Section title="下一步" description="5 条改进建议,依据指向问题清单里的编号">
        <List
          ordered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: suggestion.detail,
            meta: `${suggestion.id} · 依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次走查的任务、范围与日期">
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
