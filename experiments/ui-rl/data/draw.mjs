// 画报告数据里每一步的手机截图(低保真):从 ui-loop/skills/make_images.mjs 原样复制(2026-10-13),
// BRAND 多加了第 5 个颜色(ui-loop 的数据最多 4 款产品,这里最多 5 款)。gen-data.mjs 用 phone() 画图。
export const BRAND = ["#2F6FEB", "#E8590C", "#2B8A3E", "#7048E8", "#C2255C"]
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

export function phone(product, step, brand) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${phoneCss(brand)}</style></head><body>
<div class="status"><span>9:41</span><span>${esc(product)}</span><span>100%</span></div>
<div class="nav">${step.no > 1 ? `<div class="back"></div>` : ""}${esc(step.screen)}</div>
${layout(step.screen, step.content, step.action, step.inputs, brand)}</body></html>`
}
