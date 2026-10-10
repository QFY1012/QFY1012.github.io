// Shared pieces for the hand-written style pages (scripts/build-style-pages.mjs):
// the HTML shell with local fonts, two SVG/HTML chart helpers, and the
// screenshot, which matches the renderer's (a 1440px viewport clipped to the
// middle 1248px, full page height).
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright-core"

export const ROOT = path.resolve(import.meta.dirname, "..")
export const readData = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, "data", `${name}.json`), "utf8"))

// Fonts available to the pages: "Noto Sans SC" (300–600), "Noto Serif SC" (400, 600), "IBM Plex Mono" (400, 500).
const font = (pkg, w) => `<link rel="stylesheet" href="file://${path.join(ROOT, "node_modules", "@fontsource", pkg, `${w}.css`)}">`
const FONTS = [300, 400, 500, 600].map((w) => font("noto-sans-sc", w)).join("") +
  [400, 600].map((w) => font("noto-serif-sc", w)).join("") + [400, 500].map((w) => font("ibm-plex-mono", w)).join("")

export const num = (v) => v.toLocaleString("en-US")
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
export const pct = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`

// A whole page: css goes in <style>, body is the markup.
export const doc = (css, body) => `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">${FONTS}<style>
*{box-sizing:border-box;margin:0;padding:0}
body{-webkit-font-smoothing:antialiased;text-spacing-trim:trim-start}
table{border-collapse:collapse;width:100%}
${css}</style></head><body>${body}</body></html>`

// A line as SVG. points: [{x: label, y: value, lo?, hi?}]; ticks: y gridlines
// (the first and last set the range); xEvery: label every n-th point (and the
// last); band: draw lo..hi as a shaded range; zero: a line at 0; last: label
// the last point (true, or the text to show).
export function line({ w, h, points, ticks, range, xEvery = 1, stroke = "#111", grid = "#e5e5e5", text = "#888", fill, band, bandFill = "rgba(0,0,0,.07)", zero, last = true, font = "inherit", size = 12, pad = [16, 40, 24, 36], width = 1.75, dots }) {
  const [pt, pr, pb, pl] = pad
  const [lo, hi] = range ?? [ticks[0], ticks[ticks.length - 1]]
  const x = (i) => pl + (points.length === 1 ? 0 : (i / (points.length - 1)) * (w - pl - pr))
  const y = (v) => pt + (1 - (v - lo) / (hi - lo)) * (h - pt - pb)
  const xy = points.map((p, i) => `${x(i).toFixed(1)},${y(p.y).toFixed(1)}`)
  const g = ticks.map((v) => `<line x1="${pl}" x2="${w - pr}" y1="${y(v)}" y2="${y(v)}" stroke="${grid}"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")
  // every xEvery-th label, plus the last point's when it is not crowded by the one before
  const xs = points.map((p, i) => i % xEvery === 0 || (i === points.length - 1 && i % xEvery >= xEvery / 2)
    ? `<text x="${x(i)}" y="${h - 4}" text-anchor="middle">${esc(p.x)}</text>` : "").join("")
  const area = fill ? `<polygon points="${pl},${y(lo)} ${xy.join(" ")} ${w - pr},${y(lo)}" fill="${fill}"/>` : ""
  const bd = band ? `<polygon points="${points.map((p, i) => `${x(i)},${y(p.hi)}`).join(" ")} ${points.map((p, i) => `${x(i)},${y(p.lo)}`).reverse().join(" ")}" fill="${bandFill}"/>` : ""
  const z = zero ? `<line x1="${pl}" x2="${w - pr}" y1="${y(0)}" y2="${y(0)}" stroke="${text}" stroke-opacity=".6"/>` : ""
  const n = points.length - 1, lp = points[n]
  const lab = last ? `<circle cx="${x(n)}" cy="${y(lp.y)}" r="3.5" fill="${stroke}"/><text x="${x(n) - 8}" y="${y(lp.y) - 10}" text-anchor="end" style="fill:${stroke};font-weight:500">${esc(last === true ? lp.y : last)}</text>` : ""
  const ds = dots ? points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.y)}" r="2.5" fill="${stroke}"/>`).join("") : ""
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;font-family:${font};font-size:${size}px;fill:${text}">${g}${bd}${area}${z}${xs}
<polyline points="${xy.join(" ")}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>${ds}${lab}</svg>`
}

// Horizontal bars as rows: label, a bar scaled to max, the value. items: [{label, value, display}].
export const bars = (items, { max, color = "#111", track = "#eee", labelW = 84, h = 6, gap = 14, valueW = 48, radius = 3, colors }) =>
  `<div style="display:flex;flex-direction:column;gap:${gap}px">${items.map((it, i) => `<div style="display:grid;grid-template-columns:${labelW}px 1fr ${valueW}px;align-items:center;gap:12px">
<span>${esc(it.label)}</span><div style="height:${h}px;background:${track};border-radius:${radius}px"><div style="height:100%;width:${(Math.max(0, it.value) / max) * 100}%;background:${colors?.[i % colors.length] ?? color};border-radius:${radius}px"></div></div><span class="num" style="text-align:right">${esc(it.display)}</span></div>`).join("")}</div>`

// Write each page to out/style/<prefix>-<v>/page.html and screenshot it.
export async function shoot(prefix, pages) {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  for (const [v, html] of Object.entries(pages)) {
    const dir = path.join(ROOT, "out", "style", `${prefix}-${v}`)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, "page.html"), html)
    await page.goto(`file://${path.join(dir, "page.html")}`)
    await page.evaluate(() => document.fonts.ready)
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.screenshot({ path: path.join(dir, "shot.png"), clip: { x: 96, y: 0, width: 1248, height }, fullPage: true })
    console.log(`${prefix}-${v}`, height)
  }
  await browser.close()
}
