/* ============================================================
 * hero-text.ts — 首屏字符画文本池（唯一维护点）
 * 四组关键词库与轮播造型一一对应（顺序 = SHAPE_BUILDERS）：
 *   ① 莫比乌斯 = AI Design Engineering（淘天实习）
 *   ② 分析树   = ToA（CHI'26）
 *   ③ 螺旋     = NarraSteer（CHI'27 在投）
 *   ④ 星群网罩 = Public Opinion Analysis & Governance（国家重点研发计划）
 * 词条统一为抽象英文关键词；新增/调整词条只改这个文件。
 * ============================================================ */

/** 官方论文标题（权威来源，必须出现在词流里） */
const OFFICIAL_TITLES = {
  toa: "Visualizing Tree-of-Analysis: Facilitating Conversational Visual Analytics for Novices",
  narrasteer: "Reconstructing Trajectories as Storylines: Steering LLM Agents in Narrative Space",
};

/** Title */
const TITLE = "AI Design Engineer";

/** ① 莫比乌斯 · AI Design Engineering：抽象词，只写 design+engineering 的交汇 */
const POOL_DESIGN_ENGINEERING = [
  TITLE,
  "Design + Engineering",
  "Form + Function",
  "Aesthetics + Logic",
];

/** ② 分析树 · ToA：对话式可视分析（官方标题打头） */
const POOL_TOA = [
  OFFICIAL_TITLES.toa,
  "Tree-of-Analysis",
  "Conversational Visual Analytics",
  "Branching + Backtracking",
  "Dialogue + Insight",
];

/** ③ 螺旋 · NarraSteer：数据叙事（官方标题打头） */
const POOL_NARRASTEER = [
  OFFICIAL_TITLES.narrasteer,
  "Data Storytelling",
  "Narrative Space",
  "Storylines + Agents",
  "Exploration + Steering",
];

/** ④ 星群网罩 · 舆情分析与治理 */
const POOL_PUBLIC_OPINION = [
  "Public Opinion Analysis & Governance",
  "Monitoring + Analysis + Response",
  "Cross-platform + Large-screen",
  "Insight + Governance",
];

/** 词条以 · 连接成一条循环长串；整体重复 2 次降低接缝感 */
const buildStream = (pool: string[]) => {
  const core = pool.join("  ·  ");
  return `${core}  ·  ${core}  ·  `;
};

/** 四组造型关键词库，下标与 SHAPE_BUILDERS 一致 */
export const SHAPE_STREAMS = [
  POOL_DESIGN_ENGINEERING,
  POOL_TOA,
  POOL_NARRASTEER,
  POOL_PUBLIC_OPINION,
].map(buildStream);

/** CJK 判断：中日韩统一表意文字（含扩展 A 与兼容区） */
export function isCJK(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return (c >= 0x3400 && c <= 0x9fff) || (c >= 0xf900 && c <= 0xfaff);
}
