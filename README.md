# Feiyuan Qu — Personal Website

Personal academic portfolio of Feiyuan Qu, HCI researcher at Zhejiang University CAD&CG Lab.

## Tech Stack

- [Astro 6](https://astro.build/) — static site framework
- TypeScript — typed site scripts
- [Three.js](https://threejs.org/) + [animejs](https://animejs.com/) — hero visual
- Vanilla CSS — no UI library dependencies
- GitHub Actions — automated deployment to GitHub Pages

## Hero: 3D ASCII Artwork

The homepage hero renders morphing 3D shapes offscreen with Three.js, then maps luminance to a four-tier ASCII grid drawn on a 2D canvas.

- Four shapes cycle with staggered morph transitions: Möbius band, analysis tree, helix, and a radiating broadcast core (rays are one-shot Poisson emissions, decoupled from the morph system).
- Each shape carries its own themed word stream (`src/scripts/hero-text.ts`, the single place to edit).
- Debug params: `?heroOnly=N` loops a single shape; `?herofast=1` compresses timings for headless screenshots.

## Local Development

Requires Node.js >= 22.12.

```bash
npm install
npm run dev
```

## Live

[qfy1012.github.io](https://qfy1012.github.io)
