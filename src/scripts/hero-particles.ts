/* ============================================================
 * hero-particles.ts — 首屏 3D 字符画
 * 三个实体造型（分析树/柱阵/螺旋故事线）依次形变、自转，
 * 离屏渲染后按灰度映射为字符画；字符内容来自用户文本池。
 * ============================================================ */
import {
  AmbientLight, BoxGeometry, Color, DirectionalLight, DynamicDrawUsage,
  Group, InstancedMesh, Matrix4, MeshLambertMaterial, PerspectiveCamera,
  Quaternion, Scene, Vector3, WebGLRenderer, WebGLRenderTarget,
} from 'three';
import { animate } from 'animejs';
import { TEXT_STREAM, isCJK } from './hero-text';
import { SHAPE_BUILDERS, buildScatter, type Shape } from './hero-shapes';

/* ---------- 参数 ---------- */
const CFG = {
  camFov: 40, camDist: 430, mCamDist: 505,
  spinSpeed: 0.08, basePitch: -0.18,
  parallaxY: 0.22, parallaxX: 0.12, dampK: 3,
  // 反相映射：字符铺满成墙，打光处雕出空洞
  lumVoid: 0.45,   // 高于此亮度 → 无字符（被光吃掉）
  lumEdge: 0.12,   // 介于两者 → 过渡带（字符变淡）；低于 → 正常字符墙
  hyst: 0.03,
  dwellMs: 7000, morphMs: 1900, staggerMs: 600,
  // 字符墙完全静止：唯一会动的是光雕出的造型本身
  flowDwell: 0, flowMorph: 0,
  offsetX: 40,
  scaleDesktop: 1.7, scaleMobile: 1.35,
  desktop: { cellW: 7.8, cellH: 14, fontPx: 13, m: 200 },
  mobile: { cellW: 9, cellH: 16, fontPx: 15, m: 110 },
  edgeColor: [153, 162, 184, 0.13],  // 过渡带：贴近光的字符淡出
  wallColor: [153, 162, 184, 0.32],  // 字符墙：暗处铺满
};

interface HeroApi { setStatic(): void; start(): void; dispose(): void; }

export function createHero(canvas: HTMLCanvasElement): HeroApi | null {
  /* ---- 基础测量 ---- */
  const hero = canvas.parentElement;
  if (!hero) return null;
  const isMobile = () => canvas.clientWidth <= 640;
  const P = () => (isMobile() ? CFG.mobile : CFG.desktop);

  let cols = 0, rows = 0, cssW = 0, cssH = 0, m = P().m;
  let ctx: CanvasRenderingContext2D | null = null;
  let renderer: WebGLRenderer;
  let rt: WebGLRenderTarget;

  try {
    renderer = new WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch {
    return null; // WebGL 不可用 → hero 保持纯排版
  }
  renderer.setClearColor(new Color('#0a0c12'), 1);

  const scene = new Scene();
  scene.background = new Color('#0a0c12');
  const camera = new PerspectiveCamera(CFG.camFov, 1, 1, 2000);
  const dir = new DirectionalLight('#ffffff', 2.4);
  dir.position.set(-0.5, 0.8, 0.6);
  scene.add(dir, new AmbientLight('#8890a4', 0.7));

  const group = new Group();
  scene.add(group);
  let mesh: InstancedMesh | null = null;

  /* ---- 实例状态 ---- */
  let shapes: Shape[] = [];
  let currentShape: Shape = [];
  const proxies: { t: number }[] = [];
  const tiers = new Uint8Array(0);
  const buf = new Uint8Array(0);
  let bufRef = buf, tiersRef = tiers;

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

  function composeFromTo(from: Shape, to: Shape) {
    if (!mesh) return;
    for (let i = 0; i < m; i++) {
      const t = proxies[i].t, a = from[i], b = to[i];
      _v.set(a.px + (b.px - a.px) * t, a.py + (b.py - a.py) * t, a.pz + (b.pz - a.pz) * t);
      _qa.set(a.qx, a.qy, a.qz, a.qw);
      _qb.set(b.qx, b.qy, b.qz, b.qw);
      _qa.slerp(_qb, t);
      _s.set(a.sx + (b.sx - a.sx) * t, a.sy + (b.sy - a.sy) * t, a.sz + (b.sz - a.sz) * t);
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
    tiersRef = new Uint8Array(cols * rows);

    // 按当前实例数重建 mesh
    if (mesh) { group.remove(mesh); mesh.dispose(); }
    mesh = new InstancedMesh(
      new BoxGeometry(1, 1, 1),
      new MeshLambertMaterial({ color: '#d5dbe8' }),
      m,
    );
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    group.add(mesh);

    shapes = SHAPE_BUILDERS.map((b) => b(m));
    if (currentShape.length !== m) currentShape = buildScatter(m);
    while (proxies.length < m) proxies.push({ t: 1 });
    proxies.length = m;
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
    const edgeFill = rgba(CFG.edgeColor);  // 过渡带（贴近光，字符变淡）
    const wallFill = rgba(CFG.wallColor);  // 字符墙（暗处铺满）
    const x0 = (cssW - cols * p.cellW) / 2;

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.font = `${p.fontPx}px "JetBrains Mono", "Courier New", monospace`;
    ctx.textBaseline = 'top';

    const flow = Math.floor(flowOffset);
    const streamLen = TEXT_STREAM.length;

    for (let r = 0; r < rows; r++) {
      const bufRow = rows - 1 - r; // WebGL 原点在左下
      let dimStr = '', brightStr = '';
      let skipNext = false;
      for (let c = 0; c < cols; c++) {
        const cellIdx = r * cols + c;
        const li = (bufRow * cols + c) * 4;
        const lum = bufRef[li] / 255;
        // 反相：亮处（打光）→ 空洞；暗处 → 字符墙
        let tier = lum > CFG.lumVoid ? 0 : lum > CFG.lumEdge ? 1 : 2;
        // 迟滞防闪烁
        const prev = tiersRef[cellIdx];
        if (prev === 0 && lum > CFG.lumVoid - CFG.hyst) tier = 0;
        else if (prev === 2 && lum < CFG.lumEdge + CFG.hyst) tier = 2;
        tiersRef[cellIdx] = tier;

        let ch = ' ';
        if (tier > 0 && !skipNext) {
          const seq = r * cols + (r % 2 === 1 ? cols - 1 - c : c); // 蛇形扫描
          ch = TEXT_STREAM[(seq + flow) % streamLen];
          if (isCJK(ch)) skipNext = true;
        } else {
          skipNext = false;
        }
        const blank = ' ';
        dimStr += tier === 1 ? ch : blank;
        brightStr += tier === 2 ? ch : blank;
      }
      const y = r * p.cellH + 2;
      if (brightStr.trim()) { ctx.fillStyle = wallFill; ctx.fillText(brightStr, x0, y); }
      if (dimStr.trim()) { ctx.fillStyle = edgeFill; ctx.fillText(dimStr, x0, y); }
    }
  }

  /* ---- 渲染循环 ---- */
  let raf = 0, running = false, lastT = 0, accum = 0;
  let spinAngle = 0, morphing = false;
  let parX = 0, parY = 0, parTX = 0, parTY = 0;

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
    parX += (parTX - parX) * (1 - Math.exp(-CFG.dampK * dt));
    parY += (parTY - parY) * (1 - Math.exp(-CFG.dampK * dt));
    group.rotation.y = spinAngle + parY;
    group.rotation.x = CFG.basePitch + parX;
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

  async function morphTo(to: Shape) {
    if (!mesh) return;
    const from = currentShape;
    morphing = true;
    for (const pr of proxies) pr.t = 0;
    await animate(proxies, {
      t: 1,
      duration: CFG.morphMs,
      ease: 'inOutCubic',
      delay: () => Math.random() * CFG.staggerMs,
      onUpdate: () => composeFromTo(from, to),
    }).then(() => undefined).catch(() => undefined);
    composeFromTo(from, to);
    currentShape = to;
    morphing = false;
  }

  async function cycle() {
    let idx = 0;
    while (!disposed) {
      await morphTo(shapes[idx]);
      await dwell(CFG.dwellMs);
      idx = (idx + 1) % shapes.length;
    }
  }

  /* ---- 可见性 / 视口 / 鼠标 ---- */
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
  const onMouse = (e: MouseEvent) => {
    if (isMobile()) return;
    const rect = hero!.getBoundingClientRect();
    parTY = ((e.clientX - rect.left) / rect.width - 0.5) * 2 * CFG.parallaxY;
    parTX = ((e.clientY - rect.top) / rect.height - 0.5) * 2 * CFG.parallaxX;
  };
  const onLeave = () => { parTX = 0; parTY = 0; };

  /* ---- 对外 ---- */
  return {
    setStatic() {
      rebuild();
      currentShape = shapes[0]; // 分析树
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
      hero!.addEventListener('mousemove', onMouse);
      hero!.addEventListener('mouseleave', onLeave);
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
      hero!.removeEventListener('mousemove', onMouse);
      hero!.removeEventListener('mouseleave', onLeave);
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
