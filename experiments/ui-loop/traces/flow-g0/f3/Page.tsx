import * as React from "react"
import data from "./data.json"
import { Page, Section, Group, Grid, Block, Text, Stat, DataTable, List, KV } from "@/components/report"

// The library has no image component; the screenshots are bundled by Vite and
// drawn with an img element so every analysed screen appears on the page.
const shots = import.meta.glob("./assets/*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>

const Shot = ({ path, alt }: { path: string; alt: string }) =>
  React.createElement("img", { src: shots[`./${path}`] ?? `./${path}`, alt, height: 384 })

const chainColumns = [
  { key: "no", label: "步", span: 1 },
  { key: "screen", label: "页面", span: 2 },
  { key: "content", label: "内容", span: 2 },
  { key: "action", label: "操作", span: 2 },
  { key: "note", label: "备注", span: 2 },
]

export default function Report() {
  const { title, task, scope, date, summary, kpis, products, chains, issues, suggestions } = data

  return (
    <Page title={title} meta={["云盒 · 栈盘 · 方舟", "2026 年 9 月版本"]}>
      <Section title="结论" description="三款网盘的分享都在 4 步左右完成">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((k) => (
            <Stat key={k.key} span={3} value={k.value} unit={k.unit} label={k.label} captionBelow size="lg" />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="完成一次外链分享所需的步骤数与结论">
        <Grid cols={9} fields={false} className="items-baseline">
          {products.map((p) => (
            <Stat key={p.name} span={3} value={p.steps} unit="步" label={p.name} captionBelow note={p.verdict} />
          ))}
        </Grid>
      </Section>

      <Section title="流程明细" description="从文件列表到发送的完整路径" className="gap-12">
        {chains.map((c) => (
          <Group key={c.product} title={`${c.product} ${c.version}`}>
            <DataTable
              columns={chainColumns}
              rows={c.steps.map((s) => ({
                no: String(s.no),
                screen: s.screen,
                content: s.content,
                action: s.action,
                note: s.note || "—",
              }))}
              caption={`结论：${c.verdict}`}
            />
          </Group>
        ))}
      </Section>

      <Section title="界面截图" description="每一步的实际界面" className="gap-12">
        {chains.map((c) => (
          <Group key={c.product} title={`${c.product} ${c.version}`}>
            <Grid cols={4} fields={false}>
              {c.steps.map((s) => (
                <Block key={s.image} title={`${s.no} ${s.screen}`}>
                  <Shot path={s.image} alt={`${c.product} ${s.screen}`} />
                </Block>
              ))}
            </Grid>
          </Group>
        ))}
      </Section>

      <Section title="问题" description="本次走查发现 3 个问题，都出现在云盒">
        <List
          numbered
          items={issues.map((i) => ({
            title: `${i.id} · ${i.title}`,
            description: `${i.product} 第 ${i.step} 步 · 严重度 ${i.severity} · ${i.evidence}`,
          }))}
        />
      </Section>

      <Section title="下一步" description="参照栈盘与方舟的做法给出的两条调整">
        <List
          numbered
          columns={3}
          items={suggestions.map((s) => ({
            title: `${s.id} · ${s.title}`,
            description: `${s.detail}（依据：${s.basis.join("、")}）`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次走查的口径与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "范围", value: scope },
            { label: "日期", value: date },
            { label: "版本", value: chains.map((c) => `${c.product} ${c.version}`).join("、") },
          ]}
        />
      </Section>
    </Page>
  )
}
