import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Text,
  Stat,
  DataTable,
  List,
  KV,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
} from "@/components/report"

const kpiValue = (key: string) => data.kpis.find((k) => k.key === key)?.value ?? 0

// G1:问题总数(issues)排到整组第一位,其余按原顺序
const kpis = [
  ...data.kpis.filter((k) => k.key === "issues"),
  ...data.kpis.filter((k) => k.key !== "issues"),
]

// G2:screens 每两张排一行
const screenRows: (typeof data.screens)[] = []
for (let i = 0; i < data.screens.length; i += 2) {
  screenRows.push(data.screens.slice(i, i + 2))
}

// 某一模拟类型下难以区分的 ΔE(用于标红)
const confusionTone = (type: string) =>
  data.confusions
    .filter((c) => c.affected.includes(type))
    .map((c) => c[type as "红色盲" | "绿色盲" | "蓝色盲"].toFixed(1))

const paletteRows = data.palette.map((p) => ({
  name: p.name,
  hex: p.hex,
  usage: p.usage,
}))

const contrastRows = data.contrast.map((c) => ({
  where: c.where,
  fg: c.fg,
  bg: c.bg,
  ratio: c.ratio.toFixed(2),
  required: c.required.toFixed(1),
  result: c.pass ? "达标" : "不达标",
  pass: c.pass,
}))

const confusionRows = data.confusions.map((c) => ({
  where: c.where,
  normal: c.normal.toFixed(1),
  protan: c["红色盲"].toFixed(1),
  deuter: c["绿色盲"].toFixed(1),
  tritan: c["蓝色盲"].toFixed(1),
  affected: c.affected.join("、"),
}))

const issueRows = data.issues.map((i) => ({
  id: i.id,
  title: i.title,
  type: i.type,
  location: i.location,
  severity: i.severity,
}))

const fixRows = data.fixes.map((f) => ({
  where: f.where,
  from: f.from,
  to: f.to,
  before: f.before.toFixed(2),
  after: f.after.toFixed(2),
}))

export default function Report() {
  return (
    <Page
      title={data.title}
      meta={[data.target, `${data.date} · ${data.standard}`]}
    >
      <Section
        title="结论"
        description={`对全部 ${data.palette.length} 个颜色 token 的全量检查`}
      >
        <Group>
          <Text className="text-2xl leading-9 font-light">{`色觉友好度:${data.verdict}`}</Text>
          <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
        </Group>
      </Section>

      <Section
        title="核心指标"
        description={`${kpiValue("pairs")} 组文字与背景组合,${kpiValue("fail")} 组不达标`}
      >
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((k) => (
            <Stat
              key={k.key}
              span={2}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              size="lg"
            />
          ))}
        </Grid>
      </Section>

      <Section title="色觉模拟" description="原界面与三种色盲模拟的对照视图">
        <Group>
          {screenRows.map((row, rowIndex) => (
            <FigureStrip key={rowIndex}>
              {row.map((s) => (
                <Figure key={s.view}>
                  <FigureImage src={s.image} alt={`${s.view}视图`} />
                  <FigureLabel>{s.view}</FigureLabel>
                </Figure>
              ))}
            </FigureStrip>
          ))}
        </Group>
      </Section>

      <Section title="类型分布" description="按模拟类型统计的问题数,单位:个">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.byType.map((t) => (
            <Stat
              key={t.type}
              span={2}
              value={t.issues}
              unit="个"
              label={t.type}
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section title="色板清单" description={`全部 ${data.palette.length} 个颜色 token 的名称、色值与用途`}>
        <DataTable
          caption="色值为 16 进制 sRGB。"
          columns={[
            { key: "name", label: "名称", span: 3 },
            { key: "hex", label: "色值", span: 2 },
            { key: "usage", label: "用途", span: 4 },
          ]}
          rows={paletteRows}
        />
      </Section>

      <Section
        title="对比度检查"
        description={`阈值 4.5:1(WCAG 2.2 AA),${kpiValue("fail")} 组不达标`}
      >
        <DataTable
          caption="对比度为文字色与背景色的比值;大标题阈值 3:1,其余 4.5:1。"
          columns={[
            { key: "where", label: "组合", span: 3 },
            { key: "fg", label: "前景", span: 1 },
            { key: "bg", label: "背景", span: 1 },
            { key: "ratio", label: "对比度", span: 2, align: "right" },
            { key: "required", label: "要求", span: 1, align: "right" },
            {
              key: "result",
              label: "结果",
              span: 1,
              tone: ["不达标"],
              muteWhen: { key: "pass", equals: true },
            },
          ]}
          rows={contrastRows}
        />
      </Section>

      <Section
        title="混淆色检查"
        description="CIEDE2000 ΔE 小于 12 视为难以区分"
      >
        <DataTable
          caption="success #52C41A 与 error #FF4D4F;warning #FAAD14 与 success #52C41A。"
          columns={[
            { key: "where", label: "颜色组合", span: 3 },
            { key: "normal", label: "正常 ΔE", span: 1, align: "right" },
            {
              key: "protan",
              label: "红色盲",
              span: 1,
              align: "right",
              tone: confusionTone("红色盲"),
            },
            {
              key: "deuter",
              label: "绿色盲",
              span: 1,
              align: "right",
              tone: confusionTone("绿色盲"),
            },
            { key: "tritan", label: "蓝色盲", span: 1, align: "right" },
            {
              key: "affected",
              label: "难以区分",
              span: 2,
              tone: data.confusions.map((c) => c.affected.join("、")),
            },
          ]}
          rows={confusionRows}
        />
      </Section>

      <Section
        title="问题明细"
        description={`${data.issues.length} 个问题,含类型、位置与严重程度`}
      >
        <DataTable
          caption={`影响色觉类型:${data.issues
            .filter((i) => i.affects.length > 0)
            .map((i) => `${i.id} ${i.affects.join("、")}`)
            .join(";")};其余为对比度问题。`}
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "type", label: "类型", span: 2 },
            { key: "location", label: "位置", span: 2 },
            { key: "severity", label: "严重", span: 1, tone: ["高"] },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="按问题给出的修正建议与替换色值" className="gap-12">
        <Group title="修正建议">
          <List
            numbered
            columns={3}
            items={data.issues.map((i) => ({
              title: i.title,
              description: i.suggestion,
            }))}
          />
        </Group>
        <Group title="替换色值">
          <DataTable
            caption="数值为修正前后的对比度;背景为 #FFFFFF,主按钮悬停行背景为 #096DD9。"
            columns={[
              { key: "where", label: "位置", span: 2 },
              { key: "from", label: "原色", span: 2 },
              { key: "to", label: "改为", span: 2 },
              { key: "before", label: "修正前", span: 1, align: "right" },
              { key: "after", label: "修正后", span: 2, align: "right" },
            ]}
            rows={fixRows}
          />
        </Group>
      </Section>

      <Section title="背景信息" description="检查对象、标准与方法">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "标准", value: data.standard },
            { label: "方法", value: data.method },
            {
              label: "覆盖范围",
              value: `${data.palette.length} 个颜色 token · ${kpiValue("pairs")} 组文字与背景组合`,
            },
            { label: "结论", value: data.verdict },
          ]}
        />
      </Section>
    </Page>
  )
}
