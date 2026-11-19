// Dev-only: bots for the Hollow Oak. O-1 is made of trail set pieces (use trailtest.play('O-1')).
// Usage in the preview console: const ot = await import('/tools/oaktest.js'); await ot.playO2(); await ot.playO3();
import { setup, bot } from './trailtest.js';

function extra(kit, L, b) {
  const p = L.player, K = kit.F.input.keys;
  // Run left until the centre passes tile x.
  b.runL = (x, sprint = false, max = 12) => {
    const t0 = b.t;
    while (b.col() > x && b.t - t0 < max) if (!b.step(() => { K.ArrowLeft = true; if (sprint) K.ShiftLeft = true; })) return false;
    return b.col() <= x;
  };
  b.wait = (sec, fn) => { const t0 = b.t; while (b.t - t0 < sec) if (!b.step(fn)) return false; return true; };
  // Ride a vent up from where we stand, then jump off its top and drift (dir) until landing, gliding if asked.
  b.ride = (dir, glide, minRow) => {
    for (let i = 0; i < 400; i++) { if (p.vy > -60 && b.row() > minRow) break; if (!b.step()) return false; }
    kit.press('Space');
    return b.land(8, () => { K[dir > 0 ? 'ArrowRight' : 'ArrowLeft'] = true; K.ShiftLeft = true; if (glide) K.Space = true; });
  };
  return b;
}

export async function playO2(verbose) {
  const kit = await setup();
  const L = kit.lvl('O-2', 2.5);
  L.godMode = true;
  const b = extra(kit, L, bot(kit, L));
  const p = L.player, K = kit.F.input.keys;
  const log = [];
  const ck = (name, ok) => { log.push(`${name}:${ok ? 'ok' : 'FAIL'} (x=${b.col().toFixed(1)} row=${b.row().toFixed(1)})`); return ok; };
  b.s('spring');
  if (!ck('flower', b.flowerHop(10.5) && b.row() >= 7.9)) return { ok: false, log };
  b.s('winter');
  if (!ck('falls', b.run(15.5, false) && b.wall(19) && b.row() >= 18.9)) return { ok: false, log };
  b.s('summer');
  if (!ck('melt', b.runL(3.6) && Math.abs(b.row() - 19) < 0.2)) return { ok: false, log };
  b.wait(0.4);
  if (!ck('grate', b.ride(1, false, 24) && b.run(7) && b.row() >= 25.9)) return { ok: false, log };
  b.s('autumn');
  if (!ck('gust', b.run(18.5, false) && b.wait(0.2) && b.ride(-1, true, 31) && b.row() >= 30.9)) return { ok: false, log };
  b.s('spring');
  if (b.col() < 4.3) b.run(4.4, false); else b.runL(4.6);
  b.wait(0.8);
  if (!ck('vine-walk', Math.abs(b.col() - 4.5) < 0.5)) return { ok: false, log };
  for (let i = 0; i < 30 && !p.climb; i++) b.step(() => { K.ArrowUp = true; });
  if (!ck('grab', !!p.climb)) return { ok: false, log };
  for (let i = 0; i < 300 && p.bottom > p.climb.topY() + 12; i++) b.step(() => { K.ArrowUp = true; });
  b.step(() => { K.ArrowRight = true; kit.press('Space'); });
  if (!ck('top', b.land(4, () => { K.ArrowRight = true; K.Space = true; }) && b.row() >= 37.9)) return { ok: false, log };
  b.run(19);
  for (let i = 0; i < 60 && L.state !== 'clear'; i++) b.step(() => { K.ArrowRight = true; });
  const seeds = (kit.st.state.data.seeds['O-2'] || []).filter(Boolean).length;
  return { ok: L.state === 'clear', t: +b.t.toFixed(1), seeds, log: verbose ? log : undefined };
}

// O-3: the bot waits for each block to be solid before stepping on, like a player listening to the beat.
export async function playO3(verbose) {
  const kit = await setup();
  const L = kit.lvl('O-3', 2.5);
  L.godMode = true;
  const b = extra(kit, L, bot(kit, L));
  const p = L.player, K = kit.F.input.keys;
  const log = [];
  const ck = (name, ok) => { log.push(`${name}:${ok ? 'ok' : 'FAIL'} (x=${b.col().toFixed(1)} row=${b.row().toFixed(1)} beat=${L.beat.toFixed(2)} gears=${L.gears})`); return ok; };
  const ph = () => L.beatPhase();
  // Wait until the beat phase is in [a, b).
  const until = (a, c) => { for (let i = 0; i < 600; i++) { const x = ph(); if (a < c ? x >= a && x < c : x >= a || x < c) return true; b.step(); } return false; };
  const yr = () => ((L.beat % 16) + 16) % 16;
  const untilYear = (a) => { for (let i = 0; i < 1200; i++) { if (Math.abs(yr() - a) < 0.05) return true; b.step(); } return false; };
  // A running jump to the right, landing anywhere.
  const jumpR = (sprint) => { b.step(() => { K.ArrowRight = true; kit.press('Space'); }); return b.land(4, () => { K.ArrowRight = true; if (sprint) K.ShiftLeft = true; K.Space = true; }); };
  const walkTo = (x) => b.run(x, false);
  // A hop up and to the right that stops steering once over tile x.
  const hopR = (x) => { b.step(() => { K.ArrowRight = true; kit.press('Space'); }); return b.land(4, () => { if (b.col() < x) K.ArrowRight = true; else if (p.vx > 30) K.ArrowLeft = true; K.Space = true; }); };
  b.s(null);
  // Spring: tick, tock, tick over the pit.
  if (!ck('to-edge', walkTo(12.3))) return { ok: false, log };
  if (!ck('tick1', until(0, 0.3) && jumpR() && walkTo(15.8))) return { ok: false, log };
  if (!ck('tock1', until(1.8, 2.2) && jumpR() && walkTo(20.8))) return { ok: false, log };
  if (!ck('tick2', until(3.8, 0.2) && jumpR() && walkTo(25.8))) return { ok: false, log };
  if (!ck('ground', until(1.0, 1.6) && jumpR() && b.row() < 2.2 && b.col() > 28)) return { ok: false, log };
  b.s('spring');
  if (!ck('spring-bridge', b.run(56))) return { ok: false, log };
  if (!ck('gear1', b.flowerHop(57.5) && L.gears === 1)) return { ok: false, log };
  b.s('summer');
  if (!ck('mud', b.run(82.5, false))) return { ok: false, log };
  if (!ck('melt', b.run(84.4, false))) return { ok: false, log };
  // summer stairs (held by Summer), then tock and tick
  if (!ck('stair1', hopR(85.8) && b.row() > 2.9)) return { ok: false, log };
  if (!ck('stair2', hopR(88.8) && b.row() > 4.9)) return { ok: false, log };
  if (!ck('stair3', hopR(91.8) && b.row() > 6.9)) return { ok: false, log };
  if (!ck('tock2', until(1.8, 2.2) && jumpR() && walkTo(95.6))) return { ok: false, log };
  if (!ck('tick3', until(3.8, 0.2) && jumpR() && walkTo(100.4))) return { ok: false, log };
  if (!ck('down', jumpR() && b.row() < 2.2)) return { ok: false, log };
  if (!ck('gear2', b.vent(108.5) && L.gears === 2)) return { ok: false, log };
  b.s('autumn');
  if (!ck('piles', b.run(126))) return { ok: false, log };
  if (!ck('gust', b.run(129.4, false) && b.ride(1, true, 6) && b.row() > 5.5)) return { ok: false, log };
  // Hop from block to block, waiting on each until the next one is solid for a while.
  const blocks = [[135, '7'], [141, '1'], [145, '2'], [149, '1'], [153, '2'], [157, '1'], [162, '#']];
  for (let n = 0; n < 40 && b.col() < 162; n++) {
    const x = b.col();
    let k = blocks.findIndex(([bx]) => bx > x - 0.5);
    if (k < 0) break;
    if (blocks[k][0] <= x) k++;
    const [nx, c] = blocks[k];
    if (c === '1') until(3.8, 0.4); else if (c === '2') until(1.8, 2.4);
    b.step(() => { K.ArrowRight = true; kit.press('Space'); });
    b.land(4, () => { if (b.col() < nx + 0.9) K.ArrowRight = true; else if (p.vx > 30) K.ArrowLeft = true; K.Space = true; });
    if (b.row() < 4 && b.col() < 161) break;
  }
  if (!ck('autumn-blocks', b.col() >= 162 && b.row() < 2.2)) return { ok: false, log };
  if (!ck('gear3', b.run(163.8, false) && hopR(165.3) && L.gears === 3)) return { ok: false, log };
  b.s('winter');
  if (!ck('pond', b.run(186.4, false))) return { ok: false, log };
  if (!ck('falls', b.run(187.4, false) && b.wall(13) && b.leap() && b.row() >= 12.9)) return { ok: false, log };
  if (!ck('winter-bridge', b.run(210) && L.gears === 4)) return { ok: false, log };
  b.s(null);
  if (!ck('steps-down', b.run(219, false) && b.row() < 2.2)) return { ok: false, log };
  // Climb the year: one step per season, each waiting for its bar.
  if (!ck('walk', walkTo(223.3))) return { ok: false, log };
  const steps = [[0, 225.6, 4], [4, 228.6, 6], [8, 231.6, 8], [12, 234.6, 10], [0, 237.6, 12]];
  for (const [bar, x, row] of steps) {
    untilYear(bar + 0.05);
    jumpR();
    walkTo(x);
    if (!ck('step@' + bar, b.row() >= row - 0.1)) return { ok: false, log };
  }
  if (!ck('ledge', jumpR() && b.row() >= 13.9)) return { ok: false, log };
  b.run(250.5, false);
  for (let i = 0; i < 120 && L.state !== 'wound'; i++) b.step(() => { K.ArrowRight = true; });
  const seeds = (kit.st.state.data.seeds['O-3'] || []).filter(Boolean).length;
  return { ok: L.state === 'wound', t: +b.t.toFixed(1), seeds, gears: L.gears, log: verbose ? log : undefined };
}
