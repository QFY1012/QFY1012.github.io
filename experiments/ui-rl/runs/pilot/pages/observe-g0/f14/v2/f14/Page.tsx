import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Text,
  Stat,
  DataTable,
  ProgressList,
  List,
  KV,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
} from "@/components/report"

export default function Report() {
  const kpi = (key: string) => data.kpis.find((item) => item.key === key)!

  return (
    <Page
      title={data.title}
      meta={["智能音箱 App · 2026 年 3 月版本", "2 款产品 · 13 张截图"]}
    >
      <Section title="结论" description="配网绑定流程的两款 App 对比">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次走查的规模与结果">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={kpi("fewest").value}
            unit={kpi("fewest").unit}
            label={kpi("fewest").label}
            captionBelow
            note="聆动 7 步"
          />
          <Stat
            span={3}
            value={kpi("products").value}
            unit={kpi("products").unit}
            label={kpi("products").label}
            captionBelow
          />
          <Stat
            span={3}
            value={kpi("screens").value}
            unit={kpi("screens").unit}
            label={kpi("screens").label}
            captionBelow
          />
          <Stat
            span={3}
            value={kpi("issues").value}
            unit={kpi("issues").unit}
            label={kpi("issues").label}
            captionBelow
            note="严重 2 个"
          />
        </Grid>
      </Section>

      <Section
        title="流程对比"
        description="两款 App 的步骤数、输入项与阶段差异"
        className="gap-12"
      >
        <Group title="产品总览">
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 2 },
              { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
              { key: "inputs", label: "输入项", align: "right", span: 2 },
              { key: "verdict", label: "判断", span: 3 },
            ]}
            rows={data.products}
            caption="输入项指需要用户填写或选择的字段数;判断为配网流程的对照结论"
          />
        </Group>

        <Group title="分阶段对比">
          <DataTable
            columns={[
              { key: "stage", label: "阶段", span: 3 },
              { key: "聆动音箱", label: "聆动音箱", span: 3 },
              { key: "云雀音箱", label: "云雀音箱", span: 3 },
            ]}
            rows={data.stages}
            caption="阶段按配网顺序排列,同一阶段两列给出各自做法"
          />
        </Group>
      </Section>

      <Section
        title="链路明细"
        description="两款 App 的每一步截图,按步骤顺序横向排列"
        className="gap-12"
      >
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
                    {step.content} · {step.action} · 输入 {step.inputs} 项
                  </FigureText>
                  {step.note ? <FigureText className="mt-2">备注 · {step.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section
        title="发现"
        description="3 个问题,2 个严重、1 个中等,均来自链路明细"
      >
        <List
          columns={3}
          metaTone="destructive"
          items={data.issues.map((issue) => ({
            title: `${issue.id} · ${issue.title}`,
            description: `${issue.product} 第 ${issue.step} 步 · ${issue.evidence}`,
            meta: `严重度 ${issue.severity}`,
          }))}
        />
      </Section>

      <Section title="下一步" description="针对 3 个问题的改动建议">
        <List
          columns={3}
          numbered
          items={data.suggestions.map((item) => ({
            title: `${item.id} · ${item.title}`,
            description: `${item.detail}(依据 ${item.basis.join("、")})`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="任务、范围与版本口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "走查日期", value: data.date },
            {
              label: "产品与版本",
              value: data.chains
                .map((chain) => `${chain.product} ${chain.version}(${chain.steps.length} 步)`)
                .join("、"),
            },
            { label: "分析截图", value: `${data.kpis[1].value} 张,发现 ${data.kpis[3].value} 个问题` },
          ]}
        />
      </Section>
    </Page>
  )
}