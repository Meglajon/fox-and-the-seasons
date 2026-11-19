// Fennel's movement: run, sprint, variable jump, coyote time, jump buffer, wall jumps, vines, seasons.
import { input } from '../core/input.js';
import { approach } from '../core/util.js';
import { state } from '../core/state.js';
import { sfx } from '../audio/sfx.js';
import { SEASON_ORDER } from '../art/palettes.js';

export const BUBBLE_R = 170;
export const JUMP_V = 860;

export class Player {
  constructor(feetX, feetY) {
    this.w = 26; this.h = 40;
    this.x = feetX - this.w / 2; this.y = feetY - this.h;
    this.vx = 0; this.vy = 0; this.facing = 1;
    this.onGround = false; this.coyote = 0; this.buffer = 0; this.lock = 0; this.lockDir = 0;
    this.wall = 0; this.climb = null; this.carry = null;
    this.inv = 0; this.charm = 0; this.season = null; this.lastSeason = null; this.bubble = 0;
    this.t = 0; this.phase = 0; this.squash = 0; this.bounceHold = 0;
    this.dead = false; this.frozen = false; this.star = 0;
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get bottom() { return this.y + this.h; }

  setSeason(s, quiet) {
    this.season = s; this.lastSeason = s;
    if (!quiet) sfx(s ? 'season' : 'seasonoff');
  }
  cycleSeason(dir) {
    const owned = ['none', ...SEASON_ORDER.filter((s) => state.data.stones[s])];
    if (owned.length < 2) return;
    if (this.charm > 0) { sfx('deny'); return; }
    let i = owned.indexOf(this.season || 'none');
    i = (i + dir + owned.length) % owned.length;
    this.setSeason(owned[i] === 'none' ? null : owned[i]);
  }

  update(dt, world) {
    this.t += dt;
    if (this.inv > 0) this.inv -= dt;
    if (this.star > 0) this.star -= dt;
    if (this.charm > 0) {
      this.charm -= dt;
      if (this.charm <= 0 && this.lastSeason) { this.season = this.lastSeason; sfx('season'); }
    }
    this.squash *= Math.pow(0.002, dt);
    this.bubble = approach(this.bubble, this.season ? BUBBLE_R : 0, dt * 1000);
    if (this.frozen) {
      this.vx = approach(this.vx, 0, 2000 * dt);
      this.vy = Math.min(this.vy + 2400 * dt, 920);
      world.move(this, dt);
      return;
    }
    if (world.canSeason && (input.pressed('next') || input.pressed('prev'))) this.cycleSeason(input.pressed('next') ? 1 : -1);
    if (this.climb) { this.updateClimb(dt); return; }

    const sprint = input.down('sprint');
    let dir = (input.down('right') ? 1 : 0) - (input.down('left') ? 1 : 0);
    if (this.lock > 0) { this.lock -= dt; dir = this.lockDir; }
    // Mud: sticky and slow. You can hop out once; stay in too long and you sink.
    const mudDepth = world.inMud ? world.inMud(this) : -1;
    this.inMudNow = mudDepth >= 0;
    if (this.onGround) this.mudHops = 0;
    const maxV = (sprint ? 370 : 240) * (this.star > 0 ? 1.25 : 1) * (this.inMudNow ? 0.3 : 1);
    // Frozen water and ice floes are slippery: slow to start, slow to stop.
    const ice = this.onGround && world.onIce?.(this);
    if (dir) {
      const turning = Math.sign(this.vx) === -dir;
      const acc = this.onGround ? (ice ? 650 : turning ? 3000 : 1600) : 1150;
      if (Math.abs(this.vx) <= maxV || turning) this.vx = approach(this.vx, dir * maxV, acc * dt);
      else this.vx = approach(this.vx, dir * maxV, 500 * dt);
      this.facing = dir;
    } else {
      this.vx = approach(this.vx, 0, (this.onGround ? (ice ? 260 : 1800) : 380) * dt);
    }

    const holding = input.down('jump');
    if (this.bounceHold > 0) this.bounceHold -= dt;
    if (this.inGust > 0) this.inGust -= dt;
    const g = this.vy < 0 ? (holding || this.bounceHold > 0 ? 2200 : 4800) : 2400;
    this.vy = Math.min(this.vy + g * dt, 920);
    // Autumn: hold jump while falling to glide on a leaf.
    this.gliding = this.season === 'autumn' && !this.onGround && this.vy > 0 && holding && !this.climb;
    if (this.gliding) this.vy = Math.min(this.vy, 120);
    // Running water in a waterfall pushes you down.
    if (world.inWaterfall?.(this)) this.vy = Math.min(this.vy + 1600 * dt, 520);
    if (this.inMudNow) {
      if (this.vy > 32) { if (this.vy > 300) world.mudSplat?.(this); this.vy = 32; }
      this.gliding = false;
    }

    this.wall = 0;
    if (!this.onGround && this.vy > -80 && dir && world.touchWall(this, dir)) {
      this.wall = dir;
      if (this.vy > 130) this.vy = 130;
    }

    if (input.pressed('jump')) this.buffer = 0.13; else this.buffer -= dt;
    this.coyote = this.onGround ? 0.1 : this.coyote - dt;
    if (this.buffer > 0) {
      if (this.coyote > 0) {
        this.vy = -(JUMP_V + Math.abs(this.vx) * 0.15);
        this.coyote = 0; this.buffer = 0; this.squash = -0.18; this.onGround = false;
        sfx('jump');
      } else if (this.inMudNow && (this.mudHops || 0) < 1) {
        this.vy = -660; this.mudHops = (this.mudHops || 0) + 1; this.buffer = 0; this.squash = -0.18;
        sfx('squelch');
      } else {
        const wd = world.touchWall(this, 1) ? 1 : world.touchWall(this, -1) ? -1 : 0;
        if (wd) {
          this.vy = -780; this.vx = -wd * 320;
          this.lock = 0.14; this.lockDir = -wd; this.facing = -wd; this.buffer = 0;
          sfx('walljump');
          world.dust?.(this.cx + wd * 13, this.cy, 4);
        }
      }
    }

    const was = this.onGround;
    world.move(this, dt);
    if (this.onGround && !was) {
      this.squash = 0.2;
      if (this.landVy > 300) { sfx('land'); world.dust?.(this.cx, this.bottom, 5); }
    }
    this.landVy = this.vy;
    if (this.onGround) this.phase += Math.abs(this.vx) * dt * 0.05;
  }

  bounce(v) {
    this.vy = -(input.down('jump') ? v * 1.16 : v);
    this.bounceHold = 0.4; this.onGround = false; this.coyote = 0; this.squash = -0.25;
  }

  updateClimb(dt) {
    const v = this.climb;
    if (!v.climbable()) { this.climb = null; return; }
    this.vx = 0; this.vy = 0;
    this.x = v.cx - this.w / 2;
    const up = input.down('up'), dn = input.down('down');
    this.y += ((dn ? 1 : 0) - (up ? 1 : 0)) * 190 * dt;
    const top = v.topY();
    if (this.bottom < top + 10) this.y = top + 10 - this.h;
    if (this.bottom > v.baseY) { this.y = v.baseY - this.h; if (dn) this.climb = null; }
    if (up || dn) this.phase += dt * 9;
    if (input.pressed('jump')) {
      this.climb = null;
      this.vy = -760;
      this.vx = ((input.down('right') ? 1 : 0) - (input.down('left') ? 1 : 0)) * 230;
      sfx('jump');
    }
  }

  pose() {
    if (this.dead) return 'hurt';
    if (this.climb) return 'climb';
    if (!this.onGround) return this.wall ? 'fall' : this.vy < 0 ? 'jump' : 'fall';
    if (Math.abs(this.vx) > 20) return 'run';
    return 'idle';
  }
}
