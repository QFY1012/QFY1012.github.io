import data from "./data.json"
import { Page, Section, Group, Grid, Block, Text, Stat, DataTable, List, KV, FigureStrip, Figure, FigureImage, FigureLabel } from "@/components/report"

const kpis: Record<string, { label: string; value: number; unit: string }> = Object.fromEntries(
  data.kpis.map((k) => [k.key, k]),
)

const palette: any[] = data.palette ?? []
const confusions: any[] = data.confusions ?? []
const contrast: any[] = data.contrast ?? []
const fixes: any[] = (data as any).fixes ?? []

// 色值一律写成「名称 色值」,名称取 palette 里 hex 相同的 name,同名多个用「/」相连
const namesOfHex = new Map<string, string[]>()
for (const p of palette) {
  const key = String(p.hex).toLowerCase()
  namesOfHex.set(key, [...(namesOfHex.get(key) ?? []), p.name])
}
const colorName = (hex: string) => {
  const names = namesOfHex.get(String(hex).toLowerCase())
  return names && names.length > 0 ? `${names.join("/")} ${hex}` : hex
}

// 问题编号:issues 里 location 与该行 where 相同或互相包含的条目 id
const issueIdsAt = (where: string) =>
  data.issues
    .filter((i) => i.location === where || i.location.includes(where) || where.includes(i.location))
    .map((i) => i.id)
const idsCell = (where: string) => {
  const ids = issueIdsAt(where)
  return ids.length > 0 ? ids.join("、") : "—"
}

const confusionRows = confusions.map((c) => ({
  where: c.where,
  colors: (c.colors as string[]).map(colorName).join("/"),
  normal: Number(c.normal).toFixed(1),
  protan: Number(c["红色盲"]).toFixed(1),
  deuter: Number(c["绿色盲"]).toFixed(1),
  tritan: Number(c["蓝色盲"]).toFixed(1),
  affected: (c.affected as string[]).length > 0 ? (c.affected as string[]).join("、") : "—",
}))

// 该列里属于本行 affected 的色差数值标红
const toneFor = (type: string) =>
  confusions.filter((c) => ((c.affected as string[]) ?? []).includes(type)).map((c) => Number(c[type]).toFixed(1))

const contrastRows = contrast.map((c) => ({
  id: idsCell(c.where),
  where: c.where,
  fg: colorName(c.fg),
  bg: colorName(c.bg),
  ratio: Number(c.ratio).toFixed(2),
  required: String(c.required),
  result: c.pass ? "达标" : "不达标",
}))

const fixRows = fixes.map((f) => ({
  id: idsCell(f.where),
  where: f.where,
  bg: colorName(f.bg),
  from: colorName(f.from),
  to: f.from === f.to ? "不变" : colorName(f.to),
  before: String(f.before),
  after: String(f.after),
}))

const issueRows = data.issues.map((i) => ({
  id: i.id,
  title: i.title,
  type: i.type,
  location: i.location,
  severity: i.severity,
}))

const suggestionRows = data.issues.map((i) => ({
  id: i.id,
  affects: i.affects.length > 0 ? i.affects.join("、") : "—",
  suggestion: i.suggestion,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={`依据 ${data.standard} 检查`}>
        <Text className="text-2xl leading-9 font-light">{`${data.verdict}:${data.summary}`}</Text>
      </Section>

      <Section title="核心指标" description="本轮检查 9 组文字与底色组合的结果">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpis.fail.value}
            unit={kpis.fail.unit}
            label={kpis.fail.label}
            note="要求 ≥ 4.5:1"
            direction="down"
          />
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
            value={kpis.confuse.value}
            unit={kpis.confuse.unit}
            label={kpis.confuse.label}
          />
          <Stat
            span={3}
            captionBelow
            value={kpis.issues.value}
            unit={kpis.issues.unit}
            label={kpis.issues.label}
          />
        </Grid>
      </Section>

      <Section title="模拟视图" description="按 Machado 2009 模型模拟出的屏幕">
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

      <Section
        title="色板与检查"
        description="配色、混淆色与对比度检查结果"
        className="gap-12"
      >
        {palette.length > 0 && (
          <Group title="配色">
            <DataTable
              columns={[
                { key: "name", label: "名称", span: 2 },
                { key: "hex", label: "色值", span: 2 },
                { key: "usage", label: "用途", span: 5 },
              ]}
              rows={palette.map((p) => ({ name: p.name, hex: p.hex, usage: p.usage }))}
            />
          </Group>
        )}
        {confusions.length > 0 && (
          <Group title="混淆色 · ΔE<12 标红">
            <DataTable
              columns={[
                { key: "where", label: "位置", span: 2 },
                { key: "colors", label: "颜色对", span: 2 },
                { key: "normal", label: "正常", align: "right", span: 1 },
                { key: "protan", label: "红色盲", align: "right", span: 1, tone: toneFor("红色盲") },
                { key: "deuter", label: "绿色盲", align: "right", span: 1, tone: toneFor("绿色盲") },
                { key: "tritan", label: "蓝色盲", align: "right", span: 1, tone: toneFor("蓝色盲") },
                { key: "affected", label: "受影响", span: 1 },
              ]}
              rows={confusionRows}
            />
          </Group>
        )}
        {contrast.length > 0 && (
          <Group title="对比度">
            <DataTable
              columns={[
                { key: "id", label: "问题编号", span: 1 },
                { key: "where", label: "位置", span: 2 },
                { key: "fg", label: "文字色", span: 1 },
                { key: "bg", label: "背景色", span: 1 },
                { key: "ratio", label: "对比度", align: "right", span: 1 },
                { key: "required", label: "要求", align: "right", span: 1 },
                { key: "result", label: "结果", span: 2, tone: ["不达标"] },
              ]}
              rows={contrastRows}
            />
          </Group>
        )}
        {fixes.length > 0 && (
          <Group title="色值修正">
            <DataTable
              columns={[
                { key: "id", label: "问题编号", span: 1 },
                { key: "where", label: "位置", span: 2 },
                { key: "bg", label: "背景色", span: 1 },
                { key: "from", label: "原色", span: 1 },
                { key: "to", label: "修正色", span: 1 },
                { key: "before", label: "修复前", align: "right", span: 1 },
                { key: "after", label: "修复后", align: "right", span: 2 },
              ]}
              rows={fixRows}
            />
          </Group>
        )}
      </Section>

      <Section title="问题清单" description="7 个问题与对应的修改建议" className="gap-12">
        <Group title="问题">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "title", label: "问题", span: 3 },
              { key: "type", label: "类型", span: 2 },
              { key: "location", label: "位置", span: 2 },
              { key: "severity", label: "严重", span: 1, tone: ["高"] },
            ]}
            rows={issueRows}
          />
        </Group>
        <Group title="修改建议">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "affects", label: "受影响色觉类型", span: 4 },
              { key: "suggestion", label: "建议", span: 4 },
            ]}
            rows={suggestionRows}
          />
        </Group>
      </Section>

      <Section title="下一步" description="优先处理的三件事">
        <List
          columns={3}
          numbered
          items={[
            {
              title: "加深文字对比度",
              description: "格子改为浅色底配深色字,对比度达到 4.5:1。",
            },
            {
              title: "补上文字标签",
              description: "每个格子左上角写类别简称,考试格子加图标与倒计时。",
            },
            {
              title: "精简配色数量",
              description: "合并为 5 个以内,其余用文字标签,易混的两类换色或加边框。",
            },
          ]}
        />
      </Section>

      <Section title="背景信息" description="检查对象、依据与方法">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "依据标准", value: data.standard },
            { label: "检查方法", value: data.method },
            { label: "模拟视图", value: data.screens.map((s) => s.view).join("、") },
          ]}
        />
      </Section>
    </Page>
  )
}
