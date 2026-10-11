import data from "./data.json"
import { Page, Section, Group, Grid, Text, Stat, DataTable, KV, FigureStrip, Figure, FigureImage, FigureLabel } from "@/components/report"

const KPI_NOTES: Record<string, string> = {
  pairs: "覆盖 14 个颜色 token",
  fail: "共检查 18 组文字与背景组合",
  confuse: "success 与 error、warning 与 success",
  issues: "详见问题",
}

export default function Report() {
  const kpi = (key: string) => data.kpis.find((k) => k.key === key)!

  // A color value always reads as "name hex" when the name is in the palette.
  const colorLabel = (hex: string) => {
    const name = data.palette.find((p) => p.hex.toUpperCase() === hex.toUpperCase())?.name
    return name ? `${name} ${hex}` : hex
  }
  // The ΔE cells the row's affected types call out, so they can be toned.
  const confusionTone = (type: string) =>
    data.confusions
      .filter((c) => c.affected.includes(type))
      .map((c) => String((c as Record<string, unknown>)[type]))

  const paletteRows = data.palette.map((p) => ({
    name: p.name,
    hex: p.hex,
    usage: p.usage,
  }))

  const confusionRows = data.confusions.map((c) => ({
    where: c.where,
    pair: c.colors.map(colorLabel).join("/"),
    normal: c.normal,
    红色盲: c["红色盲"],
    绿色盲: c["绿色盲"],
    蓝色盲: c["蓝色盲"],
    affected: c.affected.join("、"),
  }))

  const contrastRows = data.contrast.map((c) => ({
    where: c.where,
    fg: colorLabel(c.fg),
    bg: colorLabel(c.bg),
    ratio: c.ratio,
    required: c.required,
    result: c.pass ? "达标" : "不达标",
  }))

  const issueRows = data.issues.map((i) => ({
    id: i.id,
    title: i.title,
    location: i.location,
    severity: i.severity,
    suggestion: i.suggestion,
  }))

  const fixRows = data.fixes.map((f) => ({
    where: f.where,
    from: colorLabel(f.from),
    to: colorLabel(f.to),
    bg: colorLabel(f.bg),
    before: f.before,
    after: f.after,
  }))

  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description="检查范围与总体判断">
        <Text className="text-2xl leading-9 font-light">
          {`整体判定:${data.verdict}。${data.summary}`}
        </Text>
      </Section>

      <Section title="核心指标" description="本次检查的总体计数">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={kpi("pairs").value}
            unit={kpi("pairs").unit}
            label={kpi("pairs").label}
            captionBelow
            note={KPI_NOTES.pairs}
          />
          <Stat
            span={3}
            value={kpi("fail").value}
            unit={kpi("fail").unit}
            label={kpi("fail").label}
            captionBelow
            size="lg"
            direction="down"
            note={KPI_NOTES.fail}
          />
          <Stat
            span={3}
            value={kpi("confuse").value}
            unit={kpi("confuse").unit}
            label={kpi("confuse").label}
            captionBelow
            note={KPI_NOTES.confuse}
          />
          <Stat
            span={3}
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
            captionBelow
            note={KPI_NOTES.issues}
          />
        </Grid>
      </Section>

      <Section title="模拟视图" description="原界面与三种色盲模拟下的色板">
        <FigureStrip>
          {data.screens.map((s) => (
            <Figure key={s.view}>
              <FigureImage src={s.image} alt={`${s.view}下的色板模拟`} />
              <FigureLabel>{s.view}</FigureLabel>
            </Figure>
          ))}
        </FigureStrip>
      </Section>

      <Section title="色板与检查" description="配色、混淆色、对比度与修复四项检查">
        <Group>
          <DataTable
            caption="配色"
            columns={[
              { key: "name", label: "名称", span: 2 },
              { key: "hex", label: "色值", span: 2 },
              { key: "usage", label: "用途", span: 5 },
            ]}
            rows={paletteRows}
          />
          <DataTable
            caption="混淆色"
            columns={[
              { key: "where", label: "位置", span: 2 },
              { key: "pair", label: "颜色对", span: 2 },
              { key: "normal", label: "正常", span: 1, align: "right" },
              { key: "红色盲", label: "红色盲", span: 1, align: "right", tone: confusionTone("红色盲") },
              { key: "绿色盲", label: "绿色盲", span: 1, align: "right", tone: confusionTone("绿色盲") },
              { key: "蓝色盲", label: "蓝色盲", span: 1, align: "right", tone: confusionTone("蓝色盲") },
              { key: "affected", label: "受影响", span: 1 },
            ]}
            rows={confusionRows}
          />
          <DataTable
            caption="对比度"
            columns={[
              { key: "where", label: "位置", span: 3 },
              { key: "fg", label: "文字色", span: 1 },
              { key: "bg", label: "背景色", span: 1 },
              { key: "ratio", label: "对比度", span: 1, align: "right" },
              { key: "required", label: "要求", span: 1, align: "right" },
              { key: "result", label: "结果", span: 2, tone: ["不达标"] },
            ]}
            rows={contrastRows}
          />
          <DataTable
            caption="修复"
            columns={[
              { key: "where", label: "位置", span: 2 },
              { key: "from", label: "原色", span: 1 },
              { key: "to", label: "建议色", span: 1 },
              { key: "bg", label: "背景", span: 1 },
              { key: "before", label: "修复前", span: 2, align: "right" },
              { key: "after", label: "修复后", span: 2, align: "right" },
            ]}
            rows={fixRows}
          />
        </Group>
      </Section>

      <Section title="色盲影响" description="各类型色盲下发现的问题数">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.byType.map((t) => (
            <Stat
              key={t.type}
              span={2}
              value={t.issues}
              unit="个"
              label={t.type}
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section title="问题" description="5 个问题,含混淆色与对比度不足两类">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "location", label: "位置", span: 2 },
            { key: "severity", label: "严重", span: 1, tone: ["高"] },
            { key: "suggestion", label: "建议", span: 2 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="背景信息" description="检查对象、依据、方法与时间">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "检查标准", value: data.standard },
            { label: "检查方法", value: data.method },
            { label: "检查日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
