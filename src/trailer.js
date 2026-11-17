// Trailer director: plays a scripted 20-second trailer with the real game (real levels, physics,
// art and music) and can record it to a video file. Every shot is exactly one bar of "Bloomwood"
// (84 BPM), so cuts land on the beat: 7 bars = 20 seconds.
import { initEngine, engine, setScene, pushOverlay, debugStep, resize, W, H } from './core/engine.js';
import { input } from './core/input.js';
import { state, loadSettings, newData } from './core/state.js';
import { clamp } from './core/util.js';
import { text } from './art/ink.js';
import { T } from './art/tiles.js';
import { audio, initAudio, applyVolumes } from './audio/audio.js';
import { playMusic, stopMusic, lockMusic } from './audio/music.js';
import { sfx } from './audio/sfx.js';
import { LevelScene } from './game/level.js';
import { DenScene } from './scenes/den.js';
import { TitleScene } from './scenes/title.js';
import { Wardrobe } from './ui/screens.js';

const BAR = (60 / 84) * 4;
const STEP = 1 / 120;
export const LIVE_URL = 'meglajon.github.io/fox-and-the-seasons';

// ---------- fake save used only for the trailer (never written to storage) ----------
function trailerData() {
  const d = newData('Fennel');
  d.introDone = true;
  d.stones.spring = true;
  d.unlocked.fur = ['red', 'sand', 'arctic', 'silver', 'midnight'];
  d.unlocked.scarf = ['plain', 'stripes', 'dots', 'checks', 'stars', 'leaves'];
  d.unlocked.hat = ['acorn', 'crown', 'bobble', 'straw', 'beret', 'keeper'];
  d.unlocked.extras = ['glasses', 'satchel', 'ribbon', 'cheeks'];
  d.outfit.hat = 'crown';
  d.furniture.placed.push({ id: 'pumpkin_lamp', slot: 7, flip: false }, { id: 'paint_bloom', slot: 5, flip: false });
  return d;
}

// ---------- bot input helpers ----------
const K = () => input.keys;
const hold = (code, on = true) => { if (on && !K()[code]) input.hits[code] = true; K()[code] = on; };
const releaseAll = () => { for (const k in K()) K()[k] = false; };

function level(id, x, opts = {}) {
  const L = new LevelScene(id);
  L.noHUD = true; L.godMode = !!opts.god; L.introDone = true;
  setScene(L);
  const p = L.player;
  p.x = x * T - p.w / 2; p.y = (L.h - (opts.row ?? 2)) * T - p.h; p.vx = 0; p.vy = 0;
  if (!L.data.autoscroll) L.camX = clamp(p.cx - W / 2 + 60, 0, L.w * T - W);
  L.camY = clamp(p.cy - H * 0.55, -2 * T, Math.max(0, L.h * T - H));
  return L;
}

// ---------- the shots ----------
const OUTFITS = [
  { fur: 'red', hat: 'crown', scarf: 'plain' },
  { fur: 'sand', hat: 'straw', scarf: 'stripes', satchel: true },
  { fur: 'arctic', hat: 'bobble', scarf: 'dots', glasses: true },
  { fur: 'midnight', hat: 'keeper', scarf: 'stars' },
  { fur: 'silver', hat: 'beret', scarf: 'leaves', ribbon: true },
  { fur: 'red', hat: 'acorn', scarf: 'checks', cheeks: true },
  { fur: 'red', hat: 'crown', scarf: 'plain', cheeks: true },
];

const SHOTS = [
  { // 1. The paused town
    caption: 'Foxhollows has stopped.',
    setup() { this.L = level('0-1', 2.6); this.L.player.setSeason(null, true); },
    step(t) {
      const p = this.L.player;
      hold('ArrowRight', p.cx < 12.6 * T);
      hold('Space', (t > 0.55 && t < 0.8) || (t > 1.62 && t < 1.95));
    },
  },
  { // 2. Spring wakes up: colour blooms out and the music changes
    caption: 'Wake the seasons.',
    setup() { this.L = level('1-1', 37.4); this.L.player.setSeason(null, true); this.L.player.bubble = 0; this.done = false; this.jt = null; this.bounced = false; },
    step(t) {
      const p = this.L.player;
      if (t > 0.35 && !this.done) { this.done = true; p.setSeason('spring'); }
      hold('ArrowRight', t > 0.6);
      if (this.jt == null && t > 0.6 && p.onGround && p.cx > 39.6 * T) this.jt = 0;
      if (this.jt != null) this.jt += STEP;
      if (p.vy < -900) this.bounced = true;
      // A short hop onto the flower, then hold jump once it launches us for the big bounce.
      hold('Space', this.jt != null && (this.jt < 0.05 || this.bounced));
    },
  },
  { // 3. Bounce chain over the thorns
    setup() { this.L = level('1-2', 88.5, { god: true }); this.jt = null; this.bounced = false; },
    step() {
      const p = this.L.player;
      if (this.jt == null && p.onGround && p.cx > 89.55 * T) this.jt = 0;
      if (this.jt == null) { hold('ArrowRight', true); return; }
      this.jt += STEP;
      if (p.vy < -900) this.bounced = true;
      // Short hop onto the first flower, then hold jump and steer for the centre of each next flower.
      hold('Space', this.jt < 0.05 || this.bounced);
      const target = [91.5, 96.5, 101.5, 106.5].map((v) => v * T).find((v) => v > p.cx + (p.vy < 0 ? -30 : -60));
      hold('ArrowRight', target != null && p.cx < target - 6);
    },
  },
  { // 4. Bramble Rush: the thorn wall chases
    setup() { this.L = level('1-4', 6.5, { god: true }); this.L.camX = 0; this.j = 0; },
    step() {
      const p = this.L.player;
      hold('ArrowRight', true); hold('ShiftLeft', true);
      const marks = [12.4, 18.9, 25.2];
      if (this.j < marks.length && p.onGround && p.cx > marks[this.j] * T) { this.j++; this.jt = 0; }
      if (this.jt != null) this.jt += STEP;
      hold('Space', this.jt != null && this.jt < 0.3);
    },
  },
  { // 5. Bop the Overgrown Pumpkin
    setup() {
      this.L = level('1-B', 4.1, { god: true });
      const L = this.L, B = L.boss, p = L.player;
      B.x = 8.5 * T; B.target = B.x; B.setState('tired');
      // Start mid-air just above a fully grown flower so the bop lands mid-shot.
      const fl = L.ents.find((e) => e.kind === 'f' && e.cx < 8 * T);
      fl.grow = 1; fl.hold = 4;
      p.x = fl.cx - p.w / 2 - 6; p.y = fl.flowerTop() - p.h - 70; p.vy = 150;
      L.camY = clamp(p.cy - H * 0.55, -2 * T, Math.max(0, L.h * T - H));
      this.bounced = false;
    },
    step() {
      const L = this.L, B = L.boss, p = L.player;
      if (B.state === 'tired') B.st = Math.min(B.st, 1);
      const fl = 5.5 * T, side = 1;
      hold('ArrowLeft', false); hold('ArrowRight', false);
      if (p.onGround) {
        this.bounced = false; hold('Space', false);
        const tx = fl - side * 70;
        if (Math.abs(p.cx - tx) > 8) hold(p.cx < tx ? 'ArrowRight' : 'ArrowLeft', true);
        else { hold('ArrowRight', true); hold('Space', true); }
      } else {
        if (p.vy < -900) this.bounced = true;
        if (this.bounced) { hold('Space', true); const dx = B.x - p.cx; if (Math.abs(dx) > 10) hold(dx > 0 ? 'ArrowRight' : 'ArrowLeft', true); }
        else hold('ArrowRight', true);
      }
    },
  },
  { // 6. Dress up in the Den
    caption: 'Make it your own.',
    setup() {
      setScene(new DenScene());
      this.w = pushOverlay(new Wardrobe());
      this.i = 0; this.next = 0.15;
    },
    step(t) {
      if (t >= this.next && this.i < OUTFITS.length) {
        const o = OUTFITS[this.i++];
        Object.assign(state.data.outfit, { fur: 'red', scarf: 'plain', hat: null, glasses: false, satchel: false, ribbon: false, cheeks: false }, o);
        this.w.sel = [0, 2, 1, 2, 0, 2, 2][this.i - 1];
        sfx('move');
        this.next += 0.38;
      }
    },
  },
  { // 7. End card
    end: true,
    // Hold the title tree in full spring blossom for the whole card.
    setup() { const ts = new TitleScene(); ts.noTrailerButton = true; setScene(ts); ts.ready = true; ts.lockSeason = 0; },
    step() {},
  },
];

// ---------- captions + cut crossfades, drawn over the picture ----------
let shotIdx = -1, shotT = 0, snap = null, snapT = 0;
function drawOverlay(ctx) {
  if (snap && snapT > 0) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = Math.min(1, snapT / 0.22);
    ctx.drawImage(snap, 0, 0); ctx.restore();
  }
  const s = SHOTS[shotIdx];
  if (!s) return;
  if (s.caption) {
    const a = clamp(Math.min((shotT - 0.3) / 0.35, (BAR - 0.15 - shotT) / 0.3), 0, 1);
    if (a > 0) text(ctx, s.caption, W / 2, H - 70 - (1 - a) * 10, { size: 48, align: 'center', color: '#3b2a26', outline: '#fffaf0', outlineW: 9, alpha: a });
  }
  if (s.end) {
    const a = clamp((shotT - 0.25) / 0.5, 0, 1);
    text(ctx, 'Free to play in your browser', 260, 330, { size: 34, align: 'center', color: '#3b2a26', outline: '#fffaf0', outlineW: 7, alpha: a });
    text(ctx, LIVE_URL, 260, 372, { size: 26, align: 'center', color: '#b5503a', outline: '#fffaf0', outlineW: 6, alpha: a });
  }
}

function enterShot(i) {
  if (shotIdx >= 0) {
    snap = snap || document.createElement('canvas');
    snap.width = engine.canvas.width; snap.height = engine.canvas.height;
    snap.getContext('2d').drawImage(engine.canvas, 0, 0);
    snapT = 0.22;
  }
  releaseAll();
  shotIdx = i; shotT = 0;
  SHOTS[i].setup();
}

// ---------- playback / recording ----------
function setup() {
  loadSettings();
  state.noSave = true;
  state.settings.crackle = true; state.settings.music = 0.8; state.settings.sfx = 0.55;
  state.data = trailerData();
  engine.fixed = { w: 1280, h: 720 };
  initEngine(document.getElementById('game'));
  engine.drawToasts = drawOverlay;
  resize();
}

let running = false;
export async function play({ record = false, onProgress } = {}) {
  if (running) return null;
  running = true;
  state.data = trailerData();
  initAudio();
  applyVolumes();
  if (audio.ctx.state !== 'running') await audio.ctx.resume();
  lockMusic(false); stopMusic(0.01, true);
  shotIdx = -1; snapT = 0;
  enterShot(0);
  debugStep(STEP, true);

  let rec = null, chunks = [], track = null, mime = '';
  if (record) {
    const vs = engine.canvas.captureStream(0);
    track = vs.getVideoTracks()[0];
    const dest = audio.ctx.createMediaStreamDestination();
    audio.out.connect(dest);
    mime = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
    rec = new MediaRecorder(new MediaStream([track, ...dest.stream.getAudioTracks()]), { mimeType: mime, videoBitsPerSecond: 2_500_000, audioBitsPerSecond: 160_000 });
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.start(250);
    for (let i = 0; i < 9; i++) { track.requestFrame(); await new Promise((r) => setTimeout(r, 33)); }
  }

  playMusic('bloom', { lead: 0, birds: 0, shaker: 0, hum: 1 }, true);
  lockMusic(true);
  const t0 = audio.ctx.currentTime + 0.12;
  const total = SHOTS.length * BAR;
  let sim = 0, faded = false;
  await new Promise((resolve) => {
    const tick = () => {
      const now = audio.ctx.currentTime - t0;
      while (sim + STEP <= Math.min(now, total + 1.2)) {
        const want = Math.min(SHOTS.length - 1, Math.floor(sim / BAR));
        if (want !== shotIdx) enterShot(want);
        shotT = sim - shotIdx * BAR;
        SHOTS[shotIdx].step(shotT);
        debugStep(STEP, false);
        if (snapT > 0) snapT -= STEP;
        sim += STEP;
      }
      debugStep(0, true);
      track?.requestFrame();
      onProgress?.(Math.min(1, now / total));
      if (now >= total - 0.6 && !faded) { faded = true; lockMusic(false); stopMusic(1.6, true); }
      if (now >= total + 1.2) { resolve(); return; }
      setTimeout(tick, 1000 / 60);
    };
    tick();
  });
  releaseAll();
  lockMusic(false);
  let blob = null;
  if (rec) {
    await new Promise((r) => { rec.onstop = r; rec.stop(); });
    blob = new Blob(chunks, { type: mime.split(';')[0] });
  }
  running = false;
  return blob;
}

// Simple page controls.
setup();
const status = document.getElementById('status');
document.getElementById('play').onclick = () => play({ onProgress: (p) => { status.textContent = Math.round(p * 100) + '%'; } });
document.getElementById('rec').onclick = async () => {
  status.textContent = 'Recording…';
  const blob = await play({ record: true, onProgress: (p) => { status.textContent = 'Recording ' + Math.round(p * 100) + '%'; } });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fox-and-the-seasons-trailer.' + (blob.type.includes('mp4') ? 'mp4' : 'webm');
  a.click();
  status.textContent = 'Saved!';
};
// Rehearsal helper for testing shots one at a time without music.
window.__trailer = {
  play, SHOTS, BAR,
  rehearse(i, seconds = BAR) {
    state.data = trailerData();
    shotIdx = -1; enterShot(i);
    const out = [];
    for (let s = 0; s < seconds; s += STEP) { shotT = s; SHOTS[i].step(s); debugStep(STEP, false); }
    debugStep(0, true);
    releaseAll();
    return out;
  },
  scene: () => engine.scene,
};
