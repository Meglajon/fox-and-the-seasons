// Fennel's Den: walk around, move furniture, dress up, change settings, shop, and head out.
import { engine, W, H, setScene, transition, pushOverlay, toast } from '../core/engine.js';
import { input } from '../core/input.js';
import { state, saveGame } from '../core/state.js';
import { clamp } from '../core/util.js';
import { shape, line, rrect, ellipse, rngFor, dot, text, panel, keycap } from '../art/ink.js';
import { drawFox } from '../art/fox.js';
import { drawThimble, drawStoneGem, drawPaw, drawAcorn } from '../art/critters.js';
import { FURN, SLOT, drawFurniture } from '../art/furniture.js';
import { SEASON_COLOR, SEASON_ORDER } from '../art/palettes.js';
import { Player } from '../game/player.js';
import { LevelScene } from '../game/level.js';
import { DISTRICTS } from '../game/story.js';
import { slotFree } from '../game/progress.js';
import { Dialogue, Choice, LetterCard, ListMenu, fmt } from '../ui/ui.js';
import { SettingsCabinet, Wardrobe, Catalogue, Storage } from '../ui/screens.js';
import { playMusic, TRACK_NAMES } from '../audio/music.js';
import { sfx } from '../audio/sfx.js';
import { MapScene } from './map.js';

const FLOOR = 432;
const FIXED = [
  { id: 'door', s: 0, w: 2, label: 'Out to the map' },
  { id: 'wardrobe', s: 2, w: 2, label: 'Wardrobe' },
  { id: 'fire', s: 9, w: 2, label: 'Mantelpiece' },
  { id: 'cabinet', s: 16, w: 2, label: 'Settings cabinet' },
  { id: 'chest', s: 18, w: 1, label: 'Storage chest' },
  { id: 'catalogue', s: 19, w: 1, label: 'Catalogue' },
];

export function playRecord() {
  const r = state.data.record || 'den';
  if (r === 'map') playMusic('map', { bass: 1, drums: 0 });
  else if (r === 'bloom') playMusic('bloom', { lead: 0.9, birds: 1, shaker: 0.8, hum: 0.2 });
  else playMusic(r);
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
      { who: 'thimble', text: 'This den is all yours. Hold {sprint} to pick up furniture and put it down somewhere new. Press {up} to use things.' },
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
      case 'catalogue': pushOverlay(new Catalogue()); break;
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

  itemAt(slot) {
    const placed = state.data.furniture.placed;
    for (const layer of ['floor', 'wall', 'rug']) {
      const it = placed.find((p) => FURN[p.id].layer === layer && slot >= p.slot && slot < p.slot + FURN[p.id].w);
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
    const def = FURN[this.carry.id];
    const s = clamp(slot - Math.floor((def.w - 1) / 2), 0, 20 - def.w);
    if (slotFree(def.layer, s, def.w)) {
      state.data.furniture.placed.push({ id: this.carry.id, slot: s, flip: this.carry.flip });
      this.carry = null; sfx('place'); saveGame();
    } else if (slot === 18) this.use({ id: 'chest' });
    else { sfx('deny'); toast('No room there. Try another spot!'); }
  }

  update(dt) {
    this.t += dt;
    state.data.time += dt;
    if (engine.trans) return;
    if (this.pendingIntro) { this.pendingIntro = false; this.intro(); return; }
    if (this.pendingWake) { this.pendingWake = false; pushOverlay(new Dialogue([{ who: 'fennel', text: 'Mmm... that nap did me good. Back to five lives!' }])); return; }
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

  render(ctx) {
    const b = engine.boil, rng = rngFor(81, b), d = state.data;
    // walls
    ctx.fillStyle = '#ecd3a8'; ctx.fillRect(0, 0, W, FLOOR);
    for (let x = 0; x < W; x += 48) { ctx.fillStyle = 'rgba(190,140,90,0.12)'; ctx.fillRect(x, 0, 22, FLOOR); }
    for (let x = 24; x < W; x += 48) for (let y = 70; y < 320; y += 56) dot(ctx, x + ((y / 56) % 2) * 12, y, 3, 'rgba(214,120,110,0.35)');
    shape(ctx, [[-10, -10], [W + 10, -10], [W + 10, 44], [-10, 52]], { fill: '#7a5232', rng, lw: 3 });
    for (let x = 30; x < W; x += 120) line(ctx, [[x, 46], [x + 8, 70], [x - 4, 92]], { rng, stroke: '#7a5232', lw: 3 });
    shape(ctx, [[-10, 330], [W + 10, 330], [W + 10, FLOOR], [-10, FLOOR]], { fill: '#c58f5f', rng, lw: 2.6, wash: false });
    for (let x = 40; x < W; x += 96) shape(ctx, rrect(x, 344, 72, 74, 6), { stroke: '#8e6438', lw: 1.6, rng });
    shape(ctx, [[-10, FLOOR], [W + 10, FLOOR], [W + 10, H + 10], [-10, H + 10]], { fill: '#a8744b', rng, lw: 3, wash: false });
    for (let y = FLOOR + 26; y < H; y += 28) line(ctx, [[0, y], [W, y + 2]], { rng, stroke: '#8a5d3a', lw: 1.4 });

    // window (wall slots 13-14)
    const sky = d.stones.spring ? '#bfe3ee' : '#e8d7bb';
    shape(ctx, ellipse(672, 190, 50, 50, 20), { fill: '#8e6438', rng, lw: 2.6 });
    shape(ctx, ellipse(672, 190, 40, 40, 20), { fill: sky, rng, lw: 2.2 });
    if (d.stones.spring) for (let i = 0; i < 5; i++) dot(ctx, 650 + i * 11, 210 + Math.sin(i) * 6, 4, '#f4a3bf');
    line(ctx, [[672, 150], [672, 230]], { rng, lw: 2.2 }); line(ctx, [[632, 190], [712, 190]], { rng, lw: 2.2 });

    // door
    shape(ctx, [[14, FLOOR], [14, 300], [20, 276], [48, 262], [76, 276], [82, 300], [82, FLOOR]], { fill: '#6f9b6a', rng, lw: 3 });
    dot(ctx, 70, 360, 5, '#f2c14e');
    // wardrobe
    shape(ctx, rrect(100, 226, 88, FLOOR - 226, 6), { fill: '#9c6b43', rng, lw: 3 });
    line(ctx, [[144, 236], [144, FLOOR - 10]], { rng, lw: 2 });
    dot(ctx, 136, 330, 4, '#f2c14e'); dot(ctx, 152, 330, 4, '#f2c14e');
    shape(ctx, [[94, 226], [194, 226], [188, 210], [100, 210]], { fill: '#7b5233', rng, lw: 2.4 });
    // fireplace + mantel
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
    // cabinet
    shape(ctx, rrect(770, 270, 92, FLOOR - 270, 5), { fill: '#b07d50', rng, lw: 3 });
    ['Sound', 'Controls', 'Assist', 'Display', 'Saves'].forEach((n, i) => {
      shape(ctx, rrect(778, 280 + i * 30, 76, 24, 3), { fill: '#c99a63', rng, lw: 1.6, wash: false });
      text(ctx, n, 816, 298 + i * 30, { size: 15, align: 'center' });
    });
    // chest
    shape(ctx, rrect(868, 388, 44, 44, 6), { fill: '#8f6140', rng, lw: 2.6 });
    line(ctx, [[868, 404], [912, 404]], { rng, lw: 2 }); dot(ctx, 890, 412, 3.5, '#f2c14e');
    // catalogue lectern
    line(ctx, [[936, FLOOR], [936, 384]], { rng, lw: 4, stroke: '#7a5232' });
    shape(ctx, [[914, 388], [958, 372], [958, 384], [914, 398]], { fill: '#fbf0dc', rng, lw: 2, step: 8 });

    // furniture
    const placed = d.furniture.placed;
    const season = d.stones.spring ? SEASON_COLOR.spring : null;
    for (const layer of ['wall', 'rug', 'floor']) {
      for (const it of placed) if (FURN[it.id].layer === layer) drawFurniture(ctx, it.id, it.slot * SLOT, FLOOR, it.flip, b, season);
    }

    if (this.thimble) drawThimble(ctx, this.thimble.x, FLOOR, { facing: this.thimble.leaving ? -1 : -1, boil: b });
    const p = this.player;
    drawFox(ctx, p.cx, p.bottom + 1, {
      facing: p.facing, t: p.t, pose: p.pose(), phase: p.phase, squash: p.squash, outfit: d.outfit,
      scarfColor: SEASON_COLOR[d.stones.spring ? 'spring' : 'none'], speed: p.vx, boil: b,
    });
    if (this.carry) {
      ctx.save();
      const cx = p.cx, cy = p.y - 8;
      ctx.translate(cx, cy); ctx.scale(0.55, 0.55);
      const def = FURN[this.carry.id];
      const yoff = def.layer === 'wall' ? -200 : def.layer === 'rug' ? -18 : 0;
      ctx.translate(-def.w * SLOT / 2, yoff);
      drawFurniture(ctx, this.carry.id, 0, 0, this.carry.flip, b, season);
      ctx.restore();
      // placement guide
      const s = clamp((this.slot ?? 0) - Math.floor((def.w - 1) / 2), 0, 20 - def.w);
      const ok = slotFree(def.layer, s, def.w);
      ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = ok ? '#5c9a45' : '#c9473d'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
      ctx.strokeRect(s * SLOT + 3, def.layer === 'wall' ? 150 : FLOOR - 6, def.w * SLOT - 6, def.layer === 'wall' ? 100 : 14);
      ctx.restore();
    }
    if (this.target && !this.thimble) {
      text(ctx, `${fmt('{up}')}  ${this.target.label}`, p.cx, p.y - (this.carry ? 90 : 26), { size: 22, align: 'center', outline: '#fffaf0', ui: true });
    }

    // HUD
    panel(ctx, 12, 60, 230, 84, { seed: 82, r: 14 });
    text(ctx, d.name, 30, 92, { size: 24, color: '#b5503a' });
    for (let i = 0; i < Math.max(5, d.lives); i++) drawPaw(ctx, 34 + i * 22, 122, 0.85, i < d.lives, b);
    drawAcorn(ctx, 160, 88, 1, b); text(ctx, '× ' + d.acorns, 176, 96, { size: 22 });
    const hint = `${fmt('{up}')} use   ${fmt('{sprint}')} pick up / put down   ${fmt('{flip}')} flip   ${fmt('{pause}')} settings`;
    panel(ctx, W / 2 - 330, H - 50, 660, 40, { seed: 83, r: 12 });
    text(ctx, hint, W / 2, H - 22, { size: 20, align: 'center', ui: true });
  }
}
export { keycap };
