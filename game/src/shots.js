// shots.js — staged scenes for the entry's screenshots. Each shot freezes a
// night at a moment that shows the whole game at once: the thief, the
// guards' cones, a camera, the loot and the alarm meter in one frame.
// These are the game's own code rendering its own state, never a mock-up:
// the shot only places the pieces, then the normal renderer draws them.

function parkGuard(g, x, y, angle) {
  g.x = x;
  g.y = y;
  g.angle = angle;
  g.mode = 'pause';
  g.wait = 999; // staged guards hold their pose
  g.alerted = false;
}

export function applyShot(st, name) {
  if (name === 'cover') {
    // Night One, mid-heist: the thief closing on the Star Sapphire while
    // two cones sweep the gallery and the camera watches from above.
    st.player.x = 400;
    st.player.y = 460;
    parkGuard(st.guards[0], 700, 60, 2.2);
    parkGuard(st.guards[1], 380, 300, 1.57);
    st.cameras[0].t = 1.2;
    st.alarm = 32;
    st.clock = 2.0;
    st.message = null;
    st.messageTtl = 0;
  } else if (name === 'tense') {
    // Night Two, a close call: the thief tucked behind a counter, a guard
    // looking the wrong way, the alarm already high, smoke in the air.
    st.player.x = 300;
    st.player.y = 260;
    parkGuard(st.guards[0], 880, 120, 1.57);
    parkGuard(st.guards[1], 140, 260, -1.57);
    parkGuard(st.guards[2], 820, 420, 3.14);
    st.cameras[0].t = 2.0;
    st.cameras[1].t = 0.5;
    st.clock = 3.0; // one laser live, one dark
    st.alarm = 62;
    st.loot[1].taken = true; // the Jade Figurine is already pocketed
    st.lootValue = 150;
    st.player.smokeFor = 2.0;
    st.smokePuffs.push({ x: 300, y: 260, ttl: 2.0 });
    st.message = null;
    st.messageTtl = 0;
  } else if (name === 'vault') {
    // Night Three, the grand vault: four guards, three cameras, live lasers,
    // and the Gilded Heart glowing under the thief's nose.
    st.player.x = 480;
    st.player.y = 460;
    parkGuard(st.guards[0], 880, 300, 1.57);
    parkGuard(st.guards[1], 140, 200, 0);
    parkGuard(st.guards[2], 820, 500, -1.57);
    parkGuard(st.guards[3], 400, 410, 3.14);
    st.cameras[0].t = 0.8;
    st.cameras[1].t = 2.4;
    st.cameras[2].t = 1.5;
    st.clock = 1.0; // all three lasers live
    st.alarm = 18;
    st.message = null;
    st.messageTtl = 0;
  } else if (name === 'win') {
    // The getaway tally after all three nights.
    st.status = 'done';
    st.score = 2840;
    st.totalLoot = 2150;
    st.ghostNights = 2;
    st.message = null;
    st.messageTtl = 0;
  }
}

// Which night each shot stages, so main.js can open the right room first.
export const SHOT_NIGHTS = { cover: 0, tense: 1, vault: 2, win: 2 };
