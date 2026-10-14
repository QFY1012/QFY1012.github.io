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

const d: any = data

const kpiNotes: Record<string, string> = {
  products: "青禾、远川、北辰",
  screens: "每家 7–10 张",
  fewest: "北辰银行最多,10 步",
  issues: "高 2 个,中 3 个",
}

export default function Report() {
  const totalShots = d.chains.reduce((n: number, c: any) => n + c.steps.length, 0)
  const mainKpi = d.kpis.find((k: any) => k.key === "fewest")
  const orderedKpis = [mainKpi, ...d.kpis.filter((k: any) => k.key !== "fewest")]

  return (
    <Page title={d.title} meta={["手机银行线上开立二类账户", "2026 年 9 月 · 3 款银行 App"]}>
      <Section title="结论" description="3 款 App、26 张截图对比后的一句话判断">
        <Text className="text-2xl leading-9 font-light">{d.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的范围和主要发现">
        <Grid cols={9} fields={false} className="items-baseline">
          {orderedKpis.map((k: any) => (
              <Stat
                key={k.key}
                span={k.key === "fewest" ? 3 : 2}
                captionBelow
                size={k.key === "fewest" ? "lg" : undefined}
                value={k.value}
                unit={k.unit}
                label={k.label}
                note={kpiNotes[k.key]}
              />
            ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="三家 App 的步骤数与输入项数">
        <DataTable
          columns={[
            { key: "name", label: "产品", span: 2 },
            { key: "steps", label: "步骤数", align: "right", span: 2, bar: true },
            { key: "inputs", label: "输入项", align: "right", span: 2, bar: true },
            { key: "verdict", label: "判断", span: 3 },
          ]}
          rows={d.products.map((p: any) => ({
            name: p.name,
            steps: p.steps,
            inputs: p.inputs,
            verdict: p.verdict,
          }))}
          caption="步骤数为从开户首页到开户成功的屏数;输入项为需要用户填写的字段数,自动带出的不计。"
        />
      </Section>

      <Section title="环节对比" description="五个环节在三家 App 里的做法">
        <DataTable
          columns={[
            { key: "stage", label: "环节", span: 3 },
            { key: "qh", label: "青禾银行", span: 2 },
            { key: "yc", label: "远川银行", span: 2 },
            { key: "bc", label: "北辰银行", span: 2 },
          ]}
          rows={d.stages.map((s: any) => ({
            stage: s.stage,
            qh: s["青禾银行"],
            yc: s["远川银行"],
            bc: s["北辰银行"],
          }))}
        />
      </Section>

      <Section title="共性模式" description="3 个可复用的流程模式">
        <List
          numbered
          items={d.patterns.map((p: any) => ({
            title: p.name,
            description: p.comment,
            meta: `见于 ${p.products.join("、")}`,
          }))}
        />
      </Section>

      <Section title="链路明细" description="从开户首页到开户成功,共 26 张截图" className="gap-12">
        {d.chains.map((c: any) => (
          <Group key={c.product}>
            <Rule label={`${c.product} · ${c.version} · ${c.steps.length} 步`} />
            <FigureStrip>
              {c.steps.map((s: any) => (
                <Figure key={s.no}>
                  <FigureImage src={s.image} alt={`${c.product} 第 ${s.no} 步:${s.screen}`} />
                  <FigureLabel>
                    第 {s.no} 步 · {s.screen}
                  </FigureLabel>
                  <FigureText>
                    {s.content} · {s.action} · 输入 {s.inputs} 项
                  </FigureText>
                  {s.note ? <FigureText>{s.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="5 个问题,按严重度排列">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={d.issues.map((i: any) => ({
            id: i.id,
            product: i.product,
            step: i.step,
            title: i.title,
            evidence: i.evidence,
            severity: i.severity,
          }))}
          caption="严重度按失败成本与发生概率判定;高 2 个、中 3 个。"
        />
      </Section>

      <Section title="下一步" description="4 条改进建议及其依据">
        <Grid cols={9}>
          <Block span={6} rows={3} title="建议">
            <List
              ordered
              divided={false}
              items={d.suggestions.map((s: any) => ({
                title: `${s.id} ${s.title}`,
                description: s.detail,
              }))}
            />
          </Block>
          <Block span={3} rows={3} title="依据">
            <KV
              labelCols={1}
              items={d.suggestions.map((s: any) => ({
                label: s.id,
                value: s.basis.join(" · "),
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section title="背景信息" description="任务、范围与数据口径">
        <KV
          labelCols={2}
          items={[
            { label: "任务", value: d.task },
            { label: "范围", value: d.scope },
            {
              label: "对比产品",
              value: d.chains.map((c: any) => `${c.product} ${c.version}`).join("、"),
            },
            { label: "分析截图", value: `${totalShots} 张` },
            { label: "完成日期", value: d.date },
          ]}
        />
      </Section>
    </Page>
  )
}
