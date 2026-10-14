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
  const { title, task, scope, date, summary, kpis, products, chains, issues, suggestions } = data

  const kpi = (key: string) => kpis.find((item) => item.key === key)?.value ?? 0

  return (
    <Page
      title={title}
      meta={["闪兔快递 · 云鸽寄件", `2026 年 5 月 · ${date}`]}
    >
      <Section title="结论" description={task}>
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((item) => (
            <Stat
              key={item.key}
              span={3}
              value={item.value}
              unit={item.unit}
              label={item.label}
              captionBelow
              size="lg"
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="输入项指用户需要填写的字段数">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2 },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={products}
        />
      </Section>

      <Section title="链路明细" description="从首页到预约成功,一步一屏">
        <Group>
          {chains.map((chain) => (
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
                    {step.note ? <FigureText>{step.note}</FigureText> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="问题明细" description="严重度从低到高排列,中为最高">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 3 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中"] },
          ]}
          rows={issues}
        />
      </Section>

      <Section title="下一步" description="针对发现的问题给出的改进建议">
        <List
          ordered
          divided={false}
          items={suggestions.map((item) => ({
            title: item.title,
            description: item.detail,
            meta: `依据 ${item.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "范围", value: scope },
            { label: "分析日期", value: date },
            {
              label: "产品版本",
              value: chains.map((chain) => `${chain.product} ${chain.version}`).join("、"),
            },
            {
              label: "样本量",
              value: `${kpi("products")} 款 App、${kpi("screens")} 张截图`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}
