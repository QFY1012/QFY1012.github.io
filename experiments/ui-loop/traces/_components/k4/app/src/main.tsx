// Mounts the agent's Page.tsx (aliased as "@page" by scripts/shoot.mjs) and
// signals the screenshot script once fonts and charts have drawn.
import { createRoot } from "react-dom/client"
import { flushSync } from "react-dom"

import "./index.css"
// @ts-expect-error resolved by the build
import Page from "@page"

declare global {
  interface Window {
    __READY__?: boolean
  }
}

async function main() {
  const root = createRoot(document.getElementById("root")!)
  flushSync(() => root.render(<Page />))
  await document.fonts.ready
  const frame = () => new Promise((r) => requestAnimationFrame(r))
  for (let i = 0; i < 300; i++) {
    const charts = [...document.querySelectorAll("[data-slot=chart]")]
    if (charts.every((c) => c.querySelector("svg.recharts-surface text"))) break
    await frame()
  }
  for (let i = 0; i < 4; i++) await frame()
  window.__READY__ = true
}

main().catch((e) => {
  document.body.textContent = String(e)
  window.__READY__ = true
})
