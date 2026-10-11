import http from "node:http"
import path from "node:path"
import fs from "node:fs"
import { createRequire } from "node:module"
const require = createRequire("/home/user/QFY1012.github.io/experiments/ui-loop/scripts/shoot.mjs")
const { chromium } = require("playwright-core")
const OUT = path.join(process.cwd(), ".build")
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2" }
const server = http.createServer((req, res) => {
  const p = path.join(OUT, decodeURIComponent(new URL(req.url, "http://x").pathname))
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) return res.writeHead(404).end()
  res.writeHead(200, { "content-type": MIME[path.extname(p)] ?? "application/octet-stream" })
  fs.createReadStream(p).pipe(res)
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const url = `http://127.0.0.1:${server.address().port}/index.html`
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await page.goto(url)
await page.waitForFunction(() => window.__READY__ === true)
const info = await page.evaluate(() => {
  const main = document.querySelector("main")
  const mr = main.getBoundingClientRect()
  const rows = []
  for (const el of main.querySelectorAll("*")) {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    if (r.left < mr.left - 1 || r.right > mr.right + 1) {
      rows.push({ tag: el.tagName, slot: el.getAttribute("data-slot"), cls: el.className?.toString().slice(0, 90), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), txt: (el.textContent||"").trim().slice(0,20) })
    }
  }
  const lists = [...main.querySelectorAll("[data-slot=custom-progress-list]")].map((l) => {
    const lr = l.getBoundingClientRect()
    return { left: Math.round(lr.left), right: Math.round(lr.right), items: [...l.querySelectorAll(":scope > div")].slice(0,8).map((row) => {
      const cells = [...row.children].map((c) => { const r = c.getBoundingClientRect(); return { txt: (c.textContent||"").trim(), left: Math.round(r.left), right: Math.round(r.right) } })
      return cells
    }) }
  })
  return { main: { left: Math.round(mr.left), right: Math.round(mr.right) }, overflow: rows, lists }
})
console.log(JSON.stringify(info, null, 1).slice(0, 6000))
await browser.close(); server.close()
