// Render sample specs in Chromium, number the DOM nodes and measure them.
//
//   node scripts/render.mjs [samples/*.json ...]   (default: every file in samples/)
//
// Output per sample in out/render/<name>/:
//   shot.png      clean screenshot
//   marked.png    screenshot with node ids drawn on spec nodes
//   dom.json      numbered DOM list (what the judge reads)
//   geometry.json program measurements (layout tree with gaps, type levels)
import fs from "node:fs"
import path from "node:path"
import http from "node:http"
import { execSync } from "node:child_process"
import { chromium } from "playwright-core"

const ROOT = path.resolve(import.meta.dirname, "..")
const OUT = path.join(ROOT, "out", "render")
const VIEWPORT = { width: 1440, height: 900 }
// The page container is 1152px wide and centred; keep a 48px margin either side.
const CLIP_X = (VIEWPORT.width - 1152) / 2 - 48
const CLIP_W = 1152 + 96
const TILE_H = 640
const TILE_OVERLAP = 64

let files = process.argv.slice(2)
if (!files.length) {
  files = fs
    .readdirSync(path.join(ROOT, "samples"))
    .filter((f) => f.endsWith(".json") && f !== "manifest.json")
    .map((f) => path.join("samples", f))
}

if (!process.env.SKIP_BUILD) {
  // Tailwind only emits classes it finds in the sources, including the samples.
  execSync("npx vite build --logLevel error", { cwd: ROOT, stdio: "inherit" })
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff" }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname))
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404).end()
    return
  }
  res.writeHead(200, { "content-type": MIME[path.extname(p)] ?? "application/octet-stream" })
  fs.createReadStream(p).pipe(res)
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const base = `http://127.0.0.1:${server.address().port}`

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })

// Runs in the page: number nodes, measure them, compute program geometry.
function extract() {
  const root = document.getElementById("root")
  const nodes = []
  const byEl = new Map()
  let n = 0
  const ownText = (el) =>
    [...el.childNodes]
      .filter((c) => c.nodeType === 3)
      .map((c) => c.textContent)
      .join("")
      .replace(/\s+/g, " ")
      .trim()
  const r1 = (v) => Math.round(v)
  // What is actually visible: the box clipped by every ancestor that clips its
  // overflow (e.g. the transformed progress fill, or a scrolling table).
  const visibleRect = (el) => {
    const r = el.getBoundingClientRect()
    let l = r.left, t = r.top, rt = r.right, b = r.bottom
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a)
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible") {
        const ar = a.getBoundingClientRect()
        if (cs.overflowX !== "visible") { l = Math.max(l, ar.left); rt = Math.min(rt, ar.right) }
        if (cs.overflowY !== "visible") { t = Math.max(t, ar.top); b = Math.min(b, ar.bottom) }
      }
    }
    return { left: l, top: t, width: Math.max(0, rt - l), height: Math.max(0, b - t) }
  }

  const walk = (el, parentNid) => {
    if (["STYLE", "SCRIPT", "TEMPLATE"].includes(el.tagName)) return
    const inSvg = el instanceof SVGElement
    const slot = el.getAttribute("data-slot")
    const text = ownText(el)
    const spec = el.getAttribute("data-spec")
    // Inside charts only the text labels count (axis ticks, legend).
    const take = inSvg ? text : slot || spec || text
    let nid = parentNid
    if (take) {
      const rect = visibleRect(el)
      nid = `n${++n}`
      el.setAttribute("data-nid", nid)
      const cs = getComputedStyle(el)
      const node = {
        nid,
        parent: parentNid,
        slot: slot ?? (inSvg ? "chart-label" : el.tagName.toLowerCase()),
        spec: spec ?? undefined,
        text: text ? text.slice(0, 120) : undefined,
        x: r1(rect.left + scrollX),
        y: r1(rect.top + scrollY),
        w: r1(rect.width),
        h: r1(rect.height),
      }
      if (text) {
        node.fontSize = parseFloat(cs.fontSize)
        node.fontWeight = Number(cs.fontWeight)
        if (!inSvg) node.textAlign = cs.textAlign
      }
      if (spec && el.parentElement?.getAttribute("data-slot") === "grid") {
        const m = el.className.match?.(/col-span-(\d+)/)
        if (m) node.colSpan = Number(m[1])
      }
      nodes.push(node)
      byEl.set(el, node)
    }
    for (const c of el.children) walk(c, nid)
  }
  for (const c of root.children) walk(c, null)

  // Layout tree: for every container that lays out several children, the
  // measured gap between neighbours (vertical when stacked, horizontal when
  // side by side). The judge reads groups from these numbers.
  const containers = ["page", "section", "section-body", "group-body", "grid", "card", "card-content", "block", "block-content", "custom-progress-list"]
  const layout = []
  for (const node of nodes) {
    if (!containers.includes(node.slot)) continue
    const children = nodes.filter((c) => c.parent === node.nid && c.w > 0 && c.h > 0)
    if (children.length < 2) continue
    const gaps = []
    for (let i = 1; i < children.length; i++) {
      const a = children[i - 1]
      const b = children[i]
      const sameRow = b.y < a.y + a.h && a.y < b.y + b.h
      gaps.push(
        sameRow
          ? { between: [a.nid, b.nid], dir: "x", gap: b.x - (a.x + a.w) }
          : { between: [a.nid, b.nid], dir: "y", gap: b.y - (a.y + a.h) },
      )
    }
    layout.push({ container: node.nid, slot: node.slot, children: children.map((c) => c.nid), gaps })
  }

  // Type levels: text nodes grouped by size and weight, largest first.
  const tiers = new Map()
  for (const node of nodes) {
    if (!node.text) continue
    const k = `${node.fontSize}/${node.fontWeight}`
    if (!tiers.has(k)) tiers.set(k, { fontSize: node.fontSize, fontWeight: node.fontWeight, count: 0, nids: [] })
    const t = tiers.get(k)
    t.count++
    t.nids.push(node.nid)
  }
  const typeLevels = [...tiers.values()]
    .sort((a, b) => b.fontSize - a.fontSize || b.fontWeight - a.fontWeight)
    .map((t, i) => ({ level: i + 1, ...t }))

  return {
    page: {
      width: document.documentElement.scrollWidth,
      // Content height: bottom of the page container plus its bottom padding.
      height: Math.ceil((root.firstElementChild?.getBoundingClientRect().bottom ?? 0) + scrollY),
    },
    nodes,
    geometry: { layout, typeLevels },
  }
}

// Runs in the page: draw the nid of every spec node at its top-left corner.
function drawMarks() {
  const layer = document.createElement("div")
  layer.id = "__marks"
  layer.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none"
  document.body.appendChild(layer)
  const placed = []
  for (const el of document.querySelectorAll("[data-spec][data-nid]")) {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    const chip = document.createElement("div")
    chip.textContent = el.getAttribute("data-nid")
    chip.style.cssText =
      "position:absolute;font:600 12px/15px ui-monospace,monospace;color:#fff;background:#d6007e;padding:0 3px;border-radius:2px;white-space:nowrap"
    layer.appendChild(chip)
    // Chips sit just above the node's top-left corner so they cover less content.
    let x = r.left + scrollX
    const top = r.top + scrollY
    const y = top >= 16 ? top - 16 : top
    // Nested nodes often share a corner; shift right until free.
    const w = chip.offsetWidth + 2
    while (placed.some((p) => Math.abs(p.y - y) < 15 && x < p.x + p.w && p.x < x + w)) x += w
    chip.style.left = `${x}px`
    chip.style.top = `${y}px`
    placed.push({ x, y, w })
  }
}

for (const file of files) {
  const name = path.basename(file, ".json")
  const spec = JSON.parse(fs.readFileSync(path.resolve(ROOT, file), "utf8"))
  const dir = path.join(OUT, name)
  fs.mkdirSync(dir, { recursive: true })

  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 })
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e)))
  await page.addInitScript((s) => {
    window.__SPEC__ = s
  }, spec)
  await page.goto(`${base}/dist/index.html`)
  await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 30000 })

  const data = await page.evaluate(extract)
  const clip = { x: CLIP_X, y: 0, width: CLIP_W, height: data.page.height }
  await page.screenshot({ path: path.join(dir, "shot.png"), clip, fullPage: true })
  await page.evaluate(drawMarks)
  await page.screenshot({ path: path.join(dir, "marked.png"), clip, fullPage: true })
  // The judge model shrinks a full-page image until the id labels are
  // unreadable, so it gets the marked screenshot as tiles with a small overlap.
  const tiles = []
  for (let y = 0; y < data.page.height; y += TILE_H - TILE_OVERLAP) {
    const h = Math.min(TILE_H, data.page.height - y)
    const file = `tile-${tiles.length + 1}.png`
    await page.screenshot({ path: path.join(dir, file), clip: { ...clip, y, height: h }, fullPage: true })
    tiles.push({ file, y, h })
    if (y + h >= data.page.height) break
  }

  fs.writeFileSync(path.join(dir, "dom.json"), JSON.stringify({ page: data.page, clipX: CLIP_X, tiles, nodes: data.nodes }, null, 1))
  fs.writeFileSync(path.join(dir, "geometry.json"), JSON.stringify(data.geometry, null, 1))
  console.log(`${name}: ${data.nodes.length} nodes, ${data.page.width}x${data.page.height}${errors.length ? "  ERRORS: " + errors.join(" | ") : ""}`)
  await page.close()
}

await browser.close()
server.close()
