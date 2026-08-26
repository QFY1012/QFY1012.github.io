/* ============================================================
 * hero-shapes.ts — 四个造型的实例矩阵生成器
 * 每个生成器返回恰好 M 个 InstancePose；用不满的实例 scale→0。
 * 造型语义：莫比乌斯 → AI 设计工程；分析树 → ToA；
 *          螺旋 → NarraSteer；星群网罩 → 舆情传播与治理
 * ============================================================ */
import { Matrix4, Quaternion, Vector3 } from 'three';

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

const _T = new Vector3(), _C = new Vector3(), _N = new Vector3();
const _basis = new Matrix4();

/** 双轴定向：宽 sx 沿 C（截面方向），长 sy 沿 T（切向），厚 sz 沿法向 */
function poseBasis(
  p: Vector3, T: Vector3, C: Vector3, sx: number, sy: number, sz: number,
): InstancePose {
  _T.copy(T).normalize();
  _C.copy(C).normalize();
  _N.crossVectors(_C, _T); // 注意手性：(C,T,N) 必须 det=+1，否则四元数退化
  _basis.makeBasis(_C, _T, _N);
  _q.setFromRotationMatrix(_basis);
  return {
    px: p.x, py: p.y, pz: p.z,
    qx: _q.x, qy: _q.y, qz: _q.z, qw: _q.w,
    sx, sy, sz,
  };
}

function pad(shape: Shape, m: number): Shape {
  while (shape.length < m) shape.push(HIDDEN());
  shape.length = m; // 原地截断
  return shape;
}

/** 整体倾斜造型：位置与姿态同时旋转（绕任意轴） */
const _tp = new Vector3(), _tq2 = new Quaternion();
function tiltShape(shape: Shape, ax: number, ay: number, az: number, angle: number) {
  const tilt = new Quaternion().setFromAxisAngle(new Vector3(ax, ay, az), angle);
  for (const p of shape) {
    _tp.set(p.px, p.py, p.pz).applyQuaternion(tilt);
    p.px = _tp.x; p.py = _tp.y; p.pz = _tp.z;
    _tq2.set(p.qx, p.qy, p.qz, p.qw).premultiply(tilt);
    p.qx = _tq2.x; p.qy = _tq2.y; p.qz = _tq2.z; p.qw = _tq2.w;
  }
}

/* ---------- ① 莫比乌斯环（AI 设计工程） ---------- */

export function buildMobius(m: number): Shape {
  const out: Shape = [];
  const R = 88, W = 36;

  // 绕 Y 轴的环带：u 扫一圈，v∈[-W,W] 带半宽，半扭转藏在 u/2 里
  const surf = (u: number, v: number) => new Vector3(
    (R + v * Math.cos(u / 2)) * Math.cos(u),
    v * Math.sin(u / 2),
    (R + v * Math.cos(u / 2)) * Math.sin(u),
  );

  // 环带面：每步 3 条窄带互叠织成一条实心带
  const steps = m > 150 ? 56 : 30;
  const du = (Math.PI * 2) / steps;
  const segLen = du * (R + W) * 1.2;
  const lanes = [-W / 2, 0, W / 2];
  for (let i = 0; i < steps; i++) {
    const u = i * du;
    const T = surf(u + 0.01, 0).sub(surf(u - 0.01, 0));
    const C = surf(u, 1).sub(surf(u, -1));
    for (let l = 0; l < lanes.length; l++) {
      out.push(poseBasis(surf(u, lanes[l]), T, C, W * 0.72, segLen, 2.4));
    }
  }

  // 边界独线：莫比乌斯只有一条闭合边（v=W 走 4π 才回到起点）→ 细棱沿它追光一圈
  const edgeN = m > 150 ? 28 : 18;
  const edgeLen = ((Math.PI * 4 * (R + W)) / edgeN) * 1.1;
  for (let i = 0; i < edgeN; i++) {
    const u4 = (i / edgeN) * Math.PI * 4;
    const T = surf(u4 + 0.01, W).sub(surf(u4 - 0.01, W));
    const C = surf(u4, W + 1).sub(surf(u4, W - 1));
    out.push(poseBasis(surf(u4, W), T, C, 2, edgeLen, 2));
  }

  // 环面向镜头倾倒 ~46°：半扭转从"看不见"变成"带面翻转"的可读特征
  tiltShape(out, 1, 0, 0, 0.8);

  return pad(out, m); // 不撒尘埃：剩余实例 HIDDEN，保持剪影干净
}

/* ---------- ② 分析树（ToA） ---------- */

export function buildTree(m: number): Shape {
  const rand = rng(20260521);
  const out: Shape = [];
  const segBudget = Math.floor(m * 0.78); // 枝繁叶茂：预算大头给枝干

  const origin = new Vector3(0, -115, 0);
  const tips: Vector3[] = [];

  const branch = (o: Vector3, dir: Vector3, len: number, thick: number, depth: number) => {
    if (out.length >= segBudget || depth > 6) { tips.push(o.clone()); return; }
    const mid = o.clone().addScaledVector(dir, len / 2);
    out.push(pose(mid, dir, thick, len, thick));
    const end = o.clone().addScaledVector(dir, len);
    const n = depth < 2 ? 3 : (rand() < 0.5 ? 2 : 3);
    for (let k = 0; k < n; k++) {
      const phi = (k / n) * Math.PI * 2 + rand() * 1.1 + depth * 0.7;
      const theta = 0.34 + depth * 0.07 + rand() * 0.3; // 近主干聚拢，树冠张开
      // 绕父方向构造子方向：先取与 dir 正交的基
      const tangent = new Vector3(Math.cos(phi), 0, Math.sin(phi));
      const side = new Vector3().crossVectors(dir, tangent).normalize();
      if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
      const child = dir.clone()
        .multiplyScalar(Math.cos(theta))
        .addScaledVector(side, Math.sin(theta))
        .normalize();
      branch(end, child, len * 0.72, thick * 0.70, depth + 1);
    }
    if (depth >= 3) tips.push(end);
  };
  branch(origin, new Vector3(0, 1, 0), 56, 9.5, 0);

  // 剩余实例 → 树冠悬浮叶点
  const crownC = new Vector3(0, 18, 0);
  let i = 0;
  while (out.length < m) {
    const base = tips.length ? tips[(i * 7) % tips.length] : crownC;
    const s = 2.8 + rand() * 2.8;
    const p = base.clone().add(new Vector3(
      (rand() - 0.5) * 64, (rand() - 0.5) * 34, (rand() - 0.5) * 64,
    ));
    out.push(pose(p, null, s, s, s));
    i++;
  }
  return pad(out, m);
}

/* ---------- ③ 螺旋故事线（NarraSteer） ---------- */

export function buildHelix(m: number): Shape {
  const out: Shape = [];
  const TURNS = 2.4, R = 55, RISE = 144, Y0 = -72;
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
    out.push(pose(pt(t), tangent(t), 7, dArc * 1.35, 7));
  }
  // 故事节点（每 1/5 圈一个略大方块）
  for (let n = 0; n < NODES; n++) {
    const t = (n + 0.5) / NODES;
    out.push(pose(pt(t), tangent(t), 14, 14, 14));
  }
  // 卫星点：贴着邻近主线
  const rand = rng(7);
  while (out.length < m) {
    const t = rand();
    const a = rand() * Math.PI * 2;
    const r2 = R + 8 + rand() * 10;
    const s = 1.6 + rand() * 1.8;
    out.push(pose(new Vector3(
      r2 * Math.cos(t * THETA + a * 0.2), Y0 + t * RISE + (rand() - 0.5) * 10,
      r2 * Math.sin(t * THETA + a * 0.2),
    ), null, s, s, s));
  }
  // 整体侧倾 ~34°：摆脱笔直竖轴，螺旋的盘旋感更强
  tiltShape(out, 0, 0, 1, 0.6);
  for (const p of out) { // 偶发越界的卫星点压回画面
    if (p.py > 88) p.py = 88;
    else if (p.py < -88) p.py = -88;
  }
  return pad(out, m);
}

/* ---------- ④ 星群爆发+网罩（舆情传播与治理） ---------- */

export function buildOutbreak(m: number): Shape {
  const rand = rng(20260717);
  const out: Shape = [];
  const YS = 0.62; // 竖向压扁，避免网罩顶底出画
  const big = m > 150;
  const n1 = big ? 8 : 6, n2 = big ? 14 : 10, n3 = big ? 18 : 12;
  const crossN = big ? 3 : 2, extN = big ? 6 : 4;

  const P = (v: Vector3) => new Vector3(v.x, v.y * YS, v.z);
  // 斐波那契球面均布 + 径向抖动
  const spherePt = (i: number, n: number, r: number, jit: number) => {
    const y = 1 - (2 * (i + 0.5)) / n;
    const rr = Math.sqrt(1 - y * y);
    const th = i * 2.399963;
    return new Vector3(rr * Math.cos(th), y, rr * Math.sin(th))
      .multiplyScalar(r + (rand() - 0.5) * jit);
  };
  const edge = (a: Vector3, b: Vector3, thick: number) => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const d = b.clone().sub(a);
    return pose(mid, d, thick, d.length(), thick);
  };
  const nearest = (p: Vector3, set: Vector3[]) => {
    let bi = 0, bd = Infinity;
    for (let k = 0; k < set.length; k++) {
      const d = p.distanceToSquared(set[k]);
      if (d < bd) { bd = d; bi = k; }
    }
    return set[bi];
  };

  // 信源 → 内环（辐条先亮）
  out.push(pose(new Vector3(0, 0, 0), null, 11, 11, 11));
  const w1: Vector3[] = [];
  for (let i = 0; i < n1; i++) {
    const p = spherePt(i, n1, 48, 10);
    w1.push(p);
    out.push(edge(new Vector3(0, 0, 0), P(p), 1.6));
    out.push(pose(P(p), null, 5.5, 5.5, 5.5));
  }
  // 中环：连最近内环 + 少量横向交叉（网状感）
  const w2: Vector3[] = [];
  for (let i = 0; i < n2; i++) {
    const p = spherePt(i, n2, 88, 10);
    w2.push(p);
    out.push(edge(P(nearest(p, w1)), P(p), 1.5));
    out.push(pose(P(p), null, 4.5, 4.5, 4.5));
  }
  for (let i = 0; i < crossN; i++) {
    const a = w2[(i * 2) % n2], b = w2[(i * 2 + 7) % n2];
    out.push(edge(P(a), P(b), 1.3));
  }
  // 外环：混沌扩散，稀疏连线
  for (let i = 0; i < n3; i++) {
    const p = spherePt(i, n3, 126, 14);
    if (i < extN) {
      out.push(edge(P(nearest(p, w2)), P(p), 1.4));
    }
    out.push(pose(P(p), null, 4, 4, 4));
  }
  // 治理网罩：二十面体顶点 + 棱，先传播后治理
  const PHI = (1 + Math.sqrt(5)) / 2;
  const raw: Vector3[] = [];
  for (const s1 of [-1, 1]) {
    for (const s2 of [-1, 1]) {
      raw.push(new Vector3(0, s1, s2 * PHI));
      raw.push(new Vector3(s1, s2 * PHI, 0));
      raw.push(new Vector3(s1 * PHI, 0, s2));
    }
  }
  const cage = raw.map((v) => P(v.normalize().multiplyScalar(150)));
  cage.forEach((v) => {
    out.push(pose(v, null, 4.5, 4.5, 4.5));
  });
  // 棱 = 距离最短的 30 对顶点（压扁后仍恒小于非棱对）
  const pairs: [number, number, number][] = [];
  for (let i = 0; i < cage.length; i++) {
    for (let j = i + 1; j < cage.length; j++) {
      pairs.push([i, j, cage[i].distanceToSquared(cage[j])]);
    }
  }
  pairs.sort((a, b) => a[2] - b[2]);
  const edgeCount = big ? 30 : 15;
  pairs.slice(0, edgeCount).forEach(([i, j]) => {
    out.push(edge(cage[i], cage[j], 1.4));
  });
  return pad(out, m); // 不撒尘埃：剩余实例 HIDDEN，剪影干净
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

export const SHAPE_BUILDERS = [buildMobius, buildTree, buildHelix, buildOutbreak];
