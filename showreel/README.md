# Showreel

A 60-second opener for the résumé: white, restrained, and built entirely from the site's own content.
Every visual is redrawn in `composition.html` — no screenshots. Output: `public/videos/showreel.mp4`
(1920×1080, 60 fps, H.264 + AAC).

Each project is told the same way — **背景 → 解法 → 结果** — with earlier steps kept on screen so there is time to read. Each project gets 12.5 s; motion inside runs at about half speed
(see `PROJECT_CLOCK` in `composition.html`).

| Time | Chapter | 背景 | 解法 | 结果 |
| --- | --- | --- | --- | --- |
| 0–5 | Intro: name, role, the four projects | | | |
| 5–17.5 | 01 阿里巴巴淘天 · 设计 Agent 的 Skill 标准化 | skills keep growing; admission and output need one standard | 4-dimension test platform + auto-revise loop; Radix UI components + DOM/CV/LLM checks | ~30 skills admitted · 1000+ team uses · became the team's acceptance standard |
| 17.5–30 | 02 NarraSteer | opaque agent; 74% idle, 5/8 saw drift only at the end | trajectory → storyline in a narrative-space disc; drag to steer | N=16 · +13.2% insights · 15/16 steered by drag · 10/16 intervened mid-run |
| 30–42.5 | 03 ToA | novices get lost in linear chat; 4/6 failed | chat → analysis tree; chart signals suggest next queries | N=12 · +58.3% insights/turn · +17.7% thinking time · −23% turns |
| 42.5–55 | 04 跨社交媒体舆情分析与治理平台 | monitoring / assessment / handling fragmented | 3-layer IA (大屏 / 仪表盘 / 中台), 5 tech teams | delivered 0 → 1, supporting the National Key R&D Program |
| 55–60 | Outro: name and contact | | | |

## Build

```bash
npm install                      # playwright
pip install numpy scipy          # soundtrack
FFMPEG=ffmpeg ./showreel/build.sh
```

- `composition.html` — the whole animation as `renderFrame(t)`. Serve the repo root with any static server and open
  `showreel/composition.html?play` for a realtime preview, or `?t=12` to freeze a moment.
- `render.mjs` — steps every frame in headless Chromium and pipes it to ffmpeg (`--stills 4.2,12.6` for spot checks,
  `--shutter 2` for motion blur). If Playwright's bundled browser is missing, set `CHROMIUM=/path/to/chrome`.
- `soundtrack.py` — synthesises the 96 BPM score; chapter chimes and step ticks line up with the timeline above.

Chinese copy only uses characters present in the site's PingFang subset (`public/fonts`), so it renders without fallback.
Fonts: Syne and JetBrains Mono (SIL OFL, licences in `fonts/`).
