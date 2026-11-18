// Dev-only test helpers for driving the game from the browser console (never loaded by the game).
// Usage (with tools/serve.py running):  const T = await import('/tools/testkit.js'); await T.setup();
export async function setup() {
  const F = window.__fox;
  const st = await import('/src/core/state.js');
  const eng = await import('/src/core/engine.js');
  const { LevelScene } = await import('/src/game/level.js');
  st.state.noSave = true;
  st.state.data = st.newData('Test');
  Object.assign(st.state.data.stones, { spring: true, winter: true, autumn: true });
  const kit = {
    F, st, eng, LevelScene,
    press(c) { F.input.hits[c] = true; F.input.keys[c] = true; },
    rel() { for (const k in F.input.keys) F.input.keys[k] = false; },
    hold(c, on = true) { F.input.keys[c] = on; },
    async shot(n) {
      F.step(0.02);
      await fetch('/__shot?name=' + n, { method: 'POST', body: document.getElementById('game').toDataURL('image/png') });
      return n;
    },
    // Load a level with Fennel standing at tile x (row = tiles up from the bottom).
    lvl(id, x, row = 2) {
      const L = new LevelScene(id); L.introDone = true; eng.setScene(L);
      const p = L.player; p.x = x * 48 - p.w / 2; p.y = (L.h - row) * 48 - p.h; p.vx = 0; p.vy = 0;
      L.camX = Math.max(0, p.cx - 480); F.step(0.3, false);
      return L;
    },
    row(L) { return +(L.h - L.player.bottom / 48).toFixed(2); },
    col(L) { return +(L.player.cx / 48).toFixed(2); },
    // Run frames with a per-frame input function until done() or maxT seconds.
    run(L, fn, done, maxT = 10) {
      let t = 0;
      while (t < maxT && !L.player.dead && !(done && done(L))) { kit.rel(); fn(L, t); F.step(1 / 60, false); t += 1 / 60; }
      kit.rel();
      return { t: +t.toFixed(2), x: kit.col(L), row: kit.row(L), dead: L.player.dead, ground: L.player.onGround };
    },
    // Wall-jump up a shaft until standing at or above goalRow.
    wallClimb(L, goalRow, maxT = 10) {
      const p = L.player; let dir = 1, maxRow = 0, t = 0, cool = 0;
      kit.rel();
      while (t < maxT && !p.dead) {
        const r = kit.row(L); maxRow = Math.max(maxRow, r); kit.rel();
        if (p.onGround) {
          if (r >= goalRow) break;
          F.input.keys[dir > 0 ? 'ArrowRight' : 'ArrowLeft'] = true;
          if (cool <= 0) { kit.press('Space'); cool = 0.3; }
        } else {
          const wl = L.touchWall(p, -1), wr = L.touchWall(p, 1);
          if ((wl || wr) && cool <= 0) { kit.press('Space'); dir = wl ? 1 : -1; cool = 0.12; }
          F.input.keys[dir > 0 ? 'ArrowRight' : 'ArrowLeft'] = true;
          if (p.vy < 0) F.input.keys.Space = true;
        }
        F.step(1 / 60, false); t += 1 / 60; cool -= 1 / 60;
      }
      kit.rel();
      return { maxRow: +maxRow.toFixed(1), row: kit.row(L), x: kit.col(L), t: +t.toFixed(1) };
    },
  };
  window.kit = kit;
  return kit;
}
