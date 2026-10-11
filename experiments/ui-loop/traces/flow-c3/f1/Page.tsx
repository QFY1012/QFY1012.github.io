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

// 阶段对比:阶段 + 三家银行的做法,列宽合计 9
const stageColumns = [
  { key: "stage", label: "阶段", span: 3 },
  { key: "青禾银行", label: "青禾银行", span: 2 },
  { key: "远川银行", label: "远川银行", span: 2 },
  { key: "北辰银行", label: "北辰银行", span: 2 },
]

// 问题清单:编号 / 位置 / 问题 / 严重度,列宽合计 9
const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "where", label: "位置", span: 3 },
  { key: "title", label: "问题", span: 3 },
  { key: "severity", label: "严重度", span: 2, tone: ["高"] },
]

// 某产品第 N 步的屏名,用来把问题和建议定位到具体截图
function screenOf(product: string, no: number) {
  const chain = data.chains.find((c) => c.product === product)
  return chain?.steps.find((s) => s.no === no)?.screen ?? ""
}

// 位置:产品 · 第 N 步 · 屏名;产品为「全部」时接各产品该步的屏名,相同的只写一次
function whereOf(issue: (typeof data.issues)[number]) {
  if (issue.product === "全部") {
    const screens: string[] = []
    for (const chain of data.chains) {
      const screen = chain.steps.find((s) => s.no === issue.step)?.screen
      if (screen && !screens.includes(screen)) screens.push(screen)
    }
    return [`全部产品 · 第 ${issue.step} 步`, ...screens].join(" · ")
  }
  return `${issue.product} · 第 ${issue.step} 步 · ${screenOf(issue.product, issue.step)}`
}

const issueRows = data.issues.map((it) => ({
  id: it.id,
  where: whereOf(it),
  title: it.title,
  severity: it.severity,
}))

// 建议依据:问题编号写成「编号 · 产品 第 N 步 · 屏名」,步骤引用在其后补屏名,多项用「;」隔开
function basisLabel(item: string) {
  const issue = data.issues.find((it) => it.id === item)
  if (issue) {
    const product = issue.product === "全部" ? "全部产品" : issue.product
    const screen = issue.product === "全部" ? "" : ` · ${screenOf(issue.product, issue.step)}`
    return `${issue.id} · ${product} 第 ${issue.step} 步${screen}`
  }
  const ref = item.match(/^(.+?)第\s*(\d+)\s*步$/)
  if (ref) {
    const [, product, no] = ref
    const screen = screenOf(product, Number(no))
    return `${product}第 ${Number(no)} 步${screen ? ` · ${screen}` : ""}`
  }
  return item
}

// 链路明细:各产品按步号横向对齐,一个 FigureStrip 最多放 3 个产品
const PRODUCTS_PER_ROW = 3

function chunkProducts<T>(items: T[], size: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size))
  }
  return rows
}

// 全部产品里最大的步号,决定要排到第几步
const maxStep = Math.max(...data.chains.flatMap((c) => c.steps.map((s) => s.no)))

// 命中该步的问题「编号 严重度」:问题的产品等于该产品,或为「全部」,且步骤号相同
function issueTagsFor(product: string, no: number) {
  return data.issues
    .filter((it) => (it.product === product || it.product === "全部") && it.step === no)
    .map((it) => `${it.id} ${it.severity}`)
}

export default function Report() {
  return (
    <Page title={data.title} meta={[data.task, data.scope, data.date]}>
      <Section title="结论" description="三家银行 App 的开户流程对比">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比范围与总体规模">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              size={k.key === "fewest" ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="三家银行的步骤数与输入项">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.products.map((p) => (
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

      <Section title="阶段对比" description="五个阶段,三家银行的做法">
        <DataTable columns={stageColumns} rows={data.stages} />
      </Section>

      <Section title="共性规律" description="三家银行重复出现的做法">
        <List
          numbered
          items={data.patterns.map((p) => ({
            title: `${p.name}(${p.products.join("、")})`,
            description: p.comment,
          }))}
        />
      </Section>

      <Section title="链路明细" description="三家银行的开户步骤按步号横向对齐,每一步一组" className="gap-12">
        <Text>
          {`版本:${data.chains.map((c) => `${c.product} ${c.version}`).join(" · ")}`}
        </Text>
        {Array.from({ length: maxStep }, (_, i) => i + 1).map((no) => {
          const entries = data.chains
            .map((chain) => ({ chain, step: chain.steps.find((s) => s.no === no) }))
            .filter((entry) => entry.step)
          return (
            <Group key={no} title={`第 ${no} 步`}>
              {chunkProducts(entries, PRODUCTS_PER_ROW).map((row, rowIndex) => (
                <FigureStrip key={rowIndex}>
                  {row.map(({ chain, step }) => {
                    const issueTags = issueTagsFor(chain.product, no)
                    return (
                      <Figure key={chain.product}>
                        <FigureImage src={step!.image} alt={`${chain.product} 第 ${no} 步:${step!.screen}`} />
                        <FigureLabel>
                          {chain.product} · 第 {no} 步 · {step!.screen}
                          {issueTags.length > 0 ? ` · ${issueTags.join("、")}` : ""}
                        </FigureLabel>
                        <FigureText>
                          {step!.content} · {step!.action} · 输入 {step!.inputs} 项
                        </FigureText>
                        {step!.note ? <FigureText>{step!.note}</FigureText> : null}
                      </Figure>
                    )
                  })}
                </FigureStrip>
              ))}
            </Group>
          )
        })}
      </Section>

      <Section title="问题清单" description="五个问题,按记录顺序列出">
        <DataTable
          columns={issueColumns}
          rows={issueRows}
          caption={`证据:${data.issues.map((it) => `${it.id} ${it.evidence}`).join(";")}`}
        />
      </Section>

      <Section title="下一步" description="四条建议及其依据">
        <List
          ordered
          divided={false}
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.id} · ${s.detail} · 依据:${s.basis.map(basisLabel).join(";")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
