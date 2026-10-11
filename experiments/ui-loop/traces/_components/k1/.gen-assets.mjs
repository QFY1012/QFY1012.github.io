import fs from "node:fs"
import path from "node:path"

const out = process.argv[2]
fs.mkdirSync(out, { recursive: true })

const FONT = "system-ui, -apple-system, 'Noto Sans SC', sans-serif"

// ---------- phone screenshots: 375 x 760 ----------
function phone(title, accent, seed) {
  const rows = []
  for (let i = 0; i < 4; i++) {
    const y = 150 + i * 116
    rows.push(`<rect x="24" y="${y}" width="64" height="64" rx="10" fill="#e4e4e7"/>`)
    rows.push(`<rect x="104" y="${y + 6}" width="${200 - seed * 6 + i * 8}" height="14" rx="7" fill="#d4d4d8"/>`)
    rows.push(`<rect x="104" y="${y + 32}" width="${120 + seed * 5 - i * 6}" height="12" rx="6" fill="#e4e4e7"/>`)
    rows.push(`<rect x="330" y="${y + 22}" width="20" height="20" rx="6" fill="#f4f4f5"/>`)
  }
  const tabs = [0, 1, 2, 3]
    .map((i) => `<rect x="${48 + i * 96}" y="712" width="24" height="24" rx="6" fill="${i === seed % 4 ? accent : "#d4d4d8"}"/>`)
    .join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="375" height="760" viewBox="0 0 375 760" font-family="${FONT}">
  <rect width="375" height="760" fill="#ffffff"/>
  <rect x="0" y="0" width="375" height="104" fill="#fafafa"/>
  <text x="24" y="46" font-size="13" fill="#a1a1aa">9:41</text>
  <text x="351" y="46" font-size="13" fill="#a1a1aa" text-anchor="end">5G</text>
  <text x="24" y="84" font-size="22" font-weight="600" fill="#18181b">${title}</text>
  <rect x="24" y="116" width="327" height="1" fill="#e4e4e7"/>
  ${rows.join("\n  ")}
  <rect x="0" y="688" width="375" height="72" fill="#fafafa"/>
  <rect x="0" y="688" width="375" height="1" fill="#e4e4e7"/>
  ${tabs}
</svg>`
}

const phoneSteps = ["登录", "商品列表", "商品详情", "购物车", "订单确认"]
phoneSteps.forEach((t, i) => {
  fs.writeFileSync(path.join(out, `phone-${i + 1}.svg`), phone(t, "#2563eb", i + 1))
})

// ---------- CVD analysis screenshots: 1200 x 760 ----------
function cvd(title, note, palette) {
  const bars = palette
    .map((c, i) => {
      const h = 120 + [180, 90, 220, 150][i]
      const x = 300 + i * 190
      return `<rect x="${x}" y="${600 - h}" width="110" height="${h}" rx="6" fill="${c}"/>
  <text x="${x + 55}" y="${620}" font-size="16" fill="#71717a" text-anchor="middle">${["A", "B", "C", "D"][i]}</text>`
    })
    .join("\n  ")
  const legend = palette
    .map(
      (c, i) =>
        `<rect x="${300 + i * 150}" y="664" width="16" height="16" rx="4" fill="${c}"/>
  <text x="${324 + i * 150}" y="677" font-size="14" fill="#52525b">序列 ${["A", "B", "C", "D"][i]}</text>`,
    )
    .join("\n  ")
  const nav = ["总览", "对比度", "色觉", "导出"]
    .map(
      (n, i) =>
        `<rect x="24" y="${180 + i * 56}" width="172" height="40" rx="8" fill="${i === 2 ? "#e4e4e7" : "none"}"/>
  <text x="44" y="${206 + i * 56}" font-size="15" fill="${i === 2 ? "#18181b" : "#71717a"}">${n}</text>`,
    )
    .join("\n  ")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" font-family="${FONT}">
  <rect width="1200" height="760" fill="#ffffff"/>
  <rect x="0" y="0" width="220" height="760" fill="#fafafa"/>
  <rect x="220" y="0" width="1" height="760" fill="#e4e4e7"/>
  <text x="24" y="60" font-size="20" font-weight="600" fill="#18181b">无障碍分析</text>
  ${nav}
  <text x="260" y="70" font-size="24" font-weight="600" fill="#18181b">${title}</text>
  <text x="260" y="102" font-size="15" fill="#71717a">${note}</text>
  <rect x="260" y="140" width="900" height="1" fill="#e4e4e7"/>
  <line x1="260" y1="600" x2="1160" y2="600" stroke="#e4e4e7" stroke-width="1"/>
  ${bars}
  ${legend}
</svg>`
}

const palettes = {
  original: ["#2563eb", "#dc2626", "#16a34a", "#f59e0b"],
  protanopia: ["#2563eb", "#6b6b2e", "#8a8a3a", "#c9a227"],
  deuteranopia: ["#2563eb", "#b45309", "#6b6b2e", "#c9a227"],
  tritanopia: ["#0d9488", "#b91c1c", "#16a34a", "#be185d"],
}
const cvdViews = [
  ["original", "原界面", "未经模拟的原始截图"],
  ["protanopia", "红色盲", "红色通道缺失下的呈现"],
  ["deuteranopia", "绿色盲", "绿色通道缺失下的呈现"],
  ["tritanopia", "蓝色盲", "蓝色通道缺失下的呈现"],
]
cvdViews.forEach(([file, title, note]) => {
  fs.writeFileSync(path.join(out, `cvd-${file}.svg`), cvd(title, note, palettes[file]))
})

console.log("wrote", fs.readdirSync(out).sort().join(", "))
