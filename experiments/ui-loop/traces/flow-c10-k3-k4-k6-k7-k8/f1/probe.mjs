import fs from "node:fs"
import path from "node:path"
import http from "node:http"
import { chromium } from "playwright-core"

const OUT = path.resolve(".build")
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff" }
const server = http.createServer((req, res) => {
  const p = path.join(OUT, decodeURIComponent(new URL(req.url, "http://x").pathname))
  if (!p.startsWith(OUT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return res.writeHead(404).end()
  res.writeHead(200, { "content-type": MIME[path.extname(p)] ?? "application/octet-stream" })
  fs.createReadStream(p).pipe(res)
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const url = `http://127.0.0.1:${server.address().port}/index.html`
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await page.goto(url)
await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 30000 })
const info = await page.evaluate(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y + window.scrollY), w: Math.round(b.width), h: Math.round(b.height) } }
  const out = {}
  out.images = [...document.querySelectorAll("[data-slot=figure-image]")].slice(0, 3).map((i) => ({ ...r(i), src: i.getAttribute("src"), natural: [i.naturalWidth, i.naturalHeight] }))
  out.strips = [...document.querySelectorAll("[data-slot=figure-strip]")].map((s) => ({ ...r(s), scrollW: s.querySelector("[data-slot=scroll-area-viewport]")?.scrollWidth }))
  out.scrollbars = [...document.querySelectorAll("[data-slot=scroll-area-scrollbar]")].map((s) => ({ ...r(s), state: s.getAttribute("data-state"), orient: s.getAttribute("data-orientation") }))
  out.figures = [...document.querySelectorAll("[data-slot=figure]")].slice(0, 3).map(r)
  out.figureTexts = [...document.querySelectorAll("[data-slot=figure-text]")].slice(0, 6).map((e) => ({ ...r(e), text: e.textContent.slice(0, 20) }))
  out.progress = [...document.querySelectorAll("[data-slot=progress]")].slice(0, 3).map((p) => ({ ...r(p), indicator: p.querySelector("[data-slot=progress-indicator]") && r(p.querySelector("[data-slot=progress-indicator]")) }))
  out.raw = [...document.querySelectorAll("img,canvas,video,iframe,picture,object,embed")].filter((e) => !e.hasAttribute("data-slot")).length
  out.bodyH = document.documentElement.scrollHeight
  return out
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
server.close()
