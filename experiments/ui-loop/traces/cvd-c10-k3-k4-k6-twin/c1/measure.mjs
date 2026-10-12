import fs from "node:fs"
import path from "node:path"
import http from "node:http"
import { createRequire } from "node:module"
import { chromium } from "playwright-core"

const require = createRequire(import.meta.url)
const ws = process.cwd()
const OUT = path.join(ws, ".build")
const MIME = { ".html": "text/html", ".png": "image/png", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff" }
const server = http.createServer((req, res) => {
  const p = path.join(OUT, decodeURIComponent(new URL(req.url, "http://x").pathname))
  if (!p.startsWith(OUT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return res.writeHead(404).end()
  res.writeHead(200, { "content-type": MIME[path.extname(p)] ?? "application/octet-stream" })
  fs.createReadStream(p).pipe(res)
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const url = `http://127.0.0.1:${server.address().port}/index.html`
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url)
await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 30000 })
const info = await page.evaluate(() => {
  const main = document.querySelector("main")
  const mr = main.getBoundingClientRect()
  const rows = []
  for (const el of main.querySelectorAll("*")) {
    const slot = el.getAttribute("data-slot")
    if (!slot) continue
    if (!/figure|scroll|strip|compare|grid/i.test(slot)) continue
    const r = el.getBoundingClientRect()
    rows.push({ slot, cls: el.className.slice(0, 120), x: Math.round(r.left - mr.left), w: Math.round(r.width), h: Math.round(r.height), overflowX: getComputedStyle(el).overflowX })
  }
  const imgs = [...document.images].map((i) => { const r = i.getBoundingClientRect(); return { src: i.getAttribute("src").split("/").pop(), x: Math.round(r.left - mr.left), w: Math.round(r.width), h: Math.round(r.height), nw: i.naturalWidth, nh: i.naturalHeight } })
  return { main: { w: mr.width }, rows, imgs }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
server.close()
