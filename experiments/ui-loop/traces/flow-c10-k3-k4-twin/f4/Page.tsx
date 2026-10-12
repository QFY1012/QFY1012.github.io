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
  const { title, task, scope, date, summary, kpis, products, chains, stages, issues, suggestions } = data

  // 产品名 → 版本,用于表头、图注和分群说明。
  const versions: Record<string, string> = Object.fromEntries(chains.map((c) => [c.product, c.version]))
  const named = (name: string) => `${name} ${versions[name] ?? ""}`.trim()

  const stageRows = stages.map((s) => ({ stage: s.stage, a: s["协作宝"], b: s["链工"] }))

  const stepRows = chains.flatMap((chain) =>
    chain.steps.map((step) => ({
      product: chain.product,
      step: `第 ${step.no} 步`,
      screen: step.screen,
      inputs: step.inputs,
      note: step.note,
    })),
  )

  const issueRows = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    where: `${issue.product} 第 ${issue.step} 步`,
    severity: issue.severity,
    evidence: issue.evidence,
  }))

  return (
    <Page title={title} meta={["协作宝 · 链工", "2026 年第三季度版本"]}>
      <Section title="背景信息" description="本次走查的任务、范围与日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "范围", value: scope },
            { label: "日期", value: date },
          ]}
        />
      </Section>

      <Section title="结论" description="两款产品从入口到预订成功的路径">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模">
        <Grid cols={12} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat key={kpi.key} span={3} size="lg" value={kpi.value} unit={kpi.unit} label={kpi.label} captionBelow />
          ))}
        </Grid>
      </Section>

      <Section title="流程对比" description="两款产品的步骤数与分阶段做法" className="gap-12">
        <Group title="预订步骤">
          <Grid cols={9} fields={false} className="items-baseline">
            {products.map((product) => (
              <Stat
                key={product.name}
                span={2}
                value={product.steps}
                unit="步"
                label={named(product.name)}
                captionBelow
                note={`输入 ${product.inputs} 项 · ${product.verdict}`}
              />
            ))}
          </Grid>
        </Group>
        <Group title="分阶段对比">
          <DataTable
            columns={[
              { key: "stage", label: "阶段", span: 3 },
              { key: "a", label: named("协作宝"), span: 3 },
              { key: "b", label: named("链工"), span: 3 },
            ]}
            rows={stageRows}
          />
        </Group>
      </Section>

      <Section title="链路明细" description="每步一屏,按操作顺序排列" className="gap-12">
        {chains.map((chain) => (
          <Group key={chain.product} title={named(chain.product)}>
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步 · ${step.screen}`}
                  />
                  <FigureLabel>{`第 ${step.no} 步 · ${step.screen}`}</FigureLabel>
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

      <Section title="步骤明细" description="每步的屏名、输入项与走查备注">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "screen", label: "屏名", span: 2 },
            { key: "inputs", label: "输入项", span: 2, bar: true },
            { key: "note", label: "备注", span: 3 },
          ]}
          rows={stepRows}
        />
      </Section>

      <Section title="发现问题" description="4 个问题,按严重度排列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "where", label: "位置", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="三条改动建议">
        <List
          columns={3}
          numbered
          items={suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} · 依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>
    </Page>
  )
}
