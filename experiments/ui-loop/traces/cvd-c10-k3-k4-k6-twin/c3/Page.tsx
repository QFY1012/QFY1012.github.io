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

const kpiOrder = ["issues", "pairs", "fail", "confuse"]
const kpis = kpiOrder
  .map((key) => data.kpis.find((kpi) => kpi.key === key))
  .filter((kpi): kpi is (typeof data.kpis)[number] => Boolean(kpi))
const totalIssues = data.kpis.find((kpi) => kpi.key === "issues")?.value ?? data.issues.length
const screens = data.screens

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={data.method}>
        <Text className="text-2xl leading-9 font-light">{`${data.verdict}。${data.summary}`}</Text>
      </Section>

      <Section title="核心指标" description={`按 ${data.standard} 逐项检查的计数`}>
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={2}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              size="lg"
            />
          ))}
        </Grid>
      </Section>

      <Section title="色觉模拟" description="按 Machado 2009 模型模拟三种色觉，每行两张对照">
        <Group>
          <FigureStrip>
            {screens.slice(0, 2).map((screen) => (
              <Figure key={screen.view}>
                <FigureImage src={screen.image} alt={`${data.target} ${screen.view}`} />
                <FigureLabel>{screen.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
          <FigureStrip>
            {screens.slice(2, 4).map((screen) => (
              <Figure key={screen.view}>
                <FigureImage src={screen.image} alt={`${data.target} ${screen.view}`} />
                <FigureLabel>{screen.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
        </Group>
      </Section>

      <Section title="分群" description={`按色盲类型统计，共 ${totalIssues} 个问题`}>
        <Grid cols={9} fields={false} className="items-baseline">
          {data.byType.map((item) => (
            <Stat
              key={item.type}
              span={2}
              value={item.issues}
              unit="个"
              label={item.type}
              captionBelow
              note={`问题总数 ${totalIssues} 个`}
            />
          ))}
        </Grid>
      </Section>

      <Section title="混淆色对" description="色差为 CIEDE2000 ΔE，小于 12 视为难以区分">
        <DataTable
          columns={[
            { key: "where", label: "颜色对", span: 3 },
            { key: "normal", label: "正常", align: "right", span: 1 },
            { key: "protan", label: "红色盲", align: "right", span: 1 },
            { key: "deutan", label: "绿色盲", align: "right", span: 1 },
            { key: "tritan", label: "蓝色盲", align: "right", span: 1 },
            { key: "affected", label: "难以区分于", span: 2 },
          ]}
          rows={data.confusions.map((row) => ({
            where: row.where,
            normal: row.normal.toFixed(1),
            protan: row["红色盲"].toFixed(1),
            deutan: row["绿色盲"].toFixed(1),
            tritan: row["蓝色盲"].toFixed(1),
            affected: row.affected.length > 0 ? row.affected.join("、") : "—",
          }))}
          muteWhen={{ key: "affected", equals: "—" }}
          caption="同一色对在不同色觉下的 ΔE；数值越小越难区分"
        />
      </Section>

      <Section title="对比度" description="阈值取 WCAG 2.2 AA 的 4.5:1">
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 3 },
            { key: "fg", label: "文字", span: 1 },
            { key: "bg", label: "底色", span: 1 },
            { key: "ratio", label: "实测", align: "right", span: 1 },
            { key: "required", label: "要求", align: "right", span: 1 },
            { key: "result", label: "结论", span: 2, tone: ["不达标"] },
          ]}
          rows={data.contrast.map((row) => ({
            where: row.where,
            fg: row.fg,
            bg: row.bg,
            ratio: row.ratio.toFixed(2),
            required: row.required.toFixed(1),
            result: row.pass ? "达标" : "不达标",
          }))}
          caption="文字与底色的对比度实测值，低于 4.5:1 视为不达标"
        />
      </Section>

      <Section title="色板" description="四级路况的配色与用途">
        <DataTable
          columns={[
            { key: "name", label: "级别", span: 3 },
            { key: "hex", label: "色值", span: 2 },
            { key: "usage", label: "用途", span: 4 },
          ]}
          rows={data.palette}
        />
      </Section>

      <Section title="明细" description={`${data.issues.length} 个问题，严重程度标红`}>
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "type", label: "类型", span: 1 },
            { key: "location", label: "位置", span: 1 },
            { key: "severity", label: "严重", span: 1, tone: ["高"] },
            { key: "affects", label: "影响", span: 1 },
            { key: "suggestion", label: "建议", span: 2 },
          ]}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            title: issue.title,
            type: issue.type,
            location: issue.location,
            severity: issue.severity,
            affects: issue.affects.length > 0 ? issue.affects.join("、") : "—",
            suggestion: issue.suggestion,
          }))}
        />
      </Section>

      <Section title="下一步" description="针对每个问题的修复动作">
        <List
          columns={3}
          numbered
          items={data.issues.map((issue) => ({
            title: issue.suggestion,
            description: `${issue.id} · ${issue.location} · ${issue.type}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="检查对象与依据">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "检查标准", value: data.standard },
            { label: "分析方法", value: data.method },
            { label: "结论", value: data.verdict },
          ]}
        />
      </Section>
    </Page>
  )
}
