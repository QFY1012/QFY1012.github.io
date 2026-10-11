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

// 文字与背景的对比度:位置、前景、背景、实测对比度、要求、结果。
const contrastColumns = [
  { key: "where", label: "位置", span: 3 },
  { key: "fg", label: "文字", span: 1 },
  { key: "bg", label: "背景", span: 1 },
  { key: "ratio", label: "对比度", span: 1, align: "right" as const },
  { key: "required", label: "要求", span: 1, align: "right" as const },
  { key: "pass", label: "结果", span: 2, tone: ["不通过"] },
]
const contrastRows = data.contrast.map((c) => ({
  where: c.where,
  fg: c.fg,
  bg: c.bg,
  ratio: c.ratio.toFixed(2),
  required: c.required.toFixed(1),
  pass: c.pass ? "通过" : "不通过",
}))

// 颜色混淆:每一对颜色在正常视觉和三类色盲下的 ΔE。
const confusionColumns = [
  { key: "where", label: "色对", span: 2 },
  { key: "colors", label: "颜色", span: 2 },
  { key: "normal", label: "正常", span: 1, align: "right" as const },
  { key: "protan", label: "红色盲", span: 1, align: "right" as const },
  { key: "deutan", label: "绿色盲", span: 1, align: "right" as const },
  { key: "tritan", label: "蓝色盲", span: 1, align: "right" as const },
  { key: "affected", label: "受影响", span: 1 },
]
const confusionRows = data.confusions.map((c) => ({
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

// 核心指标:结论项(问题总数 issues)挪到整组第一个,其余按原顺序。
const kpis = (() => {
  const lead = data.kpis.find((k) => k.key === "issues")
  const rest = data.kpis.filter((k) => k.key !== "issues")
  return lead ? [lead, ...rest] : rest
})()

// 受影响的色盲类型与问题数。
const byTypeItems = data.byType.map((t) => ({
  label: t.type,
  value: t.issues,
  max: data.issues.length,
  display: String(t.issues),
}))

// 问题清单:标题、类型与位置、影响范围、建议,严重度作标记。
const issueItems = data.issues.map((it) => ({
  title: it.title,
  description: `${it.type} · ${it.location} · 影响:${it.affects.length ? it.affects.join("、") : "—"} · 建议:${it.suggestion}`,
  meta: it.severity,
}))

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

      <Section title="核心指标" description="本次检查的四个数字">
        <Group>
          <Grid cols={kpis.length} fields={false} className="items-baseline">
            {kpis.map((k) => (
              <Stat
                key={k.key}
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
            <DataTable columns={contrastColumns} rows={contrastRows} />
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
              caption="ΔE 小于 12 视为难以区分"
            />
          </Block>
          <Block title="受影响的问题数" description="按色盲类型">
            <ProgressList compact items={byTypeItems} />
          </Block>
        </Group>
      </Section>

      <Section title="问题清单" description="按严重度">
        <Group>
          <List ordered items={issueItems} />
        </Group>
      </Section>
    </Page>
  )
}
