/* ============================================================
 * hero-particles.ts — 首屏莫比乌斯 · 景深点染
 * three.js 点精灵 + anime.js 驱动自转：莫比乌斯环面均匀预采样为静态点云，
 * 顶点着色器按 |对焦深度 − 点深度| 把点沿各自的随机方向散开
 * （r = coc·|f−d|^e，Circle of Confusion）——对焦处粒子凝聚成形，
 * 离焦处散开解体、形状消融成雾。点本身始终是小圆点，不做光斑放大。
 * ============================================================ */
import {
  AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Group,
  NormalBlending,
  PerspectiveCamera, Points, Quaternion, Scene, ShaderMaterial, Vector3, WebGLRenderer,
  Euler,
} from 'three';
import { animate, type JSAnimation } from 'animejs';
import { sampleTree, sampleHelix, sampleOutbreak, mulberry32 } from './hero-shapes';

/* ---------- 参数 ---------- */
const CFG = {
  camFov: 50, camDist: 330,
  spinSpeed: 0.02, rotXSpeed: 0, rotZSpeed: 0, basePitch: -0.18, // spin：绕环面法向自转；rotXSpeed/rotZSpeed：绕 X/Z 缓慢翻滚
  rotX: 0, rotY: -1.86, rotZ: -0.06, // 静态朝向偏移（调参用）：叠在俯仰与自转之外
  offsetX: 40, offsetY: 0,
  scaleX: 1.7, scaleY: 1.7, scaleZ: 1.7, // 三轴缩放
  thick: 0,       // 环带厚度（世界单位）：点吸附在 ±thick 两个壳面上，空心截面；0 = 回到扁带
  focus: 245,     // 对焦深度：距相机此远处的点最凝聚（前排环缘）
  coc: 0.008,     // 散开强度 m：离焦位移半径 r = coc·|focus−d|^exp
  cocExp: 1.5,    // 散开分布指数 e：>1 让近焦更锐利、远焦更快解体
  dotWorld: 0.5,  // 点半径（世界单位，恒定——模糊靠散开而非放大）
  alpha: 0.5,     // 单点透明度（常值；散开后密度自然摊薄，亚像素点另有能量补偿）
  count: 105000, mCount: 38000, // 点云规模（桌面/移动端）：铺满环面成连续点带
  color: '#00e8c8',
  colorFar: '#1291ab',  // 离焦端颜色：r 超过 colorRamp 后完全过渡到此色
  colorRamp: 8,         // 颜色映射区间（世界单位）：r 从 0 → colorRamp 完成 近色→远色
  bgColor: '#0a0c12',           // 与页面 --bg 同源
  /* ---- 形变状态机：环 → 作品造型 → 环（角度驱动） ---- */
  badZones: [[1.15, 5.3]] as Array<[number, number]>, // 丑角区（spin 弧度，mod 2π）：扫角度截图标定，环在此区间弥散无形
  morphMs: 6000,        // 单程形变时长
  spinMargin: 0.05,     // 提前量余量（弧度）：形变完成时环刚好转进丑区
  shapeDwellMinMs: 6000,// 造型最短驻留（出丑区后才允许回环）
  shapeSpinBoost: 3,    // 造型期自转加速倍数：更快穿过丑区、控制驻留时长
  ringDwellMs: 14000,   // 时钟降级模式的环驻留（badZones 为空或停转时）
  flyFrac: 0.45,        // 错峰时刻表：单粒子飞行占全程比例
  schedJit: 0.08,       // 出发时刻确定性抖动 ±
  caption: true,        // 关键词浮层开关
};

/* ---------- 莫比乌斯参数面 · 面采样 ---------- */
const R = 88, W = 36, TILT = 0.8; // TILT：环面向镜头倾倒（绕 X），本地法向倒在 (0,cos,sin)

function surf(u: number, v: number, o: number[]) {
  const rr = R + v * Math.cos(u / 2);
  o[0] = rr * Math.cos(u);
  o[1] = v * Math.sin(u / 2);
  o[2] = rr * Math.sin(u);
}

/* 预采样点云：均匀撒满整个环面，并吸附到空心截面的闭合周线上
 * （截面为最大圆角矩形——圆角半径 = min(W, thick)，即成胶囊形；
 * 按弧长比例分配密度；几何内烘入 TILT 倾倒，自转轴因此是环面本地法向）。
 * 每个点附带一个各向同性随机单位向量，作为离焦时的散开方向 */
function buildPoints(n: number): { pos: Float32Array; dir: Float32Array; key: Float32Array } {
  const pos = new Float32Array(n * 3);
  const dir = new Float32Array(n * 3);
  const key = new Float32Array(n); // 接缝角 u/2π：回程错峰时刻表的出发次序
  const c = Math.cos(TILT), s = Math.sin(TILT);
  const o = [0, 0, 0], ou = [0, 0, 0], ov = [0, 0, 0];
  const TH = CFG.thick;
  const rc = Math.min(W, TH);            // 最大圆角半径
  const faceLen = 2 * (W - rc);          // 单个面直边长
  const wallLen = 2 * (TH - rc);         // 单个侧壁直边长（最大圆角时为 0）
  const perim = 2 * faceLen + 2 * wallLen + 2 * Math.PI * rc;
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 * Math.PI;
    key[i] = u / (2 * Math.PI);
    let v: number, t: number;
    const x = Math.random() * perim;
    if (x < 2 * faceLen) {
      v = (Math.random() * 2 - 1) * (W - rc);   // 上/下面直边
      t = (x < faceLen ? 1 : -1) * TH;
    } else if (x < 2 * faceLen + 2 * wallLen) {
      v = (x < 2 * faceLen + wallLen ? 1 : -1) * W; // 侧壁直边
      t = (Math.random() * 2 - 1) * (TH - rc);
    } else {
      // 四个角弧合并成一个整圆采样：象限符号定位角心，弧上密度均匀
      const phi = Math.random() * 2 * Math.PI;
      const cvv = Math.cos(phi), ctt = Math.sin(phi);
      v = Math.sign(cvv) * (W - rc) + cvv * rc;
      t = Math.sign(ctt) * (TH - rc) + ctt * rc;
    }
    surf(u, v, o);
    // 数值法向 n = ∂u × ∂v，点只落在闭合壳面上 → 空心截面
    surf(u + 1e-3, v, ou);
    surf(u, v + 1e-3, ov);
    const ax = ou[0] - o[0], ay = ou[1] - o[1], az = ou[2] - o[2];
    const bx = ov[0] - o[0], by = ov[1] - o[1], bz = ov[2] - o[2];
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    const nl = Math.hypot(nx, ny, nz) || 1;
    const tn = t / nl;
    const px = o[0] + nx * tn, py = o[1] + ny * tn, pz = o[2] + nz * tn;
    pos[i * 3] = px;
    pos[i * 3 + 1] = py * c - pz * s;
    pos[i * 3 + 2] = py * s + pz * c;
    const z = Math.random() * 2 - 1, tt = Math.random() * 2 * Math.PI;
    const q = Math.sqrt(1 - z * z);
    dir[i * 3] = q * Math.cos(tt);
    dir[i * 3 + 1] = q * Math.sin(tt);
    dir[i * 3 + 2] = z;
  }
  return { pos, dir, key };
}

/* ---------- 着色器 ---------- */
const VERT = /* glsl */ `
uniform float uFocus, uCoc, uCocExp, uPixK, uDot, uAlpha, uRamp, uT, uMorphDir;
uniform vec3 uColor, uColorFar;
attribute vec3 aDir;
attribute vec3 aTarget;    // 目标造型上的家
attribute vec3 aTargetDir; // 目标造型上的散开方向
attribute vec4 aSched;     // 错峰时刻表：(去程 start/dur, 回程 start/dur)
varying float vAlpha;
varying vec3 vColor;
void main() {
  // 每粒子错峰：uT 是全体总进度，lt 是本粒子的局部进度
  vec2 sched = uMorphDir < 0.5 ? aSched.xy : aSched.zw;
  float lt = clamp((uT - sched.x) / max(sched.y, 1e-4), 0.0, 1.0);
  float e = lt * lt * (3.0 - 2.0 * lt); // smoothstep：起飞/落地缓动
  vec3 p = mix(position, aTarget, e);
  vec3 d = normalize(mix(aDir, aTargetDir, e));
  // 先形变后模糊：离焦按形变后的位置计算，中途无鬼影
  vec4 mv0 = modelViewMatrix * vec4(p, 1.0);
  float depth0 = max(1.0, -mv0.z);
  float r = uCoc * pow(abs(uFocus - depth0), uCocExp); // 散开半径（世界单位）
  vec4 mv = modelViewMatrix * vec4(p + d * r, 1.0);
  float depth = max(1.0, -mv.z);
  vAlpha = uAlpha;
  vColor = mix(uColor, uColorFar, clamp(r / uRamp, 0.0, 1.0)); // 近焦色 → 离焦色
  float px = uDot * uPixK / depth;
  const float MINPX = 3.0; // 最小足迹 3px：软边覆盖更多像素，亚像素移动平滑淡出
  vAlpha *= pow(clamp(px / MINPX, 0.0, 1.0), 1.5); // 能量补偿：被钳大放大的点变暗
  gl_PointSize = clamp(px, MINPX, 96.0);
  gl_Position = projectionMatrix * mv;
}
`;
const FRAG = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.12, d) * vAlpha; // 软边小圆点
  if (a < 0.002) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

interface HeroApi { setStatic(): void; start(): void; dispose(): void; }

export function createHero(canvas: HTMLCanvasElement): HeroApi | null {
  /* ---- 基础测量 ---- */
  const hero = canvas.parentElement;
  if (!hero) return null;
  // 按指针类型区分移动设备（触屏），而非窗口宽度：
  // 桌面窗口拉窄仍是桌面取景，只是居中裁切 3425 画面
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const isMobile = () => coarse;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch {
    return null; // WebGL 不可用 → hero 保持纯排版
  }
  renderer.setClearColor(new Color(CFG.bgColor), 1);

  const scene = new Scene();
  scene.background = new Color(CFG.bgColor);
  const camera = new PerspectiveCamera(CFG.camFov, 1, 1, 4000);

  // 两层嵌套：平移 → (X 拉伸 + 自转)。X 拉伸 = 虚拟宽高比，还原宽幅取景下环的观感
  const groupPos = new Group();
  const groupStretch = new Group();
  const group = new Group();
  groupPos.add(groupStretch);
  groupStretch.add(group);
  scene.add(groupPos);

  const material = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uFocus: { value: CFG.focus },
      uCoc: { value: CFG.coc },
      uCocExp: { value: CFG.cocExp },
      uPixK: { value: 1 },
      uDot: { value: CFG.dotWorld },
      uAlpha: { value: CFG.alpha },
      uColor: { value: new Color(CFG.color) },
      uColorFar: { value: new Color(CFG.colorFar) },
      uRamp: { value: CFG.colorRamp },
      uT: { value: 0 },        // 形变总进度 0=环 1=造型
      uMorphDir: { value: 0 }, // 0 去程（环→造型）/ 1 回程
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending, // 叠加发光：密度即亮度
  });
  const geometry = new BufferGeometry();
  const sampled = buildPoints(isMobile() ? CFG.mCount : CFG.count);
  geometry.setAttribute('position', new Float32BufferAttribute(sampled.pos, 3));
  geometry.setAttribute('aDir', new Float32BufferAttribute(sampled.dir, 3));
  // 形变 attribute 初始为环自身（uT=0 时着色器不读，仅占位保语法）
  geometry.setAttribute('aTarget', new Float32BufferAttribute(sampled.pos.slice(), 3));
  geometry.setAttribute('aTargetDir', new Float32BufferAttribute(sampled.dir.slice(), 3));
  const sched0 = new Float32Array(sampled.key.length * 4);
  for (let i = 0; i < sampled.key.length; i++) { sched0[i * 4 + 1] = 1; sched0[i * 4 + 3] = 1; }
  geometry.setAttribute('aSched', new Float32BufferAttribute(sched0, 4));
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  group.add(points);

  /* 明暗主题：浅底上加法混合会溶进白色，换普通混合 + 黑墨粒子 */
  const THEME_GFX: Record<'dark' | 'light', { color: string; colorFar: string; bg: string; additive: boolean }> = {
    dark:  { color: CFG.color, colorFar: CFG.colorFar, bg: CFG.bgColor, additive: true },
    light: { color: '#171b26', colorFar: '#f6f7f9', bg: '#f6f7f9', additive: false },
  };
  let activeTheme: 'dark' | 'light' = 'dark';
  function applyThemeGfx(name: string | null) {
    activeTheme = name === 'light' ? 'light' : 'dark';
    const t = THEME_GFX[activeTheme];
    material.uniforms.uColor.value.set(t.color);
    material.uniforms.uColorFar.value.set(t.colorFar);
    material.blending = t.additive ? AdditiveBlending : NormalBlending;
    material.needsUpdate = true;
    (scene.background as Color).set(t.bg);
    renderer.setClearColor(new Color(t.bg), 1);
  }
  applyThemeGfx(document.documentElement.getAttribute('data-theme'));
  window.addEventListener('themechange', (e) => {
    applyThemeGfx((e as CustomEvent).detail);
    if (!running) renderOnce(state.spin);
  });

  function rebuildPoints() {
    const resampled = buildPoints(isMobile() ? CFG.mCount : CFG.count);
    geometry.setAttribute('position', new Float32BufferAttribute(resampled.pos, 3));
    geometry.setAttribute('aDir', new Float32BufferAttribute(resampled.dir, 3));
    if (!running) renderOnce(state.spin);
  }

  // 自转轴 = 环面本地法向；姿态合成：rot(调参) · 俯仰 · 绕法向自转
  const RING_AXIS = new Vector3(0, Math.cos(TILT), Math.sin(TILT));
  const _spinQ = new Quaternion();
  const _rotQ = new Quaternion();
  const _euler = new Euler();
  const _pitchQ = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), CFG.basePitch);
  function applySpin(angle: number) {
    _spinQ.setFromAxisAngle(RING_AXIS, angle);
    _rotQ.setFromEuler(_euler.set(CFG.rotX + state.rotX, CFG.rotY, CFG.rotZ + state.rotZ)); // 静态偏移 + 缓慢翻滚
    group.quaternion.copy(_rotQ).multiply(_pitchQ).multiply(_spinQ);
  }

  let cssW = 0, cssH = 0;

  function renderOnce(angle: number) {
    applySpin(angle);
    renderer.render(scene, camera);
  }

  function applyView() {
    camera.position.set(0, 0, CFG.camDist);
    groupPos.position.set(CFG.offsetX, CFG.offsetY, 0);
    group.scale.set(CFG.scaleX, CFG.scaleY, CFG.scaleZ);
    if (!running) renderOnce(state.spin);
  }

  function rebuild() {
    cssW = canvas.clientWidth; cssH = canvas.clientHeight; // 画布可高于 hero（渗出首屏），按画布取尺寸避免拉伸
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(cssW, cssH, false);
    // 锁定 3425px 虚拟宽度取景：相机按虚拟幅面投影，实际窗口
    // 用 setViewOffset 居中裁切——窗口只改变可见范围，不改焦距/比例
    const refW = 3425;
    camera.aspect = refW / cssH;
    camera.setViewOffset(refW, cssH, (refW - cssW) / 2, 0, cssW, cssH);
    camera.updateProjectionMatrix();
    groupStretch.scale.x = camera.aspect;
    // 点精灵尺寸系数：世界尺寸 → 设备像素（纵向焦距 × dpr）
    material.uniforms.uPixK.value =
      (cssH * dpr) / (2 * Math.tan((CFG.camFov * Math.PI) / 360));
    applyView();
  }

  /* ---- anime.js 驱动自转：无限线性补间，每 tick 渲染 ---- */
  const state = { spin: -0.45, rotX: 0, rotZ: 0 };
  let spinAnim: JSAnimation | null = null;
  let rotXAnim: JSAnimation | null = null;
  let rotZAnim: JSAnimation | null = null;
  let frameHook: (() => void) | null = null; // 调试面板的角度读数，每帧同步
  function renderTick() {
    if (!running) return;
    morphTick();
    renderOnce(state.spin);
    frameHook?.();
  }

  let spinBoostCur = 1; // 造型期自转加速倍数（1 = 常速）
  function makeSpin() {
    spinAnim?.pause();
    const eff = CFG.spinSpeed * spinBoostCur;
    const speed = Math.abs(eff);
    if (speed < 1e-4) { spinAnim = null; return; }
    spinAnim = animate(state, {
      spin: [state.spin, state.spin + Math.sign(eff) * 2 * Math.PI],
      duration: ((2 * Math.PI) / speed) * 1000,
      ease: 'linear',
      loop: true, // 每圈回绕 ±2π：姿态等价，无跳变
      autoplay: running,
      onUpdate: renderTick,
    });
  }

  function makeRotX() {
    rotXAnim?.pause();
    const speed = Math.abs(CFG.rotXSpeed);
    if (speed < 1e-4) { rotXAnim = null; return; }
    rotXAnim = animate(state, {
      rotX: [state.rotX, state.rotX + Math.sign(CFG.rotXSpeed) * 2 * Math.PI],
      duration: ((2 * Math.PI) / speed) * 1000,
      ease: 'linear',
      loop: true,
      autoplay: running,
      onUpdate: renderTick,
    });
  }

  function makeRotZ() {
    rotZAnim?.pause();
    const speed = Math.abs(CFG.rotZSpeed);
    if (speed < 1e-4) { rotZAnim = null; return; }
    rotZAnim = animate(state, {
      rotZ: [state.rotZ, state.rotZ + Math.sign(CFG.rotZSpeed) * 2 * Math.PI],
      duration: ((2 * Math.PI) / speed) * 1000,
      ease: 'linear',
      loop: true,
      autoplay: running,
      onUpdate: renderTick,
    });
  }

  /* ---- 形变状态机：环 ⇄ 作品造型，由自转角度驱动 ----
   * 环只在好看的角窗里驻留；逼近丑区入口就形变成造型（顺便隐喻作品），
   * 转过丑区后变回环——环永远以最好看的角度示人。 */
  const TAU = Math.PI * 2;
  const modTau = (a: number) => ((a % TAU) + TAU) % TAU;
  const inZone = (a: number, z: [number, number]) => modTau(a - z[0]) < modTau(z[1] - z[0]);

  const urlParams = new URLSearchParams(location.search);
  if (urlParams.has('herofast')) { // 测试用：压缩时序
    CFG.morphMs = 1500; CFG.shapeDwellMinMs = 2000; CFG.ringDwellMs = 2000;
    CFG.spinSpeed *= 8;
  }
  const onlyShape = urlParams.get('heroOnly'); // tree|helix|outbreak 锁单造型

  interface BakedShape {
    id: string;
    pos: Float32BufferAttribute;
    dir: Float32BufferAttribute;
    sched: Float32BufferAttribute;
  }
  let shapes: BakedShape[] | null = null;
  let shapeIdx = 0;

  // 造型朝向 bake：采样器输出的点云预旋 Q(spinMid)⁻¹，
  // 使造型转到丑区中段时正好正对镜头（翻滚通道开启时朝向会漂移，可接受）
  function orientationAt(a: number, out: Quaternion): Quaternion {
    _spinQ.setFromAxisAngle(RING_AXIS, a);
    _rotQ.setFromEuler(_euler.set(CFG.rotX, CFG.rotY, CFG.rotZ));
    return out.copy(_rotQ).multiply(_pitchQ).multiply(_spinQ);
  }

  function bakeShapes() {
    const defs = [
      { id: 'tree', fn: sampleTree, seed: 20260521 },
      { id: 'helix', fn: sampleHelix, seed: 20260522 },
      { id: 'outbreak', fn: sampleOutbreak, seed: 20260717 },
    ].filter((d) => !onlyShape || d.id === onlyShape);
    const zones = CFG.badZones;
    const n = sampled.key.length;
    const squash = cssH ? cssH / 3425 : 0.26; // 补偿 groupStretch.x=aspect 的横向拉伸（3425 = 虚拟取景宽）
    // 造型落位（本地坐标）：画布 200vh，可视区是画布上半 → 本地 y ∈ [0, halfH/1.7]；
    // 横向桌面放右 1/3（避开左侧文案），移动端居中（可视横窗太窄）
    const halfH = CFG.camDist * Math.tan((CFG.camFov * Math.PI) / 360);
    const aspect = cssH ? 3425 / cssH : 3.85;
    const stretchX = CFG.scaleX * aspect;
    const ndcX = cssW >= 768 ? 0.18 : 0;
    const offX = (ndcX * halfH * aspect - CFG.offsetX) / stretchX;
    const offY = (0.46 * halfH) / CFG.scaleY;
    const offZ = (CFG.camDist - CFG.focus) / CFG.scaleZ; // 坐到对焦平面上：正对镜头时造型是清晰的
    shapes = defs.map((d, i) => {
      const zone = zones.length ? zones[i % zones.length] : [0, 0] as [number, number];
      const spinMid = (zone[0] + zone[1]) / 2;
      const unwind = orientationAt(spinMid, new Quaternion()).invert();
      const s = d.fn(n, d.seed, unwind, squash, offX, offY, offZ);
      // 错峰时刻表：去程按造型生长键（树根先动、梢后动），回程按环接缝角
      const sched = new Float32Array(n * 4);
      const r = mulberry32(9100 + i);
      for (let j = 0; j < n; j++) {
        const so = Math.min(1 - CFG.flyFrac, Math.max(0, s.key[j] * (1 - CFG.flyFrac) + (r() * 2 - 1) * CFG.schedJit));
        const sb = Math.min(1 - CFG.flyFrac, Math.max(0, sampled.key[j] * (1 - CFG.flyFrac) + (r() * 2 - 1) * CFG.schedJit));
        sched[j * 4] = so; sched[j * 4 + 1] = CFG.flyFrac;
        sched[j * 4 + 2] = sb; sched[j * 4 + 3] = CFG.flyFrac;
      }
      return {
        id: d.id,
        pos: new Float32BufferAttribute(s.pos, 3),
        dir: new Float32BufferAttribute(s.dir, 3),
        sched: new Float32BufferAttribute(sched, 4),
      };
    });
  }

  type Phase = 'ring' | 'morphOut' | 'shape' | 'morphBack';
  let phase: Phase = 'ring';
  let manualMorph = false; // 调试面板接管 uT 时暂停状态机
  let dwellStart = 0;
  const morph = { t: 0 };
  let morphAnim: JSAnimation | null = null;

  function dispatchShape(phaseName: 'arrived' | 'leaving') {
    if (!CFG.caption || !shapes || !shapes.length) return;
    hero.dispatchEvent(new CustomEvent('heroshape', {
      detail: { phase: phaseName, shape: shapes[shapeIdx].id },
    }));
  }

  function setSpinBoost(b: number) {
    if (b === spinBoostCur) return;
    spinBoostCur = b;
    makeSpin(); // 重建补间以变速，角度连续
  }

  function setTarget(shape: BakedShape) {
    geometry.setAttribute('aTarget', shape.pos);
    geometry.setAttribute('aTargetDir', shape.dir);
    geometry.setAttribute('aSched', shape.sched);
  }

  function runMorph(to: 0 | 1, onDone: () => void) {
    morphAnim?.pause();
    const dist = Math.abs(to - morph.t);
    if (dist < 1e-4) { morph.t = to; material.uniforms.uT.value = to; onDone(); return; }
    morphAnim = animate(morph, {
      t: [morph.t, to],
      duration: CFG.morphMs * dist,
      ease: 'linear',
      autoplay: running,
      onUpdate: () => {
        material.uniforms.uT.value = morph.t;
        if (!spinAnim && !rotXAnim && !rotZAnim) renderTick(); // 停转时由形变驱动渲染
      },
      onComplete: onDone,
    });
  }

  function beginMorphOut() {
    if (!shapes || !shapes.length) return;
    phase = 'morphOut';
    setTarget(shapes[shapeIdx]);
    material.uniforms.uMorphDir.value = 0;
    runMorph(1, () => {
      phase = 'shape';
      dwellStart = performance.now();
      setSpinBoost(CFG.shapeSpinBoost);
      dispatchShape('arrived');
    });
  }

  function beginMorphBack() {
    phase = 'morphBack';
    setSpinBoost(1);
    dispatchShape('leaving'); // 词先走、形后散
    material.uniforms.uMorphDir.value = 1;
    runMorph(0, () => {
      phase = 'ring';
      dwellStart = performance.now();
      shapeIdx = (shapeIdx + 1) % (shapes?.length || 1);
    });
  }

  function morphTick() {
    if (manualMorph || !shapes || !shapes.length) return;
    const spin = CFG.spinSpeed * spinBoostCur;
    const dir = Math.sign(spin) || 1;
    const angleMode = CFG.badZones.length > 0 && Math.abs(CFG.spinSpeed) > 1e-4;
    const a = modTau(state.spin);
    if (phase === 'ring') {
      if (angleMode) {
        const zone = CFG.badZones[shapeIdx % CFG.badZones.length];
        const entry = dir > 0 ? zone[0] : zone[1];
        const fwd = dir > 0 ? modTau(entry - a) : modTau(a - entry);
        const lead = (CFG.morphMs / 1000) * Math.abs(spin) + CFG.spinMargin;
        if (fwd <= lead || inZone(a, zone)) beginMorphOut(); // 已在丑区内则立即触发（兜底）
      } else if (performance.now() - dwellStart >= CFG.ringDwellMs) {
        beginMorphOut();
      }
    } else if (phase === 'shape') {
      if (performance.now() - dwellStart < CFG.shapeDwellMinMs) return;
      if (angleMode) {
        const zone = CFG.badZones[shapeIdx % CFG.badZones.length];
        if (!inZone(a, zone)) beginMorphBack(); // 已转出丑区（不能用角距 < π 判断：丑区比 π 宽会误判）
      } else {
        beginMorphBack();
      }
    }
  }

  /* ---- 临时调参面板（?debug=1 启用；调参完整块删除） ---- */
  function mountDebugPanel() {
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:999;background:rgba(10,12,18,.92);border:1px solid rgba(255,255,255,.18);padding:10px 12px;font:11px/1.8 "JetBrains Mono",monospace;color:#99a2b8;display:flex;flex-direction:column;gap:6px;min-width:280px';
    const mkRow = (label: string, min: number, max: number, step: number, val: number, onInput: (v: number) => void) => {
      const row = document.createElement('label');
      row.style.cssText = 'display:flex;align-items:center;gap:8px';
      const name = document.createElement('span');
      name.textContent = label;
      name.style.cssText = 'width:44px;color:#e6eaf3';
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = String(min); slider.max = String(max);
      slider.step = String(step); slider.value = String(val);
      slider.style.flex = '1';
      const out = document.createElement('span');
      out.textContent = String(val);
      out.style.cssText = 'width:44px;text-align:right;color:#00e8c8';
      slider.addEventListener('input', () => {
        const v = Number(slider.value);
        out.textContent = String(+v.toFixed(3));
        onInput(v);
      });
      row.append(name, slider, out);
      panel.appendChild(row);
    };
    const refresh = () => { if (!running) renderOnce(state.spin); };
    const colorSyncs: Array<() => void> = [];
    const mkColor = (label: string, get: () => string, onInput: (v: string) => void) => {
      const row = document.createElement('label');
      row.style.cssText = 'display:flex;align-items:center;gap:8px';
      const name = document.createElement('span');
      name.textContent = label;
      name.style.cssText = 'width:44px;color:#e6eaf3';
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = get();
      picker.style.cssText = 'flex:1;height:20px;border:none;background:none;padding:0;cursor:pointer';
      const out = document.createElement('span');
      out.textContent = picker.value;
      out.style.cssText = 'width:60px;text-align:right;color:#00e8c8';
      picker.addEventListener('input', () => {
        out.textContent = picker.value;
        onInput(picker.value);
      });
      colorSyncs.push(() => { picker.value = get(); out.textContent = get(); });
      row.append(name, picker, out);
      panel.appendChild(row);
    };
    mkRow('posX', -1000, 1000, 1, CFG.offsetX, (v) => { CFG.offsetX = v; applyView(); });
    mkRow('posY', -500, 500, 1, CFG.offsetY, (v) => { CFG.offsetY = v; applyView(); });
    mkRow('posZ', 50, 1500, 1, CFG.camDist, (v) => { CFG.camDist = v; applyView(); });
    mkRow('scaleX', 0.1, 6, 0.05, CFG.scaleX, (v) => { CFG.scaleX = v; applyView(); });
    mkRow('scaleY', 0.1, 6, 0.05, CFG.scaleY, (v) => { CFG.scaleY = v; applyView(); });
    mkRow('scaleZ', 0.1, 6, 0.05, CFG.scaleZ, (v) => { CFG.scaleZ = v; applyView(); });
    mkRow('thick', 0, 30, 0.5, CFG.thick, (v) => { CFG.thick = v; rebuildPoints(); });
    mkRow('rotX', -3.14, 3.14, 0.01, CFG.rotX, (v) => { CFG.rotX = v; refresh(); });
    mkRow('rotY', -3.14, 3.14, 0.01, CFG.rotY, (v) => { CFG.rotY = v; refresh(); });
    mkRow('rotZ', -3.14, 3.14, 0.01, CFG.rotZ, (v) => { CFG.rotZ = v; refresh(); });
    mkRow('focus', 0, 800, 5, CFG.focus, (v) => { material.uniforms.uFocus.value = v; CFG.focus = v; refresh(); });
    mkRow('blur', 0, 0.02, 0.0002, CFG.coc, (v) => { material.uniforms.uCoc.value = v; CFG.coc = v; refresh(); });
    mkColor('colorN', () => THEME_GFX[activeTheme].color, (v) => { THEME_GFX[activeTheme].color = v; material.uniforms.uColor.value.set(v); refresh(); });
    mkColor('colorF', () => THEME_GFX[activeTheme].colorFar, (v) => { THEME_GFX[activeTheme].colorFar = v; material.uniforms.uColorFar.value.set(v); refresh(); });
    mkRow('ramp', 0.5, 30, 0.5, CFG.colorRamp, (v) => { material.uniforms.uRamp.value = v; CFG.colorRamp = v; refresh(); });
    mkRow('spin', -1, 1, 0.005, CFG.spinSpeed, (v) => {
      CFG.spinSpeed = v;
      makeSpin(); // 重建补间以变速/换向，角度连续
    }); // 负值 = 反向
    mkRow('rotXV', -0.2, 0.2, 0.002, CFG.rotXSpeed, (v) => {
      CFG.rotXSpeed = v;
      makeRotX();
    }); // 绕 X 翻滚速度，负值 = 反向
    mkRow('rotZV', -0.2, 0.2, 0.002, CFG.rotZSpeed, (v) => {
      CFG.rotZSpeed = v;
      makeRotZ();
    }); // 绕 Z 翻滚速度，负值 = 反向
    // spinPos：暂停自转、直接把环拖到指定角度，用于标定丑角区
    const spinReadout = document.createElement('span');
    const TAU = Math.PI * 2;
    frameHook = () => {
      const a = ((state.spin % TAU) + TAU) % TAU;
      spinReadout.textContent = `spin=${a.toFixed(2)}`;
    };
    mkRow('spinPos', 0, TAU, 0.01, ((state.spin % TAU) + TAU) % TAU, (v) => {
      spinAnim?.pause();
      state.spin = v;
      renderOnce(state.spin);
    });
    spinReadout.style.cssText = 'color:#00e8c8';
    panel.appendChild(spinReadout);

    /* ---- MORPH 分区 ---- */
    const sep = document.createElement('div');
    sep.style.cssText = 'border-top:1px solid rgba(255,255,255,.14);margin:4px 0 2px;color:#e6eaf3';
    sep.textContent = 'MORPH';
    panel.appendChild(sep);
    mkRow('morphT', 0, 1, 0.01, 0, (v) => {
      manualMorph = true; // 拖杆即接管，状态机暂停
      morphAnim?.pause();
      morph.t = v;
      material.uniforms.uT.value = v;
      renderOnce(state.spin); // spinPos 会暂停自转循环，这里直接渲（refresh 只在 !running 时渲）
    });
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
    const mkBtn = (label: string, onClick: () => void) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:#e6eaf3;font:inherit;padding:2px 0;cursor:pointer';
      b.addEventListener('click', onClick);
      btnRow.appendChild(b);
    };
    mkBtn('ring', () => {
      manualMorph = true; morphAnim?.pause();
      morph.t = 0; material.uniforms.uT.value = 0; renderOnce(state.spin);
    });
    for (const id of ['tree', 'helix', 'outbreak']) {
      mkBtn(id, () => {
        if (!shapes) bakeShapes();
        const s = shapes?.find((x) => x.id === id);
        if (!s) return;
        manualMorph = true; morphAnim?.pause();
        setTarget(s);
        morph.t = 1; material.uniforms.uT.value = 1; renderOnce(state.spin);
      });
    }
    mkBtn('▶auto', () => {
      manualMorph = false;
      phase = 'ring';
      dwellStart = performance.now();
      morph.t = 0; material.uniforms.uT.value = 0;
      setSpinBoost(1);
      renderOnce(state.spin);
    });
    panel.appendChild(btnRow);
    const zoneRow = document.createElement('label');
    zoneRow.style.cssText = 'display:flex;align-items:center;gap:8px';
    const zoneName = document.createElement('span');
    zoneName.textContent = 'zones';
    zoneName.style.cssText = 'width:44px;color:#e6eaf3';
    const zoneInput = document.createElement('input');
    zoneInput.type = 'text';
    zoneInput.value = CFG.badZones.map(([a, b]) => `${a}-${b}`).join(';');
    zoneInput.style.cssText = 'flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:#00e8c8;font:inherit;padding:2px 4px';
    zoneInput.addEventListener('change', () => {
      const parsed = zoneInput.value.split(';').map((p) => p.split('-').map(Number))
        .filter((z): z is [number, number] => z.length === 2 && z.every(Number.isFinite));
      CFG.badZones = parsed;
      bakeShapes(); // spinMid 变了，造型朝向需要重 bake
      refresh();
    });
    zoneRow.append(zoneName, zoneInput);
    panel.appendChild(zoneRow);
    mkRow('morphMs', 500, 15000, 100, CFG.morphMs, (v) => { CFG.morphMs = v; });
    mkRow('dwellMn', 0, 20000, 500, CFG.shapeDwellMinMs, (v) => { CFG.shapeDwellMinMs = v; });
    mkRow('margin', 0, 0.5, 0.01, CFG.spinMargin, (v) => { CFG.spinMargin = v; });
    mkRow('boost', 1, 6, 0.5, CFG.shapeSpinBoost, (v) => { CFG.shapeSpinBoost = v; });
    const capRow = document.createElement('label');
    capRow.style.cssText = 'display:flex;align-items:center;gap:8px;color:#e6eaf3';
    const capBox = document.createElement('input');
    capBox.type = 'checkbox';
    capBox.checked = CFG.caption;
    capBox.addEventListener('change', () => {
      CFG.caption = capBox.checked;
      window.dispatchEvent(new CustomEvent('herocaption', { detail: CFG.caption }));
    });
    capRow.append(capBox, document.createTextNode('caption'));
    panel.appendChild(capRow);
    window.addEventListener('themechange', () => colorSyncs.forEach((sync) => sync()));
    document.body.appendChild(panel);
  }
  if (new URLSearchParams(location.search).has('debug')) {
    mountDebugPanel();
    (window as any).__heroDbg = () => ({ phase, shape: shapes?.[shapeIdx]?.id, t: morph.t, spin: modTau(state.spin) });
  }

  /* ---- 可见性 / 视口 ---- */
  let disposed = false;
  let inView = true;
  let running = false;
  function updateRunning() {
    running = inView && !document.hidden && !disposed;
    if (spinAnim) {
      if (running) spinAnim.play();
      else spinAnim.pause();
    }
    if (rotXAnim) {
      if (running) rotXAnim.play();
      else rotXAnim.pause();
    }
    if (rotZAnim) {
      if (running) rotZAnim.play();
      else rotZAnim.pause();
    }
    if (morphAnim) {
      if (running) morphAnim.play();
      else morphAnim.pause();
    }
    if (running) renderTick();
  }
  const io = new IntersectionObserver((es) => {
    inView = es[0]?.isIntersecting ?? true;
    updateRunning();
  }, { threshold: 0.05 });
  const onVis = () => updateRunning();
  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(rebuild, 150);
  };

  /* ---- 对外 ---- */
  return {
    setStatic() {
      rebuild();
      state.spin = -0.45;
      renderOnce(state.spin);
    },
    start() {
      rebuild();
      io.observe(canvas);
      document.addEventListener('visibilitychange', onVis);
      window.addEventListener('resize', onResize);
      makeSpin();
      makeRotX();
      makeRotZ();
      bakeShapes(); // 造型采样 ~30–60ms，静帧已渲染，不阻塞首帧
      dwellStart = performance.now();
      updateRunning();
      renderOnce(state.spin);
    },
    dispose() {
      disposed = true;
      spinAnim?.pause();
      rotXAnim?.pause();
      rotZAnim?.pause();
      morphAnim?.pause();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}

/* ---- 页面入口 ---- */

export async function renderStaticFrame(canvas: HTMLCanvasElement): Promise<void> {
  const hero = createHero(canvas);
  if (!hero) return;
  hero.setStatic();
  canvas.classList.add('is-ready');
}

export async function initHeroScene(canvas: HTMLCanvasElement): Promise<void> {
  const hero = createHero(canvas);
  if (!hero) return;
  hero.setStatic();              // 静帧兜底，避免初始化闪动
  canvas.classList.add('is-ready');
  hero.start();
}
