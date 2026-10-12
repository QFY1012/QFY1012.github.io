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

const stageColumns = [
  { key: "stage", label: "阶段", span: 3 },
  { key: "qinghe", label: "青禾银行", span: 2 },
  { key: "yuanchuan", label: "远川银行", span: 2 },
  { key: "beichen", label: "北辰银行", span: 2 },
]

const stageRows = data.stages.map((s) => ({
  stage: s.stage,
  qinghe: s["青禾银行"],
  yuanchuan: s["远川银行"],
  beichen: s["北辰银行"],
}))

const noteColumns = [
  { key: "product", label: "产品", span: 2 },
  { key: "step", label: "步骤", span: 3 },
  { key: "note", label: "备注", span: 4 },
]

const noteRows = data.chains.flatMap((chain) =>
  chain.steps
    .filter((step) => step.note)
    .map((step) => ({
      product: chain.product,
      step: `第 ${step.no} 步 · ${step.screen}`,
      note: step.note,
    })),
)

export default function Report() {
  return (
    <Page title={data.title} meta={[data.task, data.scope]}>
      <Section title="背景信息" description="本次走查的任务、范围与日期。">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>

      <Section title="结论" description="三家 App 开户流程的整体判断。">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section
        title="核心指标"
        description="本次对比的口径:产品数、截图数、最少步骤数与问题数。"
      >
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
        title="产品对比"
        description="步骤数为从首页到开户成功的屏数,输入项为需手动填写的字段数。"
      >
        <Grid cols={9} fields={false} className="items-baseline">
          {data.products.map((product) => (
            <Stat
              key={product.name}
              span={3}
              value={product.steps}
              unit="步"
              label={product.name}
              captionBelow
              note={`输入 ${product.inputs} 项 · ${product.verdict}`}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="阶段对比"
        description="同一阶段三家 App 的做法;「无」表示该阶段缺失。"
      >
        <DataTable
          columns={stageColumns}
          rows={stageRows}
          caption="按开户的先后阶段横向对比,顺序不代表各家的实际步骤顺序。"
        />
      </Section>

      <Section
        className="gap-12"
        title="链路明细"
        description="每款 App 从首页到开户成功的完整步骤,共 26 张截图。"
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
      </Section>

      <Section
        title="步骤备注"
        description="截图中观察到的细节,是后面问题的来源。"
      >
        <DataTable
          columns={noteColumns}
          rows={noteRows}
          caption="只列出有备注的步骤,空白步骤不列。"
        />
      </Section>

      <Section title="共性模式" description="三家反复出现的做法及其影响。">
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: `${pattern.comment} · 见于 ${pattern.products.join("、")}`,
          }))}
        />
      </Section>

      <Section
        title="风险"
        description="影响开户完成度的问题,按严重度标注。"
      >
        <List
          columns={3}
          metaTone="destructive"
          items={data.issues.map((issue) => ({
            title: issue.title,
            description: `${issue.product} · 第 ${issue.step} 步 · ${issue.evidence}`,
            meta: issue.severity,
          }))}
        />
      </Section>

      <Section title="下一步" description="改进建议及其依据。">
        <List
          columns={3}
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} · 依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>
    </Page>
  )
}
