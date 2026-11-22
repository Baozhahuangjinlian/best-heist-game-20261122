// player.js — the thief. Walks with WASD or arrows, sneaks while Shift is
// held, and spends the three tools: a tossed coin, a smoke pellet and an
// EMP pulse. Movement slides along walls; the tools are spent by main.js.

import { PLAYER, VIEW } from './config.js';
import { moveCircle } from './vision.js';

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.r = PLAYER.radius;
    this.face = 0; // facing angle, for the little mask band we draw
    this.moving = false;
    this.sneaking = false;
    this.smokeFor = 0; // seconds of invisibility left
  }

  get hidden() {
    return this.smokeFor > 0;
  }

  update(dt, input, solids) {
    let mx = 0;
    let my = 0;
    if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) mx -= 1;
    if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) mx += 1;
    if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) my -= 1;
    if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) my += 1;
    this.moving = mx !== 0 || my !== 0;
    this.sneaking = input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
    if (this.smokeFor > 0) this.smokeFor -= dt;

    if (!this.moving) return;
    const len = Math.hypot(mx, my);
    const speed = this.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    const dx = (mx / len) * speed * dt;
    const dy = (my / len) * speed * dt;
    const pos = moveCircle(this.x, this.y, this.r, dx, dy, solids);
    this.x = Math.max(this.r + 16, Math.min(VIEW.width - 16 - this.r, pos.x));
    this.y = Math.max(this.r + 16, Math.min(VIEW.height - 16 - this.r, pos.y));
    this.face = Math.atan2(dy, dx);
  }
}
