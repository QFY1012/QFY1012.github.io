import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Block,
  Text,
  Stat,
  DataTable,
  ProgressList,
  List,
  KV,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

export default function Report() {
  return (
    <Page title={data.title} meta={["手机银行线上开户", "2026 年 9 月"]}>
      <Section title="背景信息" description="任务、范围与采集日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>

      <Section title="结论" description="三家银行都把开户拆成四段,差别在顺序和每段的屏数">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次比对的产品数、截图数与发现的问题数">
        <Grid cols={12} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              size="lg"
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="流程链路"
        description="按步骤顺序排列的完整开户链路,每格一屏"
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
                    {step.inputs > 0
                      ? `${step.content} · ${step.action} · 输入 ${step.inputs} 项`
                      : `${step.content} · ${step.action}`}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="步骤备注" description="链路里每一步的观察备注,空备注不列">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "screen", label: "屏", span: 2 },
            { key: "note", label: "备注", span: 4 },
          ]}
          rows={data.chains.flatMap((chain) =>
            chain.steps
              .filter((step) => step.note !== "")
              .map((step) => ({
                product: chain.product,
                step: step.no,
                screen: step.screen,
                note: step.note,
              })),
          )}
        />
      </Section>

      <Section title="产品对照" description="步骤数、输入项与整体结论,按产品对照">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "整体结论", span: 3 },
          ]}
          rows={data.products.map((product) => ({
            name: product.name,
            steps: product.steps,
            inputs: product.inputs,
            verdict: product.verdict,
          }))}
        />
      </Section>

      <Section title="阶段对比" description="四个环节在三款 App 里的做法差异">
        <DataTable
          columns={[
            { key: "stage", label: "环节", span: 3 },
            { key: "qinghe", label: "青禾银行", span: 2 },
            { key: "yuanchuan", label: "远川银行", span: 2 },
            { key: "beichen", label: "北辰银行", span: 2 },
          ]}
          rows={data.stages.map((stage) => ({
            stage: stage.stage,
            qinghe: stage["青禾银行"],
            yuanchuan: stage["远川银行"],
            beichen: stage["北辰银行"],
          }))}
        />
      </Section>

      <Section title="共性模式" description="跨产品重复出现的做法">
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: pattern.comment,
            meta: pattern.products.join("、"),
          }))}
        />
      </Section>

      <Section title="问题明细" description="5 个问题的位置、证据与严重程度">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "issue", label: "问题与证据", span: 3 },
            { key: "severity", label: "严重程度", span: 2, tone: ["高"] },
          ]}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            product: issue.product,
            step: issue.step,
            issue: `${issue.title} · ${issue.evidence}`,
            severity: issue.severity,
          }))}
        />
      </Section>

      <Section title="下一步" description="4 条改进建议及其依据">
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
    </Page>
  )
}
