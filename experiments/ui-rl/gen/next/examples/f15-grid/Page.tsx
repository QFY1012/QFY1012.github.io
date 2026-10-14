import { Fragment } from "react"

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

const kpi = (key: string) => data.kpis.find((k) => k.key === key)!
const severityLevels = ["低", "中", "高"]

export default function Report() {
  return (
    <Page title={data.title} meta={[data.chains.map((chain) => chain.product).join(" · ")]}>
      <Section title="结论" description="三家流程的共性与差异">
        <Text className="text-2xl leading-12 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比产品数、分析截图数与问题计数">
        <Grid fields={false}>
          <Stat
            span={3}
            size="lg"
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            captionBelow
            label={kpi("fewest").label}
          />
          <Stat
            span={2}
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            captionBelow
            label={kpi("issues").label}
          />
          <Stat
            span={2}
            value={kpi("products").value}
            unit={kpi("products").unit}
            captionBelow
            label={kpi("products").label}
          />
          <Stat
            span={2}
            value={kpi("screens").value}
            unit={kpi("screens").unit}
            captionBelow
            label={kpi("screens").label}
          />
        </Grid>
      </Section>

      <Section
        title="产品对比"
        description="三款产品的步骤数、输入项与结论,以及三家共有的模式"
        className="gap-12"
      >
        <Group title="步骤数与输入项">
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
              { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
              { key: "verdict", label: "结论", span: 3 },
            ]}
            rows={data.products.map((product) => ({
              name: product.name,
              steps: product.steps,
              inputs: product.inputs,
              verdict: product.verdict,
            }))}
          />
        </Group>
        <Group title="共性模式">
          <List
            numbered
            items={data.patterns.map((pattern) => ({
              title: pattern.name,
              description: `${pattern.products.join("、")} · ${pattern.comment}`,
            }))}
          />
        </Group>
      </Section>

      <Section title="流程链路" description="每个产品一组,按步骤顺序排开;备注记的是这一步的问题">
        <Group>
          {data.chains.map((chain) => (
            <Fragment key={chain.product}>
              <Rule
                label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步 · ${chain.verdict}`}
              />
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
                    <FigureText>{step.content}</FigureText>
                    <FigureText>
                      {step.action} · 输入 {step.inputs} 项
                    </FigureText>
                    {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </Fragment>
          ))}
        </Group>
      </Section>

      <Section
        title="问题清单"
        description="5 个问题按严重度排开,产品与步骤分列,编号对回下一步的建议"
      >
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: severityLevels },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            product: issue.product,
            step: `第 ${issue.step} 步`,
            title: issue.title,
            severity: issue.severity,
            evidence: issue.evidence,
          }))}
          caption="严重度是问题表与「下一步」建议共享的排序口径。"
        />
      </Section>

      <Section title="下一步" description="4 条改动建议,依据对回问题清单的编号">
        <List
          numbered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} 依据:${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="这一页的口径与来源">
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