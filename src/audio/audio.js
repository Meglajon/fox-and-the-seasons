// Web Audio engine: lo-fi master chain, tape wobble, vinyl crackle, and code-built instruments.
import { state } from '../core/state.js';

export const audio = { ctx: null, ready: [] };
let noiseBuf = null;
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function initAudio() {
  if (audio.ctx) { if (audio.ctx.state === 'suspended') audio.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  audio.ctx = ctx;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.2;
  comp.connect(ctx.destination);
  audio.master = ctx.createGain(); audio.master.gain.value = 0.9; audio.master.connect(comp);

  // Music bus: soft saturation -> low-pass (the "dusty" lo-fi sound)
  audio.music = ctx.createGain();
  const sat = ctx.createWaveShaper(); sat.curve = satCurve(1.5);
  audio.musicLP = ctx.createBiquadFilter(); audio.musicLP.type = 'lowpass'; audio.musicLP.frequency.value = 5000; audio.musicLP.Q.value = 0.4;
  audio.music.connect(sat); sat.connect(audio.musicLP); audio.musicLP.connect(audio.master);
  audio.duck = ctx.createGain(); audio.duck.connect(audio.music);
  audio.verb = ctx.createConvolver(); audio.verb.buffer = impulse(ctx, 2.4, 2.8);
  const wet = ctx.createGain(); wet.gain.value = 0.3; audio.verb.connect(wet); wet.connect(audio.music);

  audio.sfx = ctx.createGain(); audio.sfx.connect(audio.master);
  audio.sfxVerb = ctx.createGain(); audio.sfxVerb.gain.value = 0.18;
  const sv = ctx.createConvolver(); sv.buffer = impulse(ctx, 1.4, 3); audio.sfxVerb.connect(sv); sv.connect(audio.sfx);

  // Tape wobble: two slow LFOs summed, routed into every music oscillator's detune.
  audio.wob = ctx.createGain(); audio.wob.gain.value = 1;
  for (const [f, d] of [[0.55, 6], [0.13, 4]]) {
    const l = ctx.createOscillator(); l.frequency.value = f;
    const g = ctx.createGain(); g.gain.value = d; l.connect(g); g.connect(audio.wob); l.start();
  }
  noiseBuf = makeNoise(ctx);

  audio.crackle = ctx.createGain();
  const cs = ctx.createBufferSource(); cs.buffer = makeCrackle(ctx); cs.loop = true;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 800;
  cs.connect(hp); hp.connect(audio.crackle); audio.crackle.connect(audio.music); cs.start();

  applyVolumes();
  audio.ready.forEach((f) => f());
}

export function applyVolumes() {
  if (!audio.ctx) return;
  const s = state.settings, t = audio.ctx.currentTime;
  audio.music.gain.setTargetAtTime(s.music * 0.85, t, 0.05);
  audio.sfx.gain.setTargetAtTime(s.sfx * 0.75, t, 0.05);
  audio.crackle.gain.setTargetAtTime(s.crackle ? 0.55 : 0, t, 0.05);
}

function satCurve(k) {
  const n = 1024, c = new Float32Array(n), d = Math.tanh(k);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(k * x) / d; }
  return c;
}
function impulse(ctx, dur, decay) {
  const len = Math.floor(ctx.sampleRate * dur);
  const b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return b;
}
function makeNoise(ctx) {
  const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function makeCrackle(ctx) {
  const sr = ctx.sampleRate, b = ctx.createBuffer(1, sr * 3, sr), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.006;
  for (let k = 0; k < 60; k++) {
    const p = Math.floor(Math.random() * (d.length - 60)), a = 0.15 + Math.random() * 0.45;
    for (let j = 0; j < 40; j++) d[p + j] += (Math.random() * 2 - 1) * a * Math.pow(1 - j / 40, 2);
  }
  return b;
}

// ---------- instrument helpers ----------
const C = () => audio.ctx;
function osc(type, f, t) { const o = C().createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); return o; }
function env(t, peak, a, tau, tRel, rel, sus) {
  const g = C().createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.setTargetAtTime(peak * sus, t + a, tau);
  g.gain.setTargetAtTime(0, Math.max(tRel, t + a + 0.01), rel);
  return g;
}
function wob(o, dest) { if (dest !== audio.sfx && dest !== audio.sfxVerb) audio.wob.connect(o.detune); }
function send(g, dest, amt) {
  g.connect(dest);
  if (amt > 0) {
    const s = C().createGain(); s.gain.value = amt; g.connect(s);
    s.connect(dest === audio.sfx ? audio.sfxVerb : audio.verb);
  }
}

export const inst = {
  // Warm electric piano (simple FM).
  ep(dest, t, m, dur, v = 1) {
    const f = mtof(m);
    const c = osc('sine', f, t), md = osc('sine', f, t), mg = C().createGain();
    mg.gain.setValueAtTime(f * 2.2 * v, t); mg.gain.setTargetAtTime(f * 0.35, t, 0.25);
    md.connect(mg); mg.connect(c.frequency);
    wob(c, dest); wob(md, dest);
    const g = env(t, 0.16 * v, 0.006, 0.9, t + dur, 0.25, 0.35);
    c.connect(g); send(g, dest, 0.35);
    const end = t + dur + 1.4; c.start(t); md.start(t); c.stop(end); md.stop(end);
  },
  // Plucky thumb piano.
  kalimba(dest, t, m, dur, v = 1) {
    const f = mtof(m);
    const a = osc('sine', f, t), b = osc('sine', f * 5.95, t);
    wob(a, dest);
    const ga = env(t, 0.2 * v, 0.003, 0.32, t + dur + 0.3, 0.2, 0);
    const gb = env(t, 0.05 * v, 0.002, 0.03, t + 0.1, 0.05, 0);
    a.connect(ga); b.connect(gb); send(ga, dest, 0.4); send(gb, dest, 0.2);
    const end = t + dur + 1.2; a.start(t); b.start(t); a.stop(end); b.stop(end);
  },
  // Soft felt piano.
  piano(dest, t, m, dur, v = 1) {
    const f = mtof(m);
    const a = osc('triangle', f, t), b = osc('sine', f * 2, t);
    const lp = C().createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    const gb = C().createGain(); gb.gain.value = 0.3;
    wob(a, dest); wob(b, dest);
    a.connect(lp); b.connect(gb); gb.connect(lp);
    const g = env(t, 0.15 * v, 0.008, 0.55, t + dur, 0.3, 0.3);
    lp.connect(g); send(g, dest, 0.45);
    const end = t + dur + 1.5; a.start(t); b.start(t); a.stop(end); b.stop(end);
  },
  // Tinkly music box / glockenspiel.
  musicbox(dest, t, m, dur, v = 1) {
    const f = mtof(m) * 2;
    const a = osc('sine', f, t), b = osc('sine', f * 3, t);
    wob(a, dest);
    const ga = env(t, 0.11 * v, 0.002, 0.5, t + dur + 0.6, 0.3, 0);
    const gb = env(t, 0.025 * v, 0.002, 0.08, t + 0.2, 0.05, 0);
    a.connect(ga); b.connect(gb); send(ga, dest, 0.55); send(gb, dest, 0.3);
    const end = t + dur + 1.8; a.start(t); b.start(t); a.stop(end); b.stop(end);
  },
  bass(dest, t, m, dur, v = 1) {
    const f = mtof(m);
    const a = osc('sine', f, t), b = osc('triangle', f, t);
    const lp = C().createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    const gb = C().createGain(); gb.gain.value = 0.45;
    wob(a, dest);
    a.connect(lp); b.connect(gb); gb.connect(lp);
    const g = env(t, 0.32 * v, 0.012, 0.8, t + dur, 0.07, 0.7);
    lp.connect(g); send(g, dest, 0);
    const end = t + dur + 0.5; a.start(t); b.start(t); a.stop(end); b.stop(end);
  },
  pad(dest, t, m, dur, v = 1) {
    const f = mtof(m);
    const a = osc('sawtooth', f, t), b = osc('sawtooth', f, t);
    a.detune.value = -8; b.detune.value = 8;
    wob(a, dest); wob(b, dest);
    const lp = C().createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 850; lp.Q.value = 0.5;
    a.connect(lp); b.connect(lp);
    const g = env(t, 0.035 * v, 0.6, 2, t + dur, 0.9, 0.9);
    lp.connect(g); send(g, dest, 0.5);
    const end = t + dur + 3; a.start(t); b.start(t); a.stop(end); b.stop(end);
  },
  pluck(dest, t, m, dur, v = 1) {
    const f = mtof(m);
    const a = osc('sawtooth', f, t);
    const lp = C().createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(3200, t); lp.frequency.setTargetAtTime(350, t, 0.08);
    wob(a, dest);
    a.connect(lp);
    const g = env(t, 0.09 * v, 0.003, 0.14, t + dur, 0.08, 0);
    lp.connect(g); send(g, dest, 0.3);
    a.start(t); a.stop(t + dur + 0.8);
  },
  bird(dest, t, v = 1) {
    for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
      const s = t + i * 0.09, f0 = 2400 + Math.random() * 700;
      const a = osc('sine', f0, s); a.frequency.exponentialRampToValueAtTime(f0 * 1.45, s + 0.06);
      const g = env(s, 0.035 * v, 0.005, 0.03, s + 0.06, 0.02, 0);
      a.connect(g); send(g, dest, 0.5); a.start(s); a.stop(s + 0.2);
    }
  },
};

function noise(t, dur) {
  const n = C().createBufferSource(); n.buffer = noiseBuf;
  n.start(t, Math.random() * 1.5); n.stop(t + dur);
  return n;
}
function filt(type, f, q = 0.7) { const b = C().createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }

export const drums = {
  kick(dest, t, v = 1) {
    const o = osc('sine', 130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    const g = env(t, 0.85 * v, 0.002, 0.12, t + 0.3, 0.05, 0);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.5);
    if (audio.duck) { audio.duck.gain.setValueAtTime(0.72, t); audio.duck.gain.setTargetAtTime(1, t + 0.03, 0.12); }
  },
  snare(dest, t, v = 1) {
    const n = noise(t, 0.3), b = filt('bandpass', 1900, 0.8);
    const g = env(t, 0.32 * v, 0.002, 0.06, t + 0.12, 0.04, 0);
    n.connect(b); b.connect(g); send(g, dest, 0.25);
    const o = osc('triangle', 190, t), go = env(t, 0.18 * v, 0.002, 0.04, t + 0.08, 0.03, 0);
    o.connect(go); go.connect(dest); o.start(t); o.stop(t + 0.2);
  },
  brush(dest, t, v = 1) {
    const n = noise(t, 0.4), b = filt('bandpass', 2700, 0.5);
    const g = env(t, 0.13 * v, 0.025, 0.09, t + 0.18, 0.06, 0);
    n.connect(b); b.connect(g); send(g, dest, 0.2);
  },
  hat(dest, t, v = 1, open = false) {
    const n = noise(t, 0.3), b = filt('highpass', 7500);
    const g = env(t, 0.08 * v, 0.001, open ? 0.1 : 0.022, t + (open ? 0.2 : 0.05), 0.03, 0);
    n.connect(b); b.connect(g); g.connect(dest);
  },
  shaker(dest, t, v = 1) {
    const n = noise(t, 0.2), b = filt('bandpass', 6200, 1.2);
    const g = env(t, 0.06 * v, 0.012, 0.035, t + 0.06, 0.02, 0);
    n.connect(b); b.connect(g); g.connect(dest);
  },
  rim(dest, t, v = 1) {
    const o = osc('square', 1700, t), b = filt('bandpass', 1700, 4);
    const g = env(t, 0.05 * v, 0.001, 0.012, t + 0.03, 0.01, 0);
    o.connect(b); b.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.1);
  },
  noiseSweep(dest, t, dur, f0, f1, v = 1) {
    const n = noise(t, dur + 0.2), b = filt('bandpass', f0, 1.5);
    b.frequency.setValueAtTime(f0, t); b.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = env(t, 0.12 * v, dur * 0.4, dur * 0.3, t + dur * 0.6, 0.08, 0.6);
    n.connect(b); b.connect(g); g.connect(dest);
  },
};
