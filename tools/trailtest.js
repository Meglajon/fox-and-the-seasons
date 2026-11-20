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
    t: 0, fail: null, L, kit,
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
    vent(vx, glide, until = 1e9) {
      if (!b.run(vx - 0.1, false)) return false;
      for (let i = 0; i < 12; i++) b.step();
      for (let i = 0; i < 300; i++) {
        if (p.vy > -60 && b.row() > 4) break;
        b.step();
      }
      kit.press('Space');
      return b.land(8, () => { if (b.col() < until + 1) K.ArrowRight = true; if (glide && b.col() < until) K.Space = true; });
    },
    // Walk off a ledge and glide; let go of the glide once past tile until.
    glideOff(until) {
      for (let i = 0; i < 400; i++) {
        const air = !p.onGround;
        if (!b.step(() => { if (b.col() < until + 1) K.ArrowRight = true; if (air && b.col() < until) K.Space = true; })) return false;
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

// ---------- skill pieces: vines, moving platforms, lifts, wall-jump shafts ----------
// Where would letting go now take us? To the next vine, or (after the last one) onto the far ledge.
function willReach(p, v, next, endX, L) {
  const vx = Math.max(-640, Math.min(640, p.vx * 1.1)), vy = Math.min(p.vy, 0) - 330;
  let th = next?.th, om = next?.om;
  for (let t = 0.02; t < 1.4; t += 0.02) {
    const x = p.cx + vx * t, y = p.cy + vy * t + 0.5 * (t < 0.25 ? 2200 : 2400) * t * t;
    if (next) {
      // the next vine keeps swinging while we fly
      om += (-(2400 / next.L) * Math.sin(th)) * 0.02; om *= 1 - 0.25 * 0.02; th += om * 0.02;
      const dx = Math.sin(th) * next.L, dy = Math.cos(th) * next.L, l2 = dx * dx + dy * dy;
      const u = Math.max(0.45, Math.min(1, ((x - next.ax) * dx + (y - next.ay) * dy) / l2));
      if (Math.hypot(x - (next.ax + dx * u), y - (next.ay + dy * u)) < 18) return true;
    } else if (y + 20 >= (L.h - 2) * 48) {
      // land only on solid ground, past the pit
      const row = L.h - 2, ok = (px) => L.solid(Math.floor(px / 48), row);
      return x > (endX - 1.2) * 48 && ok(x - 14) && ok(x + 14);
    }
  }
  return false;
}
// Swing across vines from the ledge at x to solid ground past tile endX.
function swingAcross(b, x, endX) {
  const { L, kit } = b, p = L.player, K = kit.F.input.keys;
  const vines = L.ents.filter((e) => e.constructor.name === 'Swing' && e.ax > x * 48 && e.ax < endX * 48).sort((a, c) => a.ax - c.ax);
  if (!b.run(x + 1.5, false)) return false;
  for (let i = 0; i < 60 && Math.abs(p.vx) > 5; i++) b.step();
  const first = vines[0];
  // leave when the first vine is swinging back towards us
  for (let i = 0; i < 600 && !(first.om < 0 && first.th > -0.05 && first.th < 0.15); i++) b.step();
  let jumped = false, t0 = b.t;
  while (b.t - t0 < 30) {
    if (p.onGround && b.col() >= endX) return true;
    const ok = b.step(() => {
      if (p.swing) {
        const v = p.swing, i = vines.indexOf(v), next = vines[i + 1];
        K[v.om > 0 ? 'ArrowRight' : 'ArrowLeft'] = true;
        if (v.om > 0 && v.th > 0.3 && willReach(p, v, next, endX, L)) kit.press('Space');
      } else if (!jumped) {
        K.ArrowRight = true; K.ShiftLeft = true;
        if (p.onGround && b.col() > x + 2.35) { kit.press('Space'); jumped = true; }
      } else if (!p.onGround) {
        // in the air after letting go: head for the next vine, or steer onto the far ledge
        K.Space = true;
        const tx = (endX + 0.2) * 48;
        if (p.lastSwing === vines[vines.length - 1] && p.cx > tx + 12) K.ArrowLeft = true;
        else { K.ArrowRight = true; K.ShiftLeft = true; }
      }
    });
    if (!ok) return false;
    if (p.onGround && jumped && b.col() < endX - 1) return false;
  }
  return false;
}
// Would a running jump right now land on platform m (or on the ground from gx onwards)?
function simJump(p, m, L, gx) {
  return [-50, 0, 50].every((dv) => simJump1(p, m, L, gx, dv));
}
function simJump1(p, m, L, gx, dv) {
  let x = p.cx, y = p.bottom, vx = p.vx + dv, vy = -(860 + Math.abs(p.vx) * 0.15);
  const dt = 1 / 60, floor = (L.h - 2) * 48;
  for (let i = 1; i < 100; i++) {
    let mx, my, mw;
    if (m) { [mx, my] = m.pos(m.t + i * dt); mw = m.w; } else { mx = gx; my = floor; mw = 400; }
    const cx = m ? mx + mw / 2 : gx + 50;
    const dir = cx > x + 6 ? 1 : cx < x - 6 ? -1 : 0;
    const target = dir * (Math.abs(cx - x) > 70 ? 370 : 240);
    vx += Math.max(-1150 * dt, Math.min(1150 * dt, target - vx));
    vy = Math.min(vy + (vy < 0 ? 2200 : 2400) * dt, 920);
    const prevY = y; x += vx * dt; y += vy * dt;
    if (vy > 0 && prevY <= my + 4 && y >= my && x > mx + 12 && x < mx + mw - 12) return !m || my <= p.bottom + 40;
    if (y > floor + 60) return false;
  }
  return false;
}
// Hop from platform to platform (moving ones included) to ground past tile endX.
function platformHop(b, x, endX) {
  const { L, kit } = b, p = L.player, K = kit.F.input.keys;
  const plats = L.movers.filter((m) => m.bx >= x * 48 - 200 && m.bx < endX * 48);
  const gx = (endX - 2.6) * 48;
  if (!b.run(x + 1.8, false)) return false;
  for (let n = 0; n < 16; n++) {
    if (p.onGround && !p.mover && p.cx >= gx - 10) break;
    const ahead = plats.filter((m) => m !== p.mover && m.x + m.w / 2 > p.cx + 30).sort((a, c) => a.x - c.x);
    let tgt = null, t0 = b.t;
    while (b.t - t0 < 14) {
      if (gx - p.cx < 230 && simJump(p, null, L, gx)) { tgt = 'ground'; break; }
      const m = ahead.find((q) => simJump(p, q, L));
      if (m) { tgt = m; break; }
      if (!b.step(() => { if (p.mover) { const c = p.mover.x + p.mover.w / 2; if (p.cx < c - 10) K.ArrowRight = true; else if (p.cx > c + 10) K.ArrowLeft = true; } })) return false;
    }
    if (!tgt) return false;
    b.step(() => { K.ArrowRight = true; kit.press('Space'); });
    if (!b.land(4, () => {
      const cx = tgt === 'ground' ? gx + 50 : tgt.x + tgt.w / 2;
      if (cx > p.cx + 6) K.ArrowRight = true; else if (cx < p.cx - 6) K.ArrowLeft = true;
      if (Math.abs(cx - p.cx) > 70) K.ShiftLeft = true;
      K.Space = true;
    })) return false;
    if (tgt === 'ground') break;
  }
  return b.run(endX, false);
}
function liftUp(b, x) {
  const { L, kit } = b, p = L.player, K = kit.F.input.keys;
  const m = L.movers.find((q) => Math.abs(q.bx - (x + 1) * 48) < 3);
  if (!b.run(x + 0.5, false)) return false;
  const bottom = () => m.y >= (L.h - 2) * 48 - 1 && Math.abs(m.my) < 0.01;
  for (let i = 0; i < 1200 && b.row() < 9.8; i++) {
    if (!b.step(() => {
      const c = m.x + m.w / 2;
      if (p.mover === m || bottom()) { if (p.cx < c - 8) K.ArrowRight = true; else if (p.cx > c + 8) K.ArrowLeft = true; }
    })) return false;
  }
  return b.row() > 9.8 && b.run(x + 11);
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
  ventglide: (b, x, o) => (b.s('autumn'), b.vent(x + 2.5, true, x + 4.5 + (o.n || 12)) && b.run(x + 5 + (o.n || 12))),
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
  pilevent: (b, x) => (b.s('autumn'), b.run(x + 8)) && (b.s('summer'), b.vent(x + 9.5)) && b.run(x + 16) && b.land(3),
  quickmix: (b, x) => (b.s('winter'), b.run(x + 4.5, false)) && (b.s('autumn'), b.run(x + 9.5, false)) && (b.s('summer'), b.run(x + 15)),
  cliffmeltglide: (b, x) => (b.s('spring'), b.flowerHop(x + 1.5)) && (b.s('summer'), b.run(x + 9.6, false)) && (b.s('autumn'), b.glideOff(x + 23)) && b.run(x + 25),
  vineice: (b, x) => (b.s('spring'), b.climb(x + 2.5)) && (b.s('summer'), b.run(x + 10)),
  swing: (b, x, o) => (b.s(null), swingAcross(b, x, x + 4 + (o.n || 8))),
  swings: (b, x, o) => (b.s(null), swingAcross(b, x, x + 4 + (o.k || 3) * (o.gap || 6) + 2)),
  mover: (b, x, o) => (b.s(null), platformHop(b, x, x + 5 + (o.n || 8))),
  hopplats: (b, x, o) => (b.s(null), platformHop(b, x, x + 5 + (o.k || 3) * 4 + 1)),
  wheel: (b, x) => (b.s(null), platformHop(b, x, x + 17)),
  lift: (b, x) => (b.s(null), liftUp(b, x)),
  shaft: (b, x, o) => { const s = o.wide || 2; b.s(null); return b.run(x + 1.6 + s / 2, false) && b.wall((o.top || 12) + 1) && b.leap() && b.run(x + 14 + s); },
};
export { SOLVE };

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
