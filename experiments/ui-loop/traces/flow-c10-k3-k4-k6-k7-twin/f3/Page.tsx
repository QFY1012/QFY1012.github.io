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
  const { task, scope, date, summary, kpis, products, chains, issues, suggestions } = data

  const stepNotes = chains.flatMap((chain) =>
    chain.steps
      .filter((step) => Boolean(step.note))
      .map((step) => ({
        product: chain.product,
        step: step.no,
        screen: step.screen,
        note: step.note,
      })),
  )

  const background = [
    { label: "任务", value: task },
    { label: "范围", value: scope },
    { label: "日期", value: date },
  ].filter((item) => Boolean(item.value))

  return (
    <Page title={data.title} meta={["交互流程挖掘", "2026 年 9 月"]}>
      {background.length > 0 && (
        <Section title="背景信息" description="任务、范围与取数时间">
          <KV items={background} labelCols={2} />
        </Section>
      )}

      <Section title="结论" description="三款产品在分享链路上的差异">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="本次挖掘的规模与产出">
        <Grid cols={12} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
              size="lg"
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section title="分产品" description="各产品的完成步骤数与判断">
        <Grid cols={9} fields={false} className="items-baseline">
          {products.map((product) => (
            <Stat
              key={product.name}
              span={3}
              value={product.steps}
              unit="步"
              label={product.name}
              captionBelow
              note={product.verdict}
            />
          ))}
        </Grid>
      </Section>

      <Section title="链路明细" description="每款产品一组,按步骤顺序排列" className="gap-12">
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
                    {step.content} · {step.action}
                    {step.inputs > 0 ? ` · 输入 ${step.inputs} 项` : ""}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="步骤备注" description="截图之外的界面备注,按产品与步骤排">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "screen", label: "界面", span: 2 },
            { key: "note", label: "备注", span: 4 },
          ]}
          rows={stepNotes}
        />
      </Section>

      <Section title="问题明细" description="云盒 3 处问题,按严重度排">
        <Group title="问题清单">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "title", label: "问题", span: 3 },
              { key: "product", label: "产品", span: 1 },
              { key: "step", label: "步骤", align: "right", span: 1 },
              { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
              { key: "evidence", label: "证据", span: 2 },
            ]}
            rows={issues}
            caption="严重度从低到高三级,最高一级标红加粗"
          />
        </Group>
      </Section>

      <Section title="下一步" description="两条改进建议及依据">
        <List
          items={suggestions.map((item) => ({
            title: item.title,
            description: item.detail,
            meta: `依据 ${item.basis.join("、")}`,
          }))}
          numbered
          columns={3}
        />
      </Section>
    </Page>
  )
}
