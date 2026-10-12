// The same page (flow f2) written without the component library: one model call asked for a React
// page in plain Tailwind, then rendered with scripts/shoot.mjs (its checks flag the raw tags, as expected).
//
//   source judge.env && node demo/make-free-page.mjs
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { call } from "../../ui-judge/scripts/pairwise-judge.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const ws = path.join(ROOT, "demo", "flow-pages", "free")
fs.mkdirSync(ws, { recursive: true })
const data = fs.readFileSync(path.join(ROOT, "skills", "flow", "data", "f2.json"), "utf8")
fs.writeFileSync(path.join(ws, "data.json"), data)
fs.cpSync(path.join(ROOT, "traces", "flow-g0", "f2", "assets"), path.join(ws, "assets"), { recursive: true })
fs.writeFileSync(path.join(ws, "tsconfig.json"), JSON.stringify({ compilerOptions: { jsx: "react-jsx", resolveJsonModule: true } }))
const sys = `你是前端工程师。根据给你的 data.json,写一个 React 页面文件 Page.tsx,把这份「交互流程挖掘」报告的全部内容排成一页报告(页面宽 1152px 左右)。用 Tailwind CSS 类名排版,自己决定版式、颜色和样式;截图用 <img src={step.image}>。只能 import data from "./data.json" 和 react,不用任何组件库。文件默认导出一个组件。只输出 JSON:{"code":"Page.tsx 的完整内容"}`
console.log("── 让模型不用组件库写 Page.tsx")
const r = await call(sys, [{ type: "text", text: `<data.json>\n${data}\n</data.json>` }], { key: process.env.DEEPSEEK_API_KEY, effort: "high", label: "无组件库页面", onThink: (s) => console.log(`[思考中… ${s} 秒]`), onText: () => {} })
fs.writeFileSync(path.join(ws, "Page.tsx"), r.json.code)
console.log(`写好 Page.tsx(${r.json.code.split("\n").length} 行),开始渲染`)
execFileSync("node", [path.join(ROOT, "scripts", "shoot.mjs"), ws], { stdio: "inherit", cwd: ROOT })
