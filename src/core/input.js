// Keyboard + gamepad input with remappable bindings and edge detection.
export const DEFAULT_BINDINGS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'KeyZ'],
  sprint: ['ShiftLeft', 'ShiftRight', 'KeyX'],
  next: ['KeyE'],
  prev: ['KeyQ'],
  flip: ['KeyF'],
};
const FIXED = {
  pause: ['Escape', 'KeyP'],
  confirm: ['Enter', 'NumpadEnter'],
  back: ['Escape', 'Backspace'],
};
export const REMAPPABLE = [
  ['left', 'Move left'], ['right', 'Move right'], ['up', 'Up / use'], ['down', 'Down'],
  ['jump', 'Jump'], ['sprint', 'Sprint / carry'], ['next', 'Next season'],
  ['prev', 'Previous season'], ['flip', 'Flip furniture'],
];
const PAD = {
  jump: [0], confirm: [0], back: [1], sprint: [2], up: [12, 3], down: [13], left: [14], right: [15],
  prev: [4], next: [5], pause: [9], flip: [3],
};
const ACTIONS = [...Object.keys(DEFAULT_BINDINGS), ...Object.keys(FIXED)];
const clone = (o) => JSON.parse(JSON.stringify(o));

export const input = {
  bindings: clone(DEFAULT_BINDINGS),
  keys: {}, hits: {}, cur: {}, press: {}, padPrev: {},
  blocked: false, capture: null, text: null, gesture: [], anyHit: false, any: false,
  touch: {}, touchMode: false,
  update() {
    const pad = getPad();
    const ps = {};
    for (const a in this.touch) if (this.touch[a]) ps[a] = true;
    if (pad) {
      for (const a in PAD) ps[a] = ps[a] || PAD[a].some((i) => pad.buttons[i] && pad.buttons[i].pressed);
      const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
      if (ax < -0.45) ps.left = true;
      if (ax > 0.45) ps.right = true;
      if (ay < -0.6) ps.up = true;
      if (ay > 0.6) ps.down = true;
    }
    const b = { ...this.bindings, ...FIXED };
    let anyPad = false;
    for (const a of ACTIONS) {
      const codes = b[a] || [];
      const kb = codes.some((c) => this.keys[c]);
      const hit = codes.some((c) => this.hits[c]);
      const p = !!ps[a];
      this.cur[a] = kb || p;
      this.press[a] = hit || (p && !this.padPrev[a]);
      if (p && !this.padPrev[a]) anyPad = true;
      this.padPrev[a] = p;
    }
    this.cur.confirm = this.cur.confirm || this.cur.jump;
    this.press.confirm = this.press.confirm || this.press.jump;
    this.any = this.anyHit || anyPad;
  },
  endUpdate() { this.hits = {}; this.anyHit = false; },
  down(a) { return !this.blocked && !!this.cur[a]; },
  pressed(a) { return !this.blocked && !!this.press[a]; },
  anyPressed() { return !this.blocked && this.any; },
};

function getPad() {
  const ps = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const p of ps) if (p && p.connected) return p;
  return null;
}

addEventListener('keydown', (e) => {
  input.gesture.forEach((f) => f());
  if (input.capture) {
    e.preventDefault();
    const cb = input.capture; input.capture = null; cb(e.code);
    return;
  }
  if (input.text) { if (input.text(e) !== false) e.preventDefault(); return; }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
  if (!input.keys[e.code]) { input.hits[e.code] = true; input.anyHit = true; }
  input.keys[e.code] = true;
});
addEventListener('keyup', (e) => { input.keys[e.code] = false; });
addEventListener('blur', () => { input.keys = {}; });
addEventListener('pointerdown', () => { input.gesture.forEach((f) => f()); input.anyHit = true; });

export function keyName(c) {
  if (!c) return '—';
  const m = {
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'Space', ShiftLeft: 'Shift',
    ShiftRight: 'R-Shift', Escape: 'Esc', Enter: 'Enter', Backspace: 'Backspace', ControlLeft: 'Ctrl',
    ControlRight: 'R-Ctrl', AltLeft: 'Alt', Tab: 'Tab',
  };
  if (m[c]) return m[c];
  if (c.startsWith('Key')) return c.slice(3);
  if (c.startsWith('Digit')) return c.slice(5);
  return c;
}
const TOUCH_LABEL = { jump: 'A', sprint: 'B', up: '↑', next: '⟳', prev: '⟳', flip: '⟳', pause: 'II' };
export const bindName = (a) =>
  (input.touchMode && TOUCH_LABEL[a]) || (a === 'pause' ? 'Esc' : keyName((input.bindings[a] || [])[0]));
export function setBinding(action, code) {
  for (const a in input.bindings) input.bindings[a] = input.bindings[a].filter((c) => c !== code);
  input.bindings[action] = [code];
}
export function resetBindings() { input.bindings = clone(DEFAULT_BINDINGS); }
