import data from "./data.json"
import { Page, Section, Group, Grid, Block, Text, Stat, DataTable, List, KV, FigureStrip, Figure, FigureImage, FigureLabel } from "@/components/report"

const kpis: Record<string, { label: string; value: number; unit: string }> = Object.fromEntries(
  data.kpis.map((k) => [k.key, k]),
)

const contrastRows = data.contrast.map((c) => ({
  where: c.where,
  bg: c.bg,
  ratio: c.ratio.toFixed(2),
  verdict: c.pass ? "达标" : "不达标",
}))

const confusionRows = data.confusions.map((c) => ({
  where: c.where,
  normal: c.normal,
  protan: c["红色盲"],
  deuter: c["绿色盲"],
  tritan: c["蓝色盲"],
  affected: c.affected.length > 0 ? c.affected.join("、") : "—",
}))

const issueRows = data.issues.map((i) => ({
  id: i.id,
  title: i.title,
  type: i.type,
  location: i.location,
  severity: i.severity,
}))

const suggestionRows = data.issues.map((i) => ({
  id: i.id,
  affects: i.affects.length > 0 ? i.affects.join("、") : "—",
  suggestion: i.suggestion,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={`依据 ${data.standard} 检查`}>
        <Text className="text-2xl leading-9 font-light">{`${data.verdict}:${data.summary}`}</Text>
      </Section>

      <Section title="核心指标" description="本轮检查 9 组文字与底色组合的结果">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpis.fail.value}
            unit={kpis.fail.unit}
            label={kpis.fail.label}
            note="要求 ≥ 4.5:1"
            direction="down"
          />
          <Stat
            span={3}
            captionBelow
            value={kpis.pairs.value}
            unit={kpis.pairs.unit}
            label={kpis.pairs.label}
          />
          <Stat
            span={3}
            captionBelow
            value={kpis.confuse.value}
            unit={kpis.confuse.unit}
            label={kpis.confuse.label}
          />
          <Stat
            span={3}
            captionBelow
            value={kpis.issues.value}
            unit={kpis.issues.unit}
            label={kpis.issues.label}
          />
        </Grid>
      </Section>

      <Section title="模拟视图" description="按 Machado 2009 模型模拟出的屏幕">
        <Block title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照">
          <FigureStrip>
            {data.screens.map((s) => (
              <Figure key={s.view}>
                <FigureImage src={s.image} alt={s.view} />
                <FigureLabel>{s.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
        </Block>
      </Section>

      <Section title="对比度" description="文字均为白色 #FFFFFF,要求对比度 ≥ 4.5:1">
        <DataTable
          columns={[
            { key: "where", label: "检查位置", span: 3 },
            { key: "bg", label: "底色", span: 2 },
            { key: "ratio", label: "对比度", align: "right", span: 2 },
            { key: "verdict", label: "结论", span: 2, tone: ["不达标"] },
          ]}
          rows={contrastRows}
        />
      </Section>

      <Section
        title="混淆色"
        description="色差为 CIEDE2000 ΔE,小于 12 视为难以区分"
        className="gap-12"
      >
        <Group title="各色盲类型受影响的问题数">
          <Grid cols={9} fields={false} className="items-baseline">
            {data.byType.map((t) => (
              <Stat
                key={t.type}
                span={2}
                captionBelow
                value={t.issues}
                unit="个"
                label={t.type}
                note="受影响问题数"
              />
            ))}
          </Grid>
        </Group>
        <Group title="色差最小的颜色对">
          <DataTable
            columns={[
              { key: "where", label: "颜色对", span: 3 },
              { key: "normal", label: "正常", align: "right", span: 1 },
              { key: "protan", label: "红色盲", align: "right", span: 1 },
              { key: "deuter", label: "绿色盲", align: "right", span: 1 },
              { key: "tritan", label: "蓝色盲", align: "right", span: 1 },
              { key: "affected", label: "受影响", span: 2 },
            ]}
            rows={confusionRows}
            caption="数值为 CIEDE2000 ΔE,小于 12 视为难以区分"
          />
        </Group>
      </Section>

      <Section title="问题清单" description="7 个问题与对应的修改建议" className="gap-12">
        <Group title="问题">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "title", label: "问题", span: 3 },
              { key: "type", label: "类型", span: 2 },
              { key: "location", label: "位置", span: 2 },
              { key: "severity", label: "严重", span: 1, tone: ["高"] },
            ]}
            rows={issueRows}
          />
        </Group>
        <Group title="修改建议">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "affects", label: "受影响色觉类型", span: 4 },
              { key: "suggestion", label: "建议", span: 4 },
            ]}
            rows={suggestionRows}
          />
        </Group>
      </Section>

      <Section title="下一步" description="优先处理的三件事">
        <List
          columns={3}
          numbered
          items={[
            {
              title: "加深文字对比度",
              description: "格子改为浅色底配深色字,对比度达到 4.5:1。",
            },
            {
              title: "补上文字标签",
              description: "每个格子左上角写类别简称,考试格子加图标与倒计时。",
            },
            {
              title: "精简配色数量",
              description: "合并为 5 个以内,其余用文字标签,易混的两类换色或加边框。",
            },
          ]}
        />
      </Section>

      <Section title="背景信息" description="检查对象、依据与方法">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "依据标准", value: data.standard },
            { label: "检查方法", value: data.method },
            { label: "模拟视图", value: data.screens.map((s) => s.view).join("、") },
          ]}
        />
      </Section>
    </Page>
  )
}
