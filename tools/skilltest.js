// Dev-only: bots for the skill levels that aren't plain set-piece runs: the two wall-jump climbs (4-5, A-17)
// and the skill sections added into existing levels (data.extras).
// Usage: const st = await import('/tools/skilltest.js'); await st.all();
import { setup, bot, SOLVE } from './trailtest.js';

function more(kit, L, b) {
  const p = L.player, K = kit.F.input.keys;
  b.runL = (x, max = 12) => { const t0 = b.t; while (b.col() > x && b.t - t0 < max) if (!b.step(() => { K.ArrowLeft = true; })) return false; return b.col() <= x; };
  // run left/right, jumping over any hole just ahead
  b.hopDir = (x, dir, max = 12) => {
    const t0 = b.t;
    while ((dir > 0 ? b.col() < x : b.col() > x) && b.t - t0 < max) {
      const ahead = Math.floor((p.cx + dir * 34) / 48), below = Math.floor((p.bottom + 4) / 48);
      const gap = p.onGround && !L.solid(ahead, below) && !L.oneway(ahead, below);
      if (!b.step(() => { K[dir > 0 ? 'ArrowRight' : 'ArrowLeft'] = true; if (gap) kit.press('Space'); if (!p.onGround && p.vy < 0) K.Space = true; })) return false;
    }
    for (let i = 0; i < 30 && Math.abs(p.vx) > 5; i++) b.step();
    return dir > 0 ? b.col() >= x - 0.3 : b.col() <= x + 0.3;
  };
  b.ringBell = (dir) => { for (let i = 0; i < 400 && L.state !== 'clear'; i++) b.step(() => { K[dir > 0 ? 'ArrowRight' : 'ArrowLeft'] = true; }); return L.state === 'clear'; };
  return b;
}
function run(kit, L, b, steps) {
  const log = [];
  for (const [name, fn] of steps) {
    const ok = fn();
    log.push(`${name}:${ok ? 'ok' : 'FAIL'} (x=${b.col().toFixed(1)} row=${b.row().toFixed(1)}${L.player.dead ? ' DEAD' : ''})`);
    if (!ok) return { id: L.id, ok: false, log };
  }
  const seeds = (kit.st.state.data.seeds[L.id] || []).filter(Boolean).length;
  return { id: L.id, ok: L.state === 'clear', t: +b.t.toFixed(1), seeds, log };
}

export async function spire() {
  const kit = await setup();
  const L = kit.lvl('4-5', 2.5); L.godMode = true;
  const b = more(kit, L, bot(kit, L));
  return run(kit, L, b, [
    ['chimney1', () => (b.s(null), b.run(6.5, false) && b.wall(17))],
    ['to-L1', () => b.hopDir(12.3, 1)],
    ['chimney2', () => b.wall(33)],
    ['to-L2', () => b.hopDir(1.6, -1)],
    ['chimney3', () => b.wall(49)],
    ['to-L3', () => b.hopDir(12.6, 1)],
    ['chimney4', () => b.wall(61)],
    ['bell', () => { b.hopDir(7, -1); return L.state === 'clear' || b.ringBell(-1); }],
  ]);
}

export async function heights() {
  const kit = await setup();
  const L = kit.lvl('A-17', 2.5); L.godMode = true;
  const b = more(kit, L, bot(kit, L));
  const p = L.player, K = kit.F.input.keys;
  return run(kit, L, b, [
    ['winter-chimney', () => (b.s('winter'), b.run(11.5, false) && b.wall(16))],
    ['to-left', () => b.hopDir(1.6, -1)],
    ['summer-chimney', () => (b.s('summer'), b.wall(31))],
    ['to-vent', () => (b.s('autumn'), b.run(13.4, false))],
    ['gust-glide', () => {
      const trace = [];
      for (let i = 0; i < 400; i++) { if (p.vy > -60 && b.row() > 37) break; if (!b.step()) return false; if (i % 20 === 0) trace.push(`${b.col().toFixed(2)}/${b.row().toFixed(2)}/${Math.round(p.vy)}/${p.season}/${p.onGround}`); }
      L.trace = trace;
      kit.press('Space');
      return b.land(8, () => { if (b.col() > 9) K.ArrowLeft = true; K.Space = true; }) && b.row() >= 39.9;
    }],
    ['vine', () => {
      b.s('spring');
      if (b.col() < 10.3) b.run(10.4, false); else b.runL(10.6);
      for (let i = 0; i < 50; i++) b.step();
      for (let i = 0; i < 30 && !p.climb; i++) b.step(() => { K.ArrowUp = true; });
      if (!p.climb) return false;
      for (let i = 0; i < 300 && p.bottom > p.climb.topY() + 12; i++) b.step(() => { K.ArrowUp = true; });
      b.step(() => { K.ArrowLeft = true; kit.press('Space'); });
      return b.land(4, () => { K.ArrowLeft = true; K.Space = true; }) && b.row() >= 46.9;
    }],
    ['last-chimney', () => (b.s('winter'), b.runL(1.6) && b.wall(61))],
    ['bell', () => { b.hopDir(8, 1); return L.state === 'clear' || b.ringBell(1); }],
  ]);
}

// Each skill section added to an older level, played from just before it.
export async function extras(id) {
  const kit = await setup();
  const lv = await import('/src/game/levels.js');
  const list = lv.getLevel(id).extras || [];
  const out = [];
  for (const [k, x, o] of list) {
    const L = kit.lvl(id, x + 0.5); L.godMode = true;
    const b = bot(kit, L);
    const ok = SOLVE[k](b, x, o);
    out.push(`${k}@${x}:${ok ? 'ok' : 'FAIL'} (x=${b.col().toFixed(1)} row=${b.row().toFixed(1)})`);
  }
  // and then on to the bell
  const [k, x, o] = list[list.length - 1];
  const L = kit.lvl(id, x + lv.PIECES[k].w(o) + 0.5); L.godMode = true;
  const b = bot(kit, L);
  b.hop(L.w - 3, 20);
  for (let i = 0; i < 200 && L.state !== 'clear'; i++) b.step(() => { kit.F.input.keys.ArrowRight = true; });
  return { id, ok: out.every((s) => s.includes(':ok')) && L.state === 'clear', log: out };
}

export async function all() {
  const out = [await spire(), await heights()];
  for (const id of ['3-2', '3-3', '4-1', '4-2', '4-3']) out.push(await extras(id));
  return out.map((r) => `${r.id} ${r.ok ? 'ok' : 'FAIL'} ${r.t || ''} ${r.ok ? '' : r.log.join(' / ')}`);
}
