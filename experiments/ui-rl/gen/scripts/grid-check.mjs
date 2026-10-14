// 网格检查:页面上每一块内容的左右边都要落在页面的栏线上(12 列,每列 74px,列间距 24px);
// 每一节的上边落在场线上(场高 144px、场间距 24px)。
// 网格里怎么填都可以(从哪一列开始、占几列、留不留空格),但不能落在两条栏线之间。
// shoot.mjs 在组件库带 grid.ts(能写 start、rowSpan 的那一版)时调用;SHOOT_GRID=0 关掉。
//
// 量的是这些块:节标题和节内容、Group、Grid、Block、Rule、各内容组件(Text、Stat、表格、图表、列表、KV、
// 进度条列表、截图条),放在 Grid 或按网格换行的截图条(写了 span)里的 Figure,以及多列 List 的每一条。表格、图表里面的东西不量;
// FigureGrid、FigureCompare 是色觉模拟那一组的固定排法,里面的每张图也不量,只量整组。
export function gridOffenders() {
  const main = document.querySelector("main")
  if (!main) return []
  const left = main.getBoundingClientRect().left
  const starts = Array.from({ length: 12 }, (_, k) => left + k * 98)
  const ends = starts.map((s) => s + 74)
  const off = (x, lines) => lines.reduce((m, l) => (Math.abs(x - l) < Math.abs(m) ? x - l : m), Infinity)
  const col = (x, lines) => lines.reduce((b, l, i) => (Math.abs(x - l) < Math.abs(x - lines[b]) ? i : b), 0) + 1
  const SLOTS = new Set(["section-header", "section-body", "group", "grid", "block", "rule", "text", "custom-stat", "custom-table", "custom-chart", "custom-list", "custom-kv", "custom-progress-list", "figure-strip"])
  const isGrid = (el) => el && getComputedStyle(el).display === "grid"
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== main; p = p.parentElement) if (getComputedStyle(p).overflowX !== "visible") return true
    return false
  }
  const out = [], reported = []
  for (const el of main.querySelectorAll("*")) {
    const slot = el.getAttribute("data-slot")
    const parent = el.parentElement
    const measured =
      SLOTS.has(slot) ||
      (slot === "figure" && ["grid", "figure-strip"].includes(parent?.getAttribute("data-slot")) && isGrid(parent)) ||
      (parent?.getAttribute("data-slot") === "custom-list" && isGrid(parent))
    // A block inside one already reported is off because its parent is: report only the outer one.
    if (!measured || clipped(el) || reported.some((p) => p.contains(el))) continue
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    const dl = off(r.left, starts), dr = off(r.right, ends)
    if (Math.abs(dl) <= 1 && Math.abs(dr) <= 1) continue
    const t = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24)
    const where = []
    if (Math.abs(dl) > 1) where.push(`左边离第 ${col(r.left, starts)} 列的起点 ${Math.round(dl)}px`)
    if (Math.abs(dr) > 1) where.push(`右边离第 ${col(r.right, ends)} 列的终点 ${Math.round(dr)}px`)
    reported.push(el)
    out.push(`${slot ?? el.tagName.toLowerCase()}「${t}」没有落在栏线上:${where.join(",")}`)
  }
  // 横线:每一节占整数个场,上边落在场线上。场高 144px、场间距 24px,场线相隔 168px,从页头的上边算起。
  const head = main.querySelector("[data-slot=page-header]")
  if (head) {
    const top = head.getBoundingClientRect().top
    for (const sec of main.querySelectorAll("[data-slot=section]")) {
      const y = sec.getBoundingClientRect().top - top, d = y - Math.round(y / 168) * 168
      if (Math.abs(d) > 1) out.push(`节「${sec.querySelector("h2")?.textContent ?? ""}」的上边没有落在场线上:离最近的场线 ${Math.round(d)}px`)
    }
  }
  return out
}
