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
const kpis = kpiOrder
  .map((key) => data.kpis.find((item) => item.key === key))
  .filter((item): item is (typeof data.kpis)[number] => Boolean(item))

const screenRows: (typeof data.screens)[] = []
data.screens.forEach((screen, index) => {
  const row = Math.floor(index / 2)
  if (!screenRows[row]) screenRows[row] = []
  screenRows[row].push(screen)
})

const contrastRows = data.contrast.map((row) => ({
  where: row.where,
  fg: row.fg,
  bg: row.bg,
  ratio: row.ratio,
  required: row.required,
  result: row.pass ? "达标" : "不达标",
}))

const confusionRows = data.confusions.map((row) => ({
  where: row.where,
  normal: row.normal.toFixed(1),
  "红色盲": row["红色盲"].toFixed(1),
  "绿色盲": row["绿色盲"].toFixed(1),
  "蓝色盲": row["蓝色盲"].toFixed(1),
  affected: row.affected.length > 0 ? row.affected.join("、") : "—",
}))

const issueRows = data.issues.map((row) => ({
  id: row.id,
  title: row.title,
  type: row.type,
  location: row.location,
  severity: row.severity,
  affects: row.affects.length > 0 ? row.affects.join("、") : "—",
}))

const fixRows = data.fixes.map((row) => ({
  where: row.where,
  from: row.from,
  to: row.to,
  ratio: `${row.before} → ${row.after}`,
}))

export default function Report() {
  return (
    <Page meta={[data.target, data.date]} title={data.title}>
      <Section title="结论" description={`按 ${data.standard} 检查`}>
        <Text className="text-2xl leading-9 font-light">{`${data.verdict}。${data.summary}`}</Text>
      </Section>

      <Section
        title="核心指标"
        description={`共检查 ${data.kpis[0].value} 组文字与背景,发现 ${data.kpis[3].value} 个问题`}
      >
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

      <Section title="色觉模拟" description="原界面与三种色盲模拟对照">
        <Group>
          {screenRows.map((row, rowIndex) => (
            <FigureStrip key={rowIndex}>
              {row.map((screen) => (
                <Figure key={screen.view}>
                  <FigureImage src={screen.image} alt={`${data.target} · ${screen.view}`} />
                  <FigureLabel>{screen.view}</FigureLabel>
                </Figure>
              ))}
            </FigureStrip>
          ))}
        </Group>
      </Section>

      <Section title="对比度" description={`要求 4.5:1,大号文字 3:1,共 ${data.contrast.length} 组`}>
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 2 },
            { key: "fg", label: "前景", span: 2 },
            { key: "bg", label: "背景", span: 2 },
            { key: "ratio", label: "对比度", span: 1, align: "right" },
            { key: "required", label: "要求", span: 1, align: "right" },
            { key: "result", label: "结果", span: 1, tone: ["不达标"] },
          ]}
          rows={contrastRows}
          caption="对比度为前景色与背景色的比值,阈值取自 WCAG 2.2 AA"
        />
      </Section>

      <Section title="颜色混淆" description="CIEDE2000 ΔE 小于 12 视为难以区分">
        <DataTable
          columns={[
            { key: "where", label: "场景", span: 3 },
            { key: "normal", label: "正常视觉", span: 1, align: "right" },
            { key: "红色盲", label: "红色盲", span: 1, align: "right" },
            { key: "绿色盲", label: "绿色盲", span: 1, align: "right" },
            { key: "蓝色盲", label: "蓝色盲", span: 1, align: "right" },
            { key: "affected", label: "受影响人群", span: 2, tone: ["绿色盲"] },
          ]}
          rows={confusionRows}
          caption="数值为模拟后的色差 ΔE,绿色盲下 9.0 低于 12"
        />
      </Section>

      <Section title="配色" description="页面用到的主要颜色">
        <DataTable
          columns={[
            { key: "name", label: "名称", span: 2 },
            { key: "hex", label: "色值", span: 2 },
            { key: "usage", label: "用途", span: 5 },
          ]}
          rows={data.palette}
          caption="色值为 sRGB 十六进制值"
        />
      </Section>

      <Section title="问题明细" description={`共 ${data.issues.length} 个问题`} className="gap-12">
        <Grid cols={9} fields={false}>
          <Block span={3} title="按色盲类型统计的问题数">
            <ProgressList compact items={data.byType.map((item) => ({ label: item.type, value: item.issues }))} />
          </Block>
        </Grid>
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "type", label: "类型", span: 1 },
            { key: "location", label: "位置", span: 2 },
            { key: "severity", label: "严重度", span: 1 },
            { key: "affects", label: "影响人群", span: 1 },
          ]}
          rows={issueRows}
          caption="严重度分高、中、低三级,本次 3 个问题最高为中级"
        />
      </Section>

      <Section title="下一步" description="按问题逐条修复,改后按同一口径复查" className="gap-12">
        <List
          numbered
          columns={3}
          items={data.issues.map((issue) => ({
            title: issue.suggestion,
            description: `${issue.id} · ${issue.location}`,
          }))}
        />
        <Group title="修复前后对比度">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 3 },
              { key: "from", label: "修改前", span: 2 },
              { key: "to", label: "修改后", span: 2 },
              { key: "ratio", label: "对比度", span: 2, align: "right" },
            ]}
            rows={fixRows}
            caption={`背景色为 ${data.fixes[0].bg},对比度为修改前 → 修改后`}
          />
        </Group>
      </Section>

      <Section title="背景信息" description="检查对象、口径与时间">
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
