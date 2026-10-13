// 把标注集用到的每个页面按节截图,给「按节对齐」的 judge 用(做法见 lib/sections.mjs)。
//
//   node experiments/ui-rl/scripts/section-crops.mjs [--only flow-c3/f4,...]
//
// 页面取自 ui-loop/traces/<run>/<case>,写到 cache/sections/<run>/<case>/。已有 sections.json 的跳过。
import fs from "node:fs"
import path from "node:path"
import { cropSections } from "../lib/sections.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const TRACES = path.join(ROOT, "..", "ui-loop", "traces")
const CACHE = path.join(ROOT, "cache", "sections")
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d)
const key = JSON.parse(fs.readFileSync(path.join(ROOT, "labels", "key.json"), "utf8"))
let pages = [...new Set(key.flatMap((p) => [`${p.base}/${p.case}`, `${p.cand}/${p.case}`]))]
if (arg("only")) pages = arg("only").split(",")
const todo = pages.filter((p) => !fs.existsSync(path.join(CACHE, p, "sections.json")))
console.log(`${pages.length} 个页面,要截 ${todo.length} 个`)
await cropSections(todo.map((p) => ({ ws: path.join(TRACES, p), out: path.join(CACHE, p) })))
