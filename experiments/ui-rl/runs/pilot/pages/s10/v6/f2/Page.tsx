import * as React from "react"

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

export default function Report() {
  const { title, task, scope, date, summary, kpis, products, chains, issues, suggestions } = data
  const kpi = (key: string) => kpis.find((k) => k.key === key)!

  return (
    <Page title={title} meta={["快送 11.2 · 小橙 8.9"]}>
      <Section title="结论" description="下单支付链路的整体判断">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="2 款 App,9 张截图,共 3 个问题">
        {/* 一行四项:主指标占 3 列,其余各 2 列(3 + 2 + 2 + 2 = 9) */}
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
            note="快送 5 步"
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("products").value}
            unit={kpi("products").unit}
            label={kpi("products").label}
            note="快送 11.2 · 小橙 8.9"
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
            note="高 1 · 中 1 · 低 1"
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("screens").value}
            unit={kpi("screens").unit}
            label={kpi("screens").label}
            note="快送 5 屏 · 小橙 4 屏"
          />
        </Grid>
      </Section>

      <Section title="链路对比" description="从购物车到支付成功的界面数与输入项">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2 },
            { key: "inputs", label: "输入项", align: "right", span: 2 },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={products}
          caption="步骤数按界面屏数统计,两款 App 在这条链路上都没有需要填写输入项的步骤。"
        />
      </Section>

      <Section title="链路明细" description="每一步的界面、操作与输入项,按步骤顺序排开">
        <Group>
          {chains.map((chain) => (
            <React.Fragment key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version} · 共 ${chain.steps.length} 步`} />
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
                      {step.content} · {step.action} · 输入 {step.inputs} 项
                    </FigureText>
                    {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </React.Fragment>
          ))}
        </Group>
      </Section>

      <Section title="问题" description="3 个问题按严重度排,编号供下一步建议引用">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={issues}
          caption="严重度分低、中、高三档;3 个问题都出现在同一条链路上。"
        />
      </Section>

      <Section title="下一步" description="两条建议,依据对回问题表与对照产品">
        <List
          ordered
          items={suggestions.map((s) => ({
            title: `${s.id} · ${s.title}`,
            description: `${s.detail} 依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "范围", value: scope },
            { label: "采集日期", value: date },
            { label: "对比产品", value: "快送 11.2(5 步)· 小橙 8.9(4 步)" },
            { label: "样本", value: "9 张界面截图,覆盖 4 步与 5 步两条链路" },
          ]}
        />
      </Section>
    </Page>
  )
}