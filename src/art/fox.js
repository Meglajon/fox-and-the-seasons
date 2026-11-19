// Fennel the fox, drawn in code with outfits. Local space: feet at (0,0), facing right.
import { shape, line, ellipse, rrect, rngFor, dot, smooth, INK } from './ink.js';
import { shade, lerp } from '../core/util.js';

export const FURS = {
  red: { name: 'Red fox', body: '#e27a3f', belly: '#fff1de', dark: '#6e3a24', tip: '#fffaf0' },
  sand: { name: 'Fennec sand', body: '#e9c38f', belly: '#fff3df', dark: '#9c7148', tip: '#fffaf0' },
  arctic: { name: 'Arctic white', body: '#f1efe9', belly: '#ffffff', dark: '#8f9aab', tip: '#ffffff' },
  silver: { name: 'Silver', body: '#a3a8b0', belly: '#eceef0', dark: '#4c5058', tip: '#ffffff' },
  midnight: { name: 'Midnight', body: '#4a4f7a', belly: '#aab0d9', dark: '#22253d', tip: '#e8eaff' },
};
export const FUR_ORDER = ['red', 'sand', 'arctic', 'silver', 'midnight'];
export const SCARVES = [
  { id: 'plain', name: 'Plain' }, { id: 'stripes', name: 'Stripes', price: 15 }, { id: 'dots', name: 'Polka dots', price: 15 },
  { id: 'checks', name: 'Checks', price: 20 }, { id: 'stars', name: 'Stars', price: 25 }, { id: 'leaves', name: 'Leaves', price: 25 },
];
export const HATS = [
  { id: null, name: 'No hat' },
  { id: 'acorn', name: 'Acorn cap', how: 'Clear Foxhollows Square' },
  { id: 'crown', name: 'Flower crown', how: 'Wake up Bloomwood' },
  { id: 'earmuffs', name: 'Earmuffs', how: 'Thaw Millpond Reach' },
  { id: 'bobble', name: 'Bobble hat', price: 35 },
  { id: 'straw', name: 'Straw hat', price: 35 },
  { id: 'beret', name: 'Leaf beret', how: 'Wake up Copperleaf Orchard' },
  { id: 'sunhat', name: 'Sun hat', how: 'Wake up the Sunglass Greenhouse' },
  { id: 'keeper', name: "Clockkeeper's cap", how: 'Coming in the next build' },
];
export const EXTRAS = [
  { id: 'glasses', name: 'Round glasses', price: 20 }, { id: 'satchel', name: 'Satchel', price: 30 },
  { id: 'ribbon', name: 'Tail ribbon', price: 15 }, { id: 'cheeks', name: 'Rosy cheeks', price: 10 },
];

// o: { facing, t, pose, phase, squash, scale, rot, outfit, scarfColor, speed, boil, blink, sleep }
export function drawFox(ctx, x, y, o = {}) {
  const of = o.outfit || {};
  const fur = FURS[of.fur] || FURS.red;
  const t = o.t || 0;
  const pose = o.pose || 'idle';
  const ph = o.phase || 0;
  const rng = rngFor(o.seed || 7, o.boil || 0);
  const air = pose === 'jump' || pose === 'fall';
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  const sq = o.squash || 0, s = o.scale || 1;
  ctx.scale((o.facing || 1) * s * (1 + sq), s * (1 - sq));
  if (o.alpha != null) ctx.globalAlpha = o.alpha;

  // tail
  let ta = Math.sin(t * 2.5) * 0.12;
  if (pose === 'run') ta = Math.sin(ph * 2) * 0.18 + 0.15;
  if (pose === 'jump') ta = -0.35;
  if (pose === 'fall') ta = 0.35;
  if (pose === 'climb') ta = 0.6;
  if (o.sleep) ta = 0.45;
  ctx.save();
  ctx.translate(-13, o.sleep ? -4 : -20);
  ctx.rotate(ta);
  shape(ctx, ellipse(-17, -7, 19, 9.5, 14, -0.35), { fill: fur.body, rng, lw: 2.4 });
  shape(ctx, ellipse(-31, -12.5, 8, 6.5, 10, -0.35), { fill: fur.tip, rng, lw: 2.2 });
  if (of.ribbon) {
    shape(ctx, [[-5, -6], [-12, -12], [-12, -1]], { fill: '#f07fa8', rng, lw: 1.6, step: 5, wash: false });
    shape(ctx, [[-5, -6], [2, -12], [2, -1]], { fill: '#f07fa8', rng, lw: 1.6, step: 5, wash: false });
    dot(ctx, -5, -6, 2.4, '#d95d8a');
  }
  ctx.restore();

  // legs
  if (!o.sleep) {
    const legs = [[-9, 0], [-3, Math.PI], [8, Math.PI * 0.5], [13, Math.PI * 1.5]];
    legs.forEach(([lx, off], i) => {
      let dx = 0, lift = 0, len = 13;
      if (pose === 'run') { dx = Math.sin(ph + off) * 5; lift = Math.max(0, Math.cos(ph + off)) * 5; len = 13 - lift; }
      if (air) { dx = i < 2 ? -3 : 3; len = 9; }
      if (pose === 'climb') { lift = Math.max(0, Math.sin(ph + off)) * 6; len = 13 - lift; }
      const c = i % 2 === 0 ? shade(fur.dark, 0.18) : fur.dark;
      shape(ctx, rrect(lx + dx - 3, -13, 6, len, 3), { fill: c, rng, lw: 1.8, wob: 0.5, wash: false, step: 6 });
    });
  }

  // body
  const bodyY = o.sleep ? -12 : -21;
  shape(ctx, ellipse(1, bodyY, o.sleep ? 20 : 17, o.sleep ? 10 : 11.5, 16), { fill: fur.body, rng, lw: 2.6 });
  shape(ctx, ellipse(5, bodyY + 5, 10, 5.5, 12), { fill: fur.belly, stroke: null, rng, wob: 0.6, wash: false });
  if (of.satchel) {
    line(ctx, [[12, -29], [-2, -14]], { stroke: '#7a4a2a', lw: 2.6, rng });
    shape(ctx, rrect(-10, -20, 12, 10, 3), { fill: '#a86b3c', rng, lw: 2, wash: false });
  }

  // head
  const hy = o.sleep ? 14 : pose === 'run' ? Math.sin(ph * 2) * 1.2 : Math.sin(t * 2) * 0.6;
  const hx = o.sleep ? 2 : 0;
  ctx.save();
  ctx.translate(hx, hy);
  const ef = pose === 'hurt' ? 1 : 0;
  shape(ctx, [[9, -41], [10 - ef * 6, -55 + ef * 8], [17, -43]], { fill: fur.body, rng, lw: 2.2, step: 6, wash: false });
  shape(ctx, [[11, -44], [11.5 - ef * 5, -51 + ef * 6], [15, -44]], { fill: fur.dark, stroke: null, rng, step: 6, wash: false });
  shape(ctx, ellipse(17, -34, 11.5, 10.5, 14), { fill: fur.body, rng, lw: 2.6 });
  shape(ctx, ellipse(26, -30.5, 8.5, 5.2, 12, 0.1), { fill: fur.belly, rng, lw: 2.2, wash: false });
  shape(ctx, [[16, -43], [22 - ef * 6, -56 + ef * 8], [25, -40]], { fill: fur.body, rng, lw: 2.2, step: 6, wash: false });
  shape(ctx, [[18.5, -44], [22 - ef * 5, -52 + ef * 6], [23.5, -42]], { fill: fur.dark, stroke: null, rng, step: 6, wash: false });
  dot(ctx, 34, -32.5, 2.8, INK);
  const blink = o.blink || Math.sin(t * 0.9 + (o.seed || 0)) > 0.985;
  if (pose === 'hurt' || o.sleep) line(ctx, [[17.5, -37.5], [21, -35.5], [24.5, -37.5]], { lw: 2, rng, wob: 0.3 });
  else if (blink) line(ctx, [[18, -36.5], [24, -36.5]], { lw: 2.2, rng, wob: 0.3 });
  else {
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(21, -37, 2.3, 3.1, 0, 0, 7); ctx.fill();
    dot(ctx, 21.8, -38.3, 0.9, '#fff');
  }
  if (of.cheeks) { ctx.fillStyle = 'rgba(240,110,125,0.45)'; ctx.beginPath(); ctx.ellipse(20, -30, 3.6, 2.3, 0, 0, 7); ctx.fill(); }
  if (of.glasses) {
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(21, -37, 5, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(26, -37); ctx.lineTo(29, -35); ctx.moveTo(16, -37); ctx.lineTo(11, -38); ctx.stroke();
  }
  if (of.hat) drawHat(ctx, of.hat, rng);
  ctx.restore();

  drawScarf(ctx, of.scarf || 'plain', o.scarfColor || '#efe2c8', t, Math.abs(o.speed || 0), rng, o.sleep);
  ctx.restore();
}

function drawScarf(ctx, pattern, color, t, speed, rng, sleep) {
  const k = Math.min(1, speed / 260);
  const f = Math.sin(t * 14) * 2.5 * k;
  const hang = [[6, -28], [3, -21], [1, -14], [5, -14], [7, -21], [9, -25]];
  const fly = [[6, -29], [-6, -28 + f], [-15, -26 + f * 1.6], [-14, -21 + f * 1.6], [-5, -23 + f], [7, -24]];
  const tail = sleep ? hang.map(([a, b]) => [a, b + 10]) : hang.map((p, i) => [lerp(p[0], fly[i][0], k), lerp(p[1], fly[i][1], k)]);
  const band = sleep ? [[5, -19], [19, -16], [18, -11], [4, -14]] : [[5, -31], [19, -29.5], [18, -23], [4, -24.5]];
  for (const poly of [tail, band]) {
    shape(ctx, poly, { fill: color, rng, lw: 2, wob: 0.5, step: 6, wash: false });
    if (pattern !== 'plain') {
      ctx.save();
      ctx.beginPath(); smooth(ctx, poly, true); ctx.clip();
      scarfPattern(ctx, pattern, color);
      ctx.restore();
    }
  }
}

function scarfPattern(ctx, p, color) {
  ctx.lineWidth = 2;
  if (p === 'stripes') {
    ctx.strokeStyle = shade(color, -0.3);
    for (let i = -40; i < 30; i += 6) { ctx.beginPath(); ctx.moveTo(i, -40); ctx.lineTo(i + 20, 0); ctx.stroke(); }
  } else if (p === 'dots') {
    for (let x = -20; x < 24; x += 6) for (let y = -34; y < -8; y += 6) dot(ctx, x + ((y / 6) % 2) * 3, y, 1.4, '#fffaf0');
  } else if (p === 'checks') {
    ctx.strokeStyle = shade(color, -0.25); ctx.globalAlpha = 0.7;
    for (let i = -20; i < 24; i += 5) { ctx.beginPath(); ctx.moveTo(i, -40); ctx.lineTo(i, 0); ctx.stroke(); }
    for (let j = -36; j < 0; j += 5) { ctx.beginPath(); ctx.moveTo(-24, j); ctx.lineTo(24, j); ctx.stroke(); }
    ctx.globalAlpha = 1;
  } else if (p === 'stars') {
    ctx.fillStyle = '#fff6c8';
    for (let x = -18; x < 24; x += 8) for (let y = -32; y < -8; y += 7) star(ctx, x + (y % 2) * 3, y, 2.4);
  } else if (p === 'leaves') {
    ctx.fillStyle = '#5f9e46';
    for (let x = -18; x < 24; x += 7) for (let y = -32; y < -8; y += 7) {
      ctx.beginPath(); ctx.ellipse(x, y, 2.8, 1.4, 0.7, 0, 7); ctx.fill();
    }
  }
}
function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, rr = i % 2 ? r * 0.4 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.fill();
}

export function drawHat(ctx, id, rng) {
  if (id === 'acorn') {
    shape(ctx, ellipse(17, -44, 10.5, 6, 14), { fill: '#8a5a33', rng, lw: 2.2 });
    line(ctx, [[10, -44], [24, -44]], { rng, lw: 1.2, stroke: '#5b3a1f' });
    line(ctx, [[12, -47], [22, -47]], { rng, lw: 1.2, stroke: '#5b3a1f' });
    shape(ctx, rrect(16, -54, 3, 7, 1.5), { fill: '#6b4426', rng, lw: 1.6, wash: false });
  } else if (id === 'crown') {
    const cols = ['#f4a3bf', '#fffaf0', '#f8d96b', '#f4a3bf', '#cfe9ff'];
    for (let i = 0; i < 5; i++) {
      const fx = 7 + i * 5.2, fy = -45 - Math.sin((i / 4) * Math.PI) * 4;
      for (let a = 0; a < 5; a++) dot(ctx, fx + Math.cos(a * 1.26) * 2.6, fy + Math.sin(a * 1.26) * 2.6, 2.1, cols[i]);
      dot(ctx, fx, fy, 1.4, '#e8a33d');
    }
    shape(ctx, ellipse(4, -43, 4, 2, 8, 0.4), { fill: '#6fae58', rng, lw: 1.2, wash: false });
  } else if (id === 'earmuffs') {
    line(ctx, [[9, -40], [12, -50], [22, -51], [26, -41]], { rng, lw: 3.4, stroke: '#7b8db0' });
    shape(ctx, ellipse(10, -38, 6, 7, 12), { fill: '#f3f6fb', rng, lw: 2 });
    shape(ctx, ellipse(25, -39, 5.5, 6.5, 12), { fill: '#f3f6fb', rng, lw: 2 });
  } else if (id === 'bobble') {
    shape(ctx, [[6, -40], [8, -50], [17, -54], [26, -49], [28, -40]], { fill: '#d9534f', rng, lw: 2.2 });
    shape(ctx, rrect(5, -44, 24, 6, 3), { fill: '#f3e3d0', rng, lw: 1.8, wash: false });
    shape(ctx, ellipse(17, -57, 4.5, 4.5, 10), { fill: '#f3e3d0', rng, lw: 1.8, wash: false });
  } else if (id === 'straw') {
    shape(ctx, ellipse(17, -43, 18, 3.8, 18), { fill: '#e8c56f', rng, lw: 2 });
    shape(ctx, ellipse(17, -48, 9.5, 6.5, 14), { fill: '#e8c56f', rng, lw: 2 });
    line(ctx, [[8, -45], [26, -45]], { rng, stroke: '#c94b4b', lw: 2.6 });
  } else if (id === 'beret') {
    shape(ctx, ellipse(15, -46, 12.5, 4.8, 14, -0.15), { fill: '#6fae5a', rng, lw: 2 });
    line(ctx, [[15, -51], [17, -55]], { rng, lw: 2 });
  } else if (id === 'sunhat') {
    shape(ctx, ellipse(17, -43, 21, 5, 18), { fill: '#f2d27a', rng, lw: 2 });
    shape(ctx, ellipse(17, -49, 9.5, 7, 14), { fill: '#f2d27a', rng, lw: 2 });
    line(ctx, [[8, -45], [26, -45]], { rng, stroke: '#5aa86a', lw: 2.6 });
    dot(ctx, 25, -47, 3, '#f28a5a'); dot(ctx, 25, -47, 1.2, '#f6d040');
  } else if (id === 'keeper') {
    shape(ctx, ellipse(17, -46, 10.5, 5.5, 14), { fill: '#3d4a7a', rng, lw: 2 });
    shape(ctx, rrect(21, -45, 14, 3.5, 1.5), { fill: '#2b345a', rng, lw: 1.6, wash: false });
    dot(ctx, 17, -47, 2, '#f2c14e');
  }
}
