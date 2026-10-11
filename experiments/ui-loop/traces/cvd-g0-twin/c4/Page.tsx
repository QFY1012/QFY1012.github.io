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
  List,
  KV,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
} from "@/components/report"

const kpi = Object.fromEntries(data.kpis.map((k) => [k.key, k]))

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
  result: c.pass ? "达标" : "不达标",
}))

const fixItems = data.fixes.map((f) => ({
  title: f.where,
  description: `${f.from} → ${f.to}(背景 ${f.bg}),对比度 ${f.before} → ${f.after}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={`判定标准 ${data.standard}`}>
        <Text className="text-2xl leading-9 font-light">
          {`${data.verdict} — ${data.summary}`}
        </Text>
      </Section>

      <Section title="核心指标" description="色板与文字背景组合的检查结果">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            captionBelow
            value={kpi.pairs.value}
            unit={kpi.pairs.unit}
            label={kpi.pairs.label}
            note="覆盖 14 个颜色 token"
          />
          <Stat
            span={3}
            captionBelow
            size="lg"
            direction="down"
            value={kpi.fail.value}
            unit={kpi.fail.unit}
            label={kpi.fail.label}
            note="18 组里 13 组不达标"
          />
          <Stat
            span={3}
            captionBelow
            value={kpi.confuse.value}
            unit={kpi.confuse.unit}
            label={kpi.confuse.label}
            note="success 与 error、warning 与 success"
          />
          <Stat
            span={3}
            captionBelow
            value={kpi.issues.value}
            unit={kpi.issues.unit}
            label={kpi.issues.label}
            note="高 2、中 2、低 1"
          />
        </Grid>
      </Section>

      <Section title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照">
        <Grid cols={9} fields={false}>
          <Block span={9} title="同一界面的四种呈现" description={data.method}>
            <FigureStrip>
              {data.screens.map((s) => (
                <Figure key={s.view}>
                  <FigureImage src={s.image} alt={`${s.view}下的界面`} />
                  <FigureLabel>{s.view}</FigureLabel>
                </Figure>
              ))}
            </FigureStrip>
          </Block>
        </Grid>
      </Section>

      <Section title="分群" description="按色觉障碍类型统计受影响的问题" className="gap-12">
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
        <Group title="颜色混淆对照">
          <DataTable
            columns={[
              { key: "where", label: "颜色对", span: 3 },
              { key: "normal", label: "正常", span: 1, align: "right" },
              { key: "红色盲", label: "红色盲", span: 1, align: "right" },
              { key: "绿色盲", label: "绿色盲", span: 1, align: "right" },
              { key: "蓝色盲", label: "蓝色盲", span: 1, align: "right" },
              { key: "affected", label: "受影响", span: 2 },
            ]}
            rows={confusionRows}
            caption="数值为 CIEDE2000 色差 ΔE,小于 12 视为难以区分"
          />
        </Group>
      </Section>

      <Section title="色板" description="设计规范里的 14 个颜色 token">
        <Group title="颜色 token 清单">
          <DataTable
            columns={[
              { key: "name", label: "token", span: 2 },
              { key: "hex", label: "色值", span: 2 },
              { key: "usage", label: "用途", span: 5 },
            ]}
            rows={data.palette}
          />
        </Group>
      </Section>

      <Section title="明细" description="18 组文字与背景组合的对比度逐项结果" className="gap-12">
        <Group title="对比度检查">
          <DataTable
            columns={[
              { key: "where", label: "文字 / 背景", span: 2 },
              { key: "fg", label: "前景", span: 1 },
              { key: "bg", label: "背景", span: 1 },
              { key: "ratio", label: "对比度", span: 2, align: "right" },
              { key: "required", label: "要求", span: 1, align: "right" },
              { key: "result", label: "结论", span: 2, tone: ["不达标"] },
            ]}
            rows={contrastRows}
            caption="对比度按 WCAG 2.2 AA,正文 4.5:1、大标题 3:1"
          />
        </Group>
        <Group title="问题清单">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "type", label: "类型", span: 1 },
              { key: "title", label: "问题", span: 3 },
              { key: "location", label: "位置", span: 1 },
              { key: "severity", label: "严重度", span: 1, tone: ["高"] },
              { key: "suggestion", label: "建议", span: 2 },
            ]}
            rows={data.issues}
            caption="严重度按对红绿色盲用户的影响排序"
          />
        </Group>
      </Section>

      <Section title="下一步" description="按优先级调整颜色取值">
        <List numbered columns={3} items={fixItems} />
      </Section>

      <Section title="背景信息" description="检查对象、标准与方法">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "色板规模", value: "14 个颜色 token" },
            { label: "检查日期", value: data.date },
            { label: "判定标准", value: data.standard },
            { label: "模拟方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
