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

// Severity is an ordered scale, so the issue table sorts by it (high first).
const SEVERITY: Record<string, number> = { 高: 0, 中: 1, 低: 2 }

export default function Report() {
  const issues = [...data.issues].sort((a, b) => (SEVERITY[a.severity] ?? 9) - (SEVERITY[b.severity] ?? 9))

  return (
    <Page title={data.title} meta={[data.scope, `采集日期 ${data.date}`]}>
      <Section title="结论" description="链路长度与入口、填写项的差异">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="口径为首次就诊路径的完整走查">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat span={3} size="lg" value={3} unit="个" captionBelow label="对比产品" note="2026 年 3 月版本" />
          <Stat span={3} size="lg" value={5} unit="步" captionBelow label="步骤最少(望山医院)" note="最多 7 步(澄心医院)" />
          <Stat span={3} size="lg" value={4} unit="个" captionBelow label="发现问题" note="高 1、中 1、低 2" />
          <Stat span={3} size="lg" value={18} unit="张" captionBelow label="分析截图" note="每款 5–7 张" />
        </Grid>
      </Section>

      <Section title="产品对比" description="步骤越少、手填项越少,链路越短">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "手填项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={data.products.map((p) => ({
            name: p.name,
            steps: p.steps,
            inputs: p.inputs,
            verdict: p.verdict,
          }))}
        />
      </Section>

      <Section title="阶段对比" description="同一步骤在三款产品里的做法">
        <DataTable
          columns={[
            { key: "stage", label: "阶段", span: 3 },
            { key: "aq", label: "安沁医院", span: 2 },
            { key: "ws", label: "望山医院", span: 2 },
            { key: "cx", label: "澄心医院", span: 2 },
          ]}
          rows={data.stages.map((s) => ({
            stage: s.stage,
            aq: s["安沁医院"],
            ws: s["望山医院"],
            cx: s["澄心医院"],
          }))}
        />
      </Section>

      <Section title="链路明细" description="每款一条链路,截图按操作顺序排列" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version} · ${chain.verdict}`}>
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                  <FigureLabel>
                    第 {step.no} 步 · {step.screen}
                  </FigureLabel>
                  <FigureText>
                    {`${step.content} · ${step.action}${step.inputs ? ` · 输入 ${step.inputs} 项` : ""}${step.note ? ` · ${step.note}` : ""}`}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题列表" description="按严重度排序,编号供下一步建议引用">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "problem", label: "问题与证据", span: 4 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={issues.map((issue) => ({
            id: issue.id,
            product: issue.product,
            step: issue.step,
            problem: `${issue.title} · ${issue.evidence}`,
            severity: issue.severity,
          }))}
          caption="编号 P1–P4 供下一步建议的「依据」引用"
        />
      </Section>

      <Section title="下一步" description="每条建议的依据对回问题编号">
        <List
          ordered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} · 依据 ${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、口径与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "采集日期", value: data.date },
            { label: "产品版本", value: "安沁医院 4.6.2、望山医院 3.1.0、澄心医院 6.5.3" },
            { label: "截图", value: "18 张,每款 5–7 张" },
            { label: "分析口径", value: "首次就诊,手机端完整走查" },
          ]}
        />
      </Section>
    </Page>
  )
}