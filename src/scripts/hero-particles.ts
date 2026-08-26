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
  // 过渡：所有实例同时从 A 出发，按构造次序先后到达 B（生长感）
  morphMs: 2600,
  arriveMin: 0.2, // 最早到达时刻占总时长的比例，最晚为 1
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
  let shapeArrive: Float32Array[] = []; // 每个造型一张到达时刻表（值∈[arriveMin,1]）
  let bufRef = new Uint8Array(0);
  let tiersPrev = new Uint8Array(0);
  let tiersCurr = new Uint8Array(0);

  const _v = new Vector3(), _s = new Vector3();
  const _qa = new Quaternion(), _qb = new Quaternion();
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
  const easeOutBack = (x: number) =>
    1 + 2.70158 * ((x - 1) ** 3) + 1.70158 * ((x - 1) ** 2);

  /* 各造型过渡方式：true = 目标处弹入式生长（先收缩离场、途中隐形、到点弹入） */
  const GROW_IN = [false, false, false, true]; // 星群网罩：从中心层层生长

  /* 生长缩放曲线：前 18% 收缩离开旧位，中段隐形飞行，后 40% 在新位弹入 */
  function growScale(e: number): number {
    if (e < 0.18) return 1 - e / 0.18;
    if (e > 0.6) return easeOutBack(Math.min(1, (e - 0.6) / 0.4));
    return 0;
  }

  /* 生长方向键：值小的先到达。与 SHAPE_BUILDERS 一一对应 */
  const ARRIVE_KEYS: ((p: Shape[number], i: number) => number)[] = [
    (p) => p.px,                           // 莫比乌斯：左 → 右
    (p) => p.py,                           // 分析树：下 → 上
    (p) => p.py,                           // 螺旋：下 → 上
    (_p, i) => i,                          // 星群网罩：构造次序 = 信源 → 环层 → 网罩，严格中心 → 边缘
  ];

  /* 由方向键生成到达时刻表（略加抖动避免过于机械；隐藏实例不参与归一化） */
  function buildArrive(shape: Shape, keyFn: (p: Shape[number], i: number) => number): Float32Array {
    const keys = new Float64Array(m);
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < m; i++) {
      if (shape[i].sx <= 0) continue; // HIDDEN 占位
      keys[i] = keyFn(shape[i], i);
      if (keys[i] < mn) mn = keys[i];
      if (keys[i] > mx) mx = keys[i];
    }
    const arr = new Float32Array(m).fill(1);
    const span = mx - mn;
    for (let i = 0; i < m; i++) {
      if (shape[i].sx <= 0) continue;
      const order = span > 0 ? (keys[i] - mn) / span : 0;
      const jit = Math.sin(i * 12.9898) * 43758.5453;
      const o = Math.min(1, Math.max(0, order + (jit - Math.floor(jit) - 0.5) * 0.08));
      arr[i] = CFG.arriveMin + (1 - CFG.arriveMin) * o;
    }
    return arr;
  }

  /* 全体同时出发（t 为全局线性进度），实例 i 在 arr[i] 时刻到达 */
  function composeFromTo(from: Shape, to: Shape, t: number, arr: Float32Array, growIn: boolean) {
    if (!mesh) return;
    for (let i = 0; i < m; i++) {
      const e = easeInOutCubic(Math.min(1, t / arr[i]));
      const a = from[i], b = to[i];
      _v.set(a.px + (b.px - a.px) * e, a.py + (b.py - a.py) * e, a.pz + (b.pz - a.pz) * e);
      _qa.set(a.qx, a.qy, a.qz, a.qw);
      _qb.set(b.qx, b.qy, b.qz, b.qw);
      _qa.slerp(_qb, e);
      const g = growIn ? growScale(e) : 1;
      _s.set((a.sx + (b.sx - a.sx) * e) * g, (a.sy + (b.sy - a.sy) * e) * g, (a.sz + (b.sz - a.sz) * e) * g);
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
    group.position.x = isMobile() ? 0 : CFG.offsetX;
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
    if (currentShape.length !== m) currentShape = buildScatter(m);
    // 每个造型按自身生长方向铺到达时刻
    shapeArrive = shapes.map((s, k) => buildArrive(s, ARRIVE_KEYS[k] ?? ARRIVE_KEYS[0]));
    composeShape(currentShape);
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

    spinAngle += CFG.spinSpeed * dt * (morphing ? 0.5 : 1);
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

  /* 过渡：所有实例同时出发，按目标造型的生长方向先后落定 */
  async function morphTo(to: Shape, arr: Float32Array, growIn: boolean) {
    if (!mesh) return;
    const from = currentShape;
    morphing = true;
    const clock = { t: 0 };
    await animate(clock, {
      t: 1,
      duration: CFG.morphMs,
      ease: 'linear', // 缓动在 composeFromTo 里按实例施加
      onUpdate: () => composeFromTo(from, to, clock.t, arr, growIn),
    }).then(() => undefined).catch(() => undefined);
    composeShape(to); // 精确终态（浮点累计归零）
    currentShape = to;
    morphing = false;
  }

  async function cycle() {
    let idx = 0;
    while (!disposed) {
      await morphTo(shapes[idx], shapeArrive[idx], GROW_IN[idx] ?? false);
      await dwell(CFG.dwellMs);
      idx = (idx + 1) % shapes.length;
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
      composeShape(currentShape);
      spinAngle = -0.45;
      group.rotation.y = spinAngle;
      group.rotation.x = CFG.basePitch;
      drawAscii();
    },
    start() {
      rebuild();
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
