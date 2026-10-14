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
const versionOf = (name: string) => data.chains.find((c) => c.product === name)!.version

export default function Report() {
  const [chainA, chainB] = data.chains
  const fewest = kpi("fewest")
  const screens = kpi("screens")

  return (
    <Page
      title={data.title}
      meta={[`${chainA.product} ${chainA.version} · ${chainB.product} ${chainB.version}`, `${data.scope} · ${data.date}`]}
    >
      {/* 结论:一句话判断 */}
      <Section title="结论" description="两款 App 的取消自动续费链路对比">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      {/* 核心指标:结论数字前置放大,样本量后置,四项一行 */}
      <Section title="核心指标" description="本次走查的规模与关键数字">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={fewest.value}
            unit={fewest.unit}
            label={fewest.label}
            note="星幕视频 8 步"
          />
          <Stat span={2} captionBelow value={kpi("issues").value} unit={kpi("issues").unit} label={kpi("issues").label} />
          <Stat span={2} captionBelow value={kpi("products").value} unit={kpi("products").unit} label={kpi("products").label} />
          <Stat span={2} captionBelow value={screens.value} unit={screens.unit} label={screens.label} />
        </Grid>
      </Section>

      {/* 拆分:分产品 */}
      <Section title="分产品" description="按产品对比取消步骤与输入项">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 3 },
            { key: "version", label: "版本", span: 1 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 1 },
            { key: "verdict", label: "判断", span: 2 },
          ]}
          rows={data.products.map((p) => ({
            product: p.name,
            version: versionOf(p.name),
            steps: p.steps,
            inputs: p.inputs,
            verdict: p.verdict,
          }))}
          caption="步骤数按从「我的」页到关闭成功页的点击次数计;输入项为需要用户填写的字段数"
        />
      </Section>

      {/* 拆分:共性模式 */}
      <Section title="共性模式" description="两款 App 都出现的做法,共 4 条">
        <List
          numbered
          items={data.patterns.map((p) => ({
            title: p.name,
            description: `${p.products.join("、")} · ${p.comment}`,
          }))}
        />
      </Section>

      {/* 明细:问题清单 */}
      <Section title="问题明细" description="3 个问题,严重度从高到低">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues.map((issue) => ({
            product: issue.product,
            step: issue.step,
            title: issue.title,
            severity: issue.severity,
            evidence: issue.evidence,
          }))}
        />
      </Section>

      {/* 明细:链路截图,一个产品一组 */}
      <Section title="链路明细" description="星幕视频 8 步、橙果视频 6 步,共 14 张截图">
        <Group>
          {data.chains.map((chain) => (
            <Fragment key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version} · ${chain.verdict}`} />
              <FigureStrip>
                {chain.steps.map((step) => (
                  <Figure key={step.no}>
                    <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步 ${step.screen}`} />
                    <FigureLabel>
                      第 {step.no} 步 · {step.screen}
                    </FigureLabel>
                    <FigureText>
                      {step.content} · {step.action} · 输入 {step.inputs} 项
                    </FigureText>
                    {step.note && <FigureText>{step.note}</FigureText>}
                  </Figure>
                ))}
              </FigureStrip>
            </Fragment>
          ))}
        </Group>
      </Section>

      {/* 下一步:单列纵向编号,依据内联 */}
      <Section title="下一步" description="两条改进建议及依据">
        <List
          ordered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} 依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      {/* 背景信息 */}
      <Section title="背景信息" description="任务、范围与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "对比范围", value: data.scope },
            { label: "样本", value: `${screens.value} 张分析截图,${kpi("products").value} 款视频 App` },
            { label: "产品版本", value: `${chainA.product} ${chainA.version}、${chainB.product} ${chainB.version}` },
            { label: "分析日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
