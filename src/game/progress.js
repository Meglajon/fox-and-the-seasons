// Rewards and unlocks: acorns, lives, golden-seed milestones, furniture and outfits.
import { state, countSeeds } from '../core/state.js';
import { FURN, SLOT } from '../art/furniture.js';
import { FURS } from '../art/fox.js';

export const MAX_LIVES = 15;
const SEED_REWARDS = [
  [5, 'furn', 'fern'], [6, 'fur', 'arctic'], [10, 'furn', 'paint_fox'],
  [12, 'fur', 'silver'], [15, 'furn', 'paint_bloom'], [18, 'fur', 'midnight'],
];
export const SEED_FUR_HOW = { arctic: 'Collect 6 golden seeds', silver: 'Collect 12 golden seeds', midnight: 'Collect 18 golden seeds' };

// Returns how many extra lives the acorns earned (every 100 acorns = 1 life).
export function addAcorns(n) {
  const d = state.data;
  d.acorns += n;
  d.acornLife = (d.acornLife || 0) + n;
  let lives = 0;
  while (d.acornLife >= 100) { d.acornLife -= 100; if (addLife()) lives++; }
  return lives;
}
export function addLife() {
  const d = state.data;
  if (d.lives >= MAX_LIVES) return false;
  d.lives++;
  return true;
}

// The Den is a grid: 20 slots across; floor items and rugs have 3 depths (0 back, 1 middle, 2 front),
// wall items have 2 heights (0 high, 1 low). Some cells are taken by the fixed door, wardrobe,
// fireplace, window, cabinet, chest and catalogue.
export const RESERVED = {
  floor: [[0, 1, 2, 3, 9, 10, 16, 17, 18, 19], [0, 1], [0, 1]],
  rug: [[0, 1], [0, 1], [0, 1]],
  wall: [[9, 10, 13, 14], [0, 1, 2, 3, 9, 10, 13, 14, 16, 17]],
};
export const rowsFor = (layer) => (layer === 'wall' ? [0, 1] : [0, 1, 2]);
export function slotFree(layer, row, start, w, ignore) {
  if (start < 0 || start + w > 20) return false;
  const used = new Set(RESERVED[layer][row] || []);
  for (const p of state.data.furniture.placed) {
    if (p === ignore || FURN[p.id].layer !== layer || (p.row || 0) !== row) continue;
    for (let i = 0; i < FURN[p.id].w; i++) used.add(p.slot + i);
  }
  for (let i = 0; i < w; i++) if (used.has(start + i)) return false;
  return true;
}
// First free spot for an item, trying near `nearSlot` first (back row before front).
export function findSpot(id, nearSlot) {
  const def = FURN[id];
  for (const row of rowsFor(def.layer)) {
    if (nearSlot != null) {
      const s = Math.max(0, Math.min(20 - def.w, nearSlot - Math.floor((def.w - 1) / 2)));
      if (slotFree(def.layer, row, s, def.w)) return { row, slot: s };
    }
  }
  if (nearSlot != null) return null;
  for (const row of rowsFor(def.layer)) for (let s = 0; s <= 20 - def.w; s++) if (slotFree(def.layer, row, s, def.w)) return { row, slot: s };
  return null;
}
export function grantFurniture(id) {
  const f = state.data.furniture;
  if (f.owned.includes(id)) return null;
  f.owned.push(id);
  const spot = findSpot(id);
  if (spot) { f.placed.push({ id, slot: spot.slot, row: spot.row, flip: false }); return 'placed'; }
  f.stored.push(id);
  return 'stored';
}
export function unlockOutfit(kind, id) {
  const u = state.data.unlocked[kind];
  if (u.includes(id)) return false;
  u.push(id);
  return true;
}

// Check golden-seed milestones; returns messages for anything newly unlocked.
export function checkSeedRewards() {
  const d = state.data;
  const seeds = countSeeds(d);
  const msgs = [];
  for (const [n, kind, id] of SEED_REWARDS) {
    const key = `seed${n}`;
    if (seeds >= n && !d.rewards.includes(key)) {
      d.rewards.push(key);
      if (kind === 'furn') { grantFurniture(id); msgs.push(`New furniture: ${FURN[id].name}!`); }
      else if (unlockOutfit('fur', id)) msgs.push(`New fur colour: ${FURS[id].name}!`);
    }
  }
  return msgs;
}
export { SLOT };
