// The Almanac Trail map: 20 tricky levels winding through a whole year, up to the Hollow Oak.
import { engine, W, H, setScene, transition, pushOverlay, toast } from '../core/engine.js';
import { input } from '../core/input.js';
import { state, saveGame } from '../core/state.js';
import { lerp, shade } from '../core/util.js';
import { shape, line, ellipse, rrect, rngFor, dot, text, panel } from '../art/ink.js';
import { drawFox } from '../art/fox.js';
import { drawSeed, drawPaw, drawAcorn } from '../art/critters.js';
import { SEASON_COLOR } from '../art/palettes.js';
import { LEVEL_INFO, ALMANAC_ORDER, OAK_ORDER } from '../game/levels.js';
import { LevelScene } from '../game/level.js';
import { MapScene, NODES as MAIN_NODES } from './map.js';
import { ListMenu, fmt } from '../ui/ui.js';
import { SettingsCabinet } from '../ui/screens.js';
import { playMusic } from '../audio/music.js';
import { sfx } from '../audio/sfx.js';

// Four bands, one per season, with the path snaking up through them.
const BANDS = [
  { season: 'spring', y: 392, name: 'Blossom Weeks', fill: '#f7d9e0', deco: '#f4a3bf' },
  { season: 'summer', y: 292, name: 'Sun Weeks', fill: '#fbe9b8', deco: '#f2b33d' },
  { season: 'autumn', y: 192, name: 'Harvest Weeks', fill: '#f6d2b4', deco: '#d9662b' },
  { season: 'winter', y: 92, name: 'Frost Weeks', fill: '#e2edf7', deco: '#7fb6e0' },
];
const COLS = [170, 330, 490, 650, 810];
export const TRAIL_NODES = [{ id: 'back', x: 52, y: 410, label: 'Back to Foxhollows' }];
ALMANAC_ORDER.forEach((id, i) => {
  const band = Math.floor(i / 5), k = i % 5;
  const x = band % 2 === 0 ? COLS[k] : COLS[4 - k];
  TRAIL_NODES.push({ id, x, y: BANDS[band].y + (k % 2 ? -14 : 12) });
});
// The Hollow Oak: three levels climbing into the great tree at the top left.
const OAK_SPOTS = [[96, 128], [52, 104], [104, 70]];
OAK_ORDER.forEach((id, i) => TRAIL_NODES.push({ id, x: OAK_SPOTS[i][0], y: OAK_SPOTS[i][1], oak: true }));

export class TrailScene {
  constructor() { this.t = 0; this.moving = null; this.facing = 1; }
  enter() {
    const d = state.data;
    this.i = Math.min(d.trailNode || 0, TRAIL_NODES.length - 1);
    while (this.i > 0 && !this.unlocked(this.i)) this.i--;
    this.fx = TRAIL_NODES[this.i].x; this.fy = TRAIL_NODES[this.i].y;
    playMusic('almanac', { spr: 0.8, win: 0, aut: 0, sum: 0, hum: 0.6 });
    engine.irisX = this.fx; engine.irisY = this.fy;
  }
  unlocked(i) {
    const d = state.data;
    if (i <= 1) return true;
    const n = TRAIL_NODES[i];
    return !!d.cleared[TRAIL_NODES[i - 1].id];
  }
  update(dt) {
    this.t += dt;
    state.data.time += dt;
    if (engine.trans) return;
    if (this.moving) {
      const m = this.moving;
      m.t += dt / 0.3;
      const k = Math.min(1, m.t);
      this.fx = lerp(m.from.x, m.to.x, k); this.fy = lerp(m.from.y, m.to.y, k) - Math.sin(k * Math.PI) * 14;
      if (k >= 1) { this.moving = null; this.i = m.toI; state.data.trailNode = this.i; }
      return;
    }
    if (input.pressed('pause')) { this.openPause(); return; }
    const fwd = input.pressed('right') || input.pressed('up');
    const back = input.pressed('left') || input.pressed('down');
    if (fwd && this.i < TRAIL_NODES.length - 1) {
      if (this.unlocked(this.i + 1)) this.go(this.i + 1);
      else { sfx('deny'); toast('Clear this level first to open the path'); }
    } else if (back && this.i > 0) this.go(this.i - 1);
    if (input.pressed('confirm')) this.enterNode();
  }
  go(j) {
    sfx('move');
    this.facing = TRAIL_NODES[j].x >= TRAIL_NODES[this.i].x ? 1 : -1;
    this.moving = { from: TRAIL_NODES[this.i], to: TRAIL_NODES[j], toI: j, t: 0 };
  }
  enterNode() {
    const n = TRAIL_NODES[this.i];
    saveGame();
    if (n.id === 'back') {
      sfx('door');
      state.data.mapNode = MAIN_NODES.findIndex((m) => m.trail);
      transition(() => setScene(new MapScene()), n.x, n.y);
    } else { sfx('select'); transition(() => setScene(new LevelScene(n.id)), n.x, n.y); }
  }
  openPause() {
    pushOverlay(new ListMenu({
      title: 'Trail menu',
      items: [
        { label: 'Back to the trail', select: () => engine.overlays.pop() },
        { label: 'Settings cabinet', select: () => pushOverlay(new SettingsCabinet()) },
        { label: 'Back to Foxhollows', select: () => { engine.overlays.pop(); this.i = 0; this.enterNode(); } },
      ],
    }));
  }

  render(ctx) {
    const d = state.data, b = engine.boil, rng = rngFor(201, b);
    ctx.fillStyle = '#f6ecd6'; ctx.fillRect(0, 0, W, H);
    // the four season bands
    BANDS.forEach((band, bi) => {
      const top = band.y - 50, br = rngFor(210 + bi, b);
      shape(ctx, [[-10, top + 6], [W * 0.3, top - 4], [W * 0.7, top + 8], [W + 10, top], [W + 10, top + 100], [-10, top + 104]], { fill: band.fill, rng: br, lw: 2, wob: 2, step: 40 });
      for (let k = 0; k < 7; k++) {
        const x = 40 + k * 140 + (bi % 2) * 60, y = top + 30 + (k % 2) * 40;
        if (band.season === 'spring') { line(ctx, [[x, y + 18], [x, y]], { rng: br, stroke: '#86603f', lw: 3 }); shape(ctx, ellipse(x, y - 8, 16, 13, 12), { fill: '#f7c2d2', rng: br, lw: 1.8 }); }
        else if (band.season === 'summer') { line(ctx, [[x, y + 18], [x, y - 4]], { rng: br, stroke: '#5c9a45', lw: 3 }); for (let a = 0; a < 8; a++) dot(ctx, x + Math.cos(a * 0.785) * 8, y - 8 + Math.sin(a * 0.785) * 8, 4, '#f6c445'); dot(ctx, x, y - 8, 4.5, '#7a5230'); }
        else if (band.season === 'autumn') { line(ctx, [[x, y + 18], [x, y]], { rng: br, stroke: '#6e4a30', lw: 3 }); shape(ctx, ellipse(x, y - 8, 16, 13, 12), { fill: '#e0783a', rng: br, lw: 1.8 }); }
        else shape(ctx, [[x - 14, y + 16], [x, y - 20], [x + 14, y + 16]], { fill: '#7d9a8c', rng: br, lw: 1.8, step: 10 });
      }
      text(ctx, band.name, bi === 1 ? 16 : W - 16, top + 22, { size: 18, color: shade(band.deco, -0.3), align: bi === 1 ? 'left' : 'right' });
    });
    // the Hollow Oak (top left)
    shape(ctx, [[22, 92], [34, 40], [30, 8], [118, 8], [112, 40], [124, 92]], { fill: '#7a5038', rng, lw: 2.4, step: 16 });
    shape(ctx, ellipse(74, 4, 78, 26, 18), { fill: d.finished ? '#7cb05a' : '#6f8f5a', rng, lw: 2.2 });
    shape(ctx, ellipse(74, 40, 15, 15, 14), { fill: d.finished ? '#f6e08a' : '#e8dcc4', rng, lw: 2 });
    line(ctx, [[74, 40], [74 + Math.cos(this.t * (d.finished ? 2 : 0.05)) * 10, 40 + Math.sin(this.t * (d.finished ? 2 : 0.05)) * 10]], { rng, lw: 2 });

    // path
    for (let i = 0; i < TRAIL_NODES.length - 1; i++) {
      const a = TRAIL_NODES[i], n = TRAIL_NODES[i + 1];
      const open = this.unlocked(i + 1);
      ctx.save();
      ctx.strokeStyle = '#5a4636'; ctx.lineWidth = open ? 4 : 2.5; ctx.lineCap = 'round';
      ctx.setLineDash(open ? [2, 10] : [2, 14]); ctx.globalAlpha = open ? 0.9 : 0.35;
      ctx.beginPath(); ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo((a.x + n.x) / 2 + (i % 2 ? 16 : -16), (a.y + n.y) / 2 + 10, n.x, n.y);
      ctx.stroke();
      ctx.restore();
    }
    // nodes
    TRAIL_NODES.forEach((n, i) => {
      const open = this.unlocked(i), done = d.cleared[n.id], nr = rngFor(230 + i, b);
      if (n.id === 'back') {
        shape(ctx, [[n.x - 22, n.y + 10], [n.x - 22, n.y - 8], [n.x, n.y - 28], [n.x + 22, n.y - 8], [n.x + 22, n.y + 10]], { fill: '#d98f6f', rng: nr, lw: 2.4 });
        return;
      }
      if (n.oak) {
        shape(ctx, ellipse(n.x, n.y, 17, 14, 14), { fill: done ? '#e2b34a' : open ? '#fff3d0' : '#d9cfbf', rng: nr, lw: 2.6 });
        text(ctx, n.id, n.x, n.y + 6, { size: 15, align: 'center' });
        if (d.seeds[n.id]?.filter(Boolean).length === 3) dot(ctx, n.x + 15, n.y - 12, 4.5, '#f5c542');
        return;
      }
      const band = BANDS[Math.floor((i - 1) / 5)];
      const col = done ? SEASON_COLOR[band.season] : open ? '#fff3d0' : '#d9cfbf';
      shape(ctx, ellipse(n.x, n.y, 17, 14, 14), { fill: col, rng: nr, lw: 2.6 });
      text(ctx, n.id.split('-')[1], n.x, n.y + 7, { size: 17, align: 'center' });
      if (d.seeds[n.id]?.filter(Boolean).length === 3) dot(ctx, n.x + 15, n.y - 12, 4.5, '#f5c542');
    });

    const fb = BANDS[Math.max(0, Math.min(3, Math.floor((this.i - 1) / 5)))];
    drawFox(ctx, this.fx, this.fy - 6, { scale: 0.8, t: this.t, pose: this.moving ? 'run' : 'idle', phase: this.t * 12, facing: this.facing, outfit: d.outfit, scarfColor: SEASON_COLOR[this.i >= 1 ? fb.season : 'none'], boil: b, speed: this.moving ? 200 : 0 });

    // info card
    const n = TRAIL_NODES[this.i];
    const info = LEVEL_INFO[n.id];
    panel(ctx, W / 2 - 250, H - 92, 500, 78, { seed: 220, r: 16 });
    text(ctx, info ? `${n.id}  ·  ${info.name}` : n.label, W / 2, H - 58, { size: 26, align: 'center', ui: true });
    if (info) {
      const s = d.seeds[n.id] || [];
      for (let k = 0; k < 3; k++) drawSeed(ctx, W / 2 + 175 + k * 24, H - 64, { ghost: !s[k], boil: b, t: 0 });
    }
    const sub = n.id === 'back' ? 'Return to the map of Foxhollows' : d.cleared[n.id] ? 'Cleared! Play again for golden seeds' : n.id === 'O-3' ? 'Thimble is waiting at the top...' : 'Not cleared yet';
    text(ctx, `${sub}   ·   ${fmt('{jump}')} to enter`, W / 2, H - 28, { size: 18, align: 'center', color: '#7a6656', ui: true });
    panel(ctx, W - 226, H - 60, 214, 46, { seed: 221, r: 14 });
    drawPaw(ctx, W - 202, H - 36, 0.95, true, b); text(ctx, '× ' + d.lives, W - 186, H - 28, { size: 22 });
    drawAcorn(ctx, W - 50, H - 40, 0.9, b); text(ctx, '' + d.acorns, W - 36, H - 30, { size: 20 });
    text(ctx, 'Almanac Trail', 16, H - 16, { size: 26, color: shade('#7a5ab5', -0.1), outline: '#fffaf0' });
  }
}
