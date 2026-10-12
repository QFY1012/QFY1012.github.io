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

const kpiMap = new Map(data.kpis.map((k) => [k.key, k]))
// G1: 结论项 issues 排到整组第一位,其余按原顺序
const kpis = ["issues", "pairs", "fail", "confuse"].map((key) => kpiMap.get(key)!)
const kpiSpan = Math.floor(9 / kpis.length)

// G2: 每两张排一行
const screenRows: (typeof data.screens)[] = []
for (let i = 0; i < data.screens.length; i += 2) {
  screenRows.push(data.screens.slice(i, i + 2))
}

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={`${data.standard} 口径下的整体判断`}>
        <Text className="text-2xl leading-9 font-light">
          {`${data.verdict}。${data.summary}`}
        </Text>
      </Section>

      <Section title="核心指标" description="本次检查的关键数字">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={kpiSpan}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              size="lg"
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="色觉模拟"
        description="原界面与三种色觉模拟,每行两张对照"
      >
        <Group>
          {screenRows.map((row, i) => (
            <FigureStrip key={i}>
              {row.map((screen) => (
                <Figure key={screen.view}>
                  <FigureImage
                    src={screen.image}
                    alt={`${data.target} · ${screen.view}`}
                  />
                  <FigureLabel>{screen.view}</FigureLabel>
                </Figure>
              ))}
            </FigureStrip>
          ))}
        </Group>
      </Section>

      <Section
        title="颜色混淆"
        description="同一对颜色在正常与三种色觉下的色差 ΔE,小于 12 视为难以区分"
      >
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 3 },
            { key: "normal", label: "正常", align: "right", span: 1 },
            { key: "protan", label: "红色盲", align: "right", span: 1 },
            { key: "deuter", label: "绿色盲", align: "right", span: 1 },
            { key: "tritan", label: "蓝色盲", align: "right", span: 1 },
            { key: "affected", label: "受影响", span: 2 },
          ]}
          rows={data.confusions.map((c) => ({
            where: c.where,
            normal: c.normal.toFixed(1),
            protan: c["红色盲"].toFixed(1),
            deuter: c["绿色盲"].toFixed(1),
            tritan: c["蓝色盲"].toFixed(1),
            affected: c.affected.join("、"),
          }))}
          caption="色差为 CIEDE2000 ΔE,阈值 12;9.0 为不达标的组合"
        />
      </Section>

      <Section
        title="对比度"
        description="6 组文字与背景的对比度,1 组不达标"
      >
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 2 },
            { key: "fg", label: "前景色", span: 2 },
            { key: "bg", label: "背景色", span: 2 },
            { key: "ratio", label: "对比度", align: "right", span: 1 },
            { key: "required", label: "要求", align: "right", span: 1 },
            { key: "result", label: "结果", span: 1, tone: ["不达标"] },
          ]}
          rows={data.contrast.map((c) => ({
            where: c.where,
            fg: c.fg,
            bg: c.bg,
            ratio: c.ratio.toFixed(2),
            required: c.required.toFixed(1),
            result: c.pass ? "通过" : "不达标",
          }))}
          caption="对比度按 WCAG 2.2 AA 计算,正文阈值 4.5、大字阈值 3.0"
        />
      </Section>

      <Section title="调色板" description="页面用到的主色及其用途">
        <DataTable
          columns={[
            { key: "name", label: "名称", span: 2 },
            { key: "hex", label: "色值", span: 2 },
            { key: "usage", label: "用途", span: 5 },
          ]}
          rows={data.palette.map((p) => ({
            name: p.name,
            hex: p.hex,
            usage: p.usage,
          }))}
        />
      </Section>

      <Section title="分类型" description="各色觉类型下发现的问题数">
        <Grid cols={9}>
          <Block span={3} title="各色觉类型的问题数">
            <ProgressList
              compact
              items={data.byType.map((t) => ({
                label: t.type,
                value: t.issues,
                max: 3,
                display: `${t.issues} 个`,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="明细" description="3 个问题的位置与严重程度">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "type", label: "类型", span: 2 },
            { key: "location", label: "位置", span: 2 },
            { key: "severity", label: "严重程度", span: 1 },
          ]}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            title: issue.title,
            type: issue.type,
            location: issue.location,
            severity: issue.severity,
          }))}
        />
        <Group title="对比度修复对照">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 2 },
              { key: "from", label: "修改前", span: 2 },
              { key: "to", label: "修改后", span: 2 },
              { key: "bg", label: "背景", span: 1 },
              { key: "before", label: "改前对比度", align: "right", span: 1, tone: ["1.61"] },
              { key: "after", label: "改后对比度", align: "right", span: 1 },
            ]}
            rows={data.fixes.map((f) => ({
              where: f.where,
              from: f.from,
              to: f.to,
              bg: f.bg,
              before: f.before.toFixed(2),
              after: f.after.toFixed(2),
            }))}
          />
        </Group>
      </Section>

      <Section title="下一步" description="按问题给出的修改建议">
        <List
          columns={3}
          numbered
          items={data.issues.map((issue) => ({
            title: `${issue.id} · ${issue.title}`,
            description: issue.suggestion,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次分析的口径与来源">
        <KV
          labelCols={2}
          items={[
            { label: "分析对象", value: data.target },
            { label: "分析日期", value: data.date },
            { label: "标准", value: data.standard },
            { label: "方法", value: data.method },
            {
              label: "截图",
              value: `${data.screens.length} 张(${data.screens.map((s) => s.view).join("、")})`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}
