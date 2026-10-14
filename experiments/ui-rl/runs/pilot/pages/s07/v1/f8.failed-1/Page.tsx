import data from "./data.json";
import {
  DataTable,
  Figure,
  FigureImage,
  FigureLabel,
  FigureText,
  Grid,
  Group,
  KV,
  List,
  Page,
  Section,
  Stat,
  Text,
} from "@/components/report";

const { title, task, scope, date, summary, kpis, products, chains, stages, issues, suggestions } = data;

const versionOf = (name: string) => chains.find((c) => c.product === name)?.version ?? "";

export default function Page() {
  const screens = kpis.find((k) => k.key === "screens")?.value ?? 0;

  return (
    <Page title={title} meta={["安沁 / 望山 / 澄心医院 App", "2026 年 3 月版本"]}>
      <Section title="结论" description={`任务:${task}`}>
        <Text size="24px light">{summary}</Text>
      </Section>

      <Section title="核心指标" description="统计口径:一次完整门诊挂号,从进入 App 首页到预约成功">
        <Grid cols={9} fields={false}>
          {kpis.map((k, i) => (
            <Stat key={k.key} span={i === 2 ? 3 : 2} value={k.value} unit={k.unit} label={k.label} />
          ))}
        </Grid>
      </Section>

      <Section title="流程对比" description="步骤数从进入首页算到预约成功;手填项数为就诊人环节的必填项">
        <Group title="链路长度与填写负担">
          <DataTable
            columns={[
              { key: "name", label: "产品", span: 2 },
              { key: "version", label: "版本", span: 1 },
              { key: "steps", label: "步骤数", span: 1, align: "right" },
              { key: "inputs", label: "手填项数", span: 2, align: "right" },
              { key: "verdict", label: "结论", span: 3 },
            ]}
            items={products.map((p) => ({
              name: p.name,
              version: versionOf(p.name),
              steps: `${p.steps} 步`,
              inputs: `${p.inputs} 项`,
              verdict: p.verdict,
            }))}
          />
        </Group>

        <Group title="六个流程段的做法对照">
          <DataTable
            columns={[
              { key: "stage", label: "流程段", span: 3 },
              { key: "anqin", label: "安沁医院", span: 2 },
              { key: "wangshan", label: "望山医院", span: 2 },
              { key: "chengxin", label: "澄心医院", span: 2 },
            ]}
            items={stages.map((s) => ({
              stage: s.stage,
              anqin: s["安沁医院"],
              wangshan: s["望山医院"],
              chengxin: s["澄心医院"],
            }))}
          />
        </Group>
      </Section>

      <Section title="链路明细" description="三条链路按步序并排展示,图下为界面内容、本次操作与手填项">
        {chains.map((c) => (
          <Group
            key={c.product}
            title={`${c.product} · v${c.version} · ${c.steps.length} 步 · ${c.verdict}`}
          >
            <Grid cols={c.steps.length} fields={false}>
              {c.steps.map((s) => (
                <Figure key={s.no}>
                  <FigureImage src={s.image} aspect={0.49} />
                  <FigureLabel>
                    第 {s.no} 步 · {s.screen}
                  </FigureLabel>
                  <FigureText>
                    {[s.content, s.action, s.inputs > 0 ? `手填 ${s.inputs} 项` : "", s.note]
                      .filter(Boolean)
                      .join(" · ")}
                  </FigureText>
                </Figure>
              ))}
            </Grid>
          </Group>
        ))}
      </Section>

      <Section title="问题清单" description="4 个问题按产品与步骤定位,严重度分高、中、低三档">
        <DataTable
          columns={[
            { key: "id", label: "编号", span: 1 },
            { key: "product", label: "产品", span: 2 },
            { key: "step", label: "步骤", span: 1 },
            { key: "title", label: "问题", span: 2 },
            { key: "severity", label: "严重度", span: 1, levels: ["低", "中", "高"] },
            { key: "evidence", label: "依据", span: 2 },
          ]}
          items={issues.map((i) => ({
            id: i.id,
            product: i.product,
            step: `第 ${i.step} 步`,
            title: i.title,
            severity: i.severity,
            evidence: i.evidence,
          }))}
        />
      </Section>

      <Section title="下一步" description="3 条改动建议,依据指向上面编号的问题">
        <List
          ordered
          items={suggestions.map((s) => ({
            title: s.title,
            description: `${s.detail}(依据:${s.basis.join("、")})`,
          }))}
        />
      </Section>

      <Section title="背景信息">
        <KV
          labelCols={2}
          items={[
            { k: "任务", v: task },
            { k: "范围", v: scope },
            { k: "日期", v: date },
            { k: "产品版本", v: chains.map((c) => `${c.product} ${c.version}`).join(" / ") },
            { k: "样本量", v: `${products.length} 款 App、${screens} 张流程截图` },
          ]}
        />
      </Section>
    </Page>
  );
}