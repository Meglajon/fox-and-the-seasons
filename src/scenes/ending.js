// The ending: Thimble hands over the clock key, Foxhollows plays through a whole year, then the credits roll.
import { engine, W, H, setScene, transition, pushOverlay, toast } from '../core/engine.js';
import { input } from '../core/input.js';
import { state, saveGame, countSeeds } from '../core/state.js';
import { mix, shade } from '../core/util.js';
import { shape, line, ellipse, rrect, rngFor, dot, text, panel } from '../art/ink.js';
import { drawFox } from '../art/fox.js';
import { drawThimble, drawJuniper } from '../art/critters.js';
import { drawPuddle, drawRook } from '../art/critters2.js';
import { drawBasil } from '../art/critters3.js';
import { drawBackground, gear } from '../art/backgrounds.js';
import { makePal, SEASON_COLOR } from '../art/palettes.js';
import { drawSeasonClock } from '../game/clock.js';
import { FINALE } from '../game/story.js';
import { unlockOutfit, grantFurniture } from '../game/progress.js';
import { playMusic, TRACK_NAMES } from '../audio/music.js';
import { sfx } from '../audio/sfx.js';
import { Dialogue, fmt } from '../ui/ui.js';
import { MapScene } from './map.js';

const YEAR = [
  { season: 'spring', sky: ['#bfe3ee', '#fdf4e2'], ground: '#8fc47a', leaf: '#f4a3bf', caption: 'Spring: sweet peas climb the clock tower again.', friend: drawJuniper },
  { season: 'summer', sky: ['#f4d27e', '#fff5d8'], ground: '#7cc06a', leaf: '#5aa86a', caption: 'Summer: the greenhouse lamps glow all night long.', friend: drawBasil },
  { season: 'autumn', sky: ['#f2c08a', '#fdeed6'], ground: '#c9a24e', leaf: '#e0783a', caption: 'Autumn: the leaves finally land, in lovely big piles.', friend: drawRook },
  { season: 'winter', sky: ['#c9d6e6', '#f4f7fb'], ground: '#eef3f9', leaf: '#f4f6fb', caption: 'Winter: the millpond freezes, and the ferry waits for spring.', friend: drawPuddle },
];
const SLIDE = 5;

export class EndingScene {
  constructor() { this.t = 0; this.phase = 'key'; this.pt = 0; this.scroll = 0; this.parts = []; }
  enter() {
    const d = state.data;
    // Rewards for winding the clock.
    d.finished = true;
    d.cleared['O-3'] = true;
    unlockOutfit('hat', 'keeper');
    grantFurniture('season_clock');
    if (!d.tracks.includes('clock')) d.tracks.push('clock');
    saveGame();
    playMusic('clock', { bass: 0.95, drums: 0, pad: 0.8, bells: 0.7 });
    this.outfit = { ...d.outfit, hat: 'keeper' };
    pushOverlay(new Dialogue(FINALE.ending, () => this.go('montage')));
  }
  go(phase) {
    this.phase = phase; this.pt = 0;
    if (phase === 'montage') { playMusic('title'); sfx('bell'); }
    if (phase === 'credits') {
      this.lines = this.credits();
      // stop scrolling once the last line reaches the middle of the screen
      const total = this.lines.reduce((a, [, size]) => a + size + 18, 0), last = this.lines[this.lines.length - 1][1] + 18;
      this.maxScroll = H / 2 + 40 + total - last;
    }
  }
  update(dt) {
    this.t += dt; this.pt += dt;
    if (engine.trans || engine.overlays.length) return;
    if (this.phase === 'montage') {
      if (this.pt > SLIDE * 5 || input.pressed('pause')) this.go('credits');
    } else if (this.phase === 'credits') {
      this.scroll = Math.min(this.maxScroll, this.scroll + dt * (input.down('jump') || input.down('confirm') ? 200 : 46));
      if (this.done && input.pressed('confirm')) this.leave();
      if (input.pressed('pause')) this.leave();
    }
    // falling petals / leaves / snow
    if (Math.random() < dt * 14) this.parts.push({ x: Math.random() * W, y: -10, vx: 20 + Math.random() * 30, vy: 40 + Math.random() * 40, r: Math.random() * 6 });
    for (const q of this.parts) { q.x += q.vx * dt + Math.sin(this.t + q.r) * 0.5; q.y += q.vy * dt; }
    this.parts = this.parts.filter((q) => q.y < H + 20);
  }
  leave() {
    if (this.leaving) return;
    this.leaving = true;
    sfx('select');
    transition(() => {
      setScene(new MapScene());
      toast("New hat: Clockkeeper's cap!"); toast('New furniture: Little Season Clock'); toast('New record: Wind the Clock');
    });
  }
  credits() {
    const d = state.data;
    const mins = Math.floor((d.time || 0) / 60);
    return [
      ['Fox & the Seasons', 52], ['a cozy hand-drawn platformer', 24], ['', 30],
      ['Made by Meglajon', 30], ['Built together with Claude', 22], ['', 30],
      ['Starring', 30], [`${d.name} the fox, new Keeper of the Season Clock`, 22], ['Thimble, the old clockkeeper', 22],
      ['Juniper of Bloomwood', 22], ['Captain Puddle of Millpond Reach', 22], ['Mrs. Rook of Copperleaf Orchard', 22], ['Basil of the Sunglass Greenhouse', 22], ['', 24],
      ['Grumpy critters', 30], ['grubs, snapdragons, buzzers, beetles, frogs,', 22], ['squirrels, moths, cactus hedgehogs and shadow slugs', 22], ['', 24],
      ['Bosses', 30], ['The Overgrown Pumpkin · Old Pike', 22], ['The Prize Scarecrow · The Sunlamp Moth', 22], ['', 24],
      ['Music', 30], ...Object.values(TRACK_NAMES).map((n) => [n, 22]), ['every note written in code', 18], ['', 24],
      ['Art', 30], ['drawn entirely in code, wobbly lines and all', 22], ['', 24],
      ['Your year', 30], [`${Math.floor(mins / 60)}h ${mins % 60}m played`, 22], [`${countSeeds(d)} golden seeds · ${d.acorns} acorns`, 22], ['', 24],
      ['In memory of Marigold,', 24], ['who planted sweet peas all along the square', 22], ['', 60],
      ['Thank you for playing!', 40],
    ];
  }

  render(ctx) {
    if (this.phase === 'key') this.drawChamber(ctx);
    else if (this.phase === 'montage') this.drawMontage(ctx);
    else this.drawCredits(ctx);
  }
  drawChamber(ctx) {
    const b = engine.boil, rng = rngFor(301, b);
    drawBackground(ctx, makePal('clockwork', 0), 0, 0, 0, this.t, b);
    shape(ctx, [[-10, 330], [W + 10, 326], [W + 10, H + 10], [-10, H + 10]], { fill: '#9c6a44', rng, lw: 3 });
    drawSeasonClock(ctx, 640, 330, { spin: this.t * 3, gears: 4, t: this.t, boil: b, wound: true });
    drawThimble(ctx, 420, 330, { facing: 1, boil: b });
    drawFox(ctx, 330, 330, { t: this.t, pose: 'idle', facing: 1, outfit: this.outfit, scarfColor: SEASON_COLOR.spring, boil: b, scale: 1.2 });
    this.drawParts(ctx, '#f7c2d2');
  }
  drawMontage(ctx) {
    const i = Math.min(4, Math.floor(this.pt / SLIDE)), k = (this.pt % SLIDE) / SLIDE;
    const s = YEAR[i % 4];
    this.drawTown(ctx, s, i === 4);
    // fade through white between seasons
    const edge = Math.min(k, 1 - k) * SLIDE;
    if (edge < 0.5 && !(i === 0 && k < 0.5)) { ctx.save(); ctx.globalAlpha = 1 - edge / 0.5; ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    const cap = i === 4 ? 'And round again. The year turns, and the Season Clock keeps time.' : s.caption;
    panel(ctx, W / 2 - 360, 22, 720, 56, { seed: 310, r: 16 });
    text(ctx, cap, W / 2, 58, { size: 22, align: 'center', ui: true });
  }
  drawTown(ctx, s, everyone) {
    const b = engine.boil, rng = rngFor(320, b), t = this.t;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, s.sky[0]); g.addColorStop(1, s.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // the sun (or moon) arcs across during each season
    const k = (this.pt % SLIDE) / SLIDE, sx = 80 + k * (W - 160), sy = 150 - Math.sin(k * Math.PI) * 90;
    shape(ctx, ellipse(sx, sy, 30, 30, 16), { fill: s.season === 'winter' ? '#f6f8ff' : '#fff1c9', rng, lw: 2 });
    shape(ctx, [[-10, 340], [W * 0.4, 320], [W + 10, 336], [W + 10, H + 10], [-10, H + 10]], { fill: shade(s.ground, -0.08), rng, lw: 2.4, wob: 2 });
    // houses
    for (const [hx, hw, hh, roof] of [[60, 110, 90, '#b9654a'], [200, 90, 110, '#7b8db0'], [650, 100, 100, '#a8452f'], [790, 120, 80, '#8fc5b4']]) {
      shape(ctx, rrect(hx, 420 - hh, hw, hh + 20, 4), { fill: '#ecd6b0', rng, lw: 2.2 });
      shape(ctx, [[hx - 10, 422 - hh], [hx + hw / 2, 380 - hh], [hx + hw + 10, 422 - hh]], { fill: roof, rng, lw: 2.2 });
      if (s.season === 'winter') shape(ctx, [[hx - 8, 420 - hh], [hx + hw / 2, 384 - hh], [hx + hw + 8, 420 - hh], [hx + hw / 2, 392 - hh]], { fill: '#ffffff', rng, lw: 1.6 });
      shape(ctx, rrect(hx + 14, 440 - hh, 16, 18, 3), { fill: '#fff1c9', rng, lw: 1.8, wash: false });
    }
    // the clock tower, hands sweeping round
    const cx = 480;
    shape(ctx, rrect(cx - 50, 160, 100, 280, 4), { fill: '#ddb98f', rng, lw: 2.4 });
    shape(ctx, [[cx - 62, 164], [cx, 90], [cx + 62, 164]], { fill: '#b9654a', rng, lw: 2.4 });
    shape(ctx, ellipse(cx, 220, 36, 36, 18), { fill: '#fffaf0', rng, lw: 2.4, wash: false });
    ['spring', 'summer', 'autumn', 'winter'].forEach((q, n) => {
      const a = -Math.PI / 2 + n * Math.PI / 2 + Math.PI / 4;
      dot(ctx, cx + Math.cos(a) * 26, 220 + Math.sin(a) * 26, 5, SEASON_COLOR[q]);
    });
    line(ctx, [[cx, 220], [cx + Math.cos(t * 4) * 28, 220 + Math.sin(t * 4) * 28]], { rng, lw: 3 });
    line(ctx, [[cx, 220], [cx + Math.cos(t / 3) * 18, 220 + Math.sin(t / 3) * 18]], { rng, lw: 4 });
    if (s.season === 'spring') for (let n = 0; n < 9; n++) dot(ctx, cx - 44 + (n % 3) * 4, 420 - n * 26, 5, '#f4a3bf');
    // a tree in the square, dressed for the season
    line(ctx, [[340, 440], [342, 330]], { rng, stroke: '#86603f', lw: 9 });
    shape(ctx, ellipse(342, 300, 60, 46, 18), { fill: s.leaf, rng, lw: 2.4, wob: 2 });
    if (s.season === 'autumn') for (let n = 0; n < 6; n++) shape(ctx, ellipse(300 + n * 16, 440, 14, 6, 10), { fill: n % 2 ? '#e0783a' : '#f2a541', rng, lw: 1.4 });
    // ground
    shape(ctx, [[-10, 436], [W + 10, 432], [W + 10, H + 10], [-10, H + 10]], { fill: s.ground, rng, lw: 3 });
    // the friends
    const fy = 470;
    if (everyone) {
      [drawJuniper, drawBasil, drawRook, drawPuddle].forEach((f, n) => f(ctx, 600 + n * 80, fy, { facing: -1, t: t + n, boil: b }));
    } else s.friend(ctx, 680, fy, { facing: -1, t, boil: b });
    drawThimble(ctx, 250, fy, { facing: 1, boil: b });
    const hop = Math.abs(Math.sin(t * 3)) * 10;
    drawFox(ctx, 170, fy - hop, { t, pose: hop > 2 ? 'jump' : 'idle', facing: 1, outfit: this.outfit, scarfColor: SEASON_COLOR[s.season], boil: b, scale: 1.1 });
    this.drawParts(ctx, { spring: '#f7b6c8', summer: '#fff1a0', autumn: '#e0783a', winter: '#ffffff' }[s.season]);
  }
  drawCredits(ctx) {
    const b = engine.boil, rng = rngFor(330, b);
    const cyc = (this.t / 5) % 4, i = Math.floor(cyc), j = (i + 1) % 4, k = Math.min(1, (cyc - i) * 1.6);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mix(YEAR[i].sky[0], YEAR[j].sky[0], k)); g.addColorStop(1, '#fdf3e2');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    gear(ctx, 120, 420, 90, 14, this.t * 0.2, makePal('clockwork', 0.3), rng);
    gear(ctx, 840, 140, 70, 12, -this.t * 0.25, makePal('clockwork', 0.3), rng);
    let y = H + 40 - this.scroll;
    for (const [str, size] of this.lines) {
      if (str && y > -60 && y < H + 60) text(ctx, str, W / 2, y, { size, align: 'center', color: size >= 30 ? '#b5503a' : '#3b2a26', outline: '#fffaf0', outlineW: 6 });
      y += size + 18;
    }
    this.done = this.scroll >= this.maxScroll;
    if (this.done) {
      drawFox(ctx, W / 2, H - 70, { t: this.t, pose: 'idle', facing: 1, outfit: this.outfit, scarfColor: SEASON_COLOR[YEAR[i].season], boil: b, scale: 1.4 });
      text(ctx, `The End  ·  ${fmt('{jump}')} to return to Foxhollows`, W / 2, H - 20, { size: 20, align: 'center', color: '#5a4636', ui: true, alpha: 0.6 + Math.sin(this.t * 3) * 0.4 });
    } else text(ctx, `Hold ${fmt('{jump}')} to speed up`, W - 16, H - 14, { size: 16, align: 'right', color: '#7a6656', ui: true });
    this.drawParts(ctx, YEAR[i].leaf);
  }
  drawParts(ctx, col) {
    ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = 0.85;
    for (const q of this.parts) { ctx.beginPath(); ctx.ellipse(q.x, q.y, 5, 3, q.y * 0.02 + q.r, 0, 7); ctx.fill(); }
    ctx.restore();
  }
}
