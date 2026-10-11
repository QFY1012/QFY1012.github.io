import data from "./data.json"
import {
  Page,
  Section,
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
  const d = data as any
  const kpis = d.kpis as any[]
  const palette = d.palette as any[]
  const contrast = d.contrast as any[]
  const confusions = d.confusions as any[]
  const byType = d.byType as any[]
  const issues = d.issues as any[]
  const fixes = d.fixes as any[]
  const screens = d.screens as any[]

  const confusionRows = confusions.map((c) => ({
    ...c,
    colors: c.colors.join(" / "),
    affected: c.affected.join("、"),
  }))

  const contrastRows = contrast.map((c) => ({
    ...c,
    result: c.pass ? "达标" : "不达标",
  }))

  const issueItems = issues.map((i) => ({
    title: `${i.id} · ${i.title}`,
    description: [
      i.location,
      i.type,
      i.affects.length ? `影响${i.affects.join("、")}` : "",
      `建议:${i.suggestion}`,
    ]
      .filter(Boolean)
      .join(" · "),
    meta: i.severity,
  }))

  return (
    <Page title={d.title} meta={[d.target, d.date, d.standard]}>
      <Section title="结论" description="按 WCAG 2.2 AA 与 Machado 2009 模拟判定">
        <Text className="text-2xl leading-9 font-light">{`整体判定:${d.verdict}。${d.summary}`}</Text>
      </Section>

      <Section title="核心指标" description="10 组文字与背景组合的检查结果">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              size="lg"
              value={k.value}
              unit={k.unit}
              label={k.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="配色" description="看板图表使用的 8 个系列色">
        <DataTable
          columns={[
            { key: "name", label: "系列", span: 3 },
            { key: "hex", label: "色值", span: 3 },
            { key: "usage", label: "用途", span: 3 },
          ]}
          rows={palette}
        />
      </Section>

      <Section
        title="颜色混淆"
        description="CIEDE2000 ΔE,小于 12 视为难以区分"
        className="gap-12"
      >
        <DataTable
          columns={[
            { key: "where", label: "颜色对", span: 2 },
            { key: "colors", label: "色值", span: 2 },
            { key: "normal", label: "正常", span: 1, align: "right" },
            { key: "红色盲", label: "红色盲", span: 1, align: "right" },
            { key: "绿色盲", label: "绿色盲", span: 1, align: "right" },
            { key: "蓝色盲", label: "蓝色盲", span: 1, align: "right" },
            { key: "affected", label: "受影响", span: 1 },
          ]}
          rows={confusionRows}
        />
        <Grid cols={9}>
          <Block span={3} title="受影响问题数">
            <ProgressList
              compact
              items={byType.map((t) => ({
                label: t.type,
                value: t.issues,
                max: issues.length,
                display: `${t.issues} 个`,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="对比度" description="逐项实测值与 WCAG 2.2 AA 要求">
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 3 },
            { key: "fg", label: "文字色", span: 1 },
            { key: "bg", label: "背景色", span: 1 },
            { key: "ratio", label: "实测", span: 1, align: "right" },
            { key: "required", label: "要求", span: 1, align: "right" },
            { key: "result", label: "判定", span: 2, tone: ["不达标"] },
          ]}
          rows={contrastRows}
        />
      </Section>

      <Section title="问题清单" description="6 个问题,含位置、影响人群与建议">
        <List columns={3} metaTone="destructive" items={issueItems} />
      </Section>

      <Section title="修复建议" description="调整后的对比度达到 AA 要求">
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 2 },
            { key: "from", label: "原色", span: 2 },
            { key: "to", label: "建议色", span: 2 },
            { key: "bg", label: "底色", span: 1 },
            { key: "before", label: "修复前", span: 1, align: "right" },
            { key: "after", label: "修复后", span: 1, align: "right" },
          ]}
          rows={fixes}
        />
      </Section>

      <Section title="背景信息" description="检查对象、口径与模拟方法">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: d.target },
            { label: "检查日期", value: d.date },
            { label: "遵循标准", value: d.standard },
            { label: "判定结论", value: d.verdict },
            { label: "模拟方法", value: d.method },
            { label: "模拟视图", value: screens.map((s) => s.view).join("、") },
          ]}
        />
      </Section>
    </Page>
  )
}
