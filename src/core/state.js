// Settings (shared by all slots) and the current save slot, stored in the browser.
const KEY = 'foxseasons.v1';

export const DEFAULT_SETTINGS = {
  music: 0.7, sfx: 0.8, crackle: true, bindings: null,
  skipOffer: true, infiniteLives: false, slow: false,
  shake: true, cbSymbols: false, textSize: 1, lastSlot: 0, touch: 'auto',
};

export const state = { settings: { ...DEFAULT_SETTINGS }, slot: 0, data: null, onSettings: [] };

function read(k) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; }
}
function write(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ }
}

export function loadSettings() {
  state.settings = { ...DEFAULT_SETTINGS, ...(read(KEY + '.settings') || {}) };
}
export function saveSettings() {
  write(KEY + '.settings', state.settings);
  state.onSettings.forEach((f) => f());
}

export const START_LIVES = 10;

export const START_FURNITURE = [
  { id: 'bed', slot: 4, flip: false },
  { id: 'lamp', slot: 6, flip: false },
  { id: 'rug', slot: 11, flip: false },
  { id: 'stool', slot: 12, flip: false },
  { id: 'record', slot: 14, flip: false },
];

export function newData(name) {
  return {
    name: name || 'Fennel',
    lives: START_LIVES, livesBoost: true, acorns: 0, acornLife: 0,
    seeds: {}, cleared: {},
    stones: { spring: false, winter: false, autumn: false, summer: false },
    outfit: { fur: 'red', scarf: 'plain', hat: null, glasses: false, satchel: false, ribbon: false, cheeks: false },
    unlocked: { fur: ['red', 'sand'], scarf: ['plain'], hat: [], extras: [], wallpaper: ['stripes'], floor: ['planks'] },
    den: { wallpaper: 'stripes', floor: 'planks' }, secrets: {},
    furniture: { placed: START_FURNITURE.map((f) => ({ ...f })), stored: [], owned: START_FURNITURE.map((f) => f.id) },
    rewards: [], letters: [], tracks: ['title', 'den', 'map'], record: 'den',
    introDone: false, mapNode: 0, time: 0,
  };
}

export function loadSlot(i) {
  state.slot = i;
  const d = read(KEY + '.slot' + i);
  state.data = d ? { ...newData(d.name), ...d } : null;
  // Older saves started with 5 lives: give them the 5 extra lives once.
  // Saves from before the decorating update: default wallpaper and flooring.
  if (state.data) {
    const u = state.data.unlocked;
    u.wallpaper = u.wallpaper || ['stripes']; u.floor = u.floor || ['planks'];
    state.data.den = state.data.den || { wallpaper: 'stripes', floor: 'planks' };
    state.data.secrets = state.data.secrets || {};
  }
  if (state.data && !d.livesBoost) { state.data.lives = Math.min(15, state.data.lives + 5); state.data.livesBoost = true; }
  return state.data;
}
export function saveGame() {
  if (state.noSave) return; // trailer / demo runs never touch real saves
  if (state.data) write(KEY + '.slot' + state.slot, state.data);
  state.settings.lastSlot = state.slot;
  write(KEY + '.settings', state.settings);
}
export function countSeeds(d = state.data) {
  if (!d) return 0;
  return Object.values(d.seeds).reduce((n, a) => n + a.filter(Boolean).length, 0);
}
export function slotInfo(i) {
  const d = read(KEY + '.slot' + i);
  if (!d) return null;
  return {
    name: d.name, seeds: countSeeds(d), time: d.time || 0,
    stones: Object.values(d.stones || {}).filter(Boolean).length,
  };
}
export function copySlot(a, b) { const d = read(KEY + '.slot' + a); if (d) write(KEY + '.slot' + b, d); }
export function deleteSlot(i) { try { localStorage.removeItem(KEY + '.slot' + i); } catch { /* ignore */ } }
