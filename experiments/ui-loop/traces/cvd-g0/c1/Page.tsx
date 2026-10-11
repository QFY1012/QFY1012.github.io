import data from "./data.json"
import { Page, Section, Group, Grid, Text, Stat, DataTable, List, KV } from "@/components/report"

const totalIssues = data.issues.length

const confusionRows = data.confusions.map((c) => ({
  where: c.where,
  colors: c.colors.join(" / "),
  normal: c.normal,
  red: c["红色盲"],
  green: c["绿色盲"],
  blue: c["蓝色盲"],
}))

const contrastRows = data.contrast.map((c) => ({
  where: c.where,
  fg: c.fg,
  bg: c.bg,
  ratio: c.ratio,
  result: c.pass ? "通过" : "不达标",
}))

const issueRows = data.issues.map((i) => ({
  id: i.id,
  title: i.title,
  type: i.type,
  location: i.location,
  severity: i.severity,
}))

const suggestions = data.issues.map((i) => ({
  title: i.title,
  description: i.suggestion,
  meta: `${i.id} · ${i.type}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description="WCAG 2.2 AA 无障碍判定">
        <Text className="text-2xl leading-9 font-light">{`${data.verdict}。${data.summary}`}</Text>
      </Section>

      <Section title="核心指标" description="首页 8 个系列色、10 组文字与背景组合">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              size={k.key === "issues" ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="系列色板" description="首页图表实际使用的 8 个系列色">
        <DataTable
          columns={[
            { key: "name", label: "系列", span: 2 },
            { key: "hex", label: "色值", span: 2 },
            { key: "usage", label: "用途", span: 5 },
          ]}
          rows={data.palette}
        />
      </Section>

      <Section
        title="颜色混淆"
        description="Machado 2009 模拟下的 CIEDE2000 ΔE,小于 12 视为难以区分"
      >
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 3 },
            { key: "colors", label: "色对", span: 2 },
            { key: "normal", label: "正常", align: "right", span: 1 },
            { key: "red", label: "红色盲", align: "right", span: 1, tone: ["7.8"] },
            {
              key: "green",
              label: "绿色盲",
              align: "right",
              span: 1,
              tone: ["3.9", "8.7", "11.2", "11.6"],
            },
            { key: "blue", label: "蓝色盲", align: "right", span: 1 },
          ]}
          rows={confusionRows}
        />
      </Section>

      <Section title="受影响类型" description="各类型色觉障碍命中的问题数">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.byType.map((t) => (
            <Stat
              key={t.type}
              span={2}
              value={t.issues}
              unit="个"
              label={t.type}
              captionBelow
              note={`占问题总数 ${Math.round((t.issues / totalIssues) * 100)}%`}
            />
          ))}
        </Grid>
      </Section>

      <Section title="对比度" description="要求 4.5:1,图表网格标注 3:1">
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 3 },
            { key: "fg", label: "文字色", span: 2 },
            { key: "bg", label: "底色", span: 2 },
            { key: "ratio", label: "对比度", align: "right", span: 1 },
            { key: "result", label: "结果", span: 1, tone: ["不达标"] },
          ]}
          rows={contrastRows}
        />
      </Section>

      <Section title="问题明细" description={`共 ${totalIssues} 个问题,按严重度排列`}>
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "type", label: "类型", span: 2 },
            { key: "location", label: "位置", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="先处理混淆色与图例,再补对比度" className="gap-12">
        <Group>
          <List numbered columns={3} items={suggestions} />
        </Group>
        <Group title="颜色替换">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 3 },
              { key: "from", label: "原色值", span: 2 },
              { key: "to", label: "建议色值", span: 2 },
              { key: "before", label: "修改前", align: "right", span: 1 },
              { key: "after", label: "修改后", align: "right", span: 1 },
            ]}
            rows={data.fixes}
          />
        </Group>
      </Section>

      <Section title="背景信息" description="分析对象与口径">
        <KV
          labelCols={2}
          items={[
            { label: "产品", value: data.target },
            { label: "分析日期", value: data.date },
            { label: "标准", value: data.standard },
            { label: "方法", value: data.method },
            { label: "系列色", value: `${data.palette.length} 个` },
            { label: "检查组合", value: `${data.contrast.length} 组` },
            { label: "问题总数", value: `${totalIssues} 个` },
          ]}
        />
      </Section>
    </Page>
  )
}
