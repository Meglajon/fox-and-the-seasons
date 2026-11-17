// The settings cabinet (5 drawers), wardrobe, catalogue shop and storage chest.
import { engine, W, H, pushOverlay, popOverlay, toast } from '../core/engine.js';
import { input, REMAPPABLE, keyName, setBinding, resetBindings } from '../core/input.js';
import { state, saveSettings, saveGame, slotInfo, copySlot, deleteSlot } from '../core/state.js';
import { applyVolumes } from '../audio/audio.js';
import { sfx } from '../audio/sfx.js';
import { ListMenu, Choice, NameEntry, dim } from './ui.js';
import { panel, text } from '../art/ink.js';
import { drawFox, FURS, FUR_ORDER, SCARVES, HATS, EXTRAS } from '../art/fox.js';
import { FURN } from '../art/furniture.js';
import { SEASON_COLOR } from '../art/palettes.js';
import { grantFurniture, unlockOutfit, SEED_FUR_HOW } from '../game/progress.js';
import { applyTouch } from '../core/touch.js';

const onOff = (v) => (v ? 'On' : 'Off');
const pct = (v) => Math.round(v * 10) + ' / 10';
function setS(k, v) { state.settings[k] = v; saveSettings(); applySettings(); }
const TOUCH_MODES = ['auto', 'on', 'off'];
const cycleTouch = (v, d) => TOUCH_MODES[(TOUCH_MODES.indexOf(v || 'auto') + d + 3) % 3];
export function applySettings() {
  engine.speed = state.settings.slow ? 0.8 : 1;
  engine.shakeOn = state.settings.shake;
  applyVolumes();
  applyTouch();
}
const fmtTime = (s) => `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`;

class KeyCapture {
  constructor(action, label) { this.action = action; this.label = label; }
  enter() {
    input.capture = (code) => {
      if (code !== 'Escape') { setBinding(this.action, code); state.settings.bindings = input.bindings; saveSettings(); sfx('select'); }
      popOverlay(this);
    };
  }
  exit() { input.capture = null; }
  update() {}
  render(ctx) {
    dim(ctx, 0.4);
    panel(ctx, W / 2 - 230, H / 2 - 70, 460, 130, { seed: 61 });
    text(ctx, `Press a key for "${this.label}"`, W / 2, H / 2 - 16, { size: 26, align: 'center', ui: true });
    text(ctx, 'Esc to cancel', W / 2, H / 2 + 26, { size: 20, align: 'center', color: '#7a6656', ui: true });
  }
}

export class SettingsCabinet extends ListMenu {
  constructor() {
    super({
      title: 'Settings cabinet',
      note: 'Pick a drawer. Esc closes the cabinet.',
      items: [
        { label: 'Sound', select: () => pushOverlay(soundDrawer()), hint: 'Music, sound effects, vinyl crackle' },
        { label: 'Controls', select: () => pushOverlay(controlsDrawer()), hint: 'Change which keys do what' },
        { label: 'Assist', select: () => pushOverlay(assistDrawer()), hint: 'Skip offers, infinite lives, slower speed' },
        { label: 'Display', select: () => pushOverlay(displayDrawer()), hint: 'Screen shake, season symbols, text size' },
        { label: 'Save slots', select: () => pushOverlay(saveDrawer()), hint: 'Copy or delete save slots' },
      ],
    });
  }
}

function soundDrawer() {
  const s = state.settings;
  const adj = (k, d) => () => setS(k, Math.round(Math.min(1, Math.max(0, s[k] + d)) * 10) / 10);
  return new ListMenu({
    title: 'Sound drawer',
    items: [
      { label: 'Music volume', value: () => pct(s.music), left: adj('music', -0.1), right: adj('music', 0.1) },
      { label: 'Sound effects', value: () => pct(s.sfx), left: adj('sfx', -0.1), right: adj('sfx', 0.1) },
      { label: 'Vinyl crackle', value: () => onOff(s.crackle), left: () => setS('crackle', !s.crackle), right: () => setS('crackle', !s.crackle) },
    ],
    note: 'Use ← → to change a setting.',
  });
}

function controlsDrawer() {
  const items = REMAPPABLE.map(([a, label]) => ({
    label, value: () => keyName(input.bindings[a]?.[0]), select: () => pushOverlay(new KeyCapture(a, label)),
  }));
  items.push({ label: 'Reset to defaults', select: () => { resetBindings(); state.settings.bindings = null; saveSettings(); toast('Controls reset'); } });
  return new ListMenu({ title: 'Controls drawer', items, y: 40, note: 'Gamepad: A jump · X sprint · LB / RB seasons · Y flip · Start pause' });
}

function assistDrawer() {
  const s = state.settings;
  return new ListMenu({
    title: 'Assist drawer',
    items: [
      { label: 'Offer a skip after 3 tries', value: () => onOff(s.skipOffer), left: () => setS('skipOffer', !s.skipOffer), right: () => setS('skipOffer', !s.skipOffer) },
      { label: 'Infinite lives', value: () => onOff(s.infiniteLives), left: () => setS('infiniteLives', !s.infiniteLives), right: () => setS('infiniteLives', !s.infiniteLives) },
      { label: 'Game speed', value: () => (s.slow ? '80%' : '100%'), left: () => setS('slow', !s.slow), right: () => setS('slow', !s.slow) },
    ],
    note: 'These make the game gentler. Use them whenever you like!',
  });
}

function displayDrawer() {
  const s = state.settings;
  return new ListMenu({
    title: 'Display drawer',
    items: [
      { label: 'Screen shake', value: () => onOff(s.shake), left: () => setS('shake', !s.shake), right: () => setS('shake', !s.shake) },
      { label: 'Season symbols', value: () => onOff(s.cbSymbols), left: () => setS('cbSymbols', !s.cbSymbols), right: () => setS('cbSymbols', !s.cbSymbols), hint: 'Adds a symbol to each season, so you never have to rely on colour alone' },
      { label: 'Text size', value: () => (s.textSize > 1 ? 'Large' : 'Normal'), left: () => setS('textSize', s.textSize > 1 ? 1 : 1.2), right: () => setS('textSize', s.textSize > 1 ? 1 : 1.2) },
      {
        label: 'On-screen controls', value: () => ({ auto: 'Auto', on: 'On', off: 'Off' }[s.touch || 'auto']),
        left: () => setS('touch', cycleTouch(s.touch, -1)), right: () => setS('touch', cycleTouch(s.touch, 1)),
        hint: 'Touch buttons for phones and tablets. Auto shows them only on touch screens.',
      },
    ],
  });
}

function saveDrawer() {
  const menu = new ListMenu({ title: 'Save slots', items: [] });
  const build = () => {
    menu.items = [0, 1, 2].map((i) => ({
      label: `Slot ${i + 1}${state.data && i === state.slot ? ' (playing)' : ''}`,
      value: () => { const inf = slotInfo(i); return inf ? `${inf.name} · ${inf.seeds} seeds · ${fmtTime(inf.time)}` : 'Empty'; },
      select: () => pushOverlay(slotActions(i, build)),
    }));
  };
  build();
  menu.w = 600; menu.x = W / 2 - 300;
  return menu;
}

function slotActions(i, rebuild) {
  const current = state.data && i === state.slot;
  const items = [];
  if (current) items.push({ label: 'Save now', select: () => { saveGame(); toast('Game saved'); } });
  for (const j of [0, 1, 2]) {
    if (j === i) continue;
    items.push({
      label: `Copy to slot ${j + 1}`,
      disabled: () => !slotInfo(i) && !current,
      select: () => {
        const go = () => { if (current) saveGame(); copySlot(i, j); toast(`Copied to slot ${j + 1}`); rebuild(); };
        if (slotInfo(j)) pushOverlay(new Choice(`Slot ${j + 1} already has a save. Replace it?`, ['Replace', 'Cancel'], (c) => { if (c === 0) go(); }));
        else go();
      },
    });
  }
  if (!current) {
    items.push({
      label: 'Delete this slot', disabled: () => !slotInfo(i),
      select: () => pushOverlay(new Choice(`Delete slot ${i + 1}? This can't be undone.`, ['Delete', 'Cancel'], (c) => {
        if (c === 0) { deleteSlot(i); toast(`Slot ${i + 1} deleted`); rebuild(); popOverlay(); }
      })),
    });
  }
  return new ListMenu({ title: `Slot ${i + 1}`, items });
}

// ---------------- wardrobe ----------------
export class Wardrobe extends ListMenu {
  constructor() {
    const d = state.data, o = d.outfit, u = d.unlocked;
    const cycle = (list, cur, dir) => { const i = list.indexOf(cur); return list[(i + dir + list.length) % list.length]; };
    const furs = () => FUR_ORDER.filter((f) => u.fur.includes(f));
    const scarves = () => SCARVES.map((s) => s.id).filter((s) => u.scarf.includes(s));
    const hats = () => [null, ...HATS.filter((h) => h.id && u.hat.includes(h.id)).map((h) => h.id)];
    const save = () => saveGame();
    const items = [
      { label: 'Fur', value: () => FURS[o.fur].name, left: () => { o.fur = cycle(furs(), o.fur, -1); save(); }, right: () => { o.fur = cycle(furs(), o.fur, 1); save(); },
        hint: () => { const l = FUR_ORDER.filter((f) => !u.fur.includes(f)); return l.length ? `Still to find: ${l.map((f) => `${FURS[f].name} (${SEED_FUR_HOW[f]})`).join(', ')}` : 'Every fur colour found!'; } },
      { label: 'Scarf', value: () => SCARVES.find((s) => s.id === o.scarf).name, left: () => { o.scarf = cycle(scarves(), o.scarf, -1); save(); }, right: () => { o.scarf = cycle(scarves(), o.scarf, 1); save(); },
        hint: 'Your scarf changes colour with the season. More patterns in the catalogue.' },
      { label: 'Hat', value: () => HATS.find((h) => h.id === o.hat).name, left: () => { o.hat = cycle(hats(), o.hat, -1); save(); }, right: () => { o.hat = cycle(hats(), o.hat, 1); save(); },
        hint: () => { const l = HATS.filter((h) => h.id && !u.hat.includes(h.id)); return l.length ? 'Still to find: ' + l.map((h) => `${h.name} (${h.how || 'catalogue'})`).join(', ') : 'Every hat found!'; } },
      ...EXTRAS.map((e) => ({
        label: e.name,
        value: () => (u.extras.includes(e.id) ? onOff(o[e.id]) : 'Locked'),
        left: () => { if (u.extras.includes(e.id)) { o[e.id] = !o[e.id]; save(); } },
        right: () => { if (u.extras.includes(e.id)) { o[e.id] = !o[e.id]; save(); } },
        hint: () => (u.extras.includes(e.id) ? '' : `Buy it from the catalogue for ${e.price} acorns`),
      })),
      { label: 'Name', value: () => d.name, select: () => pushOverlay(new NameEntry(d.name, (n) => { d.name = n; save(); }, true)) },
    ];
    super({ title: 'Wardrobe', items, x: 420, w: 510, y: 40 });
  }
  render(ctx) {
    dim(ctx);
    panel(ctx, 30, 40, 370, 460, { seed: 71, fill: '#f6ead4' });
    text(ctx, 'Mirror', 215, 84, { size: 28, align: 'center', ui: true });
    drawFox(ctx, 225, 400, { scale: 3, t: this.t, outfit: state.data.outfit, scarfColor: SEASON_COLOR[state.data.stones.spring ? 'spring' : 'none'], boil: engine.boil, speed: 120 + Math.sin(this.t) * 100 });
    const saveDim = this.dimBg; this.dimBg = false; super.render(ctx); this.dimBg = saveDim;
  }
}

// ---------------- catalogue ----------------
export class Catalogue extends ListMenu {
  constructor() { super({ title: 'Catalogue', items: [], w: 560, x: W / 2 - 280, y: 40 }); this.build(); }
  build() {
    const d = state.data, u = d.unlocked;
    const list = [];
    for (const [id, f] of Object.entries(FURN)) if (f.price && !d.furniture.owned.includes(id)) list.push({ kind: 'furn', id, name: f.name, price: f.price, tag: 'Furniture' });
    for (const s of SCARVES) if (s.price && !u.scarf.includes(s.id)) list.push({ kind: 'scarf', id: s.id, name: `${s.name} scarf`, price: s.price, tag: 'Outfit' });
    for (const h of HATS) if (h.price && !u.hat.includes(h.id)) list.push({ kind: 'hat', id: h.id, name: h.name, price: h.price, tag: 'Outfit' });
    for (const e of EXTRAS) if (!u.extras.includes(e.id)) list.push({ kind: 'extras', id: e.id, name: e.name, price: e.price, tag: 'Outfit' });
    this.items = list.map((it) => ({
      label: it.name, value: () => `${it.price} acorns`, disabled: () => d.acorns < it.price,
      hint: () => (d.acorns < it.price ? `You need ${it.price - d.acorns} more acorns` : `${it.tag}. Press ${'{jump}'} to buy.`),
      select: () => this.buy(it),
    }));
    if (!this.items.length) this.note = 'You have bought everything. What a cozy den!';
    this.sel = Math.min(this.sel, Math.max(0, this.items.length - 1));
  }
  buy(it) {
    const d = state.data;
    d.acorns -= it.price;
    if (it.kind === 'furn') {
      const where = grantFurniture(it.id);
      toast(where === 'placed' ? `${it.name} is in your den!` : `${it.name} is in the storage chest`);
    } else {
      unlockOutfit(it.kind, it.id);
      toast(`${it.name} added to the wardrobe`);
    }
    sfx('buy');
    saveGame();
    this.build();
  }
  render(ctx) {
    super.render(ctx);
    text(ctx, `You have ${state.data.acorns} acorns`, this.x + this.w - 24, this.y + 40, { size: 20, align: 'right', color: '#7a6656', ui: true });
  }
}

// ---------------- storage chest ----------------
export class Storage extends ListMenu {
  constructor(onTake) {
    super({ title: 'Storage chest', items: [] });
    this.onTake = onTake;
    const stored = state.data.furniture.stored;
    this.items = stored.map((id, i) => ({ label: FURN[id].name, select: () => { stored.splice(i, 1); popOverlay(this); onTake(id); } }));
    this.note = stored.length ? 'Pick something to carry out.' : 'The chest is empty. Carry furniture here and press {up} to store it.';
  }
}
