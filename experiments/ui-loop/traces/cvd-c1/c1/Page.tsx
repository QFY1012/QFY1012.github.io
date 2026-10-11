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

// The screenshots live in the workspace; Vite rewrites the glob to built asset URLs
// (with a hash), which is how the page shows them.
const shots = import.meta.glob("./assets/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>

const shot = (file: string) => shots[`./${file}`] ?? file

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

  // Every colour value on the page reads "名称 色值"; a hex that is not in the
  // palette has no name and stays a bare hex.
  const cname = (hex: string) => {
    const hit = palette.find((p) => String(p.hex).toUpperCase() === String(hex).toUpperCase())
    return hit ? `${hit.name} ${hex}` : hex
  }

  const paletteRows = palette.map((p) => ({
    name: p.name,
    hex: cname(p.hex),
    usage: p.usage,
  }))

  // The four colour-difference columns mark the rows their own 受影响 names.
  const toneFor = (type: string) =>
    confusions.filter((c) => (c.affected as string[]).includes(type)).map((c) => String(c[type]))

  const confusionRows = confusions.map((c) => ({
    where: c.where,
    colors: (c.colors as string[]).map(cname).join(" / "),
    normal: c.normal,
    红色盲: c["红色盲"],
    绿色盲: c["绿色盲"],
    蓝色盲: c["蓝色盲"],
    affected: (c.affected as string[]).join("、"),
  }))

  const contrastRows = contrast.map((c) => ({
    where: c.where,
    fg: cname(c.fg),
    bg: cname(c.bg),
    ratio: c.ratio,
    required: c.required,
    result: c.pass ? "达标" : "不达标",
  }))

  const fixRows = fixes.map((f) => ({
    where: f.where,
    from: cname(f.from),
    to: cname(f.to),
    bg: cname(f.bg),
    before: f.before,
    after: f.after,
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
              captionBelow
              value={k.value}
              unit={k.unit}
              label={k.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="模拟视图" description="原界面与三种色觉模拟下的对照">
        <FigureStrip>
          {screens.map((s) => (
            <Figure key={s.view}>
              <FigureImage src={shot(s.image)} alt={s.view} />
              <FigureLabel>{s.view}</FigureLabel>
            </Figure>
          ))}
        </FigureStrip>
      </Section>

      <Section title="色板与检查" description="8 个系列色,以及混淆、对比度、修复的逐项检查结果">
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
              { key: "colors", label: "颜色对", span: 2 },
              { key: "normal", label: "正常", span: 1, align: "right" },
              { key: "红色盲", label: "红色盲", span: 1, align: "right", tone: toneFor("红色盲") },
              { key: "绿色盲", label: "绿色盲", span: 1, align: "right", tone: toneFor("绿色盲") },
              { key: "蓝色盲", label: "蓝色盲", span: 1, align: "right", tone: toneFor("蓝色盲") },
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

      <Section title="影响人群" description="按色觉类型统计受影响的问题数">
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

      <Section title="问题清单" description="6 个问题,含位置、影响人群与建议">
        <List columns={3} metaTone="destructive" items={issueItems} />
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
