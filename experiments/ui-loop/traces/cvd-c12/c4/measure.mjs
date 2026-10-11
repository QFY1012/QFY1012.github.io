import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright-core"
const OUT = path.resolve(".build")
const MIME={".png":"image/png",".js":"text/javascript",".css":"text/css",".html":"text/html",".woff2":"font/woff2",".woff":"font/woff",".json":"application/json"}
const server=http.createServer((req,res)=>{const p=path.join(OUT,decodeURIComponent(new URL(req.url,"http://x").pathname));if(!fs.existsSync(p)||fs.statSync(p).isDirectory())return res.writeHead(404).end();res.writeHead(200,{"content-type":MIME[path.extname(p)]??"application/octet-stream"});fs.createReadStream(p).pipe(res)})
await new Promise(r=>server.listen(0,"127.0.0.1",r))
const url=`http://127.0.0.1:${server.address().port}/index.html`
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??"/opt/pw-browsers/chromium"})
const page=await browser.newPage({viewport:{width:1440,height:900}})
await page.goto(url)
await page.waitForFunction(()=>window.__READY__===true,null,{timeout:30000})
const r=await page.evaluate(()=>{
  const strips=[...document.querySelectorAll("[data-slot=figure-strip]")]
  const groups=[...document.querySelectorAll("[data-slot=group]")]
  const g=groups.find(x=>x.querySelector("[data-slot=figure-strip]"))
  const gb=g?.querySelector("[data-slot=group-body]")
  const cs=gb?getComputedStyle(gb):null
  return {
    stripCount:strips.length,
    strips:strips.map(s=>{const b=s.getBoundingClientRect();return {left:Math.round(b.left),right:Math.round(b.right),w:Math.round(b.width),figs:s.querySelectorAll("[data-slot=figure]").length,scrollW:s.scrollWidth,clientW:s.clientWidth}}),
    groupGap:cs?cs.gap:null,
    figChildren:[...document.querySelectorAll("[data-slot=figure]")].map(f=>[...f.children].map(c=>c.getAttribute("data-slot")||c.tagName.toLowerCase())),
    stripsInGroup: g? g.querySelectorAll("[data-slot=figure-strip]").length : null,
    main:[...document.querySelectorAll("main")].map(m=>{const b=m.getBoundingClientRect();return {left:Math.round(b.left),right:Math.round(b.right)}}),
  }
})
console.log(JSON.stringify(r,null,1))
await browser.close();server.close()
