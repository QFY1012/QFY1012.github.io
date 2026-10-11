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
  const mainKpi = data.kpis.find((k) => k.key === "issues")!
  const subKpis = data.kpis.filter((k) => k.key !== "issues")

  const typeItems = data.byType.map((t) => ({
    label: t.type,
    value: t.issues,
    max: Math.max(...data.byType.map((x) => x.issues)),
    display: String(t.issues),
  }))

  const paletteColumns = [
    { key: "name", label: "名称", span: 1 },
    { key: "hex", label: "色值", span: 2 },
    { key: "usage", label: "用途", span: 3 },
  ]
  const paletteRows = data.palette.map((p) => ({ name: p.name, hex: p.hex, usage: p.usage }))

  const severityRank: Record<string, number> = { 高: 0, 中: 1, 低: 2 }
  const sortedIssues = [...data.issues].sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity] || a.id.localeCompare(b.id),
  )

  const strip = (s: string) => s.replace(/\s/g, "")

  const longestCommon = (a: string, b: string) => {
    let best = 0
    for (let i = 0; i < a.length; i++) {
      for (let len = a.length - i; len > best; len--) {
        if (b.includes(a.slice(i, i + len))) {
          best = len
          break
        }
      }
    }
    return best
  }

  const detailIssueFor = (where: string) => {
    const w = strip(where)
    const candidates = sortedIssues
      .map((i) => {
        const same =
          i.location === where || i.location.includes(where) || where.includes(i.location)
        const len = Math.max(
          longestCommon(w, strip(i.title)),
          longestCommon(w, strip(i.suggestion)),
          longestCommon(w, strip(i.location)),
        )
        const hit =
          same || longestCommon(w, strip(i.title)) >= 3 || longestCommon(w, strip(i.suggestion)) >= 3
        return { issue: i, len, hit }
      })
      .filter((c) => c.hit)
    if (candidates.length === 0) return undefined
    candidates.sort((a, b) => b.len - a.len || a.issue.id.localeCompare(b.issue.id))
    return candidates[0].issue
  }

  const contrastDetail = data.contrast.map((c) => ({
    where: c.where,
    issueId: detailIssueFor(c.where)?.id ?? "",
  }))
  const confusionDetail = data.confusions.map((c) => ({
    where: c.where,
    issueId: detailIssueFor(c.where)?.id ?? "",
  }))

  // 标了编号的行写该条 location;该行 where 若在对应问题的 location/title/suggestion
  // 里已经出现,就不必重复,否则跟在后面,保证明细不丢数据。
  const detailPosition = (issue: typeof sortedIssues[number] | undefined, where: string) => {
    if (!issue) return where
    const w = strip(where)
    const shown = [issue.location, issue.title, issue.suggestion].some((t) => strip(t).includes(w))
    if (issue.location === where || shown) return issue.location
    return `${issue.location} · ${where}`
  }

  const contrastColumns = [
    { key: "id", label: "编号", span: 1 },
    { key: "where", label: "位置", span: 2 },
    { key: "fg", label: "前景", span: 1 },
    { key: "bg", label: "背景", span: 2 },
    { key: "ratio", label: "对比度", align: "right", span: 1 },
    { key: "required", label: "要求", align: "right", span: 1 },
    { key: "result", label: "结果", span: 1, tone: ["不达标"] },
  ]
  const contrastRows = data.contrast.map((c, idx) => {
    const issue = detailIssueFor(c.where)
    return {
      id: contrastDetail[idx].issueId,
      where: detailPosition(issue, c.where),
      fg: c.fg,
      bg: c.bg,
      ratio: c.ratio,
      required: c.required,
      result: c.pass ? "达标" : "不达标",
    }
  })

  const toneFor = (type: string, key: string) =>
    data.confusions.filter((c) => c.affected.includes(type)).map((c) => String(c[key]))

  const confusionColumns = [
    { key: "id", label: "编号", span: 1 },
    { key: "where", label: "位置", span: 2 },
    { key: "colors", label: "颜色对", span: 2 },
    { key: "normal", label: "正常", align: "right", span: 1 },
    { key: "protan", label: "红色盲", align: "right", span: 1, tone: toneFor("红色盲", "红色盲") },
    { key: "deutan", label: "绿色盲", align: "right", span: 1, tone: toneFor("绿色盲", "绿色盲") },
    { key: "tritan", label: "蓝色盲", align: "right", span: 1, tone: toneFor("蓝色盲", "蓝色盲") },
  ]
  const confusionRows = data.confusions.map((c, idx) => {
    const issue = detailIssueFor(c.where)
    return {
      id: confusionDetail[idx].issueId,
      where: detailPosition(issue, c.where),
      colors: c.colors.join(" / "),
      normal: c.normal,
      protan: c["红色盲"],
      deutan: c["绿色盲"],
      tritan: c["蓝色盲"],
    }
  })

  const issueColumns = [
    { key: "id", label: "编号", span: 1 },
    { key: "severity", label: "严重度", span: 1, tone: ["高"] },
    { key: "title", label: "问题", span: 2 },
    { key: "suggestion", label: "建议", span: 2 },
    { key: "type", label: "类型", span: 1 },
    { key: "location", label: "位置", span: 1 },
    { key: "affects", label: "影响", span: 1 },
  ]
  const issueRows = sortedIssues.map((i) => ({
    id: i.id,
    severity: i.severity,
    title: i.title,
    suggestion: i.suggestion,
    type: i.type,
    location: i.location,
    affects: i.affects.join("、"),
  }))

  const bestOverlap = (where: string, text: string) => {
    let best = { len: 0, pos: where.length }
    for (let i = 0; i < where.length; i++) {
      for (let j = where.length; j > i; j--) {
        if (text.includes(where.slice(i, j))) {
          const len = j - i
          if (len > best.len || (len === best.len && i < best.pos)) best = { len, pos: i }
          break
        }
      }
    }
    return best
  }

  const detailLookup = [...contrastDetail, ...confusionDetail]

  const issueIdFor = (where: string) => {
    let id = ""
    let best = { len: 1, pos: where.length }
    sortedIssues.forEach((i) => {
      ;[i.location, i.title, i.suggestion].forEach((text) => {
        const o = bestOverlap(where, text)
        if (o.len > best.len || (o.len === best.len && o.len > 1 && o.pos < best.pos)) {
          best = o
          id = i.id
        }
      })
    })
    if (id) return id
    const detail = detailLookup.find((d) => d.where === where)
    return detail ? detail.issueId : ""
  }

  const fixColumns = [
    { key: "issue", label: "问题编号", span: 1 },
    { key: "where", label: "位置", span: 2 },
    { key: "from", label: "原值", span: 1 },
    { key: "to", label: "新值", span: 1 },
    { key: "before", label: "改前对比度", align: "right", span: 1 },
    { key: "after", label: "改后对比度", align: "right", span: 1 },
    { key: "bg", label: "背景", span: 2 },
  ]
  const fixRows = data.fixes.map((f) => ({
    issue: issueIdFor(f.where),
    where: f.where,
    from: f.from,
    to: f.to,
    before: f.before,
    after: f.after,
    bg: f.bg,
  }))

  const fixMetaFor = (id: string) => {
    const matched = fixRows.filter((f) => f.issue === id)
    if (matched.length === 0) return undefined
    return matched.map((f) => `${f.from} → ${f.to},${f.before} → ${f.after}`).join(";")
  }

  const steps = sortedIssues.map((i) => ({
    title: `${i.id} ${i.title}`,
    description: i.suggestion,
    meta: fixMetaFor(i.id),
  }))

  const facts = [
    { label: "分析对象", value: data.target },
    { label: "分析日期", value: data.date },
    { label: "判定标准", value: data.standard },
    { label: "分析方法", value: data.method },
  ]

  return (
    <Page title={data.title} meta={[data.target, `${data.date} · ${data.standard}`]}>
      <Section title="结论" description="按 WCAG 2.2 AA 判定" className="gap-12">
        <Text className="text-2xl leading-9 font-light">{`${data.verdict}。${data.summary}`}</Text>
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

      <Section title="核心指标" description="对比度与色觉混淆统计">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat span={3} size="lg" captionBelow value={mainKpi.value} unit={mainKpi.unit} label={mainKpi.label} />
          {subKpis.map((k) => (
            <Stat key={k.key} span={2} captionBelow value={k.value} unit={k.unit} label={k.label} />
          ))}
        </Grid>
      </Section>

      <Section title="系列色" description="8 个图表系列色;以及各色觉类型下的问题数">
        <Grid cols={9} fields={false}>
          <Block span={6} title="图表系列色">
            <DataTable columns={paletteColumns} rows={paletteRows} />
          </Block>
          <Block span={3} title="按色盲类型" description="问题数">
            <ProgressList compact items={typeItems} />
          </Block>
        </Grid>
      </Section>

      <Section title="混淆色" description="CIEDE2000 色差,小于 12 视为难以区分">
        <DataTable
          columns={confusionColumns}
          rows={confusionRows}
          caption="空编号为未列入问题清单的检查项"
        />
      </Section>

      <Section title="对比度" description="文字与背景的对比度检查">
        <DataTable
          columns={contrastColumns}
          rows={contrastRows}
          caption="空编号为未列入问题清单的检查项"
        />
      </Section>

      <Section title="明细" description="逐条列出问题、严重度、建议、类型、位置与影响" className="gap-12">
        <DataTable columns={issueColumns} rows={issueRows} />
        <Group title="修复动作">
          <DataTable
            columns={fixColumns}
            rows={fixRows}
            caption="空编号为未列入问题清单的调整项"
          />
        </Group>
      </Section>

      <Section title="下一步" description="按问题逐条给出处理建议">
        <List items={steps} />
      </Section>

      <Section title="背景信息" description="分析口径与判定标准">
        <KV labelCols={2} items={facts} />
      </Section>
    </Page>
  )
}
