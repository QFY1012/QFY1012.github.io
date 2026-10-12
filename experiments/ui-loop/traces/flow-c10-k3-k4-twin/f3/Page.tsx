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
  const issues = data.issues.map((issue) => ({
    id: issue.id,
    product: issue.product,
    step: `第 ${issue.step} 步`,
    title: issue.title,
    evidence: issue.evidence,
    severity: issue.severity,
  }))

  return (
    <Page title={data.title} meta={["企业网盘", "2026 年 9 月"]}>
      <Section title="背景信息">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>

      <Section title="结论">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次外链分享流程挖掘的范围与结果">
        <Grid cols={12} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              size="lg"
              captionBelow
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="完成一次外链分享所需的步骤数">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.products.map((product) => (
            <Stat
              key={product.name}
              span={2}
              captionBelow
              value={product.steps}
              unit="步"
              label={product.name}
              note={product.verdict}
            />
          ))}
        </Grid>
      </Section>

      <Section title="链路明细" description="按步骤顺序排列,共 12 张截图" className="gap-12">
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
            {chain.steps.some((step) => step.note) ? (
              <List
                divided={false}
                items={chain.steps
                  .filter((step) => step.note)
                  .map((step) => ({
                    title: `第 ${step.no} 步 · ${step.screen}`,
                    description: step.note,
                  }))}
              />
            ) : null}
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="3 个问题,按严重度排列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
          ]}
          rows={issues}
          caption="严重度:高 = 造成权限误设,中 = 入口难找,低 = 缺少反馈"
        />
      </Section>

      <Section title="下一步" description="两条改进建议及依据">
        <List
          numbered
          columns={3}
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} · 依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>
    </Page>
  )
}
