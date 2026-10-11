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
      <Section title="结论" description="三家银行开户流程的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section
        title="核心指标"
        description="对比产品、分析截图与最少步骤"
        className="gap-12"
      >
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
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
        <Group title="各产品的步骤与输入项">
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 2 },
              { key: "steps", label: "步骤", span: 2, align: "right", bar: true },
              { key: "inputs", label: "输入项", span: 2, align: "right", bar: true },
              { key: "verdict", label: "结论", span: 3 },
            ]}
            rows={data.products}
          />
        </Group>
      </Section>

      <Section title="环节对照" description="按开户环节对齐三家银行的做法">
        <DataTable
          columns={[
            { key: "stage", label: "环节", span: 3 },
            { key: "青禾银行", label: "青禾银行", span: 2 },
            { key: "远川银行", label: "远川银行", span: 2 },
            { key: "北辰银行", label: "北辰银行", span: 2 },
          ]}
          rows={data.stages}
        />
      </Section>

      <Section title="共性模式" description="跨产品反复出现的三种做法">
        <List
          numbered
          items={data.patterns.map((p) => ({
            title: p.name,
            description: p.comment,
            meta: p.products.join("、"),
          }))}
        />
      </Section>

      <Section
        title="步骤明细"
        description="26 张截图的逐步操作与备注"
        className="gap-12"
      >
        {data.chains.map((c) => (
          <Group key={c.product} title={`${c.product} · ${c.version}`}>
            {Array.from({ length: Math.ceil(c.steps.length / 4) }, (_, r) =>
              c.steps.slice(r * 4, r * 4 + 4),
            ).map((rowSteps, r) => (
              <FigureStrip key={r}>
                {rowSteps.map((s) => (
                  <Figure key={s.no}>
                    <FigureImage
                      src={s.image}
                      alt={`${c.product} 第 ${s.no} 步:${s.screen}`}
                    />
                    <FigureLabel>第 {s.no} 步 · {s.screen}</FigureLabel>
                    <FigureText>
                      {s.content} · {s.action}
                    </FigureText>
                  </Figure>
                ))}
              </FigureStrip>
            ))}
            <DataTable
              columns={[
                { key: "no", label: "步", span: 1, align: "right" },
                { key: "screen", label: "屏幕", span: 2 },
                { key: "flow", label: "内容与操作", span: 3 },
                { key: "inputs", label: "输入项", span: 1, align: "right", bar: true },
                { key: "note", label: "备注", span: 2 },
              ]}
              rows={c.steps.map((s) => ({
                ...s,
                flow: `${s.content} → ${s.action}`,
              }))}
            />
          </Group>
        ))}
      </Section>

      <Section title="问题清单" description="5 个问题,按严重度标注">
        <DataTable
          columns={[
            { key: "where", label: "位置", span: 2 },
            { key: "step", label: "步骤", span: 1, align: "right" },
            { key: "title", label: "问题", span: 3 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
          ]}
          rows={data.issues.map((i) => ({
            ...i,
            where: `${i.id} · ${i.product}`,
          }))}
        />
      </Section>

      <Section title="改进建议" description="按远川银行的做法给出的四条建议">
        <List
          numbered
          columns={3}
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: s.detail,
            meta: s.basis.join("、"),
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "报告任务", value: data.task },
            { label: "对比范围", value: data.scope },
            {
              label: "产品版本",
              value: data.chains
                .map((c) => `${c.product} ${c.version}`)
                .join(" · "),
            },
            { label: "分析日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
