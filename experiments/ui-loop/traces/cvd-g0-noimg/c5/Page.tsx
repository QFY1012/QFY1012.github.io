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
  const paletteRows = data.palette.map((p) => ({
    name: p.name,
    hex: p.hex,
    usage: p.usage,
  }))

  const contrastRows = data.contrast.map((c) => ({
    where: c.where,
    colors: `${c.fg} / ${c.bg}`,
    ratio: c.ratio,
    required: c.required,
    result: c.pass ? "达标" : "不达标",
  }))

  const confusionRows = data.confusions.map((c) => ({
    where: c.where,
    normal: c.normal,
    protan: c["红色盲"],
    deutan: c["绿色盲"],
    tritan: c["蓝色盲"],
  }))

  const issueRows = data.issues.map((i) => ({
    title: `${i.id} ${i.title}`,
    type: i.type,
    location: i.location,
    severity: i.severity,
    affects: i.affects.length ? i.affects.join("、") : "—",
  }))

  const fixRows = data.fixes.map((f) => ({
    where: f.where,
    from: f.from,
    to: f.to,
    before: f.before,
    after: f.after,
  }))

  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description="整体判断">
        <Group>
          <Text className="text-2xl leading-9 font-light">{`${data.verdict}。${data.summary}`}</Text>
        </Group>
      </Section>

      <Section title="核心指标" description="本次检查的四个总量">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              size="lg"
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section title="配色" description="页面在用的 6 个颜色,白底 #FFFFFF、夜间底 #16181D">
        <DataTable
          columns={[
            { key: "name", label: "颜色", span: 3 },
            { key: "hex", label: "色值", span: 2 },
            { key: "usage", label: "用途", span: 4 },
          ]}
          rows={paletteRows}
        />
      </Section>

      <Section title="对比度" description="WCAG 2.2 AA:正文 4.5:1、大字号 3:1,不达标 4 组">
        <DataTable
          columns={[
            { key: "where", label: "场景", span: 3 },
            { key: "colors", label: "前景 / 背景", span: 2 },
            { key: "ratio", label: "对比度", span: 2, align: "right" as const },
            { key: "required", label: "要求", span: 1, align: "right" as const },
            { key: "result", label: "结果", span: 1, tone: ["不达标"] },
          ]}
          rows={contrastRows}
        />
      </Section>

      <Section title="色差" description="CIEDE2000 ΔE,小于 12(标红)视为难以区分">
        <Grid cols={9}>
          <Block span={3} rows={2} title="各类型问题数">
            <ProgressList
              compact
              items={data.byType.map((t) => ({
                label: t.type,
                value: t.issues,
                max: data.kpis[3].value,
              }))}
            />
          </Block>
          <Block span={6} rows={2} title="颜色组合的色差(ΔE)">
            <DataTable
              columns={[
                { key: "where", label: "颜色组合", span: 2 },
                { key: "normal", label: "正常", span: 1, align: "right" as const },
                { key: "protan", label: "红色盲", span: 1, align: "right" as const },
                { key: "deutan", label: "绿色盲", span: 1, align: "right" as const, tone: ["10.2"] },
                { key: "tritan", label: "蓝色盲", span: 1, align: "right" as const },
              ]}
              rows={confusionRows}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="问题明细" description="共 4 个问题,严重度高的先处理">
        <DataTable
          columns={[
            { key: "title", label: "问题", span: 3 },
            { key: "type", label: "类型", span: 1 },
            { key: "location", label: "位置", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "affects", label: "影响人群", span: 2 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="修改建议" description="白底 #FFFFFF 下先改色值,再补非颜色线索" className="gap-12">
        <Group>
          <List
            ordered
            divided={false}
            items={data.issues.map((i) => ({
              title: i.suggestion,
              description: `${i.id} ${i.title}`,
            }))}
          />
        </Group>
        <Group>
          <DataTable
            columns={[
              { key: "where", label: "场景", span: 3 },
              { key: "from", label: "原色值", span: 2 },
              { key: "to", label: "建议色值", span: 2 },
              { key: "before", label: "原对比度", span: 1, align: "right" as const },
              { key: "after", label: "新对比度", span: 1, align: "right" as const },
            ]}
            rows={fixRows}
          />
        </Group>
      </Section>

      <Section title="背景信息" description="检查口径">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "标准", value: data.standard },
            { label: "方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
