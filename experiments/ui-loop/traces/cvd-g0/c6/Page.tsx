import data from "./data.json"
import {
  Page,
  Section,
  Grid,
  Block,
  Text,
  Stat,
  DataTable,
  ProgressList,
  List,
  KV,
} from "@/components/report"

export default function Report() {
  const kpi = (key: string) => data.kpis.find((k) => k.key === key)!

  const contrastItems = data.contrast.map((c) => ({
    label: c.where.replace("格子文字", ""),
    value: c.ratio,
    max: c.required,
    display: `${c.ratio}`,
  }))

  const contrastRows = data.contrast.map((c) => ({
    where: c.where,
    ratio: c.ratio,
    required: c.required,
    result: c.pass ? "达标" : "不达标",
  }))

  const confusionRows = data.confusions.map((c) => ({
    where: c.where,
    normal: c.normal,
    red: c["红色盲"],
    green: c["绿色盲"],
    blue: c["蓝色盲"],
    affected: c.affected.length > 0 ? c.affected.join("、") : "—",
  }))

  const issueRows = data.issues.map((i) => ({
    id: i.id,
    title: i.title,
    type: i.type,
    location: i.location,
    severity: i.severity,
  }))

  return (
    <Page title={data.title} meta={[data.target, data.date]}>
      <Section title="结论" description={`${data.standard} · 判定:${data.verdict}`}>
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="9 种课程底色、9 组文字背景组合">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            captionBelow
            value={kpi("pairs").value}
            unit={kpi("pairs").unit}
            label={kpi("pairs").label}
            note="9 种课程类别底色"
          />
          <Stat
            span={3}
            captionBelow
            size="lg"
            direction="down"
            value={kpi("fail").value}
            unit={kpi("fail").unit}
            label={kpi("fail").label}
            note="要求 4.5:1"
          />
          <Stat
            span={3}
            captionBelow
            value={kpi("confuse").value}
            unit={kpi("confuse").unit}
            label={kpi("confuse").label}
            note="ΔE 小于 12 判定"
          />
          <Stat
            span={3}
            captionBelow
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
            note="对比度、仅靠颜色、混淆色"
          />
        </Grid>
      </Section>

      <Section title="分群" description="红色盲、绿色盲、蓝色盲三种模拟下受影响的问题数">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.byType.map((t) => (
            <Stat
              key={t.type}
              span={2}
              value={t.issues}
              unit="个"
              label={t.type}
              note="受影响的问题"
            />
          ))}
        </Grid>
      </Section>

      <Section title="配色" description="9 种课程类别底色与用途">
        <DataTable
          columns={[
            { key: "name", label: "类别", span: 3 },
            { key: "usage", label: "用途", span: 3 },
            { key: "hex", label: "色值", span: 3 },
          ]}
          rows={data.palette}
        />
      </Section>

      <Section title="对比度" description="白字浅底,WCAG 2.2 AA 要求正文对比度不低于 4.5:1">
        <Grid cols={9} fields={false}>
          <Block span={3} title="各类别对比度">
            <ProgressList compact items={contrastItems} />
          </Block>
          <Block span={6} title="不达标明细">
            <DataTable
              columns={[
                { key: "where", label: "位置", span: 3 },
                { key: "ratio", label: "对比度", span: 1, align: "right" },
                { key: "required", label: "要求", span: 1, align: "right" },
                { key: "result", label: "结果", span: 1, tone: ["不达标"] },
              ]}
              rows={contrastRows}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="混淆色" description="CIEDE2000 ΔE,小于 12 视为难以区分">
        <DataTable
          columns={[
            { key: "where", label: "颜色对", span: 3 },
            { key: "normal", label: "正常", span: 1, align: "right" },
            { key: "red", label: "红色盲", span: 1, align: "right" },
            { key: "green", label: "绿色盲", span: 1, align: "right" },
            { key: "blue", label: "蓝色盲", span: 1, align: "right" },
            { key: "affected", label: "受影响", span: 2 },
          ]}
          rows={confusionRows}
        />
      </Section>

      <Section title="问题" description="7 个问题的类型、位置与严重程度">
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

      <Section title="下一步" description="按问题给出的修改建议">
        <List
          numbered
          columns={3}
          items={data.issues.map((i) => ({
            title: i.suggestion,
            description: `${i.id} · ${i.title} · ${i.type}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="分析对象、口径与评估标准">
        <KV
          labelCols={2}
          items={[
            { label: "分析对象", value: data.target },
            { label: "分析日期", value: data.date },
            { label: "评估标准", value: data.standard },
            { label: "评估结论", value: data.verdict },
            { label: "检查范围", value: "9 种课程类别底色 × 9 组文字背景组合" },
            { label: "方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
