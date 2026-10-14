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
  const main = data.kpis.find((k) => k.key === "fewest")
  const rest = data.kpis.filter((k) => k.key !== "fewest")

  const productRows = data.products.map((p) => ({
    name: p.name,
    steps: p.steps,
    inputs: p.inputs,
    verdict: p.verdict,
  }))

  const stageRows = data.stages.map((s) => ({
    stage: s.stage,
    a: s["青岚单车"],
    b: s["迅踏出行"],
    c: s["骑点单车"],
  }))

  const issueRows = data.issues.map((it) => ({
    id: it.id,
    product: it.product,
    step: `第 ${it.step} 步`,
    title: it.title,
    severity: it.severity,
    evidence: it.evidence,
  }))

  const suggestionItems = data.suggestions.map((s) => ({
    title: s.title,
    description: `${s.detail}(依据:${s.basis.join("、")})`,
  }))

  return (
    <Page title={data.title} meta={["共享单车 · 3 款 App", "首次骑行链路"]}>
      <Section title="结论" description="三款 App 的链路判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="链路规模与发现的问题数">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={main.value}
            unit={main.unit}
            label={main.label}
          />
          {rest.map((k) => (
            <Stat
              key={k.key}
              span={2}
              captionBelow
              value={k.value}
              unit={k.unit}
              label={k.label}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="链路"
        description="每个产品从打开到开锁的步骤、输入项与截图"
        className="gap-12"
      >
        <Group title="三家对比">
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
              { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
              { key: "verdict", label: "结论", span: 3 },
            ]}
            rows={productRows}
            caption="步骤数按开锁前用户要经过的独立屏幕计,输入项按需要用户填写的字段计。"
          />
        </Group>
        <Group>
          {data.chains.map((chain) => (
            <Group key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version} · ${chain.verdict}`} />
              <FigureStrip>
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
                    {step.note && <FigureText className="mt-2">备注 · {step.note}</FigureText>}
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="环节对比" description="五个环节上三款产品的做法差异">
        <DataTable
          columns={[
            { key: "stage", label: "环节", span: 3 },
            { key: "a", label: "青岚单车", span: 2 },
            { key: "b", label: "迅踏出行", span: 2 },
            { key: "c", label: "骑点单车", span: 2 },
          ]}
          rows={stageRows}
          caption="对照口径:同一环节在三款 App 里各自的处理方式。"
        />
      </Section>

      <Section title="问题明细" description="链路里挡住开锁的问题">
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
          caption="步骤是该问题在对应产品链路里出现的步号;编号与下一步建议的依据对应。"
        />
      </Section>

      <Section title="下一步" description="按阻塞程度排的两条改动">
        <List ordered divided={false} items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="任务、范围与样本口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "样本",
              value: `3 款 App / 13 张分析截图(青岚单车 5 张、迅踏出行 3 张、骑点单车 5 张)`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}