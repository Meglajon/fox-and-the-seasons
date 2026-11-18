// Den furniture: catalogue data + drawings. Floor items sit on floorY; wall items hang at WALL_Y.
import { shape, line, ellipse, rrect, rngFor, dot } from './ink.js';
import { shade } from '../core/util.js';

export const SLOT = 48;
export const WALL_Y = 200;

export const FURN = {
  bed: { name: 'Cozy bed', layer: 'floor', w: 2, src: 'start', use: 'bed' },
  rug: { name: 'Round rug', layer: 'rug', w: 3, src: 'start' },
  lamp: { name: 'Floor lamp', layer: 'floor', w: 1, src: 'start' },
  stool: { name: 'Toadstool stool', layer: 'floor', w: 1, src: 'start' },
  record: { name: 'Record player', layer: 'floor', w: 1, src: 'start', use: 'record' },
  armchair: { name: 'Armchair', layer: 'floor', w: 1, price: 30 },
  bookshelf: { name: 'Bookshelf', layer: 'floor', w: 2, price: 45 },
  table: { name: 'Round table', layer: 'floor', w: 2, price: 35 },
  plant: { name: 'Potted plant', layer: 'floor', w: 1, price: 15 },
  teapot: { name: 'Tea trolley', layer: 'floor', w: 1, price: 20 },
  cushions: { name: 'Cushion pile', layer: 'floor', w: 1, price: 25 },
  clock: { name: 'Wall clock', layer: 'wall', w: 1, price: 40 },
  bunting: { name: 'Bunting', layer: 'wall', w: 2, price: 20 },
  fern: { name: 'Big fern', layer: 'floor', w: 1, src: 'seeds', how: 'Collect 5 golden seeds' },
  paint_fox: { name: 'Painting: Foxhollows', layer: 'wall', w: 2, src: 'seeds', how: 'Collect 10 golden seeds' },
  paint_bloom: { name: 'Painting: Bloomwood', layer: 'wall', w: 2, src: 'seeds', how: 'Collect 15 golden seeds' },
  pumpkin_lamp: { name: 'Pumpkin lamp', layer: 'floor', w: 1, src: 'trophy', how: 'Beat the Overgrown Pumpkin' },
  pike_bench: { name: 'Frozen Pike bench', layer: 'floor', w: 2, src: 'trophy', how: 'Beat Old Pike' },
  scarecrow_stand: { name: 'Scarecrow coat-stand', layer: 'floor', w: 1, src: 'trophy', how: 'Beat the Prize Scarecrow' },
};

export function drawFurniture(ctx, id, x, floorY, flip, boil, season) {
  const f = FURN[id];
  if (!f) return;
  const w = f.w * SLOT;
  const rng = rngFor(id.length * 37 + id.charCodeAt(0), boil);
  ctx.save();
  if (flip) { ctx.translate(x * 2 + w, 0); ctx.scale(-1, 1); }
  const y = floorY, cx = x + w / 2;
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
      shape(ctx, ellipse(cx, y + 18, w / 2 - 4, 13, 22), { fill: season ? shade(season, 0.35) : '#d98f6f', rng, lw: 2.2 });
      shape(ctx, ellipse(cx, y + 18, w / 2 - 18, 7, 18), { stroke: '#fff3df', lw: 2, rng });
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
    case 'clock':
      shape(ctx, ellipse(cx, WALL_Y, 20, 20, 16), { fill: '#fbf0dc', rng, lw: 2.4, wash: false });
      line(ctx, [[cx, WALL_Y], [cx, WALL_Y - 12]], { rng, lw: 2 }); line(ctx, [[cx, WALL_Y], [cx + 8, WALL_Y + 3]], { rng, lw: 2 });
      line(ctx, [[cx, WALL_Y + 20], [cx, WALL_Y + 40]], { rng, lw: 2 }); dot(ctx, cx, WALL_Y + 42, 5, '#e2b34a');
      break;
    case 'bunting':
      line(ctx, [[x + 4, WALL_Y - 30], [cx, WALL_Y - 18], [x + w - 4, WALL_Y - 30]], { rng, lw: 1.8 });
      for (let i = 0; i < 5; i++) {
        const bx = x + 12 + i * ((w - 24) / 4), by = WALL_Y - 28 + Math.sin((i / 4) * Math.PI) * 10;
        shape(ctx, [[bx - 7, by], [bx + 7, by], [bx, by + 16]], { fill: ['#e2574c', '#f4d58d', '#6fae58', '#7fb6e0', '#e8a0a8'][i], rng, lw: 1.6, step: 5, wash: false });
      }
      break;
    case 'paint_fox':
    case 'paint_bloom': {
      shape(ctx, rrect(x + 6, WALL_Y - 36, w - 12, 64, 3), { fill: '#a56f45', rng, lw: 2.4, wash: false });
      const sky = id === 'paint_fox' ? '#f3c99a' : '#a9dcec';
      shape(ctx, rrect(x + 13, WALL_Y - 29, w - 26, 50, 2), { fill: sky, rng, lw: 1.6 });
      if (id === 'paint_fox') {
        shape(ctx, rrect(cx - 7, WALL_Y - 22, 14, 42, 2), { fill: '#ddb98f', rng, lw: 1.4 });
        dot(ctx, cx, WALL_Y - 10, 4, '#fffaf0');
      } else {
        shape(ctx, ellipse(cx - 10, WALL_Y, 14, 10, 12), { fill: '#f7c2d2', rng, lw: 1.4 });
        shape(ctx, ellipse(cx + 14, WALL_Y + 4, 10, 8, 12), { fill: '#6fb257', rng, lw: 1.4 });
      }
      shape(ctx, rrect(x + 13, WALL_Y + 10, w - 26, 11, 2), { fill: '#86c463', stroke: null, rng, wash: false });
      break;
    }
  }
  ctx.restore();
}
