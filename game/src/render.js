// render.js — everything the player sees: the gallery floor, the furniture,
// the vision cones, the thief, the guards and cameras, the HUD strip, and
// the title / busted / night-complete / getaway screens. All drawing is
// plain canvas 2D; the only images are the ones this code paints.

import { VIEW, COLORS, ALARM } from './config.js';

// A tiny deterministic pseudo-random, so the wall paintings look the same
// on every run and every screenshot.
function seeded(n) {
  let s = (n * 2654435761) % 4294967296;
  s ^= s >>> 15;
  s = (s * 2246822519) % 4294967296;
  s ^= s >>> 13;
  return ((s >>> 0) % 1000) / 1000;
}

export function drawGame(ctx, st) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawHud(ctx, st);
  ctx.save();
  ctx.translate(0, VIEW.hudHeight);
  drawRoom(ctx, st);
  drawLasers(ctx, st);
  drawLoot(ctx, st);
  drawExit(ctx, st);
  drawCones(ctx, st);
  drawCameras(ctx, st);
  drawGuards(ctx, st);
  drawCoins(ctx, st);
  drawPlayer(ctx, st);
  drawSmoke(ctx, st);
  ctx.restore();
  drawBanner(ctx, st);
  if (st.status === 'title') drawTitle(ctx, st);
  if (st.status === 'paused') drawPaused(ctx, st);
  if (st.status === 'busted') drawBusted(ctx, st);
  if (st.status === 'night') drawNightComplete(ctx, st);
  if (st.status === 'done') drawGetaway(ctx, st);
}

function drawRoom(ctx, st) {
  // Floor: dark slate tiles with a faint checker.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = COLORS.floorAlt;
  const tile = 64;
  for (let y = 0; y < VIEW.height / tile; y++) {
    for (let x = 0; x < VIEW.width / tile; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * tile, y * tile, tile, tile);
    }
  }
  // Carpet runner down the middle of each room.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(120, 0, VIEW.width - 240, VIEW.height);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(126, 6, VIEW.width - 252, VIEW.height - 12);

  // Wall paintings: framed, warm, deterministic per level.
  const hues = [38, 12, 200, 90, 280, 25];
  for (let i = 0; i < 6; i++) {
    const px = 60 + i * 150 + Math.floor(seeded(st.levelIndex * 31 + i) * 40);
    const hue = hues[i % hues.length];
    framePainting(ctx, px, 26, 64, 40, hue);
    framePainting(ctx, px + 30, VIEW.height - 66, 64, 40, hues[(i + 2) % hues.length]);
  }

  // Solids: walls dark wood with a gold lip, furniture as display cases.
  for (const s of st.solids) {
    const isWall = s.y === 0 || s.y + s.h >= VIEW.height || s.x === 0 || s.x + s.w >= VIEW.width;
    if (isWall) {
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = COLORS.wallTop;
      if (s.h <= 16) ctx.fillRect(s.x, s.y + s.h - 4, s.w, 4);
      if (s.w <= 16) ctx.fillRect(s.x + s.w - 4, s.y, 4, s.h);
    } else if (s.kind === 'case') {
      ctx.fillStyle = COLORS.furniture;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = COLORS.glass;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(s.x + 6, s.y + 6, s.w - 12, s.h - 12);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = COLORS.furnitureTop;
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
    } else if (s.kind === 'safe' || s.kind === 'statue') {
      ctx.fillStyle = '#3f3f56';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = COLORS.loot;
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4);
      ctx.fillStyle = COLORS.loot;
      ctx.beginPath();
      ctx.arc(s.x + s.w / 2, s.y + s.h / 2, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // pillar
      ctx.fillStyle = COLORS.furniture;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = COLORS.furnitureTop;
      ctx.fillRect(s.x, s.y, s.w, 6);
    }
  }
}

function framePainting(ctx, x, y, w, h, hue) {
  ctx.fillStyle = '#7c5a2e';
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = `hsl(${hue}, 45%, 42%)`;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.fillRect(x + 6, y + 5, w - 20, 8);
}

function drawLasers(ctx, st) {
  for (const l of st.lasers) {
    const live = l.active;
    ctx.strokeStyle = live ? COLORS.laser : 'rgba(192, 132, 252, 0.25)';
    ctx.lineWidth = live ? 3 : 1.5;
    ctx.setLineDash(live ? [] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Emitters at both ends.
    ctx.fillStyle = live ? COLORS.laser : '#475569';
    ctx.beginPath();
    ctx.arc(l.x1, l.y1, 5, 0, Math.PI * 2);
    ctx.arc(l.x2, l.y2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLoot(ctx, st) {
  const t = st.clock || 0;
  for (const item of st.loot) {
    if (item.taken) continue;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3 + item.x);
    // Glow halo so loot reads at a glance.
    const glow = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 34 + pulse * 8);
    glow.addColorStop(0, COLORS.lootGlow);
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 34 + pulse * 8, 0, Math.PI * 2);
    ctx.fill();
    // The piece itself: a diamond, bigger for the target.
    const r = item.kind === 'target' ? 13 : 9;
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.loot;
    ctx.fillRect(-r / 1.4, -r / 1.4, r * 1.4, r * 1.4);
    ctx.strokeStyle = '#fff7d6';
    ctx.lineWidth = 2;
    ctx.strokeRect(-r / 1.4, -r / 1.4, r * 1.4, r * 1.4);
    ctx.restore();
    if (item.kind === 'target') {
      // A dashed ring marks the one piece the night demands.
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(item.x, item.y, 22 + pulse * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label.toUpperCase(), item.x, item.y - 30);
    }
  }
}

function drawExit(ctx, st) {
  const e = st.exit;
  const open = st.targetTaken;
  ctx.fillStyle = open ? COLORS.exit : '#14532d';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? '#bbf7d0' : '#166534';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x + 1, e.y + 1, e.w - 2, e.h - 2);
  ctx.fillStyle = '#ecfdf5';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT — GO!' : 'EXIT', e.x + e.w / 2, e.y + e.h / 2 + 5);
  if (open) {
    const t = st.clock || 0;
    const a = 0.4 + 0.4 * Math.sin(t * 5);
    ctx.fillStyle = `rgba(34, 197, 94, ${a})`;
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y - 14, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function conePath(ctx, x, y, angle, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCones(ctx, st) {
  for (const g of st.guards) {
    const hot = g.alerted;
    const grad = ctx.createRadialGradient(g.x, g.y, 8, g.x, g.y, 190);
    grad.addColorStop(0, hot ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.28)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = grad;
    conePath(ctx, g.x, g.y, g.angle, 0.61, 190);
    ctx.fill();
  }
  for (const c of st.cameras) {
    if (c.disabled) continue;
    const grad = ctx.createRadialGradient(c.x, c.y, 8, c.x, c.y, 230);
    grad.addColorStop(0, 'rgba(163, 230, 53, 0.30)');
    grad.addColorStop(1, 'rgba(163, 230, 53, 0)');
    ctx.fillStyle = grad;
    conePath(ctx, c.x, c.y, c.angle, 0.49, 230);
    ctx.fill();
  }
}

function drawCameras(ctx, st) {
  for (const c of st.cameras) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.fillStyle = c.disabled ? COLORS.cameraOff : COLORS.camera;
    ctx.fillRect(-2, -7, 16, 14);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(12, -4, 6, 8);
    ctx.restore();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.disabled ? COLORS.cameraOff : COLORS.camera;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    if (c.disabled) {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EMP', c.x, c.y - 12);
    }
  }
}

function drawGuards(ctx, st) {
  for (const g of st.guards) {
    // Body: a dark-red guard with a facing tick.
    ctx.fillStyle = COLORS.guardDark;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fecaca';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 14, g.y + Math.sin(g.angle) * 14);
    ctx.stroke();
    if (g.alerted) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 18);
    } else if (g.mode === 'lure' || g.mode === 'stare') {
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 18);
    }
  }
}

function drawCoins(ctx, st) {
  for (const coin of st.thrownCoins) {
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.6)';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 9 + Math.sin((st.clock || 0) * 6) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPlayer(ctx, st) {
  const p = st.player;
  if (p.hidden) ctx.globalAlpha = 0.45;
  // A soft teal halo so the thief never gets lost in the dark room.
  const halo = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 26);
  halo.addColorStop(0, 'rgba(45, 212, 191, 0.35)');
  halo.addColorStop(1, 'rgba(45, 212, 191, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerDark;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
  ctx.fill();
  // The mask band, pointing where the thief faces.
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x - Math.cos(p.face) * 4, p.y - Math.sin(p.face) * 4);
  ctx.lineTo(p.x + Math.cos(p.face) * 9, p.y + Math.sin(p.face) * 9);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawSmoke(ctx, st) {
  for (const puff of st.smokePuffs) {
    ctx.fillStyle = `rgba(148, 163, 184, ${Math.min(0.55, puff.ttl * 0.3)})`;
    ctx.beginPath();
    ctx.arc(puff.x, puff.y, 26, 0, Math.PI * 2);
    ctx.arc(puff.x - 14, puff.y + 6, 18, 0, Math.PI * 2);
    ctx.arc(puff.x + 14, puff.y - 4, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, st) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, ctx.canvas.width, VIEW.hudHeight);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(st.level.name, 14, 24);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(st.level.sub, 14, 44);

  // Alarm meter, centre.
  const ax = 330;
  const aw = 300;
  const frac = Math.max(0, Math.min(1, st.alarm / ALARM.max));
  const col = frac < 0.5 ? COLORS.alarmLow : frac < 0.8 ? COLORS.alarmMid : COLORS.alarmHigh;
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, 20);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(ax, 28, aw, 16);
  ctx.fillStyle = col;
  ctx.fillRect(ax, 28, aw * frac, 16);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 28, aw, 16);
  if (st.grace > 0) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED — BREAK LINE OF SIGHT!', ax + aw / 2, 58);
  } else {
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(st.targetTaken ? 'Target secured — reach the EXIT' : 'Steal the marked target, then escape', ax + aw / 2, 58);
  }

  // Right side: loot, tools, time.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`LOOT $${st.lootValue}`, 946, 24);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`◉ coins ${st.coins}   ☁ smoke ${st.smoke}   ⚡ EMP ${st.emp}   ⏱ ${Math.floor(st.time)}s`, 946, 44);
}

function drawBanner(ctx, st) {
  if (!st.message || st.messageTtl <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, st.messageTtl);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(st.message, ctx.canvas.width / 2, VIEW.hudHeight + 52);
  ctx.restore();
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function panel(ctx, title, lines, foot) {
  dim(ctx);
  const cx = ctx.canvas.width / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText(title, cx, 250);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  lines.forEach((line, i) => ctx.fillText(line, cx, 300 + i * 28));
  if (foot) {
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(foot, cx, 300 + lines.length * 28 + 26);
  }
}

function drawTitle(ctx, st) {
  dim(ctx);
  const cx = ctx.canvas.width / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('THE GILDED MOUSE', cx, 190);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'italic 18px Georgia, serif';
  ctx.fillText('a midnight gallery heist in three nights', cx, 228);
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  const how = [
    'WASD / arrows — move     Shift — sneak (slower, harder to spot)',
    'Click — toss a coin to lure a guard     Space — smoke pellet (briefly unseen)',
    'E — EMP pulse (cameras dark for 6s)     P — pause     M — mute',
    'Steal the marked target, grab what else you can, reach the green EXIT.',
    'If a guard or camera sees you the alarm climbs. At 100, you are busted.',
  ];
  how.forEach((line, i) => ctx.fillText(line, cx, 290 + i * 26));
  ctx.fillStyle = '#2dd4bf';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('Press ENTER or click to begin the first night', cx, 470);
  if (st.best > 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`Best getaway so far: $${st.best}`, cx, 505);
  }
  ctx.fillStyle = '#64748b';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('An original game — its rooms, names, art and sounds were made for this heist.', cx, 545);
}

function drawPaused(ctx) {
  panel(ctx, 'PAUSED', ['Take a breath. The guards are waiting.'], 'Press P to keep sneaking');
}

function drawBusted(ctx, st) {
  panel(ctx, 'BUSTED!', [
    `The alarm hit 100 on ${st.level.name}.`,
    `Loot kept from this night: $${st.lootValue}.`,
  ], 'Press R to try the night again');
}

function drawNightComplete(ctx, st) {
  const b = st.nightBreakdown;
  panel(ctx, 'CLEAN GETAWAY', [
    `${st.level.name} — done.`,
    `Loot $${b.loot}  +  time bonus $${b.time}  +  ghost bonus $${b.ghost}`,
    `Night score: $${b.total}      Total so far: $${st.score}`,
  ], st.levelIndex + 1 < 3 ? 'Press ENTER for the next night' : 'Press ENTER for the final tally');
}

function drawGetaway(ctx, st) {
  panel(ctx, 'THE GILDED MOUSE ESCAPES', [
    'Three nights, three vaults, one very quiet thief.',
    `Final score: $${st.score}      Loot taken: $${st.totalLoot}`,
    st.ghostNights === 3 ? 'Ghost on all three nights — nobody ever saw you.' :
      st.ghostNights > 0 ? `Ghost on ${st.ghostNights} of 3 nights.` : 'Seen, but never caught for long.',
  ], 'Press ENTER to run it all again');
}
