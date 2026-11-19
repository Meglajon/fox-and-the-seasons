// Sunglass Greenhouse boss: the Sunlamp Moth. It loves light, so switching to Summer makes it dive
// at you. Keep it in your warmth to melt its ice shield, then bop it while it's dazed.
import { T } from '../art/tiles.js';
import { clamp } from '../core/util.js';
import { sfx } from '../audio/sfx.js';
import { engine, shake } from '../core/engine.js';
import { drawSunMoth, drawFrostFlake } from '../art/critters3.js';

export class SunMoth {
  constructor(L) {
    this.L = L;
    this.base = (L.h - 2) * T;
    this.midX = (L.w * T) / 2;
    this.x = this.midX; this.y = this.base - 320;
    this.hp = 3; this.shield = 1; this.state = 'wait'; this.st = 0; this.t = 0; this.phase = 0;
    this.flash = 0; this.attract = 0; this.flakeT = 2; this.dead = false; this.vx = 0; this.vy = 0; this.cold = 0;
  }
  get top() { return this.y - 40; }
  get speed() { return 1 + (3 - this.hp) * 0.25; }
  setState(s) { this.state = s; this.st = 0; }
  start() { this.setState('hover'); }
  hitBy() { return false; }
  light() { return { x: this.x, y: this.y, r: this.state === 'dazed' ? 150 : 175 }; }
  summerOn(p) { return p.season === 'summer' && !p.dead && p.charm <= 0; }
  damage(L) {
    this.hp--; this.flash = 0.5; shake(10); sfx('bosshit');
    L.burst(this.x, this.y - 20, 'spark', 16);
    if (this.hp <= 0) { this.setState('defeated'); L.bossDefeated(); } else this.setState('hurt');
  }
  update(dt, L) {
    this.L = L;
    this.t += dt; this.st += dt; this.flash = Math.max(0, this.flash - dt);
    const p = L.player, sp = this.speed;
    const hoverY = this.base - 330;
    if (this.state === 'wait') return;
    if (this.state === 'hover') {
      this.phase += dt * 0.8 * sp;
      const tx = this.midX + Math.sin(this.phase) * (L.w * T * 0.33), ty = hoverY + Math.sin(this.phase * 2) * 40;
      this.x += (tx - this.x) * Math.min(1, dt * 3); this.y += (ty - this.y) * Math.min(1, dt * 3);
      this.flakeT -= dt;
      if (this.flakeT <= 0) {
        this.flakeT = 2.3 / sp;
        L.ents.push(new FrostFlake(this.x, this.y + 30, clamp((p.cx - this.x) * 0.25, -120, 120)));
        if (this.hp < 3) L.ents.push(new FrostFlake(this.x, this.y + 30, -clamp((p.cx - this.x) * 0.25, -120, 120) * 0.5 + (Math.random() - 0.5) * 120));
      }
      // Light draws it in.
      this.attract = this.summerOn(p) ? this.attract + dt : Math.max(0, this.attract - dt * 2);
      if (this.attract > 0.9 / sp) { this.attract = 0; this.setState('windup'); this.tx = p.cx; this.ty = Math.min(p.cy, this.base - 70); sfx('flutter'); }
    } else if (this.state === 'windup') {
      this.x += Math.sin(this.t * 60) * 1.5;
      this.tx = p.cx; this.ty = Math.min(p.cy, this.base - 70);
      if (this.st > 0.7) {
        const d = Math.hypot(this.tx - this.x, this.ty - this.y) || 1;
        const v = 560 * (0.85 + sp * 0.15);
        this.vx = ((this.tx - this.x) / d) * v; this.vy = ((this.ty - this.y) / d) * v;
        this.setState('dive');
      }
    } else if (this.state === 'dive') {
      this.x += this.vx * dt; this.y += this.vy * dt;
      this.x = clamp(this.x, 1.5 * T + 40, (L.w - 1.5) * T - 40);
      if (this.y >= this.base - 80 || this.st > 1.4 || Math.hypot(this.tx - this.x, this.ty - this.y) < 24) {
        this.y = Math.min(this.y, this.base - 80); this.setState('flutter'); this.cold = 0;
      }
    } else if (this.state === 'flutter') {
      // Lingers low, drifting toward your light. Keep it in your Summer warmth to melt the shield.
      const ty = this.base - 95 + Math.sin(this.t * 3) * 10;
      this.y += (ty - this.y) * Math.min(1, dt * 3);
      this.x += clamp(p.cx - this.x, -1, 1) * 55 * sp * dt;
      this.x = clamp(this.x, 1.5 * T + 40, (L.w - 1.5) * T - 40);
      const warm = this.summerOn(p) && Math.hypot(p.cx - this.x, p.cy - this.y) < p.bubble + 40;
      if (warm) {
        this.shield -= dt * 0.75;
        if (Math.random() < dt * 20) L.parts.push({ type: 'steam', x: this.x + (Math.random() - 0.5) * 90, y: this.y + (Math.random() - 0.5) * 70, vx: 0, vy: -60, life: 0.7, max: 0.7, rot: 0 });
        if (Math.random() < dt * 3) sfx('melt');
      }
      this.cold = this.summerOn(p) ? 0 : this.cold + dt;
      if (this.shield <= 0) { this.shield = 0; this.setState('dazed'); sfx('crack'); L.burst(this.x, this.y, 'snow', 18); }
      else if (this.cold > 1.2 || this.st > 6) this.setState('rise');
    } else if (this.state === 'dazed') {
      const ty = this.base - 62 + Math.sin(this.t * 4) * 4;
      this.y += (ty - this.y) * Math.min(1, dt * 4);
      if (!p.dead && p.vy > 0 && Math.abs(p.cx - this.x) < 52 && p.bottom >= this.y - 44 && p.bottom - p.vy * dt <= this.y - 44 + 20) {
        p.y = this.y - 44 - p.h; p.bounce(820); this.damage(L);
        return;
      }
      if (this.st > 3.4) this.setState('rise');
    } else if (this.state === 'hurt') {
      this.y -= 40 * dt;
      if (this.st > 0.9) this.setState('rise');
    } else if (this.state === 'rise') {
      this.shield = Math.min(1, this.shield + dt * 0.9);
      this.y += (hoverY - this.y) * Math.min(1, dt * 2);
      if (Math.abs(this.y - hoverY) < 20 && this.shield >= 1) { this.setState('hover'); this.attract = 0; this.flakeT = 1.2; }
    } else if (this.state === 'defeated') {
      this.y += (this.base - 60 - this.y) * Math.min(1, dt * 2);
      return;
    }
    // Touching the moth while it's shielded and flapping hurts.
    if (!p.dead && this.state !== 'dazed' && this.state !== 'hurt' && Math.hypot(p.cx - this.x, p.cy - this.y) < 50) L.hurt(this.x);
  }
  draw(ctx, L) {
    drawSunMoth(ctx, this.x - L.camX, this.y - L.camY, {
      t: this.t, boil: engine.boil, shield: this.shield, dazed: this.state === 'dazed' || this.state === 'defeated' || this.state === 'hurt',
      flash: this.flash > 0 && Math.floor(this.flash * 20) % 2 === 0, rot: this.state === 'windup' ? Math.sin(this.t * 40) * 0.06 : 0,
    });
    if (this.state !== 'defeated') {
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < this.hp ? '#e2574c' : 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.arc(this.x - L.camX - 24 + i * 24, this.y - L.camY - 92, 7, 0, 7); ctx.fill();
      }
    }
  }
}

// A falling frost flake. It melts if it drifts into Summer's warmth.
export class FrostFlake {
  constructor(x, y, vx) { this.x = x - 9; this.y = y - 9; this.w = 18; this.h = 18; this.vx = vx; this.vy = 70; this.t = 0; this.dead = false; this.hurts = true; }
  update(dt, L) {
    this.t += dt;
    this.x += (this.vx + Math.sin(this.t * 3) * 40) * dt; this.y += this.vy * dt;
    this.vy = Math.min(this.vy + 40 * dt, 150);
    if (L.summerAt(this.x + 9, this.y + 9)) { this.dead = true; L.parts.push({ type: 'steam', x: this.x + 9, y: this.y + 9, vx: 0, vy: -40, life: 0.6, max: 0.6, rot: 0 }); return; }
    if (L.solidPx(this.x + 9, this.y + 16) || this.t > 9) { this.dead = true; L.burst(this.x + 9, this.y + 9, 'frost', 5); }
  }
  draw(ctx, L) { drawFrostFlake(ctx, this.x + 9 - L.camX, this.y + 9 - L.camY, this.t); }
  light() { return { x: this.x + 9, y: this.y + 9, r: 40 }; }
}
