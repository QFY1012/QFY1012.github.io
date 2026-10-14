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

const productRows = data.products.map((p) => ({
  product: p.name,
  steps: p.steps,
  inputs: p.inputs,
  verdict: p.verdict,
}))

const issueRows = data.issues.map((issue) => ({
  id: issue.id,
  product: issue.product,
  step: issue.step,
  title: issue.title,
  evidence: issue.evidence,
  severity: issue.severity,
}))

const stageRows = data.stages.map((s) => ({
  stage: s.stage,
  lingdong: s["聆动音箱"],
  yunque: s["云雀音箱"],
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["智能音箱 App"]}>
      <Section title="结论" description="两款 App 配网流程的判断与差别。">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次挖掘的规模与结果口径。">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={6}
            unit="步"
            label="步骤最少(云雀音箱)"
            captionBelow
            note="另一款 7 步"
          />
          <Stat
            span={3}
            captionBelow
            value={3}
            unit="个"
            label="发现问题"
            note="高 2 · 中 1"
          />
          <Stat
            span={3}
            captionBelow
            value={13}
            unit="张"
            label="分析截图"
            note="聆动 7 屏 · 云雀 6 屏"
          />
          <Stat
            span={3}
            captionBelow
            value={2}
            unit="个"
            label="对比产品"
            note="聆动音箱 · 云雀音箱"
          />
        </Grid>
      </Section>

      <Section
        title="对比"
        description="两款 App 的步骤数、输入项与各阶段做法。"
        className="gap-12"
      >
        <Group title="步骤与输入">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
              { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
              { key: "verdict", label: "结论", span: 3 },
            ]}
            rows={productRows}
          />
        </Group>
        <Group title="各阶段做法">
          <DataTable
            columns={[
              { key: "stage", label: "阶段", span: 3 },
              { key: "lingdong", label: "聆动音箱", span: 3 },
              { key: "yunque", label: "云雀音箱", span: 3 },
            ]}
            rows={stageRows}
          />
        </Group>
      </Section>

      <Section
        title="链路明细"
        description="逐屏链路,含每一步的界面、操作、输入项与备注。"
      >
        <Group>
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
                    {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="问题明细" description="问题按严重度排序,编号用于回指。">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
          caption="证据取自对应步骤的截图与备注;下一步建议按编号 P1–P3 回指这些条目。"
        />
      </Section>

      <Section title="下一步" description="针对上述问题的改法,以及各自的依据。">
        <List
          numbered
          items={data.suggestions.map((item) => ({
            title: item.title,
            description: `${item.detail} 依据:${item.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围、日期与版本。">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "产品版本",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join("、"),
            },
          ]}
        />
      </Section>
    </Page>
  )
}