# Showreel

The opener for the résumé: white, restrained, and built entirely from the site's content and the internship
write-up. Every visual is redrawn in `composition.html` (no screenshots). Output: `public/videos/showreel.mp4`
(1920×1080, 60 fps, H.264 + AAC, about two and a half minutes).

Each chapter is told the same way — **背景 → 解法 → 结果** — with earlier steps kept on screen.

| Chapter | 背景 | 解法 | 结果 |
| --- | --- | --- | --- |
| Intro | name, role, the six chapters | | |
| 01 Skill 的治理、评测与优化 | designer-made skills plugged into the design agent: bloated, overlapping, slow | 治理: 基座 / 业务 atomic skills + admission rules; 评测: concurrent test platform + checker agent; 优化: test → diagnose → iterate | 30+ skills governed · 1000+ team uses · three skills: Token −20.47%, time −21.21% |
| 02 输出组件库的建立、测试与优化 | skill output ignores the visual spec; prompt-generated HTML drifts | React library on shadcn/ui (atomic components + slots); DOM + CV + LLM checks drive the agent to revise its HTML in a loop | adopted as the team's acceptance standard |
| 03 PPT 文档生成小工具 | the author's PPT-generation skill only lives in chat; one skin per platform | edit-first editor with limited editable units; template / DSL generator / skin renderer as separate modules, one skin library | built 0 → 1: React + GrapesJS, a PPT agent on the design agent, FastAPI + MySQL / OSS |
| 04 NarraSteer | opaque agent; 74% idle, 5/8 saw drift only at the end | trajectory → storyline in a narrative-space disc; drag to steer | N=16 · +13.2% insights · 15/16 steered by drag · 10/16 intervened mid-run |
| 05 ToA | novices get lost in linear chat; 4/6 failed | chat → analysis tree; chart signals suggest next queries | N=12 · +58.3% insights/turn · +17.7% thinking time · −23% turns |
| 06 跨社交媒体舆情分析与治理平台 | monitoring / assessment / handling fragmented | 3-layer IA (大屏 / 仪表盘 / 中台), 5 tech teams | delivered 0 → 1, supporting the National Key R&D Program |
| Outro | name and contact | | |

## Pacing

On-screen time follows reading speed rather than a fixed length (`plan()` in `composition.html`): each step gets
`LEAD + characters / READ_CPS` seconds (1.25 s + 6 characters a second), rounded up to whole beats of the 96 BPM
score. Scenes are authored on a compact animation clock; `warp()` plays them at 60% speed and then holds until the
step has been read. Editing the copy re-times the whole reel; the composition exports its cue sheet
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
- `soundtrack.py` — synthesises the score from `out/timeline.json`: chapter chimes, step ticks, an arpeggio that fills
  in from each 解法.
- `subset-fonts.py` — the reel is set in the site's PingFang (`public/fonts`), which only covers the site's characters.
  This builds a few-KB Noto Sans SC fallback for the characters it lacks (热, 皮肤, 诊断 …). Re-run it after changing
  the Chinese copy.

Fonts: Syne, JetBrains Mono and Noto Sans SC are SIL OFL (licences in `fonts/`).
