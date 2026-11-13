#!/usr/bin/env node
// The robot's cell (the robot world grid): floor, walls, obstacle block, exit
// hatch, electric trap, magic tile, ice, cracked ice, water, resistor "dots",
// the player robot with its death frames, and the reward part icons. Terrain
// is drawn pixel by pixel in the Toybox palette; the robot and the part icons
// are derived from accepted PixelLab masters (hash-checked against their
// records). Deterministic and dependency-free; this file is the source of truth
// for those game files (docs/art/classes/terrain.md). Lava is not drawn here:
// it stays the original 2012 art in images/sprytszyt.png, whose lava frames
// are copied byte for byte into the robot-cell atlas. Atlas frames are spaced
// apart, each with an edge-extruded gutter (see GUTTER); --check also verifies
// the shipped PNG + JSON pair against that contract.
//
//   node tools/art/tiles/robot-cell.mjs [--style toybox|retro|all]
//                                                  write every game file below (default toybox; retro: the
//                                                  same names under images/retro/ and data/retro/)
//   node tools/art/tiles/robot-cell.mjs --check    regenerate both styles in memory, fail if a committed file
//                                                  differs, a second retro build differs, or the retro layout
//                                                  differs from toybox
//   node tools/art/tiles/robot-cell.mjs --review <dir> [--tag robot-cell-v1]
//                                                  also write review sheets (frames, icons, level mocks)
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { blank, encodePng, decodePng, scaleNearest, composite, fillRect, parseColour, pixelSha256, crop, pad, alphaBounds } from "../lib/png.mjs";
import { drawText } from "../lib/font.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ATLAS_PNG = "images/tiles/robot-cell.png";
const ATLAS_JSON = "data/robot-cell.json";

// ---------------------------------------------------------------- geometry
export const T = 50; // tile side
const COLS = 32; // atlas columns
export const FRAMES = { player: 32, exitHatch: 21, electricTrap: 21 };
const SINGLES = ["obstacle", "wall", "corner", "deadend", "tunnel", "magicTile"];

// ---------------------------------------------------------------- palette
export const PALETTE = {
  outline: "#2a2335",
  // floor: warm sand play-mat panel
  floor: "#ecd6a6",
  floorEdge: "#e2c78f",
  floorRim: "#c9a96e",
  floorStud: "#dcbf86",
  // walls and blocks: slate-blue toy plastic
  wallDark: "#3e4677",
  wall: "#5a67a6",
  wallLight: "#7f8dcc",
  wallTop: "#aab5ea",
  // hatch
  rimDark: "#6f7690",
  rim: "#9aa1ba",
  rimLight: "#c9cedd",
  bolt: "#e9ecf3",
  iris: "#f6c445",
  irisAlt: "#fbd96e",
  irisDark: "#d9962b",
  hole: "#1d1730",
  holeGlow: "#3c8f6a",
  irisOff: "#a3a6b8",
  irisOffAlt: "#b9bccb",
  irisOffDark: "#7f8298",
  sparkCore: "#ffffff",
  spark: "#8fe6ff",
  sparkOuter: "#37bfe5",
  // magic tile
  magic: "#5fd3e6",
  magicLight: "#a8eef6",
  magicDark: "#2aa2c0",
  star: "#fff6c8",
  starEdge: "#f6c445",
  // ice and water
  ice: "#d4f0fb",
  iceMid: "#b5e2f5",
  iceLight: "#f4fcff",
  crack: "#3f7fb6",
  crackLight: "#ffffff",
  water: "#3e95db",
  waterDeep: "#2f7cc6",
  waterCrest: "#8fd0f5",
  waterFoam: "#e1f5ff",
  // resistors
  lead: "#c9d0d6",
  leadDark: "#8b93a3",
  // death effects
  yellow: "#ffd84a",
  yellowGlow: "#fff0a0",
  xrayBody: "#3a2a12",
  xrayLine: "#ffe26a",
  flashBody: "#1b2a5e",
  flashLine: "#f4fbff",
  flashGlow: "#8fe6ff",
  char: "#4a4552",
  smoke: "#b9b4c2",
  smokeLight: "#dcd8e2",
  lava: "#f76314",
  lavaDeep: "#a3220f",
  lavaBubble: "#ffd23f",
  ripple: "#d6f1ff",
  bubble: "#f4fcff",
  halo: "#ffe27a",
  haloLight: "#fff3bf",
};
const C = {};
function refreshPalette() {
  for (const [k, v] of Object.entries(PALETTE)) C[k] = parseColour(v);
}
refreshPalette();
export { refreshPalette };

// ---------------------------------------------------------------- raster helpers
const mod = (a, n) => ((a % n) + n) % n;
const set = (img, x, y, rgba) => {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  img.data.set(rgba, (y * img.width + x) * 4);
};
const get = (img, x, y) => {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return [0, 0, 0, 0];
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
};
const alphaAt = (img, x, y) => (x < 0 || y < 0 || x >= img.width || y >= img.height ? 0 : img.data[(y * img.width + x) * 4 + 3]);
const clone = (img) => ({ width: img.width, height: img.height, data: new Uint8Array(img.data) });
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t), 255];

/** Paints `shade(x, y) -> colour|null` with a 1 px dark outline around the shape (8-neighbourhood). */
function paintShape(img, shade, outline = C.outline) {
  const w = img.width, h = img.height;
  const cache = new Array(w * h);
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) cache[y * w + x] = shade(x, y);
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h && cache[y * w + x] !== null;
  for (let y = 0; y < h; y += 1)
    for (let x = 0; x < w; x += 1) {
      const c = cache[y * w + x];
      if (c !== null) { set(img, x, y, c); continue; }
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy += 1)
        for (let dx = -1; dx <= 1 && !near; dx += 1) if ((dx || dy) && inside(x + dx, y + dy)) near = true;
      if (near && outline) set(img, x, y, outline);
    }
}

/** Deterministic PRNG (mulberry32). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function line(points, cb) {
  for (let i = 0; i + 1 < points.length; i += 1) {
    let [x0, y0] = points[i].map(Math.round);
    const [x1, y1] = points[i + 1].map(Math.round);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      cb(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
}

export function rotate90(src, quarterTurnsCw) {
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

// ---------------------------------------------------------------- terrain
/** Floor: a sand play-mat panel with an even rim and four corner studs (same in all rotations). */
function floor(img) {
  fillRect(img, 0, 0, T, T, C.floor);
  for (let i = 0; i < T; i += 1) {
    set(img, i, 0, C.floorRim); set(img, i, T - 1, C.floorRim);
    set(img, 0, i, C.floorRim); set(img, T - 1, i, C.floorRim);
  }
  for (let i = 1; i < T - 1; i += 1) {
    set(img, i, 1, C.floorEdge); set(img, i, T - 2, C.floorEdge);
    set(img, 1, i, C.floorEdge); set(img, T - 2, i, C.floorEdge);
  }
  for (const [x, y] of [[4, 4], [T - 6, 4], [4, T - 6], [T - 6, T - 6]]) fillRect(img, x, y, 2, 2, C.floorStud);
}

// Rails: 8 px thick bars along tile edges. Profile across the rail, from the
// tile edge inwards; the centre is lit (light from straight above).
const RAIL = 8;
const railProfile = () => [C.outline, C.wallDark, C.wall, C.wallLight, C.wallLight, C.wall, C.wallDark, C.outline];
const SIDES = { wall: ["E"], corner: ["E", "S"], deadend: ["N", "E", "S"], tunnel: ["E", "W"] };

/** Distance from the rail's outer edge and the position along it, per side. */
function railCoords(side, x, y) {
  if (side === "E") return [T - 1 - x, y];
  if (side === "W") return [x, y];
  if (side === "N") return [y, x];
  return [T - 1 - y, x]; // S
}

function rails(img, sides) {
  const prof = railProfile();
  for (let y = 0; y < T; y += 1)
    for (let x = 0; x < T; x += 1) {
      let best = null;
      let hits = 0;
      for (const s of sides) {
        const [d, t] = railCoords(s, x, y);
        if (d >= RAIL) continue;
        hits += 1;
        if (best === null || d < best.d) best = { d, t };
      }
      if (best === null) continue;
      let c = prof[best.d];
      // studs every 25 px along a straight section (period divides the tile, so rails join)
      const u = mod(best.t, 25);
      if (hits === 1 && (best.d === 3 || best.d === 4) && (u === 11 || u === 12)) c = C.wallTop;
      set(img, x, y, c);
    }
}

/** Obstacle: a 2x2-stud toy brick filling the tile. */
function block(img) {
  const prof = [C.outline, C.wallDark, C.wall, C.wall];
  for (let y = 0; y < T; y += 1)
    for (let x = 0; x < T; x += 1) {
      const d = Math.min(x, y, T - 1 - x, T - 1 - y);
      // rounded corners: cut where both distances are small
      const cx = Math.min(x, T - 1 - x), cy = Math.min(y, T - 1 - y);
      if (cx + cy < 2) continue; // stays transparent (shows the black gap)
      let c = d < prof.length ? prof[d] : C.wall;
      if (cx + cy === 2) c = C.outline;
      set(img, x, y, c);
    }
  for (const [sx, sy] of [[14.5, 14.5], [34.5, 14.5], [14.5, 34.5], [34.5, 34.5]]) {
    paintShape(img, (x, y) => {
      const r = Math.hypot(x + 0.5 - (sx + 0.5), y + 0.5 - (sy + 0.5));
      if (r > 6.2) return null;
      if (r < 2.2) return C.wallTop;
      return r > 5 ? C.wallDark : C.wallLight;
    });
  }
}

/** Magic tile: floor with an inset cyan pad and a four-point sparkle. */
function magicTile(img) {
  floor(img);
  const c0 = 24.5;
  paintShape(img, (x, y) => {
    const dx = Math.abs(x - c0), dy = Math.abs(y - c0);
    const half = 17.5, r = 5;
    const qx = Math.max(dx - (half - r), 0), qy = Math.max(dy - (half - r), 0);
    const dist = Math.hypot(qx, qy) - r; // rounded-square SDF
    if (dist > 0) return null;
    if (dist > -1.5) return C.magicDark;
    if (dist > -3) return C.magic;
    return C.magicLight;
  });
  paintShape(img, (x, y) => {
    const dx = Math.abs(x - c0), dy = Math.abs(y - c0);
    const v = Math.sqrt(dx) + Math.sqrt(dy); // astroid: a four-point star
    if (v > Math.sqrt(13)) return null;
    return v > Math.sqrt(13) - 0.9 ? C.starEdge : C.star;
  });
}

/** Round hatch with an iris; `open` in 0..1, `rot` in radians, `off` greys it out. */
function hatch(img, open, rot, off = false) {
  floor(img);
  const c0 = 24.5;
  const R = 21.5, RIM = 17;
  const aperture = open * (RIM - 0.5);
  const blades = 6;
  const [bA, bB, bD] = off ? [C.irisOff, C.irisOffAlt, C.irisOffDark] : [C.iris, C.irisAlt, C.irisDark];
  paintShape(img, (x, y) => {
    const px = x - c0, py = y - c0;
    const r = Math.hypot(px, py);
    if (r > R) return null;
    if (r > RIM) {
      const ang = Math.atan2(py, px);
      for (let k = 0; k < 8; k += 1) {
        const a = (k * Math.PI) / 4 + Math.PI / 8;
        if (Math.hypot(px - 19.3 * Math.cos(a), py - 19.3 * Math.sin(a)) < 1.3) return C.bolt;
      }
      void ang;
      if (r > R - 1) return C.rimDark;
      if (r < RIM + 1) return C.rimDark;
      return r > RIM + 2.5 ? C.rim : C.rimLight;
    }
    if (r <= RIM && r > RIM - 1) return C.outline;
    if (r < aperture) {
      if (r > aperture - 1.5) return C.outline;
      return r > aperture - 3 && open > 0.2 ? C.holeGlow : C.hole;
    }
    // iris blades: spiral seams
    const theta = Math.atan2(py, px) + rot;
    const phi = (theta / (2 * Math.PI)) * blades + r / 7;
    const id = mod(Math.floor(phi), blades);
    const frac = mod(phi, 1);
    const arc = (2 * Math.PI * Math.max(r, 1)) / blades; // px per blade at this radius
    if (frac * arc < 1.1) return C.outline;
    if (frac * arc < 2.6) return bD;
    return id % 2 === 0 ? bA : bB;
  });
}

function exitHatch(img, frame) {
  const n = FRAMES.exitHatch - 1;
  const t = frame / n;
  const eased = t * t * (3 - 2 * t);
  hatch(img, eased, eased * 1.4);
}

/** Electrified hatch: the closed iris greyed out with arcs crackling over it. */
function electricTrap(img, frame) {
  hatch(img, 0, 0, true);
  const rand = rng(9001 + frame * 7919);
  const arcs = 2 + Math.floor(rand() * 2);
  const core = new Set();
  const key = (x, y) => y * T + x;
  for (let a = 0; a < arcs; a += 1) {
    const a0 = rand() * Math.PI * 2;
    const a1 = a0 + Math.PI * (0.55 + rand() * 0.8);
    const r0 = 18 + rand() * 3, r1 = 18 + rand() * 3;
    let pts = [[24.5 + r0 * Math.cos(a0), 24.5 + r0 * Math.sin(a0)], [24.5 + r1 * Math.cos(a1), 24.5 + r1 * Math.sin(a1)]];
    let disp = 7;
    for (let level = 0; level < 4; level += 1) {
      const next = [pts[0]];
      for (let i = 0; i + 1 < pts.length; i += 1) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        const len = Math.hypot(x1 - x0, y1 - y0) || 1;
        const off = (rand() * 2 - 1) * disp;
        next.push([mx + (-(y1 - y0) / len) * off, my + ((x1 - x0) / len) * off], pts[i + 1]);
      }
      pts = next;
      disp /= 2;
    }
    line(pts, (x, y) => { if (x >= 1 && y >= 1 && x < T - 1 && y < T - 1) core.add(key(x, y)); });
  }
  // halo first, then the white core
  const halo = new Set();
  for (const k of core) {
    const x = k % T, y = Math.floor(k / T);
    for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) if (!core.has(key(x + dx, y + dy))) halo.add(key(x + dx, y + dy));
  }
  for (const k of halo) set(img, k % T, Math.floor(k / T), C.spark);
  for (const k of core) set(img, k % T, Math.floor(k / T), C.sparkCore);
  // a few sparks
  for (let s = 0; s < 3; s += 1) {
    const x = 6 + Math.floor(rand() * 38), y = 6 + Math.floor(rand() * 38);
    set(img, x, y, C.sparkCore);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) set(img, x + dx, y + dy, C.sparkOuter);
  }
}

/** Ice: pale glassy block; four glints in a pinwheel so it looks the same in every rotation. */
function ice(img) {
  fillRect(img, 0, 0, T, T, C.ice);
  for (let y = 0; y < T; y += 1)
    for (let x = 0; x < T; x += 1) {
      const d = Math.min(x, y, T - 1 - x, T - 1 - y);
      if (d === 0) set(img, x, y, C.iceMid);
      else if (d === 1) set(img, x, y, C.iceLight);
    }
  const glint = [];
  for (let i = 0; i < 9; i += 1) glint.push([8 + i, 18 - i], [9 + i, 18 - i]);
  for (let i = 0; i < 4; i += 1) glint.push([14 + i, 20 - i]);
  const soft = [];
  for (let i = 0; i < 11; i += 1) soft.push([9 + i, 21 - i]);
  for (let q = 0; q < 4; q += 1) {
    const rotp = ([x, y]) => {
      let px = x, py = y;
      for (let k = 0; k < q; k += 1) [px, py] = [T - 1 - py, px];
      return [px, py];
    };
    for (const p of soft) { const [x, y] = rotp(p); set(img, x, y, C.iceMid); }
    for (const p of glint) { const [x, y] = rotp(p); set(img, x, y, C.iceLight); }
  }
}

function crackedIce(img) {
  ice(img);
  const rand = rng(4242);
  const ends = [[24, 1], [48, 20], [30, 48], [1, 30], [44, 43], [5, 6]];
  const c0 = [24, 24];
  const cracks = [];
  for (const end of ends) {
    const pts = [c0];
    const steps = 4;
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      const j = s === steps ? 0 : (rand() * 2 - 1) * 4;
      pts.push([c0[0] + (end[0] - c0[0]) * t + j, c0[1] + (end[1] - c0[1]) * t - j]);
    }
    cracks.push(pts);
  }
  // light edge below-right of each crack, then the dark crack
  for (const pts of cracks) line(pts, (x, y) => { set(img, x + 1, y, C.crackLight); set(img, x, y + 1, C.crackLight); });
  for (const pts of cracks) line(pts, (x, y) => { set(img, x, y, C.crack); });
  // a hole at the centre showing the water underneath
  paintShape(img, (x, y) => (Math.hypot(x - 24, y - 24) < 3.2 ? C.water : null), C.crack);
}

/** Water: deep blue with crest marks on a 25 px lattice, so neighbouring water joins up. */
function water(img) {
  for (let y = 0; y < T; y += 1)
    for (let x = 0; x < T; x += 1) {
      const band = mod(y, 25) < 12 ? C.water : C.waterDeep;
      set(img, x, y, band);
    }
  const crest = (cx, cy) => {
    for (let i = -4; i <= 4; i += 1) {
      const dy = Math.abs(i) <= 1 ? -1 : Math.abs(i) <= 3 ? 0 : 1;
      set(img, mod(cx + i, T), mod(cy + dy, T), C.waterCrest);
      if (Math.abs(i) <= 1) set(img, mod(cx + i, T), mod(cy + dy - 1, T), C.waterFoam);
    }
  };
  for (const [cx, cy] of [[6, 6], [31, 6], [18, 18], [43, 18], [6, 31], [31, 31], [18, 43], [43, 43]]) crest(cx, cy);
}

export function drawTerrain(name, frame = 0) {
  const img = blank(T, T);
  if (name === "floor") floor(img);
  else if (name === "obstacle") block(img);
  else if (SIDES[name]) { floor(img); rails(img, SIDES[name]); }
  else if (name === "magicTile") magicTile(img);
  else if (name === "exitHatch") exitHatch(img, frame);
  else if (name === "electricTrap") electricTrap(img, frame);
  else if (name === "ice") ice(img);
  else if (name === "crackedIce") crackedIce(img);
  else if (name === "water") water(img);
  else throw new Error(`unknown terrain ${name}`);
  return img;
}

// ---------------------------------------------------------------- resistors (dots)
// [file, canvas w, h, angle in degrees, body colour, band colours]
const RESISTORS = [
  ["resistor1.png", 50, 50, 90, "#f3dfae", ["#e8574a", "#2f7cc6", "#f6c445"]],
  ["resistor2.png", 50, 34, 0, "#8fd3f2", ["#e8574a", "#2a2335", "#f6c445"]],
  ["resistor3.png", 45, 43, 45, "#a3e3b5", ["#9a3256", "#f6c445", "#2f7cc6"]],
  ["resistor4.png", 35, 45, 65, "#f7b2c4", ["#2a2335", "#2f7cc6", "#f6c445"]],
  ["resistor5.png", 50, 41, -30, "#f3dfae", ["#3c8f6a", "#e8574a", "#2a2335"]],
];
function resistor(w, h, angleDeg, bodyHex, bandHex) {
  const img = blank(w, h);
  const a = (angleDeg * Math.PI) / 180;
  const ux = Math.cos(a), uy = Math.sin(a);
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  const body = parseColour(bodyHex);
  const bodyDark = mix(body, C.outline, 0.25);
  const bodyLight = mix(body, [255, 255, 255, 255], 0.45);
  const bands = bandHex.map(parseColour);
  const LEAD = 20, BODY = 8.5, RAD = 4.6;
  paintShape(img, (x, y) => {
    const px = x - cx, py = y - cy;
    const t = px * ux + py * uy; // along
    const s = -px * uy + py * ux; // across
    // body capsule
    const tc = Math.max(-BODY, Math.min(BODY, t));
    const dist = Math.hypot(t - tc, s);
    if (dist <= RAD) {
      for (let b = 0; b < bands.length; b += 1) {
        const pos = -4.5 + b * 4;
        if (Math.abs(t - pos) < 1.2) return bands[b];
      }
      if (Math.abs(s) < 1.1 && Math.abs(t) < BODY) return bodyLight;
      return dist > RAD - 1.2 ? bodyDark : body;
    }
    if (Math.abs(t) <= LEAD && Math.abs(s) < 1.0) return Math.abs(s) < 0.5 ? C.lead : C.leadDark;
    return null;
  });
  return img;
}

// ---------------------------------------------------------------- masters
function master(set, id, n = 0) {
  const records = JSON.parse(fs.readFileSync(path.join(ROOT, "art/sets", set, "records.json"), "utf8"));
  const verdicts = JSON.parse(fs.readFileSync(path.join(ROOT, "art/sets", set, "verdicts.json"), "utf8"));
  if (verdicts[`${id}#${n}`]?.verdict !== "ACCEPTED") throw new Error(`${set}/${id}#${n} is not ACCEPTED`);
  const want = records[id]?.candidates?.[n]?.sha256;
  const file = path.join(ROOT, "art/masters", set, `${id}-${n}.png`);
  const bytes = fs.readFileSync(file);
  const got = createHash("sha256").update(bytes).digest("hex");
  if (got !== want) throw new Error(`${file} is not the recorded ${set}/${id}#${n}`);
  return decodePng(bytes);
}

// ---------------------------------------------------------------- robot frames
const ROBOT = { set: "robot-v1", id: "robot-front-c" };
// Pupils of robot-front-c after padding to 50x50 (bottom anchor: +1 x, +2 y).
const EYES = [[19, 18], [27, 18]]; // top-left of each 4x4 eye
const isDark = (c) => c[3] > 0 && c[0] + c[1] + c[2] < 160;

function robotBase() {
  return pad(master(ROBOT.set, ROBOT.id), T, T, "bottom");
}

function mapOpaque(src, fn) {
  const out = clone(src);
  for (let y = 0; y < src.height; y += 1)
    for (let x = 0; x < src.width; x += 1) {
      const c = get(src, x, y);
      if (c[3] === 0) continue;
      set(out, x, y, fn(c, x, y));
    }
  return out;
}

/** Adds `rings` halo rings of colour around the alpha mask (outside only). */
function glow(src, colours) {
  let out = clone(src);
  for (const colour of colours) {
    const next = clone(out);
    for (let y = 0; y < T; y += 1)
      for (let x = 0; x < T; x += 1) {
        if (alphaAt(out, x, y)) continue;
        let near = false;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (alphaAt(out, x + dx, y + dy)) near = true;
        if (near) set(next, x, y, colour);
      }
    out = next;
  }
  return out;
}

/** X-ray: dark pixels (outline, pupils) glow, the rest goes dark; ribs on the chest. */
function xray(src, bodyC, lineC) {
  const out = mapOpaque(src, (c) => (isDark(c) ? lineC : bodyC));
  for (let y = 30; y <= 36; y += 2) for (let x = 20; x <= 29; x += 1) if (alphaAt(out, x, y)) set(out, x, y, lineC);
  for (let y = 29; y <= 37; y += 1) { set(out, 24, y, lineC); set(out, 25, y, lineC); }
  return out;
}

function lum(c) { return 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]; }
function charred(src, amount) {
  return mapOpaque(src, (c) => {
    if (isDark(c)) return c;
    const l = lum(c) / 255;
    const ch = mix(C.char, C.smokeLight, l * 0.55);
    return mix(c, ch, amount);
  });
}

function xEyes(img, colour) {
  for (const [ex, ey] of EYES)
    for (let i = 0; i < 4; i += 1) { set(img, ex + i, ey + i, colour); set(img, ex + 3 - i, ey + i, colour); }
}

function puff(img, cx, cy, r) {
  paintShape(img, (x, y) => {
    const d = Math.hypot(x - cx, y - cy);
    if (d > r) return null;
    return d < r * 0.5 ? C.smokeLight : C.smoke;
  });
}

/** Shrinks a sprite about (cx, cy) with nearest sampling. */
function shrink(src, s, cx = 24.5, cy = 26.5) {
  const out = blank(T, T);
  if (s <= 0) return out;
  for (let y = 0; y < T; y += 1)
    for (let x = 0; x < T; x += 1) {
      const sx = Math.round(cx + (x - cx) / s), sy = Math.round(cy + (y - cy) / s);
      const c = get(src, sx, sy);
      if (c[3]) set(out, x, y, c);
    }
  return out;
}

function ring(img, cx, cy, r, colour) {
  for (let a = 0; a < 360; a += 2) {
    const x = Math.round(cx + r * Math.cos((a * Math.PI) / 180)), y = Math.round(cy + r * Math.sin((a * Math.PI) / 180));
    if (x >= 0 && y >= 0 && x < T && y < T && !alphaAt(img, x, y)) set(img, x, y, colour);
  }
}

function bubble(img, x, y, r, fill, edge) {
  paintShape(img, (px, py) => {
    const d = Math.hypot(px - x, py - y);
    if (d > r) return null;
    return d < r - 0.8 ? fill : edge;
  }, null);
}

export function robotFrames() {
  const base = robotBase();
  const frames = [];
  // 0 idle
  frames[0] = base;
  // 1-4 to yellow (electrocution starts)
  frames[1] = glow(mapOpaque(base, (c) => (isDark(c) ? c : mix(c, C.yellow, 0.25))), [C.yellowGlow]);
  frames[2] = glow(mapOpaque(base, (c) => (isDark(c) ? c : mix(c, C.yellow, 0.5))), [C.yellow]);
  frames[3] = glow(mapOpaque(base, (c) => (isDark(c) ? c : mix(c, C.yellow, 0.75))), [C.yellow, C.yellowGlow]);
  frames[4] = glow(xray(base, C.xrayBody, C.xrayLine), [C.yellow]);
  // 5, 6 flicker: yellow x-ray / blue-white flash
  frames[5] = glow(xray(base, C.xrayBody, C.xrayLine), [C.yellow, C.yellowGlow]);
  frames[6] = glow(xray(base, C.flashBody, C.flashLine), [C.flashGlow, C.sparkOuter]);
  // 7-11 to dead: charring, smoke, X eyes
  frames[7] = glow(charred(base, 0.45), [C.flashGlow]);
  frames[8] = charred(base, 0.7);
  frames[9] = charred(base, 0.9);
  puff(frames[9], 30, 6, 2.5);
  frames[10] = charred(base, 1);
  xEyes(frames[10], C.smokeLight);
  puff(frames[10], 31, 4, 3);
  puff(frames[10], 19, 7, 2);
  frames[11] = charred(base, 1);
  xEyes(frames[11], C.smokeLight);
  puff(frames[11], 33, 3, 2.5);
  // 12-21 sink into lava
  const lavaScale = [1, 0.94, 0.86, 0.78, 0.7, 0.61, 0.52, 0.42, 0.3, 0];
  for (let k = 0; k < 10; k += 1) {
    const t = Math.min(1, k / 4);
    let f = mapOpaque(base, (c) => mix(c, k < 5 ? C.lava : C.lavaDeep, isDark(c) ? t * 0.5 : t));
    f = shrink(f, lavaScale[k]);
    const rand = rng(700 + k);
    const nb = k === 0 ? 0 : 2 + (k % 3);
    for (let b = 0; b < nb; b += 1) {
      const a = rand() * Math.PI * 2, r = 9 + rand() * 12;
      bubble(f, 24.5 + r * Math.cos(a), 26 + r * Math.sin(a), 1.2 + rand() * 1.6, C.lavaBubble, C.lavaDeep);
    }
    frames[12 + k] = f;
  }
  // 22 is not used by any animation: keep the idle robot there
  frames[22] = base;
  // 23-31 drown in water
  const waterScale = [0.97, 0.9, 0.82, 0.72, 0.62, 0.5, 0.38, 0.24, 0];
  for (let k = 0; k < 9; k += 1) {
    const t = Math.min(1, (k + 1) / 5);
    let f = mapOpaque(base, (c) => mix(c, C.waterDeep, isDark(c) ? t * 0.4 : t * 0.85));
    f = shrink(f, waterScale[k]);
    ring(f, 24.5, 26.5, 13 + k * 1.3, C.ripple);
    if (k >= 3) ring(f, 24.5, 26.5, 6 + (k - 3) * 1.5, C.waterCrest);
    const rand = rng(800 + k);
    for (let b = 0; b < 3; b += 1) {
      const bx = 12 + rand() * 26, by = 40 - ((k * 4 + b * 13) % 34);
      bubble(f, bx, by, 1.4 + rand() * 1.2, C.bubble, C.waterCrest);
    }
    frames[23 + k] = f;
  }
  return frames;
}

// ---------------------------------------------------------------- part icons
// [file, take, canvas w, h, greyed]
const ICONS = [
  ["capacitor.png", "capacitor-a", 191, 232, false],
  ["capacitorBW.png", "capacitor-a", 191, 232, true],
  ["integratedcircuit.png", "chip-a", 238, 222, false],
  ["integratedcircuitBW.png", "chip-a", 238, 222, true],
  ["coil.png", "coil-a", 239, 242, false],
  ["coilBW.png", "coil-a", 239, 242, true],
];
function partIcon(take, w, h, greyed) {
  const m = master("parts-v1", take);
  const b = alphaBounds(m);
  let icon = pad(crop(m, b.x, b.y, b.width, b.height), b.width + 6, b.height + 6, "center");
  if (greyed) {
    icon = mapOpaque(icon, (c) => {
      const l = lum(c);
      const g = Math.round(150 + (l / 255) * 70);
      return isDark(c) ? [118, 116, 128, 150] : [g, g, Math.min(255, g + 6), 150];
    });
  } else {
    // earned: a sunny sticker halo, two rings
    const glowSize = { width: icon.width, height: icon.height, data: icon.data };
    icon = glowAny(glowSize, [C.halo, C.haloLight]);
  }
  icon = scaleNearest(icon, 2);
  return pad(icon, w, h, "center");
}
function glowAny(src, colours) {
  let out = clone(src);
  for (const colour of colours) {
    const next = clone(out);
    for (let y = 0; y < out.height; y += 1)
      for (let x = 0; x < out.width; x += 1) {
        if (alphaAt(out, x, y)) continue;
        let near = false;
        for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) if ((dx || dy) && alphaAt(out, x + dx, y + dy)) near = true;
        if (near) set(next, x, y, colour);
      }
    out = next;
  }
  return out;
}

// ---------------------------------------------------------------- retro style (tg-wtv.2)
// "Retro hacker chic" (epic tg-wtv): phosphor line art on near-black, drawn
// here as signed-distance shapes, supersampled RSS x RSS per pixel, with thin
// 1-2 px lines and a soft glow. No PixelLab and no masters: the robot is a
// code-drawn vector robot with the Toybox frame set (FRAMES.player, same
// meaning per frame) and lava a code-drawn flickering red-amber hatch with the
// 2012 lava's frame count. Same sheets, frames and layout as Toybox, so the
// game swaps only the URLs (STYLE_FILES).
export const RETRO = {
  bg: "#050b07",
  grid: "#0f2c18",
  gridTick: "#1f6a38",
  phosphor: "#33ff66",
  bright: "#c8ffd6",
  dim: "#1d7a3e",
  faint: "#123f22",
  fill: "#07130b",
  amber: "#ffb43a",
  amberBright: "#ffe7a8",
  magic: "#55f0ff",
  ice: "#7fdcff",
  iceGround: "#04121a",
  waterGround: "#03141a",
  water: "#2f9fd6",
  lavaGround: "#120403",
  lavaRed: "#ff3a1a",
  lavaDeep: "#4a0f05",
  ash: "#5f7366",
  ashLight: "#a9b8ad",
  xrayFill: "#2a1a04",
  flash: "#eafff2",
};
const RX = Object.fromEntries(Object.entries(RETRO).map(([k, v]) => [k, parseColour(v)]));
const rgbMix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), 255];
const withAlpha = (c, a) => [c[0], c[1], c[2], Math.max(0, Math.min(255, Math.round(255 * a)))];

const RSS = 4; // supersamples per axis
/** Renders scene(x, y) -> RGBA|null (x, y in px) into a w x h raster, RSS x RSS samples per pixel. */
function renderAA(scene, w = T, h = T) {
  const img = blank(w, h);
  for (let py = 0; py < h; py += 1)
    for (let px = 0; px < w; px += 1) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < RSS; sy += 1)
        for (let sx = 0; sx < RSS; sx += 1) {
          const q = scene(px + (sx + 0.5) / RSS, py + (sy + 0.5) / RSS);
          if (!q || !q[3]) continue;
          r += q[0] * q[3]; g += q[1] * q[3]; b += q[2] * q[3]; a += q[3];
        }
      if (a) img.data.set([Math.round(r / a), Math.round(g / a), Math.round(b / a), Math.round(a / (RSS * RSS))], (py * w + px) * 4);
    }
  return img;
}
/** `top` over `bottom`, alpha-blended per sample. */
const overScene = (top, bottom) => (x, y) => {
  const c = top(x, y);
  if (!c || c[3] === 0) return bottom(x, y);
  if (c[3] === 255) return c;
  const d = bottom(x, y);
  if (!d || d[3] === 0) return c;
  const a = c[3] / 255, da = d[3] / 255, oa = a + da * (1 - a);
  return [0, 1, 2].map((k) => Math.round((c[k] * a + d[k] * da * (1 - a)) / oa)).concat(Math.round(oa * 255));
};

// SDF primitives (px units)
const sdCircle = (x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) - r;
function sdRBox(x, y, cx, cy, hx, hy, r = 0) {
  const qx = Math.abs(x - cx) - hx + r, qy = Math.abs(y - cy) - hy + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}
function sdSeg(x, y, ax, ay, bx, by) {
  const pax = x - ax, pay = y - ay, bax = bx - ax, bay = by - ay;
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay) / (bax * bax + bay * bay || 1)));
  return Math.hypot(pax - bax * h, pay - bay * h);
}
function sdPolyline(x, y, pts) {
  let d = Infinity;
  for (let i = 0; i + 1 < pts.length; i += 1) d = Math.min(d, sdSeg(x, y, ...pts[i], ...pts[i + 1]));
  return d;
}

/** A drawing of parts, top first. Each part: { sd(x, y), mode, half, ink,
 *  fill, glow, reach, peak }. mode "outline": a 2*half stroke on the shape's
 *  edge and `fill` inside (null: whatever is underneath); "stroke": a 2*half
 *  line along a centre line (sd is the unsigned distance to it); "solid": the
 *  shape filled. The first part covering a point wins; elsewhere the strongest
 *  glow of any part shows. */
function shapes(parts) {
  return (x, y) => {
    let glowA = 0, glowC = null;
    for (const p of parts) {
      const sd = p.sd(x, y);
      let edge;
      if (p.mode === "solid") {
        if (sd <= 0) return p.ink;
        edge = sd;
      } else if (p.mode === "stroke") {
        edge = sd - p.half;
        if (edge <= 0) return p.ink;
      } else {
        edge = Math.abs(sd) - p.half;
        if (edge <= 0) return p.ink;
        if (sd < 0) return p.fill;
      }
      if (edge < p.reach) {
        const a = p.peak * (1 - edge / p.reach) ** 2;
        if (a > glowA) { glowA = a; glowC = p.glow ?? p.ink; }
      }
    }
    return glowA > 0.004 ? withAlpha(glowC, glowA) : null;
  };
}
const part = (sd, mode, ink, extra = {}) => ({ sd, mode, ink, half: 0.6, fill: RX.fill, reach: 2.5, peak: 0.4, ...extra });

// ---- retro terrain
/** Floor: near-black, a dim 1 px rim, brighter corner ticks. */
function retroFloor(x, y) {
  if (x < 1 || y < 1 || x >= T - 1 || y >= T - 1) {
    const ex = Math.min(x, T - x), ey = Math.min(y, T - y);
    return ex < 5 && ey < 5 ? RX.gridTick : RX.grid;
  }
  return RX.bg;
}

// Walls: a bright 2 px line 3.5 px in from the wall's edge and a dim 1 px line
// inside it. Each line ends where it meets a perpendicular wall line of the
// same tile (clean corners); otherwise it runs to the tile edge, so walls join
// their neighbours across the gap.
const WALL_LINES = [{ at: 3.5, half: 1, ink: "phosphor", reach: 3, peak: 0.5 }, { at: 7.5, half: 0.5, ink: "dim", reach: 1.5, peak: 0.3 }];
function retroWalls(sides) {
  const parts = [];
  for (const L of WALL_LINES) {
    const pos = { E: T - L.at, W: L.at, N: L.at, S: T - L.at };
    for (const s of sides) {
      const vertical = s === "E" || s === "W";
      let lo = 0, hi = T;
      for (const o of sides) {
        if ((o === "E" || o === "W") === vertical) continue;
        if (o === "N" || o === "W") lo = pos[o];
        else hi = pos[o];
      }
      const c = pos[s];
      const sd = vertical ? (x, y) => sdSeg(x, y, c, lo, c, hi) : (x, y) => sdSeg(x, y, lo, c, hi, c);
      parts.push(part(sd, "stroke", RX[L.ink], { half: L.half, reach: L.reach, peak: L.peak }));
    }
  }
  return overScene(shapes(parts), retroFloor);
}

/** Block: a wireframe crate, a bright rounded square with a dim inner square and dim diagonals. */
function retroBlock() {
  const outer = (x, y) => sdRBox(x, y, 25, 25, 21.5, 21.5, 3);
  const inner = (x, y) => sdRBox(x, y, 25, 25, 15, 15, 1);
  const crate = (x, y) => {
    if (outer(x, y) > 0) return retroFloor(x, y);
    const di = inner(x, y);
    if (Math.abs(di) < 0.5) return RX.dim;
    if (di < 0 && Math.min(Math.abs(x - y), Math.abs(x + y - T)) / Math.SQRT2 < 0.5) return RX.faint;
    return RX.fill;
  };
  return overScene(shapes([part(outer, "outline", RX.phosphor, { half: 0.9, reach: 3, peak: 0.5, fill: null })]), crate);
}

function retroMagicTile() {
  const astroid = (x, y) => (Math.sqrt(Math.abs(x - 25)) + Math.sqrt(Math.abs(y - 25)) - Math.sqrt(12)) * 2.2;
  return overScene(shapes([
    part(astroid, "solid", RX.magic, { reach: 3, peak: 0.55 }),
    part((x, y) => sdRBox(x, y, 25, 25, 17, 17, 5), "outline", RX.magic, { half: 0.7, reach: 2.5, peak: 0.45, fill: rgbMix(RX.bg, RX.magic, 0.06) }),
  ]), retroFloor);
}

/** The hatch: outer ring with bolts, an iris of spiral blade seams, an aperture
 *  opening as `open` goes 0..1 (amber rim), turning by `rot`. off: the
 *  trapped hatch, all dim. */
function retroHatch(open, rot, off = false) {
  const c0 = 25, R = 21.5, RIM = 17;
  const aperture = open * (RIM - 0.5);
  const ink = off ? RX.dim : RX.phosphor, seam = off ? RX.faint : RX.dim;
  const ring = shapes([
    ...Array.from({ length: 8 }, (_, k) => {
      const a = (k * Math.PI) / 4 + Math.PI / 8;
      return part((x, y) => sdCircle(x, y, c0 + 19.3 * Math.cos(a), c0 + 19.3 * Math.sin(a), 0.9), "solid", seam, { reach: 1 });
    }),
    part((x, y) => Math.abs(Math.hypot(x - c0, y - c0) - R), "stroke", ink, { half: 0.75, reach: 2.5, peak: 0.45 }),
    part((x, y) => Math.abs(Math.hypot(x - c0, y - c0) - RIM), "stroke", ink, { half: 0.5, reach: 1.5, peak: 0.3 }),
    ...(open > 0.02 ? [part((x, y) => Math.abs(Math.hypot(x - c0, y - c0) - aperture), "stroke", RX.amber, { half: 0.7, reach: 2.5, peak: 0.5 })] : []),
  ]);
  const iris = (x, y) => {
    const px = x - c0, py = y - c0, r = Math.hypot(px, py);
    if (r > RIM) return retroFloor(x, y);
    if (r < aperture) {
      // the open shaft: black, a faint ring deeper down
      return open > 0.3 && Math.abs(r - aperture * 0.55) < 0.5 ? rgbMix([0, 0, 0, 255], RX.phosphor, 0.25) : [0, 0, 0, 255];
    }
    const phi = ((Math.atan2(py, px) + rot) / (2 * Math.PI)) * 6 + r / 7;
    const frac = mod(phi, 1);
    const dist = Math.min(frac, 1 - frac) * ((2 * Math.PI * Math.max(r, 1)) / 6);
    if (dist < 0.55) return seam;
    return dist < 1.6 ? rgbMix(RX.fill, seam, 0.35) : RX.fill;
  };
  return overScene(ring, iris);
}

/** The trap's lightning as polylines (the Toybox trap's random draws). */
function trapBolts(frame) {
  const rand = rng(9001 + frame * 7919);
  const arcs = 2 + Math.floor(rand() * 2);
  const bolts = [];
  for (let a = 0; a < arcs; a += 1) {
    const a0 = rand() * Math.PI * 2;
    const a1 = a0 + Math.PI * (0.55 + rand() * 0.8);
    const r0 = 18 + rand() * 3, r1 = 18 + rand() * 3;
    let pts = [[25 + r0 * Math.cos(a0), 25 + r0 * Math.sin(a0)], [25 + r1 * Math.cos(a1), 25 + r1 * Math.sin(a1)]];
    let disp = 7;
    for (let level = 0; level < 4; level += 1) {
      const next = [pts[0]];
      for (let i = 0; i + 1 < pts.length; i += 1) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        const len = Math.hypot(x1 - x0, y1 - y0) || 1;
        const o = (rand() * 2 - 1) * disp;
        next.push([mx + (-(y1 - y0) / len) * o, my + ((x1 - x0) / len) * o], pts[i + 1]);
      }
      pts = next;
      disp /= 2;
    }
    bolts.push(pts.map(([x, y]) => [Math.min(T - 2, Math.max(2, x)), Math.min(T - 2, Math.max(2, y))]));
  }
  const sparks = [];
  for (let s = 0; s < 3; s += 1) sparks.push([6.5 + Math.floor(rand() * 38), 6.5 + Math.floor(rand() * 38)]);
  return { bolts, sparks };
}
function retroTrap(frame) {
  const { bolts, sparks } = trapBolts(frame);
  const parts = [];
  for (const pts of bolts) parts.push(part((x, y) => sdPolyline(x, y, pts), "stroke", RX.amberBright, { half: 0.55, reach: 3.2, peak: 0.75, glow: RX.amber }));
  for (const [sx, sy] of sparks)
    parts.push(part((x, y) => Math.min(sdSeg(x, y, sx - 1.8, sy, sx + 1.8, sy), sdSeg(x, y, sx, sy - 1.8, sx, sy + 1.8)), "stroke", RX.amberBright,
      { half: 0.5, reach: 2, peak: 0.6, glow: RX.amber }));
  return overScene(shapes(parts), retroHatch(0, 0, true));
}

/** Ice: an icy dark panel with a cyan rim and four glints in a pinwheel (same in every rotation). */
const ICE_GLINTS = [0, 1, 2, 3].map((q) => {
  const turn = ([x, y]) => { let px = x, py = y; for (let k = 0; k < q; k += 1) [px, py] = [T - py, px]; return [px, py]; };
  return [turn([8.5, 18.5]), turn([17.5, 9.5])];
});
function iceGround(x, y) {
  return x < 1 || y < 1 || x >= T - 1 || y >= T - 1 ? rgbMix(RX.iceGround, RX.ice, 0.25) : RX.iceGround;
}
function iceParts() {
  return [
    ...ICE_GLINTS.map(([a, b]) => part((x, y) => sdSeg(x, y, ...a, ...b), "stroke", RX.ice, { half: 0.55, reach: 2.2, peak: 0.4 })),
    part((x, y) => sdRBox(x, y, 25, 25, 22.5, 22.5, 2), "outline", rgbMix(RX.iceGround, RX.ice, 0.55), { half: 0.5, reach: 1.5, peak: 0.25, fill: null }),
  ];
}
const retroIce = () => overScene(shapes(iceParts()), iceGround);
/** The Toybox crack paths (same random draws). */
function crackPaths() {
  const rand = rng(4242);
  const ends = [[24, 1], [48, 20], [30, 48], [1, 30], [44, 43], [5, 6]];
  const c0 = [24.5, 24.5];
  return ends.map((end) => {
    const pts = [c0];
    for (let s = 1; s <= 4; s += 1) {
      const t = s / 4, j = s === 4 ? 0 : (rand() * 2 - 1) * 4;
      pts.push([c0[0] + (end[0] + 0.5 - c0[0]) * t + j, c0[1] + (end[1] + 0.5 - c0[1]) * t - j]);
    }
    return pts;
  });
}
function retroCrackedIce() {
  return overScene(shapes([
    part((x, y) => sdCircle(x, y, 24.5, 24.5, 3.2), "outline", RX.bright, { half: 0.6, fill: RX.waterGround, reach: 2.5, peak: 0.5, glow: RX.ice }),
    ...crackPaths().map((pts) => part((x, y) => sdPolyline(x, y, pts), "stroke", RX.bright, { half: 0.5, reach: 2.4, peak: 0.45, glow: RX.ice })),
    ...iceParts(),
  ]), iceGround);
}
/** Water: dark blue-green with wave crests on a 25 px lattice (neighbours join up). */
function retroWater() {
  const crests = [[6, 6], [31, 6], [18, 18], [43, 18], [6, 31], [31, 31], [18, 43], [43, 43]];
  const wave = (cx, cy) => (x, y) => {
    const dx = x - (cx + 0.5);
    if (Math.abs(dx) > 5) return Math.hypot(Math.abs(dx) - 5, y - (cy + 1.7));
    return Math.abs(y - (cy + 0.5 - 1.2 * Math.cos((dx / 5) * Math.PI)));
  };
  return overScene(shapes(crests.map(([cx, cy]) => part(wave(cx, cy), "stroke", RX.water, { half: 0.55, reach: 2, peak: 0.4 }))), () => RX.waterGround);
}

/** Lava: a flickering red-amber hatch. Bright diagonals (x + y) drift one
 *  10 px period over the loop; a static dark cross-hatch (x - y); the heat
 *  (red to amber, glow) flickers in a pattern that repeats every tile and
 *  every loop. */
function retroLava(frame, frames) {
  const P = 10, shift = (frame * P) / frames, tw = (2 * Math.PI * frame) / frames;
  return (x, y) => {
    const u = mod(x + y - shift, P), du = Math.min(u, P - u) / Math.SQRT2;
    const v = mod(x - y, P), dv = Math.min(v, P - v) / Math.SQRT2;
    const heat = 0.5 + 0.5 * Math.sin(2 * tw + (2 * Math.PI * x) / T + (4 * Math.PI * y) / T) * Math.cos(3 * tw - (2 * Math.PI * (x - 2 * y)) / T);
    const h2 = heat * heat;
    const hot = rgbMix(RX.lavaDeep, rgbMix(RX.lavaRed, RX.amber, h2), 0.35 + 0.65 * heat);
    const e = du - 0.6;
    if (e <= 0) return rgbMix(hot, RX.amberBright, Math.max(0, heat - 0.85) * 3);
    const glow = e < 2.5 ? (0.12 + 0.3 * h2) * (1 - e / 2.5) ** 2 : 0;
    return rgbMix(dv < 0.4 ? RX.lavaDeep : RX.lavaGround, hot, glow);
  };
}

// ---- retro resistors (dots): an amber capsule outline on thin leads, three band ticks
const RETRO_BAND = { "#e8574a": "#ff5c50", "#2f7cc6": "#58a6ff", "#f6c445": "#ffe45a", "#2a2335": "#c8ffd6", "#9a3256": "#ff78d4", "#3c8f6a": "#33ff66" };
function retroResistor(w, h, angleDeg, bandHex) {
  const a = (angleDeg * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a);
  const cx = w / 2, cy = h / 2;
  const LEAD = 20, BODY = 8.5, RAD = 4.6;
  const along = (x, y) => (x - cx) * ux + (y - cy) * uy;
  const across = (x, y) => -(x - cx) * uy + (y - cy) * ux;
  const capsule = (x, y) => { const t = along(x, y); return Math.hypot(t - Math.max(-BODY, Math.min(BODY, t)), across(x, y)) - RAD; };
  const bands = bandHex.map((b, i) => part((x, y) => Math.hypot(along(x, y) - (-4.5 + i * 4), Math.max(Math.abs(across(x, y)) - (RAD - 1.8), 0)),
    "stroke", parseColour(RETRO_BAND[b] ?? RETRO.bright), { half: 0.6, reach: 1.2, peak: 0.3 }));
  return renderAA(shapes([
    ...bands,
    part(capsule, "outline", RX.amber, { half: 0.6, reach: 2.4, peak: 0.45 }),
    part((x, y) => Math.hypot(Math.max(Math.abs(along(x, y)) - LEAD, 0), across(x, y)), "stroke", RX.dim, { half: 0.5, reach: 1.5, peak: 0.3 }),
  ]), w, h);
}

// ---- the retro robot: a vector robot, front view like the Toybox one: eyes
// where Q.RoboFx.eyes expects them (4 px either side of the centre, 5.5 px
// above it), antenna up, feet down.
const EYE_C = [[21, 19.5], [29, 19.5]];
/** ink: { line, eye, accent, detail, fill, glow, reach, peak } -> parts, top
 *  first. opt.xEyes: dead eyes; opt.ribs: the x-ray skeleton. */
function robotParts(ink, opt = {}) {
  const P = (sd, mode, colour, extra) => part(sd, mode, colour, { fill: ink.fill, glow: ink.glow, reach: ink.reach ?? 2.5, peak: ink.peak ?? 0.4, ...extra });
  const parts = [];
  if (opt.xEyes)
    for (const [ex, ey] of EYE_C)
      parts.push(P((x, y) => Math.min(sdSeg(x, y, ex - 1.8, ey - 1.8, ex + 1.8, ey + 1.8), sdSeg(x, y, ex - 1.8, ey + 1.8, ex + 1.8, ey - 1.8)), "stroke", ink.eye, { half: 0.55 }));
  else for (const [ex, ey] of EYE_C) parts.push(P((x, y) => sdCircle(x, y, ex, ey, 1.9), "solid", ink.eye));
  parts.push(P((x, y) => sdSeg(x, y, 22.5, 23.2, 27.5, 23.2), "stroke", ink.detail, { half: 0.45, reach: 1 }));
  parts.push(P((x, y) => sdCircle(x, y, 25, 4.6, 1.7), "solid", ink.accent));
  if (opt.ribs) {
    for (const ry of [29.5, 32, 34.5]) parts.push(P((x, y) => sdSeg(x, y, 20.5, ry, 29.5, ry), "stroke", ink.line, { half: 0.45, reach: 1 }));
    parts.push(P((x, y) => sdSeg(x, y, 25, 28, 25, 36.5), "stroke", ink.line, { half: 0.5, reach: 1 }));
  } else {
    parts.push(P((x, y) => sdCircle(x, y, 25, 31.2, 1.6), "solid", ink.accent));
    parts.push(P((x, y) => sdSeg(x, y, 21.5, 35.2, 28.5, 35.2), "stroke", ink.detail, { half: 0.45, reach: 1 }));
  }
  parts.push(P((x, y) => sdRBox(x, y, 25, 17.5, 9, 6.5, 2.5), "outline", ink.line, { half: 0.65 }));
  parts.push(P((x, y) => sdRBox(x, y, 25, 32.5, 7.5, 6, 2), "outline", ink.line, { half: 0.65 }));
  parts.push(P((x, y) => sdSeg(x, y, 25, 6.3, 25, 11), "stroke", ink.line, { half: 0.55 }));
  parts.push(P((x, y) => sdSeg(x, y, 25, 24, 25, 26.5), "stroke", ink.line, { half: 0.6 }));
  for (const s of [-1, 1]) {
    parts.push(P((x, y) => sdCircle(x, y, 25 + s * 11.3, 36.2, 1.5), "outline", ink.line, { half: 0.55 }));
    parts.push(P((x, y) => sdSeg(x, y, 25 + s * 7.5, 29.5, 25 + s * 11, 34.6), "stroke", ink.line, { half: 0.6 }));
    parts.push(P((x, y) => sdRBox(x, y, 25 + s * 4, 43.6, 2.6, 1.4, 0.8), "outline", ink.line, { half: 0.55 }));
    parts.push(P((x, y) => sdSeg(x, y, 25 + s * 3.5, 38.5, 25 + s * 3.5, 42.2), "stroke", ink.line, { half: 0.6 }));
  }
  return parts;
}
const ROBOT_INK = { line: RX.phosphor, eye: RX.bright, accent: RX.amber, detail: RX.dim, fill: RX.fill, glow: RX.phosphor };
const inkMix = (ink, to, t, extra = {}) => ({
  line: rgbMix(ink.line, to, t), eye: rgbMix(ink.eye, to, t * 0.6), accent: rgbMix(ink.accent, to, t), detail: rgbMix(ink.detail, to, t),
  fill: ink.fill, glow: rgbMix(ink.glow, to, t), ...extra,
});
/** A scene scaled by s about (24.5, 26.5), as the Toybox shrink (s = 0: gone). */
const scaled = (scene, s, cx = 24.5, cy = 26.5) => (s <= 0 ? () => null : (x, y) => scene(cx + (x - cx) / s, cy + (y - cy) / s));

/** The 32 player frames, same meaning per frame as robotFrames(). */
export function retroRobotFrames() {
  const robot = (ink, opt) => shapes(robotParts(ink, opt));
  const scenes = [];
  scenes[0] = robot(ROBOT_INK);
  // 1-4 electrocution starts: lines and glow turn amber and the glow grows; 4 x-ray
  for (let k = 1; k <= 3; k += 1) scenes[k] = robot(inkMix(ROBOT_INK, RX.amber, k * 0.28, { reach: 2.5 + k * 0.6, peak: 0.4 + k * 0.1 }));
  const xray = { line: RX.amberBright, eye: RX.amberBright, accent: RX.amberBright, detail: RX.amber, fill: RX.xrayFill, glow: RX.amber, reach: 4, peak: 0.7 };
  scenes[4] = robot(xray, { ribs: true });
  // 5, 6 flicker: amber x-ray / inverted flash
  scenes[5] = robot({ ...xray, reach: 5, peak: 0.85 }, { ribs: true });
  scenes[6] = robot({ line: RX.bg, eye: RX.bg, accent: RX.bg, detail: RX.dim, fill: RX.flash, glow: RX.magic, reach: 4.5, peak: 0.8 }, { ribs: true });
  // 7-11 to dead: lines cool to ash, smoke rings drift up, X eyes
  const ash = (t, extra) => inkMix(ROBOT_INK, RX.ash, t, { eye: rgbMix(RX.bright, RX.ash, t), accent: rgbMix(RX.amber, RX.ash, t), ...extra });
  const smoke = (rings) => shapes(rings.map(([cx, cy, r]) => part((x, y) => Math.abs(sdCircle(x, y, cx, cy, r)), "stroke", RX.ashLight, { half: 0.5, reach: 1.5, peak: 0.3 })));
  scenes[7] = robot(ash(0.45, { glow: RX.magic, reach: 3, peak: 0.5 }));
  scenes[8] = robot(ash(0.7));
  scenes[9] = overScene(smoke([[30.5, 6.5, 2.5]]), robot(ash(0.9)));
  scenes[10] = overScene(smoke([[31.5, 4.5, 3], [19.5, 7.5, 2]]), robot(ash(1, { eye: RX.ashLight }), { xEyes: true }));
  scenes[11] = overScene(smoke([[33.5, 3.5, 2.5]]), robot(ash(1, { eye: RX.ashLight }), { xEyes: true }));
  // 12-21 sink into lava: lines go amber then red, the robot shrinks, amber bubbles
  const lavaScale = [1, 0.94, 0.86, 0.78, 0.7, 0.61, 0.52, 0.42, 0.3, 0];
  for (let k = 0; k < 10; k += 1) {
    const t = Math.min(1, k / 4);
    const body = scaled(robot(inkMix(ROBOT_INK, k < 5 ? RX.amber : RX.lavaRed, t)), lavaScale[k]);
    const rand = rng(700 + k);
    const bubbles = [];
    for (let b = 0, nb = k === 0 ? 0 : 2 + (k % 3); b < nb; b += 1) {
      const a = rand() * Math.PI * 2, r = 9 + rand() * 12;
      const bx = 25 + r * Math.cos(a), by = 26.5 + r * Math.sin(a), br = 1.2 + rand() * 1.6;
      bubbles.push(part((x, y) => sdCircle(x, y, bx, by, br), "outline", RX.amberBright,
        { half: 0.5, fill: rgbMix(RX.lavaGround, RX.amber, 0.25), glow: RX.amber, reach: 2, peak: 0.5 }));
    }
    scenes[12 + k] = overScene(shapes(bubbles), body);
  }
  // 22 is not used by any animation: the idle robot, as in Toybox
  scenes[22] = scenes[0];
  // 23-31 drown: lines go blue, the robot shrinks, ripples spread, bubbles rise
  const waterScale = [0.97, 0.9, 0.82, 0.72, 0.62, 0.5, 0.38, 0.24, 0];
  for (let k = 0; k < 9; k += 1) {
    const t = Math.min(1, (k + 1) / 5);
    const body = scaled(robot(inkMix(ROBOT_INK, RX.water, t * 0.85)), waterScale[k]);
    const rings = [13 + k * 1.3, ...(k >= 3 ? [6 + (k - 3) * 1.5] : [])];
    const ringScene = shapes(rings.map((r, i) => part((x, y) => Math.abs(sdCircle(x, y, 25, 27, r)), "stroke", i ? RX.ice : RX.bright,
      { half: 0.5, reach: 1.8, peak: 0.35, glow: RX.ice })));
    const rand = rng(800 + k);
    const bubbles = [];
    for (let b = 0; b < 3; b += 1) {
      const bx = 12.5 + rand() * 26, by = 40.5 - ((k * 4 + b * 13) % 34), br = 1.4 + rand() * 1.2;
      bubbles.push(part((x, y) => sdCircle(x, y, bx, by, br), "outline", RX.bright, { half: 0.45, fill: rgbMix(RX.waterGround, RX.ice, 0.2), glow: RX.ice, reach: 1.5, peak: 0.4 }));
    }
    scenes[23 + k] = overScene(shapes(bubbles), overScene(body, ringScene));
  }
  return scenes.map((s) => renderAA(s));
}

/** Retro terrain by the same names as drawTerrain, plus "lava". */
export function drawRetroTerrain(name, frame = 0) {
  if (name === "floor") return renderAA(retroFloor);
  if (name === "obstacle") return renderAA(retroBlock());
  if (SIDES[name]) return renderAA(retroWalls(SIDES[name]));
  if (name === "magicTile") return renderAA(retroMagicTile());
  if (name === "exitHatch") {
    const t = frame / (FRAMES.exitHatch - 1), eased = t * t * (3 - 2 * t);
    return renderAA(retroHatch(eased, eased * 1.4));
  }
  if (name === "electricTrap") return renderAA(retroTrap(frame));
  if (name === "ice") return renderAA(retroIce());
  if (name === "crackedIce") return renderAA(retroCrackedIce());
  if (name === "water") return renderAA(retroWater());
  if (name === "lava") return renderAA(retroLava(frame, lavaSourceFrames().length));
  throw new Error(`unknown retro terrain ${name}`);
}

// ---------------------------------------------------------------- outputs
// Every frame sits in its own PITCH x PITCH cell, at offset GUTTER, and the
// rest of the cell repeats the frame's edge pixels (edge extrusion), as in the
// program tiles (tg-oyv). The robot window is drawn at worldScale x the
// canvas' device-pixel scale, rarely a whole number, with smoothing on, and the
// browser's filter reads past a frame's source rect: packed edge to edge, a
// wall pulled in its atlas neighbour's dark outline and a hatch, trap, robot or
// lava frame its next animation frame, a faint line at the cell's edge
// (tg-iex). Bilinear filtering reads one texel past the rect, which a 2 px
// gutter already covers (measured clean down to 0.3x). The gutter is 4 px and
// frame rects start on a 4 px grid (PITCH and GUTTER are multiples of 4) as a
// margin for renderers that downscale through mipmaps (level-2 texels are 4x4
// blocks on a 4 px grid): down to quarter size no filter tap leaves the cell.
// Layout entries keep the exact frame rect (sx, sy, tilew, tileh) and add the
// columns, the frame count and the spacing between frame rects (PITCH - T);
// Quintus' SpriteSheet steps by tilew + spacing (lib/quintus_sprites.js).
export const GUTTER = 4;
export const PITCH = 60;
const SHEET_ROWS = [["player", FRAMES.player], ["exitHatch", FRAMES.exitHatch], ["electricTrap", FRAMES.electricTrap]];
// Lava is the user's 2012 art (images/sprytszyt.png, sheet `lava` in
// data/sprites.json). Its frames are copied here byte for byte, only repacked
// with the gutter; robot-cell.json's `lava` entry overrides the old one.
const LAVA_SOURCE = "images/sprytszyt.png";
const LAVA_SOURCE_JSON = "data/sprites.json";

export function layoutAtlas() {
  const spacing = PITCH - T;
  const layout = {};
  let row = 0;
  for (const [name, n] of SHEET_ROWS) {
    layout[name] = { sx: GUTTER, sy: row * PITCH + GUTTER, tilew: T, tileh: T, w: n * PITCH - spacing, h: T, cols: n, spacing, frames: n };
    row += 1;
  }
  SINGLES.forEach((name, i) => {
    layout[name] = { sx: i * PITCH + GUTTER, sy: row * PITCH + GUTTER, tilew: T, tileh: T, w: T, h: T, cols: 1, spacing, frames: 1 };
  });
  row += 1;
  const lavaN = lavaSourceFrames().length, lavaRows = Math.ceil(lavaN / COLS);
  layout.lava = { sx: GUTTER, sy: row * PITCH + GUTTER, tilew: T, tileh: T, w: Math.min(lavaN, COLS) * PITCH - spacing, h: lavaRows * PITCH - spacing,
    cols: Math.min(lavaN, COLS), spacing, frames: lavaN };
  row += lavaRows;
  return { layout, width: COLS * PITCH, height: row * PITCH };
}

/** Frame `f`'s source rect origin, computed as Quintus' SpriteSheet.fx/fy do. */
export function frameOrigin(L, f) {
  const sp = L.spacing || 0;
  const cols = L.cols || Math.floor((L.w + sp) / (L.tilew + sp));
  return [(f % cols) * (L.tilew + sp) + L.sx, Math.floor(f / cols) * (L.tileh + sp) + L.sy];
}

let lavaCache = null;
/** The 2012 lava frames, exactly as the old atlas holds them. */
export function lavaSourceFrames() {
  if (lavaCache) return lavaCache;
  const src = decodePng(fs.readFileSync(path.join(ROOT, LAVA_SOURCE)));
  const L = JSON.parse(fs.readFileSync(path.join(ROOT, LAVA_SOURCE_JSON), "utf8")).lava;
  const sx = L.sx || 0, sy = L.sy || 0, cols = L.cols || Math.floor(L.w / L.tilew), n = cols * Math.round(L.h / L.tileh);
  if (L.tilew !== T || L.tileh !== T) throw new Error(`${LAVA_SOURCE_JSON} lava frames are ${L.tilew}x${L.tileh}, want ${T}x${T}`);
  lavaCache = Array.from({ length: n }, (_, f) => crop(src, sx + (f % cols) * T, sy + Math.floor(f / cols) * T, T, T));
  return lavaCache;
}

export const STYLES = ["toybox", "retro"];
// Shipped files per style; retro keeps the same names under images/retro/ and data/retro/.
export const STYLE_FILES = {
  toybox: { atlas: ATLAS_PNG, json: ATLAS_JSON, dir: "images/" },
  retro: { atlas: "images/retro/tiles/robot-cell.png", json: "data/retro/robot-cell.json", dir: "images/retro/" },
};
const checkStyle = (style) => {
  if (!STYLE_FILES[style]) throw new Error(`unknown style ${style} (want ${STYLES.join(" or ")})`);
  return style;
};
const terrainFor = (style) => (checkStyle(style) === "retro" ? drawRetroTerrain : drawTerrain);

/** Every atlas frame as a T x T raster, by sheet name. */
function atlasFrames(style = "toybox") {
  const flat = (src) => { const f = blank(T, T); composite(f, src, 0, 0); return f; };
  const terrain = terrainFor(style);
  const frames = { player: (style === "retro" ? retroRobotFrames() : robotFrames()).map(flat) };
  for (const name of ["exitHatch", "electricTrap"]) frames[name] = Array.from({ length: FRAMES[name] }, (_, f) => flat(terrain(name, f)));
  for (const name of SINGLES) frames[name] = [flat(terrain(name))];
  // Toybox lava is the 2012 art, byte for byte; retro lava is code-drawn with its frame count.
  frames.lava = style === "retro" ? lavaSourceFrames().map((_, f) => flat(drawRetroTerrain("lava", f))) : lavaSourceFrames();
  return frames;
}

// The extruded cell around a frame, relative to its rect: [-GUTTER, T + RIGHT).
const RIGHT = PITCH - T - GUTTER;

/** Copies a frame into dst at (left, top) and fills the rest of its cell with its edge pixels. */
function putExtruded(dst, src, left, top) {
  for (let y = -GUTTER; y < T + RIGHT; y += 1)
    for (let x = -GUTTER; x < T + RIGHT; x += 1) {
      const sx = Math.min(T - 1, Math.max(0, x)), sy = Math.min(T - 1, Math.max(0, y));
      const s = (sy * src.width + sx) * 4;
      dst.data.set(src.data.subarray(s, s + 4), ((top + y) * dst.width + left + x) * 4);
    }
}

export function buildAtlas(style = "toybox") {
  const { layout, width, height } = layoutAtlas();
  const atlas = blank(width, height);
  const frames = atlasFrames(style);
  for (const [name, list] of Object.entries(frames)) list.forEach((fr, f) => putExtruded(atlas, fr, ...frameOrigin(layout[name], f)));
  return { atlas, layout, frames, json: JSON.stringify(layout, null, 2) + "\n" };
}

/** The atlas contract (tg-iex): every frame read at its layout rect with
 *  Quintus' maths is the frame (lava: byte for byte the 2012 frame), the rect
 *  starts on the 4 px mipmap grid, and the rest of its cell, at least GUTTER
 *  px on every side, repeats its edge pixels, so filtering past the rect never
 *  reaches another frame or the transparent margin. */
export function atlasProblems(atlas, layout, frames = atlasFrames()) {
  const problems = [];
  const px = (img, x, y) => { const i = (y * img.width + x) * 4; return img.data.subarray(i, i + 4); };
  const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  for (const [name, list] of Object.entries(frames)) {
    const L = layout[name];
    if (!L) { problems.push(`${name}: missing from the layout`); continue; }
    if (L.tilew !== T || L.tileh !== T) problems.push(`${name}: frame ${L.tilew}x${L.tileh}, want ${T}x${T}`);
    if ((L.spacing || 0) !== PITCH - T) problems.push(`${name}: spacing ${L.spacing || 0}, want ${PITCH - T} (a ${PITCH} px pitch)`);
    if ((L.frames || 0) !== list.length) problems.push(`${name}: layout says ${L.frames} frames, the generator has ${list.length}`);
    list.forEach((frame, f) => {
      const [ox, oy] = frameOrigin(L, f);
      if (ox % 4 || oy % 4) problems.push(`${name} frame ${f}: rect at ${ox},${oy} is off the 4 px mipmap grid`);
      if (ox < GUTTER || oy < GUTTER || ox + T + RIGHT > atlas.width || oy + T + RIGHT > atlas.height) {
        problems.push(`${name} frame ${f}: rect at ${ox},${oy} has no room for its gutter`);
        return;
      }
      let frameBad = 0, gutterBad = 0;
      for (let y = -GUTTER; y < T + RIGHT; y += 1)
        for (let x = -GUTTER; x < T + RIGHT; x += 1) {
          const want = px(frame, Math.min(T - 1, Math.max(0, x)), Math.min(T - 1, Math.max(0, y)));
          if (same(px(atlas, ox + x, oy + y), want)) continue;
          if (x >= 0 && y >= 0 && x < T && y < T) frameBad += 1;
          else gutterBad += 1;
        }
      if (frameBad) problems.push(`${name} frame ${f}: ${frameBad} px at its rect differ from the frame`);
      if (gutterBad) problems.push(`${name} frame ${f}: ${gutterBad} gutter px do not repeat the frame's edge`);
    });
  }
  return problems;
}

/** Every file this generator owns: path -> raster (plus the atlas JSON). */
export function buildFiles(style = "toybox") {
  const files = {};
  const { atlas, layout, frames, json } = buildAtlas(style);
  const atlasBad = atlasProblems(atlas, layout, frames);
  if (atlasBad.length) throw new Error(`robot-cell ${style} atlas:\n  ${atlasBad.slice(0, 20).join("\n  ")}`);
  if (style === "retro") {
    // The robot window's other images (obstacles.js, script.js, utilitySprites.js
    // addDot), same names under images/retro/. Part icons are UI, not the window.
    const { atlas: A, dir } = STYLE_FILES.retro;
    files[A] = atlas;
    files[`${dir}robotile.png`] = drawRetroTerrain("floor");
    files[`${dir}obstacle.png`] = drawRetroTerrain("obstacle");
    files[`${dir}ice.png`] = drawRetroTerrain("ice");
    files[`${dir}crackedIce.png`] = drawRetroTerrain("crackedIce");
    files[`${dir}water.png`] = drawRetroTerrain("water");
    for (const [file, w, h, a, , bands] of RESISTORS) files[`${dir}${file}`] = retroResistor(w, h, a, bands);
    return { files, json, frames };
  }
  files[ATLAS_PNG] = atlas;
  files["images/robotile.png"] = drawTerrain("floor");
  files["images/obstacle.png"] = drawTerrain("obstacle");
  files["images/ice.png"] = drawTerrain("ice");
  files["images/crackedIce.png"] = drawTerrain("crackedIce");
  files["images/water.png"] = drawTerrain("water");
  for (const [file, w, h, a, body, bands] of RESISTORS) files[`images/${file}`] = resistor(w, h, a, body, bands);
  for (const [file, take, w, h, grey] of ICONS) files[`images/${file}`] = partIcon(take, w, h, grey);
  return { files, json, frames };
}

// ---------------------------------------------------------------- review
function label(img, text, x, y, colour = "#2a2335", scale = 1) {
  drawText(img, text, x, y, parseColour(colour), scale);
}

let lavaFrames = null;
const retroLavaFrames = new Map();
function lavaFrame(f, style = "toybox") {
  if (style === "retro") {
    const k = f % lavaSourceFrames().length;
    if (!retroLavaFrames.has(k)) retroLavaFrames.set(k, drawRetroTerrain("lava", k));
    return retroLavaFrames.get(k);
  }
  if (!lavaFrames) {
    const src = decodePng(fs.readFileSync(path.join(ROOT, "images/sprytszyt.png")));
    lavaFrames = [];
    for (let i = 0; i < 40; i += 1) lavaFrames.push(crop(src, i * T, 0, T, T));
  }
  return lavaFrames[f % 40];
}

/** Runs a level's setRobotTable against a recording stub. */
function loadLevel(name) {
  const levels = {};
  const Obstacles = Object.fromEntries(["Empty", "Obstacle", "End", "DeadEnd", "Wall", "Corner", "Tunnel", "TrappedChest", "Lava", "Ice", "CrackedIce", "Water", "Dif"].map((k) => [k, { name: k }]));
  const noop = () => {};
  const t = {
    Levels: { addLevel: (l) => { levels[l.name] = l; }, u: { randInt: (n) => Math.floor(Math.random() * n) } },
    Obstacles,
    Selector: new Proxy({}, { get: () => noop }),
    RobotTable: new Proxy({}, { get: () => noop, set: () => true }),
    TuringTable: new Proxy({}, { get: () => noop }),
    Operators: new Proxy({}, { get: () => ({}) }),
  };
  const ctx = vm.createContext({ t, console: { log: noop, error: noop }, Math });
  for (const file of ["levelsdata.js", "levelsdata2.js", "levelsdata3.js", "levelsdata4.js"]) {
    try { vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), ctx); } catch { /* data files may touch globals we do not stub */ }
  }
  const level = levels[name];
  if (!level) throw new Error(`level ${name} not found`);
  const cells = {};
  let size = [0, 0];
  let robot = [0, 0, 0];
  const that = {
    resetTables: (_a, b) => { size = b; },
    setRobot: (x, y, a) => { robot = [x, y, a]; },
    set: (x, y, what, angle = 0, dot = false) => { cells[`${x},${y}`] = { what: what.name, angle, dot }; },
  };
  let seed = 1;
  Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  try { level.set(that); } catch { if (level.setRobotTable) level.setRobotTable(that); }
  if (!size[0]) size = [8, 8];
  return { cells, size, robot };
}

const TILE_FOR = { Empty: "floor", Obstacle: "obstacle", DeadEnd: "deadend", Wall: "wall", Corner: "corner", Tunnel: "tunnel", Ice: "ice", CrackedIce: "crackedIce", Water: "water", Dif: "magicTile" };
const terrainCache = new Map();
function cellImage(what, frame, style = "toybox") {
  if (what === "Lava") return lavaFrame(frame, style);
  const [name, f] = what === "End" ? ["exitHatch", 0] : what === "TrappedChest" ? ["electricTrap", frame % FRAMES.electricTrap] : [TILE_FOR[what] ?? "floor", 0];
  const id = `${style}/${name}/${f}`;
  if (!terrainCache.has(id)) terrainCache.set(id, terrainFor(style)(name, f));
  return terrainCache.get(id);
}
const dotCache = {};
function dot(i, style = "toybox") {
  if (!dotCache[style])
    dotCache[style] = RESISTORS.map(([, w, h, a, b, bands]) => (style === "retro" ? retroResistor(w, h, a, bands) : resistor(w, h, a, b, bands)));
  return dotCache[style][i % RESISTORS.length];
}

/** The robot table as the game draws it: 50 px tiles, 2 px black gaps. */
const robotCache = {};
const playerFrames = (style) => (robotCache[style] ??= style === "retro" ? retroRobotFrames() : robotFrames());
export function levelMock(name, frame = 0, robotFrame = 0, style = "toybox") {
  const { cells, size, robot } = loadLevel(name);
  const [m, n] = [size[0], size[1]];
  const img = blank(m * 52 + 2, n * 52 + 2, [0, 0, 0, 255]);
  const frames = playerFrames(style);
  let k = 0;
  for (let y = 0; y < n; y += 1)
    for (let x = 0; x < m; x += 1) {
      const c = cells[`${x},${y}`] ?? { what: "Empty", angle: 0 };
      let tile = rotate90(cellImage(c.what, frame, style), -c.angle);
      if (c.dot) {
        tile = clone(tile);
        const d = dot(k++, style);
        composite(tile, d, Math.round((T - d.width) / 2), Math.round((T - d.height) / 2));
      }
      composite(img, tile, 2 + x * 52, 2 + y * 52);
    }
  const r = rotate90(frames[robotFrame], -robot[2]);
  composite(img, r, 2 + robot[0] * 52, 2 + robot[1] * 52);
  return img;
}

// Review grounds per style: the sheet's ground, a dark ground and the label ink.
const REVIEW = {
  toybox: { bg: "#efe9dc", dark: "#1e2126", ink: "#2a2335" },
  retro: { bg: RETRO.bg, dark: "#000000", ink: RETRO.phosphor },
};

function framesSheet(style = "toybox") {
  const { bg, dark: darkHex, ink } = REVIEW[style];
  const drawTerrain = terrainFor(style);
  const robots = playerFrames(style);
  const groups = [["player", FRAMES.player, (f) => robots[f]], ["exitHatch", 21, (f) => drawTerrain("exitHatch", f)], ["electricTrap", 21, (f) => drawTerrain("electricTrap", f)]];
  const singles = ["floor", ...SINGLES, "ice", "crackedIce", "water"];
  const scale = 3;
  const W = 16 * (T * scale + 4) + 20;
  const sheet = blank(W, 2400, parseColour(bg));
  const label = (img, text, x, y) => drawText(img, text, x, y, parseColour(ink));
  let y = 10;
  for (const [name, n, fn] of groups) {
    label(sheet, `${name} (${n} frames) 1X ON FLOOR AND DARK, THEN X3`, 10, y);
    y += 12;
    for (let f = 0; f < n; f += 1) {
      const onFloor = drawTerrain(name === "player" ? "floor" : "floor");
      const fr = fn(f);
      const a = name === "player" ? clone(onFloor) : fr;
      if (name === "player") composite(a, fr, 0, 0);
      composite(sheet, a, 10 + f * 54, y);
      const dark = blank(T, T, parseColour(darkHex));
      composite(dark, fr, 0, 0);
      composite(sheet, dark, 10 + f * 54, y + 54);
      label(sheet, `${f}`, 10 + f * 54, y + 108);
    }
    y += 122;
    for (let f = 0; f < n; f += 1) {
      const col = f % 16, row = Math.floor(f / 16);
      const a = name === "player" ? clone(drawTerrain(name === "player" ? (f >= 12 && f <= 21 ? "floor" : "floor") : "floor")) : fn(f);
      if (name === "player") {
        const bg = f >= 12 && f <= 21 ? lavaFrame(f, style) : f >= 23 ? drawTerrain("water") : drawTerrain("floor");
        composite(a, bg, 0, 0);
        composite(a, robots[f], 0, 0);
      }
      composite(sheet, scaleNearest(a, scale), 10 + col * (T * scale + 4), y + row * (T * scale + 14));
      label(sheet, `F${f}`, 10 + col * (T * scale + 4), y + row * (T * scale + 14) + T * scale + 2);
    }
    y += Math.ceil(n / 16) * (T * scale + 14) + 10;
  }
  label(sheet, "SINGLES 1X, X3, AND 3X3 REPEAT AT 1X (ROTATIONS 0 90 180 270 FOR RAILS)", 10, y);
  y += 12;
  singles.forEach((name, i) => {
    const tile = drawTerrain(name);
    composite(sheet, tile, 10 + i * 54, y);
    label(sheet, name.slice(0, 8).toUpperCase(), 10 + i * 54, y + 52);
  });
  y += 64;
  singles.forEach((name, i) => {
    const tile = drawTerrain(name);
    const col = i % 8, row = Math.floor(i / 8);
    composite(sheet, scaleNearest(tile, scale), 10 + col * (T * scale + 4), y + row * (T * scale + 4));
  });
  y += 2 * (T * scale + 4) + 10;
  // rotations of rails and robot
  const rot = ["wall", "corner", "deadend", "tunnel"];
  rot.forEach((name, i) => {
    for (let q = 0; q < 4; q += 1) composite(sheet, rotate90(drawTerrain(name), q), 10 + (i * 4 + q) * 54, y);
  });
  y += 56;
  for (let q = 0; q < 4; q += 1) {
    const a = clone(drawTerrain("floor"));
    composite(a, rotate90(robots[0], q), 0, 0);
    composite(sheet, scaleNearest(a, 2), 10 + q * 104, y);
  }
  RESISTORS.forEach(([, w, h, an, b, bands], i) => {
    const a = clone(drawTerrain("floor"));
    const d = style === "retro" ? retroResistor(w, h, an, bands) : resistor(w, h, an, b, bands);
    composite(a, d, Math.round((T - w) / 2), Math.round((T - h) / 2));
    composite(sheet, scaleNearest(a, 2), 440 + i * 104, y);
  });
  y += 110;
  return crop(sheet, 0, 0, W, y);
}

function iconSheet() {
  const { files } = buildFiles();
  const names = ICONS.map(([f]) => `images/${f}`);
  const minis = ["images/greencapacitor.png", "images/greenintegratedcircuit.png", "images/greencoil.png"];
  const sheet = blank(1600, 820, parseColour("#8f949b"));
  let x = 10;
  label(sheet, "BIG ICONS AT GAME SIZE (0.5) ON LIGHT AND DARK, THEN FILE SIZE", 10, 4);
  names.forEach((n, i) => {
    const r = files[n];
    const half = { width: Math.ceil(r.width / 2), height: Math.ceil(r.height / 2), data: null };
    const small = blank(half.width, half.height);
    for (let yy = 0; yy < half.height; yy += 1) for (let xx = 0; xx < half.width; xx += 1) set(small, xx, yy, get(r, xx * 2, yy * 2));
    const L = blank(130, 130, parseColour("#f2f2f2")), D = blank(130, 130, parseColour("#1e2126"));
    composite(L, small, Math.round((130 - small.width) / 2), Math.round((130 - small.height) / 2));
    composite(D, small, Math.round((130 - small.width) / 2), Math.round((130 - small.height) / 2));
    composite(sheet, L, 10 + i * 136, 16);
    composite(sheet, D, 10 + i * 136, 150);
  });
  names.forEach((n, i) => {
    const r = files[n];
    const L = blank(r.width, r.height, parseColour(i % 2 ? "#1e2126" : "#f2f2f2"));
    composite(L, r, 0, 0);
    composite(sheet, L, x, 290);
    x += r.width + 6;
  });
  label(sheet, "MINIS 1X AND X6 ON LIGHT AND DARK", 10, 540);
  minis.forEach((n, i) => {
    const r = decodePng(fs.readFileSync(path.join(ROOT, n)));
    for (const [k, bg] of [[0, "#f2f2f2"], [1, "#1e2126"]]) {
      const L = blank(r.width + 8, r.height + 8, parseColour(bg));
      composite(L, r, 4, 4);
      composite(sheet, L, 10 + i * 40, 556 + k * 36);
      const B = blank(r.width * 6 + 8, r.height * 6 + 8, parseColour(bg));
      composite(B, scaleNearest(r, 6), 4, 4);
      composite(sheet, B, 140 + i * 320 + k * 156, 556);
    }
  });
  return sheet;
}

function levelSheet(names, style = "toybox") {
  const mocks = names.map((n) => [n, levelMock(n, 0, 0, style), levelMock(n, 7, 0, style)]);
  const W = Math.max(...mocks.map(([, a]) => a.width * 2)) + mocks.reduce((s, [, a]) => s + a.width + 20, 0) + 40;
  const H = mocks.reduce((s, [, a]) => s + a.height * 2 + 30, 10);
  const sheet = blank(W, H, parseColour(REVIEW[style].bg));
  let y = 10;
  for (const [n, a] of mocks) {
    label(sheet, `${n.toUpperCase()} AT 1X AND X2 (GAME LAYOUT: 50 PX TILES, 2 PX BLACK GAPS)`, 10, y, REVIEW[style].ink);
    composite(sheet, a, 10, y + 12);
    composite(sheet, scaleNearest(a, 2), a.width + 30, y + 12);
    y += a.height * 2 + 30;
  }
  return sheet;
}

// ---------------------------------------------------------------- main
function main(argv) {
  const check = argv.includes("--check");
  const at = (flag) => (argv.indexOf(flag) >= 0 ? argv[argv.indexOf(flag) + 1] : undefined);
  const styleArg = at("--style") ?? (check ? "all" : "toybox");
  const styles = styleArg === "all" ? STYLES : [checkStyle(styleArg)];
  const built = Object.fromEntries(styles.map((st) => [st, buildFiles(st)]));
  const bad = [];
  for (const style of styles) {
    const { files, json, frames } = built[style];
    for (const [rel, raster] of Object.entries(files)) {
      const full = path.join(ROOT, rel);
      if (check) {
        if (!fs.existsSync(full)) bad.push(`${rel} missing`);
        else if (pixelSha256(decodePng(fs.readFileSync(full))) !== pixelSha256(raster)) bad.push(`${rel} differs from the generator`);
      } else {
        fs.mkdirSync(path.dirname(full), { recursive: true });
        let same = false;
        try { same = pixelSha256(decodePng(fs.readFileSync(full))) === pixelSha256(raster); } catch {}
        if (!same) { fs.writeFileSync(full, encodePng(raster)); console.log(`wrote ${rel} (${raster.width}x${raster.height})`); }
      }
    }
    const { atlas: PNG, json: JSON_FILE } = STYLE_FILES[style];
    const jsonPath = path.join(ROOT, JSON_FILE);
    if (check) {
      if (!fs.existsSync(jsonPath) || fs.readFileSync(jsonPath, "utf8") !== json) bad.push(`${JSON_FILE} differs from the generator`);
      // the shipped pair itself: every frame at its JSON rect, its edges extruded into the gutter
      let shippedLayout = null;
      try { shippedLayout = JSON.parse(fs.readFileSync(jsonPath, "utf8")); } catch {}
      const pngPath = path.join(ROOT, PNG);
      if (shippedLayout && fs.existsSync(pngPath))
        bad.push(...atlasProblems(decodePng(fs.readFileSync(pngPath)), shippedLayout, frames).slice(0, 10).map((p) => `${PNG}: ${p}`));
    } else {
      fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
      fs.writeFileSync(jsonPath, json);
    }
  }
  if (check && built.retro) {
    // Determinism: a second, independent build of every retro file is identical.
    const again = buildFiles("retro");
    for (const [rel, raster] of Object.entries(built.retro.files))
      if (pixelSha256(again.files[rel]) !== pixelSha256(raster)) bad.push(`${rel}: a second build differs (not deterministic)`);
    // Parity: same sheets, frame counts, pitch, gutters and rects as Toybox,
    // so the game swaps only the URLs; the window's other images keep their sizes.
    if (built.toybox) {
      if (built.retro.json !== built.toybox.json) bad.push(`${STYLE_FILES.retro.json} layout differs from ${STYLE_FILES.toybox.json}`);
      const tA = built.toybox.files[STYLE_FILES.toybox.atlas], rA = built.retro.files[STYLE_FILES.retro.atlas];
      if (tA.width !== rA.width || tA.height !== rA.height) bad.push("retro robot-cell atlas size differs from toybox");
      for (const [rel, raster] of Object.entries(built.retro.files)) {
        const twin = built.toybox.files[rel.replace(STYLE_FILES.retro.dir, STYLE_FILES.toybox.dir)];
        if (rel !== STYLE_FILES.retro.atlas && (!twin || twin.width !== raster.width || twin.height !== raster.height))
          bad.push(`${rel}: no toybox twin of the same size`);
      }
    }
  }
  if (check) {
    if (bad.length) {
      console.error(`robot-cell --check FAILED:\n  ${bad.join("\n  ")}\nRegenerate with: node tools/art/tiles/robot-cell.mjs --style all`);
      process.exit(1);
    }
    for (const style of styles)
      console.log(`robot-cell --check OK [${style}] (${Object.keys(built[style].files).length + 1} files; atlas frames on a ${PITCH} px pitch, edges extruded >= ${GUTTER} px` +
        (style === "toybox" ? `, lava byte-identical to ${LAVA_SOURCE})` : "; deterministic; layout identical to toybox)"));
  }
  const reviewDir = at("--review");
  if (reviewDir) {
    const dir = path.resolve(reviewDir);
    fs.mkdirSync(dir, { recursive: true });
    for (const style of styles) {
      const tag = at("--tag") ?? (style === "toybox" ? "robot-cell-v1" : "robot-cell-retro");
      const out = {
        [`${tag}-frames.png`]: framesSheet(style),
        ...(style === "toybox" ? { [`${tag}-icons.png`]: iconSheet() } : {}),
        [`${tag}-levels.png`]: levelSheet(["tunnel", "labirynth", "ring of fire"], style),
        [`${tag}-levels2.png`]: levelSheet(["some flag?", "just give up", "P"], style),
      };
      for (const [name, img] of Object.entries(out)) fs.writeFileSync(path.join(dir, name), encodePng(img));
      console.log(`review sheets in ${dir}: ${Object.keys(out).join(", ")}`);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
