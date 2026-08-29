/* ============================================================
 * hero-particles.ts — 首屏莫比乌斯 · 景深点染
 * three.js 点精灵 + anime.js 驱动自转：莫比乌斯环面均匀预采样为静态点云，
 * 顶点着色器按 |对焦深度 − 点深度| 把点沿各自的随机方向散开
 * （r = coc·|f−d|^e，Circle of Confusion）——对焦处粒子凝聚成形，
 * 离焦处散开解体、形状消融成雾。点本身始终是小圆点，不做光斑放大。
 * ============================================================ */
import {
  AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Group,
  PerspectiveCamera, Points, Quaternion, Scene, ShaderMaterial, Vector3, WebGLRenderer,
  Euler,
} from 'three';
import { animate, type JSAnimation } from 'animejs';

/* ---------- 参数 ---------- */
const CFG = {
  camFov: 50, camDist: 330, mCamDist: 385,
  spinSpeed: 0.02, rotXSpeed: 0, rotZSpeed: 0.02, basePitch: -0.18, // spin：绕环面法向自转；rotXSpeed/rotZSpeed：绕 X/Z 缓慢翻滚
  rotX: 0, rotY: -1.86, rotZ: -0.71, // 静态朝向偏移（调参用）：叠在俯仰与自转之外
  offsetX: 40, offsetY: 0,
  scaleX: 1.7, scaleY: 1.7, scaleZ: 1.7, // 三轴缩放（桌面值；移动端整体 ×1.35/1.7）
  thick: 0,       // 环带厚度（世界单位）：点吸附在 ±thick 两个壳面上，空心截面；0 = 回到扁带
  focus: 245,     // 对焦深度：距相机此远处的点最凝聚（前排环缘）
  coc: 0.008,     // 散开强度 m：离焦位移半径 r = coc·|focus−d|^exp
  cocExp: 1.5,    // 散开分布指数 e：>1 让近焦更锐利、远焦更快解体
  dotWorld: 0.5,  // 点半径（世界单位，恒定——模糊靠散开而非放大）
  alpha: 0.5,     // 单点透明度（常值；散开后密度自然摊薄，亚像素点另有能量补偿）
  count: 420000, mCount: 150000, // 点云规模（桌面/移动端）：铺满环面成连续点带
  color: '#00e8c8',
  colorFar: '#1291ab',  // 离焦端颜色：r 超过 colorRamp 后完全过渡到此色
  colorRamp: 8,         // 颜色映射区间（世界单位）：r 从 0 → colorRamp 完成 近色→远色
  bgColor: '#0a0c12',           // 与页面 --bg 同源
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
function buildPoints(n: number): { pos: Float32Array; dir: Float32Array } {
  const pos = new Float32Array(n * 3);
  const dir = new Float32Array(n * 3);
  const c = Math.cos(TILT), s = Math.sin(TILT);
  const o = [0, 0, 0], ou = [0, 0, 0], ov = [0, 0, 0];
  const TH = CFG.thick;
  const rc = Math.min(W, TH);            // 最大圆角半径
  const faceLen = 2 * (W - rc);          // 单个面直边长
  const wallLen = 2 * (TH - rc);         // 单个侧壁直边长（最大圆角时为 0）
  const perim = 2 * faceLen + 2 * wallLen + 2 * Math.PI * rc;
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 * Math.PI;
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
  return { pos, dir };
}

/* ---------- 着色器 ---------- */
const VERT = /* glsl */ `
uniform float uFocus, uCoc, uCocExp, uPixK, uDot, uAlpha, uRamp;
uniform vec3 uColor, uColorFar;
attribute vec3 aDir;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec4 mv0 = modelViewMatrix * vec4(position, 1.0);
  float depth0 = max(1.0, -mv0.z);
  float r = uCoc * pow(abs(uFocus - depth0), uCocExp); // 散开半径（世界单位）
  vec4 mv = modelViewMatrix * vec4(position + aDir * r, 1.0);
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
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  group.add(points);

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

  const camDist = () => (isMobile() ? CFG.mCamDist : CFG.camDist);

  let cssW = 0, cssH = 0;

  function renderOnce(angle: number) {
    applySpin(angle);
    renderer.render(scene, camera);
  }

  function applyView() {
    const k = isMobile() ? 1.35 / 1.7 : 1; // 移动端等比缩小，三轴比例不变
    camera.position.set(0, 0, camDist());
    groupPos.position.set(isMobile() ? 0 : CFG.offsetX, CFG.offsetY, 0);
    group.scale.set(CFG.scaleX * k, CFG.scaleY * k, CFG.scaleZ * k);
    if (!running) renderOnce(state.spin);
  }

  function rebuild() {
    cssW = hero!.clientWidth; cssH = hero!.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(cssW, cssH, false);
    // 桌面端锁定 3425px 虚拟宽度取景：相机按虚拟幅面投影，实际窗口
    // 用 setViewOffset 居中裁切——窗口只改变可见范围，不改焦距/比例
    const refW = isMobile() ? cssW : 3425;
    camera.aspect = refW / cssH;
    if (isMobile()) camera.clearViewOffset();
    else camera.setViewOffset(refW, cssH, (refW - cssW) / 2, 0, cssW, cssH);
    camera.updateProjectionMatrix();
    groupStretch.scale.x = isMobile() ? 3425 / 900 : camera.aspect; // 移动端也按桌面基准宽高比拉伸，不随竖屏压缩
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
  let lastDraw = 0;

  function renderTick() {
    if (!running) return;
    const now = performance.now();
    if (isMobile() && now - lastDraw < 33) return; // 移动端 30fps 节流
    lastDraw = now;
    renderOnce(state.spin);
  }

  function makeSpin() {
    spinAnim?.pause();
    const speed = Math.abs(CFG.spinSpeed);
    if (speed < 1e-4) { spinAnim = null; return; }
    spinAnim = animate(state, {
      spin: [state.spin, state.spin + Math.sign(CFG.spinSpeed) * 2 * Math.PI],
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
    const mkColor = (label: string, val: string, onInput: (v: string) => void) => {
      const row = document.createElement('label');
      row.style.cssText = 'display:flex;align-items:center;gap:8px';
      const name = document.createElement('span');
      name.textContent = label;
      name.style.cssText = 'width:44px;color:#e6eaf3';
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = val;
      picker.style.cssText = 'flex:1;height:20px;border:none;background:none;padding:0;cursor:pointer';
      const out = document.createElement('span');
      out.textContent = val;
      out.style.cssText = 'width:60px;text-align:right;color:#00e8c8';
      picker.addEventListener('input', () => {
        out.textContent = picker.value;
        onInput(picker.value);
      });
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
    mkColor('colorN', CFG.color, (v) => { material.uniforms.uColor.value.set(v); CFG.color = v; refresh(); });
    mkColor('colorF', CFG.colorFar, (v) => { material.uniforms.uColorFar.value.set(v); CFG.colorFar = v; refresh(); });
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
    document.body.appendChild(panel);
  }
  if (new URLSearchParams(location.search).has('debug')) mountDebugPanel();

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
      updateRunning();
      renderOnce(state.spin);
    },
    dispose() {
      disposed = true;
      spinAnim?.pause();
      rotXAnim?.pause();
      rotZAnim?.pause();
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
