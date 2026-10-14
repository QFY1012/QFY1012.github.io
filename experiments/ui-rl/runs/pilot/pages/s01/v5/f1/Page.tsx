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

const productRows = data.products.map((p) => ({
  product: p.name,
  steps: p.steps,
  inputs: p.inputs,
  verdict: p.verdict,
}))

const stageRows = data.stages.map((s) => ({
  stage: s.stage,
  a: s["青禾银行"],
  b: s["远川银行"],
  c: s["北辰银行"],
}))

const issueRows = data.issues.map((i) => ({
  id: i.id,
  product: i.product,
  step: `第 ${i.step} 步`,
  title: i.title,
  evidence: i.evidence,
  severity: i.severity,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["手机银行线上开户 · 3 款银行 App", "2026 年 9 月版本"]}>
      <Section title="结论" description="三家银行流程差异的一句话概括">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
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
          <Stat
            span={3}
            captionBelow
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
          />
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
            note="远川银行 12.1.3"
          />
        </Grid>
      </Section>

      <Section title="产品对比" description="三家银行的步骤数与手动输入项">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "流程结论", span: 3 },
          ]}
          rows={productRows}
          caption="步骤数含开户首页与成功页;输入项是需要手动填写的字段数。"
        />
      </Section>

      <Section title="环节对比" description="四个环节里三家银行的做法">
        <DataTable
          columns={[
            { key: "stage", label: "环节", span: 3 },
            { key: "a", label: "青禾银行", span: 2 },
            { key: "b", label: "远川银行", span: 2 },
            { key: "c", label: "北辰银行", span: 2 },
          ]}
          rows={stageRows}
        />
      </Section>

      <Section title="流程模式" description="重复出现的做法及其适用产品">
        <List
          numbered
          items={data.patterns.map((p) => ({
            title: `${p.name} · ${p.products.join("、")}`,
            description: p.comment,
          }))}
        />
      </Section>

      <Section title="流程明细" description="按步骤排列的屏序列,共 26 张截图">
        <Group>
          {data.chains.flatMap((chain) => [
            <Rule key={`${chain.product}-rule`} label={`${chain.product} · ${chain.version}`} />,
            <FigureStrip key={`${chain.product}-strip`}>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                  <FigureLabel>
                    第 {step.no} 步 · {step.screen}
                  </FigureLabel>
                  <FigureText>
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                    {step.note ? ` · ${step.note}` : ""}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>,
          ])}
        </Group>
      </Section>

      <Section title="问题" description="按严重度排出的 5 个问题">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
          caption="编号与下一步建议的依据对应。"
        />
      </Section>

      <Section title="下一步" description="四条建议,括号内是依据的步骤与问题编号">
        <List
          numbered
          columns={3}
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail}(依据:${s.basis.join("、")})`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "走查时间", value: data.date },
            {
              label: "产品与版本",
              value: data.chains.map((c) => `${c.product} ${c.version}`).join("、"),
            },
            {
              label: "样本",
              value: `${kpi("screens").value} 张分析截图,覆盖三家银行的完整开户流程`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}
