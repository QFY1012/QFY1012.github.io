// Build a workspace's Page.tsx with the component library, screenshot it and run
// the program checks. The generator agent runs this after every edit.
//
//   node scripts/shoot.mjs <workspace>
//
// <workspace> holds Page.tsx and data.json. Writes into it:
//   shot.png       the page, 1248px wide (the 1152px frame with a 48px margin)
//   thumb.png      the same at half width (what the judge sees as the overview)
//   tile-N.png     640px slices with 64px overlap (what the judge sees as detail)
//   checks.json    program check results
// Prints the check results; exit code 0 even when checks fail (they are findings).
import fs from "node:fs"
import path from "node:path"
import http from "node:http"
import { build } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { chromium } from "playwright-core"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

const APP = path.resolve(import.meta.dirname, "..", "app")
const ws = path.resolve(process.argv[2] ?? ".")
const OUT = path.join(ws, ".build")
const VIEWPORT = { width: 1440, height: 900 }
const CLIP_X = (VIEWPORT.width - 1152) / 2 - 48
const CLIP_W = 1152 + 96
const TILE_H = 640
const TILE_OVERLAP = 64

const findings = []
const add = (check, msg, line) => findings.push({ check, msg, ...(line && { line }) })

// ---------- source checks on Page.tsx, with line numbers ----------
const src = fs.readFileSync(path.join(ws, "Page.tsx"), "utf8")
const ALLOWED_IMPORT = /^(react|@\/components\/report|@\/components\/ui\/(table|progress|separator|item|chart)|\.\/data\.json)$/
const COLOR = /\b(?:text|bg|border|fill|stroke|from|to|via)-(?:red|green|blue|slate|gray|zinc|neutral|stone|orange|amber|yellow|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|white|black)\b/
src.split("\n").forEach((line, i) => {
  const n = i + 1
  for (const m of line.matchAll(/from\s+["']([^"']+)["']/g))
    if (!ALLOWED_IMPORT.test(m[1])) add("组件库", `import 了组件库以外的模块 ${m[1]}`, n)
  if (/\bstyle=\{/.test(line)) add("统一刻度", "写了 inline style;尺寸、颜色只能来自组件和规范里的类名", n)
  for (const m of line.matchAll(/\b[\w:-]+-\[[^\]]+\]/g)) add("统一刻度", `任意值类名 ${m[0]}`, n)
  const c = line.match(COLOR)
  if (c) add("统一刻度", `直接写了颜色类名 ${c[0]};颜色只能来自组件(下降、严重用组件的 direction、tone)`, n)
  for (const m of line.matchAll(/\btext-(xs|sm|base|lg|xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g)) add("统一刻度", `字号类名 ${m[0]} 不在规范里(只允许结论句的 text-2xl)`, n)
  for (const m of line.matchAll(/<(h[1-6]|p|span|table|ul|ol|li|img|svg|button)\b/g)) add("组件库", `直接写了 <${m[1]}>,应使用组件库组件`, n)
  // The same tags through createElement / jsx() are the same thing written another way.
  for (const m of line.matchAll(/\b(?:createElement|jsxs?)\(\s*["'`]([a-z][a-z0-9]*)["'`]/g)) if (m[1] !== "div") add("组件库", `用 createElement 直接画了 <${m[1]}>,应使用组件库组件`, n)
})

// ---------- build ----------
fs.rmSync(OUT, { recursive: true, force: true })
try {
  await build({
    root: APP,
    base: "./",
    logLevel: "error",
    configFile: false,
    plugins: [
      // Tailwind emits only the classes it finds; point it at the workspace too.
      { name: "workspace-source", enforce: "pre", transform: (code, id) => (id.endsWith("/src/index.css") ? `${code}\n@source "${ws}/Page.tsx";\n` : null) },
      react(),
      tailwindcss(),
    ],
    // The workspace may sit outside this package, so React resolves from here.
    resolve: {
      alias: [
        { find: "@page", replacement: path.join(ws, "Page.tsx") },
        { find: /^react\/jsx-runtime$/, replacement: require.resolve("react/jsx-runtime") },
        { find: /^react\/jsx-dev-runtime$/, replacement: require.resolve("react/jsx-dev-runtime") },
        { find: /^react$/, replacement: require.resolve("react") },
        { find: "@", replacement: path.join(APP, "src") },
      ],
    },
    build: { outDir: OUT, emptyOutDir: true, chunkSizeWarningLimit: 8000 },
  })
} catch (e) {
  add("能渲染", `构建失败:${String(e.message ?? e).split("\n").slice(0, 6).join(" ")}`)
  finish()
  process.exit(0)
}

// ---------- render ----------
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

try {
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 })
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e)))
  await page.goto(url)
  await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 30000 })
  for (const e of errors) add("能渲染", `页面报错:${e.slice(0, 200)}`)

  const dom = await page.evaluate(() => {
    const main = document.querySelector("main")
    if (!main) return { height: document.body.scrollHeight, text: document.body.innerText, out: [], unknown: 0 }
    const mr = main.getBoundingClientRect()
    const out = []
    for (const el of main.querySelectorAll("*")) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      if (r.left < mr.left - 1 || r.right > mr.right + 1) {
        const t = (el.innerText || el.textContent || "").trim().slice(0, 30)
        out.push(`${el.tagName.toLowerCase()}[${el.getAttribute("data-slot") ?? ""}] 超出页面左右边界 ${Math.round(Math.max(mr.left - r.left, r.right - mr.right))}px「${t}」`)
      }
    }
    return { height: Math.ceil(document.documentElement.scrollHeight), text: document.body.innerText, images: [...document.images].map((i) => i.getAttribute("src") ?? ""), out: out.slice(0, 10), unknown: document.querySelectorAll("[data-slot=unknown]").length,
      // Images, canvases and the like that no library component drew: the page made them itself,
      // however the code spells it (<img>, createElement, a variable holding "img", new Image()...).
      raw: [...document.querySelectorAll("img,canvas,video,iframe,picture,object,embed")].filter((e) => !e.hasAttribute("data-slot")).map((e) => e.tagName.toLowerCase()) }
  })
  if (dom.unknown) add("组件库", `${dom.unknown} 个组件类型未知`)
  if (dom.raw.length) {
    const n = dom.raw.reduce((m, t) => ({ ...m, [t]: (m[t] ?? 0) + 1 }), {})
    add("组件库", `页面上有不是组件库画的元素:${Object.entries(n).map(([t, k]) => `${k} 个 <${t}>`).join("、")};组件库没有的能力不要自己画,在最后的说明里写出缺什么组件`)
  }
  for (const o of dom.out) add("元素越界", o)

  // Data coverage: every short value outside long series should appear on the page.
  const data = JSON.parse(fs.readFileSync(path.join(ws, "data.json"), "utf8"))
  const text = dom.text.replace(/\s+/g, "")
  const missing = [], missingImages = []
  // Long series (more than 8 items) are only checked for their images.
  const walk = (v, p, imagesOnly = false) => {
    if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${p}/${i}`, imagesOnly || v.length > 8))
    if (v && typeof v === "object") return Object.entries(v).forEach(([k, x]) => walk(x, `${p}/${k}`, imagesOnly))
    if (typeof v === "boolean" || v == null) return
    if (/\/(key|direction|significant|id)$/.test(p)) return
    // An image counts when the page shows it: an <img> with the same file name (the build may add a hash).
    if (typeof v === "string" && /\.(png|jpe?g|webp|svg)$/i.test(v)) {
      const stem = path.basename(v).replace(/\.\w+$/, "")
      if (!dom.images.some((src) => path.basename(src.split("?")[0]).startsWith(stem))) missingImages.push(v)
      return
    }
    if (imagesOnly) return
    const s = String(v).replace(/\s+/g, "")
    const alts = typeof v === "number" ? [s, v.toLocaleString("en-US"), v.toFixed(1)] : [s]
    if (!alts.some((a) => text.includes(a))) missing.push(`${p}「${String(v).slice(0, 24)}」`)
  }
  walk(data, "")
  if (missingImages.length) add("数据忠实", `页面上没有显示 ${missingImages.length} 张图:${missingImages.slice(0, 6).join("、")}${missingImages.length > 6 ? " 等" : ""}`)
  if (missing.length) add("数据忠实", `页面上找不到 ${missing.length} 项数据:${missing.slice(0, 12).join("、")}${missing.length > 12 ? " 等" : ""}`)

  const clip = { x: CLIP_X, y: 0, width: CLIP_W, height: dom.height }
  await page.screenshot({ path: path.join(ws, "shot.png"), clip, fullPage: true })
  for (const f of fs.readdirSync(ws)) if (/^tile-\d+\.png$/.test(f)) fs.rmSync(path.join(ws, f))
  const tiles = []
  for (let y = 0; y < dom.height; y += TILE_H - TILE_OVERLAP) {
    const h = Math.min(TILE_H, dom.height - y)
    const file = `tile-${tiles.length + 1}.png`
    await page.screenshot({ path: path.join(ws, file), clip: { ...clip, y, height: h }, fullPage: true })
    tiles.push({ file, y, h })
    if (y + h >= dom.height) break
  }
  fs.writeFileSync(path.join(ws, "tiles.json"), JSON.stringify(tiles))
  const half = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 0.5 })
  await half.goto(url)
  await half.waitForFunction(() => window.__READY__ === true, null, { timeout: 30000 })
  await half.screenshot({ path: path.join(ws, "thumb.png"), clip, fullPage: true })
} finally {
  await browser.close()
  server.close()
}
finish()

function finish() {
  fs.writeFileSync(path.join(ws, "checks.json"), JSON.stringify(findings, null, 1))
  const shots = fs.existsSync(path.join(ws, "tiles.json")) ? JSON.parse(fs.readFileSync(path.join(ws, "tiles.json"), "utf8")).map((t) => t.file) : []
  console.log(findings.length ? `程序检查发现 ${findings.length} 个问题:` : "程序检查全部通过。")
  for (const f of findings) console.log(`- [${f.check}]${f.line ? ` Page.tsx 第 ${f.line} 行:` : " "}${f.msg}`)
  if (shots.length) console.log(`截图:thumb.png(整页缩略),${shots.join("、")}(从上到下的切块)`)
}
