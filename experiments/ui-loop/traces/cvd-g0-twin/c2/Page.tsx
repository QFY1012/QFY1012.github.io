import data from "./data.json"
import { Page, Section, Group, Grid, Block, Text, Stat, DataTable, ProgressList, List, KV, FigureStrip, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"

const paletteRows = data.palette.map((p) => ({
  name: p.name,
  hex: p.hex,
  usage: p.usage,
}))

const contrastRows = data.contrast.map((c) => ({
  where: c.where,
  fg: c.fg,
  bg: c.bg,
  ratio: c.ratio.toFixed(2),
  required: c.required.toFixed(1),
  result: c.pass ? "通过" : "不达标",
}))

const confusionRows = data.confusions.map((c) => ({
  where: c.where,
  colors: c.colors.join(" 与 "),
  affected: c.affected.join("、"),
  min: Math.min(c["红色盲"], c["绿色盲"], c["蓝色盲"]).toFixed(1),
}))

const issueRows = data.issues.map((i) => ({
  id: i.id,
  title: i.title,
  type: i.type,
  location: i.location,
  affects: i.affects.length ? i.affects.join("、") : "—",
  severity: i.severity,
}))

const fixRows = data.fixes.map((f) => ({
  where: f.where,
  from: f.from,
  to: f.to,
  bg: f.bg,
  before: f.before.toFixed(2),
  after: f.after.toFixed(2),
}))

const typeCounts = data.byType.map((t) => {
  const notes = data.issues
    .filter((i) => i.affects.includes(t.type))
    .map((i) => i.type)
  return {
    type: t.type,
    issues: t.issues,
    note: notes.length ? notes.join(" · ") : "无明显问题",
  }
})

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date, data.standard]}>
      <Section title="结论" description={`检查口径:${data.standard};判定「${data.verdict}」`}>
        <Group>
          <Text className="text-2xl leading-9 font-light">{data.verdict}</Text>
          <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
        </Group>
      </Section>

      <Section title="核心指标" description="检查覆盖 6 组文字与背景、5 个品牌色,共 3 个问题">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat span={3} value={6} unit="组" label="检查的文字与背景组合" captionBelow note="覆盖 6 处界面文字" />
          <Stat span={3} value={1} unit="组" label="对比度不达标" captionBelow note="顶部白色标题 1.61:1" direction="down" />
          <Stat span={3} value={1} unit="对" label="色盲用户难以区分的颜色" captionBelow note="配送进度条红绿 · 绿色盲 ΔE 9.0" direction="down" />
          <Stat span={3} value={3} unit="个" label="问题总数" captionBelow note="中 2 个 · 低 1 个" />
        </Grid>
      </Section>

      <Section title="色觉模拟" description={`按 ${data.method.split(";")[0]} 模拟`}>
        <Group title="原界面与三种色觉模拟对照">
          <FigureStrip>
            {data.screens.map((s) => (
              <Figure key={s.view}>
                <FigureImage src={s.image} alt={`订单状态页 ${s.view}`} />
                <FigureLabel>{s.view}</FigureLabel>
                <FigureText>{s.view === "原界面" ? "未做模拟的原始界面" : `模拟${s.view}下的呈现`}</FigureText>
              </Figure>
            ))}
          </FigureStrip>
        </Group>
      </Section>

      <Section title="分群" description="按色觉类型统计问题数,并给出混淆色对的色差 ΔE" className="gap-12">
        <Grid cols={9} fields={false} className="items-baseline">
          {typeCounts.map((t) => (
            <Stat
              span={2}
              key={t.type}
              value={t.issues}
              unit="个"
              label={t.type}
              captionBelow
              note={t.note}
            />
          ))}
        </Grid>
        <Grid cols={9}>
          <Block span={3} rows={1} title="各色觉类型色差 ΔE" description="小于 12 视为难以区分">
            <ProgressList
              compact
              items={[
                { label: "正常视觉", value: 67.7, max: 70, display: "67.7" },
                { label: "红色盲", value: 16.4, max: 70, display: "16.4" },
                { label: "绿色盲", value: 9.0, max: 70, display: "9.0" },
                { label: "蓝色盲", value: 66.5, max: 70, display: "66.5" },
              ]}
            />
          </Block>
        </Grid>
        <Group title="混淆色对">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 3 },
              { key: "colors", label: "色对", span: 3 },
              { key: "affected", label: "受影响色型", span: 2 },
              { key: "min", label: "最低 ΔE", span: 1, align: "right" },
            ]}
            rows={confusionRows}
            caption="色差为 CIEDE2000 ΔE,小于 12 视为难以区分"
          />
        </Group>
      </Section>

      <Section title="明细" description="色板、对比度检查、问题清单与修复示例" className="gap-12">
        <Group title="品牌色板">
          <DataTable
            columns={[
              { key: "name", label: "名称", span: 3 },
              { key: "hex", label: "色值", span: 3 },
              { key: "usage", label: "用途", span: 3 },
            ]}
            rows={paletteRows}
          />
        </Group>
        <Group title="对比度检查">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 3 },
              { key: "fg", label: "前景", span: 1 },
              { key: "bg", label: "背景", span: 1 },
              { key: "ratio", label: "对比度", span: 2, align: "right" },
              { key: "required", label: "要求", span: 1, align: "right" },
              { key: "result", label: "结果", span: 1, tone: ["不达标"] },
            ]}
            rows={contrastRows}
            caption="对比度按 WCAG 2.2 AA 计算,正文要求 4.5:1、大字要求 3.0:1"
          />
        </Group>
        <Group title="问题清单">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "title", label: "问题", span: 4 },
              { key: "type", label: "类型", span: 1 },
              { key: "location", label: "位置", span: 1 },
              { key: "affects", label: "影响人群", span: 1 },
              { key: "severity", label: "严重度", span: 1 },
            ]}
            rows={issueRows}
          />
        </Group>
        <Group title="修复示例">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 3 },
              { key: "from", label: "原色", span: 1 },
              { key: "to", label: "改后", span: 1 },
              { key: "bg", label: "背景", span: 1 },
              { key: "before", label: "修复前", span: 1, align: "right" },
              { key: "after", label: "修复后", span: 2, align: "right" },
            ]}
            rows={fixRows}
            caption="修复后对比度由 1.61:1 提升到 10.25:1,达到 WCAG 2.2 AA 要求"
          />
        </Group>
      </Section>

      <Section title="下一步" description="按问题清单给出三条修复建议">
        <List
          numbered
          columns={3}
          items={data.issues.map((i) => ({
            title: i.suggestion,
            description: `对应 ${i.id} · ${i.location} · ${i.type}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="检查对象、口径与方法">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "适用标准", value: data.standard },
            { label: "检查方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
