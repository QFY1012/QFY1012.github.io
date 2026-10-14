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

const kpiSpans = [3, 2, 2, 2]

export default function Report() {
  return (
    <Page title={data.title} meta={["快送 · 小橙", "2026 年 9 月"]}>
      <Section title="结论" description="本次走查的核心判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="按对比产品、分析截图与发现问题计数">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi, i) => (
            <Stat
              key={kpi.key}
              span={kpiSpans[i]}
              captionBelow
              label={kpi.label}
              value={kpi.value}
              unit={kpi.unit}
              size={i === 0 ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="链路对比" description="两个产品的步骤数、输入项与结论对照">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2 },
            { key: "inputs", label: "输入项", align: "right", span: 1 },
            { key: "verdict", label: "结论", span: 4 },
          ]}
          rows={data.products.map((product) => ({
            product: `${product.name} ${data.chains.find((chain) => chain.product === product.name)?.version ?? ""}`,
            steps: product.steps,
            inputs: product.inputs,
            verdict: product.verdict,
          }))}
          caption="输入项指用户需手动填写的信息项数。"
        />
      </Section>

      <Section title="链路明细" description="每个产品一组,按步骤顺序排列;备注单列一行">
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
                      {step.content} · {step.action}
                    </FigureText>
                    {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="问题" description="严重度从低到高排列,编号在下一步建议中引用">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues}
          caption="证据为本次走查中该问题对应的界面依据。"
        />
      </Section>

      <Section title="下一步" description="每条建议的依据指向问题编号与对照步骤">
        <List
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} · 依据:${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次走查的任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            {
              label: "版本",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join(" · "),
            },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
