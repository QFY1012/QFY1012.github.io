# Showreel

The opener for the résumé: white, restrained, and built entirely from the site's content and the internship
write-up. Every visual is redrawn in `composition.html` (no screenshots). Output: `public/videos/showreel.mp4`
(1920×1080, 60 fps, H.264 + AAC, about two minutes).

Each chapter is told the same way — **背景 → 解法 → 结果** — with earlier steps kept on screen.

The three internship chapters share one frame of reference, redrawn from the write-up's architecture figure: the design
agent between its users and its knowledge, extended along two dimensions, Skills and Apps (`Arch()` in
`composition.html`). 01–03 each open on it at the same spot with their own part lit and tagged — 01 the Skills bar,
02 the output path from the skills through the agent to the users, 03 the Apps bar — and 03 closes on it with all three lit. Their titles follow one pattern — the part of the figure, then what was done
(技能的治理、评测与优化 · 视觉输出的规范、评测与优化 · PPT 生成模式的设计与开发) — and the figure's tags reuse the
progress bar's short names.

| Chapter | 背景 | 解法 | 结果 |
| --- | --- | --- | --- |
| Intro | name, role, the six chapters | | |
| 01 技能的治理、评测与优化 | the figure, Skills lit; designer-made skills plugged into the design agent: bloated, overlapping, slow | 治理: 基座 / 业务 atomic skills combined on demand; 评测 · 优化: the concurrent test platform — prompts × checks agreed with designers (process checkpoints, ideal outputs) → agent runs the skill → trace drawn as a clockwise cycle around the skill: ① run → ② judge ("better than the last version?") → ③ Revisor proposes a candidate; a version line advances only on kept rounds, a discarded round branches off | 30+ skills governed · 1000+ team uses · typical skills: Token −20.47%, time −21.21% |
| 02 视觉输出的规范、评测与优化 | the figure, the output path lit; the agent's visual outputs follow no shared spec; every run looks different | a design component library + design.md the agent composes every output from; DOM + CV + LLM checks feed back into both the library and design.md | every HTML output of the agent in one visual style |
| 03 PPT 生成模式的设计与开发 | the team makes a lot of decks, so a PPT tool (an App) is designed and built: the figure, Apps lit, over a dashed blueprint of the app to be built | the blueprint becomes the app, built end to end: front-end editor (React · GrapesJS), a PPT agent built on the design agent, back end (FastAPI), template admin; at its heart DSL + 模板 — the agent only writes DSL and a template gives it its look, so generation is stable and templates switch instantly (the DSL stays while the deck re-skins; its fields are illustrative); the editor (编辑 · 预览一体) closes the loop — an element referenced there goes back to the agent, which rewrites only its line of DSL and only that element changes; switching and referencing take turns while the step is read | the app folds back into the Apps bar and the figure lights all three parts; designed and built 0 → 1 |
| 04 NarraSteer | opaque agent; 74% idle, 5/8 saw drift only at the end | the trace, shown as a familiar agent transcript (tool call + result per step), maps into a narrative-space disc: each step explores one rim attribute with the focus (Year) and flies onto that attribute's spoke, whose two ends light up, and the storyline is drawn through them; steering is one chained drag from the storyline's head: each gray candidate the pointer passes over (mouse held) becomes a temporary selection and at once grows the next candidates; releasing commits Unemployment → Inflation → GDP per Capita, which flies back into the transcript as one user steer the agent carries on from | N=16 · +13.2% insights · 15/16 steered by drag · 10/16 intervened mid-run |
| 05 ToA | novices get lost in linear chat; 4/6 failed | the numbered chat re-laid out as an analysis tree: each answer flies into a node, each question onto the edge into it (1–5 in chat order land on different branches); chart signals then grow recommended follow-up nodes that were never asked (dashed); clicking one adds a new turn 6 to the chat | N=12 · +58.3% insights/turn · +17.7% thinking time · −23% turns |
| 06 跨社交媒体舆情分析与治理平台 | monitoring / assessment / handling fragmented | 3-layer IA (大屏 / 仪表盘 / 中台), 5 tech teams | delivered 0 → 1, supporting the National Key R&D Program |
| Outro | name and contact | | |

## Pacing

On-screen time follows reading speed rather than a fixed length (`plan()` in `composition.html`): each step gets
`LEAD + characters / READ_CPS` seconds (1 s + 7.5 characters a second), plus a second or so of `look` for the denser
drawings, rounded up to whole beats of the 96 BPM score. Scenes are authored on a compact animation clock; `warp()`
plays them at 75% speed and then holds the clock still until the step has been read (the loops in 01 and 02 and the
template switching in 03 keep moving on real time during the hold). Editing the copy re-times the whole reel; the composition exports its cue sheet
(`out/timeline.json`) and the score is synthesised from it, so music and picture stay in sync.

## Layout

Everything sits on one grid (`GRID` in `composition.html`): the left column starts at x 120; the illustration panel is
x 780–1800 with its inner box at x 860–1720, and the vertical axis is y 540. In a result frame the comparison card is
right-aligned at 1720 and centred on 540, and the visual beside it is scaled by `fitBox()` into the rest of the row
(40px gutter), also centred on 540. On the opening screen the name block and the contents are each centred on 540, the
contents starting on the panel column. Cards that sit beside a drawing share its top edge.

## Build

```bash
npm install                      # playwright
pip install numpy scipy          # soundtrack
FFMPEG=ffmpeg ./showreel/build.sh
```

- `composition.html` — the whole animation as `renderFrame(t)`. Serve the repo root with any static server and open
  `showreel/composition.html?play` for a realtime preview, or `?t=12` to freeze a moment.
- `render.mjs` — steps every frame in headless Chromium and pipes it to ffmpeg (`--stills 4.2,12.6` for spot checks,
  `--shutter 2` for motion blur, `--timeline-only` to just export the cue sheet). If Playwright's bundled browser is
  missing, set `CHROMIUM=/path/to/chrome`.
- `soundtrack.py` — synthesises the score from `out/timeline.json`. The harmony changes on every step (and every two
  bars within one), each chapter has its own arpeggio figure, density builds from 背景 to 解法 to 结果, and the level
  arcs across the reel; chapter chimes and step ticks mark the cuts.
- `subset-fonts.py` — the reel is set in the site's PingFang (`public/fonts`), which only covers the site's characters.
  This builds a few-KB Noto Sans SC fallback for the characters it lacks (热, 皮肤, 诊断 …). Re-run it after changing
  the Chinese copy.

Fonts: Syne, JetBrains Mono and Noto Sans SC are SIL OFL (licences in `fonts/`).
