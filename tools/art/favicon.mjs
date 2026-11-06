#!/usr/bin/env node
// Favicons and home-screen icons: the player robot's head on a rounded tomato
// tile (Toybox palette). Derived from the accepted player robot master
// (robot-v1/robot-front-c#0, hash-checked here):
//   - the 32 px design is the master's head at 1x (its native pixels) on a
//     hand-drawn tile, plus a few recorded hand-tuned pixels;
//   - the 16 px design is hand-drawn pixel by pixel below (a downscale of the
//     master does not read at 16), in the master's own colours;
//   - the larger files are those designs scaled up nearest-neighbour by whole
//     factors (48 = 16 x3; 192 = 32 x6; 512 = 32 x16; the 180 px
//     apple-touch-icon is a full-bleed 36-unit version x5, since iOS masks the
//     corners itself and fills transparency with black).
// Deterministic and dependency-free.
//
//   node tools/art/favicon.mjs                  write the icons into images/icons/
//   node tools/art/favicon.mjs --check          regenerate in memory, fail if a committed file differs
//   node tools/art/favicon.mjs --review <dir>   also write a review sheet (native and x8, light and dark tabs)
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { decodePng, encodePng, blank, crop, composite, scaleNearest, parseColour, fillRect } from "./lib/png.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCE = { set: "robot-v1", id: "robot-front-c", n: 0 };
const HEAD = { x: 11, y: 2, width: 26, height: 24 }; // antenna ball to chin, ears included, in the 48x48 master
export const OUTPUTS = {
  16: "images/icons/favicon-16.png",
  32: "images/icons/favicon-32.png",
  48: "images/icons/favicon-48.png",
  180: "images/icons/apple-touch-icon.png",
  192: "images/icons/icon-192.png",
  512: "images/icons/icon-512.png",
};

// Colours: the tile from css/toybox.css (--tomato, --tomato-d, --ink), the
// robot from the master's own palette.
const PAL = {
  ".": "transparent",
  K: "#20092e", // robot outline (master)
  I: "#2a2335", // tile rim (--ink)
  R: "#ec5b45", // tile (--tomato)
  r: "#b83a2c", // tile shade (--tomato-d)
  h: "#f47c64", // tile highlight
  L: "#fdfde5", // cream highlight (master)
  C: "#faf1ba", // cream (master)
  S: "#d9b881", // cream shade (master)
  B: "#1bc2fd", // visor (master)
  D: "#0c89e5", // visor rim (master)
  W: "#fffffc", // eye white (master)
  Y: "#f5c40c", // antenna ball (master)
  O: "#f76314", // antenna ball shade (master)
  G: "#344e62", // antenna stem (master)
  E: "#0e89e2", // ear (master)
};

// ---------------------------------------------------------------- 16 px, hand-drawn
const ICON16 = [
  "..RRRRRRRRRRRR..",
  ".RRRRRRKKRRRRRR.",
  "RRRRRRKYYKRRRRRR",
  "RRRRRRKOOKRRRRRR",
  "RRRRRRRKKRRRRRRR",
  "RRRKKKKKKKKKKRRR",
  "RRKLCCCCCCCCCKRR",
  "RKKCDDDDDDDDCKKR",
  "RKEKBWKBBWKBCKER",
  "RKEKBKKBBKKBCKER",
  "RKKCDDDDDDDDCKKR",
  "RRKCCCCDDCCCCKRR",
  "RRKSSSSSSSSSSKRR",
  "RRRKKKKKKKKKKRRR",
  "rrrrrrrrrrrrrrrr",
  "..rrrrrrrrrrrr..",
];

function fromRows(rows) {
  const out = blank(rows[0].length, rows.length);
  rows.forEach((row, y) => {
    if (row.length !== out.width) throw new Error(`row ${y} is ${row.length} wide`);
    [...row].forEach((c, x) => {
      if (!(c in PAL)) throw new Error(`unknown colour key ${c}`);
      out.data.set(parseColour(PAL[c]), (y * out.width + x) * 4);
    });
  });
  return out;
}

// ---------------------------------------------------------------- 32 px, master head on a tile
// Rounded tile: per-row inset of the corner rows, ink rim, tomato fill,
// a highlight row under the top rim and two shade rows above the bottom rim.
function tile(size, insets, { rim = true, fullBleed = false } = {}) {
  const out = blank(size, size);
  const c = (k) => parseColour(PAL[k]);
  for (let y = 0; y < size; y += 1) {
    const inset = fullBleed ? 0 : Math.max(insets[y] ?? 0, insets[size - 1 - y] ?? 0);
    for (let x = inset; x < size - inset; x += 1) {
      const xin = fullBleed ? 0 : Math.max(insets[x] ?? 0, insets[size - 1 - x] ?? 0);
      if (y < xin || y >= size - xin) continue;
      out.data.set(c("R"), (y * size + x) * 4);
    }
  }
  // shading by distance to the bottom/top edge of the filled shape
  const filled = (x, y) => x >= 0 && y >= 0 && x < size && y < size && out.data[(y * size + x) * 4 + 3] > 0;
  const paint = blank(size, size);
  paint.data.set(out.data);
  for (let y = 0; y < size; y += 1)
    for (let x = 0; x < size; x += 1) {
      if (!filled(x, y)) continue;
      const edge = !filled(x - 1, y) || !filled(x + 1, y) || !filled(x, y - 1) || !filled(x, y + 1);
      let k = "R";
      if (rim && edge && !fullBleed) k = "I";
      else if (!filled(x, y + 2 + (rim ? 1 : 0)) || !filled(x, y + 1 + (rim ? 1 : 0))) k = "r";
      else if (!filled(x, y - 1 - (rim ? 1 : 0))) k = "h";
      paint.data.set(c(k), (y * size + x) * 4);
    }
  return paint;
}

// Hand-tuned pixels on the 32 px icon, [x, y, key].
const EDITS32 = [];

function master() {
  const { set, id, n } = SOURCE;
  const records = JSON.parse(fs.readFileSync(path.join(ROOT, "art/sets", set, "records.json"), "utf8"));
  const verdicts = JSON.parse(fs.readFileSync(path.join(ROOT, "art/sets", set, "verdicts.json"), "utf8"));
  if (verdicts[`${id}#${n}`]?.verdict !== "ACCEPTED") throw new Error(`${set}/${id}#${n} is not ACCEPTED`);
  const want = records[id]?.candidates?.[n]?.sha256;
  const file = path.join(ROOT, "art/masters", set, `${id}-${n}.png`);
  const bytes = fs.readFileSync(file);
  if (createHash("sha256").update(bytes).digest("hex") !== want) throw new Error(`${file} is not the recorded ${set}/${id}#${n}`);
  return decodePng(bytes);
}

function head() {
  const h = crop(master(), HEAD.x, HEAD.y, HEAD.width, HEAD.height);
  return h;
}

function design32({ fullBleed = false, size = 32 } = {}) {
  const out = tile(size, [4, 2, 1, 1], { fullBleed });
  const h = head();
  const left = Math.floor((size - h.width) / 2);
  const top = Math.floor((size - h.height) / 2) - 1;
  composite(out, h, left, top);
  for (const [x, y, k] of EDITS32) out.data.set(parseColour(PAL[k]), ((y + (size - 32) / 2) * size + x + (size - 32) / 2) * 4);
  return out;
}

export function render() {
  const i16 = fromRows(ICON16);
  const i32 = design32();
  return {
    16: i16,
    32: i32,
    48: scaleNearest(i16, 3),
    180: scaleNearest(design32({ fullBleed: true, size: 36 }), 5),
    192: scaleNearest(i32, 6),
    512: scaleNearest(i32, 16),
  };
}

// ---------------------------------------------------------------- review sheet
function reviewSheet(icons) {
  const bgs = ["#ffffff", "#dee1e6", "#35363a", "#202124"]; // light tab, light strip, dark tab, dark strip
  const cell = 16 * 8 + 32 * 8 + 48 + 64; // 16 x8, 32 x8, plus natives
  const out = blank(cell + 40, bgs.length * (32 * 8 + 24), [128, 128, 128, 255]);
  bgs.forEach((bg, row) => {
    const top = row * (32 * 8 + 24);
    fillRect(out, 0, top, out.width, 32 * 8 + 24, parseColour(bg));
    composite(out, icons[16], 12, top + 12);
    composite(out, icons[32], 12, top + 40);
    composite(out, icons[48], 12, top + 84);
    composite(out, scaleNearest(icons[16], 8), 72, top + 12);
    composite(out, scaleNearest(icons[32], 8), 72 + 16 * 8 + 12, top + 12);
  });
  return out;
}

function main(argv) {
  const check = argv.includes("--check");
  const reviewAt = argv.indexOf("--review");
  const icons = render();
  const bad = [];
  for (const [size, rel] of Object.entries(OUTPUTS)) {
    const bytes = encodePng(icons[size]);
    const file = path.join(ROOT, rel);
    const same = fs.existsSync(file) && Buffer.compare(fs.readFileSync(file), bytes) === 0;
    if (check) { if (!same) bad.push(`${rel} differs from the generator`); continue; }
    if (!same) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, bytes); console.log(`wrote ${rel}`); }
  }
  if (reviewAt >= 0) {
    const dir = argv[reviewAt + 1];
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "favicon-review.png"), encodePng(reviewSheet(icons)));
    console.log(`review sheet in ${path.join(dir, "favicon-review.png")}`);
  }
  if (check) {
    if (bad.length) {
      console.error(`favicon --check FAILED:\n  ${bad.join("\n  ")}\nRegenerate with: node tools/art/favicon.mjs`);
      process.exit(1);
    }
    console.log(`favicon --check OK (${Object.keys(OUTPUTS).length} files)`);
  }
}

main(process.argv.slice(2));
