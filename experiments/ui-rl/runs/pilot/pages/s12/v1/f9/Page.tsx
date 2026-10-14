import * as React from "react"

import data from "./data.json"
import {
  DataTable,
  Figure,
  FigureImage,
  FigureLabel,
  FigureStrip,
  FigureText,
  Grid,
  Group,
  KV,
  List,
  Page,
  Rule,
  Section,
  Stat,
  Text,
} from "@/components/report"

// 核心指标:结论数字(步骤最少)放首位并放大,其余三项同大小,四项一行排满;
// 副行(注释)四项同有,行内高低一致。
const KPI_ORDER = ["fewest", "products", "screens", "issues"]
const KPI_NOTE: Record<string, string> = {
  fewest: "星幕视频 8 步",
  products: "星幕视频、橙果视频",
  screens: "两款合计",
  issues: "2 项严重度高",
}

export default function Report() {
  const kpis = KPI_ORDER.map((key) => data.kpis.find((k) => k.key === key)).filter(
    (k): k is (typeof data.kpis)[number] => Boolean(k),
  )

  return (
    <Page title={data.title} meta={["交互流程挖掘", "星幕视频 · 橙果视频"]}>
      <Section title="结论" description="两款 App 的取消路径与主要问题">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的样本与结论口径">
        <Grid cols={12} fields={false} className="items-baseline">
          {kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              captionBelow
              value={k.value}
              unit={k.unit}
              label={k.label}
              size={k.key === "fewest" ? "lg" : undefined}
              note={KPI_NOTE[k.key]}
            />
          ))}
        </Grid>
      </Section>

      <Section className="gap-12" title="对比" description="两款 App 的链路长度与共同做法">
        <Group title="产品对比">
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", span: 2, align: "right", bar: true },
              { key: "inputs", label: "输入项", span: 2, align: "right" },
              { key: "verdict", label: "结论", span: 3 },
            ]}
            rows={data.products.map((p) => ({
              name: p.name,
              steps: p.steps,
              inputs: p.inputs,
              verdict: p.verdict,
            }))}
            caption="步骤数按关闭自动续费必须经过的页面计;输入项指需要用户自己填写的内容"
          />
        </Group>
        <Group title="共性模式">
          <List
            numbered
            items={data.patterns.map((p) => ({
              title: p.name,
              description: `${p.comment} 涉及:${p.products.join("、")}`,
            }))}
          />
        </Group>
      </Section>

      <Section className="gap-12" title="问题" description={`${data.issues.length} 项问题,按影响程度标注严重度`}>
        <Group title="问题清单">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "product", label: "产品", span: 2 },
              { key: "step", label: "步骤", span: 1, align: "right" },
              { key: "title", label: "问题", span: 3 },
              { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
            ]}
            rows={data.issues.map((it) => ({
              id: it.id,
              product: it.product,
              step: `第 ${it.step} 步`,
              title: it.title,
              severity: it.severity,
            }))}
            caption="严重度按取消路径长度、入口可见度与是否强制填写原因评定"
          />
        </Group>
        <Group title="问题证据">
          <List
            numbered
            items={data.issues.map((it) => ({
              title: `${it.id} · ${it.product} · 第 ${it.step} 步`,
              description: it.evidence,
            }))}
          />
        </Group>
      </Section>

      <Section title="链路" description="每款 App 一条取消链路,按步骤顺序;截图为一屏一张">
        <Group>
          {data.chains.map((chain) => (
            <React.Fragment key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version}`} />
              <FigureStrip>
                {chain.steps.map((step) => (
                  <Figure key={step.no}>
                    <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                    <FigureLabel>
                      第 {step.no} 步 · {step.screen}
                    </FigureLabel>
                    <FigureText>
                      {step.content} · {step.action} · 输入 {step.inputs} 项
                    </FigureText>
                    {step.note ? <FigureText>备注:{step.note}</FigureText> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </React.Fragment>
          ))}
        </Group>
      </Section>

      <Section title="下一步" description="依据问题编号给出的改动方向">
        <List
          ordered
          items={data.suggestions.map((s) => ({
            title: `${s.id} ${s.title}`,
            description: `${s.detail} 依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与时间口径">
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