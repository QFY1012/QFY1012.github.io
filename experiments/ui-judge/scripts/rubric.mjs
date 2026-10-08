// Checks the judge is tested on (from the rubric in the plan doc). The
// program-only checks (1.1 component library, 1.2 grid, 1.3 Tailwind scale,
// 2.1 renders) are not given to the judge.
export const CHECKS = [
  { id: "2.2", name: "数据忠实", rule: "JSON 中的信息全部呈现;数值和文字不改动、不编造、不遗漏。" },
  { id: "2.3", name: "元素碰撞", rule: "元素之间没有重叠;内容不溢出所在卡片或页面(组件内部滚动不算)。" },
  { id: "3.1", name: "间距阶梯", rule: "层级越高间距越大:卡片内部 24px;同组卡片之间不小于 24px;组与组之间 48px;节与节之间 96px。上一层的间距必须大于下一层。" },
  { id: "3.2", name: "卡片内间距一致", rule: "同一张卡片里,同一层元素之间的间距一致。" },
  { id: "3.3", name: "同行等高", rule: "同一行的卡片高度相同。" },
  { id: "3.4", name: "负形", rule: "每一行的卡片占满 12 列,不留空列。" },
  { id: "3.5", name: "留白", rule: "卡片里没有大片空白(内容只占卡片的一小部分)。" },
  { id: "3.6", name: "视觉平衡", rule: "每一行、每张卡片内,内容的视觉重量分布均衡,不明显偏向一侧。" },
  { id: "3.7", name: "正文两端对齐", rule: "多行正文两端对齐,最后一行左对齐。" },
  { id: "4.1", name: "分组一致", rule: "看起来是一组的,与信息本身该是一组的一致;不相干的信息不放进同一组或同一节。" },
  { id: "4.2", name: "层级一致", rule: "最醒目的(字号、位置、面积)是最重要的信息。" },
  { id: "4.3", name: "组件与数据匹配", rule: "组件适合数据的性质(例如类别比较、时间趋势、比例、明细各有合适的呈现方式)。" },
  { id: "4.4", name: "同类同组件", rule: "同一类信息使用同一种组件。" },
]

export const rubricText = () => CHECKS.map((c) => `- ${c.id} ${c.name}:${c.rule}`).join("\n")
