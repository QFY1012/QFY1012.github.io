// Renders showreel/composition.html frame by frame with headless Chromium and pipes the frames into ffmpeg.
//
//   node showreel/render.mjs                       → showreel/out/video.mp4 (silent, 1920×1080, 60 fps)
//   node showreel/render.mjs --stills 1.2,6.8 --out dir   → PNG stills at those times (for checking)
//   --shutter 2   → render 2 sub-frames per frame and average them (180° motion blur)
//   --timeline-only → just write out/timeline.json (the cue sheet soundtrack.py reads)
//
// Env: FFMPEG (ffmpeg binary), CHROMIUM (browser executable, if Playwright's bundled one is absent).
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

// tiny static server rooted at the repo (the composition reads ../public/fonts)
const server = createServer(async (req, res) => {
  try {
    const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    const body = await readFile(join(repo, p));
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/showreel/composition.html`;

let browser;
try { browser = await chromium.launch(); }
catch { browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' }); }
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log('[page]', m.text()); });
page.on('pageerror', e => console.log('[page error]', e.message));
await page.goto(url);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
const reel = await page.evaluate(() => window.SHOWREEL);
const { duration, fps } = reel;
const writeTimeline = async dir => { await mkdir(dir, { recursive: true }); await writeFile(join(dir, 'timeline.json'), JSON.stringify(reel, null, 2)); };
const stage = page.locator('#stage');

const shot = async (t, type = 'png') => {
  await page.evaluate(t => window.renderFrame(t), t);
  return stage.screenshot({ type, animations: 'allow', caret: 'initial', scale: 'css', ...(type === 'jpeg' ? { quality: 100 } : {}) });
};

const stills = opt('--stills');
if (args.includes('--timeline-only')) {
  await writeTimeline(join(here, 'out'));
  console.log(`timeline → showreel/out/timeline.json (${duration.toFixed(2)} s)`);
} else if (stills) {
  const out = opt('--out', join(here, 'out', 'stills'));
  await mkdir(out, { recursive: true });
  for (const s of stills.split(',')) {
    const t = parseFloat(s);
    const buf = await shot(t);
    await writeFile(join(out, `t${t.toFixed(2)}.png`), buf);
  }
  console.log(`wrote ${stills.split(',').length} stills → ${out}`);
} else {
  const out = opt('--out', join(here, 'out', 'video.mp4'));
  await mkdir(dirname(out), { recursive: true });
  await writeTimeline(dirname(out));
  const total = Math.round(duration * fps);
  const sub = Math.max(1, parseInt(opt('--shutter', '1'), 10));
  // sub-frames are spread across half a frame interval and averaged back down to `fps` by ffmpeg's tmix
  const blur = sub > 1 ? ['-vf', `tmix=frames=${sub},select='not(mod(n+1,${sub}))',setpts=N/${fps}/TB`, '-r', String(fps)] : [];
  const ff = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps * sub), '-c:v', 'mjpeg', '-i', '-',
    ...blur, '-c:v', 'libx264', '-preset', 'slow', '-crf', opt('--crf', '20'), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    for (let k = 0; k < sub; k++) {
      const dt = sub > 1 ? (k / (sub - 1) - 0.5) * 0.5 : 0;
      const buf = await shot(Math.max(0, (f + dt) / fps), 'jpeg');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    if (f % 60 === 0) console.log(`frame ${f}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', c => c ? j(new Error('ffmpeg exit ' + c)) : r()));
  console.log(`video → ${out}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
await browser.close();
server.close();
