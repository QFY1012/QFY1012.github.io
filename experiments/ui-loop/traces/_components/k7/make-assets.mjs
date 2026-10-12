// Draws the demo screenshots (SVG, so they stay sharp at any size). Four colour
// treatments of one analysis screen stand in for the interface and its three
// colour-vision simulations; two phone-shaped steps stand in for a chain's
// screens. Run: node make-assets.mjs
import fs from "node:fs"

const OUT = new URL("./assets/", import.meta.url).pathname
fs.mkdirSync(OUT, { recursive: true })

function screen(p, w = 1200, h = 900) {
  const [c1, c2, c3, c4] = p
  const bars = [
    { x: 80, y: 400, h: 300, c: c1, v: "128" },
    { x: 200, y: 460, h: 240, c: c2, v: "96" },
    { x: 320, y: 360, h: 340, c: c3, v: "142" },
    { x: 440, y: 520, h: 180, c: c4, v: "74" },
  ]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Noto Sans SC, sans-serif">
  <rect width="${w}" height="${h}" fill="#ffffff"/>
  <rect x="0" y="0" width="${w}" height="56" fill="#f4f4f5"/>
  <circle cx="32" cy="28" r="8" fill="#d4d4d8"/><circle cx="60" cy="28" r="8" fill="#d4d4d8"/><circle cx="88" cy="28" r="8" fill="#d4d4d8"/>
  <text x="80" y="130" font-size="38" font-weight="600" fill="#18181b">结算漏斗 · 按渠道</text>
  <text x="80" y="176" font-size="26" fill="#71717a">2026-09-01 至 2026-09-30 · 单位:万次</text>
  <line x1="80" y1="206" x2="1120" y2="206" stroke="#e4e4e7" stroke-width="1"/>
  <rect x="80" y="240" width="20" height="20" fill="${c1}"/><text x="110" y="258" font-size="24" fill="#3f3f46">直连</text>
  <rect x="210" y="240" width="20" height="20" fill="${c2}"/><text x="240" y="258" font-size="24" fill="#3f3f46">代理</text>
  <rect x="340" y="240" width="20" height="20" fill="${c3}"/><text x="370" y="258" font-size="24" fill="#3f3f46">门店</text>
  <rect x="470" y="240" width="20" height="20" fill="${c4}"/><text x="500" y="258" font-size="24" fill="#3f3f46">海外</text>
  ${bars.map((b) => `<rect x="${b.x}" y="${b.y}" width="96" height="${b.h}" fill="${b.c}"/><text x="${b.x}" y="${b.y - 16}" font-size="26" fill="#3f3f46">${b.v}</text>`).join("\n  ")}
  <line x1="80" y1="740" x2="560" y2="740" stroke="#a1a1aa" stroke-width="1"/>
  <text x="80" y="800" font-size="26" fill="#71717a">四渠道完成量</text>
  <polyline points="660,700 760,650 860,680 960,580 1060,540" fill="none" stroke="${c1}" stroke-width="4"/>
  <polyline points="660,750 760,730 860,740 960,680 1060,650" fill="none" stroke="${c3}" stroke-width="4"/>
  <line x1="640" y1="770" x2="1120" y2="770" stroke="#e4e4e7" stroke-width="1"/>
  <text x="640" y="830" font-size="26" fill="#71717a">近 12 周转化率</text>
  <text x="80" y="866" font-size="24" fill="#71717a">数据更新于 2026-10-01</text>
</svg>`
}

const PALETTES = {
  original: ["#d1495b", "#4c9f70", "#3a6ea5", "#e8a33d"],
  protan: ["#8a7f2b", "#b3a24a", "#3a6ea5", "#d9c56a"],
  deutan: ["#8f8a3a", "#a9a94f", "#3a6ea5", "#c8bd62"],
  tritan: ["#c05a6e", "#7fae86", "#2f8f96", "#c9a24d"],
}
for (const [name, pal] of Object.entries(PALETTES)) fs.writeFileSync(`${OUT}view-${name}.svg`, screen(pal))

function phone(title, accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="375" height="760" viewBox="0 0 375 760" font-family="Noto Sans SC, sans-serif">
  <rect width="375" height="760" fill="#ffffff"/>
  <rect x="0" y="0" width="375" height="72" fill="#18181b"/>
  <text x="24" y="46" font-size="26" fill="#fafafa">${title}</text>
  <text x="24" y="120" font-size="22" fill="#71717a">选择门店</text>
  <rect x="24" y="140" width="327" height="64" rx="8" fill="#f4f4f5"/>
  <text x="40" y="180" font-size="22" fill="#3f3f46">上海静安 · 南京西路</text>
  <rect x="24" y="220" width="327" height="64" rx="8" fill="#f4f4f5"/>
  <text x="40" y="260" font-size="22" fill="#3f3f46">北京朝阳 · 建国路</text>
  <rect x="24" y="320" width="327" height="8" fill="${accent}"/>
  <text x="24" y="380" font-size="22" fill="#3f3f46">确认后进入下一步</text>
  <rect x="24" y="660" width="327" height="64" rx="8" fill="#18181b"/>
  <text x="150" y="700" font-size="24" fill="#fafafa">下一步</text>
</svg>`
}
fs.writeFileSync(`${OUT}step-1.svg`, phone("结算 · 第 1 步", "#3a6ea5"))
fs.writeFileSync(`${OUT}step-2.svg`, phone("结算 · 第 2 步", "#4c9f70"))
console.log("wrote", fs.readdirSync(OUT).join(" "))
