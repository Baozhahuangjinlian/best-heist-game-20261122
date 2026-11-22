// audio.js — every sound is a few oscillators, made on the spot. No audio
// files, no network, nothing to load. The context only starts after the
// first user gesture, as browsers require, and M mutes it.

export const Sfx = {
  ctx: null,
  muted: false,

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  },

  tone(freq, dur, type, vol, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  },

  coin() {
    // A tossed coin: a bright double clink.
    this.tone(1567, 0.09, 'triangle', 0.10);
    this.tone(2093, 0.12, 'triangle', 0.08, 0.06);
  },

  pickup() {
    // Loot grabbed: a quick rising arpeggio.
    this.tone(523, 0.08, 'sine', 0.12);
    this.tone(659, 0.08, 'sine', 0.12, 0.07);
    this.tone(784, 0.14, 'sine', 0.12, 0.14);
  },

  spotted() {
    // The alarm bites: a low sawtooth sting.
    this.tone(220, 0.18, 'sawtooth', 0.10);
    this.tone(185, 0.22, 'sawtooth', 0.10, 0.12);
  },

  busted() {
    // Caught: a falling phrase.
    this.tone(392, 0.16, 'square', 0.08);
    this.tone(311, 0.16, 'square', 0.08, 0.15);
    this.tone(233, 0.3, 'square', 0.08, 0.3);
  },

  win() {
    // Night complete: a warm major arpeggio.
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => this.tone(f, 0.18, 'sine', 0.12, i * 0.09));
  },

  click() {
    this.tone(880, 0.05, 'sine', 0.06);
  },
};
