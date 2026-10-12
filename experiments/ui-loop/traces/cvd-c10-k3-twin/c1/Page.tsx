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

export default function Report() {
  const kpiOrder = ["issues", "pairs", "fail", "confuse"]
  const kpis = kpiOrder.map((key) => data.kpis.find((item) => item.key === key)!)

  const confusionColumns = [
    { key: "where", label: "色对位置", span: 3 },
    { key: "normal", label: "正常视觉", span: 1, align: "right" as const },
    { key: "protan", label: "红色盲", span: 1, align: "right" as const, tone: ["7.8"] },
    { key: "deuter", label: "绿色盲", span: 1, align: "right" as const, tone: ["3.9", "8.7", "11.2", "11.6"] },
    { key: "tritan", label: "蓝色盲", span: 1, align: "right" as const },
    { key: "affected", label: "受影响人群", span: 2 },
  ]
  const confusionRows = data.confusions.map((item) => ({
    where: item.where,
    normal: item.normal,
    protan: item.红色盲,
    deuter: item.绿色盲,
    tritan: item.蓝色盲,
    affected: item.affected.length > 0 ? item.affected.join("、") : "—",
  }))

  const paletteColumns = [
    { key: "name", label: "系列", span: 2 },
    { key: "hex", label: "色值", span: 3 },
    { key: "usage", label: "用途", span: 4 },
  ]

  const issueColumns = [
    { key: "id", label: "编号", span: 1 },
    { key: "title", label: "问题", span: 3 },
    { key: "type", label: "类型", span: 1 },
    { key: "location", label: "位置", span: 1 },
    { key: "severity", label: "严重", span: 1, tone: ["高"] },
    { key: "affects", label: "影响人群", span: 2 },
  ]
  const issueRows = data.issues.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    location: item.location,
    severity: item.severity,
    affects: item.affects.length > 0 ? item.affects.join("、") : "—",
  }))

  const contrastColumns = [
    { key: "where", label: "位置", span: 2 },
    { key: "fg", label: "前景", span: 2 },
    { key: "bg", label: "背景", span: 2 },
    { key: "ratio", label: "实测", span: 1, align: "right" as const },
    { key: "required", label: "要求", span: 1, align: "right" as const },
    { key: "result", label: "结果", span: 1, tone: ["不达标"] },
  ]
  const contrastRows = data.contrast.map((item) => ({
    where: item.where,
    fg: item.fg,
    bg: item.bg,
    ratio: item.ratio,
    required: item.required,
    result: item.pass ? "达标" : "不达标",
  }))

  const fixColumns = [
    { key: "where", label: "位置", span: 2 },
    { key: "from", label: "原色", span: 2 },
    { key: "to", label: "改为", span: 2 },
    { key: "bg", label: "背景", span: 1 },
    { key: "before", label: "修复前", span: 1, align: "right" as const },
    { key: "after", label: "修复后", span: 1, align: "right" as const },
  ]

  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={data.standard}>
        <Group>
          <Text className="text-2xl leading-9 font-light">{data.verdict}</Text>
          <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
        </Group>
      </Section>

      <Section title="核心指标" description="看板首页检查结果汇总">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((item) => (
            <Stat
              key={item.key}
              span={2}
              value={item.value}
              label={item.label}
              unit={item.unit}
              captionBelow
              size="lg"
            />
          ))}
        </Grid>
      </Section>

      <Section title="色觉模拟" description="原界面与三种色盲模拟对照">
        <Group>
          <FigureStrip>
            {data.screens.slice(0, 2).map((screen) => (
              <Figure key={screen.view}>
                <FigureImage src={screen.image} alt={`${data.title} · ${screen.view}`} />
                <FigureLabel>{screen.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
          <FigureStrip>
            {data.screens.slice(2, 4).map((screen) => (
              <Figure key={screen.view}>
                <FigureImage src={screen.image} alt={`${data.title} · ${screen.view}`} />
                <FigureLabel>{screen.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
        </Group>
      </Section>

      <Section title="颜色混淆" description="按障碍类型的问题数与色差实测" className="gap-12">
        <Group>
          <Grid cols={9} fields={false}>
            <Block span={3} title="按障碍类型">
              <ProgressList
                compact
                items={data.byType.map((item) => ({ label: item.type, value: item.issues }))}
              />
            </Block>
          </Grid>
        </Group>
        <Group>
          <DataTable columns={confusionColumns} rows={confusionRows} caption={data.method} />
        </Group>
      </Section>

      <Section title="明细" description="图表用色、问题清单与对比度实测" className="gap-12">
        <Group title="图表用色">
          <DataTable columns={paletteColumns} rows={data.palette} />
        </Group>
        <Group title="问题清单">
          <DataTable columns={issueColumns} rows={issueRows} />
        </Group>
        <Group title="对比度实测">
          <DataTable
            columns={contrastColumns}
            rows={contrastRows}
            caption="实测值与要求值均为对比度比值,低于要求值的记为不达标"
          />
        </Group>
      </Section>

      <Section title="下一步" description="按问题给出的修改方案" className="gap-12">
        <Group title="修改方案">
          <DataTable columns={fixColumns} rows={data.fixes} />
        </Group>
        <Group title="修改建议">
          <List
            numbered
            items={data.issues.map((item) => ({
              title: `${item.id} · ${item.title}`,
              description: item.suggestion,
            }))}
          />
        </Group>
      </Section>

      <Section title="背景信息" description="分析对象与方法">
        <KV
          labelCols={2}
          items={[
            { label: "分析对象", value: data.target },
            { label: "分析日期", value: data.date },
            { label: "遵循标准", value: data.standard },
            { label: "分析方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
