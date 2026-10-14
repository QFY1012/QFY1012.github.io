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

// Upstream Skill output: 交互流程挖掘 · 线上开户(3 款银行 App 的开户链路对比)
const d: any = data

// 每项关键数字下面的一行注释(口径、对照值)
const kpiNotes: Record<string, string> = {
  products: "青禾、远川、北辰",
  screens: "每家 7–10 张",
  fewest: "北辰银行最多,10 步",
  issues: "高 2 个,中 3 个",
}

export default function Report() {
  return (
    <Page title={d.title} meta={[d.task, d.scope, d.date]}>
      <Section title="结论" description="3 款 App、26 张截图对比后的一句话判断">
        <Text className="text-2xl leading-9 font-light">{d.summary}</Text>
      </Section>

      <Section title="核心指标" description="本次对比的范围与主要发现">
        <Grid cols={9} fields={false} className="items-baseline">
          {d.kpis.map((k: any) => (
            <Stat
              key={k.key}
              span={3}
              size={k.key === "fewest" ? "lg" : undefined}
              captionBelow
              value={k.value}
              unit={k.unit}
              label={k.label}
              note={kpiNotes[k.key]}
            />
          ))}
        </Grid>
      </Section>

      <Section title="产品对比" description="三家 App 的步骤数与输入项数">
        <Grid cols={9} fields={false} className="items-baseline">
          {d.products.map((p: any) => (
            <Stat
              key={p.name}
              span={3}
              captionBelow
              value={p.steps}
              unit="步"
              label={p.name}
              note={`输入 ${p.inputs} 项 · ${p.verdict}`}
            />
          ))}
        </Grid>
      </Section>

      <Section title="环节对比" description="五个环节在三家 App 里的做法">
        <DataTable
          columns={[
            { key: "stage", label: "环节", span: 3 },
            { key: "青禾银行", label: "青禾银行", span: 2 },
            { key: "远川银行", label: "远川银行", span: 2 },
            { key: "北辰银行", label: "北辰银行", span: 2 },
          ]}
          rows={d.stages}
          caption="同一环节三家的做法;「无」表示开始前没有说明"
        />
      </Section>

      <Section title="共性模式" description="三家 App 里反复出现的做法">
        <List
          numbered
          items={d.patterns.map((p: any) => ({
            title: p.name,
            description: `${p.comment} · 见于 ${p.products.join("、")}`,
          }))}
        />
      </Section>

      <Section title="链路明细" description="从开户首页到开户成功,共 26 张截图" className="gap-12">
        {d.chains.map((c: any) => (
          <Group key={c.product}>
            <Rule label={`${c.product} · ${c.version} · ${c.verdict}`} />
            <FigureStrip>
              {c.steps.map((s: any) => (
                <Figure key={s.no}>
                  <FigureImage src={s.image} alt={`${c.product} 第 ${s.no} 步:${s.screen}`} />
                  <FigureLabel>
                    第 {s.no} 步 · {s.screen}
                  </FigureLabel>
                  <FigureText>{`${s.content} · ${s.action} · 输入 ${s.inputs} 项`}</FigureText>
                  {s.note ? <FigureText>{s.note}</FigureText> : null}
                </Figure>
              ))}
            </FigureStrip>
          </Group>
        ))}
      </Section>

      <Section title="问题明细" description="5 个问题,其中 2 个为高">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", align: "right", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "evidence", label: "证据", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
          ]}
          rows={d.issues}
          caption="严重度:高 = 会导致重做或退回,中 = 明显增加操作成本"
        />
      </Section>

      <Section title="下一步" description="4 条改动建议与各自的依据">
        <Grid cols={9}>
          <Block span={6} rows={2} title="建议">
            <List
              ordered
              divided={false}
              items={d.suggestions.map((s: any) => ({ title: `${s.id} ${s.title}`, description: s.detail }))}
            />
          </Block>
          <Block span={3} rows={2} title="依据">
            <KV labelCols={1} items={d.suggestions.map((s: any) => ({ label: s.id, value: s.basis.join("、") }))} />
          </Block>
        </Grid>
      </Section>

      <Section title="背景信息" description="任务、范围与数据口径">
        <KV
          labelCols={2}
          items={[
            { label: "分析任务", value: d.task },
            { label: "覆盖范围", value: d.scope },
            { label: "对比产品", value: d.chains.map((c: any) => `${c.product} ${c.version}`).join("、") },
            { label: "分析截图", value: "26 张" },
            { label: "完成日期", value: d.date },
          ]}
        />
      </Section>
    </Page>
  )
}
