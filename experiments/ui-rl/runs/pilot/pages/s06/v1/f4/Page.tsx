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

const kpi = (key: string) => data.kpis.find((item) => item.key === key)

const stepText = (step: (typeof data.chains)[number]["steps"][number]) => {
  const parts: string[] = [step.content, step.action]
  if (step.inputs > 0) parts.push(`输入 ${step.inputs} 项`)
  if (step.note) parts.push(step.note)
  return parts.join(" · ")
}

export default function Report() {
  const fewest = kpi("fewest")
  const products = kpi("products")
  const issues = kpi("issues")
  const screens = kpi("screens")

  const left = data.chains[0]
  const right = data.chains[1]

  return (
    <Page
      title={data.title}
      meta={[data.scope, "协作宝 7.2 / 链工 4.6", `分析日期 ${data.date}`]}
    >
      <Section title="结论" description={data.task}>
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="流程长度、问题数与走查样本量">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={fewest?.value ?? 0}
            unit={fewest?.unit}
            label={fewest?.label}
            size="lg"
            captionBelow
            note={`对比:协作宝 ${data.products[0].steps} 步`}
          />
          <Stat
            span={3}
            value={products?.value ?? 0}
            unit={products?.unit}
            label={products?.label}
            captionBelow
            note="协作宝 7.2 / 链工 4.6"
          />
          <Stat
            span={3}
            value={issues?.value ?? 0}
            unit={issues?.unit}
            label={issues?.label}
            captionBelow
            note="均在协作宝"
          />
          <Stat
            span={3}
            value={screens?.value ?? 0}
            unit={screens?.unit}
            label={screens?.label}
            captionBelow
            note={`协作宝 ${left.steps.length} 张 / 链工 ${right.steps.length} 张`}
          />
        </Grid>
      </Section>

      <Section
        title="流程对比"
        description="同一任务的两条路径;输入项数指需要填写或选择的字段数"
        className="gap-12"
      >
        <Group title="两款产品">
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2 },
              { key: "inputs", label: "输入项数", align: "right", span: 2 },
              { key: "verdict", label: "预订思路", span: 3 },
            ]}
            rows={data.products.map((product) => ({
              name: `${product.name} ${data.chains.find((chain) => chain.product === product.name)?.version ?? ""}`,
              steps: product.steps,
              inputs: product.inputs,
              verdict: product.verdict,
            }))}
          />
        </Group>

        <Group title="分环节对比">
          <DataTable
            columns={[
              { key: "stage", label: "环节", span: 3 },
              { key: "left", label: "协作宝", span: 3 },
              { key: "right", label: "链工", span: 3 },
            ]}
            rows={data.stages.map((stage) => ({
              stage: stage.stage,
              left: stage["协作宝"],
              right: stage["链工"],
            }))}
          />
        </Group>
      </Section>

      <Section
        title="链路明细"
        description={`协作宝 ${left.steps.length} 步、链工 ${right.steps.length} 步,共 ${screens?.value ?? 0} 屏`}
      >
        <Group>
          <Rule label={`${left.product} · ${left.version} · ${left.steps.length} 步 · ${left.verdict}`} />
          <FigureStrip>
            {left.steps.map((step) => (
              <Figure key={step.no}>
                <FigureImage
                  src={step.image}
                  alt={`${left.product} 第 ${step.no} 步:${step.screen}`}
                />
                <FigureLabel>
                  第 {step.no} 步 · {step.screen}
                </FigureLabel>
                <FigureText>{stepText(step)}</FigureText>
              </Figure>
            ))}
          </FigureStrip>
          <Rule label={`${right.product} · ${right.version} · ${right.steps.length} 步 · ${right.verdict}`} />
          <FigureStrip>
            {right.steps.map((step) => (
              <Figure key={step.no}>
                <FigureImage
                  src={step.image}
                  alt={`${right.product} 第 ${step.no} 步:${step.screen}`}
                />
                <FigureLabel>
                  第 {step.no} 步 · {step.screen}
                </FigureLabel>
                <FigureText>{stepText(step)}</FigureText>
              </Figure>
            ))}
          </FigureStrip>
        </Group>
      </Section>

      <Section
        title="问题"
        description={`${issues?.value ?? 0} 个问题都在协作宝,集中在选房间和选时段两步`}
      >
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={data.issues}
          caption="严重度按对完成预订的影响判定,问题编号与下一步建议的依据对应。"
        />
      </Section>

      <Section
        title="下一步"
        description="三条改动都取自链工已验证的做法,依据标注在每条建议后面"
      >
        <List
          ordered
          items={data.suggestions.map((item) => ({
            title: item.title,
            description: `${item.detail};依据:${item.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次走查的范围与口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "产品与版本", value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join(" / ") },
            { label: "样本", value: `${screens?.value ?? 0} 张界面截图(协作宝 ${left.steps.length} 张、链工 ${right.steps.length} 张)` },
            { label: "分析日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
