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
} from "@/components/report"

export default function Report() {
  const kpi = (key: string) => data.kpis.find((k) => k.key === key)!

  const paletteItems = data.palette.map((p) => ({
    title: p.name,
    description: `${p.hex} · ${p.usage}`,
  }))

  const contrastItems = data.contrast.map((c) => ({
    label: c.where,
    value: c.ratio,
    max: 12,
    display: c.ratio.toFixed(2),
  }))

  const confusionColumns = [
    { key: "pair", label: "颜色组合", span: 3 },
    { key: "normal", label: "正常视觉", align: "right" as const, span: 1 },
    { key: "protan", label: "红色盲", align: "right" as const, span: 1, tone: ["8.9"] },
    { key: "deutan", label: "绿色盲", align: "right" as const, span: 1, tone: ["8.2"] },
    { key: "tritan", label: "蓝色盲", align: "right" as const, span: 1 },
    { key: "affected", label: "难以区分的人群", span: 2 },
  ]

  const confusionRows = data.confusions.map((c) => ({
    pair: c.where,
    normal: c.normal.toFixed(1),
    protan: c["红色盲"].toFixed(1),
    deutan: c["绿色盲"].toFixed(1),
    tritan: c["蓝色盲"].toFixed(1),
    affected: c.affected.length ? c.affected.join("、") : "—",
    affectedCount: c.affected.length,
  }))

  const contrastColumns = [
    { key: "where", label: "文字位置", span: 3 },
    { key: "fg", label: "文字色", span: 1 },
    { key: "bg", label: "底色", span: 1 },
    { key: "ratio", label: "对比度", align: "right" as const, span: 2 },
    { key: "required", label: "要求", align: "right" as const, span: 1 },
    { key: "result", label: "结果", span: 1, tone: ["不达标"] },
  ]

  const contrastRows = data.contrast.map((c) => ({
    where: c.where,
    fg: c.fg,
    bg: c.bg,
    ratio: c.ratio.toFixed(2),
    required: c.required.toFixed(1),
    result: c.pass ? "达标" : "不达标",
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
    <Page title={data.title} meta={[data.target, data.date]}>
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

      <Section
        title="拆分"
        description="按色觉类型、文字对比度与颜色组合拆分"
        className="gap-12"
      >
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

        <Group title="文字与背景对比度 / 路况配色">
          <Grid cols={9}>
            <Block span={3} rows={2} title="对比度(要求 4.5)">
              <ProgressList compact items={contrastItems} />
            </Block>
            <Block span={6} rows={2} title="路况配色">
              <List items={paletteItems} />
            </Block>
          </Grid>
        </Group>

        <Group title="颜色组合的色差 ΔE">
          <DataTable
            columns={confusionColumns}
            rows={confusionRows}
            caption="色差为 CIEDE2000 ΔE,小于 12 视为难以区分"
          />
        </Group>
      </Section>

      <Section title="明细" description="每个问题的位置、严重度与影响人群">
        <DataTable columns={issueColumns} rows={issueRows} />
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
