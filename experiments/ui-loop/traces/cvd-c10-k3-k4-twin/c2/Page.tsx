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

type Screen = { view: string; image: string }
type Kpi = { key: string; label: string; value: number; unit: string }
type Palette = { name: string; hex: string; usage: string }
type Contrast = { where: string; fg: string; bg: string; ratio: number; required: number; pass: boolean }
type Confusion = { where: string; colors: string[]; normal: number; affected: string[] } & Record<string, unknown>
type ByType = { type: string; issues: number }
type Issue = { id: string; title: string; type: string; location: string; severity: string; affects: string[]; suggestion: string }
type Fix = { where: string; from: string; to: string; bg: string; before: number; after: number }

const screens = data.screens as Screen[]
const kpis = data.kpis as Kpi[]
const palette = data.palette as Palette[]
const contrast = data.contrast as Contrast[]
const confusions = data.confusions as Confusion[]
const byType = data.byType as ByType[]
const issues = data.issues as Issue[]
const fixes = data.fixes as Fix[]

// G1:issues(问题总数)排到整组第一位,其余按原顺序
const orderedKpis = [...kpis.filter((k) => k.key === "issues"), ...kpis.filter((k) => k.key !== "issues")]
const kpiSpan = Math.floor(9 / orderedKpis.length)
const kpiNotes: Record<string, string> = {
  issues: "中 2 · 低 1",
  pairs: "正文、辅助文字、按钮、状态文字等",
  fail: "顶部白色标题 1.61:1",
  confuse: "配送进度条 准时绿 / 超时红",
}

const maxTypeIssues = Math.max(...byType.map((t) => t.issues), 1)

// G2:每两张一行,一行一条 FigureStrip
const screenRows: Screen[][] = []
for (let i = 0; i < screens.length; i += 2) screenRows.push(screens.slice(i, i + 2))

export default function Report() {
  return (
    <Page meta={[data.target, data.date]} title={data.title}>
      <Section title="结论" description={`标准 ${data.standard} · ${data.verdict}`}>
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="订单状态页一屏,共 4 项指标">
        <Grid cols={9} fields={false} className="items-baseline">
          {orderedKpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={kpiSpan}
              value={kpi.value}
              label={kpi.label}
              unit={kpi.unit}
              size="lg"
              captionBelow
              note={kpiNotes[kpi.key]}
              direction={kpi.key === "fail" ? "down" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟,同一屏四张对照">
        <Group>
          {screenRows.map((row, rowIndex) => (
            <FigureStrip key={rowIndex}>
              {row.map((screen) => (
                <Figure key={screen.view}>
                  <FigureImage src={screen.image} alt={`订单状态页 ${screen.view}`} />
                  <FigureLabel>{screen.view}</FigureLabel>
                </Figure>
              ))}
            </FigureStrip>
          ))}
        </Group>
      </Section>

      <Section title="配色" description="页面使用的 5 个颜色">
        <DataTable
          columns={[
            { key: "name", label: "名称", span: 3 },
            { key: "hex", label: "色值", span: 3 },
            { key: "usage", label: "用途", span: 3 },
          ]}
          rows={palette.map((p) => ({ name: p.name, hex: p.hex, usage: p.usage }))}
        />
      </Section>

      <Section title="混淆色" description="CIEDE2000 ΔE,小于 12 视为难以区分">
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 2 },
            { key: "colors", label: "颜色", span: 2 },
            { key: "normal", label: "正常视觉", align: "right", span: 1 },
            { key: "protan", label: "红色盲", align: "right", span: 1 },
            { key: "deuter", label: "绿色盲", align: "right", span: 1 },
            { key: "tritan", label: "蓝色盲", align: "right", span: 1 },
            { key: "affected", label: "难以区分", span: 1 },
          ]}
          rows={confusions.map((c) => ({
            where: c.where,
            colors: c.colors.join(" / "),
            normal: c.normal,
            protan: c["红色盲"] as number,
            deuter: c["绿色盲"] as number,
            tritan: c["蓝色盲"] as number,
            affected: c.affected.join("、"),
          }))}
          caption="ΔE 为正常视觉与各色觉模拟下的色差;配送进度条的准时绿与超时红在绿色盲下 ΔE 9.0,已低于阈值 12"
        />
      </Section>

      <Section title="分类型" description="各色觉类型下的问题数,最多 2 个">
        <Grid cols={9} fields={false}>
          <Block span={3} title="按色觉类型的问题数">
            <ProgressList
              compact
              items={byType.map((t) => ({ label: t.type, value: t.issues, max: maxTypeIssues }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="对比度" description="WCAG 2.2 AA:正文 4.5:1、大号文字 3:1">
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 3 },
            { key: "fg", label: "前景", span: 1 },
            { key: "bg", label: "背景", span: 1 },
            { key: "ratio", label: "对比度", align: "right", span: 2 },
            { key: "required", label: "要求", align: "right", span: 1 },
            { key: "result", label: "结论", span: 1, tone: ["不达标"] },
          ]}
          rows={contrast.map((c) => ({
            where: c.where,
            fg: c.fg,
            bg: c.bg,
            ratio: c.ratio,
            required: c.required,
            result: c.pass ? "达标" : "不达标",
          }))}
          caption="6 组文字与背景中 5 组达标;顶部白色标题 1.61:1 未达大号文字 3:1 要求"
        />
      </Section>

      <Section title="问题" description="共 3 个问题,按编号列出">
        <List
          numbered
          items={issues.map((issue) => ({
            title: `${issue.id} · ${issue.title}`,
            description: `${issue.type} · ${issue.location} · 严重度 ${issue.severity} · 影响 ${
              issue.affects.length ? issue.affects.join("、") : "无"
            } · 建议:${issue.suggestion}`,
          }))}
        />
      </Section>

      <Section title="下一步" description="三条修改建议与修复后的对比度" className="gap-12">
        <Group title="修改建议">
          <List
            numbered
            columns={3}
            items={issues.map((issue) => ({
              title: issue.suggestion,
              meta: `${issue.id} · 严重度 ${issue.severity}`,
            }))}
          />
        </Group>
        <Group title="修复后的对比度">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 2 },
              { key: "from", label: "修改前", span: 2 },
              { key: "to", label: "修改后", span: 2 },
              { key: "bg", label: "背景", span: 1 },
              { key: "ratio", label: "对比度 前 → 后", align: "right", span: 2 },
            ]}
            rows={fixes.map((f) => ({
              where: f.where,
              from: f.from,
              to: f.to,
              bg: f.bg,
              ratio: `${f.before} → ${f.after}`,
            }))}
            caption="标题由白色改为正文黑,对比度 1.61:1 提升到 10.25:1"
          />
        </Group>
      </Section>

      <Section title="背景信息" description="产品、周期与检查口径">
        <KV
          labelCols={2}
          items={[
            { label: "产品", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "标准", value: data.standard },
            { label: "结论", value: data.verdict },
            { label: "模拟方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
