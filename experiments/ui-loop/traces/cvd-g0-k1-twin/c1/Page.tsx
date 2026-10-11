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

const d1 = (v: number) => v.toFixed(1)

export default function Report() {
  const mainKpi = data.kpis.find((k) => k.key === "issues")!
  const otherKpis = data.kpis.filter((k) => k.key !== "issues")

  const kpiValue = (key: string) => {
    const k = data.kpis.find((x) => x.key === key)
    return k ? `${k.value} ${k.unit}` : "—"
  }

  const lowTone = (key: "红色盲" | "绿色盲" | "蓝色盲") =>
    data.confusions.filter((c) => c[key] < 12).map((c) => d1(c[key]))

  const contrastRows = data.contrast.map((c) => ({
    where: c.where,
    fg: c.fg,
    bg: c.bg,
    ratio: d1(c.ratio),
    required: d1(c.required),
    result: c.pass ? "达标" : "不达标",
  }))

  const confusionRows = data.confusions.map((c) => ({
    where: `${c.where}(${c.colors.join(" / ")})`,
    normal: d1(c.normal),
    protan: d1(c["红色盲"]),
    deuter: d1(c["绿色盲"]),
    tritan: d1(c["蓝色盲"]),
    affected: c.affected.join("、"),
  }))

  const issueRows = data.issues.map((i) => ({
    id: i.id,
    title: i.title,
    meta: `${i.type} · ${i.location} · ${i.affects.length ? i.affects.join("、") : "—"}`,
    severity: i.severity,
  }))

  const fixRows = data.fixes.map((f) => ({
    where: f.where,
    from: f.from,
    to: f.to,
    before: d1(f.before),
    after: d1(f.after),
  }))

  const paletteRows = data.palette.map((p) => ({
    name: p.name,
    hex: p.hex,
    usage: p.usage,
  }))

  const steps = data.issues.map((i) => ({
    title: `${i.id} · ${i.title}`,
    description: i.suggestion,
  }))

  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description="整体判定与主要发现">
        <Group>
          <Text className="text-2xl leading-9 font-light">{`整体判定:${data.verdict}`}</Text>
          <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
        </Group>
      </Section>

      <Section title="核心指标" description="按 WCAG 2.2 AA 口径统计">
        <Group>
          <Stat
            size="lg"
            captionBelow
            value={mainKpi.value}
            unit={mainKpi.unit}
            label={mainKpi.label}
          />
          <Grid cols={9} fields={false} className="items-baseline">
            {otherKpis.map((k) => (
              <Stat
                key={k.key}
                span={3}
                captionBelow
                value={k.value}
                unit={k.unit}
                label={k.label}
              />
            ))}
          </Grid>
        </Group>
      </Section>

      <Section title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照">
        <FigureStrip>
          {data.screens.map((s) => (
            <Figure key={s.view}>
              <FigureImage src={s.image} alt={`${data.target} · ${s.view}`} />
              <FigureLabel>{s.view}</FigureLabel>
            </Figure>
          ))}
        </FigureStrip>
      </Section>

      <Section title="调色板" description="看板首页使用的 8 个系列色">
        <Group title="系列色">
          <DataTable
            columns={[
              { key: "name", label: "系列", span: 2 },
              { key: "hex", label: "色值", span: 2 },
              { key: "usage", label: "用途", span: 5 },
            ]}
            rows={paletteRows}
          />
        </Group>
      </Section>

      <Section title="分色盲类型" description="每种色盲类型命中的问题数">
        <Grid cols={9}>
          <Block span={3} title="命中问题数">
            <ProgressList
              compact
              items={data.byType.map((t) => ({
                label: t.type,
                value: t.issues,
                max: 3,
                display: `${t.issues} 个`,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="对比度" description="文字与背景对比度,正文要求 4.5">
        <Group title="文字与背景组合">
          <DataTable
            caption="要求:正文与界面文字 4.5,图表网格标注 3.0;不达标的结论标红。"
            columns={[
              { key: "where", label: "位置", span: 2 },
              { key: "fg", label: "前景", span: 2 },
              { key: "bg", label: "背景", span: 2 },
              { key: "ratio", label: "对比度", span: 1, align: "right" },
              { key: "required", label: "要求", span: 1, align: "right" },
              { key: "result", label: "结论", span: 1, tone: ["不达标"] },
            ]}
            rows={contrastRows}
          />
        </Group>
      </Section>

      <Section title="混淆色对" description="色差 ΔE 小于 12 视为难以区分">
        <Group title="两两比较">
          <DataTable
            caption="色差为 CIEDE2000 ΔE,阈值 12;小于阈值的数值标红。"
            columns={[
              { key: "where", label: "位置 / 配色", span: 3 },
              { key: "normal", label: "原色差", span: 1, align: "right" },
              { key: "protan", label: "红色盲", span: 1, align: "right", tone: lowTone("红色盲") },
              { key: "deuter", label: "绿色盲", span: 1, align: "right", tone: lowTone("绿色盲") },
              { key: "tritan", label: "蓝色盲", span: 1, align: "right", tone: lowTone("蓝色盲") },
              { key: "affected", label: "受影响", span: 2 },
            ]}
            rows={confusionRows}
          />
        </Group>
      </Section>

      <Section title="明细" description="问题清单与严重度">
        <Group title="问题清单">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "title", label: "问题", span: 3 },
              { key: "meta", label: "类型 · 位置 · 受影响", span: 4 },
              { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            ]}
            rows={issueRows}
          />
        </Group>
      </Section>

      <Section title="下一步" description="处理建议与颜色调整" className="gap-12">
        <Group title="处理建议">
          <List numbered columns={3} items={steps} />
        </Group>
        <Group title="颜色调整">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 2 },
              { key: "from", label: "原色", span: 2 },
              { key: "to", label: "改为", span: 2 },
              { key: "before", label: "修复前", span: 1, align: "right" },
              { key: "after", label: "修复后", span: 1, align: "right" },
            ]}
            rows={fixRows}
          />
        </Group>
      </Section>

      <Section title="背景信息" description="分析对象、标准与方法">
        <KV
          labelCols={2}
          items={[
            { label: "分析对象", value: data.target },
            { label: "评估标准", value: data.standard },
            { label: "分析日期", value: data.date },
            { label: "分析方法", value: data.method },
            { label: "检查组合", value: kpiValue("pairs") },
            { label: "问题总数", value: kpiValue("issues") },
          ]}
        />
      </Section>
    </Page>
  )
}
