import data from "./data.json"
import {
  Page,
  Section,
  Grid,
  Block,
  Text,
  Stat,
  DataTable,
  List,
  KV,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
} from "@/components/report"

const totalIssues = data.issues.length

const kpi = (key: string) => data.kpis.find((k) => k.key === key)!

const severityRank: Record<string, number> = { 高: 0, 中: 1, 低: 2 }

const sortedIssues = [...data.issues].sort(
  (a, b) =>
    severityRank[a.severity] - severityRank[b.severity] || a.id.localeCompare(b.id),
)

function longestCommonSubstring(a: string, b: string): number {
  let best = 0
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
        if (dp[i][j] > best) best = dp[i][j]
      }
    }
  }
  return best
}

const issueById = (id: string) => data.issues.find((i) => i.id === id)

// 明细表每行的编号:先看 where 与某条 issues 的 location 是否指同一处,
// 否则看 where 与该条 title、suggestion 是否有 3 个以上连续相同文字;
// 多条候选取相同文字最长的,同长取 id 小的。
function matchIssueId(where: string): string {
  let bestId = ""
  let bestScore = -1
  for (const issue of data.issues) {
    const samePlace =
      where === issue.location ||
      where.includes(issue.location) ||
      issue.location.includes(where)
    const textScore = Math.max(
      longestCommonSubstring(where, issue.title),
      longestCommonSubstring(where, issue.suggestion),
    )
    const score = samePlace ? 1000 : textScore >= 3 ? textScore : -1
    if (score < 0) continue
    if (score > bestScore || (score === bestScore && issue.id.localeCompare(bestId) < 0)) {
      bestId = issue.id
      bestScore = score
    }
  }
  return bestId
}

const nextSteps = sortedIssues

export default function Report() {
  const fail = kpi("fail")
  const pairs = kpi("pairs")
  const confuse = kpi("confuse")
  const issues = kpi("issues")

  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={`按 ${data.standard} 评估`}>
        <Text className="text-2xl leading-9 font-light">
          {`${data.verdict}。${data.summary}`}
        </Text>
      </Section>

      <Section title="核心指标" description="本次检查的范围与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            captionBelow
            size="lg"
            value={fail.value}
            unit={fail.unit}
            label={fail.label}
            note="要求 ≥ 4.5:1"
            direction="down"
          />
          <Stat span={3} captionBelow value={pairs.value} unit={pairs.unit} label={pairs.label} />
          <Stat span={3} captionBelow value={confuse.value} unit={confuse.unit} label={confuse.label} />
          <Stat span={3} captionBelow value={issues.value} unit={issues.unit} label={issues.label} />
        </Grid>
      </Section>

      <Section title="模拟视图" description="按 Machado 2009 模型模拟红色盲、绿色盲、蓝色盲">
        <Block title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照">
          <FigureStrip>
            {data.screens.map((s) => (
              <Figure key={s.view}>
                <FigureImage src={s.image} alt={s.view} />
                <FigureLabel>{s.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
        </Block>
      </Section>

      <Section title="类型分布" description={`各色盲类型发现的问题数,共 ${totalIssues} 个`}>
        <Grid cols={9} fields={false}>
          {data.byType.map((t) => (
            <Stat key={t.type} span={2} captionBelow value={t.issues} unit="个" label={t.type} />
          ))}
        </Grid>
      </Section>

      <Section title="对比度" description="文字与背景的对比度,WCAG AA 阈值 4.5:1">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "where", label: "位置", span: 2 },
            { key: "bg", label: "底色", span: 2 },
            { key: "ratio", label: "对比度", align: "right", span: 2 },
            { key: "required", label: "要求", align: "right", span: 1 },
            { key: "result", label: "结果", span: 1, tone: ["不达标"] },
          ]}
          rows={data.contrast.map((c) => {
            const id = matchIssueId(c.where)
            const matched = issueById(id)
            return {
              id,
              where: matched ? matched.location : c.where,
              bg: c.bg,
              ratio: c.ratio,
              required: c.required,
              result: c.pass ? "达标" : "不达标",
            }
          })}
          caption="空编号为未列入问题清单的检查项"
        />
      </Section>

      <Section title="色对混淆" description="CIEDE2000 色差 ΔE,小于 12 视为难以区分">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "where", label: "色对", span: 2 },
            { key: "normal", label: "正常视觉", align: "right", span: 1 },
            { key: "红色盲", label: "红色盲", align: "right", span: 1 },
            { key: "绿色盲", label: "绿色盲", align: "right", span: 1 },
            { key: "蓝色盲", label: "蓝色盲", align: "right", span: 1 },
            { key: "affected", label: "受影响", span: 2 },
          ]}
          rows={data.confusions.map((c) => ({
            id: matchIssueId(c.where),
            where: c.where,
            normal: c.normal,
            红色盲: c["红色盲"],
            绿色盲: c["绿色盲"],
            蓝色盲: c["蓝色盲"],
            affected: c.affected.length > 0 ? c.affected.join("、") : "—",
          }))}
          caption="空编号为未列入问题清单的检查项"
        />
      </Section>

      <Section title="明细" description={`${totalIssues} 个问题的位置、严重度与建议`}>
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
          rows={sortedIssues.map((i) => ({
            id: i.id,
            severity: i.severity,
            title: i.title,
            suggestion: i.suggestion,
            type: i.type,
            location: i.location,
            affects: i.affects.join("、"),
          }))}
        />
      </Section>

      <Section title="下一步" description="按严重度排序的整改项,编号对应明细">
        <List
          items={nextSteps.map((i) => ({
            title: `${i.id} ${i.title}`,
            description: i.suggestion,
          }))}
        />
      </Section>

      <Section title="背景信息" description="产品、标准与模拟方法">
        <KV
          labelCols={2}
          items={[
            { label: "产品", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "标准", value: data.standard },
            { label: "模拟方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
