// Title screen: a tree cycling through the seasons, Fennel napping beneath it, and the save slots.
import { engine, W, H, setScene, transition, pushOverlay } from '../core/engine.js';
import { input } from '../core/input.js';
import { state, loadSlot, newData, saveGame, slotInfo } from '../core/state.js';
import { mix, lerp } from '../core/util.js';
import { shape, line, ellipse, rngFor, dot, text } from '../art/ink.js';
import { drawFox } from '../art/fox.js';
import { initAudio } from '../audio/audio.js';
import { playMusic } from '../audio/music.js';
import { sfx } from '../audio/sfx.js';
import { ListMenu, NameEntry } from '../ui/ui.js';
import { SettingsCabinet } from '../ui/screens.js';
import { MapScene } from './map.js';
import { DenScene } from './den.js';

const LEAF = ['#f4a3bf', '#7fbf5a', '#e0783a', '#f4f6fb'];
const SKY = ['#bfe3ee', '#9fd3ea', '#f3c99a', '#c9d6e6'];
const GROUND = ['#8fc47a', '#86c463', '#c9a25a', '#eef2f6'];

export class TitleScene {
  constructor(skipPress) { this.t = 0; this.ready = !!skipPress; this.menu = null; }
  enter() { if (this.ready) { playMusic('title'); this.openMenu(); } }
  update(dt) {
    this.t += dt;
    if (!this.ready && (input.anyPressed() || input.pressed('confirm'))) {
      initAudio();
      this.ready = true;
      playMusic('title');
      sfx('select');
      this.openMenu();
    }
    if (this.ready && !engine.overlays.length && input.pressed('confirm')) this.openMenu();
  }
  openMenu() {
    const items = [0, 1, 2].map((i) => ({
      label: () => { const inf = slotInfo(i); return inf ? `${inf.name}` : `Slot ${i + 1}: new game`; },
      value: () => { const inf = slotInfo(i); return inf ? `${inf.stones}/4 stones · ${inf.seeds} seeds` : ''; },
      select: () => this.pick(i),
    }));
    items.push({ label: 'Settings cabinet', select: () => pushOverlay(new SettingsCabinet()) });
    this.menu = new ListMenu({ title: 'Choose a save slot', items, y: 250, w: 520, x: W / 2 - 260, dimBg: false, onBack: () => {} });
    this.menu.sel = Math.min(state.settings.lastSlot || 0, 2);
    pushOverlay(this.menu);
  }
  pick(i) {
    const d = loadSlot(i);
    if (d) {
      transition(() => setScene(d.introDone ? new MapScene() : new DenScene()));
    } else {
      pushOverlay(new NameEntry('Fennel', (name) => {
        state.slot = i;
        state.data = newData(name);
        saveGame();
        transition(() => setScene(new DenScene()));
      }, true));
    }
  }
  render(ctx) {
    const cyc = (this.t / 4) % 4, i = Math.floor(cyc), k = Math.min(1, (cyc - i) * 1.6), j = (i + 1) % 4;
    const col = (arr) => mix(arr[i], arr[j], k);
    const b = engine.boil, rng = rngFor(201, b);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, col(SKY)); g.addColorStop(1, '#fdf3e2');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    shape(ctx, [[-10, 430], [300, 400], [620, 420], [W + 10, 395], [W + 10, H + 10], [-10, H + 10]], { fill: col(GROUND), rng, lw: 3, wob: 2 });
    // tree
    const tx = 690, ty = 420;
    shape(ctx, [[tx - 22, ty + 6], [tx - 14, ty - 120], [tx - 40, ty - 170], [tx - 6, ty - 140], [tx + 4, ty - 190], [tx + 14, ty - 136], [tx + 48, ty - 160], [tx + 16, ty - 110], [tx + 24, ty + 6]], { fill: '#86603f', rng, lw: 3, step: 16 });
    for (const [ox, oy, r] of [[-70, -190, 62], [10, -235, 74], [86, -186, 60], [-20, -160, 54], [50, -140, 46]]) {
      shape(ctx, ellipse(tx + ox, ty + oy, r, r * 0.8, 18), { fill: col(LEAF), rng, lw: 2.6, wob: 2.4 });
    }
    // falling bits (petals / leaves / snow)
    for (let n = 0; n < 14; n++) {
      const px = tx - 150 + ((n * 47 + this.t * 30) % 320), py = ty - 220 + ((n * 83 + this.t * 40) % 260);
      ctx.fillStyle = col(LEAF); ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.ellipse(px + Math.sin(this.t * 2 + n) * 10, py, 5, 3, n + this.t, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    drawFox(ctx, tx - 110, ty + 2, { scale: 2, sleep: true, t: this.t, boil: b, scarfColor: col(LEAF), outfit: { fur: 'red', scarf: 'plain' } });
    text(ctx, 'z', tx - 60 + Math.sin(this.t * 2) * 6, ty - 70 - ((this.t * 20) % 40), { size: 26, color: '#5a4a6a', alpha: 0.7 });

    ctx.save(); ctx.translate(60, 110); ctx.rotate(-0.03);
    text(ctx, 'Fox & the', 0, 0, { size: 54, color: '#3b2a26', outline: '#fffaf0', outlineW: 8 });
    text(ctx, 'Seasons', 30, 86, { size: 104, color: '#b5503a', outline: '#fffaf0', outlineW: 10 });
    ctx.restore();
    text(ctx, 'a cozy hand-drawn platformer', 96, 232, { size: 24, color: '#5a4636' });
    if (!this.ready) {
      const a = 0.6 + Math.sin(this.t * 3) * 0.4;
      text(ctx, 'Press any key to begin', 260, 330, { size: 32, align: 'center', alpha: a, outline: '#fffaf0' });
    }
    text(ctx, 'Art and music made entirely in code', W - 20, H - 16, { size: 18, align: 'right', color: '#5a4636' });
  }
}
