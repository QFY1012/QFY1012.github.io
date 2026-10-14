import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Block,
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

const [chainA, chainB] = data.chains

export default function Report() {
  return (
    <Page title={data.title} meta={[data.scope, `分析日期 ${data.date}`]}>
      {/* 结论:一句话判断 */}
      <Section title="结论" description="两款寄件 App 的下单流程判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      {/* 核心指标:走查规模与步骤最少的一款 */}
      <Section title="核心指标" description="本次走查的规模与步骤最少的一款">
        <Grid cols={9} fields={false} className="items-baseline">
          {data.kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={3}
              size="lg"
              captionBelow
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      {/* 产品对比:步骤数与输入项数 */}
      <Section title="产品对比" description="两款 App 从首页到预约成功的步骤数与输入项数">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 3 },
            { key: "steps", label: "步骤数", align: "right", span: 3, bar: true },
            { key: "inputs", label: "输入项数", align: "right", span: 3, bar: true },
          ]}
          rows={data.products.map((p) => ({ product: p.name, steps: p.steps, inputs: p.inputs }))}
          caption="步骤数为从首页到预约成功经过的界面数;输入项数为该流程需要填写或选择的项目数"
        />
      </Section>

      {/* 流程明细:两款 App 的链路截图 */}
      <Section title="流程明细" description="从首页到预约成功的每一步,共 7 张截图">
        <Group>
          <Rule label={`${chainA.product} · ${chainA.version} · ${chainA.verdict}`} />
          <FigureStrip>
            {chainA.steps.map((step) => (
              <Figure key={step.no}>
                <FigureImage
                  src={step.image}
                  alt={`${chainA.product} 第 ${step.no} 步:${step.screen}`}
                />
                <FigureLabel>
                  第 {step.no} 步 · {step.screen}
                </FigureLabel>
                <FigureText>{`${step.content} · ${step.action} · 输入 ${step.inputs} 项`}</FigureText>
                {step.note ? <FigureText>{step.note}</FigureText> : null}
              </Figure>
            ))}
          </FigureStrip>
          <Rule label={`${chainB.product} · ${chainB.version} · ${chainB.verdict}`} />
          <FigureStrip>
            {chainB.steps.map((step) => (
              <Figure key={step.no}>
                <FigureImage
                  src={step.image}
                  alt={`${chainB.product} 第 ${step.no} 步:${step.screen}`}
                />
                <FigureLabel>
                  第 {step.no} 步 · {step.screen}
                </FigureLabel>
                <FigureText>{`${step.content} · ${step.action} · 输入 ${step.inputs} 项`}</FigureText>
                {step.note ? <FigureText>{step.note}</FigureText> : null}
              </Figure>
            ))}
          </FigureStrip>
        </Group>
      </Section>

      {/* 发现问题:严重度与证据 */}
      <Section title="发现问题" description="两个问题,按严重度排列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "title", label: "问题", span: 3 },
            { key: "where", label: "位置", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={data.issues.map((it) => ({
            id: it.id,
            title: it.title,
            where: `${it.product} · 第 ${it.step} 步`,
            evidence: it.evidence,
            severity: it.severity,
          }))}
          caption="严重度按低、中、高排序,中表示需要在本版修复,低可以在后续版本处理"
        />
      </Section>

      {/* 下一步:建议与依据 */}
      <Section title="下一步" description="改进建议与对应的问题">
        <Grid cols={9}>
          <Block span={6} rows={1} title="建议">
            <List
              ordered
              divided={false}
              items={data.suggestions.map((s) => ({ title: s.title, description: s.detail }))}
            />
          </Block>
          <Block span={3} rows={1} title="依据">
            <KV
              labelCols={1}
              items={[
                { label: "问题编号", value: data.suggestions[0].basis.join("、") },
                { label: "位置", value: `${data.issues[0].product} · 第 ${data.issues[0].step} 步` },
              ]}
            />
          </Block>
        </Grid>
      </Section>

      {/* 背景信息:任务、范围与版本 */}
      <Section title="背景信息" description="这次走查的任务、范围与版本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            {
              label: "版本",
              value: data.chains.map((c) => `${c.product} ${c.version}`).join(" / "),
            },
            { label: "日期", value: data.date },
          ]}
        />
      </Section>
    </Page>
  )
}