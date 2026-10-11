// Re-screenshot a run's pages after a component fix: the Page.tsx files stay as they are, the
// screenshots, program checks and 需求 judge results are redone (the judge results are dropped, so the
// loop judges the new screenshots again).
//
//   node scripts/reshoot.mjs --run flow-g0-k1 --why "Figure 把图横向拉长,修好后重截"
import fs from "node:fs"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const ROOT = path.resolve(import.meta.dirname, "..")
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i > 0 ? process.argv[i + 1] : d
}
const run = arg("run"), why = arg("why", "")
const dir = path.join(ROOT, "traces", run)
const cases = fs.readdirSync(dir).filter((c) => fs.existsSync(path.join(dir, c, "Page.tsx")))

async function reshoot(c) {
  const ws = path.join(dir, c)
  for (const f of fs.readdirSync(ws)) if (/^tile-\d+\.png$|^function-.*\.json$/.test(f)) fs.rmSync(path.join(ws, f))
  await promisify(execFile)("node", [path.join(ROOT, "scripts", "shoot.mjs"), ws], { cwd: ROOT })
  const checks = JSON.parse(fs.readFileSync(path.join(ws, "checks.json"), "utf8"))
  const metaFile = path.join(ws, "meta.json")
  const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"))
  fs.writeFileSync(metaFile, JSON.stringify({ ...meta, checks, reshot: [...(meta.reshot ?? []), { at: new Date().toISOString(), why }] }, null, 1))
  console.log(`${run}/${c}: ${checks.length} check findings`)
}
const queue = [...cases]
await Promise.all(Array.from({ length: 3 }, async () => { while (queue.length) await reshoot(queue.shift()) }))
