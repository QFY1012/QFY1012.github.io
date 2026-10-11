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
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

export default function Report() {
  const { kpis, products, chains, stages, patterns, issues, suggestions } = data as any

  const stepText = (step: any) =>
    [step.content, step.action, `输入 ${step.inputs} 项`, step.note].filter(Boolean).join(" · ")

  const issueAt = (product: string, no: number) =>
    issues.find((i: any) => i.product === product && i.step === no)

  const screenAt = (product: string, no: number) => {
    const chain = chains.find((c: any) => c.product === product)
    const step = chain && chain.steps.find((s: any) => s.no === no)
    return step ? step.screen : null
  }

  const severityRank: Record<string, number> = { 高: 0, 中: 1, 低: 2 }
  const productOrder = chains.map((c: any) => c.product)
  const productRank = (product: string) => {
    const idx = productOrder.indexOf(product)
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
  }
  const bySeverityThenStep = (a: any, b: any) => {
    const sa = severityRank[a.severity] ?? Number.MAX_SAFE_INTEGER
    const sb = severityRank[b.severity] ?? Number.MAX_SAFE_INTEGER
    return sa !== sb ? sa - sb : a.step - b.step
  }
  const sortedIssues = [...issues].sort((a: any, b: any) => {
    const sa = severityRank[a.severity] ?? Number.MAX_SAFE_INTEGER
    const sb = severityRank[b.severity] ?? Number.MAX_SAFE_INTEGER
    if (sa !== sb) return sa - sb
    const ra = productRank(a.product)
    const rb = productRank(b.product)
    return ra !== rb ? ra - rb : a.step - b.step
  })

  return (
    <Page
      title={data.title}
      meta={["4 款出行 App", "2026 年 9 月版本"]}
    >
      <Section title="结论" description="四款 App 预订一张单程机票的流程对比">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比范围与主要发现">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((k: any) => (
            <Stat
              key={k.key}
              span={3}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              size={k.key === "fewest" ? "lg" : undefined}
              note={k.key === "fewest" ? "最多 9 步(云途)" : undefined}
            />
          ))}
        </Grid>
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
        {chains.map((chain: any) => {
          const chainIssues = issues
            .filter((i: any) => i.product === chain.product)
            .sort(bySeverityThenStep)
          return (
          <Group key={chain.product} title={`${chain.product} · ${chain.version} · ${chain.verdict}`}>
            {chainIssues.length > 0 && (
              <Text>
                {chainIssues
                  .map((i: any) => `${i.id} 第 ${i.step} 步 · ${screenAt(chain.product, i.step)}`)
                  .join("、")}
              </Text>
            )}
            <FigureStrip>
              {chain.steps.map((step: any) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                  />
                  <FigureLabel>
                    {`第 ${step.no} 步 · ${step.screen}`}
                    {issueAt(chain.product, step.no) ? ` · ${issueAt(chain.product, step.no).id}` : ""}
                  </FigureLabel>
                  <FigureText>{stepText(step)}</FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
          )
        })}
      </Section>

      <Section title="问题明细" description="按严重度排列的 7 个问题">
        <DataTable
          columns={[
            { key: "location", label: "位置", span: 3 },
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "evidence", label: "依据", span: 2 },
          ]}
          rows={sortedIssues.map((i: any) => {
            const screen = screenAt(i.product, i.step)
            return {
              location: screen
                ? `${i.id} · ${i.product} 第 ${i.step} 步 · ${screen}`
                : `${i.id} · ${i.product} 第 ${i.step} 步`,
              id: i.id,
              title: i.title,
              severity: i.severity,
              evidence: i.evidence,
            }
          })}
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

      <Section title="背景信息" description="任务、范围与口径">
        <KV
          labelCols={2}
          items={[
            { label: "分析任务", value: data.task },
            { label: "对比范围", value: data.scope },
            { label: "对比产品", value: products.map((p: any) => p.name).join("、") },
            { label: "分析日期", value: data.date },
            { label: "分析截图", value: "27 张" },
          ]}
        />
      </Section>
    </Page>
  )
}
