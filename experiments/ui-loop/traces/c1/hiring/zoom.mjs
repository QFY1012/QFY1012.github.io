import fs from "node:fs"
import path from "node:path"
import http from "node:http"
import { chromium } from "playwright-core"

const ws = path.resolve(process.argv[2] ?? ".")
const OUT = path.join(ws, ".build")
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff" }
const server = http.createServer((req, res) => {
  const p = path.join(OUT, decodeURIComponent(new URL(req.url, "http://x").pathname))
  if (!p.startsWith(OUT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return res.writeHead(404).end()
  res.writeHead(200, { "content-type": MIME[path.extname(p)] ?? "application/octet-stream" })
  fs.createReadStream(p).pipe(res)
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const url = `http://127.0.0.1:${server.address().port}/index.html`
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
const regions = JSON.parse(process.argv[3])
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 })
  await page.goto(url)
  await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 30000 })
  for (const [name, clip] of Object.entries(regions)) {
    await page.screenshot({ path: path.join(ws, name), clip, fullPage: true })
    console.log("wrote", name)
  }
} finally {
  await browser.close()
  server.close()
}
