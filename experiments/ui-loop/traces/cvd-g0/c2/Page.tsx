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
} from "@/components/report"

const kpiNotes: Record<string, string> = {
  fail: "顶部白色标题 1.61:1",
  confuse: "绿色盲 · 配送进度条",
  issues: "中 2 个、低 1 个",
}

const confusionRows = data.confusions.map((c) => ({
  where: c.where,
  normal: c.normal,
  红色盲: c["红色盲"],
  绿色盲: c["绿色盲"],
  蓝色盲: c["蓝色盲"],
  affected: c.affected.join("、"),
}))

const contrastRows = data.contrast.map((c) => ({
  where: c.where,
  fg: c.fg,
  bg: c.bg,
  ratio: c.ratio,
  required: c.required,
  verdict: c.pass ? "达标" : "不达标",
}))

const contrastScoreItems = data.contrast.map((c) => ({
  label: c.where,
  value: c.ratio,
  max: 16.48,
  display: `${c.ratio}:1`,
}))

const paletteRows = data.palette.map((p) => ({
  name: p.name,
  hex: p.hex,
  usage: p.usage,
}))

const issueRows = data.issues.map((i) => ({
  id: i.id,
  title: i.title,
  type: i.type,
  location: i.location,
  severity: i.severity,
  affects: i.affects.length > 0 ? i.affects.join("、") : "—",
}))

export default function Report() {
  const fix = data.fixes[0]

  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section
        title="结论"
        description="WCAG 2.2 AA · Machado 2009 模型模拟,ΔE 小于 12 视为难以区分"
      >
        <Text className="text-2xl leading-9 font-light">
          {data.verdict + "。" + data.summary}
        </Text>
      </Section>

      <Section title="核心指标" description="共检查 6 组文字与背景组合,发现 3 个问题">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k, i) => (
            <Stat
              key={k.key}
              span={3}
              size="lg"
              captionBelow
              value={k.value}
              unit={k.unit}
              label={k.label}
              note={kpiNotes[k.key]}
              direction={i === 1 ? "down" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="色觉混淆"
        description="按色盲类型统计问题数,并比较配送进度条两色的模拟色差"
        className="gap-12"
      >
        <Group title="按色盲类型的问题数">
          <Grid cols={9} fields={false} className="items-baseline">
            {data.byType.map((t) => (
              <Stat
                key={t.type}
                span={2}
                captionBelow
                value={t.issues}
                unit="个"
                label={t.type}
                note={t.issues > 0 ? "涉及 P1、P3" : "无问题"}
              />
            ))}
          </Grid>
        </Group>
        <Group title="配送进度条两色的模拟色差 ΔE">
          <DataTable
            columns={[
              { key: "where", label: "场景", span: 3 },
              { key: "normal", label: "正常", align: "right", span: 1 },
              { key: "红色盲", label: "红色盲", align: "right", span: 1 },
              { key: "绿色盲", label: "绿色盲", align: "right", span: 1 },
              { key: "蓝色盲", label: "蓝色盲", align: "right", span: 1 },
              { key: "affected", label: "难以区分", span: 2, tone: ["绿色盲"] },
            ]}
            rows={confusionRows}
            caption="准时绿 #2BA471 与 超时红 #E34D59 的 CIEDE2000 色差 ΔE;小于 12 视为难以区分"
          />
        </Group>
      </Section>

      <Section
        title="对比度"
        description="WCAG 2.2 AA:正文要求 4.5:1,大号文字要求 3.0:1"
        className="gap-12"
      >
        <Grid cols={9} fields={false}>
          <Block span={3} title="对比度得分">
            <ProgressList compact items={contrastScoreItems} />
          </Block>
        </Grid>
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 3 },
            { key: "fg", label: "前景", span: 1 },
            { key: "bg", label: "背景", span: 1 },
            { key: "ratio", label: "对比度", align: "right", span: 1 },
            { key: "required", label: "要求", align: "right", span: 1 },
            { key: "verdict", label: "结论", span: 2, tone: ["不达标"] },
          ]}
          rows={contrastRows}
        />
      </Section>

      <Section title="色板" description="页面用到的 5 个颜色及用途">
        <DataTable
          columns={[
            { key: "name", label: "颜色", span: 3 },
            { key: "hex", label: "色值", span: 2 },
            { key: "usage", label: "用途", span: 4 },
          ]}
          rows={paletteRows}
        />
      </Section>

      <Section title="问题清单" description="共 3 个问题,其中 2 个只影响红、绿色盲用户">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "type", label: "类型", span: 1 },
            { key: "location", label: "位置", span: 1 },
            { key: "severity", label: "严重度", span: 1 },
            { key: "affects", label: "影响", span: 2 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section
        title="下一步"
        description="针对 3 个问题的修改建议,以及已验证的对比度修复"
      >
        <Grid cols={9} fields={false}>
          <List
            span={6}
            ordered
            divided={false}
            items={data.issues.map((i) => ({
              title: i.title,
              description: i.suggestion,
            }))}
          />
          <KV
            span={3}
            labelCols={1}
            items={[
              { label: "修复项", value: fix.where },
              { label: "调整", value: `${fix.from} → ${fix.to}` },
              { label: "背景", value: fix.bg },
              { label: "对比度", value: `${fix.before}:1 → ${fix.after}:1` },
            ]}
          />
        </Grid>
      </Section>

      <Section title="背景信息" description="检查范围、标准与模拟口径">
        <KV
          labelCols={2}
          items={[
            { label: "产品 / 页面", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "标准", value: data.standard },
            { label: "模拟方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
