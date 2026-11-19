// Sunglass Greenhouse: cactus hedgehogs, shadow slugs, Basil the toad, heat grates and the Sunlamp Moth.
import { shape, line, ellipse, rrect, rngFor, dot, INK } from './ink.js';
import { shade } from '../core/util.js';

const R = (seed, boil) => rngFor(seed, boil);

// A round little hedgehog wearing a cactus coat. Too prickly to jump on.
export function drawCactusHog(ctx, x, y, o = {}) {
  const rng = R(o.seed || 61, o.boil);
  const t = o.t || 0;
  const green = '#6faa5a', dark = '#477a3a';
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  if (o.asleep && !o.frozen) {
    shape(ctx, ellipse(0, -13, 16, 13, 18), { fill: green, rng, lw: 2.4 });
    for (let a = 0; a < 9; a++) {
      const ang = Math.PI + (a / 8) * Math.PI;
      line(ctx, [[Math.cos(ang) * 14, -13 + Math.sin(ang) * 11], [Math.cos(ang) * 20, -13 + Math.sin(ang) * 16]], { rng, lw: 1.6, stroke: '#f3ead0' });
    }
    dot(ctx, 4, -24, 3.4, '#f28aa8');
  } else {
    for (const lx of [-8, 8]) line(ctx, [[lx, -5], [lx + Math.sin(t * 14 + lx) * 3, 0]], { rng, lw: 2.4, stroke: '#8e6a4a' });
    shape(ctx, ellipse(-2, -15, 17, 14, 18), { fill: green, rng, lw: 2.4 });
    line(ctx, [[-10, -26], [-12, -6]], { rng, lw: 1.4, stroke: dark });
    line(ctx, [[0, -28], [0, -4]], { rng, lw: 1.4, stroke: dark });
    for (let a = 0; a < 11; a++) {
      const ang = Math.PI * 0.95 + (a / 10) * Math.PI * 1.05;
      line(ctx, [[-2 + Math.cos(ang) * 15, -15 + Math.sin(ang) * 12], [-2 + Math.cos(ang) * 22, -15 + Math.sin(ang) * 18]], { rng, lw: 1.7, stroke: '#f3ead0' });
    }
    shape(ctx, ellipse(14, -10, 8, 7, 12), { fill: '#c99a6c', rng, lw: 2 });
    dot(ctx, 21, -11, 2.2, INK);
    dot(ctx, 15, -13, 2, INK);
    shape(ctx, ellipse(-4, -30, 4, 4, 10), { fill: '#f28aa8', rng, lw: 1.6 });
  }
  ctx.restore();
}

// A soft, dark slug that hides in the shadows (you only see it in the light).
export function drawSlug(ctx, x, y, o = {}) {
  const rng = R(o.seed || 62, o.boil);
  const t = o.t || 0;
  const body = '#4b4a6e';
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  if (o.asleep && !o.frozen) {
    shape(ctx, ellipse(0, -9, 18, 9, 16), { fill: body, rng, lw: 2.2 });
    line(ctx, [[4, -12], [10, -11]], { rng, lw: 1.6, stroke: '#d9f7a0' });
  } else {
    const s = Math.sin(t * 4) * 2;
    shape(ctx, [[-20, 0], [-18, -8], [-4, -14 - s], [10, -13], [18, -6], [20, 0]], { fill: body, rng, lw: 2.2, step: 8 });
    shape(ctx, ellipse(-4, -10 - s / 2, 8, 3, 8), { fill: shade(body, 0.25), stroke: null, rng, wash: false });
    line(ctx, [[12, -12], [14, -22]], { rng, lw: 1.6 });
    line(ctx, [[16, -10], [20, -18]], { rng, lw: 1.6 });
    dot(ctx, 14, -22, 2.6, '#d9f7a0');
    dot(ctx, 20, -18, 2.6, '#d9f7a0');
  }
  ctx.restore();
}

// Basil, the sleepy greenhouse-keeper toad, with a watering can and a big sun hat.
export function drawBasil(ctx, x, y, o = {}) {
  const rng = R(63, o.boil);
  const t = o.t || 0;
  const skin = '#9bb860';
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  shape(ctx, ellipse(-14, -6, 11, 6, 12), { fill: shade(skin, -0.15), rng, lw: 2 });
  shape(ctx, ellipse(14, -6, 11, 6, 12), { fill: shade(skin, -0.15), rng, lw: 2 });
  shape(ctx, ellipse(0, -26, 24, 22 + Math.sin(t * 1.5), 18), { fill: skin, rng, lw: 2.6 });
  shape(ctx, ellipse(2, -20, 15, 12, 14), { fill: '#eef0c8', stroke: null, rng, wash: false });
  for (const ex of [-9, 9]) {
    shape(ctx, ellipse(ex, -48, 8, 7, 12), { fill: skin, rng, lw: 2.2 });
    line(ctx, [[ex - 5, -48], [ex + 5, -47]], { rng, lw: 2 });
  }
  line(ctx, [[-10, -34], [-2, -31], [8, -33]], { rng, lw: 1.8 });
  shape(ctx, ellipse(0, -56, 30, 6, 18), { fill: '#e8c56f', rng, lw: 2.2 });
  shape(ctx, ellipse(0, -62, 14, 9, 14), { fill: '#e8c56f', rng, lw: 2.2 });
  line(ctx, [[-13, -58], [13, -58]], { rng, lw: 2.6, stroke: '#5aa86a' });
  dot(ctx, 12, -61, 3, '#f28a5a');
  // watering can
  shape(ctx, rrect(18, -24, 18, 14, 4), { fill: '#7fb6cf', rng, lw: 2 });
  line(ctx, [[36, -20], [46, -30]], { rng, lw: 2.4, stroke: '#4f86a6' });
  line(ctx, [[20, -26], [24, -32], [32, -32], [34, -26]], { rng, lw: 1.8 });
  ctx.restore();
}

// A grate in the floor; with Summer near, hot air rises from it and lifts you up.
export function drawHeatVent(ctx, x, y, active, t = 0, boil = 0, height = 300) {
  const rng = R(64, boil);
  if (active) {
    ctx.save(); ctx.globalAlpha = 0.18;
    const g = ctx.createLinearGradient(0, y - height, 0, y);
    g.addColorStop(0, 'rgba(255,170,60,0)'); g.addColorStop(1, '#ffb347');
    ctx.fillStyle = g; ctx.fillRect(x - 26, y - height, 52, height);
    ctx.restore();
  }
  shape(ctx, rrect(x - 22, y - 12, 44, 12, 3), { fill: active ? '#c8643a' : '#8a6a52', rng, lw: 2.2 });
  for (let k = -2; k <= 2; k++) line(ctx, [[x + k * 8, y - 11], [x + k * 8, y - 1]], { rng, lw: 1.6, stroke: active ? '#ffd774' : INK });
  if (active) {
    ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    for (let k = 0; k < 5; k++) {
      const yy = y - 20 - ((t * 240 + k * (height / 5)) % height);
      const xx = x + Math.sin(yy * 0.06 + k * 2) * 10;
      ctx.beginPath(); ctx.moveTo(xx, yy); ctx.bezierCurveTo(xx + 8, yy - 8, xx - 8, yy - 16, xx, yy - 24); ctx.stroke();
    }
    ctx.restore();
  }
}

// The little heat gauge above Fennel's head in the Heatwave.
export function drawThermo(ctx, x, y, heat, boil = 0) {
  const rng = R(65, boil);
  shape(ctx, rrect(x - 5, y - 34, 10, 30, 5), { fill: '#fffaf0', rng, lw: 2 });
  const h = Math.min(1, heat) * 24;
  ctx.fillStyle = heat > 0.7 ? '#e2574c' : '#f2a541';
  ctx.fillRect(x - 2.5, y - 8 - h, 5, h);
  shape(ctx, ellipse(x, y - 2, 7, 7, 10), { fill: heat > 0.7 ? '#e2574c' : '#f2a541', rng, lw: 2 });
}

// The Sunlamp Moth: a huge, sleepy moth that adores light. It hides inside a shield of ice.
export function drawSunMoth(ctx, x, y, o = {}) {
  const rng = R(66, o.boil);
  const t = o.t || 0;
  const flap = 0.55 + Math.abs(Math.sin(t * (o.dazed ? 4 : 9))) * 0.45;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
  const glow = o.shield > 0.05 ? '#cfeafa' : '#ffe08a';
  ctx.globalAlpha = 0.3 + Math.sin(t * 3) * 0.08; dot(ctx, 0, 0, 80, glow); ctx.globalAlpha = 1;
  const wingA = o.flash ? '#ffffff' : '#f2b33d', wingB = o.flash ? '#ffffff' : '#e8894a';
  for (const s of [-1, 1]) {
    shape(ctx, ellipse(s * 40 * flap, -14, 44 * flap, 32, 16, s * -0.35), { fill: wingA, rng, lw: 2.6 });
    shape(ctx, ellipse(s * 32 * flap, 22, 30 * flap, 20, 14, s * 0.5), { fill: wingB, rng, lw: 2.4 });
    shape(ctx, ellipse(s * 44 * flap, -16, 12 * flap, 10, 12), { fill: '#fff3c4', rng, lw: 2 });
    dot(ctx, s * 44 * flap, -16, 4.5, '#7a4a3c');
  }
  shape(ctx, ellipse(0, 6, 15, 34, 16), { fill: '#b98a5e', rng, lw: 2.6 });
  for (let k = 0; k < 3; k++) line(ctx, [[-12, 14 + k * 9], [12, 14 + k * 9]], { rng, lw: 1.6, stroke: '#8a6040' });
  shape(ctx, ellipse(0, -30, 18, 15, 16), { fill: '#f6e3b8', rng, lw: 2.4 });
  if (o.dazed) {
    for (const ex of [-7, 7]) { line(ctx, [[ex - 4, -34], [ex + 4, -28]], { rng, lw: 2.4 }); line(ctx, [[ex + 4, -34], [ex - 4, -28]], { rng, lw: 2.4 }); }
  } else {
    dot(ctx, -7, -31, 4, INK); dot(ctx, 7, -31, 4, INK);
    dot(ctx, -6, -32.5, 1.4, '#ffffff'); dot(ctx, 8, -32.5, 1.4, '#ffffff');
  }
  line(ctx, [[-6, -44], [-16, -62], [-24, -60]], { rng, lw: 2 });
  line(ctx, [[6, -44], [16, -62], [24, -60]], { rng, lw: 2 });
  // The ice shield: a big crystal shell that Summer melts away.
  if (o.shield > 0.02) {
    ctx.save(); ctx.globalAlpha = 0.25 + o.shield * 0.4;
    const r = 58 + o.shield * 30;
    const pts = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.85]); }
    shape(ctx, pts, { fill: '#cfeafa', rng, lw: 3, stroke: '#7fb6e0', step: 30, wash: false });
    ctx.globalAlpha = 0.8;
    line(ctx, [[-r * 0.6, -r * 0.5], [-r * 0.3, -r * 0.7]], { rng, lw: 4, stroke: '#ffffff' });
    ctx.restore();
  }
  ctx.restore();
}

// A frost flake the moth sheds; it melts in Summer's warmth.
export function drawFrostFlake(ctx, x, y, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let a = 0; a < 3; a++) { ctx.beginPath(); ctx.moveTo(Math.cos(a * 1.047) * 9, Math.sin(a * 1.047) * 9); ctx.lineTo(-Math.cos(a * 1.047) * 9, -Math.sin(a * 1.047) * 9); ctx.stroke(); }
  ctx.strokeStyle = '#7fb6e0'; ctx.lineWidth = 1.4;
  for (let a = 0; a < 3; a++) { ctx.beginPath(); ctx.moveTo(Math.cos(a * 1.047) * 9, Math.sin(a * 1.047) * 9); ctx.lineTo(-Math.cos(a * 1.047) * 9, -Math.sin(a * 1.047) * 9); ctx.stroke(); }
  ctx.restore();
}

// A little hanging glasshouse lamp (the always-on lights in dark levels).
export function drawGlowLamp(ctx, x, y, t = 0, boil = 0) {
  const rng = R(67, boil);
  line(ctx, [[x, y - 70], [x, y - 14]], { rng, lw: 2, stroke: '#5a4636' });
  ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(t * 2) * 0.05; dot(ctx, x, y, 26, '#ffe9a0'); ctx.restore();
  shape(ctx, [[x - 12, y - 14], [x + 12, y - 14], [x + 8, y + 8], [x - 8, y + 8]], { fill: '#fff1b8', rng, lw: 2, step: 8 });
  shape(ctx, rrect(x - 14, y - 18, 28, 6, 2), { fill: '#865b33', rng, lw: 1.6, wash: false });
}
