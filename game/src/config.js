// config.js — every tuning number for The Gilded Mouse lives here, so the
// rest of the game reads plain names instead of magic numbers.

export const VIEW = {
  width: 960, // playfield width in pixels
  height: 640, // playfield height in pixels
  hudHeight: 64, // HUD strip drawn above the playfield
};

export const CANVAS = {
  width: VIEW.width,
  height: VIEW.height + VIEW.hudHeight,
};

export const PLAYER = {
  radius: 11,
  walkSpeed: 128, // pixels per second, normal pace
  sneakSpeed: 70, // pixels per second while Shift is held
};

export const GUARD = {
  radius: 12,
  patrolSpeed: 58,
  luredSpeed: 95, // hurries toward a tossed coin
  coneHalfAngle: 0.61, // about 35 degrees each side
  coneRange: 190,
  proximitySpot: 26, // bumping into a guard spots you at once
  scanPause: 1.6, // seconds a guard waits at each waypoint
  scanSwing: 0.7, // radians it looks around while waiting
  investigateTime: 3.0, // seconds it stares at a coin before leaving
  spotRate: 55, // alarm points per second while a guard sees you
};

export const CAMERA = {
  range: 230,
  coneHalfAngle: 0.49, // about 28 degrees each side
  sweep: 0.9, // radians each side of its base angle
  spotRate: 30, // alarm points per second while a camera sees you
};

export const ALARM = {
  max: 100,
  decayRate: 8, // points per second while nobody sees you
  warnAt: 55, // first spot freezes here for the grace window
  graceTime: 1.2, // seconds to break line of sight after being spotted
  laserRate: 25, // points per second while crossing a live laser
};

export const TOOLS = {
  coinRange: 300, // a tossed coin only lures guards this close
  smokeTime: 2.5, // seconds of invisibility from one pellet
  empTime: 6.0, // seconds cameras stay dark after one pulse
};

export const LOOT = {
  target: 500,
  gold: 200,
  gem: 150,
  painting: 100,
};

export const SCORE = {
  ghostBonus: 500, // finishing a night without ever being spotted
};

export const COLORS = {
  floor: '#1b2233',
  floorAlt: '#202941',
  carpet: '#2c2338',
  wall: '#4a3423',
  wallTop: '#6b4e2e',
  furniture: '#33415e',
  furnitureTop: '#46587c',
  glass: '#7fb2d9',
  player: '#2dd4bf',
  playerDark: '#0d9488',
  guard: '#ef4444',
  guardDark: '#991b1b',
  camera: '#a3e635',
  cameraOff: '#64748b',
  laser: '#c084fc',
  loot: '#fbbf24',
  lootGlow: 'rgba(251, 191, 36, 0.35)',
  exit: '#22c55e',
  hudBg: '#0f1420',
  hudText: '#e2e8f0',
  hudDim: '#94a3b8',
  alarmLow: '#22c55e',
  alarmMid: '#f59e0b',
  alarmHigh: '#ef4444',
};
