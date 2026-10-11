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
  return (
    <Page title={data.title} meta={["快送 / 小橙", "2026 年 9 月"]}>
      <Section title="结论" description="下单链路的核心差异">
        <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
      </Section>

      <Section title="核心指标" description="样本规模与关键结果">
        <Grid cols={9} fields={false} className="items-baseline">
          <Stat
            span={3}
            size="lg"
            value={2}
            unit="个"
            label="对比产品"
            captionBelow
          />
          <Stat
            span={3}
            size="lg"
            value={9}
            unit="张"
            label="分析截图"
            captionBelow
          />
          <Stat
            span={3}
            size="lg"
            value={3}
            unit="个"
            label="发现问题"
            captionBelow
          />
          <Stat
            span={3}
            size="lg"
            value={4}
            unit="步"
            label="步骤最少(小橙)"
            captionBelow
          />
        </Grid>
      </Section>

      <Section title="产品对比" description="步骤数与优惠券处理">
        <DataTable
          columns={[
            { key: "product", label: "产品", span: 2 },
            { key: "version", label: "版本", span: 1 },
            { key: "steps", label: "步骤数", span: 2, align: "right" },
            { key: "coupon", label: "优惠券处理", span: 4 },
          ]}
          rows={[
            {
              product: "快送",
              version: "11.2",
              steps: 5,
              coupon: "选券单独一屏,默认不选最优",
            },
            {
              product: "小橙",
              version: "8.9",
              steps: 4,
              coupon: "最优券直接带入",
            },
          ]}
          caption="小橙 4 步为最少,快送多出的一屏是选择优惠券。"
        />
      </Section>

      <Section title="链路明细" description="从购物车到支付成功的每一步">
        {data.chains.map((chain) => (
          <Group key={chain.product} title={`${chain.product} · ${chain.version}`}>
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
                    {[step.content, step.action, step.note]
                      .filter(Boolean)
                      .join(" · ")}
                  </FigureText>
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题" description="共 3 个问题,按严重程度排序">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "where", label: "位置", span: 2 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 3 },
            {
              key: "severity",
              label: "严重程度",
              span: 1,
              align: "right",
              tone: ["高"],
            },
          ]}
          rows={data.issues.map((issue) => ({
            id: issue.id,
            where: `${issue.product} · 第 ${issue.step} 步`,
            title: issue.title,
            evidence: issue.evidence,
            severity: issue.severity,
          }))}
          caption="严重程度:高 = 直接影响用户能否选到最优券。"
        />
      </Section>

      <Section title="下一步" description="两条改进建议及依据">
        <List
          columns={2}
          numbered
          items={data.suggestions.map((s) => ({
            title: `${s.id} ${s.title}`,
            description: s.detail,
            meta: `依据:${s.basis.join("、")}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="口径与样本">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: data.task },
            { label: "范围", value: data.scope },
            { label: "产品版本", value: "快送 11.2 / 小橙 8.9" },
            { label: "报告日期", value: data.date },
            { label: "截图", value: "两款 App 共 9 张,均为 2026 年 9 月版本" },
          ]}
        />
      </Section>
    </Page>
  )
}
