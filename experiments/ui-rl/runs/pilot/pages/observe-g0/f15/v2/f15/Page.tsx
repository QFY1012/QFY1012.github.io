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
  Rule,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

export default function Report() {
  const { title, task, scope, date, summary, kpis, products, chains, patterns, issues, suggestions } = data

  const screens = kpis.find((k) => k.key === "screens")?.value ?? 21

  return (
    <Page meta={["3 款租车 App", "2026 年 4 月版本", date]} title={title}>
      <Section title="结论" description="整份走查的主要判断">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              size="lg"
              captionBelow
              value={k.value}
              unit={k.unit}
              label={k.label}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="流程对比"
        description="三款产品的步骤数、输入项数与共同做法"
        className="gap-12"
      >
        <Grid cols={9} fields={false} className="items-baseline">
          {products.map((p) => (
            <Stat
              key={p.name}
              span={2}
              captionBelow
              value={p.steps}
              unit="步"
              label={p.name}
              note={p.verdict}
            />
          ))}
          <Block span={3} title="输入项数">
            <ProgressList
              compact
              items={products.map((p) => ({
                label: p.name,
                value: p.inputs,
                display: `${p.inputs} 项`,
              }))}
            />
          </Block>
        </Grid>

        <Group title="共同模式">
          <DataTable
            columns={[
              { key: "name", label: "共同模式", span: 3 },
              { key: "cover", label: "覆盖产品", span: 2 },
              { key: "comment", label: "说明", span: 4 },
            ]}
            rows={patterns.map((p) => ({
              name: p.name,
              cover: p.products.join("、"),
              comment: p.comment,
            }))}
          />
        </Group>
      </Section>

      <Section
        title="链路明细"
        description="每个产品从首页到取车完成的逐步截图与观察"
        className="gap-12"
      >
        {chains.map((c) => (
          <Group key={c.product}>
            <Rule label={`${c.product} · ${c.version}`} />
            <FigureStrip>
              {c.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${c.product} 第 ${step.no} 步:${step.screen}`}
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

      <Section
        title="问题明细"
        description="五处问题的位置、严重度与证据"
        className="gap-12"
      >
        <Group title="问题清单">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "product", label: "产品", span: 2 },
              { key: "step", label: "步骤", align: "right", span: 1 },
              { key: "title", label: "问题", span: 3 },
              { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
            ]}
            rows={issues}
            caption="严重度按取车流程里的影响排:高 1 处、中 3 处、低 1 处。"
          />
        </Group>

        <Group title="证据">
          <List
            ordered
            items={issues.map((i) => ({
              title: `${i.id} · ${i.product} 第 ${i.step} 步 · ${i.title}`,
              description: i.evidence,
            }))}
          />
        </Group>
      </Section>

      <Section title="下一步" description="按影响给出的四条改动建议">
        <Grid cols={9}>
          <Block span={6} rows={2} title="建议">
            <List
              ordered
              divided={false}
              items={suggestions.map((s) => ({
                title: `${s.id} · ${s.title}`,
                description: s.detail,
              }))}
            />
          </Block>
          <Block span={3} rows={2} title="依据">
            <KV
              labelCols={1}
              items={suggestions.map((s) => ({
                label: s.id,
                value: s.basis.join("、"),
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="背景信息" description="任务、范围与报告口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "范围", value: scope },
            {
              label: "对比产品",
              value: chains.map((c) => `${c.product} ${c.version}`).join("、"),
            },
            {
              label: "分析截图",
              value: `${screens} 张(${chains
                .map((c) => `${c.product} ${c.steps.length}`)
                .join("、")})`,
            },
            { label: "报告日期", value: date },
          ]}
        />
      </Section>
    </Page>
  )
}