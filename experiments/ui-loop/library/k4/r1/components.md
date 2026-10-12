# 组件库

页面代码只从这里 import:

```tsx
import data from "./data.json"
import { Page, Section, Group, Grid, Block, Text, Stat, DataTable, TrendChart, BarChart, ProgressList, List, KV, Rule, FigureStrip, FigureGrid, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"
```

不直接写 HTML 标签(`<div>` 除外,也尽量不用),不写 `style`,不写颜色类名和任意值类名(如 `text-[13px]`)。字号、颜色、间距都由组件给出;规范允许的类名只有 design.md 里写明的几个。

页面文件 `Page.tsx` 默认导出一个组件:`export default function Report() { return <Page …>…</Page> }`。

## 框架

| 组件 | props | 说明 |
|---|---|---|
| `Page` | `title`, `meta?: string[]`, `className?` | 页头:`meta` 在左侧 3 列(产品、周期),`title` 在右侧 9 列。节之间默认 192px |
| `Section` | `title`, `description?`, `className?` | 节标题和说明挂在左侧 3 列,子元素在右侧 9 列,子元素之间默认 192px |
| `Group` | `title?`, `className?` | 一组内容,子元素之间 24px |
| `Grid` | `cols?`(默认 9), `fields?`(默认 true), `span?`, `className?` | 网格。`fields` 为 true 时每行高 144px,子元素用 `rows` 占整行;为 false 时行高随内容 |
| `Block` | `span?`, `rows?`, `title?`, `description?`, `contentClassName?` | 网格里的一块,标题 14px 粗体紧贴内容 |

## 内容

所有内容组件都接受 `span`(在 `Grid` 里占几列)和 `className`。

| 组件 | props | 说明 |
|---|---|---|
| `Text` | children(字符串) | 一段文字,默认 14px |
| `Stat` | `value`, `label?`, `unit?`, `size?: "lg" \| "xl"`, `captionBelow?`, `quiet?`, `note?`, `delta?`, `direction?: "up" \| "down"` | 一个数字。默认 30px,`lg` 48px 细体。`captionBelow` 把 `label` 放在数字下面。`note` 是一行 12px 注释;`direction: "down"` 且没有 `delta` 时注释为红色 |
| `DataTable` | `columns`, `rows`, `caption?` | 表格。`columns` 每项:`key`, `label`, `align?: "right"`, `span?`(占几列网格,写了就按网格定列宽;一行的 `span` 加起来 9 正好铺满内容列), `bar?`(数字后接细条), `tone?: string[]`(这些值标红**并加粗**(正文 400 → 600)——红色在灰度打印里比黑字还浅,色弱读者也看不出红,所以状态必须有一个颜色之外的通道,字重就是它), `muteWhen?: {key, equals}`(行灰显), `interval?: {low, high, domain: [min, max]}`(画区间图)。`caption` 是表格**下方**一行灰色小字注释(如口径、阈值说明),左对齐,与表格左边缘齐平;不是表名,表名用外面 `Group` 的 `title` |
| `TrendChart` | `data`, `xKey`, `series: {key, label}[]`, `height?`, `band?: {low, high}`, `zero?`, `yTicks?`, `xInterval?`, `pointLabels?: "last"`, `lastLabel?` | 折线图。`height` 用 `"h-48"` 之类,或 `"fill"` 填满所在块 |
| `BarChart` | `data`, `xKey`, `series`, `layout?: "horizontal"` | 柱状图;`horizontal` 是横向细条 |
| `ProgressList` | `items: {label, value, max?, display?}[]`, `compact?` | 进度条列表;`compact` 每行依次是名称、细条、数值。条是 1px 细线,与表格行线同重,颜色比轨道深一档,只承载计数,不抢正文 |
| `List` | `items: {title?, description?, meta?}[]`, `numbered?`, `ordered?`, `columns?`, `divided?`, `metaTone?: "destructive"` | 列表。`numbered` 带 01、02 序号和行间细线;`columns` 并排;`ordered` 带 1、2 序号 |
| `KV` | `items: {label, value}[]`, `labelCols?` | 键值表;`labelCols` 让标签占几列网格 |
| `Rule` | `label?` | 分组标记:一条 1px 细线(与表格行线同宽),上面可带一行 12px 标签。用在两组内容之间做分组,如链路明细里一个产品一组;两组内容之间的分组标记用 `Rule`,不要用粗条 |

## 截图

一组可组合的部件,用来放界面截图(链路里的一格一屏、模拟视图的一组四张)。放在 `FigureStrip` 里,一格就是一个 `Figure`;图、标签、说明的上下顺序由页面决定。

| 组件 | props | 说明 |
|---|---|---|
| `FigureStrip` | children | 一行截图,放在 shadcn `ScrollArea` 里横向滚动,滚动条是 shadcn 的样式(不是浏览器原生滚动条),只在鼠标悬停时出现,静止时不占地方也不画横条;超出宽度的部分裁掉,不把页面撑宽。行高由这条自己定:所有图同高、宽度各按原比例,所以手机 375×760 和分析图 1200×760 能并排对齐 |
| `FigureGrid` | children | 一版对照图,两列铺满内容列宽,每格一张 `Figure`;图按列宽显示、高度随原比例,用于一屏内要看清图内文字的对照(原界面 + 色觉模拟) |
| `Figure` | children | 一张截图的外框,纵向排图、标签和说明;宽度随所在布局,不收缩 |
| `FigureImage` | `src`, `alt` | 截图本体。宽度随所在布局、高度随原比例,**自己不定高**:在 `FigureStrip` 里由条给统一高度(比例不同的图才对得齐),在 `FigureGrid` 里铺满所在列宽(图内文字才看得清)。不裁剪 |
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

模拟视图:一组四张(原界面 + 三种色觉模拟),每张带视图名,两列铺满内容列宽;要放说明文字就用 `Block` 的 `title`/`description` 包住这一组。`FigureLabel` 放在 `FigureImage` 前就是名称在上,放在后就是名称在下。

```tsx
<Group title="色觉模拟">
  <FigureGrid>
    {views.map((view) => (
      <Figure key={view.name}>
        <FigureImage src={view.image} alt={view.name} />
        <FigureLabel>{view.name}</FigureLabel>
      </Figure>
    ))}
  </FigureGrid>
</Group>
```
