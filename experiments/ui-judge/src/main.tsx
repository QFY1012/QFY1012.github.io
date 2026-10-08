import { createRoot } from "react-dom/client"
import { flushSync } from "react-dom"

import "./index.css"
import { Node, type SpecNode } from "./render"

declare global {
  interface Window {
    __SPEC__?: SpecNode
    __READY__?: boolean
  }
}

// Spec nodes without an id get one from their position, e.g. "n.0.2.1".
function ensureIds(node: SpecNode, path = "n") {
  if (!node.id) node.id = path
  node.children?.forEach((c, i) => ensureIds(c, `${path}.${i}`))
}

async function loadSpec(): Promise<SpecNode> {
  if (window.__SPEC__) return window.__SPEC__
  const url = new URLSearchParams(location.search).get("spec")
  if (!url) throw new Error("no spec: pass ?spec=<url> or set window.__SPEC__")
  return (await fetch(url)).json()
}

async function main() {
  const spec = await loadSpec()
  ensureIds(spec)
  const root = createRoot(document.getElementById("root")!)
  flushSync(() => root.render(<Node node={spec} />))
  await document.fonts.ready
  // Recharts measures its container after mount; wait until every chart has drawn.
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
