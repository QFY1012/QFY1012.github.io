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

const stepFewest = data.kpis.find((k) => k.key === "fewest")!
const productCount = data.kpis.find((k) => k.key === "products")!
const screenCount = data.kpis.find((k) => k.key === "screens")!
const issueCount = data.kpis.find((k) => k.key === "issues")!

export default function Report() {
  return (
    <Page title={data.title} meta={["星幕视频 · 橙果视频", "2026 年 6 月版本", data.date]}>
      <Section title="结论" description="本次走查的判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="两款 App、14 张截图走查后得到的关键数字">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={stepFewest.value}
            unit={stepFewest.unit}
            label={stepFewest.label}
            note="星幕视频 8 步"
          />
          <Stat
            span={2}
            captionBelow
            value={productCount.value}
            unit={productCount.unit}
            label={productCount.label}
            note="星幕视频 7.2.1、橙果视频 5.9.0"
          />
          <Stat
            span={2}
            captionBelow
            value={issueCount.value}
            unit={issueCount.unit}
            label={issueCount.label}
            note="高 2 个、中 1 个"
          />
          <Stat
            span={2}
            captionBelow
            value={screenCount.value}
            unit={screenCount.unit}
            label={screenCount.label}
            note="星幕 8 张、橙果 6 张"
          />
        </Grid>
      </Section>

      <Section title="产品对比" description="取消自动续费的步骤数与输入项">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2 },
            { key: "inputs", label: "输入项", align: "right", span: 2 },
            { key: "verdict", label: "判断", span: 3 },
          ]}
          rows={data.products.map((product) => ({
            product: product.name,
            steps: `${product.steps} 步`,
            inputs: `${product.inputs} 项`,
            verdict: product.verdict,
          }))}
          caption="步骤数从「我的」页点击会员入口算到关闭成功;输入项指链路上需要用户填写或选择的项。"
        />
      </Section>

      <Section title="常见模式" description="两款 App 共有的做法与差别">
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: `${pattern.products.join("、")} · ${pattern.comment}`,
          }))}
        />
      </Section>

      <Section title="链路明细" description="一个产品一组,按操作顺序排开">
        <Group>
          {data.chains.map((chain) => (
            <Group key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步`} />
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
                    {step.note ? <FigureText>{step.note}</FigureText> : null}
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="问题清单" description="按严重度从高到低,依据指对应截图步骤">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "依据", span: 3 },
          ]}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            product: issue.product,
            step: `第 ${issue.step} 步`,
            title: issue.title,
            severity: issue.severity,
            evidence: issue.evidence,
          }))}
          caption="编号 P1–P3 与下一步建议的依据对应;严重度按是否阻断关闭流程分级。"
        />
      </Section>

      <Section title="下一步" description="两条改法与各自依据">
        <List
          ordered
          divided={false}
          items={data.suggestions.map((suggestion) => ({
            title: `${suggestion.id} · ${suggestion.title}`,
            description: `${suggestion.detail} · 依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次走查的任务与范围">
        <KV
          labelCols={2}
          items={[
            { label: "分析任务", value: data.task },
            { label: "覆盖范围", value: data.scope },
            { label: "对比产品", value: data.chains.map((c) => `${c.product} ${c.version}`).join("、") },
            { label: "分析截图", value: `${screenCount.value} 张(星幕 8 张、橙果 6 张)` },
            { label: "走查日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
