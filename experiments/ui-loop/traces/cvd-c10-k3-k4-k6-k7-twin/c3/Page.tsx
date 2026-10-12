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

const cvdTypes = ["红色盲", "绿色盲", "蓝色盲"] as const

export default function Report() {
  const issuesKpi = data.kpis.find((k) => k.key === "issues")
  const kpis = issuesKpi
    ? [issuesKpi, ...data.kpis.filter((k) => k.key !== "issues")]
    : data.kpis
  const kpiSpan = Math.floor(9 / Math.min(kpis.length, 4))

  const screenRows: (typeof data.screens)[] = []
  for (let i = 0; i < data.screens.length; i += 2) {
    screenRows.push(data.screens.slice(i, i + 2))
  }

  const confusionRows = data.confusions.map((c) => ({
    where: c.where,
    normal: c.normal.toFixed(1),
    红色盲: c["红色盲"].toFixed(1),
    绿色盲: c["绿色盲"].toFixed(1),
    蓝色盲: c["蓝色盲"].toFixed(1),
    affected: c.affected.length ? c.affected.join("、") : "—",
  }))

  const confusionColumns = [
    { key: "where", label: "颜色对", span: 3 },
    { key: "normal", label: "正常视觉", align: "right" as const, span: 1 },
    ...cvdTypes.map((t) => ({
      key: t,
      label: t,
      align: "right" as const,
      span: 1,
      tone: data.confusions
        .map((c) => c[t].toFixed(1))
        .filter((v) => Number(v) < 12),
    })),
    { key: "affected", label: "受影响", span: 2 },
  ]

  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={`${data.standard} 判定`}>
        <Text className="text-2xl leading-9 font-light">
          {`判定:${data.verdict}。${data.summary}`}
        </Text>
      </Section>

      <Section title="核心指标" description="四项计数的口径">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={kpiSpan}
              captionBelow
              size="lg"
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="色觉模拟" description="原界面与三种色觉模拟,每行两张">
        <Group>
          {screenRows.map((row) => (
            <FigureStrip key={row[0].view}>
              {row.map((screen) => (
                <Figure key={screen.view}>
                  <FigureImage
                    src={screen.image}
                    alt={`${data.target} ${screen.view}`}
                  />
                  <FigureLabel>{screen.view}</FigureLabel>
                </Figure>
              ))}
            </FigureStrip>
          ))}
        </Group>
      </Section>

      <Section
        title="颜色与对比"
        description="路况四级配色,及路名文字在其上的对比度"
        className="gap-12"
      >
        <Group title="路况四级配色">
          <DataTable
            columns={[
              { key: "name", label: "等级", span: 3 },
              { key: "hex", label: "色值", span: 3 },
              { key: "usage", label: "用途", span: 3 },
            ]}
            rows={data.palette}
          />
        </Group>
        <Group title="路名文字对比度">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 3 },
              { key: "fg", label: "文字色", span: 1 },
              { key: "bg", label: "底色", span: 1 },
              { key: "ratio", label: "对比度", align: "right", span: 2 },
              { key: "required", label: "要求", align: "right", span: 1 },
              {
                key: "pass",
                label: "结论",
                span: 1,
                tone: ["不达标"],
              },
            ]}
            rows={data.contrast.map((row) => ({
              where: row.where,
              fg: row.fg,
              bg: row.bg,
              ratio: row.ratio,
              required: row.required,
              pass: row.pass ? "达标" : "不达标",
            }))}
            caption="对比度按 WCAG 2.2 AA,正文文字要求 4.5:1"
          />
        </Group>
      </Section>

      <Section
        title="色觉混淆"
        description="CIEDE2000 ΔE,小于 12 视为难以区分"
        className="gap-12"
      >
        <Group title="颜色对色差">
          <DataTable
            columns={confusionColumns}
            rows={confusionRows}
            caption="红色为低于阈值 12 的色差"
          />
        </Group>
        <Group title="按色觉类型">
          <Grid cols={9}>
            <Block span={3}>
              <ProgressList
                compact
                items={data.byType.map((t) => ({
                  label: t.type,
                  value: t.issues,
                }))}
              />
            </Block>
          </Grid>
        </Group>
      </Section>

      <Section title="问题明细" description="按问题逐条列出类型、位置与建议">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "type", label: "类型", span: 1 },
            { key: "location", label: "位置", span: 1 },
            {
              key: "severity",
              label: "严重度",
              span: 1,
              levels: ["低", "中", "高"],
            },
            { key: "affects", label: "影响", span: 1 },
            { key: "suggestion", label: "建议", span: 2 },
          ]}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            title: issue.title,
            type: issue.type,
            location: issue.location,
            severity: issue.severity,
            affects: issue.affects.length ? issue.affects.join("、") : "—",
            suggestion: issue.suggestion,
          }))}
        />
      </Section>

      <Section title="下一步" description="按问题给出的修改建议">
        <List
          numbered
          columns={3}
          items={data.issues.map((issue) => ({
            title: issue.suggestion,
            description: `${issue.id} · ${issue.location}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="检查对象与口径">
        <KV
          labelCols={2}
          items={[
            { label: "产品", value: data.target },
            { label: "检查标准", value: data.standard },
            { label: "检查方法", value: data.method },
            { label: "检查日期", value: data.date },
            { label: "判定", value: data.verdict },
          ]}
        />
      </Section>
    </Page>
  )
}
