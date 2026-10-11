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
} from "@/components/report"

// The KPIs are read back by key so the numbers on the page always come from the data.
const kpi = (key: string) => data.kpis.find((k) => k.key === key)!

// Contrast rows carry a state column so the failing checks are the ones drawn in red.
const contrastRows = data.contrast.map((c) => ({
  where: c.where,
  fg: c.fg,
  bg: c.bg,
  ratio: c.ratio,
  required: c.required,
  state: c.pass ? "达标" : "不达标",
}))

// Which simulated types lose the colour pair: the affected ΔE sits in that type's column.
const affectedTone = (type: "红色盲" | "绿色盲" | "蓝色盲") =>
  data.confusions.filter((c) => c.affected.includes(type)).map((c) => String(c[type]))

const confusionRows = data.confusions.map((c) => ({
  where: c.where,
  normal: c.normal,
  红色盲: c["红色盲"],
  绿色盲: c["绿色盲"],
  蓝色盲: c["蓝色盲"],
  affected: c.affected.length ? c.affected.join("、") : "—",
}))

// Issues are ordered high → medium → low severity, ties keeping the data's own order.
const severityRank: Record<string, number> = { 高: 0, 中: 1, 低: 2 }
const sortedIssues = [...data.issues].sort(
  (a, b) => (severityRank[a.severity] ?? 3) - (severityRank[b.severity] ?? 3),
)

const issueRows = sortedIssues.map((i) => ({
  id: i.id,
  location: i.location,
  type: i.type,
  severity: i.severity,
  affects: i.affects.length ? i.affects.join("、") : "—",
  suggestion: i.suggestion,
}))

// The fix table only exists when the data carries replacements.
const fixRows = data.fixes.map((f) => ({
  where: f.where,
  from: f.from,
  to: f.to,
  contrast: `${f.before} → ${f.after}`,
}))

// Next steps share the issue numbering and order, one item per issue.
const nextSteps = sortedIssues.map((i) => ({
  title: `${i.id} · ${i.title}`,
  description: i.suggestion,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, `${data.date} · ${data.standard}`]}>
      <Section title="结论" description={data.method}>
        <Text className="text-2xl leading-9 font-light">{`${data.verdict}。${data.summary}`}</Text>
      </Section>

      <Section title="核心指标" description="正文对比度要求 4.5:1,色差 ΔE 小于 12 视为难以区分">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            size="lg"
            captionBelow
            label={kpi("issues").label}
          />
          <Stat
            span={3}
            value={kpi("fail").value}
            unit={kpi("fail").unit}
            captionBelow
            label={kpi("fail").label}
          />
          <Stat
            span={3}
            value={kpi("confuse").value}
            unit={kpi("confuse").unit}
            captionBelow
            label={kpi("confuse").label}
          />
        </Grid>
      </Section>

      <Section title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照">
        <FigureStrip>
          {data.screens.map((s) => (
            <Figure key={s.view}>
              <FigureImage src={s.image} alt={`${s.view}模拟`} />
              <FigureLabel>{s.view}</FigureLabel>
            </Figure>
          ))}
        </FigureStrip>
      </Section>

      <Section
        title="分群"
        description="按模拟色觉类型拆分;ΔE 小于 12 视为难以区分"
        className="gap-12"
      >
        <Group title="各色觉类型受影响的问题数">
          <Grid cols={9} fields={false} className="items-baseline">
            {data.byType.map((t) => (
              <Stat
                key={t.type}
                span={2}
                value={t.issues}
                unit="个"
                captionBelow
                label={t.type}
                note="受影响的问题数"
              />
            ))}
          </Grid>
        </Group>

        <Group title="色差对照(CIEDE2000 ΔE)">
          <DataTable
            columns={[
              { key: "where", label: "颜色组合", span: 3 },
              { key: "normal", label: "正常视觉", align: "right", span: 1 },
              { key: "红色盲", label: "红色盲", align: "right", span: 1, tone: affectedTone("红色盲") },
              { key: "绿色盲", label: "绿色盲", align: "right", span: 1, tone: affectedTone("绿色盲") },
              { key: "蓝色盲", label: "蓝色盲", align: "right", span: 1, tone: affectedTone("蓝色盲") },
              { key: "affected", label: "影响", span: 2, tone: ["红色盲", "绿色盲", "蓝色盲"] },
            ]}
            rows={confusionRows}
            caption="ΔE 小于 12 视为难以区分;红色为该模拟下难以区分。"
          />
        </Group>
      </Section>

      <Section title="配色" description="行情页使用的颜色与用途">
        <DataTable
          columns={[
            { key: "name", label: "颜色", span: 3 },
            { key: "hex", label: "色值", span: 3 },
            { key: "usage", label: "用途", span: 3 },
          ]}
          rows={data.palette}
        />
      </Section>

      <Section title="对比度" description="文字与背景的对比度,正文要求 4.5:1">
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 3 },
            { key: "fg", label: "前景", span: 1 },
            { key: "bg", label: "背景", span: 1 },
            { key: "ratio", label: "对比度", align: "right", span: 1 },
            { key: "required", label: "要求", align: "right", span: 1 },
            { key: "state", label: "结论", span: 2, tone: ["不达标"] },
          ]}
          rows={contrastRows}
          caption="按 WCAG 2.2 AA:正文 4.5:1,大字 3:1。"
        />
      </Section>

      <Section title="明细" description="问题清单与整改对照" className="gap-12">
        <Group title="问题清单">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "location", label: "位置", span: 2 },
              { key: "type", label: "类型", span: 1 },
              { key: "severity", label: "严重", span: 1, tone: ["高"] },
              { key: "affects", label: "影响", span: 2 },
              { key: "suggestion", label: "建议", span: 2 },
            ]}
            rows={issueRows}
            caption="影响 = 受该问题影响的色觉类型;严重程度分高、中、低,按高到低排列。"
          />
        </Group>

        {fixRows.length > 0 && (
          <Group title="整改对照">
            <DataTable
              columns={[
                { key: "where", label: "位置", span: 3 },
                { key: "from", label: "修改前", span: 2 },
                { key: "to", label: "修改后", span: 2 },
                { key: "contrast", label: "对比度", span: 2 },
              ]}
              rows={fixRows}
              caption="对比度 = 修改前 → 修改后,按 WCAG 2.2 AA 正文要求 4.5:1。"
            />
          </Group>
        )}
      </Section>

      <Section title="下一步" description="按问题清单编号给出建议">
        <List columns={2} items={nextSteps} />
      </Section>

      <Section title="背景信息" description="检查范围与口径">
        <KV
          labelCols={2}
          items={[
            { label: "产品 / 页面", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "标准", value: data.standard },
            { label: "方法", value: data.method },
            { label: "检查的文字与背景组合", value: `${kpi("pairs").value} ${kpi("pairs").unit}` },
          ]}
        />
      </Section>
    </Page>
  )
}
