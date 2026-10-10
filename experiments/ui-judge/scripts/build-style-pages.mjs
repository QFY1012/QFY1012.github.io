// Hand-written pages, several styles per data file, as eval groups for the
// judge: the style is free because the pages are plain HTML, not renderer
// output. The judge only sees the screenshots, so these test whether its
// taste carries across styles. One module per data file in scripts/style-pages/.
//
//   node scripts/build-style-pages.mjs ops    → out/style/style-<v>/{page.html,shot.png}
//   node scripts/build-style-pages.mjs ab     → out/style/style-ab-<v>/…
import { shoot } from "./style-kit.mjs"

const group = process.argv[2]
if (!group) throw new Error("usage: build-style-pages.mjs <data name>")
const pages = (await import(`./style-pages/${group}.mjs`)).default
await shoot(group === "ops" ? "style" : `style-${group}`, pages)
