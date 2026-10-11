import fs from 'fs';
import zlib from 'zlib';
const buf = fs.readFileSync(process.argv[2]);
let off = 8; const idat = [];
let w,h,ct;
while (off < buf.length) {
  const len = buf.readUInt32BE(off); const type = buf.toString('ascii', off+4, off+8);
  const data = buf.subarray(off+8, off+8+len);
  if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
  if (type === 'IDAT') idat.push(data);
  off += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idat));
const bpp = ct === 2 ? 3 : 4;
const stride = w*bpp;
const px = Buffer.alloc(h*stride);
let p = 0;
for (let y = 0; y < h; y++) {
  const f = raw[p++]; const line = raw.subarray(p, p+stride); p += stride;
  const cur = px.subarray(y*stride, (y+1)*stride);
  const prev = y > 0 ? px.subarray((y-1)*stride, y*stride) : Buffer.alloc(stride);
  for (let i = 0; i < stride; i++) {
    const a = i >= bpp ? cur[i-bpp] : 0, b = prev[i], c = i >= bpp ? prev[i-bpp] : 0;
    let v = line[i];
    if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a+b)>>1;
    else if (f === 4) { const pa=Math.abs(b-c), pb=Math.abs(a-c), pc=Math.abs(a+b-2*c); v += (pa<=pb&&pa<=pc)?a:(pb<=pc?b:c); }
    cur[i] = v & 255;
  }
}
const [x0,x1,y0,y1] = process.argv.slice(3).map(Number);
console.log('size', w, h);
for (let y = y0; y < y1; y += 2) {
  let s = String(y).padStart(5)+' ';
  for (let x = x0; x < x1; x++) {
    const i = y*stride + x*bpp;
    const lum = (px[i]*0.3 + px[i+1]*0.59 + px[i+2]*0.11);
    s += lum < 120 ? '#' : (lum < 200 ? '+' : '.');
  }
  console.log(s);
}
