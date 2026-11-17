// Canvas, fixed-step game loop, scenes, overlays (menus/dialogue) and the iris transition.
import { input } from './input.js';

export const W = 960, H = 540;
export const engine = {
  canvas: null, ctx: null, k: 1, scene: null, time: 0, boil: 0, speed: 1,
  shake: 0, shakeOn: true, trans: null, overlays: [], toasts: [], onRescale: [],
  paper: null, irisX: W / 2, irisY: H / 2, drawToasts: null, onTick: null,
};
const STEP = 1 / 120;

export function initEngine(canvas) {
  engine.canvas = canvas;
  engine.ctx = canvas.getContext('2d');
  resize();
  addEventListener('resize', resize);
  makePaper();
}

// The canvas is fitted (16:9) inside the area engine.viewport() returns; touch controls shrink that area.
export function resize() {
  const c = engine.canvas;
  if (!c) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const v = { x: 0, y: 0, w: innerWidth, h: innerHeight, ...(engine.viewport?.() || {}) };
  const s = Math.min(v.w / W, v.h / H);
  const cw = Math.floor(W * s), ch = Math.floor(H * s);
  c.style.position = 'absolute';
  c.style.left = Math.round(v.x + (v.w - cw) / 2) + 'px';
  c.style.top = Math.round(v.y + (v.h - ch) / 2) + 'px';
  c.style.width = cw + 'px';
  c.style.height = ch + 'px';
  c.width = Math.max(1, Math.round(W * s * dpr));
  c.height = Math.max(1, Math.round(H * s * dpr));
  const nk = c.width / W;
  if (Math.abs(nk - engine.k) > 0.001) {
    engine.k = nk;
    engine.onRescale.forEach((f) => f());
  }
}

// A soft paper-grain texture laid over every frame.
function makePaper() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 220;
  const x = cv.getContext('2d');
  const id = x.createImageData(220, 220);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 205 + Math.random() * 50;
    id.data[i] = v; id.data[i + 1] = v * 0.97; id.data[i + 2] = v * 0.9; id.data[i + 3] = 255;
  }
  x.putImageData(id, 0, 0);
  x.globalAlpha = 0.1; x.strokeStyle = '#6b5a40';
  for (let i = 0; i < 70; i++) {
    const a = Math.random() * 220, b = Math.random() * 220;
    x.beginPath(); x.moveTo(a, b); x.lineTo(a + Math.random() * 24 - 12, b + Math.random() * 24 - 12); x.stroke();
  }
  engine.paper = engine.ctx.createPattern(cv, 'repeat');
}

export function setScene(s) {
  engine.scene?.exit?.();
  engine.overlays.length = 0;
  engine.scene = s;
  s.enter?.();
}
export function transition(fn, x = W / 2, y = H / 2) {
  if (engine.trans) return;
  engine.trans = { t: 0, phase: 'out', fn };
  engine.irisX = x; engine.irisY = y;
}
export function pushOverlay(o) { engine.overlays.push(o); o.enter?.(); return o; }
export function popOverlay(o) {
  const i = o ? engine.overlays.indexOf(o) : engine.overlays.length - 1;
  if (i >= 0) { const [r] = engine.overlays.splice(i, 1); r.exit?.(); }
}
export function topOverlay() { return engine.overlays[engine.overlays.length - 1]; }
export function toast(text, icon) { engine.toasts.push({ text, icon, t: 0 }); }
export function shake(a) { engine.shake = Math.max(engine.shake, a); }

let last = 0, acc = 0;
export function start() { requestAnimationFrame(loop); }
// Debug helper: advance the game by hand (used for automated testing while the page is hidden).
export function debugStep(seconds = 1, draw = true) {
  const n = Math.round(seconds / STEP);
  for (let i = 0; i < n; i++) update(STEP);
  if (draw) render();
}
function loop(now) {
  requestAnimationFrame(loop);
  if (!last) last = now;
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  acc += dt * engine.speed;
  let n = 0;
  while (acc >= STEP && n < 20) { acc -= STEP; n++; update(STEP); }
  if (n >= 20) acc = 0;
  render();
}

function update(dt) {
  input.blocked = !!engine.trans && engine.trans.phase === 'out';
  input.update();
  engine.time += dt;
  engine.boil = Math.floor(engine.time * 6) % 3;
  const tr = engine.trans;
  if (tr) {
    tr.t += dt;
    if (tr.phase === 'out' && tr.t >= 0.4) { tr.phase = 'in'; tr.t = 0; tr.fn(); }
    else if (tr.phase === 'in' && tr.t >= 0.4) engine.trans = null;
  }
  if (engine.shake > 0) engine.shake = Math.max(0, engine.shake - dt * 40);
  for (const t of engine.toasts) t.t += dt;
  engine.toasts = engine.toasts.filter((t) => t.t < 3.2);
  engine.onTick?.(dt);
  const top = topOverlay();
  if (top) top.update(dt); else engine.scene?.update?.(dt);
  input.endUpdate();
}

function render() {
  const { ctx, k, canvas } = engine;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#241c1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.save();
  if (engine.shake > 0 && engine.shakeOn) {
    ctx.translate((Math.random() - 0.5) * engine.shake, (Math.random() - 0.5) * engine.shake);
  }
  engine.scene?.render?.(ctx);
  ctx.restore();
  for (const o of engine.overlays) o.render(ctx);
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = engine.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  engine.drawToasts?.(ctx);
  if (engine.trans) drawIris(ctx);
}

function drawIris(ctx) {
  const tr = engine.trans;
  const p = Math.min(1, tr.t / 0.4);
  const r = tr.phase === 'out' ? 1 - p : p;
  const R = r * r * 720;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.arc(engine.irisX, engine.irisY, Math.max(0.5, R), 0, Math.PI * 2, true);
  ctx.fillStyle = '#241c1a';
  ctx.fill('evenodd');
  ctx.restore();
}
