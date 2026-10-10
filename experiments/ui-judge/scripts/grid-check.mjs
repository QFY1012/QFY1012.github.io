// Rubric 2.4: check a page against the grid that fits it best, whether or not
// it was designed on one.
//
//   node scripts/grid-check.mjs   → out/gridcheck/<page>.json, <page>.png (overlay)
//
// 1. Blocks. Walk the page: a box with a border, fill or shadow is one block (its
//    inside is not walked: a card is judged by its frame); text, a chart or a
//    table outside boxes is one block. Small tags (< 44px high) count as text.
//    Full-width bands (a hero background) are not blocks; their content is.
// 2. Horizontal grid. Every n columns (1–16) and gutter (0–48px) between the
//    leftmost and rightmost edge (the frame may reach 8px past them); a box, chart or table fits when both its edges
//    sit on column lines, text when its left or its right edge does (± 2px).
//    The grid that fits the most blocks wins, the fewer columns on a tie.
// 3. Vertical unit. The gap from each block to the nearest block above it;
//    the unit (4–24px) whose multiples hold the most gaps (± 0.75px), larger on a tie.
// Passes when every block and every gap fits.
import fs from "node:fs"
import path from "node:path"
import http from "node:http"
import { chromium } from "playwright-core"

const ROOT = path.resolve(import.meta.dirname, "..")
const SRC = path.join(ROOT, "validate", "pages")
const OUT = path.join(ROOT, "out", "gridcheck")
fs.mkdirSync(OUT, { recursive: true })
const TOL_X = 2
const TOL_Y = 0.75
const UNITS = [24, 16, 12, 10, 8, 6, 5, 4]

const MIME = { ".html": "text/html", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff" }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname))
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return res.writeHead(404).end()
  res.writeHead(200, { "content-type": MIME[path.extname(p)] ?? "application/octet-stream" })
  fs.createReadStream(p).pipe(res)
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const base = `http://127.0.0.1:${server.address().port}`

// Runs in the page.
function collect() {
  const vw = document.documentElement.clientWidth
  const sy = scrollY
  const clear = (c) => !c || c === "transparent" || /rgba\(.*,\s*0\)$/.test(c)
  const boxed = (cs) =>
    ["Top", "Right", "Bottom", "Left"].some((s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== "none" && !clear(cs[`border${s}Color`])) ||
    !clear(cs.backgroundColor) || cs.backgroundImage !== "none" || cs.boxShadow !== "none"
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  const textRect = (el) => {
    const r = document.createRange()
    r.selectNodeContents(el)
    const rs = [...r.getClientRects()].filter((x) => x.width > 0.5 && x.height > 0.5)
    if (!rs.length) return null
    return { l: Math.min(...rs.map((x) => x.left)), r: Math.max(...rs.map((x) => x.right)) }
  }
  const blocks = []
  const add = (el, kind, h) => {
    const b = el.getBoundingClientRect()
    const name = (el.className && typeof el.className === "string" ? `.${el.className.split(" ")[0]}` : "") || el.tagName.toLowerCase()
    blocks.push({ kind, name: `${el.tagName.toLowerCase()}${name.startsWith(".") ? name : ""}`, text: (el.textContent || "").trim().slice(0, 24), l: h.l, r: h.r, top: b.top + sy, bottom: b.bottom + sy, bl: b.left, br: b.right })
  }
  const walk = (el) => {
    for (const c of el.children) {
      const cs = getComputedStyle(c)
      if (cs.display === "none" || cs.visibility === "hidden" || ["STYLE", "SCRIPT", "LINK", "BR"].includes(c.tagName)) continue
      const b = c.getBoundingClientRect()
      if (b.width < 1 || b.height < 1) continue
      const tag = c.tagName
      if (["svg", "SVG", "IMG", "CANVAS", "TABLE"].includes(tag) || tag.toLowerCase() === "svg") { add(c, "figure", { l: b.left, r: b.right }); continue }
      if (boxed(cs)) {
        if (b.width >= vw - 2) { walk(c); continue } // full-width band
        if (b.height < 44 && !c.querySelector("div,p,table,svg,ul,ol")) { const t = textRect(c); if (t) add(c, "text", { l: b.left, r: b.right }); continue }
        add(c, "box", { l: b.left, r: b.right })
        continue
      }
      if (ownText(c) || (c.children.length === 0 && c.textContent.trim())) {
        const t = textRect(c)
        if (t) add(c, "text", t)
        continue
      }
      walk(c)
    }
  }
  walk(document.body)
  return { vw, height: document.documentElement.scrollHeight, blocks }
}

function fitGrid(blocks) {
  const m0 = Math.min(...blocks.map((b) => b.l))
  const M0 = Math.max(...blocks.map((b) => b.r))
  let best = null
  // Text edges stop at the last glyph, a little short of the column line, so the
  // frame may reach up to 8px past the outermost edges.
  for (let dm = 0; dm <= 2; dm++)
  for (let dM = 0; dM <= 8; dM++)
  for (let n = 1; n <= 16; n++)
    for (let g = 0; g <= 48; g++) {
      const m = m0 - dm
      const W = M0 + dM - m
      const c = (W - (n - 1) * g) / n
      if (c < 24) continue
      const L = Array.from({ length: n }, (_, k) => m + k * (c + g))
      const R = L.map((x) => x + c)
      const onL = (x) => L.some((y) => Math.abs(x - y) <= TOL_X)
      const onR = (x) => R.some((y) => Math.abs(x - y) <= TOL_X)
      const fits = blocks.map((b) => (b.kind === "text" ? onL(b.l) || onR(b.r) : onL(b.l) && onR(b.r)))
      const k = fits.filter(Boolean).length
      if (!best || k > best.k || (k === best.k && n < best.n)) best = { n, g, c, m, W, L, R, fits, k }
    }
  return best
}

function gaps(blocks) {
  const out = []
  for (const [i, b] of blocks.entries()) {
    let above = null
    for (const [j, a] of blocks.entries()) {
      if (i === j || a.bottom > b.top + 0.5) continue
      if (Math.min(a.r, b.r) - Math.max(a.l, b.l) <= 0 && Math.min(a.br, b.br) - Math.max(a.bl, b.bl) <= 0) continue
      if (!above || a.bottom > above.a.bottom) above = { a, j }
    }
    if (above) out.push({ from: above.j, to: i, y: above.a.bottom, gap: b.top - above.a.bottom, x: Math.max(Math.max(above.a.l, b.l), Math.min(above.a.l, b.l)) })
  }
  return out
}

function fitUnit(gs) {
  const ok = (v, u) => Math.abs(v - Math.round(v / u) * u) <= TOL_Y
  let best = null
  for (const u of UNITS) {
    const fits = gs.map((g) => ok(g.gap, u))
    const k = fits.filter(Boolean).length
    if (!best || k > best.k) best = { u, fits, k }
  }
  return best
}

// Overlay: column bands, blocks outlined green (on the grid) or red (off), red off-unit gaps.
function overlay({ grid, blocks, gs, unit, height }) {
  const root = document.createElement("div")
  root.style.cssText = `position:absolute;left:0;top:0;width:100%;height:${height}px;pointer-events:none;z-index:99999`
  for (let k = 0; k < grid.n; k++) {
    const d = document.createElement("div")
    d.style.cssText = `position:absolute;top:0;height:${height}px;left:${grid.L[k]}px;width:${grid.c}px;background:rgba(236,72,153,.07);border-left:1px solid rgba(236,72,153,.35);border-right:1px solid rgba(236,72,153,.35)`
    root.appendChild(d)
  }
  blocks.forEach((b, i) => {
    const d = document.createElement("div")
    const ok = grid.fits[i]
    d.style.cssText = `position:absolute;left:${b.l - 1}px;top:${b.top - 1}px;width:${b.r - b.l + 2}px;height:${b.bottom - b.top + 2}px;outline:${ok ? "1.5px solid rgba(22,163,74,.7)" : "2.5px solid #dc2626"};${ok ? "" : "background:rgba(220,38,38,.08)"}`
    root.appendChild(d)
  })
  gs.forEach((g, i) => {
    if (unit.fits[i] || g.gap < 0.5) return
    const d = document.createElement("div")
    d.style.cssText = `position:absolute;left:${g.x - 3}px;top:${g.y}px;width:3px;height:${g.gap}px;background:#2563eb`
    const t = document.createElement("div")
    t.textContent = Math.round(g.gap * 10) / 10
    t.style.cssText = `position:absolute;left:${g.x - 40}px;top:${g.y + g.gap / 2 - 8}px;width:34px;text-align:right;font:600 11px/16px sans-serif;color:#fff;background:#2563eb;border-radius:3px;padding:0 3px`
    root.appendChild(d)
    root.appendChild(t)
  })
  document.body.appendChild(root)
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const summary = []
for (const f of fs.readdirSync(SRC).filter((f) => f.endsWith(".html")).sort()) {
  const name = f.replace(/\.html$/, "")
  const page = await ctx.newPage()
  await page.goto(`${base}/validate/pages/${f}`, { waitUntil: "networkidle" })
  await page.evaluate(() => document.fonts.ready)
  const { blocks, height } = await page.evaluate(collect)
  const grid = fitGrid(blocks)
  const gs = gaps(blocks)
  const unit = fitUnit(gs)
  await page.evaluate(overlay, { grid, blocks, gs, unit, height })
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true })
  await page.close()
  const r1 = (v) => Math.round(v * 10) / 10
  const res = {
    page: name,
    grid: { columns: grid.n, column: r1(grid.c), gutter: grid.g, left: r1(grid.m), width: r1(grid.W) },
    blocks: { total: blocks.length, onGrid: grid.k, off: blocks.filter((_, i) => !grid.fits[i]).map((b) => ({ kind: b.kind, name: b.name, text: b.text, l: r1(b.l), r: r1(b.r) })) },
    vertical: { unit: unit.u, total: gs.length, onUnit: unit.k, off: gs.filter((_, i) => !unit.fits[i]).map((g) => r1(g.gap)) },
  }
  res.raw = blocks.map((b, i) => ({ ...b, onGrid: grid.fits[i] }))
  res.pass = res.blocks.onGrid === res.blocks.total && res.vertical.onUnit === res.vertical.total
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(res, null, 1))
  summary.push(res)
  console.log(`${name}  ${grid.n} 栏 ${r1(grid.c)}/${grid.g}  块 ${grid.k}/${blocks.length}  纵向 ${unit.u}px ${unit.k}/${gs.length}  ${res.pass ? "通过" : "不通过"}`)
}
fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 1))
await browser.close()
server.close()
