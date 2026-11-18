// Parallax backgrounds: sky, clouds, hills, and district scenery drawn on the fly.
import { W, H } from '../core/engine.js';
import { shape, line, ellipse, rrect, rngFor, dot } from './ink.js';
import { hash2, shade } from '../core/util.js';

export function drawBackground(ctx, pal, camX, camY, maxCamY, time, boil) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal.sky1);
  g.addColorStop(1, pal.sky2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const dy = (p) => (maxCamY - camY) * p;

  // sun
  ctx.save();
  ctx.globalAlpha = 0.85;
  const sx = 760 - camX * 0.02, sy = 90 + dy(0.05);
  const sg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 90);
  sg.addColorStop(0, pal.sun); sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg; ctx.fillRect(sx - 90, sy - 90, 180, 180);
  ctx.restore();
  shape(ctx, ellipse(sx, sy, 34, 34, 18), { fill: pal.sun, rng: rngFor(3, boil), lw: 2, wob: 0.8, stroke: shade(pal.sun, -0.3) });

  // clouds
  const cp = 0.08, span = 380;
  const off = camX * cp + time * 8;
  for (let i = Math.floor(off / span) - 1; i <= Math.floor((off + W) / span) + 1; i++) {
    const r = hash2(i, 7);
    const x = i * span - off + r * 120;
    const y = 50 + r * 90 + dy(0.06);
    const rng = rngFor(i * 31, boil);
    shape(ctx, [...ellipse(x, y, 46, 16, 14)], { fill: pal.cloud, rng, lw: 2, wob: 1, stroke: shade(pal.cloud, -0.25), wash: false });
    shape(ctx, ellipse(x - 18, y - 9, 24, 15, 12), { fill: pal.cloud, rng, lw: 2, wob: 1, stroke: null, wash: false });
    shape(ctx, ellipse(x + 14, y - 12, 20, 13, 12), { fill: pal.cloud, rng, lw: 2, wob: 1, stroke: null, wash: false });
  }

  hills(ctx, pal.far, camX * 0.18, 330 + dy(0.15), 34, 0.0042, boil, 11);
  scenery(ctx, pal, camX * 0.35, 400 + dy(0.3), boil);
  hills(ctx, pal.near, camX * 0.55, 440 + dy(0.45), 22, 0.007, boil, 23);
}

function hills(ctx, color, ox, base, amp, freq, boil, seed) {
  const pts = [];
  for (let x = -20; x <= W + 20; x += 24) {
    const wx = x + ox;
    pts.push([x, base - Math.sin(wx * freq + seed) * amp - Math.sin(wx * freq * 2.7 + seed * 2) * amp * 0.45]);
  }
  const poly = [...pts, [W + 20, H + 10], [-20, H + 10]];
  const rng = rngFor(seed, boil);
  shape(ctx, poly, { fill: color, stroke: null, rng, wob: 0.8, wash: false, step: 40 });
  ctx.globalAlpha = 0.55;
  line(ctx, pts, { rng, lw: 2, stroke: shade(color, -0.35), wob: 0.8, step: 40 });
  ctx.globalAlpha = 1;
}

function scenery(ctx, pal, off, base, boil) {
  const span = 230;
  for (let i = Math.floor(off / span) - 1; i <= Math.floor((off + W) / span) + 1; i++) {
    const r = hash2(i, 3, pal.theme === 'square' ? 1 : 2);
    const x = i * span - off + r * 60;
    const rng = rngFor(i * 17 + 5, boil);
    const th = pal.theme;
    if (th === 'square') {
      if (((i % 7) + 7) % 7 === 3) clockTower(ctx, x, base, pal, rng);
      else house(ctx, x, base, pal, rng, r);
    } else if (th === 'pond' || th === 'pondboss') {
      if (((i % 6) + 6) % 6 === 2) mill(ctx, x, base, pal, rng);
      else if (r < 0.55) pine(ctx, x, base, pal, rng, r);
      else reeds(ctx, x, base, pal, rng, r);
    } else if (th === 'orchard' || th === 'orchardboss') {
      if (r < 0.6) appleTree(ctx, x, base, pal, rng, r);
      else if (r < 0.8) haystack(ctx, x, base, pal, rng);
      else fence(ctx, x, base, pal, rng);
    } else {
      if (r < 0.55) tree(ctx, x, base, pal, rng, r);
      else bigFlower(ctx, x, base, pal, rng, r);
    }
  }
}

function house(ctx, x, base, pal, rng, r) {
  const w = 70 + r * 40, h = 60 + r * 40;
  shape(ctx, rrect(x, base - h, w, h + 40, 4), { fill: r > 0.5 ? pal.house : pal.house2, rng, lw: 2, wob: 1 });
  shape(ctx, [[x - 10, base - h + 2], [x + w / 2, base - h - 40 - r * 10], [x + w + 10, base - h + 2]], { fill: pal.roof, rng, lw: 2, wob: 1 });
  if (r > 0.3) shape(ctx, rrect(x + w * 0.7, base - h - 34, 12, 24, 2), { fill: pal.stone, rng, lw: 1.8 });
  shape(ctx, rrect(x + 12, base - h + 16, 16, 18, 3), { fill: shade(pal.sun, -0.05), rng, lw: 1.8, wash: false });
  shape(ctx, rrect(x + w - 30, base - h + 16, 16, 18, 3), { fill: shade(pal.sun, -0.05), rng, lw: 1.8, wash: false });
  // vines creeping up the wall: the town is overgrown
  line(ctx, [[x + 4, base + 10], [x + 10, base - h * 0.4], [x + 4, base - h * 0.8]], { rng, stroke: pal.leaf, lw: 3 });
}

function clockTower(ctx, x, base, pal, rng) {
  shape(ctx, rrect(x, base - 190, 64, 230, 4), { fill: pal.house2, rng, lw: 2.2 });
  shape(ctx, [[x - 10, base - 188], [x + 32, base - 250], [x + 74, base - 188]], { fill: pal.roof, rng, lw: 2.2 });
  shape(ctx, ellipse(x + 32, base - 150, 22, 22, 16), { fill: '#fffaf0', rng, lw: 2.2, wash: false });
  line(ctx, [[x + 32, base - 150], [x + 32, base - 164]], { rng, lw: 2.2 });
  line(ctx, [[x + 32, base - 150], [x + 42, base - 146]], { rng, lw: 2.2 });
  line(ctx, [[x + 6, base + 20], [x + 14, base - 80], [x + 2, base - 140]], { rng, stroke: pal.leaf, lw: 3.5 });
}

function tree(ctx, x, base, pal, rng, r) {
  const h = 110 + r * 70;
  shape(ctx, [[x - 7, base + 20], [x - 5, base - h * 0.6], [x + 5, base - h * 0.6], [x + 8, base + 20]], { fill: pal.trunk, rng, lw: 2 });
  const c = pal.blossom || pal.leaf;
  shape(ctx, ellipse(x, base - h * 0.75, 48 + r * 18, 40 + r * 10, 16), { fill: r > 0.3 ? c : pal.leaf, rng, lw: 2.2, wob: 2 });
  shape(ctx, ellipse(x - 26, base - h * 0.62, 26, 22, 12), { fill: pal.leaf, rng, lw: 2, wob: 1.6 });
  for (let k = 0; k < 4; k++) dot(ctx, x - 30 + rng() * 60, base - h * 0.8 + rng() * 40, 3, pal.flower1);
}

function pine(ctx, x, base, pal, rng, r) {
  const h = 120 + r * 60;
  line(ctx, [[x, base + 20], [x, base - h * 0.3]], { rng, stroke: pal.trunk, lw: 6 });
  for (let k = 0; k < 3; k++) {
    const y = base - h * (0.25 + k * 0.25), w = 52 - k * 13;
    shape(ctx, [[x - w, y + 18], [x, y - 34], [x + w, y + 18]], { fill: pal.leaf, rng, lw: 2.2, step: 14 });
    shape(ctx, [[x - w * 0.7, y + 8], [x, y - 30], [x + w * 0.7, y + 8], [x + w * 0.3, y + 2], [x - w * 0.3, y + 4]], { fill: pal.grass, stroke: null, rng, wash: false, step: 10 });
  }
}
function reeds(ctx, x, base, pal, rng, r) {
  for (let k = 0; k < 6; k++) {
    const rx = x + k * 9 - 20, h = 50 + rng() * 40;
    line(ctx, [[rx, base + 20], [rx + 4, base - h * 0.5], [rx + 2, base - h]], { rng, stroke: pal.grassDark, lw: 3 });
    if (k % 2) shape(ctx, ellipse(rx + 2, base - h + 4, 4, 12, 8), { fill: pal.trunk, rng, lw: 1.6 });
  }
}
function mill(ctx, x, base, pal, rng) {
  shape(ctx, [[x, base + 30], [x + 6, base - 110], [x + 80, base - 110], [x + 86, base + 30]], { fill: pal.house2, rng, lw: 2.2 });
  shape(ctx, [[x - 8, base - 106], [x + 43, base - 160], [x + 94, base - 106]], { fill: pal.roof, rng, lw: 2.2 });
  shape(ctx, [[x - 4, base - 112], [x + 43, base - 156], [x + 90, base - 112]], { fill: pal.grass, stroke: null, rng, wash: false });
  const cx = x + 112, cy = base - 30;
  shape(ctx, ellipse(cx, cy, 46, 46, 22), { stroke: pal.woodDark, lw: 5, rng });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    line(ctx, [[cx, cy], [cx + Math.cos(a) * 46, cy + Math.sin(a) * 46]], { rng, stroke: pal.wood, lw: 4 });
  }
}
function appleTree(ctx, x, base, pal, rng, r) {
  const h = 100 + r * 60;
  shape(ctx, [[x - 8, base + 20], [x - 5, base - h * 0.55], [x + 5, base - h * 0.55], [x + 9, base + 20]], { fill: pal.trunk, rng, lw: 2 });
  shape(ctx, ellipse(x, base - h * 0.72, 54, 42, 18), { fill: r > 0.3 ? pal.leaf : pal.flower2, rng, lw: 2.2, wob: 2 });
  shape(ctx, ellipse(x + 28, base - h * 0.6, 26, 20, 12), { fill: pal.flower2, rng, lw: 2, wob: 1.6 });
  for (let k = 0; k < 5; k++) dot(ctx, x - 34 + rng() * 68, base - h * 0.8 + rng() * 40, 4, '#c9473d');
}
function haystack(ctx, x, base, pal, rng) {
  shape(ctx, [[x - 40, base + 20], [x - 34, base - 20], [x, base - 52], [x + 34, base - 20], [x + 40, base + 20]], { fill: pal.flower2, rng, lw: 2.2, step: 14 });
  for (let k = 0; k < 4; k++) line(ctx, [[x - 24 + k * 14, base - 10], [x - 20 + k * 14, base - 30]], { rng, stroke: shade(pal.flower2, -0.3), lw: 1.6 });
}
function fence(ctx, x, base, pal, rng) {
  for (let k = 0; k < 4; k++) shape(ctx, rrect(x + k * 22 - 40, base - 40, 8, 60, 2), { fill: pal.wood, rng, lw: 1.8 });
  line(ctx, [[x - 46, base - 28], [x + 46, base - 30]], { rng, stroke: pal.woodDark, lw: 4 });
  line(ctx, [[x - 46, base - 10], [x + 46, base - 12]], { rng, stroke: pal.woodDark, lw: 4 });
}

function bigFlower(ctx, x, base, pal, rng, r) {
  const h = 70 + r * 50;
  line(ctx, [[x, base + 20], [x + 6, base - h * 0.5], [x, base - h]], { rng, stroke: pal.grassDark, lw: 4 });
  shape(ctx, ellipse(x + 14, base - h * 0.45, 14, 6, 10, -0.5), { fill: pal.leaf, rng, lw: 1.8 });
  const c = r > 0.75 ? pal.flower2 : pal.flower1;
  for (let a = 0; a < 6; a++) {
    const ang = (a / 6) * Math.PI * 2;
    shape(ctx, ellipse(x + Math.cos(ang) * 14, base - h + Math.sin(ang) * 14, 11, 8, 10, ang), { fill: c, rng, lw: 1.8, wob: 0.8 });
  }
  shape(ctx, ellipse(x, base - h, 9, 9, 10), { fill: shade(pal.flower2, -0.1), rng, lw: 1.8 });
}
