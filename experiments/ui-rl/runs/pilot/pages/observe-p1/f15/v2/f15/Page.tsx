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

const kpi = (key: string) => data.kpis.find((item) => item.key === key)!

export default function Report() {
  return (
    <Page title={data.title} meta={["途野租车 · 星驰出行 · 云驾租车", "2026 年 4 月版"]}>
      <Section title="结论" description="三款 App 取车流程的对比结论">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="参与对比的产品、截图、步骤与问题数量">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("products").value}
            unit={kpi("products").unit}
            label="对比产品"
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("screens").value}
            unit={kpi("screens").unit}
            label="分析截图"
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label="发现问题"
          />
        </Grid>
      </Section>

      <Section title="流程对比" description="步骤数与必填输入项,口径为下单到取车完成">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "必填输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={data.products.map((product) => ({
            product: product.name,
            steps: product.steps,
            inputs: product.inputs,
            verdict: product.verdict,
          }))}
          caption="输入项只统计需要用户手动填写的字段,证件 OCR 自动带出的字段不计入。"
        />
      </Section>

      <Section
        title="流程链路"
        description={`每款 App 从首页到取车完成的逐步截图,共 ${kpi("screens").value} 张`}
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
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
                  {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="共性模式" description="三款 App 重复出现的做法与差异点">
        <DataTable
          columns={[
            { key: "pattern", label: "共性", span: 3 },
            { key: "coverage", label: "覆盖产品", align: "right", span: 2, bar: true },
            { key: "comment", label: "说明", span: 4 },
          ]}
          rows={data.patterns.map((pattern) => ({
            pattern: pattern.name,
            coverage: pattern.products.length,
            comment: pattern.comment,
          }))}
          caption="覆盖产品为 3 表示三款 App 都有这一环,少于 3 的差异写在说明里。"
        />
      </Section>

      <Section title="问题明细" description="问题出现的位置、证据与严重度">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            product: issue.product,
            step: issue.step,
            title: issue.title,
            evidence: issue.evidence,
            severity: issue.severity,
          }))}
          caption="严重度按对取车结果的影响从低到高排,编号供下一步建议引用。"
        />
      </Section>

      <Section title="下一步" description="每条建议对回具体问题编号">
        <List
          ordered
          divided={false}
          items={data.suggestions.map((suggestion) => ({
            title: `${suggestion.id} ${suggestion.title}`,
            description: suggestion.detail,
            meta: `依据 · ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与分析日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}