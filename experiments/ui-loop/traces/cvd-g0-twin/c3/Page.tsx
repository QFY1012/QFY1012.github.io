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
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
} from "@/components/report"

export default function Report() {
  const main = data.kpis.find((k) => k.key === "issues")!
  const others = data.kpis.filter((k) => k.key !== "issues")

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
    result: c.pass ? "达标" : "不达标",
  }))

  const confusionRows = data.confusions.map((c) => ({
    where: c.where,
    normal: c.normal.toFixed(1),
    protan: c["红色盲"].toFixed(1),
    deuter: c["绿色盲"].toFixed(1),
    tritan: c["蓝色盲"].toFixed(1),
  }))

  const tone = (type: "红色盲" | "绿色盲" | "蓝色盲") =>
    data.confusions
      .filter((c) => c.affected.includes(type))
      .map((c) => c[type].toFixed(1))

  const issueRows = data.issues.map((i) => ({
    id: i.id,
    title: i.title,
    type: i.type,
    location: i.location,
    severity: i.severity,
    affects: i.affects.length ? i.affects.join("、") : "—",
  }))

  const steps = data.issues.map((i) => ({
    title: i.suggestion,
    description: `${i.id} · ${i.title}`,
  }))

  const typeItems = data.byType.map((t) => ({
    label: t.type,
    value: t.issues,
    max: main.value,
    display: `${t.issues} 个`,
  }))

  const background = [
    { label: "产品", value: data.target },
    { label: "报告日期", value: data.date },
    { label: "评估标准", value: data.standard },
    { label: "模拟方法", value: data.method },
    { label: "模拟视图", value: data.screens.map((s) => s.view).join("、") },
  ]

  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section
        title="结论"
        description={`评估标准 ${data.standard}`}
        className="gap-12"
      >
        <Text className="text-2xl leading-9 font-light">
          {`${data.verdict}。${data.summary}`}
        </Text>
        <Block title="色觉模拟" description={data.method}>
          <FigureStrip>
            {data.screens.map((s) => (
              <Figure key={s.view}>
                <FigureImage
                  src={s.image}
                  alt={`${data.target} ${s.view}模拟`}
                />
                <FigureLabel>{s.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
        </Block>
      </Section>

      <Section title="核心指标" description="检查范围与问题计数">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={main.value}
            unit={main.unit}
            label={main.label}
            captionBelow
          />
          {others.map((k) => (
            <Stat
              key={k.key}
              span={3}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              direction={k.key === "fail" ? "down" : undefined}
              note={
                k.key === "fail"
                  ? "低于 4.5:1"
                  : k.key === "confuse"
                    ? "ΔE 小于 12"
                    : undefined
              }
            />
          ))}
        </Grid>
      </Section>

      <Section title="配色" description="路况四级配色的色值与用途">
        <DataTable
          columns={[
            { key: "name", label: "颜色", span: 3 },
            { key: "hex", label: "色值", span: 2 },
            { key: "usage", label: "用途", span: 4 },
          ]}
          rows={paletteRows}
        />
      </Section>

      <Section
        title="混淆色对"
        description="Machado 2009 模拟下的 CIEDE2000 ΔE,小于 12 视为难以区分"
      >
        <Grid cols={9} fields={false}>
          <Block span={6} title="颜色对色差 ΔE">
            <DataTable
              caption="CIEDE2000 ΔE,小于 12 视为难以区分"
              columns={[
                { key: "where", label: "颜色对", span: 2 },
                { key: "normal", label: "常规", align: "right", span: 1 },
                {
                  key: "protan",
                  label: "红色盲",
                  align: "right",
                  span: 1,
                  tone: tone("红色盲"),
                },
                {
                  key: "deuter",
                  label: "绿色盲",
                  align: "right",
                  span: 1,
                  tone: tone("绿色盲"),
                },
                {
                  key: "tritan",
                  label: "蓝色盲",
                  align: "right",
                  span: 1,
                  tone: tone("蓝色盲"),
                },
              ]}
              rows={confusionRows}
            />
          </Block>
          <Block span={3} title="按色觉类型的问题数">
            <ProgressList compact items={typeItems} />
          </Block>
        </Grid>
      </Section>

      <Section title="对比度" description="文字与背景对比度,要求 4.5:1">
        <DataTable
          columns={[
            { key: "where", label: "场景", span: 3 },
            { key: "fg", label: "前景", span: 1 },
            { key: "bg", label: "背景", span: 1 },
            { key: "ratio", label: "对比度", align: "right", span: 1 },
            { key: "required", label: "要求", align: "right", span: 1 },
            { key: "result", label: "结论", span: 2, tone: ["不达标"] },
          ]}
          rows={contrastRows}
        />
      </Section>

      <Section title="问题明细" description="四项问题的类型、位置与影响">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "type", label: "类型", span: 1 },
            { key: "location", label: "位置", span: 1 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "affects", label: "影响", span: 2 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="针对每项问题的修改建议">
        <List items={steps} columns={3} numbered />
      </Section>

      <Section title="背景信息" description="评估范围、标准与方法">
        <KV items={background} labelCols={2} />
      </Section>
    </Page>
  )
}
