import data from "./data.json"
import { Page, Section, Group, Grid, Text, Stat, DataTable, List, KV, FigureStrip, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"

const kpi = (key: string) => data.kpis.find((k) => k.key === key)!
const totalSteps = data.chains.reduce((n, c) => n + c.steps.length, 0)

export default function Report() {
  return (
    <Page title={data.title} meta={["申请退货流程", "3 款电商 App · 2026 年 8 月版本"]}>
      <Section title="结论" description="三款 App 的退货流程都是 5 到 7 步">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的规模与发现">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat span={3} captionBelow value={kpi("screens").value} unit={kpi("screens").unit} label={kpi("screens").label} note="覆盖 3 款 App 的退货全流程" />
          <Stat span={3} captionBelow size="lg" value={kpi("fewest").value} unit={kpi("fewest").unit} label={kpi("fewest").label} note="好物 7 步、拾光 6 步" />
          <Stat span={3} captionBelow value={kpi("issues").value} unit={kpi("issues").unit} label={kpi("issues").label} note="其中 1 个高严重度" />
        </Grid>
      </Section>

      <Section title="产品对比" description="三款 App 的退货步数、需填写处数与主要差别">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.products.map((p) => (
            <Stat key={p.name} span={2} captionBelow value={p.steps} unit="步" label={p.name} note={`${p.inputs} 处需填写 · ${p.verdict}`} />
          ))}
        </Grid>
      </Section>

      <Section title="流程" description={`从进入退货入口到提交成功,共 ${totalSteps} 张截图`} className="gap-12">
        {data.chains.map((c) => (
          <Group key={c.product} title={`${c.product} · ${c.version}`}>
            <FigureStrip>
              {c.steps.map((s) => (
                <Figure key={s.no}>
                  <FigureImage src={s.image} alt={`${c.product} 第 ${s.no} 步:${s.screen}`} />
                  <FigureLabel>第 {s.no} 步 · {s.screen}</FigureLabel>
                  <FigureText>{`${s.content} · ${s.action} · 输入 ${s.inputs} 项${s.note ? ` · ${s.note}` : ""}`}</FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="共性做法" description="两个以上 App 都采用的做法">
        <List
          columns={3}
          items={data.patterns.map((p) => ({ title: p.name, description: p.comment, meta: p.products.join(" · ") }))}
        />
      </Section>

      <Section title="问题" description="4 个问题,其中 1 个高严重度">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "evidence", label: "证据", span: 3 },
            { key: "product", label: "产品", span: 1 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
          ]}
          rows={data.issues.map((i) => ({
            id: i.id,
            title: `第 ${i.step} 步 · ${i.title}`,
            evidence: i.evidence,
            product: i.product,
            severity: i.severity,
          }))}
        />
      </Section>

      <Section title="下一步" description="三条可落地的改进建议">
        <List
          numbered
          columns={3}
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: s.detail ? `${s.detail} · 依据 ${s.basis.join("、")}` : `依据 ${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次对比的任务、范围与口径">
        <KV
          labelCols={2}
          items={[
            { label: "分析任务", value: data.task },
            { label: "对比范围", value: data.scope },
            { label: "对比产品", value: `${kpi("products").value} 个` },
            { label: "分析截图", value: `${kpi("screens").value} 张` },
            { label: "分析日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
