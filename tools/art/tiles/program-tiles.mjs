#!/usr/bin/env node
// Program (instruction) tiles: conveyor belt, step, clockwise and
// counter-clockwise rotators and the empty board tile, drawn pixel by pixel
// in the Toybox palette. Deterministic and dependency-free; this file is the
// source of truth for those tiles (docs/art/classes/program-tiles.md).
//
//   node tools/art/tiles/program-tiles.mjs            write images/tiles/program-tiles.png + data/program-tiles.json
//   node tools/art/tiles/program-tiles.mjs --check    regenerate in memory, fail if the committed files differ
//   node tools/art/tiles/program-tiles.mjs --review <dir> [--tag v1]
//                                                     also write <tag>.png and <tag>-seam.png review sheets
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { blank, encodePng, decodePng, scaleNearest, composite, fillRect, parseColour, pixelSha256 } from "../lib/png.mjs";
import { drawText } from "../lib/font.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PNG_OUT = "images/tiles/program-tiles.png";
const JSON_OUT = "data/program-tiles.json";

// ---------------------------------------------------------------- geometry
export const T = 50; // tile side
export const PERIOD = 25; // belt pattern period in px (divides T)
export const SHIFT = 1; // px the belt moves east per frame
export const FRAMES = { conveyor: 25, stepForward: 25, cwrotator: 50, ccwrotator: 50, emptyOperator: 1 };
const COLS = 25; // atlas columns

// ---------------------------------------------------------------- palette
const HEX = {
  outline: "#2a2335",
  floor: "#a3d9b1",
  floorRim: "#86c49a",
  floorDot: "#93cea5",
  railLight: "#c9d0d6",
  railMid: "#8b93a3",
  beltEdge: "#3a3f5c",
  belt: "#4a5175",
  beltJoint: "#40466a",
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
  hub: "#fdf1ce",
};
const C = Object.fromEntries(Object.entries(HEX).map(([k, v]) => [k, parseColour(v)]));
export const PALETTE = HEX;

// ---------------------------------------------------------------- raster helpers
const set = (img, x, y, rgba) => {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  img.data.set(rgba, (y * img.width + x) * 4);
};
const mod = (a, n) => ((a % n) + n) % n;

/** Paints `mask(x, y) -> colour|null` over a tile, with a 1 px dark outline
 *  around the shape (8-neighbourhood). `wrapX` treats x periodically so the
 *  outline is continuous across tile edges. */
function paintShape(img, shade, { wrapX = false } = {}) {
  const inside = (x, y) => {
    if (y < 0 || y >= T) return false;
    if (wrapX) x = mod(x, T);
    else if (x < 0 || x >= T) return false;
    return shade(x, y) !== null;
  };
  for (let y = 0; y < T; y += 1)
    for (let x = 0; x < T; x += 1) {
      const colour = shade(x, y);
      if (colour !== null) { set(img, x, y, colour); continue; }
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy += 1)
        for (let dx = -1; dx <= 1 && !near; dx += 1) if ((dx || dy) && inside(x + dx, y + dy)) near = true;
      if (near) set(img, x, y, C.outline);
    }
}

// ---------------------------------------------------------------- layers
/** Empty board panel: flat mint with an even 1 px rim and four corner studs. */
function floor(img) {
  fillRect(img, 0, 0, T, T, C.floor);
  for (let i = 0; i < T; i += 1) {
    set(img, i, 0, C.floorRim); set(img, i, T - 1, C.floorRim);
    set(img, 0, i, C.floorRim); set(img, T - 1, i, C.floorRim);
  }
  for (const [x, y] of [[3, 3], [T - 5, 3], [3, T - 5], [T - 5, T - 5]]) {
    set(img, x, y, C.floorDot); set(img, x + 1, y, C.floorDot);
    set(img, x, y + 1, C.floorDot); set(img, x + 1, y + 1, C.floorDot);
  }
}

// Belt rows (symmetric about the tile centre line y = 24.5 so it survives 180°).
export const BELT = { top: 16, bottom: 33, surfaceTop: 20, surfaceBottom: 29 };
const CHEVRON_TIP = 14; // u position of the chevron tip within a period
const CHEVRON_THICK = 4;

/** The shared belt layer at a given offset (px moved east). */
function belt(img, offset) {
  const rows = {
    16: C.outline, 17: C.railLight, 18: C.railMid, 19: C.outline,
    30: C.outline, 31: C.railMid, 32: C.railLight, 33: C.outline,
  };
  for (let y = BELT.top; y <= BELT.bottom; y += 1)
    for (let x = 0; x < T; x += 1) {
      if (rows[y]) { set(img, x, y, rows[y]); continue; }
      const r = y - BELT.surfaceTop; // 0..9
      const d = r <= 4 ? 4 - r : r - 5; // 0 at the centre rows, 4 at the edges
      const u = mod(x - offset, PERIOD);
      const back = CHEVRON_TIP - d - (CHEVRON_THICK - 1);
      const k = u - back;
      let colour = r === 0 || r === 9 ? C.beltEdge : C.belt;
      if (k >= 0 && k < CHEVRON_THICK) colour = k === 0 ? C.chevronShade : C.chevron;
      else if (u === mod(CHEVRON_TIP + Math.floor(PERIOD / 2), PERIOD) && r > 0 && r < 9) colour = C.beltJoint;
      set(img, x, y, colour);
    }
}

/** Step: chunky blue arrows sliding east above and below the belt. */
const ARROW = { len: 15, shaft: 8, head: 5.5, shaftHalf: 2.5, lanes: [8, 41], period: 25 };
function stepArrows(img, offset) {
  for (const cy of ARROW.lanes) {
    const shade = (x, y) => {
      const dy = y + 0.5 - (cy + 0.5);
      const u = mod(x - offset, ARROW.period) + 0.5; // 0..25 along the arrow lane
      const a = u - 4; // arrow starts at u = 4
      if (a < 0 || a > ARROW.len) return null;
      let half;
      if (a <= ARROW.shaft) half = ARROW.shaftHalf;
      else half = ARROW.head * (1 - (a - ARROW.shaft) / (ARROW.len - ARROW.shaft + 0.6));
      if (Math.abs(dy) > half) return null;
      if (Math.abs(dy) < 0.6) return C.stepLight;
      return Math.abs(dy) > half - 1 ? C.stepDark : C.step;
    };
    paintShape(img, shade, { wrapX: true });
  }
}

/** Rotator: two-arc circular arrow rasterised from polar geometry at `phase` radians. */
const RING = { rc: 15.5, half: 3, headHalf: 6.5, arc: (110 * Math.PI) / 180, headLen: 8.5 };
function rotator(img, phase, dir, colours) {
  const [light, base, dark] = colours;
  const shade = (x, y) => {
    const px = x + 0.5 - T / 2;
    const py = y + 0.5 - T / 2;
    const r = Math.hypot(px, py);
    // Screen angle, clockwise positive (y points down); dir = +1 cw, -1 ccw.
    let theta = Math.atan2(py, px) * dir - phase;
    for (let k = 0; k < 2; k += 1) {
      const a = mod(theta - k * Math.PI, 2 * Math.PI); // 0 at the tail of arc k
      const s = a * RING.rc; // arc length from the tail
      const arcLen = RING.arc * RING.rc;
      let half = -1;
      if (s <= arcLen) half = RING.half;
      else if (s <= arcLen + RING.headLen) half = RING.headHalf * (1 - (s - arcLen) / (RING.headLen + 0.5));
      if (half < 0) continue;
      const t = Math.abs(r - RING.rc);
      if (t > half) continue;
      if (t < 1.2) return light;
      return t > half - 1 ? dark : base;
    }
    return null;
  };
  paintShape(img, shade);
}

// ---------------------------------------------------------------- tiles
export function drawTile(name, frame) {
  const img = blank(T, T);
  floor(img);
  if (name === "emptyOperator") return img;
  const offset = (frame * SHIFT) % PERIOD;
  belt(img, offset);
  if (name === "stepForward") stepArrows(img, offset);
  if (name === "cwrotator" || name === "ccwrotator") {
    const n = FRAMES[name];
    const phase = (frame / n) * Math.PI; // half a turn per loop (two-fold symmetric arrow)
    const cw = name === "cwrotator";
    rotator(img, phase, cw ? 1 : -1, cw ? [C.cwLight, C.cw, C.cwDark] : [C.ccwLight, C.ccw, C.ccwDark]);
  }
  return img;
}

export function buildAtlas() {
  const order = ["conveyor", "stepForward", "cwrotator", "ccwrotator", "emptyOperator"];
  const layout = {};
  let row = 0;
  for (const name of order) {
    const rows = Math.ceil(FRAMES[name] / COLS);
    const w = Math.min(FRAMES[name], COLS) * T;
    layout[name] = { sx: 0, sy: row * T, tilew: T, tileh: T, w, h: rows * T };
    row += rows;
  }
  const atlas = blank(COLS * T, row * T);
  for (const name of order)
    for (let f = 0; f < FRAMES[name]; f += 1)
      composite(atlas, drawTile(name, f), layout[name].sx + (f % COLS) * T, layout[name].sy + Math.floor(f / COLS) * T);
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

/** Rough stand-in for the canvas drawing a 50 px tile at scale 0.9 with smoothing. */
function bilinear(src, w, h) {
  const out = blank(w, h);
  const fx = src.width / w, fy = src.height / h;
  for (let y = 0; y < h; y += 1)
    for (let x = 0; x < w; x += 1) {
      const sx = Math.min(src.width - 1, Math.max(0, (x + 0.5) * fx - 0.5));
      const sy = Math.min(src.height - 1, Math.max(0, (y + 0.5) * fy - 0.5));
      const x0 = Math.floor(sx), y0 = Math.floor(sy), x1 = Math.min(src.width - 1, x0 + 1), y1 = Math.min(src.height - 1, y0 + 1);
      const ax = sx - x0, ay = sy - y0;
      for (let k = 0; k < 4; k += 1) {
        const p = (xx, yy) => src.data[(yy * src.width + xx) * 4 + k];
        const v = (p(x0, y0) * (1 - ax) + p(x1, y0) * ax) * (1 - ay) + (p(x0, y1) * (1 - ax) + p(x1, y1) * ax) * ay;
        out.data[(y * w + x) * 4 + k] = Math.round(v);
      }
    }
  return out;
}

// 5×3 mock: middle row conveyor→step→cw→conveyor→ccw pointing east; column 3
// crosses it with a conveyor (south) above and a step (south) below.
const MOCK = [
  [["emptyOperator", 0], ["emptyOperator", 0], ["emptyOperator", 0], ["conveyor", 1], ["emptyOperator", 0]],
  [["conveyor", 0], ["stepForward", 0], ["cwrotator", 0], ["conveyor", 0], ["ccwrotator", 0]],
  [["emptyOperator", 0], ["emptyOperator", 0], ["emptyOperator", 0], ["stepForward", 1], ["emptyOperator", 0]],
];
function mockBoard(globalFrame, game) {
  const pitch = game ? 47 : T;
  const size = game ? 45 : T;
  const gap = game ? 2 : 0;
  const img = blank(5 * pitch + gap, 3 * pitch + gap, game ? [0, 0, 0, 255] : [0, 0, 0, 0]);
  MOCK.forEach((row, j) =>
    row.forEach(([name, quarter], i) => {
      let tile = rotate90(drawTile(name, globalFrame % FRAMES[name]), quarter);
      if (game) tile = bilinear(tile, size, size);
      composite(img, tile, gap + i * pitch, gap + j * pitch);
    }));
  return img;
}

function label(img, text, x, y, scale = 1) {
  drawText(img, text, x, y, parseColour("#2a2335"), scale);
}

function contactSheet() {
  const names = ["conveyor", "stepForward", "cwrotator", "ccwrotator", "emptyOperator"];
  const bg = parseColour("#efe9dc");
  const rowH = 4 * T + 24;
  const left = 4 * (T + 4) + 16; // 1× strip, then the ×4 tiles
  const tileBlockW = 4 * (4 * T + 8);
  const width = Math.max(left + tileBlockW, 3 * 5 * T * 1 + 40, 2 * (5 * 47 + 2) * 2 + 40);
  const boardH = 3 * T * 3 + 40;
  const gameH = (3 * 47 + 2) * 2 + 40;
  const sheet = blank(width + 20, 20 + names.length * rowH + boardH + gameH * 2 + 40, bg);
  let y = 10;
  for (const name of names) {
    label(sheet, `${name} (${FRAMES[name]} f)`, 10, y);
    const n = FRAMES[name];
    const picks = [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4)];
    picks.forEach((f, k) => {
      const tile = drawTile(name, f);
      const x = left + k * (4 * T + 8);
      composite(sheet, tile, 10 + k * (T + 4), y + 14); // 1×
      label(sheet, `${f}`, 10 + k * (T + 4), y + 16 + T);
      composite(sheet, scaleNearest(tile, 4), x, y + 14); // ×4
      label(sheet, `F${f}`, x, y + 14 + 4 * T + 2);
    });
    y += rowH;
  }
  label(sheet, "BOARD MOCK X3 (FRAME 0)", 10, y);
  composite(sheet, scaleNearest(mockBoard(0, false), 3), 10, y + 12);
  y += boardH;
  for (const f of [0, 12]) {
    label(sheet, `GAME VIEW APPROX: 0.9 SCALE SMOOTHED, 2 PX GAPS, X2 (FRAME ${f})`, 10, y);
    composite(sheet, scaleNearest(mockBoard(f, true), 2), 10, y + 12);
    // 1× game view next to it
    composite(sheet, mockBoard(f, true), 10 + (5 * 47 + 2) * 2 + 20, y + 12);
    y += gameH;
  }
  return sheet;
}

function seamSheet() {
  const scale = 6;
  const bg = parseColour("#efe9dc");
  const pairW = 2 * T * scale;
  const sheet = blank(pairW + 20, 4 * (T * scale + 24) + 10, bg);
  for (let f = 0; f < 4; f += 1) {
    const pair = blank(2 * T, T);
    composite(pair, drawTile("conveyor", f), 0, 0);
    composite(pair, drawTile("stepForward", f), T, 0);
    const y = 10 + f * (T * scale + 24);
    label(sheet, `CONVEYOR + STEP, FRAME ${f} (JOINT AT CENTRE)`, 10, y);
    composite(sheet, scaleNearest(pair, scale), 10, y + 12);
  }
  return sheet;
}

// ---------------------------------------------------------------- self-checks
function selfCheck() {
  const problems = [];
  if (T % PERIOD !== 0) problems.push("belt period must divide the tile");
  for (const name of ["conveyor", "stepForward", "cwrotator", "ccwrotator"]) {
    if ((FRAMES[name] * SHIFT) % PERIOD !== 0) problems.push(`${name}: frames × shift must be a multiple of the period`);
    // Belt rows of every program tile at every frame equal the conveyor's at the same global frame.
    for (let f = 0; f < FRAMES[name]; f += 1) {
      const a = drawTile(name, f), b = drawTile("conveyor", f % FRAMES.conveyor);
      for (const x of [0, T - 1])
        for (let y = BELT.top; y <= BELT.bottom; y += 1) {
          const i = (y * T + x) * 4;
          if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2]) {
            problems.push(`${name} frame ${f}: belt edge differs from conveyor at ${x},${y}`);
            f = FRAMES[name];
            break;
          }
        }
    }
  }
  // Seam: the belt rows are periodic in x with a period dividing the tile, so
  // column 49 of one tile runs straight into column 0 of its east neighbour.
  for (let f = 0; f < FRAMES.conveyor; f += 1) {
    const c = drawTile("conveyor", f);
    for (let y = BELT.top; y <= BELT.bottom; y += 1)
      for (let x = 0; x + PERIOD < T; x += 1)
        for (let k = 0; k < 4; k += 1)
          if (c.data[(y * T + x) * 4 + k] !== c.data[(y * T + x + PERIOD) * 4 + k]) {
            problems.push(`conveyor frame ${f}: belt not periodic at ${x},${y}`);
            return problems;
          }
  }
  return problems;
}

// ---------------------------------------------------------------- main
function main(argv) {
  const check = argv.includes("--check");
  const reviewAt = argv.indexOf("--review");
  const tagAt = argv.indexOf("--tag");
  const tag = tagAt >= 0 ? argv[tagAt + 1] : "program-tiles-v1";
  const problems = selfCheck();
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  const { atlas, json } = buildAtlas();
  const png = encodePng(atlas);
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
    console.log(`program-tiles --check OK (${atlas.width}x${atlas.height}, ${pixelSha256(atlas).slice(0, 12)})`);
  } else {
    fs.mkdirSync(path.dirname(pngPath), { recursive: true });
    fs.writeFileSync(pngPath, png);
    fs.writeFileSync(jsonPath, json);
    console.log(`wrote ${PNG_OUT} (${atlas.width}x${atlas.height}) and ${JSON_OUT}`);
  }
  if (reviewAt >= 0) {
    const dir = path.resolve(argv[reviewAt + 1]);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${tag}.png`), encodePng(contactSheet()));
    fs.writeFileSync(path.join(dir, `${tag}-seam.png`), encodePng(seamSheet()));
    console.log(`review sheets: ${path.join(dir, `${tag}.png`)}, ${path.join(dir, `${tag}-seam.png`)}`);
  }
}

main(process.argv.slice(2));
