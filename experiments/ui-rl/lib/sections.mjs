// 按节截图:给「按节对齐」的 judge 用。
//
//   await cropSections([{ ws, out }, ...])
//
// ws 是页面的工作目录(Page.tsx + data.json + assets),构建、渲染的做法和 gen/scripts/shoot.mjs 一样,不改 ws 里的文件。
// 每个页面写出 out/:
//   sections.json  [{title, files: [...], hash}],第一项是页头(第一节之前的部分),标题「页头」
//   s<i>-<k>.png   第 i 块的第 k 张(一节太高时按 1280px 切开,重叠 64px)
// hash 是这一块 HTML 的 sha1(截图位置有亚像素的取整误差,不能拿像素比),两版同一节 hash 相同就是内容和样式完全一样。
// 一次调用里逐个构建;几次调用可以同时跑(各用各的临时目录)。
import fs from "node:fs"
import path from "node:path"
import http from "node:http"
import crypto from "node:crypto"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"

const ROOT = path.resolve(import.meta.dirname, "..")
const GEN = path.join(ROOT, "gen")
const req = createRequire(path.join(GEN, "package.json"))
const load = async (m) => import(pathToFileURL(req.resolve(m)).href)
const APP = path.join(GEN, "app")
const VIEWPORT = { width: 1440, height: 900 }
const CLIP_X = (VIEWPORT.width - 1152) / 2 - 48
const CLIP_W = 1152 + 96
const PIECE = 1280, OVERLAP = 64, PAD = 24
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff" }

export async function cropSections(pages, { log = console.log } = {}) {
  const { build } = await load("vite")
  const react = (await load("@vitejs/plugin-react")).default
  const tailwindcss = (await load("@tailwindcss/vite")).default
  const { chromium } = req("playwright-core")
  const dist = path.join(ROOT, "cache", `.sections-build-${process.pid}-${crypto.randomUUID().slice(0, 8)}`)
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
  try {
    for (const [n, p] of pages.entries()) {
      const ws = path.resolve(p.ws), out = path.resolve(p.out)
      fs.rmSync(dist, { recursive: true, force: true })
      await build({
        root: APP, base: "./", logLevel: "error", configFile: false,
        plugins: [
          { name: "workspace-source", enforce: "pre", transform: (code, id) => (id.endsWith("/src/index.css") ? `${code}\n@source "${ws}/Page.tsx";\n` : null) },
          react(), tailwindcss(),
        ],
        resolve: {
          alias: [
            { find: "@page", replacement: path.join(ws, "Page.tsx") },
            { find: /^react\/jsx-runtime$/, replacement: req.resolve("react/jsx-runtime") },
            { find: /^react\/jsx-dev-runtime$/, replacement: req.resolve("react/jsx-dev-runtime") },
            { find: /^react$/, replacement: req.resolve("react") },
            { find: "@", replacement: path.join(APP, "src") },
          ],
        },
        build: { outDir: dist, emptyOutDir: true, chunkSizeWarningLimit: 8000 },
      })
      if (fs.existsSync(path.join(ws, "assets"))) fs.cpSync(path.join(ws, "assets"), path.join(dist, "assets"), { recursive: true })

      const server = http.createServer((rq, rs) => {
        const f = path.join(dist, decodeURIComponent(new URL(rq.url, "http://x").pathname))
        if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return rs.writeHead(404).end()
        rs.writeHead(200, { "content-type": MIME[path.extname(f)] ?? "application/octet-stream" })
        fs.createReadStream(f).pipe(rs)
      })
      await new Promise((r) => server.listen(0, "127.0.0.1", r))
      try {
        const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 })
        await page.goto(`http://127.0.0.1:${server.address().port}/index.html`)
        await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 30000 })
        const blocks = await page.evaluate(() => {
          const top = (el) => el.getBoundingClientRect().top + window.scrollY
          const main = document.querySelector("main") ?? document.body
          const secs = [...main.querySelectorAll("[data-slot=section]")]
          const b = []
          const mainTop = top(main), mainBottom = mainTop + main.getBoundingClientRect().height
          // 页头:main 里第一节之前的元素
          const head = secs.length ? [...main.children].filter((c) => c.compareDocumentPosition(secs[0]) & Node.DOCUMENT_POSITION_FOLLOWING && !c.contains(secs[0])).map((c) => c.outerHTML).join("") : ""
          if (secs.length && top(secs[0]) - mainTop > 8) b.push({ title: "页头", y: mainTop, h: top(secs[0]) - mainTop, html: head })
          for (const s of secs) b.push({ title: (s.querySelector("h2")?.innerText ?? "").trim() || "(无标题)", y: top(s), h: s.getBoundingClientRect().height, html: s.outerHTML })
          const last = secs.at(-1)
          if (last && mainBottom - (top(last) + last.getBoundingClientRect().height) > 8) b.push({ title: "页尾", y: top(last) + last.getBoundingClientRect().height, h: mainBottom - top(last) - last.getBoundingClientRect().height, html: "" })
          if (!secs.length) b.push({ title: "整页", y: mainTop, h: mainBottom - mainTop, html: main.outerHTML })
          return { blocks: b, height: Math.ceil(document.documentElement.scrollHeight) }
        })
        fs.rmSync(out, { recursive: true, force: true })
        fs.mkdirSync(out, { recursive: true })
        const meta = []
        for (const [i, bl] of blocks.blocks.entries()) {
          const y0 = Math.max(0, Math.round(bl.y) - PAD), y1 = Math.min(blocks.height, y0 + Math.round(bl.h) + 2 * PAD)
          const files = []
          for (let y = y0, k = 1; y < y1; y += PIECE - OVERLAP, k++) {
            const file = `s${i + 1}-${k}.png`
            await page.screenshot({ path: path.join(out, file), clip: { x: CLIP_X, y, width: CLIP_W, height: Math.min(PIECE, y1 - y) }, fullPage: true })
            files.push(file)
            if (y + PIECE >= y1) break
          }
          meta.push({ title: bl.title, files, hash: crypto.createHash("sha1").update(bl.html).digest("hex") })
        }
        fs.writeFileSync(path.join(out, "sections.json"), JSON.stringify(meta, null, 1))
        await page.close()
        log(`  按节截图 ${path.relative(ROOT, ws)}:${meta.map((m) => `${m.title}(${m.files.length})`).join(" / ")}  ${n + 1}/${pages.length}`)
      } finally {
        server.close()
      }
    }
  } finally {
    await browser.close()
    fs.rmSync(dist, { recursive: true, force: true })
  }
}
