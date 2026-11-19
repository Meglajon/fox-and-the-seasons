// Millpond + Copperleaf objects: gust vents, Old Pike, the Prize Scarecrow and diving crows.
import { T } from '../art/tiles.js';
import { clamp, overlap } from '../core/util.js';
import { sfx } from '../audio/sfx.js';
import { engine, shake } from '../core/engine.js';
import { drawVent, drawPike, drawScarecrow, drawCrow, drawBurrow, drawStarbloom, SCARE_H, SCARE_ARM_Y, SCARE_ARM_LEN } from '../art/critters2.js';
import { input } from '../core/input.js';
import { text } from '../art/ink.js';
import { fmt } from '../ui/ui.js';
import { drawHeatVent } from '../art/critters3.js';

// ---------------- gust vent (Autumn) ----------------
export class Vent {
  // season 'autumn' = a gust vent, 'summer' = a heat grate (rising hot air).
  constructor(tx, row, L, season = 'autumn') {
    this.cx = tx * T + T / 2; this.base = (row + 1) * T; this.t = 0; this.active = false; this.season = season;
    let r = row - 1, n = 0;
    while (n < 8 && r >= 0 && !L.solid(tx, r)) { n++; r--; }
    this.h = n * T + 30;
  }
  update(dt, L) {
    this.t += dt;
    const p = L.player;
    // Vents wake up whenever Autumn is active nearby.
    this.active = p.season === this.season && !p.dead && Math.abs(p.cx - this.cx) < 360 && p.cy > this.base - this.h - 360 && p.cy < this.base + 200;
    if (!this.active) return;
    if (Math.abs(p.cx - this.cx) < 34 && p.bottom <= this.base + 4 && p.bottom > this.base - this.h) {
      p.vy = Math.max(p.vy - 3900 * dt, -660);
      // The gust catches you: sideways drift is steadied while riding up (steer off near the top).
      if (p.bottom > this.base - this.h + 70) {
        p.vx *= Math.pow(0.004, dt);
        p.x += (this.cx - p.cx) * Math.min(1, dt * 6);
      }
      p.onGround = false; p.coyote = 0; p.bounceHold = 0.12; p.inGust = 0.1;
      if (Math.random() < dt * 20) L.parts.push({ type: this.season === 'summer' ? 'ember' : 'leaf', x: this.cx + (Math.random() - 0.5) * 40, y: p.bottom, vx: 0, vy: -260, life: 0.8, max: 0.8, rot: 0 });
    }
  }
  draw(ctx, L) { (this.season === 'summer' ? drawHeatVent : drawVent)(ctx, this.cx - L.camX, this.base - L.camY, this.active, this.t, engine.boil, this.h); }
  light() { return this.season === 'summer' ? { x: this.cx, y: this.base - 20, r: this.active ? 110 : 60 } : null; }
}

// ---------------- Old Pike (Millpond Reach boss) ----------------
export class Pike {
  constructor(L) {
    // Find the pond: the top row of water tiles.
    let row = -1, x0 = 1e9, x1 = -1;
    for (let y = 0; y < L.h && row < 0; y++) for (let x = 0; x < L.w; x++) if (L.tiles[y][x] === '~' && (y === 0 || L.tiles[y - 1][x] !== '~')) { row = y; break; }
    for (let x = 0; x < L.w; x++) if (L.tiles[row][x] === '~') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    this.row = row; this.surf = row * T; this.px0 = x0; this.px1 = x1;
    this.x = ((x0 + x1 + 1) / 2) * T; this.y = this.surf + 60; this.vx = 0; this.vy = 0; this.rot = 0;
    this.hp = 3; this.state = 'wait'; this.st = 0; this.t = 0; this.flash = 0; this.facing = 1; this.dead = false;
  }
  get top() { return this.surf - 80; }
  setState(s) { this.state = s; this.st = 0; }
  start(L) { this.L = L; this.setState('under'); this.pickTarget(L?.player); }
  pickTarget(p) {
    const px = p ? p.cx / T : (this.px0 + this.px1) / 2;
    const tx = clamp(Math.round(px + (Math.random() - 0.5) * 4), this.px0, this.px1);
    this.tx = tx; this.x = tx * T + T / 2;
  }
  frozenAt(x) { return this.L.isActive(Math.floor(x / T), this.row); }
  hitBy() { return false; }
  damage(L) {
    this.hp--; this.flash = 0.4; shake(10); sfx('bosshit');
    L.burst(this.x, this.surf - 30, 'spark', 14);
    if (this.hp <= 0) { this.setState('defeated'); L.bossDefeated(); } else this.setState('hurt');
  }
  update(dt, L) {
    this.L = L;
    this.t += dt; this.st += dt; this.flash = Math.max(0, this.flash - dt);
    const p = L.player;
    const speed = 1 + (3 - this.hp) * 0.25;
    if (this.state === 'under') {
      if (Math.random() < dt * 12) L.parts.push({ type: 'bubble', x: this.x + (Math.random() - 0.5) * 50, y: this.surf + 6, vx: 0, vy: -40, life: 0.6, max: 0.6, rot: 0 });
      if (this.st > 1.9 / speed) {
        if (this.frozenAt(this.x)) { this.setState('stuck'); sfx('stomp'); shake(6); L.burst(this.x, this.surf, 'snow', 12); }
        else { this.setState('leap'); this.y = this.surf + 20; this.vy = -1080; this.vx = Math.sign(p.cx - this.x || 1) * 170; this.facing = Math.sign(this.vx); sfx('splash'); L.burst(this.x, this.surf, 'splash', 14); }
      }
    } else if (this.state === 'leap') {
      this.vy += 2000 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
      this.rot = Math.atan2(this.vy, Math.abs(this.vx) * 3) * this.facing;
      this.x = clamp(this.x, 2 * T, (L.w - 2) * T);
      if (this.vy > 0 && this.y >= this.surf - 10) {
        const tx = Math.floor(this.x / T);
        const c = L.tiles[this.row]?.[tx];
        if (c === '~' && !L.isActive(tx, this.row)) { this.setState('under'); this.pickTarget(p); sfx('splash'); L.burst(this.x, this.surf, 'splash', 14); }
        else { this.y = this.surf - 26; this.rot = 0; this.setState('flop'); sfx('stomp'); shake(6); }
      }
      // Contact while leaping hurts.
      if (!p.dead && Math.abs(p.cx - this.x) < 60 && Math.abs(p.cy - this.y) < 34) L.hurt(this.x);
    } else if (this.state === 'stuck' || this.state === 'flop') {
      const limit = this.state === 'stuck' ? 3 : 2.6;
      if (this.state === 'stuck' && !this.frozenAt(this.x) && this.st > 0.4) this.st = limit;
      if (this.st >= limit) { this.setState('under'); this.pickTarget(p); sfx('splash'); }
      const topY = this.state === 'stuck' ? this.surf - 78 : this.surf - 50;
      const half = this.state === 'stuck' ? 34 : 64;
      if (!p.dead && p.vy > 0 && Math.abs(p.cx - this.x) < half && p.bottom >= topY && p.bottom - p.vy * dt <= topY + 18) {
        p.y = topY - p.h; p.bounce(820); this.damage(L);
      }
    } else if (this.state === 'hurt') {
      if (this.st > 0.9) { this.setState('under'); this.pickTarget(p); }
    } else if (this.state === 'defeated') {
      this.y = this.surf - 10; this.rot = Math.PI;
    }
  }
  draw(ctx, L) {
    const sx = this.x - L.camX;
    if (this.state === 'under') {
      ctx.save(); ctx.globalAlpha = 0.25 + Math.sin(this.t * 8) * 0.1;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(sx, this.surf - L.camY + 8, 30 + Math.sin(this.t * 6) * 6, 6, 0, 0, 7); ctx.stroke();
      ctx.restore();
      return;
    }
    const o = { facing: this.facing, boil: engine.boil, flash: this.flash > 0 && Math.floor(this.flash * 20) % 2 === 0, dizzy: this.state === 'hurt' || this.state === 'defeated' || this.state === 'stuck' };
    if (this.state === 'stuck') {
      ctx.save(); ctx.beginPath(); ctx.rect(sx - 120, 0, 240, this.surf - L.camY + 4); ctx.clip();
      drawPike(ctx, sx, this.surf - L.camY + 4, { ...o, rot: -Math.PI / 2 });
      ctx.restore();
    } else if (this.state === 'flop') drawPike(ctx, sx, this.surf - L.camY - 24 + Math.abs(Math.sin(this.t * 10)) * -6, o);
    else if (this.state === 'defeated') drawPike(ctx, sx, this.surf - L.camY - 6, { ...o, rot: Math.PI, dizzy: true });
    else drawPike(ctx, sx, this.y - L.camY, { ...o, rot: this.rot });
    if (this.state !== 'defeated') {
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < this.hp ? '#e2574c' : 'rgba(0,0,0,0.15)';
        ctx.beginPath(); ctx.arc(sx - 24 + i * 24, this.surf - L.camY - 120, 7, 0, 7); ctx.fill();
      }
    }
  }
}

// ---------------- Mrs. Rook's Prize Scarecrow (Copperleaf boss) ----------------
export class Scarecrow {
  constructor(L) {
    this.x = (L.w * T) / 2; this.base = (L.h - 2) * T;
    this.hp = 3; this.state = 'wait'; this.st = 0; this.t = 0; this.flash = 0; this.ang = 0; this.phase = 0; this.crowT = 4; this.dead = false;
  }
  get top() { return this.base - SCARE_H; }
  get hatY() { return this.base - SCARE_H + 8; }
  setState(s) { this.state = s; this.st = 0; }
  start() { this.setState('sway'); }
  hitBy() { return false; }
  damage(L) {
    this.hp--; this.flash = 0.4; shake(10); sfx('bosshit');
    L.burst(this.x, this.hatY, 'leaf', 16);
    if (this.hp <= 0) { this.setState('defeated'); L.bossDefeated(); } else this.setState('hurt');
  }
  armHit(p) {
    const cy = this.base - SCARE_ARM_Y;
    const dx = Math.cos(this.ang), dy = Math.sin(this.ang);
    const px = p.cx - this.x, py = p.cy - cy;
    const along = clamp(px * dx + py * dy, -SCARE_ARM_LEN - 24, SCARE_ARM_LEN + 24);
    const qx = along * dx - px, qy = along * dy - py;
    return Math.hypot(qx, qy) < 19;
  }
  update(dt, L) {
    this.t += dt; this.st += dt; this.flash = Math.max(0, this.flash - dt);
    const p = L.player;
    const speed = 1 + (3 - this.hp) * 0.35;
    if (this.state === 'sway') {
      this.phase += dt * 1.1 * speed;
      this.ang = Math.sin(this.phase) * 0.95;
      this.crowT -= dt;
      if (this.crowT <= 0) { this.crowT = 4.6 / speed; L.ents.push(new CrowDive(L, p)); sfx('crow'); }
    } else if (this.state === 'hurt') {
      this.ang *= Math.pow(0.05, dt);
      if (this.st > 1.1) this.setState('sway');
    } else if (this.state === 'defeated') {
      this.ang *= Math.pow(0.05, dt);
      return;
    }
    if (this.state === 'wait' || p.dead) return;
    // Landing on the hat = a bop.
    if (this.state === 'sway' && p.vy > 0 && Math.abs(p.cx - this.x) < 52 && p.bottom >= this.hatY && p.bottom - p.vy * dt <= this.hatY + 18) {
      p.y = this.hatY - p.h; p.bounce(860); this.damage(L);
      return;
    }
    if (this.state === 'sway' && this.armHit(p)) L.hurt(this.x);
  }
  draw(ctx, L) {
    drawScarecrow(ctx, this.x - L.camX, this.base - L.camY, {
      t: this.t, boil: engine.boil, armAngle: this.ang, glow: this.state === 'sway', flash: this.flash > 0 && Math.floor(this.flash * 20) % 2 === 0,
      dizzy: this.state !== 'sway' && this.state !== 'wait', hatless: this.state === 'defeated',
    });
    if (this.state !== 'defeated') {
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < this.hp ? '#e2574c' : 'rgba(0,0,0,0.15)';
        ctx.beginPath(); ctx.arc(this.x - L.camX - 24 + i * 24, this.top - L.camY - 24, 7, 0, 7); ctx.fill();
      }
    }
  }
}

// A crow swooping from a top corner toward where Fennel was. Bop it to send it off.
export class CrowDive {
  constructor(L, p) {
    const fromLeft = Math.random() < 0.5;
    this.x = L.camX + (fromLeft ? -40 : 1000); this.y = L.camY + 60;
    const tx = p.cx, ty = p.cy;
    const d = Math.hypot(tx - this.x, ty - this.y) || 1;
    this.vx = ((tx - this.x) / d) * 270; this.vy = ((ty - this.y) / d) * 270;
    this.w = 34; this.h = 20; this.t = 0; this.dead = false; this.hurts = true;
    this.x -= this.w / 2; this.y -= this.h / 2; // x, y = top-left corner, like every other hitbox
  }
  update(dt, L) {
    this.t += dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    const p = L.player, cx = this.x + this.w / 2;
    if (!p.dead && p.vy > 0 && Math.abs(p.cx - cx) < 26 && p.bottom > this.y - 4 && p.bottom - p.vy * dt <= this.y + 8) {
      p.bounce(600); this.dead = true; sfx('bop'); L.burst(cx, this.y, 'dust', 8);
    }
    if (this.t > 8) this.dead = true;
  }
  draw(ctx, L) {
    const s = this.vx < 0 ? -1 : 1;
    ctx.save(); ctx.translate(this.x + this.w / 2 - L.camX, this.y + this.h / 2 - L.camY); ctx.scale(s, 1);
    drawCrow(ctx, 0, 0, { t: this.t, boil: engine.boil, rot: Math.atan2(this.vy, Math.abs(this.vx)) * 0.5 });
    ctx.restore();
  }
}

// ---------------- secret burrows + the Starbloom ----------------

// 'H' in a level: a hidden burrow leading to a secret puzzle room. 'X' in a secret room: the way back out.
export class Burrow {
  constructor(tx, row, exit) { this.cx = tx * T + T / 2; this.base = (row + 1) * T; this.exit = exit; this.t = 0; this.near = false; }
  update(dt, L) {
    this.t += dt;
    const p = L.player;
    this.near = !p.dead && Math.abs(p.cx - this.cx) < 30 && Math.abs(p.bottom - this.base) < 12 && p.onGround;
    if (this.near && input.pressed('up') && L.state === 'play') L.useBurrow(this);
  }
  light() { return { x: this.cx, y: this.base - 20, r: 70 }; }
  draw(ctx, L) {
    drawBurrow(ctx, this.cx - L.camX, this.base - L.camY, { boil: engine.boil, t: this.t, glint: !this.exit });
    if (this.near) text(ctx, fmt('{up}') + (this.exit ? ' Leave' : ' Peek inside'), this.cx - L.camX, this.base - L.camY - 58, { size: 18, align: 'center', outline: '#fffaf0', ui: true });
  }
}

export class Starbloom {
  constructor(tx, row) { this.x = tx * T + 6; this.y = row * T + 4; this.w = 36; this.h = 40; this.t = 0; this.dead = false; }
  update(dt, L) { this.t += dt; if (overlap(this, L.player) && !L.player.dead) { this.dead = true; L.gotStarbloom(this.x + 18, this.y + 20); } }
  light() { return { x: this.x + 18, y: this.y + 20, r: 130 }; }
  draw(ctx, L) { drawStarbloom(ctx, this.x + 18 - L.camX, this.y + 22 - L.camY + Math.sin(this.t * 2.5) * 4, this.t, engine.boil); }
}
