// Hand-drawn drawing kit: wobbly ink outlines, watercolour fills, lettering and paper panels.
import { mulberry32, shade } from '../core/util.js';
import { state } from '../core/state.js';

export const INK = '#3b2a26';
export const PAPER = '#fbf3e2';
export const FONT = '"Patrick Hand", "Comic Sans MS", "Segoe Print", cursive';

// A seeded random source that changes a few times a second ("boiling" lines).
export function rngFor(seed, boil = 0) {
  return mulberry32(((seed | 0) * 7919 + boil * 104729 + 17) | 0);
}

export function subdivide(pts, step, closed) {
  const out = [];
  const n = pts.length;
  const lim = closed ? n : n - 1;
  for (let i = 0; i < lim; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const k = Math.max(1, Math.round(Math.hypot(dx, dy) / step));
    for (let j = 0; j < k; j++) out.push([a[0] + (dx * j) / k, a[1] + (dy * j) / k]);
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
export function jitter(pts, rng, amt) {
  return pts.map((p) => [p[0] + (rng() - 0.5) * 2 * amt, p[1] + (rng() - 0.5) * 2 * amt]);
}
export function smooth(ctx, pts, closed) {
  const n = pts.length;
  if (n < 2) return;
  if (closed) {
    ctx.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
  }
}

export function ellipse(cx, cy, rx, ry, n = 16, rot = 0) {
  const p = [];
  const c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    p.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return p;
}
export function rect(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
export function rrect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  const p = [];
  const cs = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  for (const [cx, cy, a0] of cs) {
    for (let i = 0; i <= 3; i++) {
      const a = a0 + (i / 3) * (Math.PI / 2);
      p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  }
  return p;
}

function washInside(ctx, p, fill, rng) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const q of p) {
    if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0];
    if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
  }
  const w = x1 - x0, h = y1 - y0;
  if (w < 7 || h < 7) return;
  ctx.save();
  ctx.beginPath(); smooth(ctx, p, true); ctx.clip();
  ctx.globalAlpha = 0.17;
  ctx.fillStyle = shade(fill, -0.28);
  ctx.beginPath();
  ctx.ellipse(x0 + w * (0.55 + rng() * 0.3), y0 + h * (0.7 + rng() * 0.25), w * 0.6, h * 0.42, rng() * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = shade(fill, 0.4);
  ctx.beginPath();
  ctx.ellipse(x0 + w * (0.28 + rng() * 0.12), y0 + h * (0.26 + rng() * 0.1), w * 0.28, h * 0.2, rng(), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Draw a closed (or open) shape with a wobbly ink line and an optional watercolour fill.
export function shape(ctx, pts, o = {}) {
  const rng = o.rng || Math.random;
  const closed = o.closed !== false;
  const wob = o.wob ?? 1.2;
  const p = jitter(subdivide(pts, o.step || 12, closed), rng, wob);
  if (o.fill && closed) {
    ctx.beginPath(); smooth(ctx, p, true);
    ctx.fillStyle = o.fill; ctx.fill();
    if (o.wash !== false && o.fill[0] === '#') washInside(ctx, p, o.fill, rng);
  }
  if (o.stroke !== null) {
    ctx.beginPath(); smooth(ctx, jitter(p, rng, wob * 0.45), closed);
    ctx.strokeStyle = o.stroke || INK;
    ctx.lineWidth = o.lw || 2.5;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.stroke();
  }
}
export function line(ctx, pts, o = {}) { shape(ctx, pts, { ...o, closed: false, fill: null }); }
export function dot(ctx, x, y, r, c) {
  ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

export function setFont(ctx, size, ui) {
  const s = size * (ui ? state.settings.textSize : 1);
  ctx.font = `${s}px ${FONT}`;
  return s;
}
export function text(ctx, str, x, y, o = {}) {
  setFont(ctx, o.size || 24, o.ui);
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.baseline || 'alphabetic';
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  if (o.outline) {
    ctx.lineWidth = o.outlineW || 5; ctx.strokeStyle = o.outline; ctx.lineJoin = 'round';
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = o.color || INK;
  ctx.fillText(str, x, y);
  ctx.globalAlpha = 1;
}
export function wrap(ctx, str, maxW, size, ui) {
  setFont(ctx, size, ui);
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}

export function panel(ctx, x, y, w, h, o = {}) {
  const rng = rngFor(o.seed ?? ((x * 3 + y * 7) | 0), o.boil ?? 0);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#000';
  ctx.beginPath(); smooth(ctx, rrect(x + 5, y + 7, w, h, o.r || 14), true); ctx.fill();
  ctx.restore();
  shape(ctx, rrect(x, y, w, h, o.r || 14), { fill: o.fill || PAPER, rng, lw: o.lw || 3, wob: o.wob ?? 1.1, wash: false, step: 20 });
}

// A little hand-drawn key cap, e.g. [E].
export function keycap(ctx, label, x, y, size = 18) {
  setFont(ctx, size);
  const w = Math.max(size * 1.3, ctx.measureText(label).width + 12);
  shape(ctx, rrect(x, y - size, w, size * 1.35, 5), { fill: '#fffaf0', rng: rngFor(label.length * 13 + x, 0), lw: 2, wob: 0.6, wash: false });
  text(ctx, label, x + w / 2, y + size * 0.12, { size, align: 'center' });
  return w;
}
