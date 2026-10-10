// Screenshot the validation pages at 1440px, then cut the images the judge sees.
//
//   node scripts/render-pages.mjs   → out/validate/<page>/shot.png, then
//   python3 scripts/cut-pages.py    → thumb.png, clean-N.png, clean-tiles.json, _pairs/
import fs from "node:fs"
import path from "node:path"
import http from "node:http"
import { chromium } from "playwright-core"

const ROOT = path.resolve(import.meta.dirname, "..")
const SRC = path.join(ROOT, "validate", "pages")
const OUT = path.join(ROOT, "out", "validate")

const MIME = { ".html": "text/html", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff" }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname))
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return res.writeHead(404).end()
  res.writeHead(200, { "content-type": MIME[path.extname(p)] ?? "application/octet-stream" })
  fs.createReadStream(p).pipe(res)
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const base = `http://127.0.0.1:${server.address().port}`

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
for (const f of fs.readdirSync(SRC).filter((f) => f.endsWith(".html"))) {
  const name = f.replace(/\.html$/, "")
  const page = await ctx.newPage()
  await page.goto(`${base}/validate/pages/${f}`, { waitUntil: "networkidle" })
  await page.evaluate(() => document.fonts.ready)
  const dir = path.join(OUT, name)
  fs.mkdirSync(dir, { recursive: true })
  await page.screenshot({ path: path.join(dir, "shot.png"), fullPage: true })
  const h = await page.evaluate(() => document.documentElement.scrollHeight)
  console.log(name, h)
  await page.close()
}
await browser.close()
server.close()
