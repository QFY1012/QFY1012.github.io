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
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

export default function Report() {
  const { kpis, products, chains, stages, patterns, issues, suggestions } = data as any

  const stepText = (step: any) =>
    [step.content, step.action, step.inputs > 0 ? `输入 ${step.inputs} 项` : null]
      .filter(Boolean)
      .join(" · ")

  return (
    <Page
      title={data.title}
      meta={[data.scope, data.date, data.task]}
    >
      <Section title="结论" description="四款 App 预订一张单程机票的流程对比" className="gap-12">
        <Group>
          <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
        </Group>

        <Group title="核心指标">
          <Grid cols={12} fields={false} className="items-baseline">
            {kpis.map((k: any) => (
              <Stat
                key={k.key}
                span={12 / kpis.length}
                value={k.value}
                unit={k.unit}
                label={k.label}
                captionBelow
                size={k.key === "fewest" ? "lg" : undefined}
                note={k.key === "fewest" ? "最多 9 步(云途)" : undefined}
              />
            ))}
          </Grid>
        </Group>
      </Section>

      <Section title="流程对比" description="每款 App 从首页到支付的总步数与输入项">
        <Grid cols={9} fields={false} className="items-baseline">
          {products.map((p: any) => (
            <Stat
              key={p.name}
              span={2}
              value={p.steps}
              unit="步"
              label={p.name}
              captionBelow
              note={`输入 ${p.inputs} 项 · ${p.verdict}`}
            />
          ))}
        </Grid>
      </Section>

      <Section title="关键环节" description="五个环节在各 App 的做法差异">
        <DataTable
          columns={[
            { key: "stage", label: "环节", span: 1 },
            { key: "yuntu", label: "云途", span: 2 },
            { key: "xinglv", label: "行旅", span: 2 },
            { key: "feiyu", label: "飞鱼", span: 2 },
            { key: "beijixing", label: "北极星", span: 2 },
          ]}
          rows={stages.map((s: any) => ({
            stage: s.stage,
            yuntu: s["云途"],
            xinglv: s["行旅"],
            feiyu: s["飞鱼"],
            beijixing: s["北极星"],
          }))}
        />
      </Section>

      <Section title="共性模式" description="四款 App 中反复出现的做法">
        <List
          numbered
          items={patterns.map((p: any) => ({
            title: p.name,
            description: `${p.comment} · 涉及 ${p.products.join("、")}`,
          }))}
        />
      </Section>

      <Section title="交互链路" description="每款 App 从首页到支付的步骤与截图" className="gap-12">
        {chains.map((chain: any) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
            <FigureStrip>
              {chain.steps.map((step: any) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                  />
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>{stepText(step)}</FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
        <Group title="步骤备注">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 1 },
              { key: "step", label: "步骤", span: 2 },
              { key: "note", label: "备注", span: 6 },
            ]}
            rows={chains.flatMap((chain: any) =>
              chain.steps
                .filter((step: any) => step.note)
                .map((step: any) => ({
                  product: chain.product,
                  step: `第 ${step.no} 步 · ${step.screen}`,
                  note: step.note,
                }))
            )}
          />
        </Group>
      </Section>

      <Section title="问题明细" description="按严重度排列的 7 个问题">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "evidence", label: "依据", span: 2 },
          ]}
          rows={issues.map((i: any) => ({
            id: i.id,
            product: i.product,
            step: `第 ${i.step} 步`,
            title: i.title,
            severity: i.severity,
            evidence: i.evidence,
          }))}
        />
      </Section>

      <Section title="下一步" description="基于对比与问题提出的四条改进建议">
        <List
          numbered
          columns={3}
          items={suggestions.map((s: any) => ({
            title: s.title,
            description: `${s.id} · 依据 ${s.basis.join("、")}`,
          }))}
        />
      </Section>
    </Page>
  )
}
