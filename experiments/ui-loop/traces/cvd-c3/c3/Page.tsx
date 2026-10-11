import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
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

// 颜色值一律写成「名称 色值」,名称取 palette 里 hex 相同的 name,
// 同一色值多个名称用「/」相连,palette 里找不到的只写 hex
const colorLabel = (hex: string) => {
  const names = data.palette
    .filter((p) => p.hex.toLowerCase() === hex.toLowerCase())
    .map((p) => p.name)
  return names.length ? `${names.join("/")} ${hex}` : hex
}

// contrast / fixes 的问题编号:location 与该行 where 相同或互相包含
const issueIds = (where: string) => {
  const ids = data.issues
    .filter(
      (i) =>
        i.location === where ||
        i.location.includes(where) ||
        where.includes(i.location),
    )
    .map((i) => i.id)
  return ids.length ? ids.join("、") : "—"
}

type Confusion = (typeof data.confusions)[number]
const confusionValue = (c: Confusion, key: string) =>
  (c as unknown as Record<string, number>)[key].toFixed(1)
// 属于该行 affected 的色差值标红
const confusionTone = (key: string) =>
  data.confusions.filter((c) => c.affected.includes(key)).map((c) => confusionValue(c, key))

type FixRow = {
  where: string
  bg: string
  from: string
  to: string
  before: number
  after: number
}
const fixes = ((data as unknown as Record<string, unknown>).fixes ?? []) as FixRow[]

export default function Report() {
  const kpi = (key: string) => data.kpis.find((k) => k.key === key)!

  const paletteColumns = [
    { key: "name", label: "名称", span: 2 },
    { key: "hex", label: "色值", span: 2 },
    { key: "usage", label: "用途", span: 5 },
  ]

  const paletteRows = data.palette.map((p) => ({
    name: p.name,
    hex: p.hex,
    usage: p.usage,
  }))

  const confusionColumns = [
    { key: "where", label: "位置", span: 2 },
    { key: "colors", label: "颜色对", span: 2 },
    { key: "normal", label: "正常", align: "right" as const, span: 1 },
    { key: "protan", label: "红色盲", align: "right" as const, span: 1, tone: confusionTone("红色盲") },
    { key: "deutan", label: "绿色盲", align: "right" as const, span: 1, tone: confusionTone("绿色盲") },
    { key: "tritan", label: "蓝色盲", align: "right" as const, span: 1, tone: confusionTone("蓝色盲") },
    { key: "affected", label: "受影响", span: 1 },
  ]

  const confusionRows = data.confusions.map((c) => ({
    where: c.where,
    colors: c.colors.map(colorLabel).join("/"),
    normal: c.normal.toFixed(1),
    protan: c["红色盲"].toFixed(1),
    deutan: c["绿色盲"].toFixed(1),
    tritan: c["蓝色盲"].toFixed(1),
    affected: c.affected.length ? c.affected.join("、") : "—",
  }))

  const contrastColumns = [
    { key: "id", label: "问题编号", span: 1 },
    { key: "where", label: "位置", span: 2 },
    { key: "fg", label: "文字色", span: 1 },
    { key: "bg", label: "背景色", span: 1 },
    { key: "ratio", label: "对比度", align: "right" as const, span: 1 },
    { key: "required", label: "要求", align: "right" as const, span: 1 },
    { key: "result", label: "结果", span: 2, tone: ["不达标"] },
  ]

  const contrastRows = data.contrast.map((c) => ({
    id: issueIds(c.where),
    where: c.where,
    fg: colorLabel(c.fg),
    bg: colorLabel(c.bg),
    ratio: c.ratio.toFixed(2),
    required: c.required.toFixed(1),
    result: c.pass ? "达标" : "不达标",
  }))

  const fixColumns = [
    { key: "id", label: "问题编号", span: 1 },
    { key: "where", label: "位置", span: 2 },
    { key: "bg", label: "背景色", span: 1 },
    { key: "from", label: "原色", span: 1 },
    { key: "to", label: "修正色", span: 1 },
    { key: "before", label: "修复前", align: "right" as const, span: 1 },
    { key: "after", label: "修复后", align: "right" as const, span: 2 },
  ]

  const fixRows = fixes.map((f) => ({
    id: issueIds(f.where),
    where: f.where,
    bg: colorLabel(f.bg),
    from: colorLabel(f.from),
    to: f.from === f.to ? "不变" : colorLabel(f.to),
    before: f.before.toFixed(2),
    after: f.after.toFixed(2),
  }))

  const issueColumns = [
    { key: "id", label: "编号", span: 1 },
    { key: "title", label: "问题", span: 3 },
    { key: "type", label: "类型", span: 1 },
    { key: "location", label: "位置", span: 1 },
    { key: "severity", label: "严重度", span: 1, tone: ["高"] },
    { key: "affects", label: "影响人群", span: 2 },
  ]

  const issueRows = data.issues.map((i) => ({
    id: i.id,
    title: i.title,
    type: i.type,
    location: i.location,
    severity: i.severity,
    affects: i.affects.length ? i.affects.join("、") : "—",
  }))

  const suggestionItems = data.issues.map((i) => ({
    title: i.suggestion,
    description: `${i.id} · ${i.title}`,
  }))

  return (
    <Page title={data.title} meta={[data.target, `${data.date} · ${data.standard}`]}>
      <Section title="结论" description={`判定:${data.verdict} · 标准 ${data.standard}`}>
        <Text className="text-2xl leading-9 font-light">{`${data.verdict}:${data.summary}`}</Text>
      </Section>

      <Section title="核心指标" description="检查规模与问题数">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat span={3} size="lg" value={kpi("issues").value} unit={kpi("issues").unit} captionBelow label={kpi("issues").label} />
          <Stat span={3} value={kpi("fail").value} unit={kpi("fail").unit} captionBelow label={kpi("fail").label} />
          <Stat span={3} value={kpi("confuse").value} unit={kpi("confuse").unit} captionBelow label={kpi("confuse").label} />
          <Stat span={3} value={kpi("pairs").value} unit={kpi("pairs").unit} captionBelow label={kpi("pairs").label} />
        </Grid>
      </Section>

      <Section title="模拟视图" description="原界面与三种色觉模拟下的同一屏">
        <FigureStrip>
          {data.screens.map((s) => (
            <Figure key={s.view}>
              <FigureImage src={s.image} alt={s.view} />
              <FigureLabel>{s.view}</FigureLabel>
            </Figure>
          ))}
        </FigureStrip>
      </Section>

      <Section
        title="色板与检查"
        description="配色、混淆色、对比度与色值修正"
        className="gap-12"
      >
        {paletteRows.length > 0 && (
          <Group title="配色">
            <DataTable columns={paletteColumns} rows={paletteRows} />
          </Group>
        )}

        {confusionRows.length > 0 && (
          <Group title="混淆色 · ΔE<12 标红">
            <DataTable columns={confusionColumns} rows={confusionRows} />
          </Group>
        )}

        {contrastRows.length > 0 && (
          <Group title="对比度">
            <DataTable columns={contrastColumns} rows={contrastRows} />
          </Group>
        )}

        {fixRows.length > 0 && (
          <Group title="色值修正">
            <DataTable columns={fixColumns} rows={fixRows} />
          </Group>
        )}
      </Section>

      <Section title="拆分" description="按色觉类型拆分受影响的问题" className="gap-12">
        <Group title="受影响的问题数(按色觉类型)">
          <Grid cols={9} fields={false} className="items-baseline">
            {data.byType.map((t) => (
              <Stat
                key={t.type}
                span={2}
                value={t.issues}
                unit="个"
                captionBelow
                label={t.type}
                note="受影响问题数"
              />
            ))}
          </Grid>
        </Group>
      </Section>

      <Section title="明细" description="每个问题的位置、严重度" className="gap-12">
        <Group title="问题清单">
          <DataTable columns={issueColumns} rows={issueRows} />
        </Group>
      </Section>

      <Section title="下一步" description="针对四个问题的修复建议">
        <List columns={3} numbered items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="检查对象、标准与模拟方法">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "标准", value: data.standard },
            { label: "模拟方法", value: data.method },
            { label: "检查视角", value: data.screens.map((s) => s.view).join("、") },
          ]}
        />
      </Section>
    </Page>
  )
}
