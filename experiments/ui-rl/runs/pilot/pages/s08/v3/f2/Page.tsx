import data from "./data.json"
import {
  Page,
  Section,
  Group,
  Grid,
  Stat,
  Text,
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

const kpi = (key: string) => data.kpis.find((item) => item.key === key)!

export default function Report() {
  const fewest = kpi("fewest")
  const issues = kpi("issues")
  const products = kpi("products")
  const screens = kpi("screens")

  return (
    <Page title={data.title} meta={["快送 11.2 · 小橙 8.9", "2026 年 9 月"]}>
      <Section title="结论" description="下单链路的整体判断">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="对比产品、截图样本与问题计数">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            captionBelow
            value={fewest.value}
            unit={fewest.unit}
            label={fewest.label}
            note="快送为 5 步"
          />
          <Stat
            span={2}
            captionBelow
            value={issues.value}
            unit={issues.unit}
            label={issues.label}
            note="3 条均出在快送"
          />
          <Stat
            span={2}
            captionBelow
            value={products.value}
            unit={products.unit}
            label={products.label}
            note="快送 11.2 · 小橙 8.9"
          />
          <Stat
            span={2}
            captionBelow
            value={screens.value}
            unit={screens.unit}
            label={screens.label}
            note="快送 5 张 · 小橙 4 张"
          />
        </Grid>
      </Section>

      <Section title="链路" description="从购物车到支付成功,逐屏排列,可横向滑动">
        <Group>
          {data.chains.flatMap((chain) => [
            <Rule
              key={`rule-${chain.product}`}
              label={`${chain.product} · ${chain.version} · ${chain.steps.length} 步 · ${chain.verdict}`}
            />,
            <FigureStrip key={`strip-${chain.product}`}>
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

      <Section title="问题" description="3 个问题均出在快送,严重度由高到低">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 1 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "证据", span: 3 },
          ]}
          rows={data.issues.map((issue) => ({
            ...issue,
            step: `第 ${issue.step} 步`,
          }))}
          caption="步骤为快送链路中的屏序;严重度由低到高排列,越高表示用户要付出的比较或操作代价越大。"
        />
      </Section>

      <Section title="下一步" description="两条改动建议,依据对回具体条目">
        <List
          ordered
          items={data.suggestions.map((suggestion) => ({
            title: `${suggestion.id} · ${suggestion.title}`,
            description: `${suggestion.detail};依据:${suggestion.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景" description="任务、范围与采集口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "采集日期", value: data.date },
            { label: "输入项", value: "每步 0 项,全程没有键盘输入" },
          ]}
        />
      </Section>
    </Page>
  )
}