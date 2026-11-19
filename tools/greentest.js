// Dev-only: bot playthroughs of the Sunglass Greenhouse levels, its secret room and the Sunlamp Moth.
// Usage in the preview console: const g = await import('/tools/greentest.js'); await g.all();
import { setup, bot } from './trailtest.js';

async function start(id, x = 2.5, god = true) {
  const kit = await setup();
  const L = kit.lvl(id, x);
  L.godMode = god;
  return { kit, L, b: bot(kit, L), K: kit.F.input.keys };
}
function finish(L, b, kit) {
  for (let i = 0; i < 400 && L.state !== 'clear'; i++) b.step(() => { kit.F.input.keys.ArrowRight = true; });
  return L.state === 'clear';
}

export async function g41() {
  const { kit, L, b } = await start('4-1');
  b.s('summer');
  const ok = b.hop(158, 60) && finish(L, b, kit);
  return { id: '4-1', ok, t: +b.t.toFixed(1) };
}
export async function g41seed() {
  // The heat grate lifts you to the first seed's ledge.
  const { L, b } = await start('4-1', 62);
  b.s('summer');
  const ok = b.vent(66.5);
  return { id: '4-1 seed ledge', ok, row: +b.row().toFixed(1) };
}
export async function g42() {
  const { kit, L, b } = await start('4-2');
  b.s('summer');
  const ok = b.hop(166, 60) && finish(L, b, kit);
  return { id: '4-2', ok, t: +b.t.toFixed(1) };
}
export async function g43() {
  const { kit, L, b } = await start('4-3');
  const steps = [
    () => (b.s('spring'), b.flowerHop(10.5)),
    () => (b.s('winter'), b.run(34)),
    () => b.run(45.4, false),
    () => b.wall(13),
    () => b.leap(),
    () => (b.s('summer'), b.run(62.3, false)),
    () => (b.s('autumn'), b.glideOff(80)),
    () => (b.s('spring'), b.flowerHop(97.5)),
    () => (b.s('summer'), b.run(110.6, false)),
    () => (b.s('autumn'), b.run(140)),
    () => (b.s('summer'), b.run(176)),
    () => finish(L, b, kit),
  ];
  for (let i = 0; i < steps.length; i++) if (!steps[i]()) return { id: '4-3', ok: false, step: i, x: +b.col().toFixed(1), row: +b.row().toFixed(1), dead: L.player.dead };
  return { id: '4-3', ok: true, t: +b.t.toFixed(1) };
}
// The Heatwave, played for real (no god mode): wait in the shade whenever a sunbeam is coming.
export async function g44() {
  const { kit, L, b, K } = await start('4-4', 2.5, false);
  kit.st.state.settings.infiniteLives = true;
  const p = L.player, hw = L.data.heatwave;
  let hits = 0, lastInv = 0, t = 0;
  while (L.state !== 'clear' && t < 120 && !p.dead) {
    const shade = L.shaded(Math.floor(p.cx / 48), Math.floor((p.y + 4) / 48));
    const danger = L.beamCenters(p.cx - 600, p.cx + 600).some((c) => c - hw.width / 2 < p.cx + 260 && c + hw.width / 2 > p.cx - 40);
    const wait = shade && danger;
    const ahead = Math.floor((p.cx + 34) / 48), below = Math.floor((p.bottom + 4) / 48);
    const gap = p.onGround && (!L.solid(ahead, below) || L.solid(ahead, below - 1));
    b.step(() => { if (!wait) { K.ArrowRight = true; K.ShiftLeft = true; } if (gap && !wait) kit.press('Space'); if (!p.onGround && p.vy < 0) K.Space = true; });
    if (p.inv > lastInv + 0.5) hits++;
    lastInv = p.inv; t += 1 / 60;
  }
  kit.st.state.settings.infiniteLives = false;
  return { id: '4-4', ok: L.state === 'clear', hits, t: +t.toFixed(1), x: +b.col().toFixed(1) };
}
export async function s4() {
  const { L, b } = await start('S4', 4);
  b.s('summer');
  const ok = b.vent(16.5);
  for (let i = 0; i < 60; i++) b.step();
  return { id: 'S4', ok: ok && L.leaveT !== undefined, row: +b.row().toFixed(1) };
}
// The Sunlamp Moth, for real: keep Summer on, dodge dives, and bop it while it's dazed.
export async function boss() {
  const { kit, L, b, K } = await start('4-B', 3, false);
  kit.st.state.settings.infiniteLives = true;
  kit.eng.engine.overlays.length = 0;
  const p = L.player, m = L.boss;
  m.start(L);
  let hurts = 0, lastInv = 0, t = 0;
  while (m.state !== 'defeated' && t < 120) {
    if (p.season !== 'summer' && p.charm <= 0) b.s('summer');
    const dx = m.x - p.cx;
    b.step(() => {
      if (m.state === 'dazed') {
        if (Math.abs(dx) > 14) K[dx > 0 ? 'ArrowRight' : 'ArrowLeft'] = true;
        if (Math.abs(dx) < 40 && p.onGround) kit.press('Space');
        if (!p.onGround && p.vy < 0) K.Space = true;
      } else if (m.state === 'windup' || m.state === 'dive') {
        K[dx > 0 ? 'ArrowLeft' : 'ArrowRight'] = true; K.ShiftLeft = true;
        if (p.onGround && Math.abs(dx) < 200) kit.press('Space');
      } else if (m.state === 'flutter') {
        if (Math.abs(dx) < 110) K[dx > 0 ? 'ArrowLeft' : 'ArrowRight'] = true;
        else if (Math.abs(dx) > 170) K[dx > 0 ? 'ArrowRight' : 'ArrowLeft'] = true;
      }
    });
    if (p.inv > lastInv + 0.5) hurts++;
    lastInv = p.inv; t += 1 / 60;
    if (p.dead) { kit.eng.engine.overlays.length = 0; break; }
  }
  kit.st.state.settings.infiniteLives = false;
  return { id: '4-B', ok: m.state === 'defeated', hurts, t: +t.toFixed(1), hp: m.hp };
}
export async function all() {
  const out = [];
  for (const f of [g41, g41seed, g42, g43, g44, s4, boss]) out.push(await f());
  return out;
}
