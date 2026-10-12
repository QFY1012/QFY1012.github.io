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

const kpiOrder = ["issues", "pairs", "fail", "confuse"]
const kpis = kpiOrder.map((key) => data.kpis.find((item) => item.key === key)!)

const screenRows: (typeof data.screens)[] = []
for (let i = 0; i < data.screens.length; i += 2) {
  screenRows.push(data.screens.slice(i, i + 2))
}

const contrastColumns = [
  { key: "where", label: "场景", span: 3 },
  { key: "pair", label: "文字 / 背景", span: 3 },
  { key: "ratio", label: "对比度", align: "right" as const, span: 2 },
  { key: "result", label: "结果", span: 1, tone: ["不达标"] },
]

const contrastRows = data.contrast.map((row) => ({
  where: row.where,
  pair: `${row.fg} / ${row.bg}`,
  ratio: row.ratio.toFixed(2),
  result: row.pass ? "达标" : "不达标",
}))

const paletteColumns = [
  { key: "name", label: "颜色", span: 2 },
  { key: "hex", label: "色值", span: 2 },
  { key: "usage", label: "用途", span: 5 },
]

const confusionColumns = [
  { key: "where", label: "颜色对", span: 3 },
  { key: "normal", label: "正常", align: "right" as const, span: 1 },
  { key: "protan", label: "红色盲", align: "right" as const, span: 1 },
  { key: "deutan", label: "绿色盲", align: "right" as const, span: 1, tone: ["9.0"] },
  { key: "tritan", label: "蓝色盲", align: "right" as const, span: 1 },
  { key: "affected", label: "受影响", span: 2 },
]

const confusionRows = data.confusions.map((row) => ({
  where: row.where,
  normal: row.normal.toFixed(1),
  protan: row["红色盲"].toFixed(1),
  deutan: row["绿色盲"].toFixed(1),
  tritan: row["蓝色盲"].toFixed(1),
  affected: row.affected.join("、") || "无",
}))

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "title", label: "问题", span: 3 },
  { key: "type", label: "类型", span: 1 },
  { key: "location", label: "位置", span: 1 },
  { key: "affects", label: "受影响", span: 2 },
  { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
]

const issueRows = data.issues.map((issue) => ({
  id: issue.id,
  title: issue.title,
  type: issue.type,
  location: issue.location,
  affects: issue.affects.join("、") || "无",
  severity: issue.severity,
}))

const fixColumns = [
  { key: "where", label: "位置", span: 3 },
  { key: "from", label: "原色值", span: 2 },
  { key: "to", label: "改为", span: 2 },
  { key: "ratio", label: "对比度", align: "right" as const, span: 2 },
]

const fixRows = data.fixes.map((fix) => ({
  where: fix.where,
  from: fix.from,
  to: fix.to,
  ratio: `${fix.before.toFixed(2)} → ${fix.after.toFixed(2)}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description="整页判断与主要问题">
        <Text className="text-2xl leading-9 font-light">{`${data.verdict}。${data.summary}`}</Text>
      </Section>

      <Section title="核心指标" description="问题总数与检查范围">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={2}
              size="lg"
              captionBelow
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="色觉模拟" description="原界面与三种色觉模拟的对照">
        <Group>
          {screenRows.map((row, index) => (
            <FigureStrip key={index}>
              {row.map((screen) => (
                <Figure key={screen.view}>
                  <FigureImage src={screen.image} alt={`${data.target} ${screen.view}`} />
                  <FigureLabel>{screen.view}</FigureLabel>
                </Figure>
              ))}
            </FigureStrip>
          ))}
        </Group>
      </Section>

      <Section title="配色" description="页面使用的五个颜色及其用途">
        <DataTable columns={paletteColumns} rows={data.palette} />
      </Section>

      <Section title="对比度" description="6 组文字与背景组合">
        <DataTable
          columns={contrastColumns}
          rows={contrastRows}
          caption="要求:正文与辅助文字 ≥ 4.5:1,大号标题 ≥ 3:1;不达标 1 组——顶部白色标题 1.61:1。"
        />
      </Section>

      <Section title="颜色混淆" description="色差为 CIEDE2000 ΔE,小于 12 视为难以区分">
        <DataTable
          columns={confusionColumns}
          rows={confusionRows}
          caption="绿色盲下准时绿与超时红的 ΔE 为 9.0,低于 12,仅这一对难以区分。"
        />
      </Section>

      <Section title="问题分型" description="按色觉类型统计问题数,蓝色盲无问题">
        <Grid cols={9} fields={false}>
          <Block span={3} title="各色觉类型问题数">
            <ProgressList
              compact
              items={data.byType.map((item) => ({ label: item.type, value: item.issues }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="问题明细" description="3 个问题的位置、影响类型与严重度">
        <DataTable columns={issueColumns} rows={issueRows} />
      </Section>

      <Section title="下一步" description="按问题给出的修改建议与改动前后对照" className="gap-12">
        <Group title="建议">
          <List
            numbered
            columns={3}
            items={data.issues.map((issue) => ({
              title: issue.suggestion,
              description: `${issue.id} ${issue.title}`,
            }))}
          />
        </Group>
        <Group title="改动前后">
          <DataTable
            columns={fixColumns}
            rows={fixRows}
            caption="顶部标题背景为 #FFC300,改为 #1F1F1F 后对比度达到 10.25:1。"
          />
        </Group>
      </Section>

      <Section title="背景信息" description="产品、口径与样本">
        <KV
          labelCols={2}
          items={[
            { label: "产品", value: data.target },
            { label: "日期", value: data.date },
            { label: "标准", value: data.standard },
            { label: "口径", value: data.method },
            { label: "样本", value: `${data.screens.length} 张截图:原界面与红色盲、绿色盲、蓝色盲模拟` },
          ]}
        />
      </Section>
    </Page>
  )
}
