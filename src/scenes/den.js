// Fennel's Den: walk around, decorate on a grid (Animal Crossing style), dress up, change settings, shop.
import { engine, W, H, setScene, transition, pushOverlay, popOverlay, toast } from '../core/engine.js';
import { input } from '../core/input.js';
import { state, saveGame } from '../core/state.js';
import { clamp } from '../core/util.js';
import { shape, line, rrect, ellipse, rngFor, dot, text, panel, keycap } from '../art/ink.js';
import { drawFox } from '../art/fox.js';
import { drawThimble, drawStoneGem, drawPaw, drawAcorn } from '../art/critters.js';
import { FURN, SLOT, WALL_ROWS, FLOOR_ROWS, WALLPAPERS, FLOORS, drawFurniture, drawWallpaper, drawFlooring } from '../art/furniture.js';
import { SEASON_COLOR, SEASON_ORDER } from '../art/palettes.js';
import { Player } from '../game/player.js';
import { LevelScene } from '../game/level.js';
import { DISTRICTS } from '../game/story.js';
import { slotFree, findSpot, rowsFor } from '../game/progress.js';
import { Dialogue, LetterCard, ListMenu, fmt, dim } from '../ui/ui.js';
import { SettingsCabinet, Wardrobe, Catalogue, Storage } from '../ui/screens.js';
import { playMusic, TRACK_NAMES } from '../audio/music.js';
import { sfx } from '../audio/sfx.js';
import { MapScene } from './map.js';

const FLOOR = FLOOR_ROWS[0];
const FIXED = [
  { id: 'door', s: 0, w: 2, label: 'Out to the map' },
  { id: 'wardrobe', s: 2, w: 2, label: 'Wardrobe' },
  { id: 'fire', s: 9, w: 2, label: 'Mantelpiece' },
  { id: 'cabinet', s: 16, w: 2, label: 'Settings cabinet' },
  { id: 'chest', s: 18, w: 1, label: 'Storage chest' },
  { id: 'catalogue', s: 19, w: 1, label: 'Catalogue & decorating' },
];
const rowY = (layer, row) => (layer === 'wall' ? WALL_ROWS[row] : FLOOR_ROWS[row]);
const ROW_NAMES = { wall: ['High wall', 'Low wall'], floor: ['Back', 'Middle', 'Front'] };

export function playRecord() {
  const r = state.data.record || 'den';
  if (r === 'map') playMusic('map', { bass: 1, drums: 0 });
  else if (r === 'bloom') playMusic('bloom', { lead: 0.9, birds: 1, shaker: 0.8, hum: 0.2 });
  else if (r === 'pond') playMusic('pond', { lead: 1, chimes: 1, hum: 0.25 });
  else if (r === 'orchard') playMusic('orchard', { lead: 1, wind: 1, hum: 0.25 });
  else if (r === 'glass') playMusic('glass', { lead: 1, shaker: 1, hum: 0.25 });
  else if (r === 'almanac') playMusic('almanac', { lead: 1, hum: 0.3 });
  else if (r === 'clock') playMusic('clock', { bass: 1, drums: 0.8, pad: 0.7, bells: 0.6 });
  else playMusic(r);
}

// Draw one placed item at its grid position.
function drawPlaced(ctx, it, boil, season, alpha = 1) {
  const def = FURN[it.id];
  const row = it.row || 0;
  if (alpha !== 1) { ctx.save(); ctx.globalAlpha = alpha; }
  drawFurniture(ctx, it.id, it.slot * SLOT, def.layer === 'wall' ? FLOOR : FLOOR_ROWS[row], it.flip, boil, season, WALL_ROWS[def.layer === 'wall' ? row : 0]);
  if (alpha !== 1) ctx.restore();
}

export class DenScene {
  constructor(opts = {}) {
    this.opts = opts; this.t = 0; this.carry = null; this.target = null;
    this.w = 20; this.h = 12;
    this.move = LevelScene.prototype.move;
    this.touchWall = LevelScene.prototype.touchWall;
    this.canSeason = false;
  }
  solid(tx, ty) { return tx < 0 || tx >= 20 || ty >= 9; }
  oneway() { return false; }

  enter() {
    const d = state.data;
    playRecord();
    const x = this.opts.fromDoor ? 70 : 250;
    this.player = new Player(x, FLOOR);
    this.player.facing = 1;
    this.thimble = d.introDone ? null : { x: 640, leaving: false };
    this.pendingIntro = !d.introDone;
    this.pendingWake = !!this.opts.wake;
    engine.irisX = x; engine.irisY = FLOOR - 20;
  }

  intro() {
    pushOverlay(new Dialogue([
      { who: 'thimble', text: 'Wake up, {name}! Something dreadful has happened.' },
      { who: 'thimble', text: 'The Season Clock in the square has stopped. All of Foxhollows has gone still and grey.' },
      { who: 'thimble', text: 'The four season-stones that power it are... well. I, er, cannot quite remember where they went.' },
      { who: 'thimble', text: "You're my apprentice, so would you go and look? Start in the square, then try Bloomwood. It has been stuck in spring for months." },
      { who: 'thimble', text: 'This den is all yours. The catalogue by the window sells furniture, and you can decorate on a grid from there too.' },
      { who: 'thimble', text: 'The wardrobe has your clothes, and the old cabinet holds all the settings. Off you go, then! The door leads out.' },
    ], () => {
      state.data.introDone = true; saveGame();
      if (this.thimble) this.thimble.leaving = true;
    }));
  }

  findTarget(slot) {
    for (const f of FIXED) if (slot >= f.s && slot < f.s + f.w) return { ...f, label: f.id === 'chest' && this.carry ? 'Put it in the chest' : f.label };
    for (const p of state.data.furniture.placed) {
      const def = FURN[p.id];
      if (def.layer === 'floor' && def.use && slot >= p.slot && slot < p.slot + def.w) {
        return { id: def.use, label: def.use === 'bed' ? 'Bed (save the game)' : 'Record player' };
      }
    }
    return null;
  }

  use(t) {
    const d = state.data;
    switch (t.id) {
      case 'door':
        sfx('door'); d.mapNode = 0; saveGame();
        transition(() => setScene(new MapScene()), 50, FLOOR - 60);
        break;
      case 'wardrobe': pushOverlay(new Wardrobe()); break;
      case 'cabinet': pushOverlay(new SettingsCabinet()); break;
      case 'catalogue':
        pushOverlay(new ListMenu({
          title: 'Catalogue',
          items: [
            { label: 'Shop', select: () => pushOverlay(new Catalogue()), hint: 'Furniture sets, wall decor, rugs, wallpaper, flooring and outfits' },
            { label: 'Decorate on the grid', select: () => { popOverlay(); pushOverlay(new DecorateMode(this)); }, hint: 'Move furniture cell by cell, high and low on the walls, back to front on the floor' },
            { label: 'Wallpaper & flooring', select: () => pushOverlay(roomStyleMenu()), hint: 'Change the look of the walls and floor' },
          ],
        }));
        break;
      case 'fire': {
        const n = Object.values(d.stones).filter(Boolean).length;
        pushOverlay(new Dialogue([{ who: null, text: `The mantelpiece holds your season-stones. You have found ${n} of 4.` }], () => {
          const letters = Object.entries(DISTRICTS).filter(([, D]) => d.letters.includes(D.letterKey));
          if (!letters.length) return;
          pushOverlay(new ListMenu({
            title: 'Memory letters',
            items: letters.map(([num, D]) => ({
              label: `Letter ${num}: ${D.name}`,
              select: () => pushOverlay(new LetterCard(`A memory letter (${num} of 4)`, D.letter, '— T.')),
            })),
            note: 'Tucked behind the mantel clock.',
          }));
        }));
        break;
      }
      case 'chest':
        if (this.carry) { d.furniture.stored.push(this.carry.id); this.carry = null; sfx('place'); toast('Stored in the chest'); saveGame(); }
        else pushOverlay(new Storage((id) => { this.carry = { id, flip: false }; sfx('pickup'); }));
        break;
      case 'bed': saveGame(); sfx('select'); toast('Game saved. Sweet dreams!'); break;
      case 'record': {
        const list = d.tracks;
        const i = list.indexOf(d.record);
        d.record = list[(i + 1) % list.length];
        playRecord(); saveGame();
        toast('♪ Now playing: ' + TRACK_NAMES[d.record]);
        break;
      }
      default: break;
    }
  }

  // Walking mode: pick up whatever is at Fennel's spot (floor back-to-front, then the walls, then rugs).
  itemAt(slot) {
    const placed = state.data.furniture.placed;
    const order = [['floor', 0], ['floor', 1], ['floor', 2], ['wall', 1], ['wall', 0], ['rug', 0], ['rug', 1], ['rug', 2]];
    for (const [layer, row] of order) {
      const it = placed.find((p) => FURN[p.id].layer === layer && (p.row || 0) === row && slot >= p.slot && slot < p.slot + FURN[p.id].w);
      if (it) return it;
    }
    return null;
  }
  pick(slot) {
    const it = this.itemAt(slot);
    if (!it) return;
    const placed = state.data.furniture.placed;
    placed.splice(placed.indexOf(it), 1);
    this.carry = { id: it.id, flip: it.flip };
    sfx('pickup');
  }
  place(slot) {
    const spot = findSpot(this.carry.id, slot);
    if (spot) {
      state.data.furniture.placed.push({ id: this.carry.id, slot: spot.slot, row: spot.row, flip: this.carry.flip });
      this.carry = null; sfx('place'); saveGame();
    } else if (slot === 18) this.use({ id: 'chest' });
    else { sfx('deny'); toast('No room there. Try another spot!'); }
  }

  update(dt) {
    this.t += dt;
    state.data.time += dt;
    if (engine.trans) return;
    if (this.pendingIntro) { this.pendingIntro = false; this.intro(); return; }
    if (this.pendingWake) { this.pendingWake = false; pushOverlay(new Dialogue([{ who: 'fennel', text: 'Mmm... that nap did me good. Back to ten lives!' }])); return; }
    if (input.pressed('pause')) { pushOverlay(new SettingsCabinet()); return; }
    const p = this.player;
    p.update(dt, this);
    if (this.thimble?.leaving) { this.thimble.x -= 140 * dt; if (this.thimble.x < 40) { this.thimble = null; sfx('door'); } }
    const slot = clamp(Math.floor(p.cx / SLOT), 0, 19);
    this.slot = slot;
    this.target = this.findTarget(slot);
    if (input.pressed('up') && this.target && p.onGround) { this.use(this.target); return; }
    if (input.pressed('sprint')) { if (this.carry) this.place(slot); else this.pick(slot); }
    if (input.pressed('flip')) {
      if (this.carry) this.carry.flip = !this.carry.flip;
      else { const it = this.itemAt(slot); if (it) { it.flip = !it.flip; saveGame(); } }
      sfx('move');
    }
  }

  drawRoom(ctx) {
    const b = engine.boil, rng = rngFor(81, b), d = state.data;
    drawWallpaper(ctx, d.den?.wallpaper || 'stripes', W, 0, FLOOR);
    shape(ctx, [[-10, -10], [W + 10, -10], [W + 10, 44], [-10, 52]], { fill: '#7a5232', rng, lw: 3 });
    for (let x = 30; x < W; x += 120) line(ctx, [[x, 46], [x + 8, 70], [x - 4, 92]], { rng, stroke: '#7a5232', lw: 3 });
    shape(ctx, [[-10, 330], [W + 10, 330], [W + 10, FLOOR], [-10, FLOOR]], { fill: '#c58f5f', rng, lw: 2.6, wash: false });
    for (let x = 40; x < W; x += 96) shape(ctx, rrect(x, 344, 72, 74, 6), { stroke: '#8e6438', lw: 1.6, rng });
    drawFlooring(ctx, d.den?.floor || 'planks', W, FLOOR, H, rng);

    const sky = d.stones.spring ? '#bfe3ee' : '#e8d7bb';
    shape(ctx, ellipse(672, 190, 50, 50, 20), { fill: '#8e6438', rng, lw: 2.6 });
    shape(ctx, ellipse(672, 190, 40, 40, 20), { fill: sky, rng, lw: 2.2 });
    if (d.stones.spring) for (let i = 0; i < 5; i++) dot(ctx, 650 + i * 11, 210 + Math.sin(i) * 6, 4, '#f4a3bf');
    line(ctx, [[672, 150], [672, 230]], { rng, lw: 2.2 }); line(ctx, [[632, 190], [712, 190]], { rng, lw: 2.2 });

    shape(ctx, [[14, FLOOR], [14, 300], [20, 276], [48, 262], [76, 276], [82, 300], [82, FLOOR]], { fill: '#6f9b6a', rng, lw: 3 });
    dot(ctx, 70, 360, 5, '#f2c14e');
    shape(ctx, rrect(100, 226, 88, FLOOR - 226, 6), { fill: '#9c6b43', rng, lw: 3 });
    line(ctx, [[144, 236], [144, FLOOR - 10]], { rng, lw: 2 });
    dot(ctx, 136, 330, 4, '#f2c14e'); dot(ctx, 152, 330, 4, '#f2c14e');
    shape(ctx, [[94, 226], [194, 226], [188, 210], [100, 210]], { fill: '#7b5233', rng, lw: 2.4 });
    shape(ctx, rrect(440, 40, 80, 270, 4), { fill: '#c9bba6', rng, lw: 2.6 });
    shape(ctx, [[424, FLOOR], [424, 300], [536, 300], [536, FLOOR]], { fill: '#bfae96', rng, lw: 3 });
    shape(ctx, [[448, FLOOR], [448, 350], [480, 330], [512, 350], [512, FLOOR]], { fill: '#3a2a24', rng, lw: 2.4 });
    for (let i = 0; i < 3; i++) {
      const fx = 466 + i * 14, fh = 26 + Math.sin(this.t * 9 + i * 2) * 8;
      shape(ctx, [[fx - 9, FLOOR - 4], [fx, FLOOR - 4 - fh], [fx + 9, FLOOR - 4]], { fill: i === 1 ? '#f6c453' : '#ef7f3a', stroke: null, rng, wash: false, step: 6 });
    }
    ctx.save(); ctx.globalAlpha = 0.12 + Math.sin(this.t * 7) * 0.03; dot(ctx, 480, FLOOR - 30, 90, '#ffb35a'); ctx.restore();
    shape(ctx, rrect(414, 290, 132, 14, 3), { fill: '#7b5233', rng, lw: 2.4 });
    SEASON_ORDER.forEach((s, i) => drawStoneGem(ctx, 438 + i * 28, 274, s, { empty: !d.stones[s], scale: 0.85, t: this.t, boil: b, noGlow: !d.stones[s] }));
    shape(ctx, rrect(770, 270, 92, FLOOR - 270, 5), { fill: '#b07d50', rng, lw: 3 });
    ['Sound', 'Controls', 'Assist', 'Display', 'Saves'].forEach((n, i) => {
      shape(ctx, rrect(778, 280 + i * 30, 76, 24, 3), { fill: '#c99a63', rng, lw: 1.6, wash: false });
      text(ctx, n, 816, 298 + i * 30, { size: 15, align: 'center' });
    });
    shape(ctx, rrect(868, 388, 44, 44, 6), { fill: '#8f6140', rng, lw: 2.6 });
    line(ctx, [[868, 404], [912, 404]], { rng, lw: 2 }); dot(ctx, 890, 412, 3.5, '#f2c14e');
    line(ctx, [[936, FLOOR], [936, 384]], { rng, lw: 4, stroke: '#7a5232' });
    shape(ctx, [[914, 388], [958, 372], [958, 384], [914, 398]], { fill: '#fbf0dc', rng, lw: 2, step: 8 });
  }

  render(ctx) {
    const b = engine.boil, d = state.data;
    this.drawRoom(ctx);
    const placed = d.furniture.placed;
    const season = d.stones.spring ? SEASON_COLOR.spring : null;
    const of = (layer, row) => placed.filter((it) => FURN[it.id].layer === layer && (it.row || 0) === row);
    for (const row of [0, 1]) for (const it of of('wall', row)) drawPlaced(ctx, it, b, season);
    for (const row of [0, 1, 2]) for (const it of of('rug', row)) drawPlaced(ctx, it, b, season);
    for (const it of of('floor', 0)) drawPlaced(ctx, it, b, season);

    if (this.thimble) drawThimble(ctx, this.thimble.x, FLOOR, { facing: -1, boil: b });
    const p = this.player;
    drawFox(ctx, p.cx, p.bottom + 1, {
      facing: p.facing, t: p.t, pose: p.pose(), phase: p.phase, squash: p.squash, outfit: d.outfit,
      scarfColor: SEASON_COLOR[d.stones.spring ? 'spring' : 'none'], speed: p.vx, boil: b,
    });
    for (const row of [1, 2]) for (const it of of('floor', row)) drawPlaced(ctx, it, b, season);

    if (this.carry) {
      const def = FURN[this.carry.id];
      ctx.save();
      ctx.translate(p.cx, p.y - 8); ctx.scale(0.55, 0.55);
      ctx.translate(-def.w * SLOT / 2, def.layer === 'rug' ? -18 : 0);
      drawFurniture(ctx, this.carry.id, 0, 0, this.carry.flip, b, season, -WALL_ROWS[0] * 0 - 40);
      ctx.restore();
      const spot = findSpot(this.carry.id, this.slot ?? 0);
      const s = spot ? spot.slot : clamp((this.slot ?? 0) - Math.floor((def.w - 1) / 2), 0, 20 - def.w);
      const y = spot ? rowY(def.layer, spot.row) : rowY(def.layer, 0);
      ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = spot ? '#5c9a45' : '#c9473d'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
      ctx.strokeRect(s * SLOT + 3, def.layer === 'wall' ? y - 44 : y - 8, def.w * SLOT - 6, def.layer === 'wall' ? 88 : 16);
      ctx.restore();
    }
    if (this.target && !this.thimble) {
      text(ctx, `${fmt('{up}')}  ${this.target.label}`, p.cx, p.y - (this.carry ? 90 : 26), { size: 22, align: 'center', outline: '#fffaf0', ui: true });
    }

    if (this.hideHud) return;
    panel(ctx, 12, 60, 230, 84, { seed: 82, r: 14 });
    text(ctx, d.name, 30, 92, { size: 24, color: '#b5503a' });
    drawPaw(ctx, 36, 122, 0.95, true, b); text(ctx, '× ' + d.lives, 52, 130, { size: 22 });
    drawAcorn(ctx, 160, 88, 1, b); text(ctx, '× ' + d.acorns, 176, 96, { size: 22 });
    const hint = `${fmt('{up}')} use   ${fmt('{sprint}')} pick up / put down   ${fmt('{flip}')} flip   ${fmt('{pause}')} settings`;
    panel(ctx, W / 2 - 330, H - 50, 660, 40, { seed: 83, r: 12 });
    text(ctx, hint, W / 2, H - 22, { size: 20, align: 'center', ui: true });
  }
}

function roomStyleMenu() {
  const d = state.data;
  const cyc = (list, cur, dir) => list[(list.indexOf(cur) + dir + list.length) % list.length];
  const set = (k, v) => { d.den[k] = v; saveGame(); };
  return new ListMenu({
    title: 'Wallpaper & flooring',
    items: [
      { label: 'Wallpaper', value: () => WALLPAPERS[d.den.wallpaper].name, left: () => set('wallpaper', cyc(d.unlocked.wallpaper, d.den.wallpaper, -1)), right: () => set('wallpaper', cyc(d.unlocked.wallpaper, d.den.wallpaper, 1)),
        hint: () => `${d.unlocked.wallpaper.length} of ${Object.keys(WALLPAPERS).length} wallpapers. Buy more in the shop.` },
      { label: 'Flooring', value: () => FLOORS[d.den.floor].name, left: () => set('floor', cyc(d.unlocked.floor, d.den.floor, -1)), right: () => set('floor', cyc(d.unlocked.floor, d.den.floor, 1)),
        hint: () => `${d.unlocked.floor.length} of ${Object.keys(FLOORS).length} floors. Buy more in the shop.` },
    ],
    y: 300, dimBg: false,
  });
}

// ---------------- Decorate mode: a grid cursor over the room ----------------
// Rows top to bottom: high wall, low wall, floor back, middle, front.
const GRID_ROWS = [['wall', 0], ['wall', 1], ['floor', 0], ['floor', 1], ['floor', 2]];

export class DecorateMode {
  constructor(den) {
    this.den = den; den.hideHud = true;
    this.ri = 2; this.slot = clamp(Math.floor(den.player.cx / SLOT), 0, 19);
    this.hold = null; this.t = 0;
  }
  exit() { this.den.hideHud = false; }
  get row() { return GRID_ROWS[this.ri]; }
  // Which rows a held item may go in (walls for wall decor, the floor for everything else).
  allowed(ri) {
    if (!this.hold) return true;
    const isWall = FURN[this.hold.id].layer === 'wall';
    return (GRID_ROWS[ri][0] === 'wall') === isWall;
  }
  snapRow() { if (!this.allowed(this.ri)) this.ri = FURN[this.hold.id].layer === 'wall' ? 0 : 2; }
  itemUnderCursor() {
    const [kind, row] = this.row;
    const placed = state.data.furniture.placed;
    const layers = kind === 'wall' ? ['wall'] : ['floor', 'rug'];
    for (const layer of layers) {
      const it = placed.find((p) => FURN[p.id].layer === layer && (p.row || 0) === row && this.slot >= p.slot && this.slot < p.slot + FURN[p.id].w);
      if (it) return it;
    }
    return null;
  }
  update(dt) {
    this.t += dt;
    const d = state.data;
    const w = this.hold ? FURN[this.hold.id].w : 1;
    if (input.pressed('left')) { this.slot = Math.max(0, this.slot - 1); sfx('move'); }
    if (input.pressed('right')) { this.slot = Math.min(20 - w, this.slot + 1); sfx('move'); }
    if (input.pressed('up') || input.pressed('down')) {
      const dir = input.pressed('up') ? -1 : 1;
      let r = this.ri;
      for (let i = 0; i < 5; i++) { r = clamp(r + dir, 0, 4); if (this.allowed(r)) break; }
      if (this.allowed(r) && r !== this.ri) { this.ri = r; sfx('move'); }
    }
    this.slot = Math.min(this.slot, 20 - w);
    if (input.pressed('confirm')) {
      if (this.hold) {
        const def = FURN[this.hold.id];
        const row = this.row[1];
        if (slotFree(def.layer, row, this.slot, def.w)) {
          d.furniture.placed.push({ id: this.hold.id, slot: this.slot, row, flip: this.hold.flip });
          this.hold = null; sfx('place'); saveGame();
        } else { sfx('deny'); }
      } else {
        const it = this.itemUnderCursor();
        if (it) {
          d.furniture.placed.splice(d.furniture.placed.indexOf(it), 1);
          this.hold = { id: it.id, flip: it.flip, from: { ...it } };
          this.slot = it.slot; sfx('pickup');
        }
      }
    } else if (input.pressed('sprint')) {
      if (this.hold) { d.furniture.stored.push(this.hold.id); this.hold = null; sfx('place'); toast('Put away in the chest'); saveGame(); }
      else pushOverlay(new Storage((id) => { this.hold = { id, flip: false }; this.snapRow(); this.slot = Math.min(this.slot, 20 - FURN[id].w); sfx('pickup'); }));
    } else if (input.pressed('flip')) {
      if (this.hold) this.hold.flip = !this.hold.flip;
      else { const it = this.itemUnderCursor(); if (it) { it.flip = !it.flip; saveGame(); } }
      sfx('move');
    } else if (input.pressed('back') || input.pressed('pause')) {
      if (this.hold) {
        if (this.hold.from) d.furniture.placed.push(this.hold.from);
        else d.furniture.stored.push(this.hold.id);
        this.hold = null;
      }
      saveGame(); sfx('back'); popOverlay(this);
    }
  }
  render(ctx) {
    const [kind, row] = this.row;
    const y = rowY(kind, row);
    const season = state.data.stones.spring ? SEASON_COLOR.spring : null;
    // The grid for the current row.
    // Light outline under a dark dashed line, so the grid shows on any wallpaper or floor.
    ctx.save();
    for (const [col, lw, dash] of [['rgba(255,250,240,0.8)', 3.5, []], ['rgba(59,42,38,0.6)', 1.5, [4, 5]]]) {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash);
      for (let s = 0; s < 20; s++) {
        if (kind === 'wall') ctx.strokeRect(s * SLOT + 2, y - 42, SLOT - 4, 84);
        else ctx.strokeRect(s * SLOT + 2, y - 10, SLOT - 4, 20);
      }
    }
    ctx.restore();
    // The held item follows the cursor, see-through.
    if (this.hold) {
      const def = FURN[this.hold.id];
      drawPlaced(ctx, { id: this.hold.id, slot: this.slot, row, flip: this.hold.flip }, engine.boil, season, 0.75);
      const ok = slotFree(def.layer, row, this.slot, def.w);
      ctx.save(); ctx.lineWidth = 3.5; ctx.strokeStyle = ok ? '#5c9a45' : '#c9473d'; ctx.fillStyle = ok ? 'rgba(92,154,69,0.15)' : 'rgba(201,71,61,0.15)';
      const hh = kind === 'wall' ? 84 : 20, yy = kind === 'wall' ? y - 42 : y - 10;
      ctx.fillRect(this.slot * SLOT + 2, yy, def.w * SLOT - 4, hh); ctx.strokeRect(this.slot * SLOT + 2, yy, def.w * SLOT - 4, hh);
      ctx.restore();
    } else {
      const it = this.itemUnderCursor();
      const s0 = it ? it.slot : this.slot, ww = it ? FURN[it.id].w : 1;
      const bob = Math.sin(this.t * 6) * 3;
      ctx.save(); ctx.lineWidth = 3.5; ctx.strokeStyle = '#f2c14e';
      const hh = kind === 'wall' ? 84 : 20, yy = kind === 'wall' ? y - 42 : y - 10;
      ctx.strokeRect(s0 * SLOT + 2, yy, ww * SLOT - 4, hh);
      ctx.restore();
      // A little paw pointer above the cursor.
      drawPaw(ctx, this.slot * SLOT + SLOT / 2, (kind === 'wall' ? y - 56 : y - 86) + bob, 1.2, true, engine.boil);
    }
    // Title + controls.
    panel(ctx, W / 2 - 170, 10, 340, 46, { seed: 85, r: 12 });
    text(ctx, `Decorating · ${ROW_NAMES[kind][row]}`, W / 2, 41, { size: 24, align: 'center', ui: true });
    panel(ctx, 20, H - 50, W - 40, 40, { seed: 86, r: 12 });
    const hint = this.hold
      ? `←→↑↓ move   ${fmt('{jump}')} place   ${fmt('{sprint}')} put in chest   ${fmt('{flip}')} flip   ${fmt('{pause}')} done`
      : `←→↑↓ move   ${fmt('{jump}')} pick up   ${fmt('{sprint}')} take from chest   ${fmt('{flip}')} flip   ${fmt('{pause}')} done`;
    text(ctx, hint, W / 2, H - 22, { size: 20, align: 'center', ui: true });
  }
}
export { keycap, dim };
