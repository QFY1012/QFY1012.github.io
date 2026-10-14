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

export default function Report() {
  const fewest = data.products.reduce((a, b) => (b.steps < a.steps ? b : a))
  const screens = data.chains.reduce((n, chain) => n + chain.steps.length, 0)
  const sample = data.chains
    .map((chain) => `${chain.product} ${chain.steps.length}`)
    .join("、")

  const issueRows = data.issues.map((issue) => ({
    id: issue.id,
    where: `${issue.product} · 第 ${issue.step} 步`,
    title: issue.title,
    evidence: issue.evidence,
    severity: issue.severity,
  }))

  return (
    <Page title={data.title} meta={["企业网盘 · 外链分享", data.scope]}>
      <Section title="结论" description="三款产品的分享步数与权限设置差异">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="步数按从文件列表到发送完成的操作数计">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={fewest.steps}
            unit="步"
            label={`步骤最少(${fewest.name})`}
          />
          <Stat
            span={2}
            captionBelow
            value={data.issues.length}
            unit="个"
            label="发现问题"
          />
          <Stat
            span={2}
            captionBelow
            value={data.products.length}
            unit="个"
            label="对比产品"
          />
          <Stat span={2} captionBelow value={screens} unit="张" label="分析截图" />
        </Grid>
      </Section>

      <Section title="产品对比" description="三款产品的分享步骤数与流程特点">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 3 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "verdict", label: "流程特点", span: 4 },
          ]}
          rows={data.products}
          caption="三款产品的分享过程都不需要填写输入项;步数为从文件列表到发送完成的操作数。"
        />
      </Section>

      <Section title="流程链路" description="每个产品从文件列表到发送的逐步截图">
        <Group>
          {data.chains.map((chain) => (
            <Group
              key={chain.product}
              title={`${chain.product} · ${chain.version} · ${chain.steps.length} 步`}
            >
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
                      {step.note
                        ? `${step.content} · ${step.action} · ${step.note}`
                        : `${step.content} · ${step.action}`}
                    </FigureText>
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="问题" description="三处会影响分享结果的交互问题">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "where", label: "位置", span: 2 },
            { key: "title", label: "问题", span: 3 },
            { key: "evidence", label: "表现", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={issueRows}
          caption="三处问题都出现在云盒的分享路径上;严重度按对分享结果的影响排序。"
        />
      </Section>

      <Section title="下一步" description="两条改法与各自依据的步骤、问题编号">
        <List
          ordered
          divided={false}
          columns={2}
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: suggestion.detail,
            meta: `${suggestion.id} · 依据 ${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与样本量">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            { label: "样本量", value: `${screens} 张分析截图(${sample})` },
          ]}
        />
      </Section>
    </Page>
  )
}
