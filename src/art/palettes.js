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
