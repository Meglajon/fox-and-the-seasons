// On-screen controls for phones and tablets.
// Portrait: the game sits at the top and the controls get their own panel below it.
// Landscape: the game sits in the middle with a control column on each side.
import { input } from './input.js';
import { engine, resize } from './engine.js';
import { state } from './state.js';

// "Coarse" primary pointer = the main input is a finger (phones, tablets), not a mouse.
// Touchscreen laptops report a fine pointer, so they keep the keyboard-only layout.
export const isTouchDevice = () => !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);

export function touchOn() {
  const s = state.settings.touch || 'auto';
  return s === 'on' || (s === 'auto' && isTouchDevice());
}
export const isPortrait = () => innerHeight > innerWidth;
// Portrait: the game sits near the top (below any notch); everything under it is the control panel.
function portraitGame() {
  const h = Math.min((innerWidth * 9) / 16, innerHeight * 0.5);
  const y = Math.max(16, innerHeight * 0.07);
  return { x: 0, y, w: innerWidth, h, bottom: y + h + 14 };
}
const sideWidth = () => Math.round(Math.max((innerWidth - (innerHeight * 16) / 9) / 2, innerHeight * 0.34, 110));

const BUTTONS = [
  { id: 'btnA', label: 'A', sub: 'jump', acts: ['jump'] },
  { id: 'btnB', label: 'B', sub: 'run', acts: ['sprint'] },
  { id: 'btnUse', label: '↑', sub: 'use', acts: ['up'] },
  { id: 'btnSeason', label: '⟳', sub: 'season', acts: ['next', 'flip'] },
  { id: 'btnPause', label: 'II', sub: '', acts: ['pause', 'back'] },
];

let root = null;
const held = {}; // control id -> actions it is holding down

function recompute() {
  const t = {};
  for (const acts of Object.values(held)) for (const a of acts) t[a] = true;
  input.touch = t;
}

// Keep receiving a finger's events even if it slides off the button (ignored if the browser refuses).
function capture(el, id) { try { el.setPointerCapture(id); } catch { /* not supported */ } }

function makeButton(b) {
  const el = document.createElement('div');
  el.className = 'tc btn';
  el.id = b.id;
  el.innerHTML = `<span class="lbl">${b.label}</span>${b.sub ? `<span class="sub">${b.sub}</span>` : ''}`;
  const down = (e) => { e.preventDefault(); capture(el, e.pointerId); held[b.id] = b.acts; el.classList.add('on'); recompute(); };
  const up = (e) => { e.preventDefault(); delete held[b.id]; el.classList.remove('on'); recompute(); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('lostpointercapture', up);
  return el;
}

function makePad() {
  const pad = document.createElement('div');
  pad.className = 'tc';
  pad.id = 'dpad';
  pad.innerHTML = '<span class="arr u">▲</span><span class="arr d">▼</span><span class="arr l">◀</span><span class="arr r">▶</span><div id="knob"></div>';
  const knob = pad.querySelector('#knob');
  let pid = null;
  const move = (e) => {
    const r = pad.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const R = r.width / 2, len = Math.hypot(dx, dy);
    if (len > R * 0.7) { dx *= (R * 0.7) / len; dy *= (R * 0.7) / len; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const dead = R * 0.18, acts = [];
    if (dx < -dead) acts.push('left');
    if (dx > dead) acts.push('right');
    // Up/down need a deliberate push so running never triggers them by accident.
    if (dy < -R * 0.38 && Math.abs(dy) > Math.abs(dx) * 0.6) acts.push('up');
    if (dy > R * 0.38 && Math.abs(dy) > Math.abs(dx) * 0.6) acts.push('down');
    held.dpad = acts;
    pad.querySelectorAll('.arr').forEach((a) => a.classList.remove('on'));
    for (const a of acts) pad.querySelector('.' + a[0])?.classList.add('on');
    recompute();
  };
  const end = (e) => {
    if (e.pointerId !== pid) return;
    pid = null; delete held.dpad;
    knob.style.transform = 'translate(-50%, -50%)';
    pad.querySelectorAll('.arr').forEach((a) => a.classList.remove('on'));
    recompute();
  };
  pad.addEventListener('pointerdown', (e) => { e.preventDefault(); pid = e.pointerId; capture(pad, pid); move(e); });
  pad.addEventListener('pointermove', (e) => { if (e.pointerId === pid) { e.preventDefault(); move(e); } });
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);
  pad.addEventListener('lostpointercapture', end);
  return pad;
}

function place(id, cx, cy, size) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.left = Math.round(cx - size / 2) + 'px';
  el.style.top = Math.round(cy - size / 2) + 'px';
  el.style.width = el.style.height = Math.round(size) + 'px';
  el.style.fontSize = Math.round(size * 0.36) + 'px';
}

// Position every control inside the free space around the game.
function layout() {
  if (!input.touchMode) return;
  const Wd = innerWidth, Hd = innerHeight;
  let Lz, Rz;
  if (isPortrait()) {
    const top = portraitGame().bottom;
    root.style.setProperty('--ctrl-top', top + 'px');
    Lz = { x: 0, y: top, w: Wd / 2, h: Hd - top };
    Rz = { x: Wd / 2, y: top, w: Wd / 2, h: Hd - top };
  } else {
    const side = sideWidth();
    Lz = { x: 0, y: 0, w: side, h: Hd };
    Rz = { x: Wd - side, y: 0, w: side, h: Hd };
  }
  const pad = Math.min(Lz.w * 0.9, Lz.h * 0.72, 210);
  place('dpad', Lz.x + Lz.w / 2, Lz.y + Lz.h * (isPortrait() ? 0.55 : 0.62), pad);
  const P = isPortrait();
  const a = Math.min(Rz.w * (P ? 0.44 : 0.5), Rz.h * 0.3, 100);
  const small = Math.max(44, a * 0.68);
  const cx = Rz.x + Rz.w / 2;
  place('btnA', cx + Rz.w * 0.2, Rz.y + Rz.h * (P ? 0.48 : 0.62), a);
  place('btnB', cx - Rz.w * 0.22, Rz.y + Rz.h * (P ? 0.68 : 0.83), a * 0.84);
  place('btnUse', cx - Rz.w * 0.22, Rz.y + Rz.h * (P ? 0.3 : 0.44), small);
  place('btnSeason', cx + Rz.w * 0.2, Rz.y + Rz.h * (P ? 0.16 : 0.3), small);
  if (P) place('btnPause', Wd / 2, Hd - Math.min(44, Lz.h * 0.12), 46);
  else place('btnPause', Lz.x + Lz.w / 2, Lz.y + Math.max(34, Lz.h * 0.12), 44);
}

export function initTouch() {
  root = document.createElement('div');
  root.id = 'touch';
  root.appendChild(makePad());
  for (const b of BUTTONS) root.appendChild(makeButton(b));
  document.body.appendChild(root);
  // Stop the page from scrolling, zooming or showing the long-press menu while playing.
  document.addEventListener('touchmove', (e) => { if (input.touchMode) e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', (e) => { if (input.touchMode) e.preventDefault(); });
  engine.viewport = () => {
    if (!input.touchMode) return null;
    if (isPortrait()) return portraitGame();
    const side = sideWidth();
    return { x: side, y: 0, w: Math.max(200, innerWidth - side * 2), h: innerHeight };
  };
  addEventListener('resize', applyTouch);
  addEventListener('orientationchange', () => setTimeout(applyTouch, 250));
  applyTouch();
}

export function applyTouch() {
  const on = touchOn();
  input.touchMode = on;
  document.body.classList.toggle('touch', on);
  document.body.classList.toggle('portrait', on && isPortrait());
  if (!on) { for (const k in held) delete held[k]; recompute(); }
  layout();
  resize();
}
