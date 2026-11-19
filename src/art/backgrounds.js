// Parallax backgrounds: sky, clouds, hills, and district scenery drawn on the fly.
import { W, H } from '../core/engine.js';
import { shape, line, ellipse, rrect, rngFor, dot } from './ink.js';
import { hash2, shade } from '../core/util.js';

export function drawBackground(ctx, pal, camX, camY, maxCamY, time, boil) {
  if (pal.theme === 'oak' || pal.theme === 'clockwork') { interior(ctx, pal, camX, camY, time, boil); return; }
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
    } else if (th === 'green' || th === 'greenboss') {
      if (((i % 5) + 5) % 5 === 2) glasshouse(ctx, x, base, pal, rng);
      else if (r < 0.5) palm(ctx, x, base, pal, rng, r);
      else cactusPot(ctx, x, base, pal, rng, r);
    } else if (th === 'oakroots') {
      const k = ((i % 3) + 3) % 3;
      if (k === 0) rootArch(ctx, x, base, pal, rng, r);
      else if (k === 1) toadstool(ctx, x, base, pal, rng, r);
      else tree(ctx, x, base, { ...pal, blossom: r > 0.5 ? '#e0783a' : '#f7c2d2' }, rng, r);
    } else if (th === 'almanac') {
      const k = ((i % 4) + 4) % 4;
      if (k === 0) tree(ctx, x, base, pal, rng, r);
      else if (k === 1) pine(ctx, x, base, { ...pal, leaf: '#7d9a8c', grass: '#eef3f9' }, rng, r);
      else if (k === 2) appleTree(ctx, x, base, { ...pal, leaf: '#d9662b', flower2: '#f2c14e' }, rng, r);
      else sunflower(ctx, x, base, pal, rng, r);
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

function glasshouse(ctx, x, base, pal, rng) {
  ctx.save(); ctx.globalAlpha = 0.85;
  shape(ctx, [[x - 70, base + 30], [x - 70, base - 70], [x, base - 130], [x + 70, base - 70], [x + 70, base + 30]], { fill: pal.glass, rng, lw: 2.4, step: 20 });
  ctx.restore();
  for (const dx of [-35, 0, 35]) line(ctx, [[x + dx, base + 30], [x + dx, base - (dx === 0 ? 128 : 100)]], { rng, lw: 2, stroke: pal.woodDark });
  line(ctx, [[x - 70, base - 30], [x + 70, base - 30]], { rng, lw: 2, stroke: pal.woodDark });
  line(ctx, [[x - 50, base - 20], [x - 40, base - 60], [x - 30, base - 40]], { rng, lw: 3, stroke: pal.leaf });
  dot(ctx, x + 30, base - 50, 6, pal.flower1);
  ctx.save(); ctx.globalAlpha = 0.6; line(ctx, [[x - 50, base - 80], [x - 20, base - 110]], { rng, lw: 4, stroke: '#ffffff' }); ctx.restore();
}
function palm(ctx, x, base, pal, rng, r) {
  const h = 100 + r * 50;
  shape(ctx, [[x - 22, base + 20], [x - 18, base - 10], [x + 18, base - 10], [x + 22, base + 20]], { fill: pal.dirt, rng, lw: 2.2 });
  line(ctx, [[x, base - 10], [x + 4, base - h * 0.5], [x - 2, base - h]], { rng, stroke: pal.trunk, lw: 6 });
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k - 2) * 0.6;
    const ex = x - 2 + Math.cos(a) * 60, ey = base - h + Math.sin(a) * 30 + 26;
    shape(ctx, [[x - 2, base - h], [(x + ex) / 2, Math.min(base - h, ey) - 14], [ex, ey], [(x + ex) / 2, ey - 2]], { fill: pal.leaf, rng, lw: 2, step: 12 });
  }
}
function cactusPot(ctx, x, base, pal, rng, r) {
  shape(ctx, [[x - 20, base + 20], [x - 16, base - 14], [x + 16, base - 14], [x + 20, base + 20]], { fill: pal.dirt, rng, lw: 2.2 });
  const h = 50 + r * 40;
  shape(ctx, rrect(x - 10, base - 14 - h, 20, h, 10), { fill: '#6faa5a', rng, lw: 2.2 });
  shape(ctx, rrect(x + 10, base - 14 - h * 0.7, 18, 10, 5), { fill: '#6faa5a', rng, lw: 2 });
  shape(ctx, rrect(x + 18, base - 14 - h * 0.95, 10, 26, 5), { fill: '#6faa5a', rng, lw: 2 });
  dot(ctx, x, base - 16 - h, 5, pal.flower1);
}
function sunflower(ctx, x, base, pal, rng, r) {
  const h = 90 + r * 50;
  line(ctx, [[x, base + 20], [x + 5, base - h * 0.5], [x, base - h]], { rng, stroke: pal.grassDark, lw: 4 });
  shape(ctx, ellipse(x + 14, base - h * 0.4, 14, 6, 10, -0.5), { fill: pal.leaf, rng, lw: 1.8 });
  for (let a = 0; a < 10; a++) {
    const ang = (a / 10) * Math.PI * 2;
    shape(ctx, ellipse(x + Math.cos(ang) * 16, base - h + Math.sin(ang) * 16, 9, 5, 8, ang), { fill: '#f6c445', rng, lw: 1.6 });
  }
  shape(ctx, ellipse(x, base - h, 11, 11, 12), { fill: '#7a5230', rng, lw: 1.8 });
}

// ---------- the Hollow Oak ----------
function rootArch(ctx, x, base, pal, rng, r) {
  const w = 120 + r * 60;
  shape(ctx, [[x - w / 2, base + 30], [x - w / 2 + 10, base - 50], [x - 10, base - 110 - r * 30], [x + 20, base - 112 - r * 30], [x + w / 2 - 6, base - 40], [x + w / 2, base + 30],
    [x + w / 2 - 22, base + 30], [x + w / 2 - 30, base - 30], [x + 12, base - 86 - r * 30], [x - 6, base - 84 - r * 30], [x - w / 2 + 32, base - 36], [x - w / 2 + 24, base + 30]], { fill: pal.trunk, rng, lw: 2.2, step: 18 });
  for (let k = 0; k < 3; k++) dot(ctx, x - 30 + k * 30, base - 70 - r * 20 + (k % 2) * 16, 3, '#f6e08a');
}
function toadstool(ctx, x, base, pal, rng, r) {
  const h = 40 + r * 50;
  shape(ctx, rrect(x - 8, base - h, 16, h + 20, 6), { fill: '#f3e7d2', rng, lw: 2 });
  shape(ctx, [[x - 36 - r * 10, base - h + 6], [x - 26, base - h - 22], [x, base - h - 32], [x + 26, base - h - 22], [x + 36 + r * 10, base - h + 6]], { fill: r > 0.5 ? '#c9473d' : '#8a6fb0', rng, lw: 2.2, step: 12 });
  for (let k = 0; k < 4; k++) dot(ctx, x - 22 + k * 15, base - h - 10 - (k % 2) * 10, 3.5, '#fffaf0');
}
// Inside the oak: wood grain and knots, with glowing fungi in the heartwood and big brass gears in the clock chamber.
function interior(ctx, pal, camX, camY, time, boil) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal.sky1); g.addColorStop(1, pal.sky2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const gx = camX * 0.15, gy = camY * 0.15;
  ctx.save(); ctx.globalAlpha = 0.4;
  for (let i = Math.floor(gx / 70) - 1; i <= Math.floor((gx + W) / 70) + 1; i++) {
    const x = i * 70 - gx + hash2(i, 9) * 30, pts = [];
    for (let y = -60; y <= H + 60; y += 60) pts.push([x + Math.sin((y + gy) * 0.012 + i) * 14, y]);
    line(ctx, pts, { rng: rngFor(i * 7 + 3, boil), stroke: pal.far, lw: 3, wob: 1, step: 30 });
  }
  ctx.restore();
  const span = 300, kx = camX * 0.3, ky = camY * 0.3;
  for (let i = Math.floor(kx / span) - 1; i <= Math.floor((kx + W) / span) + 1; i++) {
    for (let j = Math.floor(ky / span) - 1; j <= Math.floor((ky + H) / span) + 1; j++) {
      const h = hash2(i, j, 4);
      const x = i * span - kx + h * 160, y = j * span - ky + hash2(j, i, 5) * 160;
      const rng = rngFor(i * 31 + j * 17, boil);
      if (pal.theme === 'clockwork') {
        if (h < 0.25) continue;
        gear(ctx, x, y, 34 + h * 50, Math.round(8 + h * 8), time * (0.4 + h * 0.5) * (((i + j) & 1) ? 1 : -1), pal, rng, 0.4);
      } else if (h > 0.5) {
        ctx.save(); ctx.globalAlpha = 0.5;
        for (let k = 0; k < 3; k++) shape(ctx, ellipse(x, y, 16 + k * 14, 26 + k * 20, 16), { stroke: pal.near, lw: 2, rng, wash: false });
        ctx.restore();
      } else {
        // a shelf of glowing fungus
        ctx.save(); ctx.globalAlpha = 0.25 + Math.sin(time * 1.5 + i + j) * 0.08; dot(ctx, x, y, 46, '#ffe9a0'); ctx.restore();
        for (let k = 0; k < 3; k++) shape(ctx, ellipse(x - 20 + k * 20, y + (k % 2) * 8, 16, 7, 12), { fill: '#f2d38a', rng, lw: 1.8 });
      }
    }
  }
  // soft light coming down from a knot-hole above
  ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff2c4';
  const lx = 600 - camX * 0.1;
  ctx.beginPath(); ctx.moveTo(lx - 30, 0); ctx.lineTo(lx + 30, 0); ctx.lineTo(lx + 180, H); ctx.lineTo(lx + 40, H); ctx.closePath(); ctx.fill();
  ctx.restore();
}
export function gear(ctx, x, y, R, n, rot, pal, rng, alpha = 0.75) {
  const pts = [];
  for (let k = 0; k < n * 2; k++) {
    const a = rot + (k / (n * 2)) * Math.PI * 2, rr = k % 2 ? R - 10 : R;
    pts.push([x + Math.cos(a - 0.08) * rr, y + Math.sin(a - 0.08) * rr], [x + Math.cos(a + 0.08) * rr, y + Math.sin(a + 0.08) * rr]);
  }
  ctx.save(); ctx.globalAlpha = alpha;
  shape(ctx, pts, { fill: pal.near, rng, lw: 2.2, wob: 0.6, step: 400 });
  shape(ctx, ellipse(x, y, R * 0.55, R * 0.55, 16), { fill: shade(pal.near, -0.15), rng, lw: 1.8, wash: false });
  for (let k = 0; k < 4; k++) {
    const a = rot + k * Math.PI / 2;
    line(ctx, [[x, y], [x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.55]], { rng, lw: 3, stroke: shade(pal.near, -0.35) });
  }
  dot(ctx, x, y, 6, shade(pal.near, -0.4));
  ctx.restore();
}
