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
  const { kpis, products, chains, stages, issues, suggestions } = data

  return (
    <Page title={data.title} meta={["协作宝 · 链工", "2026 年第三季度"]}>
      <Section title="背景信息" description="本次走查的任务、范围与执行日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>

      <Section title="结论">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="产品数、截图数、步骤数与问题数">
        <Grid cols={12} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              size="lg"
              captionBelow
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      <Section title="对比" description="同一任务下两款产品的流程差异" className="gap-12">
        <Group title="流程概览">
          <Grid cols={9} fields={false} className="items-baseline">
            {products.map((product) => (
              <Stat
                key={product.name}
                span={2}
                captionBelow
                value={product.steps}
                unit="步"
                label={product.name}
                note={`${product.verdict} · 输入 ${product.inputs} 项`}
              />
            ))}
          </Grid>
        </Group>
        <Group title="分阶段对比">
          <DataTable
            columns={[
              { key: "stage", label: "阶段", span: 3 },
              { key: "a", label: "协作宝", span: 3 },
              { key: "b", label: "链工", span: 3 },
            ]}
            rows={stages.map((stage) => ({
              stage: stage.stage,
              a: stage["协作宝"],
              b: stage["链工"],
            }))}
            caption="四个阶段按出现顺序排列;协作宝 8 步、链工 5 步。"
          />
        </Group>
      </Section>

      <Section title="链路明细" description="从入口到预订成功的每一步截图与操作" className="gap-12">
        {chains.map((chain) => (
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
                    {step.inputs > 0
                      ? `${step.content} · ${step.action} · 输入 ${step.inputs} 项`
                      : `${step.content} · ${step.action}`}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="步骤明细" description="每一步的屏名、操作、输入项与备注">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 1 },
            { key: "no", label: "步骤", span: 1 },
            { key: "screen", label: "屏名", span: 2 },
            { key: "action", label: "操作", span: 1 },
            { key: "inputs", label: "输入", span: 1, bar: true },
            { key: "note", label: "备注", span: 3 },
          ]}
          rows={chains.flatMap((chain) =>
            chain.steps.map((step) => ({
              product: chain.product,
              no: `${step.no}`,
              screen: step.screen,
              action: step.action,
              inputs: step.inputs,
              note: step.note || "—",
            })),
          )}
        />
      </Section>

      <Section title="发现" description="共 4 个问题,按严重度排列">
        <DataTable
          columns={[
            { key: "issue", label: "问题", span: 3 },
            { key: "where", label: "位置", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={issues.map((issue) => ({
            issue: `${issue.id} ${issue.title}`,
            where: `${issue.product} 第 ${issue.step} 步`,
            severity: issue.severity,
            evidence: issue.evidence,
          }))}
          caption="4 个问题都出在协作宝,集中在找空闲时段和会议信息两步。"
        />
      </Section>

      <Section title="下一步" description="三条改进建议及依据">
        <List
          numbered
          columns={3}
          items={suggestions.map((suggestion) => ({
            title: `${suggestion.id} ${suggestion.title}`,
            description: `${suggestion.detail}(依据 ${suggestion.basis.join("、")})`,
          }))}
        />
      </Section>
    </Page>
  )
}
