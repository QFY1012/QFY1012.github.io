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
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await page.goto(url)
await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 30000 })
const out = await page.evaluate(() => {
  const res = {}
  const main = document.querySelector("main")
  res.mainBox = main.getBoundingClientRect().toJSON()
  const ths = [...document.querySelectorAll('[data-slot="custom-table"] th')]
  res.tableHeads = ths.map((t) => ({ text: t.innerText, x: Math.round(t.getBoundingClientRect().x), w: Math.round(t.getBoundingClientRect().width) }))
  const grid = document.querySelectorAll('[data-slot="grid"]')[1]
  res.sectionHeaders = [...document.querySelectorAll('[data-slot="section-header"]')].map((s) => ({ t: s.innerText.split("\n")[0], x: Math.round(s.getBoundingClientRect().x) }))
  const kv = document.querySelector('[data-slot="custom-kv"]')
  res.kv = kv ? [...kv.children].map((c) => ({ t: c.innerText.slice(0, 8), x: Math.round(c.getBoundingClientRect().x) })) : null
  return res
})
console.log(JSON.stringify(out, null, 1))
await browser.close()
server.close()
