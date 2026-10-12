import data from "./data.json"
import {
  Page,
  Section,
  Grid,
  Block,
  Text,
  Stat,
  DataTable,
  KV,
  FigureCompare,
  Figure,
  FigureImage,
  FigureLabel,
} from "@/components/report"

const totalIssues = data.issues.length

const kpi = (key: string) => data.kpis.find((k) => k.key === key)!

export default function Report() {
  const fail = kpi("fail")
  const pairs = kpi("pairs")
  const confuse = kpi("confuse")
  const issues = kpi("issues")

  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={`按 ${data.standard} 评估`}>
        <Text className="text-2xl leading-9 font-light">
          {`${data.verdict}。${data.summary}`}
        </Text>
      </Section>

      <Section title="核心指标" description="本次检查的范围与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={2}
            captionBelow
            size="lg"
            value={issues.value}
            unit={issues.unit}
            label={issues.label}
          />
          <Stat span={2} captionBelow size="lg" value={pairs.value} unit={pairs.unit} label={pairs.label} />
          <Stat span={2} captionBelow size="lg" value={fail.value} unit={fail.unit} label={fail.label} />
          <Stat span={2} captionBelow size="lg" value={confuse.value} unit={confuse.unit} label={confuse.label} />
        </Grid>
      </Section>

      <Section title="模拟视图" description="按 Machado 2009 模型模拟红色盲、绿色盲、蓝色盲">
        <Block title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照">
          <FigureCompare>
            {data.screens.map((s) => (
              <Figure key={s.view}>
                <FigureImage src={s.image} alt={s.view} />
                <FigureLabel>{s.view}</FigureLabel>
              </Figure>
            ))}
          </FigureCompare>
        </Block>
      </Section>

      <Section title="类型分布" description={`各色盲类型发现的问题数,共 ${totalIssues} 个`}>
        <Grid cols={9} fields={false}>
          {data.byType.map((t) => (
            <Stat key={t.type} span={2} captionBelow value={t.issues} unit="个" label={t.type} />
          ))}
        </Grid>
      </Section>

      <Section title="对比度" description="文字与背景的对比度,WCAG AA 阈值 4.5:1">
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 3 },
            { key: "bg", label: "底色", span: 2 },
            { key: "ratio", label: "对比度", align: "right", span: 2 },
            { key: "required", label: "要求", align: "right", span: 1 },
            { key: "result", label: "结果", span: 1, tone: ["不达标"] },
          ]}
          rows={data.contrast.map((c) => ({
            where: c.where,
            bg: c.bg,
            ratio: c.ratio,
            required: c.required,
            result: c.pass ? "达标" : "不达标",
          }))}
          caption="对比度按 WCAG 2.2 AA 正文标准 4.5:1;文字均为 #FFFFFF"
        />
      </Section>

      <Section title="色对混淆" description="CIEDE2000 色差 ΔE,小于 12 视为难以区分">
        <DataTable
          columns={[
            { key: "where", label: "色对", span: 3 },
            { key: "normal", label: "正常视觉", align: "right", span: 1 },
            { key: "红色盲", label: "红色盲", align: "right", span: 1 },
            { key: "绿色盲", label: "绿色盲", align: "right", span: 1 },
            { key: "蓝色盲", label: "蓝色盲", align: "right", span: 1 },
            { key: "affected", label: "受影响", span: 2 },
          ]}
          rows={data.confusions.map((c) => ({
            where: c.where,
            normal: c.normal,
            红色盲: c["红色盲"],
            绿色盲: c["绿色盲"],
            蓝色盲: c["蓝色盲"],
            affected: c.affected.length > 0 ? c.affected.join("、") : "—",
          }))}
          caption="ΔE 为 CIEDE2000 色差;小于 12 视为难以区分"
        />
      </Section>

      <Section title="问题明细" description={`${totalIssues} 个问题的位置、严重度与建议`}>
        <DataTable
          columns={[
            { key: "title", label: "问题", span: 2 },
            { key: "meta", label: "类型 · 位置", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "affects", label: "影响", span: 2 },
            { key: "suggestion", label: "建议", span: 2 },
          ]}
          rows={data.issues.map((i) => ({
            title: `${i.id} · ${i.title}`,
            meta: `${i.type} · ${i.location}`,
            severity: i.severity,
            affects: i.affects.length > 0 ? i.affects.join("、") : "—",
            suggestion: i.suggestion,
          }))}
        />
      </Section>

      <Section title="背景信息" description="产品、标准与模拟方法">
        <KV
          labelCols={2}
          items={[
            { label: "产品", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "标准", value: data.standard },
            { label: "模拟方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
