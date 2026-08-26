/* ============================================================
 * hero-shapes.ts — 三个造型的实例矩阵生成器
 * 每个生成器返回恰好 M 个 InstancePose；用不满的实例 scale→0。
 * 造型语义：分析树 → ToA；柱阵 → Chart Generation；螺旋 → NarraSteer
 * ============================================================ */
import { Quaternion, Vector3 } from 'three';

export interface InstancePose {
  px: number; py: number; pz: number;
  qx: number; qy: number; qz: number; qw: number;
  sx: number; sy: number; sz: number;
}
export type Shape = InstancePose[];

/* ---------- 工具 ---------- */

/** 确定性伪随机（mulberry32），保证造型每次一致 */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const Y_AXIS = new Vector3(0, 1, 0);
const _dir = new Vector3();
const _q = new Quaternion();

function pose(
  p: Vector3, dir: Vector3 | null, sx: number, sy: number, sz: number,
): InstancePose {
  if (dir) _q.setFromUnitVectors(Y_AXIS, _dir.copy(dir).normalize());
  else _q.identity();
  return {
    px: p.x, py: p.y, pz: p.z,
    qx: _q.x, qy: _q.y, qz: _q.z, qw: _q.w,
    sx, sy, sz,
  };
}

const HIDDEN = (): InstancePose =>
  ({ px: 0, py: 0, pz: 0, qx: 0, qy: 0, qz: 0, qw: 1, sx: 0, sy: 0, sz: 0 });

function pad(shape: Shape, m: number): Shape {
  while (shape.length < m) shape.push(HIDDEN());
  return shape.slice(0, m);
}

/* ---------- ① 分析树（ToA） ---------- */

export function buildTree(m: number): Shape {
  const rand = rng(20260521);
  const out: Shape = [];
  const segBudget = Math.floor(m * 0.62);

  const origin = new Vector3(0, -105, 0);
  const tips: Vector3[] = [];

  const branch = (o: Vector3, dir: Vector3, len: number, thick: number, depth: number) => {
    if (out.length >= segBudget || depth > 5) { tips.push(o.clone()); return; }
    const mid = o.clone().addScaledVector(dir, len / 2);
    out.push(pose(mid, dir, thick, len, thick));
    const end = o.clone().addScaledVector(dir, len);
    const n = depth < 2 ? 3 : (rand() < 0.5 ? 2 : 3);
    for (let k = 0; k < n; k++) {
      const phi = (k / n) * Math.PI * 2 + rand() * 1.1 + depth * 0.7;
      const theta = 0.35 + rand() * 0.25;
      // 绕父方向构造子方向：先取与 dir 正交的基
      const tangent = new Vector3(Math.cos(phi), 0, Math.sin(phi));
      const side = new Vector3().crossVectors(dir, tangent).normalize();
      if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
      const child = dir.clone()
        .multiplyScalar(Math.cos(theta))
        .addScaledVector(side, Math.sin(theta))
        .normalize();
      branch(end, child, len * 0.72, thick * 0.68, depth + 1);
    }
    if (depth >= 3) tips.push(end);
  };
  branch(origin, new Vector3(0, 1, 0), 52, 6.5, 0);

  // 剩余实例 → 树冠悬浮叶点
  const crownC = new Vector3(0, 18, 0);
  let i = 0;
  while (out.length < m) {
    const base = tips.length ? tips[(i * 7) % tips.length] : crownC;
    const s = 2.2 + rand() * 2.6;
    const p = base.clone().add(new Vector3(
      (rand() - 0.5) * 34, (rand() - 0.5) * 26, (rand() - 0.5) * 34,
    ));
    out.push(pose(p, null, s, s, s));
    i++;
  }
  return pad(out, m);
}

/* ---------- ② 柱阵图表（Chart Generation） ---------- */

export function buildBars(m: number): Shape {
  const rand = rng(19970411);
  const out: Shape = [];
  const ratios = [0.45, 0.75, 1, 0.6, 0.88, 0.5];
  const H_MAX = 160, W = 15, GAP = 9, BASE_Y = -80;
  const totalW = ratios.length * W + (ratios.length - 1) * GAP;
  const cube = 10;

  ratios.forEach((r, bi) => {
    const x = -totalW / 2 + bi * (W + GAP) + W / 2;
    const h = r * H_MAX;
    const rows = Math.max(1, Math.floor(h / cube));
    for (let zi = 0; zi < 2; zi++) {
      const z = zi === 0 ? -5.5 : 5.5;
      for (let row = 0; row < rows; row++) {
        if (out.length >= m) break;
        out.push(pose(
          new Vector3(x, BASE_Y + row * cube + cube / 2, z), null,
          W * 0.92, cube * 0.82, 9,
        ));
      }
    }
  });

  // 底部基线
  for (let i = 0; i < 18 && out.length < m; i++) {
    out.push(pose(new Vector3(-totalW / 2 - 12 + i * ((totalW + 24) / 17), BASE_Y - 8, 0),
      null, (totalW + 24) / 17 * 0.82, 2.2, 12));
  }
  // 左轴刻度
  for (let i = 0; i < 6 && out.length < m; i++) {
    out.push(pose(new Vector3(-totalW / 2 - 20, BASE_Y + 8 + i * (H_MAX / 5.4), 0),
      null, 7, 2, 2));
  }
  // 剩余 → 柱顶漂浮数据点
  while (out.length < m) {
    const bi = Math.floor(rand() * ratios.length);
    const x = -totalW / 2 + bi * (W + GAP) + W / 2;
    const top = BASE_Y + ratios[bi] * H_MAX;
    const s = 2.5 + rand() * 3;
    out.push(pose(new Vector3(
      x + (rand() - 0.5) * 16, top + 10 + rand() * 30, (rand() - 0.5) * 22,
    ), null, s, s, s));
  }
  return pad(out, m);
}

/* ---------- ③ 螺旋故事线（NarraSteer） ---------- */

export function buildHelix(m: number): Shape {
  const out: Shape = [];
  const TURNS = 2.6, R = 62, RISE = 210, Y0 = -105;
  const THETA = TURNS * Math.PI * 2;
  const NODES = 5;
  const segCount = m - NODES - Math.floor(m * 0.08); // 少量卫星点

  const pt = (t: number) => new Vector3(
    R * Math.cos(t * THETA),
    Y0 + t * RISE,
    R * Math.sin(t * THETA),
  );
  const tangent = (t: number) => new Vector3(
    -R * THETA * Math.sin(t * THETA), RISE, R * THETA * Math.cos(t * THETA),
  ).normalize();

  const dArc = Math.sqrt((R * THETA / segCount) ** 2 + (RISE / segCount) ** 2);
  for (let i = 0; i < segCount; i++) {
    const t = i / (segCount - 1);
    out.push(pose(pt(t), tangent(t), 12, dArc * 1.4, 12));
  }
  // 故事节点（每 1/5 圈一个略大方块）
  for (let n = 0; n < NODES; n++) {
    const t = (n + 0.5) / NODES;
    out.push(pose(pt(t), tangent(t), 21, 21, 21));
  }
  // 卫星点
  const rand = rng(7);
  while (out.length < m) {
    const t = rand();
    const a = rand() * Math.PI * 2;
    const r2 = R + 26 + rand() * 18;
    const s = 2 + rand() * 2.6;
    out.push(pose(new Vector3(
      r2 * Math.cos(t * THETA + a * 0.2), Y0 + t * RISE + (rand() - 0.5) * 14,
      r2 * Math.sin(t * THETA + a * 0.2),
    ), null, s, s, s));
  }
  return pad(out, m);
}

/** 入场初始态：弥散星尘（从四面八方飞向第一个造型） */
export function buildScatter(m: number): Shape {
  const rand = rng(42);
  const out: Shape = [];
  for (let i = 0; i < m; i++) {
    const r = 190 + rand() * 160;
    const th = rand() * Math.PI * 2;
    const ph = Math.acos(2 * rand() - 1);
    const s = 1.6 + rand() * 2.4;
    out.push(pose(new Vector3(
      r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.7, r * Math.sin(ph) * Math.sin(th),
    ), null, s, s, s));
  }
  return out;
}

export const SHAPE_BUILDERS = [buildTree, buildBars, buildHelix];
