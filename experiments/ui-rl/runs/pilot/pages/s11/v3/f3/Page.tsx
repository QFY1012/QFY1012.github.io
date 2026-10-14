import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Stat,
  Text,
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
const primary = kpi("fewest")
const rest = data.kpis.filter((k) => k.key !== "fewest")

const productRows = data.products.map((p) => ({
  name: p.name,
  steps: p.steps,
  inputs: p.inputs,
  verdict: p.verdict,
}))

const issueRows = data.issues.map((it) => ({
  id: it.id,
  product: it.product,
  step: it.step,
  severity: it.severity,
  title: it.title,
  evidence: it.evidence,
}))

const suggestionItems = data.suggestions.map((s) => ({
  title: `${s.title} · ${s.detail}`,
  meta: `依据 ${s.basis.join(" / ")}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["企业网盘 · 外链分享", "2026 年 9 月"]}>
      <Section title="结论" description="三款企业网盘,2026 年 9 月版本">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比产品、分析截图、步骤与问题的总量">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={primary.value}
            unit={primary.unit}
            label={primary.label}
            captionBelow
          />
          {rest.map((k) => (
            <Stat
              key={k.key}
              span={3}
              value={k.value}
              unit={k.unit}
              label={k.label}
              captionBelow
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="步骤越少、输入项越少越省事;结论为该产品的分享主路径">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2 },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={productRows}
          caption="步骤数为从文件列表到发出分享的必点步数;三项输入项均为 0,即全程无需填写。"
        />
      </Section>

      <Section title="链路明细" description="每格一屏,按操作顺序横向排开;共 12 张分析截图">
        <Group className="gap-12">
          {data.chains.map((chain) => (
            <Group key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步 · ${chain.verdict}`} />
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
                    {step.note ? <FigureLabel>{`备注 · ${step.note}`}</FigureLabel> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="问题清单" description="外链分享路径上的问题,按严重度排序">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={issueRows}
          caption="严重度按对分享结果的影响分级:高为权限设置被改后与预期不符,中为入口难找,低为操作反馈缺失。"
        />
      </Section>

      <Section title="下一步" description="建议与其依据,依据对回问题编号或竞品步骤">
        <List ordered items={suggestionItems} />
      </Section>

      <Section title="背景信息" description="本次走查的任务、范围与口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            { label: "分析截图", value: `${kpi("screens").value} 张(每款产品全流程逐屏截取)` },
          ]}
        />
      </Section>
    </Page>
  )
}