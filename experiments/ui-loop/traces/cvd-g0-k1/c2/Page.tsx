import data from "./data.json"
import {
  Page,
  Section,
  Grid,
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
        title="对比度"
        description="文字与背景的对比度,WCAG 2.2 AA 要求 4.5:1(大号文字 3:1)"
      >
        <DataTable
          columns={[
            {
              key: "where",
              label: "位置",
              span: 3,
              muteWhen: { key: "pass", equals: true },
            },
            { key: "colors", label: "前景 / 背景", span: 2 },
            { key: "ratio", label: "对比度", align: "right", span: 1 },
            { key: "required", label: "要求", align: "right", span: 1 },
            { key: "result", label: "结果", span: 2, tone: ["不达标"] },
          ]}
          rows={data.contrast.map((c) => ({
            where: c.where,
            colors: `${c.fg} / ${c.bg}`,
            ratio: c.ratio,
            required: c.required.toFixed(1),
            result: c.pass ? "达标" : "不达标",
            pass: c.pass,
          }))}
        />
      </Section>

      <Section
        title="混淆色"
        description="模拟色盲后的 CIEDE2000 色差 ΔE,小于 12 视为难以区分"
      >
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 2 },
            { key: "colors", label: "配色", span: 2 },
            { key: "normal", label: "正常", align: "right", span: 1 },
            { key: "protan", label: "红色盲", align: "right", span: 1 },
            { key: "deutan", label: "绿色盲", align: "right", span: 1 },
            { key: "tritan", label: "蓝色盲", align: "right", span: 1 },
            { key: "affected", label: "难以区分", span: 1, tone: ["绿色盲"] },
          ]}
          rows={data.confusions.map((c) => ({
            where: c.where,
            colors: `${c.colors[0]} / ${c.colors[1]}`,
            normal: c.normal,
            protan: c["红色盲"],
            deutan: c["绿色盲"],
            tritan: c["蓝色盲"],
            affected: c.affected.join("、"),
          }))}
        />
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

      <Section title="配色" description="品牌配色与用途">
        <DataTable
          columns={[
            { key: "name", label: "名称", span: 2 },
            { key: "hex", label: "色值", span: 2 },
            { key: "usage", label: "用途", span: 5 },
          ]}
          rows={data.palette}
        />
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
