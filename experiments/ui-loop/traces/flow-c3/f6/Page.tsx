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

  const chunk = (arr: any[], size: number) =>
    arr.reduce((rows: any[][], item: any, i: number) => {
      if (i % size === 0) rows.push([])
      rows[rows.length - 1].push(item)
      return rows
    }, [])

  const maxStep = Math.max(
    ...chains.map((c: any) => Math.max(...c.steps.map((s: any) => s.no)))
  )

  const stepGroups = Array.from({ length: maxStep }, (_, i) => i + 1).map((no) => ({
    no,
    items: chains
      .map((c: any) => ({ chain: c, step: c.steps.find((s: any) => s.no === no) }))
      .filter((x: any) => x.step),
  }))

  const chainOf = (product: string) => chains.find((c: any) => c.product === product)

  const screenOf = (product: string, stepNo: number) =>
    chainOf(product)?.steps.find((s: any) => s.no === stepNo)?.screen

  const issueWhere = (it: any) => {
    if (it.product === "全部") {
      const screens = chains
        .map((c: any) => c.steps.find((s: any) => s.no === it.step)?.screen)
        .filter(Boolean)
        .filter((s: string, i: number, arr: string[]) => arr.indexOf(s) === i)
      return `全部产品 · 第 ${it.step} 步${screens.length ? ` · ${screens.join("、")}` : ""}`
    }
    const screen = screenOf(it.product, it.step)
    return `${it.product} · 第 ${it.step} 步${screen ? ` · ${screen}` : ""}`
  }

  const basisText = (b: string) => {
    const hit = issues.find((i: any) => i.id === b)
    if (hit)
      return `${hit.id} · ${hit.product} 第 ${hit.step} 步 · ${screenOf(hit.product, hit.step)}`
    const m = b.match(/^(.+?)第\s*(\d+)\s*步$/)
    if (m) {
      const screen = screenOf(m[1], Number(m[2]))
      return screen ? `${b} · ${screen}` : b
    }
    return b
  }

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

      <Section
        title="链路明细"
        description={`每款 App 从首页到支付的步骤与截图;版本:${chains
          .map((c: any) => `${c.product} ${c.version}`)
          .join("、")}`}
        className="gap-12"
      >
        {stepGroups.map(({ no, items }) => (
          <Group key={no} title={`第 ${no} 步`}>
            {chunk(items, 3).map((row: any[], rowIndex: number) => (
              <FigureStrip key={rowIndex}>
                {row.map(({ chain, step }: any) => {
                  const hits = issues.filter(
                    (it: any) =>
                      (it.product === chain.product || it.product === "全部") &&
                      it.step === step.no
                  )
                  const suffix = hits.length
                    ? ` · ${hits.map((it: any) => `${it.id} ${it.severity}`).join("、")}`
                    : ""
                  return (
                    <Figure key={`${chain.product}-${step.no}`}>
                      <FigureImage
                        src={step.image}
                        alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                      />
                      <FigureLabel>{`${chain.product} · 第 ${step.no} 步 · ${step.screen}${suffix}`}</FigureLabel>
                      <FigureText>{stepText(step)}</FigureText>
                    </Figure>
                  )
                })}
              </FigureStrip>
            ))}
          </Group>
        ))}
      </Section>

      <Section title="问题清单" description="7 个问题及各自的定位">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "where", label: "位置", span: 3 },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重度", span: 2, tone: ["高"] },
          ]}
          rows={issues.map((i: any) => ({
            id: i.id,
            where: issueWhere(i),
            title: i.title,
            severity: i.severity,
          }))}
          caption={`依据:${issues.map((i: any) => `${i.id} ${i.evidence}`).join(";")}`}
        />
      </Section>

      <Section title="下一步" description="基于对比与问题提出的四条改进建议">
        <List
          numbered
          columns={3}
          items={suggestions.map((s: any) => ({
            title: s.title,
            description: `${s.detail ? `${s.detail} ` : ""}依据:${s.basis
              .map(basisText)
              .join(";")}`,
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
