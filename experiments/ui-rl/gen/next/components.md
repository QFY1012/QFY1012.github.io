# 组件库

页面代码只从这里 import:

```tsx
import data from "./data.json"
import { Page, Section, Group, Grid, Block, Text, Stat, DataTable, TrendChart, BarChart, ProgressList, List, KV, Rule, FigureStrip, FigureGrid, FigureCompare, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"
```

不直接写 HTML 标签(`<div>` 除外,也尽量不用),不写 `style`,不写颜色类名和任意值类名(如 `text-[13px]`)。字号、颜色、间距都由组件给出;规范允许的类名只有 design.md 里写明的几个。

页面文件 `Page.tsx` 默认导出一个组件:`export default function Report() { return <Page …>…</Page> }`。

## 框架

| 组件 | props | 说明 |
|---|---|---|
| `Page` | `title`, `meta?: string[]`, `className?` | 页头:`meta` 在左侧 3 列(产品、周期),`title` 在右侧 9 列。节之间默认 192px |
| `Section` | `title`, `description?`, `layout?: "side" \| "stack"`, `className?` | `side`(默认):节标题和说明挂在左侧 3 列,子元素在右侧 9 列。`stack`:标题和说明在上,子元素占满 12 列。子元素之间默认 192px |
| `Group` | `title?`, `className?` | 一组内容,子元素之间 24px。`title` 是节内的子块标题:标题与内容之间 8px,字号比节标题小一级(14px 粗体对节标题 20px),所以「下一步」这类节里分成几块一眼看得出,子块标题不会和节标题同字号、分不出层级 |
| `Grid` | `cols?`, `fields?`(默认 true), `span?`, `start?`, `rowSpan?`, `className?` | 网格。不写 `cols` 时它有几列宽就分几列(`side` 节里 9,`stack` 节里 12,写了 `span` 就是 `span`),里面的东西落在页面栏线上。`fields` 为 true 时每行高 144px,子元素用 `rowSpan` 竖着跨几行;为 false 时行高随内容 |
| `Block` | `span?`, `start?`, `rowSpan?`, `title?`, `description?`, `contentClassName?` | 网格里的一块,标题 14px 粗体紧贴内容。`rowSpan` 是竖着跨几行(旧写法 `rows` 还能用,新页面写 `rowSpan`) |

## 内容

所有内容组件都接受 `span`(在 `Grid` 里占几列)、`start`(从第几列开始;不写就接着排)、`rowSpan`(竖着跨几行)和 `className`。位置只用这三个 props 表达:网格里怎么填都可以,包括留空格,但每一块的左右边都要落在栏线上(design.md A6),`shoot.mjs` 的「网格」检查会量出来。

| 组件 | props | 说明 |
|---|---|---|
| `Text` | children(字符串) | 一段文字,默认 14px |
| `Stat` | `value`, `label?`, `unit?`, `size?: "lg" \| "xl"`, `captionBelow?`, `quiet?`, `note?`, `delta?`, `direction?: "up" \| "down"` | 一个数字。默认 30px,`lg` 48px 细体。`captionBelow` 把 `label` 放在数字下面。`note` 是一行 12px 注释;`direction: "down"` 且没有 `delta` 时注释为红色 |
| `DataTable` | `columns`, `rows`, `caption?` | 表格。`columns` 每项:`key`, `label`, `align?: "right"`, `span?`(占几列网格,写了就按网格定列宽;一行的 `span` 加起来 9 正好铺满内容列), `bar?`(数字后接计数条:1px 墨线画在一条 1px 基线上,基线与量程等宽、与表格行线同宽同色,条长是该值与同列最大值的比。条用墨色、行线用浅灰,所以条的末端一眼可辨,不会被误读成一条说不出作用的行线), `tone?: string[]`(这些值标红**并加粗**(正文 400 → 600)——红色在灰度打印里比黑字还浅,色弱读者也看不出红,所以状态必须有一个颜色之外的通道,字重就是它), `levels?: string[]`(一列有序的等级,从低到高排。最高一级标红并加粗,次一级加粗,再往下用注释灰:三级都与正文有区别,读者能把严重度排出顺序,而不是只有「高」有颜色、中低两级和正文没有视觉区别), `muteWhen?: {key, equals}`(行灰显), `interval?: {low, high, domain: [min, max]}`(画区间图)。`caption` 是表格**下方**一行灰色小字注释(如口径、阈值说明),左对齐,与表格左边缘齐平;不是表名,表名用外面 `Group` 的 `title` |
| `TrendChart` | `data`, `xKey`, `series: {key, label}[]`, `height?`, `band?: {low, high}`, `zero?`, `yTicks?`, `xInterval?`, `pointLabels?: "last"`, `lastLabel?` | 折线图。`height` 用 `"h-48"` 之类,或 `"fill"` 填满所在块 |
| `BarChart` | `data`, `xKey`, `series`, `layout?: "horizontal"` | 柱状图;`horizontal` 是横向细条。多个系列用一条从黑到浅灰的墨阶:第一个系列最重,依次变浅,图例也按这个顺序排。图表是结论下面的证据,不是页面的主角,所以不另起一套彩色(彩色会把图变成全页最重的一块,还会和只表示判定的红色混在一起) |
| `ProgressList` | `items: {label, value, max?, display?}[]`, `compact?` | 进度条列表;`compact` 每行依次是名称、条、数值。条是 1px 墨线画在一条 1px 基线上:基线与量程(0 到 `max`)等宽、与页面其它细线同宽同色,条长是计数与满值之比,所以同一列表里的数值差异由长度给出,而不是靠颜色,也不会比页面其它细线粗。`max` 不给时取列表里的最大值,所以小计数(6、9、2)也铺满各自的比例,不会都缩成等长的发丝细线;数值用和页面其它数字一致的等宽数字 |
| `List` | `items: {title?, description?, meta?}[]`, `numbered?`, `ordered?`, `columns?`, `divided?`, `metaTone?: "destructive"` | 列表。`numbered` 带 01、02 序号和行间细线;`columns` 并排;`ordered` 带 1、2 序号 |
| `KV` | `items: {label, value}[]`, `labelCols?` | 键值表;`labelCols` 让标签占几列网格 |
| `Rule` | `label?` | 分组标记:一条 1px 细线(与表格行线同宽),上面可带一行 12px 标签。用在两组内容之间做分组,如链路明细里一个产品一组;两组内容之间的分组标记用 `Rule`,不要用粗条 |

## 截图

一组可组合的部件,用来放界面截图(链路里的一格一屏、模拟视图的一组四张)。放在 `FigureStrip` 里,一格就是一个 `Figure`;图、标签、说明的上下顺序由页面决定。

| 组件 | props | 说明 |
|---|---|---|
| `FigureStrip` | children | 一行截图,放在 shadcn `ScrollArea` 里横向滚动,滚动条是 shadcn 的样式(不是浏览器原生滚动条),只在鼠标悬停时出现,静止时不占地方也不画横条;超出宽度的部分裁掉,不把页面撑宽。行高由这条自己定:所有图同高、宽度各按原比例,所以手机 375×760 和分析图 1200×760 能并排对齐 |
| `FigureGrid` | children | 一版对照图,两列铺满内容列宽,每格一张 `Figure`;图按列宽显示、高度随原比例,用于要看清图内细节的对照,行高不限 |
| `FigureCompare` | children | 一组四张的对照图(原界面 + 三种色觉模拟),一行四张铺满内容列宽。四张并排是一屏能读完的最短排法:内容列宽正好放四张,一行比两行两列少占一半高度,四张始终在同一屏里,可以直接横向比。每张图占行的四分之一、按原比例缩放,高度只封一个上限(`max-h-96`),所以再长的截图也不会把这一组顶出屏幕;每格的图注占满整格宽,窄图的长图注不会折成多行把整组撑高。要看图内细节(宽的分析视图)用 `FigureGrid`,不在这里把图放大成两行 |
| `Figure` | children, `span?`, `start?`, `rowSpan?` | 一张截图的外框,纵向排图、标签和说明;宽度随所在布局,不收缩。直接放在 `Grid` 里并写 `span` 时,它占满这几列、图按列宽显示,可以把截图排成「一行一个阶段、一列一个产品」这样的对照 |
| `FigureImage` | `src`, `alt` | 截图本体。宽度随所在布局、高度随原比例,自己不定高(定高的是容器):在 `FigureStrip` 里由条给统一高度(比例不同的图才对得齐),在 `FigureGrid` 里铺满所在列宽(图内文字才看得清),在 `FigureCompare` 里占行宽的四分之一、高度封在上限内(四张同屏)。不裁剪 |
| `FigureLabel` | children(字符串) | 图下面或上面的视图名(屏名、步号),12px 灰色 |
| `FigureText` | children(字符串) | 图下面的说明(内容、操作、输入项),14px 正文 |

链路明细:一个产品一组,一组一行,按步骤顺序横向排开。图高一致,不同比例的截图(手机 375×760、分析图 1200×760)也能并排对齐;一行放不下就横向滚动,静止时图下不出现横条。产品之间用 `Rule` 分组。

```tsx
<Group>
  <Rule label={`${chainA.product} · ${chainA.version}`} />
  <FigureStrip>
    {chainA.steps.map((step) => (
      <Figure key={step.no}>
        <FigureImage src={step.image} alt={`${chainA.product} 第 ${step.no} 步:${step.screen}`} />
        <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
        <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
      </Figure>
    ))}
  </FigureStrip>
  <Rule label={`${chainB.product} · ${chainB.version}`} />
  <FigureStrip>…</FigureStrip>
</Group>
```

模拟视图:一组四张(原界面 + 三种色觉模拟),每张带视图名;要放说明文字就用 `Block` 的 `title`/`description` 包住这一组。`FigureLabel` 放在 `FigureImage` 前就是名称在上,放在后就是名称在下。

用 `FigureGrid` 时每张图按列宽显示,行高随图片比例,图片很高时一组会超出一屏;四张要在一屏内读完就用 `FigureCompare`:四张并排成一行,各占四分之一列宽,高度封在同一个上限内。这样整组只占一条,比两行两列矮一半,四张始终同屏、可以直接横向比;两行两列的排法每屏只放得下两张,第二行的两张要滚动才看得到,不成为一组对照。

```tsx
<Group title="色觉模拟">
  <FigureCompare>
    {views.map((view) => (
      <Figure key={view.name}>
        <FigureImage src={view.image} alt={view.name} />
        <FigureLabel>{view.name}</FigureLabel>
      </Figure>
    ))}
  </FigureCompare>
</Group>
```

要在图下再写一行说明,就在 `FigureCompare` 的每张 `Figure` 里 `FigureImage` 后加 `FigureText`(和 `FigureGrid` 一样)。

## 计数与严重度

一个计数用一条按量程画的条表示:基线与量程(0 到 `max`)等宽、和表格行线同一条浅灰细线,条是画在它上面的 1px 墨线,长度就是计数与满值之比。计数条只出现在两处——`DataTable` 的 `bar` 列和 `ProgressList`——两处同一条条、同一套数字,不另起一种形式。

严重度这类有序等级用列的 `levels`:从低到高排开,最高一级红加粗,次一级加粗,再往下是注释灰。三级都与正文有区别,读者能把顺序排出来;`tone` 只用于「是/不是」一个状态(如「不达标」),等级用 `levels`。

```tsx
<DataTable
  columns={[
    { key: "product", label: "产品", span: 4 },
    { key: "steps", label: "步骤数", align: "right", span: 3, bar: true },
    { key: "severity", label: "严重度", span: 2, levels: ["低", "中", "高"] },
  ]}
  rows={rows}
/>
<ProgressList items={[{ label: "红色盲", value: 6 }, { label: "绿色盲", value: 9 }, { label: "蓝色盲", value: 2 }]} compact />
```
