// The finale's clockwork: gear pickups, the Season Clock itself, and the little clock dial in the HUD.
import { T } from '../art/tiles.js';
import { overlap } from '../core/util.js';
import { engine } from '../core/engine.js';
import { shape, line, ellipse, rrect, rngFor, dot, text } from '../art/ink.js';
import { shade } from '../core/util.js';
import { SEASON_COLOR } from '../art/palettes.js';
import { drawSeasonIcon } from '../art/critters.js';

// The clock's year: one bar per season, in this order.
export const CLOCK_ORDER = ['spring', 'summer', 'autumn', 'winter'];

export function drawGearIcon(ctx, x, y, r, rot, o = {}) {
  const rng = rngFor(o.seed || 71, o.boil || 0), n = 8, pts = [];
  for (let k = 0; k < n * 2; k++) {
    const a = rot + (k / (n * 2)) * Math.PI * 2, rr = k % 2 ? r * 0.74 : r;
    pts.push([x + Math.cos(a - 0.12) * rr, y + Math.sin(a - 0.12) * rr], [x + Math.cos(a + 0.12) * rr, y + Math.sin(a + 0.12) * rr]);
  }
  const fill = o.ghost ? '#d9cfbf' : o.fill || '#e2b34a';
  if (o.glow) { ctx.save(); ctx.globalAlpha = 0.3; dot(ctx, x, y, r * 1.8, '#ffe08a'); ctx.restore(); }
  shape(ctx, pts, { fill, rng, lw: Math.max(1.6, r * 0.09), wob: 0.4, step: 400 });
  shape(ctx, ellipse(x, y, r * 0.32, r * 0.32, 12), { fill: shade(fill, -0.35), rng, lw: 1.6, wash: false });
}

export class Gear {
  constructor(tx, row) { this.x = tx * T + 4; this.y = row * T + 4; this.w = 40; this.h = 40; this.t = 0; this.dead = false; }
  update(dt, L) { this.t += dt; if (overlap(this, L.player) && !L.player.dead) { this.dead = true; L.gotGear(this.x + 20, this.y + 20); } }
  light() { return { x: this.x + 20, y: this.y + 20, r: 110 }; }
  draw(ctx, L) {
    drawGearIcon(ctx, this.x + 20 - L.camX, this.y + 20 - L.camY + Math.sin(this.t * 2.4) * 4, 20, this.t * 1.5, { glow: true, boil: engine.boil });
  }
}

// The Season Clock at the very top of the Hollow Oak. Touch it with all four gears to wind it.
export class SeasonClock {
  constructor(tx, row) {
    this.cx = tx * T + T / 2; this.base = (row + 1) * T;
    this.x = this.cx - 50; this.w = 100; this.y = this.base - 190; this.h = 190;
    this.t = 0; this.spin = 0; this.wound = false; this.warned = false;
  }
  update(dt, L) {
    this.t += dt;
    this.spin += dt * (this.wound ? 6 : 0.1 + L.gears * 0.2);
    if (!this.wound && overlap(this, L.player) && !L.player.dead) {
      if (L.gears >= (L.data.beat?.gears || 4)) { this.wound = true; L.windClock(this); }
      else if (!this.warned) { this.warned = true; L.needGears(); }
    } else if (!overlap(this, L.player)) this.warned = false;
  }
  light() { return { x: this.cx, y: this.base - 120, r: 220 }; }
  draw(ctx, L) { drawSeasonClock(ctx, this.cx - L.camX, this.base - L.camY, { spin: this.spin, gears: L.gears, t: this.t, boil: engine.boil, wound: this.wound }); }
}

export function drawSeasonClock(ctx, x, y, o = {}) {
  const rng = rngFor(73, o.boil || 0), t = o.t || 0;
  // pedestal
  shape(ctx, [[x - 46, y], [x - 36, y - 40], [x + 36, y - 40], [x + 46, y]], { fill: '#8e6438', rng, lw: 2.6, step: 14 });
  shape(ctx, rrect(x - 40, y - 52, 80, 14, 5), { fill: '#c9975c', rng, lw: 2.4 });
  // face
  const cy = y - 120, R = 64;
  if (o.wound) { ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(t * 6) * 0.1; dot(ctx, x, cy, R * 1.9, '#fff0b0'); ctx.restore(); }
  shape(ctx, ellipse(x, cy, R + 10, R + 10, 24), { fill: '#d9a75a', rng, lw: 3 });
  // four season quarters, each lit once its gear is in
  CLOCK_ORDER.forEach((s, i) => {
    const a0 = -Math.PI / 2 + (i * Math.PI) / 2, a1 = a0 + Math.PI / 2;
    ctx.save();
    ctx.fillStyle = i < (o.gears ?? 4) ? shade(SEASON_COLOR[s], 0.25) : '#e8e0d0';
    ctx.beginPath(); ctx.moveTo(x, cy); ctx.arc(x, cy, R, a0, a1); ctx.closePath(); ctx.fill();
    ctx.restore();
    const am = (a0 + a1) / 2;
    drawSeasonIcon(ctx, x + Math.cos(am) * R * 0.6, cy + Math.sin(am) * R * 0.6, s, 11, i < (o.gears ?? 4) ? shade(SEASON_COLOR[s], -0.45) : '#b8ad9c');
  });
  shape(ctx, ellipse(x, cy, R, R, 24), { stroke: '#3b2a26', lw: 2.6, rng, wash: false });
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    line(ctx, [[x + Math.cos(a) * (R - 8), cy + Math.sin(a) * (R - 8)], [x + Math.cos(a) * R, cy + Math.sin(a) * R]], { rng, lw: 2 });
  }
  const sp = o.spin || 0;
  line(ctx, [[x, cy], [x + Math.cos(sp - Math.PI / 2) * R * 0.8, cy + Math.sin(sp - Math.PI / 2) * R * 0.8]], { rng, lw: 4, stroke: '#3b2a26' });
  line(ctx, [[x, cy], [x + Math.cos(sp / 12 - Math.PI / 2) * R * 0.5, cy + Math.sin(sp / 12 - Math.PI / 2) * R * 0.5]], { rng, lw: 5, stroke: '#3b2a26' });
  dot(ctx, x, cy, 6, '#e2b34a');
  // keyhole on top
  shape(ctx, ellipse(x, cy - R - 20, 12, 12, 12), { fill: '#e2b34a', rng, lw: 2.2 });
  dot(ctx, x, cy - R - 21, 3.5, '#3b2a26');
}

// HUD dial: the four seasons of the clock's year, the hand, and tick/tock pips for the beats of this bar.
export function drawClockDial(ctx, x, y, beat, gears, maxGears, boil) {
  const rng = rngFor(75, boil);
  const yr = ((beat % 16) + 16) % 16, ph = ((beat % 4) + 4) % 4;
  shape(ctx, rrect(x - 120, y - 40, 240, 80, 16), { fill: '#fff6e4', rng, lw: 2.6, wash: false });
  const cx = x - 76, R = 30;
  CLOCK_ORDER.forEach((s, i) => {
    const a0 = -Math.PI / 2 + (i * Math.PI) / 2;
    ctx.save(); ctx.fillStyle = SEASON_COLOR[s]; ctx.globalAlpha = Math.floor(yr / 4) === i ? 1 : 0.4;
    ctx.beginPath(); ctx.moveTo(cx, y); ctx.arc(cx, y, R, a0, a0 + Math.PI / 2); ctx.closePath(); ctx.fill(); ctx.restore();
  });
  shape(ctx, ellipse(cx, y, R, R, 18), { stroke: '#3b2a26', lw: 2.2, rng, wash: false });
  const a = -Math.PI / 2 + (yr / 16) * Math.PI * 2;
  line(ctx, [[cx, y], [cx + Math.cos(a) * R * 0.9, y + Math.sin(a) * R * 0.9]], { rng, lw: 3 });
  dot(ctx, cx, y, 3.5, '#3b2a26');
  // beat pips: 1-2 tick (gold), 3-4 tock (teal)
  for (let k = 0; k < 4; k++) {
    const px = x - 26 + k * 24, on = Math.floor(ph) === k;
    const col = k < 2 ? '#e9b949' : '#6fb9b1';
    shape(ctx, ellipse(px, y - 10, on ? 10 : 7, on ? 10 : 7, 12), { fill: on ? col : shade(col, 0.45), rng, lw: on ? 2.4 : 1.6, wash: false });
  }
  text(ctx, 'tick  tock', x + 10, y + 26, { size: 15, align: 'center', color: '#7a6656', ui: true });
  for (let k = 0; k < maxGears; k++) drawGearIcon(ctx, x + 70 + (k % 2) * 26, y - 12 + Math.floor(k / 2) * 26, 10, 0, { ghost: k >= gears, boil, seed: 80 + k });
}
