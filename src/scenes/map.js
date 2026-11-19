// The hand-drawn level map of Foxhollows. Colour returns to the map as season-stones come home.
import { engine, W, H, setScene, transition, pushOverlay, toast } from '../core/engine.js';
import { input } from '../core/input.js';
import { state, saveGame } from '../core/state.js';
import { fade, lerp, shade } from '../core/util.js';
import { shape, line, ellipse, rrect, rngFor, dot, text, panel } from '../art/ink.js';
import { drawFox } from '../art/fox.js';
import { drawSeed, drawPaw, drawAcorn, drawPumpkin } from '../art/critters.js';
import { drawPike, drawScarecrow } from '../art/critters2.js';
import { drawSunMoth } from '../art/critters3.js';
import { TrailScene } from './trail.js';
import { SEASON_COLOR } from '../art/palettes.js';
import { LEVEL_INFO } from '../game/levels.js';
import { LevelScene } from '../game/level.js';
import { DenScene } from './den.js';
import { TitleScene } from './title.js';
import { ListMenu, fmt } from '../ui/ui.js';
import { SettingsCabinet } from '../ui/screens.js';
import { playMusic } from '../audio/music.js';
import { sfx } from '../audio/sfx.js';

export const NODES = [
  { id: 'den', x: 118, y: 446, label: "Fennel's Den" },
  { id: '0-1', x: 238, y: 398 }, { id: '0-2', x: 340, y: 320 },
  { id: '1-1', x: 476, y: 366 }, { id: '1-2', x: 590, y: 304 }, { id: '1-3', x: 704, y: 356 },
  { id: '1-4', x: 812, y: 282 }, { id: '1-B', x: 842, y: 186 },
  { id: '2-1', x: 900, y: 112 }, { id: '2-2', x: 812, y: 78 }, { id: '2-3', x: 726, y: 118 },
  { id: '2-4', x: 642, y: 80 }, { id: '2-B', x: 560, y: 116 },
  { id: '3-1', x: 452, y: 150 }, { id: '3-2', x: 360, y: 118 }, { id: '3-3', x: 268, y: 152 },
  { id: '3-4', x: 182, y: 112 }, { id: '3-B', x: 96, y: 160 },
  { id: '4-1', x: 462, y: 222 }, { id: '4-2', x: 534, y: 254 }, { id: '4-3', x: 606, y: 214 },
  { id: '4-4', x: 678, y: 252 }, { id: '4-B', x: 752, y: 216 },
  { id: 'trail', x: 470, y: 66, label: 'The Almanac Trail', trail: true },
];

export class MapScene {
  constructor() { this.t = 0; this.moving = null; }
  enter() {
    const d = state.data;
    this.i = Math.min(d.mapNode || 0, NODES.length - 1);
    while (this.i > 0 && !this.unlocked(this.i)) this.i--;
    this.fx = NODES[this.i].x; this.fy = NODES[this.i].y;
    const stones = Object.values(d.stones).filter(Boolean).length;
    playMusic('map', { drums: 0, bass: stones >= 1 ? 1 : 0, keys: 0.8, pad: 0.9, lead: 1 });
    engine.irisX = this.fx; engine.irisY = this.fy;
  }
  unlocked(i) {
    const d = state.data;
    if (i <= 1) return true;
    const n = NODES[i];
    if (n.locked) return false;
    if (n.trail) return !!d.cleared['4-B'];
    return !!d.cleared[NODES[i - 1].id];
  }
  update(dt) {
    this.t += dt;
    state.data.time += dt;
    if (engine.trans) return;
    if (this.moving) {
      const m = this.moving;
      m.t += dt / 0.32;
      const k = Math.min(1, m.t);
      this.fx = lerp(m.from.x, m.to.x, k); this.fy = lerp(m.from.y, m.to.y, k) - Math.sin(k * Math.PI) * 14;
      if (k >= 1) { this.moving = null; this.i = m.toI; state.data.mapNode = this.i; }
      return;
    }
    if (input.pressed('pause')) { this.openPause(); return; }
    const fwd = input.pressed('right') || input.pressed('up');
    const back = input.pressed('left') || input.pressed('down');
    if (fwd && this.i < NODES.length - 1) {
      if (this.unlocked(this.i + 1)) this.go(this.i + 1);
      else { sfx('deny'); toast('Clear this level first to open the path'); }
    } else if (back && this.i > 0) this.go(this.i - 1);
    if (input.pressed('confirm')) this.enterNode();
  }
  go(j) { sfx('move'); this.moving = { from: NODES[this.i], to: NODES[j], toI: j, t: 0 }; this.facing = j > this.i ? (NODES[j].x >= NODES[this.i].x ? 1 : -1) : (NODES[j].x >= NODES[this.i].x ? 1 : -1); }
  enterNode() {
    const n = NODES[this.i];
    saveGame();
    if (n.id === 'den') { sfx('door'); transition(() => setScene(new DenScene({ fromDoor: true })), n.x, n.y); }
    else if (n.locked) { sfx('deny'); toast('Coming in the next build!'); }
    else if (n.trail) { sfx('door'); transition(() => setScene(new TrailScene()), n.x, n.y); }
    else { sfx('select'); transition(() => setScene(new LevelScene(n.id)), n.x, n.y); }
  }
  openPause() {
    pushOverlay(new ListMenu({
      title: 'Map menu',
      items: [
        { label: 'Back to the map', select: () => engine.overlays.pop() },
        { label: 'Settings cabinet', select: () => pushOverlay(new SettingsCabinet()) },
        { label: 'Save and quit to title', select: () => { saveGame(); engine.overlays.pop(); transition(() => setScene(new TitleScene(true))); } },
      ],
    }));
  }

  render(ctx) {
    const d = state.data, b = engine.boil, rng = rngFor(101, b);
    const stones = Object.values(d.stones).filter(Boolean).length;
    const f = Math.max(0, 0.75 - stones * 0.2);
    const c = (hex) => fade(hex, f);
    const bloomAwake = !!d.cleared['1-B'];
    const bc = (hex) => fade(hex, bloomAwake ? 0.05 : Math.max(0.2, f - 0.1));
    ctx.fillStyle = c('#f1dfb9'); ctx.fillRect(0, 0, W, H);
    shape(ctx, [[-10, 470], [200, 440], [420, 470], [700, 430], [W + 10, 450], [W + 10, H + 10], [-10, H + 10]], { fill: c('#cfe0a0'), rng, lw: 2, wob: 2 });
    // river
    line(ctx, [[-10, 250], [140, 270], [300, 230], [420, 260], [540, 210], [640, 160]], { rng, stroke: c('#9fcad6'), lw: 14, wob: 2 });

    // Foxhollows town
    for (const [hx, hy, s] of [[170, 330, 1], [300, 410, 0.9], [380, 380, 0.8], [200, 470, 0.8], [420, 300, 0.7]]) {
      shape(ctx, rrect(hx - 22 * s, hy - 26 * s, 44 * s, 32 * s, 3), { fill: c('#ecd6b0'), rng, lw: 2 });
      shape(ctx, [[hx - 28 * s, hy - 24 * s], [hx, hy - 48 * s], [hx + 28 * s, hy - 24 * s]], { fill: c('#b9654a'), rng, lw: 2 });
    }
    shape(ctx, rrect(258, 200, 36, 100, 3), { fill: c('#ddb98f'), rng, lw: 2.2 });
    shape(ctx, [[252, 202], [276, 166], [300, 202]], { fill: c('#b9654a'), rng, lw: 2.2 });
    shape(ctx, ellipse(276, 226, 12, 12, 14), { fill: '#fffaf0', rng, lw: 2 });
    line(ctx, [[276, 226], [276, 218]], { rng, lw: 1.6 });
    text(ctx, 'Foxhollows Square', 372, 250, { size: 22, color: '#5a4636', align: 'center' });

    // Bloomwood
    for (const [tx, ty, s] of [[520, 420, 1], [640, 410, 1.1], [760, 400, 0.9], [880, 360, 1], [900, 260, 0.8], [770, 330, 0.7]]) {
      line(ctx, [[tx, ty], [tx, ty - 30 * s]], { rng, stroke: bc('#86603f'), lw: 4 });
      shape(ctx, ellipse(tx, ty - 44 * s, 26 * s, 22 * s, 14), { fill: bc('#f7c2d2'), rng, lw: 2 });
    }
    text(ctx, 'Bloomwood', 880, 470, { size: 24, color: '#5a4636', align: 'center' });

    // Millpond Reach (top right): a pond, the old mill, snowy pines. Colour returns once Old Pike is beaten.
    const pc = (hex) => fade(hex, d.cleared['2-B'] ? 0.05 : d.stones.winter ? 0.35 : 0.6);
    shape(ctx, ellipse(760, 104, 130, 34, 24), { fill: pc('#a9d2e6'), rng, lw: 2.2 });
    shape(ctx, rrect(862, 26, 40, 46, 3), { fill: pc('#cfc9c0'), rng, lw: 2 });
    shape(ctx, [[856, 28], [882, 6], [908, 28]], { fill: pc('#7b8db0'), rng, lw: 2 });
    for (const [tx, ty] of [[600, 60], [700, 40], [930, 170]]) shape(ctx, [[tx - 16, ty + 14], [tx, ty - 20], [tx + 16, ty + 14]], { fill: pc('#7d9a8c'), rng, lw: 2, step: 10 });
    text(ctx, 'Millpond Reach', 760, 166, { size: 20, color: '#5a4636', align: 'center' });
    // Copperleaf Orchard (top left): rows of autumn trees.
    const oc = (hex) => fade(hex, d.cleared['3-B'] ? 0.05 : d.stones.autumn ? 0.35 : 0.6);
    for (const [tx, ty] of [[60, 80], [130, 60], [210, 70], [300, 64], [400, 76], [70, 236], [150, 224]]) {
      line(ctx, [[tx, ty + 22], [tx, ty + 6]], { rng, stroke: oc('#6e4a30'), lw: 4 });
      shape(ctx, ellipse(tx, ty - 6, 24, 18, 12), { fill: oc('#e0783a'), rng, lw: 2 });
    }
    text(ctx, 'Copperleaf Orchard', 250, 30, { size: 20, color: '#5a4636', align: 'center' });
    // Sunglass Greenhouse (middle): a long glasshouse with palms inside.
    const gc = (hex) => fade(hex, d.cleared['4-B'] ? 0.05 : d.stones.summer ? 0.35 : 0.6);
    ctx.save(); ctx.globalAlpha = 0.9;
    shape(ctx, [[432, 270], [432, 206], [462, 180], [758, 180], [790, 206], [790, 270]], { fill: gc('#cfeee4'), rng, lw: 2.4, step: 30 });
    ctx.restore();
    for (let gx = 466; gx <= 754; gx += 36) line(ctx, [[gx, 182], [gx, 270]], { rng, stroke: gc('#865b33'), lw: 1.6 });
    for (const [px, py] of [[490, 262], [640, 262], [720, 262]]) {
      line(ctx, [[px, py], [px + 2, py - 30]], { rng, stroke: gc('#7a5a3a'), lw: 3 });
      shape(ctx, ellipse(px + 2, py - 34, 18, 8, 12), { fill: gc('#5aa86a'), rng, lw: 1.6 });
    }
    text(ctx, 'Sunglass Greenhouse', 610, 296, { size: 18, color: '#5a4636', align: 'center' });
    // The Hollow Oak, at the far end of the Almanac Trail.
    ctx.save(); ctx.globalAlpha = d.cleared['4-B'] ? 0.95 : 0.55;
    line(ctx, [[540, 44], [542, 4]], { rng, stroke: fade('#6b4a30', 0.3), lw: 7 });
    shape(ctx, ellipse(541, 6, 38, 20, 14), { fill: fade('#6f8f5a', 0.3), rng, lw: 2 });
    ctx.restore();

    // paths
    for (let i = 0; i < NODES.length - 1; i++) {
      const a = NODES[i], n = NODES[i + 1];
      const open = this.unlocked(i + 1);
      ctx.save();
      ctx.strokeStyle = '#5a4636'; ctx.lineWidth = open ? 4 : 2.5; ctx.lineCap = 'round';
      ctx.setLineDash(open ? [2, 10] : [2, 14]); ctx.globalAlpha = open ? 0.9 : 0.35;
      ctx.beginPath(); ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo((a.x + n.x) / 2 + (i % 2 ? 24 : -24), (a.y + n.y) / 2 + 18, n.x, n.y);
      ctx.stroke();
      ctx.restore();
    }

    // nodes
    NODES.forEach((n, i) => {
      const open = this.unlocked(i);
      const done = d.cleared[n.id];
      const nr = rngFor(110 + i, b);
      if (n.id === 'den') {
        shape(ctx, [[n.x - 26, n.y + 10], [n.x - 26, n.y - 10], [n.x, n.y - 34], [n.x + 26, n.y - 10], [n.x + 26, n.y + 10]], { fill: '#d98f6f', rng: nr, lw: 2.6 });
        shape(ctx, rrect(n.x - 7, n.y - 6, 14, 16, 6), { fill: '#6f9b6a', rng: nr, lw: 2 });
      } else if (n.id.endsWith('-B')) {
        ctx.save(); ctx.globalAlpha = open ? 1 : 0.4;
        if (n.id === '1-B') drawPumpkin(ctx, n.x, n.y + 16, { scale: 0.2, boil: b, face: done ? 'dizzy' : 'angry' });
        else if (n.id === '2-B') { ctx.translate(n.x, n.y); ctx.scale(0.3, 0.3); drawPike(ctx, 0, 0, { boil: b, dizzy: done, facing: -1 }); }
        else if (n.id === '3-B') { ctx.translate(n.x, n.y + 24); ctx.scale(0.2, 0.2); drawScarecrow(ctx, 0, 0, { boil: b, dizzy: done }); }
        else { ctx.translate(n.x, n.y); ctx.scale(0.28, 0.28); drawSunMoth(ctx, 0, 0, { boil: b, t: this.t, dazed: done, shield: done ? 0 : 1 }); }
        ctx.restore();
      } else if (n.trail) {
        ctx.save(); ctx.globalAlpha = open ? 1 : 0.45;
        shape(ctx, rrect(n.x - 20, n.y - 16, 40, 30, 4), { fill: '#f3e3c3', rng: nr, lw: 2.4 });
        for (let k = 0; k < 4; k++) dot(ctx, n.x - 12 + k * 8, n.y - 2, 3, ['#f08fae', '#f2b33d', '#d9662b', '#7fb6e0'][k]);
        line(ctx, [[n.x, n.y - 16], [n.x, n.y + 14]], { rng: nr, lw: 1.6 });
        ctx.restore();
      } else {
        const col = n.locked ? '#c9c1b4' : done ? '#86c463' : open ? '#f2c14e' : '#d9cfbf';
        shape(ctx, ellipse(n.x, n.y, 16, 13, 14), { fill: col, rng: nr, lw: 2.6 });
        if (n.locked) text(ctx, '?', n.x, n.y + 7, { size: 20, align: 'center' });
        else text(ctx, n.id.split('-')[1], n.x, n.y + 7, { size: 18, align: 'center' });
      }
    });

    // Fennel token
    drawFox(ctx, this.fx, this.fy - 6, { scale: 0.8, t: this.t, pose: this.moving ? 'run' : 'idle', phase: this.t * 12, facing: this.facing || 1, outfit: d.outfit, scarfColor: SEASON_COLOR[d.stones.spring ? 'spring' : 'none'], boil: b, speed: this.moving ? 200 : 0 });

    // info card
    const n = NODES[this.i];
    const info = LEVEL_INFO[n.id];
    const name = n.label || info?.name || '';
    panel(ctx, W / 2 - 250, H - 92, 500, 78, { seed: 120, r: 16 });
    text(ctx, n.locked ? name : (info ? `${n.id.endsWith('-B') ? 'Boss' : n.id}  ·  ${name}` : name), W / 2, H - 58, { size: 26, align: 'center', ui: true });
    if (info && info.seeds) {
      const s = d.seeds[n.id] || [];
      for (let k = 0; k < 3; k++) drawSeed(ctx, W / 2 + 160 + k * 26, H - 64, { ghost: !s[k], boil: b, t: 0 });
    }
    const secretNote = d.secrets?.[n.id] ? '  ★ Starbloom found' : '';
    const sub = n.id === 'den' ? 'Your home: furniture, wardrobe and settings' : n.trail ? (this.unlocked(this.i) ? 'Twenty tricky levels that need every season' : 'Wake up the Greenhouse to open the trail') : n.locked ? 'Coming in the next build' : d.cleared[n.id] ? 'Cleared! Play again to find more golden seeds' : 'Not cleared yet';
    text(ctx, `${sub}${secretNote}   ·   ${fmt('{jump}')} to enter`, W / 2, H - 28, { size: 18, align: 'center', color: '#7a6656', ui: true });

    // lives + acorns (bottom right, clear of the regions at the top)
    panel(ctx, W - 226, H - 60, 214, 46, { seed: 121, r: 14 });
    drawPaw(ctx, W - 202, H - 36, 0.95, true, b); text(ctx, '× ' + d.lives, W - 186, H - 28, { size: 22 });
    drawAcorn(ctx, W - 50, H - 40, 0.9, b); text(ctx, '' + d.acorns, W - 36, H - 30, { size: 20 });
    text(ctx, 'Foxhollows', 16, H - 16, { size: 34, color: shade('#b5503a', -0.1), outline: '#fffaf0' });
  }
}
