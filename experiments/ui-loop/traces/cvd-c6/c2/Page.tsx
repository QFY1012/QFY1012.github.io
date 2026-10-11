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
  ProgressList,
  List,
  KV,
  FigureStrip,
  Figure,
  FigureImage,
  FigureLabel,
} from "@/components/report"

export default function Report() {
  const kpis = Object.fromEntries(data.kpis.map((k) => [k.key, k]))

  const contrastRows = data.contrast.map((c) => ({
    where: c.where,
    fg: c.fg,
    bg: c.bg,
    ratio: c.ratio,
    required: c.required,
    result: c.pass ? "达标" : "不达标",
  }))

  const confusionRows = data.confusions.map((c) => ({
    where: c.where,
    原界面: c.normal,
    红色盲: c["红色盲"],
    绿色盲: c["绿色盲"],
    蓝色盲: c["蓝色盲"],
    影响: c.affected.join("、"),
  }))

  const issueRows = data.issues.map((i) => ({
    id: i.id,
    title: i.title,
    type: i.type,
    severity: i.severity,
    affects: i.affects.join("、"),
  }))

  const fixRows = data.fixes.map((f) => ({
    where: f.where,
    from: f.from,
    to: f.to,
    ratio: `${f.before} → ${f.after}`,
  }))

  return (
    <Page
      title={data.title}
      meta={[data.target, data.date, `对照 ${data.standard}`]}
    >
      <Section
        title="结论"
        description="按 WCAG 2.2 AA 判定;色差小于 ΔE 12 视为难以区分"
      >
        <Group>
          <Text className="text-2xl leading-9 font-light">
            整体{data.verdict}:6 组文字与背景组合中 1 组对比度不达标,配送进度条的红绿区分在绿色盲下难以分辨。
          </Text>
          <Text>{data.summary}</Text>
        </Group>
      </Section>

      <Section
        title="核心指标"
        description="本次检查 6 组文字与背景组合,共发现 3 个问题"
      >
        <Group>
          <Grid cols={9} fields={false} className="items-baseline">
            <Stat
              span={2}
              size="lg"
              captionBelow
              value={kpis.issues.value}
              unit={kpis.issues.unit}
              label={kpis.issues.label}
            />
            <Stat
              span={2}
              size="lg"
              captionBelow
              value={kpis.pairs.value}
              unit={kpis.pairs.unit}
              label={kpis.pairs.label}
            />
            <Stat
              span={2}
              size="lg"
              captionBelow
              value={kpis.fail.value}
              unit={kpis.fail.unit}
              label={kpis.fail.label}
              note="低于 4.5:1"
              direction="down"
            />
            <Stat
              span={2}
              size="lg"
              captionBelow
              value={kpis.confuse.value}
              unit={kpis.confuse.unit}
              label={kpis.confuse.label}
              note="绿色盲下 ΔE 9.0"
              direction="down"
            />
          </Grid>
        </Group>
      </Section>

      <Section
        title="色觉模拟"
        description="原界面与红色盲、绿色盲、蓝色盲模拟对照,模拟按 Machado 2009 模型"
      >
        <Block
          title="原界面与三种色觉模拟"
          description="同一屏订单状态页在正常视觉与三种色盲下的呈现"
        >
          <FigureStrip>
            {data.screens.map((screen) => (
              <Figure key={screen.view}>
                <FigureImage src={screen.image} alt={screen.view} />
                <FigureLabel>{screen.view}</FigureLabel>
              </Figure>
            ))}
          </FigureStrip>
        </Block>
      </Section>

      <Section
        title="问题分布"
        description="按色盲类型统计问题数;色差为 CIEDE2000 ΔE,小于 12 视为难以区分"
        className="gap-12"
      >
        <Group>
          <Grid cols={9} fields={false}>
            <Block span={3} title="各类型问题数">
              <ProgressList
                compact
                items={data.byType.map((t) => ({
                  label: t.type,
                  value: t.issues,
                  max: 2,
                  display: `${t.issues} 个`,
                }))}
              />
            </Block>
          </Grid>
        </Group>
        <Group title="色差对照">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 4 },
              { key: "原界面", label: "原界面", span: 1, align: "right" },
              { key: "红色盲", label: "红色盲", span: 1, align: "right" },
              { key: "绿色盲", label: "绿色盲", span: 1, align: "right" },
              { key: "蓝色盲", label: "蓝色盲", span: 1, align: "right" },
              { key: "影响", label: "影响", span: 1 },
            ]}
            rows={confusionRows}
            caption="ΔE 为 CIEDE2000 色差,小于 12 视为难以区分;准时绿与超时红在绿色盲下仅 9.0。"
          />
        </Group>
      </Section>

      <Section
        title="明细"
        description="6 组文字与背景的对比度检查,以及 3 个问题的位置、类型与影响"
        className="gap-12"
      >
        <Group title="对比度检查">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 2 },
              { key: "fg", label: "前景色", span: 2 },
              { key: "bg", label: "背景色", span: 2 },
              { key: "ratio", label: "对比度", span: 1, align: "right" },
              { key: "required", label: "要求", span: 1, align: "right" },
              { key: "result", label: "结果", span: 1, tone: ["不达标"] },
            ]}
            rows={contrastRows}
            caption="阈值按 WCAG 2.2 AA:正文 4.5:1,大号文字 3:1。"
          />
        </Group>
        <Group title="问题清单">
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "title", label: "问题", span: 3 },
              { key: "type", label: "类型", span: 2 },
              { key: "severity", label: "严重度", span: 1 },
              { key: "affects", label: "影响", span: 2 },
            ]}
            rows={issueRows}
            caption="影响为空表示该问题与色觉类型无关;严重度分中、低两级。"
          />
        </Group>
        <Group title="界面用色">
          <DataTable
            columns={[
              { key: "name", label: "名称", span: 2 },
              { key: "hex", label: "色值", span: 2 },
              { key: "usage", label: "用途", span: 5 },
            ]}
            rows={data.palette}
            caption="色值为界面原始取色,共 5 个。"
          />
        </Group>
      </Section>

      <Section
        title="下一步"
        description="按问题给出的修改建议;顶部标题改为深色后对比度从 1.61 提升到 10.25"
        className="gap-12"
      >
        <Group>
          <List
            columns={3}
            numbered
            items={data.issues.map((issue) => ({
              title: `${issue.id} · ${issue.location}`,
              description: issue.suggestion,
            }))}
          />
        </Group>
        <Group title="建议改动">
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 3 },
              { key: "from", label: "当前色", span: 2 },
              { key: "to", label: "建议色", span: 2 },
              { key: "ratio", label: "对比度", span: 2, align: "right" },
            ]}
            rows={fixRows}
            caption="背景色 #FFC300,改动后对比度由 1.61 提升到 10.25。"
          />
        </Group>
      </Section>

      <Section title="背景信息" description="检查对象、日期、对照标准与模拟方法">
        <KV
          labelCols={2}
          items={[
            { label: "检查对象", value: data.target },
            { label: "检查日期", value: data.date },
            { label: "对照标准", value: data.standard },
            { label: "模拟方法", value: data.method },
          ]}
        />
      </Section>
    </Page>
  )
}
