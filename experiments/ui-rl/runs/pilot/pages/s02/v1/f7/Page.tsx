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

const kpiOrder = ["fewest", "issues", "screens", "products"]
const kpis = kpiOrder.map((key) => data.kpis.find((kpi) => kpi.key === key)!)

const kpiNotes: Record<string, string> = {
  fewest: "闪兔快递 4 步",
  issues: "中 1 · 低 1",
  screens: "闪兔快递 4 张 · 云鸽寄件 3 张",
  products: "闪兔快递 · 云鸽寄件",
}

const versions = data.chains.map((chain) => `${chain.product} ${chain.version}`).join(" · ")

export default function Report() {
  return (
    <Page title={data.title} meta={[data.scope, data.date]}>
      <Section title="结论" description="两款 App 的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次流程挖掘的规模与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              captionBelow
              note={kpiNotes[kpi.key]}
              {...(kpi.key === "fewest" ? { size: "lg" as const } : {})}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="按产品分组,记步骤数与填写项数">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.products.map((product) => (
            <Stat
              key={product.name}
              span={2}
              value={product.steps}
              unit="步"
              label={product.name}
              captionBelow
              note={`填写项 ${product.inputs} 项`}
            />
          ))}
        </Grid>
      </Section>

      <Section title="流程链路" description="从下单到预约成功的每一步,单位:屏">
        <Group>
          {data.chains.map((chain) => (
            <Group key={chain.product}>
              <Rule
                label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步 · ${chain.verdict}`}
              />
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
                      {[step.content, step.action, step.inputs > 0 ? `输入 ${step.inputs} 项` : ""]
                        .filter((part) => part !== "")
                        .join(" · ")}
                    </FigureText>
                    {step.note !== "" && <FigureText>{step.note}</FigureText>}
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="问题明细" description="两款 App 共 2 个问题">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues}
          caption="严重度口径:中 = 每次寄件都要重复填写;低 = 信息缺失但不阻塞下单。"
        />
      </Section>

      <Section title="下一步" description="对应已确认问题的改进项">
        <Grid cols={9}>
          <Block span={6} rows={1} title="建议">
            <List
              ordered
              divided={false}
              items={data.suggestions.map((suggestion) => ({
                title: `${suggestion.id} · ${suggestion.title}`,
                description: suggestion.detail,
              }))}
            />
          </Block>
          <Block span={3} rows={1} title="依据">
            <KV
              labelCols={1}
              items={[
                {
                  label: "依据",
                  value: data.suggestions.map((suggestion) => suggestion.basis.join("、")).join("、"),
                },
                { label: "问题", value: data.issues[0].title },
                { label: "范围", value: `${data.issues[0].product} · 第 ${data.issues[0].step} 步` },
              ]}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="背景信息" description="任务口径、版本与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "对比产品", value: versions },
            {
              label: "分析截图",
              value: `${data.kpis.find((kpi) => kpi.key === "screens")!.value} 张(闪兔快递 4 张、云鸽寄件 3 张)`,
            },
            { label: "报告日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}