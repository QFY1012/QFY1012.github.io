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

export default function Report() {
  return (
    <Page title={data.title} meta={["星幕视频 · 橙果视频", "2026 年 6 月版本"]}>
      <Section title="结论" description="两款 App 关闭自动续费的链路对比">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的对象与产出">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            value={6}
            unit="步"
            size="lg"
            captionBelow
            label="步骤最少(橙果视频)"
            note="星幕视频要 8 步"
          />
          <Stat span={2} value={2} unit="个" captionBelow label="对比产品" note="星幕视频 · 橙果视频" />
          <Stat span={2} value={14} unit="张" captionBelow label="分析截图" note="星幕 8 张 · 橙果 6 张" />
          <Stat span={2} value={3} unit="个" captionBelow label="发现问题" note="高 2 个 · 中 1 个" />
        </Grid>
      </Section>

      <Section title="产品对比" description="链路长度、输入项与结论,按步骤数排序">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 3 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 1 },
            { key: "verdict", label: "结论", span: 3 },
          ]}
          rows={data.products}
        />
      </Section>

      <Section title="链路明细" description="按步骤顺序排列的逐步截图,共 14 张" className="gap-12">
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
                  {step.note ? <FigureLabel>备注 · {step.note}</FigureLabel> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="共性模式" description="两款产品重复出现的交互套路">
        <List
          numbered
          items={data.patterns.map((pattern) => ({
            title: pattern.name,
            description: pattern.comment,
            meta: pattern.products.join("、"),
          }))}
        />
      </Section>

      <Section title="问题明细" description="3 个问题,严重度从高到低排列" className="gap-12">
        <Group title="问题清单">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "product", label: "产品", span: 2 },
              { key: "step", label: "步骤", align: "right", span: 1 },
              { key: "title", label: "问题", span: 3 },
              { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
            ]}
            rows={data.issues}
            caption="严重度按对关闭目标的影响排序:高 > 中;高 2 个、中 1 个。"
          />
        </Group>
        <Group title="逐条证据">
          <List
            numbered
            items={data.issues.map((issue) => ({
              title: `${issue.id} ${issue.product} 第 ${issue.step} 步`,
              description: issue.evidence,
            }))}
          />
        </Group>
      </Section>

      <Section title="下一步" description="两条建议,依据对回问题编号">
        <List
          ordered
          items={data.suggestions.map((suggestion) => ({
            title: suggestion.title,
            description: `${suggestion.detail} 依据:${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与走查日期">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "走查日期", value: data.date },
            {
              label: "产品与版本",
              value: data.chains.map((chain) => `${chain.product} ${chain.version}`).join("、"),
            },
          ]}
        />
      </Section>
    </Page>
  )
}
