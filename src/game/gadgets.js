// Skill gadgets: swinging vines, moving platforms, and Pip the racing caterpillar.
import { T } from '../art/tiles.js';
import { input } from '../core/input.js';
import { engine } from '../core/engine.js';
import { sfx } from '../audio/sfx.js';
import { shape, line, ellipse, rrect, rngFor, dot, text } from '../art/ink.js';
import { shade } from '../core/util.js';

const G = 2400;

// ---------------- swinging vines ----------------
// Jump into the vine to grab it. Hold left/right to pump, up/down to climb the vine, and jump to let go
// with all the swing's speed.
export class Swing {
  constructor(ax, ay, len) {
    this.ax = ax; this.ay = ay; this.L = len; this.r = len;
    this.th = 0.5; this.om = 0; this.t = Math.random() * 3; this.rider = null;
  }
  get tipX() { return this.ax + Math.sin(this.th) * this.L; }
  get tipY() { return this.ay + Math.cos(this.th) * this.L; }
  update(dt, L) {
    this.t += dt;
    const p = L.player;
    if (this.rider && p.swing !== this) this.rider = null;
    if (this.rider) return;
    // a lazy idle sway, nudged at the bottom so it never quite stops
    const prev = this.th;
    this.om += (-(G / this.L) * Math.sin(this.th)) * dt;
    this.om *= 1 - 0.25 * dt;
    this.th += this.om * dt;
    if (Math.sign(prev) !== Math.sign(this.th) && Math.abs(this.om) < Math.sqrt(G / this.L) * 0.45) this.om = Math.sign(this.om || 1) * Math.sqrt(G / this.L) * 0.5;
    // grab: Fennel in mid-air, touching the lower part of the vine
    if (p.dead || p.onGround || p.swing || p.climb || (p.grabCool > 0 && p.lastSwing === this) || L.state !== 'play') return;
    const dx = this.tipX - this.ax, dy = this.tipY - this.ay, len2 = dx * dx + dy * dy;
    const s = Math.max(0, Math.min(1, ((p.cx - this.ax) * dx + (p.cy - this.ay) * dy) / len2));
    if (s < 0.25) return;
    const qx = this.ax + dx * s, qy = this.ay + dy * s;
    if (Math.hypot(p.cx - qx, p.cy - qy) > 36) return;
    this.grab(p, L);
  }
  grab(p, L) {
    if (p.carry) L.dropCarry();
    const r = Math.max(this.L * 0.4, Math.min(this.L, Math.hypot(p.cx - this.ax, p.cy - this.ay)));
    this.r = r;
    this.th = Math.atan2(p.cx - this.ax, p.cy - this.ay);
    this.om = Math.max(-3.2, Math.min(3.2, (p.vx * Math.cos(this.th) - p.vy * Math.sin(this.th)) / r));
    p.swing = this; this.rider = p; p.gliding = false;
    sfx('pickup');
  }
  ride(p, dt, L) {
    const dir = (input.down('right') ? 1 : 0) - (input.down('left') ? 1 : 0);
    const climb = (input.down('down') ? 1 : 0) - (input.down('up') ? 1 : 0);
    const oldTh = this.th, oldR = this.r;
    this.r = Math.max(this.L * 0.4, Math.min(this.L, this.r + climb * 150 * dt));
    this.om += (-(G / this.r) * Math.sin(this.th) + (dir * 900) / this.r) * dt;
    this.om *= 1 - 0.12 * dt;
    this.th += this.om * dt;
    if (Math.abs(this.th) > 1.35) { this.th = Math.sign(this.th) * 1.35; this.om = 0; }
    const place = () => { p.x = this.ax + Math.sin(this.th) * this.r - p.w / 2; p.y = this.ay + Math.cos(this.th) * this.r - 12; };
    place();
    // don't swing through walls
    if (L.solidPx(p.x + 2, p.y + 2) || L.solidPx(p.x + p.w - 2, p.y + 2) || L.solidPx(p.x + 2, p.y + p.h - 2) || L.solidPx(p.x + p.w - 2, p.y + p.h - 2)) {
      this.th = oldTh; this.r = oldR; this.om = -this.om * 0.3; place();
    }
    p.vx = this.r * this.om * Math.cos(this.th); p.vy = -this.r * this.om * Math.sin(this.th);
    p.onGround = false; p.coyote = 0;
    if (dir) p.facing = dir; else if (Math.abs(this.om) > 0.3) p.facing = Math.sign(this.om);
    if (Math.abs(this.om) > 0.4) p.phase += dt * 6;
    if (input.pressed('jump')) this.release(p, true);
  }
  release(p, jumped) {
    p.swing = null; this.rider = null; p.grabCool = 0.3; p.lastSwing = this;
    if (!jumped) return;
    p.vx = Math.max(-640, Math.min(640, p.vx * 1.1));
    p.vy = Math.min(p.vy, 0) - 330;
    p.bounceHold = 0.25; p.squash = -0.2; p.fling = 0.8;
    sfx('jump');
  }
  draw(ctx, L) {
    const rng = rngFor(91, engine.boil);
    const ax = this.ax - L.camX, ay = this.ay - L.camY;
    const r = this.rider ? this.r : this.L;
    const ex = ax + Math.sin(this.th) * r, ey = ay + Math.cos(this.th) * r - (this.rider ? 10 : 0);
    // the vine comes down from the canopy far above, then swings from a knot
    line(ctx, [[ax + 4, ay - 520], [ax - 3, ay - 260], [ax, ay]], { rng, stroke: '#4f8a3a', lw: 4, wob: 1, step: 40 });
    shape(ctx, ellipse(ax, ay - 2, 9, 7, 10), { fill: '#5f9a44', rng, lw: 2 });
    const mx = (ax + ex) / 2 + Math.cos(this.th) * 6, my = (ay + ey) / 2 - Math.sin(this.th) * 6;
    line(ctx, [[ax, ay], [mx, my], [ex, ey]], { rng, stroke: '#4f8a3a', lw: 5, wob: 0.8, step: 14 });
    line(ctx, [[ax, ay], [mx, my], [ex, ey]], { rng, stroke: '#7cbf5a', lw: 2, wob: 0.6, step: 14 });
    for (let k = 1; k < 4; k++) {
      const f = k / 4, lx = ax + (ex - ax) * f, ly = ay + (ey - ay) * f;
      shape(ctx, ellipse(lx + (k % 2 ? 7 : -7), ly, 7, 4, 8, k % 2 ? 0.6 : -0.6), { fill: '#7cbf5a', rng, lw: 1.4 });
    }
    if (!this.rider) shape(ctx, ellipse(ex, ey + 4, 8, 10, 10), { fill: '#6faa4e', rng, lw: 1.8 });
  }
}

// ---------------- moving platforms ----------------
// kind 'line': glides back and forth between (x, y) and (x + dx, y + dy). kind 'circle': rides round a wheel.
export class Mover {
  constructor(o) {
    Object.assign(this, { dx: 0, dy: 0, period: 4, phase: 0, kind: 'line', r: 0, look: 'plank', dwell: 0 }, o);
    this.bx = o.x; this.by = o.y; this.h = 16; this.t = 0;
    [this.x, this.y] = this.pos(0); this.vx = 0; this.vy = 0; this.mx = 0; this.my = 0;
  }
  pos(t) {
    const a = (t / this.period) * Math.PI * 2 + this.phase;
    if (this.kind === 'circle') return [this.bx + Math.cos(a) * this.r - this.w / 2, this.by + Math.sin(a) * this.r];
    let k = 0.5 - 0.5 * Math.cos(a);
    // dwell: wait a moment at each end (lifts pause so you can step on and off)
    if (this.dwell) k = Math.max(0, Math.min(1, (k - 0.5) / (1 - this.dwell) + 0.5));
    return [this.bx + this.dx * k, this.by + this.dy * k];
  }
  update(dt) {
    this.t += dt;
    const [nx, ny] = this.pos(this.t);
    this.mx = nx - this.x; this.my = ny - this.y;
    this.x = nx; this.y = ny;
  }
  draw(ctx, L) {
    const rng = rngFor(93, engine.boil);
    // the route, faintly dotted, so you can see where it goes
    ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#5a4636'; ctx.lineWidth = 2; ctx.setLineDash([3, 9]);
    ctx.beginPath();
    if (this.kind === 'circle') ctx.arc(this.bx - L.camX, this.by - L.camY + 8, this.r, 0, Math.PI * 2);
    else { ctx.moveTo(this.bx + this.w / 2 - L.camX, this.by + 8 - L.camY); ctx.lineTo(this.bx + this.dx + this.w / 2 - L.camX, this.by + this.dy + 8 - L.camY); }
    ctx.stroke(); ctx.restore();
    const x = this.x - L.camX, y = this.y - L.camY;
    if (this.look === 'pot') {
      shape(ctx, [[x + 2, y], [x + this.w - 2, y], [x + this.w - 10, y + 26], [x + 10, y + 26]], { fill: '#c27b52', rng, lw: 2.4, step: 12 });
      shape(ctx, rrect(x, y - 2, this.w, 10, 4), { fill: '#d98d62', rng, lw: 2.2 });
      for (let k = 12; k < this.w - 8; k += 22) shape(ctx, ellipse(x + k, y - 4, 6, 4, 8), { fill: '#7cc06a', rng, lw: 1.4 });
    } else if (this.look === 'leaf') {
      shape(ctx, ellipse(x + this.w / 2, y + 6, this.w / 2 + 4, 10, 16), { fill: '#e0783a', rng, lw: 2.4 });
      line(ctx, [[x + 6, y + 6], [x + this.w - 6, y + 6]], { rng, stroke: '#a8452f', lw: 1.6 });
    } else {
      shape(ctx, rrect(x, y, this.w, this.h, 4), { fill: '#c9975c', rng, lw: 2.4, wob: 0.6 });
      line(ctx, [[x + 6, y + 8], [x + this.w - 6, y + 7.5]], { rng, stroke: '#8e6438', lw: 1.2 });
      dot(ctx, x + 7, y + 8, 2, '#3b2a26'); dot(ctx, x + this.w - 7, y + 8, 2, '#3b2a26');
      shape(ctx, ellipse(x + this.w / 2, y + this.h + 6, 7, 7, 10), { fill: '#e2b34a', rng, lw: 1.8 });
    }
  }
}

// ---------------- Pip, the racing caterpillar ----------------
// Pip crawls along the top of the ground, climbs straight up walls, and leaps over gaps. Beat Pip to the bell!
const SURFACE = new Set(['#', 'r', '=', '?', 'L', 'u', '~', 'R', 'w', 'i', 'p', '%', 'j', 'b']);
export class Racer {
  constructor(L, startX, speed) {
    this.speed = speed; this.t = 0; this.wait = 2.6; this.done = false;
    this.build(L);
    this.d = 0;
    for (let i = 0; i < this.pts.length; i++) if (this.pts[i][0] >= startX - 40) { this.d = this.cum[i]; break; }
    this.finishX = L.bell ? L.bell.px - 10 : L.w * T;
    this.place();
  }
  build(L) {
    const surf = [];
    for (let tx = 0; tx < L.w; tx++) {
      surf[tx] = null;
      for (let ty = 0; ty < L.h; ty++) if (SURFACE.has(L.tiles[ty][tx])) { surf[tx] = ty * T; break; }
    }
    const pts = [], kinds = [];
    let lastX = null, lastY = null;
    for (let tx = 0; tx < L.w; tx++) {
      const y = surf[tx];
      if (y == null) continue;
      if (lastX != null && tx * T - lastX > 2) {
        // a gap: leap over it in an arc
        const x0 = lastX, y0 = lastY, x1 = tx * T, y1 = y, top = Math.min(y0, y1) - T * 1.5;
        for (let k = 1; k <= 10; k++) {
          const u = k / 10, a = (1 - u) * (1 - u), bq = 2 * u * (1 - u), c = u * u;
          pts.push([a * x0 + bq * (x0 + x1) / 2 + c * x1, a * y0 + bq * top + c * y1]); kinds.push('arc');
        }
      } else if (lastY != null && y !== lastY) { pts.push([tx * T, y]); kinds.push('climb'); }
      else if (!pts.length) { pts.push([tx * T, y]); kinds.push('walk'); }
      pts.push([tx * T + T, y]); kinds.push('walk');
      lastX = tx * T + T; lastY = y;
    }
    this.pts = pts; this.kinds = kinds; this.cum = [0];
    for (let i = 1; i < pts.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    this.seg = 0;
  }
  at(d) {
    let i = 1;
    while (i < this.cum.length - 1 && this.cum[i] < d) i++;
    const a = this.pts[i - 1], b = this.pts[i], span = this.cum[i] - this.cum[i - 1] || 1;
    const u = Math.max(0, Math.min(1, (d - this.cum[i - 1]) / span));
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, this.kinds[i]];
  }
  place() { [this.x, this.y, this.kind] = this.at(this.d); }
  update(dt, L) {
    this.t += dt;
    if (this.done) return;
    if (this.wait > 0) { this.wait -= dt; return; }
    const mult = this.kind === 'climb' ? 0.55 : this.kind === 'arc' ? 1.5 : 1;
    this.d = Math.min(this.cum[this.cum.length - 1], this.d + this.speed * mult * dt);
    this.place();
    if (this.x >= this.finishX) { this.done = true; L.raceLost(); }
  }
  draw(ctx, L) {
    const rng = rngFor(95, engine.boil);
    // body segments trail behind along the path
    for (let k = 5; k >= 0; k--) {
      const [sx, sy] = this.at(Math.max(0, this.d - k * 11));
      const bob = Math.sin(this.t * 14 - k * 0.9) * (this.wait > 0 ? 0.5 : 3);
      const cx = sx - L.camX, cy = sy - L.camY - 11 + bob;
      shape(ctx, ellipse(cx, cy, k === 0 ? 12 : 10, k === 0 ? 12 : 10, 12), { fill: k === 0 ? '#9fd66a' : k % 2 ? '#7cbf5a' : '#8fcc62', rng, lw: 2 });
      if (k > 0) { dot(ctx, cx - 3, cy + 9, 2.2, '#4f8a3a'); dot(ctx, cx + 3, cy + 9, 2.2, '#4f8a3a'); }
      if (k === 0) {
        dot(ctx, cx + 5, cy - 3, 2.6, '#3b2a26');
        line(ctx, [[cx + 2, cy - 10], [cx + 6, cy - 22]], { rng, lw: 1.8 }); dot(ctx, cx + 6, cy - 23, 2.6, '#e2574c');
        line(ctx, [[cx - 4, cy - 10], [cx - 4, cy - 21]], { rng, lw: 1.8 }); dot(ctx, cx - 4, cy - 22, 2.6, '#e2574c');
      }
      if (k === 2) { shape(ctx, rrect(cx - 7, cy - 6, 14, 11, 3), { fill: '#fffaf0', rng, lw: 1.4, wash: false }); text(ctx, '1', cx, cy + 4, { size: 11, align: 'center' }); }
    }
  }
}

// Little race bar for the HUD: start on the left, bell on the right.
export function drawRaceBar(ctx, x, y, w, foxF, pipF, boil) {
  const rng = rngFor(97, boil);
  shape(ctx, rrect(x - 14, y - 22, w + 28, 44, 14), { fill: '#fff6e4', rng, lw: 2.4, wash: false });
  line(ctx, [[x, y], [x + w, y]], { rng, lw: 3, stroke: '#c9b79c' });
  shape(ctx, [[x + w - 2, y - 14], [x + w + 8, y - 10], [x + w - 2, y - 6]], { fill: '#e2574c', rng, lw: 1.4, step: 6 });
  line(ctx, [[x + w - 2, y - 15], [x + w - 2, y + 6]], { rng, lw: 2 });
  const px = x + w * Math.max(0, Math.min(1, pipF)), fx = x + w * Math.max(0, Math.min(1, foxF));
  shape(ctx, ellipse(px, y, 8, 8, 10), { fill: '#8fcc62', rng, lw: 2 }); dot(ctx, px + 3, y - 2, 1.6, '#3b2a26');
  shape(ctx, ellipse(fx, y, 8, 8, 10), { fill: '#e27a3f', rng, lw: 2 }); dot(ctx, fx + 3, y - 2, 1.6, '#3b2a26');
}

export function drawPip(ctx, x, y, o = {}) {
  const rng = rngFor(99, o.boil || 0), t = o.t || 0;
  for (let k = 4; k >= 0; k--) {
    const cx = x - k * 16 * (o.facing || 1), cy = y - 14 + Math.sin(t * 5 - k) * 2;
    shape(ctx, ellipse(cx, cy, k === 0 ? 16 : 13, k === 0 ? 16 : 13, 12), { fill: k === 0 ? '#9fd66a' : k % 2 ? '#7cbf5a' : '#8fcc62', rng, lw: 2.2 });
    if (k === 0) {
      dot(ctx, cx + 6 * (o.facing || 1), cy - 4, 3.2, '#3b2a26');
      line(ctx, [[cx + 2, cy - 14], [cx + 8, cy - 30]], { rng, lw: 2 }); dot(ctx, cx + 8, cy - 31, 3.4, '#e2574c');
      line(ctx, [[cx - 6, cy - 14], [cx - 6, cy - 29]], { rng, lw: 2 }); dot(ctx, cx - 6, cy - 30, 3.4, '#e2574c');
    }
  }
}
