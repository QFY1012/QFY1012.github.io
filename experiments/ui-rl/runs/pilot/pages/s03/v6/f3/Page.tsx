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

const fewest = data.kpis.find((k) => k.key === "fewest")!
const issuesKpi = data.kpis.find((k) => k.key === "issues")!
const productsKpi = data.kpis.find((k) => k.key === "products")!
const screensKpi = data.kpis.find((k) => k.key === "screens")!

const issueRows = data.issues.map((issue) => ({
  title: issue.title,
  where: `${issue.product} · 第 ${issue.step} 步`,
  evidence: issue.evidence,
  severity: issue.severity,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["企业网盘 · 外链分享", "2026 年 9 月"]}>
      <Section title="结论" description="三款企业网盘外链分享链路对比">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="3 款产品,12 张步骤截图">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={fewest.value}
            unit={fewest.unit}
            size="lg"
            captionBelow
            label={fewest.label}
            note="云盒 4 步 · 方舟 5 步"
          />
          <Stat
            span={3}
            value={issuesKpi.value}
            unit={issuesKpi.unit}
            captionBelow
            label={issuesKpi.label}
            note="高 1 · 中 1 · 低 1"
          />
          <Stat
            span={3}
            value={productsKpi.value}
            unit={productsKpi.unit}
            captionBelow
            label={productsKpi.label}
            note="云盒、栈盘、方舟"
          />
          <Stat
            span={3}
            value={screensKpi.value}
            unit={screensKpi.unit}
            captionBelow
            label={screensKpi.label}
            note="每款 3 至 5 张"
          />
        </Grid>
      </Section>

      <Section title="产品对比" description="完成一次外链分享所需的步骤数与结论">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.products.map((product) => (
            <Stat
              key={product.name}
              span={3}
              value={product.steps}
              unit="步"
              captionBelow
              label={product.name}
              note={product.verdict}
            />
          ))}
        </Grid>
      </Section>

      <Section title="链路明细" description="每款产品按操作顺序排列,截图 375 × 760">
        <Group>
          {data.chains.flatMap((chain) => [
            <Rule
              key={`${chain.product}-rule`}
              label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步 · ${chain.verdict}`}
            />,
            <FigureStrip key={`${chain.product}-strip`}>
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
                    {step.content} · {step.action}
                  </FigureText>
                  {step.note ? <FigureText>{step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>,
          ])}
        </Group>
      </Section>

      <Section title="问题" description="3 处问题,均出现在云盒,按严重度排列">
        <Group title="问题明细">
          <DataTable
            columns={[
              { key: "title", label: "问题", span: 3 },
              { key: "where", label: "位置", span: 2 },
              { key: "evidence", label: "证据", span: 2 },
              { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
            ]}
            rows={issueRows}
            caption="严重度按对分享结果的影响排列:高 = 权限失误,中 = 多余点击,低 = 缺少反馈。"
          />
        </Group>
      </Section>

      <Section title="下一步" description="针对云盒的两项改动,依据栈盘与方舟的做法">
        <Grid cols={9} fields={false}>
          <List
            span={6}
            ordered
            divided={false}
            items={data.suggestions.map((item) => ({
              title: item.title,
              description: item.detail,
            }))}
          />
          <KV
            span={3}
            labelCols={1}
            items={data.suggestions.map((item) => ({
              label: `${item.id} 依据`,
              value: item.basis.join("、"),
            }))}
          />
        </Grid>
      </Section>

      <Section title="背景信息" description="任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "日期", value: data.date },
            {
              label: "产品版本",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join("、"),
            },
            { label: "样本", value: "12 张步骤截图,每款产品 3 至 5 步,输入项均为 0" },
          ]}
        />
      </Section>
    </Page>
  )
}