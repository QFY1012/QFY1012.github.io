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
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function issueTagsFor(product: string, stepNo: number) {
  return data.issues
    .filter(
      (i) => (i.product === product || i.product === "全部") && i.step === stepNo,
    )
    .map((i) => `${i.id} ${i.severity}`)
}

type Chain = (typeof data.chains)[number]
type Step = Chain["steps"][number]
type StepEntry = { product: string; step: Step }

function screenFor(product: string, stepNo: number) {
  const chain = data.chains.find((c) => c.product === product)
  return chain?.steps.find((s) => s.no === stepNo)?.screen ?? ""
}

function issueLocation(issue: (typeof data.issues)[number]) {
  if (issue.product === "全部") {
    const screens = data.chains
      .map((c) => c.steps.find((s) => s.no === issue.step)?.screen)
      .filter((s): s is string => Boolean(s))
    const unique = [...new Set(screens)]
    return `全部产品 · 第 ${issue.step} 步${unique.length ? ` · ${unique.join("、")}` : ""}`
  }
  return `${issue.product} · 第 ${issue.step} 步 · ${screenFor(issue.product, issue.step)}`
}

function basisLabel(ref: string) {
  const issue = data.issues.find((i) => i.id === ref)
  if (issue) {
    return `${issue.id} · ${issue.product} 第 ${issue.step} 步 · ${screenFor(issue.product, issue.step)}`
  }
  const matched = ref.match(/第\s*(\d+)\s*步/)
  const product = data.products.map((p) => p.name).find((n) => ref.includes(n))
  if (matched && product) {
    const stepNo = Number(matched[1])
    return `${product} 第 ${stepNo} 步 · ${screenFor(product, stepNo)}`
  }
  return ref
}

export default function Report() {
  const productRows = data.products.map((p) => ({
    name: p.name,
    version: data.chains.find((c) => c.product === p.name)?.version ?? "",
    steps: p.steps,
    verdict: p.verdict,
  }))

  const maxSteps = Math.max(...data.chains.map((c) => c.steps.length))
  const stepsByNo: StepEntry[][] = Array.from({ length: maxSteps }, (_, idx) =>
    data.chains
      .map((c) => ({
        product: c.product,
        step: c.steps.find((s) => s.no === idx + 1),
      }))
      .filter((e): e is StepEntry => Boolean(e.step)),
  )

  const issueRows = data.issues.map((i) => ({
    id: i.id,
    where: issueLocation(i),
    title: `${i.title}(${i.evidence})`,
    severity: i.severity,
  }))

  return (
    <Page title={data.title} meta={["企业网盘", "2026 年 9 月"]}>
      {/* 结论 */}
      <Section title="结论" description="本次对比的核心判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      {/* 核心指标 */}
      <Section title="核心指标" description="本次挖掘的样本与结果概览">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat span={3} captionBelow value={3} unit="个" label="对比产品" />
          <Stat span={3} captionBelow value={12} unit="张" label="分析截图" />
          <Stat
            span={3}
            captionBelow
            size="lg"
            value={3}
            unit="步"
            label="步骤最少(栈盘)"
          />
          <Stat span={3} captionBelow value={3} unit="个" label="发现问题" />
        </Grid>
      </Section>

      {/* 产品对比 */}
      <Section title="产品对比" description="3 款企业网盘,按完成分享的步数对比">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "version", label: "版本", span: 1, align: "right" },
            { key: "steps", label: "步骤数(步)", span: 2, align: "right" },
            { key: "verdict", label: "结论", span: 4 },
          ]}
          rows={productRows}
        />
      </Section>

      {/* 链路明细 */}
      <Section
        title="链路明细"
        description="逐屏拆解从文件到发送的完整流程"
        className="gap-12"
      >
        {stepsByNo.map((entries, idx) => {
          const no = idx + 1
          return (
            <Group key={no} title={`第 ${no} 步`}>
              {chunk(entries, 3).map((row, rowIndex) => (
                <FigureStrip key={rowIndex}>
                  {row.map(({ product, step }) => {
                    const tags = issueTagsFor(product, no)
                    return (
                      <Figure key={`${product}-${no}`}>
                        <FigureImage
                          src={step.image}
                          alt={`${product} 第 ${no} 步:${step.screen}`}
                        />
                        <FigureLabel>
                          {product} · 第 {no} 步 · {step.screen}
                          {tags.length ? ` · ${tags.join("、")}` : ""}
                        </FigureLabel>
                        <FigureText>
                          {step.content} · {step.action} · 输入 {step.inputs} 项
                          {step.note ? ` · ${step.note}` : ""}
                        </FigureText>
                      </Figure>
                    )
                  })}
                </FigureStrip>
              ))}
            </Group>
          )
        })}
      </Section>

      {/* 问题清单 */}
      <Section title="问题清单" description="共 3 个,集中在云盒的权限与反馈环节">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "where", label: "位置", span: 3 },
            { key: "title", label: "问题", span: 3 },
            { key: "severity", label: "严重度", span: 2, tone: ["高"] },
          ]}
          rows={issueRows}
          caption="严重度按影响范围与用户困惑程度评定"
        />
      </Section>

      {/* 下一步 */}
      <Section title="下一步" description="针对问题的改进方向与依据">
        <List
          columns={3}
          numbered
          items={data.suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail} · 依据:${s.basis.map(basisLabel).join(";")}`,
          }))}
        />
      </Section>

      {/* 背景信息 */}
      <Section title="背景信息" description="任务口径与样本规模">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            { label: "对比产品", value: `${data.products.length} 款` },
            {
              label: "分析截图",
              value: `${data.chains.reduce((n, c) => n + c.steps.length, 0)} 张`,
            },
          ]}
        />
      </Section>
    </Page>
  )
}
