import { createElement } from "react"

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

// The library has no image component, so the four screen captures are placed
// with createElement; the paths are kept relative to this file.
const SHOTS: Record<string, string> = {
  "原界面": new URL("./assets/original.png", import.meta.url).href,
  "红色盲": new URL("./assets/protanopia.png", import.meta.url).href,
  "绿色盲": new URL("./assets/deuteranopia.png", import.meta.url).href,
  "蓝色盲": new URL("./assets/tritanopia.png", import.meta.url).href,
}

const [pairsKpi, failKpi, confuseKpi, issuesKpi] = data.kpis

const confusionColumns = [
  { key: "where", label: "颜色对", span: 2 },
  { key: "normal", label: "正常", align: "right", span: 1 },
  { key: "protan", label: "红色盲", align: "right", span: 1 },
  { key: "deuter", label: "绿色盲", align: "right", span: 1, tone: ["10.2"] },
  { key: "tritan", label: "蓝色盲", align: "right", span: 1 },
]

const confusionRows = data.confusions.map((c) => ({
  where: c.where,
  normal: c.normal,
  protan: c["红色盲"],
  deuter: c["绿色盲"],
  tritan: c["蓝色盲"],
}))

const paletteColumns = [
  { key: "name", label: "名称", span: 3 },
  { key: "hex", label: "色值", span: 2 },
  { key: "usage", label: "用途", span: 4 },
]

const contrastColumns = [
  { key: "where", label: "位置", span: 3 },
  { key: "fg", label: "前景色", span: 1 },
  { key: "bg", label: "背景色", span: 1 },
  { key: "ratio", label: "对比度", align: "right", span: 1 },
  { key: "required", label: "要求", align: "right", span: 1 },
  { key: "result", label: "结果", span: 2, tone: ["不达标"] },
]

const contrastRows = data.contrast.map((c) => ({
  where: c.where,
  fg: c.fg,
  bg: c.bg,
  ratio: c.ratio,
  required: c.required,
  result: c.pass ? "达标" : "不达标",
}))

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "title", label: "问题", span: 2 },
  { key: "type", label: "类型", span: 2 },
  { key: "location", label: "位置", span: 2 },
  { key: "severity", label: "严重度", span: 1, tone: ["高"] },
  { key: "affects", label: "影响", span: 1 },
]

const issueRows = data.issues.map((i) => ({
  id: i.id,
  title: i.title,
  type: i.type,
  location: i.location,
  severity: i.severity,
  affects: i.affects.length > 0 ? i.affects.join("、") : "—",
}))

const fixColumns = [
  { key: "where", label: "位置", span: 3 },
  { key: "from", label: "原色", span: 2 },
  { key: "to", label: "新色", span: 2 },
  { key: "before", label: "修改前", align: "right", span: 1 },
  { key: "after", label: "修改后", align: "right", span: 1 },
]

export default function Report() {
  return (
    <Page
      title={data.title}
      meta={[data.target, data.date, data.standard]}
    >
      <Section title="结论" description="整体判定与一句话结论">
        <Group>
          <Text className="text-2xl leading-9 font-light">{data.verdict}</Text>
          <Text>{data.summary}</Text>
        </Group>
      </Section>

      <Section title="核心指标" description="检查范围与问题口径">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={issuesKpi.value}
            unit={issuesKpi.unit}
            label={issuesKpi.label}
            note="高 1 · 中 2 · 低 1"
          />
          <Stat
            span={3}
            captionBelow
            value={pairsKpi.value}
            unit={pairsKpi.unit}
            label={pairsKpi.label}
            note="含日间与夜间"
          />
          <Stat
            span={3}
            captionBelow
            value={failKpi.value}
            unit={failKpi.unit}
            label={failKpi.label}
            note="未达 4.5:1"
            direction="down"
          />
          <Stat
            span={3}
            captionBelow
            value={confuseKpi.value}
            unit={confuseKpi.unit}
            label={confuseKpi.label}
            note="绿色盲下 ΔE 10.2"
          />
        </Grid>
      </Section>

      <Section title="界面截图" description="原界面与三种色盲模拟">
        <Grid cols={12} fields={false}>
          {data.screens.map((s) => (
            <Block key={s.view} span={3} title={s.view}>
              {createElement("img", {
                src: SHOTS[s.view] ?? s.image,
                alt: s.view,
                className: "w-full",
              })}
            </Block>
          ))}
        </Grid>
      </Section>

      <Section title="色差" description="ΔE 为 CIEDE2000,小于 12 视为难以区分">
        <Grid cols={9}>
          <Block span={3} rows={2} title="按色觉类型的问题数">
            <ProgressList
              compact
              items={data.byType.map((t) => ({
                label: t.type,
                value: t.issues,
                max: 4,
                display: `${t.issues} 个`,
              }))}
            />
          </Block>
          <Block span={6} rows={2} title="颜色对的色差 ΔE">
            <DataTable
              columns={confusionColumns}
              rows={confusionRows}
              caption="受影响:绿色盲(上涨与下跌)"
            />
          </Block>
        </Grid>
      </Section>

      <Section title="配色" description="行情页当前使用的颜色与用途">
        <DataTable columns={paletteColumns} rows={data.palette} />
      </Section>

      <Section title="对比度" description="正文文字需 4.5:1,大字号需 3:1">
        <DataTable columns={contrastColumns} rows={contrastRows} />
      </Section>

      <Section title="问题清单" description="共 4 个问题,1 高、2 中、1 低">
        <DataTable columns={issueColumns} rows={issueRows} />
      </Section>

      <Section
        title="改进建议"
        description="按问题优先级给出的修改方案"
        className="gap-12"
      >
        <List
          numbered
          columns={3}
          items={data.issues.map((i) => ({
            title: i.title,
            description: i.suggestion,
          }))}
        />
        <DataTable
          columns={fixColumns}
          rows={data.fixes}
          caption="白底上的对比度:修改前 → 修改后"
        />
      </Section>

      <Section title="背景信息" description="检查对象、依据与模拟方法">
        <KV
          labelCols={2}
          items={[
            { label: "产品 / 页面", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "依据标准", value: data.standard },
            {
              label: "模拟视图",
              value: data.screens.map((s) => s.view).join("、"),
            },
            { label: "模拟方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
