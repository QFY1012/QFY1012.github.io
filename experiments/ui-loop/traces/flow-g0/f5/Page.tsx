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

export default function Report() {
  const stepProgress = data.products.map((p) => ({
    label: p.name,
    value: p.steps,
    max: 7,
    display: `${p.steps} 步`,
  }))

  const productRows = data.products.map((p) => ({
    product: p.name,
    inputs: p.inputs,
    verdict: p.verdict,
  }))

  const issueRows = data.issues.map((i) => ({
    id: i.id,
    product: i.product,
    step: i.step,
    title: i.title,
    evidence: i.evidence,
    severity: i.severity,
  }))

  return (
    <Page
      title={data.title}
      meta={["电商 App 申请退货并预约取件", "3 款 App · 2026 年 8 月版本", data.date]}
    >
      <Section title="结论" description="三款 App 退货流程的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比产品、截图与分析产出的口径">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              size="lg"
            />
          ))}
        </Grid>
      </Section>

      <Section title="流程对比" description="步骤数按最多 7 步对齐,输入项指需要填写或上传的次数">
        <Grid cols={9}>
          <Block span={3} rows={1} title="步骤数">
            <ProgressList items={stepProgress} compact />
          </Block>
          <Block span={6} rows={1} title="产品对比">
            <DataTable
              columns={[
                { key: "product", label: "产品", span: 2 },
                { key: "inputs", label: "输入项", span: 1, align: "right" },
                { key: "verdict", label: "结论", span: 3 },
              ]}
              rows={productRows}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="步骤明细" description="每款 App 从入口到提交成功的页面、内容与操作">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} ${chain.version} · ${chain.verdict}`}>
            <DataTable
              columns={[
                { key: "no", label: "步", span: 1 },
                { key: "screen", label: "页面", span: 2 },
                { key: "content", label: "页面内容", span: 2 },
                { key: "action", label: "操作", span: 1 },
                { key: "inputs", label: "输入项", span: 1, align: "right" },
                { key: "note", label: "备注", span: 2 },
              ]}
              rows={chain.steps}
            />
          </Group>
        ))}
      </Section>

      <Section title="共性模式" description="两款以上 App 或可复用的做法">
        <List
          numbered
          items={data.patterns.map((p) => ({
            title: p.name,
            description: p.comment,
            meta: p.products.join("、"),
          }))}
        />
      </Section>

      <Section title="问题清单" description="共 4 个问题,严重度高的排在最前">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1, align: "right" },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 3 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="每条建议都对应到具体步骤或问题编号">
        <List
          numbered
          columns={3}
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: s.detail || undefined,
            meta: s.basis.join(" · "),
          }))}
        />
      </Section>

      <Section title="背景信息" description="样本、版本与分析日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "对比范围", value: data.scope },
            {
              label: "产品版本",
              value: data.chains.map((c) => `${c.product} ${c.version}`).join(" / "),
            },
            { label: "分析日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}