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

const stageColumns = [
  { key: "stage", label: "环节", span: 2 },
  { key: "collab", label: "协作宝", span: 4 },
  { key: "lian", label: "链工", span: 3 },
]

const stageRows = data.stages.map((s) => ({
  stage: s.stage,
  collab: s["协作宝"],
  lian: s["链工"],
}))

const issueColumns = [
  { key: "id", label: "编号", span: 1 },
  { key: "where", label: "位置", span: 2 },
  { key: "title", label: "问题", span: 2 },
  { key: "severity", label: "严重程度", span: 1, tone: ["高"] },
  { key: "evidence", label: "表现", span: 3 },
]

const issueRows = data.issues.map((i) => ({
  id: i.id,
  where: `${i.product} 第 ${i.step} 步`,
  title: i.title,
  severity: i.severity,
  evidence: i.evidence,
}))

const suggestionItems = data.suggestions.map((s) => ({
  title: s.title,
  description: `${s.detail} · 依据 ${s.basis.join("、")}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={[data.scope, data.date]}>
      <Section title="结论" description="同一任务、同一周期下的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比范围与结果计数,单位见数字下方">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((k) => (
            <Stat
              key={k.key}
              span={3}
              value={k.value}
              unit={k.unit}
              size="lg"
              captionBelow
              label={k.label}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="产品对比"
        description="同一任务下两款产品的做法差异"
        className="gap-12"
      >
        <Group title="两款产品">
          <Grid cols={9} fields={false} className="items-baseline">
            {data.products.map((p) => (
              <Stat
                key={p.name}
                span={3}
                value={p.steps}
                unit="步"
                captionBelow
                label={p.name}
                note={`${p.inputs} 项输入 · ${p.verdict}`}
              />
            ))}
          </Grid>
        </Group>
        <Group title="分阶段对比">
          <DataTable columns={stageColumns} rows={stageRows} />
        </Group>
      </Section>

      <Section
        title="链路明细"
        description="每步一屏,含操作与输入项;问题见末尾"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
            <Text>{`${chain.verdict} · 共 ${chain.steps.length} 步`}</Text>
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
                    {[
                      step.content,
                      step.action,
                      step.inputs ? `输入 ${step.inputs} 项` : "",
                      step.note,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
        <Group title={`问题明细 · 共 ${data.issues.length} 个`}>
          <DataTable
            columns={issueColumns}
            rows={issueRows}
            caption="严重程度按对完成预订的影响划分;高为需要绕过或返回重选"
          />
        </Group>
      </Section>

      <Section title="下一步" description="依据链工做法提出的三条改动">
        <List items={suggestionItems} columns={3} numbered />
      </Section>

      <Section title="背景信息" description="任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "对比范围", value: data.scope },
            { label: "报告日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
