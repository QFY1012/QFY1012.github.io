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

// G1:问题总数(结论性总括项)排到整组第一位,其余按 kpis 原顺序
const kpiOrder = ["issues", "pairs", "fail", "confuse"]
const kpis = [...data.kpis].sort((a, b) => kpiOrder.indexOf(a.key) - kpiOrder.indexOf(b.key))

// G2:每行两张,一行一个 FigureStrip
const screenRows = [data.screens.slice(0, 2), data.screens.slice(2, 4)].filter(
  (row) => row.length > 0,
)

const confusionRows = data.confusions.map((c) => ({
  ...c,
  affectedText: c.affected.length > 0 ? c.affected.join("、") : "无",
}))

const contrastRows = data.contrast.map((c) => ({
  ...c,
  status: c.pass ? "达标" : "不达标",
}))

const fixRows = data.fixes.map((f) => ({
  ...f,
  change: `${f.from} → ${f.to}(背景 ${f.bg})`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date, data.standard]}>
      <Section title="结论" description={`判定:${data.verdict}`}>
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="问题总数排在最前,其余为检查范围与色盲混淆项。">
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

      <Section title="色觉模拟" description="同一界面的原图与三种色盲模拟,每行两张。">
        <Group>
          {screenRows.map((row, index) => (
            <FigureStrip key={index}>
              {row.map((screen) => (
                <Figure key={screen.view}>
                  <FigureImage src={screen.image} alt={screen.view} />
                  <FigureLabel>{screen.view}</FigureLabel>
                </Figure>
              ))}
            </FigureStrip>
          ))}
        </Group>
      </Section>

      <Section
        title="颜色区分"
        description="Machado 2009 模拟,色差为 CIEDE2000 ΔE,小于 12 视为难以区分。"
      >
        <Group title="难以区分的颜色组合">
          <DataTable
            columns={[
              { key: "where", label: "颜色组合", span: 3 },
              { key: "normal", label: "正常", span: 1, align: "right" },
              { key: "红色盲", label: "红色盲", span: 1, align: "right" },
              { key: "绿色盲", label: "绿色盲", span: 1, align: "right" },
              { key: "蓝色盲", label: "蓝色盲", span: 1, align: "right" },
              {
                key: "affectedText",
                label: "受影响",
                span: 2,
                tone: confusionRows.filter((r) => r.affected.length > 0).map((r) => r.affectedText),
              },
            ]}
            rows={confusionRows}
            caption="ΔE 小于 12 视为难以区分;受影响列列出低于阈值的模拟类型。"
          />
        </Group>
        <Group title="按模拟类型的问题数">
          <Grid cols={9} fields={false}>
            <Block span={3}>
              <ProgressList
                compact
                items={data.byType.map((item) => ({
                  label: item.type,
                  value: item.issues,
                  max: 1,
                }))}
              />
            </Block>
          </Grid>
        </Group>
      </Section>

      <Section
        title="对比度"
        description="18 组文字与背景组合的实测对比度,阈值取自 WCAG 2.2 AA。"
      >
        <DataTable
          columns={[
            { key: "where", label: "文字 / 背景", span: 4 },
            { key: "ratio", label: "实测对比度", span: 2, align: "right" },
            { key: "required", label: "要求", span: 1, align: "right" },
            { key: "status", label: "判定", span: 2, tone: ["不达标"] },
          ]}
          rows={contrastRows}
          caption="WCAG 2.2 AA:正文阈值 4.5,大标题 3.0;实测值低于阈值即判为不达标。"
        />
      </Section>

      <Section title="色板" description="14 个颜色 token 的色值与用途。">
        <DataTable
          columns={[
            { key: "name", label: "token", span: 3 },
            { key: "hex", label: "色值", span: 2 },
            { key: "usage", label: "用途", span: 4 },
          ]}
          rows={data.palette}
        />
      </Section>

      <Section title="问题" description="5 个问题,附类型、位置、受影响模拟类型与建议。">
        <List
          numbered
          metaTone="destructive"
          items={data.issues.map((issue) => ({
            title: `${issue.id} ${issue.title}`,
            description: `严重度 ${issue.severity} · ${issue.type} · ${issue.location} · ${issue.suggestion}`,
            meta: issue.severity,
          }))}
        />
      </Section>

      <Section title="建议" description="5 项改法及其改前、改后的对比度。">
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 2 },
            { key: "change", label: "改法", span: 3 },
            { key: "before", label: "改前", span: 2, align: "right" },
            { key: "after", label: "改后", span: 2, align: "right" },
          ]}
          rows={fixRows}
          caption="目标为对比度 ≥ 4.5;改前数值为现网实测,改后为按建议改法计算。"
        />
      </Section>

      <Section title="背景信息" description="检查对象、口径与样本。">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "标准", value: data.standard },
            { label: "方法", value: data.method },
            { label: "色板规模", value: "14 个颜色 token" },
            { label: "检查组合", value: "18 组文字与背景组合" },
          ]}
        />
      </Section>
    </Page>
  )
}
