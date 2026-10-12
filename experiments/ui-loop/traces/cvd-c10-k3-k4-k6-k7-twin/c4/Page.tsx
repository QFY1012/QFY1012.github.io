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

// G1:issues(问题总数,结论性总括项)排第一,其余按 kpis 原顺序跟在后面
const kpiOrder = ["issues", "pairs", "fail", "confuse"]
const kpis = kpiOrder.map((key) => data.kpis.find((kpi) => kpi.key === key)!)

const contrastRows = data.contrast.map((row) => ({
  where: row.where,
  fg: row.fg,
  bg: row.bg,
  ratio: String(row.ratio),
  required: String(row.required),
  verdict: row.pass ? "达标" : "不达标",
}))

const confusionRows = data.confusions.map((row) => ({
  where: row.where,
  normal: String(row["normal"]),
  protan: String(row["红色盲"]),
  deuter: String(row["绿色盲"]),
  tritan: String(row["蓝色盲"]),
  affected: row.affected.length > 0 ? row.affected.join("、") : "—",
}))

const issueRows = data.issues.map((issue) => ({
  id: issue.id,
  title: issue.title,
  type: issue.type,
  location: issue.location,
  severity: issue.severity,
}))

const fixRows = data.fixes.map((fix) => ({
  where: fix.where,
  from: fix.from,
  to: fix.to,
  before: String(fix.before),
  after: String(fix.after),
}))

const paletteRows = data.palette.map((token) => ({
  name: token.name,
  hex: token.hex,
  usage: token.usage,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section
        title="结论"
        description={`标准 ${data.standard} · 检查日期 ${data.date}`}
      >
        <Text className="text-2xl leading-9 font-light">
          {`${data.verdict}。${data.summary}`}
        </Text>
      </Section>

      <Section
        title="核心指标"
        description="口径:文字与背景组合按 WCAG 2.2 AA 正文阈值 4.5:1 判定"
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

      <Section
        title="色觉模拟"
        description="原界面与三种色觉模拟视图,每两张一行对照"
      >
        <Group>
          {[0, 2].map((start) => (
            <FigureStrip key={start}>
              {data.screens.slice(start, start + 2).map((screen) => (
                <Figure key={screen.view}>
                  <FigureImage
                    src={screen.image}
                    alt={`${screen.view}下的设计规范色板界面`}
                  />
                  <FigureLabel>{screen.view}</FigureLabel>
                </Figure>
              ))}
            </FigureStrip>
          ))}
        </Group>
      </Section>

      <Section
        title="拆分"
        description="按色觉类型与颜色对拆开:红色盲、绿色盲各有 1 个问题"
        className="gap-12"
      >
        <Group title="按色觉类型的问题数">
          <Grid cols={9} fields={false}>
            <Block span={3}>
              <ProgressList
                compact
                items={data.byType.map((item) => ({
                  label: item.type,
                  value: item.issues,
                }))}
              />
            </Block>
          </Grid>
        </Group>
        <Group title="关键颜色对的色差">
          <DataTable
            columns={[
              { key: "where", label: "颜色对", span: 3 },
              { key: "normal", label: "正常", align: "right", span: 1 },
              { key: "protan", label: "红色盲", align: "right", span: 1 },
              { key: "deuter", label: "绿色盲", align: "right", span: 1 },
              { key: "tritan", label: "蓝色盲", align: "right", span: 1 },
              { key: "affected", label: "受影响人群", span: 2 },
            ]}
            rows={confusionRows}
            caption="数值为 CIEDE2000 色差 ΔE,小于 12 视为难以区分;success #52C41A 与 error #FF4D4F,warning #FAAD14 与 success #52C41A。"
          />
        </Group>
      </Section>

      <Section
        title="明细"
        description="18 组对比度检查、5 个问题与 14 个颜色 token 的逐项结果"
        className="gap-12"
      >
        <Group title="文字与背景组合对比度">
          <DataTable
            columns={[
              { key: "where", label: "组合", span: 3, muteWhen: { key: "verdict", equals: "达标" } },
              { key: "fg", label: "文字", span: 1, muteWhen: { key: "verdict", equals: "达标" } },
              { key: "bg", label: "背景", span: 1, muteWhen: { key: "verdict", equals: "达标" } },
              { key: "ratio", label: "对比度", align: "right", span: 1, muteWhen: { key: "verdict", equals: "达标" } },
              { key: "required", label: "要求", align: "right", span: 1, muteWhen: { key: "verdict", equals: "达标" } },
              { key: "verdict", label: "结论", span: 2, tone: ["不达标"], muteWhen: { key: "verdict", equals: "达标" } },
            ]}
            rows={contrastRows}
            caption="要求为 WCAG 2.2 AA 对该组合的阈值(正文 4.5:1、大标题 3:1);达标的组合灰显。"
          />
        </Group>
        <Group title="问题清单">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "title", label: "问题", span: 3 },
              { key: "type", label: "类型", span: 2 },
              { key: "location", label: "位置", span: 2 },
              {
                key: "severity",
                label: "严重度",
                span: 1,
                levels: ["低", "中", "高"],
              },
            ]}
            rows={issueRows}
            caption="严重度按高、中、低三级排列,高为最高一级。"
          />
        </Group>
        <Group title="色板 token">
          <DataTable
            columns={[
              { key: "name", label: "token", span: 3 },
              { key: "hex", label: "色值", span: 2 },
              { key: "usage", label: "用途", span: 4 },
            ]}
            rows={paletteRows}
          />
        </Group>
      </Section>

      <Section
        title="下一步"
        description="按问题严重度给出整改建议与建议色值"
        className="gap-12"
      >
        <Group title="整改建议">
          <List
            ordered
            items={data.issues.map((issue) => ({
              title: issue.title,
              description: issue.suggestion,
            }))}
          />
        </Group>
        <Group title="建议色值">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 3 },
              { key: "from", label: "原色", span: 2 },
              { key: "to", label: "新色", span: 2 },
              { key: "before", label: "调整前", align: "right", span: 1 },
              { key: "after", label: "调整后", align: "right", span: 1 },
            ]}
            rows={fixRows}
            caption="调整前后为文字与背景的对比度;主按钮悬停一行为背景色由 #1890FF 改为 #096DD9,文字色不变。"
          />
        </Group>
      </Section>

      <Section title="背景信息" description="检查对象、日期与判定方法">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "检查标准", value: data.standard },
            { label: "结论", value: data.verdict },
            { label: "模拟方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
