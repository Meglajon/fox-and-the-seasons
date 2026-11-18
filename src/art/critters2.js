// Millpond Reach + Copperleaf Orchard: critters, friends, bosses and objects.
import { shape, line, ellipse, rrect, rngFor, dot, INK } from './ink.js';
import { shade } from '../core/util.js';
import { drawAcorn } from './critters.js';

const R = (seed, boil) => rngFor(seed, boil);

export function drawBeetle(ctx, x, y, o) {
  const rng = R(o.seed || 31, o.boil);
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  if (o.asleep && !o.frozen) {
    shape(ctx, ellipse(0, -12, 16, 12, 16), { fill: '#6c8fc4', rng, lw: 2.4 });
    line(ctx, [[-10, -14], [10, -14]], { rng, lw: 1.6, stroke: '#3f5f8f' });
  } else {
    const t = o.t || 0;
    for (const lx of [-9, 0, 9]) line(ctx, [[lx, -6], [lx + Math.sin(t * 20 + lx) * 3, 0]], { rng, lw: 2 });
    shape(ctx, ellipse(-2, -13, 16, 11, 16), { fill: '#6c8fc4', rng, lw: 2.4 });
    line(ctx, [[-2, -24], [-2, -3]], { rng, lw: 1.6, stroke: '#3f5f8f' });
    dot(ctx, -8, -17, 2.6, '#e8f3ff');
    shape(ctx, ellipse(14, -10, 7, 6, 10), { fill: '#3f5f8f', rng, lw: 2 });
    dot(ctx, 16, -12, 2, '#fffaf0');
    line(ctx, [[18, -14], [24, -20]], { rng, lw: 1.4 });
    line(ctx, [[16, -15], [19, -23]], { rng, lw: 1.4 });
  }
  ctx.restore();
}

export function drawFrog(ctx, x, y, o) {
  const rng = R(o.seed || 32, o.boil);
  const puff = o.puff || 0;
  const body = '#7bb08a';
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  if (o.asleep && !o.frozen) {
    shape(ctx, ellipse(0, -11, 17, 11, 16), { fill: body, rng, lw: 2.4 });
    line(ctx, [[2, -16], [9, -15]], { rng, lw: 1.8 });
    line(ctx, [[-8, -16], [-2, -15]], { rng, lw: 1.8 });
  } else {
    shape(ctx, ellipse(-10, -5, 8, 5, 10), { fill: shade(body, -0.15), rng, lw: 2 });
    shape(ctx, ellipse(0, -13 - puff * 4, 16 + puff * 6, 12 + puff * 6, 16), { fill: body, rng, lw: 2.4 });
    shape(ctx, ellipse(4, -8, 10 + puff * 4, 6 + puff * 3, 12), { fill: '#e9f1d8', stroke: null, rng, wash: false });
    for (const ex of [-4, 8]) {
      shape(ctx, ellipse(ex, -26 - puff * 6, 5, 5, 10), { fill: body, rng, lw: 2 });
      dot(ctx, ex + 1, -26 - puff * 6, 2.2, INK);
    }
    line(ctx, [[2, -14], [12, -14]], { rng, lw: 1.6 });
  }
  ctx.restore();
}

export function drawSquirrel(ctx, x, y, o) {
  const rng = R(o.seed || 33, o.boil);
  const fur = '#b86a3a';
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  if (o.asleep && !o.frozen) {
    shape(ctx, ellipse(0, -12, 16, 12, 16), { fill: fur, rng, lw: 2.4 });
    shape(ctx, ellipse(-12, -18, 10, 14, 12, -0.4), { fill: shade(fur, 0.2), rng, lw: 2 });
    line(ctx, [[2, -16], [8, -15]], { rng, lw: 1.6 });
  } else {
    const t = o.t || 0;
    shape(ctx, ellipse(-14, -24 + Math.sin(t * 3) * 2, 11, 18, 14, -0.3), { fill: shade(fur, 0.2), rng, lw: 2.2 });
    shape(ctx, ellipse(0, -14, 11, 13, 14), { fill: fur, rng, lw: 2.4 });
    shape(ctx, ellipse(6, -28, 9, 8, 12), { fill: fur, rng, lw: 2.2 });
    shape(ctx, [[2, -34], [4, -42], [8, -34]], { fill: fur, rng, lw: 1.6, step: 4 });
    dot(ctx, 9, -29, 2, INK);
    dot(ctx, 14, -27, 1.6, INK);
    if (o.holding) drawAcorn(ctx, 10, -12, 0.8, o.boil);
  }
  ctx.restore();
}

export function drawMoth(ctx, x, y, o) {
  const rng = R(o.seed || 34, o.boil);
  const t = o.t || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  if (!o.asleep || o.frozen) {
    const f = 0.5 + Math.abs(Math.sin(t * 14)) * 0.5;
    shape(ctx, ellipse(-8, -22, 14 * f, 11, 12, -0.4), { fill: '#e8b06a', rng, lw: 2 });
    shape(ctx, ellipse(6, -22, 13 * f, 10, 12, 0.4), { fill: '#d9934e', rng, lw: 2 });
    dot(ctx, -9, -23, 3, '#7a4a3c');
    dot(ctx, 6, -23, 3, '#7a4a3c');
  }
  shape(ctx, ellipse(0, -13, 6, 11, 10), { fill: '#8e6a52', rng, lw: 2 });
  dot(ctx, 3, -20, 1.6, '#fffaf0');
  line(ctx, [[2, -23], [6, -30]], { rng, lw: 1.3 });
  line(ctx, [[-1, -23], [-3, -30]], { rng, lw: 1.3 });
  ctx.restore();
}

// Translucent ice block drawn over a frozen critter.
export function drawIceCube(ctx, x, y, w, h, boil = 0) {
  const rng = R(35, boil);
  ctx.save(); ctx.globalAlpha = 0.55;
  shape(ctx, rrect(x - w / 2 - 4, y - h - 6, w + 8, h + 6, 6), { fill: '#cfeafa', rng, lw: 2.4, stroke: '#7fb6e0', wash: false });
  ctx.globalAlpha = 0.9;
  line(ctx, [[x - w / 2 + 2, y - h], [x - w / 2 + 10, y - h + 10]], { rng, stroke: '#ffffff', lw: 3 });
  ctx.restore();
}

// The leaf Fennel holds overhead while gliding in Autumn.
export function drawLeafGlider(ctx, x, y, t, boil = 0) {
  const rng = R(36, boil);
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 5) * 0.12);
  shape(ctx, [[-30, 0], [-12, -12], [14, -14], [32, -2], [12, 6], [-14, 6]], { fill: '#d9662b', rng, lw: 2.2, step: 8 });
  line(ctx, [[-26, -1], [28, -4]], { rng, lw: 1.6, stroke: '#7a3a1c' });
  line(ctx, [[-4, 0], [0, 26]], { rng, lw: 1.4 });
  ctx.restore();
}

export function drawVent(ctx, x, y, active, t = 0, boil = 0, height = 300) {
  const rng = R(37, boil);
  shape(ctx, rrect(x - 22, y - 12, 44, 12, 3), { fill: '#7a5230', rng, lw: 2.2 });
  for (let k = -2; k <= 2; k++) line(ctx, [[x + k * 8, y - 11], [x + k * 8, y - 1]], { rng, lw: 1.6 });
  if (active) {
    ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#fff6e6'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    for (let k = 0; k < 6; k++) {
      const yy = y - 20 - ((t * 280 + k * (height / 6)) % height);
      const xx = x + Math.sin(yy * 0.05 + k) * 12;
      ctx.beginPath(); ctx.moveTo(xx - 6, yy); ctx.quadraticCurveTo(xx, yy - 12, xx + 6, yy - 24); ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawPuddle(ctx, x, y, o = {}) {
  const rng = R(38, o.boil);
  const t = o.t || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  shape(ctx, ellipse(-20, -10 + Math.sin(t * 2) * 2, 18, 6, 12, 0.3), { fill: '#7a5a42', rng, lw: 2 });
  shape(ctx, ellipse(0, -26, 15, 24, 16), { fill: '#8a6a4f', rng, lw: 2.5 });
  shape(ctx, ellipse(4, -20, 9, 15, 12), { fill: '#e8d6b8', stroke: null, rng, wash: false });
  shape(ctx, ellipse(4, -56, 13, 12, 14), { fill: '#8a6a4f', rng, lw: 2.4 });
  shape(ctx, ellipse(11, -52, 8, 6, 12), { fill: '#e8d6b8', rng, lw: 1.8 });
  dot(ctx, 17, -54, 2.6, INK);
  dot(ctx, 8, -60, 2.2, INK);
  shape(ctx, rrect(-12, -74, 30, 8, 3), { fill: '#3d4a7a', rng, lw: 2 });
  shape(ctx, rrect(-6, -86, 18, 14, 3), { fill: '#3d4a7a', rng, lw: 2 });
  dot(ctx, 3, -80, 2.4, '#f2c14e');
  line(ctx, [[14, -48], [22, -46]], { rng, lw: 1.2 });
  line(ctx, [[14, -46], [22, -42]], { rng, lw: 1.2 });
  ctx.restore();
}

export function drawRook(ctx, x, y, o = {}) {
  const rng = R(39, o.boil);
  const t = o.t || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  line(ctx, [[-4, 0], [-4, -12]], { rng, lw: 2.4, stroke: '#7a5a3a' });
  line(ctx, [[4, 0], [4, -12]], { rng, lw: 2.4, stroke: '#7a5a3a' });
  shape(ctx, ellipse(0, -30, 17, 21, 16), { fill: '#3e3a48', rng, lw: 2.4 });
  shape(ctx, ellipse(-10, -30 + Math.sin(t * 3) * 2, 9, 16, 12, 0.3), { fill: '#2e2a38', rng, lw: 2 });
  shape(ctx, ellipse(4, -56, 12, 11, 14), { fill: '#3e3a48', rng, lw: 2.4 });
  shape(ctx, [[12, -58], [26, -54], [12, -51]], { fill: '#e8c56f', rng, lw: 1.8, step: 4 });
  dot(ctx, 8, -59, 2.6, '#fffaf0');
  dot(ctx, 8.6, -59, 1.4, INK);
  shape(ctx, ellipse(2, -68, 12, 4, 10), { fill: '#b5503a', rng, lw: 1.8 });
  shape(ctx, ellipse(2, -73, 7, 5, 10), { fill: '#b5503a', rng, lw: 1.8 });
  dot(ctx, 9, -70, 3, '#f4a3bf');
  ctx.restore();
}

export function drawCrow(ctx, x, y, o = {}) {
  const rng = R(40, o.boil);
  const f = Math.sin((o.t || 0) * 16);
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
  shape(ctx, ellipse(0, 0, 16, 9, 12), { fill: '#3e3a48', rng, lw: 2.2 });
  shape(ctx, [[-4, -2], [-18, -16 * f - 4], [6, -4]], { fill: '#2e2a38', rng, lw: 2, step: 6 });
  shape(ctx, [[14, -2], [24, 2], [14, 4]], { fill: '#e8c56f', rng, lw: 1.6, step: 4 });
  dot(ctx, 10, -3, 2, '#fffaf0');
  ctx.restore();
}

export function drawPike(ctx, x, y, o = {}) {
  const rng = R(41, o.boil);
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(o.facing || 1, 1);
  const body = o.flash ? '#ffffff' : '#7f9a7a';
  shape(ctx, [[-70, 0], [-90, -24], [-86, 24]], { fill: shade('#7f9a7a', -0.15), rng, lw: 2.4, step: 8 });
  shape(ctx, ellipse(0, 0, 72, 26, 22), { fill: body, rng, lw: 3 });
  for (let k = -3; k <= 2; k++) dot(ctx, k * 16, -6 + (k % 2) * 6, 4, '#c9d6b0');
  shape(ctx, [[-10, -24], [10, -40], [24, -22]], { fill: shade('#7f9a7a', -0.2), rng, lw: 2, step: 8 });
  shape(ctx, [[52, 4], [80, 0], [74, 14], [50, 14]], { fill: '#e8e0c8', rng, lw: 2.2, step: 8 });
  for (let k = 0; k < 4; k++) shape(ctx, [[54 + k * 6, 4], [57 + k * 6, 10], [60 + k * 6, 4]], { fill: '#ffffff', rng, lw: 1, step: 3, wash: false });
  if (o.dizzy) {
    line(ctx, [[38, -12], [48, -2]], { rng, lw: 3 });
    line(ctx, [[48, -12], [38, -2]], { rng, lw: 3 });
  } else {
    dot(ctx, 44, -8, 6, '#fffaf0');
    dot(ctx, 46, -8, 3, INK);
    line(ctx, [[36, -18], [52, -14]], { rng, lw: 3 });
  }
  ctx.restore();
}

// The Prize Scarecrow. Feet at (x, y); arms spin on a crossbar at armY; hat on top is the weak spot.
export const SCARE_H = 230;
export const SCARE_ARM_Y = SCARE_H - 120;
export const SCARE_ARM_LEN = 150;
export function drawScarecrow(ctx, x, y, o = {}) {
  const rng = R(42, o.boil);
  const t = o.t || 0;
  const H = SCARE_H;
  ctx.save(); ctx.translate(x, y);
  shape(ctx, rrect(-7, -H + 40, 14, H - 40, 4), { fill: '#8a6040', rng, lw: 2.4 });
  shape(ctx, [[-36, -H + 110], [36, -H + 110], [30, -H + 200], [-30, -H + 200]], { fill: o.flash ? '#ffffff' : '#7d6a9e', rng, lw: 2.6, step: 14 });
  for (let k = 0; k < 3; k++) shape(ctx, rrect(-20 + k * 14, -H + 128, 8, 10, 2), { fill: '#e2b34a', rng, lw: 1.4, wash: false });
  ctx.save(); ctx.translate(0, -SCARE_ARM_Y); ctx.rotate(o.armAngle || 0);
  shape(ctx, rrect(-SCARE_ARM_LEN, -8, SCARE_ARM_LEN * 2, 16, 6), { fill: '#a87a4c', rng, lw: 2.4 });
  for (const s of [-1, 1]) {
    shape(ctx, rrect(s * SCARE_ARM_LEN - 18, -14, 36, 28, 8), { fill: '#7d6a9e', rng, lw: 2.2 });
    for (let k = 0; k < 4; k++) line(ctx, [[s * (SCARE_ARM_LEN + 16), -8 + k * 6], [s * (SCARE_ARM_LEN + 30), -12 + k * 8]], { rng, stroke: '#e8c56f', lw: 2.4 });
  }
  ctx.restore();
  shape(ctx, ellipse(0, -H + 70, 34, 32, 18), { fill: '#e8d2a6', rng, lw: 2.6 });
  if (o.dizzy) {
    for (const ex of [-12, 12]) shape(ctx, ellipse(ex, -H + 64, 6, 6, 10), { stroke: INK, lw: 2.4, rng });
  } else {
    for (const ex of [-12, 12]) {
      line(ctx, [[ex - 6, -H + 58], [ex + 6, -H + 68]], { rng, lw: 3 });
      line(ctx, [[ex + 6, -H + 58], [ex - 6, -H + 68]], { rng, lw: 3 });
    }
  }
  line(ctx, [[-14, -H + 86], [-6, -H + 90], [2, -H + 86], [10, -H + 90], [16, -H + 86]], { rng, lw: 2.2 });
  if (o.glow) { ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(t * 10) * 0.12; dot(ctx, 0, -H + 26, 36, '#fff4a8'); ctx.restore(); }
  if (!o.hatless) {
    shape(ctx, ellipse(0, -H + 42, 50, 9, 18), { fill: '#d9b45a', rng, lw: 2.4 });
    shape(ctx, [[-26, -H + 40], [-20, -H + 6], [20, -H + 6], [26, -H + 40]], { fill: '#d9b45a', rng, lw: 2.4, step: 10 });
    line(ctx, [[-24, -H + 30], [24, -H + 30]], { rng, lw: 4, stroke: '#b5503a' });
  }
  ctx.restore();
}
