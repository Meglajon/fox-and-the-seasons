// Critters: walkers, fliers and shooters. Bopped critters fall asleep; Winter freezes them into ice blocks.
import { T } from '../art/tiles.js';
import { overlap } from '../core/util.js';
import { sfx } from '../audio/sfx.js';
import { engine } from '../core/engine.js';
import { drawGrub, drawSnap, drawBuzzer, drawAcorn } from '../art/critters.js';
import { drawBeetle, drawFrog, drawSquirrel, drawMoth, drawIceCube } from '../art/critters2.js';
import { drawCactusHog, drawSlug } from '../art/critters3.js';

const G = 2200;
const SIZES = {
  grub: [34, 24], snap: [28, 40], buzz: [30, 26], beetle: [32, 24], frog: [30, 26], squirrel: [28, 40], moth: [30, 30], cactus: [34, 30], slug: [38, 20],
};
const FLIERS = new Set(['buzz', 'moth']);
const WALK = { grub: 45, beetle: 95, cactus: 55, slug: 32 };
const EDGE_TURN = new Set(['grub', 'cactus', 'slug']);
const ROOTED = new Set(['snap', 'squirrel']);

export class Critter {
  constructor(kind, tx, row) {
    this.kind = kind;
    this.t = Math.random() * 6;
    this.asleep = false; this.frozen = false; this.mode = 'awake'; this.dead = false;
    this.seed = tx * 13 + row;
    [this.w, this.h] = SIZES[kind];
    this.x = tx * T + T / 2 - this.w / 2;
    this.y = (row + 1) * T - this.h;
    this.vx = WALK[kind] ? -WALK[kind] : 0; this.vy = 0;
    this.facing = -1; this.bounces = 0; this.zT = 0; this.kickCool = 0; this.thaw = 0;
    this.x0 = this.x; this.y0 = this.y;
    this.snapT = 1 + Math.random(); this.open = 0; this.hopT = 1 + Math.random(); this.puff = 0;
  }
  get cx() { return this.x + this.w / 2; }
  get isFlier() { return FLIERS.has(this.kind); }

  sleep(L) {
    if (this.frozen) { this.frozen = false; }
    this.asleep = true; this.mode = 'rest';
    this.vx = 0; this.vy = this.isFlier ? 0 : Math.min(this.vy, 0);
    if (!ROOTED.has(this.kind)) {
      const b = this.y + this.h;
      this.w = 30; this.h = 28; this.y = b - this.h;
    }
    L.burst(this.cx, this.y + 6, 'spark', 6);
  }
  // Winter: becomes a solid, kickable ice block until it thaws.
  freeze(L) {
    this.frozen = true; this.asleep = true; this.mode = 'rest';
    this.vx = 0; this.vy = Math.min(this.vy, 0); this.thaw = 3;
    sfx('freeze');
    L.burst(this.cx, this.y + this.h / 2, 'snow', 8);
  }
  unfreeze() {
    this.frozen = false; this.asleep = false; this.mode = 'awake';
    this.x0 = this.x; this.y0 = this.y; this.t = 0;
    if (WALK[this.kind]) this.vx = WALK[this.kind] * this.facing;
  }

  update(dt, L) {
    this.t += dt;
    if (this.kickCool > 0) this.kickCool -= dt;
    if (!this.asleep && L.winterAt(this.cx, this.y + this.h / 2)) this.freeze(L);
    if (this.asleep) return this.updateSleep(dt, L);
    const p = L.player;
    const k = this.kind;
    if (WALK[k]) {
      this.vy = Math.min(this.vy + G * dt, 900);
      const pv = this.vx;
      // Shadow slugs nearly stop when caught in Summer light.
      if (k === 'slug' && L.summerAt?.(this.cx, this.y + this.h / 2)) this.vx = pv * 0.2;
      L.move(this, dt);
      this.vx = this.hitX ? -pv : pv;
      if (EDGE_TURN.has(k) && this.onGround) {
        const ahead = this.vx > 0 ? this.x + this.w + 2 : this.x - 2;
        if (!L.solidPx(ahead, this.y + this.h + 4) && !L.onewayPx(ahead, this.y + this.h + 4)) this.vx = -this.vx;
      }
      this.facing = Math.sign(this.vx) || this.facing;
    } else if (k === 'snap') {
      if (Math.abs(p.cx - this.cx) < 7 * T && Math.abs(p.cy - this.y) < 4 * T) {
        this.facing = p.cx > this.cx ? 1 : -1;
        this.snapT -= dt;
        if (this.snapT < 0.35) this.open = Math.min(1, this.open + dt * 5);
        if (this.snapT <= 0) {
          this.snapT = 2.4;
          L.ents.push(new SeedShot(this.cx + this.facing * 12, this.y + 8, this.facing * 210, -380));
        }
      }
      if (this.snapT > 0.35) this.open = Math.max(0, this.open - dt * 4);
    } else if (k === 'frog') {
      this.vy = Math.min(this.vy + G * dt, 900);
      L.move(this, dt);
      if (this.onGround) {
        this.vx *= Math.pow(0.0005, dt);
        if (Math.abs(p.cx - this.cx) < 8 * T) {
          this.hopT -= dt;
          this.facing = p.cx > this.cx ? 1 : -1;
        }
        this.puff = this.hopT < 0.45 ? Math.min(1, this.puff + dt * 4) : Math.max(0, this.puff - dt * 4);
        if (this.hopT <= 0) { this.hopT = 1.9; this.vy = -700; this.vx = this.facing * 150; this.puff = 0; }
      }
    } else if (k === 'squirrel') {
      this.vy = Math.min(this.vy + G * dt, 900);
      L.move(this, dt);
      this.facing = p.cx > this.cx ? 1 : -1;
      this.snapT -= dt;
      this.holding = this.snapT < 0.6;
      if (this.snapT <= 0 && Math.abs(p.cx - this.cx) < 3.5 * T && p.y > this.y + 10) {
        this.snapT = 1.7;
        L.ents.push(new AcornDrop(this.cx + this.facing * 8, this.y + 20));
      } else if (this.snapT <= 0) this.snapT = 0.3;
    } else if (k === 'buzz') {
      const s = Math.sin(this.t * 1.3), px = this.x;
      if (this.vertical) { this.y = this.y0 + s * T * 2; this.x = this.x0 + Math.sin(this.t * 2.6) * 6; }
      else { this.x = this.x0 + s * T * 2; this.y = this.y0 + Math.sin(this.t * 2.6) * 10; }
      if (Math.abs(this.x - px) > 0.01) this.facing = Math.sign(this.x - px);
    } else if (k === 'moth') {
      const px = this.x;
      this.x = this.x0 + Math.cos(this.t * 1.1) * T * 1.6;
      this.y = this.y0 + Math.sin(this.t * 2.2) * T * 0.8;
      if (Math.abs(this.x - px) > 0.01) this.facing = Math.sign(this.x - px);
    }
    if (this.y > L.h * T + 200) this.dead = true;
  }

  updateSleep(dt, L) {
    if (this.frozen && this.mode === 'rest') {
      if (L.winterAt(this.cx, this.y + this.h / 2)) this.thaw = 3;
      else { this.thaw -= dt * (L.summerAt?.(this.cx, this.y + this.h / 2) ? 5 : 1); if (this.thaw <= 0) { this.unfreeze(); return; } }
    }
    if (!this.frozen) {
      this.zT += dt;
      if (this.zT > 1.1 && this.mode !== 'thrown') { this.zT = 0; L.parts.push({ type: 'z', x: this.cx + 8, y: this.y, vx: 12, vy: -24, life: 1.6, max: 1.6 }); }
    }
    if (this.mode === 'carried') {
      const p = L.player;
      this.x = p.cx - this.w / 2 + p.facing * 4;
      this.y = p.y - this.h + 6;
      return;
    }
    if (ROOTED.has(this.kind) && this.kind === 'snap') return;
    this.vy = Math.min(this.vy + G * dt, 900);
    const pv = this.vx;
    L.move(this, dt);
    if (this.mode === 'thrown') {
      if (this.hitX) {
        this.vx = -pv * 0.85; this.bounces++; sfx('bump');
        if (this.bounces > 2) { this.mode = 'rest'; this.vx = 0; }
      }
      const slippery = this.frozen || L.onIce(this);
      if (this.onGround && Math.abs(this.vx) < 60) this.mode = 'rest';
      if (this.onGround && !slippery) this.vx *= Math.pow(0.3, dt);
      for (const e of L.critters) {
        if (e !== this && !e.asleep && overlap(this, e)) { e.sleep(L); sfx('bop'); L.addScore(e.cx, e.y); }
      }
      if (L.boss && L.boss.hitBy?.(this, L)) { this.mode = 'rest'; this.vx = 0; this.dead = true; L.burst(this.cx, this.y, 'spark', 10); }
    } else if (this.onGround) this.vx *= Math.pow(L.onIce(this) ? 0.6 : 0.001, dt);
    if (this.y > L.h * T + 200) this.dead = true;
  }

  draw(ctx, L) {
    const x = this.cx - L.camX, y = this.y + this.h - L.camY, b = engine.boil;
    const o = { facing: this.facing, t: this.frozen ? 0 : this.t, asleep: this.asleep, frozen: this.frozen, boil: b, seed: this.seed, open: this.open, puff: this.puff, holding: this.holding };
    if (this.frozen) o.asleep = false;
    const k = this.kind;
    if (k === 'grub') drawGrub(ctx, x, y, o);
    else if (k === 'snap') drawSnap(ctx, x, y, o);
    else if (k === 'buzz') drawBuzzer(ctx, x, y, o);
    else if (k === 'beetle') drawBeetle(ctx, x, y, o);
    else if (k === 'frog') drawFrog(ctx, x, y, o);
    else if (k === 'squirrel') drawSquirrel(ctx, x, y, o);
    else if (k === 'moth') drawMoth(ctx, x, y, o);
    else if (k === 'cactus') drawCactusHog(ctx, x, y, o);
    else if (k === 'slug') {
      const a = L.data.dark ? L.lightAt(this.cx, this.y + this.h / 2) : 1;
      if (a > 0.02) { ctx.save(); ctx.globalAlpha = a; drawSlug(ctx, x, y, o); ctx.restore(); }
    }
    if (this.frozen) drawIceCube(ctx, x, y, this.w, this.h, b);
  }
}

export class SeedShot {
  constructor(x, y, vx, vy) { this.x = x - 6; this.y = y - 6; this.w = 12; this.h = 12; this.vx = vx; this.vy = vy; this.t = 0; this.dead = false; this.hurts = true; }
  update(dt, L) {
    this.t += dt;
    this.vy += 900 * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (L.solidPx(this.x + 6, this.y + 6) || this.t > 4) { this.dead = true; L.burst(this.x + 6, this.y + 6, 'dust', 3); }
  }
  draw(ctx, L) {
    const x = this.x + 6 - L.camX, y = this.y + 6 - L.camY;
    ctx.save(); ctx.translate(x, y); ctx.rotate(this.t * 10);
    ctx.fillStyle = '#7d4a2b'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 4, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3b2a26'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
}

// A squirrel's acorn, dropped straight down.
export class AcornDrop {
  constructor(x, y) { this.x = x - 8; this.y = y; this.w = 16; this.h = 18; this.vy = 60; this.t = 0; this.dead = false; this.hurts = true; }
  update(dt, L) {
    this.t += dt;
    this.vy = Math.min(this.vy + 1600 * dt, 700);
    this.y += this.vy * dt;
    if (L.solidPx(this.x + 8, this.y + this.h) || this.t > 4) { this.dead = true; L.burst(this.x + 8, this.y + this.h, 'dust', 4); sfx('bump'); }
  }
  draw(ctx, L) { drawAcorn(ctx, this.x + 8 - L.camX, this.y + 10 - L.camY, 1, engine.boil); }
}
