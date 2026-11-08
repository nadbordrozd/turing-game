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
//                                                        also write <tag>.png (contact) and <tag>-seam.png (board mock)
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

/** Straight belt west to east across the middle. */
const straightBelt = (off) => (x, y) => beltAt(x, y - H, off);

/** Corner belt: enters through the north edge (the tile's left side when it
 *  points east) and leaves through the east edge, a quarter circle of radius
 *  D/2 about the north-east corner. `fromRight` mirrors it (enters from the south).
 *  The arc's centre line is (pi/2)(D/2) = 42.4 units long, so it carries
 *  CORNER_PERIODS = 3 chevrons (40.5 units) instead of a straight tile's four:
 *  chevrons keep their spacing and speed through the bend (within 5%), and
 *  both openings still sit on a whole period, in phase with straight belts. */
export const CORNER_PERIODS = 3;
function cornerBelt(off, fromRight) {
  const ARC = Math.PI / 2;
  return (x, y) => {
    const yy = fromRight ? D - y : y;
    const dx = x - D, r = Math.hypot(dx, yy);
    const v = r - H;
    if (v <= -BELT_HALF || v >= BELT_HALF) return null;
    const phi = Math.atan2(yy, dx); // pi at the entry, pi/2 at the exit
    const u = ((Math.PI - phi) / ARC) * CORNER_PERIODS * PERIOD;
    return beltAt(u, v, off);
  };
}

/** Branch belt: in from the west, out to the north and the south. The
 *  crossing is covered by the hub. Both halves continue the flow coordinate
 *  from the centre, so chevrons run outwards and stay in phase with straight belts. */
function branchBelt(off) {
  return (x, y) => {
    const vx = x - H;
    if (vx > -BELT_HALF && vx < BELT_HALF) return beltAt(y < H ? D - y : y, vx, off);
    if (x < H) return beltAt(x, y - H, off);
    return null;
  };
}

/** Step: one sky-blue arrow per lane per tile, above and below the belt,
 *  sliding east one tile per STEP_FRAMES. Lanes wrap across tile edges. */
const ARROW = [0, -3, 13, -3, 13, -7, 24, 0, 13, 7, 13, 3, 0, 3];
const ARROW_LANES = [8.5, D - 8.5];
const ARROW_START = 6;
function stepArrows(frame) {
  const shift = (mod(frame, STEP_FRAMES) * D) / STEP_FRAMES;
  return (x, y) => {
    for (const cy of ARROW_LANES) {
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

/** Incrementer: a chunky plus in the counter colour, pulsing gently once per
 *  PULSE_FRAMES, with the counter's glyph in cream in the middle. */
function incrementer(frame, colour) {
  const p = CP[colour];
  const glyph = COUNTERS[colour].glyph;
  const sc = 1 - 0.1 * (1 - Math.cos((TAU * mod(frame, PULSE_FRAMES)) / PULSE_FRAMES)) / 2;
  return (x, y) => {
    const px = (x - H) / sc, py = (y - H) / sc;
    if (Math.abs(px) > 21 || Math.abs(py) > 21) return null;
    const g = flat(sdGlyph(glyph, px, py, 5.4) * sc, C.cream);
    if (g) return g;
    const dx = Math.min(sdRoundBox(px, py, 19, 7.5, 3), sdRoundBox(px, py, 7.5, 19, 3)) * sc;
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

function sheetList() {
  const list = [
    { name: "conveyor", frames: BELT_FRAMES, anim: "conveyorMations", scene: (f) => stack(straightBelt(beltOffset(f)), floorAt) },
    { name: "conveyorFromLeft", frames: BELT_FRAMES, anim: "conveyorMations", scene: (f) => stack(cornerBelt(beltOffset(f), false), floorAt) },
    { name: "conveyorFromRight", frames: BELT_FRAMES, anim: "conveyorMations", scene: (f) => stack(cornerBelt(beltOffset(f), true), floorAt) },
    { name: "stepForward", frames: STEP_FRAMES, anim: "stepForwardMations", scene: (f) => stack(stepArrows(f), straightBelt(beltOffset(f)), floorAt) },
    { name: "cwrotator", frames: 60, anim: "cwRotatorMations", scene: (f) => stack(rotator(f, true), straightBelt(beltOffset(f)), floorAt) },
    { name: "ccwrotator", frames: 60, anim: "ccwRotatorMations", scene: (f) => stack(rotator(f, false), straightBelt(beltOffset(f)), floorAt) },
    {
      name: "detector", frames: BELT_FRAMES, anim: "detectorMations",
      scene: (f) => stack(
        icons(ICON_SPOTS.north, (px, py) => wallIcon(px, py, P.wall)),
        icons(ICON_SPOTS.south, struck((px, py) => wallIcon(px, py, P.pale))),
        hub(P.cream, (px, py) => toy((Math.abs(px) + Math.abs(py) - 7.5) / Math.SQRT2, P.wall, false)),
        branchBelt(beltOffset(f)), floorAt),
    },
    {
      name: "magicDetector", frames: BELT_FRAMES, anim: "magicMation",
      scene: (f) => stack(
        icons(ICON_SPOTS.north, (px, py) => magicIcon(px, py, P.step)),
        icons(ICON_SPOTS.south, struck((px, py) => magicIcon(px, py, P.pale))),
        hub(P.cream, (px, py) => toy((Math.abs(px) + Math.abs(py) - 7.5) / Math.SQRT2, P.step, false)),
        branchBelt(beltOffset(f)), floorAt),
    },
  ];
  for (const colour of Object.keys(COUNTERS))
    list.push({
      name: `incrementer${colour}`, frames: PULSE_FRAMES, anim: `incrementerMations${colour}`,
      scene: (f) => stack(incrementer(f, colour), straightBelt(beltOffset(f)), floorAt),
    });
  for (const colour of Object.keys(COUNTERS)) {
    const p = CP[colour];
    const glyph = COUNTERS[colour].glyph;
    list.push({
      name: `decrementer${colour}`, frames: BELT_FRAMES, anim: `decrementerMations${colour}`,
      scene: (f) => stack(
        icons(ICON_SPOTS.north, zeroIcon(p)),
        icons(ICON_SPOTS.south, minusIcon(p)),
        hub(p, (px, py) => flat(sdGlyph(glyph, px, py, 6.4), C.cream)),
        branchBelt(beltOffset(f)), floorAt),
    });
  }
  list.push({ name: "emptyOperator", frames: 1, anim: "emptyMation", scene: () => stack(floorAt) });
  list.push({ name: "startTile", frames: 1, anim: "startTileMation", scene: () => stack(startMarker) });
  return list;
}
export const SHEETS = sheetList();
const BY_NAME = Object.fromEntries(SHEETS.map((s) => [s.name, s]));

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

export function drawTile(name, frame, n = DEFAULT_SIZE) {
  const sheet = BY_NAME[name];
  if (!sheet) throw new Error(`unknown tile ${name}`);
  return render(sheet.scene(mod(frame, sheet.frames)), n);
}

export function layoutAtlas(n) {
  const layout = {};
  let row = 0;
  let smallX = 0, smallRow = -1;
  for (const sheet of SHEETS) {
    if (sheet.frames === 1) {
      // single frames share one row
      if (smallRow < 0 || smallX >= COLS) { smallRow = row; row += 1; smallX = 0; }
      layout[sheet.name] = { sx: smallX * n, sy: smallRow * n, tilew: n, tileh: n, w: n, h: n };
      smallX += 1;
      continue;
    }
    const rows = Math.ceil(sheet.frames / COLS);
    layout[sheet.name] = { sx: 0, sy: row * n, tilew: n, tileh: n, w: Math.min(sheet.frames, COLS) * n, h: rows * n };
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
      composite(atlas, drawTile(sheet.name, f, n), L.sx + (f % cols) * n, L.sy + Math.floor(f / cols) * n);
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

// Demo board (also in demo/tiles.js): [col, row, sheet, quarter turns clockwise].
// A U-turn top left, a straight run with step, rotator and counter, a detector
// whose branches turn east through corner belts, and more branches below.
export const MOCK = {
  cols: 7, rows: 5,
  cells: [
    [0, 0, "conveyor", 0], [1, 0, "stepForward", 0], [2, 0, "conveyorFromRight", 1],
    [2, 1, "conveyorFromRight", 2], [1, 1, "ccwrotator", 2], [0, 1, "stepForward", 2],
    [0, 2, "conveyor", 0], [1, 2, "stepForward", 0], [2, 2, "cwrotator", 0], [3, 2, "incrementerRed", 0], [4, 2, "detector", 0],
    [4, 1, "conveyorFromRight", 0], [5, 1, "ccwrotator", 0], [6, 1, "conveyor", 0],
    [4, 3, "conveyorFromLeft", 0], [5, 3, "decrementerBlue", 0],
    [5, 2, "conveyorFromRight", 0], [6, 2, "incrementerYellow", 0],
    [5, 4, "conveyorFromLeft", 0], [6, 4, "magicDetector", 0],
    [0, 4, "decrementerGreen", 1], [1, 4, "incrementerPurple", 3], [2, 4, "decrementerPink", 0], [3, 4, "startTile", 0],
  ],
};
function mockBoard(globalFrame, n, bg) {
  const img = blank(MOCK.cols * n, MOCK.rows * n, bg);
  const grid = new Map(MOCK.cells.map((c) => [`${c[0]},${c[1]}`, c]));
  for (let j = 0; j < MOCK.rows; j += 1)
    for (let i = 0; i < MOCK.cols; i += 1) {
      const c = grid.get(`${i},${j}`) ?? [i, j, "emptyOperator", 0];
      if (c[2] === "startTile") composite(img, drawTile("emptyOperator", 0, n), i * n, j * n);
      composite(img, rotate90(drawTile(c[2], globalFrame % BY_NAME[c[2]].frames, n), c[3]), i * n, j * n);
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
      composite(sheet, drawTile(s.name, f, n), x0 + k * (n + 4), y + 12);
      label(sheet, `${f}`, x0 + k * (n + 4), y + 14 + n);
    });
    // dark ground, frame 0
    fillRect(sheet, x0 + 4 * (n + 4), y + 12, n + 8, n + 8, dark);
    composite(sheet, drawTile(s.name, 0, n), x0 + 4 * (n + 4) + 4, y + 16);
    // x4, two frames
    [0, fs4[Math.min(1, fs4.length - 1)]].forEach((f, k) => {
      composite(sheet, scaleNearest(drawTile(s.name, f, n), zoom), x0 + 6 * (n + 4) + k * (zoom * n + 8), y + 12);
    });
  });
  return sheet;
}

function seamSheet(n) {
  const light = parseColour("#efe9dc"), dark = parseColour("#1b1a20");
  const bw = MOCK.cols * n, bh = MOCK.rows * n;
  const zoom = 3;
  const sheet = blank(Math.max(2 * bw + 40, zoom * bw + 20), 3 * (bh + 24) + zoom * bh + 40, light);
  let y = 10;
  for (const f of [0, 7, 33]) {
    label(sheet, `BOARD AT 1X, FRAME ${f}, ON LIGHT AND DARK`, 10, y);
    composite(sheet, mockBoard(f, n, CLEAR), 10, y + 12);
    fillRect(sheet, bw + 20, y + 8, bw + 16, bh + 8, dark);
    composite(sheet, mockBoard(f, n, CLEAR), bw + 28, y + 12);
    y += bh + 24;
  }
  label(sheet, "BOARD AT 3X, FRAME 7 (SEAMS, CORNERS, BRANCHES)", 10, y);
  composite(sheet, scaleNearest(mockBoard(7, n, CLEAR), zoom), 10, y + 12);
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

function selfCheck(n) {
  const problems = [];
  if (D % PERIOD !== 0) problems.push("belt period must divide the tile");
  const anims = scriptAnimations();
  for (const s of SHEETS) {
    const a = anims[s.anim];
    if (!a) { problems.push(`${s.name}: animation ${s.anim} not found in ${SCRIPT_JS}`); continue; }
    if (a.frames !== s.frames) problems.push(`${s.name}: ${SCRIPT_JS} ${s.anim} has ${a.frames} frames, the atlas has ${s.frames}`);
    if (s.frames > 1 && a.rate !== RATE) problems.push(`${s.name}: ${SCRIPT_JS} ${s.anim} rate ${a.rate}, want ${RATE} (the 2012 rate)`);
    if (s.frames > 1 && s.frames % BELT_FRAMES !== 0) problems.push(`${s.name}: frame count must be a multiple of ${BELT_FRAMES} so belts stay in phase`);
  }
  // Loop closure: frame N continues into frame 0 (scene at f = frames equals f = 0).
  for (const s of SHEETS) {
    if (s.frames === 1) continue;
    const a = render(s.scene(s.frames), n), b = render(s.scene(0), n);
    const d = stripDiff(a.data, b.data);
    if (d.max > 2) problems.push(`${s.name}: loop does not close (max diff ${d.max})`);
  }
  // Seams: every belt opening matches the plain conveyor's at the same global
  // frame (straight belts exactly; corners and branches within anti-aliasing).
  const east = (f) => drawTile("conveyor", f, n);
  const seam = [];
  for (const f of [0, 3, 11]) {
    const c = east(f);
    const cS = rotate90(c, 1), cN = rotate90(c, 3); // pointing south, north
    const want = {
      W: strip(c, "W"), E: strip(c, "E"), Nin: strip(cS, "N"), Sin: strip(cN, "S"), Nout: strip(cN, "N"), Sout: strip(cS, "S"),
    };
    const checks = [];
    // compare the belt opening only (icons and step arrows may touch other parts of an edge)
    const band = (st) => st.slice(4 * Math.floor((H - BELT_HALF) * (n / D)), 4 * Math.ceil((H + BELT_HALF) * (n / D)));
    const add = (name, side, got, exp) => checks.push([name, side, band(got), band(exp)]);
    for (const s of SHEETS) {
      if (s.frames === 1) continue;
      const img = drawTile(s.name, f, n);
      if (s.name === "conveyorFromLeft") { add(s.name, "N", strip(img, "N"), want.Nin); add(s.name, "E", strip(img, "E"), want.E); }
      else if (s.name === "conveyorFromRight") { add(s.name, "S", strip(img, "S"), want.Sin); add(s.name, "E", strip(img, "E"), want.E); }
      else if (/^(detector|magicDetector|decrementer)/.test(s.name)) {
        add(s.name, "W", strip(img, "W"), want.W); add(s.name, "N", strip(img, "N"), want.Nout); add(s.name, "S", strip(img, "S"), want.Sout);
      } else { add(s.name, "W", strip(img, "W"), want.W); add(s.name, "E", strip(img, "E"), want.E); }
    }
    for (const [name, side, got, exp] of checks) {
      const d = stripDiff(got, exp);
      const straight = !/FromLeft|FromRight|detector|Detector|decrementer/.test(name);
      seam.push([name, side, d.max, d.mean]);
      if (straight ? d.max > 0 : d.max > 64 || d.mean > 6) problems.push(`${name} frame ${f}: ${side} edge differs from the conveyor (max ${d.max}, mean ${d.mean.toFixed(2)})`);
    }
  }
  return { problems, seam };
}

// ---------------------------------------------------------------- main
function main(argv) {
  const check = argv.includes("--check");
  const arg = (flag) => (argv.indexOf(flag) >= 0 ? argv[argv.indexOf(flag) + 1] : undefined);
  const n = Number(arg("--size") ?? DEFAULT_SIZE);
  if (!Number.isInteger(n) || n < 16) throw new Error("--size wants a whole number of px >= 16");
  if (check && n !== DEFAULT_SIZE) throw new Error(`--check compares the shipped ${DEFAULT_SIZE} px atlas`);
  const tag = arg("--tag") ?? "program-tiles-v2";
  const { problems, seam } = selfCheck(n);
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
    console.log(`program-tiles --check OK (${atlas.width}x${atlas.height}, ${pixelSha256(atlas).slice(0, 12)}; timings match ${SCRIPT_JS}; worst curved seam ${worst[0]} ${worst[1]} max ${worst[2]})`);
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
    console.log(`review sheets: ${path.join(dir, `${tag}.png`)}, ${path.join(dir, `${tag}-seam.png`)}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
