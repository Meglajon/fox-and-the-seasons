// Dev-only: a bot that plays the Almanac Trail (and other set-piece levels) start to finish.
// Usage in the preview console: const tt = await import('/tools/trailtest.js'); await tt.playAll();
// It runs in god mode (critters and heat can't hurt), so it checks that every jump, climb and
// season combination is physically possible; falling into water, mud or pits still fails.
const DT = 1 / 60;

export async function setup() {
  const kit = window.kit || await (await import('/tools/testkit.js')).setup();
  Object.assign(kit.st.state.data.stones, { spring: true, winter: true, autumn: true, summer: true });
  return kit;
}

export function bot(kit, L) {
  const F = kit.F, p = L.player, K = F.input.keys;
  const b = {
    t: 0, fail: null,
    step(fn) { kit.eng.engine.overlays.length = 0; p.frozen = false; kit.rel(); fn?.(); F.step(DT, false); b.t += DT; return !p.dead && L.state !== 'clear'; },
    col: () => p.cx / 48,
    row: () => L.h - p.bottom / 48,
    s(season) { p.season = season; p.lastSeason = season; p.charm = 0; p.bubble = 170; F.step(DT, false); },
    // Run right until the centre passes tile x.
    run(x, sprint = true, max = 12) {
      const t0 = b.t;
      while (b.col() < x && b.t - t0 < max) if (!b.step(() => { K.ArrowRight = true; if (sprint) K.ShiftLeft = true; })) return false;
      return b.col() >= x || L.state === 'clear';
    },
    land(max = 6, hold) {
      const t0 = b.t;
      while (!p.onGround && b.t - t0 < max) if (!b.step(hold)) return false;
      return p.onGround;
    },
    // Hop onto a bounce-flower at tile fx, then ride the bounce up and to the right.
    flowerHop(fx, sprint = false) {
      const t0 = b.t;
      // Come to a stop a little before the flower, then walk up and hop onto it.
      while (b.col() < fx - 4.6 && b.t - t0 < 8) if (!b.step(() => { K.ArrowRight = p.vx < 230; })) return false;
      while (Math.abs(p.vx) > 5 && b.t - t0 < 8) if (!b.step()) return false;
      if (b.col() > fx - 4) while (b.col() > fx - 4.3 && b.t - t0 < 8) if (!b.step(() => { K.ArrowLeft = true; })) return false;
      while (Math.abs(p.vx) > 5 && b.t - t0 < 8) if (!b.step()) return false;
      while (b.col() < fx - 3.5 && b.t - t0 < 8) if (!b.step(() => { K.ArrowRight = true; })) return false;
      b.step(() => { K.ArrowRight = true; kit.press('Space'); });
      let bounced = false;
      for (let i = 0; i < 400; i++) {
        if (p.bounceHold > 0) bounced = true;
        if (!b.step(() => { K.ArrowRight = true; if (bounced && sprint) K.ShiftLeft = true; K.Space = true; })) return false;
        if (bounced && p.onGround) return true;
        if (!bounced && p.onGround && i > 10) return false;
      }
      return false;
    },
    // Climb a vine at tile vx to the top, then jump off to the right.
    climb(vx) {
      if (!b.run(vx - 0.05, false)) return false;
      for (let i = 0; i < 20 && !p.climb; i++) b.step(() => { K.ArrowUp = true; });
      if (!p.climb) return false;
      for (let i = 0; i < 300; i++) {
        const top = p.climb.topY();
        if (p.bottom <= top + 12) break;
        b.step(() => { K.ArrowUp = true; });
      }
      b.step(() => { K.ArrowRight = true; kit.press('Space'); });
      return b.land(4, () => { K.ArrowRight = true; K.Space = true; });
    },
    wall(goal) { for (let i = 0; i < 30; i++) b.step(); const r = kit.wallClimb(L, goal, 12); return r.row >= goal - 0.2; },
    // Stand in a vent until near the top, then drift right (gliding if asked).
    vent(vx, glide) {
      if (!b.run(vx - 0.1, false)) return false;
      for (let i = 0; i < 12; i++) b.step();
      for (let i = 0; i < 300; i++) {
        if (p.vy > -60 && b.row() > 4) break;
        b.step();
      }
      kit.press('Space');
      return b.land(8, () => { K.ArrowRight = true; if (glide) K.Space = true; });
    },
    // Walk off a ledge and glide; let go of the glide once past tile until.
    glideOff(until) {
      for (let i = 0; i < 400; i++) {
        const air = !p.onGround;
        if (!b.step(() => { K.ArrowRight = true; if (air && b.col() < until) K.Space = true; })) return false;
        if (air && i > 20 && p.onGround) return true;
      }
      return false;
    },
    // A big running leap to the right from a standstill.
    leap() {
      b.step(() => { K.ArrowRight = true; kit.press('Space'); });
      return b.land(4, () => { K.ArrowRight = true; K.ShiftLeft = true; K.Space = true; });
    },
    // Sprint right, jumping at every gap in the floor.
    hop(x, max = 12) {
      const t0 = b.t;
      while (b.col() < x && b.t - t0 < max) {
        const ahead = Math.floor((p.cx + 34) / 48), below = Math.floor((p.bottom + 4) / 48);
        const gap = p.onGround && ((!L.solid(ahead, below) && !L.oneway(ahead, below)) || L.solid(ahead, below - 1));
        if (!b.step(() => { K.ArrowRight = true; K.ShiftLeft = true; if (gap) kit.press('Space'); if (!p.onGround && p.vy < 0) K.Space = true; })) return false;
      }
      return b.col() >= x;
    },
  };
  return b;
}

// How to get through each set piece. x = the piece's first tile.
const SOLVE = {
  pond: (b, x, o) => (b.s('winter'), b.run(x + (o.n || 8) + 1)),
  mud: (b, x, o) => (b.s('summer'), b.run(x + (o.n || 8) + 1)),
  piles: (b, x, o) => (b.s('autumn'), b.run(x + (o.n || 8) + 1)),
  icewall: (b, x) => (b.s('summer'), b.run(x + 4)),
  flowerwall: (b, x) => (b.s('spring'), b.flowerHop(x + 1.5) && b.run(x + 10)),
  vine: (b, x) => (b.s('spring'), b.climb(x + 2.5) && b.run(x + 9)),
  thornflower: (b, x) => (b.s('spring'), b.flowerHop(x + 1.5, true) && b.run(x + 13)),
  falls: (b, x) => (b.s('winter'), b.run(x + 2.4, false) && b.wall(13) && b.leap() && b.run(x + 18)),
  ventglide: (b, x, o) => (b.s('autumn'), b.vent(x + 2.5, true) && b.run(x + 5 + (o.n || 12))),
  heatwall: (b, x) => (b.s('summer'), b.vent(x + 3.5) && b.run(x + 10)),
  cactustunnel: (b, x) => (b.s('winter'), b.run(x + 14)),
  floes: (b, x, o) => (b.s('winter'), b.hop(x + (o.n || 12) + 1)),
  meltglide: (b, x) => (b.s('winter'), b.run(x + 2.4, false) && b.wall(13) && b.leap() && (b.s('summer'), b.run(x + 19.3, false)) && (b.s('autumn'), b.glideOff(x + 37.5)) && b.run(x + 38)),
  iceonice: (b, x, o) => {
    const n = o.n || 12, wall = x + Math.floor(n / 2) - 1;
    b.s('winter'); if (!b.run(wall - 2, false)) return false;
    b.s('summer'); if (!b.run(wall + 1.6, false)) return false;
    b.s('winter'); return b.run(x + n + 1, false);
  },
  mudflower: (b, x) => (b.s('summer'), b.run(x + 4.3, false)) && (b.s('spring'), b.flowerHop(x + 6.5)) && b.run(x + 15),
  pilevent: (b, x) => (b.s('autumn'), b.run(x + 8)) && (b.s('summer'), b.vent(x + 9.5)) && b.run(x + 16),
  quickmix: (b, x) => (b.s('winter'), b.run(x + 4.5, false)) && (b.s('autumn'), b.run(x + 9.5, false)) && (b.s('summer'), b.run(x + 15)),
  cliffmeltglide: (b, x) => (b.s('spring'), b.flowerHop(x + 1.5)) && (b.s('summer'), b.run(x + 9.6, false)) && (b.s('autumn'), b.glideOff(x + 23)) && b.run(x + 25),
  vineice: (b, x) => (b.s('spring'), b.climb(x + 2.5)) && (b.s('summer'), b.run(x + 10)),
};

export async function play(id, verbose) {
  const kit = await setup();
  const L = kit.lvl(id, 2.5);
  L.godMode = true;
  const b = bot(kit, L);
  const log = [];
  for (const [k, x, o] of L.data.pieces) {
    const ok = SOLVE[k](b, x, o);
    log.push(`${k}@${x}:${ok ? 'ok' : 'FAIL'} (x=${b.col().toFixed(1)} row=${b.row().toFixed(1)}${L.player.dead ? ' DEAD' : ''})`);
    if (!ok) return { id, ok: false, log: verbose ? log : log.slice(-2) };
  }
  b.s(null);
  b.run(L.w - 4);
  for (let i = 0; i < 60 && L.state !== 'clear'; i++) b.step(() => { kit.F.input.keys.ArrowRight = true; });
  return { id, ok: L.state === 'clear', t: +b.t.toFixed(1), log: verbose ? log : undefined };
}

export async function playAll(ids) {
  const lv = await import('/src/game/levels.js');
  const out = [];
  for (const id of ids || lv.ALMANAC_ORDER) out.push(await play(id));
  return out;
}
