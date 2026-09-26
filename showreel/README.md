# Showreel

The opener for the résumé: white, restrained, and built entirely from the site's content and the internship
write-up. Every visual is redrawn in `composition.html` (no screenshots). Output: `public/videos/showreel.mp4`
(1920×1080, 60 fps, H.264 + AAC, about two minutes).

Each chapter is told the same way — **背景 → 解法 → 结果** — with earlier steps kept on screen.

| Chapter | 背景 | 解法 | 结果 |
| --- | --- | --- | --- |
| Intro | name, role, the six chapters | | |
| 01 Skill 的治理、评测与优化 | designer-made skills plugged into the design agent: bloated, overlapping, slow | 治理: 基座 / 业务 atomic skills combined on demand; 评测 · 优化: the concurrent test platform — prompts × checks agreed with designers (process checkpoints, ideal outputs) → agent runs the skill → trace drawn as a clockwise cycle around the skill: ① run → ② judge ("better than the last version?") → ③ Revisor proposes a candidate; a version line advances only on kept rounds, a discarded round branches off | 30+ skills governed · 1000+ team uses · typical skills: Token −20.47%, time −21.21% |
| 02 视觉输出组件库的建立、评测与优化 | the agent's visual outputs follow no shared spec; every run looks different | a design component library + design.md the agent composes every output from; DOM + CV + LLM checks feed back into both the library and design.md | every HTML output of the agent in one visual style |
| 03 PPT 生成模式 | product and operations staff make a lot of decks and want to tweak an AI draft, not lay slides out from scratch | 设计: the editing interaction and a set of PPT templates; 开发: front-end editor, generation service, template admin | the mode end to end (enter → pick a template → generate → tweak); designed and built 0 → 1 |
| 04 NarraSteer | opaque agent; 74% idle, 5/8 saw drift only at the end | the trace, a timeline of steps, maps into a narrative-space disc: each step flies to the attribute it analyses and the storyline is drawn through them; drag to steer | N=16 · +13.2% insights · 15/16 steered by drag · 10/16 intervened mid-run |
| 05 ToA | novices get lost in linear chat; 4/6 failed | chat → analysis tree; chart signals suggest next queries | N=12 · +58.3% insights/turn · +17.7% thinking time · −23% turns |
| 06 跨社交媒体舆情分析与治理平台 | monitoring / assessment / handling fragmented | 3-layer IA (大屏 / 仪表盘 / 中台), 5 tech teams | delivered 0 → 1, supporting the National Key R&D Program |
| Outro | name and contact | | |

## Pacing

On-screen time follows reading speed rather than a fixed length (`plan()` in `composition.html`): each step gets
`LEAD + characters / READ_CPS` seconds (1 s + 7.5 characters a second), plus a second or so of `look` for the denser
drawings, rounded up to whole beats of the 96 BPM score. Scenes are authored on a compact animation clock; `warp()`
plays them at 75% speed and then holds the clock still until the step has been read (the loops in 01 and 02 keep
moving on real time during the hold). Editing the copy re-times the whole reel; the composition exports its cue sheet
(`out/timeline.json`) and the score is synthesised from it, so music and picture stay in sync.

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
