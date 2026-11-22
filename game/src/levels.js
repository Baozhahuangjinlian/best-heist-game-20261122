// levels.js — the three nights of the heist. Each level is plain data: the
// room's solid rectangles, the guards' patrol loops, the cameras, the laser
// tripwires, the loot and the getaway door. Nothing here runs; main.js turns
// these tables into a living level.
//
// Coordinate space: 960 by 640, origin top-left. A 16-pixel border wall
// rings every room. Patrol waypoints were laid out in the open lanes between
// the furniture, and every loot spot sits on open floor.

function border() {
  return [
    { x: 0, y: 0, w: 960, h: 16 }, // top wall
    { x: 0, y: 624, w: 960, h: 16 }, // bottom wall
    { x: 0, y: 0, w: 16, h: 640 }, // left wall
    { x: 944, y: 0, w: 16, h: 640 }, // right wall
  ];
}

export const LEVELS = [
  {
    name: 'Night One — The Gallery',
    sub: 'Lift the Star Sapphire, then slip out the south door.',
    par: 90, // par time in seconds, for the time bonus
    playerStart: { x: 60, y: 60 },
    solids: [
      ...border(),
      { x: 200, y: 120, w: 260, h: 44, kind: 'case' }, // display case, top left
      { x: 520, y: 120, w: 260, h: 44, kind: 'case' }, // display case, top right
      { x: 200, y: 420, w: 120, h: 120, kind: 'case' }, // big case, bottom left
      { x: 640, y: 420, w: 120, h: 120, kind: 'case' }, // big case, bottom right
      { x: 430, y: 280, w: 100, h: 80, kind: 'statue' }, // centre statue plinth
    ],
    guards: [
      {
        // Perimeter loop; starts at the south-east corner so the thief's
        // north-west window stays quiet at the start.
        path: [[80, 60], [880, 60], [880, 580], [80, 580]],
        startIndex: 2,
      },
      {
        // Centre vertical sweep between the statue and the cases.
        path: [[380, 200], [380, 440]],
        startIndex: 0,
      },
    ],
    cameras: [
      { x: 480, y: 16, baseAngle: Math.PI / 2, sweepSpeed: 0.55, phase: 0 },
    ],
    lasers: [],
    loot: [
      { x: 480, y: 380, value: 500, kind: 'target', label: 'Star Sapphire' },
      { x: 150, y: 560, value: 200, kind: 'gold', label: 'Gold Bar' },
      { x: 830, y: 560, value: 100, kind: 'painting', label: 'Small Portrait' },
    ],
    exit: { x: 430, y: 584, w: 100, h: 28 },
    tools: { coins: 3, smoke: 2, emp: 1 },
  },
  {
    name: 'Night Two — The Vault Hall',
    sub: 'The Crown is past the lasers. Mind the two cameras.',
    par: 120,
    playerStart: { x: 60, y: 60 },
    solids: [
      ...border(),
      { x: 180, y: 180, w: 220, h: 50, kind: 'case' },
      { x: 560, y: 180, w: 220, h: 50, kind: 'case' },
      { x: 180, y: 420, w: 220, h: 50, kind: 'case' },
      { x: 560, y: 420, w: 220, h: 50, kind: 'case' },
      { x: 420, y: 280, w: 120, h: 90, kind: 'safe' }, // the hall safe
    ],
    guards: [
      {
        path: [[80, 60], [880, 60], [880, 580], [80, 580]],
        startIndex: 2,
      },
      {
        // West lane, between the wall and the counters.
        path: [[140, 150], [140, 500]],
        startIndex: 0,
      },
      {
        // East lane.
        path: [[820, 150], [820, 500]],
        startIndex: 1,
      },
    ],
    cameras: [
      { x: 120, y: 16, baseAngle: Math.PI / 2, sweepSpeed: 0.6, phase: 0 },
      { x: 840, y: 16, baseAngle: Math.PI / 2, sweepSpeed: 0.6, phase: 1.6 },
    ],
    lasers: [
      // Horizontal tripwire below the safe, guarding the approach.
      { x1: 360, y1: 390, x2: 600, y2: 390, on: 2.0, off: 1.6, phase: 0 },
      // Short vertical tripwire in the top-centre lane.
      { x1: 480, y1: 120, x2: 480, y2: 160, on: 2.4, off: 1.2, phase: 0.8 },
    ],
    loot: [
      { x: 480, y: 440, value: 500, kind: 'target', label: 'Vault Crown' },
      { x: 120, y: 320, value: 150, kind: 'gem', label: 'Jade Figurine' },
      { x: 840, y: 320, value: 200, kind: 'gold', label: 'Gold Bar' },
      { x: 480, y: 80, value: 100, kind: 'painting', label: 'Landscape' },
    ],
    exit: { x: 820, y: 584, w: 100, h: 28 },
    tools: { coins: 3, smoke: 2, emp: 2 },
  },
  {
    name: 'Night Three — The Grand Vault',
    sub: 'Four guards, three cameras, live lasers. Take the Gilded Heart.',
    par: 150,
    playerStart: { x: 60, y: 580 },
    solids: [
      ...border(),
      { x: 150, y: 150, w: 180, h: 50, kind: 'case' },
      { x: 630, y: 150, w: 180, h: 50, kind: 'case' },
      { x: 150, y: 440, w: 180, h: 50, kind: 'case' },
      { x: 630, y: 440, w: 180, h: 50, kind: 'case' },
      { x: 380, y: 270, w: 200, h: 100, kind: 'safe' }, // the grand vault
      { x: 300, y: 280, w: 50, h: 80, kind: 'pillar' },
      { x: 610, y: 280, w: 50, h: 80, kind: 'pillar' },
    ],
    guards: [
      {
        path: [[80, 60], [880, 60], [880, 580], [80, 580]],
        startIndex: 1,
      },
      {
        path: [[140, 120], [140, 520]],
        startIndex: 0,
      },
      {
        path: [[820, 120], [820, 520]],
        startIndex: 1,
      },
      {
        // Centre horizontal sweep below the vault.
        path: [[280, 410], [680, 410]],
        startIndex: 0,
      },
    ],
    cameras: [
      { x: 480, y: 16, baseAngle: Math.PI / 2, sweepSpeed: 0.5, phase: 0 },
      { x: 16, y: 320, baseAngle: 0, sweepSpeed: 0.65, phase: 1.1 },
      { x: 944, y: 320, baseAngle: Math.PI, sweepSpeed: 0.65, phase: 2.2 },
    ],
    lasers: [
      { x1: 330, y1: 240, x2: 630, y2: 240, on: 1.8, off: 1.4, phase: 0 },
      { x1: 330, y1: 400, x2: 630, y2: 400, on: 1.8, off: 1.4, phase: 0.7 },
      { x1: 200, y1: 320, x2: 280, y2: 320, on: 2.0, off: 1.8, phase: 0.5 },
    ],
    loot: [
      { x: 480, y: 395, value: 500, kind: 'target', label: 'Gilded Heart' },
      { x: 120, y: 320, value: 150, kind: 'gem', label: 'Ruby Idol' },
      { x: 840, y: 320, value: 200, kind: 'gold', label: 'Gold Bar' },
      { x: 480, y: 80, value: 100, kind: 'painting', label: 'Grand Portrait' },
    ],
    exit: { x: 820, y: 28, w: 100, h: 28 },
    tools: { coins: 4, smoke: 3, emp: 2 },
  },
];
