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
  const { title, task, scope, date, summary, kpis, chains, issues, suggestions } = data

  const issueRows = issues.map((issue) => ({
    id: issue.id,
    product: issue.product,
    step: issue.step,
    title: issue.title,
    evidence: issue.evidence,
    severity: issue.severity,
  }))

  return (
    <Page title={title} meta={["快送 11.2 · 小橙 8.9", "2026 年 9 月版"]}>
      <Section title="结论" description="两款 App 下单链路的整体判断">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="对比产品数、截图量、最少步骤数与问题数;步骤最少的为小橙">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpis[2].value}
            unit={kpis[2].unit}
            label="步骤最少(小橙)"
            note="快送 5 步"
          />
          <Stat
            span={2}
            captionBelow
            value={kpis[0].value}
            unit={kpis[0].unit}
            label="对比产品"
            note="快送 11.2 · 小橙 8.9"
          />
          <Stat
            span={2}
            captionBelow
            value={kpis[1].value}
            unit={kpis[1].unit}
            label="分析截图"
            note="两段链路共 9 屏"
          />
          <Stat
            span={2}
            captionBelow
            value={kpis[3].value}
            unit={kpis[3].unit}
            label="发现问题"
            note="全部出现在快送"
          />
        </Grid>
      </Section>

      <Section title="链路" description="从购物车到支付成功的完整步骤,输入项全为 0(均为点选)">
        <Group>
          {chains.map((chain) => (
            <Group key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步 · ${chain.verdict}`} />
              <FigureStrip>
                {chain.steps.map((step) => (
                  <Figure key={step.no}>
                    <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                    <FigureLabel>
                      第 {step.no} 步 · {step.screen}
                    </FigureLabel>
                    <FigureText>
                      {step.content} · {step.action}
                      {step.note ? ` · ${step.note}` : ""}
                    </FigureText>
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="问题" description="3 个问题全部出现在快送,含 1 个高严重度;依据为截图中可见的用户负担">
        <DataTable
          caption="严重度自低到高:低 / 中 / 高;依据列为截图中可见的用户负担,编号用于下一步建议的回指。"
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1, align: "right" },
            { key: "title", label: "问题", span: 3 },
            { key: "evidence", label: "依据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section title="下一步" description="两条改动建议,依据内联并回指问题编号">
        <List
          ordered
          divided={false}
          items={suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} · 依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="产品版本、分析范围与样本口径">
        <KV
          labelCols={2}
          items={[
            { label: "对比产品", value: "快送 11.2 · 小橙 8.9" },
            { label: "分析范围", value: `${task}（${scope}）` },
            { label: "样本", value: "2 条链路 · 9 张截图（快送 5 屏 · 小橙 4 屏）" },
            { label: "链路输入项", value: "0 项（各步均为点选,无需键盘输入）" },
            { label: "采集周期", value: "2026 年 9 月版本" },
            { label: "报告日期", value: date },
          ]}
        />
      </Section>
    </Page>
  )
}