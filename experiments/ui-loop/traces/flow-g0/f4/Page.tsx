import { useEffect, useRef } from "react"
import data from "./data.json"
import { Page, Section, Group, Grid, Block, Text, Stat, DataTable, List, KV } from "@/components/report"

// The screenshots sit next to Page.tsx; Vite copies them beside the built page.
const shots = import.meta.glob("./assets/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>

// A screenshot: the library has no picture component, so the element is built
// with the DOM API and mounted in a plain div.
function Shot({ src, alt }: { src: string; alt: string }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = box.current
    if (!host) return
    const picture = new Image()
    picture.src = src
    picture.alt = alt
    picture.className = "w-full"
    host.replaceChildren(picture)
  }, [src, alt])
  return <div ref={box} />
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
            <Grid cols={9} fields={false}>
              {chain.steps.map((s) => (
                <Block key={s.no} span={3} title={`第 ${s.no} 步 · ${s.screen}`}>
                  <Shot src={shots[`./${s.image}`]} alt={`${chain.product} ${s.screen}`} />
                  <Text>{s.content}</Text>
                  <Text>{s.inputs > 0 ? `${s.action} · 输入 ${s.inputs} 项` : s.action}</Text>
                  {s.note ? <Text>{s.note}</Text> : null}
                </Block>
              ))}
            </Grid>
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
        <Grid cols={9} fields={false}>
          <List
            span={6}
            ordered
            divided={false}
            items={data.suggestions.map((s) => ({
              title: s.title,
              description: s.detail,
            }))}
          />
          <KV
            span={3}
            labelCols={1}
            items={data.suggestions.map((s) => ({
              label: s.id,
              value: s.basis.join("、"),
            }))}
          />
        </Grid>
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