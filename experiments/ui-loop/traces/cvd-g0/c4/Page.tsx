import data from "./data.json"
import { Page, Section, Grid, Text, Stat, DataTable, List, KV } from "@/components/report"

const confusionRows = data.confusions.map((c) => ({
  where: c.where,
  colors: c.colors.join(" · "),
  normal: c.normal.toFixed(1),
  protan: c["红色盲"].toFixed(1),
  deuteran: c["绿色盲"].toFixed(1),
  tritan: c["蓝色盲"].toFixed(1),
  affected: c.affected.join("、"),
}))

const confusionColumns = [
  { key: "where", label: "颜色对", span: 2 },
  { key: "colors", label: "色值", span: 2 },
  { key: "normal", label: "正常视觉", align: "right" as const, span: 1 },
  { key: "protan", label: "红色盲", align: "right" as const, span: 1, tone: ["0.3"] },
  { key: "deuteran", label: "绿色盲", align: "right" as const, span: 1, tone: ["5.9", "8.2"] },
  { key: "tritan", label: "蓝色盲", align: "right" as const, span: 1 },
  { key: "affected", label: "难以区分", span: 1 },
]

const contrastRows = data.contrast.map((c) => ({
  where: c.where,
  fg: c.fg,
  bg: c.bg,
  ratio: c.ratio.toFixed(2),
  required: c.required.toFixed(1),
  result: c.pass ? "达标" : "不达标",
}))

const contrastColumns = [
  { key: "where", label: "场景", span: 3 },
  { key: "fg", label: "文字", span: 1 },
  { key: "bg", label: "背景", span: 1 },
  { key: "ratio", label: "对比度", align: "right" as const, span: 1 },
  { key: "required", label: "要求", align: "right" as const, span: 1 },
  { key: "result", label: "结果", span: 2, tone: ["不达标"] },
]

const paletteColumns = [
  { key: "name", label: "token", span: 3 },
  { key: "hex", label: "色值", span: 2 },
  { key: "usage", label: "用途", span: 4 },
]

const background = [
  { label: "检查对象", value: data.target },
  { label: "颜色 token", value: `${data.palette.length} 个` },
  { label: "检查组合", value: `${data.kpis[0].value} 组` },
  { label: "对比度标准", value: data.standard },
  { label: "模拟模型", value: "Machado 2009" },
  { label: "检查方法", value: data.method },
  { label: "报告日期", value: data.date },
]

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, `${data.date} · ${data.standard}`]}>
      <Section title="结论" description="14 个颜色 token、18 组组合的全量检查">
        <Text className="text-2xl leading-9 font-light">{`${data.verdict}。${data.summary}`}</Text>
      </Section>

      <Section title="核心指标" description="检查规模与问题数,单位依次为组、对、个">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              size={k.key === "fail" ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="易混淆" description="CIEDE2000 ΔE,低于 12 视为难以区分">
        <DataTable
          columns={confusionColumns}
          rows={confusionRows}
          caption="数值为各色觉类型模拟下的色差 ΔE,越小越难区分"
        />
      </Section>

      <Section title="分群" description="按色觉类型统计受影响的问题数">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.byType.map((t) => (
            <Stat key={t.type} span={2} value={t.issues} unit="个" label={t.type} captionBelow />
          ))}
        </Grid>
      </Section>

      <Section title="色板" description="14 个颜色 token 的色值与用途">
        <DataTable columns={paletteColumns} rows={data.palette} />
      </Section>

      <Section title="明细" description="18 组文字与背景组合,要求 4.5:1(大标题 3:1)">
        <DataTable columns={contrastColumns} rows={contrastRows} />
      </Section>

      <Section title="问题" description="5 个问题,含类型、位置与建议">
        <List
          columns={3}
          metaTone="destructive"
          items={data.issues.map((i) => ({
            title: `${i.id} ${i.title}`,
            description: `${i.type} · ${i.location} · ${i.suggestion}`,
            meta: i.severity,
          }))}
        />
      </Section>

      <Section title="下一步" description="调整后的取值与对比度">
        <List
          columns={3}
          numbered
          items={data.fixes.map((f) => ({
            title: f.where,
            description: `${f.from} → ${f.to}(底色 ${f.bg}),对比度 ${f.before} → ${f.after}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="检查对象、口径与依据">
        <KV labelCols={2} items={background} />
      </Section>
    </Page>
  )
}
