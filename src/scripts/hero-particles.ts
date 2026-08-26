/* ============================================================
 * hero-particles.ts — 首屏 3D 字符画
 * 四个实体造型（莫比乌斯/分析树/螺旋故事线/星群网罩）依次形变、自转，
 * 离屏渲染后按灰度映射为字符画；字符内容来自用户文本池。
 * ============================================================ */
import {
  AmbientLight, BoxGeometry, Color, DirectionalLight, DynamicDrawUsage,
  Fog, Group, InstancedMesh, Matrix4, MeshLambertMaterial, PerspectiveCamera,
  Quaternion, Scene, Vector3, WebGLRenderer, WebGLRenderTarget,
} from 'three';
import { animate } from 'animejs';
import { TEXT_STREAM, isCJK } from './hero-text';
import { SHAPE_BUILDERS, buildScatter, type Shape } from './hero-shapes';

/* ---------- 参数 ---------- */
const CFG = {
  camFov: 40, camDist: 430, mCamDist: 505,
  spinSpeed: 0.08, basePitch: -0.18,
  // 光即青色：打光处字符染青成形，渐晕为光晕，暗处铺灰墙
  lumLit: 0.45,    // 高于此亮度 → 形状本体（亮青）
  lumEdge: 0.06,   // 介于两者 → 光晕（暗青）；低于 → 字符墙（灰）
  hyst: 0.03,
  dwellMs: 7000,
  // 过渡：出发与到达都按目标造型的生长方向错峰（先长出的先出发、先到达）
  morphMs: 7200,
  flyFrac: 0.45,   // 所有粒子飞行时长统一 = 过渡总时长 × 45%；出发波 [0, 0.55]，到达波 [0.45, 1]
  // 字符墙完全静止：唯一会动的是被光照亮的造型本身
  flowDwell: 0, flowMorph: 0,
  offsetX: 40,
  scaleDesktop: 1.7, scaleMobile: 1.35,
  desktop: { cellW: 7.8, cellH: 14, fontPx: 13, m: 200 },
  mobile: { cellW: 9, cellH: 16, fontPx: 15, m: 110 },
  litColor: [0, 232, 200, 0.72],     // 形状本体：受光面（亮青）
  haloColor: [0, 232, 200, 0.5],     // 光晕：受光面外圈渐晕（暗青）
  wallColor: [153, 162, 184, 0.32],  // 字符墙：暗处铺满
};

interface HeroApi { setStatic(): void; start(): void; dispose(): void; }

export function createHero(canvas: HTMLCanvasElement): HeroApi | null {
  /* ---- 基础测量 ---- */
  const hero = canvas.parentElement;
  if (!hero) return null;
  const isMobile = () => canvas.clientWidth <= 640;
  const P = () => (isMobile() ? CFG.mobile : CFG.desktop);

  // ?herofast=1：压缩时序，便于无头截图在小预算内覆盖全部阶段
  if (new URLSearchParams(location.search).has('herofast')) {
    Object.assign(CFG, { dwellMs: 1200, morphMs: 700 });
  }

  let cols = 0, rows = 0, cssW = 0, cssH = 0, m = P().m;
  let ctx: CanvasRenderingContext2D | null = null;
  let renderer: WebGLRenderer;
  let rt: WebGLRenderTarget;

  try {
    renderer = new WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch {
    return null; // WebGL 不可用 → hero 保持纯排版
  }
  renderer.setClearColor(new Color('#000000'), 1);

  const scene = new Scene();
  scene.background = new Color('#000000');
  scene.fog = new Fog('#000000', 340, 720); // 景深：远处没入纯黑，近处通透
  const camera = new PerspectiveCamera(CFG.camFov, 1, 1, 2000);
  const dir = new DirectionalLight('#ffffff', 2.4);
  dir.position.set(0.85, 0.55, 0.5); // 侧前方扫光：拉出形体明暗，莫比乌斯扭转可读
  scene.add(dir, new AmbientLight('#ffffff', 0.4)); // 背景光：/π 后 ≈0.13，暗面稳过 lumEdge、只比纯黑亮一点

  const group = new Group();
  scene.add(group);
  let mesh: InstancedMesh | null = null;

  /* ---- 实例状态 ---- */
  let shapes: Shape[] = [];
  let currentShape: Shape = [];
  let currentIdx = 0;               // currentShape 在 shapes 中的下标（几何已置中，靠它取质心）
  let shapeSched: { dep: Float32Array; arr: Float32Array }[] = []; // 每个造型一张出发/到达时刻表
  const shapeCenters: Vector3[] = [];    // 每个造型的几何中心（整体平移量）
  const center = new Vector3();          // 当前造型的中心
  let bufRef = new Uint8Array(0);
  let tiersPrev = new Uint8Array(0);
  let tiersCurr = new Uint8Array(0);

  const _v = new Vector3(), _s = new Vector3();
  const _qa = new Quaternion();
  const _m = new Matrix4();

  function composeShape(shape: Shape) {
    if (!mesh) return;
    for (let i = 0; i < m; i++) {
      const p = shape[i];
      _v.set(p.px, p.py, p.pz);
      _qa.set(p.qx, p.qy, p.qz, p.qw);
      _s.set(p.sx, p.sy, p.sz);
      _m.compose(_v, _qa, _s);
      mesh.setMatrixAt(i, _m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  const easeInOutCubic = (x: number) =>
    (x < 0.5 ? 4 * x * x * x : 1 - ((-2 * x + 2) ** 3) / 2);

  /* 生长方向键：值小的先到达。与 SHAPE_BUILDERS 一一对应 */
  const ARRIVE_KEYS: ((p: Shape[number], i: number) => number)[] = [
    (p) => p.px,                           // 莫比乌斯：左 → 右
    (p) => p.py,                           // 分析树：下 → 上
    (p) => p.py,                           // 螺旋：下 → 上
    (_p, i) => i,                          // 星群网罩：构造次序 = 信源 → 环层 → 网罩，严格中心 → 边缘
  ];

  /* 由方向键生成出发/到达时刻表（同向波次：先长出来的先出发；隐藏实例不参与归一化） */
  function buildSchedule(shape: Shape, keyFn: (p: Shape[number], i: number) => number) {
    const keys = new Float64Array(m);
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < m; i++) {
      if (shape[i].sx <= 0) continue; // HIDDEN 占位
      keys[i] = keyFn(shape[i], i);
      if (keys[i] < mn) mn = keys[i];
      if (keys[i] > mx) mx = keys[i];
    }
    const dep = new Float32Array(m);
    const arr = new Float32Array(m).fill(1);
    const span = mx - mn;
    for (let i = 0; i < m; i++) {
      if (shape[i].sx <= 0) continue;
      const order = span > 0 ? (keys[i] - mn) / span : 0;
      const jit = Math.sin(i * 12.9898) * 43758.5453;
      const o = Math.min(1, Math.max(0, order + (jit - Math.floor(jit) - 0.5) * 0.08));
      dep[i] = (1 - CFG.flyFrac) * o;          // 出发波：[0, 1-flyFrac]
      arr[i] = dep[i] + CFG.flyFrac;           // 到达 = 出发 + 统一飞行时长
    }
    return { dep, arr };
  }

  /* 实例 i 在自己的 [dep[i], arr[i]] 时间窗内从 A 飞到 B：出发与到达都按生长方向错开 */
  function composeFromTo(from: Shape, to: Shape, t: number, dep: Float32Array, arr: Float32Array) {
    if (!mesh) return;
    for (let i = 0; i < m; i++) {
      const span = Math.max(1e-4, arr[i] - dep[i]);
      const local = Math.min(1, Math.max(0, (t - dep[i]) / span));
      const e = easeInOutCubic(local);
      const a = from[i], b = to[i];
      _v.set(a.px + (b.px - a.px) * e, a.py + (b.py - a.py) * e, a.pz + (b.pz - a.pz) * e);
      // 姿态在中点切换：此刻粒子是对称立方体，怎么转都不可见
      if (e < 0.5) _qa.set(a.qx, a.qy, a.qz, a.qw);
      else _qa.set(b.qx, b.qy, b.qz, b.qw);
      // 尺寸中途收成对称立方体（k: 0→1→0），细长条只在两端出现
      const cA = Math.min(a.sx, a.sy, a.sz), cB = Math.min(b.sx, b.sy, b.sz);
      const k = Math.sin(Math.PI * e);
      const cu = cA + (cB - cA) * e;
      _s.set(
        (a.sx + (b.sx - a.sx) * e) * (1 - k) + cu * k,
        (a.sy + (b.sy - a.sy) * e) * (1 - k) + cu * k,
        (a.sz + (b.sz - a.sz) * e) * (1 - k) + cu * k,
      );
      _m.compose(_v, _qa, _s);
      mesh.setMatrixAt(i, _m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  /* ---- 尺寸/网格重建 ---- */
  function rebuild() {
    cssW = hero!.clientWidth; cssH = hero!.clientHeight;
    const p = P(); m = p.m;
    // 460 列 ≈ 3588px，覆盖 3440 级超宽屏；行高上限保住帧预算
    cols = Math.min(460, Math.max(36, Math.floor(cssW / p.cellW)));
    rows = Math.min(72, Math.max(20, Math.floor(cssH / p.cellH)));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx = canvas.getContext('2d');
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    renderer.setSize(cols, rows, false);
    rt?.dispose();
    rt = new WebGLRenderTarget(cols, rows);
    camera.aspect = cols / rows;
    camera.position.set(0, 0, isMobile() ? CFG.mCamDist : CFG.camDist);
    camera.lookAt(isMobile() ? 0 : CFG.offsetX * 0.55, 0, 0);
    group.scale.setScalar(isMobile() ? CFG.scaleMobile : CFG.scaleDesktop);

    bufRef = new Uint8Array(cols * rows * 4);
    tiersPrev = new Uint8Array(cols * rows);
    tiersCurr = new Uint8Array(cols * rows);

    // 按当前实例数重建 mesh
    if (mesh) { group.remove(mesh); mesh.dispose(); }
    mesh = new InstancedMesh(
      new BoxGeometry(1, 1, 1),
      new MeshLambertMaterial({ color: '#ffffff' }),
      m,
    );
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    group.add(mesh);

    shapes = SHAPE_BUILDERS.map((b) => b(m));
    // 几何预置中：质心移到本地原点、存入 shapeCenters 作为整体平移量。
    // 自转轴因此固定为本地原点，center 插值只是平移，与旋转彻底解耦
    shapeCenters.length = 0;
    for (const s of shapes) {
      const c = centroid(s);
      shapeCenters.push(c);
      for (const p of s) { p.px -= c.x; p.py -= c.y; p.pz -= c.z; }
    }
    if (currentShape.length !== m) {
      currentShape = buildScatter(m);
      const cc = centroid(currentShape);
      for (const p of currentShape) { p.px -= cc.x; p.py -= cc.y; p.pz -= cc.z; }
      center.copy(cc);
    } else {
      center.copy(shapeCenters[currentIdx] ?? shapeCenters[0]);
    }
    // 每个造型按自身生长方向铺出发/到达时刻（置中不影响方向键的归一化次序）
    shapeSched = shapes.map((s, k) => buildSchedule(s, ARRIVE_KEYS[k] ?? ARRIVE_KEYS[0]));
    applyCenter();
    composeShape(currentShape);
  }

  /* 造型的可见实例几何中心 */
  function centroid(shape: Shape): Vector3 {
    let n = 0; const c = new Vector3();
    for (const p of shape) {
      if (p.sx <= 0) continue;
      c.x += p.px; c.y += p.py; c.z += p.pz; n++;
    }
    return n ? c.multiplyScalar(1 / n) : c;
  }

  /* 造型几何已绕本地原点置中：group 平移 = 版面偏移 + 质心，旋转轴恒为质心 */
  function applyCenter() {
    const baseX = isMobile() ? 0 : CFG.offsetX;
    group.position.set(baseX + center.x, center.y, center.z);
  }

  /* ---- ASCII 采样与绘制 ---- */
  let flowOffset = 0;

  function drawAscii() {
    if (!ctx || !mesh) return;
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.readRenderTargetPixels(rt, 0, 0, cols, rows, bufRef);
    renderer.setRenderTarget(null);

    const p = P();
    const alphaMul = isMobile() ? 0.75 : 1;
    const rgba = (c: number[]) =>
      `rgba(${c[0]},${c[1]},${c[2]},${(c[3] * alphaMul).toFixed(3)})`;
    const litFill = rgba(CFG.litColor);    // 形状本体（亮青）
    const haloFill = rgba(CFG.haloColor);  // 光晕渐晕（暗青）
    const wallFill = rgba(CFG.wallColor);  // 字符墙（暗处铺满）
    const x0 = (cssW - cols * p.cellW) / 2;

    // 第一遍：亮度 → 分层（迟滞对比上一帧，防闪烁）
    for (let r = 0; r < rows; r++) {
      const bufRow = rows - 1 - r; // WebGL 原点在左下
      for (let c = 0; c < cols; c++) {
        const cellIdx = r * cols + c;
        const lum = bufRef[(bufRow * cols + c) * 4] / 255;
        let tier = lum > CFG.lumLit ? 0 : lum > CFG.lumEdge ? 1 : 2;
        const prev = tiersPrev[cellIdx];
        if (prev === 0 && lum > CFG.lumLit - CFG.hyst) tier = 0;
        else if (prev === 2 && lum < CFG.lumEdge + CFG.hyst) tier = 2;
        tiersCurr[cellIdx] = tier;
      }
    }

    // 第二遍：拼行绘制——受光面亮青、渐晕暗青、暗处灰墙
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.font = `${p.fontPx}px "JetBrains Mono", "Courier New", monospace`;
    ctx.textBaseline = 'top';

    const flow = Math.floor(flowOffset);
    const streamLen = TEXT_STREAM.length;

    for (let r = 0; r < rows; r++) {
      let litStr = '', haloStr = '', wallStr = '';
      let skipNext = false;
      for (let c = 0; c < cols; c++) {
        const cellIdx = r * cols + c;
        const tier = tiersCurr[cellIdx];

        let ch = ' ';
        if (!skipNext) {
          ch = TEXT_STREAM[(cellIdx + flow) % streamLen];
          if (tier < 2 && (ch === ' ' || ch === '·')) ch = '+'; // 受光面不断线
          if (isCJK(ch)) skipNext = true;
        } else {
          skipNext = false;
        }
        litStr += tier === 0 ? ch : ' ';
        haloStr += tier === 1 ? ch : ' ';
        wallStr += tier === 2 ? ch : ' ';
      }
      const y = r * p.cellH + 2;
      if (wallStr.trim()) { ctx.fillStyle = wallFill; ctx.fillText(wallStr, x0, y); }
      if (haloStr.trim()) { ctx.fillStyle = haloFill; ctx.fillText(haloStr, x0, y); }
      if (litStr.trim()) { ctx.fillStyle = litFill; ctx.fillText(litStr, x0, y); }
    }

    const swap = tiersPrev; tiersPrev = tiersCurr; tiersCurr = swap;
  }

  /* ---- 渲染循环 ---- */
  let raf = 0, running = false, lastT = 0, accum = 0;
  let spinAngle = 0, morphing = false;

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (!running) return;
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;

    // 移动端 30fps 节流
    if (isMobile()) {
      accum += dt * 1000;
      if (accum < 33) return;
      accum = 0;
    }

    spinAngle += CFG.spinSpeed * dt;
    group.rotation.y = spinAngle;
    group.rotation.x = CFG.basePitch;
    flowOffset += (morphing ? CFG.flowMorph : CFG.flowDwell) * dt;

    drawAscii();
  }

  /* ---- 形变状态机 ---- */
  let disposed = false;

  function dwell(ms: number): Promise<void> {
    const o = { v: 0 };
    return animate(o, { v: 1, duration: ms, ease: 'linear' })
      .then(() => undefined).catch(() => undefined);
  }

  /* 过渡：出发与到达都错峰，波次方向 = 目标造型的生长方向 */
  async function morphTo(to: Shape, sched: { dep: Float32Array; arr: Float32Array }, idx: number) {
    if (!mesh) return;
    const from = currentShape;
    morphing = true;
    const cFrom = center.clone();
    const cTo = (shapeCenters[idx] ?? center).clone(); // 自转轴平滑切换到目标造型中心
    const clock = { t: 0 };
    await animate(clock, {
      t: 1,
      duration: CFG.morphMs,
      ease: 'linear', // 缓动在 composeFromTo 里按实例施加
      onUpdate: () => {
        center.lerpVectors(cFrom, cTo, easeInOutCubic(clock.t)); // 纯平移，与恒速自转解耦
        applyCenter();
        composeFromTo(from, to, clock.t, sched.dep, sched.arr);
      },
    }).then(() => undefined).catch(() => undefined);
    center.copy(cTo);
    applyCenter();
    composeShape(to); // 精确终态（浮点累计归零）
    currentShape = to;
    currentIdx = idx;
    morphing = false;
  }

  async function cycle() {
    let idx = 0; // 入场已是 shapes[0]：先驻留，再向下一造型形变
    while (!disposed) {
      await dwell(CFG.dwellMs);
      idx = (idx + 1) % shapes.length;
      await morphTo(shapes[idx], shapeSched[idx], idx);
    }
  }

  /* ---- 可见性 / 视口 ---- */
  let inView = true;
  function updateRunning() {
    const next = inView && !document.hidden && !disposed;
    if (next && !running) lastT = performance.now();
    running = next;
  }
  const io = new IntersectionObserver((es) => {
    inView = es[0]?.isIntersecting ?? true;
    updateRunning();
  }, { threshold: 0.05 });
  const onVis = () => updateRunning();
  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => { rebuild(); drawAscii(); }, 150);
  };

  /* ---- 对外 ---- */
  return {
    setStatic() {
      rebuild();
      currentShape = shapes[0]; // 莫比乌斯
      currentIdx = 0;
      center.copy(shapeCenters[0]);
      applyCenter();
      composeShape(currentShape);
      spinAngle = -0.45;
      group.rotation.y = spinAngle;
      group.rotation.x = CFG.basePitch;
      drawAscii();
    },
    start() {
      rebuild();
      currentShape = shapes[0]; // 与 setStatic 展示的造型一致（重建后的新实例）
      currentIdx = 0;
      composeShape(currentShape);
      io.observe(canvas);
      document.addEventListener('visibilitychange', onVis);
      window.addEventListener('resize', onResize);
      updateRunning();
      raf = requestAnimationFrame(frame);
      void cycle();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      rt?.dispose();
      mesh?.dispose();
      renderer.dispose();
    },
  };
}

/* ---- 页面入口 ---- */

export async function renderStaticFrame(canvas: HTMLCanvasElement): Promise<void> {
  const hero = createHero(canvas);
  if (!hero) return;
  try { await (document as Document & { fonts?: FontFaceSet }).fonts?.load('13px "JetBrains Mono"'); } catch { /* 回退字体即可 */ }
  hero.setStatic();
  canvas.classList.add('is-ready');
}

export async function initHeroScene(canvas: HTMLCanvasElement): Promise<void> {
  const hero = createHero(canvas);
  if (!hero) return;
  try { await (document as Document & { fonts?: FontFaceSet }).fonts?.load('13px "JetBrains Mono"'); } catch { /* 回退字体即可 */ }
  hero.setStatic();              // 静帧兜底，避免字体/初始化闪动
  canvas.classList.add('is-ready');
  hero.start();
}
