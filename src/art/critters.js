// Critters, friends, pickups and level objects. All positions are feet / base points.
import { shape, line, ellipse, rrect, rngFor, dot, INK, text } from './ink.js';
import { shade } from '../core/util.js';

const R = (seed, boil) => rngFor(seed, boil);

export function drawGrub(ctx, x, y, o) {
  const rng = R(o.seed || 1, o.boil);
  const body = '#a9bd5e', dark = '#6f8a3c';
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  if (o.asleep) {
    shape(ctx, ellipse(0, -14, 16, 14, 16), { fill: body, rng, lw: 2.5 });
    line(ctx, [[0, -14], [5, -18], [7, -11], [-1, -7], [-8, -13], [-4, -22], [6, -24]], { rng, lw: 1.8, stroke: dark, wob: 0.4 });
  } else {
    const t = o.t || 0;
    [[-13, 9, 0], [-3, 10.5, 1], [9, 12, 2]].forEach(([sx, r, i]) => {
      const by = -r - 1 + Math.sin(t * 9 + i * 1.2) * 1.6;
      shape(ctx, ellipse(sx, by, r, r * 0.95, 14), { fill: i === 2 ? shade(body, 0.08) : body, rng, lw: 2.3 });
      dot(ctx, sx - 3, by + r * 0.8, 2.2, dark);
    });
    const hy = -13 + Math.sin(t * 9 + 2.4) * 1.6;
    dot(ctx, 13, hy - 2, 4, '#fffaf0');
    dot(ctx, 14.5, hy - 2, 2.1, INK);
    line(ctx, [[8.5, hy - 8], [17, hy - 5.5]], { rng, lw: 2.2, wob: 0.3 });
    line(ctx, [[10, hy + 5], [16, hy + 4]], { rng, lw: 1.8, wob: 0.3 });
    line(ctx, [[6, hy - 10], [3, hy - 18]], { rng, lw: 1.6 });
    dot(ctx, 3, hy - 19, 2, dark);
  }
  ctx.restore();
}

export function drawSnap(ctx, x, y, o) {
  const rng = R(o.seed || 2, o.boil);
  const petal = '#ef7fa3';
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  line(ctx, [[0, 0], [2, -14], [0, -26]], { rng, stroke: '#5c9a45', lw: 4 });
  shape(ctx, ellipse(-8, -10, 9, 4, 10, 0.5), { fill: '#6fb257', rng, lw: 1.8 });
  shape(ctx, ellipse(8, -16, 9, 4, 10, -0.5), { fill: '#6fb257', rng, lw: 1.8 });
  if (o.asleep) {
    ctx.translate(2, -26); ctx.rotate(1.1);
    shape(ctx, ellipse(10, 0, 13, 10, 14), { fill: petal, rng, lw: 2.3 });
    line(ctx, [[8, -3], [14, -2]], { rng, lw: 1.8 });
  } else {
    const op = o.open || 0;
    ctx.translate(0, -32);
    ctx.save(); ctx.rotate(-op * 0.55);
    shape(ctx, [[-10, 2], [-6, -12], [8, -12], [18, -2], [6, 2]], { fill: petal, rng, lw: 2.3, step: 6 });
    dot(ctx, 3, -6, 3.2, '#fffaf0'); dot(ctx, 4.5, -6, 1.7, INK);
    line(ctx, [[-1, -11], [8, -9]], { rng, lw: 2, wob: 0.3 });
    ctx.restore();
    ctx.save(); ctx.rotate(op * 0.45);
    shape(ctx, [[-10, 2], [6, 2], [16, 4], [6, 11], [-6, 9]], { fill: shade(petal, -0.12), rng, lw: 2.3, step: 6 });
    ctx.restore();
    if (op > 0.2) dot(ctx, 8, 3, 3 * op, '#7d2c45');
  }
  ctx.restore();
}

export function drawBuzzer(ctx, x, y, o) {
  const rng = R(o.seed || 3, o.boil);
  const t = o.t || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  if (!o.asleep) {
    const f = Math.abs(Math.sin(t * 38));
    ctx.globalAlpha = 0.7;
    shape(ctx, ellipse(-3, -28, 7, 11 * (0.4 + f * 0.6), 12, -0.3), { fill: '#f4fbff', rng, lw: 1.6, wash: false });
    shape(ctx, ellipse(4, -27, 6, 9 * (0.4 + f * 0.6), 12, 0.3), { fill: '#f4fbff', rng, lw: 1.6, wash: false });
    ctx.globalAlpha = 1;
  }
  shape(ctx, ellipse(0, -14, 15, 12, 16), { fill: '#f4c542', rng, lw: 2.4 });
  ctx.save();
  ctx.beginPath(); ctx.ellipse(0, -14, 14, 11, 0, 0, 7); ctx.clip();
  ctx.fillStyle = INK; ctx.fillRect(-8, -26, 5, 24); ctx.fillRect(1, -26, 5, 24);
  ctx.restore();
  if (o.asleep) {
    line(ctx, [[8, -17], [13, -16]], { rng, lw: 1.8 });
  } else {
    shape(ctx, [[-15, -14], [-22, -12], [-15, -10]], { fill: INK, rng, lw: 1, step: 4, wash: false });
    dot(ctx, 9, -17, 3.4, '#fffaf0'); dot(ctx, 10.3, -17, 1.8, INK);
    line(ctx, [[5, -22], [13, -20]], { rng, lw: 2, wob: 0.3 });
  }
  ctx.restore();
}

export function drawPumpkin(ctx, x, y, o) {
  const rng = R(11, o.boil);
  const s = o.scale || 1;
  const sq = o.squash || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 + sq), s * (1 - sq));
  const body = o.flash ? '#fff1d0' : '#ee8a35';
  const H2 = 190;
  // vine arms
  line(ctx, [[-80, -60], [-110, -40 + Math.sin((o.t || 0) * 4) * 8], [-118, -10]], { rng, stroke: '#5c8a3a', lw: 5 });
  line(ctx, [[80, -60], [110, -40 - Math.sin((o.t || 0) * 4) * 8], [118, -10]], { rng, stroke: '#5c8a3a', lw: 5 });
  [[-62, 44], [62, 44], [-30, 52], [30, 52], [0, 56]].forEach(([cx, rx]) => {
    shape(ctx, ellipse(cx, -H2 / 2, rx, H2 / 2, 22), { fill: shade(body, Math.abs(cx) > 50 ? -0.08 : 0), rng, lw: 3 });
  });
  // stalk (the weak spot)
  if (o.glow) {
    ctx.save(); ctx.globalAlpha = 0.35 + Math.sin((o.t || 0) * 10) * 0.15;
    dot(ctx, 0, -H2 - 8, 26, '#fff4a8'); ctx.restore();
  }
  shape(ctx, rrect(-9, -H2 - 24, 18, 30, 6), { fill: '#6e8a3a', rng, lw: 2.6 });
  shape(ctx, ellipse(22, -H2 - 14, 18, 8, 12, -0.3), { fill: '#7fbf5a', rng, lw: 2.2 });
  line(ctx, [[-8, -H2 - 18], [-22, -H2 - 26], [-18, -H2 - 36], [-10, -H2 - 32]], { rng, stroke: '#5c8a3a', lw: 2.4 });
  // face
  const fy = -H2 * 0.55;
  if (o.face === 'dizzy') {
    line(ctx, [[-40, fy - 10], [-24, fy + 6]], { rng, lw: 4 }); line(ctx, [[-24, fy - 10], [-40, fy + 6]], { rng, lw: 4 });
    line(ctx, [[24, fy - 10], [40, fy + 6]], { rng, lw: 4 }); line(ctx, [[40, fy - 10], [24, fy + 6]], { rng, lw: 4 });
    shape(ctx, ellipse(0, fy + 40, 16, 10, 12), { fill: '#5b2c12', rng, lw: 3, wash: false });
  } else {
    shape(ctx, [[-46, fy - 8], [-22, fy - 2], [-36, fy + 12]], { fill: '#5b2c12', rng, lw: 3, step: 8, wash: false });
    shape(ctx, [[46, fy - 8], [22, fy - 2], [36, fy + 12]], { fill: '#5b2c12', rng, lw: 3, step: 8, wash: false });
    line(ctx, [[-52, fy - 22], [-18, fy - 12]], { rng, lw: 5 });
    line(ctx, [[52, fy - 22], [18, fy - 12]], { rng, lw: 5 });
    shape(ctx, [[-40, fy + 32], [-24, fy + 26], [-12, fy + 36], [0, fy + 26], [12, fy + 36], [24, fy + 26], [40, fy + 32], [20, fy + 52], [-20, fy + 52]], { fill: '#5b2c12', rng, lw: 3, step: 10, wash: false });
  }
  ctx.restore();
}

export function drawThimble(ctx, x, y, o = {}) {
  const rng = R(21, o.boil);
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  line(ctx, [[22, 0], [20, -44]], { rng, stroke: '#7a5232', lw: 4 });
  shape(ctx, rrect(-12, -8, 9, 9, 3), { fill: '#4a4a52', rng, lw: 2 });
  shape(ctx, rrect(4, -8, 9, 9, 3), { fill: '#4a4a52', rng, lw: 2 });
  shape(ctx, ellipse(0, -30, 20, 25, 18), { fill: '#8e8f96', rng, lw: 2.6 });
  shape(ctx, [[-19, -36], [19, -36], [21, -10], [-21, -10]], { fill: '#b0563f', rng, lw: 2.4, step: 10 });
  dot(ctx, 0, -28, 2, '#f2d38a'); dot(ctx, 0, -20, 2, '#f2d38a');
  shape(ctx, ellipse(18, -36, 6, 8, 10), { fill: '#8e8f96', rng, lw: 2 });
  shape(ctx, ellipse(4, -64, 15, 14, 16), { fill: '#f3efe6', rng, lw: 2.6 });
  shape(ctx, ellipse(-6, -66, 4.5, 11, 10, 0.3), { fill: '#2f2f35', stroke: null, rng, wash: false });
  shape(ctx, ellipse(12, -66, 4, 10, 10, -0.2), { fill: '#2f2f35', stroke: null, rng, wash: false });
  shape(ctx, ellipse(-8, -76, 5, 5, 8), { fill: '#2f2f35', rng, lw: 1.6 });
  dot(ctx, 19, -60, 3, INK);
  dot(ctx, 9, -64, 1.8, INK);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(9, -64, 4.5, 0, 7); ctx.stroke();
  ctx.restore();
}

export function drawJuniper(ctx, x, y, o = {}) {
  const rng = R(22, o.boil);
  const t = o.t || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(o.facing || 1, 1);
  shape(ctx, ellipse(-4, -84, 5, 17, 12, -0.15 + Math.sin(t * 2) * 0.05), { fill: '#d8c3a5', rng, lw: 2.2 });
  shape(ctx, ellipse(8, -86, 5, 18, 12, 0.15), { fill: '#d8c3a5', rng, lw: 2.2 });
  shape(ctx, ellipse(8, -86, 2, 12, 8, 0.15), { fill: '#f2b8c6', stroke: null, rng, wash: false });
  shape(ctx, ellipse(0, -26, 16, 24, 16), { fill: '#d8c3a5', rng, lw: 2.5 });
  shape(ctx, [[-13, -38], [13, -38], [15, -6], [-15, -6]], { fill: '#7aa65a', rng, lw: 2.2, step: 8 });
  shape(ctx, ellipse(4, -60, 14, 13, 16), { fill: '#e3d1b6', rng, lw: 2.5 });
  dot(ctx, 9, -62, 2.4, INK); dot(ctx, 17, -57, 2.4, '#e88aa0');
  line(ctx, [[12, -53], [16, -52]], { rng, lw: 1.6 });
  line(ctx, [[14, -26], [24, -38]], { rng, stroke: '#8b6239', lw: 3 });
  shape(ctx, [[22, -38], [30, -48], [26, -36]], { fill: '#b8bcc4', rng, lw: 1.6, step: 4 });
  ctx.restore();
}

export function drawAcorn(ctx, x, y, s = 1, boil = 0) {
  const rng = R(5, boil);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, ellipse(0, 2, 7, 8, 12), { fill: '#d9a066', rng, lw: 2, wob: 0.4 });
  shape(ctx, ellipse(0, -4, 8.5, 5, 12), { fill: '#7a5230', rng, lw: 2, wob: 0.4 });
  line(ctx, [[0, -9], [2, -13]], { rng, lw: 2 });
  ctx.restore();
}

export function drawSeed(ctx, x, y, o = {}) {
  const rng = R(6, o.boil);
  ctx.save(); ctx.translate(x, y);
  if (o.ghost) ctx.globalAlpha = 0.38;
  ctx.globalAlpha *= 0.4;
  dot(ctx, 0, 0, 18 + Math.sin((o.t || 0) * 4) * 2, '#fff1a8');
  ctx.globalAlpha = o.ghost ? 0.38 : 1;
  shape(ctx, [[0, -15], [9, -2], [7, 9], [0, 13], [-7, 9], [-9, -2]], { fill: '#f5c542', rng, lw: 2.4, step: 6 });
  line(ctx, [[-3, -6], [-4, 4]], { rng, lw: 2, stroke: '#fff6d0' });
  ctx.restore();
}

export function drawBerry(ctx, x, y, boil = 0) {
  const rng = R(7, boil);
  shape(ctx, ellipse(x, y - 10, 10, 10, 14), { fill: '#e0505f', rng, lw: 2.2 });
  shape(ctx, ellipse(x + 5, y - 21, 7, 3.4, 10, -0.5), { fill: '#6fae58', rng, lw: 1.6 });
  dot(ctx, x - 3, y - 13, 2.5, '#ffd6dc');
}

export function drawStoneGem(ctx, x, y, season = 'spring', o = {}) {
  const rng = R(8, o.boil);
  const c = { spring: '#f28fb0', winter: '#8cc4ea', autumn: '#e0783a', summer: '#f2c13d' }[season];
  ctx.save(); ctx.translate(x, y);
  const s = o.scale || 1; ctx.scale(s, s);
  if (!o.noGlow) {
    ctx.globalAlpha = 0.35 + Math.sin((o.t || 0) * 3) * 0.1;
    dot(ctx, 0, 0, 26, shade(c, 0.5));
    ctx.globalAlpha = 1;
  }
  if (o.empty) {
    shape(ctx, [[0, -14], [11, -5], [7, 11], [-7, 11], [-11, -5]], { stroke: '#8a7a68', lw: 2, rng, step: 6 });
  } else {
    shape(ctx, [[0, -14], [11, -5], [7, 11], [-7, 11], [-11, -5]], { fill: c, rng, lw: 2.4, step: 6 });
    line(ctx, [[-11, -5], [0, -1], [11, -5]], { rng, lw: 1.4, stroke: shade(c, -0.35) });
    line(ctx, [[0, -1], [0, 11]], { rng, lw: 1.4, stroke: shade(c, -0.35) });
    dot(ctx, -4, -6, 2, '#fff');
  }
  ctx.restore();
}

export function drawLantern(ctx, x, y, lit, t = 0, boil = 0) {
  const rng = R(9, boil);
  line(ctx, [[x, y], [x, y - 58]], { rng, stroke: '#6b4a30', lw: 4 });
  line(ctx, [[x, y - 58], [x + 12, y - 62]], { rng, stroke: '#6b4a30', lw: 3 });
  if (lit) {
    ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(t * 8) * 0.05;
    dot(ctx, x + 14, y - 46, 30, '#ffe38a'); ctx.restore();
  }
  shape(ctx, rrect(x + 5, y - 58, 18, 22, 4), { fill: lit ? '#ffd774' : '#cfc6b4', rng, lw: 2.2, wash: false });
  shape(ctx, rrect(x + 3, y - 61, 22, 5, 2), { fill: '#5b4a3a', rng, lw: 1.6, wash: false });
  if (lit) dot(ctx, x + 14, y - 46 + Math.sin(t * 12), 3.4, '#f28a2e');
}

export function drawBell(ctx, x, y, o = {}) {
  const rng = R(10, o.boil);
  const h = o.h || 240;
  shape(ctx, rrect(x - 5, y - h, 10, h, 4), { fill: '#e9d8b6', rng, lw: 2.4, wash: false });
  for (let i = 1; i < 8; i++) line(ctx, [[x - 5, y - (h * i) / 8], [x + 5, y - (h * i) / 8 - 6]], { rng, lw: 1.6, stroke: '#c9573f' });
  ctx.save(); ctx.translate(x, y - h + 6); ctx.rotate(o.swing || 0);
  shape(ctx, [[-6, 4], [-16, 34], [16, 34], [6, 4]], { fill: '#f2c14e', rng, lw: 2.4, step: 8 });
  dot(ctx, 0, 36, 4, '#a8792a');
  ctx.restore();
  shape(ctx, [[x + 5, y - h + 4], [x + 34, y - h + 14 + Math.sin((o.t || 0) * 4) * 3], [x + 5, y - h + 24]], { fill: '#f08fae', rng, lw: 2, step: 8 });
}

export function drawSoil(ctx, x, y, kind, boil = 0) {
  const rng = R(kind === 'v' ? 12 : 13, boil);
  shape(ctx, [[x - 20, y], [x - 14, y - 9], [x, y - 12], [x + 14, y - 9], [x + 20, y]], { fill: '#6b4630', rng, lw: 2.2, step: 6 });
  dot(ctx, x - 6, y - 6, 1.8, '#3e281c'); dot(ctx, x + 7, y - 5, 1.6, '#3e281c');
  if (kind === 'v') line(ctx, [[x, y - 11], [x + 2, y - 17], [x + 6, y - 18]], { rng, stroke: '#5c9a45', lw: 2 });
  else line(ctx, [[x, y - 11], [x - 1, y - 16]], { rng, stroke: '#5c9a45', lw: 2 });
}

export function drawFlower(ctx, x, y, g, squish, pal, boil = 0) {
  if (g <= 0.02) return;
  const rng = R(14, boil);
  const h = 30 * g;
  line(ctx, [[x, y - 8], [x + 2, y - 8 - h * 0.6], [x, y - 8 - h]], { rng, stroke: '#4f8f3a', lw: 4 });
  shape(ctx, ellipse(x - 10, y - 14 - h * 0.3, 10 * g, 4 * g, 8, 0.5), { fill: '#6fb257', rng, lw: 1.8 });
  const top = y - 8 - h;
  const sq = 1 - squish * 0.35;
  ctx.save(); ctx.translate(x, top); ctx.scale(g * (1 + squish * 0.25), g * sq);
  for (let a = 0; a < 7; a++) {
    const ang = Math.PI + (a / 6) * Math.PI;
    shape(ctx, ellipse(Math.cos(ang) * 16, Math.sin(ang) * 8 - 4, 11, 6, 10, ang), { fill: a % 2 ? pal.flower1 : shade(pal.flower1, 0.25), rng, lw: 2 });
  }
  shape(ctx, ellipse(0, -2, 22, 7, 16), { fill: pal.flower2, rng, lw: 2.2 });
  ctx.restore();
}

export function drawVine(ctx, x, yBase, height, boil = 0) {
  if (height < 4) return;
  const rng = R(15, boil);
  const pts = [];
  for (let yy = 0; yy <= height; yy += 12) pts.push([x + Math.sin(yy * 0.08) * 5, yBase - 10 - yy]);
  line(ctx, pts, { rng, stroke: '#4f8f3a', lw: 4.5, wob: 0.6 });
  for (let yy = 14; yy < height; yy += 22) {
    const side = (yy / 22) % 2 < 1 ? 1 : -1;
    shape(ctx, ellipse(x + side * 9 + Math.sin(yy * 0.08) * 5, yBase - 10 - yy, 8, 4, 10, side * 0.6), { fill: '#6fb257', rng, lw: 1.6 });
  }
}

export function drawMushroom(ctx, x, y, squish = 0, boil = 0) {
  const rng = R(16, boil);
  shape(ctx, rrect(x - 8, y - 22, 16, 22, 5), { fill: '#f6ead2', rng, lw: 2.2 });
  ctx.save(); ctx.translate(x, y - 20); ctx.scale(1 + squish * 0.25, 1 - squish * 0.35);
  shape(ctx, [[-24, 2], [-20, -12], [0, -20], [20, -12], [24, 2]], { fill: '#e2574c', rng, lw: 2.4, step: 8 });
  dot(ctx, -10, -8, 3.6, '#fff8ec'); dot(ctx, 8, -11, 3, '#fff8ec'); dot(ctx, 15, -3, 2.4, '#fff8ec');
  ctx.restore();
}

export function drawSign(ctx, x, y, boil = 0) {
  const rng = R(17, boil);
  line(ctx, [[x, y], [x, y - 30]], { rng, stroke: '#7a5232', lw: 4 });
  shape(ctx, rrect(x - 18, y - 46, 36, 22, 3), { fill: '#d9ad74', rng, lw: 2.2 });
  line(ctx, [[x - 11, y - 39], [x + 11, y - 39]], { rng, lw: 1.4 });
  line(ctx, [[x - 11, y - 32], [x + 6, y - 32]], { rng, lw: 1.4 });
}

export function drawLetter(ctx, x, y, t = 0, boil = 0) {
  const rng = R(18, boil);
  ctx.save(); ctx.translate(x, y + Math.sin(t * 3) * 3); ctx.rotate(Math.sin(t * 2) * 0.08);
  ctx.globalAlpha = 0.35; dot(ctx, 0, 0, 30, '#fff4c2'); ctx.globalAlpha = 1;
  shape(ctx, rrect(-18, -12, 36, 24, 3), { fill: '#fbf0dc', rng, lw: 2.2, wash: false });
  line(ctx, [[-18, -12], [0, 2], [18, -12]], { rng, lw: 1.8 });
  dot(ctx, 0, 2, 4, '#c9473d');
  ctx.restore();
}

export function drawPaw(ctx, x, y, s, filled, boil = 0) {
  const rng = R(19, boil);
  const c = filled ? '#e27a3f' : null;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const o = { fill: c, rng, lw: 1.8, wob: 0.4, stroke: filled ? INK : '#9c8b78', wash: false };
  shape(ctx, ellipse(0, 3, 6.5, 5.5, 10), o);
  shape(ctx, ellipse(-7, -5, 2.6, 3.4, 8), o); shape(ctx, ellipse(-2.5, -9, 2.6, 3.4, 8), o);
  shape(ctx, ellipse(2.5, -9, 2.6, 3.4, 8), o); shape(ctx, ellipse(7, -5, 2.6, 3.4, 8), o);
  ctx.restore();
}

// Small season symbol (also used for the colourblind-friendly option).
export function drawSeasonIcon(ctx, x, y, season, r = 10, color) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = color || INK; ctx.fillStyle = color || INK; ctx.lineWidth = 2; ctx.lineCap = 'round';
  if (season === 'spring') {
    for (let a = 0; a < 5; a++) { ctx.beginPath(); ctx.ellipse(Math.cos(a * 1.257) * r * 0.5, Math.sin(a * 1.257) * r * 0.5, r * 0.42, r * 0.28, a * 1.257, 0, 7); ctx.stroke(); }
  } else if (season === 'winter') {
    for (let a = 0; a < 3; a++) { ctx.beginPath(); ctx.moveTo(Math.cos(a * 1.047) * r, Math.sin(a * 1.047) * r); ctx.lineTo(-Math.cos(a * 1.047) * r, -Math.sin(a * 1.047) * r); ctx.stroke(); }
  } else if (season === 'autumn') {
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.45, r * 0.9, 0.6, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.7); ctx.lineTo(r * 0.5, -r * 0.7); ctx.stroke();
  } else if (season === 'summer') {
    ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, 7); ctx.stroke();
    for (let a = 0; a < 8; a++) { ctx.beginPath(); ctx.moveTo(Math.cos(a * 0.785) * r * 0.62, Math.sin(a * 0.785) * r * 0.62); ctx.lineTo(Math.cos(a * 0.785) * r, Math.sin(a * 0.785) * r); ctx.stroke(); }
  } else {
    ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, 7); ctx.stroke();
  }
  ctx.restore();
}

export function drawZ(ctx, x, y, a) {
  text(ctx, 'z', x, y, { size: 18, alpha: a, color: '#5a4a6a' });
}
