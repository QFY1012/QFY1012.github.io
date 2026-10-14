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
  FigureText,
} from "@/components/report"

const d = data
const kpi = (key: string) => d.kpis.find((k) => k.key === key)!

export default function Report() {
  const screens = d.chains.reduce((n, c) => n + c.steps.length, 0)

  return (
    <Page
      title={d.title}
      meta={["医院预约挂号 · 手机端流程", "3 款医院 App", "2026 年 3 月 · 报告日期 2026-03-19"]}
    >
      <Section title="结论" description="三款医院 App 手机端一次完整预约挂号流程的对比">
        <Text className="text-2xl leading-9 font-light">{d.summary}</Text>
      </Section>

      <Section title="核心指标" description="口径:3 条完整流程、18 张截图">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
            note="安沁医院 6 步、澄心医院 7 步"
          />
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
            note="高 1、中 1、低 2"
          />
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpi("products").value}
            unit={kpi("products").unit}
            label={kpi("products").label}
            note="安沁医院、望山医院、澄心医院"
          />
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpi("screens").value}
            unit={kpi("screens").unit}
            label={kpi("screens").label}
            note="3 条流程,每步 1 张"
          />
        </Grid>
      </Section>

      <Section title="产品对比" description="按产品拆分:步骤数、首次填写项数与结论">
        <Grid cols={9} fields={false} className="items-baseline">
          {d.products.map((p) => (
            <Stat
              key={p.name}
              span={3}
              captionBelow
              value={p.steps}
              unit="步"
              label={p.name}
              note={`首次填写 ${p.inputs} 项 · ${p.verdict}`}
            />
          ))}
        </Grid>
      </Section>

      <Section title="阶段对比" description="同一流程阶段,三家医院的做法">
        <DataTable
          columns={[
            { key: "stage", label: "流程阶段", span: 3 },
            { key: "安沁医院", label: "安沁医院", span: 2 },
            { key: "望山医院", label: "望山医院", span: 2 },
            { key: "澄心医院", label: "澄心医院", span: 2 },
          ]}
          rows={d.stages}
          caption="口径:2026 年 3 月版本的手机端流程;三家都拆成这六段,差别集中在入口位置、科室层级和就诊人填写。"
        />
      </Section>

      <Section title="流程明细" description="每条流程每步一屏,共 18 张;灰色小字为该方法的特点或问题" className="gap-12">
        {d.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product}第 ${step.no} 步:${step.screen}`} />
                  <FigureLabel>
                    第 {step.no} 步 · {step.screen}
                  </FigureLabel>
                  <FigureText>
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note && <FigureLabel>{step.note}</FigureLabel>}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题清单" description="4 条,编号 P1–P4 与下一步建议的依据对应">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", span: 1, align: "right" },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={d.issues}
          caption="严重度分高、中、低三级,最高一级标红;编号供下一步建议引用。"
        />
      </Section>

      <Section title="下一步" description="3 条建议,依据指向问题编号">
        <List
          numbered
          items={d.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail};依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围、版本与样本量">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: d.task },
            { label: "对比范围", value: d.scope },
            { label: "报告日期", value: d.date },
            { label: "产品与版本", value: d.chains.map((c) => `${c.product} ${c.version}`).join(" · ") },
            { label: "样本", value: `${d.chains.length} 条完整流程 · ${screens} 张截图(每步 1 张)` },
          ]}
        />
      </Section>
    </Page>
  )
}
