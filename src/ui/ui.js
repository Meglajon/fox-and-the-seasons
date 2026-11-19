// Reusable overlays: list menus, dialogue, choices, name entry, letters, toasts.
import { engine, W, H, popOverlay } from '../core/engine.js';
import { input, bindName } from '../core/input.js';
import { panel, text, wrap, INK, setFont, shape, ellipse, rngFor, dot } from '../art/ink.js';
import { sfx } from '../audio/sfx.js';
import { state } from '../core/state.js';
import { drawThimble, drawJuniper, drawSign, drawPumpkin, drawStoneGem } from '../art/critters.js';
import { drawFox } from '../art/fox.js';
import { SEASON_COLOR } from '../art/palettes.js';
import { drawPuddle, drawRook, drawPike } from '../art/critters2.js';
import { drawBasil, drawSunMoth } from '../art/critters3.js';

export function fmt(s) {
  return String(s)
    .replaceAll('{name}', state.data?.name || 'Fennel')
    .replaceAll('{jump}', bindName('jump')).replaceAll('{next}', bindName('next'))
    .replaceAll('{prev}', bindName('prev')).replaceAll('{sprint}', bindName('sprint'))
    .replaceAll('{up}', bindName('up')).replaceAll('{flip}', bindName('flip')).replaceAll('{pause}', bindName('pause'));
}

export function dim(ctx, a = 0.45) {
  ctx.fillStyle = `rgba(36,28,26,${a})`;
  ctx.fillRect(0, 0, W, H);
}

export function drawToasts(ctx) {
  let y = 16;
  engine.toasts.forEach((t, i) => {
    const a = t.t < 0.25 ? t.t / 0.25 : t.t > 2.8 ? (3.2 - t.t) / 0.4 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    setFont(ctx, 22, true);
    const w = ctx.measureText(t.text).width + 44;
    panel(ctx, W / 2 - w / 2, y - (1 - a) * 10, w, 40, { seed: i * 7 + 1, r: 12 });
    text(ctx, t.text, W / 2, y + 27 - (1 - a) * 10, { size: 22, align: 'center', ui: true });
    ctx.restore();
    y += 48;
  });
}

// A hand-drawn leaf used as the selection pointer.
function pointer(ctx, x, y, t) {
  const rng = rngFor(4, engine.boil);
  shape(ctx, ellipse(x + Math.sin(t * 6) * 2, y, 9, 5, 10, 0), { fill: '#86c463', rng, lw: 2 });
}

export class ListMenu {
  constructor(o) {
    Object.assign(this, { title: '', items: [], x: W / 2 - 240, y: 70, w: 480, sel: 0, onBack: null, note: null, scroll: 0, dimBg: true }, o);
    this.t = 0;
  }
  update(dt) {
    this.t += dt;
    const n = this.items.length;
    if (!n) { if (input.pressed('back')) this.close(); return; }
    if (input.pressed('up')) { this.sel = (this.sel - 1 + n) % n; sfx('move'); }
    if (input.pressed('down')) { this.sel = (this.sel + 1) % n; sfx('move'); }
    const it = this.items[this.sel];
    if (it.left && input.pressed('left')) { it.left(); sfx('move'); }
    if (it.right && input.pressed('right')) { it.right(); sfx('move'); }
    if (input.pressed('confirm') && (it.select || it.right)) {
      if (it.disabled?.()) sfx('deny');
      else { sfx('select'); (it.select || it.right)(); }
    } else if (input.pressed('back')) { sfx('back'); this.close(); }
  }
  close() { if (this.onBack) this.onBack(); else popOverlay(this); }
  render(ctx) {
    if (this.dimBg) dim(ctx);
    const ts = state.settings.textSize;
    const lh = 38 * ts;
    const hasHint = this.note || this.items.some((i) => i.hint);
    const noteH = hasHint ? 50 * ts : 0;
    const maxVis = Math.max(3, Math.floor((H - this.y - 20 - 98 - noteH) / lh));
    const vis = Math.min(this.items.length, maxVis);
    if (this.sel < this.scroll) this.scroll = this.sel;
    if (this.sel >= this.scroll + vis) this.scroll = this.sel - vis + 1;
    const h = 78 + vis * lh + noteH + 20;
    panel(ctx, this.x, this.y, this.w, h, { seed: 3 });
    text(ctx, this.title, this.x + this.w / 2, this.y + 42, { size: 32, align: 'center', ui: true });
    for (let i = 0; i < vis; i++) {
      const idx = i + this.scroll;
      const it = this.items[idx];
      const y = this.y + 80 + i * lh + lh * 0.55;
      const on = idx === this.sel;
      const dis = it.disabled?.();
      const label = typeof it.label === 'function' ? it.label() : it.label;
      const col = dis ? '#a3978a' : INK;
      if (on) pointer(ctx, this.x + 28, y - 7, this.t);
      text(ctx, label, this.x + 46, y, { size: 24, color: col, ui: true });
      if (it.value) {
        const v = it.value();
        const vx = this.x + this.w - 30;
        text(ctx, (it.left ? '‹ ' : '') + v + (it.right ? ' ›' : ''), vx, y, { size: 24, align: 'right', color: on ? '#b5503a' : col, ui: true });
      }
    }
    if (this.scroll > 0) text(ctx, '▲', this.x + this.w / 2, this.y + 70, { size: 16, align: 'center' });
    if (this.scroll + vis < this.items.length) text(ctx, '▼', this.x + this.w - 30, this.y + 80 + vis * lh - 4, { size: 16, align: 'center' });
    const cur = this.items[this.sel];
    const hint = cur && (typeof cur.hint === 'function' ? cur.hint() : cur.hint);
    const note = hint || this.note;
    if (note) {
      const lines = wrap(ctx, fmt(note), this.w - 60, 19, true);
      lines.slice(0, 2).forEach((l, i) => text(ctx, l, this.x + this.w / 2, this.y + 88 + vis * lh + i * 22 * ts, { size: 19, align: 'center', color: '#7a6656', ui: true }));
    }
  }
}

export function portrait(ctx, who, x, y, t) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, 46, 0, Math.PI * 2);
  ctx.fillStyle = '#f3e3c3'; ctx.fill();
  ctx.clip();
  const b = engine.boil;
  if (who === 'thimble') drawThimble(ctx, x - 6, y + 82, { boil: b });
  else if (who === 'juniper') drawJuniper(ctx, x - 6, y + 72, { boil: b, t });
  else if (who === 'fennel') drawFox(ctx, x - 14, y + 62, { scale: 1.7, t, outfit: state.data?.outfit, boil: b, scarfColor: SEASON_COLOR.none });
  else if (who === 'sign') drawSign(ctx, x, y + 30, b);
  else if (who === 'pumpkin') drawPumpkin(ctx, x, y + 120, { scale: 0.5, boil: b, t });
  else if (who === 'stone') drawStoneGem(ctx, x, y, engine.scene?.district?.season || 'spring', { scale: 1.8, t, boil: b });
  else if (who === 'puddle') drawPuddle(ctx, x - 6, y + 84, { boil: b, t });
  else if (who === 'rook') drawRook(ctx, x - 6, y + 80, { boil: b, t });
  else if (who === 'pike') { ctx.translate(x, y + 10); ctx.scale(0.55, 0.55); drawPike(ctx, -30, 0, { boil: b }); }
  else if (who === 'basil') drawBasil(ctx, x - 4, y + 60, { boil: b, t });
  else if (who === 'sunmoth') { ctx.translate(x, y + 16); ctx.scale(0.5, 0.5); drawSunMoth(ctx, 0, 0, { boil: b, t, shield: 1 }); }
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, 46, 0, Math.PI * 2);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
}

const NAMES = {
  thimble: 'Thimble', juniper: 'Juniper', sign: 'Sign', pumpkin: 'The Overgrown Pumpkin', stone: '',
  puddle: 'Captain Puddle', rook: 'Mrs. Rook', pike: 'Old Pike', basil: 'Basil', sunmoth: 'The Sunlamp Moth',
};

export class Dialogue {
  constructor(lines, onDone) { this.lines = lines; this.i = 0; this.chars = 0; this.onDone = onDone; this.t = 0; }
  update(dt) {
    this.t += dt;
    const line = this.lines[this.i];
    const full = fmt(line.text);
    const adv = input.pressed('confirm') || input.pressed('up');
    if (this.chars < full.length) {
      const before = Math.floor(this.chars);
      this.chars += dt * 50;
      if (Math.floor(this.chars) !== before && before % 3 === 0 && line.who && line.who !== 'sign') sfx('talk');
      if (adv && this.t > 0.15) this.chars = full.length;
    } else if (adv) {
      this.i++; this.chars = 0;
      if (this.i >= this.lines.length) { popOverlay(this); this.onDone?.(); }
    }
  }
  render(ctx) {
    const line = this.lines[Math.min(this.i, this.lines.length - 1)];
    const x = 40, y = H - 178, w = W - 80, h = 156;
    panel(ctx, x, y, w, h, { seed: 9 });
    const who = line.who;
    const tx = who ? x + 140 : x + 30;
    if (who) portrait(ctx, who, x + 72, y + h / 2, this.t);
    let name = who === 'fennel' ? state.data?.name || 'Fennel' : NAMES[who] || '';
    if (name) text(ctx, name, tx, y + 36, { size: 24, color: '#b5503a', ui: true });
    const full = fmt(line.text);
    const shown = full.slice(0, Math.floor(this.chars));
    const lines = wrap(ctx, full, w - (tx - x) - 30, 24, true);
    let used = 0;
    lines.forEach((l, i) => {
      const part = shown.slice(used, used + l.length);
      used += l.length + 1;
      text(ctx, part, tx, y + (name ? 70 : 46) + i * 28 * state.settings.textSize, { size: 24, ui: true });
    });
    if (this.chars >= full.length) text(ctx, '▸', x + w - 30, y + h - 18 + Math.sin(this.t * 6) * 3, { size: 24 });
  }
}

export class Choice {
  constructor(question, options, cb) { this.q = question; this.opts = options; this.sel = 0; this.cb = cb; this.t = 0; }
  update(dt) {
    this.t += dt;
    if (input.pressed('left') || input.pressed('up')) { this.sel = (this.sel - 1 + this.opts.length) % this.opts.length; sfx('move'); }
    if (input.pressed('right') || input.pressed('down')) { this.sel = (this.sel + 1) % this.opts.length; sfx('move'); }
    if (input.pressed('confirm') && this.t > 0.15) { sfx('select'); popOverlay(this); this.cb(this.sel); }
    else if (input.pressed('back')) { sfx('back'); popOverlay(this); this.cb(this.opts.length - 1); }
  }
  render(ctx) {
    dim(ctx, 0.35);
    const w = 560, h = 190, x = W / 2 - w / 2, y = H / 2 - h / 2;
    panel(ctx, x, y, w, h, { seed: 12 });
    wrap(ctx, fmt(this.q), w - 60, 26, true).forEach((l, i) => text(ctx, l, W / 2, y + 50 + i * 30, { size: 26, align: 'center', ui: true }));
    const gap = w / (this.opts.length + 1);
    this.opts.forEach((o, i) => {
      const ox = x + gap * (i + 1);
      if (i === this.sel) pointer(ctx, ox - 60, y + h - 44, this.t);
      text(ctx, o, ox, y + h - 36, { size: 26, align: 'center', color: i === this.sel ? '#b5503a' : INK, ui: true });
    });
  }
}

export class NameEntry {
  constructor(initial, cb, canCancel = false) { this.v = initial || ''; this.cb = cb; this.t = 0; this.canCancel = canCancel; }
  enter() {
    if (input.touchMode) {
      // Phones: use the system text box so the on-screen keyboard appears.
      setTimeout(() => {
        const v = window.prompt("What's your fox's name?", this.v);
        if (v === null && this.canCancel) { this.close(); return; }
        if (v !== null) this.v = v.slice(0, 12);
        this.finish();
      }, 80);
      return;
    }
    input.text = (e) => {
      if (e.key === 'Enter') { this.finish(); return true; }
      if (e.key === 'Escape') { if (this.canCancel) { this.close(); this.cbCancel = true; } return true; }
      if (e.key === 'Backspace') { this.v = this.v.slice(0, -1); sfx('move'); return true; }
      if (e.key.length === 1 && /[\p{L}\p{N} '\-]/u.test(e.key) && this.v.length < 12) { this.v += e.key; sfx('talk'); return true; }
      return false;
    };
  }
  exit() { input.text = null; }
  close() { popOverlay(this); }
  finish() {
    const name = this.v.trim() || 'Fennel';
    sfx('select');
    popOverlay(this);
    this.cb(name);
  }
  update(dt) { this.t += dt; if (input.pressed('confirm') && this.t > 0.2) this.finish(); }
  render(ctx) {
    dim(ctx, 0.5);
    const w = 560, h = 230, x = W / 2 - w / 2, y = H / 2 - h / 2 - 20;
    panel(ctx, x, y, w, h, { seed: 14 });
    text(ctx, "What's your fox's name?", W / 2, y + 52, { size: 30, align: 'center', ui: true });
    shape(ctx, [[x + 90, y + 132], [x + w - 90, y + 132]], { closed: false, rng: rngFor(2, engine.boil), lw: 2.5 });
    const caret = Math.sin(this.t * 6) > 0 ? '|' : ' ';
    text(ctx, this.v + caret, W / 2, y + 122, { size: 40, align: 'center', color: '#b5503a' });
    text(ctx, 'Type a name, then press Enter', W / 2, y + 180, { size: 20, align: 'center', color: '#7a6656', ui: true });
  }
}

export class LetterCard {
  constructor(title, body, sign, cb) { this.title = title; this.body = body; this.sign = sign; this.cb = cb; this.t = 0; }
  update(dt) { this.t += dt; if (this.t > 1 && input.pressed('confirm')) { sfx('select'); popOverlay(this); this.cb?.(); } }
  render(ctx) {
    dim(ctx, 0.6);
    const w = 620, h = 440, x = W / 2 - w / 2, y = 50;
    const a = Math.min(1, this.t * 2);
    ctx.save(); ctx.globalAlpha = a;
    ctx.translate(W / 2, y + h / 2); ctx.rotate(-0.015); ctx.translate(-W / 2, -(y + h / 2));
    panel(ctx, x, y, w, h, { seed: 21, fill: '#fbf0dc' });
    text(ctx, this.title, W / 2, y + 50, { size: 30, align: 'center', color: '#b5503a', ui: true });
    const lines = wrap(ctx, this.body, w - 90, 23, true);
    lines.forEach((l, i) => text(ctx, l, x + 45, y + 96 + i * 28 * state.settings.textSize, { size: 23, ui: true }));
    text(ctx, this.sign, x + w - 50, y + h - 50, { size: 26, align: 'right', ui: true });
    dot(ctx, x + 60, y + h - 50, 10, '#c9473d');
    if (this.t > 1) text(ctx, 'Press ' + bindName('jump') + ' to fold the letter away', W / 2, y + h + 28, { size: 20, align: 'center', color: '#f3e6cc', ui: true });
    ctx.restore();
  }
}

export class Card {
  // Generic "big moment" card: title, lines, optional draw callback, press to continue.
  constructor(o) { Object.assign(this, o); this.t = 0; }
  update(dt) { this.t += dt; if (this.t > 0.8 && input.pressed('confirm')) { sfx('select'); popOverlay(this); this.cb?.(); } }
  render(ctx) {
    dim(ctx, 0.4);
    const w = 520, h = this.h || 300, x = W / 2 - w / 2, y = H / 2 - h / 2 - 10;
    const s = Math.min(1, this.t * 3);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(0.85 + s * 0.15, 0.85 + s * 0.15); ctx.translate(-W / 2, -H / 2);
    ctx.globalAlpha = s;
    panel(ctx, x, y, w, h, { seed: 31 });
    text(ctx, this.title, W / 2, y + 56, { size: 40, align: 'center', color: '#b5503a', ui: true });
    (this.lines || []).forEach((l, i) => text(ctx, l, W / 2, y + 100 + i * 30, { size: 24, align: 'center', ui: true }));
    this.draw?.(ctx, x, y, w, h, this.t);
    if (this.t > 0.8) text(ctx, 'Press ' + bindName('jump'), W / 2, y + h - 22, { size: 20, align: 'center', color: '#7a6656', ui: true });
    ctx.restore();
  }
}
