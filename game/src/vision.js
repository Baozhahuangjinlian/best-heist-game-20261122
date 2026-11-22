// vision.js — the pure geometry the stealth rules stand on: line of sight,
// vision cones, laser distance, and sliding a circle past solid rectangles.
// Nothing here touches the DOM, so it is easy to test on its own.

// True when the segment (x1,y1)-(x2,y2) touches or crosses the rectangle.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  // Fast reject: both ends on the same outside side.
  if ((x1 < r.x && x2 < r.x) || (x1 > r.x + r.w && x2 > r.x + r.w)) return false;
  if ((y1 < r.y && y2 < r.y) || (y1 > r.y + r.h && y2 > r.y + r.h)) return false;
  // Either end inside the rectangle counts as a hit.
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  if (x2 >= r.x && x2 <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h) return true;
  // Otherwise test the segment against the four edges.
  const dx = x2 - x1;
  const dy = y2 - y1;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y], // top
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h], // right
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h], // bottom
    [r.x, r.y + r.h, r.x, r.y], // left
  ];
  for (const [ax, ay, bx, by] of edges) {
    if (segmentsCross(x1, y1, x2, y2, ax, ay, bx, by)) return true;
  }
  return false;
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = cross(x4 - x3, y4 - y3, x1 - x3, y1 - y3);
  const d2 = cross(x4 - x3, y4 - y3, x2 - x3, y2 - y3);
  const d3 = cross(x2 - x1, y2 - y1, x3 - x1, y3 - y1);
  const d4 = cross(x2 - x1, y2 - y1, x4 - x1, y4 - y1);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function cross(ax, ay, bx, by) {
  return ax * by - ay * bx;
}

// True when nothing solid stands between the two points.
export function lineOfSight(x1, y1, x2, y2, solids) {
  for (const s of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, s)) return false;
  }
  return true;
}

// True when point (px,py) sits inside the cone at (ox,oy) facing `angle`
// with the given half-angle and range, with line of sight clear.
export function inCone(px, py, ox, oy, angle, halfAngle, range, solids) {
  const dx = px - ox;
  const dy = py - oy;
  const d2 = dx * dx + dy * dy;
  if (d2 > range * range) return false;
  const want = Math.atan2(dy, dx);
  let diff = want - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > halfAngle) return false;
  // Start the sight line a few pixels out from the watcher, so a camera
  // bolted to a wall is not blinded by the very wall it hangs on.
  if (d2 === 0) return true;
  const d = Math.sqrt(d2);
  const sx = ox + (dx / d) * 4;
  const sy = oy + (dy / d) * 4;
  return lineOfSight(sx, sy, px, py, solids);
}

// Distance from a point to a line segment; used for laser tripwires.
export function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Move a circle by (dx,dy), sliding along solid rectangles instead of
// sticking on corners. Returns the new position.
export function moveCircle(x, y, r, dx, dy, solids) {
  let nx = x + dx;
  for (const s of solids) {
    if (circleHitsRect(nx, y, r, s)) {
      nx = dx > 0 ? s.x - r : s.x + s.w + r;
    }
  }
  let ny = y + dy;
  for (const s of solids) {
    if (circleHitsRect(nx, ny, r, s)) {
      ny = dy > 0 ? s.y - r : s.y + s.h + r;
    }
  }
  return { x: nx, y: ny };
}

function circleHitsRect(cx, cy, r, s) {
  const nearestX = Math.max(s.x, Math.min(cx, s.x + s.w));
  const nearestY = Math.max(s.y, Math.min(cy, s.y + s.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}
