// 截图检查:node figures/internship/shot.mjs <name>   (name = skill-flow 或 bg-flow)
// 输出 <name>-desktop.png(1100 宽)与 <name>-mobile.png(390 宽),均不提交。
import { chromium } from 'playwright-core';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const name = process.argv[2] ?? 'skill-flow';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
for (const [tag, w] of [['desktop', 1100], ['mobile', 390]]) {
  const p = await b.newPage({ viewport: { width: w, height: 600 }, deviceScaleFactor: 2 });
  await p.goto('file://' + join(dir, `${name}.html`));
  await p.waitForTimeout(400);
  await p.screenshot({ path: join(dir, `${name}-${tag}.png`), fullPage: true });
  await p.close();
}
await b.close();
