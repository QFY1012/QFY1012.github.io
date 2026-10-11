import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright-core"
const OUT = path.resolve(".build")
const MIME = { ".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".woff2":"font/woff2",".woff":"font/woff" }
const server = http.createServer((req,res)=>{const p=path.join(OUT,decodeURIComponent(new URL(req.url,"http://x").pathname));if(!p.startsWith(OUT)||!fs.existsSync(p)||fs.statSync(p).isDirectory())return res.writeHead(404).end();res.writeHead(200,{"content-type":MIME[path.extname(p)]??"application/octet-stream"});fs.createReadStream(p).pipe(res)})
await new Promise(r=>server.listen(0,"127.0.0.1",r))
const url=`http://127.0.0.1:${server.address().port}/index.html`
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??"/opt/pw-browsers/chromium"})
const page=await browser.newPage({viewport:{width:1440,height:900}})
await page.goto(url); await page.waitForFunction(()=>window.__READY__===true)
// hover over the first strip
const box = await page.evaluate(()=>{const s=document.querySelector("[data-slot=figure-strip]");const r=s.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})
await page.mouse.move(box.x, box.y)
await page.waitForTimeout(400)
const info=await page.evaluate(()=>{
  const strip=document.querySelector("[data-slot=figure-strip]")
  const bars=[...strip.querySelectorAll("[data-slot=scroll-area-scrollbar]")].map(b=>{const br=b.getBoundingClientRect();const cs=getComputedStyle(b);return{orient:b.getAttribute("data-orientation"),state:b.getAttribute("data-state"),w:Math.round(br.width),h:Math.round(br.height),top:Math.round(br.top),left:Math.round(br.left),bottom:Math.round(br.bottom),pos:cs.position,disp:cs.display}})
  const vp=strip.querySelector("[data-slot=scroll-area-viewport]")
  return {bars, scrollW: vp.scrollWidth, clientW: vp.clientWidth, canScroll: vp.scrollWidth>vp.clientWidth}
})
console.log(JSON.stringify(info,null,1))
await page.screenshot({path:"_hover.png", clip:{x:48,y:440-60,width:1152,height:560}})
await browser.close(); server.close()
