# 组件库

页面代码只从这里 import:

```tsx
import data from "./data.json"
import { Page, Section, Group, Grid, Block, Text, Stat, DataTable, TrendChart, BarChart, ProgressList, List, KV, FigureStrip, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"
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
| `DataTable` | `columns`, `rows`, `caption?` | 表格。`columns` 每项:`key`, `label`, `align?: "right"`, `span?`(占几列网格,写了就按网格定列宽), `bar?`(数字后接细条), `tone?: string[]`(这些值标红), `muteWhen?: {key, equals}`(行灰显), `interval?: {low, high, domain: [min, max]}`(画区间图)。`caption` 是表格**下方**一行居中的灰色小字注释(如口径、阈值说明),不是表名;表名用外面 `Group` 的 `title` |
| `TrendChart` | `data`, `xKey`, `series: {key, label}[]`, `height?`, `band?: {low, high}`, `zero?`, `yTicks?`, `xInterval?`, `pointLabels?: "last"`, `lastLabel?` | 折线图。`height` 用 `"h-48"` 之类,或 `"fill"` 填满所在块 |
| `BarChart` | `data`, `xKey`, `series`, `layout?: "horizontal"` | 柱状图;`horizontal` 是横向细条 |
| `ProgressList` | `items: {label, value, max?, display?}[]`, `compact?` | 进度条列表;`compact` 每行依次是名称、细条、数值 |
| `List` | `items: {title?, description?, meta?}[]`, `numbered?`, `ordered?`, `columns?`, `divided?`, `metaTone?: "destructive"` | 列表。`numbered` 带 01、02 序号和行间细线;`columns` 并排;`ordered` 带 1、2 序号 |
| `KV` | `items: {label, value}[]`, `labelCols?` | 键值表;`labelCols` 让标签占几列网格 |

## 截图

一组可组合的部件,用来放界面截图(链路里的一格一屏、模拟视图的一组四张)。放在 `FigureStrip` 里,一格就是一个 `Figure`;图、标签、说明的上下顺序由页面决定。

| 组件 | props | 说明 |
|---|---|---|
| `FigureStrip` | children | 一行截图,放在 shadcn `ScrollArea` 里横向滚动,滚动条是 shadcn 的样式(不是浏览器原生滚动条);超出宽度的部分裁掉,不把页面撑宽 |
| `Figure` | children | 一张截图的外框,纵向排图、标签和说明;宽度随图,不收缩 |
| `FigureImage` | `src`, `alt` | 截图本体。固定高度、按原比例显示,不裁剪,所以不用传比例 |
| `FigureLabel` | children(字符串) | 图下面或上面的视图名(屏名、步号),12px 灰色 |
| `FigureText` | children(字符串) | 图下面的说明(内容、操作、输入项),14px 正文 |

链路明细:一个产品一组,一组一行,按步骤顺序横向排开。图高一致,不同比例的截图(手机 375×760、分析图 1200×760)也能并排对齐。

```tsx
<Group title={`${chain.product} · ${chain.version}`}>
  <FigureStrip>
    {chain.steps.map((step) => (
      <Figure key={step.no}>
        <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
        <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
        <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
      </Figure>
    ))}
  </FigureStrip>
</Group>
```

模拟视图:一组四张(原界面 + 三种色觉模拟),每张带视图名,横向排开;要放说明文字就用 `Block` 的 `title`/`description` 包住这一组。`FigureLabel` 放在 `FigureImage` 前就是名称在上,放在后就是名称在下。

```tsx
<Block title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照">
  <FigureStrip>
    {views.map((view) => (
      <Figure key={view.name}>
        <FigureImage src={view.image} alt={view.name} />
        <FigureLabel>{view.name}</FigureLabel>
      </Figure>
    ))}
  </FigureStrip>
</Block>
```
