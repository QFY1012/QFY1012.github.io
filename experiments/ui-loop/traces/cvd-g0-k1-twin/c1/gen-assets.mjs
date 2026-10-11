import fs from "node:fs"
import { chromium } from "playwright-core"

fs.mkdirSync("assets", { recursive: true })
const views = [
  ["original", "原界面"],
  ["protanopia", "红色盲"],
  ["deuteranopia", "绿色盲"],
  ["tritanopia", "蓝色盲"],
]
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
const page = await browser.newPage({ viewport: { width: 1200, height: 760 } })
for (const [name, label] of views) {
  await page.setContent(
    `<body style="margin:0;width:1200px;height:760px;display:flex;align-items:center;justify-content:center;background:#f5f5f5;border:1px solid #d9d9d9;box-sizing:border-box;font-family:sans-serif;color:#8c8c8c;font-size:30px">截图缺失 · ${label}</body>`,
  )
  await page.screenshot({ path: `assets/${name}.png` })
}
await browser.close()
console.log("assets written")
