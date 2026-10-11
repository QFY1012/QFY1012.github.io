import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Block,
  Text,
  Stat,
  DataTable,
  ProgressList,
  List,
  KV,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
} from "@/components/report"

const severityOrder: Record<string, number> = { 高: 0, 中: 1, 低: 2 }

const sortedIssues = [...data.issues].sort((a, b) => {
  const diff = severityOrder[a.severity] - severityOrder[b.severity]
  return diff !== 0 ? diff : a.id.localeCompare(b.id)
})

// 最长连续相同文字的长度(忽略空白)
const norm = (s: string) => s.replace(/\s+/g, "")

const commonLength = (a: string, b: string) => {
  const x = norm(a)
  const y = norm(b)
  let best = 0
  for (let i = 0; i < x.length; i++) {
    for (let j = i + best + 1; j <= x.length; j++) {
      if (y.includes(x.slice(i, j))) best = j - i
      else break
    }
  }
  return best
}

const issueScore = (issue: (typeof sortedIssues)[number], where: string) =>
  Math.max(
    commonLength(issue.location, where),
    commonLength(issue.title, where),
    commonLength(issue.suggestion, where)
  )

// 明细表:找出该行 where 对应的问题编号
const matchDetailId = (where: string) => {
  const candidates = sortedIssues.filter((issue) => {
    const sameSpot =
      norm(issue.location) === norm(where) ||
      norm(issue.location).includes(norm(where)) ||
      norm(where).includes(norm(issue.location))
    return (
      sameSpot ||
      commonLength(issue.title, where) >= 3 ||
      commonLength(issue.suggestion, where) >= 3
    )
  })
  let bestId = ""
  let bestScore = -1
  for (const issue of candidates) {
    const score = issueScore(issue, where)
    if (score > bestScore || (score === bestScore && issue.id < bestId)) {
      bestId = issue.id
      bestScore = score
    }
  }
  return bestId
}

const issueById = (id: string) => sortedIssues.find((issue) => issue.id === id)

const detailIdByWhere = new Map<string, string>()
for (const row of data.contrast) detailIdByWhere.set(row.where, matchDetailId(row.where))
for (const row of data.confusions) detailIdByWhere.set(row.where, matchDetailId(row.where))

const contrastRows = data.contrast.map((row) => {
  const id = matchDetailId(row.where)
  const issue = id ? issueById(id) : undefined
  return {
    id,
    where: issue ? issue.location : row.where,
    ratio: String(row.ratio),
    required: row.required.toFixed(1),
    verdict: row.pass ? "达标" : "不达标",
  }
})

const confusionRows = data.confusions.map((row) => ({
  id: matchDetailId(row.where),
  pair: row.where,
  normal: row.normal.toFixed(1),
  protan: row["红色盲"].toFixed(1),
  deutan: row["绿色盲"].toFixed(1),
  tritan: row["蓝色盲"].toFixed(1),
  affected: row.affected.join("、"),
}))

const issueRows = sortedIssues.map((issue) => ({
  id: issue.id,
  severity: issue.severity,
  title: issue.title,
  suggestion: issue.suggestion,
  type: issue.type,
  location: issue.location,
  affects: issue.affects.join("、"),
}))

// 修复动作:先按问题文字匹配,再退回明细表同 where 的编号
const matchFixId = (where: string) => {
  const direct = sortedIssues.find((issue) =>
    [issue.location, issue.title, issue.suggestion].some(
      (field) =>
        norm(field).includes(norm(where)) ||
        norm(where).includes(norm(field)) ||
        commonLength(field, where) >= 3
    )
  )
  if (direct) return direct.id
  return detailIdByWhere.get(where) ?? ""
}

const fixRows = data.fixes.map((fix) => ({
  issue: matchFixId(fix.where),
  where: fix.where,
  from: fix.from,
  to: fix.to,
  before: fix.before.toFixed(2),
  after: fix.after.toFixed(2),
  bg: fix.bg,
}))

const fixByIssue = new Map(
  fixRows.filter((row) => row.issue !== "").map((row) => [row.issue, row])
)

const paletteRows = data.palette.map((token) => ({
  name: token.name,
  hex: token.hex,
  usage: token.usage,
}))

const byTypeItems = data.byType.map((item) => ({
  label: item.type,
  value: item.issues,
  max: 2,
  display: `${item.issues} 个`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={`${data.standard} 对比度标准`}>
        <Group>
          <Text className="text-2xl leading-9 font-light">判定:{data.verdict}</Text>
          <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
        </Group>
      </Section>

      <Section
        title="核心指标"
        description={`14 个颜色 token,${data.kpis[0].value} 组文字与背景组合`}
      >
        <Group>
          <Grid cols={9} fields={false} className="items-baseline">
            <Stat
              span={3}
              size="lg"
              value={13}
              unit="组"
              label="对比度不达标"
              captionBelow
              note="WCAG 2.2 AA 正文阈值 4.5:1"
            />
          </Grid>
          <Grid cols={9} fields={false} className="items-baseline">
            <Stat
              span={3}
              value={18}
              unit="组"
              label="检查的文字与背景组合"
              captionBelow
            />
            <Stat
              span={3}
              value={2}
              unit="对"
              label="色盲用户难以区分的颜色"
              captionBelow
            />
            <Stat span={3} value={5} unit="个" label="问题总数" captionBelow />
          </Grid>
        </Group>
      </Section>

      <Section
        title="色觉模拟"
        description="原界面与红色盲、绿色盲、蓝色盲模拟对照"
      >
        <Group>
          <FigureStrip>
            {data.screens.map((screen) => (
              <Figure key={screen.view}>
                <FigureImage src={screen.image} alt={screen.view} />
                <FigureLabel>{screen.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
        </Group>
      </Section>

      <Section
        title="色差分析"
        description="CIEDE2000 ΔE,小于 12 视为难以区分"
        className="gap-12"
      >
        <Group title="混淆色对 · 各色觉类型下的 ΔE">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "pair", label: "颜色对", span: 2 },
              { key: "normal", label: "正常", span: 1, align: "right" },
              { key: "protan", label: "红色盲", span: 1, align: "right", tone: ["0.3"] },
              { key: "deutan", label: "绿色盲", span: 1, align: "right", tone: ["5.9", "8.2"] },
              { key: "tritan", label: "蓝色盲", span: 1, align: "right" },
              { key: "affected", label: "受影响", span: 2 },
            ]}
            rows={confusionRows}
            caption="ΔE 小于 12 视为难以区分;空编号为未列入问题清单的检查项"
          />
        </Group>
        <Group title="问题分布 · 按色觉类型">
          <Grid cols={9} fields={false}>
            <Block span={3}>
              <ProgressList items={byTypeItems} compact />
            </Block>
          </Grid>
        </Group>
      </Section>

      <Section
        title="对比度明细"
        description={`${data.contrast.length} 组文字与背景组合的对比度检查`}
      >
        <Group>
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "where", label: "位置", span: 3 },
              { key: "ratio", label: "对比度", span: 2, align: "right", bar: true },
              { key: "required", label: "要求", span: 1, align: "right" },
              { key: "verdict", label: "判定", span: 2, tone: ["不达标"] },
            ]}
            rows={contrastRows}
            caption="WCAG 2.2 AA:正文 4.5:1,大标题 3:1;空编号为未列入问题清单的检查项"
          />
        </Group>
      </Section>

      <Section
        title="调色板"
        description={`${data.palette.length} 个颜色 token 的名称、色值与用途`}
      >
        <Group>
          <DataTable
            columns={[
              { key: "name", label: "名称", span: 3 },
              { key: "hex", label: "色值", span: 3 },
              { key: "usage", label: "用途", span: 3 },
            ]}
            rows={paletteRows}
          />
        </Group>
      </Section>

      <Section
        title="问题清单"
        description={`${data.issues.length} 个问题,按严重程度排列;修复动作与问题编号对应`}
      >
        <Group>
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "severity", label: "严重度", span: 1, tone: ["高"] },
              { key: "title", label: "问题", span: 2 },
              { key: "suggestion", label: "建议", span: 2 },
              { key: "type", label: "类型", span: 1 },
              { key: "location", label: "位置", span: 1 },
              { key: "affects", label: "影响", span: 1 },
            ]}
            rows={issueRows}
            caption="严重程度为「高」的问题标红"
          />
          {fixRows.length > 0 ? (
            <DataTable
              columns={[
                { key: "issue", label: "问题编号", span: 1 },
                { key: "where", label: "位置", span: 2 },
                { key: "from", label: "原值", span: 1 },
                { key: "to", label: "新值", span: 1 },
                { key: "before", label: "改前对比度", span: 1, align: "right" },
                { key: "after", label: "改后对比度", span: 1, align: "right" },
                { key: "bg", label: "背景", span: 2 },
              ]}
              rows={fixRows}
              caption="空编号为未列入问题清单的调整项"
            />
          ) : null}
        </Group>
      </Section>

      <Section
        title="下一步"
        description="按严重程度排列,编号与问题清单一一对应"
      >
        <Group>
          <List
            items={sortedIssues.map((issue) => {
              const fix = fixByIssue.get(issue.id)
              return {
                title: `${issue.id} ${issue.title}`,
                description: issue.suggestion,
                meta: fix
                  ? `${fix.from} → ${fix.to},${fix.before} → ${fix.after}`
                  : undefined,
              }
            })}
          />
        </Group>
      </Section>

      <Section title="背景信息" description="检查对象与口径">
        <Group>
          <KV
            labelCols={2}
            items={[
              { label: "检查对象", value: data.target },
              { label: "检查标准", value: data.standard },
              { label: "模拟方法", value: data.method },
              { label: "报告日期", value: data.date },
              {
                label: "覆盖范围",
                value: `${data.palette.length} 个颜色 token,${data.contrast.length} 组文字与背景组合`,
              },
            ]}
          />
        </Group>
      </Section>
    </Page>
  )
}
