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

const contrastColumns = [
  { key: "where", label: "位置", span: 2 },
  { key: "fg", label: "前景色", span: 2 },
  { key: "bg", label: "背景色", span: 2 },
  { key: "ratio", label: "对比度", align: "right", span: 1 },
  { key: "required", label: "要求", align: "right", span: 1 },
  { key: "result", label: "结论", span: 1, tone: ["不达标"] },
]

const contrastRows = data.contrast.map((row) => ({
  where: row.where,
  fg: row.fg,
  bg: row.bg,
  ratio: row.ratio.toFixed(2),
  required: row.required.toFixed(1),
  result: row.pass ? "达标" : "不达标",
}))

const confusionColumns = [
  { key: "where", label: "位置", span: 2 },
  { key: "colors", label: "颜色对", span: 2 },
  { key: "normal", label: "常人 ΔE", align: "right", span: 1 },
  { key: "红色盲", label: "红色盲", align: "right", span: 1 },
  { key: "绿色盲", label: "绿色盲", align: "right", span: 1 },
  { key: "蓝色盲", label: "蓝色盲", align: "right", span: 1 },
  { key: "affected", label: "受影响", span: 1, tone: ["红色盲", "绿色盲"] },
]

const confusionRows = data.confusions.map((row) => ({
  where: row.where,
  colors: row.colors.join(" / "),
  normal: row.normal.toFixed(1),
  红色盲: row["红色盲"].toFixed(1),
  绿色盲: row["绿色盲"].toFixed(1),
  蓝色盲: row["蓝色盲"].toFixed(1),
  affected: row.affected.join("、"),
}))

const issueColumns = [
  { key: "title", label: "问题", span: 3 },
  { key: "type", label: "类型", span: 1 },
  { key: "location", label: "位置", span: 2 },
  { key: "severity", label: "等级", span: 1 },
  { key: "suggestion", label: "建议", span: 2 },
]

const issueRows = data.issues.map((row) => ({
  title: `${row.id} ${row.title}`,
  type: row.type,
  location: row.location,
  severity: row.severity,
  suggestion: row.suggestion,
}))

const paletteColumns = [
  { key: "name", label: "名称", span: 2 },
  { key: "hex", label: "色值", span: 2 },
  { key: "usage", label: "用途", span: 5 },
]

const fixColumns = [
  { key: "where", label: "位置", span: 3 },
  { key: "from", label: "原文字色", span: 2 },
  { key: "to", label: "新文字色", span: 2 },
  { key: "contrast", label: "对比度", align: "right", span: 2 },
]

const fixRows = data.fixes.map((row) => ({
  where: row.where,
  from: row.from,
  to: row.to,
  contrast: `${row.before.toFixed(2)} → ${row.after.toFixed(2)}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={`综合判定 ${data.verdict} · 对照 ${data.standard}`}>
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="整页文字与背景组合的检查结果">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              note={kpi.key === "fail" ? "顶部白色标题 1.61:1" : undefined}
              direction={kpi.key === "fail" ? "down" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照">
        <FigureStrip>
          {data.screens.map((screen) => (
            <Figure key={screen.view}>
              <FigureImage src={screen.image} alt={`${data.target} · ${screen.view}`} />
              <FigureLabel>{screen.view}</FigureLabel>
            </Figure>
          ))}
        </FigureStrip>
      </Section>

      <Section
        title="颜色混淆"
        description="按色觉类型与颜色对拆分,ΔE 小于 12 视为难以区分"
        className="gap-12"
      >
        <Grid cols={9}>
          <Block span={3} title="按色觉类型">
            <ProgressList
              compact
              items={data.byType.map((item) => ({
                label: item.type,
                value: item.issues,
                max: 2,
                display: `${item.issues} 个`,
              }))}
            />
          </Block>
        </Grid>
        <Group title="颜色对色差">
          <DataTable
            columns={confusionColumns}
            rows={confusionRows}
            caption="ΔE 为 CIEDE2000 色差,数值越小越难区分;绿色盲下准时与超时两色仅 9.0"
          />
        </Group>
      </Section>

      <Section title="明细" description="逐项检查结果" className="gap-12">
        <Group title="文字与背景对比度">
          <DataTable
            columns={contrastColumns}
            rows={contrastRows}
            caption="对比度按 WCAG 2.2 AA:正文 4.5:1,大号文字 3:1;不达标的一项标红"
          />
        </Group>
        <Group title="问题清单">
          <DataTable columns={issueColumns} rows={issueRows} />
        </Group>
        <Group title="调色板">
          <DataTable columns={paletteColumns} rows={data.palette} />
        </Group>
      </Section>

      <Section
        title="下一步"
        description="3 条修复建议;顶部标题已给出修复后的对比度"
        className="gap-12"
      >
        <List
          numbered
          columns={3}
          items={data.issues.map((issue) => ({
            title: issue.suggestion,
            description: `${issue.location} · 等级 ${issue.severity}`,
          }))}
        />
        <Group title="修复后对比度">
          <DataTable columns={fixColumns} rows={fixRows} />
        </Group>
      </Section>

      <Section title="背景信息" description="检查对象与口径">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "对照标准", value: data.standard },
            { label: "模拟方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
