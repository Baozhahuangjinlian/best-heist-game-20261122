// input.js — keyboard and mouse state, kept in one place so the game loop
// only reads it. Clicks arrive as a queue of canvas points; the loop drains
// one per frame, so a click is never read twice.

import { VIEW } from './config.js';

export const Input = {
  keys: new Set(),
  clicks: [], // {x, y} in playfield coordinates, drained by main.js
  mouse: { x: 0, y: 0 }, // current mouse position, playfield coordinates
  onKey: null, // main.js sets this to catch single presses (pause, retry...)
  onClick: null, // main.js sets this for title-screen clicks

  init(canvas) {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (!e.repeat) {
        this.keys.add(e.code);
        if (this.onKey) this.onKey(e.code);
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
    canvas.addEventListener('mousemove', (e) => {
      const p = this.toField(e, canvas);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
    });
    canvas.addEventListener('mousedown', (e) => {
      const p = this.toField(e, canvas);
      this.clicks.push(p);
      if (this.onClick) this.onClick(p);
    });
    // Touch: one finger drags the thief, a tap tosses a coin.
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const p = this.toField(t, canvas);
      this.clicks.push(p);
      if (this.onClick) this.onClick(p);
    }, { passive: false });
  },

  toField(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scale;
    // The HUD strip sits above the playfield on the same canvas.
    const y = (e.clientY - rect.top) * scale - VIEW.hudHeight;
    return { x, y };
  },

  drainClick() {
    return this.clicks.shift() || null;
  },
};
