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
  FigureCompare,
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

const issueRows = data.issues.map((i) => ({
  title: i.title,
  type: i.type,
  location: i.location,
  severity: i.severity,
  affects: i.affects.length ? i.affects.join("、") : "—",
  suggestion: i.suggestion,
}))

const fixItems = data.fixes.map((f) => ({
  title: f.where,
  description: `${f.from} → ${f.to} · 对比度 ${f.before} → ${f.after}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, `${data.date} · ${data.standard}`]}>
      <Section title="结论" description={data.method}>
        <Text className="text-2xl leading-9 font-light">{`${data.verdict}。${data.summary}`}</Text>
      </Section>

      <Section title="核心指标" description="正文对比度要求 4.5:1,色差 ΔE 小于 12 视为难以区分">
        <Grid cols={9} fields={false} className="items-baseline">
          {[...data.kpis]
            .sort((a, b) => (a.key === "issues" ? -1 : b.key === "issues" ? 1 : 0))
            .map((k) => (
              <Stat
                key={k.key}
                span={2}
                value={k.value}
                unit={k.unit}
                size="lg"
                captionBelow
                label={k.label}
              />
            ))}
        </Grid>
      </Section>

      <Section title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照">
        <Group>
          {/* 原界面与三种模拟是一组对照:四张并排一行,各占四分之一列宽,整组同屏可直接横比。 */}
          <FigureCompare>
            {data.screens.map((s) => (
              <Figure key={s.view}>
                <FigureImage src={s.image} alt={`${s.view}模拟`} />
                <FigureLabel>{s.view}</FigureLabel>
              </Figure>
            ))}
          </FigureCompare>
        </Group>
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

      <Section title="明细" description="问题清单:类型、位置、影响与建议">
        <DataTable
          columns={[
            { key: "title", label: "问题", span: 2 },
            { key: "type", label: "类型", span: 1 },
            { key: "location", label: "位置", span: 1 },
            { key: "severity", label: "严重", span: 1, levels: ["低", "中", "高"] },
            { key: "affects", label: "影响", span: 2 },
            { key: "suggestion", label: "建议", span: 2 },
          ]}
          rows={issueRows}
          caption="影响 = 受该问题影响的色觉类型;严重程度分高、中、低。"
        />
      </Section>

      <Section title="下一步" description="建议替换的色值与替换后的对比度">
        <List numbered columns={3} items={fixItems} />
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
