// Rubric 2.4: check a page against the grid that fits it best, whether or not
// it was designed on one. Every level is checked: the page, and inside every box.
//
//   node scripts/grid-check.mjs   → out/gridcheck/<page>.json, <page>.png (overlay)
//
// 1. Blocks. Walk the page.
//    - A box (fill, shadow, or a border on two or more sides) is a block on its
//      container's grid, and a container itself: what is inside it is checked
//      against a grid fitted to its own content (so an even inset is fine).
//    - A rule (a border on one side only) is a line, not a container: a horizontal
//      rule must start and end on column lines, a vertical one sit on a line;
//      its content stays on the same grid as the rule.
//    - Text, a chart, a table is a block. Small tags (< 44px high, no blocks
//      inside) count as text: a tag by its outline, a title strip as wide as its
//      container by where its text is. Full-width bands (a hero background) are
//      not blocks; their content is.
// 2. Horizontal grid, per container. Every n columns (1–16) and gutter (0–48px,
//    in steps of 4, so the fit cannot invent a 31px gutter), from the leftmost
//    to the rightmost edge in the container (the frame may reach 8px past them,
//    as text stops short of the line). A box, chart, table or horizontal rule
//    fits when both its edges sit on column lines, text when its left or its
//    right edge does (± 2px). The grid that fits the most blocks wins, less a
//    quarter block per column (more columns land more edges by chance); on a
//    tie, the grid the edges sit closest to.
// 3. Vertical unit, per container. The gap from each block to the nearest block
//    above it in the same container; the unit (4–24px) whose multiples hold the
//    most gaps (± 0.75px), larger on a tie.
// Passes when every block and every gap fits, at every level.
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

// Runs in the page: blocks with the container (-1 = page) each belongs to.
function collect() {
  const vw = document.documentElement.clientWidth
  const sy = scrollY
  const clear = (c) => !c || c === "transparent" || /rgba\(.*,\s*0\)$/.test(c)
  const sides = (cs) => ["Top", "Right", "Bottom", "Left"].filter((s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== "none" && !clear(cs[`border${s}Color`]))
  const filled = (cs) => !clear(cs.backgroundColor) || cs.backgroundImage !== "none" || cs.boxShadow !== "none"
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  const textRect = (el) => {
    const r = document.createRange()
    r.selectNodeContents(el)
    const rs = [...r.getClientRects()].filter((x) => x.width > 0.5 && x.height > 0.5)
    if (!rs.length) return null
    return { l: Math.min(...rs.map((x) => x.left)), r: Math.max(...rs.map((x) => x.right)) }
  }
  const blocks = []
  const add = (el, kind, h, parent, extra = {}) => {
    const b = el.getBoundingClientRect()
    const cls = typeof el.className === "string" && el.className ? `.${el.className.split(" ")[0]}` : ""
    blocks.push({ kind, parent, name: `${el.tagName.toLowerCase()}${cls}`, text: (el.textContent || "").trim().slice(0, 24), l: h.l, r: h.r, top: b.top + sy, bottom: b.bottom + sy, bl: b.left, br: b.right, ...extra })
    return blocks.length - 1
  }
  const walk = (el, parent) => {
    for (const c of el.children) {
      const cs = getComputedStyle(c)
      if (cs.display === "none" || cs.visibility === "hidden" || ["STYLE", "SCRIPT", "LINK", "BR"].includes(c.tagName)) continue
      if (cs.display === "contents") { walk(c, parent); continue }
      const b = c.getBoundingClientRect()
      if (b.width < 1 || b.height < 1) continue
      if (["svg", "IMG", "CANVAS", "TABLE"].includes(c.tagName)) { add(c, "figure", { l: b.left, r: b.right }, parent); continue }
      const s = sides(cs)
      const isBox = filled(cs) || s.length >= 2
      if (isBox && b.width >= vw - 2) { walk(c, parent); continue } // full-width band
      if (isBox && b.height < 44 && !c.querySelector("div,p,table,svg,ul,ol")) {
        // A tag or pill is measured by its outline; a bar as wide as its container
        // (a title strip) is a band, measured where its text is.
        const bar = b.width >= 0.9 * c.parentElement.getBoundingClientRect().width
        const t = textRect(c)
        if (t) add(c, "text", bar ? t : { l: b.left, r: b.right }, parent)
        continue
      }
      if (isBox) {
        const i = add(c, "box", { l: b.left, r: b.right }, parent)
        walk(c, i)
        continue
      }
      // A one-sided border is a rule on the container's grid.
      if (s.length === 1) {
        if (s[0] === "Top" || s[0] === "Bottom") add(c, "rule", { l: b.left, r: b.right }, parent, { ry: s[0] === "Top" ? b.top + sy : b.bottom + sy })
        else { const x = s[0] === "Left" ? b.left : b.right; add(c, "vrule", { l: x, r: x }, parent) }
      }
      if (ownText(c) || (c.children.length === 0 && c.textContent.trim())) {
        const t = textRect(c)
        if (t) add(c, "text", t, parent)
        continue
      }
      walk(c, parent)
    }
  }
  walk(document.body, -1)
  return { height: document.documentElement.scrollHeight, blocks }
}

const bothEdges = (k) => k === "box" || k === "figure" || k === "rule"
function fitGrid(items) {
  const m0 = Math.min(...items.map((b) => b.l))
  const M0 = Math.max(...items.map((b) => b.r))
  let best = null
  for (let dm = 0; dm <= 2; dm++)
    for (let dM = 0; dM <= 8; dM++)
      for (let n = 1; n <= 16; n++)
        for (let g = 0; g <= 48; g += 4) {
          const m = m0 - dm
          const W = M0 + dM - m
          const c = (W - (n - 1) * g) / n
          if (c < 24) continue
          const L = Array.from({ length: n }, (_, k) => m + k * (c + g))
          const R = L.map((x) => x + c)
          const dL = (x) => Math.min(...L.map((y) => Math.abs(x - y)))
          const dR = (x) => Math.min(...R.map((y) => Math.abs(x - y)))
          // distance of each block from its lines; Infinity when it does not fit
          const dist = items.map((b) => {
            const d = b.kind === "vrule" ? Math.min(dL(b.l), dR(b.l)) : bothEdges(b.kind) ? Math.max(dL(b.l), dR(b.r)) : Math.min(dL(b.l), dR(b.r))
            return d <= TOL_X ? d : Infinity
          })
          const fits = dist.map((d) => d !== Infinity)
          const k = fits.filter(Boolean).length
          const err = dist.filter((d) => d !== Infinity).reduce((a, d) => a + d, 0)
          // More columns land more edges by chance: four more columns must place
          // at least one more block to win.
          const score = k - n / 4
          if (!best || score > best.score || (score === best.score && err < best.err)) best = { n, g, c, m, W, L, R, fits, k, score, err }
        }
  return best
}

function gaps(items) {
  const out = []
  const stacked = items.filter((b) => b.kind !== "vrule")
  for (const b of stacked) {
    let above = null
    for (const a of stacked) {
      if (a === b || a.bottom > b.top + 0.5) continue
      if (Math.min(a.br, b.br) - Math.max(a.bl, b.bl) <= 0) continue
      if (!above || a.bottom > above.bottom) above = a
    }
    if (above) out.push({ y: above.bottom, gap: b.top - above.bottom, x: Math.max(above.bl, b.bl) })
  }
  return out
}

function fitUnit(gs) {
  const ok = (v, u) => Math.abs(v - Math.round(v / u) * u) <= TOL_Y
  let best = { u: UNITS[0], fits: [], k: 0 }
  for (const u of UNITS) {
    const fits = gs.map((g) => ok(g.gap, u))
    const k = fits.filter(Boolean).length
    if (k > best.k || best.fits.length !== gs.length) best = { u, fits, k }
  }
  return best
}

// Overlay: page columns in pink, box columns in orange (inside the box only),
// blocks green (on their grid) or red (off), off-unit gaps blue with their size.
function overlay({ levels, blocks, height }) {
  const root = document.createElement("div")
  root.style.cssText = `position:absolute;left:0;top:0;width:100%;height:${height}px;pointer-events:none;z-index:99999`
  const el = (css, text) => { const d = document.createElement("div"); d.style.cssText = "position:absolute;" + css; if (text) d.textContent = text; root.appendChild(d); return d }
  for (const lv of levels) {
    const top = lv.box ? lv.box.top : 0
    const h = lv.box ? lv.box.bottom - lv.box.top : height
    const col = lv.box ? "249,115,22" : "236,72,153"
    for (let k = 0; k < lv.grid.n; k++)
      el(`top:${top}px;height:${h}px;left:${lv.grid.L[k]}px;width:${lv.grid.c}px;background:rgba(${col},${lv.box ? 0.06 : 0.07});border-left:1px solid rgba(${col},.4);border-right:1px solid rgba(${col},.4)`)
  }
  for (const b of blocks) {
    const ok = b.onGrid
    if (b.kind === "vrule") { el(`left:${b.l - 1.5}px;top:${b.top}px;width:3px;height:${b.bottom - b.top}px;background:${ok ? "rgba(22,163,74,.8)" : "#dc2626"}`); continue }
    if (b.kind === "rule") { el(`left:${b.l}px;top:${b.ry - 1.5}px;width:${b.r - b.l}px;height:3px;background:${ok ? "rgba(22,163,74,.8)" : "#dc2626"}`); continue }
    const fill = ok || b.kind === "box" ? "" : "background:rgba(220,38,38,.08)"
    el(`left:${b.l - 1}px;top:${b.top - 1}px;width:${b.r - b.l + 2}px;height:${b.bottom - b.top + 2}px;outline:${ok ? "1.5px solid rgba(22,163,74,.7)" : "2.5px solid #dc2626"};${fill}`)
  }
  for (const lv of levels)
    lv.gaps.forEach((g, i) => {
      if (lv.unit.fits[i] || g.gap < 0.5) return
      el(`left:${g.x - 3}px;top:${g.y}px;width:3px;height:${g.gap}px;background:#2563eb`)
      el(`left:${g.x - 40}px;top:${g.y + g.gap / 2 - 8}px;width:34px;text-align:right;font:600 11px/16px sans-serif;color:#fff;background:#2563eb;border-radius:3px;padding:0 3px`, String(Math.round(g.gap * 10) / 10))
    })
  document.body.appendChild(root)
}

const r1 = (v) => Math.round(v * 10) / 10
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const summary = []
for (const f of fs.readdirSync(SRC).filter((f) => f.endsWith(".html")).sort()) {
  const name = f.replace(/\.html$/, "")
  const page = await ctx.newPage()
  await page.goto(`${base}/validate/pages/${f}`, { waitUntil: "networkidle" })
  await page.evaluate(() => document.fonts.ready)
  const { blocks, height } = await page.evaluate(collect)

  // One level per container: the page, then every box that holds blocks.
  const containers = [-1, ...blocks.map((b, i) => i).filter((i) => blocks[i].kind === "box")]
  const levels = []
  for (const ci of containers) {
    const items = blocks.filter((b) => b.parent === ci)
    if (!items.length) continue
    const box = ci < 0 ? null : blocks[ci]
    const grid = fitGrid(items)
    items.forEach((b, j) => (b.onGrid = grid.fits[j]))
    const gs = gaps(items)
    levels.push({ ci, box, grid, gaps: gs, unit: fitUnit(gs), items })
  }
  await page.evaluate(overlay, { levels: levels.map(({ items, ...l }) => l), blocks, height })
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true })
  await page.close()

  const lvOut = levels.map((lv) => ({
    container: lv.box ? `${lv.box.name}「${lv.box.text.slice(0, 10)}」` : "整页",
    grid: { columns: lv.grid.n, column: r1(lv.grid.c), gutter: lv.grid.g, left: r1(lv.grid.m), width: r1(lv.grid.W) },
    blocks: lv.items.length,
    onGrid: lv.grid.k,
    off: lv.items.filter((b) => !b.onGrid).map((b) => ({ kind: b.kind, name: b.name, text: b.text, l: r1(b.l), r: r1(b.r) })),
    unit: lv.unit.u,
    gaps: lv.gaps.length,
    onUnit: lv.unit.k,
    offGaps: lv.gaps.filter((_, i) => !lv.unit.fits[i]).map((g) => r1(g.gap)),
  }))
  const tot = (k) => lvOut.reduce((a, l) => a + l[k], 0)
  const res = { page: name, levels: lvOut, blocks: tot("blocks"), onGrid: tot("onGrid"), gaps: tot("gaps"), onUnit: tot("onUnit") }
  res.pass = res.onGrid === res.blocks && res.onUnit === res.gaps
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(res, null, 1))
  summary.push(res)
  const pg = lvOut[0]
  console.log(`${name}  整页 ${pg.grid.columns} 栏 ${pg.grid.column}/${pg.grid.gutter}  框 ${lvOut.length - 1} 个  块 ${res.onGrid}/${res.blocks}  纵向 ${res.onUnit}/${res.gaps}  ${res.pass ? "通过" : "不通过"}`)
}
fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 1))
await browser.close()
server.close()
