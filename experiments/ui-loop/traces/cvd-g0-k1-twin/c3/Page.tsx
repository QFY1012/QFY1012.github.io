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
  const issueTotal = data.kpis.find((k) => k.key === "issues")?.value ?? 0

  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={`按 ${data.standard} 判定`}>
        <Group>
          <Text className="text-2xl leading-9 font-light">{data.verdict}</Text>
          <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
        </Group>
      </Section>

      <Section title="核心指标" description={`本次共发现 ${issueTotal} 个问题`}>
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              size="lg"
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照">
        <FigureStrip>
          {data.screens.map((s) => (
            <Figure key={s.view}>
              <FigureImage src={s.image} alt={`${data.target} ${s.view}`} />
              <FigureLabel>{s.view}</FigureLabel>
            </Figure>
          ))}
        </FigureStrip>
      </Section>

      <Section title="路况色板" description="四级路况色的取值与用途">
        <DataTable
          columns={[
            { key: "name", label: "颜色", span: 3 },
            { key: "hex", label: "色值", span: 3 },
            { key: "usage", label: "用途", span: 3 },
          ]}
          rows={data.palette}
        />
      </Section>

      <Section title="颜色混淆" description="正常视力与三种色盲下的色差 ΔE" className="gap-12">
        <DataTable
          columns={[
            { key: "where", label: "颜色对", span: 3, muteWhen: { key: "affected", equals: "" } },
            { key: "normal", label: "正常", align: "right", span: 1 },
            { key: "红色盲", label: "红色盲", align: "right", span: 1 },
            { key: "绿色盲", label: "绿色盲", align: "right", span: 1 },
            { key: "蓝色盲", label: "蓝色盲", align: "right", span: 1 },
            { key: "affected", label: "难以区分", span: 2 },
          ]}
          rows={data.confusions.map((c) => ({ ...c, affected: c.affected.join("、") }))}
          caption={data.method}
        />
        <Grid cols={9}>
          <Block span={3} title="各色盲类型问题数">
            <ProgressList
              compact
              items={data.byType.map((t) => ({
                label: t.type,
                value: t.issues,
                max: issueTotal,
                display: `${t.issues} 个`,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="对比度" description="路名标注与底色的对比度，阈值 4.5:1">
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 3 },
            { key: "fg", label: "文字色", span: 1 },
            { key: "bg", label: "背景色", span: 1 },
            { key: "ratio", label: "对比度", align: "right", span: 1 },
            { key: "required", label: "要求", align: "right", span: 1 },
            { key: "result", label: "结论", span: 2, tone: ["不达标"] },
          ]}
          rows={data.contrast.map((c) => ({ ...c, result: c.pass ? "达标" : "不达标" }))}
        />
      </Section>

      <Section title="问题清单" description="按严重程度排列的问题明细">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "type", label: "类型", span: 1 },
            { key: "location", label: "位置", span: 1 },
            { key: "severity", label: "严重程度", span: 1, tone: ["高"] },
            { key: "affects", label: "影响人群", span: 2 },
          ]}
          rows={data.issues.map((i) => ({ ...i, affects: i.affects.join("、") || "—" }))}
        />
      </Section>

      <Section title="下一步" description="针对每个问题的修改建议">
        <List
          numbered
          columns={3}
          items={data.issues.map((i) => ({
            title: i.suggestion,
            description: `${i.id} · ${i.type} · ${i.location}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="分析对象、标准与方法">
        <KV
          labelCols={2}
          items={[
            { label: "分析对象", value: data.target },
            { label: "分析日期", value: data.date },
            { label: "无障碍标准", value: data.standard },
            { label: "分析方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
