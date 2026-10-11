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
} from "@/components/report"

export default function Report() {
  return (
    <Page
      title={data.title}
      meta={["企业网盘 · 3 款产品", "2026 年 9 月"]}
    >
      <Section title="结论" description="本次走查的一句话判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={2}
              size="lg"
              captionBelow
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="三款企业网盘的外链分享流程对照,单位:步">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", span: 2, align: "right", bar: true },
            { key: "inputs", label: "文本输入", span: 2, align: "right" },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={data.products.map((p) => ({
            name: p.name,
            steps: p.steps,
            inputs: p.inputs,
            verdict: p.verdict,
          }))}
          caption="文本输入指流程中需要手动填写的项数"
        />
      </Section>

      <Section
        title="流程明细"
        description="每个产品的逐步操作路径"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} v${chain.version}`}>
            <DataTable
              columns={[
                { key: "no", label: "步骤", span: 1 },
                { key: "screen", label: "页面", span: 2 },
                { key: "content", label: "页面内容", span: 2 },
                { key: "action", label: "操作", span: 2 },
                { key: "note", label: "备注", span: 2 },
              ]}
              rows={chain.steps.map((step) => ({
                no: `第 ${step.no} 步`,
                screen: step.screen,
                content: step.content,
                action: step.action,
                note: step.note,
              }))}
            />
          </Group>
        ))}
      </Section>

      <Section title="发现问题" description="走查中记录的 3 个问题,按严重度列出">
        <List
          columns={3}
          numbered
          metaTone="destructive"
          items={data.issues.map((issue) => ({
            title: issue.title,
            description: `${issue.product} · 第 ${issue.step} 步 · ${issue.evidence}`,
            meta: issue.severity,
          }))}
        />
      </Section>

      <Section title="下一步" description="基于上述发现的两条改动建议">
        <List
          columns={3}
          numbered
          items={data.suggestions.map((item) => ({
            title: item.title,
            description: `${item.detail}(依据:${item.basis.join("、")})`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次走查的任务、范围与时间">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "对比产品",
              value: data.products.map((p) => p.name).join("、"),
            },
          ]}
        />
      </Section>
    </Page>
  )
}
