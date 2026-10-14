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
  Rule,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

export default function Report() {
  const kpis = data.kpis
  const products = data.products
  const chains = data.chains
  const stages = data.stages
  const patterns = data.patterns
  const issues = data.issues
  const suggestions = data.suggestions

  const kpiOf = (key: string) => kpis.find((k) => k.key === key)!

  const stageRows = stages.map((s) => ({
    stage: s.stage,
    a: s["青禾银行"],
    b: s["远川银行"],
    c: s["北辰银行"],
  }))

  const issueRows = issues.map((it) => ({
    id: it.id,
    product: it.product,
    step: `第 ${it.step} 步`,
    title: it.title,
    severity: it.severity,
    evidence: it.evidence,
  }))

  const suggestionItems = suggestions.map((s) => ({
    title: s.title,
    description: `${s.detail}。依据:${s.basis.join("、")}`,
  }))

  return (
    <Page title={data.title} meta={["手机银行 App", "2026 年 9 月"]}>
      <Section title="结论" description="一句话判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={kpiOf("fewest").value}
            unit={kpiOf("fewest").unit}
            label={kpiOf("fewest").label}
            size="lg"
            captionBelow
          />
          <Stat
            span={2}
            value={kpiOf("issues").value}
            unit={kpiOf("issues").unit}
            label={kpiOf("issues").label}
            captionBelow
          />
          <Stat
            span={2}
            value={kpiOf("products").value}
            unit={kpiOf("products").unit}
            label={kpiOf("products").label}
            captionBelow
          />
          <Stat
            span={2}
            value={kpiOf("screens").value}
            unit={kpiOf("screens").unit}
            label={kpiOf("screens").label}
            captionBelow
          />
        </Grid>
      </Section>

      <Section title="流程拆分" description="按产品、环节和共性做法拆开看">
        <Group title="产品对比">
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
              { key: "inputs", label: "输入项", align: "right", span: 2 },
              { key: "verdict", label: "结论", span: 3 },
            ]}
            rows={products}
          />
        </Group>

        <Group title="环节对比">
          <DataTable
            columns={[
              { key: "stage", label: "环节", span: 3 },
              { key: "a", label: "青禾银行", span: 2 },
              { key: "b", label: "远川银行", span: 2 },
              { key: "c", label: "北辰银行", span: 2 },
            ]}
            rows={stageRows}
          />
        </Group>

        <Group title="共性做法">
          <List
            numbered
            items={patterns.map((p) => ({
              title: p.name,
              description: p.comment,
              meta: p.products.join("、"),
            }))}
          />
        </Group>
      </Section>

      <Section title="链路明细" description="每款 App 从开户首页到成功的逐步截图">
        <Group>
          {chains.flatMap((chain) => [
            <Rule
              key={`rule-${chain.product}`}
              label={`${chain.product} · ${chain.version} · ${chain.verdict}`}
            />,
            <FigureStrip key={`strip-${chain.product}`}>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                  />
                  <FigureLabel>
                    第 {step.no} 步 · {step.screen}
                  </FigureLabel>
                  <FigureText>
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note ? <FigureText>备注 · {step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>,
          ])}
        </Group>
      </Section>

      <Section title="问题清单" description="5 个问题,按产品与步骤定位">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="4 条建议,依据对回问题编号">
        <List numbered items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "版本",
              value: chains.map((c) => `${c.product} ${c.version}`).join("、"),
            },
          ]}
        />
      </Section>
    </Page>
  )
}