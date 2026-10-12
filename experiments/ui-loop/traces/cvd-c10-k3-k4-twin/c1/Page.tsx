import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Text,
  Stat,
  DataTable,
  List,
  KV,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
} from "@/components/report"

// 数值格式:一位小数,与 data.json 里的写法一致
const one = (n: number) => n.toFixed(1)

export default function Report() {
  // G1:问题总数(issues)排到整组第一位,其余按 kpis 原顺序
  const kpis = [
    ...data.kpis.filter((k) => k.key === "issues"),
    ...data.kpis.filter((k) => k.key !== "issues"),
  ]

  // 混淆色:位置与受影响人群合成一列,三列 ΔE 用 tone 标出低于 12 的数值
  const confusionRows = data.confusions.map((c) => ({
    where: `${c.where} · ${c.affected.join("、")}`,
    colors: c.colors.join(" / "),
    normal: one(c.normal),
    protan: one(c["红色盲"]),
    deutan: one(c["绿色盲"]),
    tritan: one(c["蓝色盲"]),
  }))

  const contrastRows = data.contrast.map((c) => ({
    where: c.where,
    fg: c.fg,
    bg: c.bg,
    ratio: String(c.ratio),
    required: one(c.required),
    verdict: c.pass ? "达标" : "不达标",
  }))

  const issueRows = data.issues.map((it) => ({
    id: it.id,
    title: it.title,
    meta: `${it.type} · ${it.location}`,
    affects: it.affects.length ? it.affects.join("、") : "—",
    severity: it.severity,
  }))

  const fixRows = data.fixes.map((f) => ({
    where: `${f.where}(底色 ${f.bg})`,
    from: f.from,
    to: f.to,
    ratio: `${f.before} → ${f.after}`,
  }))

  return (
    <Page
      title={data.title}
      meta={[data.target, `检查日期 ${data.date}`]}
    >
      {/* 结论 */}
      <Section title="结论" description="看板首页配色对色盲用户的可用性判断">
        <Group>
          <Text className="text-2xl leading-9 font-light">{`色觉无障碍结论:${data.verdict}`}</Text>
          <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
        </Group>
      </Section>

      {/* 核心指标 */}
      <Section title="核心指标" description="10 组文字与背景组合中 6 组不达标">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((k) => (
            <Stat
              key={k.key}
              span={2}
              value={k.value}
              unit={k.unit}
              label={k.label}
              size="lg"
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      {/* 系列色板 */}
      <Section title="系列色板" description="看板图表使用的 8 个系列色">
        <DataTable
          columns={[
            { key: "name", label: "系列", span: 2 },
            { key: "hex", label: "色值", span: 3 },
            { key: "usage", label: "用途", span: 4 },
          ]}
          rows={data.palette}
        />
      </Section>

      {/* 色觉模拟:G2 每两张一行,一行一条 FigureStrip */}
      <Section title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照">
        <Group>
          {[0, 2].map((start) => (
            <FigureStrip key={start}>
              {data.screens.slice(start, start + 2).map((s) => (
                <Figure key={s.view}>
                  <FigureImage src={s.image} alt={`经营看板首页的${s.view}视图`} />
                  <FigureLabel>{s.view}</FigureLabel>
                </Figure>
              ))}
            </FigureStrip>
          ))}
        </Group>
      </Section>

      {/* 色觉影响:分型 + 混淆色对 */}
      <Section
        title="色觉影响"
        description="3 类色盲受影响的问题数与难以区分的颜色对"
        className="gap-12"
      >
        <Group title="受影响的问题数">
          <Grid cols={9} fields={false} className="items-baseline">
            {data.byType.map((t) => (
              <Stat
                key={t.type}
                span={2}
                value={t.issues}
                unit="个"
                label={`${t.type}用户`}
                captionBelow
              />
            ))}
          </Grid>
        </Group>
        <Group title="难以区分的颜色对">
          <DataTable
            columns={[
              { key: "where", label: "位置 · 受影响", span: 3 },
              { key: "colors", label: "颜色对", span: 2 },
              { key: "normal", label: "正常", align: "right", span: 1 },
              {
                key: "protan",
                label: "红色盲",
                align: "right",
                span: 1,
                tone: ["7.8"],
              },
              {
                key: "deutan",
                label: "绿色盲",
                align: "right",
                span: 1,
                tone: ["3.9", "8.7", "11.2", "11.6"],
              },
              { key: "tritan", label: "蓝色盲", align: "right", span: 1 },
            ]}
            rows={confusionRows}
            caption="ΔE 为 CIEDE2000 色差,小于 12 视为难以区分,低于 12 的数值标红;正常列为正常视觉下的色差。"
          />
        </Group>
      </Section>

      {/* 对比度 */}
      <Section title="对比度" description="文字与背景组合的对比度,要求 4.5:1">
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 2 },
            { key: "fg", label: "文字", span: 2 },
            { key: "bg", label: "背景", span: 2 },
            { key: "ratio", label: "对比度", align: "right", span: 1 },
            { key: "required", label: "要求", align: "right", span: 1 },
            { key: "verdict", label: "结论", span: 1, tone: ["不达标"] },
          ]}
          rows={contrastRows}
          caption="比值为文字色与背景色的对比度,按 WCAG 2.2 AA:正文 4.5:1,图形与界面组件 3:1。"
        />
      </Section>

      {/* 问题明细 */}
      <Section title="问题明细" description="6 个问题的类型、位置与严重程度">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "meta", label: "类型 · 位置", span: 2 },
            { key: "affects", label: "影响人群", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
          ]}
          rows={issueRows}
        />
      </Section>

      {/* 整改建议 */}
      <Section
        title="整改建议"
        description="按问题给出的修改方向与色值调整"
        className="gap-12"
      >
        <Group title="修改方向">
          <List
            numbered
            columns={3}
            items={data.issues.map((it) => ({
              title: it.suggestion,
              description: `${it.id} · ${it.title}`,
            }))}
          />
        </Group>
        <Group title="对比度修复:色值调整">
          <DataTable
            columns={[
              { key: "where", label: "位置 · 底色", span: 3 },
              { key: "from", label: "改前", span: 2 },
              { key: "to", label: "改后", span: 2 },
              { key: "ratio", label: "对比度", align: "right", span: 2 },
            ]}
            rows={fixRows}
            caption="对比度为改前 → 改后的比值,目标 4.5:1。"
          />
        </Group>
      </Section>

      {/* 背景信息 */}
      <Section title="背景信息" description="检查对象、时间与判定口径">
        <KV
          labelCols={2}
          items={[
            { label: "分析对象", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "遵循标准", value: data.standard },
            { label: "分析方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
