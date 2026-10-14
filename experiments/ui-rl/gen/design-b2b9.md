# 报告页面设计规范 v0

写给生成 Agent:读上游 Skill 输出的 `data.json`,按本规范用组件库写出页面代码 `Page.tsx`。组件和 props 见 `components.md`。

目标风格:A/B 实验报告(evalset `ab-f`)和体验走查报告(`review.clean`)。节标题挂在左侧 3 列,内容在右侧 9 列;不用卡片,靠留白和细线分组。

每条规则有编号,修改记录按编号引用。A 部分固定;组件库由组件分支更新(人工审批);loop 只改 B、C 两部分。

## A 基础

- **A1 画布**:页面用 `Page` 和 `Section` 搭框架。内容宽 1152px,12 列,每列 74px,栏间距 24px。纵向以 24px 为一行,行高和间距取 24 的倍数(小间距取 8 的倍数)。
- **A2 字体**:中文 Noto Sans SC,数字和英文 Barlow,数字一律等宽。由 tokens 提供,代码里不写字体。
- **A3 字号**:只用以下几级,代码里不写其他字号。
  - 页面标题 48px(渲染器固定)
  - 结论句 24px 细体:`<Text className="text-2xl leading-9 font-light">`
  - 节标题 20px(渲染器固定)
  - 大数字 48px 细体:`Stat` 的 `size="lg"`;普通数字 30px:不写 `size`
  - 正文、表格、列表 14px(渲染器默认)
  - 注释 12px 灰色:`Stat` 的 `note`,`List` 的序号
- **A4 颜色**:文字只有黑、灰两级。红色只表示下降、不达标或严重(`Stat` 的 `direction="down"`、`DataTable` 列的 `tone`、`List` 的 `metaTone="destructive"`)。图表一个系列只用一种颜色。
- **A5 装饰**:不用卡片、提示框、标签,不加底色和阴影。组和组之间靠留白分开;细线只用在表格行间和编号列表行间。

## B 内容对组件

- **B1 结论**:一句话的判断(summary、verdict)用 `Text`,结论句字号(A3),放在第一节,占满 9 列。
- **B2 关键数字**:`Stat`,`captionBelow`(数字在上、说明在下),不加框。所有关键数字排在同一行,不让任何一项单独掉到下一行:`<Grid cols={9} fields={false} className="items-baseline">`,3 个时每个 `span={3}`;4 个时第一个 `span={3}`、其余 `span={2}`,数字底部对齐。结论性的数字(如步骤最少)排第一个,是主指标,`size="lg"`,其余用普通大小;产品数、截图数这类样本量排在后面。环比、上次值等写在 `note` 里,下降时 `direction="down"`。
- **B3 带对照的指标**:`DataTable`。每列写 `span`(占几列网格),各列 `span` 之和为 9;数字列 `align: "right"`。不显著的行用 `muteWhen` 灰显;有置信区间时加一列 `interval`,区间的数值另起一列。
- **B4 时间趋势**:`TrendChart`。单独一行时 `height="h-48"`;和别的块并排时 `height="fill"`。只标最后一个点(`pointLabels="last"`)。有置信区间画 `band`,有正负之分画 `zero`。
- **B5 分群结果**:每个分群一个 `Stat`(普通大小),说明里写分群名和对照值。一行最多 4 个,每个 `span={2}`。
- **B6 分维度得分、类别比较**:`ProgressList`,`compact`(每行依次是名称、细条、数值),放在 3 列宽的块里。
- **B7 明细**:`DataTable`,规则同 B3 的列宽。状态值(如"严重")用该列的 `tone` 标红,其余不加颜色。
- **B8 计数、占比列**:表格中这一列加 `bar: true`,数字后面接一根细条。
- **B9 下一步、建议**:
  - 每条一句话、不超过 3 条:`List`,`numbered`,`columns` 等于条数(2 条 `columns={2}`,3 条 `columns={3}`),一行排满,不留空格。
  - 4 条及以上,或每条要带依据:单列 `List`,`numbered`,依据写在每条的 `description` 里,不另起一列。
  - 需要配复查安排等补充信息时:左边 `List`(`ordered`,`divided={false}`)占 6 列,右边 `KV`(`labelCols={1}`)占 3 列。
- **B10 发现**:`List`,`numbered`,每条有标题和一句说明。
- **B11 风险**:`List`,`columns={3}`,每条的 `meta` 写风险等级,`metaTone="destructive"`。
- **B12 背景信息**(负责团队、样本量、分流方式等):`KV`,`labelCols={2}`,放在最后一节。

## C 页面组装

- **C1 页头**:`Page` 的 `meta` 写产品和周期(左侧 3 列显示),`title` 写报告标题(右侧 9 列显示)。
- **C2 节**:每节一个 `Section`,`title` 是两到四个字的节名,`description` 写一句说明(单位、口径或这一节的结论),都显示在左侧 3 列;内容在右侧 9 列。
- **C3 节的顺序**:结论 → 核心指标 → 随时间变化 → 拆分(分群、分维度、分类别)→ 明细 → 下一步 → 背景信息。数据里没有的节跳过。
- **C4 并排**:同一行放两块时,窄块 3 列、宽块 6 列,用 `<Grid cols={9}>`,两块用 `Block` 并写相同的 `rows`,块标题写在 `Block` 的 `title`。
- **C5 间距**:节之间 192px(渲染器默认)。一节里放多组内容时,组和组之间 48px(`<Section className="gap-12">`);同一组里 24px(默认)。
- **C6 多个 Skill 拼成一页**:页头只出现一次,标题概括整份报告;每个 Skill 的结果按 C3 排成若干节,依次排列。
