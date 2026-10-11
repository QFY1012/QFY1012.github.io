const fs = require("fs"), zlib = require("zlib"), path = require("path")

const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const t = Buffer.from(type, "ascii"); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, crc]) }
function png(w, h, px) {
  const raw = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w * 3; x++) raw[y * (w * 3 + 1) + 1 + x] = px[y * w * 3 + x] }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))])
}

const W = 375, H = 760
// neutral palette
const BG = [244, 245, 247], CARD = [255, 255, 255], LINE = [226, 229, 234], INK = [55, 61, 71], DIM = [180, 186, 195], ACCENT = [91, 124, 250]
const inRect = (x, y, rx, ry, rw, rh) => x >= rx && x < rx + rw && y >= ry && y < ry + rh

function screen(seed) {
  const px = Buffer.alloc(W * H * 3)
  const rows = 3 + (seed % 3)
  const button = seed % 2 === 0
  const set = (x, y, c) => { const o = (y * W + x) * 3; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2] }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = BG
    if (y < 72) c = CARD                                   // app bar
    if (inRect(x, y, 20, 26, 150, 20)) c = INK             // title
    if (inRect(x, y, 300, 28, 22, 16)) c = DIM             // action
    // list rows
    let top = 96
    for (let r = 0; r < rows; r++) {
      const ry = top + r * 76
      if (inRect(x, y, 16, ry, 343, 60)) c = CARD
      if (inRect(x, y, 32, ry + 16, 28, 28)) c = [207, 212, 220]  // icon
      if (inRect(x, y, 72, ry + 16, 150, 10)) c = INK             // line 1
      if (inRect(x, y, 72, ry + 34, 210, 8)) c = DIM              // line 2
      if (inRect(x, y, 300, ry + 22, 16, 16)) c = LINE            // row action
    }
    if (button && inRect(x, y, 24, 660, 327, 44)) c = ACCENT     // primary button
    if (button && inRect(x, y, 150, 676, 75, 12)) c = [255, 255, 255]
    // secondary text near bottom
    if (inRect(x, y, 24, 730, 120, 8)) c = DIM
    set(x, y, c)
  }
  return px
}

const out = path.join(__dirname, "assets")
fs.mkdirSync(out, { recursive: true })
let seed = 0
for (const p of ["p1", "p2", "p3"]) {
  const n = p === "p2" ? 3 : p === "p1" ? 4 : 5
  for (let i = 1; i <= n; i++) {
    const file = path.join(out, `${p}-${String(i).padStart(2, "0")}.png`)
    fs.writeFileSync(file, png(W, H, screen(seed++)))
  }
}
console.log("wrote", fs.readdirSync(out).sort().join(" "))
