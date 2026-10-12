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
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

const stepText = (step: (typeof data.chains)[number]["steps"][number]) =>
  `${step.content} · ${step.action}${step.inputs > 0 ? ` · 输入 ${step.inputs} 项` : ""}`

export default function Report() {
  return (
    <Page title={data.title} meta={[data.task, data.scope, data.date]}>
      <Section title="背景信息" description="任务、范围与日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>

      <Section title="结论" description="三款电商 App 退货流程的一句话判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比产品、分析截图与步骤数的整体口径">
        <Grid cols={12} fields={false} className="items-baseline">
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

      <Section title="分群对比" description="按产品看退货步骤数与输入项">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.products.map((product) => (
            <Stat
              key={product.name}
              span={2}
              value={product.steps}
              unit="步"
              label={product.name}
              captionBelow
              note={`输入项 ${product.inputs} 项 · ${product.verdict}`}
            />
          ))}
        </Grid>
      </Section>

      <Section title="共同模式" description="三款 App 中可复用的做法">
        <Grid cols={9}>
          <Block span={3} rows={2} title="覆盖产品数">
            <ProgressList
              compact
              items={data.patterns.map((pattern) => ({
                label: pattern.name,
                value: pattern.products.length,
                max: 3,
                display: `${pattern.products.length} 款`,
              }))}
            />
          </Block>
          <Block span={6} rows={2} title="做法说明">
            <List
              items={data.patterns.map((pattern) => ({
                title: pattern.name,
                description: `${pattern.products.join("、")} · ${pattern.comment}`,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section
        title="链路明细"
        description="三款 App 从进入退货到提交成功的完整步骤"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
            {/* G2: 截图下方的文字一律一行,note 不进图,统一放到本节末尾的备注里 */}
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
                  <FigureText>{stepText(step)}</FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
        <Group title="步骤备注">
          <List
            ordered
            divided={false}
            items={data.chains.flatMap((chain) =>
              chain.steps
                .filter((step) => step.note)
                .map((step) => ({
                  title: `${chain.product} 第 ${step.no} 步 · ${step.screen}`,
                  description: step.note,
                })),
            )}
          />
        </Group>
      </Section>

      <Section title="发现问题" description="走查中发现的问题,按严重度标注">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1, align: "right" },
            { key: "title", label: "问题", span: 3 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={data.issues}
          caption="严重度按影响范围与阻塞程度评定"
        />
      </Section>

      <Section title="下一步" description="三条改造建议及依据">
        <List
          columns={3}
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail ? `${suggestion.detail} · ` : ""}依据:${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>
    </Page>
  )
}
