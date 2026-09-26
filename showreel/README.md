# Showreel

A 15-second motion-graphics opener for the résumé, built from the site's own content and visual language.
Output: `public/videos/showreel.mp4` (1920×1080, 60 fps, H.264 + AAC).

| Time | Chapter | Source on the site |
| --- | --- | --- |
| 0.0–1.5 | DESIGN · ENGINEERING · AI, with the CAPABILITIES tags | home hero + skills |
| 1.5–4.0 | Alibaba Taotian — AI Design Engineer (skill test platform, evaluate → auto-revise → admit loop, ≈30 skills, 1000+ uses, DOM + CV + LLM output checks) | home experience, résumé |
| 4.0–6.5 | NarraSteer — agent trajectories as storylines in a narrative disc, drag to steer, 15/16 steered | `/narrasteer` |
| 6.5–9.5 | ToA — lost linear chat → analysis tree, signals + REC, real UI, +58.3% insights / turn | `/toa` |
| 9.5–11.75 | Public-opinion platform — frames from the demo, 3-layer IA, 5 teams, 0 → 1 | home works, `yuqing-demo.mp4` |
| 11.75–12.5 | Undergraduate flashes: COCOCREATE, Qi Baishi × AIGC, L3 takeover HMI | project videos |
| 12.5–15.0 | Name over the hero's depth-of-field Möbius band | home hero |

## Build

```bash
npm install                      # playwright
pip install numpy scipy          # soundtrack
FFMPEG=ffmpeg ./showreel/build.sh
```

- `composition.html` — the whole animation as `renderFrame(t)`. Open it through any static server at the repo root
  with `?play` for a realtime preview or `?t=8.5` to freeze a moment.
- `render.mjs` — steps every frame in headless Chromium and pipes it to ffmpeg (`--stills 1.2,6.8` for spot checks).
  If Playwright's bundled browser is missing, set `CHROMIUM=/path/to/chrome`.
- `soundtrack.py` — synthesises the 120 BPM score; cuts and hits line up with the timeline above.
- `prepare-assets.sh` — pulls the stills the reel uses out of `public/` (screenshots and demo videos).

Fonts: Syne and JetBrains Mono (SIL OFL, licences in `fonts/`), PingFang SC from `public/fonts`.
