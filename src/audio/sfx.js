// Sound effects, built from the same instruments as the music.
import { audio, inst, drums, mtof } from './audio.js';

function blip(t, f0, f1, dur, type = 'sine', vol = 0.15) {
  const c = audio.ctx;
  const o = c.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.setTargetAtTime(0, t + dur * 0.5, dur * 0.35);
  o.connect(g); g.connect(audio.sfx);
  o.start(t); o.stop(t + dur + 0.3);
}
const arp = (t, notes, gap, fn = 'kalimba', v = 1) => notes.forEach((m, i) => inst[fn](audio.sfx, t + i * gap, m, 0.2, v));

export function sfx(name) {
  if (!audio.ctx) return;
  const t = audio.ctx.currentTime + 0.01;
  const d = audio.sfx;
  switch (name) {
    case 'jump': blip(t, 300, 620, 0.12, 'triangle', 0.1); break;
    case 'walljump': blip(t, 380, 760, 0.1, 'triangle', 0.1); drums.rim(d, t, 0.6); break;
    case 'land': drums.brush(d, t, 0.5); break;
    case 'bop': blip(t, 520, 170, 0.16, 'sine', 0.2); inst.kalimba(d, t + 0.02, 79, 0.1, 0.7); break;
    case 'boing': blip(t, 200, 900, 0.22, 'sine', 0.16); inst.kalimba(d, t, 84, 0.1, 0.5); break;
    case 'kick': drums.kick(d, t, 0.6); blip(t, 300, 120, 0.1, 'square', 0.04); break;
    case 'throw': drums.noiseSweep(d, t, 0.18, 900, 3500, 0.7); break;
    case 'pickup': blip(t, 400, 700, 0.08, 'triangle', 0.08); break;
    case 'acorn': inst.musicbox(d, t, 88, 0.08, 1); inst.musicbox(d, t + 0.06, 95, 0.12, 0.9); break;
    case 'seed': arp(t, [84, 88, 91, 96], 0.07, 'kalimba', 1.1); break;
    case 'oneup': arp(t, [72, 76, 79, 84, 88], 0.08, 'kalimba', 1.1); break;
    case 'hurt': blip(t, 420, 160, 0.3, 'triangle', 0.14); break;
    case 'charm': blip(t, 700, 300, 0.25, 'sine', 0.1); drums.noiseSweep(d, t, 0.3, 4000, 800, 0.6); break;
    case 'lose': arp(t, [79, 76, 72, 67], 0.14, 'musicbox', 1); break;
    case 'checkpoint': inst.musicbox(d, t, 86, 0.3, 1); inst.musicbox(d, t + 0.12, 93, 0.5, 1); break;
    case 'bell':
      [91, 86, 91, 98].forEach((m, i) => inst.musicbox(d, t + i * 0.16, m - 12, 0.6, 1.2));
      arp(t + 0.7, [72, 76, 79, 84], 0.09, 'kalimba', 1);
      break;
    case 'season': drums.noiseSweep(d, t, 0.35, 600, 5000, 0.8); inst.musicbox(d, t + 0.12, 84, 0.3, 0.9); inst.musicbox(d, t + 0.2, 91, 0.3, 0.7); break;
    case 'seasonoff': drums.noiseSweep(d, t, 0.25, 4000, 700, 0.6); break;
    case 'deny': blip(t, 200, 150, 0.12, 'square', 0.05); break;
    case 'sprout': blip(t, 260, 880, 0.25, 'sine', 0.07); break;
    case 'bump': blip(t, 160, 70, 0.1, 'sine', 0.25); drums.rim(d, t, 0.5); break;
    case 'stomp': drums.kick(d, t, 1); drums.noiseSweep(d, t, 0.35, 1200, 200, 0.9); break;
    case 'bosshit': blip(t, 600, 140, 0.35, 'sawtooth', 0.08); drums.snare(d, t, 0.8); break;
    case 'move': blip(t, 880, 900, 0.03, 'sine', 0.06); break;
    case 'select': inst.kalimba(d, t, 79, 0.1, 0.8); inst.kalimba(d, t + 0.06, 84, 0.12, 0.8); break;
    case 'back': inst.kalimba(d, t, 76, 0.1, 0.6); inst.kalimba(d, t + 0.06, 72, 0.12, 0.6); break;
    case 'place': drums.kick(d, t, 0.35); drums.brush(d, t, 0.7); break;
    case 'talk': blip(t, 500 + Math.random() * 300, 520 + Math.random() * 300, 0.04, 'triangle', 0.035); break;
    case 'unlock': arp(t, [79, 83, 86, 91, 95], 0.07, 'musicbox', 1); break;
    case 'buy': inst.musicbox(d, t, 84, 0.1, 1); inst.musicbox(d, t + 0.08, 91, 0.2, 1); drums.shaker(d, t, 1); break;
    case 'clear':
      [[0, 72], [0.15, 76], [0.3, 79], [0.45, 84], [0.75, 83], [0.9, 84]].forEach(([dt, m]) => inst.kalimba(d, t + dt, m, 0.3, 1));
      [60, 64, 67].forEach((m) => inst.ep(d, t + 0.45, m, 1, 0.6));
      break;
    case 'door': blip(t, 140, 90, 0.2, 'triangle', 0.1); break;
    default: break;
  }
}
export { mtof };
