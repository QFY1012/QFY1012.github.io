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

const kpis = [
  ...data.kpis.filter((k) => k.key === "issues"),
  ...data.kpis.filter((k) => k.key !== "issues"),
]

const confusionColumns = [
  { key: "where", label: "色对", span: 2 },
  { key: "normal", label: "正常", align: "right" as const, span: 1 },
  { key: "红色盲", label: "红色盲", align: "right" as const, span: 1 },
  { key: "绿色盲", label: "绿色盲", align: "right" as const, span: 1 },
  { key: "蓝色盲", label: "蓝色盲", align: "right" as const, span: 1 },
  { key: "affected", label: "受影响", span: 3 },
]

const confusionRows = data.confusions.map((c) => ({
  where: c.where,
  normal: c.normal,
  红色盲: c["红色盲"],
  绿色盲: c["绿色盲"],
  蓝色盲: c["蓝色盲"],
  affected: c.affected.join("、"),
}))

const paletteColumns = [
  { key: "name", label: "Token", span: 3 },
  { key: "hex", label: "色值", span: 2 },
  { key: "usage", label: "用途", span: 4 },
]

const contrastColumns = [
  { key: "where", label: "文字 / 背景组合", span: 3 },
  { key: "fg", label: "前景", span: 1 },
  { key: "bg", label: "背景", span: 1 },
  { key: "ratio", label: "对比度", align: "right" as const, span: 2, bar: true },
  { key: "required", label: "要求", align: "right" as const, span: 1 },
  { key: "result", label: "结果", span: 1, tone: ["不达标"] },
]

const contrastRows = data.contrast.map((c) => ({
  where: c.where,
  fg: c.fg,
  bg: c.bg,
  ratio: c.ratio,
  required: c.required,
  result: c.pass ? "达标" : "不达标",
}))

const fixColumns = [
  { key: "where", label: "场景", span: 2 },
  { key: "from", label: "现状", span: 1 },
  { key: "to", label: "建议", span: 1 },
  { key: "bg", label: "背景", span: 1 },
  { key: "before", label: "改前", align: "right" as const, span: 2 },
  { key: "after", label: "改后", align: "right" as const, span: 2 },
]

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={`标准 ${data.standard}`}>
        <Text className="text-2xl leading-9 font-light">{`${data.verdict} —— ${data.summary}`}</Text>
      </Section>

      <Section title="核心指标" description="14 个颜色 token · 18 组文字与背景组合">
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

      <Section title="色觉模拟" description="原界面与三种色觉模拟,按 Machado 2009 模型渲染">
        <Group title="原界面与色觉模拟">
          <FigureStrip>
            {data.screens.slice(0, 2).map((s) => (
              <Figure key={s.view}>
                <FigureImage src={s.image} alt={s.view} />
                <FigureLabel>{s.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
          <FigureStrip>
            {data.screens.slice(2, 4).map((s) => (
              <Figure key={s.view}>
                <FigureImage src={s.image} alt={s.view} />
                <FigureLabel>{s.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
        </Group>
      </Section>

      <Section title="色盲分型" description="问题按色盲类型分布;ΔE 小于 12 视为难以区分">
        <Grid cols={9}>
          <Block span={3} rows={1} title="问题数 · 按色盲类型" description="刻度为问题总数 5">
            <ProgressList
              compact
              items={data.byType.map((t) => ({
                label: t.type,
                value: t.issues,
                max: 5,
                display: `${t.issues} 个`,
              }))}
            />
          </Block>
          <Block span={6} rows={1} title="色觉模拟下的色差 ΔE">
            <DataTable
              columns={confusionColumns}
              rows={confusionRows}
              caption="ΔE 为 CIEDE2000 色差;正常视觉下可区分,模拟后低于 12 即难以区分"
            />
          </Block>
        </Grid>
      </Section>

      <Section title="色板清单" description="设计规范里的 14 个颜色 token">
        <DataTable columns={paletteColumns} rows={data.palette} />
      </Section>

      <Section title="对比度" description="AA 要求 4.5:1,大标题 3:1">
        <DataTable
          columns={contrastColumns}
          rows={contrastRows}
          caption="对比度按 WCAG 2.2 相对亮度计算;不达标组合共 13 组"
        />
      </Section>

      <Section title="问题清单" description="5 个问题,按严重程度排列">
        <List
          numbered
          metaTone="destructive"
          items={data.issues.map((i) => ({
            title: `${i.id} · ${i.title}`,
            description: `${i.location} · ${i.type}${
              i.affects.length ? ` · 影响 ${i.affects.join("、")}` : ""
            } · 建议:${i.suggestion}`,
            meta: i.severity,
          }))}
        />
      </Section>

      <Section title="修复对照" description="5 项改色,目标对比度不低于 4.5:1">
        <DataTable columns={fixColumns} rows={data.fixes} />
      </Section>

      <Section title="下一步" description="三条优先动作">
        <List
          numbered
          columns={3}
          items={[
            {
              title: "状态色配图标",
              description: "P1 · error 往洋红方向调,不再只靠颜色区分成功与错误",
            },
            {
              title: "浅色状态色加深或改深字",
              description: "P2 · 成功、警告、危险按钮上的白字换成深色文字",
            },
            {
              title: "辅助文字改用深灰",
              description: "P3 · text-3 由 #8C8C8C 改为 #737373,对比度 4.74 达标",
            },
          ]}
        />
      </Section>

      <Section title="背景信息" description="产品、范围与口径">
        <KV
          labelCols={2}
          items={[
            { label: "产品", value: data.target },
            { label: "检查范围", value: "14 个颜色 token、18 组文字与背景组合" },
            { label: "检查日期", value: data.date },
            { label: "标准", value: data.standard },
            { label: "方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
