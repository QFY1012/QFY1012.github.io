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

const contrastRows = data.contrast.map((row) => ({
  where: row.where,
  ratio: String(row.ratio),
  required: row.required.toFixed(1),
  verdict: row.pass ? "达标" : "不达标",
}))

const confusionRows = data.confusions.map((row) => ({
  pair: row.where,
  normal: row.normal.toFixed(1),
  protan: row["红色盲"].toFixed(1),
  deutan: row["绿色盲"].toFixed(1),
  tritan: row["蓝色盲"].toFixed(1),
  affected: row.affected.join("、"),
}))

const severityOrder: Record<string, number> = { 高: 0, 中: 1, 低: 2 }

const sortedIssues = [...data.issues].sort(
  (a, b) =>
    (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
)

const issueRows = sortedIssues.map((issue) => ({
  id: issue.id,
  location: issue.location,
  type: issue.type,
  severity: issue.severity,
  affects: issue.affects.length > 0 ? issue.affects.join("、") : "—",
  suggestion: issue.suggestion,
}))

const fixRows = data.fixes.map((fix) => ({
  where: fix.where,
  from: fix.from,
  to: fix.to,
  contrast: `${fix.before.toFixed(2)} → ${fix.after.toFixed(2)}`,
}))

const paletteRows = data.palette.map((token) => ({
  name: token.name,
  hex: token.hex,
  usage: token.usage,
}))

const byTypeItems = data.byType.map((item) => ({
  label: item.type,
  value: item.issues,
  max: 2,
  display: `${item.issues} 个`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={`${data.standard} 对比度标准`}>
        <Group>
          <Text className="text-2xl leading-9 font-light">判定:{data.verdict}</Text>
          <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
        </Group>
      </Section>

      <Section
        title="核心指标"
        description={`14 个颜色 token,${data.kpis[0].value} 组文字与背景组合`}
      >
        <Group>
          <Grid cols={9} fields={false} className="items-baseline">
            <Stat
              span={3}
              size="lg"
              value={13}
              unit="组"
              label="对比度不达标"
              captionBelow
              note="WCAG 2.2 AA 正文阈值 4.5:1"
            />
          </Grid>
          <Grid cols={9} fields={false} className="items-baseline">
            <Stat
              span={3}
              value={18}
              unit="组"
              label="检查的文字与背景组合"
              captionBelow
            />
            <Stat
              span={3}
              value={2}
              unit="对"
              label="色盲用户难以区分的颜色"
              captionBelow
            />
            <Stat span={3} value={5} unit="个" label="问题总数" captionBelow />
          </Grid>
        </Group>
      </Section>

      <Section
        title="色觉模拟"
        description="原界面与红色盲、绿色盲、蓝色盲模拟对照"
      >
        <Group>
          <FigureStrip>
            {data.screens.map((screen) => (
              <Figure key={screen.view}>
                <FigureImage src={screen.image} alt={screen.view} />
                <FigureLabel>{screen.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
        </Group>
      </Section>

      <Section
        title="色差分析"
        description="CIEDE2000 ΔE,小于 12 视为难以区分"
        className="gap-12"
      >
        <Group title="混淆色对 · 各色觉类型下的 ΔE">
          <DataTable
            columns={[
              { key: "pair", label: "颜色对", span: 3 },
              { key: "normal", label: "正常", span: 1, align: "right" },
              { key: "protan", label: "红色盲", span: 1, align: "right", tone: ["0.3"] },
              { key: "deutan", label: "绿色盲", span: 1, align: "right", tone: ["5.9", "8.2"] },
              { key: "tritan", label: "蓝色盲", span: 1, align: "right" },
              { key: "affected", label: "受影响", span: 2 },
            ]}
            rows={confusionRows}
            caption="ΔE 小于 12 的数值标红,该色觉类型下这对颜色难以区分"
          />
        </Group>
        <Group title="问题分布 · 按色觉类型">
          <Grid cols={9} fields={false}>
            <Block span={3}>
              <ProgressList items={byTypeItems} compact />
            </Block>
          </Grid>
        </Group>
      </Section>

      <Section
        title="对比度明细"
        description={`${data.contrast.length} 组文字与背景组合的对比度检查`}
      >
        <Group>
          <DataTable
            columns={[
              { key: "where", label: "文字 / 背景", span: 3 },
              { key: "ratio", label: "对比度", span: 2, align: "right", bar: true },
              { key: "required", label: "要求", span: 2, align: "right" },
              { key: "verdict", label: "判定", span: 2, tone: ["不达标"] },
            ]}
            rows={contrastRows}
            caption="WCAG 2.2 AA:正文 4.5:1,大标题 3:1;18 组中 13 组不达标"
          />
        </Group>
      </Section>

      <Section
        title="调色板"
        description={`${data.palette.length} 个颜色 token 的名称、色值与用途`}
      >
        <Group>
          <DataTable
            columns={[
              { key: "name", label: "名称", span: 3 },
              { key: "hex", label: "色值", span: 3 },
              { key: "usage", label: "用途", span: 3 },
            ]}
            rows={paletteRows}
          />
        </Group>
      </Section>

      <Section
        title="问题清单"
        description={`${data.issues.length} 个问题,按严重度排列`}
        className="gap-12"
      >
        <Group>
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "location", label: "位置", span: 2 },
              { key: "type", label: "类型", span: 1 },
              { key: "severity", label: "严重度", span: 1, tone: ["高"] },
              { key: "affects", label: "影响", span: 2 },
              { key: "suggestion", label: "建议", span: 2 },
            ]}
            rows={issueRows}
            caption="严重度为「高」的问题标红;影响为空表示不涉及特定色觉类型"
          />
        </Group>
        <Group title="整改对照">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 3 },
              { key: "from", label: "修改前", span: 2 },
              { key: "to", label: "修改后", span: 2 },
              { key: "contrast", label: "对比度", span: 2, align: "right" },
            ]}
            rows={fixRows}
            caption="对比度为修改前后的文字与背景对比度;主按钮悬停一行在 #096DD9 背景上"
          />
        </Group>
      </Section>

      <Section
        title="下一步"
        description="按问题给出的整改建议"
      >
        <Group>
          <List
            columns={2}
            items={sortedIssues.map((issue) => ({
              title: `${issue.id} · ${issue.title}`,
              description: issue.suggestion,
            }))}
          />
        </Group>
      </Section>

      <Section title="背景信息" description="检查对象与口径">
        <Group>
          <KV
            labelCols={2}
            items={[
              { label: "检查对象", value: data.target },
              { label: "检查标准", value: data.standard },
              { label: "模拟方法", value: data.method },
              { label: "报告日期", value: data.date },
              {
                label: "覆盖范围",
                value: `${data.palette.length} 个颜色 token,${data.contrast.length} 组文字与背景组合`,
              },
            ]}
          />
        </Group>
      </Section>
    </Page>
  )
}
