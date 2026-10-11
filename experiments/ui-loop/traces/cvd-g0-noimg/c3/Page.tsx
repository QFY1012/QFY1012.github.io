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

const totalIssues = data.kpis.find((k) => k.key === "issues")?.value ?? 0

const paletteRows = data.palette.map((p) => ({
  name: p.name,
  hex: p.hex,
  usage: p.usage,
}))

const contrastRows = data.contrast.map((c) => ({
  where: c.where,
  fg: c.fg,
  bg: c.bg,
  ratio: c.ratio,
  required: c.required,
  result: c.pass ? "达标" : "不达标",
}))

const confusionRows = data.confusions.map((c) => ({
  where: c.where,
  normal: String(c.normal),
  protan: String(c["红色盲"]),
  deutan: String(c["绿色盲"]),
  tritan: String(c["蓝色盲"]),
  affected: c.affected.length > 0 ? c.affected.join("、") : "—",
}))

const issueRows = data.issues.map((it) => ({
  id: it.id,
  title: it.title,
  type: it.type,
  location: it.location,
  severity: it.severity,
  suggestion: it.suggestion,
}))

const byTypeItems = data.byType.map((t) => ({
  label: t.type,
  value: t.issues,
  max: totalIssues,
  display: `${t.issues} 个`,
}))

const nextSteps = data.issues.map((it) => ({
  title: it.suggestion,
  description: `${it.id} · ${it.title}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section
        title="结论"
        description="Machado 2009 模型模拟 · CIEDE2000 色差"
      >
        <Text className="text-2xl leading-9 font-light">
          {`整体判定：${data.verdict}。${data.summary}`}
        </Text>
      </Section>

      <Section title="核心指标" description="本次检查覆盖的组合与问题">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={4}
            unit="个"
            label="问题总数"
            captionBelow
          />
          <Stat
            span={3}
            value={2}
            unit="组"
            label="对比度不达标"
            captionBelow
          />
          <Stat
            span={3}
            value={2}
            unit="对"
            label="色盲用户难以区分的颜色"
            captionBelow
          />
          <Stat
            span={3}
            value={4}
            unit="组"
            label="检查的文字与背景组合"
            captionBelow
          />
        </Grid>
      </Section>

      <Section
        title="颜色"
        description="路况四级色板，及前景与背景的对比度"
        className="gap-12"
      >
        <Group>
          <DataTable
            columns={[
              { key: "name", label: "颜色", span: 2 },
              { key: "hex", label: "色值", span: 2 },
              { key: "usage", label: "用途", span: 5 },
            ]}
            rows={paletteRows}
          />
        </Group>
        <Group>
          <DataTable
            caption="对比度要求 4.5:1"
            columns={[
              { key: "where", label: "场景", span: 3 },
              { key: "fg", label: "前景", span: 1 },
              { key: "bg", label: "背景", span: 1 },
              { key: "ratio", label: "对比度", align: "right", span: 2 },
              { key: "required", label: "要求", align: "right", span: 1 },
              {
                key: "result",
                label: "结果",
                span: 1,
                tone: ["不达标"],
              },
            ]}
            rows={contrastRows}
          />
        </Group>
      </Section>

      <Section
        title="模拟色差"
        description="ΔE 小于 12 视为难以区分"
        className="gap-12"
      >
        <Group>
          <Grid cols={9} fields={false}>
            <Block span={3} title="按色盲类型的问题数">
              <ProgressList items={byTypeItems} compact />
            </Block>
          </Grid>
        </Group>
        <Group>
          <DataTable
            columns={[
              { key: "where", label: "颜色对", span: 3 },
              { key: "normal", label: "正常视觉", align: "right", span: 1 },
              {
                key: "protan",
                label: "红色盲",
                align: "right",
                span: 1,
                tone: ["8.9"],
              },
              {
                key: "deutan",
                label: "绿色盲",
                align: "right",
                span: 1,
                tone: ["8.2"],
              },
              { key: "tritan", label: "蓝色盲", align: "right", span: 1 },
              { key: "affected", label: "难以区分人群", span: 2 },
            ]}
            rows={confusionRows}
          />
        </Group>
      </Section>

      <Section title="问题明细" description="共 4 个问题，其中高严重度 2 个">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "type", label: "类型", span: 1 },
            { key: "location", label: "位置", span: 1 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "suggestion", label: "建议", span: 2 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="按问题逐条给出修改建议">
        <List items={nextSteps} numbered columns={3} />
      </Section>

      <Section title="背景信息" description="检查对象、标准与口径">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "判定", value: data.verdict },
            { label: "标准", value: data.standard },
            { label: "方法", value: data.method },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
