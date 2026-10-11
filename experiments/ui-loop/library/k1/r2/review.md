# 组件改动 k1(待审,第 2 版)

组件 Agent 做出的示例,合并前需要人工审批:
- 通过:`node scripts/component-loop.mjs approve k1`
- 写意见让 Agent 再改一版:`node scripts/component-loop.mjs revise k1 "意见"`
- 自己改代码:直接改 `traces/_components/k1/app/`,改完再 approve
- 不采用:`node scripts/component-loop.mjs reject k1 "原因"`

## 示例效果

演示页用组件 Agent 自造的测试数据,新部件和一小段现有组件放在同一页:

![演示页](k1-demo.png)

切块截图在 `traces/_components/k1/tile-*.png`。

## 组件 Agent 的说明

改完并跑通检查(2 次,结果 `checks.json` 为空,程序检查全部通过)。说明如下:

## 改了什么

**1. 组件库 `app/src/components/report/index.tsx`(只动截图部件)**
- 新增 `FigureStrip`:横向滚动的截图行,`flex w-full gap-3 overflow-x-auto`——一组截图排成一行,超出宽度的部分被裁掉、不撑宽页面。
- `Figure` 改为 `flex shrink-0 flex-col gap-2`:作为行内一格,宽度随图不收缩,标签和说明仍在图下;去掉了原先给 `Grid` 用的 `span`。
- `FigureImage` 改为 `<img className="h-96 w-auto max-w-none">`:固定高度、按源图原比例显示、不裁剪,**去掉了 `ratio` prop** 和 `AspectRatio` 的用法与 import(以及 `SCREEN_RATIO` 常量)。
- `FigureLabel`、`FigureText` 未动;其他已有组件、用法未动。`ui/aspect-ratio.tsx` 保留。

**2. `components.md`**
- 「截图」一节改写:表格列出 `FigureStrip / Figure / FigureImage / FigureLabel / FigureText`,写明「一行横向滚动、超出裁掉不撑宽」「固定高度、原比例、不裁剪所以不用传比例」;链路明细与模拟视图两个示例改成 `FigureStrip` 组合;顶部 import 示例补上 `FigureStrip`。

**3. `Page.tsx`(演示页,只放新部件 + 一小段现有组件)**
- 链路明细:5 张手机截图(375×760)一行横向滚动,每格「图 + 第 N 步·屏名 + 内容·操作·输入项」。
- 模拟视图:一组 4 张 1200×760 的色觉分析图(原界面/红色盲/绿色盲/蓝色盲),放在带 `title`/`description` 的 `Block` 里,与手机截图同一套横向排列,验证不同比例也能并排。
- 对照:一个 `Stat` + 一段 `Text` 作为现有组件的风格对照。

**4. `assets/`**
- 新生成 9 张 SVG:5 张 375×760 手机截图、4 张 1200×760 色觉模拟图。

**检查结果**:`node $SHOOT .` → 程序检查全部通过(无越界、无组件库外元素、无直接 `<img>`、无颜色/字号类名违规);截图中手机组显示 4 张整图加第 5 张被裁的边,色觉组显示 1 张整图加第 2 张被裁的边,确认为横向滚动且不撑宽。

## 需求(Maintainer 归纳的「组件不够」问题,2 条)

- **交互流程挖掘 P-01**(程序检查,f1、f2、f3、f4):组件库里没有能放界面截图的组件,链路明细里的每一步截图要么一张都不显示(数据没用完),要么只能用原生 <img> 自己画,违反页面只用组件库组件的规定。
  - 场景:组件不够:流程明细里每一步都要配一张对应的界面截图,单个产品 3–10 张、整页 9–26 张;截图需要和步骤号、屏幕名、内容、操作排在一起,按步骤顺序成组排列(每个产品一组,组内一格一屏),并能控制每格的宽度或高度让多张截图对齐。
- **色觉无障碍分析 P-01**(程序检查,c1、c2、c3、c4):报告需要在「模拟视图」一节展示原界面和三种色觉模拟的截图,但组件库没有图片/截图组件:页面只能手写 img 元素被程序检查判为不是组件库画的,或者干脆不放图导致这组关键证据在页面上完全看不到,看报告的人无法对照色盲模拟前后的差别。
  - 场景:需要逐张呈现检查对象的界面截图及其色觉模拟版本:典型是一组 4 张(原界面 + 红色盲、绿色盲、蓝色盲),每张下面或上面带视图名称,以两两并排或四张一行排布;部分报告还要在同一块里放截图说明文字。组件库需要提供能承载图片、带标签、可放进 Grid/Block 的图片组件。

## 检查

演示页程序检查:
无问题

组件代码检查(已有代码和 tokens 不改;新增代码只用 token、规范的字号,无阴影和底色;从 shadcn 复制来的文件也查):
无问题

## 改动

```diff
diff --git a/src/components/report/index.tsx b/src/components/report/index.tsx
index de79a21..edec766 100644
--- a/src/components/report/index.tsx
+++ b/src/components/report/index.tsx
@@ -89,3 +89,30 @@ export const KV = content("kv")
 export function Text({ children, className, span }: Placed & { children: string }) {
   return <Node node={{ type: "text", text: children, className }} ctx={{ span }} />
 }
+
+// Screenshots: one screen per Figure, laid out in a FigureStrip that scrolls
+// sideways. Every image is drawn at the same height and keeps its own width, so
+// phone screenshots and wider analysis screenshots line up in one row without
+// being cropped; anything past the right edge is clipped and reached by scrolling.
+export function FigureStrip({ className, ...props }: React.ComponentProps<"div">) {
+  return <div data-slot="figure-strip" className={cn("flex w-full gap-3 overflow-x-auto", className)} {...props} />
+}
+
+export function Figure({ className, ...props }: React.ComponentProps<"figure">) {
+  return <figure data-slot="figure" className={cn("flex shrink-0 flex-col gap-2", className)} {...props} />
+}
+
+// The image keeps its own ratio at the strip's height, so nothing is cropped.
+export function FigureImage({ className, ...props }: React.ComponentProps<"img">) {
+  return <img data-slot="figure-image" className={cn("h-96 w-auto max-w-none", className)} {...props} />
+}
+
+// The screen or view name, on the line the design gives 12px notes.
+export function FigureLabel({ className, ...props }: React.ComponentProps<"figcaption">) {
+  return <figcaption data-slot="figure-label" className={cn("text-xs leading-6 text-muted-foreground", className)} {...props} />
+}
+
+// What happens on the screen (content, action, fields), in body type.
+export function FigureText({ className, ...props }: React.ComponentProps<"div">) {
+  return <div data-slot="figure-text" className={cn("text-sm leading-6", className)} {...props} />
+}
diff --git a/src/components/ui/aspect-ratio.tsx b/src/components/ui/aspect-ratio.tsx
new file mode 100644
index 0000000..ecf43ba
--- /dev/null
+++ b/src/components/ui/aspect-ratio.tsx
@@ -0,0 +1,12 @@
+"use client"
+
+import * as React from "react"
+import { AspectRatio as AspectRatioPrimitive } from "radix-ui"
+
+function AspectRatio({
+  ...props
+}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
+  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />
+}
+
+export { AspectRatio }
diff --git a/components.md b/traces/_components/k1/components.md
index aa3b38f..b4c04f0 100644
--- a/components.md
+++ b/traces/_components/k1/components.md
@@ -4,7 +4,7 @@
 
 ```tsx
 import data from "./data.json"
-import { Page, Section, Group, Grid, Block, Text, Stat, DataTable, TrendChart, BarChart, ProgressList, List, KV } from "@/components/report"
+import { Page, Section, Group, Grid, Block, Text, Stat, DataTable, TrendChart, BarChart, ProgressList, List, KV, FigureStrip, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"
 ```
 
 不直接写 HTML 标签(`<div>` 除外,也尽量不用),不写 `style`,不写颜色类名和任意值类名(如 `text-[13px]`)。字号、颜色、间距都由组件给出;规范允许的类名只有 design.md 里写明的几个。
@@ -35,3 +35,46 @@ import { Page, Section, Group, Grid, Block, Text, Stat, DataTable, TrendChart, B
 | `ProgressList` | `items: {label, value, max?, display?}[]`, `compact?` | 进度条列表;`compact` 每行依次是名称、细条、数值 |
 | `List` | `items: {title?, description?, meta?}[]`, `numbered?`, `ordered?`, `columns?`, `divided?`, `metaTone?: "destructive"` | 列表。`numbered` 带 01、02 序号和行间细线;`columns` 并排;`ordered` 带 1、2 序号 |
 | `KV` | `items: {label, value}[]`, `labelCols?` | 键值表;`labelCols` 让标签占几列网格 |
+
+## 截图
+
+一组可组合的部件,用来放界面截图(链路里的一格一屏、模拟视图的一组四张)。放在 `FigureStrip` 里,一格就是一个 `Figure`;图、标签、说明的上下顺序由页面决定。
+
+| 组件 | props | 说明 |
+|---|---|---|
+| `FigureStrip` | children | 一行截图,横向滚动;超出宽度的部分裁掉,不把页面撑宽 |
+| `Figure` | children | 一张截图的外框,纵向排图、标签和说明;宽度随图,不收缩 |
+| `FigureImage` | `src`, `alt` | 截图本体。固定高度、按原比例显示,不裁剪,所以不用传比例 |
+| `FigureLabel` | children(字符串) | 图下面或上面的视图名(屏名、步号),12px 灰色 |
+| `FigureText` | children(字符串) | 图下面的说明(内容、操作、输入项),14px 正文 |
+
+链路明细:一个产品一组,一组一行,按步骤顺序横向排开。图高一致,不同比例的截图(手机 375×760、分析图 1200×760)也能并排对齐。
+
+```tsx
+<Group title={`${chain.product} · ${chain.version}`}>
+  <FigureStrip>
+    {chain.steps.map((step) => (
+      <Figure key={step.no}>
+        <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
+        <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
+        <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
+      </Figure>
+    ))}
+  </FigureStrip>
+</Group>
+```
+
+模拟视图:一组四张(原界面 + 三种色觉模拟),每张带视图名,横向排开;要放说明文字就用 `Block` 的 `title`/`description` 包住这一组。`FigureLabel` 放在 `FigureImage` 前就是名称在上,放在后就是名称在下。
+
+```tsx
+<Block title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照">
+  <FigureStrip>
+    {views.map((view) => (
+      <Figure key={view.name}>
+        <FigureImage src={view.image} alt={view.name} />
+        <FigureLabel>{view.name}</FigureLabel>
+      </Figure>
+    ))}
+  </FigureStrip>
+</Block>
+```

```
