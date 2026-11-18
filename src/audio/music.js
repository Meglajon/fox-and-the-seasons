// The soundtrack: original lo-fi pieces written as note data and played by a look-ahead sequencer.
import { audio, inst, drums } from './audio.js';

export const TRACK_NAMES = {
  title: 'A Year Turns', den: 'The Den', map: 'Foxhollows, Paused', bloom: 'Bloomwood', boss: 'Grumpy Critters',
  pond: 'Millpond Under Glass', orchard: 'Copperleaf Drift',
};

// In each district's track, switching to that district's season fades in its own instruments.
export const SEASON_LAYERS = {
  bloom: { season: 'spring', on: { lead: 0.9, birds: 1, shaker: 0.8, hum: 0.2 }, off: { lead: 0, birds: 0, shaker: 0, hum: 1 } },
  pond: { season: 'winter', on: { lead: 1, chimes: 1, hum: 0.25 }, off: { lead: 0, chimes: 0, hum: 1 } },
  orchard: { season: 'autumn', on: { lead: 1, wind: 1, hum: 0.25 }, off: { lead: 0, wind: 0, hum: 1 } },
};

const EIGHTHS = [0, 2, 4, 6, 8, 10, 12, 14];

export const TRACKS = {
  // 1. Title + credits
  title: {
    bpm: 74, swing: 0.1, bars: 8,
    layers: { keys: { v: 0.9 }, bass: { v: 0.8 }, pad: { v: 0.8 }, lead: { v: 1 }, drums: { v: 0.5, drum: true } },
    chords: [
      { n: [51, 55, 58, 62], b: 39 }, { n: [55, 58, 62, 65], b: 43 }, { n: [56, 60, 63, 67], b: 44 },
      { n: [58, 63, 65, 68], b: 46, n2: [58, 62, 65, 68] }, { n: [60, 63, 67, 70], b: 48 }, { n: [55, 58, 62, 65], b: 43 },
      { n: [53, 56, 60, 63], b: 41 }, { n: [56, 58, 63, 65], b: 46, n2: [56, 58, 62, 65] },
    ],
    arp: { layer: 'keys', inst: 'piano', steps: [0, 3, 6, 8, 11, 14], v: 0.45 },
    bass: { layer: 'bass', hits: [[0, 0, 11, 0.8], [12, 7, 4, 0.5]] },
    pad: { layer: 'pad', oct: 12 },
    drums: { layer: 'drums', kick: [0, 10], brush: [4, 12], hat: EIGHTHS, hv: 0.3 },
    mel: [{
      layer: 'lead', inst: 'musicbox', notes: [
        [0, 0, 79, 6], [0, 6, 77, 2], [0, 8, 75, 8], [1, 0, 74, 4], [1, 4, 70, 4], [1, 8, 74, 4], [1, 12, 77, 4],
        [2, 0, 75, 6], [2, 6, 72, 2], [2, 8, 75, 4], [2, 12, 79, 4], [3, 0, 77, 12],
        [4, 0, 79, 4], [4, 4, 82, 4], [4, 8, 79, 4], [4, 12, 77, 4], [5, 0, 75, 8], [5, 8, 79, 8],
        [6, 0, 80, 6], [6, 6, 79, 2], [6, 8, 77, 4], [6, 12, 75, 4], [7, 0, 77, 8], [7, 8, 74, 8],
      ],
    }],
  },

  // 2. The Den — warm Rhodes, brushes, crackling fire
  den: {
    bpm: 70, swing: 0.16, bars: 8,
    layers: { keys: { v: 1 }, bass: { v: 1 }, drums: { v: 0.9, drum: true }, lead: { v: 0.9 } },
    chords: [
      { n: [54, 57, 61, 64], b: 38 }, { n: [59, 62, 66, 69], b: 35 }, { n: [59, 62, 66, 69], b: 43 },
      { n: [62, 64, 67, 69], b: 45, n2: [61, 64, 67, 71] }, { n: [54, 57, 61, 64], b: 42 }, { n: [55, 59, 62, 66], b: 40 },
      { n: [59, 62, 66, 69], b: 43 }, { n: [55, 59, 61, 66], b: 45 },
    ],
    comp: { layer: 'keys', inst: 'ep', hits: [[0, 9, 0.8], [10, 4, 0.5]] },
    bass: { layer: 'bass', hits: [[0, 0, 7, 0.9], [10, 7, 4, 0.6]] },
    drums: { layer: 'drums', kick: [0, 10], brush: [4, 12], hat: EIGHTHS, hv: 0.32, ghost: true },
    mel: [{
      layer: 'lead', inst: 'piano', period: 2, notes: [
        [0, 0, 78, 4], [0, 4, 76, 2], [0, 6, 74, 6], [1, 4, 71, 4], [1, 8, 74, 4], [1, 12, 76, 4],
        [2, 0, 78, 8], [2, 8, 81, 4], [2, 12, 78, 4], [3, 0, 76, 12],
        [4, 0, 74, 4], [4, 4, 78, 4], [4, 8, 81, 6], [4, 14, 79, 2], [5, 0, 78, 6], [5, 6, 76, 2], [5, 8, 74, 8],
        [6, 0, 71, 4], [6, 4, 74, 4], [6, 8, 76, 4], [6, 12, 74, 4], [7, 0, 76, 12], [7, 12, 69, 4],
      ],
    }],
  },

  // 3. Level map (and Foxhollows Square levels, with drums)
  map: {
    bpm: 72, swing: 0.12, bars: 8,
    layers: { lead: { v: 1 }, pad: { v: 0.9 }, keys: { v: 0.8 }, bass: { v: 0 }, drums: { v: 0, drum: true } },
    chords: [
      { n: [53, 57, 60, 64], b: 41 }, { n: [52, 55, 59, 62], b: 40 }, { n: [50, 53, 57, 60], b: 38 }, { n: [48, 52, 55, 59], b: 36 },
      { n: [53, 57, 60, 64], b: 41 }, { n: [52, 55, 59, 62], b: 40 }, { n: [53, 57, 60, 64], b: 38 },
      { n: [53, 55, 60, 62], b: 43, n2: [53, 55, 59, 62] },
    ],
    comp: { layer: 'keys', inst: 'piano', hits: [[0, 12, 0.45], [12, 4, 0.3]] },
    bass: { layer: 'bass', hits: [[0, 0, 6, 0.9], [6, 0, 2, 0.5], [10, 7, 6, 0.7]] },
    pad: { layer: 'pad' },
    drums: { layer: 'drums', kick: [0, 7, 10], snare: [4, 12], sv: 0.45, hat: EIGHTHS, hv: 0.4 },
    mel: [{
      layer: 'lead', inst: 'musicbox', notes: [
        [0, 0, 76, 4], [0, 4, 79, 4], [0, 8, 81, 8], [1, 0, 79, 4], [1, 4, 76, 4], [1, 8, 74, 8],
        [2, 0, 77, 4], [2, 4, 76, 4], [2, 8, 74, 4], [2, 12, 72, 4], [3, 0, 74, 4], [3, 4, 76, 12],
        [4, 0, 76, 4], [4, 4, 79, 4], [4, 8, 84, 6], [4, 14, 83, 2], [5, 0, 81, 8], [5, 8, 79, 8],
        [6, 0, 77, 4], [6, 4, 81, 4], [6, 8, 79, 4], [6, 12, 77, 4], [7, 0, 74, 8], [7, 8, 67, 8],
      ],
    }],
  },

  // 4. Bloomwood — faded keys; switching to Spring brings in the kalimba, shaker and birdsong
  bloom: {
    bpm: 84, swing: 0.2, bars: 8,
    layers: {
      keys: { v: 0.9 }, bass: { v: 1 }, drums: { v: 0.85, drum: true }, pad: { v: 0.6 }, hum: { v: 1 },
      lead: { v: 0 }, birds: { v: 0 }, shaker: { v: 0, drum: true },
    },
    chords: [
      { n: [53, 57, 60, 64], b: 41 }, { n: [57, 60, 64, 67], b: 45 }, { n: [58, 62, 65, 69], b: 46 },
      { n: [58, 60, 65, 67], b: 48, n2: [58, 62, 64, 67] }, { n: [57, 60, 62, 65], b: 50 }, { n: [57, 60, 64, 67], b: 45 },
      { n: [58, 62, 65, 69], b: 46 }, { n: [58, 62, 64, 67], b: 48 },
    ],
    comp: { layer: 'keys', inst: 'ep', hits: [[0, 6, 0.6], [6, 2, 0.4], [10, 4, 0.5]] },
    bass: { layer: 'bass', hits: [[0, 0, 6, 0.9], [6, 0, 2, 0.5], [10, 7, 4, 0.7], [14, 12, 2, 0.5]] },
    pad: { layer: 'pad' },
    drums: { layer: 'drums', kick: [0, 10], snare: [4, 12], sv: 0.5, hat: EIGHTHS, hv: 0.42, ghost: true },
    mel: [
      { layer: 'lead', inst: 'kalimba', notes: BLOOM_MEL() },
      { layer: 'hum', inst: 'piano', minLen: 4, v: 0.55, notes: BLOOM_MEL() },
    ],
    extra(s, t, L) {
      const bar = s >> 4, st = s & 15;
      if (st % 2 === 0) drums.shaker(L.shaker, t, st % 4 === 2 ? 1 : 0.6);
      if ((bar % 3 === 1 && st === 6) || (bar % 4 === 3 && st === 13)) inst.bird(L.birds, t);
    },
  },

  // 6. Millpond Reach: felt piano and soft brushes; Winter adds glockenspiel and wind chimes.
  pond: {
    bpm: 68, swing: 0.12, bars: 8,
    layers: {
      keys: { v: 0.85 }, bass: { v: 0.9 }, drums: { v: 0.7, drum: true }, pad: { v: 0.8 }, hum: { v: 1 },
      lead: { v: 0 }, chimes: { v: 0 },
    },
    chords: [
      { n: [53, 57, 60, 64], b: 38 }, { n: [57, 62, 65, 69], b: 46 }, { n: [58, 62, 65, 69], b: 43 },
      { n: [55, 57, 62, 64], b: 45, n2: [55, 57, 61, 64] }, { n: [53, 57, 60, 64], b: 38 }, { n: [53, 57, 60, 64], b: 41 },
      { n: [53, 55, 58, 62], b: 43 }, { n: [55, 57, 61, 64], b: 45 },
    ],
    comp: { layer: 'keys', inst: 'piano', hits: [[0, 10, 0.5], [10, 6, 0.35]] },
    bass: { layer: 'bass', hits: [[0, 0, 10, 0.8], [10, 7, 6, 0.55]] },
    pad: { layer: 'pad' },
    drums: { layer: 'drums', kick: [0, 10], brush: [4, 12], hat: EIGHTHS, hv: 0.25 },
    mel: [
      { layer: 'lead', inst: 'musicbox', notes: POND_MEL() },
      { layer: 'hum', inst: 'piano', minLen: 4, v: 0.5, notes: POND_MEL() },
    ],
    extra(s, t, L) {
      const bar = s >> 4, st = s & 15;
      if ((bar % 2 === 1 && st === 9) || (bar % 4 === 2 && st === 3)) {
        [96, 93, 98].forEach((m, i) => inst.musicbox(L.chimes, t + i * 0.09, m - 12, 0.4, 0.6));
      }
    },
  },

  // 7. Copperleaf Orchard: nylon guitar and dusty drums; Autumn adds a warm Rhodes lead and wind.
  orchard: {
    bpm: 78, swing: 0.16, bars: 8,
    layers: {
      keys: { v: 0.9 }, bass: { v: 1 }, drums: { v: 0.85, drum: true }, pad: { v: 0.5 }, hum: { v: 1 },
      lead: { v: 0 }, wind: { v: 0, drum: true },
    },
    chords: [
      { n: [52, 55, 59, 62], b: 48 }, { n: [50, 54, 57, 62], b: 47 }, { n: [55, 59, 62, 66], b: 40 },
      { n: [55, 60, 64, 67], b: 45 }, { n: [55, 60, 64, 67], b: 45 }, { n: [54, 59, 62, 66], b: 43 },
      { n: [52, 55, 59, 64], b: 48 }, { n: [54, 57, 60, 62], b: 50 },
    ],
    comp: { layer: 'keys', inst: 'nylon', hits: [[0, 3, 0.8], [3, 3, 0.5], [6, 2, 0.6], [8, 3, 0.7], [11, 3, 0.5], [14, 2, 0.5]] },
    bass: { layer: 'bass', hits: [[0, 0, 6, 0.9], [6, 7, 2, 0.5], [8, 12, 4, 0.7], [12, 7, 4, 0.6]] },
    pad: { layer: 'pad' },
    drums: { layer: 'drums', kick: [0, 7, 10], snare: [4, 12], sv: 0.45, hat: EIGHTHS, hv: 0.4, ghost: true },
    mel: [
      { layer: 'lead', inst: 'ep', notes: ORCHARD_MEL() },
      { layer: 'hum', inst: 'nylon', minLen: 4, v: 0.55, notes: ORCHARD_MEL() },
    ],
    extra(s, t, L) {
      const bar = s >> 4, st = s & 15;
      if (bar % 2 === 0 && st === 0) drums.noiseSweep(L.wind, t, 1.6, 400, 1400, 0.5);
    },
  },

  // 5. Mini-boss — Grumpy Critters
  boss: {
    bpm: 96, swing: 0.05, bars: 4,
    layers: { keys: { v: 0.9 }, bass: { v: 1 }, drums: { v: 1, drum: true }, lead: { v: 0.9 }, pad: { v: 0.5 } },
    chords: [
      { n: [50, 57, 62, 65], b: 38 }, { n: [53, 58, 62, 65], b: 46 }, { n: [52, 55, 60, 64], b: 48 }, { n: [52, 55, 61, 64], b: 45 },
    ],
    comp: { layer: 'keys', inst: 'pluck', hits: [[0, 2, 0.8], [3, 2, 0.6], [6, 2, 0.7], [10, 2, 0.6], [12, 2, 0.7]] },
    bass: { layer: 'bass', hits: [[0, 0, 2, 1], [2, 0, 2, 0.7], [4, 12, 2, 0.8], [6, 0, 2, 0.7], [8, 7, 2, 0.8], [10, 0, 2, 0.7], [12, 12, 2, 0.8], [14, 7, 2, 0.7]] },
    pad: { layer: 'pad' },
    drums: { layer: 'drums', kick: [0, 6, 8, 11], snare: [4, 12], sv: 0.75, kv: 0.95, hat: EIGHTHS, hv: 0.5, rim: [3, 14] },
    mel: [{
      layer: 'lead', inst: 'kalimba', notes: [
        [0, 0, 74, 2], [0, 3, 77, 2], [0, 6, 81, 2], [0, 8, 79, 2], [0, 10, 77, 2], [0, 12, 76, 4],
        [1, 0, 74, 2], [1, 3, 77, 2], [1, 6, 82, 2], [1, 8, 81, 2], [1, 10, 77, 2], [1, 12, 74, 4],
        [2, 0, 76, 2], [2, 3, 79, 2], [2, 6, 84, 2], [2, 8, 82, 2], [2, 10, 79, 2], [2, 12, 76, 4],
        [3, 0, 73, 4], [3, 4, 76, 4], [3, 8, 81, 8],
      ],
    }],
  },
};

function POND_MEL() {
  return [
    [0, 0, 81, 4], [0, 4, 77, 4], [0, 8, 76, 4], [0, 12, 74, 4], [1, 0, 77, 6], [1, 6, 76, 2], [1, 8, 74, 8],
    [2, 0, 74, 4], [2, 4, 77, 4], [2, 8, 81, 6], [2, 14, 79, 2], [3, 0, 76, 12], [3, 12, 73, 4],
    [4, 0, 81, 4], [4, 4, 84, 4], [4, 8, 81, 4], [4, 12, 79, 4], [5, 0, 77, 8], [5, 8, 81, 8],
    [6, 0, 79, 4], [6, 4, 77, 4], [6, 8, 74, 4], [6, 12, 70, 4], [7, 0, 73, 8], [7, 8, 76, 8],
  ];
}
function ORCHARD_MEL() {
  return [
    [0, 0, 76, 2], [0, 2, 79, 2], [0, 4, 83, 4], [0, 8, 81, 2], [0, 10, 79, 2], [0, 12, 76, 4],
    [1, 0, 74, 4], [1, 4, 78, 4], [1, 8, 81, 8],
    [2, 0, 79, 2], [2, 2, 83, 2], [2, 4, 86, 4], [2, 8, 83, 4], [2, 12, 79, 4],
    [3, 0, 81, 6], [3, 6, 79, 2], [3, 8, 76, 8],
    [4, 0, 72, 4], [4, 4, 76, 4], [4, 8, 79, 4], [4, 12, 83, 4],
    [5, 0, 83, 8], [5, 8, 81, 4], [5, 12, 79, 4],
    [6, 0, 76, 4], [6, 4, 79, 4], [6, 8, 84, 8],
    [7, 0, 81, 4], [7, 4, 78, 4], [7, 8, 74, 8],
  ];
}
function BLOOM_MEL() {
  return [
    [0, 0, 72, 2], [0, 2, 69, 2], [0, 4, 72, 2], [0, 6, 77, 4], [0, 10, 76, 2], [0, 12, 72, 4],
    [1, 0, 76, 2], [1, 2, 72, 2], [1, 4, 69, 4], [1, 8, 67, 2], [1, 10, 69, 2], [1, 12, 72, 4],
    [2, 0, 74, 2], [2, 2, 77, 2], [2, 4, 81, 4], [2, 8, 79, 2], [2, 10, 77, 2], [2, 12, 74, 4],
    [3, 0, 76, 6], [3, 6, 79, 2], [3, 8, 72, 8],
    [4, 0, 77, 2], [4, 2, 81, 2], [4, 4, 77, 2], [4, 6, 74, 4], [4, 10, 72, 2], [4, 12, 69, 4],
    [5, 0, 72, 2], [5, 2, 76, 2], [5, 4, 79, 4], [5, 8, 76, 4], [5, 12, 72, 4],
    [6, 0, 74, 2], [6, 2, 77, 2], [6, 4, 74, 2], [6, 6, 70, 4], [6, 10, 69, 2], [6, 12, 65, 4],
    [7, 0, 67, 4], [7, 4, 69, 4], [7, 8, 72, 4], [7, 12, 76, 4],
  ];
}

function makePlay(sp) {
  const mels = sp.mel.map((m) => {
    const map = new Map();
    for (const [bar, st, mm, len, v] of m.notes) {
      if (m.minLen && len < m.minLen) continue;
      const k = bar * 16 + st;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push([mm, len, v ?? m.v ?? 1]);
    }
    return { ...m, map };
  });
  return (s, t, L, spb, loop) => {
    const bar = s >> 4, st = s & 15;
    const ch = sp.chords[bar % sp.chords.length];
    const notesAt = (x) => (x >= 8 && ch.n2 ? ch.n2 : ch.n);
    if (sp.comp) {
      for (const [cs, len, vel] of sp.comp.hits) {
        if (cs === st) notesAt(cs).forEach((m, i) => inst[sp.comp.inst](L[sp.comp.layer], t + i * 0.011, m, len * spb, vel));
      }
    }
    if (sp.arp) {
      const idx = sp.arp.steps.indexOf(st);
      if (idx >= 0) {
        const ns = notesAt(st);
        inst[sp.arp.inst](L[sp.arp.layer], t, ns[idx % ns.length] + 12 * Math.floor(idx / ns.length), spb * 3, sp.arp.v);
      }
    }
    if (sp.bass) {
      for (const [bs, iv, len, vel] of sp.bass.hits) if (bs === st) inst.bass(L[sp.bass.layer], t, ch.b + iv, len * spb, vel);
    }
    if (sp.pad && st === 0) ch.n.forEach((m) => inst.pad(L[sp.pad.layer], t, m + (sp.pad.oct || 0), 16 * spb, 1));
    const D = sp.drums;
    if (D) {
      const dl = L[D.layer];
      if (D.kick?.includes(st)) drums.kick(dl, t, D.kv || 0.8);
      if (D.ghost && bar % 2 === 1 && st === 7) drums.kick(dl, t, 0.4);
      if (D.snare?.includes(st)) drums.snare(dl, t, D.sv || 0.7);
      if (D.brush?.includes(st)) drums.brush(dl, t, 1);
      if (D.hat?.includes(st)) drums.hat(dl, t, (st % 4 === 0 ? 1 : 0.6) * (D.hv || 0.5));
      if (D.rim?.includes(st)) drums.rim(dl, t, 0.8);
    }
    for (const m of mels) {
      if (m.period && loop % m.period !== 0) continue;
      const ev = m.map.get(bar * 16 + st);
      if (ev) for (const [mm, len, v] of ev) inst[m.inst](L[m.layer], t, mm, len * spb, v);
    }
    sp.extra?.(s, t, L, spb);
  };
}

let cur = null, want = null;
audio.ready.push(() => { if (want) { const w = want; want = null; playMusic(w.id, w.layers); } });

// The trailer locks the music so scene changes can't swap tracks or change tempo mid-shot.
let locked = false;
export function lockMusic(on) { locked = on; }

export function playMusic(id, layers = {}, force) {
  if (locked && !force && (!cur || cur.id !== id)) return;
  if (!audio.ctx) { want = { id, layers }; return; }
  if (cur && cur.id === id) { for (const k in layers) setLayer(k, layers[k]); return; }
  stopMusic(0.6);
  const sp = TRACKS[id];
  if (!sp) return;
  const ctx = audio.ctx, now = ctx.currentTime;
  const outDuck = ctx.createGain(), outDry = ctx.createGain();
  for (const o of [outDuck, outDry]) { o.gain.setValueAtTime(0, now); o.gain.linearRampToValueAtTime(1, now + 0.9); }
  outDuck.connect(audio.duck); outDry.connect(audio.music);
  const L = {};
  for (const [name, def] of Object.entries(sp.layers)) {
    const g = ctx.createGain();
    g.gain.value = layers[name] ?? def.v;
    g.connect(def.drum ? outDry : outDuck);
    L[name] = g;
  }
  sp._play = sp._play || makePlay(sp);
  cur = { id, sp, L, outs: [outDuck, outDry], step: 0, next: now + 0.12, tempo: 1 };
}
export function stopMusic(fade = 0.6, force) {
  if (locked && !force) return;
  if (!cur || !audio.ctx) { cur = null; return; }
  const t = audio.ctx.currentTime;
  for (const o of cur.outs) {
    if (o.gain.cancelAndHoldAtTime) o.gain.cancelAndHoldAtTime(t); else o.gain.cancelScheduledValues(t);
    o.gain.setTargetAtTime(0, t, fade / 3);
    setTimeout(() => o.disconnect(), (fade + 3) * 1000);
  }
  cur = null;
}
export function setLayer(name, v, time = 0.6) {
  if (!cur || !cur.L[name] || !audio.ctx) return;
  cur.L[name].gain.setTargetAtTime(v, audio.ctx.currentTime, time / 3);
}
export function setTempo(m) { if (cur && !locked) cur.tempo = m; }
export const currentTrack = () => (cur ? cur.id : want ? want.id : null);

function tick() {
  if (!audio.ctx || !cur) return;
  const ctx = audio.ctx, sp = cur.sp;
  if (cur.next < ctx.currentTime - 0.25) cur.next = ctx.currentTime + 0.05;
  while (cur && cur.next < ctx.currentTime + 0.16) {
    const spb = 60 / (sp.bpm * cur.tempo) / 4;
    const len = sp.bars * 16;
    const s = cur.step;
    const t = cur.next + (s % 2 === 1 ? spb * (sp.swing || 0) : 0);
    try { sp._play(s % len, t, cur.L, spb, Math.floor(s / len)); } catch (e) { console.error(e); }
    cur.step++;
    cur.next += spb;
  }
}
setInterval(tick, 25);
