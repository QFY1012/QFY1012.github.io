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

const KPI_ORDER = ["issues", "pairs", "fail", "confuse"]
const kpis = KPI_ORDER.map((key) => data.kpis.find((kpi) => kpi.key === key)!)

const CONFUSION_THRESHOLD = 12

const protanValues = data.confusions.map((row) => row["红色盲"])
const deutanValues = data.confusions.map((row) => row["绿色盲"])
const tritanValues = data.confusions.map((row) => row["蓝色盲"])

const confusionRows = data.confusions.map((row) => ({
  where: row.where,
  normal: row.normal,
  protan: row["红色盲"],
  deutan: row["绿色盲"],
  tritan: row["蓝色盲"],
  affected: row.affected.join("、"),
}))

const confusionColumns = [
  { key: "where", label: "位置", span: 3 },
  { key: "normal", label: "正常视觉", align: "right" as const, span: 1 },
  {
    key: "protan",
    label: "红色盲",
    align: "right" as const,
    span: 1,
    tone: protanValues.filter((value) => value < CONFUSION_THRESHOLD),
  },
  {
    key: "deutan",
    label: "绿色盲",
    align: "right" as const,
    span: 1,
    tone: deutanValues.filter((value) => value < CONFUSION_THRESHOLD),
  },
  {
    key: "tritan",
    label: "蓝色盲",
    align: "right" as const,
    span: 1,
    tone: tritanValues.filter((value) => value < CONFUSION_THRESHOLD),
  },
  { key: "affected", label: "难以区分的类型", span: 2 },
]

const issueRows = data.issues.map((issue) => ({
  id: issue.id,
  title: issue.title,
  type: issue.type,
  severity: issue.severity,
  affects: issue.affects.length > 0 ? issue.affects.join("、") : "—",
}))

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "title", label: "问题", span: 3 },
  { key: "type", label: "类型", span: 2 },
  { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
  { key: "affects", label: "受影响", span: 2 },
]

const fixRows = data.fixes.map((fix) => ({
  where: fix.where,
  bg: fix.bg,
  from: fix.from,
  to: fix.to,
  before: fix.before,
  after: fix.after,
}))

const fixColumns = [
  { key: "where", label: "位置", span: 3 },
  { key: "bg", label: "背景", span: 2 },
  { key: "from", label: "原色", span: 1 },
  { key: "to", label: "改为", span: 1 },
  { key: "before", label: "改前", align: "right" as const, span: 1 },
  { key: "after", label: "改后", align: "right" as const, span: 1 },
]

const paletteRows = data.palette.map((color) => ({
  name: color.name,
  hex: color.hex,
  usage: color.usage,
}))

const paletteColumns = [
  { key: "name", label: "系列", span: 2 },
  { key: "hex", label: "色值", span: 3 },
  { key: "usage", label: "用途", span: 4 },
]

const stepItems = data.issues.map((issue) => ({
  title: `${issue.id} ${issue.title}`,
  description: issue.suggestion,
  meta: issue.location,
}))

const backgroundItems = [
  { label: "产品页面", value: data.target },
  { label: "检查日期", value: data.date },
  { label: "无障碍标准", value: data.standard },
  { label: "检查方法", value: data.method },
]

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, `${data.date} · ${data.standard}`]}>
      <Section title="结论" description={`标准 ${data.standard} · 色差阈值 ΔE ${CONFUSION_THRESHOLD}`}>
        <Text className="text-2xl leading-9 font-light">{`判定:${data.verdict}。${data.summary}`}</Text>
      </Section>

      <Section title="核心指标" description="本次检查共 6 个问题,含对比度与色觉两类">
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

      <Section title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟">
        <Group>
          <FigureStrip>
            {data.screens.slice(0, 2).map((screen) => (
              <Figure key={screen.view}>
                <FigureImage src={screen.image} alt={screen.view} />
                <FigureLabel>{screen.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
          <FigureStrip>
            {data.screens.slice(2, 4).map((screen) => (
              <Figure key={screen.view}>
                <FigureImage src={screen.image} alt={screen.view} />
                <FigureLabel>{screen.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
        </Group>
      </Section>

      <Section
        title="颜色混淆"
        description={`4 对系列色的色差 ΔE,小于 ${CONFUSION_THRESHOLD} 视为难以区分`}
      >
        <DataTable
          columns={confusionColumns}
          rows={confusionRows}
          caption={`色差为 CIEDE2000 ΔE,标准 ${data.standard};红色加粗数值为受影响类型下难以区分的色差`}
        />
      </Section>

      <Section title="类型分布" description="各色觉类型发现的问题数,单位 个">
        <Grid cols={9} fields={false}>
          <Block span={3} title="各类型问题数">
            <ProgressList
              compact
              items={data.byType.map((row) => ({ label: row.type, value: row.issues }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="明细" description="6 个问题的类型、严重度与受影响人群">
        <DataTable columns={issueColumns} rows={issueRows} />
      </Section>

      <Section title="下一步" description="每条问题的改法与对比度修复值" className="gap-12">
        <Group title="问题的改法">
          <List items={stepItems} numbered columns={3} />
        </Group>
        <Group title="对比度修复">
          <DataTable
            columns={fixColumns}
            rows={fixRows}
            caption="改前、改后为文字与背景的对比度实测值,标准 4.5:1"
          />
        </Group>
      </Section>

      <Section title="配色清单" description="8 个图表系列色及用途">
        <DataTable columns={paletteColumns} rows={paletteRows} />
      </Section>

      <Section title="背景信息" description="检查对象、日期与口径">
        <KV items={backgroundItems} labelCols={2} />
      </Section>
    </Page>
  )
}
