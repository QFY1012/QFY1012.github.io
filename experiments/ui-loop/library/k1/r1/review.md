# 组件改动 k1(待审,第 1 版)

组件 Agent 做出的示例,合并前需要人工审批:
- 通过:`node scripts/component-loop.mjs approve k1`
- 写意见让 Agent 再改一版:`node scripts/component-loop.mjs revise k1 "意见"`
- 自己改代码:直接改 `traces/_components/k1/app/`,改完再 approve
- 不采用:`node scripts/component-loop.mjs reject k1 "原因"`

## 示例效果

演示页用 flow/f1 的真实数据,新部件和现有组件放在同一页:

![演示页](k1-demo.png)

切块截图在 `traces/_components/k1/tile-*.png`。

## 组件 Agent 的说明

完成。程序检查全部通过(`checks.json` 为空)。

## 新部件(4 个,都从 `@/components/report` 导出)

| 部件 | 管什么 | 来源 |
|---|---|---|
| `Figure` | 一张截图的外框(`<figure>`),把图、标签、说明纵向排开;接受 `span` 在 `Grid` 里占几列 | 自建函数组件(`data-slot` + `cn` + 原生 props) |
| `FigureImage` | 截图本体(`<img data-slot="figure-image">`),外套等比框,默认手机比例 375/760,`ratio` 可传源图比例 | 用 shadcn 的 `aspect-ratio`(Radix `AspectRatio` 原语)做外框 |
| `FigureLabel` | 视图名 / 屏名 / 步号(`<figcaption>`),12px 灰色 | 自建 |
| `FigureText` | 图下的说明(内容、操作、输入项),14px 正文 | 自建 |

- shadcn 里没有能承载图片的部件,最接近的只有 `aspect-ratio`,已原样复制到 `app/src/components/ui/aspect-ratio.tsx`(它本身无阴影、底色,字号也合规,无需改样式)。其余三个是自建的组合部件。
- 没有加切换样式/结构的配置 props:名称在图上方还是下方,由 `FigureLabel` 相对 `FigureImage` 的先后顺序决定;每格宽度由 `Grid` 的列数 / `Figure` 的 `span` 决定,高度由等比框自动跟上。

**组合方式**
- 链路明细(一格一屏):`Group`(一个产品一组)→ `Grid cols={4} fields={false}` → 每格一个 `Figure` = `FigureImage` + `FigureLabel` + `FigureText`。4 列定宽 + 固定比例,一排截图等高、标签对齐。
- 模拟视图(一组四张):`Block`(`title`/`description` 放说明文字)→ `Grid cols={4}` → 4 个 `Figure` = `FigureImage` + `FigureLabel`。

## 演示页
用真实 `data.json` / `assets/` 排了完整报告:结论句 + KPI、产品对比、**交互链路(26 张截图全部呈现,一个产品一组、一格一屏)**、阶段对比、常见模式、问题(严重度标红)、建议,最后是 **「视图对照」:四张一行、每张带视图名、放在 `Block` 里带说明文字**,展示新部件与现有组件的统一。

## 需求里没做的及原因
- **色觉模拟图本身没有生成**:`data.json` 是「交互流程挖掘」报告,`assets/` 里只有 26 张真实界面截图,没有红色盲/绿色盲/蓝色盲的模拟图。所以「视图对照」用真实截图 + 视图名演示「四张一行、每张带视图名称」的排法,不伪造模拟图;组件支持任意图片和视图名,换一份带模拟图的 data 即可直接排。
- **没做缩放/灯箱/懒加载等交互**:需求只要求承载图片和标签,规范也不允许卡片、底色、阴影、标签,所以保持静态。
- **`ratio` 默认 375/760**:若以后出现非手机比例的截图,页面需要传 `ratio`,否则会被 `object-cover` 裁切——已在 `components.md` 写明。

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
index de79a21..f2bf887 100644
--- a/src/components/report/index.tsx
+++ b/src/components/report/index.tsx
@@ -7,6 +7,7 @@
 import * as React from "react"
 
 import { cn } from "@/lib/utils"
+import { AspectRatio } from "@/components/ui/aspect-ratio"
 import { Node, type SpecNode } from "./render"
 
 const SPAN = ["", "col-span-1", "col-span-2", "col-span-3", "col-span-4", "col-span-5", "col-span-6", "col-span-7", "col-span-8", "col-span-9", "col-span-10", "col-span-11", "col-span-12"]
@@ -89,3 +90,32 @@ export const KV = content("kv")
 export function Text({ children, className, span }: Placed & { children: string }) {
   return <Node node={{ type: "text", text: children, className }} ctx={{ span }} />
 }
+
+// Screenshots: one screen per Figure, composed in a Grid (one cell per screen,
+// the grid sets the cell width). The image is held to the phone-screenshot
+// ratio, so a row of figures keeps one height and the labels line up.
+const SCREEN_RATIO = 375 / 760
+
+export function Figure({ span, className, ...props }: Placed & React.ComponentProps<"figure">) {
+  return <figure data-slot="figure" className={cn("flex flex-col gap-2", span && SPAN[span], className)} {...props} />
+}
+
+// ratio: width / height. Defaults to a phone screenshot; pass the source's own
+// ratio when the images are not 375x760 so they are not cropped.
+export function FigureImage({ ratio = SCREEN_RATIO, className, ...props }: React.ComponentProps<"img"> & { ratio?: number }) {
+  return (
+    <AspectRatio ratio={ratio} className="w-full overflow-hidden">
+      <img data-slot="figure-image" className={cn("h-full w-full object-cover", className)} {...props} />
+    </AspectRatio>
+  )
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
index aa3b38f..0669bc2 100644
--- a/components.md
+++ b/traces/_components/k1/components.md
@@ -4,7 +4,7 @@
 
 ```tsx
 import data from "./data.json"
-import { Page, Section, Group, Grid, Block, Text, Stat, DataTable, TrendChart, BarChart, ProgressList, List, KV } from "@/components/report"
+import { Page, Section, Group, Grid, Block, Text, Stat, DataTable, TrendChart, BarChart, ProgressList, List, KV, Figure, FigureImage, FigureLabel, FigureText } from "@/components/report"
 ```
 
 不直接写 HTML 标签(`<div>` 除外,也尽量不用),不写 `style`,不写颜色类名和任意值类名(如 `text-[13px]`)。字号、颜色、间距都由组件给出;规范允许的类名只有 design.md 里写明的几个。
@@ -35,3 +35,45 @@ import { Page, Section, Group, Grid, Block, Text, Stat, DataTable, TrendChart, B
 | `ProgressList` | `items: {label, value, max?, display?}[]`, `compact?` | 进度条列表;`compact` 每行依次是名称、细条、数值 |
 | `List` | `items: {title?, description?, meta?}[]`, `numbered?`, `ordered?`, `columns?`, `divided?`, `metaTone?: "destructive"` | 列表。`numbered` 带 01、02 序号和行间细线;`columns` 并排;`ordered` 带 1、2 序号 |
 | `KV` | `items: {label, value}[]`, `labelCols?` | 键值表;`labelCols` 让标签占几列网格 |
+
+## 截图
+
+一组可组合的部件,用来放界面截图(链路里的一格一屏、模拟视图的一组四张)。放在 `Grid` 里,一格就是一个 `Figure`;图、标签、说明的上下顺序由页面决定。
+
+| 组件 | props | 说明 |
+|---|---|---|
+| `Figure` | `span?`(在 `Grid` 里占几列) | 一张截图的外框,纵向排图、标签和说明 |
+| `FigureImage` | `src`, `alt`, `ratio?` | 截图本体。`ratio` 是宽/高,默认 375/760(手机截图);换别的比例的图时传源图自己的比例,否则会裁切 |
+| `FigureLabel` | children(字符串) | 图下面或上面的视图名(屏名、步号),12px 灰色 |
+| `FigureText` | children(字符串) | 图下面的说明(内容、操作、输入项),14px 正文 |
+
+链路明细:一个产品一组,组内一格一屏。`Grid` 的列数定每格宽度,`FigureImage` 按比例定高,所以一排截图等高、标签对齐。
+
+```tsx
+<Group title={`${chain.product} · ${chain.version}`}>
+  <Grid cols={4} fields={false}>
+    {chain.steps.map((step) => (
+      <Figure key={step.no}>
+        <FigureImage src={step.image} alt={`${chain.product} 第 ${step.no} 步:${step.screen}`} />
+        <FigureLabel>第 {step.no} 步 · {step.screen}</FigureLabel>
+        <FigureText>{step.content} · {step.action} · 输入 {step.inputs} 项</FigureText>
+      </Figure>
+    ))}
+  </Grid>
+</Group>
+```
+
+模拟视图:一组四张(原界面 + 三种色觉模拟),每张带视图名,四张一行;要放说明文字就用 `Block` 的 `title`/`description` 包住这一组。`FigureLabel` 放在 `FigureImage` 前就是名称在上,放在后就是名称在下。
+
+```tsx
+<Block title="色觉模拟" description="原界面与红色盲、绿色盲、蓝色盲模拟对照">
+  <Grid cols={4} fields={false}>
+    {views.map((view) => (
+      <Figure key={view.name}>
+        <FigureImage src={view.image} alt={view.name} />
+        <FigureLabel>{view.name}</FigureLabel>
+      </Figure>
+    ))}
+  </Grid>
+</Block>
+```

```
