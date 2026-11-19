// Colour palettes per district, plus the faded "paused" versions.
import { fade } from '../core/util.js';

export const SEASON_COLOR = { none: '#efe2c8', spring: '#f08fae', summer: '#f2b33d', autumn: '#d9662b', winter: '#7fb6e0' };
export const SEASON_NAME = { none: 'No season', spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' };
export const SEASON_ORDER = ['spring', 'winter', 'autumn', 'summer'];

const BASE = {
  square: {
    sky1: '#f3c99a', sky2: '#fdf0d8', far: '#d9c19b', near: '#c2a57c', grass: '#94b45f', grassDark: '#6f8f43',
    dirt: '#b9875a', dirtDark: '#8b5f3e', stone: '#cdbfa8', stoneDark: '#9b8b76', wood: '#c9975c', woodDark: '#8e6438',
    bramble: '#7d5a6e', flower1: '#f3a6bd', flower2: '#f6d873', house: '#ecd6b0', house2: '#ddb98f', roof: '#b9654a',
    leaf: '#7fae58', trunk: '#8a6040', sun: '#fff1c9', cloud: '#fff8ea',
  },
  bloom: {
    sky1: '#a9dcec', sky2: '#fdf4e2', far: '#b6d9a2', near: '#8fc47a', grass: '#86c463', grassDark: '#5c9a45',
    dirt: '#a87650', dirtDark: '#7d5236', stone: '#cbc7b5', stoneDark: '#938f7c', wood: '#c99a63', woodDark: '#8b6239',
    bramble: '#7b4f73', flower1: '#f4a3bf', flower2: '#f8d96b', house: '#f3dcc0', house2: '#e2c09b', roof: '#c96d59',
    leaf: '#6fb257', trunk: '#86603f', sun: '#fffbe0', cloud: '#ffffff', blossom: '#f7c2d2',
  },
};
BASE.boss = { ...BASE.bloom, sky1: '#f6c58f', sky2: '#fde9cf', far: '#c9cf8a' };
// Millpond Reach: icy blues and lavender greys, snow-capped ground.
BASE.pond = {
  sky1: '#bccfe2', sky2: '#f2f5fa', far: '#b6c4d6', near: '#9fb3c8', grass: '#eef3f9', grassDark: '#b4c3d6',
  dirt: '#8f8a9c', dirtDark: '#6c6779', stone: '#c5cad4', stoneDark: '#8d94a3', wood: '#a88b6c', woodDark: '#6f5a45',
  bramble: '#6d5a7a', flower1: '#cfe3f5', flower2: '#f3eedb', house: '#e8e4de', house2: '#cfc9c0', roof: '#7b8db0',
  leaf: '#7d9a8c', trunk: '#6e5a4a', sun: '#f6f8ff', cloud: '#ffffff', blossom: '#e8f1fb',
};
BASE.pondboss = { ...BASE.pond, sky1: '#9fb7d3', sky2: '#e6edf6' };
// Copperleaf Orchard: rust, mustard and plum, dry golden grass.
BASE.orchard = {
  sky1: '#f2c08a', sky2: '#fdeed6', far: '#d8a66a', near: '#c2894e', grass: '#c9a24e', grassDark: '#9a7733',
  dirt: '#a26a44', dirtDark: '#76492c', stone: '#cdbda4', stoneDark: '#97866c', wood: '#b07a48', woodDark: '#7a5230',
  bramble: '#7a4a3c', flower1: '#e0783a', flower2: '#f2c14e', house: '#f0d8b0', house2: '#e0b884', roof: '#a8452f',
  leaf: '#d9662b', trunk: '#6e4a30', sun: '#fff0c8', cloud: '#fff6e6', blossom: '#e88a3a',
};
BASE.orchardboss = { ...BASE.orchard, sky1: '#e9a46b', sky2: '#fbe3c4', far: '#c98c56' };
// Sunglass Greenhouse: noon gold, glasshouse greens, terracotta pots.
BASE.green = {
  sky1: '#f4d27e', sky2: '#fff5d8', far: '#a9cf9c', near: '#7fb57f', grass: '#7cc06a', grassDark: '#4f9147',
  dirt: '#c27b52', dirtDark: '#8e5236', stone: '#d9cfba', stoneDark: '#a1937b', wood: '#c48f5a', woodDark: '#865b33',
  bramble: '#6a7a3a', flower1: '#f28a5a', flower2: '#f6d040', house: '#e6f3e2', house2: '#c7e2c6', roof: '#8fc5b4',
  leaf: '#5aa86a', trunk: '#7a5a3a', sun: '#fff6c0', cloud: '#fffaf0', blossom: '#f6c45a',
  extra: { mud: '#7d5a3e', mudDark: '#573d29', glass: '#cfeee4' },
};
BASE.greenboss = { ...BASE.green, sky1: '#e8b56a', sky2: '#fbe6c0', far: '#8fb98a' };
// The Almanac Trail: every season at once, a soft dawn sky.
BASE.almanac = {
  sky1: '#c9c3ea', sky2: '#fdeee2', far: '#b9c9a8', near: '#93b48a', grass: '#8cc06c', grassDark: '#5d9447',
  dirt: '#a97852', dirtDark: '#7a5137', stone: '#d2cbbd', stoneDark: '#9a9180', wood: '#c09060', woodDark: '#805a36',
  bramble: '#74507a', flower1: '#f4a3bf', flower2: '#f6d36b', house: '#efe0c8', house2: '#d9c3a3', roof: '#a8604d',
  leaf: '#7cb05a', trunk: '#7d5a3e', sun: '#fff4d8', cloud: '#ffffff', blossom: '#f7c2d2',
};
// The Hollow Oak: dusky roots outside, warm heartwood inside, and the brass clock chamber at the top.
BASE.oakroots = {
  sky1: '#e3a08e', sky2: '#fbe4c9', far: '#a99ab8', near: '#7f9466', grass: '#8cb064', grassDark: '#5f8443',
  dirt: '#9a6a48', dirtDark: '#6c4630', stone: '#cfc3b0', stoneDark: '#968a76', wood: '#c09060', woodDark: '#805a36',
  bramble: '#6f4a6e', flower1: '#f4a3bf', flower2: '#f6d36b', house: '#efe0c8', house2: '#d9c3a3', roof: '#a8604d',
  leaf: '#6f9a52', trunk: '#6b4a32', sun: '#fff0d0', cloud: '#fff4ea', blossom: '#f7c2d2',
};
BASE.oak = {
  sky1: '#7a5038', sky2: '#c08a5c', far: '#a87650', near: '#74492f', grass: '#86b45c', grassDark: '#5a8a3e',
  dirt: '#9c6a44', dirtDark: '#6a4329', stone: '#d2c2a4', stoneDark: '#97856a', wood: '#d0a066', woodDark: '#8e6438',
  bramble: '#6d4a5a', flower1: '#f4a3bf', flower2: '#f6d36b', house: '#efe0c8', house2: '#d9c3a3', roof: '#a8604d',
  leaf: '#7cb05a', trunk: '#5e3e28', sun: '#ffe9b0', cloud: '#fff4dc', blossom: '#f7c2d2',
};
BASE.clockwork = {
  ...BASE.oak, sky1: '#3f4a78', sky2: '#c9a06a', far: '#6f6a98', near: '#d9a75a', stone: '#d8cdb8', stoneDark: '#9b8f78',
};
// Water, ice and leaf colours shared by every district.
for (const k in BASE) {
  Object.assign(BASE[k], {
    water: BASE[k].water || '#7fb6cf', waterDark: '#4f86a6', ice: '#dcf0fb', iceDark: '#8fc0e0',
    pile: '#d9662b', pile2: '#f2a541', mud: '#7d5a3e', mudDark: '#573d29', glass: '#cfeee4', ...(BASE[k].extra || {}),
  });
  delete BASE[k].extra;
}

const cache = {};
export function makePal(theme, fadeAmt = 0) {
  const key = theme + ':' + fadeAmt.toFixed(2);
  if (cache[key]) return cache[key];
  const b = BASE[theme];
  const p = {};
  for (const k in b) p[k] = fadeAmt ? fade(b[k], fadeAmt) : b[k];
  p.key = key;
  p.theme = theme;
  p.vivid = fadeAmt < 0.25;
  cache[key] = p;
  return p;
}
