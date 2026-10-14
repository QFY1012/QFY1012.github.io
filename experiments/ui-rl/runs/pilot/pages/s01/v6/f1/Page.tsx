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

const d = data as any

const kpiOrder = ["fewest", "products", "screens", "issues"]
const kpis = kpiOrder.map((key) => d.kpis.find((k: any) => k.key === key))
const screens = d.kpis.find((k: any) => k.key === "screens").value

export default function Report() {
  return (
    <Page title={d.title} meta={[d.task, d.scope]}>
      <Section title="结论" description="3 款银行 App、26 张分析截图的一句话判断">
        <Text className="text-2xl leading-9 font-light">{d.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的范围与主要发现">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((k: any) => (
            <Stat
              key={k.key}
              span={3}
              size={k.key === "fewest" ? "lg" : undefined}
              captionBelow
              value={k.value}
              unit={k.unit}
              label={k.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="三家 App 的步骤数、输入项与环节做法" className="gap-12">
        <Group title="步骤与输入项">
          <Grid cols={9} fields={false} className="items-baseline">
            {d.products.map((p: any) => (
              <Stat
                key={p.name}
                span={3}
                captionBelow
                value={p.steps}
                unit="步"
                label={p.name}
                note={`输入 ${p.inputs} 项 · ${p.verdict}`}
              />
            ))}
          </Grid>
        </Group>
        <Group title="环节对照">
          <DataTable
            columns={[
              { key: "stage", label: "环节", span: 3 },
              { key: "青禾银行", label: "青禾银行", span: 2 },
              { key: "远川银行", label: "远川银行", span: 2 },
              { key: "北辰银行", label: "北辰银行", span: 2 },
            ]}
            rows={d.stages}
          />
        </Group>
      </Section>

      <Section title="流程共性" description="三家 App 里反复出现的做法">
        <List
          numbered
          items={d.patterns.map((p: any) => ({
            title: p.name,
            description: p.comment,
            meta: p.products.join("、"),
          }))}
        />
      </Section>

      <Section title="链路明细" description="每个产品的完整步骤与截图" className="gap-12">
        {d.chains.map((chain: any) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version} · ${chain.verdict}`} />
            <FigureStrip>
              {chain.steps.map((step: any) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                  />
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>{`${step.content} · ${step.action} · 输入 ${step.inputs} 项`}</FigureText>
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题清单" description="走查发现的 5 个问题,按严重度排列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "title", label: "问题", span: 3 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={d.issues.map((i: any) => ({ ...i, title: `第 ${i.step} 步 · ${i.title}` }))}
          caption="严重度按对完成流程的影响判定:高为失败后需要重走已完成的步骤。"
        />
      </Section>

      <Section title="改进建议" description="四条改动,每条附依据">
        <List
          ordered
          divided={false}
          columns={2}
          items={d.suggestions.map((s: any) => ({
            title: `${s.id} ${s.title}`,
            description: s.detail,
            meta: `依据 ${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与数据口径">
        <KV
          labelCols={2}
          items={[
            { label: "分析任务", value: d.task },
            { label: "覆盖范围", value: d.scope },
            {
              label: "对比产品",
              value: d.chains.map((c: any) => `${c.product} ${c.version}`).join("、"),
            },
            { label: "分析截图", value: `${screens} 张` },
            { label: "报告日期", value: d.date },
          ]}
        />
      </Section>
    </Page>
  )
}
