import data from "./data.json"
import {
  Page,
  Section,
  Grid,
  Group,
  Rule,
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

const LEVELS = ["低", "中", "高"]

const kpi = Object.fromEntries(data.kpis.map((item) => [item.key, item]))

const issues = [...data.issues].sort(
  (a, b) => LEVELS.indexOf(b.severity) - LEVELS.indexOf(a.severity)
)

const totalShots = data.chains.reduce((sum, chain) => sum + chain.steps.length, 0)

export default function Report() {
  return (
    <Page title={data.title} meta={[data.task, data.scope, data.date]}>
      <Section title="结论" description="外卖从购物车到支付成功,2 款 App 的链路差异">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="2026 年 9 月版本,快送 11.2、小橙 8.9">
        <Grid cols={12} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={kpi.fewest.value}
            unit={kpi.fewest.unit}
            label={kpi.fewest.label}
            note="快送 5 步"
          />
          <Stat
            span={3}
            captionBelow
            value={kpi.issues.value}
            unit={kpi.issues.unit}
            label={kpi.issues.label}
            note="高 1 · 中 1 · 低 1"
          />
          <Stat
            span={3}
            captionBelow
            value={kpi.products.value}
            unit={kpi.products.unit}
            label={kpi.products.label}
            note="快送、小橙"
          />
          <Stat
            span={3}
            captionBelow
            value={kpi.screens.value}
            unit={kpi.screens.unit}
            label={kpi.screens.label}
            note="每款 4 到 5 张"
          />
        </Grid>
      </Section>

      <Section title="流程对比" description="按步骤顺序排列,每张一屏,9 步都不需要输入内容">
        <Group>
          {data.chains.map((chain) => (
            <Group key={chain.product}>
              <Rule label={`${chain.product} · ${chain.version} · ${chain.steps.length} 屏 · ${chain.verdict}`} />
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
                      {step.content} · {step.action}
                      {step.note ? ` · ${step.note}` : ""}
                    </FigureText>
                  </Figure>
                ))}
              </FigureStrip>
            </Group>
          ))}
        </Group>
      </Section>

      <Section title="问题" description="共 3 条,按严重度从高到低排列">
        <DataTable
          caption="编号用于下一步建议的依据;严重度分低、中、高三级,最高一级为红色加粗。"
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 2, levels: LEVELS },
          ]}
          rows={issues}
        />
      </Section>

      <Section title="下一步" description="依据问题编号与小橙的做法">
        <List
          numbered
          items={data.suggestions.map((item) => ({
            title: item.title,
            description: `${item.detail} · 依据:${item.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="本次走查的任务、范围与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "版本", value: "快送 11.2、小橙 8.9" },
            { label: "样本", value: `2 款 App 共 ${totalShots} 张截图` },
            { label: "走查日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}
