/* ============================================================
 * hero-text.ts — 首屏字符画文本池（唯一维护点）
 * 新增论文/项目/标签只改这个文件。
 * ============================================================ */

/** 官方论文标题（权威来源） */
const OFFICIAL_TITLES = {
  toa: "Visualizing Tree-of-Analysis: Facilitating Conversational Visual Analytics for Novices",
  narrasteer: "Reconstructing Trajectories as Storylines: Steering LLM Agents in Narrative Space",
};

/** Title */
const TITLE = "AI Design Engineering";

/**
 * 字符墙内容 = 两篇论文官方标题 + 本人 title，交替排布形成节奏。
 * 日后想掺入其他词条（技能/中文词），加进 WALL 即可。
 */
const WALL = [
  OFFICIAL_TITLES.toa,
  TITLE,
  OFFICIAL_TITLES.narrasteer,
  TITLE,
];

/** 词条以 · 连接成一条循环长串；整体重复 2 次降低接缝感 */
const core = WALL.join("  ·  ");
export const TEXT_STREAM = `${core}  ·  ${core}  ·  `;

/** CJK 判断：中日韩统一表意文字（含扩展 A 与兼容区） */
export function isCJK(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return (c >= 0x3400 && c <= 0x9fff) || (c >= 0xf900 && c <= 0xfaff);
}
