// one-off: regenerate the four screen images that the environment reset removed.
// The originals are unrecoverable, so these are labelled placeholders.
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright-core"

const views = [
  { view: "原界面", file: "original.png" },
  { view: "红色盲", file: "protanopia.png" },
  { view: "绿色盲", file: "deuteranopia.png" },
  { view: "蓝色盲", file: "tritanopia.png" },
]

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
const page = await browser.newPage({ viewport: { width: 375, height: 760 }, deviceScaleFactor: 2 })
fs.mkdirSync("assets", { recursive: true })
for (const v of views) {
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;height:100%}
    body{display:flex;align-items:center;justify-content:center;background:#f7f7f7;
      font-family:"Noto Sans SC",sans-serif;color:#767676}
    .box{width:311px;height:696px;border:1px dashed #cfcfcf;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:12px}
    .name{font-size:20px;font-weight:300;color:#1f1f1f}
    .hint{font-size:12px;color:#9a9a9a}
  </style></head><body><div class="box"><div class="name">${v.view}</div><div class="hint">截图占位</div></div></body></html>`)
  await page.screenshot({ path: path.join("assets", v.file) })
  console.log("wrote", v.file)
}
await browser.close()
