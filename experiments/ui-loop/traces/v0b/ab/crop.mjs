import { chromium } from "/home/user/QFY1012.github.io/experiments/ui-loop/node_modules/playwright-core/index.mjs"
import fs from "node:fs"
const [src, out, x, y, w, h, scale] = process.argv.slice(2)
const b64 = fs.readFileSync(src).toString("base64")
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" })
const page = await browser.newPage()
await page.setContent(`<img id="i" src="data:image/png;base64,${b64}">`)
await page.waitForFunction(() => document.getElementById('i').complete)
const url = await page.evaluate(([x, y, w, h, s]) => {
  const img = document.getElementById('i')
  const c = document.createElement('canvas')
  c.width = w * s; c.height = h * s
  const ctx = c.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(img, x, y, w, h, 0, 0, w * s, h * s)
  return c.toDataURL('image/png')
}, [Number(x), Number(y), Number(w), Number(h), Number(scale)])
fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'))
await browser.close()
