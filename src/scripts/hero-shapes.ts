/* ============================================================
 * hero-shapes.ts — 作品造型的高密度点采样器（树 / 螺旋 / 星群网罩）
 * 几何语义复刻旧字符画分支的 buildTree/buildHelix/buildOutbreak，
 * 但输出从 ~200 有向实例改为 10 万级点云：
 *   pos = 造型上的家（已按 unwind 预旋，使造型在丑区中段正对镜头）
 *   dir = 离焦散开方向（65% 随机 + 35% 径向，向外炸成雾）
 *   key = 生长键 0→1（去程错峰时刻表的出发次序）
 * 全部 mulberry32 确定性种子：同一 seed + n 永远得到同一朵云。
 * ============================================================ */
import { Quaternion, Vector3 } from 'three';

export interface ShapeSample {
  pos: Float32Array;
  dir: Float32Array;
  key: Float32Array;
}

/** 确定性伪随机（mulberry32） */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32;

const _v = new Vector3();

/** 随机单位向量 */
function randUnit(rand: () => number, out: Vector3): Vector3 {
  const z = rand() * 2 - 1, t = rand() * Math.PI * 2;
  const q = Math.sqrt(1 - z * z);
  return out.set(q * Math.cos(t), q * Math.sin(t), z);
}

/**
 * 收尾管线：质心置中（自转轴过质心，不偏心晃动）→ 设计空间缩放
 * （可视半高 ≈90 本地单位 = 154/1.7，造型 raw 尺寸要收进 ±85）→
 * 可选绕 X 预倾（螺旋轴向镜头倾躺，线圈才读得出）→
 * x/z 压扁 squash：取景链路 groupStretch.x=aspect + 居中裁切把横向放大 ~4.3 倍，
 * 设计空间按自然比例建模、此处预压扁，正对镜头时屏幕比例才正常 →
 * 径向/随机混合散开方向 → pos 与 dir 同施 unwind 预旋。
 * key 必须在调用前算好（基于设计空间坐标，不能被预旋污染）。
 */
function finish(
  pos: Float32Array, key: Float32Array, n: number, seed: number,
  unwind: Quaternion, scale = 1, preTiltX = 0, squash = 1, offX = 0, offY = 0, offZ = 0,
): ShapeSample {
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < n; i++) { cx += pos[i * 3]; cy += pos[i * 3 + 1]; cz += pos[i * 3 + 2]; }
  cx /= n; cy /= n; cz /= n;
  const ct = Math.cos(preTiltX), st = Math.sin(preTiltX);
  const rand = rng(seed);
  const dir = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    let x = (pos[i * 3] - cx) * scale, y = (pos[i * 3 + 1] - cy) * scale, z = (pos[i * 3 + 2] - cz) * scale;
    if (preTiltX !== 0) { const y2 = y * ct - z * st; const z2 = y * st + z * ct; y = y2; z = z2; }
    x = x * squash + offX; y += offY; z = z * squash + offZ;
    _v.set(x, y, z).applyQuaternion(unwind);
    pos[i * 3] = _v.x; pos[i * 3 + 1] = _v.y; pos[i * 3 + 2] = _v.z;
    const rl = Math.hypot(x, y, z) || 1;
    const rx = x / rl, ry = y / rl, rz = z / rl;
    randUnit(rand, _v);
    let dx = 0.35 * rx + 0.65 * _v.x, dy = 0.35 * ry + 0.65 * _v.y, dz = 0.35 * rz + 0.65 * _v.z;
    const dl = Math.hypot(dx, dy, dz) || 1;
    _v.set(dx / dl, dy / dl, dz / dl).applyQuaternion(unwind);
    dir[i * 3] = _v.x; dir[i * 3 + 1] = _v.y; dir[i * 3 + 2] = _v.z;
  }
  return { pos, dir, key };
}

/* ---------- 线段 + 球簇的通用采样 ---------- */

interface Seg { ax: number; ay: number; az: number; bx: number; by: number; bz: number; r: number; w: number; k0: number; k1: number }
interface Ball { x: number; y: number; z: number; s: number; w: number; k: number }

/** 按权重轮盘选线段，采样点 = 线上一点 + 截面圆盘抖动；key 沿线性插值 */
function sampleSegsInto(pos: Float32Array, key: Float32Array, from: number, to: number, segs: Seg[], rand: () => number) {
  let total = 0;
  for (const s of segs) total += s.w;
  for (let i = from; i < to; i++) {
    let pick = rand() * total;
    let s = segs[0];
    for (const cand of segs) { pick -= cand.w; if (pick <= 0) { s = cand; break; } }
    const u = rand();
    randUnit(rand, _v);
    const rr = s.r * Math.sqrt(rand());
    pos[i * 3] = s.ax + (s.bx - s.ax) * u + _v.x * rr;
    pos[i * 3 + 1] = s.ay + (s.by - s.ay) * u + _v.y * rr;
    pos[i * 3 + 2] = s.az + (s.bz - s.az) * u + _v.z * rr;
    key[i] = s.k0 + (s.k1 - s.k0) * u;
  }
}

/** 按权重轮盘选球簇，采样点 = 高斯球（中心矩叠加近似正态） */
function sampleBallsInto(pos: Float32Array, key: Float32Array, from: number, to: number, balls: Ball[], rand: () => number) {
  let total = 0;
  for (const b of balls) total += b.w;
  for (let i = from; i < to; i++) {
    let pick = rand() * total;
    let b = balls[0];
    for (const cand of balls) { pick -= cand.w; if (pick <= 0) { b = cand; break; } }
    randUnit(rand, _v);
    const g = (rand() + rand() + rand() + rand() - 2) * 0.85; // ~N(0,1)
    const rr = Math.abs(g) * b.s;
    pos[i * 3] = b.x + _v.x * rr;
    pos[i * 3 + 1] = b.y + _v.y * rr;
    pos[i * 3 + 2] = b.z + _v.z * rr;
    key[i] = b.k;
  }
}

/* ---------- ① 分析树（ToA）：递归分枝 → 枝干胶囊采样，key = 高度比 ---------- */

export function sampleTree(n: number, seed: number, unwind: Quaternion, squash = 1, offX = 0, offY = 0, offZ = 0): ShapeSample {
  const rand = rng(seed);
  const segs: Seg[] = [];
  const UP = new Vector3(0, 1, 0);
  const STRETCH = new Vector3(1.5, 0.95, 1.35); // 各向异性拉伸（旧版同款，段长与位置同步拉伸）
  let minY = Infinity, maxY = -Infinity;

  const branch = (o: Vector3, dir: Vector3, len: number, thick: number, depth: number) => {
    if (depth > 6 || thick < 1.2) return;
    const step = dir.clone().multiplyScalar(len).multiply(STRETCH);
    const end = o.clone().add(step);
    segs.push({
      ax: o.x, ay: o.y, az: o.z, bx: end.x, by: end.y, bz: end.z,
      r: thick * 0.5, w: step.length() * thick * thick, k0: 0, k1: 0, // key 待 y 范围确定后回填
    });
    if (o.y < minY) minY = o.y;
    if (end.y > maxY) maxY = end.y;
    // 主干先续一段，再三叉起步、深层二叉为主（偶有独枝，左右略不对称）
    const nChild = depth === 0 ? 1 : depth === 1 ? 3 : (rand() < 0.12 ? 1 : 2);
    for (let k = 0; k < nChild; k++) {
      const phi = (k / nChild) * Math.PI * 2 + (rand() - 0.5) * 1.6 + depth * 0.5;
      const theta = depth === 0
        ? 0.08 + rand() * 0.08
        : 0.62 + depth * 0.1 + rand() * 0.4;
      const tangent = new Vector3(Math.cos(phi), 0, Math.sin(phi));
      const side = new Vector3().crossVectors(dir, tangent).normalize();
      if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
      const child = dir.clone()
        .multiplyScalar(Math.cos(theta))
        .addScaledVector(side, Math.sin(theta));
      child.lerp(UP, 0.07).normalize(); // 极弱向光性：枝尖略上翘
      const vigor = k === 0 ? 1 : 0.72 + rand() * 0.2;
      branch(end, child, len * 0.82 * vigor, thick * (k === 0 ? 0.8 : 0.74), depth + 1);
    }
  };
  branch(new Vector3(22, -125, -35), UP, 62, 10, 0); // 旧版 origin + 偏移合并

  const span = Math.max(1e-3, maxY - minY);
  for (const s of segs) { s.k0 = (s.ay - minY) / span; s.k1 = (s.by - minY) / span; }

  const pos = new Float32Array(n * 3);
  const key = new Float32Array(n);
  sampleSegsInto(pos, key, 0, n, segs, rand);
  return finish(pos, key, n, seed ^ 0x9e3779b9, unwind, 0.45, 0, squash, offX, offY, offZ); // 收进可视幅面（设计空间自然比例，x/z 由 squash 补偿横向拉伸）
}

/* ---------- ② 螺旋故事线（NarraSteer）：弧长均匀 + 节点球簇 + 卫星，key = 螺程 t ---------- */

export function sampleHelix(n: number, seed: number, unwind: Quaternion, squash = 1, offX = 0, offY = 0, offZ = 0): ShapeSample {
  const rand = rng(seed);
  const TURNS = 4.2, R = 44, RISE = 190, Y0 = -RISE / 2; // 旧版 ×0.8，对齐环 footprint
  const THETA = TURNS * Math.PI * 2;
  const NODES = 5;
  const pos = new Float32Array(n * 3);
  const key = new Float32Array(n);

  const nSat = Math.floor(n * 0.07);
  const nNode = Math.floor(n * 0.08);
  const nLine = n - nSat - nNode;

  // 主线：半径与爬升恒定 ⇒ t 均匀即弧长均匀；细管抖动给出线宽
  for (let i = 0; i < nLine; i++) {
    const t = rand();
    randUnit(rand, _v);
    const rr = 2.2 * Math.cbrt(rand());
    const y = Y0 + t * RISE;
    pos[i * 3] = R * Math.cos(t * THETA) + _v.x * rr;
    pos[i * 3 + 1] = y + _v.y * rr;
    pos[i * 3 + 2] = R * Math.sin(t * THETA) + _v.z * rr + Math.sin(y * 0.018) * 26; // 脊柱 z 向呼吸（旧版同款）
    key[i] = t;
  }
  // 故事节点：每 1/5 圈一个致密球簇
  for (let i = nLine; i < nLine + nNode; i++) {
    const t = (Math.floor(rand() * NODES) + 0.5) / NODES;
    randUnit(rand, _v);
    const g = (rand() + rand() + rand() + rand() - 2) * 0.85;
    const rr = Math.abs(g) * 7;
    const y = Y0 + t * RISE;
    pos[i * 3] = R * Math.cos(t * THETA) + _v.x * rr;
    pos[i * 3 + 1] = y + _v.y * rr;
    pos[i * 3 + 2] = R * Math.sin(t * THETA) + _v.z * rr + Math.sin(y * 0.018) * 26;
    key[i] = t;
  }
  // 卫星点：贴着邻近主线漂
  for (let i = nLine + nNode; i < n; i++) {
    const t = rand();
    const a = rand() * Math.PI * 2;
    const r2 = R + 8 + rand() * 10;
    const y = Y0 + t * RISE + (rand() - 0.5) * 10;
    pos[i * 3] = r2 * Math.cos(t * THETA + a * 0.2);
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = r2 * Math.sin(t * THETA + a * 0.2) + Math.sin(y * 0.018) * 26;
    key[i] = t;
  }
  return finish(pos, key, n, seed ^ 0x9e3779b9, unwind, 0.5, 0.9, squash, offX, offY, offZ); // 收幅 + 轴向镜头倾躺，线圈才读得出
}

/* ---------- ③ 星群爆发+网罩（舆情）：三层斐波那契球 + 辐条边 + 二十面体网罩 ----------
 * key 双层：传播层内→外 0~0.85，网罩最后罩上 0.85~1 */

export function sampleOutbreak(n: number, seed: number, unwind: Quaternion, squash = 1, offX = 0, offY = 0, offZ = 0): ShapeSample {
  const rand = rng(seed);
  const YS = 1; // 竖向不再压扁（squash 已恢复设计空间各向同性）
  const CAGE_R = 150;
  const keyOfR = (len: number) => Math.min(1, len / CAGE_R) * 0.85;

  const P = (v: Vector3) => new Vector3(v.x, v.y * YS, v.z);
  const spherePt = (i: number, m: number, r: number, jit: number) => {
    const y = 1 - (2 * (i + 0.5)) / m;
    const rr = Math.sqrt(1 - y * y);
    const th = i * 2.399963;
    return new Vector3(rr * Math.cos(th), y, rr * Math.sin(th))
      .multiplyScalar(r + (rand() - 0.5) * jit);
  };
  const nearest = (p: Vector3, set: Vector3[]) => {
    let bi = 0, bd = Infinity;
    for (let k = 0; k < set.length; k++) {
      const d = p.distanceToSquared(set[k]);
      if (d < bd) { bd = d; bi = k; }
    }
    return set[bi];
  };
  const mkSeg = (a: Vector3, b: Vector3, r: number): Seg => ({
    ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z,
    r, w: a.distanceTo(b) * r * r, k0: keyOfR(a.length()), k1: keyOfR(b.length()),
  });
  const mkBall = (p: Vector3, s: number): Ball => ({ x: p.x, y: p.y, z: p.z, s, w: s * s * s, k: keyOfR(p.length()) });

  const propSegs: Seg[] = [];
  const propBalls: Ball[] = [];
  // 信源 → 内环
  propBalls.push({ x: 0, y: 0, z: 0, s: 9, w: 9 * 9 * 9, k: 0 });
  const w1: Vector3[] = [];
  for (let i = 0; i < 8; i++) {
    const p = P(spherePt(i, 8, 48, 10));
    w1.push(p);
    propSegs.push(mkSeg(new Vector3(0, 0, 0), p, 1.6));
    propBalls.push(mkBall(p, 5));
  }
  // 中环：连最近内环 + 少量横向交叉
  const w2: Vector3[] = [];
  for (let i = 0; i < 14; i++) {
    const p = P(spherePt(i, 14, 88, 10));
    w2.push(p);
    propSegs.push(mkSeg(nearest(p, w1), p, 1.5));
    propBalls.push(mkBall(p, 4.5));
  }
  for (let i = 0; i < 3; i++) {
    propSegs.push(mkSeg(w2[(i * 2) % 14], w2[(i * 2 + 7) % 14], 1.3));
  }
  // 外环：混沌扩散，稀疏连线
  for (let i = 0; i < 18; i++) {
    const p = P(spherePt(i, 18, 126, 14));
    if (i < 6) propSegs.push(mkSeg(nearest(p, w2), p, 1.4));
    propBalls.push(mkBall(p, 4));
  }

  // 治理网罩：二十面体顶点 + 最短的 30 对棱
  const PHI = (1 + Math.sqrt(5)) / 2;
  const raw: Vector3[] = [];
  for (const s1 of [-1, 1]) {
    for (const s2 of [-1, 1]) {
      raw.push(new Vector3(0, s1, s2 * PHI));
      raw.push(new Vector3(s1, s2 * PHI, 0));
      raw.push(new Vector3(s1 * PHI, 0, s2));
    }
  }
  const cage = raw.map((v) => P(v.normalize().multiplyScalar(CAGE_R)));
  const cageBalls: Ball[] = cage.map((v) => ({ x: v.x, y: v.y, z: v.z, s: 4.5, w: 4.5 ** 3, k: 1 }));
  const pairs: [number, number, number][] = [];
  for (let i = 0; i < cage.length; i++) {
    for (let j = i + 1; j < cage.length; j++) {
      pairs.push([i, j, cage[i].distanceToSquared(cage[j])]);
    }
  }
  pairs.sort((a, b) => a[2] - b[2]);
  const cageSegs: Seg[] = pairs.slice(0, 30).map(([i, j], idx) => {
    const s = mkSeg(cage[i], cage[j], 1.4);
    s.k0 = s.k1 = 0.85 + 0.15 * (idx / 29); // 网罩最后罩上
    return s;
  });

  // 配比：传播边 55% / 传播节点 25% / 网罩棱 15% / 网罩顶点 5%
  const nCageBall = Math.floor(n * 0.05);
  const nCageSeg = Math.floor(n * 0.15);
  const nPropBall = Math.floor(n * 0.25);
  const nPropSeg = n - nPropBall - nCageSeg - nCageBall;
  const pos = new Float32Array(n * 3);
  const key = new Float32Array(n);
  sampleSegsInto(pos, key, 0, nPropSeg, propSegs, rand);
  sampleBallsInto(pos, key, nPropSeg, nPropSeg + nPropBall, propBalls, rand);
  sampleSegsInto(pos, key, nPropSeg + nPropBall, nPropSeg + nPropBall + nCageSeg, cageSegs, rand);
  sampleBallsInto(pos, key, nPropSeg + nPropBall + nCageSeg, n, cageBalls, rand);
  return finish(pos, key, n, seed ^ 0x9e3779b9, unwind, 0.26, 0, squash, offX, offY, offZ); // 收进可视幅面
}
