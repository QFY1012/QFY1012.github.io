import { BufferAttribute, BufferGeometry, Color, PerspectiveCamera, Points, PointsMaterial, Scene, WebGLRenderer } from 'three';
import { animate } from 'animejs';

type ShapeName = 'tree' | 'helix' | 'arrow' | 'network' | 'pavilion' | 'rings' | 'ink' | 'lanes';
const COUNT = 520;
function random(seed = 1) { let t = seed >>> 0; return () => { t += 0x6d2b79f5; let x = t; x = Math.imul(x ^ x >>> 15, x | 1); x ^= x + Math.imul(x ^ x >>> 7, x | 61); return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
function pointFor(shape: ShapeName, i: number, rand: () => number): [number, number, number] {
  const t = i / COUNT, jitter = () => (rand() - .5) * 4;
  if (shape === 'tree') { const branch = i % 13, y = -72 + t * 142, spread = Math.max(0, (y + 45) * .62); const x = branch === 0 ? jitter() : Math.sin(branch * 2.13 + t * 9) * spread * (branch / 13); return [x + jitter(), y, Math.sin(t * 18 + branch) * 12 + jitter()]; }
  if (shape === 'helix') { const a = t * Math.PI * 6; return [Math.sin(a) * (22 + t * 34) + jitter(), -70 + t * 140, Math.cos(a) * 28 + jitter()]; }
  if (shape === 'arrow') { const shaft = i < COUNT * .58; if (shaft) return [-70 + t * 220 + jitter(), jitter() * 2.2, jitter()]; const u = (i - COUNT * .58) / (COUNT * .42), side = i % 2 ? 1 : -1; return [25 + u * 58 + jitter(), side * u * 56 + jitter(), jitter()]; }
  if (shape === 'network') { const a = rand() * Math.PI * 2, r = Math.pow(rand(), .7) * 72; return [Math.cos(a) * r, Math.sin(a) * r, Math.sin(a * 3) * 22 + jitter()]; }
  if (shape === 'pavilion') { const level = i % 5, a = rand() * Math.PI * 2, r = 20 + level * 12; return [Math.cos(a) * r, -65 + level * 28 + (rand() - .5) * 4, Math.sin(a) * r]; }
  if (shape === 'rings') { const a = t * Math.PI * 12, r = 22 + (i % 4) * 13; return [Math.cos(a) * r, Math.sin(a) * r, (rand() - .5) * 34]; }
  if (shape === 'ink') { const a = rand() * Math.PI * 2, r = Math.pow(rand(), 2) * 78; return [Math.cos(a) * r, Math.sin(a) * r * .72, Math.sin(a * 4) * 8 + jitter()]; }
  const lane = (i % 5) - 2; return [-78 + t * 156, lane * 18 + Math.sin(t * 8 + lane) * 7, Math.sin(t * 5) * 14];
}
function mountParticles(card: HTMLElement) {
  const canvas = card.querySelector('canvas'); if (!(canvas instanceof HTMLCanvasElement)) return;
  const shape = (card.dataset.projectShape || 'network') as ShapeName, rand = random([...shape].reduce((n, c) => n + c.charCodeAt(0), 0));
  const positions = new Float32Array(COUNT * 3); for (let i = 0; i < COUNT; i++) positions.set(pointFor(shape, i, rand), i * 3);
  const geometry = new BufferGeometry(); geometry.setAttribute('position', new BufferAttribute(positions, 3));
  const material = new PointsMaterial({ color: new Color('#9ca3af'), size: 1.35, transparent: true, opacity: .58, sizeAttenuation: true });
  const points = new Points(geometry, material), scene = new Scene(); scene.add(points);
  const camera = new PerspectiveCamera(42, 1, 1, 1000); camera.position.z = 230;
  let renderer: WebGLRenderer; try { renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); let active = false, raf = 0, last = performance.now();
  const resize = () => { const { width, height } = canvas.getBoundingClientRect(); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); };
  const frame = (now: number) => { if (!active) return; const dt = Math.min(40, now - last); last = now; points.rotation.y += dt * .00012; points.rotation.z = Math.sin(now * .00018) * .035; renderer.render(scene, camera); raf = requestAnimationFrame(frame); };
  const observer = new IntersectionObserver(([entry]) => { active = entry.isIntersecting; if (active) { resize(); last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf); }, { rootMargin: '120px' });
  observer.observe(card); new ResizeObserver(resize).observe(card);
}
export function initFeaturedProjects(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>('[data-featured-track]'), page = root.querySelector<HTMLElement>('[data-featured-page]'), next = root.querySelector<HTMLButtonElement>('[data-featured-next]'), back = root.querySelector<HTMLButtonElement>('[data-featured-back]');
  if (!track || !next || !back) return; root.querySelectorAll<HTMLElement>('[data-project-shape]').forEach(mountParticles);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const go = (index: 0 | 1) => { if (page) page.textContent = index ? '02' : '01'; if (reduced) track.style.transform = `translateX(-${index * 50}%)`; else animate(track, { translateX: `${index * -50}%`, duration: 900, ease: 'inOutExpo' }); if (index) back.focus({ preventScroll: true }); };
  next.addEventListener('click', () => go(1)); back.addEventListener('click', () => go(0));
}
