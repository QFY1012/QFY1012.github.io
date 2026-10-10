// The rubric, in the three steps of the design process. Every check is true/false.
//
//   step 1  信息分类   on the information structure, before any layout
//   step 2  规范摆放   on one rendered page: rules a page either follows or breaks
//   step 3  审美       new page against old page, judged in both orders; the new
//                      one is better only if it wins both (probe + validation:
//                      a judge compares reliably, it does not score taste alone)
//
// `by`: who decides. Geometry and typesetting are measured by the program from the
// spec tree and the DOM; the judge decides only what needs reading the content.
// `alsoJudge`: program checks the judge is also tested on in the experiments.
// Nothing here names a style: no column count, no fixed scale, no cards or not.
// A page need not be designed on a grid, but it is checked against one (2.4).

export const STEPS = [
  {
    step: 1,
    name: "信息分类",
    input: "信息结构:分了哪些节和组、每组里有哪些信息、各自的重要程度和数据性质",
    checks: [
      { id: "1.1", name: "归类完整", by: "program", rule: "JSON 里的每条信息都归入了某一组,没有遗漏、重复。" },
      { id: "1.2", name: "分组合理", by: "judge", rule: "同一组的信息在内容上该放在一起;不相干的信息不在同一组或同一节。" },
      { id: "1.3", name: "主次明确", by: "judge", rule: "每节、每组标出了最重要的一条;结论排在支撑它的明细之前。" },
      { id: "1.4", name: "数据性质", by: "judge", rule: "每条数据标出了性质(单个数值、类别比较、时间趋势、占比、明细、文字),并且标得对。" },
    ],
  },
  {
    step: 2,
    name: "规范摆放",
    input: "渲染出的页面:截图切块和编号 DOM 清单",
    checks: [
      { id: "2.1", name: "能渲染", by: "program", rule: "页面正常渲染,没有报错。" },
      { id: "2.2", name: "组件库", by: "program", rule: "只用规定组件库里的组件;AI 新做的组件必须由组件库零件拼成、遵守设计参数,并带标记。" },
      { id: "2.3", name: "统一刻度", by: "program", rule: "间距和字号都取自本页设计系统声明的同一套刻度。" },
      { id: "2.4", name: "网格检查", by: "program", rule: "页面不必按网格设计,但要经得起网格检查:从块的边缘推出最贴合的一套网格(列数、列宽、栏间距、页边距、纵向基本单位),所有块的左右边缘都落在列线上,纵向间距都是基本单位的整数倍。" },
      { id: "2.5", name: "数据忠实", by: "program", alsoJudge: true, rule: "JSON 中的信息全部呈现;数值和文字不改动、不编造、不遗漏。" },
      { id: "2.6", name: "元素碰撞", by: "program", alsoJudge: true, rule: "元素之间没有重叠;内容不溢出所在的块或页面(组件内部滚动不算)。" },
      { id: "2.7", name: "分组看得出", by: "judge", rule: "页面上看起来是一组的,正是第 1 步分在一组的;组的边界靠间距、对齐或线来表现,读者不用读字就能分出组。" },
      { id: "2.8", name: "层级看得出", by: "judge", rule: "最醒目的(字号、位置、面积)是第 1 步标出的最重要信息。" },
      { id: "2.9", name: "组件与数据匹配", by: "judge", rule: "组件适合第 1 步标出的数据性质(类别比较、时间趋势、占比、明细各有合适的呈现方式)。" },
      { id: "2.10", name: "同类同组件", by: "judge", rule: "同一类信息使用同一种组件。" },
      { id: "2.11", name: "间距阶梯", by: "program", alsoJudge: true, rule: "只看不同层之间的大小关系,不看具体数值:块之间大于块内部(有边框的块可以相等);组之间大于块之间;节之间大于组之间。" },
      { id: "2.12", name: "同层间距一致", by: "program", alsoJudge: true, rule: "只看同一层内是否相等:同一个块里并列的几部分之间、同一组里并列的块之间,间距相等。" },
      { id: "2.13", name: "并排对齐", by: "program", alsoJudge: true, rule: "同一行并排的块,上边缘对齐,下边缘也对齐:有边框的看外框,没有边框的看内容的上下边缘。" },
      { id: "2.14", name: "排字", by: "program", alsoJudge: true, rule: "中文里使用全角标点;数字使用同一种字体并且等宽;多行正文的对齐方式全页一致。" },
    ],
  },
  {
    step: 3,
    name: "审美",
    input: "新旧两版页面,各自一张整页缩略图加切块;两种顺序各判一次",
    // Single-page checks for these (cards, whitespace, balance) were tried and
    // dropped: the judge caught 0–13% of them. They live here as principles.
    principles: [
      { id: "P1", name: "装饰表达信息", rule: "卡片、边框、底色、阴影、颜色只用于区分真正独立的对象或表达状态;能用间距分组的,不必再加容器。" },
      { id: "P2", name: "留白成形", rule: "空白应是规整、与网格对齐的整块区域,而不是零碎、不规则的剩余空间;大面积而规整的留白不是缺点。" },
      { id: "P3", name: "主次分明", rule: "同一水平带里的内容要么同类、分量相同,要么有明显的主次;分量相当的不同内容并排是问题。" },
      { id: "P4", name: "疏密一致", rule: "同类元素的行距和间距一致,不为凑齐高度而拉开或压缩。" },
      { id: "P5", name: "有系统", rule: "整页使用统一的间距层级和对齐主轴,字号种类少且层级明确。" },
      { id: "P6", name: "精致", rule: "图形线条克制,颜色只表达含义;中文使用全角标点,数字字体统一。" },
    ],
    verdict: "两种顺序都选新版,才算新版更好;否则保留旧版。",
  },
]

// Where each check of the pilot rubric went (inject.mjs still uses the old ids).
export const FROM_PILOT = {
  "2.2": "2.5", "2.3": "2.6", "3.1": "2.11", "3.2": "2.12", "3.3": "2.13",
  "3.4": "P2", "3.5": "P2", "3.6": "P3", "3.7": "2.14",
  "4.1": "1.2 + 2.7", "4.2": "1.3 + 2.8", "4.3": "1.4 + 2.9", "4.4": "2.10", "4.5": "P1",
}

// What the single-page judge is asked in the experiments.
export const CHECKS = STEPS[1].checks.filter((c) => c.by === "judge" || c.alsoJudge)
export const rubricText = () => CHECKS.map((c) => `- ${c.id} ${c.name}:${c.rule}`).join("\n")
export const principleText = () => STEPS[2].principles.map((p, i) => `${i + 1}. ${p.name}:${p.rule}`).join("\n")
