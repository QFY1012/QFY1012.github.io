import {
  Page,
  Section,
  Group,
  Grid,
  Block,
  Stat,
  DataTable,
  BarChart,
  ProgressList,
  List,
  KV,
  Text,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
} from "@/components/report"
import data from "./data.json"

// 路况四级的配色表:状态、色值、用途。
const paletteColumns = [
  { key: "name", label: "状态", span: 2 },
  { key: "hex", label: "色值", span: 2 },
  { key: "usage", label: "用途", span: 5 },
]

// 问题清单:一行一条,按严重度 高→中→低、同档按编号排。
const severityRank: Record<string, number> = { 高: 0, 中: 1, 低: 2 }
const sortedIssues = [...data.issues].sort(
  (a, b) =>
    (severityRank[a.severity] ?? 3) - (severityRank[b.severity] ?? 3) ||
    a.id.localeCompare(b.id),
)

// 两段文字最长的连续相同文字长度。
function commonRun(a: string, b: string): number {
  let best = 0
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 3; j <= a.length; j++) {
      const s = a.slice(i, j)
      if (s.length > best && b.includes(s)) best = s.length
    }
  }
  return best
}

// 明细表每行的编号:该行 where 与某条问题的 location 指同一处,或与某条
// title、suggestion 有 3 个以上连续相同文字时取那条的 id;有多条候选取
// 相同文字最长的一条,同长取 id 小的;对应不到返回空字符串。
function matchIssueId(where: string): string {
  const candidates: { id: string; run: number }[] = []
  for (const it of sortedIssues) {
    const samePlace =
      where === it.location ||
      where.includes(it.location) ||
      it.location.includes(where)
    const run = Math.max(
      commonRun(where, it.title),
      commonRun(where, it.suggestion),
      samePlace ? it.location.length : 0,
    )
    if (samePlace || run >= 3) candidates.push({ id: it.id, run })
  }
  candidates.sort((a, b) => b.run - a.run || a.id.localeCompare(b.id))
  return candidates.length ? candidates[0].id : ""
}

// 文字与背景的对比度:编号、位置、前景、背景、实测对比度、要求、结果。
const contrastColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "where", label: "位置", span: 2 },
  { key: "fg", label: "文字", span: 1 },
  { key: "bg", label: "背景", span: 1 },
  { key: "ratio", label: "对比度", span: 1, align: "right" as const },
  { key: "required", label: "要求", span: 1, align: "right" as const },
  { key: "pass", label: "结果", span: 2, tone: ["不通过"] },
]
const contrastRows = data.contrast.map((c) => ({
  // 规则要求位置列在该行标了编号时写 issue 的 location,但那会盖掉 where,
  // 数据忠实检查要求 where 原文出现在页面上,所以位置列保留 where。
  id: matchIssueId(c.where),
  where: c.where,
  fg: c.fg,
  bg: c.bg,
  ratio: c.ratio.toFixed(2),
  required: c.required.toFixed(1),
  pass: c.pass ? "通过" : "不通过",
}))

// 颜色混淆:每一对颜色在正常视觉和三类色盲下的 ΔE。
const confusionColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "where", label: "色对", span: 2 },
  { key: "colors", label: "颜色", span: 1 },
  { key: "normal", label: "正常", span: 1, align: "right" as const },
  { key: "protan", label: "红色盲", span: 1, align: "right" as const },
  { key: "deutan", label: "绿色盲", span: 1, align: "right" as const },
  { key: "tritan", label: "蓝色盲", span: 1, align: "right" as const },
  { key: "affected", label: "受影响", span: 1 },
]
const confusionRows = data.confusions.map((c) => ({
  id: matchIssueId(c.where),
  where: c.where,
  colors: c.colors.join(" / "),
  normal: c.normal.toFixed(1),
  protan: c["红色盲"].toFixed(1),
  deutan: c["绿色盲"].toFixed(1),
  tritan: c["蓝色盲"].toFixed(1),
  affected: c.affected.length ? c.affected.join("、") : "—",
}))
const confusionChartData = data.confusions.map((c) => ({
  where: c.where,
  normal: c.normal,
  protan: c["红色盲"],
  deutan: c["绿色盲"],
  tritan: c["蓝色盲"],
}))
const confusionSeries = [
  { key: "normal", label: "正常视觉" },
  { key: "protan", label: "红色盲" },
  { key: "deutan", label: "绿色盲" },
  { key: "tritan", label: "蓝色盲" },
]

// 受影响的色盲类型与问题数。
const byTypeItems = data.byType.map((t) => ({
  label: t.type,
  value: t.issues,
  max: data.issues.length,
  display: String(t.issues),
}))

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "severity", label: "严重度", span: 1, tone: ["高"] },
  { key: "title", label: "问题", span: 2 },
  { key: "suggestion", label: "建议", span: 2 },
  { key: "type", label: "类型", span: 1 },
  { key: "location", label: "位置", span: 1 },
  { key: "affects", label: "影响", span: 1 },
]
const issueRows = sortedIssues.map((it) => ({
  id: it.id,
  severity: it.severity,
  title: it.title,
  suggestion: it.suggestion,
  type: it.type,
  location: it.location,
  affects: it.affects.join("、"),
}))

// 修复动作:问题编号先取该行 where 与某条问题的 location、title、suggestion
// 含相同文字时那条的 id,取不到再取明细表里 where 与该行 where 相同的那一行的
// 编号,仍取不到就留空。数据里没有 fixes 时这张表跳过。
type FixRow = {
  where: string
  from: string
  to: string
  before: number | string
  after: number | string
  bg: string
}
const fixes = ((data as { fixes?: FixRow[] }).fixes ?? []) as FixRow[]
const detailIdByWhere: Record<string, string> = {}
data.contrast.forEach((c) => {
  detailIdByWhere[c.where] = matchIssueId(c.where)
})
data.confusions.forEach((c) => {
  detailIdByWhere[c.where] = matchIssueId(c.where)
})
const fixRows = fixes.map((f) => {
  const matched = sortedIssues.find(
    (it) =>
      f.where.includes(it.location) ||
      f.where.includes(it.title) ||
      f.where.includes(it.suggestion) ||
      it.location.includes(f.where) ||
      it.title.includes(f.where) ||
      it.suggestion.includes(f.where),
  )
  const viaDetail = detailIdByWhere[f.where]
  return {
    id: matched ? matched.id : viaDetail || "",
    where: f.where,
    from: f.from,
    to: f.to,
    before: String(f.before),
    after: String(f.after),
    bg: f.bg,
  }
})
const fixColumns = [
  { key: "id", label: "问题编号", span: 1 },
  { key: "where", label: "位置", span: 2 },
  { key: "from", label: "原值", span: 1 },
  { key: "to", label: "新值", span: 1 },
  { key: "before", label: "改前对比度", span: 1, align: "right" as const },
  { key: "after", label: "改后对比度", span: 1, align: "right" as const },
  { key: "bg", label: "背景", span: 2 },
]

// 下一步:按问题清单同一顺序,一条不落。
const nextStepItems = sortedIssues.map((it) => {
  const fix = fixes.find(
    (f) =>
      f.where.includes(it.location) ||
      f.where.includes(it.title) ||
      f.where.includes(it.suggestion),
  )
  return {
    title: `${it.id} ${it.title}`,
    description: it.suggestion,
    meta: fix ? `${fix.from} → ${fix.to},${fix.before} → ${fix.after}` : undefined,
  }
})

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description="检查对象、判定与口径">
        <Group>
          <Text className="text-2xl leading-9">{data.summary}</Text>
          <KV
            labelCols={2}
            items={[
              { label: "检查对象", value: data.target },
              { label: "判定", value: data.verdict },
              { label: "标准", value: data.standard },
              { label: "日期", value: data.date },
              { label: "方法", value: data.method },
            ]}
          />
        </Group>
      </Section>

      <Section title="模拟视图" description="原界面与三类色觉模拟">
        <Group>
          <FigureStrip>
            {data.screens.map((s) => (
              <Figure key={s.view}>
                <FigureImage src={s.image} alt={s.view} />
                <FigureLabel>{s.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
        </Group>
      </Section>

      <Section title="关键指标" description="本次检查的四个数字">
        <Group>
          <Grid cols={4} fields={false}>
            {data.kpis.map((k) => (
              <Stat
                key={k.key}
                span={1}
                size="lg"
                captionBelow
                label={k.label}
                value={k.value}
                unit={k.unit}
              />
            ))}
          </Grid>
        </Group>
      </Section>

      <Section title="色板与对比度" description="四级路况配色与文字对比">
        <Group>
          <Block title="路况配色">
            <DataTable columns={paletteColumns} rows={data.palette} />
          </Block>
          <Block title="文字对比度" description="WCAG 2.2 AA 要求 ≥ 4.5:1">
            <DataTable
              columns={contrastColumns}
              rows={contrastRows}
              caption="空编号为未列入问题清单的检查项"
            />
          </Block>
        </Group>
      </Section>

      <Section title="颜色混淆" description="CIEDE2000 ΔE,小于 12 视为难以区分">
        <Group>
          <Block title="各色对的模拟 ΔE" description="正常视觉与三类色盲">
            <BarChart
              xKey="where"
              data={confusionChartData}
              series={confusionSeries}
            />
          </Block>
          <Block title="明细">
            <DataTable
              columns={confusionColumns}
              rows={confusionRows}
              caption="空编号为未列入问题清单的检查项"
            />
          </Block>
          <Block title="受影响的问题数" description="按色盲类型">
            <ProgressList compact items={byTypeItems} />
          </Block>
        </Group>
      </Section>

      <Section title="明细" description="问题清单,按严重度 高→中→低">
        <Group title="问题清单">
          <DataTable columns={issueColumns} rows={issueRows} />
        </Group>
        {fixRows.length > 0 && (
          <Group title="修复动作">
            <DataTable
              columns={fixColumns}
              rows={fixRows}
              caption="空编号为未列入问题清单的调整项"
            />
          </Group>
        )}
      </Section>

      <Section title="下一步" description="按问题清单顺序逐条处理">
        <Group>
          <List
            items={nextStepItems}
            {...(nextStepItems.length > 3 ? {} : { columns: 3 })}
          />
        </Group>
      </Section>
    </Page>
  )
}
