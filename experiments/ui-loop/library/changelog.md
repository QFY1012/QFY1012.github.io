# 组件库修改记录

组件库是公共层,改动影响所有 Skill。每一项改动由组件 Agent 做出示例,人工审批后才合并;没采用的也记在这里。

## k1  结果:采用(4 版)

需求 2 条。示例和说明见 library/k1.md,改动见 library/k1.patch。
- 第 2 版的审批意见:截图部件改成横向滚动:一组截图排成一行横向滚动,这样更省空间;超出宽度的部分隐藏,不把页面撑宽。图按同一高度、原比例显示,不裁剪,也就不需要 ratio 这类配置项。色觉无障碍分析的截图比例和手机截图不同(1200×760,手机截图是 375×760),演示页加一组这种比例的图,验证不同比例的图也能放进同样的横向排列。
- 第 3 版的审批意见:太挤了 而且滑条也不对(审批人的截图:feedback.png)。这种滑条也应该用 shadcn 的滑条。
- 第 4 版的审批意见:还需要更宽的间距

改完了,程序检查全部通过(`checks.json` 为空)。

## 改了什么

审批意见是「还需要更宽的间距」。间距涉及的地方就是截图部件横向排列的间距,所以只改了 `app/src/components/report/index.tsx` 里 `FigureStrip` 内部那一行:

- 图与图之间的间距从 `gap-6`(24px)加宽到 `gap-12`(48px)。

```
<div className="flex w-max gap-12 pb-4">{children}</div>
```

48px 是 24 的倍数,符合 A1 的纵向刻度(间距取 24 的倍数);只动了这一处,组件结构、`data-slot`、其余间距(`Figure` 内图与标签/说明的 `gap-2`、`pb-4` 滚动条留白)和演示页 `Page.tsx` 都没动。演示页仍然只放新部件(`FigureStrip`/`Figure`/`FigureImage`/`FigureLabel`/`FigureText`)加一小段现有组件对照。

## 效果

- 链路明细:5 张手机截图之间现在有 48px 留白,「第 N 步」标签和说明文字不再彼此贴住,一行读起来更清楚。
- 模拟视图:4 张色觉模拟图同样拉开到 48px,宽高比不同的图(手机 375×760、分析图 1200×760)仍按原比例并排对齐,超出部分继续靠 shadcn `ScrollArea` 横向滚动。

`components.md` 里对部件的说明(有哪些部件、何时用、最小示例)保持不变,这次不涉及文档改动。

## k3  结果:采用(1 版)

需求 6 条。示例和说明见 library/k3.md,改动见 library/k3.patch。

程序检查全部通过,页面视觉也确认无误。改动完成。

## 改动说明

**修改的已有组件:`app/src/components/ui/progress.tsx`**

组件代码检查报出:`第 26 行 加了底色;规范不用卡片和底色`。

原因:进度条的轨道写成了 `bg-border`,即用一个背景填充色来画轨道,属于规范禁止的「底色」。

改法:轨道与进度条都改成**用边框画出的 1px 细线**,不再有任何背景填充色:

- 轨道:`<div data-slot="progress-track" className="absolute inset-0 border-t border-border" />`,一条与表格行线同重的细线;
- 进度:`ProgressIndicator` 改为 `border-t border-muted-foreground`,并按 `width: value%` 决定长度(原来是 `translateX` + 背景填充)。

这样根元素只保留 `relative h-px w-full overflow-hidden`,整个组件里不再出现任何 `bg-` 类名(已 `grep` 确认无残留)。视觉上进度条仍是「浅色轨道线 + 深一档的进度线」两条细线,与全页细线风格一致,也仍然满足需求里「计数用细条、不与正文争夺视觉重量」的要求。

其余组件与演示页未动(演示页程序检查本就是 `[]`)。

**运行结果**

```
$ node $SHOOT .
程序检查全部通过。
```

`checks.json` 为 `[]`,截图 `thumb.png` / `tile-*.png` 已重新生成;「问题分布」一栏的进度条在截图里显示为细线轨道 + 细线进度,与表格行线同重。

## k5  结果:未采用

和 k4 同时提出:两个 loop 同时提案,k5 的记录被覆盖,需求也和 k4 重叠。k4 采用后,没解决的问题由下一次提案重新提出。示例和说明仍在 library/k5.md。

## k4  结果:采用(1 版)

需求 5 条。示例和说明见 library/k4.md,改动见 library/k4.patch。

全部完成,检查通过(`checks.json` 为 `[]`)。下面是说明。

## 交付物

| 文件 | 内容 |
|---|---|
| `Page.tsx` | 演示页,五节对应五条需求 + 一节现有部件对照 |
| `assets/*.svg`(11 张) | 手机屏 375×760 ×4、分析屏 1200×760 ×3、色觉模拟 640×400 ×4 |
| `tools/gen-assets.mjs` | 生成上面这些图的脚本(尺寸、色觉模拟的配色都在里面) |
| `components.md` | 补上了 `tone` 的第二通道、`FigureStrip` 行高归属、`FigureImage` 的定尺规则 |
| `app/src/components/report/{index.tsx,render.tsx}` | 本轮改动的两个文件(见下) |

## 新部件叫什么、各管什么、来自哪里

本轮**没有新增部件**——五条需求都是已有部件的行为问题,按「能改就不新增」处理。改的是两个已有文件里的五处:

| 部件 | 管什么 | 来源 | 改了什么 |
|---|---|---|---|
| `DataTable` 的 `tone` | 状态值(如「严重」) | shadcn `Table` | 标红 + `font-medium` → **标红 + `font-semibold`(400→600)** |
| `ProgressList`(`compact`) | 一行:名称、细条、数值 | shadcn `Progress`(Radix Progress) | 标签列 `4.5rem/gap-3` → **`74px/gap-6`**,条从网格列线起 |
| `FigureStrip` | 一行截图,横向滚动 | shadcn `ScrollArea`(Radix ScrollArea) | 行高**由条自己定**:行容器加 `[&_[data-slot=figure-image]]:h-96 …w-auto`;`type="hover"` 保留 |
| `FigureGrid` | 一组对照图,两列铺满列宽 | 组合部件(无原语) | 删掉对图片的覆盖,只留 `[&>[data-slot=figure]]:w-full min-w-0` |
| `FigureImage` | 截图本体 | 组合部件(`<img>`) | 去掉固定高度 `h-96`,改成 `block w-full max-w-none` |
| `Rule` / `FigureLabel` / `FigureText` / `Figure` | 分组线、视图名、说明、外框 | `Rule` 来自 shadcn `Separator`(Radix Separator) | 未动 |

关键一处:原来 `FigureImage` 自带 384px 固定高度,`FigureGrid` 只能用后代选择器把它**覆盖**掉。现在把「行高」还给真正拥有它的 `FigureStrip`——条负责统一行高,网格负责列宽,叶子部件不再定尺,`FigureGrid` 的覆盖也就删掉了。

## 怎么组合(最小示例)

```tsx
<Group>
  <DataTable columns={[{ key: "severity", label: "严重度", span: 1, tone: ["严重"] }, …]}
             rows={rows} caption="口径:CIEDE2000,ΔE 低于 10 记为不可辨。" />
</Group>
<ProgressList compact items={[{ label: "红色盲", value: 128, max: 128 }]} />
<Rule label="色觉自测 · iOS 3.2" />
<FigureStrip>
  <Figure><FigureImage src="assets/phone-home.svg" alt="首页" />
    <FigureLabel>第 1 步 · 首页</FigureLabel><FigureText>…</FigureText></Figure>
</FigureStrip>
<FigureGrid>{views.map((v) => <Figure key={v.name}><FigureImage src={v.image} alt={v.name} /><FigureLabel>{v.name}</FigureLabel></Figure>)}</FigureGrid>
```

## 需求逐条

| 需求 | 结果 |
|---|---|
| tone 只有颜色一个通道 | **做了**。`font-semibold`,与正文 400 差两档。灰度核对过:`font-medium` 时「严重」比「中等」还浅、粗细几乎一样;改 600 后笔画明显更重 |
| ProgressList 黑粗条 | **做了**。条是 `Progress` 的 1px 细线(与表格行线同重),颜色比轨道深一档;实测 `height: 1px` |
| caption 居中 | **做了**。`TableCaption` 左对齐;实测 caption 与表格左边缘同为 x=438 |
| FigureStrip 滚动条常显 | **做了**。`ScrollArea type="hover"`;实测静止时页面上 `[data-slot=scroll-area-scrollbar]` 数量为 **0**(Radix 悬停才挂载),截图行静止时图下没有横条 |
| FigureImage 固定高度 | **做了**。定尺移出叶子部件;实测截图行所有图 **h=384**,宽 189(手机)/606(宽屏)并排;对照网格两列各 417px,图 417×261 铺满列宽 |

## 没做的,及原因

- **P-06 的「刻度或数值基准」**:没加刻度轴。每行的数值已经写在行尾(数值基准有了),再加一套坐标会在 858px 内容列里多一层尺子,与全页「细线只做分组」的写法冲突;这一栏是计数不是比例尺。条与相邻表格共用对齐线这一条做了(条起点 x=536,正好是表格「界面」列线)。
- **P-16 的「标记」那一路**:没加图形标记(▲/● 之类)。规范里装饰只有细线、不加底色和标签;字重已经构成第二通道,再加标记会和「严重」这两个字本身重复。
- **没新增部件**:五条需求都能落在已有部件上,没有出现「缺一个部件」的情况。

## 验证

- `node $SHOOT .` 程序检查全部通过(0 findings)。
- 除截图外还量了 DOM:表格/内容列 858px、caption 对齐、条 1px、截图行 `scrollWidth` 1319 与 1498(>858,所以悬停才有条)、网格 417px 两列、tone 600 对普通 400。
- 灰度核对是把截图裁切放大后加 `grayscale(1)` 比的;这一步的临时脚本用完已删,只留 `tools/gen-assets.mjs`。

一处提醒:演示页里截图行是有意**裁切**的(超出内容列的图被切掉,靠悬停滚动条去够),这是 `FigureStrip` 的设计;如果希望静止时也看得出「还有内容」,需要另加一个组件能力,本轮没做。
