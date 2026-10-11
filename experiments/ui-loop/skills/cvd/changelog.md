# 修改记录 · 色觉无障碍分析

每个候选改了什么、对比结果、是否采用;没采用的也保留。

## 「程序检查」阶段结束:所有页面都通过

进入「需求 judge」。

## 候选 c1(基于 g0,需求 judge阶段)  结果:未采用

改动:规则 G1
  (新增规则)
  改为:- **G1 颜色表的列与位置**: `palette`、`confusions`、`contrast`、`fixes` 四张表放进同一节「色板与检查」,依次排成四张 `DataTable`(每张用 `caption` 写表名「配色」「混淆色」「对比度」「修复」),表与表之间 24px,中间不插别的块;这一节紧跟「模拟视图」一节之后,排在问题清单之前。凡单元格里出现颜色值的地方都写成「名称 色值」(如 `系列 2 #52C41A`),名称取 `palette` 里 `hex` 相同的 `name`,在 `palette` 里找不到的只写色值。`palette` 三列:名称(span 2)、色值(span 2)、用途(span 5)。`confusions` 七列:位置 `where`(span 2)、颜色对(span 2,`colors` 两个色值按上面的写法用「/」相连)、正常 `normal`(span 1,`align: "right"`)、红色盲(span 1,`align: "right"`)、绿色盲(span 1,`align: "right"`)、蓝色盲(span 1,`align: "right"`)、受影响 `affected`(span 1,用「、」拼),四个色差列里该行 `affected` 列出的类型的数值放进该列 `tone` 标红。`contrast` 六列:位置 `where`(span 3)、文字色 `fg`(span 1)、背景色 `bg`(span 1)、对比度 `ratio`(span 1,`align: "right"`)、要求 `required`(span 1,`align: "right"`)、结果(span 2,`pass` 为 false 的写「不达标」并放进该列 `tone`)。`fixes` 六列:位置 `where`(span 2)、原色 `from`(span 1)、建议色 `to`(span 1)、背景 `bg`(span 1)、修复前 `before`(span 2,`align: "right"`)、修复后 `after`(span 2,`align: "right"`)。
依据:P-05。布局问题里 P-05 与 P-06 并列最多(各 4 页),先改 P-05:配色、混淆色、对比度、修复四张表分散在不同节,同一颜色又分别用名称、系列编号、色值三种写法,读者要跨节做字符串比对;合并成一节、统一写成「名称 色值」并给每张表定死列与 span,所有字段都有落点。
改动行数(Page.tsx,相对当前版):c1 148,c2 168,c3 97,c4 123,c5 136,c6 121
验证样本程序检查问题:当前 0 个,候选 0 个
验证样本需求 judge 算数的意见:当前 17 条,候选 18 条
没采用的原因:需求 judge 算数的意见在 c6 上变多

## 候选 c1 的结果作废

Figure 组件把截图横向拉长(图下说明比图宽时撑开外框),当前版和 c1 的截图都受影响,这一轮的需求 judge 结果作废。组件修好后两版页面不变、重新截图,c1 重新检测。
