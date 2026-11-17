// A playable level: tiles, physics, the season bubble, lives, checkpoints, the bell, the boss and the HUD.
import { engine, W, H, setScene, transition, pushOverlay, toast, shake } from '../core/engine.js';
import { input } from '../core/input.js';
import { state, saveGame, countSeeds } from '../core/state.js';
import { clamp, hash2, overlap } from '../core/util.js';
import { T, drawTile } from '../art/tiles.js';
import { makePal, SEASON_COLOR } from '../art/palettes.js';
import { drawBackground } from '../art/backgrounds.js';
import { drawFox } from '../art/fox.js';
import { panel, text, shape, ellipse, rngFor, line, dot, keycap } from '../art/ink.js';
import { drawPaw, drawAcorn, drawSeed, drawSeasonIcon, drawZ, drawStoneGem } from '../art/critters.js';
import { sfx } from '../audio/sfx.js';
import { playMusic, setLayer, setTempo, stopMusic } from '../audio/music.js';
import { getLevel, LEVEL_INFO, LEVEL_ORDER } from './levels.js';
import { Player } from './player.js';
import {
  Critter, Acorn, PopAcorn, Berry, GoldenSeed, StonePickup, LetterPickup, Lantern, Bell, Mushroom, Soil, Sign, NPC, Pumpkin,
} from './entities.js';
import { addAcorns, addLife, checkSeedRewards, unlockOutfit, grantFurniture } from './progress.js';
import { Dialogue, Choice, LetterCard, Card, ListMenu, fmt } from '../ui/ui.js';
import { SettingsCabinet } from '../ui/screens.js';
import { MapScene } from '../scenes/map.js';
import { DenScene } from '../scenes/den.js';

const SOLID = new Set(['#', 'r', '?', 'L', 'u']);
const DRAWN = new Set(['#', 'r', '=', '?', 'L', 'u', 'b']);

export const SPRING_LETTER =
  'Dear Marigold,\n' +
  'The spring I first wound the Season Clock, you planted sweet peas all along the square. By June they had climbed right up the clock tower, and you laughed and said the old clock was wearing a scarf.\n' +
  'I wished that spring could last forever. Perhaps that is a silly thing for a clockkeeper to wish.';

export class LevelScene {
  constructor(id) {
    this.id = id;
    this.info = LEVEL_INFO[id];
    this.data = getLevel(id);
    this.cpIndex = -1; this.deathsAtCp = 0; this.lastDeathCp = -2;
    this.introDone = false; this.talks = 0;
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
      pushOverlay(new Dialogue([
        { who: 'juniper', text: "That pumpkin has grown HUGE! It's sitting right on top of Bloomwood's heart." },
        { who: 'juniper', text: "Its stalk is the weak spot, but it's far too high to jump to. Use Spring on the soil and bounce up there!" },
        { who: 'pumpkin', text: 'GRRRUMBLE!' },
      ], () => this.boss.start()));
    } else if (this.boss) this.boss.start();
  }
  exit() { setTempo(1); }

  load() {
    const d = this.data;
    this.w = d.w; this.h = d.h;
    this.tiles = d.rows.map((r) => r.split(''));
    this.ents = []; this.critters = []; this.lanterns = []; this.signs = []; this.parts = []; this.floaters = [];
    this.bumps = new Map(); this.boss = null; this.time = 0; this.state = 'play'; this.clearT = 0; this.respawning = false;
    const had = state.data.seeds[this.id] || [];
    const soils = [];
    let seedIdx = 0, lanternIdx = 0, start = [2, this.h - 3];
    for (let x = 0; x < this.w; x++) {
      for (let y = 0; y < this.h; y++) {
        const c = this.tiles[y][x];
        if (DRAWN.has(c)) continue;
        this.tiles[y][x] = '.';
        switch (c) {
          case 'P': start = [x, y]; break;
          case 'o': this.ents.push(new Acorn(x, y)); break;
          case 'G': this.ents.push(new GoldenSeed(x, y, seedIdx, !!had[seedIdx])); seedIdx++; break;
          case 'g': case 'd': case 'z': case 'Z': {
            const e = new Critter({ g: 'grub', d: 'snap', z: 'buzz', Z: 'buzz' }[c], x, y);
            if (c === 'Z') e.vertical = true;
            this.critters.push(e); this.ents.push(e);
            break;
          }
          case 'f': case 'v': soils.push([x, y, c]); break;
          case '^': this.ents.push(new Mushroom(x, y)); break;
          case 'C': { const l = new Lantern(x, y, lanternIdx++); this.lanterns.push(l); this.ents.push(l); break; }
          case 'E': this.bell = new Bell(x, y); this.ents.push(this.bell); break;
          case 'K': if (!state.data.stones.spring) this.ents.push(new StonePickup(x, y)); break;
          case 'J': this.ents.push(new NPC(x, y, 'juniper')); break;
          case 's': { const s = new Sign(x, y, d.signs[`${x},${y}`] || ''); this.signs.push(s); this.ents.push(s); break; }
          default: break;
        }
      }
    }
    for (const [x, y, c] of soils) this.ents.unshift(new Soil(x, y, c, this));
    this.masks = this.tiles.map((row, y) => row.map((c, x) => {
      if (c !== '#' && c !== 'r') return 0;
      const s = (xx, yy) => {
        if (xx < 0 || xx >= this.w) return true;
        if (yy >= this.h) return true;
        if (yy < 0) return false;
        const k = this.tiles[yy][xx];
        return k === '#' || k === 'r';
      };
      return (s(x, y - 1) ? 1 : 0) | (s(x + 1, y) ? 2 : 0) | (s(x, y + 1) ? 4 : 0) | (s(x - 1, y) ? 8 : 0);
    }));

    let px = start[0] * T + T / 2, py = (start[1] + 1) * T;
    if (this.cpIndex >= 0 && this.lanterns[this.cpIndex]) {
      const l = this.lanterns[this.cpIndex];
      px = l.x + 40; py = l.y + l.h;
      for (const ll of this.lanterns) if (ll.idx <= this.cpIndex) ll.lit = true;
    }
    if (this.skipTo) { px = this.skipTo; this.skipTo = null; }
    this.player = new Player(px, py);
    if (state.data.stones.spring && this.info.district >= 1) this.player.setSeason('spring', true);
    this.canSeason = true;

    const theme = this.data.theme;
    const awake = theme === 'square' ? false : !!state.data.cleared['1-B'];
    this.palBase = makePal(theme, theme === 'square' ? 0.5 : awake ? 0.12 : 0.6);
    this.palVivid = makePal(theme, 0);
    this.camX = clamp(px - W / 2, 0, this.w * T - W);
    this.camY = clamp(py - H * 0.6, 0, Math.max(0, this.h * T - H));
    if (d.autoscroll) { this.camX = clamp(px - 200, 0, this.w * T - W); }
    if (d.boss === 'pumpkin') this.boss = new Pumpkin(this);
  }

  // ---------- physics helpers ----------
  solid(tx, ty) {
    if (tx < 0 || tx >= this.w) return true;
    if (ty < 0 || ty >= this.h) return false;
    return SOLID.has(this.tiles[ty][tx]);
  }
  oneway(tx, ty) {
    if (tx < 0 || tx >= this.w || ty < 0 || ty >= this.h) return false;
    return this.tiles[ty][tx] === '=';
  }
  solidPx(x, y) { return this.solid(Math.floor(x / T), Math.floor(y / T)); }
  onewayPx(x, y) { return this.oneway(Math.floor(x / T), Math.floor(y / T)); }
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
    b.onGround = false;
    const tx0 = Math.floor((b.x + 1) / T), tx1 = Math.floor((b.x + b.w - 1) / T);
    if (b.vy >= 0) {
      const ty = Math.floor((ny + b.h) / T);
      for (let tx = tx0; tx <= tx1; tx++) {
        if (this.solid(tx, ty) || (this.oneway(tx, ty) && wasBottom <= ty * T + 1)) { ny = ty * T - b.h; b.vy = 0; b.onGround = true; break; }
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
    pushOverlay(new Dialogue([
      { who: 'stone', text: 'You found the Spring stone!' },
      { who: 'juniper', text: "It's glowing! Press {next} or {prev} to wake up Spring around you. Any soil nearby will sprout." },
      { who: 'juniper', text: 'Be careful: if something hits you, the stone will fizzle out for a few seconds.' },
    ], () => { this.player.frozen = false; this.player.setSeason('spring'); }));
  }
  talk(who) {
    if (who !== 'juniper') return;
    this.talks++;
    const lines = state.data.stones.spring
      ? [{ who: 'juniper', text: 'Spring suits you! There are three golden seeds hidden in every level. Can you find them all?' }]
      : this.talks === 1
        ? [
          { who: 'juniper', text: "Oh! A fox! You must be Thimble's apprentice, {name}." },
          { who: 'juniper', text: 'Bloomwood has been stuck in spring for months. Everything grows and grows, but nothing ever properly blooms.' },
          { who: 'juniper', text: 'I saw something glowing pink up ahead, past the snapdragons. Maybe it is what you are looking for?' },
        ]
        : [{ who: 'juniper', text: 'The glowing thing was just past the snapdragons. Mind their seeds!' }];
    this.player.vx = 0;
    pushOverlay(new Dialogue(lines));
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
    if (this.godMode || p.inv > 0 || p.dead || this.state !== 'play') return;
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
    if (p.carry) this.dropCarry();
    p.dead = true; p.deadT = 0; p.climb = null; p.vx = 0; p.vy = fell ? -300 : -650;
    if (!state.settings.infiniteLives) state.data.lives = Math.max(0, state.data.lives - 1);
    sfx('lose'); shake(6);
    saveGame();
  }
  afterDeath() {
    if (this.respawning) return;
    this.respawning = true;
    if (state.data.lives <= 0 && !state.settings.infiniteLives) { this.gameOver(); return; }
    this.deathsAtCp = this.lastDeathCp === this.cpIndex ? this.deathsAtCp + 1 : 1;
    this.lastDeathCp = this.cpIndex;
    transition(() => {
      this.load();
      if (this.boss) this.boss.start();
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
      state.data.lives = 5;
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
    if (this.id === '1-1' && !d.tracks.includes('bloom')) d.tracks.push('bloom');
    d.mapNode = LEVEL_ORDER.indexOf(this.id) + 1;
    saveGame();
    transition(() => setScene(new MapScene()));
  }
  bossDefeated() {
    stopMusic(1.5);
    for (const c of this.critters) if (!c.asleep) c.sleep(this);
    this.letterT = 0.9;
  }
  gotLetter() {
    this.player.frozen = true;
    sfx('unlock');
    pushOverlay(new LetterCard('A memory letter (1 of 4)', SPRING_LETTER, '— T.', () => this.districtAwake()));
  }
  districtAwake() {
    const d = state.data;
    d.cleared['1-B'] = true;
    if (!d.letters.includes('spring')) d.letters.push('spring');
    unlockOutfit('hat', 'crown');
    grantFurniture('pumpkin_lamp');
    for (const t of ['bloom', 'boss']) if (!d.tracks.includes(t)) d.tracks.push(t);
    d.mapNode = LEVEL_ORDER.indexOf('1-B') + 1;
    saveGame();
    sfx('clear');
    pushOverlay(new Card({
      title: 'Bloomwood is awake!',
      lines: ['New hat: Flower crown', 'New furniture: Pumpkin lamp', 'New record: Grumpy Critters'],
      h: 270,
      cb: () => transition(() => setScene(new MapScene())),
    }));
  }

  openPause() {
    const self = this;
    const menu = new ListMenu({
      title: 'Paused',
      items: [
        { label: 'Keep playing', select: () => engine.overlays.pop() },
        { label: 'Settings cabinet', select: () => pushOverlay(new SettingsCabinet()) },
        { label: 'Restart from last lantern', select: () => { engine.overlays.pop(); self.load(); if (self.boss) self.boss.start(); } },
        { label: 'Back to the map', select: () => { engine.overlays.pop(); transition(() => setScene(new MapScene())); } },
      ],
      note: this.info.name,
    });
    pushOverlay(menu);
  }

  // ---------- update ----------
  update(dt) {
    this.time += dt;
    state.data.time += dt;
    const p = this.player;
    if (input.pressed('pause') && this.state === 'play' && !p.dead) { this.openPause(); return; }

    if (!p.dead) p.update(dt, this);
    else { p.deadT += dt; p.vy += 1800 * dt; p.y += p.vy * dt; if (p.deadT > 1.3) this.afterDeath(); }

    if (p.carry && (!input.down('sprint') || p.climb)) this.throwCarry();
    if (p.hitCeil && p.ceilHits) {
      let best = p.ceilHits[0], bd = 1e9;
      for (const h of p.ceilHits) { const d = Math.abs(h[0] * T + T / 2 - p.cx); if (d < bd) { bd = d; best = h; } }
      this.bump(best[0], best[1]);
      p.hitCeil = false; p.ceilHits = null;
    }

    for (const e of this.ents) e.update(dt, this);
    this.boss?.update(dt, this);

    if (!p.dead && this.state === 'play') {
      this.critterContacts(dt);
      if (this.touchingThorns(p)) this.hurt();
      for (const e of this.ents) if (e.hurts && !e.dead && overlap(e, p)) { e.dead = true; this.hurt(e.x); }
      if (p.y > this.h * T + 40) this.loseLife(true);
    }
    if (this.data.autoscroll && this.state === 'play') this.updateRush(dt);

    this.ents = this.ents.filter((e) => !e.dead);
    this.critters = this.critters.filter((e) => !e.dead);

    if (this.info.music === 'bloom') {
      const on = p.season === 'spring' ? 1 : 0;
      setLayer('lead', on * 0.9); setLayer('birds', on); setLayer('shaker', on * 0.8); setLayer('hum', 1 - on * 0.8);
    }

    for (const q of this.parts) {
      q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.type === 'dust') { q.vx *= 0.9; q.vy *= 0.9; }
      else if (q.type === 'petal') { q.vy += 60 * dt; q.vx += Math.sin(q.life * 6) * 20 * dt; }
      else if (q.type === 'spark') q.vy += 200 * dt;
    }
    this.parts = this.parts.filter((q) => q.life > 0);
    if (this.palVivid.theme !== 'square' && (p.bubble > 40 || this.palBase.vivid) && Math.random() < dt * 3) {
      this.parts.push({ type: 'petal', x: this.camX + Math.random() * W, y: this.camY - 10, vx: 20, vy: 30, life: 6, max: 6, rot: 0, ambient: true });
    }
    for (const f of this.floaters) { f.t += dt; f.y -= 40 * dt; }
    this.floaters = this.floaters.filter((f) => f.t < 1.2);
    for (const [k, v] of this.bumps) { if (v - dt <= 0) this.bumps.delete(k); else this.bumps.set(k, v - dt); }

    if (this.letterT > 0) {
      this.letterT -= dt;
      if (this.letterT <= 0) this.ents.push(new LetterPickup(this.boss.x, this.boss.top - 20));
    }
    this.updateCamera(dt);
    if (this.state === 'clear') { this.clearT += dt; if (this.clearT > 2.2 && !this.clearShown) { this.clearShown = true; this.showClear(); } }
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
        else { e.mode = 'thrown'; e.vx = (p.cx < e.cx ? 1 : -1) * 430; e.vy = -120; e.bounces = 0; e.kickCool = 0.4; sfx('kick'); }
        continue;
      }
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
    if (this.camX < max) this.camX = Math.min(max, this.camX + this.data.autoscroll * dt);
    const p = this.player;
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
        const c = this.tiles[ty][tx];
        if (!DRAWN.has(c)) continue;
        const bump = this.bumps.get(tx + ',' + ty);
        const yo = bump ? -Math.sin((bump / 0.2) * Math.PI) * 9 : 0;
        drawTile(ctx, c, tx * T - this.camX, ty * T - this.camY + yo, this.masks[ty][tx], Math.floor(hash2(tx, ty) * 3), pal, b);
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
      for (let i = 0; i < 6; i++) {
        const a = this.time * 0.7 + i * 1.047;
        ctx.fillStyle = i % 2 ? '#f7c2d2' : '#fff1f5';
        ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 5, 3, a, 0, 7); ctx.fill();
      }
      if (state.settings.cbSymbols) for (let i = 0; i < 4; i++) {
        const a = this.time * 0.3 + i * 1.571;
        drawSeasonIcon(ctx, cx + Math.cos(a) * R, cy + Math.sin(a) * R, p.season, 9);
      }
    }

    for (const e of this.ents) if (e.mode !== 'carried') e.draw(ctx, this);
    this.boss?.draw(ctx, this);

    if (this.data.autoscroll) this.drawBrambleWall(ctx);

    const pose = p.pose();
    const blink = p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0;
    if (!blink) {
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
  drawBrambleWall(ctx) {
    const rng = rngFor(91, engine.boil);
    const pts = [[-20, -10]];
    for (let y = -10; y <= H + 20; y += 30) pts.push([28 + Math.sin(y * 0.05 + this.time * 3) * 10 + rng() * 6, y]);
    pts.push([-20, H + 20]);
    shape(ctx, pts, { fill: '#5e3b57', rng, lw: 3, wob: 2 });
    for (let y = 10; y < H; y += 46) {
      line(ctx, [[0, y], [40 + Math.sin(y + this.time * 4) * 8, y + 10]], { rng, stroke: '#7b4f73', lw: 4 });
      dot(ctx, 30, y + 20, 4, '#f4a3bf');
    }
  }
  drawPart(ctx, q) {
    const x = q.x - this.camX, y = q.y - this.camY, a = Math.max(0, Math.min(1, q.life / (q.max * 0.5)));
    ctx.save(); ctx.globalAlpha = a;
    if (q.type === 'dust') { ctx.fillStyle = '#e9dcc4'; ctx.beginPath(); ctx.arc(x, y, 4 + (1 - a) * 8, 0, 7); ctx.fill(); }
    else if (q.type === 'spark') { ctx.fillStyle = '#ffd774'; ctx.translate(x, y); ctx.rotate(q.rot + q.life * 8); ctx.fillRect(-3, -3, 6, 6); }
    else if (q.type === 'petal') { ctx.fillStyle = '#f7b6c8'; ctx.translate(x, y); ctx.rotate(q.life * 3); ctx.beginPath(); ctx.ellipse(0, 0, 5, 3, 0, 0, 7); ctx.fill(); }
    else if (q.type === 'z') drawZ(ctx, x, y, a);
    ctx.restore();
  }

  drawHUD(ctx) {
    const d = state.data, b = engine.boil;
    const lives = d.lives;
    const slots = Math.max(5, Math.min(9, lives));
    panel(ctx, 12, 10, 28 + slots * 26, 50, { seed: 51, r: 14, boil: 0 });
    for (let i = 0; i < slots; i++) drawPaw(ctx, 32 + i * 26, 38, 1.05, i < lives, b);
    if (state.settings.infiniteLives) text(ctx, '∞', 40 + slots * 26, 44, { size: 26 });
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
      if (p.season || p.charm > 0) drawStoneGem(ctx, x, y + 2, p.lastSeason || 'spring', { noGlow: true, boil: b, scale: 1.2, empty: p.charm > 0 });
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
