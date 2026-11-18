// Everything that lives in a level besides Fennel: critters, pickups, plants, checkpoints, the bell and the boss.
import { T } from '../art/tiles.js';
import { overlap, clamp, dist } from '../core/util.js';
import { input } from '../core/input.js';
import { sfx } from '../audio/sfx.js';
import { shake } from '../core/engine.js';
import { engine } from '../core/engine.js';
import {
  drawGrub, drawSnap, drawBuzzer, drawPumpkin, drawJuniper, drawAcorn, drawSeed, drawBerry, drawStoneGem,
  drawLantern, drawBell, drawSoil, drawFlower, drawVine, drawMushroom, drawSign, drawLetter, drawZ,
} from '../art/critters.js';
import { panel, wrap, text } from '../art/ink.js';
import { fmt } from '../ui/ui.js';

const G = 2200;

import { Critter } from './critter.js';
import { drawPuddle, drawRook } from '../art/critters2.js';
export { Critter, SeedShot, AcornDrop } from './critter.js';

// ---------------- pickups ----------------
export class Acorn {
  constructor(tx, row) { this.x = tx * T + 12; this.y = row * T + 10; this.w = 24; this.h = 28; this.t = tx * 0.3; this.dead = false; }
  update(dt, L) { this.t += dt; if (overlap(this, L.player) && !L.player.dead) { this.dead = true; L.gainAcorns(1, this.x + 12, this.y); sfx('acorn'); } }
  draw(ctx, L) { drawAcorn(ctx, this.x + 12 - L.camX, this.y + 16 - L.camY + Math.sin(this.t * 3) * 2, 1.1, engine.boil); }
}

export class PopAcorn {
  constructor(x, y) { this.x = x; this.y = y; this.vy = -520; this.t = 0; this.dead = false; }
  update(dt) { this.t += dt; this.vy += 1600 * dt; this.y += this.vy * dt; if (this.t > 0.55) this.dead = true; }
  draw(ctx, L) { ctx.globalAlpha = Math.min(1, (0.55 - this.t) * 5); drawAcorn(ctx, this.x - L.camX, this.y - L.camY, 1.1, engine.boil); ctx.globalAlpha = 1; }
}

export class Berry {
  constructor(tx, row) { this.w = 22; this.h = 22; this.x = tx * T + 13; this.y = row * T + 26; this.rise = 0.45; this.vx = 0; this.vy = 0; this.t = 0; this.dead = false; this.tile = [tx, row]; }
  update(dt, L) {
    this.t += dt;
    if (this.rise > 0) { this.rise -= dt; this.y -= (48 / 0.45) * dt; if (this.rise <= 0) this.vx = L.player.cx < this.x ? 90 : -90; return; }
    this.vy = Math.min(this.vy + G * dt, 800);
    const pv = this.vx; L.move(this, dt); if (this.hitX) this.vx = -pv;
    if (overlap(this, L.player) && !L.player.dead) { this.dead = true; L.gainLife(this.x + 11, this.y); }
    if (this.y > L.h * T + 100) this.dead = true;
  }
  draw(ctx, L) { drawBerry(ctx, this.x + 11 - L.camX, this.y + 22 - L.camY, engine.boil); }
}

export class GoldenSeed {
  constructor(tx, row, idx, had) { this.x = tx * T + 6; this.y = row * T + 4; this.w = 36; this.h = 40; this.idx = idx; this.had = had; this.t = 0; this.dead = false; }
  update(dt, L) { this.t += dt; if (overlap(this, L.player) && !L.player.dead) { this.dead = true; L.gainSeed(this.idx, this.x + 18, this.y + 20); } }
  draw(ctx, L) { drawSeed(ctx, this.x + 18 - L.camX, this.y + 22 - L.camY + Math.sin(this.t * 2.5) * 4, { ghost: this.had, t: this.t, boil: engine.boil }); }
}

export class StonePickup {
  constructor(tx, row, season = 'spring') { this.season = season; this.x = tx * T + 8; this.y = row * T + 4; this.w = 32; this.h = 40; this.t = 0; this.dead = false; }
  update(dt, L) { this.t += dt; if (overlap(this, L.player) && !L.player.dead) { this.dead = true; L.gotStone(this.season, this.x + 16, this.y + 20); } }
  draw(ctx, L) { drawStoneGem(ctx, this.x + 16 - L.camX, this.y + 20 - L.camY + Math.sin(this.t * 2) * 4, this.season, { t: this.t, boil: engine.boil, scale: 1.3 }); }
}

export class LetterPickup {
  constructor(x, y) { this.x = x - 20; this.y = y - 20; this.w = 40; this.h = 40; this.t = 0; this.dead = false; this.vy = -400; }
  update(dt, L) {
    this.t += dt;
    if (this.vy !== 0) { this.vy += 900 * dt; this.y += this.vy * dt; const floor = (L.h - 2) * T - 70; if (this.y > floor) { this.y = floor; this.vy = 0; } }
    if (this.t > 0.6 && overlap(this, L.player) && !L.player.dead) { this.dead = true; L.gotLetter(); }
  }
  draw(ctx, L) { drawLetter(ctx, this.x + 20 - L.camX, this.y + 20 - L.camY, this.t, engine.boil); }
}

// ---------------- level furniture ----------------
export class Lantern {
  constructor(tx, row, idx) { this.tx = tx; this.x = tx * T + 4; this.y = row * T - 30; this.w = 40; this.h = 78; this.idx = idx; this.lit = false; this.t = 0; }
  update(dt, L) {
    this.t += dt;
    if (!this.lit && overlap(this, L.player) && !L.player.dead) {
      this.lit = true; L.setCheckpoint(this); sfx('checkpoint'); L.burst(this.x + 30, this.y + 30, 'spark', 10);
    }
  }
  draw(ctx, L) { drawLantern(ctx, this.x + 8 - L.camX, this.y + this.h - L.camY, this.lit, this.t, engine.boil); }
}

export class Bell {
  constructor(tx, row) { this.px = tx * T + T / 2; this.base = (row + 1) * T; this.h = 5 * T; this.x = this.px - 8; this.y = this.base - this.h; this.w = 16; this.swing = 0; this.sv = 0; this.t = 0; this.rung = false; }
  update(dt, L) {
    this.t += dt;
    this.sv += (-this.swing * 40 - this.sv * 3) * dt; this.swing += this.sv * dt;
    if (!this.rung && overlap(this, L.player) && !L.player.dead) {
      this.rung = true; this.sv = 6;
      const frac = clamp((this.base - L.player.bottom) / this.h, 0, 1);
      L.finish(frac);
    }
  }
  draw(ctx, L) { drawBell(ctx, this.px - L.camX, this.base - L.camY, { h: this.h, swing: this.swing, t: this.t, boil: engine.boil }); }
}

export class Mushroom {
  constructor(tx, row) { this.cx = tx * T + T / 2; this.base = (row + 1) * T; this.top = this.base - 30; this.sq = 0; }
  update(dt, L) {
    this.sq = Math.max(0, this.sq - dt * 4);
    const p = L.player;
    if (p.vy > 0 && Math.abs(p.cx - this.cx) < 26 && p.bottom >= this.top && p.bottom - p.vy * dt <= this.top + 8) {
      p.y = this.top - p.h; p.bounce(1150); this.sq = 1; sfx('boing'); L.burst(this.cx, this.top, 'petal', 5);
    }
  }
  draw(ctx, L) { drawMushroom(ctx, this.cx - L.camX, this.base - L.camY, this.sq, engine.boil); }
}

// Soil that sprouts a bounce-flower ('f') or a climbing vine ('v') while Spring is nearby.
export class Soil {
  constructor(tx, row, kind, L) {
    this.kind = kind; this.cx = tx * T + T / 2; this.baseY = (row + 1) * T; this.grow = 0; this.hold = 0; this.sq = 0;
    this.maxH = 0;
    if (kind === 'v') {
      let r = row - 1, n = 0;
      while (n < 6 && r >= 0 && !L.solid(tx, r)) { n++; r--; }
      this.maxH = n * T;
    }
    this.wasGrown = false;
  }
  topY() { return this.baseY - 10 - this.maxH * this.grow; }
  climbable() { return this.grow > 0.5; }
  update(dt, L) {
    const p = L.player;
    this.sq = Math.max(0, this.sq - dt * 4);
    const inBubble = p.season === 'spring' && dist(p.cx, p.cy, this.cx, this.baseY - 10) < p.bubble + 16;
    const touching = p.climb === this || (Math.abs(p.cx - this.cx) < 30 && Math.abs(p.bottom - this.flowerTop()) < 30);
    if (inBubble) { this.grow = Math.min(1, this.grow + dt * (this.kind === 'v' ? 4 : 6)); this.hold = 4; }
    else if (touching) this.hold = Math.max(this.hold, 0.5);
    else { this.hold -= dt; if (this.hold <= 0) this.grow = Math.max(0, this.grow - dt * 1.5); }
    if (this.grow > 0.6 && !this.wasGrown) { this.wasGrown = true; sfx('sprout'); L.burst(this.cx, this.baseY - 20, 'petal', 4); }
    if (this.grow < 0.2) this.wasGrown = false;
    if (this.kind === 'f' && this.grow > 0.7) {
      const top = this.flowerTop();
      if (p.vy > 0 && Math.abs(p.cx - this.cx) < 28 && p.bottom >= top && p.bottom - p.vy * dt <= top + 10 && !p.dead) {
        p.y = top - p.h; p.bounce(1100); this.sq = 1; sfx('boing'); L.burst(this.cx, top, 'petal', 6);
      }
    }
    if (this.kind === 'v' && this.climbable() && !p.climb && !p.dead && input.down('up')) {
      if (Math.abs(p.cx - this.cx) < 22 && p.bottom > this.topY() + 6 && p.y < this.baseY) {
        p.climb = this; p.carry && L.dropCarry();
      }
    }
  }
  flowerTop() { return this.baseY - 8 - 30 * this.grow - 6; }
  draw(ctx, L) {
    const x = this.cx - L.camX, y = this.baseY - L.camY;
    if (this.kind === 'v') drawVine(ctx, x, y, this.maxH * this.grow, engine.boil);
    else drawFlower(ctx, x, y, this.grow, this.sq, L.palVivid, engine.boil);
    drawSoil(ctx, x, y, this.kind, engine.boil);
  }
}

export class Sign {
  constructor(tx, row, txt) { this.cx = tx * T + T / 2; this.base = (row + 1) * T; this.txt = txt; this.show = 0; }
  update(dt, L) {
    const near = Math.abs(L.player.cx - this.cx) < 70 && Math.abs(L.player.bottom - this.base) < 70;
    this.show = clamp(this.show + (near ? dt : -dt) * 5, 0, 1);
  }
  draw(ctx, L) {
    const x = this.cx - L.camX, y = this.base - L.camY;
    drawSign(ctx, x, y, engine.boil);
  }
  drawBubble(ctx, L) {
    if (this.show <= 0) return;
    const x = this.cx - L.camX, y = this.base - L.camY;
    const lines = wrap(ctx, fmt(this.txt), 300, 21, true);
    const w = 330, h = 22 + lines.length * 25;
    const bx = clamp(x - w / 2, 10, 950 - w), by = y - 70 - h;
    ctx.save(); ctx.globalAlpha = this.show;
    panel(ctx, bx, by, w, h, { seed: 41, r: 12 });
    lines.forEach((l, i) => text(ctx, l, bx + w / 2, by + 30 + i * 25, { size: 21, align: 'center', ui: true }));
    ctx.restore();
  }
}

export class NPC {
  constructor(tx, row, who) { this.who = who; this.cx = tx * T + T / 2; this.base = (row + 1) * T; this.t = 0; this.talked = false; this.facing = -1; }
  update(dt, L) {
    this.t += dt;
    const p = L.player;
    this.facing = p.cx < this.cx ? -1 : 1;
    const near = Math.abs(p.cx - this.cx) < 90 && Math.abs(p.bottom - this.base) < 60;
    this.near = near;
    if (near && !p.dead && (!this.talked || input.pressed('up'))) { this.talked = true; L.talk(this.who); }
  }
  draw(ctx, L) {
    const draw = { juniper: drawJuniper, puddle: drawPuddle, rook: drawRook }[this.who] || drawJuniper;
    draw(ctx, this.cx - L.camX, this.base - L.camY, { facing: this.facing, t: this.t, boil: engine.boil });
    if (this.near && this.talked) text(ctx, fmt('{up}') + ' Talk', this.cx - L.camX, this.base - L.camY - 112, { size: 18, align: 'center', ui: true });
  }
}

// ---------------- the boss ----------------
export class Pumpkin {
  constructor(L) {
    this.x = (L.w * T) / 2; this.y = (L.h - 2) * T; this.vx = 0; this.vy = 0;
    this.hp = 3; this.state = 'wait'; this.st = 0; this.t = 0; this.sq = 0; this.flash = 0; this.dead = false; this.grounded = true;
    this.W2 = 85; this.HT = 190;
  }
  get top() { return this.y - this.HT; }
  setState(s) { this.state = s; this.st = 0; }
  start() { this.setState('idle'); }
  hitBy(obj, L) {
    if (this.state === 'defeated' || this.state === 'hurt' || this.state === 'wait') return false;
    if (obj.x + obj.w > this.x - this.W2 && obj.x < this.x + this.W2 && obj.y + obj.h > this.top && obj.y < this.y) { this.damage(L); return true; }
    return false;
  }
  damage(L) {
    this.hp--; this.flash = 0.4; shake(10); sfx('bosshit');
    L.burst(this.x, this.top, 'spark', 14);
    if (this.hp <= 0) { this.setState('defeated'); L.bossDefeated(); } else this.setState('hurt');
  }
  update(dt, L) {
    this.t += dt; this.st += dt; this.flash = Math.max(0, this.flash - dt); this.sq *= Math.pow(0.01, dt);
    const p = L.player;
    const speed = 1 + (3 - this.hp) * 0.25;
    if (this.state === 'idle' && this.st > 1.3 / speed) {
      // Hop to whichever landing spot is nearest Fennel (never onto the soil patches).
      const spots = [8.5, 11, 13.5].map((s) => s * T);
      this.target = spots.reduce((a, b) => (Math.abs(b - p.cx) < Math.abs(a - p.cx) ? b : a));
      this.setState('crouch');
    }
    else if (this.state === 'crouch') {
      this.sq = Math.min(0.18, this.st * 0.4);
      if (this.st > 0.55 / speed) {
        const tx = this.target;
        this.vy = -980; const air = (2 * 980) / 2600;
        this.vx = (tx - this.x) / air; this.grounded = false; this.sq = -0.15;
        this.setState('hop');
      }
    } else if (this.state === 'hop') {
      this.vy += 2600 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
      const floor = (L.h - 2) * T;
      if (this.y >= floor) {
        this.y = floor; this.vy = 0; this.vx = 0; this.grounded = true; this.sq = 0.22;
        shake(12); sfx('stomp');
        L.burst(this.x - 60, floor, 'dust', 8); L.burst(this.x + 60, floor, 'dust', 8);
        if (p.onGround && Math.abs(p.cx - this.x) < 260 && !p.dead) L.hurt(this.x);
        if (L.critters.filter((c) => !c.asleep && !c.dead).length < 2) {
          const c = new Critter('grub', Math.floor(this.x / T) + (Math.random() < 0.5 ? -3 : 3), L.h - 3);
          c.vx = (p.cx < this.x ? -1 : 1) * 55; L.critters.push(c); L.ents.push(c);
        }
        this.setState('tired');
      }
    } else if (this.state === 'tired' && this.st > 2.4 - (3 - this.hp) * 0.4) this.setState('idle');
    else if (this.state === 'hurt' && this.st > 1) this.setState('idle');
    else if (this.state === 'defeated') { this.sq = Math.sin(this.st * 20) * 0.05 * Math.max(0, 1 - this.st); }

    if (this.state !== 'defeated' && this.state !== 'wait' && !p.dead) {
      const onTop = p.vy > 0 && Math.abs(p.cx - this.x) < this.W2 - 10 && p.bottom >= this.top && p.bottom - p.vy * dt <= this.top + 18;
      if (onTop) {
        p.y = this.top - p.h; p.bounce(900);
        if (this.state !== 'hurt') this.damage(L); else sfx('boing');
      } else if (p.x + p.w > this.x - this.W2 + 12 && p.x < this.x + this.W2 - 12 && p.bottom > this.top + 30 && p.y < this.y) L.hurt(this.x);
    }
  }
  draw(ctx, L) {
    if ((this.state === 'crouch' || this.state === 'hop') && this.target != null) {
      const a = this.state === 'crouch' ? 0.15 + this.st * 0.3 : 0.4;
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#3b2a26';
      ctx.beginPath(); ctx.ellipse(this.target - L.camX, (L.h - 2) * T - L.camY + 4, this.W2 + 10, 12, 0, 0, 7); ctx.fill();
      ctx.restore();
    }
    const s = this.state === 'defeated' ? Math.max(0.35, 1 - this.st * 0.6) : 1;
    drawPumpkin(ctx, this.x - L.camX, this.y - L.camY, {
      squash: this.sq, flash: this.flash > 0 && Math.floor(this.flash * 20) % 2 === 0, t: this.t, boil: engine.boil, scale: s,
      glow: this.state === 'tired', face: this.state === 'hurt' || this.state === 'defeated' ? 'dizzy' : 'angry',
    });
    if (this.state === 'wait' || this.state === 'defeated') return;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < this.hp ? '#e2574c' : 'rgba(0,0,0,0.15)';
      ctx.beginPath(); ctx.arc(this.x - L.camX - 24 + i * 24, this.top - L.camY - 52, 7, 0, 7); ctx.fill();
    }
  }
}
export { drawZ };
