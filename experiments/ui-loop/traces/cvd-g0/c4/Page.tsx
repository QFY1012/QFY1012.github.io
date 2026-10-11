import data from "./data.json"
import { Page, Section, Grid, Block, Text, Stat, DataTable, KV } from "@/components/report"

// 模拟视图:组件库没有图片组件,这里用 img 元素显示;路径交给构建器处理。
const SHOT: Record<string, string> = {
  "assets/original.png": new URL("./assets/original.png", import.meta.url).href,
  "assets/protanopia.png": new URL("./assets/protanopia.png", import.meta.url).href,
  "assets/deuteranopia.png": new URL("./assets/deuteranopia.png", import.meta.url).href,
  "assets/tritanopia.png": new URL("./assets/tritanopia.png", import.meta.url).href,
}

function Shot({ src, alt }: { src: string; alt: string }) {
  return <img src={SHOT[src] ?? src} alt={alt} className="w-full" />
}

const KPI_NOTES: Record<string, string> = {
  pairs: "覆盖 14 个颜色 token",
  fail: "共检查 18 组文字与背景组合",
  confuse: "success 与 error、warning 与 success",
  issues: "详见问题",
}

export default function Report() {
  const kpi = (key: string) => data.kpis.find((k) => k.key === key)!

  const paletteRows = data.palette.map((p) => ({
    name: p.name,
    hex: p.hex,
    usage: p.usage,
  }))

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
    ratio: c.ratio,
    required: c.required,
    result: c.pass ? "达标" : "不达标",
  }))

  const issueRows = data.issues.map((i) => ({
    id: i.id,
    title: i.title,
    location: i.location,
    severity: i.severity,
    suggestion: i.suggestion,
  }))

  const fixRows = data.fixes.map((f) => ({
    where: f.where,
    from: f.from,
    to: f.to,
    bg: f.bg,
    before: f.before,
    after: f.after,
  }))

  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description="检查范围与总体判断">
        <Text className="text-2xl leading-9 font-light">
          {`整体判定:${data.verdict}。${data.summary}`}
        </Text>
      </Section>

      <Section title="核心指标" description="本次检查的总体计数">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={kpi("pairs").value}
            unit={kpi("pairs").unit}
            label={kpi("pairs").label}
            captionBelow
            note={KPI_NOTES.pairs}
          />
          <Stat
            span={3}
            value={kpi("fail").value}
            unit={kpi("fail").unit}
            label={kpi("fail").label}
            captionBelow
            size="lg"
            direction="down"
            note={KPI_NOTES.fail}
          />
          <Stat
            span={3}
            value={kpi("confuse").value}
            unit={kpi("confuse").unit}
            label={kpi("confuse").label}
            captionBelow
            note={KPI_NOTES.confuse}
          />
          <Stat
            span={3}
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
            captionBelow
            note={KPI_NOTES.issues}
          />
        </Grid>
      </Section>

      <Section title="色板" description="被检查的 14 个颜色 token">
        <DataTable
          columns={[
            { key: "name", label: "Token", span: 3 },
            { key: "hex", label: "色值", span: 3 },
            { key: "usage", label: "用途", span: 3 },
          ]}
          rows={paletteRows}
        />
      </Section>

      <Section title="模拟视图" description="原界面与三种色盲模拟下的色板">
        <Grid cols={2} fields={false}>
          {data.screens.map((s) => (
            <Block key={s.view} title={s.view}>
              <Shot src={s.image} alt={s.view} />
            </Block>
          ))}
        </Grid>
      </Section>

      <Section title="色盲影响" description="各类型色盲下的问题数与易混淆色对,ΔE 小于 12 视为难以区分" className="gap-12">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.byType.map((t) => (
            <Stat
              key={t.type}
              span={2}
              value={t.issues}
              unit="个"
              label={t.type}
              captionBelow
            />
          ))}
        </Grid>
        <DataTable
          columns={[
            { key: "where", label: "颜色对", span: 3 },
            { key: "normal", label: "正常视觉", span: 1, align: "right" },
            { key: "红色盲", label: "红色盲", span: 1, align: "right", tone: ["0.3"] },
            { key: "绿色盲", label: "绿色盲", span: 1, align: "right", tone: ["5.9", "8.2"] },
            { key: "蓝色盲", label: "蓝色盲", span: 1, align: "right" },
            { key: "affected", label: "受影响类型", span: 2 },
          ]}
          rows={confusionRows}
        />
      </Section>

      <Section title="对比度" description="18 组文字与背景组合,要求 4.5:1(大标题 3:1)">
        <DataTable
          columns={[
            { key: "where", label: "文字 / 背景组合", span: 4 },
            { key: "ratio", label: "对比度", span: 2, align: "right" },
            { key: "required", label: "要求", span: 1, align: "right" },
            { key: "result", label: "结果", span: 2, tone: ["不达标"] },
          ]}
          rows={contrastRows}
        />
      </Section>

      <Section title="问题" description="5 个问题,含混淆色与对比度不足两类">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "location", label: "位置", span: 2 },
            { key: "severity", label: "严重", span: 1, tone: ["高"] },
            { key: "suggestion", label: "建议", span: 2 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="修正" description="5 项建议替换色值与修正后的对比度">
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 2 },
            { key: "from", label: "原色值", span: 1 },
            { key: "to", label: "建议色值", span: 1 },
            { key: "bg", label: "背景", span: 1 },
            { key: "before", label: "修正前", span: 2, align: "right" },
            { key: "after", label: "修正后", span: 2, align: "right" },
          ]}
          rows={fixRows}
        />
      </Section>

      <Section title="背景信息" description="检查对象、依据、方法与时间">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "检查标准", value: data.standard },
            { label: "检查方法", value: data.method },
            { label: "检查日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
