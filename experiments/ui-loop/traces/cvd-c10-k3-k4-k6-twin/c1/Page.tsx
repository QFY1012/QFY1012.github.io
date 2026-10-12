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

const fmt1 = (n: number) => n.toFixed(1)

/* 核心指标:问题总数排到第一位,其余按原顺序 */
const kpiHead = data.kpis.filter((k) => k.key === "issues")
const kpiRest = data.kpis.filter((k) => k.key !== "issues")
const kpis = [...kpiHead, ...kpiRest]
const kpiSpan = Math.floor(9 / kpis.length)

/* 色觉模拟:每两张一行 */
const screenRows: (typeof data.screens)[] = []
data.screens.forEach((screen, i) => {
  if (i % 2 === 0) screenRows.push([])
  screenRows[screenRows.length - 1].push(screen)
})

/* 混淆色对 */
const confusions = data.confusions
const confusionCols = [
  { key: "where", label: "位置", span: 2 },
  { key: "colors", label: "色值", span: 2 },
  { key: "normal", label: "正常", align: "right" as const, span: 1 },
  {
    key: "protan",
    label: "红色盲",
    align: "right" as const,
    span: 1,
    tone: confusions.filter((c) => c["红色盲"] < 12).map((c) => fmt1(c["红色盲"])),
  },
  {
    key: "deutan",
    label: "绿色盲",
    align: "right" as const,
    span: 1,
    tone: confusions.filter((c) => c["绿色盲"] < 12).map((c) => fmt1(c["绿色盲"])),
  },
  { key: "tritan", label: "蓝色盲", align: "right" as const, span: 1 },
  { key: "affected", label: "受影响", span: 1 },
]
const confusionRows = confusions.map((c) => ({
  where: c.where,
  colors: c.colors.join(" · "),
  normal: fmt1(c.normal),
  protan: fmt1(c["红色盲"]),
  deutan: fmt1(c["绿色盲"]),
  tritan: fmt1(c["蓝色盲"]),
  affected: c.affected.join("、"),
}))

/* 对比度检查 */
const contrastCols = [
  { key: "where", label: "位置", span: 2 },
  { key: "fg", label: "文字色", span: 2 },
  { key: "bg", label: "背景色", span: 2 },
  { key: "ratio", label: "对比度", align: "right" as const, span: 1 },
  { key: "required", label: "要求", align: "right" as const, span: 1 },
  { key: "verdict", label: "判定", span: 1, tone: ["不达标"] },
]
const contrastRows = data.contrast.map((c) => ({
  where: c.where,
  fg: c.fg,
  bg: c.bg,
  ratio: c.ratio,
  required: fmt1(c.required),
  verdict: c.pass ? "达标" : "不达标",
  pass: c.pass,
}))

/* 分类对比:按色盲类型 */
const byTypeItems = data.byType.map((t) => ({ label: t.type, value: t.issues }))

/* 问题明细 */
const issueCols = [
  { key: "id", label: "编号", span: 1 },
  { key: "title", label: "问题", span: 3 },
  { key: "type", label: "类型", span: 1 },
  { key: "location", label: "位置", span: 1 },
  { key: "severity", label: "严重", span: 1, tone: ["高"] },
  { key: "affects", label: "影响", span: 2 },
]
const issueRows = data.issues.map((it) => ({
  id: it.id,
  title: it.title,
  type: it.type,
  location: it.location,
  severity: it.severity,
  affects: it.affects.length ? it.affects.join("、") : "—",
}))

/* 下一步:每个问题的改法 + 颜色替换对照 */
const fixCols = [
  { key: "where", label: "位置", span: 2 },
  { key: "from", label: "现状", span: 2 },
  { key: "to", label: "建议", span: 2 },
  { key: "bg", label: "底色", span: 1 },
  { key: "before", label: "改前", align: "right" as const, span: 1 },
  { key: "after", label: "改后", align: "right" as const, span: 1 },
]
const fixRows = data.fixes.map((f) => ({
  where: f.where,
  from: f.from,
  to: f.to,
  bg: f.bg,
  before: f.before,
  after: f.after,
}))

/* 背景信息:配色清单 */
const paletteCols = [
  { key: "name", label: "系列", span: 3 },
  { key: "hex", label: "色值", span: 2 },
  { key: "usage", label: "用途", span: 4 },
]
const paletteRows = data.palette.map((p) => ({
  name: p.name,
  hex: p.hex,
  usage: p.usage,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section
        title="结论"
        description="基于 10 组文字与背景的对比度检查、4 对颜色的混淆检查"
      >
        <Text className="text-2xl leading-9 font-light">
          {`${data.verdict}。${data.summary}`}
        </Text>
      </Section>

      <Section title="核心指标" description="首页色觉与对比度检查的总体数字">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((k) => (
            <Stat
              key={k.key}
              span={kpiSpan}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              size="lg"
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="色觉模拟"
        description="同一首页在三种色盲模拟下的呈现,按 Machado 2009 模型生成"
      >
        <Group>
          {screenRows.map((row, i) => (
            <FigureStrip key={i}>
              {row.map((screen) => (
                <Figure key={screen.view}>
                  <FigureImage src={screen.image} alt={screen.view} />
                  <FigureLabel>{screen.view}</FigureLabel>
                </Figure>
              ))}
            </FigureStrip>
          ))}
        </Group>
      </Section>

      <Section
        title="混淆色对"
        description="模拟色觉下的 CIEDE2000 色差,小于 12 视为难以区分"
      >
        <DataTable
          columns={confusionCols}
          rows={confusionRows}
          caption="色差为模拟色觉下两色之间的 ΔE,正常色觉一列作为对照"
        />
      </Section>

      <Section
        title="对比度检查"
        description="文字与背景组合的对比度,要求按 WCAG 2.2 AA"
      >
        <DataTable
          columns={contrastCols}
          rows={contrastRows}
          caption="共 10 组,其中 6 组不达标"
        />
      </Section>

      <Section title="分类对比" description="按色盲类型统计的问题数">
        <Grid cols={9} fields={false} className="items-start">
          <Block span={3} rows={2} title="按色盲类型">
            <ProgressList items={byTypeItems} compact />
          </Block>
        </Grid>
      </Section>

      <Section
        title="问题明细"
        description="6 个问题按严重程度列出,高 3、中 2、低 1"
      >
        <DataTable
          columns={issueCols}
          rows={issueRows}
          caption="影响一列为模拟色觉下受影响的人群;严重程度取高、中、低三级"
        />
      </Section>

      <Section
        title="下一步"
        description="每个问题的改法,以及四处颜色替换后的对比度"
        className="gap-12"
      >
        <List
          items={data.issues.map((it) => ({
            title: it.title,
            description: it.suggestion,
          }))}
          numbered
          columns={3}
        />
        <Group title="颜色替换对照">
          <DataTable columns={fixCols} rows={fixRows} />
        </Group>
      </Section>

      <Section
        title="背景信息"
        description="分析对象、依据、判定与图表配色清单"
        className="gap-12"
      >
        <KV
          labelCols={2}
          items={[
            { label: "分析对象", value: data.target },
            { label: "分析日期", value: data.date },
            { label: "遵循标准", value: data.standard },
            { label: "判定", value: data.verdict },
            { label: "评估方法", value: data.method },
          ]}
        />
        <Group title="图表配色清单">
          <DataTable columns={paletteCols} rows={paletteRows} />
        </Group>
      </Section>
    </Page>
  )
}
