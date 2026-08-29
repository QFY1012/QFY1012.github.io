# Feiyuan Qu — Personal Website

Personal academic portfolio of Feiyuan Qu, HCI researcher at Zhejiang University CAD&CG Lab.

## Tech Stack

- [Astro 6](https://astro.build/) — static site framework
- TypeScript — typed site scripts
- Vanilla CSS — no UI framework
- [three.js](https://threejs.org/) + [anime.js](https://animejs.com/) — WebGL point-sprite hero with anime-driven spin
- GitHub Actions — automated deployment to GitHub Pages

## Hero: Depth-of-Field Point Rendering

The homepage hero renders a slowly spinning Möbius band as a depth-of-field point cloud (inconvergent-style): ~420k points are uniformly sampled across the band's surface, each carrying a random unit direction. A vertex shader displaces every point along its direction by a circle-of-confusion radius `r = coc·|focus − depth|^e` — in-focus regions stay crisp while out-of-focus regions scatter apart and the shape dissolves into haze. Sprites themselves stay tiny; additive blending accumulates density into brightness. anime.js drives the constant-speed spin.

- All visual parameters live in `src/scripts/hero-particles.ts` (`CFG`); append `?debug=1` to the URL for a live tuning panel (position / scale / rotation / focus / blur / spin).

## Local Development

Requires Node.js >= 22.12.

```bash
npm install
npm run dev
```

## Live

[qfy1012.github.io](https://qfy1012.github.io)
