import data from "./data.json"
import { Page, Section, Group, Grid, Text, Stat, DataTable, List, KV, Rule, FigureStrip, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"

export default function Report() {
  const { title, task, scope, date, summary, kpis, products, stages, patterns, issues, suggestions, chains } = data

  const kpi = (key: string) => kpis.find((item) => item.key === key)!
  const totalSteps = products.reduce((sum, product) => sum + product.steps, 0)
  const stepRange = `${Math.min(...products.map((p) => p.steps))}–${Math.max(...products.map((p) => p.steps))} 步`

  return (
    <Page title={title} meta={["手机银行", "2026 年 9 月版本"]}>
      <Section title="结论" description="三家银行开户流程的一句话判断">
        <Text className="text-2xl leading-9 font-light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="本次共分析 3 款 App、26 张界面截图">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
            captionBelow
            size="lg"
            note={`最多 ${Math.max(...products.map((p) => p.steps))} 步(北辰银行)`}
          />
          <Stat
            span={3}
            value={kpi("products").value}
            unit={kpi("products").unit}
            label={kpi("products").label}
            captionBelow
            note={products.map((product) => product.name).join("、")}
          />
          <Stat span={3} value={kpi("screens").value} unit={kpi("screens").unit} label={kpi("screens").label} captionBelow note={`对应 ${totalSteps} 个步骤`} />
          <Stat
            span={3}
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
            captionBelow
            note={`其中 ${issues.filter((issue) => issue.severity === "高").length} 个高(${issues.filter((issue) => issue.severity === "高").map((issue) => issue.id).join("、")})`}
          />
        </Grid>
      </Section>

      <Section title="流程对比" description="按产品对比步骤数、输入项数与整体结论">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 3 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "结论", span: 2 },
          ]}
          rows={products}
          caption="步骤数按从开户首页到开户成功的屏数计;输入项为需手工填写的字段数"
        />
      </Section>

      <Section title="阶段差异" description="五个流程阶段各家做法的差别">
        <DataTable
          columns={[
            { key: "stage", label: "阶段", span: 3 },
            { key: "青禾银行", label: "青禾银行", span: 2 },
            { key: "远川银行", label: "远川银行", span: 2 },
            { key: "北辰银行", label: "北辰银行", span: 2 },
          ]}
          rows={stages}
        />
      </Section>

      <Section title="共性模式" description="三家流程中反复出现的三种做法">
        <List
          numbered
          items={patterns.map((pattern) => ({
            title: pattern.name,
            description: `涉及 ${pattern.products.join("、")} —— ${pattern.comment}`,
          }))}
        />
      </Section>

      <Section title="链路明细" description="逐屏截图、操作与输入项,步骤备注单独一行标出">
        <Group>
          {chains.flatMap((chain) => [
            <Rule key={`${chain.product}-rule`} label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步 · ${chain.verdict}`} />,
            <FigureStrip key={`${chain.product}-strip`}>
              {chain.steps.map((step) => (
                <Figure key={step.no}>
                  <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
                  <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
                  <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
                  {step.note ? <FigureText>备注:{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>,
          ])}
        </Group>
      </Section>

      <Section title="问题清单" description="5 个问题,按严重度排列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={issues}
          caption="严重度:高 = 失败或报错后要回退重填;中 = 增加操作成本但不阻断"
        />
      </Section>

      <Section title="下一步" description="四条改造建议及依据条目">
        <List
          ordered
          items={suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail}(依据:${suggestion.basis.join("、")})`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: task },
            { label: "范围", value: scope },
            { label: "评测日期", value: date },
            { label: "产品版本", value: chains.map((chain) => `${chain.product} ${chain.version}`).join("、") },
            { label: "样本", value: `${products.length} 款 App、${totalSteps} 个步骤、${kpi("screens").value} 张分析截图` },
            { label: "步骤区间", value: stepRange },
          ]}
        />
      </Section>
    </Page>
  )
}
