// temp: zoom into regions of the built page for inspection
import fs from "node:fs"
import path from "node:path"
import http from "node:http"
import { chromium } from "playwright-core"

const ws = path.resolve(".")
const OUT = path.join(ws, ".build")
const MIME = { ".png": "image/png", ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff" }
const server = http.createServer((req, res) => {
  const p = path.join(OUT, decodeURIComponent(new URL(req.url, "http://x").pathname))
  if (!p.startsWith(OUT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return res.writeHead(404).end()
  res.writeHead(200, { "content-type": MIME[path.extname(p)] ?? "application/octet-stream" })
  fs.createReadStream(p).pipe(res)
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const url = `http://127.0.0.1:${server.address().port}/index.html`
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await page.goto(url)
await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 30000 })
const regions = JSON.parse(process.argv[2] ?? "[]")
for (const [i, r] of regions.entries()) {
  await page.screenshot({ path: path.join(ws, `zoom-${i + 1}.png`), clip: { x: r.x, y: r.y, width: r.w, height: r.h }, fullPage: true })
}
await browser.close()
server.close()
