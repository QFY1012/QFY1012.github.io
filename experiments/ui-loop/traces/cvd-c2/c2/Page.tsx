import data from "./data.json"
import {
  Page,
  Section,
  Grid,
  Group,
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
  const failWhere = data.contrast
    .filter((c) => !c.pass)
    .map((c) => c.where)
    .join("、")
  const confuseWhere = data.confusions.map((c) => c.where).join("、")

  const kpis = data.kpis.map((k) => ({
    ...k,
    note: k.key === "fail" ? failWhere : k.key === "confuse" ? confuseWhere : undefined,
    direction:
      k.key === "fail" || k.key === "confuse" ? ("down" as const) : undefined,
  }))

  const fix = data.fixes[0]
  const views = data.screens.map((s) => s.view).join("、")

  const palette: any[] = data.palette ?? []
  const confusions: any[] = data.confusions ?? []
  const contrast: any[] = data.contrast ?? []
  const fixes: any[] = data.fixes ?? []

  const nameByHex = new Map<string, string>(
    palette.map((p) => [String(p.hex).toUpperCase(), p.name as string])
  )
  const colorLabel = (hex: string) => {
    const name = nameByHex.get(String(hex).toUpperCase())
    return name ? `${name} ${hex}` : hex
  }
  const fmt = (n: number) => n.toFixed(1)

  const confusionRows: any[] = confusions.map((c) => ({
    where: c.where as string,
    colors: `${colorLabel(c.colors[0])} / ${colorLabel(c.colors[1])}`,
    normal: fmt(c.normal),
    protan: fmt(c["红色盲"]),
    deutan: fmt(c["绿色盲"]),
    tritan: fmt(c["蓝色盲"]),
    affected:
      (c.affected as string[]).length > 0
        ? (c.affected as string[]).join("、")
        : "—",
    affectedList: (c.affected ?? []) as string[],
  }))

  const simKey: Record<string, string> = {
    正常: "normal",
    红色盲: "protan",
    绿色盲: "deutan",
    蓝色盲: "tritan",
  }
  const toneOf = (sim: string) =>
    confusionRows
      .filter((r) => r.affectedList.includes(sim))
      .map((r) => r[simKey[sim]])

  const contrastRows = contrast.map((c) => ({
    where: c.where as string,
    fg: colorLabel(c.fg),
    bg: colorLabel(c.bg),
    ratio: c.ratio,
    required: c.required.toFixed(1),
    result: c.pass ? "达标" : "不达标",
  }))

  const fixesRows = fixes.map((f) => ({
    where: f.where as string,
    from: colorLabel(f.from),
    to: colorLabel(f.to),
    bg: colorLabel(f.bg),
    before: f.before,
    after: f.after,
  }))

  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description="整体判断与摘要">
        <Text className="text-2xl leading-9 font-light">
          {`${data.verdict}:${data.summary}`}
        </Text>
      </Section>

      <Section title="核心指标" description="6 组文字与背景组合的检查结果">
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
              note={k.note}
              direction={k.direction}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="模拟视图"
        description="原界面与红色盲、绿色盲、蓝色盲模拟对照"
      >
        <FigureStrip>
          {data.screens.map((s) => (
            <Figure key={s.view}>
              <FigureImage src={s.image} alt={`${data.target} · ${s.view}`} />
              <FigureLabel>{s.view}</FigureLabel>
            </Figure>
          ))}
        </FigureStrip>
      </Section>

      {(palette.length > 0 ||
        confusions.length > 0 ||
        contrast.length > 0 ||
        fixes.length > 0) && (
        <Section
          className="gap-12"
          title="色板与检查"
          description="配色、混淆色、对比度与色值修正;色差为 CIEDE2000 ΔE,对比度按 WCAG 2.2 AA"
        >
          {palette.length > 0 && (
            <Group title="配色">
              <DataTable
                columns={[
                  { key: "name", label: "名称", span: 2 },
                  { key: "hex", label: "色值", span: 2 },
                  { key: "usage", label: "用途", span: 5 },
                ]}
                rows={palette}
              />
            </Group>
          )}

          {confusions.length > 0 && (
            <Group title="混淆色">
              <DataTable
                columns={[
                  { key: "where", label: "位置", span: 2 },
                  { key: "colors", label: "颜色对", span: 2 },
                  {
                    key: "normal",
                    label: "正常",
                    align: "right",
                    span: 1,
                    tone: toneOf("正常"),
                  },
                  {
                    key: "protan",
                    label: "红色盲",
                    align: "right",
                    span: 1,
                    tone: toneOf("红色盲"),
                  },
                  {
                    key: "deutan",
                    label: "绿色盲",
                    align: "right",
                    span: 1,
                    tone: toneOf("绿色盲"),
                  },
                  {
                    key: "tritan",
                    label: "蓝色盲",
                    align: "right",
                    span: 1,
                    tone: toneOf("蓝色盲"),
                  },
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
                  { key: "where", label: "位置", span: 3 },
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
                  { key: "where", label: "位置", span: 2 },
                  { key: "from", label: "原色", span: 1 },
                  { key: "to", label: "修正色", span: 1 },
                  { key: "bg", label: "背景", span: 1 },
                  { key: "before", label: "修复前", align: "right", span: 2 },
                  { key: "after", label: "修复后", align: "right", span: 2 },
                ]}
                rows={fixesRows}
              />
            </Group>
          )}
        </Section>
      )}

      <Section title="分类型" description="各色盲类型发现的问题数,单位:个">
        <Grid cols={9} fields={false}>
          <ProgressList
            compact
            span={3}
            items={data.byType.map((t) => ({
              label: t.type,
              value: t.issues,
              max: 2,
            }))}
          />
        </Grid>
      </Section>

      <Section title="明细" description="问题清单,共 3 个">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "type", label: "类型", span: 2 },
            { key: "location", label: "位置", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["中"] },
          ]}
          rows={data.issues.map((i) => ({
            id: i.id,
            title: i.title,
            type: i.type,
            location: i.location,
            severity: i.severity,
          }))}
        />
      </Section>

      <Section title="下一步" description="修复建议">
        <Grid cols={9} fields={false}>
          <List
            span={6}
            ordered
            divided={false}
            items={data.issues.map((i) => ({
              title: `${i.id} ${i.title}`,
              description: i.suggestion,
            }))}
          />
          <KV
            span={3}
            labelCols={1}
            items={[
              { label: "位置", value: fix.where },
              { label: "现状", value: `${fix.from} 于 ${fix.bg}` },
              { label: "建议", value: `改用 ${fix.to}` },
              { label: "对比度", value: `${fix.before}:1 → ${fix.after}:1` },
            ]}
          />
        </Grid>
      </Section>

      <Section title="背景信息" description="产品、标准与检查方法">
        <KV
          labelCols={2}
          items={[
            { label: "产品 / 页面", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "检查标准", value: data.standard },
            { label: "模拟视图", value: views },
            { label: "检查方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
