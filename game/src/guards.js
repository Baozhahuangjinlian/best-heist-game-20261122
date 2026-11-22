// guards.js — the people and machines watching the room: a patrolling guard
// with a vision cone, and a wall camera that sweeps its cone back and forth.
// Detection itself lives in vision.js; here is the movement and the state.

import { GUARD, CAMERA } from './config.js';
import { inCone, moveCircle } from './vision.js';

// A guard walks a loop of waypoints, waits at each one and looks around,
// hurries to a tossed coin when it lands nearby, then walks back.
export class Guard {
  constructor(def) {
    this.path = def.path;
    this.wp = def.startIndex || 0;
    this.x = this.path[this.wp][0];
    this.y = this.path[this.wp][1];
    this.speed = GUARD.patrolSpeed;
    this.angle = 0; // facing, radians; set on first update
    this.mode = 'patrol'; // patrol | pause | lure | stare | back
    this.wait = 0;
    this.scanBase = 0;
    this.scanT = 0;
    this.lure = null; // {x, y} when a coin called
    this.alerted = false; // true while it can see the thief
    this.faceTarget();
  }

  faceTarget() {
    const next = this.path[(this.wp + 1) % this.path.length];
    this.angle = Math.atan2(next[1] - this.y, next[0] - this.x);
    this.scanBase = this.angle;
  }

  update(dt, solids) {
    if (this.mode === 'patrol') {
      const target = this.path[(this.wp + 1) % this.path.length];
      const dx = target[0] - this.x;
      const dy = target[1] - this.y;
      const d = Math.hypot(dx, dy);
      const step = this.speed * dt;
      if (d <= step + 1) {
        this.x = target[0];
        this.y = target[1];
        this.wp = (this.wp + 1) % this.path.length;
        this.mode = 'pause';
        this.wait = GUARD.scanPause;
        this.scanT = 0;
        this.scanBase = this.angle;
      } else {
        const nx = this.x + (dx / d) * step;
        const ny = this.y + (dy / d) * step;
        const pos = moveCircle(this.x, this.y, GUARD.radius, nx - this.x, ny - this.y, solids);
        this.x = pos.x;
        this.y = pos.y;
        this.angle = Math.atan2(dy, dx);
        this.scanBase = this.angle;
      }
    } else if (this.mode === 'pause') {
      // Look around while waiting, like a guard checking the room.
      this.wait -= dt;
      this.scanT += dt;
      this.angle = this.scanBase + Math.sin(this.scanT * 2.2) * GUARD.scanSwing;
      if (this.wait <= 0) {
        this.mode = 'patrol';
        this.faceTarget();
      }
    } else if (this.mode === 'lure') {
      const dx = this.lure.x - this.x;
      const dy = this.lure.y - this.y;
      const d = Math.hypot(dx, dy);
      const step = GUARD.luredSpeed * dt;
      if (d <= step + 2) {
        this.x = this.lure.x;
        this.y = this.lure.y;
        this.mode = 'stare';
        this.wait = GUARD.investigateTime;
        this.scanBase = this.angle;
        this.scanT = 0;
      } else {
        const nx = this.x + (dx / d) * step;
        const ny = this.y + (dy / d) * step;
        const pos = moveCircle(this.x, this.y, GUARD.radius, nx - this.x, ny - this.y, solids);
        this.x = pos.x;
        this.y = pos.y;
        this.angle = Math.atan2(dy, dx);
      }
    } else if (this.mode === 'stare') {
      this.wait -= dt;
      this.scanT += dt;
      this.angle = this.scanBase + Math.sin(this.scanT * 3.0) * 0.9;
      if (this.wait <= 0) {
        this.mode = 'back';
      }
    } else if (this.mode === 'back') {
      // Walk to the nearest waypoint, then fall back into the patrol loop.
      let best = 0;
      let bestD = Infinity;
      this.path.forEach((p, i) => {
        const d = Math.hypot(p[0] - this.x, p[1] - this.y);
        if (d < bestD) { bestD = d; best = i; }
      });
      const target = this.path[best];
      const dx = target[0] - this.x;
      const dy = target[1] - this.y;
      const d = Math.hypot(dx, dy);
      const step = this.speed * dt;
      if (d <= step + 2) {
        this.x = target[0];
        this.y = target[1];
        this.wp = best;
        this.mode = 'patrol';
        this.faceTarget();
      } else {
        const nx = this.x + (dx / d) * step;
        const ny = this.y + (dy / d) * step;
        const pos = moveCircle(this.x, this.y, GUARD.radius, nx - this.x, ny - this.y, solids);
        this.x = pos.x;
        this.y = pos.y;
        this.angle = Math.atan2(dy, dx);
      }
    }
  }

  // A coin landing nearby pulls this guard off its patrol.
  hearCoin(x, y) {
    if (Math.hypot(x - this.x, y - this.y) > 300) return;
    this.lure = { x, y };
    this.mode = 'lure';
  }

  sees(px, py, solids) {
    // Close enough to touch is always a spot, cone or not.
    if (Math.hypot(px - this.x, py - this.y) <= GUARD.proximitySpot) return true;
    return inCone(px, py, this.x, this.y, this.angle, GUARD.coneHalfAngle, GUARD.coneRange, solids);
  }
}

// A camera is bolted to a wall and sweeps its cone. An EMP pulse turns it
// off for a while; while off it sees nothing and its cone goes grey.
export class Camera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.baseAngle = def.baseAngle;
    this.sweepSpeed = def.sweepSpeed;
    this.phase = def.phase;
    this.t = 0;
    this.angle = def.baseAngle;
    this.offFor = 0; // seconds remaining while disabled by EMP
  }

  update(dt) {
    this.t += dt;
    this.angle = this.baseAngle + Math.sin(this.t * this.sweepSpeed + this.phase) * CAMERA.sweep;
    if (this.offFor > 0) this.offFor -= dt;
  }

  get disabled() {
    return this.offFor > 0;
  }

  sees(px, py, solids) {
    if (this.disabled) return false;
    return inCone(px, py, this.x, this.y, this.angle, CAMERA.coneHalfAngle, CAMERA.range, solids);
  }
}
