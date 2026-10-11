import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Text,
  Stat,
  DataTable,
  BarChart,
  List,
  KV,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
} from "@/components/report"

const {
  title,
  target,
  date,
  standard,
  verdict,
  method,
  summary,
  screens,
  kpis,
  palette,
  contrast,
  confusions,
  byType,
  issues,
  fixes,
} = data

const kpi = Object.fromEntries(kpis.map((item) => [item.key, item]))

const paletteRows = palette.map((color) => ({
  name: color.name,
  hex: color.hex,
  usage: color.usage,
}))

const confusionRows = confusions.map((item) => ({
  where: item.where,
  colors: item.colors.join(" / "),
  normal: item.normal,
  protan: item["红色盲"],
  deutan: item["绿色盲"],
  tritan: item["蓝色盲"],
  affected: item.affected.length > 0 ? item.affected.join("、") : "—",
}))

const contrastRows = contrast.map((item) => ({
  where: item.where,
  fg: item.fg,
  bg: item.bg,
  ratio: item.ratio,
  required: item.required,
  result: item.pass ? "达标" : "不达标",
}))

const issueRows = issues.map((item) => ({
  id: item.id,
  title: item.title,
  type: item.type,
  location: item.location,
  severity: item.severity,
}))

const fixRows = fixes.map((item) => ({
  where: item.where,
  from: item.from,
  to: item.to,
  bg: item.bg,
  before: item.before,
  after: item.after,
}))

export default function Report() {
  return (
    <Page title={title} meta={[target, date]}>
      <Section title="结论" description={`${standard} · 判定:${verdict}`}>
        <Text className="text-2xl leading-9 font-light">{`综合判定:${verdict}。${summary}`}</Text>
      </Section>

      <Section
        title="色觉模拟"
        description="原界面与红色盲、绿色盲、蓝色盲模拟对照"
      >
        <FigureStrip>
          {screens.map((screen) => (
            <Figure key={screen.view}>
              <FigureImage src={screen.image} alt={`${target} · ${screen.view}`} />
              <FigureLabel>{screen.view}</FigureLabel>
            </Figure>
          ))}
        </FigureStrip>
      </Section>

      <Section
        title="核心指标"
        description={`检查 ${kpi.pairs.value} 组文字与背景组合,${kpi.fail.value} 组不达标`}
        className="gap-12"
      >
        <Group title="关键数字">
          <Grid cols={9} fields={false} className="items-baseline">
            <Stat
              span={3}
              value={kpi.issues.value}
              label={kpi.issues.label}
              unit={kpi.issues.unit}
              size="lg"
            />
            <Stat
              span={3}
              value={kpi.fail.value}
              label={kpi.fail.label}
              unit={kpi.fail.unit}
              direction="down"
              note={`共检查 ${kpi.pairs.value} 组`}
            />
            <Stat
              span={3}
              value={kpi.confuse.value}
              label={kpi.confuse.label}
              unit={kpi.confuse.unit}
              direction="down"
              note="色差 ΔE 小于 12 视为难以区分"
            />
            <Stat
              span={3}
              value={kpi.pairs.value}
              label={kpi.pairs.label}
              unit={kpi.pairs.unit}
            />
          </Grid>
        </Group>
        <Group title="按色觉类型">
          <BarChart
            data={byType}
            xKey="type"
            series={[{ key: "issues", label: "问题数" }]}
            layout="horizontal"
          />
        </Group>
      </Section>

      <Section
        title="颜色配对"
        description={`${palette.length} 个系列色,${confusions.length} 对难以区分`}
        className="gap-12"
      >
        <Group title="系列色">
          <DataTable
            columns={[
              { key: "name", label: "系列", span: 2 },
              { key: "hex", label: "色值", span: 2 },
              { key: "usage", label: "用途", span: 5 },
            ]}
            rows={paletteRows}
            caption="色值为十六进制;超过 6 个系列时建议改分面图或只高亮重点系列"
          />
        </Group>
        <Group title="难以区分的颜色对">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 2 },
              { key: "colors", label: "颜色对", span: 2 },
              { key: "normal", label: "正常视觉", align: "right", span: 1 },
              { key: "protan", label: "红色盲", align: "right", span: 1 },
              { key: "deutan", label: "绿色盲", align: "right", span: 1 },
              { key: "tritan", label: "蓝色盲", align: "right", span: 1 },
              { key: "affected", label: "受影响", span: 1 },
            ]}
            rows={confusionRows}
            caption="色差为 CIEDE2000 ΔE,小于 12 视为难以区分"
          />
        </Group>
      </Section>

      <Section
        title="对比度"
        description="文字与背景组合的对比度,不达标项标红"
      >
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 3 },
            { key: "fg", label: "文字色", span: 1 },
            { key: "bg", label: "底色", span: 1 },
            { key: "ratio", label: "对比度", align: "right", span: 1 },
            { key: "required", label: "要求", align: "right", span: 1 },
            { key: "result", label: "结果", span: 2, tone: ["不达标"] },
          ]}
          rows={contrastRows}
          caption="要求值来自 WCAG 2.2 AA:正文 4.5:1,图表网格标注 3:1"
        />
      </Section>

      <Section
        title="问题清单"
        description={`共 ${issues.length} 个问题,按严重程度排列`}
      >
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 4 },
            { key: "type", label: "类型", span: 1 },
            { key: "location", label: "位置", span: 2 },
            { key: "severity", label: "严重", span: 1, tone: ["高"] },
          ]}
          rows={issueRows}
          caption="严重程度分高、中、低三档;修复动作见「下一步」"
        />
      </Section>

      <Section
        title="下一步"
        description="逐条修复动作与建议色值"
        className="gap-12"
      >
        <Group title="修复动作">
          <List
            columns={3}
            numbered
            items={issues.map((item) => ({
              title: item.location,
              description: item.suggestion,
            }))}
          />
        </Group>
        <Group title="建议色值">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 4 },
              { key: "from", label: "原色", span: 1 },
              { key: "to", label: "改为", span: 1 },
              { key: "bg", label: "底色", span: 1 },
              { key: "before", label: "修复前", align: "right", span: 1 },
              { key: "after", label: "修复后", align: "right", span: 1 },
            ]}
            rows={fixRows}
            caption="修复后对比度均达到对应要求"
          />
        </Group>
      </Section>

      <Section title="背景信息" description="目标页面、口径与分析方法">
        <KV
          labelCols={2}
          items={[
            { label: "目标页面", value: target },
            { label: "分析日期", value: date },
            { label: "对照标准", value: standard },
            { label: "分析方法", value: method },
          ]}
        />
      </Section>
    </Page>
  )
}
