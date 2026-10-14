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
  List,
  KV,
  Rule,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

type Kpi = { key: string; label: string; value: number; unit: string }

const kpi = (key: string) => (data.kpis as Kpi[]).find((k) => k.key === key) as Kpi

export default function Report() {
  const products = data.products
  const stages = data.stages as unknown as Record<string, string>[]

  return (
    <Page title={data.title} meta={[data.scope, data.date]}>
      {/* 结论:一句话判断,占满 9 列 */}
      <Section title="结论" description="口径:5 款产品各走一条完整链路,逐屏记录">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      {/* 核心指标:结论数字在前,样本量在后,四项一行 */}
      <Section title="核心指标" description="单位:步、个、张">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={2}
            size="lg"
            captionBelow
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
          />
          <Stat
            span={2}
            captionBelow
            value={kpi("products").value}
            unit={kpi("products").unit}
            label={kpi("products").label}
          />
          <Stat
            span={3}
            captionBelow
            value={kpi("screens").value}
            unit={kpi("screens").unit}
            label={kpi("screens").label}
          />
        </Grid>
      </Section>

      {/* 分群:5 款产品对照 */}
      <Section title="产品对比" description="步骤数从搜索到支付成功;填写项是链路中用户要填的字段数">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "填写项", align: "right", span: 2 },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={products.map((p) => ({
            name: p.name,
            steps: p.steps,
            inputs: p.inputs,
            verdict: p.verdict,
          }))}
          caption="步骤数最少的云栖旅行 8 步,最多的蓝湾预订 11 步;填写项最少的是泊客旅行 2 项"
        />
      </Section>

      {/* 分维度:六个阶段 × 5 款产品 */}
      <Section title="阶段对比" description="六个阶段,每格是一款产品在这一段的做法" className="gap-12">
        {stages.map((s) => (
          <Group key={s.stage} title={s.stage}>
            <KV labelCols={2} items={products.map((p) => ({ label: p.name, value: s[p.name] }))} />
          </Group>
        ))}
      </Section>

      {/* 明细:8 个问题 */}
      <Section title="问题清单" description="8 个问题,严重度按影响面从低到高排">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={data.issues}
        />
      </Section>

      {/* 明细:逐屏链路 */}
      <Section title="链路明细" description="每款产品从首页到预订成功,逐屏截图" className="gap-12">
        {data.chains.map((chain) => (
          <Group key={chain.product}>
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
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      {/* 发现:跨产品的共性 */}
      <Section title="发现" description="4 条跨产品的共性">
        <List
          numbered
          items={data.patterns.map((p) => ({
            title: p.name,
            description: `涉及 ${p.products.join("、")}。${p.comment}`,
          }))}
        />
      </Section>

      {/* 下一步:建议与依据 */}
      <Section title="下一步" description="5 条建议,右侧是对应的依据">
        <Grid cols={9}>
          <Block span={6} rows={2} title="建议">
            <List
              ordered
              divided={false}
              items={data.suggestions.map((s) => ({
                title: `${s.id} ${s.title}`,
                description: s.detail,
              }))}
            />
          </Block>
          <Block span={3} rows={2} title="依据">
            <KV
              labelCols={1}
              items={data.suggestions.map((s) => ({ label: s.id, value: s.basis.join("、") }))}
            />
          </Block>
        </Grid>
      </Section>

      {/* 背景信息 */}
      <Section title="背景信息" description="任务、样本与日期">
        <KV
          labelCols={2}
          items={[
            { label: "分析任务", value: data.task },
            { label: "产品范围", value: data.scope },
            { label: "对比产品", value: `5 款:${products.map((p) => p.name).join("、")}` },
            { label: "分析截图", value: `${kpi("screens").value} 张,来自 5 条完整链路` },
            { label: "分析日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
