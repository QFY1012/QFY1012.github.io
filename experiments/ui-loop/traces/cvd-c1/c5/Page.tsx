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

const [pairsKpi, failKpi, confuseKpi, issuesKpi] = data.kpis

const paletteName = new Map(
  data.palette.map((p) => [p.hex.toUpperCase(), p.name])
)

const colorLabel = (hex: string) => {
  const name = paletteName.get(hex.toUpperCase())
  return name ? `${name} ${hex}` : hex
}

const confusionTone = (key: "红色盲" | "绿色盲" | "蓝色盲") =>
  data.confusions
    .filter((c) => c.affected.includes(key))
    .map((c) => String(c[key]))

const paletteColumns = [
  { key: "name", label: "名称", span: 2 },
  { key: "hex", label: "色值", span: 2 },
  { key: "usage", label: "用途", span: 5 },
]

const confusionColumns = [
  { key: "where", label: "位置", span: 2 },
  { key: "pair", label: "颜色对", span: 2 },
  { key: "normal", label: "正常", align: "right", span: 1 },
  {
    key: "protan",
    label: "红色盲",
    align: "right",
    span: 1,
    tone: confusionTone("红色盲"),
  },
  {
    key: "deuter",
    label: "绿色盲",
    align: "right",
    span: 1,
    tone: confusionTone("绿色盲"),
  },
  {
    key: "tritan",
    label: "蓝色盲",
    align: "right",
    span: 1,
    tone: confusionTone("蓝色盲"),
  },
  { key: "affected", label: "受影响", span: 1 },
]

const confusionRows = data.confusions.map((c) => ({
  where: c.where,
  pair: c.colors.map(colorLabel).join(" / "),
  normal: c.normal,
  protan: c["红色盲"],
  deuter: c["绿色盲"],
  tritan: c["蓝色盲"],
  affected: c.affected.length > 0 ? c.affected.join("、") : "—",
}))

const contrastColumns = [
  { key: "where", label: "位置", span: 3 },
  { key: "fg", label: "文字色", span: 1 },
  { key: "bg", label: "背景色", span: 1 },
  { key: "ratio", label: "对比度", align: "right", span: 1 },
  { key: "required", label: "要求", align: "right", span: 1 },
  { key: "result", label: "结果", span: 2, tone: ["不达标"] },
]

const contrastRows = data.contrast.map((c) => ({
  where: c.where,
  fg: colorLabel(c.fg),
  bg: colorLabel(c.bg),
  ratio: c.ratio,
  required: c.required,
  result: c.pass ? "达标" : "不达标",
}))

const fixColumns = [
  { key: "where", label: "位置", span: 2 },
  { key: "from", label: "原色", span: 1 },
  { key: "to", label: "建议色", span: 1 },
  { key: "bg", label: "背景", span: 1 },
  { key: "before", label: "修复前", align: "right", span: 2 },
  { key: "after", label: "修复后", align: "right", span: 2 },
]

const fixRows = data.fixes.map((f) => ({
  where: f.where,
  from: colorLabel(f.from),
  to: colorLabel(f.to),
  bg: colorLabel(f.bg),
  before: f.before,
  after: f.after,
}))

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "title", label: "问题", span: 2 },
  { key: "type", label: "类型", span: 2 },
  { key: "location", label: "位置", span: 2 },
  { key: "severity", label: "严重度", span: 1, tone: ["高"] },
  { key: "affects", label: "影响", span: 1 },
]

const issueRows = data.issues.map((i) => ({
  id: i.id,
  title: i.title,
  type: i.type,
  location: i.location,
  severity: i.severity,
  affects: i.affects.length > 0 ? i.affects.join("、") : "—",
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date, data.standard]}>
      <Section title="结论" description="整体判定与一句话结论">
        <Group>
          <Text className="text-2xl leading-9 font-light">{data.verdict}</Text>
          <Text>{data.summary}</Text>
        </Group>
      </Section>

      <Section title="核心指标" description="检查范围与问题口径">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={issuesKpi.value}
            unit={issuesKpi.unit}
            label={issuesKpi.label}
            note="高 1 · 中 2 · 低 1"
          />
          <Stat
            span={3}
            captionBelow
            value={pairsKpi.value}
            unit={pairsKpi.unit}
            label={pairsKpi.label}
            note="含日间与夜间"
          />
          <Stat
            span={3}
            captionBelow
            value={failKpi.value}
            unit={failKpi.unit}
            label={failKpi.label}
            note="未达 4.5:1"
            direction="down"
          />
          <Stat
            span={3}
            captionBelow
            value={confuseKpi.value}
            unit={confuseKpi.unit}
            label={confuseKpi.label}
            note="绿色盲下 ΔE 10.2"
          />
        </Grid>
      </Section>

      <Section title="模拟视图" description="原界面与三种色觉模拟">
        <FigureStrip>
          {data.screens.map((s) => (
            <Figure key={s.view}>
              <FigureImage src={s.image} alt={`${data.target} ${s.view}模拟`} />
              <FigureLabel>{s.view}</FigureLabel>
            </Figure>
          ))}
        </FigureStrip>
      </Section>

      <Section title="色板与检查" description="配色、混淆色、对比度与修复建议">
        <Group>
          <DataTable columns={paletteColumns} rows={data.palette} caption="配色" />
          <DataTable
            columns={confusionColumns}
            rows={confusionRows}
            caption="混淆色"
          />
          <DataTable
            columns={contrastColumns}
            rows={contrastRows}
            caption="对比度"
          />
          <DataTable columns={fixColumns} rows={fixRows} caption="修复" />
        </Group>
      </Section>

      <Section title="色觉类型" description="各色觉类型下的问题数">
        <Grid cols={9}>
          <Block span={3} rows={1} title="按色觉类型的问题数">
            <ProgressList
              compact
              items={data.byType.map((t) => ({
                label: t.type,
                value: t.issues,
                max: 4,
                display: `${t.issues} 个`,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="问题清单" description="共 4 个问题,1 高、2 中、1 低">
        <DataTable columns={issueColumns} rows={issueRows} />
      </Section>

      <Section
        title="改进建议"
        description="按问题优先级给出的修改方案"
        className="gap-12"
      >
        <List
          numbered
          columns={3}
          items={data.issues.map((i) => ({
            title: i.title,
            description: i.suggestion,
          }))}
        />
      </Section>

      <Section title="背景信息" description="检查对象、依据与模拟方法">
        <KV
          labelCols={2}
          items={[
            { label: "产品 / 页面", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "依据标准", value: data.standard },
            {
              label: "模拟视图",
              value: data.screens.map((s) => s.view).join("、"),
            },
            { label: "模拟方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
