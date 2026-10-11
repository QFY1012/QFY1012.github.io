import fs from "node:fs"
import path from "node:path"
import pw from "/home/user/QFY1012.github.io/experiments/ui-loop/node_modules/playwright-core/index.js"
const { chromium } = pw

const ws = "/home/user/QFY1012.github.io/experiments/ui-loop/traces/flow-g0-k1-twin/f1"
const data = JSON.parse(fs.readFileSync(path.join(ws, "data.json"), "utf8"))
const out = path.join(ws, "assets")
fs.mkdirSync(out, { recursive: true })

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{width:375px;height:760px;background:#fff;color:#111;font-family:"Noto Sans SC","PingFang SC","Helvetica Neue",Arial,sans-serif;display:flex;flex-direction:column;overflow:hidden}
.status{height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;font-size:12px;color:#111;flex:none}
.status .r{display:flex;gap:5px;align-items:center}
.status .r i{width:14px;height:8px;border:1px solid #111;border-radius:2px;display:block}
.nav{height:48px;display:flex;align-items:center;gap:10px;padding:0 20px;border-bottom:1px solid #e2e2e2;flex:none}
.nav .bk{font-size:20px;line-height:1;color:#111}
.nav .t{font-size:16px;font-weight:600}
.body{flex:1;min-height:0;padding:20px;display:flex;flex-direction:column;gap:14px;overflow:hidden}
.foot{flex:none;padding:16px 20px 24px}
.btn{height:48px;border-radius:6px;background:#111;color:#fff;font-size:15px;font-weight:500;display:flex;align-items:center;justify-content:center}
.hint{font-size:12px;color:#9a9a9a;line-height:18px}
.hero{background:#f4f4f4;border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:10px}
.hero .hl{height:12px;border-radius:3px;background:#dcdcdc;width:80%}
.hero .hl.short{width:55%}
.hero .hbtn{height:34px;border-radius:6px;background:#111;color:#fff;font-size:13px;display:flex;align-items:center;justify-content:center;margin-top:6px}
.list{display:flex;flex-direction:column;gap:12px}
.li{display:flex;align-items:center;gap:10px;font-size:13px;color:#444}
.li i{width:18px;height:18px;border-radius:50%;background:#ececec;display:block;flex:none}
.doc{border:1px solid #e2e2e2;border-radius:8px;padding:14px;display:flex;flex-direction:column;gap:9px}
.dl{height:8px;border-radius:3px;background:#e6e6e6}
.check{display:flex;align-items:center;gap:8px;font-size:13px;color:#444}
.check i{width:16px;height:16px;border:1px solid #bbb;border-radius:3px;display:block}
.shot{display:flex;gap:12px}
.dash{flex:1;height:150px;border:1px dashed #c8c8c8;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#9a9a9a;background:#fafafa}
.face{flex:1;display:flex;align-items:center;justify-content:center}
.oval{width:190px;height:240px;border:2px solid #cfcfcf;border-radius:50%/40%;background:#fafafa}
.done{display:flex;flex-direction:column;align-items:center;gap:10px;padding:24px 0}
.tick{width:56px;height:56px;border-radius:50%;background:#111;color:#fff;font-size:28px;display:flex;align-items:center;justify-content:center}
.dt{font-size:17px;font-weight:600}
.field{display:flex;flex-direction:column;gap:6px;border-bottom:1px solid #eee;padding-bottom:8px}
.field .fl{font-size:12px;color:#9a9a9a}
.field .fv{height:16px;font-size:14px;color:#111}
.pwd{display:flex;gap:8px}
.pwd i{flex:1;height:42px;border:1px solid #e2e2e2;border-radius:6px;display:block;background:#fafafa}
.tip{background:#f4f4f4;border-radius:8px;padding:12px;font-size:12px;color:#6b6b6b;line-height:18px}
`

function bodyHtml(step) {
  const s = step.screen
  if (s.includes("首页")) return `
    <div class="hero"><div class="hl"></div><div class="hl short"></div><div class="hbtn">${esc(step.action)}</div></div>
    <div class="list">
      <div class="li"><i></i><span>权益一 · 免年费</span></div>
      <div class="li"><i></i><span>权益二 · 转账免费</span></div>
      <div class="li"><i></i><span>权益三 · 专属理财</span></div>
    </div>`
  if (s.includes("协议")) return `
    <div class="doc">${Array.from({ length: 13 }).map((_, i) => `<div class="dl" style="width:${90 - (i % 4) * 10}%"></div>`).join("")}</div>
    <div class="check"><i></i><span>我已阅读并同意上述协议</span></div>`
  if (s.includes("拍摄")) return `
    <div class="shot"><div class="dash">人像面</div><div class="dash">国徽面</div></div>
    <div class="hint">${esc(step.note || "请将证件放入框内,避免反光")}</div>`
  if (s.includes("人脸")) return `
    <div class="face"><div class="oval"></div></div>
    <div class="hint">${esc(step.note || "请正对屏幕,保持光线充足")}</div>`
  if (s.includes("成功")) return `
    <div class="done"><div class="tick">✓</div><div class="dt">开户成功</div></div>
    <div class="field"><span class="fl">账号</span><span class="fv">6217 **** **** 8829</span></div>
    <div class="field"><span class="fl">限额</span><span class="fv">单笔 1 万元 · 日累计 5 万元</span></div>`
  if (s.includes("密码")) return `
    <div class="hint">设置 6 位交易密码</div>
    <div class="pwd">${Array.from({ length: 6 }).map(() => "<i></i>").join("")}</div>
    <div class="hint">再次输入确认</div>
    <div class="pwd">${Array.from({ length: 6 }).map(() => "<i></i>").join("")}</div>`
  if (s.includes("核对") || s.includes("确认资料")) return `
    <div class="field"><span class="fl">姓名</span><span class="fv">张 三</span></div>
    <div class="field"><span class="fl">证件号</span><span class="fv">3301 **** **** 0021</span></div>
    <div class="field"><span class="fl">地址</span><span class="fv">浙江省杭州市西湖区 …</span></div>
    <div class="hint">${esc(step.note || "信息识别自证件,请确认无误")}</div>`
  // generic form: inputs
  const labels = { 1: ["卡号"], 2: ["职业", "单位名称"], 3: ["卡号", "预留手机号", "验证码"], 4: ["省", "市", "区", "详细地址"], 7: ["职业", "地址", "手机号", "年收入"] }
  const ls = labels[step.inputs] || Array.from({ length: step.inputs || 1 }).map((_, i) => `字段 ${i + 1}`)
  return `
    <div class="tip">${esc(step.content)}</div>
    ${ls.map((l) => `<div class="field"><span class="fl">${esc(l)}</span><span class="fv"></span></div>`).join("")}`
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" })
const page = await browser.newPage({ viewport: { width: 375, height: 760 }, deviceScaleFactor: 1 })

let count = 0
for (const chain of data.chains) {
  for (const step of chain.steps) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
      <div class="status"><span>9:41</span><span class="r"><i></i></span></div>
      <div class="nav"><span class="bk">‹</span><span class="t">${esc(step.screen)}</span></div>
      <div class="body">${bodyHtml(step)}</div>
      <div class="foot"><div class="btn">${esc(step.action)}</div></div>
    </body></html>`
    await page.setContent(html, { waitUntil: "load" })
    const file = path.join(ws, step.image)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 375, height: 760 } })
    count++
  }
}
await browser.close()
console.log("generated", count, "images")
