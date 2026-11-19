// Den furniture, wallpaper and flooring: catalogue data + drawings.
// Floor items stand on floorY; wall items hang centred on wallY.
import { shape, line, ellipse, rrect, rngFor, dot } from './ink.js';
import { shade } from '../core/util.js';

export const SLOT = 48;
export const WALL_Y = 200;
// Room grid: two wall heights and three floor depths (back, middle, front).
export const WALL_ROWS = [158, 248];
export const FLOOR_ROWS = [432, 464, 496];

// set = the shop section it's sold in. layer = floor / wall / rug.
export const FURN = {
  bed: { name: 'Cozy bed', layer: 'floor', w: 2, src: 'start', use: 'bed' },
  rug: { name: 'Round rug', layer: 'rug', w: 3, src: 'start' },
  lamp: { name: 'Floor lamp', layer: 'floor', w: 1, src: 'start' },
  stool: { name: 'Toadstool stool', layer: 'floor', w: 1, src: 'start' },
  record: { name: 'Record player', layer: 'floor', w: 1, src: 'start', use: 'record' },
  // Cozy set
  armchair: { name: 'Armchair', layer: 'floor', w: 1, price: 30, set: 'cozy' },
  bookshelf: { name: 'Bookshelf', layer: 'floor', w: 2, price: 45, set: 'cozy' },
  table: { name: 'Round table', layer: 'floor', w: 2, price: 35, set: 'cozy' },
  plant: { name: 'Potted plant', layer: 'floor', w: 1, price: 15, set: 'cozy' },
  teapot: { name: 'Tea trolley', layer: 'floor', w: 1, price: 20, set: 'cozy' },
  cushions: { name: 'Cushion pile', layer: 'floor', w: 1, price: 25, set: 'cozy' },
  sofa: { name: 'Squishy sofa', layer: 'floor', w: 2, price: 50, set: 'cozy' },
  piano: { name: 'Little piano', layer: 'floor', w: 2, price: 70, set: 'cozy' },
  globe: { name: 'Spinning globe', layer: 'floor', w: 1, price: 30, set: 'cozy' },
  radio: { name: 'Old radio', layer: 'floor', w: 1, price: 25, set: 'cozy' },
  // Garden set
  garden_bench: { name: 'Garden bench', layer: 'floor', w: 2, price: 40, set: 'garden' },
  birdbath: { name: 'Birdbath', layer: 'floor', w: 1, price: 30, set: 'garden' },
  flower_cart: { name: 'Flower cart', layer: 'floor', w: 2, price: 45, set: 'garden' },
  sunflowers: { name: 'Pot of sunflowers', layer: 'floor', w: 1, price: 20, set: 'garden' },
  // Harvest set
  apple_barrel: { name: 'Apple barrel', layer: 'floor', w: 1, price: 25, set: 'harvest' },
  hay_bale: { name: 'Hay bale', layer: 'floor', w: 1, price: 15, set: 'harvest' },
  pumpkin_stack: { name: 'Pumpkin stack', layer: 'floor', w: 1, price: 25, set: 'harvest' },
  harvest_table: { name: 'Harvest table', layer: 'floor', w: 2, price: 40, set: 'harvest' },
  // Frost set
  snowman: { name: 'Tiny snowman', layer: 'floor', w: 1, price: 30, set: 'frost' },
  sled: { name: 'Wooden sled', layer: 'floor', w: 2, price: 35, set: 'frost' },
  ice_lantern: { name: 'Ice lantern', layer: 'floor', w: 1, price: 30, set: 'frost' },
  // Wall decor
  clock: { name: 'Wall clock', layer: 'wall', w: 1, price: 40, set: 'wall' },
  bunting: { name: 'Bunting', layer: 'wall', w: 2, price: 20, set: 'wall' },
  mirror: { name: 'Round mirror', layer: 'wall', w: 1, price: 25, set: 'wall' },
  plant_shelf: { name: 'Plant shelf', layer: 'wall', w: 2, price: 30, set: 'wall' },
  window_box: { name: 'Window with flower box', layer: 'wall', w: 2, price: 35, set: 'wall' },
  snow_garland: { name: 'Snowflake garland', layer: 'wall', w: 2, price: 20, set: 'wall' },
  leaf_wreath: { name: 'Autumn wreath', layer: 'wall', w: 1, price: 25, set: 'wall' },
  // Rugs
  rug_star: { name: 'Starry rug', layer: 'rug', w: 3, price: 30, set: 'rug' },
  rug_leaf: { name: 'Leaf rug', layer: 'rug', w: 2, price: 25, set: 'rug' },
  rug_snow: { name: 'Snowflake rug', layer: 'rug', w: 3, price: 30, set: 'rug' },
  // Rewards
  fern: { name: 'Big fern', layer: 'floor', w: 1, src: 'seeds', how: 'Collect 5 golden seeds' },
  paint_fox: { name: 'Painting: Foxhollows', layer: 'wall', w: 2, src: 'seeds', how: 'Collect 10 golden seeds' },
  paint_bloom: { name: 'Painting: Bloomwood', layer: 'wall', w: 2, src: 'seeds', how: 'Collect 15 golden seeds' },
  pumpkin_lamp: { name: 'Pumpkin lamp', layer: 'floor', w: 1, src: 'trophy', how: 'Beat the Overgrown Pumpkin' },
  pike_bench: { name: 'Frozen Pike bench', layer: 'floor', w: 2, src: 'trophy', how: 'Beat Old Pike' },
  scarecrow_stand: { name: 'Scarecrow coat-stand', layer: 'floor', w: 1, src: 'trophy', how: 'Beat the Prize Scarecrow' },
};
export const SETS = [
  ['cozy', 'Cozy set'], ['garden', 'Garden set'], ['harvest', 'Harvest set'], ['frost', 'Frost set'],
  ['wall', 'Wall decor'], ['rug', 'Rugs'],
];

export const WALLPAPERS = {
  stripes: { name: 'Honey stripes', src: 'start' },
  flowers: { name: 'Little flowers', price: 25 },
  checks: { name: 'Picnic checks', price: 20 },
  wood: { name: 'Wood panels', price: 30 },
  starry: { name: 'Starry night', price: 35 },
  leafy: { name: 'Leafy green', price: 25 },
};
export const FLOORS = {
  planks: { name: 'Oak planks', src: 'start' },
  checker: { name: 'Checker tiles', price: 25 },
  carpet: { name: 'Red carpet', price: 20 },
  stone: { name: 'Cobblestone', price: 25 },
  moss: { name: 'Mossy floor', price: 30 },
  tiles: { name: 'Blue tiles', price: 25 },
};

// ---------------- wallpaper + flooring ----------------
export function drawWallpaper(ctx, id, w, top, bottom) {
  const h = bottom - top;
  const bg = { stripes: '#ecd3a8', flowers: '#f3e1d2', checks: '#f4e6c8', wood: '#c99a63', starry: '#3d4a7a', leafy: '#cfe2b8' }[id] || '#ecd3a8';
  ctx.fillStyle = bg; ctx.fillRect(0, top, w, h);
  ctx.save();
  if (id === 'stripes') {
    for (let x = 0; x < w; x += 48) { ctx.fillStyle = 'rgba(190,140,90,0.12)'; ctx.fillRect(x, top, 22, h); }
    for (let x = 24; x < w; x += 48) for (let y = top + 26; y < bottom; y += 56) dot(ctx, x + ((y / 56) % 2) * 12, y, 3, 'rgba(214,120,110,0.35)');
  } else if (id === 'flowers') {
    for (let x = 20; x < w; x += 60) for (let y = top + 24; y < bottom; y += 60) {
      const ox = ((y / 60) % 2) * 30;
      for (let a = 0; a < 5; a++) dot(ctx, x + ox + Math.cos(a * 1.26) * 5, y + Math.sin(a * 1.26) * 5, 3.4, 'rgba(232,140,160,0.6)');
      dot(ctx, x + ox, y, 2.4, 'rgba(242,193,78,0.8)');
    }
  } else if (id === 'checks') {
    ctx.fillStyle = 'rgba(201,87,63,0.16)';
    for (let x = 0; x < w; x += 40) ctx.fillRect(x, top, 20, h);
    for (let y = top; y < bottom; y += 40) ctx.fillRect(0, y, w, 20);
  } else if (id === 'wood') {
    ctx.strokeStyle = 'rgba(110,70,40,0.4)'; ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke(); }
    for (let x = 14; x < w; x += 80) for (let y = top + 30; y < bottom; y += 90) { ctx.beginPath(); ctx.ellipse(x, y, 4, 9, 0, 0, 7); ctx.stroke(); }
  } else if (id === 'starry') {
    for (let i = 0; i < 70; i++) {
      const x = (i * 97) % w, y = top + ((i * 53) % h);
      dot(ctx, x, y, i % 5 === 0 ? 2.6 : 1.4, i % 3 ? '#fff6c8' : '#cfe3f5');
    }
    dot(ctx, w - 120, top + 50, 16, '#fff6c8'); dot(ctx, w - 112, top + 46, 14, '#3d4a7a');
  } else if (id === 'leafy') {
    ctx.fillStyle = 'rgba(95,158,70,0.45)';
    for (let x = 16; x < w; x += 50) for (let y = top + 20; y < bottom; y += 46) {
      ctx.beginPath(); ctx.ellipse(x + ((y / 46) % 2) * 25, y, 9, 4, 0.7, 0, 7); ctx.fill();
    }
  }
  ctx.restore();
}

export function drawFlooring(ctx, id, w, top, bottom, rng) {
  const h = bottom - top;
  const bg = { planks: '#a8744b', checker: '#efe4cf', carpet: '#b5503a', stone: '#b9b0a3', moss: '#7d9a5a', tiles: '#a9cfe2' }[id] || '#a8744b';
  shape(ctx, [[-10, top], [w + 10, top], [w + 10, bottom + 10], [-10, bottom + 10]], { fill: bg, rng, lw: 3, wash: false });
  ctx.save();
  ctx.beginPath(); ctx.rect(0, top + 2, w, h); ctx.clip();
  if (id === 'planks') {
    for (let y = top + 26; y < bottom; y += 28) line(ctx, [[0, y], [w, y + 2]], { rng, stroke: '#8a5d3a', lw: 1.4 });
  } else if (id === 'checker') {
    ctx.fillStyle = '#5a4636';
    for (let x = 0; x < w; x += 32) for (let y = top; y < bottom; y += 32) if (((x + y - top) / 32) % 2 === 0) ctx.fillRect(x, y, 32, 32);
  } else if (id === 'carpet') {
    ctx.strokeStyle = 'rgba(242,193,78,0.6)'; ctx.lineWidth = 3;
    ctx.strokeRect(14, top + 10, w - 28, h - 4);
  } else if (id === 'stone') {
    for (let y = top + 4; y < bottom; y += 26) for (let x = ((y - top) / 26 % 2) * 22; x < w; x += 44) {
      shape(ctx, rrect(x + 2, y, 40, 22, 6), { fill: '#cbc3b6', rng, lw: 1.4, wob: 0.6, wash: false });
    }
  } else if (id === 'moss') {
    for (let i = 0; i < 40; i++) dot(ctx, (i * 61) % w, top + 10 + ((i * 37) % (h - 10)), 5 + (i % 3) * 2, i % 2 ? '#8fb46a' : '#6f8f4a');
  } else if (id === 'tiles') {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 36) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke(); }
    for (let y = top + 18; y < bottom; y += 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }
  ctx.restore();
}

// ---------------- furniture ----------------
export function drawFurniture(ctx, id, x, floorY, flip, boil, season, wallY = WALL_Y) {
  const f = FURN[id];
  if (!f) return;
  const w = f.w * SLOT;
  const rng = rngFor(id.length * 37 + id.charCodeAt(0), boil);
  ctx.save();
  if (flip) { ctx.translate(x * 2 + w, 0); ctx.scale(-1, 1); }
  const y = floorY, cx = x + w / 2, wy = wallY;
  switch (id) {
    case 'bed':
      shape(ctx, rrect(x + 4, y - 58, 12, 58, 4), { fill: '#9c6b43', rng, lw: 2.4 });
      shape(ctx, rrect(x + 10, y - 34, w - 18, 22, 6), { fill: '#b77c4e', rng, lw: 2.4 });
      shape(ctx, rrect(x + 12, y - 44, w - 22, 16, 8), { fill: '#e8a0a8', rng, lw: 2.2 });
      shape(ctx, ellipse(x + 26, y - 46, 14, 8, 12), { fill: '#fffaf0', rng, lw: 2 });
      line(ctx, [[x + 44, y - 40], [x + 54, y - 36], [x + 64, y - 40], [x + 74, y - 36]], { rng, lw: 1.4, stroke: '#c46f7b' });
      shape(ctx, rrect(x + w - 16, y - 46, 12, 46, 4), { fill: '#9c6b43', rng, lw: 2.4 });
      break;
    case 'rug':
      shape(ctx, ellipse(cx, y + 14, w / 2 - 4, 12, 22), { fill: season ? shade(season, 0.35) : '#d98f6f', rng, lw: 2.2 });
      shape(ctx, ellipse(cx, y + 14, w / 2 - 18, 6, 18), { stroke: '#fff3df', lw: 2, rng });
      break;
    case 'rug_star':
      shape(ctx, rrect(x + 6, y + 2, w - 12, 24, 8), { fill: '#3d4a7a', rng, lw: 2.2 });
      for (let i = 0; i < 6; i++) dot(ctx, x + 20 + i * ((w - 40) / 5), y + 10 + (i % 2) * 8, 3, '#fff6c8');
      break;
    case 'rug_leaf':
      shape(ctx, ellipse(cx, y + 14, w / 2 - 4, 12, 18), { fill: '#e0783a', rng, lw: 2.2 });
      line(ctx, [[x + 10, y + 14], [x + w - 10, y + 14]], { rng, lw: 1.6, stroke: '#7a3a1c' });
      break;
    case 'rug_snow':
      shape(ctx, rrect(x + 6, y + 2, w - 12, 24, 10), { fill: '#dcf0fb', rng, lw: 2.2, stroke: '#7fb6e0' });
      for (let i = 0; i < 3; i++) { const sx = x + 30 + i * ((w - 60) / 2); line(ctx, [[sx - 6, y + 14], [sx + 6, y + 14]], { rng, lw: 1.6, stroke: '#7fb6e0' }); line(ctx, [[sx, y + 8], [sx, y + 20]], { rng, lw: 1.6, stroke: '#7fb6e0' }); }
      break;
    case 'lamp':
      ctx.save(); ctx.globalAlpha = 0.18; dot(ctx, cx, y - 92, 46, '#ffe7a3'); ctx.restore();
      line(ctx, [[cx, y - 2], [cx, y - 84]], { rng, lw: 3.5 });
      shape(ctx, ellipse(cx, y - 3, 13, 4, 10), { fill: '#6b4a30', rng, lw: 2 });
      shape(ctx, [[cx - 17, y - 82], [cx - 10, y - 106], [cx + 10, y - 106], [cx + 17, y - 82]], { fill: '#f4d58d', rng, lw: 2.4, step: 8 });
      break;
    case 'stool':
      shape(ctx, rrect(cx - 7, y - 24, 14, 24, 4), { fill: '#f6ead2', rng, lw: 2.2 });
      shape(ctx, [[cx - 20, y - 22], [cx - 14, y - 34], [cx, y - 38], [cx + 14, y - 34], [cx + 20, y - 22]], { fill: '#d9634f', rng, lw: 2.2, step: 8 });
      dot(ctx, cx - 7, y - 30, 3, '#fff8ec'); dot(ctx, cx + 8, y - 31, 2.4, '#fff8ec');
      break;
    case 'record':
      shape(ctx, rrect(x + 6, y - 40, w - 12, 40, 4), { fill: '#a56f45', rng, lw: 2.4 });
      shape(ctx, rrect(x + 4, y - 50, w - 8, 12, 3), { fill: '#7b5233', rng, lw: 2.2 });
      shape(ctx, ellipse(cx - 2, y - 52, 15, 4, 14), { fill: '#2d2422', rng, lw: 1.8, wash: false });
      dot(ctx, cx - 2, y - 52, 2.5, '#e2574c');
      line(ctx, [[x + w - 10, y - 50], [x + w - 12, y - 64], [cx + 4, y - 55]], { rng, lw: 2 });
      break;
    case 'armchair':
      shape(ctx, rrect(x + 4, y - 64, w - 8, 44, 12), { fill: '#6f9bb5', rng, lw: 2.4 });
      shape(ctx, rrect(x + 2, y - 36, w - 4, 26, 8), { fill: shade('#6f9bb5', 0.1), rng, lw: 2.4 });
      line(ctx, [[x + 10, y - 10], [x + 10, y]], { rng, lw: 3 }); line(ctx, [[x + w - 10, y - 10], [x + w - 10, y]], { rng, lw: 3 });
      break;
    case 'sofa':
      shape(ctx, rrect(x + 4, y - 62, w - 8, 40, 14), { fill: '#d98f6f', rng, lw: 2.4 });
      shape(ctx, rrect(x + 2, y - 36, w - 4, 26, 10), { fill: shade('#d98f6f', 0.12), rng, lw: 2.4 });
      line(ctx, [[cx, y - 34], [cx, y - 12]], { rng, lw: 1.6, stroke: shade('#d98f6f', -0.3) });
      shape(ctx, ellipse(x + 22, y - 44, 10, 8, 10), { fill: '#f4d58d', rng, lw: 1.8 });
      line(ctx, [[x + 10, y - 10], [x + 10, y]], { rng, lw: 3 }); line(ctx, [[x + w - 10, y - 10], [x + w - 10, y]], { rng, lw: 3 });
      break;
    case 'piano':
      shape(ctx, rrect(x + 4, y - 80, w - 8, 66, 5), { fill: '#5a3a2a', rng, lw: 2.4 });
      shape(ctx, rrect(x + 8, y - 42, w - 16, 10, 2), { fill: '#fffaf0', rng, lw: 1.6, wash: false });
      for (let k = 0; k < 8; k++) if (k % 3 !== 2) shape(ctx, rrect(x + 14 + k * 9, y - 42, 4, 6, 1), { fill: '#2d2422', stroke: null, rng, wash: false });
      line(ctx, [[x + 12, y - 14], [x + 12, y]], { rng, lw: 3 }); line(ctx, [[x + w - 12, y - 14], [x + w - 12, y]], { rng, lw: 3 });
      shape(ctx, rrect(cx - 10, y - 74, 20, 14, 2), { fill: '#fbf0dc', rng, lw: 1.4, wash: false });
      break;
    case 'globe':
      line(ctx, [[cx, y - 2], [cx, y - 26]], { rng, lw: 3 });
      shape(ctx, ellipse(cx, y - 3, 12, 4, 10), { fill: '#7b5233', rng, lw: 2 });
      shape(ctx, ellipse(cx, y - 46, 18, 18, 16), { fill: '#7fb6e0', rng, lw: 2.2 });
      shape(ctx, ellipse(cx - 5, y - 50, 7, 9, 10, 0.4), { fill: '#86c463', stroke: null, rng, wash: false });
      shape(ctx, ellipse(cx + 7, y - 40, 5, 4, 8), { fill: '#86c463', stroke: null, rng, wash: false });
      break;
    case 'radio':
      shape(ctx, rrect(x + 6, y - 22, w - 12, 22, 3), { fill: '#7b5233', rng, lw: 2 });
      shape(ctx, [[x + 8, y - 22], [x + 8, y - 44], [cx, y - 56], [x + w - 8, y - 44], [x + w - 8, y - 22]], { fill: '#c99a63', rng, lw: 2.2, step: 8 });
      shape(ctx, ellipse(cx, y - 40, 9, 9, 10), { fill: '#e8d6b8', rng, lw: 1.6, wash: false });
      dot(ctx, cx - 8, y - 28, 2.5, '#3b2a26'); dot(ctx, cx + 8, y - 28, 2.5, '#3b2a26');
      break;
    case 'bookshelf': {
      shape(ctx, rrect(x + 4, y - 120, w - 8, 120, 4), { fill: '#8f6140', rng, lw: 2.4 });
      const cols = ['#c9573f', '#5f8fb3', '#e2b34a', '#6fae58', '#a87ab8'];
      for (let r = 0; r < 3; r++) {
        line(ctx, [[x + 6, y - 12 - r * 36], [x + w - 6, y - 12 - r * 36]], { rng, lw: 2 });
        for (let b = 0; b < 6; b++) shape(ctx, rrect(x + 12 + b * 12, y - 42 - r * 36, 9, 28 - (b % 3) * 3, 2), { fill: cols[(b + r) % 5], rng, lw: 1.4, wash: false });
      }
      break;
    }
    case 'table':
      shape(ctx, ellipse(cx, y - 44, w / 2 - 8, 7, 18), { fill: '#b98a5c', rng, lw: 2.4 });
      line(ctx, [[cx, y - 40], [cx, y - 4]], { rng, lw: 4 });
      shape(ctx, ellipse(cx, y - 3, 18, 4, 10), { fill: '#8f6140', rng, lw: 2 });
      shape(ctx, rrect(cx - 26, y - 62, 12, 14, 3), { fill: '#f6ead2', rng, lw: 1.8 });
      shape(ctx, ellipse(cx + 18, y - 52, 9, 5, 10), { fill: '#e2574c', rng, lw: 1.8 });
      break;
    case 'plant':
      shape(ctx, [[cx - 14, y - 26], [cx + 14, y - 26], [cx + 10, y], [cx - 10, y]], { fill: '#c46f4b', rng, lw: 2.2, step: 8 });
      for (let i = -2; i <= 2; i++) shape(ctx, ellipse(cx + i * 7, y - 40 - (2 - Math.abs(i)) * 6, 6, 13, 10, i * 0.4), { fill: '#6fb257', rng, lw: 1.8 });
      break;
    case 'sunflowers':
      shape(ctx, [[cx - 13, y - 24], [cx + 13, y - 24], [cx + 9, y], [cx - 9, y]], { fill: '#7fb6e0', rng, lw: 2.2, step: 8 });
      for (const [dx, h] of [[-8, 60], [6, 72]]) {
        line(ctx, [[cx + dx / 2, y - 22], [cx + dx, y - h]], { rng, lw: 2.6, stroke: '#4f8f3a' });
        for (let a = 0; a < 8; a++) dot(ctx, cx + dx + Math.cos(a * 0.785) * 9, y - h + Math.sin(a * 0.785) * 9, 4, '#f2c14e');
        dot(ctx, cx + dx, y - h, 5, '#7a4a2a');
      }
      break;
    case 'teapot':
      shape(ctx, rrect(x + 8, y - 44, w - 16, 6, 2), { fill: '#b98a5c', rng, lw: 2 });
      shape(ctx, rrect(x + 8, y - 16, w - 16, 6, 2), { fill: '#b98a5c', rng, lw: 2 });
      line(ctx, [[x + 10, y - 40], [x + 10, y - 2]], { rng, lw: 2.4 }); line(ctx, [[x + w - 10, y - 40], [x + w - 10, y - 2]], { rng, lw: 2.4 });
      shape(ctx, ellipse(cx, y - 54, 11, 9, 12), { fill: '#7fb6c9', rng, lw: 2 });
      line(ctx, [[cx + 10, y - 56], [cx + 18, y - 62]], { rng, lw: 2.4 });
      break;
    case 'cushions':
      shape(ctx, ellipse(cx, y - 10, 20, 10, 14), { fill: '#e8a0a8', rng, lw: 2.2 });
      shape(ctx, ellipse(cx - 4, y - 24, 16, 9, 14), { fill: '#f4d58d', rng, lw: 2.2 });
      shape(ctx, ellipse(cx + 3, y - 36, 12, 8, 12), { fill: '#9cc9a4', rng, lw: 2.2 });
      break;
    case 'garden_bench':
      shape(ctx, rrect(x + 6, y - 58, w - 12, 8, 3), { fill: '#6fae58', rng, lw: 2 });
      shape(ctx, rrect(x + 6, y - 46, w - 12, 8, 3), { fill: '#6fae58', rng, lw: 2 });
      shape(ctx, rrect(x + 4, y - 28, w - 8, 9, 3), { fill: '#86c463', rng, lw: 2.2 });
      for (const lx of [x + 12, x + w - 12]) line(ctx, [[lx, y - 60], [lx, y]], { rng, lw: 3, stroke: '#3b2a26' });
      break;
    case 'birdbath':
      shape(ctx, rrect(cx - 6, y - 40, 12, 40, 3), { fill: '#cbc3b6', rng, lw: 2 });
      shape(ctx, ellipse(cx, y - 42, 22, 7, 14), { fill: '#cbc3b6', rng, lw: 2.2 });
      shape(ctx, ellipse(cx, y - 44, 16, 3.5, 12), { fill: '#a9d2e6', stroke: null, rng, wash: false });
      shape(ctx, ellipse(cx + 10, y - 54, 7, 5, 10), { fill: '#e2574c', rng, lw: 1.6 });
      break;
    case 'flower_cart':
      shape(ctx, rrect(x + 8, y - 42, w - 16, 24, 4), { fill: '#b98a5c', rng, lw: 2.2 });
      for (let k = 0; k < 6; k++) dot(ctx, x + 16 + k * 12, y - 46 - (k % 2) * 6, 7, ['#f4a3bf', '#f2c14e', '#fffaf0'][k % 3]);
      shape(ctx, ellipse(x + 20, y - 8, 9, 9, 12), { fill: '#7b5233', rng, lw: 2 });
      shape(ctx, ellipse(x + w - 20, y - 8, 9, 9, 12), { fill: '#7b5233', rng, lw: 2 });
      break;
    case 'apple_barrel':
      shape(ctx, rrect(x + 8, y - 40, w - 16, 40, 8), { fill: '#a87650', rng, lw: 2.2 });
      line(ctx, [[x + 8, y - 28], [x + w - 8, y - 28]], { rng, lw: 2, stroke: '#5a3a2a' });
      line(ctx, [[x + 8, y - 12], [x + w - 8, y - 12]], { rng, lw: 2, stroke: '#5a3a2a' });
      for (let k = 0; k < 4; k++) dot(ctx, x + 14 + k * 7, y - 44 - (k % 2) * 4, 6, '#c9473d');
      break;
    case 'hay_bale':
      shape(ctx, rrect(x + 4, y - 34, w - 8, 34, 6), { fill: '#e8c56f', rng, lw: 2.2 });
      for (let k = 0; k < 4; k++) line(ctx, [[x + 10 + k * 8, y - 28], [x + 14 + k * 8, y - 8]], { rng, lw: 1.4, stroke: '#b5913a' });
      line(ctx, [[x + 4, y - 17], [x + w - 4, y - 17]], { rng, lw: 2, stroke: '#b5503a' });
      break;
    case 'pumpkin_stack':
      shape(ctx, ellipse(cx, y - 14, 20, 14, 16), { fill: '#ee8a35', rng, lw: 2.2 });
      shape(ctx, ellipse(cx + 2, y - 36, 14, 11, 14), { fill: '#f2a541', rng, lw: 2.2 });
      shape(ctx, ellipse(cx, y - 52, 8, 7, 10), { fill: '#e0783a', rng, lw: 2 });
      line(ctx, [[cx, y - 58], [cx + 3, y - 64]], { rng, lw: 2.4, stroke: '#4f8f3a' });
      break;
    case 'harvest_table':
      shape(ctx, rrect(x + 4, y - 44, w - 8, 10, 3), { fill: '#a87650', rng, lw: 2.2 });
      for (const lx of [x + 12, x + w - 12]) line(ctx, [[lx, y - 36], [lx, y]], { rng, lw: 3.4 });
      shape(ctx, ellipse(cx - 14, y - 52, 12, 8, 12), { fill: '#e8c56f', rng, lw: 1.8 });
      for (let k = 0; k < 3; k++) dot(ctx, cx + 10 + k * 8, y - 50, 5, '#c9473d');
      break;
    case 'snowman':
      shape(ctx, ellipse(cx, y - 16, 18, 16, 16), { fill: '#f6f9fc', rng, lw: 2.2 });
      shape(ctx, ellipse(cx, y - 42, 13, 12, 14), { fill: '#f6f9fc', rng, lw: 2.2 });
      dot(ctx, cx - 4, y - 44, 2, '#3b2a26'); dot(ctx, cx + 4, y - 44, 2, '#3b2a26');
      shape(ctx, [[cx, y - 41], [cx + 12, y - 39], [cx, y - 37]], { fill: '#ee8a35', rng, lw: 1.2, step: 4 });
      shape(ctx, rrect(cx - 10, y - 30, 20, 5, 2), { fill: '#c9473d', rng, lw: 1.6, wash: false });
      break;
    case 'sled':
      shape(ctx, rrect(x + 10, y - 26, w - 22, 10, 3), { fill: '#b5503a', rng, lw: 2.2 });
      line(ctx, [[x + 6, y - 4], [x + w - 14, y - 4], [x + w - 4, y - 14]], { rng, lw: 3 });
      for (const lx of [x + 18, x + w - 26]) line(ctx, [[lx, y - 16], [lx, y - 4]], { rng, lw: 2.4 });
      break;
    case 'ice_lantern':
      ctx.save(); ctx.globalAlpha = 0.2; dot(ctx, cx, y - 30, 34, '#cfeafa'); ctx.restore();
      shape(ctx, rrect(cx - 13, y - 44, 26, 44, 5), { fill: '#dcf0fb', rng, lw: 2.2, stroke: '#7fb6e0' });
      dot(ctx, cx, y - 22, 5, '#fff6c8');
      break;
    case 'fern':
      shape(ctx, [[cx - 12, y - 22], [cx + 12, y - 22], [cx + 9, y], [cx - 9, y]], { fill: '#a87650', rng, lw: 2.2, step: 8 });
      for (let i = -3; i <= 3; i++) line(ctx, [[cx, y - 20], [cx + i * 6, y - 50], [cx + i * 13, y - 64 + Math.abs(i) * 8]], { rng, stroke: '#4f8f3a', lw: 3 });
      break;
    case 'pumpkin_lamp':
      ctx.save(); ctx.globalAlpha = 0.22; dot(ctx, cx, y - 20, 40, '#ffd27a'); ctx.restore();
      shape(ctx, ellipse(cx, y - 18, 20, 17, 16), { fill: '#ee8a35', rng, lw: 2.4 });
      shape(ctx, [[cx - 10, y - 24], [cx - 4, y - 20], [cx - 10, y - 16]], { fill: '#ffd774', rng, lw: 1.4, step: 4, wash: false });
      shape(ctx, [[cx + 10, y - 24], [cx + 4, y - 20], [cx + 10, y - 16]], { fill: '#ffd774', rng, lw: 1.4, step: 4, wash: false });
      shape(ctx, rrect(cx - 3, y - 40, 6, 8, 2), { fill: '#6e8a3a', rng, lw: 1.6 });
      break;
    case 'pike_bench':
      shape(ctx, rrect(x + 8, y - 30, w - 16, 14, 5), { fill: '#dcf0fb', rng, lw: 2.4, stroke: '#7fb6e0' });
      shape(ctx, ellipse(cx, y - 23, w / 2 - 22, 5, 14), { fill: '#7f9a7a', rng, lw: 1.6, wash: false });
      dot(ctx, x + w - 26, y - 24, 2, '#3b2a26');
      shape(ctx, rrect(x + 12, y - 16, 10, 16, 3), { fill: '#a88b6c', rng, lw: 2 });
      shape(ctx, rrect(x + w - 22, y - 16, 10, 16, 3), { fill: '#a88b6c', rng, lw: 2 });
      break;
    case 'scarecrow_stand':
      line(ctx, [[cx, y - 2], [cx, y - 96]], { rng, lw: 4, stroke: '#8a6040' });
      line(ctx, [[cx - 20, y - 80], [cx + 20, y - 80]], { rng, lw: 4, stroke: '#a87a4c' });
      shape(ctx, [[cx - 18, y - 80], [cx + 18, y - 80], [cx + 14, y - 40], [cx - 14, y - 40]], { fill: '#7d6a9e', rng, lw: 2, step: 8 });
      shape(ctx, ellipse(cx, y - 100, 16, 4, 10), { fill: '#d9b45a', rng, lw: 2 });
      shape(ctx, [[cx - 9, y - 100], [cx - 7, y - 112], [cx + 7, y - 112], [cx + 9, y - 100]], { fill: '#d9b45a', rng, lw: 2, step: 6 });
      shape(ctx, ellipse(cx, y - 3, 14, 4, 10), { fill: '#6e4a30', rng, lw: 2 });
      break;
    // ---- wall items (centred on wy) ----
    case 'clock':
      shape(ctx, ellipse(cx, wy - 10, 20, 20, 16), { fill: '#fbf0dc', rng, lw: 2.4, wash: false });
      line(ctx, [[cx, wy - 10], [cx, wy - 22]], { rng, lw: 2 }); line(ctx, [[cx, wy - 10], [cx + 8, wy - 7]], { rng, lw: 2 });
      line(ctx, [[cx, wy + 10], [cx, wy + 26]], { rng, lw: 2 }); dot(ctx, cx, wy + 28, 5, '#e2b34a');
      break;
    case 'bunting':
      line(ctx, [[x + 4, wy - 22], [cx, wy - 10], [x + w - 4, wy - 22]], { rng, lw: 1.8 });
      for (let i = 0; i < 5; i++) {
        const bx = x + 12 + i * ((w - 24) / 4), by = wy - 20 + Math.sin((i / 4) * Math.PI) * 10;
        shape(ctx, [[bx - 7, by], [bx + 7, by], [bx, by + 16]], { fill: ['#e2574c', '#f4d58d', '#6fae58', '#7fb6e0', '#e8a0a8'][i], rng, lw: 1.6, step: 5, wash: false });
      }
      break;
    case 'snow_garland':
      line(ctx, [[x + 4, wy - 22], [cx, wy - 10], [x + w - 4, wy - 22]], { rng, lw: 1.8 });
      for (let i = 0; i < 4; i++) {
        const bx = x + 16 + i * ((w - 32) / 3), by = wy - 12 + Math.sin((i / 3) * Math.PI) * 8;
        line(ctx, [[bx - 6, by], [bx + 6, by]], { rng, lw: 2, stroke: '#7fb6e0' }); line(ctx, [[bx, by - 6], [bx, by + 6]], { rng, lw: 2, stroke: '#7fb6e0' });
      }
      break;
    case 'mirror':
      shape(ctx, ellipse(cx, wy, 18, 24, 16), { fill: '#c99a63', rng, lw: 2.4 });
      shape(ctx, ellipse(cx, wy, 13, 19, 14), { fill: '#e6f2f8', rng, lw: 1.6, wash: false });
      line(ctx, [[cx - 6, wy - 10], [cx + 2, wy - 16]], { rng, lw: 2, stroke: '#ffffff' });
      break;
    case 'leaf_wreath':
      for (let a = 0; a < 10; a++) {
        const ang = (a / 10) * Math.PI * 2;
        shape(ctx, ellipse(cx + Math.cos(ang) * 16, wy + Math.sin(ang) * 16, 7, 4, 8, ang), { fill: a % 2 ? '#e0783a' : '#f2a541', rng, lw: 1.4 });
      }
      dot(ctx, cx, wy + 18, 4, '#b5503a');
      break;
    case 'plant_shelf':
      shape(ctx, rrect(x + 6, wy + 10, w - 12, 8, 2), { fill: '#a87650', rng, lw: 2 });
      for (const px of [x + 22, cx + 14]) {
        shape(ctx, [[px - 9, wy + 10], [px + 9, wy + 10], [px + 6, wy - 6], [px - 6, wy - 6]], { fill: '#c46f4b', rng, lw: 1.8, step: 6 });
        for (let i = -1; i <= 1; i++) shape(ctx, ellipse(px + i * 6, wy - 16 + Math.abs(i) * 4, 4, 9, 8, i * 0.5), { fill: '#6fb257', rng, lw: 1.4 });
      }
      break;
    case 'window_box':
      shape(ctx, rrect(x + 10, wy - 34, w - 20, 50, 4), { fill: '#bfe3ee', rng, lw: 2.4 });
      line(ctx, [[cx, wy - 34], [cx, wy + 16]], { rng, lw: 2 }); line(ctx, [[x + 10, wy - 10], [x + w - 10, wy - 10]], { rng, lw: 2 });
      shape(ctx, rrect(x + 6, wy + 14, w - 12, 12, 3), { fill: '#a87650', rng, lw: 2 });
      for (let k = 0; k < 5; k++) dot(ctx, x + 16 + k * 14, wy + 12, 5, ['#f4a3bf', '#f2c14e', '#fffaf0'][k % 3]);
      break;
    case 'paint_fox':
    case 'paint_bloom': {
      shape(ctx, rrect(x + 6, wy - 32, w - 12, 64, 3), { fill: '#a56f45', rng, lw: 2.4, wash: false });
      const sky = id === 'paint_fox' ? '#f3c99a' : '#a9dcec';
      shape(ctx, rrect(x + 13, wy - 25, w - 26, 50, 2), { fill: sky, rng, lw: 1.6 });
      if (id === 'paint_fox') {
        shape(ctx, rrect(cx - 7, wy - 18, 14, 42, 2), { fill: '#ddb98f', rng, lw: 1.4 });
        dot(ctx, cx, wy - 6, 4, '#fffaf0');
      } else {
        shape(ctx, ellipse(cx - 10, wy + 4, 14, 10, 12), { fill: '#f7c2d2', rng, lw: 1.4 });
        shape(ctx, ellipse(cx + 14, wy + 8, 10, 8, 12), { fill: '#6fb257', rng, lw: 1.4 });
      }
      shape(ctx, rrect(x + 13, wy + 14, w - 26, 11, 2), { fill: '#86c463', stroke: null, rng, wash: false });
      break;
    }
    default: break;
  }
  ctx.restore();
}
