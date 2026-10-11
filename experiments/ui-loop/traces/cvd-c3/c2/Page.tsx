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

export default function Report() {
  const kpis = Object.fromEntries(data.kpis.map((k) => [k.key, k]))

  const lcsLen = (a: string, b: string) => {
    let best = 0
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        let k = 0
        while (i + k < a.length && j + k < b.length && a[i + k] === b[j + k]) k++
        if (k > best) best = k
      }
    }
    return best
  }

  const matchIssueId = (where: string, minLen: number) => {
    const contained = (a: string, b: string) => a.includes(b) && b.length >= minLen
    const candidates = data.issues
      .map((i) => {
        const samePlace = i.location === where
        const matched =
          samePlace ||
          contained(i.title, where) ||
          contained(i.suggestion, where) ||
          contained(where, i.title) ||
          contained(where, i.suggestion)
        const score = Math.max(
          lcsLen(where, i.location),
          lcsLen(where, i.title),
          lcsLen(where, i.suggestion),
        )
        return { id: i.id, matched, score }
      })
      .filter((c) => c.matched)
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    return candidates.length ? candidates[0].id : ""
  }

  const issueById = (id: string) => data.issues.find((i) => i.id === id)

  const detailIdByWhere: Record<string, string> = {}
  data.contrast.forEach((c) => {
    detailIdByWhere[c.where] = matchIssueId(c.where, 3)
  })
  data.confusions.forEach((c) => {
    detailIdByWhere[c.where] = matchIssueId(c.where, 3)
  })

  const detailWhere = (where: string) => {
    const id = detailIdByWhere[where]
    const issue = id ? issueById(id) : undefined
    return issue ? issue.location : where
  }

  const contrastRows = data.contrast.map((c) => ({
    id: detailIdByWhere[c.where],
    where: detailWhere(c.where),
    fg: c.fg,
    bg: c.bg,
    ratio: c.ratio,
    required: c.required,
    result: c.pass ? "达标" : "不达标",
  }))

  const confusionRows = data.confusions.map((c) => ({
    id: detailIdByWhere[c.where],
    where: detailWhere(c.where),
    原界面: c.normal,
    红色盲: c["红色盲"],
    绿色盲: c["绿色盲"],
    蓝色盲: c["蓝色盲"],
    影响: c.affected.join("、"),
  }))

  const severityRank: Record<string, number> = { 高: 0, 中: 1, 低: 2 }
  const sortedIssues = [...data.issues].sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity] || a.id.localeCompare(b.id),
  )

  const issueRows = sortedIssues.map((i) => ({
    id: i.id,
    severity: i.severity,
    title: i.title,
    suggestion: i.suggestion,
    type: i.type,
    location: i.location,
    affects: i.affects.join("、"),
  }))

  const fixRows = data.fixes.map((f) => {
    let id = matchIssueId(f.where, 3)
    if (!id) id = detailIdByWhere[f.where] ?? ""
    return {
      issueId: id,
      where: f.where,
      from: f.from,
      to: f.to,
      before: f.before,
      after: f.after,
      bg: f.bg,
    }
  })

  const fixByIssue: Record<string, (typeof data.fixes)[number]> = {}
  fixRows.forEach((r, idx) => {
    if (r.issueId) fixByIssue[r.issueId] = data.fixes[idx]
  })

  const nextItems = sortedIssues.map((issue) => {
    const f = fixByIssue[issue.id]
    return f
      ? {
          title: `${issue.id} ${issue.title}`,
          description: issue.suggestion,
          meta: `${f.from} → ${f.to},${f.before} → ${f.after}`,
        }
      : { title: `${issue.id} ${issue.title}`, description: issue.suggestion }
  })

  return (
    <Page
      title={data.title}
      meta={[data.target, data.date, `对照 ${data.standard}`]}
    >
      <Section
        title="结论"
        description="按 WCAG 2.2 AA 判定;色差小于 ΔE 12 视为难以区分"
      >
        <Group>
          <Text className="text-2xl leading-9 font-light">
            整体{data.verdict}:6 组文字与背景组合中 1 组对比度不达标,配送进度条的红绿区分在绿色盲下难以分辨。
          </Text>
          <Text>{data.summary}</Text>
        </Group>
      </Section>

      <Section
        title="核心指标"
        description="本次检查 6 组文字与背景组合,共发现 3 个问题"
      >
        <Group>
          <Grid cols={9} fields={false} className="items-baseline">
            <Stat
              span={3}
              size="lg"
              captionBelow
              value={kpis.issues.value}
              unit={kpis.issues.unit}
              label={kpis.issues.label}
            />
          </Grid>
          <Grid cols={9} fields={false} className="items-baseline">
            <Stat
              span={3}
              captionBelow
              value={kpis.pairs.value}
              unit={kpis.pairs.unit}
              label={kpis.pairs.label}
            />
            <Stat
              span={3}
              captionBelow
              value={kpis.fail.value}
              unit={kpis.fail.unit}
              label={kpis.fail.label}
              note="低于 4.5:1"
              direction="down"
            />
            <Stat
              span={3}
              captionBelow
              value={kpis.confuse.value}
              unit={kpis.confuse.unit}
              label={kpis.confuse.label}
              note="绿色盲下 ΔE 9.0"
              direction="down"
            />
          </Grid>
        </Group>
      </Section>

      <Section
        title="色觉模拟"
        description="原界面与红色盲、绿色盲、蓝色盲模拟对照,模拟按 Machado 2009 模型"
      >
        <Block
          title="原界面与三种色觉模拟"
          description="同一屏订单状态页在正常视觉与三种色盲下的呈现"
        >
          <FigureStrip>
            {data.screens.map((screen) => (
              <Figure key={screen.view}>
                <FigureImage src={screen.image} alt={screen.view} />
                <FigureLabel>{screen.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
        </Block>
      </Section>

      <Section
        title="问题分布"
        description="按色盲类型统计问题数;色差为 CIEDE2000 ΔE,小于 12 视为难以区分"
        className="gap-12"
      >
        <Group>
          <Grid cols={9} fields={false}>
            <Block span={3} title="各类型问题数">
              <ProgressList
                compact
                items={data.byType.map((t) => ({
                  label: t.type,
                  value: t.issues,
                  max: 2,
                  display: `${t.issues} 个`,
                }))}
              />
            </Block>
          </Grid>
        </Group>
        <Group title="色差对照">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "where", label: "位置", span: 3 },
              { key: "原界面", label: "原界面", span: 1, align: "right" },
              { key: "红色盲", label: "红色盲", span: 1, align: "right" },
              { key: "绿色盲", label: "绿色盲", span: 1, align: "right" },
              { key: "蓝色盲", label: "蓝色盲", span: 1, align: "right" },
              { key: "影响", label: "影响", span: 1 },
            ]}
            rows={confusionRows}
            caption="空编号为未列入问题清单的检查项"
          />
        </Group>
      </Section>

      <Section
        title="明细"
        description="6 组文字与背景的对比度检查,以及 3 个问题的位置、类型与影响"
        className="gap-12"
      >
        <Group title="对比度检查">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "where", label: "位置", span: 3 },
              { key: "fg", label: "前景色", span: 1 },
              { key: "bg", label: "背景色", span: 1 },
              { key: "ratio", label: "对比度", span: 1, align: "right" },
              { key: "required", label: "要求", span: 1, align: "right" },
              { key: "result", label: "结果", span: 1, tone: ["不达标"] },
            ]}
            rows={contrastRows}
            caption="空编号为未列入问题清单的检查项"
          />
        </Group>
        <Group title="界面用色">
          <DataTable
            columns={[
              { key: "name", label: "名称", span: 2 },
              { key: "hex", label: "色值", span: 2 },
              { key: "usage", label: "用途", span: 5 },
            ]}
            rows={data.palette}
            caption="色值为界面原始取色,共 5 个。"
          />
        </Group>
        <Group title="问题清单">
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
            caption="影响为空表示该问题与色觉类型无关;严重度分中、低两级。"
          />
        </Group>
        <Group title="修复动作">
          <DataTable
            columns={[
              { key: "issueId", label: "问题编号", span: 1 },
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
        </Group>
      </Section>

      <Section
        title="下一步"
        description="按问题给出的修改建议;顶部标题改为深色后对比度从 1.61 提升到 10.25"
      >
        <Group>
          <List columns={3} items={nextItems} />
        </Group>
      </Section>

      <Section title="背景信息" description="检查对象、日期、对照标准与模拟方法">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "对照标准", value: data.standard },
            { label: "模拟方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
