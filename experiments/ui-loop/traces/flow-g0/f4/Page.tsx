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
} from "@/components/report"

export default function Report() {
  const { kpis, products, chains, stages, issues, suggestions } = data

  return (
    <Page
      title={data.title}
      meta={["2 款协同办公 App", "2026 年第三季度版本"]}
    >
      <Section
        title="结论"
        description="对比 2 款协同办公 App 的完整预订流程"
      >
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section
        title="核心指标"
        description="2 款产品、13 张截图,链工最少 5 步"
        className="gap-12"
      >
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              size="lg"
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
            />
          ))}
        </Grid>
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "version", label: "版本", span: 1 },
            { key: "steps", label: "步骤", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 1 },
            { key: "verdict", label: "流程思路", span: 3 },
          ]}
          rows={products.map((p) => {
            const chain = chains.find((c) => c.product === p.name)
            return {
              name: p.name,
              version: chain ? chain.version : "",
              steps: p.steps,
              inputs: p.inputs,
              verdict: p.verdict,
            }
          })}
        />
      </Section>

      <Section
        title="环节对比"
        description="同一任务在四个关键环节上的做法差异"
      >
        <DataTable
          columns={[
            { key: "stage", label: "环节", span: 3 },
            { key: "a", label: "协作宝", span: 3 },
            { key: "b", label: "链工", span: 3 },
          ]}
          rows={stages.map((s) => ({
            stage: s.stage,
            a: s["协作宝"],
            b: s["链工"],
          }))}
        />
      </Section>

      <Section
        title="步骤明细"
        description="逐屏记录页面内容、操作与备注"
        className="gap-12"
      >
        {chains.map((chain) => (
          <Group
            key={chain.product}
            title={`${chain.product} ${chain.version} · ${chain.steps.length} 步`}
          >
            <DataTable
              columns={[
                { key: "no", label: "步骤", span: 1 },
                { key: "page", label: "页面 · 操作", span: 2 },
                { key: "content", label: "内容", span: 3 },
                { key: "note", label: "备注", span: 3 },
              ]}
              rows={chain.steps.map((s) => ({
                no: s.no,
                page: `${s.screen} · ${s.action}`,
                content: s.content,
                note: s.note,
              }))}
            />
          </Group>
        ))}
      </Section>

      <Section
        title="发现问题"
        description="4 个问题都出现在协作宝,严重度按高、中、低标注"
      >
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={issues.map((i) => ({
            id: i.id,
            step: `第 ${i.step} 步`,
            title: i.title,
            severity: i.severity,
            evidence: i.evidence,
          }))}
        />
      </Section>

      <Section
        title="改进建议"
        description="三条改动,依据链工做法与已发现的问题"
      >
        <List
          numbered
          columns={3}
          items={suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} 依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "版本日期", value: data.date },
            { label: "分析截图", value: "13 张" },
          ]}
        />
      </Section>
    </Page>
  )
}
