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

  const contrastColumns = [
    { key: "where", label: "位置", span: 2 },
    { key: "fg", label: "前景", span: 2 },
    { key: "bg", label: "背景", span: 2 },
    { key: "ratio", label: "对比度", align: "right", span: 1 },
    { key: "required", label: "要求", align: "right", span: 1 },
    { key: "result", label: "结果", span: 1, tone: ["不达标"] },
  ]
  const contrastRows = data.contrast.map((c) => ({
    where: c.where,
    fg: c.fg,
    bg: c.bg,
    ratio: c.ratio,
    required: c.required,
    result: c.pass ? "达标" : "不达标",
  }))

  const toneFor = (type: string, key: string) =>
    data.confusions.filter((c) => c.affected.includes(type)).map((c) => String(c[key]))

  const confusionColumns = [
    { key: "where", label: "位置", span: 3 },
    { key: "colors", label: "颜色对", span: 2 },
    { key: "normal", label: "正常", align: "right", span: 1 },
    { key: "protan", label: "红色盲", align: "right", span: 1, tone: toneFor("红色盲", "红色盲") },
    { key: "deutan", label: "绿色盲", align: "right", span: 1, tone: toneFor("绿色盲", "绿色盲") },
    { key: "tritan", label: "蓝色盲", align: "right", span: 1, tone: toneFor("蓝色盲", "蓝色盲") },
  ]
  const confusionRows = data.confusions.map((c) => ({
    where: c.where,
    colors: c.colors.join(" / "),
    normal: c.normal,
    protan: c["红色盲"],
    deutan: c["绿色盲"],
    tritan: c["蓝色盲"],
  }))

  const issueColumns = [
    { key: "title", label: "问题", span: 3 },
    { key: "place", label: "位置 · 类型", span: 3 },
    { key: "severity", label: "严重", span: 1, tone: ["高"] },
    { key: "affects", label: "影响", span: 2 },
  ]
  const issueRows = data.issues.map((i) => ({
    title: `${i.id} · ${i.title}`,
    place: `${i.location} · ${i.type}`,
    severity: i.severity,
    affects: i.affects.join("、") || "—",
  }))

  const fixColumns = [
    { key: "where", label: "位置", span: 2 },
    { key: "from", label: "原色", span: 2 },
    { key: "to", label: "改为", span: 2 },
    { key: "bg", label: "背景", span: 1 },
    { key: "before", label: "改前", align: "right", span: 1 },
    { key: "after", label: "改后", align: "right", span: 1 },
  ]
  const fixRows = data.fixes.map((f) => ({
    where: f.where,
    from: f.from,
    to: f.to,
    bg: f.bg,
    before: f.before,
    after: f.after,
  }))

  const kpiOrder = [
    ...data.kpis.filter((k) => k.key === "issues"),
    ...data.kpis.filter((k) => k.key !== "issues"),
  ]

  const steps = data.issues.map((i) => ({ title: i.title, description: i.suggestion }))

  const screenRows: (typeof data.screens)[] = []
  for (let i = 0; i < data.screens.length; i += 4) {
    screenRows.push(data.screens.slice(i, i + 4))
  }

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
      </Section>

      <Section title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照">
        <Group>
          {screenRows.map((row, index) => (
            <FigureStrip key={index}>
              {row.map((s) => (
                <Figure key={s.view}>
                  <FigureImage src={s.image} alt={s.view} />
                  <FigureLabel>{s.view}</FigureLabel>
                </Figure>
              ))}
            </FigureStrip>
          ))}
        </Group>
      </Section>

      <Section title="核心指标" description="对比度与色觉混淆统计">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpiOrder.map((k) => (
            <Stat key={k.key} span={2} size="lg" captionBelow value={k.value} unit={k.unit} label={k.label} />
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
          caption="色差为 CIEDE2000 ΔE;红色为该色觉类型下难以区分"
        />
      </Section>

      <Section title="对比度" description="文字与背景的对比度检查">
        <DataTable columns={contrastColumns} rows={contrastRows} />
      </Section>

      <Section title="问题" description="逐条列出问题、位置、类型与影响">
        <DataTable columns={issueColumns} rows={issueRows} />
      </Section>

      <Section title="下一步" description="颜色替换与逐条处理建议" className="gap-12">
        <Group title="颜色调整">
          <DataTable columns={fixColumns} rows={fixRows} />
        </Group>
        <Group title="按问题处理">
          <List columns={3} numbered items={steps} />
        </Group>
      </Section>

      <Section title="背景信息" description="分析口径与判定标准">
        <KV labelCols={2} items={facts} />
      </Section>
    </Page>
  )
}
