/* ============================================================
 * hero-text.ts — 造型关键词浮层词池（唯一维护点）
 * 与 hero-particles 的造型轮换一一对应（id 对齐）：
 *   tree = ToA（CHI'26）；helix = NarraSteer（CHI'27 在投）；
 *   outbreak = 舆情分析与治理（国家重点研发计划）
 * 词条取自旧字符画分支 hero-text.ts 的词池（去掉超长官方标题，
 * 浮层一格只放得下一行短词）。新增/调整词条只改这个文件。
 * ============================================================ */

export interface ShapeText {
  id: 'tree' | 'helix' | 'outbreak';
  kicker: string;   // 项目名行（accent 色）
  words: string[];  // 驻留期轮换的关键词
}

export const SHAPE_TEXTS: ShapeText[] = [
  {
    id: 'tree',
    kicker: "ToA · CHI'26",
    words: [
      'Tree-of-Analysis',
      'Conversational Visual Analytics',
      'Branching + Backtracking',
      'Dialogue + Insight',
    ],
  },
  {
    id: 'helix',
    kicker: "NarraSteer · CHI'27",
    words: [
      'Data Storytelling',
      'Narrative Space',
      'Storylines + Agents',
      'Exploration + Steering',
    ],
  },
  {
    id: 'outbreak',
    kicker: 'Public Opinion Governance',
    words: [
      'Analysis + Governance',
      'Monitoring + Response',
      'Cross-platform',
      'Insight + Governance',
    ],
  },
];
