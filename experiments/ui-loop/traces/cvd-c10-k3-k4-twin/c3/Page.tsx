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

// G1: 问题总数（结论性的总括项）排到第一位，其余按原顺序
const orderedKpis = [
  ...data.kpis.filter((k) => k.key === "issues"),
  ...data.kpis.filter((k) => k.key !== "issues"),
]

const confusionRows = data.confusions.map((c) => ({
  where: c.where,
  normal: c.normal.toFixed(1),
  protan: c["红色盲"].toFixed(1),
  deutan: c["绿色盲"].toFixed(1),
  tritan: c["蓝色盲"].toFixed(1),
  affectedText: c.affected.length > 0 ? c.affected.join("、") : "—",
  affectedCount: c.affected.length,
}))

const contrastRows = data.contrast.map((c) => ({
  where: c.where,
  fg: c.fg,
  bg: c.bg,
  ratio: c.ratio.toFixed(2),
  required: c.required.toFixed(1),
  result: c.pass ? "达标" : "不达标",
}))

const issueRows = data.issues.map((i) => ({
  title: `${i.id} ${i.title}`,
  type: i.type,
  location: i.location,
  severity: i.severity,
}))

const affectsCaption =
  "影响范围：" +
  data.issues.map((i) => `${i.id} ${i.affects.length > 0 ? i.affects.join("、") : "无"}`).join(";") +
  "。"

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section
        title="结论"
        description={`口径：按 Machado 2009 模型模拟红色盲、绿色盲、蓝色盲，CIEDE2000 ΔE 小于 12 视为难以区分。`}
      >
        <Text className="text-2xl leading-9 font-light">
          {data.verdict}。{data.summary}
        </Text>
      </Section>

      <Section title="核心指标" description="4 项：问题总数 4 个，其中 2 组对比度不达标、2 对颜色难区分。">
        <Grid cols={9} fields={false} className="items-baseline">
          {orderedKpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={2}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              size="lg"
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲三种模拟对照，每行两张。">
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

      <Section title="配色" description="四级路况色、颜色对色差与各类色盲命中的问题数。" className="gap-12">
        <Grid cols={9}>
          <Block span={3} rows={2} title="各类色盲的问题数">
            <ProgressList
              compact
              items={data.byType.map((item) => ({ label: item.type, value: item.issues }))}
            />
          </Block>
          <Block span={6} rows={2} title="四级路况色">
            <DataTable
              columns={[
                { key: "name", label: "名称", span: 2 },
                { key: "hex", label: "色值", span: 2 },
                { key: "usage", label: "用途", span: 2 },
              ]}
              rows={data.palette}
            />
          </Block>
        </Grid>
        <Group title="颜色对色差 ΔE">
          <DataTable
            columns={[
              { key: "where", label: "颜色对", span: 3 },
              { key: "normal", label: "正常", span: 1, align: "right" },
              { key: "protan", label: "红色盲", span: 1, align: "right" },
              { key: "deutan", label: "绿色盲", span: 1, align: "right" },
              { key: "tritan", label: "蓝色盲", span: 1, align: "right" },
              { key: "affectedText", label: "受影响", span: 2 },
            ]}
            rows={confusionRows}
            caption="ΔE 小于 12 视为难以区分；灰显的一行三类色盲均可区分。"
          />
        </Group>
      </Section>

      <Section title="对比度" description="路名标注与背景的对比度，要求 4.5:1（WCAG 2.2 AA）。">
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 3 },
            { key: "fg", label: "文字", span: 1 },
            { key: "bg", label: "背景", span: 1 },
            { key: "ratio", label: "对比度", span: 1, align: "right" },
            { key: "required", label: "要求", span: 1, align: "right" },
            { key: "result", label: "结果", span: 2, tone: ["不达标"] },
          ]}
          rows={contrastRows}
          caption="畅通路段上的白字 2.22:1、拥堵路段上的白字 3.55:1，均低于 4.5:1。"
        />
      </Section>

      <Section title="问题" description="共 4 个问题，2 个高、2 个中。">
        <DataTable
          columns={[
            { key: "title", label: "问题", span: 3 },
            { key: "type", label: "类型", span: 2 },
            { key: "location", label: "位置", span: 2 },
            { key: "severity", label: "严重度", span: 2, tone: ["高"] },
          ]}
          rows={issueRows}
          caption={affectsCaption}
        />
      </Section>

      <Section title="下一步" description="4 条改法，对应上面的 4 个问题。">
        <List
          numbered
          columns={3}
          items={data.issues.map((issue) => ({
            title: issue.suggestion,
            description: `${issue.id} · ${issue.title}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="检查范围、标准与方法。">
        <KV
          labelCols={2}
          items={[
            { label: "目标", value: data.target },
            { label: "日期", value: data.date },
            { label: "标准", value: data.standard },
            { label: "方法", value: data.method },
            {
              label: "检查范围",
              value: `${data.contrast.length} 组文字与背景组合、${data.confusions.length} 对颜色、${data.issues.length} 个问题`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}
