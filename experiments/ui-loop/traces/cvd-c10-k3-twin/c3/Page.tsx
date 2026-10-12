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

const kpiOrder = ["issues", "pairs", "fail", "confuse"]
const kpis = kpiOrder
  .map((key) => data.kpis.find((kpi) => kpi.key === key))
  .filter((kpi): kpi is (typeof data.kpis)[number] => Boolean(kpi))

const screenRows = [data.screens.slice(0, 2), data.screens.slice(2, 4)]

export default function Report() {
  return (
    <Page
      title={data.title}
      meta={[data.target, `${data.date} · ${data.standard}`]}
    >
      <Section
        title="结论"
        description="对实时路况图层的色觉可辨识性判断"
      >
        <Group>
          <Text className="text-2xl leading-9 font-light">
            {`色觉友好度:${data.verdict}`}
          </Text>
          <Text className="text-2xl leading-9 font-light">{data.summary}</Text>
        </Group>
      </Section>

      <Section
        title="核心指标"
        description={`共 ${data.issues.length} 个问题,其中对比度不达标 2 组、色盲用户难以区分 2 对`}
      >
        <Grid cols={9} fields={false} className="items-baseline">
          {kpis.map((kpi) => (
            <Stat
              key={kpi.key}
              span={2}
              size="lg"
              captionBelow
              value={kpi.value}
              unit={kpi.unit}
              label={kpi.label}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="色觉模拟"
        description="原界面与三种色盲模拟视图,按 Machado 2009 模型生成"
      >
        <Group>
          {screenRows.map((row, index) => (
            <FigureStrip key={index}>
              {row.map((screen) => (
                <Figure key={screen.view}>
                  <FigureImage
                    src={screen.image}
                    alt={`路况图层 ${screen.view}视图`}
                  />
                  <FigureLabel>{screen.view}</FigureLabel>
                </Figure>
              ))}
            </FigureStrip>
          ))}
        </Group>
      </Section>

      <Section
        title="颜色混淆"
        description="色差为 CIEDE2000 ΔE,小于 12 视为难以区分"
        className="gap-12"
      >
        <Group title="路况配色">
          <DataTable
            columns={[
              { key: "name", label: "颜色", span: 2 },
              { key: "hex", label: "色值", span: 3 },
              { key: "usage", label: "用途", span: 4 },
            ]}
            rows={data.palette}
          />
        </Group>
        <Group title="颜色对与色差">
          <DataTable
            columns={[
              { key: "where", label: "颜色对", span: 3 },
              { key: "normal", label: "正常", align: "right", span: 1 },
              { key: "红色盲", label: "红色盲", align: "right", span: 1 },
              { key: "绿色盲", label: "绿色盲", align: "right", span: 1 },
              { key: "蓝色盲", label: "蓝色盲", align: "right", span: 1 },
              { key: "affected", label: "受影响", span: 2 },
            ]}
            rows={data.confusions.map((item) => ({
              ...item,
              affected:
                item.affected.length > 0 ? item.affected.join("、") : "—",
            }))}
            caption="阈值为 ΔE 12,低于阈值的色盲类型记入受影响一列。"
          />
        </Group>
        <Grid cols={9} fields={false}>
          <Block span={3} title="按色盲类型的问题数">
            <ProgressList
              compact
              items={data.byType.map((item) => ({
                label: item.type,
                value: item.issues,
                max: data.issues.length,
              }))}
            />
          </Block>
        </Grid>
      </Section>

      <Section
        title="对比度"
        description="路名标注与路段底色的对比度,要求不低于 4.5:1"
      >
        <Group>
          <DataTable
            columns={[
              { key: "where", label: "位置", span: 3 },
              { key: "fg", label: "文字色", span: 1 },
              { key: "bg", label: "底色", span: 1 },
              { key: "ratio", label: "对比度", align: "right", span: 2 },
              { key: "required", label: "要求", align: "right", span: 1 },
              { key: "result", label: "结果", align: "right", span: 1, tone: ["不达标"] },
            ]}
            rows={data.contrast.map((item) => ({
              ...item,
              result: item.pass ? "达标" : "不达标",
            }))}
            muteWhen={{ key: "pass", equals: true }}
            caption="对比度按 WCAG 2.2 AA 正文口径计算,低于 4.5:1 记为不达标。"
          />
        </Group>
      </Section>

      <Section
        title="问题明细"
        description="共 4 个问题,高严重度 2 个、中严重度 2 个"
      >
        <Group>
          <DataTable
            columns={[
              { key: "id", label: "编号", span: 1 },
              { key: "title", label: "问题", span: 3 },
              { key: "type", label: "类型", span: 1 },
              { key: "location", label: "位置", span: 1 },
              { key: "affects", label: "影响", span: 2 },
              { key: "severity", label: "严重度", span: 1, tone: ["高"] },
            ]}
            caption="改法见「下一步」一节。"
            rows={data.issues.map((item) => ({
              ...item,
              affects:
                item.affects.length > 0 ? item.affects.join("、") : "—",
            }))}
          />
        </Group>
      </Section>

      <Section title="下一步" description="按问题逐条给出改法">
        <List
          numbered
          columns={3}
          items={data.issues.map((item) => ({
            title: item.suggestion,
            description: `${item.id} ${item.title}`,
          }))}
        />
      </Section>

      <Section title="背景信息" description="产品、检测口径与方法">
        <KV
          labelCols={2}
          items={[
            { label: "产品", value: data.target },
            { label: "检测标准", value: data.standard },
            { label: "检测日期", value: data.date },
            { label: "检测方法", value: data.method },
            { label: "结论", value: data.verdict },
          ]}
        />
      </Section>
    </Page>
  )
}
