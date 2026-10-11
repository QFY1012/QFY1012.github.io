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

export default function Report() {
  return (
    <Page title={data.title} meta={[data.task, data.scope, data.date]}>
      <Section title="结论" description="三家银行 App 的线上开户流程">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比范围与关键数字">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              size={kpi.key === "fewest" ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="流程对比" description="各产品的步骤数与分阶段处理方式" className="gap-12">
        <Group title="各产品步骤与输入项">
          <Grid cols={9} fields={false} className="items-baseline">
            {data.products.map((product) => (
              <Stat
                key={product.name}
                span={3}
                value={product.steps}
                unit="步"
                label={product.name}
                captionBelow
                note={`输入 ${product.inputs} 项 · ${product.verdict}`}
              />
            ))}
          </Grid>
        </Group>
        <Group title="分阶段对比">
          <DataTable
            columns={[
              { key: "stage", label: "阶段", span: 3 },
              { key: "青禾银行", label: "青禾银行", span: 2 },
              { key: "远川银行", label: "远川银行", span: 2 },
              { key: "北辰银行", label: "北辰银行", span: 2 },
            ]}
            rows={data.stages}
          />
        </Group>
      </Section>

      <Section title="共性做法" description="走查中反复出现的三种处理方式">
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: pattern.comment,
            meta: pattern.products.join("、"),
          }))}
        />
      </Section>

      <Section title="链路明细" description="3 款产品按步骤的截图与输入项" className="gap-12">
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
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题清单" description="5 个可用性问题及严重度">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", span: 1, align: "right" },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "依据", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
          ]}
          rows={data.issues}
          caption="共 5 个问题,来自 3 款产品共 26 张截图的逐步走查"
        />
      </Section>

      <Section title="下一步" description="四条改进建议及依据">
        <List
          numbered
          columns={2}
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: suggestion.detail,
            meta: `建议 ${suggestion.id} · 依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "对比范围", value: data.scope },
            { label: "走查日期", value: data.date },
            {
              label: "产品版本",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join(" · "),
            },
            { label: "样本", value: "3 款银行 App · 26 张截图" },
          ]}
        />
      </Section>
    </Page>
  )
}
