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
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

export default function Report() {
  const stepNotes = data.chains.flatMap((chain) =>
    chain.steps
      .filter((step) => step.note)
      .map((step) => ({
        product: chain.product,
        step: step.no,
        screen: step.screen,
        note: step.note,
      })),
  )

  return (
    <Page title={data.title} meta={["3 款银行 App", "2026 年 9 月"]}>
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

      <Section title="结论" description="三款 App 开户流程的一句话判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比产品、分析截图、最少步骤与发现问题">
        <Grid cols={12} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              size="lg"
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="对比产品"
        description="三款 App 的步骤数、输入项数与分阶段做法"
        className="gap-12"
      >
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 3 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项数", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 2 },
          ]}
          rows={data.products.map((product) => ({
            product: product.name,
            steps: product.steps,
            inputs: product.inputs,
            verdict: product.verdict,
          }))}
        />
        <Group title="分阶段对比">
          <DataTable
            columns={[
              { key: "stage", label: "阶段", span: 3 },
              { key: "q1", label: "青禾银行", span: 2 },
              { key: "q2", label: "远川银行", span: 2 },
              { key: "q3", label: "北辰银行", span: 2 },
            ]}
            rows={data.stages.map((stage) => ({
              stage: stage.stage,
              q1: stage["青禾银行"],
              q2: stage["远川银行"],
              q3: stage["北辰银行"],
            }))}
            caption="同一阶段三款 App 的做法,口径为 2026 年 9 月版本。"
          />
        </Group>
      </Section>

      <Section title="共性做法" description="三款 App 中重复出现的三种流程做法">
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: pattern.comment,
            meta: pattern.products.join("、"),
          }))}
        />
      </Section>

      <Section
        title="链路明细"
        description="每款 App 的开户步骤顺序,共 26 张截图"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
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
                    {step.inputs > 0 ? ` · 输入 ${step.inputs} 项` : ""}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
        <Group title="步骤备注">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 2 },
              { key: "step", label: "步骤", align: "right", span: 1 },
              { key: "screen", label: "屏名", span: 2 },
              { key: "note", label: "备注", span: 4 },
            ]}
            rows={stepNotes}
            caption="截图下方的文字只写每步的内容与操作;走查中记下的备注在此列出。"
          />
        </Group>
      </Section>

      <Section title="发现问题" description="5 个问题的位置、证据与严重度">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            product: issue.product,
            step: issue.step,
            title: issue.title,
            evidence: issue.evidence,
            severity: issue.severity,
          }))}
        />
      </Section>

      <Section title="下一步" description="4 条改进建议与依据">
        <List
          numbered
          columns={3}
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: suggestion.detail,
            meta: `${suggestion.id} · ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>
    </Page>
  )
}
