#!/usr/bin/env node
// Program (instruction) tiles v2: every tile on the program board (belts,
// corners, step, rotators, detectors, counters, empty, start), drawn as
// anti-aliased vector shapes in the Toybox palette and pre-rendered into one
// atlas at the 2012 game's frame counts and rates. Deterministic and
// dependency-free; this file is the source of truth for those tiles
// (docs/art/classes/program-tiles.md).
//
//   node tools/art/tiles/program-tiles.mjs [--size 54]   write images/tiles/program-tiles.png + data/program-tiles.json
//   node tools/art/tiles/program-tiles.mjs --check       regenerate in memory, fail if the committed files differ
//   node tools/art/tiles/program-tiles.mjs --review <dir> [--tag v2]
//                                                        also write <tag>.png (atlas contact), <tag>-seam.png and
//                                                        <tag>-merges.png (board mocks), <tag>-variants.png (every join, 3x)
//
// Belt tiles are two atlas layers (see TILES below): a belt underlay chosen by
// the tile's join, and the tile's symbol on transparent ground.
//
// Shapes are signed-distance functions in design units (54 per tile side).
// Each pixel is the average of an 8x8 grid of samples wherever its corners and
// centre disagree, so edges are smooth at any --size and sub-pixel motion
// (belts, rotation) moves smoothly instead of in whole-pixel steps.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { blank, encodePng, decodePng, scaleNearest, composite, fillRect, parseColour, pixelSha256 } from "../lib/png.mjs";
import { drawText } from "../lib/font.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PNG_OUT = "images/tiles/program-tiles.png";
const JSON_OUT = "data/program-tiles.json";
const SCRIPT_JS = "script.js";

// ---------------------------------------------------------------- timing
// From the 2012 game (git show 8a9315e:script.js). Quintus' anim step adds dt
// twice, so a frame lasts rate/2: 0.05 gives 25 ms per frame (40 fps).
export const RATE = 0.05;
export const FRAME_S = RATE / 2;
export const D = 54; // design units per tile side
export const DEFAULT_SIZE = 54; // shipped frame size in px (board pitch 54 at scale 1)
export const PERIOD = D / 4; // chevron spacing: four per tile, so belts join tile to tile
export const BELT_FRAMES = 20; // frames per chevron period (original conveyor: 20 frames)
export const ROT_DEG_PER_FRAME = 3; // original: 60 frames per loop, 3° each
export const STEP_FRAMES = 60; // step arrows travel one tile per 60 frames (original)
export const PULSE_FRAMES = 60; // incrementer plus pulses once per 60 frames (original fade)
const COLS = 30; // atlas columns

// ---------------------------------------------------------------- palette
const hex = (h) => parseColour(h);
const HEX = {
  outline: "#2a2335",
  floor: "#a3d9b1",
  floorRim: "#86c49a",
  floorDot: "#93cea5",
  railLight: "#c9d0d6",
  railMid: "#8b93a3",
  beltEdge: "#3a3f5c",
  belt: "#4a5175",
  chevron: "#f6c445",
  chevronShade: "#e09b2d",
  stepLight: "#9be6f7",
  step: "#37bfe5",
  stepDark: "#2786b5",
  cwLight: "#f27a9b",
  cw: "#d73960",
  cwDark: "#9a3256",
  ccwLight: "#fbb466",
  ccw: "#e9852c",
  ccwDark: "#b0561c",
  cream: "#fdf1ce",
  creamDark: "#d8c49a",
  wallLight: "#f78a72",
  wall: "#e5533d",
  wallDark: "#a33427",
  paleLight: "#f4eee2",
  pale: "#e2d9c8",
  paleDark: "#b3a891",
  goLight: "#8ee39c",
  go: "#4cc25e",
  goDark: "#2c8a43",
};
export const PALETTE = HEX;
const C = Object.fromEntries(Object.entries(HEX).map(([k, v]) => [k, hex(v)]));
const CLEAR = [0, 0, 0, 0];
const pal = (prefix) => ({ light: C[`${prefix}Light`], base: C[prefix], dark: C[`${prefix}Dark`] });
const P = {
  step: pal("step"), cw: pal("cw"), ccw: pal("ccw"), wall: pal("wall"), pale: pal("pale"), go: pal("go"),
  cream: { light: C.cream, base: C.cream, dark: C.creamDark },
};

// Counter colours. Each also has a glyph so it does not rely on hue alone.
export const COUNTERS = {
  Red: { glyph: "circle", light: "#f78a72", base: "#e5533d", dark: "#a33427" },
  Blue: { glyph: "square", light: "#79aef0", base: "#3f7fdc", dark: "#2a5aa3" },
  Green: { glyph: "triangle", light: "#7ad98b", base: "#36a852", dark: "#21753a" },
  Purple: { glyph: "diamond", light: "#b996ec", base: "#8b5cd6", dark: "#5c3b99" },
  Yellow: { glyph: "star", light: "#ffe07d", base: "#f5bf2a", dark: "#b8860f" },
  Pink: { glyph: "heart", light: "#fbb0d2", base: "#f272ad", dark: "#b6457c" },
};
const CP = Object.fromEntries(Object.entries(COUNTERS).map(([k, v]) => [k, { light: hex(v.light), base: hex(v.base), dark: hex(v.dark) }]));

// ---------------------------------------------------------------- math
const mod = (a, n) => ((a % n) + n) % n;
const TAU = Math.PI * 2;
const H = D / 2; // tile centre

function sdBox(px, py, bx, by) {
  const qx = Math.abs(px) - bx, qy = Math.abs(py) - by;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0);
}
const sdRoundBox = (px, py, bx, by, r) => sdBox(px, py, bx - r, by - r) - r;

function sdSegment(px, py, ax, ay, bx, by) {
  const pax = px - ax, pay = py - ay, bax = bx - ax, bay = by - ay;
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  return Math.hypot(pax - bax * h, pay - bay * h);
}

/** Exact signed distance to a polygon given as [x0, y0, x1, y1, ...]. */
function sdPolygon(px, py, v) {
  const n = v.length / 2;
  let d = (px - v[0]) ** 2 + (py - v[1]) ** 2;
  let s = 1;
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const vix = v[2 * i], viy = v[2 * i + 1], vjx = v[2 * j], vjy = v[2 * j + 1];
    const ex = vjx - vix, ey = vjy - viy, wx = px - vix, wy = py - viy;
    const h = Math.min(1, Math.max(0, (wx * ex + wy * ey) / (ex * ex + ey * ey)));
    const bx = wx - ex * h, by = wy - ey * h;
    d = Math.min(d, bx * bx + by * by);
    const c1 = py >= viy, c2 = py < vjy, c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}

// Glyphs, centred on 0,0, y down, about 2r across.
function sdGlyph(kind, px, py, r) {
  switch (kind) {
    case "circle":
      return Math.hypot(px, py) - r * 0.95;
    case "square":
      return sdRoundBox(px, py, r * 0.82, r * 0.82, r * 0.18);
    case "diamond":
      return (Math.abs(px) + Math.abs(py) - r * 1.12) / Math.SQRT2;
    case "triangle": {
      // equilateral, pointing up (IQ), y flipped and nudged so it looks centred
      const k = Math.sqrt(3), rr = r * 1.0;
      let x = Math.abs(px) - rr, y = -(py - r * 0.18) + rr / k;
      if (x + k * y > 0) [x, y] = [(x - k * y) / 2, (-k * x - y) / 2];
      x -= Math.min(Math.max(x, -2 * rr), 0);
      return -Math.hypot(x, y) * Math.sign(y);
    }
    case "star": {
      // five-pointed star (IQ sdStar5), pointing up
      const k1x = 0.809016994375, k1y = -0.587785252292, k2x = -k1x, k2y = k1y;
      const rr = r * 1.18, rf = 0.5;
      let x = Math.abs(px), y = -py + r * 0.06;
      let dd = Math.max(k1x * x + k1y * y, 0);
      x -= 2 * dd * k1x; y -= 2 * dd * k1y;
      dd = Math.max(k2x * x + k2y * y, 0);
      x -= 2 * dd * k2x; y -= 2 * dd * k2y;
      x = Math.abs(x);
      y -= rr;
      const bax = rf * -k1y - 0, bay = rf * k1x - 1;
      const h = Math.min(Math.max((x * bax + y * bay) / (bax * bax + bay * bay), 0), rr);
      return Math.hypot(x - bax * h, y - bay * h) * Math.sign(y * bax - x * bay);
    }
    case "heart": {
      // IQ sdHeart, unit heart spans y 0..~1.05 (y up), scaled to about 2r
      const k = r * 1.95;
      let x = Math.abs(px) / k, y = (-py + r * 0.98) / k;
      let d;
      if (y + x > 1) d = Math.hypot(x - 0.25, y - 0.75) - Math.SQRT2 / 4;
      else {
        const m = 0.5 * Math.max(x + y, 0);
        d = Math.sqrt(Math.min((x - 0) ** 2 + (y - 1) ** 2, (x - m) ** 2 + (y - m) ** 2)) * Math.sign(x - y);
      }
      return d * k;
    }
    default:
      throw new Error(`unknown glyph ${kind}`);
  }
}

/** Toybox shading for a shape with signed distance d (design units):
 *  1 unit dark outline outside, 1 unit dark rim inside, base fill, optional highlight. */
function toy(d, p, highlight = false) {
  if (d > 1) return null;
  if (d > 0) return C.outline;
  if (d > -1) return p.dark;
  return highlight ? p.light : p.base;
}
/** Small symbols: outline and a flat fill (a rim would eat the fill). */
function flat(d, fill) {
  if (d > 1) return null;
  return d > 0 ? C.outline : fill;
}

// ---------------------------------------------------------------- layers
/** Board panel: flat mint, 1 unit rim, four 2x2 corner studs. */
function floorAt(x, y) {
  if (x < 1 || y < 1 || x >= D - 1 || y >= D - 1) return C.floorRim;
  const ex = x < H ? x : D - x, ey = y < H ? y : D - y;
  if (ex >= 3 && ex < 5 && ey >= 3 && ey < 5) return C.floorDot;
  return C.floor;
}

// The belt cross-section, by distance from its centre line (symmetric, so it
// survives the game's 90° rotations).
export const BELT_HALF = 10;
const CHEVRON_TIP = 9; // tip position within a period at offset 0
const CHEVRON_THICK = 4;
/** Belt colour at along-coordinate u, across-coordinate v; offset = distance moved. */
function beltAt(u, v, offset) {
  const av = v < 0 ? -v : v;
  if (av >= BELT_HALF) return null;
  if (av < 5) {
    const k = mod(CHEVRON_TIP + offset - av - u, PERIOD);
    if (k < CHEVRON_THICK) return k >= CHEVRON_THICK - 1 ? C.chevronShade : C.chevron;
    return av < 4 ? C.belt : C.beltEdge;
  }
  return av < 6 ? C.outline : av < 7 ? C.railMid : av < 9 ? C.railLight : C.outline;
}
const beltOffset = (frame) => (mod(frame, BELT_FRAMES) * PERIOD) / BELT_FRAMES;

/** A side arc: the quarter circle of radius D/2 about the north-east corner,
 *  entering through the north edge (the tile's left side when it points east)
 *  and leaving through the east edge. side "R" mirrors it (enters from the
 *  south). Returns the belt coordinates {u, v} at x, y, or null off the arc.
 *  The arc's centre line is (pi/2)(D/2) = 42.4 units long, so it carries
 *  CORNER_PERIODS = 3 chevrons (40.5 units) instead of a straight tile's four:
 *  chevrons keep their spacing and speed through the bend (within 5%), and
 *  both openings still sit on a whole period, in phase with straight belts. */
export const CORNER_PERIODS = 3;
function arcUV(x, y, side) {
  const yy = side === "R" ? D - y : y;
  const dx = x - D, r = Math.hypot(dx, yy);
  const v = r - H;
  if (v <= -BELT_HALF || v >= BELT_HALF) return null;
  const phi = Math.atan2(yy, dx); // pi at the entry, pi/2 at the exit
  return { u: ((Math.PI - phi) / (Math.PI / 2)) * CORNER_PERIODS * PERIOD, v };
}

/** The belt of a single-exit tile, by the set of its fed inputs: "B" behind
 *  (west), "L" left (north), "R" right (south); the exit is always east.
 *  B alone is the straight belt, L or R alone a corner. Two side arcs (a T)
 *  meet on the centre line: each point shows the arc whose centre line is
 *  nearer; both arcs have the same along and across coordinates on y = 27, so
 *  the seam is continuous and their inner rails close into a Y. With B, the
 *  side arcs tuck under the straight main line, which is drawn on top. */
export const LINE_INPUTS = ["B", "L", "R", "LR", "BL", "BR", "BLR"];
function lineBelt(off, inputs) {
  const B = inputs.includes("B"), sides = ["L", "R"].filter((s) => inputs.includes(s));
  return (x, y) => {
    if (B && Math.abs(y - H) < BELT_HALF) return beltAt(x, y - H, off);
    let best = null;
    for (const side of sides) {
      const a = arcUV(x, y, side);
      if (a && (!best || Math.abs(a.v) < Math.abs(best.v))) best = a;
    }
    return best ? beltAt(best.u, best.v, off) : null;
  };
}

/** Branch belt: out to the north and the south, always; in from a side only
 *  when that side is fed (tg-amy). The outgoing belt is one full north-south
 *  belt whose two halves continue the flow coordinate from the centre, so
 *  chevrons run outwards from under the hub (which covers the centre and any
 *  crossing) and stay in phase with straight belts. inputs: "" (nothing feeds
 *  it: the outgoing belts alone), "W" (behind, the usual entry: a stub whose
 *  chevrons run east into the hub), "E" (the far side: a stub whose chevrons
 *  run west into the hub) or "WE". */
export const BRANCH_INPUTS = ["", "W", "E", "WE"];
function branchBelt(off, inputs = "") {
  const W = inputs.includes("W"), E = inputs.includes("E");
  return (x, y) => {
    const vx = x - H;
    if (vx > -BELT_HALF && vx < BELT_HALF) return beltAt(y < H ? D - y : y, vx, off);
    if (W && x < H) return beltAt(x, y - H, off);
    if (E && x > H) return beltAt(D - x, y - H, off);
    return null;
  };
}

/** Step: one sky-blue arrow per lane per tile, above and below the belt,
 *  sliding east one tile per STEP_FRAMES. Lanes wrap across tile edges.
 *  `lanes` picks "NS", "N" or "S": a side arc runs through the lane on its
 *  side, so the step tile keeps only the lane that is still free. */
const ARROW = [0, -3, 13, -3, 13, -7, 24, 0, 13, 7, 13, 3, 0, 3];
const ARROW_LANES = { N: 8.5, S: D - 8.5 };
const ARROW_START = 6;
function stepArrows(frame, lanes = "NS") {
  const shift = (mod(frame, STEP_FRAMES) * D) / STEP_FRAMES;
  const ys = [...lanes].map((k) => ARROW_LANES[k]);
  return (x, y) => {
    for (const cy of ys) {
      const b = y - cy;
      if (b < -9 || b > 9) continue;
      const a = mod(x - shift - ARROW_START, D);
      const d = Math.min(sdPolygon(a, b, ARROW), sdPolygon(a - D, b, ARROW));
      const c = toy(d, P.step, Math.abs(b) < 0.9 && a > 1.5 && a < 20);
      if (c) return c;
    }
    return null;
  };
}

/** Step with both side lanes taken (a T, or behind + both sides): one arrow
 *  on the centre line in the tile's west half, nudging forward once per
 *  STEP_FRAMES. In a T it sits on the floor in the gap between the arcs and
 *  points at their meeting; with a behind belt it rides that belt's west
 *  half. Either way the merge in the east half stays in view. Its tip stops
 *  short of the arcs' outer outline (r 38 about the corner) at every frame. */
const INLINE_SCALE = 0.9;
function stepArrowInline(frame) {
  const x0 = 2.2 + 1.0 * (1 - Math.cos((TAU * mod(frame, STEP_FRAMES)) / STEP_FRAMES));
  return (x, y) => {
    const a = (x - x0) / INLINE_SCALE, b = (y - H) / INLINE_SCALE;
    if (a < -2 || a > 26 || b < -9 || b > 9) return null;
    const d = sdPolygon(a, b, ARROW) * INLINE_SCALE;
    return toy(d, P.step, Math.abs(b) < 0.9 && a > 1.5 && a < 20);
  };
}

/** Rotator: two-arc circular arrow, two-fold symmetric, turning 3° per frame. */
const RING = { rc: 16.7, half: 3.3, headHalf: 7, arc: (110 * Math.PI) / 180, headLen: 9.2 };
const HEAD_K = RING.headLen / Math.hypot(RING.headLen, RING.headHalf); // flank distance correction
function rotator(frame, cw) {
  const dir = cw ? 1 : -1;
  const phase = (frame * ROT_DEG_PER_FRAME * Math.PI) / 180;
  const p = cw ? P.cw : P.ccw;
  return (x, y) => {
    const px = x - H, py = y - H;
    const r = Math.hypot(px, py);
    const t = Math.abs(r - RING.rc);
    if (t > RING.headHalf + 1.5) return null;
    const theta = Math.atan2(py, px) * dir - phase;
    let d = Infinity;
    for (let k = 0; k < 2; k += 1) {
      const a = theta - k * Math.PI;
      // band: angular span [0, arc] from the tail
      const m = mod(a - RING.arc / 2 + Math.PI, TAU) - Math.PI;
      const dBand = Math.max(t - RING.half, (Math.abs(m) - RING.arc / 2) * r);
      // head: from the end of the band, tapering to a point
      const hs = (mod(a - RING.arc + Math.PI, TAU) - Math.PI) * RING.rc;
      const half = RING.headHalf * (1 - hs / RING.headLen);
      const dHead = Math.max((t - half) * HEAD_K, (-hs * r) / RING.rc);
      d = Math.min(d, dBand, dHead);
    }
    return toy(d, p, t < 1.2);
  };
}

/** Incrementer: a plus in the counter colour, pulsing gently once per
 *  PULSE_FRAMES, with the counter's glyph in cream in the middle. Sized
 *  (tg-y68) so a corner or merge belt shows between its arms: arm half-length
 *  PLUS.arm, arm half-width PLUS.half, glyph radius PLUS.glyph (v2: 19, 7.5,
 *  5.4), so its reach about matches the decrementer's hub (HUB_R). */
export const PLUS = { arm: 14, half: 6, round: 2.5, glyph: 4.6 };
function incrementer(frame, colour) {
  const p = CP[colour];
  const glyph = COUNTERS[colour].glyph;
  const sc = 1 - 0.1 * (1 - Math.cos((TAU * mod(frame, PULSE_FRAMES)) / PULSE_FRAMES)) / 2;
  const reach = PLUS.arm + 2;
  return (x, y) => {
    const px = (x - H) / sc, py = (y - H) / sc;
    if (Math.abs(px) > reach || Math.abs(py) > reach) return null;
    const g = flat(sdGlyph(glyph, px, py, PLUS.glyph) * sc, C.cream);
    if (g) return g;
    const dx = Math.min(sdRoundBox(px, py, PLUS.arm, PLUS.half, PLUS.round), sdRoundBox(px, py, PLUS.half, PLUS.arm, PLUS.round)) * sc;
    return toy(dx, p, false);
  };
}

/** Hub covering a branch tile's crossing: a disc, radius chosen so it hides the
 *  whole belt overlap square (corner at 10·√2 from the centre). */
const HUB_R = 13.3;
function hub(fill, inner) {
  return (x, y) => {
    const px = x - H, py = y - H;
    const d = Math.hypot(px, py) - HUB_R;
    if (d > 1) return null;
    if (d > -1.2) return d > 0 ? C.outline : fill.dark;
    return inner(px, py) ?? fill.base;
  };
}

// Corner icons on branch tiles: the north pair marks the branch taken when the
// condition holds, the south pair the other one.
const ICON_SPOTS = { north: [[8.5, 8.5], [D - 8.5, 8.5]], south: [[8.5, D - 8.5], [D - 8.5, D - 8.5]] };
function icons(spots, draw) {
  return (x, y) => {
    for (const [cx, cy] of spots) {
      const px = x - cx, py = y - cy;
      if (Math.abs(px) > 9 || Math.abs(py) > 9) continue;
      const c = draw(px, py);
      if (c) return c;
    }
    return null;
  };
}

function wallIcon(px, py, p) {
  const d = sdRoundBox(px, py, 7, 6, 1.6);
  if (d > 1) return null;
  if (d > 0) return C.outline;
  if (d > -1) return p.dark;
  // mortar: two courses lines and staggered joints
  const row = py < -2 ? 0 : py < 2 ? 1 : 2;
  if (Math.abs(py + 2) < 0.5 || Math.abs(py - 2) < 0.5) return p.dark;
  const joints = row === 1 ? [-3.5, 3.5] : [0];
  for (const jx of joints) if (Math.abs(px - jx) < 0.5) return p.dark;
  return py < -4 || (row === 1 && py < 0) || (row === 2 && py < 4) ? p.light : p.base;
}
function magicIcon(px, py, p) {
  const d = sdRoundBox(px, py, 6.5, 6.5, 2.2);
  if (d > 1) return null;
  if (d > 0) return C.outline;
  if (d > -1) return p.dark;
  // four-point sparkle
  const s = Math.min(Math.abs(px) / 1.3 + Math.abs(py) / 4.4, Math.abs(px) / 4.4 + Math.abs(py) / 1.3) - 1;
  if (s < 0) return C.cream;
  return p.base;
}
/** A slash across a struck-out icon. */
function slash(px, py) {
  const d = sdSegment(px, py, -6.5, 6.5, 6.5, -6.5) - 1.4;
  return flat(d, C.wall);
}
const struck = (draw) => (px, py) => slash(px, py) ?? draw(px, py);

const zeroIcon = (p) => (px, py) => flat(Math.abs(sdRoundBox(px, py, 4.4, 6.2, 4.4)) - 1.7, p.base);
const minusIcon = (p) => (px, py) => flat(sdRoundBox(px, py, 6, 1.8, 1.4), p.base);

/** Start marker beside the board: a green double chevron on transparent ground. */
const START_CHEVRON = [0, -11, 7, -11, 16, 0, 7, 11, 0, 11, 9, 0];
function startMarker(x, y) {
  const py = y - H;
  const d = Math.min(sdPolygon(x - 11.5, py, START_CHEVRON), sdPolygon(x - 25.5, py, START_CHEVRON)) - 0.8;
  return toy(d, P.go, false);
}

// ---------------------------------------------------------------- sheets
const stack = (...layers) => (x, y) => {
  for (const layer of layers) {
    const c = layer(x, y);
    if (c) return c;
  }
  return CLEAR;
};

// Every belt tile is drawn in two layers, so the belt can follow the flow on
// any tile without an atlas sheet per tile and per join:
//   1. a belt underlay (floor + belt, opaque), chosen by which neighbours feed
//      the tile: LINE_SHEETS for single-exit tiles, BRANCH_SHEETS for branches;
//   2. the tile's symbol on transparent ground (arrows, rotator, plus, hub and
//      icons), drawn on top with the same global frame.
// The game mirrors these tables in TuringTable.js (LINE_SHEETS, BRANCH_SHEETS)
// and Operators.js (sheet, symbol, symbolFor).
export const LINE_SHEETS = {
  B: "conveyor", L: "conveyorFromLeft", R: "conveyorFromRight", LR: "conveyorFromBoth",
  BL: "conveyorJoinLeft", BR: "conveyorJoinRight", BLR: "conveyorJoinBoth",
};
export const BRANCH_SHEETS = { "": "branchBare", W: "branch", E: "branchFromFar", WE: "branchFromBoth" };
// The step's arrows keep the side lanes that no arc runs through.
export const STEP_SYMBOLS = {
  B: "stepForwardSymbol", L: "stepForwardSymbolSouth", BL: "stepForwardSymbolSouth",
  R: "stepForwardSymbolNorth", BR: "stepForwardSymbolNorth", LR: "stepForwardSymbolInline", BLR: "stepForwardSymbolInline",
};
const decIcons = (colour) => {
  const p = CP[colour], glyph = COUNTERS[colour].glyph;
  return stack(icons(ICON_SPOTS.north, zeroIcon(p)), icons(ICON_SPOTS.south, minusIcon(p)),
    hub(p, (px, py) => flat(sdGlyph(glyph, px, py, 6.4), C.cream)));
};

/** Tiles as the game names them (op.sheet before layering): belt kind, symbol by join. */
export const TILES = {
  conveyor: { belt: "line", anim: "conveyorMations" },
  stepForward: { belt: "line", anim: "stepForwardMations", symbol: (k) => STEP_SYMBOLS[k] },
  cwrotator: { belt: "line", anim: "cwRotatorMations", symbol: () => "cwrotatorSymbol" },
  ccwrotator: { belt: "line", anim: "ccwRotatorMations", symbol: () => "ccwrotatorSymbol" },
  detector: { belt: "branch", anim: "detectorMations", symbol: () => "detectorSymbol" },
  magicDetector: { belt: "branch", anim: "magicMation", symbol: () => "magicDetectorSymbol" },
  emptyOperator: { sheet: "emptyOperator" },
  startTile: { sheet: "startTile" },
};
for (const colour of Object.keys(COUNTERS)) {
  TILES[`incrementer${colour}`] = { belt: "line", anim: `incrementerMations${colour}`, symbol: () => `incrementer${colour}Symbol` };
  TILES[`decrementer${colour}`] = { belt: "branch", anim: `decrementerMations${colour}`, symbol: () => `decrementer${colour}Symbol` };
}

function sheetList() {
  const list = [];
  for (const [k, name] of Object.entries(LINE_SHEETS))
    list.push({ name, layer: "belt", frames: BELT_FRAMES, anim: "conveyorMations", inputs: k, scene: (f) => stack(lineBelt(beltOffset(f), k), floorAt) });
  for (const [k, name] of Object.entries(BRANCH_SHEETS))
    list.push({ name, layer: "belt", frames: BELT_FRAMES, anim: "detectorMations", inputs: k, scene: (f) => stack(branchBelt(beltOffset(f), k), floorAt) });
  const sym = (name, frames, anim, draw) => list.push({ name, layer: "symbol", frames, anim, scene: (f) => stack(draw(f)) });
  sym("stepForwardSymbol", STEP_FRAMES, "stepForwardMations", (f) => stepArrows(f, "NS"));
  sym("stepForwardSymbolNorth", STEP_FRAMES, "stepForwardMations", (f) => stepArrows(f, "N"));
  sym("stepForwardSymbolSouth", STEP_FRAMES, "stepForwardMations", (f) => stepArrows(f, "S"));
  sym("stepForwardSymbolInline", STEP_FRAMES, "stepForwardMations", (f) => stepArrowInline(f));
  sym("cwrotatorSymbol", 60, "cwRotatorMations", (f) => rotator(f, true));
  sym("ccwrotatorSymbol", 60, "ccwRotatorMations", (f) => rotator(f, false));
  for (const colour of Object.keys(COUNTERS))
    sym(`incrementer${colour}Symbol`, PULSE_FRAMES, `incrementerMations${colour}`, (f) => incrementer(f, colour));
  // Branch symbols do not move: one frame each (the belt underneath animates).
  sym("detectorSymbol", 1, "detectorMations", () => stack(
    icons(ICON_SPOTS.north, (px, py) => wallIcon(px, py, P.wall)),
    icons(ICON_SPOTS.south, struck((px, py) => wallIcon(px, py, P.pale))),
    hub(P.cream, (px, py) => toy((Math.abs(px) + Math.abs(py) - 7.5) / Math.SQRT2, P.wall, false))));
  sym("magicDetectorSymbol", 1, "magicMation", () => stack(
    icons(ICON_SPOTS.north, (px, py) => magicIcon(px, py, P.step)),
    icons(ICON_SPOTS.south, struck((px, py) => magicIcon(px, py, P.pale))),
    hub(P.cream, (px, py) => toy((Math.abs(px) + Math.abs(py) - 7.5) / Math.SQRT2, P.step, false))));
  for (const colour of Object.keys(COUNTERS))
    sym(`decrementer${colour}Symbol`, 1, `decrementerMations${colour}`, () => decIcons(colour));
  list.push({ name: "emptyOperator", layer: "tile", frames: 1, anim: "emptyMation", scene: () => stack(floorAt) });
  list.push({ name: "startTile", layer: "tile", frames: 1, anim: "startTileMation", scene: () => stack(startMarker) });
  return list;
}
export const SHEETS = sheetList();
const BY_NAME = Object.fromEntries(SHEETS.map((s) => [s.name, s]));

/** The atlas sheets a tile is drawn with, for a join key (LINE_SHEETS or
 *  BRANCH_SHEETS key; default the unfed one: "B" for a line, "" for a
 *  branch): [underlay, symbol or null]. */
export function tileLayers(tile, key) {
  const t = TILES[tile];
  if (!t) throw new Error(`unknown tile ${tile}`);
  if (t.sheet) return [t.sheet, null];
  const table = t.belt === "line" ? LINE_SHEETS : BRANCH_SHEETS;
  const k = key ?? (t.belt === "line" ? "B" : "");
  if (!table[k]) throw new Error(`${tile}: no ${t.belt} join ${k}`);
  return [table[k], t.symbol ? t.symbol(k) : null];
}
/** Frames in a tile's loop (its longest layer). */
export const tileFrames = (tile, key) => Math.max(...tileLayers(tile, key).filter(Boolean).map((s) => BY_NAME[s].frames));

// ---------------------------------------------------------------- rasteriser
const SS = 8; // supersamples per axis on edge pixels

/** Renders a scene (x, y in design units -> RGBA) into an n x n raster. */
export function render(scene, n) {
  const s = D / n;
  const img = blank(n, n);
  const G = 2 * n + 1;
  const grid = new Array(G * G);
  for (let j = 0; j < G; j += 1)
    for (let i = 0; i < G; i += 1) grid[j * G + i] = scene(i * 0.5 * s, j * 0.5 * s);
  for (let py = 0; py < n; py += 1)
    for (let px = 0; px < n; px += 1) {
      const at = (2 * py) * G + 2 * px;
      const c = grid[at + G + 1];
      let out;
      if (grid[at] === c && grid[at + 2] === c && grid[at + 2 * G] === c && grid[at + 2 * G + 2] === c) out = c;
      else {
        let r = 0, g = 0, b = 0, a = 0;
        for (let sy = 0; sy < SS; sy += 1)
          for (let sx = 0; sx < SS; sx += 1) {
            const q = scene((px + (sx + 0.5) / SS) * s, (py + (sy + 0.5) / SS) * s);
            const qa = q[3];
            r += q[0] * qa; g += q[1] * qa; b += q[2] * qa; a += qa;
          }
        out = a === 0 ? CLEAR : [Math.round(r / a), Math.round(g / a), Math.round(b / a), Math.round(a / (SS * SS))];
      }
      img.data.set(out, (py * n + px) * 4);
    }
  return img;
}

const sheetCache = new Map();
/** One atlas frame (frame wraps at the sheet's length). */
export function drawSheet(name, frame, n = DEFAULT_SIZE) {
  const sheet = BY_NAME[name];
  if (!sheet) throw new Error(`unknown sheet ${name}`);
  const f = mod(frame, sheet.frames), id = `${name}/${f}/${n}`;
  if (!sheetCache.has(id)) sheetCache.set(id, render(sheet.scene(f), n));
  return sheetCache.get(id);
}

/** A tile as the game shows it at global frame `frame`: its belt underlay for
 *  join `key`, then its symbol on top (both at frame mod their own length). */
export function drawTile(tile, frame, n = DEFAULT_SIZE, key) {
  const out = blank(n, n);
  for (const s of tileLayers(tile, key)) if (s) composite(out, drawSheet(s, frame, n), 0, 0);
  return out;
}

export function layoutAtlas(n) {
  const layout = {};
  let row = 0;
  let smallX = 0, smallRow = -1;
  for (const sheet of SHEETS) {
    if (sheet.frames === 1) {
      // single frames share one row
      if (smallRow < 0 || smallX >= COLS) { smallRow = row; row += 1; smallX = 0; }
      layout[sheet.name] = { sx: smallX * n, sy: smallRow * n, tilew: n, tileh: n, w: n, h: n, frames: 1 };
      smallX += 1;
      continue;
    }
    const rows = Math.ceil(sheet.frames / COLS);
    layout[sheet.name] = { sx: 0, sy: row * n, tilew: n, tileh: n, w: Math.min(sheet.frames, COLS) * n, h: rows * n, frames: sheet.frames };
    row += rows;
  }
  return { layout, width: COLS * n, height: row * n };
}

export function buildAtlas(n = DEFAULT_SIZE) {
  const { layout, width, height } = layoutAtlas(n);
  const atlas = blank(width, height);
  for (const sheet of SHEETS) {
    const L = layout[sheet.name];
    const cols = L.w / n;
    for (let f = 0; f < sheet.frames; f += 1)
      composite(atlas, drawSheet(sheet.name, f, n), L.sx + (f % cols) * n, L.sy + Math.floor(f / cols) * n);
  }
  return { atlas, json: JSON.stringify(layout, null, 2) + "\n" };
}

// ---------------------------------------------------------------- review sheets
function rotate90(src, quarterTurnsCw) {
  let out = src;
  for (let q = 0; q < mod(quarterTurnsCw, 4); q += 1) {
    const r = blank(out.height, out.width);
    for (let y = 0; y < out.height; y += 1)
      for (let x = 0; x < out.width; x += 1)
        r.data.set(out.data.subarray((y * out.width + x) * 4, (y * out.width + x) * 4 + 4), (x * r.width + (out.height - 1 - y)) * 4);
    out = r;
  }
  return out;
}

// Mock boards: [col, row, tile, quarter turns clockwise]. Joins are derived
// from the cells with the game's rule (joinKey), as TuringTable.beltSheet does.
// MOCK (also in demo/tiles.js): a U-turn top left, a straight run with step,
// rotator and counter, a detector whose branches turn east through corner
// belts, and more branches below.
export const MOCK = {
  cols: 7, rows: 5,
  cells: [
    [0, 0, "conveyor", 0], [1, 0, "stepForward", 0], [2, 0, "conveyor", 1],
    [2, 1, "conveyor", 2], [1, 1, "ccwrotator", 2], [0, 1, "stepForward", 2],
    [0, 2, "conveyor", 0], [1, 2, "stepForward", 0], [2, 2, "cwrotator", 0], [3, 2, "incrementerRed", 0], [4, 2, "detector", 0],
    [4, 1, "conveyor", 0], [5, 1, "ccwrotator", 0], [6, 1, "conveyor", 0],
    [4, 3, "conveyor", 0], [5, 3, "decrementerBlue", 0],
    [5, 2, "conveyor", 0], [6, 2, "incrementerYellow", 0],
    [5, 4, "conveyor", 0], [6, 4, "magicDetector", 0],
    [0, 4, "decrementerGreen", 1], [1, 4, "incrementerPurple", 3], [2, 4, "decrementerPink", 0], [3, 4, "startTile", 0],
  ],
};
// MERGES: a T of two belts into a step; a rotator fed from behind and its
// left; a counter fed from behind and its right; a rotator fed from all three
// sides; step, turn and counter tiles fed only from a side; a detector fed
// from behind and its far side; a T of two belts on a plain conveyor.
export const MERGES = {
  cols: 8, rows: 6,
  cells: [
    [1, 0, "conveyor", 0], [2, 0, "conveyor", 1],
    [0, 2, "conveyor", 0], [1, 2, "conveyor", 0], [2, 2, "conveyor", 3],
    [2, 1, "conveyor", 0], [3, 1, "stepForward", 0], [4, 1, "cwrotator", 0], [5, 1, "incrementerBlue", 0], [6, 1, "conveyor", 0],
    [3, 0, "conveyor", 0], [4, 0, "conveyor", 1],
    [5, 2, "conveyor", 3], [5, 3, "stepForward", 3], [4, 3, "conveyor", 0],
    [6, 0, "conveyor", 0], [7, 0, "conveyor", 1], [7, 1, "detector", 3], [7, 2, "conveyor", 3],
    [0, 4, "conveyor", 0], [1, 4, "stepForward", 3], [1, 3, "cwrotator", 0], [2, 3, "incrementerGreen", 1],
    [2, 4, "stepForward", 0], [3, 4, "ccwrotator", 0], [4, 4, "conveyor", 0],
    [3, 3, "conveyor", 1], [3, 5, "conveyor", 3], [2, 5, "conveyor", 0],
    [6, 4, "stepForward", 3], [6, 5, "conveyor", 3], [5, 5, "conveyor", 0], [7, 5, "conveyor", 2], [6, 3, "conveyor", 3],
  ],
};
// BRANCHES (tg-amy): conditionals in each join, left to right: a detector fed
// by nothing (outgoing belts only), a magic detector fed from behind, a
// decrementer fed from its far side, a decrementer fed from both. Their exits
// carry on as belts (corners or straight).
export const BRANCHES = {
  cols: 11, rows: 3,
  cells: [
    [0, 1, "detector", 0], [0, 0, "conveyor", 0], [0, 2, "conveyor", 0],
    [2, 1, "conveyor", 0], [3, 1, "magicDetector", 0], [3, 0, "conveyor", 0], [3, 2, "conveyor", 0],
    [5, 1, "decrementerRed", 0], [6, 1, "conveyor", 2], [5, 0, "conveyor", 2], [5, 2, "conveyor", 2],
    [8, 1, "conveyor", 0], [9, 1, "decrementerBlue", 0], [10, 1, "conveyor", 2], [9, 0, "conveyor", 3], [9, 2, "conveyor", 1],
  ],
};
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // quarter turns clockwise: E, S, W, N
function exitsOf(c) {
  const t = c && TILES[c[2]];
  if (!t || !t.belt) return [];
  return t.belt === "line" ? [DIRS[c[3]]] : [DIRS[(c[3] + 3) % 4], DIRS[(c[3] + 1) % 4]];
}
/** The join key of cell c on a board (the game's TuringTable.beltSheet rule). */
export function joinKey(board, c) {
  const t = TILES[c[2]];
  if (!t.belt) return undefined;
  const grid = board.grid ?? (board.grid = new Map(board.cells.map((k) => [`${k[0]},${k[1]}`, k])));
  const feeds = (d) => {
    const from = grid.get(`${c[0] + d[0]},${c[1] + d[1]}`);
    return exitsOf(from).some((e) => e[0] === -d[0] && e[1] === -d[1]);
  };
  const f = DIRS[c[3]], b = [-f[0], -f[1]], l = DIRS[(c[3] + 3) % 4], r = DIRS[(c[3] + 1) % 4];
  if (t.belt === "branch") return (feeds(b) ? "W" : "") + (feeds(f) ? "E" : "");
  return (feeds(b) ? "B" : "") + (feeds(l) ? "L" : "") + (feeds(r) ? "R" : "") || "B";
}
function mockBoard(board, globalFrame, n, bg) {
  const img = blank(board.cols * n, board.rows * n, bg);
  const grid = new Map(board.cells.map((c) => [`${c[0]},${c[1]}`, c]));
  for (let j = 0; j < board.rows; j += 1)
    for (let i = 0; i < board.cols; i += 1) {
      const c = grid.get(`${i},${j}`) ?? [i, j, "emptyOperator", 0];
      if (c[2] === "startTile") composite(img, drawTile("emptyOperator", 0, n), i * n, j * n);
      composite(img, rotate90(drawTile(c[2], globalFrame, n, joinKey(board, c)), c[3]), i * n, j * n);
    }
  return img;
}

const INK = parseColour("#2a2335");
const label = (img, text, x, y, colour = INK) => drawText(img, text, x, y, colour);

function contactSheet(n) {
  const light = parseColour("#efe9dc"), dark = parseColour("#1b1a20");
  const picks = (frames) => (frames === 1 ? [0] : [0, Math.floor(frames / 4), Math.floor(frames / 2), Math.floor((3 * frames) / 4)]);
  const zoom = 4;
  const colW = 6 * (n + 4) + 2 * (zoom * n + 8) + 20;
  const rowH = zoom * n + 26;
  const half = Math.ceil(SHEETS.length / 2);
  const sheet = blank(2 * colW + 30, half * rowH + 20, light);
  SHEETS.forEach((s, idx) => {
    const x0 = 10 + (idx < half ? 0 : colW + 10);
    const y = 10 + (idx % half) * rowH;
    label(sheet, `${s.name} ${s.frames}F`, x0, y);
    const fs4 = picks(s.frames);
    fs4.forEach((f, k) => {
      composite(sheet, drawSheet(s.name, f, n), x0 + k * (n + 4), y + 12);
      label(sheet, `${f}`, x0 + k * (n + 4), y + 14 + n);
    });
    // dark ground, frame 0
    fillRect(sheet, x0 + 4 * (n + 4), y + 12, n + 8, n + 8, dark);
    composite(sheet, drawSheet(s.name, 0, n), x0 + 4 * (n + 4) + 4, y + 16);
    // x4, two frames
    [0, fs4[Math.min(1, fs4.length - 1)]].forEach((f, k) => {
      composite(sheet, scaleNearest(drawSheet(s.name, f, n), zoom), x0 + 6 * (n + 4) + k * (zoom * n + 8), y + 12);
    });
  });
  return sheet;
}

/** Every join of every belt tile as the game composes it (underlay + symbol),
 *  at `zoom`, frame `frame`, with the 1x tile beside each. */
const KEY_LABEL = { B: "BEHIND", L: "LEFT", R: "RIGHT", LR: "LEFT+RIGHT (T)", BL: "BEHIND+LEFT", BR: "BEHIND+RIGHT", BLR: "ALL THREE", "": "NOT FED", W: "BEHIND", E: "FAR SIDE", WE: "BEHIND+FAR" };
function variantSheet(n, zoom = 3, frame = 7, belt = null) {
  const light = parseColour("#efe9dc");
  const tiles = Object.keys(TILES).filter((t) => TILES[t].belt && (!belt || TILES[t].belt === belt));
  const cell = zoom * n + 14, rowH = zoom * n + 30, left = 150;
  const cols = belt === "branch" ? BRANCH_INPUTS.length : LINE_INPUTS.length;
  const sheet = blank(left + cols * cell + 10, 30 + tiles.length * rowH, light);
  label(sheet, `EVERY BELT JOIN PER TILE, ${zoom}X, FRAME ${frame} (TILE POINTS EAST; LEFT = NORTH)`, 10, 8);
  tiles.forEach((t, j) => {
    const y = 26 + j * rowH;
    label(sheet, t.toUpperCase(), 10, y + 14);
    const keys = TILES[t].belt === "line" ? LINE_INPUTS : BRANCH_INPUTS;
    composite(sheet, drawTile(t, frame, n), 10, y + 28);
    keys.forEach((k, i) => {
      const x = left + i * cell;
      label(sheet, KEY_LABEL[k], x, y);
      composite(sheet, scaleNearest(drawTile(t, frame, n, k), zoom), x, y + 12);
    });
  });
  return sheet;
}

function seamSheet(n, board = MOCK, title = "SEAMS, CORNERS, BRANCHES") {
  const light = parseColour("#efe9dc"), dark = parseColour("#1b1a20");
  const bw = board.cols * n, bh = board.rows * n;
  const zoom = 3;
  const sheet = blank(Math.max(2 * bw + 40, zoom * bw + 20), 3 * (bh + 24) + zoom * bh + 40, light);
  let y = 10;
  for (const f of [0, 7, 33]) {
    label(sheet, `BOARD AT 1X, FRAME ${f}, ON LIGHT AND DARK`, 10, y);
    composite(sheet, mockBoard(board, f, n, CLEAR), 10, y + 12);
    fillRect(sheet, bw + 20, y + 8, bw + 16, bh + 8, dark);
    composite(sheet, mockBoard(board, f, n, CLEAR), bw + 28, y + 12);
    y += bh + 24;
  }
  label(sheet, `BOARD AT 3X, FRAME 7 (${title})`, 10, y);
  composite(sheet, scaleNearest(mockBoard(board, 7, n, CLEAR), zoom), 10, y + 12);
  return sheet;
}

// ---------------------------------------------------------------- self-checks
const strip = (img, side) => {
  const n = img.width, out = [];
  for (let k = 0; k < n; k += 1) {
    const [x, y] = side === "W" ? [0, k] : side === "E" ? [n - 1, k] : side === "N" ? [k, 0] : [k, n - 1];
    out.push(...img.data.subarray((y * n + x) * 4, (y * n + x) * 4 + 4));
  }
  return out;
};
function stripDiff(a, b) {
  let max = 0, sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = Math.abs(a[i] - b[i]);
    max = Math.max(max, d);
    sum += d;
  }
  return { max, mean: sum / a.length };
}

/** Parses the tile animations out of script.js: name -> { frames, rate }. */
function scriptAnimations() {
  const src = fs.readFileSync(path.join(ROOT, SCRIPT_JS), "utf8");
  const vars = {};
  for (const m of src.matchAll(/var\s+(\w+)\s*=\s*([\d.]+)\s*;/g)) vars[m[1]] = Number(m[2]);
  const anims = {};
  const re = /Q\.animations\(\s*['"](\w+)['"]\s*(\+\s*i\s*)?,\s*\{\s*"default"\s*:\s*\{\s*frames\s*:\s*(pom\((\d+)\)|\[[\d,\s]*\])\s*,\s*rate\s*:\s*([\w.]+)/g;
  for (const m of src.matchAll(re)) {
    const frames = m[4] ? Number(m[4]) : JSON.parse(m[3]).length;
    const rate = /^[\d.]+$/.test(m[5]) ? Number(m[5]) : vars[m[5]];
    const names = m[2] ? Object.keys(COUNTERS).map((c) => m[1] + c) : [m[1]];
    for (const name of names) anims[name] = { frames, rate };
  }
  return anims;
}

const alphaAt = (img, x, y) => img.data[(y * img.width + x) * 4 + 3];

function selfCheck(n) {
  const problems = [];
  if (D % PERIOD !== 0) problems.push("belt period must divide the tile");
  const anims = scriptAnimations();
  for (const s of SHEETS) {
    const a = anims[s.anim];
    if (!a) { problems.push(`${s.name}: animation ${s.anim} not found in ${SCRIPT_JS}`); continue; }
    // a one-frame symbol is static over its tile's animated belt
    const staticSymbol = s.layer === "symbol" && s.frames === 1;
    if (!staticSymbol && a.frames !== s.frames) problems.push(`${s.name}: ${SCRIPT_JS} ${s.anim} has ${a.frames} frames, the atlas has ${s.frames}`);
    if (s.frames > 1 && a.rate !== RATE) problems.push(`${s.name}: ${SCRIPT_JS} ${s.anim} rate ${a.rate}, want ${RATE} (the 2012 rate)`);
    if (s.frames > 1 && s.frames % BELT_FRAMES !== 0) problems.push(`${s.name}: frame count must be a multiple of ${BELT_FRAMES} so belts stay in phase`);
  }
  for (const [t, def] of Object.entries(TILES)) {
    if (!def.belt) continue;
    const a = anims[def.anim];
    const keys = def.belt === "line" ? LINE_INPUTS : BRANCH_INPUTS;
    for (const k of keys)
      for (const s of tileLayers(t, k))
        if (s && a && BY_NAME[s].frames > 1 && a.frames % BY_NAME[s].frames !== 0)
          problems.push(`${t}: layer ${s} (${BY_NAME[s].frames} frames) does not divide ${def.anim} (${a.frames})`);
  }
  // Loop closure: frame N continues into frame 0 (scene at f = frames equals f = 0).
  for (const s of SHEETS) {
    if (s.frames === 1) continue;
    const a = render(s.scene(s.frames), n), b = render(s.scene(0), n);
    const d = stripDiff(a.data, b.data);
    if (d.max > 2) problems.push(`${s.name}: loop does not close (max diff ${d.max})`);
  }
  // Seams: every belt opening matches the plain conveyor's at the same global
  // frame (straight belts exactly; arcs and branches within anti-aliasing).
  const band = (st) => st.slice(4 * Math.floor((H - BELT_HALF) * (n / D)), 4 * Math.ceil((H + BELT_HALF) * (n / D)));
  const seam = [];
  for (const f of [0, 3, 11]) {
    const c = drawSheet("conveyor", f, n);
    const cS = rotate90(c, 1), cN = rotate90(c, 3), cW = rotate90(c, 2); // pointing south, north, west
    const want = {
      W: strip(c, "W"), E: strip(c, "E"), Nin: strip(cS, "N"), Sin: strip(cN, "S"), Nout: strip(cN, "N"), Sout: strip(cS, "S"), Ein: strip(cW, "E"),
    };
    const checks = [];
    const add = (name, side, got, exp, exact) => checks.push([name, side, band(got), band(exp), exact]);
    for (const s of SHEETS) {
      if (s.layer !== "belt") continue;
      const img = drawSheet(s.name, f, n), k = s.inputs;
      if (s.name.startsWith("branch")) {
        if (k.includes("W")) add(s.name, "W", strip(img, "W"), want.W, true);
        if (k.includes("E")) add(s.name, "E", strip(img, "E"), want.Ein, true);
        add(s.name, "N", strip(img, "N"), want.Nout, false); add(s.name, "S", strip(img, "S"), want.Sout, false);
      } else {
        if (k.includes("B")) add(s.name, "W", strip(img, "W"), want.W, true);
        if (k.includes("L")) add(s.name, "N", strip(img, "N"), want.Nin, false);
        if (k.includes("R")) add(s.name, "S", strip(img, "S"), want.Sin, false);
        add(s.name, "E", strip(img, "E"), want.E, k.includes("B"));
      }
    }
    for (const [name, side, got, exp, exact] of checks) {
      const d = stripDiff(got, exp);
      seam.push([name, side, d.max, d.mean]);
      if (exact ? d.max > 0 : d.max > 64 || d.mean > 6) problems.push(`${name} frame ${f}: ${side} edge differs from the conveyor (max ${d.max}, mean ${d.mean.toFixed(2)})`);
    }
  }
  // A branch's unfed sides show bare floor (tg-amy): no stub without a feeder.
  // Checked over the whole unfed half, west or east of the outgoing belt.
  const floor = drawSheet("emptyOperator", 0, n);
  for (const [k, name] of Object.entries(BRANCH_SHEETS))
    for (const f of [0, 7])
      for (const side of ["W", "E"]) {
        if (k.includes(side)) continue;
        const img = drawSheet(name, f, n);
        let diff = 0;
        for (let y = 0; y < n; y += 1)
          for (let x = 0; x < n; x += 1) {
            const fx = (x + 0.5) * (D / n);
            if (side === "W" ? fx >= H - BELT_HALF - 1.5 : fx <= H + BELT_HALF + 1.5) continue;
            const i = (y * n + x) * 4;
            for (let c = 0; c < 4; c += 1) diff = Math.max(diff, Math.abs(img.data[i + c] - floor.data[i + c]));
          }
        if (diff > 0) problems.push(`${name} frame ${f}: unfed ${side} side is not bare floor (max diff ${diff})`);
      }
  // Symbols leave the belt band of every opening of the joins they are drawn
  // with clear (an anti-aliased outline sliver of alpha <= 16 is tolerated),
  // so the underlay's seams show.
  const lo = Math.floor((H - BELT_HALF) * (n / D)), hi = Math.ceil((H + BELT_HALF) * (n / D));
  const edgeAt = { W: (k) => [0, k], E: (k) => [n - 1, k], N: (k) => [k, 0], S: (k) => [k, n - 1] };
  const opened = new Set();
  for (const [t, def] of Object.entries(TILES)) {
    if (!def.belt) continue;
    for (const k of def.belt === "line" ? LINE_INPUTS : BRANCH_INPUTS) {
      const sym = tileLayers(t, k)[1];
      if (!sym) continue;
      const edges = def.belt === "line"
        ? ["E", ...(k.includes("B") ? ["W"] : []), ...(k.includes("L") ? ["N"] : []), ...(k.includes("R") ? ["S"] : [])]
        : ["N", "S", ...(k.includes("W") ? ["W"] : []), ...(k.includes("E") ? ["E"] : [])];
      for (const e of edges) opened.add(`${sym}:${e}`);
    }
  }
  for (const key of opened) {
    const [name, e] = key.split(":"), s = BY_NAME[name];
    for (let f = 0; f < s.frames; f += 1) {
      const img = drawSheet(name, f, n);
      let worst = 0;
      for (let k = lo; k < hi; k += 1) worst = Math.max(worst, alphaAt(img, ...edgeAt[e](k)));
      if (worst > 16) { problems.push(`${name} frame ${f}: covers the ${e} belt opening (alpha ${worst})`); break; }
    }
  }
  // The step's arrows never touch a side arc (arrows keep to free lanes; the
  // inline arrow stops short of a T's arcs). Arc masks ignore the main line,
  // which the inline arrow rides on purpose when the tile is also fed from behind.
  const collisions = [];
  for (const k of LINE_INPUTS) {
    const sides = k.replace("B", "");
    if (!sides) continue;
    const mask = render(stack(lineBelt(0, sides)), n);
    const sym = STEP_SYMBOLS[k];
    let worst = 0;
    for (let f = 0; f < BY_NAME[sym].frames; f += 1) {
      const img = drawSheet(sym, f, n);
      let hits = 0;
      for (let i = 3; i < img.data.length; i += 4) if (img.data[i] && mask.data[i]) hits += 1;
      worst = Math.max(worst, hits);
    }
    collisions.push([k, sym, worst]);
    if (worst > 0) problems.push(`stepForward join ${k}: ${sym} overlaps a side arc (${worst} px)`);
  }
  return { problems, seam, collisions };
}

// ---------------------------------------------------------------- main
function main(argv) {
  const check = argv.includes("--check");
  const arg = (flag) => (argv.indexOf(flag) >= 0 ? argv[argv.indexOf(flag) + 1] : undefined);
  const n = Number(arg("--size") ?? DEFAULT_SIZE);
  if (!Number.isInteger(n) || n < 16) throw new Error("--size wants a whole number of px >= 16");
  if (check && n !== DEFAULT_SIZE) throw new Error(`--check compares the shipped ${DEFAULT_SIZE} px atlas`);
  const tag = arg("--tag") ?? "program-tiles-v2";
  const { problems, seam, collisions } = selfCheck(n);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  const worst = seam.reduce((w, s) => (s[2] > w[2] ? s : w), ["", "", -1, 0]);
  const { atlas, json } = buildAtlas(n);
  const pngPath = path.join(ROOT, PNG_OUT);
  const jsonPath = path.join(ROOT, JSON_OUT);
  if (check) {
    const bad = [];
    if (!fs.existsSync(pngPath)) bad.push(`${PNG_OUT} missing`);
    else if (pixelSha256(decodePng(fs.readFileSync(pngPath))) !== pixelSha256(atlas)) bad.push(`${PNG_OUT} differs from the generator`);
    if (!fs.existsSync(jsonPath) || fs.readFileSync(jsonPath, "utf8") !== json) bad.push(`${JSON_OUT} differs from the generator`);
    if (bad.length) {
      console.error(`program-tiles --check FAILED:\n  ${bad.join("\n  ")}\nRegenerate with: node tools/art/tiles/program-tiles.mjs`);
      process.exit(1);
    }
    console.log(`program-tiles --check OK (${atlas.width}x${atlas.height}, ${pixelSha256(atlas).slice(0, 12)}; timings match ${SCRIPT_JS}; ` +
      `${seam.length} belt openings, unfed branch sides bare, worst curved seam ${worst[0]} ${worst[1]} max ${worst[2]}; step arrows clear of side arcs in ${collisions.length} joins)`);
  } else if (n === DEFAULT_SIZE || argv.includes("--write")) {
    fs.mkdirSync(path.dirname(pngPath), { recursive: true });
    fs.writeFileSync(pngPath, encodePng(atlas));
    fs.writeFileSync(jsonPath, json);
    console.log(`wrote ${PNG_OUT} (${atlas.width}x${atlas.height}, ${n} px frames) and ${JSON_OUT}`);
  } else {
    console.log(`rendered ${atlas.width}x${atlas.height} at ${n} px (not written: pass --write to replace the shipped ${DEFAULT_SIZE} px atlas)`);
  }
  const reviewDir = arg("--review");
  if (reviewDir) {
    const dir = path.resolve(reviewDir);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${tag}.png`), encodePng(contactSheet(n)));
    fs.writeFileSync(path.join(dir, `${tag}-seam.png`), encodePng(seamSheet(n)));
    fs.writeFileSync(path.join(dir, `${tag}-merges.png`), encodePng(seamSheet(n, MERGES, "T, MERGES, SIDE-FED STEP, TURN AND COUNTER")));
    fs.writeFileSync(path.join(dir, `${tag}-variants.png`), encodePng(variantSheet(n)));
    fs.writeFileSync(path.join(dir, `${tag}-branches.png`), encodePng(seamSheet(n, BRANCHES, "BRANCHES: NOT FED, BEHIND, FAR SIDE, BOTH")));
    fs.writeFileSync(path.join(dir, `${tag}-branch-variants.png`), encodePng(variantSheet(n, 3, 7, "branch")));
    console.log(`review sheets in ${dir}: ${tag}.png (atlas), ${tag}-seam.png, ${tag}-merges.png, ${tag}-variants.png, ` +
      `${tag}-branches.png, ${tag}-branch-variants.png`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
