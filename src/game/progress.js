// Rewards and unlocks: acorns, lives, golden-seed milestones, furniture and outfits.
import { state, countSeeds } from '../core/state.js';
import { FURN, SLOT } from '../art/furniture.js';
import { FURS } from '../art/fox.js';

export const MAX_LIVES = 9;
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

// Reserved den slots per layer (fixed objects live there).
export const RESERVED = {
  floor: [0, 1, 2, 3, 9, 10, 16, 17, 18, 19],
  wall: [0, 1, 2, 3, 9, 10, 13, 14],
  rug: [0, 1],
};
export function slotFree(layer, start, w, ignore) {
  if (start < 0 || start + w > 20) return false;
  const used = new Set(RESERVED[layer]);
  for (const p of state.data.furniture.placed) {
    if (p === ignore || FURN[p.id].layer !== layer) continue;
    for (let i = 0; i < FURN[p.id].w; i++) used.add(p.slot + i);
  }
  for (let i = 0; i < w; i++) if (used.has(start + i)) return false;
  return true;
}
export function grantFurniture(id) {
  const f = state.data.furniture;
  if (f.owned.includes(id)) return null;
  f.owned.push(id);
  const def = FURN[id];
  for (let s = 0; s <= 20 - def.w; s++) {
    if (slotFree(def.layer, s, def.w)) { f.placed.push({ id, slot: s, flip: false }); return 'placed'; }
  }
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
