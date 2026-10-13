// 训练的生成:一份报告数据,用同一份指南从零写几版页面(gen/scripts/generate.mjs,从 ui-loop 复制来的生成 Agent)。
//
//   await rollout({ report: "f7", guide: ".../guide.md", dir: "runs/<run>/pages/s01", versions: ["v1", ...] })
//
// 每版的工作目录 <dir>/<v>/<report>/(generate.mjs 的 --traces <dir> --run <v>),几版同时跑。
// 一版超过 timeoutMin 分钟没写完,或者没写出页面、没有截图,就重新生成(没写成的那次改名为 <report>.failed-<n> 留着查原因),
// 最多 retries 次;还不行就不要这一版。
// 写完删掉构建产物 .build(每版约 25MB),再按节截图到 <ws>/sections/(judge 用)。已有 meta.json 和 sections 的版本跳过。
// 返回写成了的版本 [{ v, ws }]。
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import { cropSections } from "../lib/sections.mjs"

const ROOT = path.resolve(import.meta.dirname, "..")
const GENERATE = path.join(ROOT, "gen", "scripts", "generate.mjs")
export const DATA = path.join(ROOT, "data", "flow")

// 写成 = 有页面和截图,而且最后一次构建成功。生成 Agent 中途模型请求出错(例如中转站超时,meta.json 的 stop 是 error)、
// 但页面已经写完并构建成功的,也算写成,日志里注明。
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"))
const built = (ws) => ["meta.json", "Page.tsx", "thumb.png", "tiles.json", "checks.json"].every((f) => fs.existsSync(path.join(ws, f)))
  && !read(path.join(ws, "checks.json")).some((c) => c.check === "能渲染")
const done = built
const status = (ws) => (!built(ws) ? "没写成" : read(path.join(ws, "meta.json")).stop === "error" ? "写成(模型中途请求出错,但页面已写完并构建成功,保留)" : "写成")

function runOnce({ report, guide, dir, v, timeoutMin, log }) {
  return new Promise((resolve) => {
    const args = [GENERATE, "--run", v, "--cases", report, "--data", DATA, "--traces", dir, ...(guide ? ["--guide", guide] : [])]
    // 单独的进程组:超时时连同它起的沙箱进程一起结束
    const child = spawn(process.execPath, args, { env: process.env, detached: true, stdio: ["ignore", "pipe", "pipe"] })
    const tag = `${path.basename(dir)} ${v}`
    const relay = (s) => s.toString().split("\n").filter(Boolean).forEach((l) => log(`    [${tag}] ${l}`))
    child.stdout.on("data", relay)
    child.stderr.on("data", relay)
    const timer = setTimeout(() => {
      log(`    [${tag}] 超过 ${timeoutMin} 分钟,结束这次生成`)
      try { process.kill(-child.pid, "SIGKILL") } catch {}
    }, timeoutMin * 60_000)
    child.on("exit", (code) => { clearTimeout(timer); resolve(code) })
  })
}

export async function rollout({ report, guide, dir, versions, timeoutMin = 20, retries = 2, log = console.log }) {
  fs.mkdirSync(dir, { recursive: true })
  const made = []
  await Promise.all(versions.map(async (v) => {
    const ws = path.join(dir, v, report)
    for (let attempt = 0; attempt <= retries && !done(ws); attempt++) {
      if (attempt) log(`  ${path.basename(dir)} ${v}:没写成,第 ${attempt} 次重新生成`)
      // 没写成的那次留着查原因(会话记录在里面),改名为 <report>.failed-<n>,不参加打分
      if (attempt && fs.existsSync(ws)) {
        fs.rmSync(path.join(ws, ".build"), { recursive: true, force: true })
        fs.renameSync(ws, `${ws}.failed-${attempt}`)
      }
      fs.rmSync(ws, { recursive: true, force: true })
      const t0 = Date.now()
      log(`  ${path.basename(dir)} ${v}:开始生成 ${report}`)
      const code = await runOnce({ report, guide, dir, v, timeoutMin, log })
      log(`  ${path.basename(dir)} ${v}:${status(ws)}${built(ws) ? "" : `(退出码 ${code})`},${Math.round((Date.now() - t0) / 1000)} 秒`)
    }
    fs.rmSync(path.join(ws, ".build"), { recursive: true, force: true })
    if (done(ws)) made.push({ v, ws })
    else log(`  ✗ ${path.basename(dir)} ${v}:重试 ${retries} 次仍没写成,这一版不要了`)
  }))
  made.sort((a, b) => a.v.localeCompare(b.v, "en", { numeric: true }))
  const crop = made.filter(({ ws }) => !fs.existsSync(path.join(ws, "sections", "sections.json")))
  if (crop.length) {
    log(`  按节截图 ${crop.length} 版`)
    await cropSections(crop.map(({ ws }) => ({ ws, out: path.join(ws, "sections") })), { log })
  }
  return made
}
