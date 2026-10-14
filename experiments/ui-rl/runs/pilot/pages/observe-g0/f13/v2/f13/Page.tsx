import data from "./data.json"
import {
  Page,
  Section,
  Grid,
  Group,
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

const stageRows = data.stages.map((stage) => {
  const row: Record<string, string> = { stage: stage.stage }
  for (const product of data.products) {
    row[product.name] = (stage as unknown as Record<string, string>)[product.name]
  }
  return row
})

const stageColumns = [
  { key: "stage", label: "阶段", span: 3 },
  ...data.products.map((product) => ({ key: product.name, label: product.name, span: 2 })),
]

const kpi = (key: string) => data.kpis.find((item) => item.key === key)!

export default function Report() {
  return (
    <Page title={data.title} meta={["3 款共享单车 App", "2026 年 3 月版本"]}>
      <Section title="结论" description={data.task}>
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比产品、分析截图、最少步数与问题数">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
            captionBelow
            size="lg"
          />
          <Stat
            span={3}
            value={kpi("products").value}
            unit={kpi("products").unit}
            label={kpi("products").label}
            captionBelow
          />
          <Stat
            span={3}
            value={kpi("screens").value}
            unit={kpi("screens").unit}
            label={kpi("screens").label}
            captionBelow
          />
          <Stat
            span={3}
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
            captionBelow
          />
        </Grid>
      </Section>

      <Section title="分群对比" description="3 款 App 首次骑行的总步数与链路内输入项数">
        <Grid cols={9} fields={false}>
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

      <Section title="阶段对比" description="登录、注册、实名与押金在各产品链路中的先后与形式">
        <DataTable
          columns={stageColumns}
          rows={stageRows}
          caption="口径:2026 年 3 月版本,按首次骑行从打开 App 到开锁成功的实际链路记录。"
        />
      </Section>

      <Section
        title="链路明细"
        description="按步骤顺序排列的 13 张截图,每一步的界面、操作与输入项"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version} · ${chain.verdict}`} />
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                  />
                  <FigureLabel>{`第 ${step.no} 步 · ${step.screen}`}</FigureLabel>
                  <FigureText>{`${step.content} · ${step.action} · 输入 ${step.inputs} 项`}</FigureText>
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题" description="2 个问题按严重度排列,附所在产品、步骤与证据">
        <List
          columns={3}
          metaTone="destructive"
          items={data.issues.map((issue) => ({
            title: `${issue.id} · ${issue.title}`,
            description: `${issue.product} 第 ${issue.step} 步 · ${issue.evidence}`,
            meta: issue.severity,
          }))}
        />
      </Section>

      <Section title="下一步" description="针对 2 个问题的改进建议与依据">
        <List
          columns={3}
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} 依据:${suggestion.basis.join(" · ")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围、版本与样本量">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "对比产品",
              value: data.products
                .map((product) => `${product.name} ${product.steps} 步`)
                .join(" · "),
            },
            {
              label: "样本量",
              value: `${kpi("products").value} 款 App · ${kpi("screens").value} 张截图 · 共 ${
                data.chains.reduce((total, chain) => total + chain.steps.length, 0)
              } 步`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}