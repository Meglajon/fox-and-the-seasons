// Level tiles, drawn once per look and cached as little canvases.
import { engine } from '../core/engine.js';
import { shape, line, ellipse, rrect, rngFor, dot, INK } from './ink.js';
import { shade } from '../core/util.js';
import { drawSeasonIcon } from './critters.js';
import { SEASON_COLOR } from './palettes.js';

export const T = 48;
const PAD = 10;
const cache = new Map();
engine.onRescale.push(() => cache.clear());

export function drawTile(ctx, ch, px, py, mask, v, pal, boil) {
  const key = ch + mask + '|' + v + '|' + pal.key + '|' + boil;
  let c = cache.get(key);
  if (!c) {
    if (cache.size > 1800) cache.clear();
    c = document.createElement('canvas');
    const k = engine.k;
    c.width = c.height = Math.ceil((T + PAD * 2) * k);
    const x = c.getContext('2d');
    x.scale(k, k);
    x.translate(PAD, PAD);
    paint(x, ch, mask, v, pal, rngFor(v * 131 + ch.charCodeAt(0) * 7 + mask * 3, boil));
    cache.set(key, c);
  }
  ctx.drawImage(c, px - PAD, py - PAD, T + PAD * 2, T + PAD * 2);
}

function paint(x, ch, mask, v, pal, rng) {
  if (ch === '#') ground(x, mask, v, pal, rng);
  else if (ch === 'r') stone(x, mask, v, pal, rng);
  else if (ch === '=') plank(x, pal, rng);
  else if (ch === '?') crate(x, pal, rng, 'acorn');
  else if (ch === 'L') crate(x, pal, rng, 'berry');
  else if (ch === 'u') crate(x, pal, rng, null);
  else if (ch === 'b') bramble(x, v, pal, rng);
  else if (ch === '~') water(x, mask, v, pal, rng, false);
  else if (ch === 'R') water(x, mask, v, pal, rng, true);
  else if (ch === 'I') ice(x, mask, v, pal, rng);
  else if (ch === 'w') waterfall(x, v, pal, rng);
  else if (ch === 'Y') frozenFall(x, v, pal, rng);
  else if (ch === 'i') floe(x, v, pal, rng, false);
  else if (ch === 'k') floe(x, v, pal, rng, true);
  else if (ch === 'p') pileGhost(x, v, pal, rng);
  else if (ch === 'P') pile(x, mask, v, pal, rng);
  else if (ch === '%') mud(x, mask, v, pal, rng);
  else if (ch === 'D') driedMud(x, mask, v, pal, rng);
  else if (ch === 'j') iceWall(x, v, pal, rng);
  else if (ch === 'J') meltedWall(x, v, pal, rng);
  else if (ch === '1' || ch === '2') beatBlock(x, ch, pal, rng);
  else if (BLOCK_SEASON[ch]) seasonBlock(x, BLOCK_SEASON[ch], rng);
}

// The finale's clockwork blocks. '1' (tick) is solid on beats 1-2 of every bar, '2' (tock) on beats 3-4.
// '5'-'8' are season blocks: solid in their own season of the clock, or near Fennel's matching season.
export const BLOCK_SEASON = { 5: 'spring', 6: 'summer', 7: 'autumn', 8: 'winter' };
function beatBlock(x, ch, pal, rng) {
  const tick = ch === '1';
  const fill = tick ? '#e9b949' : '#6fb9b1';
  shape(x, rrect(2, 2, T - 4, T - 4, 8), { fill, rng, lw: 2.6, wob: 0.6 });
  shape(x, rrect(7, 7, T - 14, T - 14, 5), { stroke: shade(fill, -0.35), lw: 1.5, rng, wob: 0.4, wash: false });
  if (tick) dot(x, T / 2, T / 2, 6, shade(fill, -0.45));
  else { dot(x, T / 2 - 8, T / 2, 5, shade(fill, -0.45)); dot(x, T / 2 + 8, T / 2, 5, shade(fill, -0.45)); }
  x.fillStyle = '#ffffff'; x.globalAlpha = 0.45; x.fillRect(9, 6, T - 22, 3); x.globalAlpha = 1;
}
function seasonBlock(x, season, rng) {
  const fill = shade(SEASON_COLOR[season], 0.25);
  shape(x, rrect(2, 2, T - 4, T - 4, 10), { fill, rng, lw: 2.6, wob: 0.7 });
  drawSeasonIcon(x, T / 2, T / 2, season, 12, shade(SEASON_COLOR[season], -0.45));
  x.fillStyle = '#ffffff'; x.globalAlpha = 0.5; x.fillRect(10, 6, T - 24, 3); x.globalAlpha = 1;
}

// Mud: thick and sticky (you sink). Summer bakes it into cracked, solid earth.
function mud(x, mask, v, pal, rng) {
  const top = !(mask & 1);
  x.fillStyle = pal.mud;
  x.fillRect(-0.6, top ? 10 : -0.6, T + 1.2, T + 1.2 - (top ? 10 : 0));
  x.fillStyle = pal.mudDark; x.globalAlpha = 0.6;
  for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(6 + rng() * 36, (top ? 22 : 8) + rng() * 22, 4 + rng() * 3, 2, 0, 0, 7); x.fill(); }
  x.globalAlpha = 1;
  if (top) {
    const pts = [];
    for (let i = 0; i <= 6; i++) pts.push([-1 + (i * (T + 2)) / 6, 10 + Math.sin(i * 1.3 + v * 2) * 2]);
    line(x, pts, { rng, lw: 2.4, stroke: pal.mudDark, wob: 0.6, step: 20 });
    shape(x, ellipse(14 + v * 8, 14, 5, 3, 10), { stroke: pal.mudDark, lw: 1.6, rng, wash: false });
  }
}
function driedMud(x, mask, v, pal, rng) {
  const top = !(mask & 1);
  x.fillStyle = shade(pal.mud, 0.35);
  x.fillRect(-0.6, top ? 6 : -0.6, T + 1.2, T + 1.2 - (top ? 6 : 0));
  if (top) line(x, [[-1, 6], [T + 1, 6]], { rng, lw: 2.4, wob: 0.5 });
  const c = shade(pal.mud, -0.1);
  line(x, [[6, top ? 8 : 0], [14, 20], [10, 34], [18, 46]], { rng, stroke: c, lw: 1.6, wob: 0.4 });
  line(x, [[30, top ? 8 : 0], [26, 18], [36, 30], [32, 46]], { rng, stroke: c, lw: 1.6, wob: 0.4 });
  line(x, [[14, 20], [26, 18]], { rng, stroke: c, lw: 1.4, wob: 0.4 });
}
// Ice wall: a solid block of ice. Summer melts it away.
function iceWall(x, v, pal, rng) {
  shape(x, rrect(1, 1, T - 2, T - 2, 5), { fill: pal.ice, rng, lw: 2.4, stroke: pal.iceDark, wob: 0.6 });
  x.fillStyle = '#ffffff'; x.globalAlpha = 0.7;
  x.beginPath(); x.moveTo(8, 8 + v * 3); x.lineTo(20, 6); x.lineTo(10, 22); x.closePath(); x.fill();
  x.globalAlpha = 1;
  line(x, [[30, 12], [36, 24], [32, 36]], { rng, stroke: pal.iceDark, lw: 1.4, wob: 0.4 });
}
function meltedWall(x, v, pal, rng) {
  x.save(); x.globalAlpha = 0.4; x.setLineDash([4, 6]);
  shape(x, rrect(3, 3, T - 6, T - 6, 6), { stroke: pal.iceDark, lw: 1.8, rng, wob: 0.5, wash: false });
  x.restore();
  x.fillStyle = pal.water; x.globalAlpha = 0.5;
  x.beginPath(); x.ellipse(24, T - 3, 16, 3, 0, 0, 7); x.fill();
  x.globalAlpha = 1;
}

// Water: mask bit 1 = more water above (so no surface ripple on this tile).
function water(x, mask, v, pal, rng, rapids) {
  const top = !(mask & 1);
  x.fillStyle = rapids ? pal.waterDark : pal.water;
  x.globalAlpha = 0.92;
  x.fillRect(-0.6, top ? 8 : -0.6, T + 1.2, T + 1.2 - (top ? 8 : 0));
  x.globalAlpha = 1;
  x.strokeStyle = shade(pal.water, 0.45); x.lineWidth = 1.6; x.lineCap = 'round';
  for (let i = 0; i < (rapids ? 4 : 2); i++) {
    const yy = (top ? 18 : 6) + rng() * 26, xx = rng() * 30;
    x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + (rapids ? 18 : 10), yy); x.stroke();
  }
  if (top) {
    const pts = [];
    for (let i = 0; i <= 6; i++) pts.push([-1 + (i * (T + 2)) / 6, 8 + Math.sin(i * 1.6 + v * 2) * (rapids ? 3 : 2)]);
    line(x, pts, { rng, lw: 2.2, stroke: pal.waterDark, wob: 0.6, step: 20 });
    if (rapids) for (let i = 0; i < 3; i++) dot(x, 6 + rng() * 36, 6 + rng() * 4, 2.2, '#ffffff');
  }
}

function ice(x, mask, v, pal, rng) {
  const top = !(mask & 1);
  x.fillStyle = pal.ice; x.fillRect(-0.6, -0.6, T + 1.2, T + 1.2);
  x.fillStyle = shade(pal.ice, 0.5); x.globalAlpha = 0.8;
  x.beginPath(); x.moveTo(6, 10 + v * 3); x.lineTo(20, 6); x.lineTo(14, 22); x.closePath(); x.fill();
  x.globalAlpha = 1;
  line(x, [[26 + rng() * 6, 14], [32, 26], [40, 30]], { rng, stroke: pal.iceDark, lw: 1.4, wob: 0.4 });
  if (top) line(x, [[-1, 0], [T + 1, 0]], { rng, lw: 2.4, stroke: pal.iceDark, wob: 0.6 });
}

function waterfall(x, v, pal, rng) {
  x.globalAlpha = 0.75; x.fillStyle = pal.water; x.fillRect(6, -0.6, T - 12, T + 1.2); x.globalAlpha = 1;
  x.strokeStyle = '#ffffff'; x.lineWidth = 2; x.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const xx = 10 + i * 12 + rng() * 4, y0 = rng() * 20;
    x.beginPath(); x.moveTo(xx, y0); x.lineTo(xx, y0 + 18 + rng() * 10); x.stroke();
  }
}

function frozenFall(x, v, pal, rng) {
  shape(x, [[4, -1], [T - 4, -1], [T - 2, T + 1], [2, T + 1]], { fill: pal.ice, rng, lw: 2.2, wob: 0.6, stroke: pal.iceDark });
  for (let i = 0; i < 2; i++) line(x, [[12 + i * 18, 4], [10 + i * 18, 40]], { rng, stroke: '#ffffff', lw: 2.2 });
  shape(x, [[8, T - 2], [12, T + 8], [16, T - 2]], { fill: pal.ice, rng, lw: 1.4, step: 6, stroke: pal.iceDark });
}

// Cracking ice floe: a slab you can stand on (cracks unless Winter keeps it frozen).
function floe(x, v, pal, rng, cracked) {
  x.fillStyle = pal.waterDark; x.globalAlpha = 0.92; x.fillRect(-0.6, 12, T + 1.2, T - 11.4); x.globalAlpha = 1;
  shape(x, rrect(1, 2, T - 2, 18, 6), { fill: pal.ice, rng, lw: 2.4, stroke: pal.iceDark, wob: 0.7 });
  dot(x, 12 + v * 6, 9, 2.4, '#ffffff');
  if (cracked) {
    line(x, [[8, 4], [18, 12], [14, 20]], { rng, lw: 1.8 });
    line(x, [[30, 3], [26, 11], [36, 19]], { rng, lw: 1.8 });
  }
}

function pileGhost(x, v, pal, rng) {
  x.save(); x.globalAlpha = 0.55; x.setLineDash([5, 6]);
  shape(x, rrect(3, 3, T - 6, T - 6, 8), { stroke: pal.pile, lw: 2, rng, wob: 0.5, wash: false });
  x.restore();
  x.fillStyle = pal.pile; x.globalAlpha = 0.6;
  for (let i = 0; i < 2; i++) { x.beginPath(); x.ellipse(10 + rng() * 28, 10 + rng() * 28, 4, 2, rng() * 3, 0, 7); x.fill(); }
  x.globalAlpha = 1;
}

function pile(x, mask, v, pal, rng) {
  const top = !(mask & 1);
  x.fillStyle = shade(pal.pile, -0.15); x.fillRect(-0.6, top ? 10 : -0.6, T + 1.2, T + 1.2);
  const n = top ? 9 : 6;
  for (let i = 0; i < n; i++) {
    const cx = 4 + rng() * 40, cy = (top ? 6 : 2) + rng() * 40;
    shape(x, ellipse(cx, cy, 8, 4, 8, rng() * 3), { fill: i % 3 ? pal.pile : pal.pile2, rng, lw: 1.3, wob: 0.3, wash: false });
  }
  if (top) line(x, [[-1, 9], [12, 3], [26, 8], [38, 2], [T + 1, 8]], { rng, lw: 2.2, wob: 0.5 });
}

function ground(x, mask, v, pal, rng) {
  // "open" = no solid neighbour on that side, so the edge is visible.
  const up = !(mask & 1), right = !(mask & 2), down = !(mask & 4), left = !(mask & 8);
  x.fillStyle = pal.dirt;
  x.fillRect(-0.6, -0.6, T + 1.2, T + 1.2);
  x.fillStyle = pal.dirtDark;
  x.globalAlpha = 0.4;
  for (let i = 0; i < 4; i++) {
    x.beginPath();
    x.ellipse(5 + rng() * 38, (up ? 20 : 5) + rng() * 22, 2 + rng() * 3, 1.2 + rng() * 1.4, rng(), 0, 7);
    x.fill();
  }
  x.globalAlpha = 1;
  if (v === 1 && !up) shape(x, ellipse(12 + rng() * 22, 30 + rng() * 8, 5, 3.5, 10), { fill: pal.stone, rng, lw: 1.6, wob: 0.5 });
  if (left) line(x, [[0, up ? 10 : -1], [0, T + 1]], { rng, lw: 2.4, wob: 0.8 });
  if (right) line(x, [[T, up ? 10 : -1], [T, T + 1]], { rng, lw: 2.4, wob: 0.8 });
  if (down) line(x, [[-1, T], [T + 1, T]], { rng, lw: 2.4, wob: 0.8 });
  if (up) {
    const l0 = left ? -3 : -1, r0 = right ? T + 3 : T + 1;
    const topPts = [];
    for (let i = 0; i <= 6; i++) {
      const gx = l0 + ((r0 - l0) * i) / 6;
      const edge = (i === 0 && !left) || (i === 6 && !right);
      topPts.push([gx, edge ? -1 : -2.5 + Math.sin(i * 1.9 + v) * 1.8 + rng() * 1.5]);
    }
    const pts = [[l0, 12], ...topPts, [r0, 12]];
    for (let i = 6; i >= 0; i--) {
      const gx = l0 + ((r0 - l0) * i) / 6;
      pts.push([gx, 11 + (i % 2 ? 5 : 1) + rng() * 2.5]);
    }
    shape(x, pts, { fill: pal.grass, stroke: null, rng, wob: 0.4, wash: false, step: 30 });
    line(x, topPts, { rng, lw: 2.6, wob: 0.6, step: 30 });
    if (left) line(x, [[l0, -1], [l0 - 1, 16]], { rng, lw: 2.4, wob: 0.4 });
    if (right) line(x, [[r0, -1], [r0 + 1, 16]], { rng, lw: 2.4, wob: 0.4 });
    x.strokeStyle = pal.grassDark; x.lineWidth = 1.7; x.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const bx = 5 + rng() * 38;
      x.beginPath(); x.moveTo(bx, 8); x.lineTo(bx + (rng() - 0.5) * 4, 3 + rng() * 3); x.stroke();
    }
    if (pal.vivid && v === 2) {
      const fx = 10 + rng() * 28;
      x.strokeStyle = pal.grassDark; x.beginPath(); x.moveTo(fx, 2); x.lineTo(fx, -8); x.stroke();
      for (let a = 0; a < 5; a++) dot(x, fx + Math.cos(a * 1.26) * 3.2, -10 + Math.sin(a * 1.26) * 3.2, 2.4, pal.flower1);
      dot(x, fx, -10, 1.8, pal.flower2);
    } else if (v === 0) {
      x.strokeStyle = pal.grassDark;
      const fx = 8 + rng() * 30;
      x.beginPath(); x.moveTo(fx, 3); x.quadraticCurveTo(fx + 2, -4, fx + 5, -6); x.stroke();
    }
  }
}

function stone(x, mask, v, pal, rng) {
  shape(x, rrect(0.5, 0.5, T - 1, T - 1, 7), { fill: pal.stone, rng, lw: 2.4, wob: 0.9 });
  line(x, [[8 + rng() * 6, 10 + rng() * 6], [18 + rng() * 6, 20 + rng() * 6], [16 + rng() * 6, 30 + rng() * 6]], { rng, lw: 1.4, stroke: pal.stoneDark, wob: 0.6 });
  if (v === 2) line(x, [[30, 34], [38, 30], [42, 36]], { rng, lw: 1.4, stroke: pal.stoneDark, wob: 0.5 });
  if (!(mask & 1)) {
    x.fillStyle = shade(pal.stone, 0.35); x.globalAlpha = 0.5;
    x.fillRect(6, 4, T - 14, 3); x.globalAlpha = 1;
  }
}

function plank(x, pal, rng) {
  shape(x, rrect(-1, 0, T + 2, 14, 3), { fill: pal.wood, rng, lw: 2.3, wob: 0.6, wash: false });
  line(x, [[4, 7], [T - 6, 6.5]], { rng, stroke: pal.woodDark, lw: 1.2, wob: 0.6 });
  dot(x, 6, 7, 1.7, INK); dot(x, T - 6, 7, 1.7, INK);
}

function crate(x, pal, rng, kind) {
  const fill = kind ? pal.wood : shade(pal.wood, -0.22);
  shape(x, rrect(2, 2, T - 4, T - 4, 6), { fill, rng, lw: 2.6, wob: 0.8 });
  shape(x, rrect(7, 7, T - 14, T - 14, 3), { stroke: pal.woodDark, lw: 1.5, rng, wob: 0.6 });
  if (kind === 'acorn') {
    shape(x, ellipse(24, 27, 7, 8, 12), { fill: '#d9a066', rng, lw: 2, wob: 0.4 });
    shape(x, ellipse(24, 20, 9, 5, 12), { fill: '#7a5230', rng, lw: 2, wob: 0.4 });
    line(x, [[24, 15], [26, 11]], { rng, lw: 2 });
  } else if (kind === 'berry') {
    shape(x, ellipse(24, 26, 9, 9, 12), { fill: '#e0505f', rng, lw: 2, wob: 0.4 });
    shape(x, ellipse(28, 16, 6, 3, 8, -0.5), { fill: '#6fae58', rng, lw: 1.6, wob: 0.3 });
    dot(x, 21, 23, 2.2, '#ffd6dc');
  } else {
    line(x, [[12, 12], [36, 36]], { rng, stroke: pal.woodDark, lw: 1.5 });
    line(x, [[36, 12], [12, 36]], { rng, stroke: pal.woodDark, lw: 1.5 });
  }
}

function bramble(x, v, pal, rng) {
  const dark = shade(pal.bramble, -0.25);
  shape(x, [[-2, T], [2, 22], [12, 14], [24, 20], [34, 10], [46, 18], [T + 2, T]], { fill: dark, rng, lw: 2.2, wob: 1.2 });
  for (let i = 0; i < 3; i++) {
    const sx = 4 + i * 15 + rng() * 6;
    const pts = [[sx, T], [sx + 8 - rng() * 16, 26], [sx + 12 - rng() * 24, 6 + rng() * 8]];
    line(x, pts, { rng, stroke: pal.bramble, lw: 3.4, wob: 1 });
    for (let j = 0; j < 3; j++) {
      const t = 0.3 + j * 0.25;
      const px = pts[0][0] + (pts[2][0] - pts[0][0]) * t, py = pts[0][1] + (pts[2][1] - pts[0][1]) * t;
      line(x, [[px, py], [px + (j % 2 ? 6 : -6), py - 4]], { rng, stroke: INK, lw: 1.6, wob: 0.2 });
    }
  }
  if (pal.vivid) {
    dot(x, 12 + rng() * 20, 14 + rng() * 10, 3, pal.flower1);
    dot(x, 30 + rng() * 10, 10 + rng() * 10, 2.6, pal.flower1);
  }
}
