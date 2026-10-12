// Draws the demo page's screenshots as SVG. They stand in for the real screen
// captures (which the demo has none of): four phone screens at 375×760, three
// wide analysis screens at 1200×760, and one interface drawn four times (the
// original plus the three colour-vision simulations) at 640×400. The sizes
// differ on purpose, so the demo proves the strip lines up screens of different
// ratios and the grid gives each comparison view half the column.
//
//   node tools/gen-assets.mjs [outDir]      (default: ./assets)
import fs from "node:fs"
import path from "node:path"

const OUT = path.resolve(process.argv[2] ?? "assets")
fs.mkdirSync(OUT, { recursive: true })
const F = `font-family="Noto Sans SC, WenQuanYi Zen Hei, DejaVu Sans, sans-serif"`

// Deterministic PRNG so re-running the script rewrites the same pictures.
function rng(seed) {
  let s = seed
  return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648
}

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`

const t = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}" ${F} font-size="${o.size ?? 15}" font-weight="${o.weight ?? 400}" fill="${o.fill ?? "#111"}"${o.anchor ? ` text-anchor="${o.anchor}"` : ""}>${s}</text>`

// An Ishihara-style plate: a disc of dots with a digit hidden in one hue.
function plate(cx, cy, r, seed, ink) {
  const rnd = rng(seed)
  let out = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f3f1ec"/>`
  for (let i = 0; i < 190; i++) {
    const a = rnd() * Math.PI * 2
    const d = Math.sqrt(rnd()) * (r - 6)
    const x = cx + Math.cos(a) * d
    const y = cy + Math.sin(a) * d
    const rr = 3 + rnd() * 5
    const onDigit = Math.abs(d - r * 0.55) < r * 0.17 || (x > cx + r * 0.1 && Math.abs(y - cy) < r * 0.1)
    const pal = onDigit ? ink : ["#c9c4bb", "#b7b2a8", "#ddd8ce", "#a9a49a"]
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" fill="${pal[Math.floor(rnd() * pal.length)]}"/>`
  }
  return out
}

// ---------- one phone screen, 375 × 760 ----------
function phone({ title, sub, step, plate: pl, inkName, cta, footer }) {
  let b = `<rect width="375" height="760" fill="#ffffff"/>`
  b += t(24, 34, "9:41", { size: 13, weight: 600 })
  b += `<rect x="290" y="22" width="22" height="11" rx="3" fill="#111"/><rect x="316" y="22" width="30" height="11" rx="3" fill="#d4d4d4"/>`
  b += `<line x1="0" y1="56" x2="375" y2="56" stroke="#e5e5e5"/>`
  b += t(187, 62, step, { size: 12, fill: "#a3a3a3", anchor: "middle" })
  b += t(24, 100, title, { size: 24, weight: 600 })
  b += t(24, 128, sub, { size: 13, fill: "#737373" })
  b += plate(187, 320, 132, pl.seed, pl.ink)
  b += t(24, 500, "图版", { size: 12, fill: "#737373" })
  b += t(24, 526, inkName, { size: 15, weight: 500 })
  b += `<line x1="24" y1="548" x2="351" y2="548" stroke="#e5e5e5"/>`
  b += t(24, 578, "参考答案", { size: 12, fill: "#737373" })
  b += t(24, 604, "42", { size: 15, weight: 500 })
  b += `<line x1="24" y1="626" x2="351" y2="626" stroke="#e5e5e5"/>`
  b += `<rect x="24" y="654" width="327" height="48" rx="6" fill="#111"/>`
  b += t(187, 684, cta, { size: 15, weight: 500, fill: "#ffffff", anchor: "middle" })
  b += t(187, 730, footer, { size: 12, fill: "#a3a3a3", anchor: "middle" })
  return svg(375, 760, b)
}

fs.writeFileSync(path.join(OUT, "phone-home.svg"), phone({
  title: "色觉自测", sub: "第 1 步 · 确认设备与光线", step: "1 / 3",
  plate: { seed: 7, ink: ["#c0392b", "#a93226", "#d35400"] }, inkName: "红色盲易混淆图版",
  cta: "开始检测", footer: "全程约 3 分钟",
}))
fs.writeFileSync(path.join(OUT, "phone-test.svg"), phone({
  title: "图版 4 / 12", sub: "第 2 步 · 读出图版中的数字", step: "2 / 3",
  plate: { seed: 23, ink: ["#27ae60", "#229954", "#1e8449"] }, inkName: "绿色盲易混淆图版",
  cta: "看不清，跳过", footer: "已用 1 分 12 秒",
}))
fs.writeFileSync(path.join(OUT, "phone-result.svg"), phone({
  title: "检测结果", sub: "第 3 步 · 结果与建议", step: "3 / 3",
  plate: { seed: 41, ink: ["#2980b9", "#2471a3", "#1f618d"] }, inkName: "蓝色盲易混淆图版",
  cta: "查看分析报告", footer: "结果仅作筛查，不作为诊断",
}))

// A share sheet: the conclusion as a card the team can pass around.
{
  let b = `<rect width="375" height="760" fill="#ffffff"/>`
  b += t(24, 34, "9:41", { size: 13, weight: 600 })
  b += `<rect x="290" y="22" width="22" height="11" rx="3" fill="#111"/><rect x="316" y="22" width="30" height="11" rx="3" fill="#d4d4d4"/>`
  b += `<line x1="0" y1="56" x2="375" y2="56" stroke="#e5e5e5"/>`
  b += t(24, 100, "分享结论", { size: 24, weight: 600 })
  b += t(24, 128, "把这次筛查的结果发给团队", { size: 13, fill: "#737373" })
  b += `<rect x="24" y="152" width="327" height="264" rx="6" fill="#fafafa" stroke="#ececec"/>`
  b += t(48, 192, "色觉无障碍 · 筛查结论", { size: 15, weight: 600 })
  b += t(48, 220, "样本 1,284 · 2026-09", { size: 12, fill: "#737373" })
  b += `<line x1="48" y1="240" x2="327" y2="240" stroke="#e5e5e5"/>`
  ;[["严重", "#c0392b", 500], ["中等", "#111111", 400], ["轻微", "#111111", 400]].forEach(([sev, ink, w], i) => {
    const y = 272 + i * 36
    b += t(48, y, ["红色盲与绿色盲混为一片", "对比度不足", "灰字偏浅"][i], { size: 13 })
    b += t(327, y, sev, { size: 13, weight: w, fill: ink, anchor: "end" })
    b += `<line x1="48" y1="${y + 12}" x2="327" y2="${y + 12}" stroke="#f0f0f0"/>`
  })
  b += t(48, 396, "口径：CIEDE2000，ΔE 低于 10 记为不可辨", { size: 11, fill: "#a3a3a3" })
  b += `<rect x="24" y="444" width="327" height="44" rx="6" fill="#111"/>`
  b += t(187, 472, "复制链接", { size: 15, weight: 500, fill: "#ffffff", anchor: "middle" })
  b += `<rect x="24" y="500" width="327" height="44" rx="6" fill="#ffffff" stroke="#d4d4d4"/>`
  b += t(187, 528, "导出 PDF", { size: 15, weight: 500, anchor: "middle" })
  b += t(187, 600, "链接 7 天后失效", { size: 12, fill: "#a3a3a3", anchor: "middle" })
  fs.writeFileSync(path.join(OUT, "phone-share.svg"), svg(375, 760, b))
}

// ---------- one wide analysis screen, 1200 × 760 ----------
{
  let b = `<rect width="1200" height="760" fill="#ffffff"/>`
  b += t(40, 56, "混淆色分析", { size: 26, weight: 600 })
  b += t(40, 84, "样本 1,284 · 2026-09-01 至 2026-09-30", { size: 13, fill: "#737373" })
  b += `<line x1="40" y1="112" x2="1160" y2="112" stroke="#e5e5e5"/>`
  b += t(40, 160, "最易混淆的一对", { size: 12, fill: "#737373" })
  b += t(40, 196, "ΔE 4.2", { size: 34, weight: 300 })
  b += t(152, 196, "低于可辨阈值 10", { size: 13, fill: "#737373" })
  b += `<rect x="40" y="222" width="300" height="60" rx="4" fill="#c0392b"/><rect x="348" y="222" width="300" height="60" rx="4" fill="#27ae60"/>`
  b += t(190, 260, "#C0392B", { size: 15, weight: 500, fill: "#ffffff", anchor: "middle" })
  b += t(498, 260, "#27AE60", { size: 15, weight: 500, fill: "#ffffff", anchor: "middle" })
  b += t(40, 340, "按色盲类型的问题数", { size: 12, fill: "#737373" })
  ;[["红色盲", 128], ["绿色盲", 96], ["蓝色盲", 41]].forEach(([name, v], i) => {
    const y = 366 + i * 46
    b += t(40, y + 16, name, { size: 14 })
    b += `<rect x="140" y="${y + 8}" width="440" height="1" fill="#e5e5e5"/>`
    b += `<rect x="140" y="${y + 8}" width="${(v / 128) * 440}" height="1" fill="#737373"/>`
    b += t(596, y + 16, String(v), { size: 14 })
  })
  b += t(700, 160, "问题明细", { size: 12, fill: "#737373" })
  b += `<line x1="700" y1="176" x2="1160" y2="176" stroke="#e5e5e5"/>`
  ;[["C-01", "严重"], ["C-02", "中等"], ["C-03", "轻微"], ["C-04", "严重"], ["C-05", "中等"]].forEach(([id, sev], i) => {
    const y = 206 + i * 40
    b += t(700, y, id, { size: 14 })
    b += t(800, y, sev === "严重" ? "红色盲与绿色盲混为一片" : "对比度不足", { size: 14 })
    b += t(1160, y, sev, { size: 14, weight: sev === "严重" ? 500 : 400, fill: sev === "严重" ? "#c0392b" : "#111", anchor: "end" })
    b += `<line x1="700" y1="${y + 14}" x2="1160" y2="${y + 14}" stroke="#f0f0f0"/>`
  })
  b += t(700, 452, "口径:CIEDE2000，阈值 10", { size: 12, fill: "#737373" })
  b += t(40, 520, "近 6 个月严重问题数", { size: 12, fill: "#737373" })
  const pts = [12, 15, 11, 9, 7, 5]
  b += `<polyline fill="none" stroke="#111" stroke-width="1.5" points="${pts.map((v, i) => `${40 + i * 110},${660 - v * 8}`).join(" ")}"/>`
  b += `<line x1="40" y1="664" x2="700" y2="664" stroke="#e5e5e5"/>`
  pts.forEach((v, i) => (b += `<circle cx="${40 + i * 110}" cy="${660 - v * 8}" r="3" fill="#111"/>`))
  b += t(700, 700, "2026-09", { size: 12, fill: "#737373", anchor: "end" })
  fs.writeFileSync(path.join(OUT, "analysis-overview.svg"), svg(1200, 760, b))
}

// ---------- the issue list, wide, 1200 × 760 ----------
{
  let b = `<rect width="1200" height="760" fill="#ffffff"/>`
  b += t(40, 56, "问题明细", { size: 26, weight: 600 })
  b += t(40, 84, "按严重度排序 · 共 23 项", { size: 13, fill: "#737373" })
  b += `<line x1="40" y1="112" x2="1160" y2="112" stroke="#e5e5e5"/>`
  b += t(40, 148, "编号", { size: 12, fill: "#737373" })
  b += t(160, 148, "界面", { size: 12, fill: "#737373" })
  b += t(480, 148, "问题", { size: 12, fill: "#737373" })
  b += t(1000, 148, "严重度", { size: 12, fill: "#737373" })
  b += t(1160, 148, "影响人数", { size: 12, fill: "#737373", anchor: "end" })
  const rows = [
    ["C-01", "色觉自测 · 图版页", "红色盲与绿色盲的图版底点混成一片", "严重", "1,284"],
    ["C-02", "分析后台 · 混淆色", "ΔE 4.2 的两个色块并排，只有色差", "严重", "986"],
    ["C-03", "通勤热力 · 地图", "拥堵与畅通两条路线只靠红绿区分", "中等", "742"],
    ["C-04", "检测结果 · 建议", "建议段落对比度 3.1:1，低于 4.5:1", "中等", "517"],
    ["C-05", "分享卡片", "底部说明 12px 灰字，放大后仍偏浅", "轻微", "203"],
  ]
  rows.forEach(([id, screen, issue, sev, people], i) => {
    const y = 186 + i * 40
    b += t(40, y, id, { size: 14 })
    b += t(160, y, screen, { size: 14 })
    b += t(480, y, issue, { size: 14 })
    b += t(1000, y, sev, { size: 14, weight: sev === "严重" ? 500 : 400, fill: sev === "严重" ? "#c0392b" : "#111111" })
    b += t(1160, y, people, { size: 14, anchor: "end" })
    b += `<line x1="40" y1="${y + 14}" x2="1160" y2="${y + 14}" stroke="#f0f0f0"/>`
  })
  b += t(40, 420, "口径：CIEDE2000，ΔE 低于 10 记为不可辨", { size: 12, fill: "#737373" })
  b += `<rect x="40" y="470" width="1120" height="1" fill="#e5e5e5"/>`
  b += t(40, 510, "指派", { size: 12, fill: "#737373" })
  b += t(40, 544, "设计 3 人 · 前端 2 人 · 数据 1 人", { size: 14 })
  b += `<rect x="40" y="580" width="160" height="40" rx="6" fill="#111"/>`
  b += t(120, 605, "批量指派", { size: 14, weight: 500, fill: "#ffffff", anchor: "middle" })
  b += `<rect x="216" y="580" width="160" height="40" rx="6" fill="#ffffff" stroke="#d4d4d4"/>`
  b += t(296, 605, "导出清单", { size: 14, weight: 500, anchor: "middle" })
  fs.writeFileSync(path.join(OUT, "analysis-issues.svg"), svg(1200, 760, b))
}

// ---------- the palette check, wide, 1200 × 760 ----------
{
  let b = `<rect width="1200" height="760" fill="#ffffff"/>`
  b += t(40, 56, "色板对比", { size: 26, weight: 600 })
  b += t(40, 84, "原色板与三型色觉模拟并排，标出 ΔE 最低的一对", { size: 13, fill: "#737373" })
  b += `<line x1="40" y1="112" x2="1160" y2="112" stroke="#e5e5e5"/>`
  const cols = [
    ["原色板", ["#c0392b", "#27ae60", "#2980b9", "#f39c12"]],
    ["红色盲", ["#8a7a2b", "#a8a83a", "#2980b9", "#c8b24a"]],
    ["绿色盲", ["#a08b2c", "#9a9a3c", "#2980b9", "#c4b04a"]],
    ["蓝色盲", ["#c0392b", "#27ae60", "#6f7f8a", "#c98b9a"]],
  ]
  cols.forEach(([name, colors], i) => {
    const x = 40 + i * 280
    b += t(x, 152, name, { size: 14, weight: 500 })
    colors.forEach((c, j) => {
      b += `<rect x="${x}" y="${172 + j * 84}" width="240" height="64" rx="4" fill="${c}"/>`
      b += t(x + 12, 172 + j * 84 + 38, c.toUpperCase(), { size: 13, weight: 500, fill: "#ffffff" })
    })
  })
  b += `<line x1="40" y1="530" x2="1160" y2="530" stroke="#e5e5e5"/>`
  b += t(40, 566, "ΔE 最低的一对", { size: 12, fill: "#737373" })
  b += t(40, 604, "#C0392B 与 #27AE60", { size: 22, weight: 300 })
  b += t(320, 604, "ΔE 4.2", { size: 14, fill: "#737373" })
  b += t(40, 646, "建议：这一对不要在同一屏里只靠颜色区分，加文字或图形标注。", { size: 14, fill: "#444444" })
  fs.writeFileSync(path.join(OUT, "analysis-colors.svg"), svg(1200, 760, b))
}

// ---------- one interface, four colour treatments, 640 × 400 ----------
const MAPS = {
  "sim-original": { name: "原界面", road: ["#c0392b", "#27ae60", "#2980b9"], block: ["#fdecea", "#eafaf1", "#eaf2fb"], pin: "#c0392b" },
  "sim-protanopia": { name: "红色盲模拟", road: ["#8a7a2b", "#a8a83a", "#2980b9"], block: ["#f7f4e6", "#f5f7e4", "#eaf2fb"], pin: "#8a7a2b" },
  "sim-deuteranopia": { name: "绿色盲模拟", road: ["#a08b2c", "#9a9a3c", "#2980b9"], block: ["#f8f5e4", "#f4f6e2", "#eaf2fb"], pin: "#a08b2c" },
  "sim-tritanopia": { name: "蓝色盲模拟", road: ["#c0392b", "#27ae60", "#6f7f8a"], block: ["#fdecea", "#eafaf1", "#f0f2f3"], pin: "#c0392b" },
}
for (const [file, m] of Object.entries(MAPS)) {
  let b = `<rect width="640" height="400" fill="#ffffff"/>`
  b += t(24, 36, "通勤热力 · 中心城区", { size: 17, weight: 600 })
  b += t(24, 58, "早高峰 07:30 – 09:00", { size: 12, fill: "#737373" })
  b += `<rect x="24" y="74" width="592" height="256" fill="#fafafa" stroke="#ececec"/>`
  for (let i = 0; i < 14; i++) {
    const x = 32 + (i % 5) * 118
    const y = 82 + Math.floor(i / 5) * 84
    b += `<rect x="${x}" y="${y}" width="104" height="70" fill="${m.block[i % 3]}"/>`
  }
  b += `<line x1="24" y1="180" x2="616" y2="180" stroke="${m.road[0]}" stroke-width="5"/>`
  b += `<line x1="24" y1="262" x2="616" y2="262" stroke="${m.road[1]}" stroke-width="5"/>`
  b += `<line x1="270" y1="74" x2="270" y2="330" stroke="${m.road[2]}" stroke-width="5"/>`
  b += `<line x1="470" y1="74" x2="470" y2="330" stroke="${m.road[0]}" stroke-width="5"/>`
  b += t(34, 172, "中山路", { size: 12, fill: "#444444" })
  b += t(34, 254, "解放大道", { size: 12, fill: "#444444" })
  b += t(276, 100, "沿江路", { size: 12, fill: "#444444" })
  b += `<circle cx="590" cy="180" r="6" fill="${m.road[0]}"/>`
  b += `<circle cx="590" cy="262" r="6" fill="${m.road[1]}"/>`
  b += `<circle cx="590" cy="120" r="6" fill="${m.road[2]}"/>`
  b += `<circle cx="470" cy="100" r="6" fill="${m.pin}"/>`
  b += t(478, 104, "事故点", { size: 11, fill: "#444444" })
  ;[["拥堵", m.road[0]], ["畅通", m.road[1]], ["公交专用", m.road[2]]].forEach(([n, c], i) => {
    const x = 24 + i * 150
    b += `<rect x="${x}" y="352" width="12" height="12" fill="${c}"/>`
    b += t(x + 20, 363, n, { size: 13, fill: "#333333" })
  })
  b += t(616, 363, m.name, { size: 12, fill: "#737373", anchor: "end" })
  fs.writeFileSync(path.join(OUT, `${file}.svg`), svg(640, 400, b))
}

console.log(`wrote ${fs.readdirSync(OUT).length} files to ${OUT}`)
