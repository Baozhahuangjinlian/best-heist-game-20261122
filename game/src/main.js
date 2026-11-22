// main.js — the game loop and the rules that tie the pieces together: the
// alarm meter and its fair first-spot grace, the loot and the exit, the
// three tools, the night tally, and the screens between nights. Shot mode
// (a ?shot= URL) stages a frozen scene for screenshots and never plays.

import { VIEW, CANVAS, ALARM, GUARD, CAMERA, TOOLS, LOOT, SCORE } from './config.js';
import { LEVELS } from './levels.js';
import { Guard, Camera } from './guards.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { drawGame } from './render.js';
import { applyShot, SHOT_NIGHTS } from './shots.js';
import { distToSegment } from './vision.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS.width;
canvas.height = CANVAS.height;

// The whole game state, in one object so the renderer can read it as-is.
const st = {
  status: 'title', // title | playing | paused | busted | night | done
  levelIndex: 0,
  level: LEVELS[0],
  solids: [],
  player: null,
  guards: [],
  cameras: [],
  lasers: [],
  loot: [],
  exit: null,
  targetTaken: false,
  alarm: 0,
  grace: 0, // seconds left of the fair first-spot window
  spottedThisNight: false,
  coins: 0,
  smoke: 0,
  emp: 0,
  thrownCoins: [],
  smokePuffs: [],
  time: 0,
  clock: 0, // visual clock: cone sweeps, loot pulse, laser blink
  lootValue: 0,
  score: 0,
  totalLoot: 0,
  ghostNights: 0,
  nightBreakdown: null,
  message: null,
  messageTtl: 0,
  muted: false,
  best: 0,
  shotMode: false,
};

try {
  st.best = Number(window.localStorage.getItem('gilded-mouse-best') || 0) || 0;
} catch (e) {
  st.best = 0;
}

function startNight(index) {
  const level = LEVELS[index];
  st.levelIndex = index;
  st.level = level;
  st.solids = level.solids;
  st.player = new Player(level.playerStart);
  st.guards = level.guards.map((g) => new Guard(g));
  st.cameras = level.cameras.map((c) => new Camera(c));
  st.lasers = level.lasers.map((l) => ({ ...l, active: false }));
  st.loot = level.loot.map((item) => ({ ...item, taken: false }));
  st.exit = level.exit;
  st.targetTaken = false;
  st.alarm = 0;
  st.grace = 0;
  st.spottedThisNight = false;
  st.coins = level.tools.coins;
  st.smoke = level.tools.smoke;
  st.emp = level.tools.emp;
  st.thrownCoins = [];
  st.smokePuffs = [];
  st.time = 0;
  st.lootValue = 0;
  st.nightBreakdown = null;
  st.message = null;
  st.messageTtl = 0;
  st.status = 'playing';
}

function showMessage(text, seconds) {
  st.message = text;
  st.messageTtl = seconds || 1.6;
}

function laserActive(laser) {
  const cycle = (st.clock + laser.phase) % (laser.on + laser.off);
  return cycle < laser.on;
}

function update(dt) {
  st.clock += dt;
  st.time += dt;
  if (st.messageTtl > 0) st.messageTtl -= dt;

  // Tools: one drained click per frame tosses a coin toward the click.
  const click = Input.drainClick();
  if (click && st.coins > 0) {
    st.coins -= 1;
    const cx = Math.max(20, Math.min(VIEW.width - 20, click.x));
    const cy = Math.max(20, Math.min(VIEW.height - 20, click.y));
    st.thrownCoins.push({ x: cx, y: cy, ttl: 10 });
    for (const g of st.guards) g.hearCoin(cx, cy);
    Sfx.coin();
    showMessage('Coin tossed — a guard goes to look', 1.2);
  }

  st.player.update(dt, Input, st.solids);
  for (const g of st.guards) g.update(dt, st.solids);
  for (const c of st.cameras) c.update(dt);
  for (const l of st.lasers) l.active = laserActive(l);
  for (const coin of st.thrownCoins) coin.ttl -= dt;
  st.thrownCoins = st.thrownCoins.filter((c) => c.ttl > 0);
  for (const puff of st.smokePuffs) puff.ttl -= dt;
  st.smokePuffs = st.smokePuffs.filter((p) => p.ttl > 0);

  // Detection: guards and cameras, unless smoke hides the thief.
  let seenByGuard = false;
  let seenByCamera = false;
  if (!st.player.hidden) {
    for (const g of st.guards) {
      const sees = g.sees(st.player.x, st.player.y, st.solids);
      g.alerted = sees;
      if (sees) seenByGuard = true;
    }
    for (const c of st.cameras) {
      if (c.sees(st.player.x, st.player.y, st.solids)) seenByCamera = true;
    }
  } else {
    for (const g of st.guards) g.alerted = false;
  }
  const seen = seenByGuard || seenByCamera;

  // Lasers are tripwires: crossing a live one feeds the alarm steadily.
  let onLaser = false;
  for (const l of st.lasers) {
    if (l.active && distToSegment(st.player.x, st.player.y, l.x1, l.y1, l.x2, l.y2) < st.player.r + 4) {
      onLaser = true;
    }
  }

  if (seen && st.grace <= 0 && st.alarm < ALARM.warnAt) {
    // First spot: freeze the alarm and give the thief a fair window to
    // break line of sight instead of an instant bust.
    st.alarm = ALARM.warnAt;
    st.grace = ALARM.graceTime;
    st.spottedThisNight = true;
    Sfx.spotted();
    showMessage('SPOTTED!', 1.2);
  } else if (st.grace > 0) {
    st.grace -= dt; // the window runs out whether or not you hide
  } else if (seen) {
    st.alarm += (seenByGuard ? GUARD.spotRate : CAMERA.spotRate) * dt;
  } else if (onLaser) {
    st.alarm += ALARM.laserRate * dt;
  } else {
    st.alarm = Math.max(0, st.alarm - ALARM.decayRate * dt);
  }
  st.alarm = Math.min(ALARM.max, st.alarm);

  if (st.alarm >= ALARM.max) {
    st.status = 'busted';
    Sfx.busted();
    return;
  }

  // Loot: walk over a piece to pocket it.
  for (const item of st.loot) {
    if (item.taken) continue;
    if (Math.hypot(item.x - st.player.x, item.y - st.player.y) < st.player.r + 14) {
      item.taken = true;
      st.lootValue += item.value;
      st.totalLoot += item.value;
      if (item.kind === 'target') {
        st.targetTaken = true;
        showMessage(`${item.label} secured — get to the EXIT!`, 2.2);
      } else {
        showMessage(`+ $${item.value} — ${item.label}`, 1.4);
      }
      Sfx.pickup();
    }
  }

  // The exit only counts once the target is in hand.
  if (st.targetTaken) {
    const e = st.exit;
    if (st.player.x > e.x && st.player.x < e.x + e.w &&
        st.player.y > e.y && st.player.y < e.y + e.h) {
      finishNight();
    }
  }
}

function finishNight() {
  const timeBonus = Math.max(0, Math.round((st.level.par - st.time) * 10));
  const ghost = st.spottedThisNight ? 0 : SCORE.ghostBonus;
  const total = st.lootValue + timeBonus + ghost;
  st.nightBreakdown = { loot: st.lootValue, time: timeBonus, ghost, total };
  st.score += total;
  if (!st.spottedThisNight) st.ghostNights += 1;
  Sfx.win();
  if (st.levelIndex + 1 < LEVELS.length) {
    st.status = 'night';
  } else {
    st.status = 'done';
    if (st.score > st.best) {
      st.best = st.score;
      try {
        window.localStorage.setItem('gilded-mouse-best', String(st.best));
      } catch (e) { /* private mode: the score just lives for the session */ }
    }
  }
}

function advance() {
  if (st.status === 'title') {
    Sfx.ensure();
    Sfx.click();
    st.score = 0;
    st.totalLoot = 0;
    st.ghostNights = 0;
    startNight(0);
  } else if (st.status === 'night') {
    Sfx.click();
    startNight(st.levelIndex + 1);
  } else if (st.status === 'done') {
    Sfx.click();
    st.score = 0;
    st.totalLoot = 0;
    st.ghostNights = 0;
    startNight(0);
  }
}

Input.onKey = (code) => {
  Sfx.ensure();
  if (code === 'Enter') {
    if (st.status === 'title' || st.status === 'night' || st.status === 'done') {
      Input.clicks.length = 0; // a click that opened this screen must not toss a coin
      advance();
    }
    return;
  }
  if (code === 'KeyR' && st.status === 'busted') {
    startNight(st.levelIndex);
    return;
  }
  if (code === 'KeyP' && (st.status === 'playing' || st.status === 'paused')) {
    st.status = st.status === 'playing' ? 'paused' : 'playing';
    return;
  }
  if (code === 'KeyM') {
    st.muted = Sfx.toggleMute();
    return;
  }
  if (st.status !== 'playing' || st.shotMode) return;
  if (code === 'Space' && st.smoke > 0) {
    st.smoke -= 1;
    st.player.smokeFor = TOOLS.smokeTime;
    st.smokePuffs.push({ x: st.player.x, y: st.player.y, ttl: TOOLS.smokeTime });
    showMessage('Smoke — unseen for a few seconds', 1.2);
  }
  if (code === 'KeyE' && st.emp > 0) {
    st.emp -= 1;
    for (const c of st.cameras) c.offFor = TOOLS.empTime;
    showMessage('EMP — the cameras are dark', 1.4);
  }
};

Input.onClick = () => {
  Sfx.ensure();
  if (st.status === 'title' || st.status === 'night' || st.status === 'done') {
    Input.clicks.length = 0;
    advance();
  }
};

Input.init(canvas);

// A ?shot= URL stages a frozen scene for screenshots instead of playing.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot && SHOT_NIGHTS[shot] !== undefined) {
  startNight(SHOT_NIGHTS[shot]);
  applyShot(st, shot);
  st.shotMode = true;
  st.status = st.status === 'done' ? 'done' : 'playing';
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (st.status === 'playing') {
    if (st.shotMode) {
      // Frozen scene: only the visual clock moves, so cones and loot glow.
      st.clock += dt * 0.5;
      for (const l of st.lasers) l.active = laserActive(l);
    } else {
      update(dt);
    }
  }
  drawGame(ctx, st);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
