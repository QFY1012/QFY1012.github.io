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

// The screenshots sit next to Page.tsx; Vite copies them beside the built page.
const shots = import.meta.glob("./assets/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>

// Turn a basis entry into something readable on its own: a step reference is
// spelled out with its screen, an issue id with its title, anything else as-is.
function expandBasis(item: string) {
  const stepRef = item.match(/^(.+?)第\s*([0-9]+(?:\s*[、,，]\s*[0-9]+)*)\s*步$/)
  const chain = stepRef ? data.chains.find((c) => c.product === stepRef[1].trim()) : undefined
  if (stepRef && chain) {
    const steps = stepRef[2]
      .split(/[、,，]/)
      .map((raw) => Number(raw.trim()))
      .map((no) => {
        const step = chain.steps.find((s) => s.no === no)
        return `${chain.product} 第 ${no} 步${step ? ` · ${step.screen}` : ""}`
      })
      .join(";")
    // A single step reference survives in its expansion; a range like “第 1、2 步” does not,
    // so keep the original in front of the expanded steps.
    return steps.replace(/\s+/g, "").includes(item.replace(/\s+/g, "")) ? steps : `${item} → ${steps}`
  }
  const issue = data.issues.find((i) => i.id === item)
  if (issue) return `${issue.id} ${issue.title}`
  return item
}

// The headline figure leads the row: steps are what the two flows differ in.
const kpis = ["fewest", "products", "screens", "issues"]
  .map((key) => data.kpis.find((k) => k.key === key))
  .filter((k) => k !== undefined)

export default function Report() {
  return (
    <Page
      title={data.title}
      meta={["协同办公平台 · 预订会议室", "2 款 App · 2026 Q3", data.date]}
    >
      <Section title="结论" description="两款产品完成同一任务的路径差异">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="2 款产品,13 张截图,链工 5 步完成">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
              size={k.key === "fewest" ? "lg" : undefined}
            />
          ))}
        </Grid>
      </Section>

      <Section title="流程对比" description="逐环节对比两款产品的做法" className="gap-12">
        <Group title="完成步数与输入项">
          <DataTable
            columns={[
              { key: "product", label: "产品", span: 2 },
              { key: "steps", label: "完成步数", span: 2, align: "right" },
              { key: "inputs", label: "输入项", span: 2, align: "right" },
              { key: "verdict", label: "思路", span: 3 },
            ]}
            rows={data.products.map((p) => ({
              product: p.name,
              steps: p.steps,
              inputs: p.inputs,
              verdict: p.verdict,
            }))}
          />
        </Group>
        <Group title="四个环节的做法">
          <DataTable
            columns={[
              { key: "stage", label: "环节", span: 3 },
              { key: "协作宝", label: "协作宝", span: 3 },
              { key: "链工", label: "链工", span: 3 },
            ]}
            rows={data.stages}
          />
        </Group>
      </Section>

      <Section title="流程明细" description="按屏记录每一步的内容、操作和备注" className="gap-12">
        {data.chains.map((chain) => (
          <Group
            key={chain.product}
            title={`${chain.product} ${chain.version} · ${chain.steps.length} 步 · ${chain.verdict}`}
          >
            <FigureStrip>
              {chain.steps.map((s) => (
                <Figure key={s.no}>
                  <FigureImage
                    src={shots[`./${s.image}`]}
                    alt={`${chain.product} 第 ${s.no} 步:${s.screen}`}
                  />
                  <FigureLabel>
                    第 {s.no} 步 · {s.screen}
                  </FigureLabel>
                  <FigureText>
                    {s.content} · {s.action}
                    {s.inputs > 0 ? ` · 输入 ${s.inputs} 项` : ""}
                  </FigureText>
                  {s.note ? <FigureText>{s.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="发现的问题" description="4 个问题,严重度从高到低">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "where", label: "位置", span: 2 },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={data.issues.map((i) => ({
            id: i.id,
            where: `${i.product} 第 ${i.step} 步`,
            title: i.title,
            severity: i.severity,
            evidence: i.evidence,
          }))}
        />
      </Section>

      <Section title="下一步" description="3 条改进建议及依据">
        <List
          columns={1}
          items={data.suggestions.map((s) => ({
            title: `${s.id} ${s.title}`,
            description: `${s.detail}。依据:${s.basis.map(expandBasis).join(";")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围和版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "产品版本",
              value: data.chains.map((c) => `${c.product} ${c.version}`).join("、"),
            },
          ]}
        />
      </Section>
    </Page>
  )
}