// Draws the made-up screenshots the two pilot Skills' data refers to.
//
//   python3 skills/make_data.py && node skills/make_images.mjs && python3 skills/simulate_cvd.py
//
// 交互流程挖掘: one low-fidelity phone screen per step of every product's chain, laid out from
// the step's screen name and content (camera frame, face check, form, list, calendar, ...),
// in the product's own brand colour → data/<f>/p<product>-<step>.png
// 色觉无障碍分析: the checked interface drawn with the sample's own colours (so the contrast
// and confusion problems in the data are really there) → data/<c>/original.png
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright-core"

const ROOT = import.meta.dirname
const BRAND = ["#2F6FEB", "#E8590C", "#2B8A3E", "#7048E8"]
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
const items = (s) => s.split(/[、,,]/).map((x) => x.trim()).filter(Boolean)

const phoneCss = (brand) => `
*{box-sizing:border-box;margin:0}body{width:375px;height:760px;font:14px/1.5 "PingFang SC","Noto Sans SC",system-ui,sans-serif;color:#1f1f1f;background:#f5f6f8;position:relative;overflow:hidden}
.status{height:36px;display:flex;justify-content:space-between;align-items:center;padding:0 20px;font-size:13px;font-weight:600;background:#fff}
.nav{height:48px;display:flex;align-items:center;padding:0 16px;background:#fff;border-bottom:1px solid #eee;font-size:17px;font-weight:600}
.nav .back{width:10px;height:10px;border-left:2px solid #333;border-bottom:2px solid #333;transform:rotate(45deg);margin-right:14px}
.body{padding:16px}
.card{background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:12px}
.muted{color:#8a8a8a;font-size:13px}.line{height:10px;border-radius:5px;background:#e6e7ea;margin:8px 0}
.btn{position:absolute;left:16px;right:16px;bottom:28px;height:48px;border-radius:24px;background:${brand};color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600}
.field{background:#fff;border-radius:10px;padding:10px 14px;margin-bottom:10px}.field .lab{font-size:12px;color:#8a8a8a}.field .val{height:20px;border-bottom:1px solid #e6e7ea;margin-top:4px}
.row{display:flex;align-items:center;justify-content:space-between;background:#fff;padding:14px 16px;border-bottom:1px solid #f0f0f0}
.radio{width:18px;height:18px;border-radius:50%;border:2px solid #c4c4c4}.radio.on{border:6px solid ${brand}}
.frame{height:150px;border:2px dashed ${brand};border-radius:12px;display:flex;align-items:center;justify-content:center;color:${brand};margin-bottom:14px;background:#fff}
.circle{width:220px;height:220px;border-radius:50%;border:4px solid ${brand};margin:30px auto 18px;display:flex;align-items:center;justify-content:center;color:#aaa;background:#fff}
.banner{height:140px;border-radius:14px;background:${brand};opacity:.9;color:#fff;padding:20px;font-size:20px;font-weight:600;margin-bottom:14px}
.check{width:72px;height:72px;border-radius:50%;background:${brand};margin:70px auto 16px;position:relative}.check:after{content:"";position:absolute;left:25px;top:16px;width:16px;height:30px;border-right:5px solid #fff;border-bottom:5px solid #fff;transform:rotate(45deg)}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;background:#fff;padding:12px;border-radius:12px}.cal div{height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px}
.tl{display:flex;gap:4px;background:#fff;padding:12px;border-radius:12px;overflow:hidden}.tl div{flex:0 0 60px;height:120px;border-radius:6px;background:#e6e7ea;font-size:11px;color:#666;padding:4px}
.sheet{position:absolute;left:0;right:0;bottom:0;height:330px;background:#fff;border-radius:18px 18px 0 0;padding:20px 16px;box-shadow:0 -6px 20px rgba(0,0,0,.12)}
.tag{display:inline-block;font-size:12px;padding:2px 8px;border-radius:10px;background:#eef2ff;color:${brand};margin-right:6px}
.price{font-size:30px;font-weight:700;color:#1f1f1f;text-align:center;margin:18px 0}
`

function layout(screen, content, action, inputs, brand) {
  const s = screen + content, it = items(content)
  const has = (...k) => k.some((x) => s.includes(x))
  const btn = action ? `<div class="btn">${esc(action)}</div>` : ""
  if (has("成功")) return `<div class="check"></div><div style="text-align:center;font-size:20px;font-weight:600">${esc(screen)}</div><div class="body">${it.map((x) => `<div class="card muted" style="text-align:center">${esc(x)}</div>`).join("")}</div>${btn}`
  if (has("人脸", "核验")) return `<div class="circle">请正对屏幕</div><div class="body">${it.map((x) => `<div class="muted" style="text-align:center">${esc(x)}</div>`).join("")}</div>${btn}`
  if (has("拍摄", "身份证", "凭证", "上传"))
    return `<div class="body"><div class="frame">＋ 人像面 / 第 1 张</div><div class="frame">＋ 国徽面 / 第 2 张</div>${it.map((x) => `<div class="muted">· ${esc(x)}</div>`).join("")}</div>${btn}`
  if (has("协议")) return `<div class="body"><div class="card">${Array.from({ length: 14 }, (_, i) => `<div class="line" style="width:${70 + ((i * 37) % 30)}%"></div>`).join("")}</div><div style="display:flex;gap:8px;align-items:center"><div class="radio"></div><span class="muted">我已阅读并同意</span></div></div>${btn}`
  if (has("日期", "日历")) return `<div class="body"><div class="cal">${"一二三四五六日".split("").map((d) => `<div class="muted">${d}</div>`).join("")}${Array.from({ length: 28 }, (_, i) => `<div style="${i === 12 ? `background:${brand};color:#fff` : ""}">${i + 1}</div>`).join("")}</div></div>${btn}`
  if (has("时间段", "时间轴")) return `<div class="body"><div class="muted" style="margin-bottom:8px">09:00 — 13:00 ‹ 左右滑动 ›</div><div class="tl">${["09:00", "10:00", "11:00", "12:00", "13:00"].map((t, i) => `<div style="${i === 1 || i === 3 ? `background:${brand};opacity:.35` : ""}">${t}</div>`).join("")}</div><div class="card muted" style="margin-top:12px">已占用时段显示为色块</div></div>${btn}`
  if (has("分享面板", "链接设置", "分享设置"))
    return `<div class="body">${Array.from({ length: 5 }, () => `<div class="row"><span class="line" style="width:60%"></span></div>`).join("")}</div><div class="sheet"><div style="font-weight:600;margin-bottom:12px">${esc(screen)}</div>${it.map((x, i) => `<div class="row"><span>${esc(x)}</span><div class="radio ${i === 0 ? "on" : ""}"></div></div>`).join("")}<div class="btn" style="bottom:20px">${esc(action)}</div></div>`
  if (has("购物车")) return `<div class="body">${["招牌牛肉饭 ×1", "卤蛋 ×2", "柠檬茶 ×1"].map((x, i) => `<div class="row"><span>${x}</span><b>¥${[32, 6, 12][i]}</b></div>`).join("")}<div class="card" style="margin-top:12px"><div class="muted">${esc(it.at(-1) ?? "")}</div><div style="height:6px;background:#eee;border-radius:3px;margin-top:6px"><div style="width:80%;height:6px;background:${brand};border-radius:3px"></div></div></div></div>${btn}`
  if (has("支付")) return `<div class="price">¥ 50.00</div><div class="body">${["余额", "银行卡", "其他方式"].map((x, i) => `<div class="row"><span>${x}</span><div class="radio ${i === 0 ? "on" : ""}"></div></div>`).join("")}${it.map((x) => `<div class="muted" style="margin-top:8px">${esc(x)}</div>`).join("")}</div>${btn}`
  if (inputs > 0 || has("填写", "设置", "资料", "地址", "职业", "密码", "输入", "预订入口", "信息"))
    return `<div class="body">${(it.length ? it : ["字段"]).concat(Array(Math.max(0, inputs - it.length)).fill("")).slice(0, 7).map((x) => `<div class="field"><div class="lab">${esc(x || "请填写")}</div><div class="val"></div></div>`).join("")}</div>${btn}`
  if (has("核对", "确认", "汇总", "详情"))
    return `<div class="body"><div class="card">${it.map((x) => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f3f3"><span class="muted">${esc(x)}</span><span class="line" style="width:40%;margin:0"></span></div>`).join("")}</div></div>${btn}`
  if (has("首页", "入口", "订单列表", "文件列表"))
    return `<div class="body"><div class="banner">${esc(screen)}</div>${it.map((x) => `<div class="card"><div>${esc(x)}</div><div class="line" style="width:50%"></div></div>`).join("")}</div>${btn}`
  // lists: coupons, contacts, reasons, rooms, flights, fares, ...
  const rows = it.length >= 3 ? it : [...it, ...["选项 A", "选项 B", "选项 C", "选项 D"]].slice(0, 5)
  return `<div class="body"><div style="border-radius:12px;overflow:hidden">${rows.map((x, i) => `<div class="row"><span>${esc(x)}</span><div class="radio ${i === 0 ? "on" : ""}"></div></div>`).join("")}</div></div>${btn}`
}

function phone(product, step, brand) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${phoneCss(brand)}</style></head><body>
<div class="status"><span>9:41</span><span>${esc(product)}</span><span>100%</span></div>
<div class="nav">${step.no > 1 ? `<div class="back"></div>` : ""}${esc(step.screen)}</div>
${layout(step.screen, step.content, step.action, step.inputs, brand)}</body></html>`
}

// ---------- 色觉无障碍分析: the checked interfaces ----------
const hex = (d, name) => d.palette.find((p) => p.name === name)?.hex
const base = `*{box-sizing:border-box;margin:0}body{font:14px/1.5 "PingFang SC","Noto Sans SC",system-ui,sans-serif;background:#fff;color:#262626;overflow:hidden}`
const CVD_PAGES = {
  c1: (d) => {
    const s = d.palette.map((p) => p.hex)
    const lines = s.map((c, k) => `<polyline fill="none" stroke="${c}" stroke-width="2.5" points="${Array.from({ length: 12 }, (_, i) => `${50 + i * 62},${300 - (60 + k * 22 + Math.round(30 * Math.sin(i / 2 + k)))}`).join(" ")}"/>`).join("")
    return [1200, 760, `<style>${base}.kpi{flex:1;border:1px solid #f0f0f0;border-radius:8px;padding:16px}.tag{color:#fff;padding:2px 10px;border-radius:4px;font-size:12px;margin-left:8px}</style>
<div style="padding:24px 32px"><div style="font-size:20px;font-weight:600">经营看板</div><div style="color:#8C8C8C">更新于 09-20 08:00 · 数据口径:含税</div>
<div style="display:flex;gap:16px;margin:20px 0">${["销售额 2.86 亿", "订单 41.2 万", "客单价 694 元", "复购率 31%"].map((x, i) => `<div class="kpi"><div style="color:#8C8C8C">${x.split(" ")[0]}</div><div style="font-size:26px;font-weight:600">${x.split(" ").slice(1).join(" ")}</div><span class="tag" style="background:${i % 2 ? "#FA8C16" : "#52C41A"};margin:0">${i % 2 ? "预警" : "达标"}</span></div>`).join("")}</div>
<div style="display:flex;gap:16px"><div style="flex:2;border:1px solid #f0f0f0;border-radius:8px;padding:16px"><div style="font-weight:600">各区域销售趋势</div>
<div style="display:flex;gap:14px;margin:8px 0">${s.map((c, i) => `<span style="display:flex;align-items:center;gap:4px;color:#595959;font-size:12px"><i style="width:10px;height:10px;border-radius:50%;background:${c}"></i>区域 ${i + 1}</span>`).join("")}</div>
<svg width="760" height="320">${[0, 1, 2, 3].map((i) => `<line x1="40" x2="740" y1="${60 + i * 70}" y2="${60 + i * 70}" stroke="#f0f0f0"/><text x="0" y="${64 + i * 70}" fill="#BFBFBF" font-size="12">${400 - i * 100}</text>`).join("")}${lines}${Array.from({ length: 12 }, (_, i) => `<text x="${42 + i * 62}" y="315" fill="#BFBFBF" font-size="12">${i + 1}月</text>`).join("")}</svg></div>
<div style="flex:1;border:1px solid #f0f0f0;border-radius:8px;padding:16px"><div style="font-weight:600">区域对比</div>${s.map((c, i) => `<div style="display:flex;align-items:center;gap:8px;margin:12px 0"><span style="width:48px;color:#595959;font-size:12px">区域 ${i + 1}</span><i style="height:14px;width:${200 - i * 18}px;background:${c};border-radius:2px"></i><span style="font-size:12px;color:#262626;background:${i === 6 ? "#FADB14" : "transparent"}">${(98 - i * 9) / 10}</span></div>`).join("")}</div></div></div>`]
  },
  c2: (d) => [375, 760, `<style>${base}</style><div style="background:#FFC300;padding:44px 16px 60px"><div style="color:#fff;font-size:22px;font-weight:700">骑手正在送餐</div><div style="color:#1F1F1F">预计 12:35 送达</div></div>
<div style="margin:-40px 12px 0;background:#fff;border-radius:12px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.08)"><div style="font-weight:600;margin-bottom:12px">配送进度</div>
<div style="display:flex;gap:4px">${["#2BA471", "#2BA471", "#2BA471", "#E34D59", "#E34D59"].map((c) => `<i style="flex:1;height:8px;border-radius:4px;background:${c}"></i>`).join("")}</div>
<div style="display:flex;justify-content:space-between;color:#767676;font-size:12px;margin-top:6px"><span>已接单</span><span>取餐</span><span>配送中</span><span>送达</span></div>
<div style="margin-top:14px;display:flex;justify-content:space-between"><span style="color:#1E7D54">取餐 准时</span><span style="color:#C42B37">配送 已超时 3 分钟</span></div></div>
<div style="margin:12px;background:#fff;border-radius:12px;padding:16px;border:1px solid #f0f0f0">${["招牌牛肉饭 ×1", "卤蛋 ×2", "柠檬茶 ×1"].map((x) => `<div style="display:flex;justify-content:space-between;padding:6px 0"><span>${x}</span><span style="color:#767676">¥ 12</span></div>`).join("")}</div>
<div style="margin:24px 12px;height:46px;border-radius:23px;background:#FFC300;color:#1F1F1F;display:flex;align-items:center;justify-content:center;font-weight:600">联系骑手</div>`],
  c3: (d) => {
    const c = d.palette.map((p) => p.hex)
    const roads = [["M0 140 L375 180", 0, "中山路"], ["M0 300 L375 260", 1, "人民大道"], ["M120 0 L160 760", 2, "解放路"], ["M0 520 L375 470", 3, "滨江大道"], ["M280 0 L250 760", 0, "建设路"], ["M0 650 L375 690", 2, "环城北路"]]
    return [375, 760, `<style>${base}</style><svg width="375" height="760" style="background:#F2EFE9"><rect x="180" y="330" width="70" height="90" fill="#DDE9D5"/><rect x="20" y="380" width="80" height="60" fill="#D5E3EE"/>
${roads.map(([p, k]) => `<path d="${p}" stroke="${c[k]}" stroke-width="9" fill="none" stroke-linecap="round"/>`).join("")}
${roads.map(([p, k, n], i) => { const m = p.match(/M(\d+) (\d+) L(\d+) (\d+)/).map(Number); const x = (m[1] + m[3]) / 2 + (i === 2 || i === 4 ? 8 : -30), y = (m[2] + m[4]) / 2 - 8; return `<text x="${x}" y="${y}" fill="${k === 1 ? "#1C1C1E" : "#FFFFFF"}" font-size="13" font-weight="600">${n}</text>` }).join("")}
<circle cx="200" cy="560" r="9" fill="#2F6FEB" stroke="#fff" stroke-width="3"/></svg>
<div style="position:absolute;top:20px;left:12px;right:12px;background:#fff;border-radius:10px;padding:10px 14px;box-shadow:0 2px 8px rgba(0,0,0,.1)">实时路况 · 今天 18:20</div>`]
  },
  c4: (d) => [1100, 700, `<style>${base}.sw{border:1px solid #D9D9D9;border-radius:8px;overflow:hidden}.sw i{display:block;height:64px}.sw div{padding:6px 10px;font-size:12px}.b{display:inline-block;padding:8px 18px;border-radius:6px;color:#fff;margin-right:10px;font-size:14px}</style>
<div style="padding:28px"><div style="font-size:20px;font-weight:600;color:#262626">中后台设计规范 · 颜色</div><div style="color:#8C8C8C;margin-bottom:18px">共 14 个颜色 token</div>
<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:12px">${d.palette.map((p) => `<div class="sw"><i style="background:${p.hex}"></i><div><b>${p.name}</b><br><span style="color:#8C8C8C">${p.hex}</span></div></div>`).join("")}</div>
<div style="margin-top:24px;font-weight:600">按钮</div><div style="margin-top:10px">${[["主按钮", "#1890FF"], ["悬停", "#40A9FF"], ["成功", "#52C41A"], ["警告", "#FAAD14"], ["危险", "#FF4D4F"]].map(([n, c]) => `<span class="b" style="background:${c}">${n}</span>`).join("")}</div>
<div style="margin-top:24px;font-weight:600">文字</div><div style="display:flex;gap:28px;margin-top:10px"><span style="color:#262626">标题文字</span><span style="color:#595959">正文文字</span><span style="color:#8C8C8C">辅助文字</span><span style="color:#BFBFBF">禁用文字</span><span style="color:#52C41A">成功提示</span><span style="color:#FAAD14">警告提示</span><span style="color:#FF4D4F">错误提示</span><span style="color:#1890FF">链接</span></div>
<div style="margin-top:24px;border:1px solid #D9D9D9;border-radius:8px;overflow:hidden"><div style="background:#F0F0F0;padding:10px 14px;display:flex;gap:120px;color:#262626">名称<span style="color:#8C8C8C">状态</span></div>${["订单 A", "订单 B"].map((x, i) => `<div style="padding:10px 14px;display:flex;gap:120px;background:${i ? "#FAFAFA" : "#fff"}">${x}<span style="color:${i ? "#FF4D4F" : "#52C41A"}">● ${i ? "失败" : "成功"}</span></div>`).join("")}</div></div>`],
  c5: (d) => [375, 760, `<style>${base}.r{color:#F04B4B}.g{color:#1AAE6F}</style><div style="padding:44px 16px 10px"><div style="font-size:18px;font-weight:600">远航科技 600xxx</div>
<div style="display:flex;align-items:baseline;gap:12px"><span class="r" style="font-size:34px;font-weight:700">23.86</span><span class="r">0.92</span><span class="r">4.01%</span></div><div style="color:#8A8A8A;font-size:12px">平盘 22.94 · 均价 <span style="color:#F5A623">23.41</span></div></div>
<svg width="375" height="250"><line x1="0" x2="375" y1="140" y2="140" stroke="#8A8A8A" stroke-dasharray="3 3"/><polyline fill="none" stroke="#F04B4B" stroke-width="2" points="${Array.from({ length: 40 }, (_, i) => `${i * 9.5},${150 - i * 2 - 18 * Math.sin(i / 3)}`).join(" ")}"/><polyline fill="none" stroke="#F5A623" stroke-width="2" points="${Array.from({ length: 40 }, (_, i) => `${i * 9.5},${148 - i * 1.6}`).join(" ")}"/>${Array.from({ length: 40 }, (_, i) => `<rect x="${i * 9.5}" y="${230 - (i * 7) % 30}" width="6" height="${(i * 7) % 30 + 4}" fill="${i % 3 ? "#F04B4B" : "#1AAE6F"}"/>`).join("")}</svg>
<div style="display:flex;gap:16px;padding:10px 16px"><div style="flex:1">${["卖五 23.91", "卖四 23.90", "卖三 23.89", "卖二 23.88", "卖一 23.87"].map((x, i) => `<div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#8A8A8A">${x.split(" ")[0]}</span><span class="${i < 3 ? "r" : "g"}">${x.split(" ")[1]}</span><span>${120 + i * 37}</span></div>`).join("")}</div>
<div style="flex:1">${["买一 23.86", "买二 23.85", "买三 23.84", "买四 23.80", "买五 22.90"].map((x, i) => `<div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#8A8A8A">${x.split(" ")[0]}</span><span class="${i < 4 ? "r" : "g"}">${x.split(" ")[1]}</span><span>${310 - i * 41}</span></div>`).join("")}</div></div>`],
  c6: (d) => {
    const cats = Object.fromEntries(d.palette.map((p) => [p.name, p.hex]))
    const days = ["周一", "周二", "周三", "周四", "周五"]
    const plan = [["必修 高数", "选修 摄影", "必修 英语", "实验 物理", "讲座"], ["必修 英语", "体育 篮球", "考试 线代", "选修 心理", "自习"], ["", "必修 高数", "社团", "必修 英语", "其他"], ["实验 化学", "", "体育 游泳", "自习", "选修 摄影"], ["讲座", "考试 英语", "", "社团", "必修 线代"]]
    return [800, 560, `<style>${base}td{width:140px;height:80px;padding:4px}td div{height:100%;border-radius:8px;color:#fff;font-size:13px;padding:8px;font-weight:600}th{font-weight:600;color:#595959;height:36px}</style>
<div style="padding:20px"><div style="font-size:18px;font-weight:600;margin-bottom:6px">第 3 周课程表</div>
<table style="border-collapse:collapse"><tr><th></th>${days.map((x) => `<th>${x}</th>`).join("")}</tr>${plan.map((row, r) => `<tr><th style="width:50px">${r * 2 + 1}-${r * 2 + 2}节</th>${row.map((x) => { const cat = x.split(" ")[0]; return `<td>${x ? `<div style="background:${cats[cat] ?? "#ccc"}">${(x.split(" ")[1] ?? x)}</div>` : ""}</td>` }).join("")}</tr>`).join("")}</table></div>`]
  },
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" })
try {
  let n = 0
  for (const f of fs.readdirSync(path.join(ROOT, "flow", "data")).filter((x) => x.endsWith(".json"))) {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, "flow", "data", f), "utf8"))
    const dir = path.join(ROOT, "flow", "data", f.replace(".json", ""))
    fs.rmSync(dir, { recursive: true, force: true })
    fs.mkdirSync(dir, { recursive: true })
    const page = await browser.newPage({ viewport: { width: 375, height: 760 } })
    for (const [pi, c] of d.chains.entries())
      for (const st of c.steps) {
        await page.setContent(phone(c.product, st, BRAND[pi]))
        await page.screenshot({ path: path.join(dir, path.basename(st.image)) })
        n++
      }
    await page.close()
  }
  for (const f of fs.readdirSync(path.join(ROOT, "cvd", "data")).filter((x) => x.endsWith(".json"))) {
    const name = f.replace(".json", "")
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, "cvd", "data", f), "utf8"))
    const dir = path.join(ROOT, "cvd", "data", name)
    fs.rmSync(dir, { recursive: true, force: true })
    fs.mkdirSync(dir, { recursive: true })
    const [w, h, html] = CVD_PAGES[name](d)
    const page = await browser.newPage({ viewport: { width: w, height: h } })
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body style="position:relative;width:${w}px;height:${h}px">${html}</body></html>`)
    await page.screenshot({ path: path.join(dir, "original.png") })
    await page.close()
    n++
  }
  console.log(`${n} images`)
} finally {
  await browser.close()
}
