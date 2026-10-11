import data from "./data.json"
import { Page, Section, Group, Grid, Text, Stat, DataTable, List, KV, FigureStrip, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"

export default function Report() {
  return (
    <Page title={data.title} meta={["企业网盘 · 外链分享", "2026 年 9 月"]}>
      <Section title="结论" description="三款网盘在权限设置上的差别">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次分析覆盖的产品、截图、步骤与发现">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
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

      <Section title="产品对比" description="完成一次外链分享所需的步骤">
        <Grid cols={9} fields={false}>
          {data.products.map((product) => (
            <Stat
              key={product.name}
              span={2}
              value={product.steps}
              unit="步"
              label={product.name}
              note={product.verdict}
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section title="交互链路" description="各产品从文件列表到发送联系人的步骤,共 12 张截图">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
            <FigureStrip>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage
                    src={step.image}
                    alt={`${chain.product} 第 ${step.no} 步:${step.screen}`}
                  />
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>{step.content} · {step.action}</FigureText>
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="云盒的 3 处问题,按严重度排列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1, align: "right" },
            { key: "title", label: "问题", span: 3 },
            { key: "evidence", label: "依据", span: 2 },
            { key: "severity", label: "严重度", span: 1, tone: ["高"] },
          ]}
          rows={data.issues}
        />
      </Section>

      <Section title="下一步" description="针对问题的两条改法">
        <List
          numbered
          columns={3}
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} · 依据:${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
