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
  Rule,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

export default function Report() {
  const { title, task, scope, date, summary, kpis, products, chains, stages, patterns, issues, suggestions } = data

  const kpi = (key: string) => kpis.find((item) => item.key === key)!

  const issueRows = issues.map((issue) => ({
    id: issue.id,
    product: `${issue.product} · 第 ${issue.step} 步`,
    title: issue.title,
    severity: issue.severity,
    evidence: issue.evidence,
  }))

  return (
    <Page title={title} meta={[scope, date]}>
      <Section title="结论" description="五款产品从搜索到支付的全流程差异">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与最短流程">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
            note="五款产品中步骤最少"
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("screens").value}
            unit={kpi("screens").unit}
            label={kpi("screens").label}
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("products").value}
            unit={kpi("products").unit}
            label={kpi("products").label}
          />
        </Grid>
      </Section>

      <Section title="步骤对比" description="每款产品从首页到预订成功的屏数与填写项数">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "填写项数", align: "right", span: 2 },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={products}
          caption="步骤数为首页到预订成功的屏数;填写项数为各屏输入字段之和,最少 3 项、最多 8 项。"
        />
      </Section>

      <Section title="分阶段" description="搜索、浏览、房型、填写、价格、支付六段上的做法差异">
        <Grid cols={9} fields={false}>
          {stages.map((stage) => {
            const detail = stage as unknown as Record<string, string>
            return (
              <Block key={stage.stage} span={3} title={stage.stage}>
                <List
                  items={products.map((product) => ({
                    title: product.name,
                    description: detail[product.name],
                  }))}
                />
              </Block>
            )
          })}
        </Grid>
      </Section>

      <Section title="共性模式" description="两款以上产品重复出现的做法">
        <List
          numbered
          items={patterns.map((pattern) => ({
            title: pattern.name,
            description: pattern.comment,
            meta: `涉及 ${pattern.products.join("、")}`,
          }))}
        />
      </Section>

      <Section title="链路明细" description="五款产品逐屏截图,每步标出内容、操作与输入项数">
        <Group>
          {chains.map((chain) => (
            <Group key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version}`} />
              <FigureStrip>
                {chain.steps.map((step) => (
                  <Figure key={step.no}>
                    <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                    <FigureLabel>
                      第 {step.no} 步 · {step.screen}
                    </FigureLabel>
                    <FigureText>
                      {step.content} · {step.action} · 输入 {step.inputs} 项
                    </FigureText>
                    {step.note ? <FigureText>{step.note}</FigureText> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="问题明细" description="8 个问题,严重度由低到高;证据指向具体步骤">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品 · 步骤", span: 2 },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="五条改动建议,每条都指向上面的问题">
        <List
          numbered
          columns={3}
          items={suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: suggestion.detail,
            meta: `依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="样本、周期与产品版本">
        <KV
          labelCols={2}
          items={[
            { label: "走查范围", value: scope },
            { label: "走查日期", value: date },
            { label: "任务", value: task },
            { label: "样本", value: `${kpi("products").value} 款产品、${kpi("screens").value} 张分析截图` },
            { label: "产品版本", value: chains.map((chain) => `${chain.product} ${chain.version}`).join("、") },
            { label: "产出", value: `${issues.length} 个问题、${patterns.length} 条共性模式、${suggestions.length} 条建议` },
          ]}
        />
      </Section>
    </Page>
  )
}