import data from "./data.json"
import { Page, Section, Group, Grid, Text, Stat, DataTable, List, KV, FigureStrip, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"

const kpiSpans: Record<number, number> = { 1: 12, 2: 6, 3: 4, 4: 3, 5: 4, 6: 4 }

export default function Report() {
  const kpis = data.kpis
  const kpiSpan = kpis.length <= 4 ? kpiSpans[kpis.length] : 4

  return (
    <Page title={data.title} meta={[data.products.map((p) => p.name).join(" / "), "2026 年第三季度"]}>
      <Section title="背景信息" description="本次挖掘的任务、范围与日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>

      <Section title="结论" description="两款产品预订会议室的核心差异">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="步骤数与输入项按逐屏截图统计">
        <Grid cols={12} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={kpiSpan}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              size="lg"
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="两款产品的步骤数、输入项与路径思路">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "路径思路", span: 3 },
          ]}
          rows={data.products.map((p) => ({
            product: p.name,
            steps: p.steps,
            inputs: p.inputs,
            verdict: p.verdict,
          }))}
          caption="步骤数为完成一次预订需要操作的屏数;输入项为该流程中需要填写的项数。"
        />
      </Section>

      <Section title="阶段对比" description="同一阶段两款产品的不同做法">
        <DataTable
          columns={[
            { key: "stage", label: "阶段", span: 3 },
            { key: "a", label: data.products[0].name, span: 3 },
            { key: "b", label: data.products[1].name, span: 3 },
          ]}
          rows={data.stages.map((s) => ({
            stage: s.stage,
            a: s["协作宝"],
            b: s["链工"],
          }))}
        />
      </Section>

      <Section title="链路明细" description="每步一屏,按操作顺序从左到右排开" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
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
              { key: "screen", label: "屏幕", span: 3 },
              { key: "note", label: "备注", span: 3 },
            ]}
            rows={data.chains.flatMap((chain) =>
              chain.steps
                .filter((step) => step.note)
                .map((step) => ({
                  product: chain.product,
                  step: step.no,
                  screen: step.screen,
                  note: step.note,
                }))
            )}
            caption="只列有备注的步骤,图下文字行数一致,便于两款产品对照。"
          />
        </Group>
      </Section>

      <Section title="发现问题" description="共 4 个,严重度分高、中、低三级">
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
          caption="P1–P4 的编号在下文建议中引用。"
        />
      </Section>

      <Section title="下一步" description="按优先级给出的三条改造建议">
        <List
          columns={3}
          numbered
          items={data.suggestions.map((s) => ({
            title: `${s.id} ${s.title}`,
            description: `${s.detail}。依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>
    </Page>
  )
}
