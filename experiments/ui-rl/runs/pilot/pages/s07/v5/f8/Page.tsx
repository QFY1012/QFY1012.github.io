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

const stageRows = data.stages.map((stage) => ({
  stage: stage.stage,
  anqin: stage["安沁医院"],
  wangshan: stage["望山医院"],
  chengxin: stage["澄心医院"],
}))

const issueRows = data.issues.map((issue) => ({
  id: issue.id,
  product: issue.product,
  step: String(issue.step),
  issue: issue.title,
  severity: issue.severity,
  evidence: issue.evidence,
}))

const suggestionItems = data.suggestions.map((item) => ({
  title: item.title,
  description: `${item.detail} 依据:${item.basis.join("、")}`,
}))

export default function Report() {
  return (
    <Page title={data.title} meta={["医院预约挂号", "2026 年 3 月"]}>
      <Section
        title="结论"
        description="手机端一次门诊预约挂号的走通情况"
      >
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section
        title="核心指标"
        description="3 款 App 共 18 张流程截图的口径"
      >
        <Grid cols={9} fields={false} className="items-baseline">
          {["fewest", "issues", "products", "screens"].map((key, index) => {
            const kpi = data.kpis.find((item) => item.key === key)
            if (!kpi) return null
            return (
              <Stat
                key={kpi.key}
                span={index === 0 ? 3 : 2}
                size="lg"
                captionBelow
                value={kpi.value}
                unit={kpi.unit}
                label={kpi.label}
              />
            )
          })}
        </Grid>
      </Section>

      <Section
        title="流程对比"
        description="同一任务拆成六个环节,逐环节看三家的做法"
      >
        <DataTable
          columns={[
            { key: "stage", label: "环节", span: 3 },
            { key: "anqin", label: "安沁医院", span: 2 },
            { key: "wangshan", label: "望山医院", span: 2 },
            { key: "chengxin", label: "澄心医院", span: 2 },
          ]}
          rows={stageRows}
        />
      </Section>

      <Section
        title="链路明细"
        description="每个产品一组,按步骤顺序横向排开,一行放不下可横向滚动"
        className="gap-12"
      >
        {data.chains.map((chain) => (
          <Group key={chain.product}>
            <Rule label={`${chain.product} · ${chain.version} · ${chain.verdict}`} />
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
      </Section>

      <Section
        title="问题明细"
        description="4 个问题,严重度从低到高分三级"
      >
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", span: 1, align: "right" },
            { key: "issue", label: "问题", span: 2 },
            {
              key: "severity",
              label: "严重度",
              span: 1,
              levels: ["低", "中", "高"],
            },
            { key: "evidence", label: "证据", span: 2 },
          ]}
          rows={issueRows}
        />
      </Section>

      <Section
        title="下一步"
        description="三条改动,依据对回问题编号"
      >
        <List numbered items={suggestionItems} />
      </Section>

      <Section
        title="背景信息"
        description="任务、范围与版本"
      >
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            {
              label: "版本",
              value: data.chains
                .map((chain) => `${chain.product} ${chain.version}`)
                .join(" · "),
            },
            { label: "报告日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}