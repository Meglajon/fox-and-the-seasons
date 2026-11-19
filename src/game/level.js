// A playable level: tiles, physics, the season bubble (and what each season does to the world),
// lives, checkpoints, the bell, bosses and the HUD.
import { engine, W, H, setScene, transition, pushOverlay, toast, shake } from '../core/engine.js';
import { input } from '../core/input.js';
import { state, saveGame, START_LIVES } from '../core/state.js';
import { clamp, hash2, overlap, dist } from '../core/util.js';
import { T, drawTile } from '../art/tiles.js';
import { makePal, SEASON_COLOR } from '../art/palettes.js';
import { drawBackground } from '../art/backgrounds.js';
import { drawFox } from '../art/fox.js';
import { panel, text, shape, ellipse, rngFor, line, dot, keycap } from '../art/ink.js';
import { drawPaw, drawAcorn, drawSeed, drawSeasonIcon, drawZ, drawStoneGem } from '../art/critters.js';
import { drawLeafGlider } from '../art/critters2.js';
import { sfx } from '../audio/sfx.js';
import { playMusic, setLayer, setTempo, stopMusic, SEASON_LAYERS } from '../audio/music.js';
import { getLevel, LEVEL_INFO, LEVEL_ORDER } from './levels.js';
import { Player } from './player.js';
import {
  Critter, Acorn, PopAcorn, Berry, GoldenSeed, StonePickup, LetterPickup, Lantern, Bell, Mushroom, Soil, Sign, NPC, Pumpkin,
} from './entities.js';
import { Vent, Pike, Scarecrow, Burrow, Starbloom } from './bosses.js';
import { RAINBOW } from '../art/critters2.js';
import { DISTRICTS, npcLines } from './story.js';
import { addAcorns, addLife, checkSeedRewards, unlockOutfit, grantFurniture } from './progress.js';
import { Dialogue, Choice, LetterCard, Card, ListMenu, fmt } from '../ui/ui.js';
import { SettingsCabinet } from '../ui/screens.js';
import { MapScene } from '../scenes/map.js';
import { DenScene } from '../scenes/den.js';

const SOLID = new Set(['#', 'r', '?', 'L', 'u', 'i']);
// Tiles that stay in the grid (everything else is turned into an object when the level loads).
const TILES = new Set(['#', 'r', '=', '?', 'L', 'u', 'b', '~', 'R', 'w', 'i', 'p']);
const CRITTERS = { g: 'grub', d: 'snap', z: 'buzz', Z: 'buzz', e: 'beetle', h: 'frog', q: 'squirrel', m: 'moth' };
const NPCS = { J: 'juniper', O: 'puddle', Y: 'rook' };
// Which season makes which tile "active" (ice for water, a solid heap for leaf piles).
const SEASON_TILE = { '~': 'winter', w: 'winter', p: 'autumn' };
const TRACK_FOR_STONE = { '1-1': 'bloom', '2-1': 'pond', '3-1': 'orchard' };

export const SPRING_LETTER = DISTRICTS[1].letter;

export class LevelScene {
  // opts: { spawn: {x, y}, cpIndex, star, returnTo } — used when going in and out of secret burrows.
  constructor(id, opts = {}) {
    this.id = id;
    this.opts = opts;
    this.info = LEVEL_INFO[id];
    this.data = getLevel(id);
    this.district = DISTRICTS[this.info.district];
    this.cpIndex = opts.cpIndex ?? -1; this.deathsAtCp = 0; this.lastDeathCp = -2;
    this.introDone = !!opts.spawn; this.talks = {};
  }

  enter() {
    this.load();
    const m = this.info.music;
    if (m === 'map') playMusic('map', { drums: 1, bass: 1, keys: 0.7, pad: 0.6 });
    else playMusic(m);
    setTempo(this.data.autoscroll ? 1.1 : 1);
    engine.irisX = this.player.cx - this.camX; engine.irisY = this.player.cy - this.camY;
    if (this.data.boss && !this.introDone) {
      this.introDone = true;
      pushOverlay(new Dialogue(this.district.bossIntro, () => this.boss.start(this)));
    } else if (this.boss) this.boss.start(this);
  }
  exit() { setTempo(1); }

  load() {
    const d = this.data;
    this.w = d.w; this.h = d.h;
    this.tiles = d.rows.map((r) => r.split(''));
    this.ents = []; this.critters = []; this.lanterns = []; this.signs = []; this.parts = []; this.floaters = [];
    this.bumps = new Map(); this.act = new Map(); this.cracks = new Map();
    this.boss = null; this.bell = null; this.time = 0; this.state = 'play'; this.clearT = 0; this.respawning = false;
    const had = state.data.seeds[this.id] || [];
    const deferred = [];
    let seedIdx = 0, lanternIdx = 0, start = [2, this.h - 3];
    for (let x = 0; x < this.w; x++) {
      for (let y = 0; y < this.h; y++) {
        const c = this.tiles[y][x];
        if (TILES.has(c)) continue;
        this.tiles[y][x] = '.';
        if (CRITTERS[c]) {
          const e = new Critter(CRITTERS[c], x, y);
          if (c === 'Z') e.vertical = true;
          this.critters.push(e); this.ents.push(e);
          continue;
        }
        if (NPCS[c]) { this.ents.push(new NPC(x, y, NPCS[c])); continue; }
        switch (c) {
          case 'P': start = [x, y]; break;
          case 'o': this.ents.push(new Acorn(x, y)); break;
          case 'G': this.ents.push(new GoldenSeed(x, y, seedIdx, !!had[seedIdx])); seedIdx++; break;
          case 'f': case 'v': case 'U': deferred.push([x, y, c]); break;
          case '^': this.ents.push(new Mushroom(x, y)); break;
          case 'C': { const l = new Lantern(x, y, lanternIdx++); this.lanterns.push(l); this.ents.push(l); break; }
          case 'E': this.bell = new Bell(x, y); this.ents.push(this.bell); break;
          case 'K': {
            const season = d.stone || 'spring';
            if (!state.data.stones[season]) this.ents.push(new StonePickup(x, y, season));
            break;
          }
          case 'H': this.ents.push(new Burrow(x, y, false)); break;
          case 'X': this.ents.push(new Burrow(x, y, true)); break;
          case '*': this.ents.push(new Starbloom(x, y)); break;
          case 's': { const s = new Sign(x, y, d.signs[`${x},${y}`] || ''); this.signs.push(s); this.ents.push(s); break; }
          default: break;
        }
      }
    }
    // Things that need to know where the walls are (vines measure their height, vents their wind column).
    for (const [x, y, c] of deferred) this.ents.unshift(c === 'U' ? new Vent(x, y, this) : new Soil(x, y, c, this));
    this.computeMasks();

    let px = start[0] * T + T / 2, py = (start[1] + 1) * T;
    if (this.cpIndex >= 0 && this.lanterns[this.cpIndex]) {
      const l = this.lanterns[this.cpIndex];
      px = l.x + 40; py = l.y + l.h;
      for (const ll of this.lanterns) if (ll.idx <= this.cpIndex) ll.lit = true;
    }
    if (this.skipTo) { px = this.skipTo; this.skipTo = null; }
    if (this.opts.spawn && !this.spawned) { px = this.opts.spawn.x; py = this.opts.spawn.y; this.spawned = true; }
    this.player = new Player(px, py);
    const own = this.district?.season;
    if (own && state.data.stones[own]) this.player.setSeason(own, true);
    else if (this.info.district >= 1 && state.data.stones.spring) this.player.setSeason('spring', true);
    this.canSeason = true;
    if (this.opts.star && !this.starGiven) { this.player.star = this.opts.star; this.starGiven = true; }

    const theme = this.data.theme;
    const awake = theme === 'square' ? false : !!state.data.cleared[this.district?.boss];
    this.palBase = makePal(theme, theme === 'square' ? 0.5 : awake ? 0.12 : 0.6);
    this.palVivid = makePal(theme, 0);
    this.camX = clamp(px - W / 2, 0, this.w * T - W);
    this.camY = clamp(py - H * 0.6, -2 * T, Math.max(0, this.h * T - H));
    if (d.autoscroll) this.camX = clamp(px - 200, 0, this.w * T - W);
    if (d.boss === 'pumpkin') this.boss = new Pumpkin(this);
    if (d.boss === 'pike') this.boss = new Pike(this);
    if (d.boss === 'scarecrow') this.boss = new Scarecrow(this);
  }

  computeMasks() {
    const t = this.tiles;
    const same = (xx, yy, set) => {
      if (xx < 0 || xx >= this.w) return true;
      if (yy >= this.h) return true;
      if (yy < 0) return false;
      return set.includes(t[yy][xx]);
    };
    this.masks = t.map((row, y) => row.map((c, x) => {
      if (c === '#' || c === 'r') {
        const s = ['#', 'r'];
        return (same(x, y - 1, s) ? 1 : 0) | (same(x + 1, y, s) ? 2 : 0) | (same(x, y + 1, s) ? 4 : 0) | (same(x - 1, y, s) ? 8 : 0);
      }
      if (c === '~' || c === 'R' || c === 'p') return y > 0 && t[y - 1][x] === c ? 1 : 0;
      return 0;
    }));
  }

  // ---------- seasons acting on the world ----------
  isActive(tx, ty) { return this.act.has(ty * this.w + tx); }
  winterAt(x, y) { const p = this.player; return p && p.season === 'winter' && !p.dead && dist(p.cx, p.cy, x, y) < p.bubble + 4; }
  updateSeasonTiles(dt) {
    for (const [k, v] of this.act) { if (v - dt <= 0) this.act.delete(k); else this.act.set(k, v - dt); }
    const p = this.player;
    if (!p.season || p.dead || p.bubble < 20) return;
    const R = p.bubble;
    const tx0 = Math.max(0, Math.floor((p.cx - R) / T)), tx1 = Math.min(this.w - 1, Math.floor((p.cx + R) / T));
    const ty0 = Math.max(0, Math.floor((p.cy - R) / T)), ty1 = Math.min(this.h - 1, Math.floor((p.cy + R) / T));
    let fresh = 0;
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const c = this.tiles[ty][tx];
        if (SEASON_TILE[c] !== p.season) continue;
        if (dist(p.cx, p.cy, tx * T + T / 2, ty * T + T / 2) > R + T * 0.35) continue;
        const k = ty * this.w + tx;
        if (!this.act.has(k)) fresh++;
        this.act.set(k, 2.5);
      }
    }
    if (fresh > 0 && Math.random() < 0.25) sfx(p.season === 'winter' ? 'freeze' : 'rustle');
  }
  // Ice floes crack and sink a moment after you land on them, unless Winter keeps them frozen.
  updateCracks(dt) {
    const p = this.player;
    if (p.onGround && p.gtile) {
      const [gx, gy] = p.gtile;
      if (this.tiles[gy]?.[gx] === 'i' && p.season !== 'winter' && !this.cracks.has(gy * this.w + gx)) {
        this.cracks.set(gy * this.w + gx, 0); sfx('crack');
      }
    }
    for (const [k, t] of this.cracks) {
      if (p.season === 'winter') { this.cracks.delete(k); continue; }
      const nt = t + dt;
      if (nt >= 0.6) {
        const tx = k % this.w, ty = Math.floor(k / this.w);
        this.tiles[ty][tx] = '.';
        this.cracks.delete(k);
        this.burst(tx * T + T / 2, ty * T + 10, 'snow', 8); sfx('splash');
      } else this.cracks.set(k, nt);
    }
  }

  // ---------- physics helpers ----------
  solid(tx, ty) {
    if (tx < 0 || tx >= this.w) return true;
    if (ty < 0 || ty >= this.h) return false;
    const c = this.tiles[ty][tx];
    if (SOLID.has(c)) return true;
    if (c === '~' || c === 'w' || c === 'p') return this.act.has(ty * this.w + tx);
    return false;
  }
  oneway(tx, ty) {
    if (tx < 0 || tx >= this.w || ty < 0 || ty >= this.h) return false;
    return this.tiles[ty][tx] === '=';
  }
  solidPx(x, y) { return this.solid(Math.floor(x / T), Math.floor(y / T)); }
  onewayPx(x, y) { return this.oneway(Math.floor(x / T), Math.floor(y / T)); }
  tileAtPx(x, y) { return this.tiles[Math.floor(y / T)]?.[Math.floor(x / T)]; }
  onIce(b) {
    const tx = Math.floor((b.x + b.w / 2) / T), ty = Math.floor((b.y + b.h + 2) / T);
    const c = this.tiles[ty]?.[tx];
    return c === 'i' || ((c === '~' || c === 'w') && this.isActive(tx, ty));
  }
  inWaterfall(b) {
    const tx = Math.floor((b.x + b.w / 2) / T), ty = Math.floor((b.y + b.h / 2) / T);
    return this.tiles[ty]?.[tx] === 'w' && !this.isActive(tx, ty);
  }
  inWater(b, inset = 12) {
    const x0 = Math.floor((b.x + 6) / T), x1 = Math.floor((b.x + b.w - 6) / T);
    const ty = Math.floor((b.y + b.h - inset) / T);
    for (let tx = x0; tx <= x1; tx++) {
      const c = this.tiles[ty]?.[tx];
      if (c === 'R' || (c === '~' && !this.isActive(tx, ty))) return true;
    }
    return false;
  }
  touchWall(b, dir) {
    const x = dir > 0 ? b.x + b.w + 1.5 : b.x - 1.5;
    const tx = Math.floor(x / T);
    for (let ty = Math.floor((b.y + 4) / T); ty <= Math.floor((b.y + b.h - 4) / T); ty++) if (ty >= 0 && this.solid(tx, ty)) return true;
    return false;
  }
  move(b, dt) {
    b.hitX = 0; b.hitCeil = false;
    let nx = b.x + b.vx * dt;
    if (b.vx !== 0) {
      const dir = Math.sign(b.vx);
      const tx = Math.floor((dir > 0 ? nx + b.w : nx) / T);
      for (let ty = Math.floor((b.y + 1) / T); ty <= Math.floor((b.y + b.h - 1) / T); ty++) {
        if (this.solid(tx, ty)) { nx = dir > 0 ? tx * T - b.w - 0.01 : (tx + 1) * T + 0.01; b.hitX = dir; b.vx = 0; break; }
      }
    }
    b.x = nx;
    let ny = b.y + b.vy * dt;
    const wasBottom = b.y + b.h;
    b.onGround = false; b.gtile = null;
    const tx0 = Math.floor((b.x + 1) / T), tx1 = Math.floor((b.x + b.w - 1) / T);
    if (b.vy >= 0) {
      const ty = Math.floor((ny + b.h) / T);
      for (let tx = tx0; tx <= tx1; tx++) {
        if (this.solid(tx, ty) || (this.oneway(tx, ty) && wasBottom <= ty * T + 1)) { ny = ty * T - b.h; b.vy = 0; b.onGround = true; b.gtile = [tx, ty]; break; }
      }
      // Frozen critters are ice blocks you can stand on.
      if (!b.onGround && b === this.player) {
        for (const e of this.critters || []) {
          if (!e.frozen || e.mode !== 'rest' || e.dead) continue;
          if (b.x + b.w > e.x + 3 && b.x < e.x + e.w - 3 && wasBottom <= e.y + 2 && ny + b.h >= e.y) {
            ny = e.y - b.h; b.vy = 0; b.onGround = true; break;
          }
        }
      }
    } else {
      const ty = Math.floor(ny / T);
      let hits = [];
      for (let tx = tx0; tx <= tx1; tx++) if (this.solid(tx, ty)) hits.push(tx);
      if (hits.length === 1 && b === this.player) {
        const tx = hits[0];
        if (b.x + b.w / 2 < tx * T && b.x + b.w - tx * T < 12 && !this.solid(tx - 1, ty)) { b.x = tx * T - b.w - 0.01; hits = []; }
        else if (b.x + b.w / 2 > (tx + 1) * T && (tx + 1) * T - b.x < 12 && !this.solid(tx + 1, ty)) { b.x = (tx + 1) * T + 0.01; hits = []; }
      }
      if (hits.length) { ny = (ty + 1) * T + 0.01; b.vy = 0; b.hitCeil = true; b.ceilHits = hits.map((tx) => [tx, ty]); }
    }
    b.y = ny;
  }

  // ---------- effects ----------
  burst(x, y, type, n = 6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 120;
      this.parts.push({ type, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (type === 'dust' ? 20 : 60), life: 0.5 + Math.random() * 0.5, max: 1, rot: Math.random() * 6 });
    }
  }
  dust(x, y, n) { this.burst(x, y, 'dust', n); }
  float(txt, x, y, color) { this.floaters.push({ txt, x, y, t: 0, color }); }
  addScore(x, y) { this.burst(x, y, 'spark', 4); }

  // ---------- rewards ----------
  gainAcorns(n, x, y) {
    const lives = addAcorns(n);
    if (n > 1) this.float(`+${n}`, x, y);
    if (lives) { sfx('oneup'); this.float('1-UP!', x, y - 20, '#e2574c'); toast('100 acorns: extra life!'); }
  }
  gainLife(x, y) {
    if (addLife()) { sfx('oneup'); this.float('1-UP!', x, y, '#e2574c'); }
    else { addAcorns(10); sfx('acorn'); toast('Lives are full: +10 acorns'); }
  }
  gainSeed(idx, x, y) {
    const arr = state.data.seeds[this.id] || (state.data.seeds[this.id] = [false, false, false]);
    const fresh = !arr[idx];
    arr[idx] = true;
    sfx('seed'); this.burst(x, y, 'spark', 14);
    const got = arr.filter(Boolean).length;
    toast(fresh ? `Golden seed! (${got} of 3 in this level)` : 'Golden seed (already found)');
    if (fresh) for (const m of checkSeedRewards()) { toast(m); sfx('unlock'); }
    saveGame();
  }
  gotStone(season, x, y) {
    state.data.stones[season] = true;
    saveGame();
    this.burst(x, y, 'spark', 20); sfx('unlock');
    this.player.frozen = true;
    const lines = (Object.values(DISTRICTS).find((dd) => dd.season === season) || DISTRICTS[1]).stoneLines;
    pushOverlay(new Dialogue(lines, () => { this.player.frozen = false; this.player.setSeason(season); }));
  }
  talk(who) {
    this.talks[who] = (this.talks[who] || 0) + 1;
    this.player.vx = 0;
    pushOverlay(new Dialogue(npcLines(who, state.data, this.talks[who])));
  }
  setCheckpoint(l) { if (l.idx > this.cpIndex) { this.cpIndex = l.idx; this.deathsAtCp = 0; } }

  // ---------- carrying ----------
  throwCarry() {
    const p = this.player, e = p.carry;
    if (!e) return;
    p.carry = null;
    e.x = p.cx - e.w / 2 + p.facing * 14; e.y = p.y - 6;
    if (this.solidPx(e.x + e.w / 2, e.y + e.h / 2)) { e.x = p.cx - e.w / 2; e.y = p.y; }
    e.bounces = 0; e.kickCool = 0.3;
    if (input.down('up')) { e.mode = 'thrown'; e.vx = p.vx * 0.4; e.vy = -780; }
    else if (input.down('down')) { e.mode = 'rest'; e.vx = 0; e.vy = 0; }
    else { e.mode = 'thrown'; e.vx = p.facing * 520 + p.vx * 0.3; e.vy = -180; }
    sfx('throw');
  }
  dropCarry() {
    const p = this.player, e = p.carry;
    if (!e) return;
    p.carry = null; e.mode = 'rest'; e.vx = 0; e.vy = 0; e.kickCool = 0.5;
    e.x = p.cx - e.w / 2; e.y = p.y;
  }

  // ---------- damage, lives ----------
  hurt(srcX) {
    const p = this.player;
    if (this.godMode || p.star > 0 || p.inv > 0 || p.dead || this.state !== 'play') return;
    if (p.carry) this.dropCarry();
    p.climb = null;
    const dir = srcX != null ? Math.sign(p.cx - srcX) || -p.facing : -p.facing;
    if (p.season && p.charm <= 0) {
      p.lastSeason = p.season; p.season = null; p.charm = 5; p.inv = 1.6;
      p.vx = dir * 260; p.vy = -420;
      sfx('charm'); shake(5);
      this.burst(p.cx, p.cy, 'petal', 10);
    } else this.loseLife(false);
  }
  loseLife(fell) {
    const p = this.player;
    if (p.dead) return;
    if (this.godMode && !fell) return;
    if (p.carry) this.dropCarry();
    p.dead = true; p.deadT = 0; p.climb = null; p.vx = 0; p.vy = fell ? -300 : -650;
    if (!state.settings.infiniteLives) state.data.lives = Math.max(0, state.data.lives - 1);
    sfx('lose'); shake(6);
    saveGame();
  }
  splash(b) {
    this.burst(b.x + b.w / 2, b.y + b.h - 6, 'splash', 14); sfx('splash');
  }
  afterDeath() {
    if (this.respawning) return;
    this.respawning = true;
    if (state.data.lives <= 0 && !state.settings.infiniteLives) { this.gameOver(); return; }
    this.deathsAtCp = this.lastDeathCp === this.cpIndex ? this.deathsAtCp + 1 : 1;
    this.lastDeathCp = this.cpIndex;
    transition(() => {
      this.load();
      if (this.boss) this.boss.start(this);
      engine.irisX = this.player.cx - this.camX; engine.irisY = this.player.cy - this.camY;
      if (state.settings.skipOffer && this.deathsAtCp >= 3 && this.canSkip()) this.offerSkip();
    }, W / 2, H / 2);
  }
  canSkip() { return !this.boss && (this.cpIndex + 1 < this.lanterns.length || !!this.bell); }
  offerSkip() {
    pushOverlay(new Choice("This bit's tricky! Would you like to skip ahead?", ['Skip ahead', 'Keep trying'], (i) => {
      if (i !== 0) return;
      this.deathsAtCp = 0;
      if (this.cpIndex + 1 < this.lanterns.length) this.cpIndex++;
      else this.skipTo = this.bell.px - 3 * T;
      this.load();
    }));
  }
  gameOver() {
    stopMusic(1);
    pushOverlay(new Dialogue([{ who: null, text: 'Out of lives! {name} heads home for a nap...' }], () => {
      state.data.lives = START_LIVES;
      saveGame();
      transition(() => setScene(new DenScene({ wake: true })));
    }));
  }

  // ---------- level end ----------
  finish(frac) {
    this.state = 'clear';
    const p = this.player;
    p.frozen = true; p.inv = 0;
    const bonus = 1 + Math.round(frac * 9);
    this.gainAcorns(bonus, p.cx, p.y - 20);
    sfx('bell');
    stopMusic(1.2);
    this.burst(p.cx, p.y, 'spark', 16);
  }
  showClear() {
    const seeds = state.data.seeds[this.id] || [];
    pushOverlay(new Card({
      title: 'Level clear!',
      lines: [this.info.name, `Acorns: ${state.data.acorns}`],
      h: 280,
      draw: (ctx, x, y, w) => {
        for (let i = 0; i < 3; i++) drawSeed(ctx, x + w / 2 - 60 + i * 60, y + 190, { ghost: !seeds[i], boil: engine.boil });
      },
      cb: () => this.complete(),
    }));
    setTimeout(() => sfx('clear'), 50);
  }
  complete() {
    const d = state.data;
    d.cleared[this.id] = true;
    if (this.id === '0-2' && unlockOutfit('hat', 'acorn')) toast('New hat for the wardrobe: Acorn cap!');
    const tr = TRACK_FOR_STONE[this.id];
    if (tr && !d.tracks.includes(tr)) d.tracks.push(tr);
    d.mapNode = LEVEL_ORDER.indexOf(this.id) + 1;
    saveGame();
    transition(() => setScene(new MapScene()));
  }
  bossDefeated() {
    stopMusic(1.5);
    for (const c of this.critters) if (!c.asleep) c.sleep(this);
    this.letterT = 0.9;
  }
  // ---------- secret burrows ----------
  useBurrow(b) {
    if (b.exit) { this.returnToParent(false); return; }
    const sid = this.data.secret;
    if (!sid) return;
    sfx('door');
    const returnTo = { id: this.id, x: b.cx, y: b.base, cpIndex: this.cpIndex };
    transition(() => setScene(new LevelScene(sid, { returnTo })), b.cx - this.camX, b.base - this.camY - 20);
  }
  returnToParent(withStar) {
    const r = this.opts.returnTo;
    if (!r || this.leaving) return;
    this.leaving = true;
    sfx('door');
    transition(() => setScene(new LevelScene(r.id, { spawn: { x: r.x, y: r.y }, cpIndex: r.cpIndex, star: withStar ? 10 : 0 })));
  }
  gotStarbloom(x, y) {
    const d = state.data;
    d.secrets = d.secrets || {};
    d.secrets[this.opts.returnTo?.id || this.id] = true;
    saveGame();
    sfx('oneup'); this.burst(x, y, 'spark', 24);
    toast('Starbloom! Invincible for 10 seconds outside');
    this.player.frozen = true;
    this.leaveT = 1.3;
  }

  gotLetter() {
    this.player.frozen = true;
    sfx('unlock');
    const n = this.info.district;
    pushOverlay(new LetterCard(`A memory letter (${n} of 4)`, this.district.letter, '— T.', () => this.districtAwake()));
  }
  districtAwake() {
    const d = state.data, D = this.district;
    d.cleared[D.boss] = true;
    if (!d.letters.includes(D.letterKey)) d.letters.push(D.letterKey);
    unlockOutfit('hat', D.rewards.hat);
    grantFurniture(D.rewards.furniture);
    for (const t of D.rewards.tracks) if (!d.tracks.includes(t)) d.tracks.push(t);
    d.mapNode = LEVEL_ORDER.indexOf(D.boss) + 1;
    saveGame();
    sfx('clear');
    pushOverlay(new Card({
      title: D.awakeTitle, lines: D.rewardLines, h: 270,
      cb: () => transition(() => setScene(new MapScene())),
    }));
  }

  openPause() {
    const self = this;
    pushOverlay(new ListMenu({
      title: 'Paused',
      items: [
        { label: 'Keep playing', select: () => engine.overlays.pop() },
        { label: 'Settings cabinet', select: () => pushOverlay(new SettingsCabinet()) },
        { label: 'Restart from last lantern', select: () => { engine.overlays.pop(); self.load(); if (self.boss) self.boss.start(self); } },
        { label: 'Back to the map', select: () => { engine.overlays.pop(); transition(() => setScene(new MapScene())); } },
      ],
      note: this.info.name,
    }));
  }

  // ---------- update ----------
  update(dt) {
    this.time += dt;
    state.data.time += dt;
    const p = this.player;
    if (input.pressed('pause') && this.state === 'play' && !p.dead) { this.openPause(); return; }

    this.updateSeasonTiles(dt);
    if (!p.dead) p.update(dt, this);
    else { p.deadT += dt; p.vy += 1800 * dt; p.y += p.vy * dt; if (p.deadT > 1.3) this.afterDeath(); }
    this.updateCracks(dt);

    if (p.carry && (!input.down('sprint') || p.climb)) this.throwCarry();
    if (p.hitCeil && p.ceilHits) {
      let best = p.ceilHits[0], bd = 1e9;
      for (const h of p.ceilHits) { const dd = Math.abs(h[0] * T + T / 2 - p.cx); if (dd < bd) { bd = dd; best = h; } }
      this.bump(best[0], best[1]);
      p.hitCeil = false; p.ceilHits = null;
    }

    for (const e of this.ents) e.update(dt, this);
    this.boss?.update(dt, this);

    // Water: Fennel splashes in (and loses a life); frogs float; other critters are swept away.
    for (const e of this.critters) {
      if (e.dead || e.mode === 'carried' || !this.inWater(e, 8)) continue;
      if (e.kind === 'frog' && !e.asleep) {
        const ty = Math.floor((e.y + e.h - 8) / T);
        e.y = ty * T - e.h + 10; e.vy = Math.min(e.vy, 0); e.onGround = true;
      } else if (!e.isFlier || e.asleep) { e.dead = true; this.splash(e); }
    }

    if (!p.dead && this.state === 'play') {
      this.critterContacts(dt);
      if (this.touchingThorns(p)) this.hurt();
      for (const e of this.ents) if (e.hurts && !e.dead && overlap(e, p)) { e.dead = true; this.hurt(e.x); }
      if (this.inWater(p)) { this.splash(p); this.loseLife(true); }
      if (p.y > this.h * T + 40) this.loseLife(true);
    }
    if (this.data.autoscroll && this.state === 'play') this.updateRush(dt);

    this.ents = this.ents.filter((e) => !e.dead);
    this.critters = this.critters.filter((e) => !e.dead);

    const sl = SEASON_LAYERS[this.info.music];
    if (sl) {
      const on = p.season === sl.season;
      for (const [k, v] of Object.entries(on ? sl.on : sl.off)) setLayer(k, v);
    }

    for (const q of this.parts) {
      q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.type === 'dust') { q.vx *= 0.9; q.vy *= 0.9; }
      else if (q.type === 'petal' || q.type === 'leaf' || q.type === 'snow') { q.vy += (q.ambient ? 10 : 60) * dt; q.vx += Math.sin(q.life * 6) * 20 * dt; }
      else if (q.type === 'spark' || q.type === 'splash') q.vy += (q.type === 'splash' ? 700 : 200) * dt;
    }
    this.parts = this.parts.filter((q) => q.life > 0);
    this.ambient(dt);
    for (const f of this.floaters) { f.t += dt; f.y -= 40 * dt; }
    this.floaters = this.floaters.filter((f) => f.t < 1.2);
    for (const [k, v] of this.bumps) { if (v - dt <= 0) this.bumps.delete(k); else this.bumps.set(k, v - dt); }

    // Starbloom: speed the music up while it lasts, sparkle, and head back out of a secret room after grabbing it.
    setTempo(p.star > 0 ? 1.18 : this.data.autoscroll ? 1.1 : 1);
    if (p.star > 0 && Math.random() < dt * 30) this.parts.push({ type: 'rainbow', x: p.cx + (Math.random() - 0.5) * 40, y: p.cy + (Math.random() - 0.5) * 40, vx: 0, vy: -40, life: 0.6, max: 0.6, rot: Math.random() * 6, c: RAINBOW[Math.floor(Math.random() * 5)] });
    if (this.leaveT > 0) { this.leaveT -= dt; if (this.leaveT <= 0) this.returnToParent(true); }
    if (this.letterT > 0) {
      this.letterT -= dt;
      if (this.letterT <= 0) this.ents.push(new LetterPickup(this.boss.x, this.boss.top - 20));
    }
    this.updateCamera(dt);
    if (this.state === 'clear') { this.clearT += dt; if (this.clearT > 2.2 && !this.clearShown) { this.clearShown = true; this.showClear(); } }
  }

  // Falling petals, snow or leaves, depending on the district.
  ambient(dt) {
    const th = this.palVivid.theme;
    if (th === 'square') return;
    const type = th.startsWith('pond') ? 'snow' : th.startsWith('orchard') ? 'leaf' : 'petal';
    const rate = type === 'snow' ? 6 : type === 'leaf' ? 4 : 3;
    if ((this.player.bubble > 40 || this.palBase.vivid || type !== 'petal') && Math.random() < dt * rate) {
      this.parts.push({ type, x: this.camX + Math.random() * W, y: this.camY - 10, vx: type === 'leaf' ? 50 : 15, vy: type === 'snow' ? 40 : 30, life: 7, max: 7, rot: 0, ambient: true });
    }
  }

  bump(tx, ty) {
    const c = this.tiles[ty]?.[tx];
    sfx('bump');
    this.bumps.set(tx + ',' + ty, 0.2);
    if (c === '?') { this.tiles[ty][tx] = 'u'; this.ents.push(new PopAcorn(tx * T + T / 2, ty * T)); this.gainAcorns(1, tx * T + T / 2, ty * T); sfx('acorn'); }
    else if (c === 'L') { this.tiles[ty][tx] = 'u'; this.ents.push(new Berry(tx, ty)); sfx('pickup'); }
    for (const e of this.critters) {
      if (!e.asleep && Math.abs(e.cx - (tx * T + T / 2)) < T * 0.8 && Math.abs(e.y + e.h - ty * T) < 8) { e.sleep(this); e.vy = -300; }
    }
  }

  critterContacts(dt) {
    const p = this.player;
    for (const e of this.critters) {
      if (e.dead || e.mode === 'carried' || !overlap(p, e)) continue;
      if (e.asleep) {
        if (e.mode === 'thrown' || e.kind === 'snap' || e.kickCool > 0) continue;
        if (input.down('sprint') && !p.carry && !p.climb) { p.carry = e; e.mode = 'carried'; sfx('pickup'); }
        else { e.mode = 'thrown'; e.vx = (p.cx < e.cx ? 1 : -1) * (e.frozen ? 520 : 430); e.vy = -120; e.bounces = 0; e.kickCool = 0.4; sfx('kick'); }
        continue;
      }
      if (p.star > 0) { e.sleep(this); sfx('bop'); this.burst(e.cx, e.y, 'spark', 10); continue; }
      const prevBottom = p.bottom - p.vy * dt;
      if (p.vy > 0 && prevBottom <= e.y + 16) {
        e.sleep(this); p.y = e.y - p.h; p.bounce(560); sfx('bop');
      } else this.hurt(e.cx);
    }
  }
  touchingThorns(p) {
    const x0 = Math.floor((p.x + 5) / T), x1 = Math.floor((p.x + p.w - 5) / T);
    const y0 = Math.floor((p.y + 8) / T), y1 = Math.floor((p.bottom - 2) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (this.tiles[ty]?.[tx] !== 'b') continue;
      const bx = tx * T, by = ty * T;
      if (p.x + p.w - 5 > bx + 6 && p.x + 5 < bx + T - 6 && p.bottom - 2 > by + 14 && p.y + 8 < by + T) return true;
    }
    return false;
  }
  updateRush(dt) {
    const max = this.w * T - W;
    const p = this.player;
    // The screen scrolls on its own, but speeds up if you run ahead, so you're never pinned at the right edge.
    if (this.camX < max) this.camX = Math.min(max, Math.max(this.camX + this.data.autoscroll * dt, p.dead ? 0 : p.cx - W * 0.6));
    if (p.dead) return;
    if (p.x + p.w > this.camX + W) { p.x = this.camX + W - p.w; p.vx = Math.min(p.vx, 0); }
    if (this.camX < max && p.x < this.camX + 40) this.hurt(this.camX - 100);
    if (p.x + p.w < this.camX - 4) this.loseLife(false);
  }
  updateCamera(dt) {
    const p = this.player;
    if (!this.data.autoscroll) {
      const tx = p.cx - W / 2 + p.facing * 60;
      this.camX += (tx - this.camX) * Math.min(1, dt * 3.5);
      this.camX = clamp(this.camX, 0, this.w * T - W);
    }
    if (!p.dead) {
      const ty = p.cy - H * 0.55;
      this.camY += (ty - this.camY) * Math.min(1, dt * 3);
    }
    this.camY = clamp(this.camY, -2 * T, Math.max(0, this.h * T - H));
  }

  // ---------- drawing ----------
  drawTiles(ctx, pal, x0, y0, x1, y1) {
    const b = engine.boil;
    const tx0 = Math.max(0, Math.floor((this.camX + x0) / T)), tx1 = Math.min(this.w - 1, Math.floor((this.camX + x1) / T));
    const ty0 = Math.max(0, Math.floor((this.camY + y0) / T)), ty1 = Math.min(this.h - 1, Math.floor((this.camY + y1) / T));
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        let c = this.tiles[ty][tx];
        if (!TILES.has(c)) continue;
        let xo = 0, yo = 0;
        const bump = this.bumps.get(tx + ',' + ty);
        if (bump) yo = -Math.sin((bump / 0.2) * Math.PI) * 9;
        if (SEASON_TILE[c] && this.isActive(tx, ty)) c = c === '~' ? 'I' : c === 'w' ? 'Y' : 'P';
        if (c === 'i' && this.cracks.has(ty * this.w + tx)) { c = 'k'; xo = Math.sin(this.time * 60) * 2; }
        drawTile(ctx, c, tx * T - this.camX + xo, ty * T - this.camY + yo, this.masks[ty][tx], Math.floor(hash2(tx, ty) * 3), pal, b);
      }
    }
  }
  bubblePath(ctx, cx, cy, R) {
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const r = R + Math.sin(a * 7 + this.time * 3) * 4 + Math.sin(a * 3 - this.time * 2) * 3;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  render(ctx) {
    const p = this.player;
    const maxCamY = Math.max(0, this.h * T - H);
    drawBackground(ctx, this.palBase, this.camX, this.camY, maxCamY, this.time, engine.boil);
    this.drawTiles(ctx, this.palBase, -T, -T, W + T, H + T);
    if (p.bubble > 2 && p.season) {
      const cx = p.cx - this.camX, cy = p.cy - this.camY, R = p.bubble;
      ctx.save();
      this.bubblePath(ctx, cx, cy, R);
      ctx.clip();
      drawBackground(ctx, this.palVivid, this.camX, this.camY, maxCamY, this.time, engine.boil);
      this.drawTiles(ctx, this.palVivid, cx - R - T, cy - R - T, cx + R + T, cy + R + T);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.6; ctx.strokeStyle = SEASON_COLOR[p.season]; ctx.lineWidth = 3;
      ctx.setLineDash([12, 9]); ctx.lineDashOffset = -this.time * 30;
      this.bubblePath(ctx, cx, cy, R); ctx.stroke();
      ctx.restore();
      const ORBIT = { spring: ['#f7c2d2', '#fff1f5'], winter: ['#ffffff', '#cfe8fb'], autumn: ['#e0783a', '#f2c14e'] }[p.season] || ['#fff', '#fff'];
      for (let i = 0; i < 6; i++) {
        const a = this.time * 0.7 + i * 1.047;
        ctx.fillStyle = ORBIT[i % 2];
        ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * R, cy + Math.sin(a) * R, p.season === 'winter' ? 3.5 : 5, p.season === 'winter' ? 3.5 : 3, a, 0, 7); ctx.fill();
      }
      if (state.settings.cbSymbols) for (let i = 0; i < 4; i++) {
        const a = this.time * 0.3 + i * 1.571;
        drawSeasonIcon(ctx, cx + Math.cos(a) * R, cy + Math.sin(a) * R, p.season, 9);
      }
    }

    for (const e of this.ents) if (e.mode !== 'carried') e.draw(ctx, this);
    this.boss?.draw(ctx, this);

    if (this.data.autoscroll) this.drawChaseWall(ctx);

    const pose = p.pose();
    const blink = p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0;
    if (!blink) {
      if (p.star > 0 && (p.star > 2 || Math.floor(p.star * 8) % 2 === 0)) {
        ctx.save(); ctx.globalAlpha = 0.45;
        ctx.fillStyle = RAINBOW[Math.floor(this.time * 10) % 5];
        ctx.beginPath(); ctx.arc(p.cx - this.camX, p.cy - this.camY, 34 + Math.sin(this.time * 12) * 4, 0, 7); ctx.fill();
        ctx.restore();
      }
      if (p.gliding) drawLeafGlider(ctx, p.cx - this.camX, p.y - this.camY - 22, this.time, engine.boil);
      const scarf = p.charm > 0 ? '#b9b0a3' : SEASON_COLOR[p.season || 'none'];
      drawFox(ctx, p.cx - this.camX, p.bottom - this.camY + 1, {
        facing: p.wall ? -p.wall : p.facing, t: p.t, pose, phase: p.phase, squash: p.squash, outfit: state.data.outfit,
        scarfColor: scarf, speed: p.vx, boil: engine.boil, rot: p.dead ? p.deadT * 6 : 0,
      });
    }
    for (const e of this.ents) if (e.mode === 'carried') e.draw(ctx, this);

    for (const q of this.parts) this.drawPart(ctx, q);
    for (const f of this.floaters) text(ctx, f.txt, f.x - this.camX, f.y - this.camY, { size: 24, align: 'center', color: f.color || '#3b2a26', outline: '#fffaf0', alpha: Math.min(1, (1.2 - f.t) * 3) });
    if (this.noHUD) return; // trailer shots: clean picture
    for (const s of this.signs) s.drawBubble(ctx, this);
    this.drawHUD(ctx);
  }
  // The thing chasing you in auto-scrolling levels: brambles in Bloomwood, a rushing torrent in Millpond.
  drawChaseWall(ctx) {
    const rng = rngFor(91, engine.boil);
    const water = this.data.theme.startsWith('pond');
    const pts = [[-20, -10]];
    for (let y = -10; y <= H + 20; y += 30) pts.push([28 + Math.sin(y * 0.05 + this.time * 3) * 10 + rng() * 6, y]);
    pts.push([-20, H + 20]);
    shape(ctx, pts, { fill: water ? '#4f86a6' : '#5e3b57', rng, lw: 3, wob: 2 });
    for (let y = 10; y < H; y += 46) {
      line(ctx, [[0, y], [40 + Math.sin(y + this.time * 4) * 8, y + 10]], { rng, stroke: water ? '#dcf0fb' : '#7b4f73', lw: 4 });
      dot(ctx, 30, y + 20, 4, water ? '#ffffff' : '#f4a3bf');
    }
  }
  drawPart(ctx, q) {
    const x = q.x - this.camX, y = q.y - this.camY, a = Math.max(0, Math.min(1, q.life / (q.max * 0.5)));
    ctx.save(); ctx.globalAlpha = a;
    if (q.type === 'dust') { ctx.fillStyle = '#e9dcc4'; ctx.beginPath(); ctx.arc(x, y, 4 + (1 - a) * 8, 0, 7); ctx.fill(); }
    else if (q.type === 'spark') { ctx.fillStyle = '#ffd774'; ctx.translate(x, y); ctx.rotate(q.rot + q.life * 8); ctx.fillRect(-3, -3, 6, 6); }
    else if (q.type === 'petal') { ctx.fillStyle = '#f7b6c8'; ctx.translate(x, y); ctx.rotate(q.life * 3); ctx.beginPath(); ctx.ellipse(0, 0, 5, 3, 0, 0, 7); ctx.fill(); }
    else if (q.type === 'leaf') { ctx.fillStyle = q.life % 2 > 1 ? '#e0783a' : '#f2a541'; ctx.translate(x, y); ctx.rotate(q.life * 2.5); ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, 7); ctx.fill(); }
    else if (q.type === 'snow') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill(); }
    else if (q.type === 'splash') { ctx.fillStyle = '#cfeafa'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); }
    else if (q.type === 'bubble') { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.stroke(); }
    else if (q.type === 'rainbow') { ctx.fillStyle = q.c; ctx.translate(x, y); ctx.rotate(q.rot + q.life * 8); ctx.fillRect(-3, -3, 6, 6); }
    else if (q.type === 'z') drawZ(ctx, x, y, a);
    ctx.restore();
  }

  drawHUD(ctx) {
    const d = state.data, b = engine.boil;
    const lives = d.lives;
    const slots = Math.max(START_LIVES, Math.min(15, lives));
    panel(ctx, 12, 10, 26 + slots * 21, 50, { seed: 51, r: 14, boil: 0 });
    for (let i = 0; i < slots; i++) drawPaw(ctx, 30 + i * 21, 38, 0.88, i < lives, b);
    if (state.settings.infiniteLives) text(ctx, '∞', 36 + slots * 21, 44, { size: 26 });
    panel(ctx, 12, 66, 120, 42, { seed: 52, r: 12, boil: 0 });
    drawAcorn(ctx, 36, 88, 1.15, b);
    text(ctx, '× ' + d.acorns, 54, 96, { size: 24 });

    const seeds = d.seeds[this.id] || [];
    if (this.info.seeds) {
      panel(ctx, W - 168, 10, 156, 50, { seed: 53, r: 14, boil: 0 });
      for (let i = 0; i < 3; i++) drawSeed(ctx, W - 136 + i * 46, 36, { ghost: !seeds[i], boil: b, t: 0 });
    }
    if (Object.values(d.stones).some(Boolean)) {
      const p = this.player;
      const x = W - 60, y = this.info.seeds ? 112 : 50;
      const col = p.charm > 0 ? '#b9b0a3' : SEASON_COLOR[p.season || 'none'];
      shape(ctx, ellipse(x, y, 30, 30, 18), { fill: col, rng: rngFor(54, b), lw: 2.6, wash: false });
      if (p.season || p.charm > 0) drawStoneGem(ctx, x, y + 2, p.season || p.lastSeason || 'spring', { noGlow: true, boil: b, scale: 1.2, empty: p.charm > 0 });
      else text(ctx, 'off', x, y + 8, { size: 20, align: 'center' });
      if (p.charm > 0) {
        ctx.strokeStyle = '#3b2a26'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(x, y, 36, -Math.PI / 2, -Math.PI / 2 + (p.charm / 5) * Math.PI * 2); ctx.stroke();
      }
      if (state.settings.cbSymbols && p.season) drawSeasonIcon(ctx, x - 26, y - 26, p.season, 8);
      keycap(ctx, fmt('{prev}'), x - 36, y + 56, 16);
      keycap(ctx, fmt('{next}'), x + 8, y + 56, 16);
    }
  }
}
