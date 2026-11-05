#!/usr/bin/env node
// Intro slide 2: real maths in chalk on the blackboard. PixelLab writes
// nonsense glyphs, so the accepted take (intro-v1/beat2-c#0) has a clean board
// and this script draws the equations onto it at the take's native 300x172
// resolution with a tiny hand-made pixel glyph set, then scales x3 nearest to
// the game files. The master stays byte-identical to its recorded take (it is
// hash-checked here); the game files are derived and re-derivable.
// Deterministic and dependency-free (docs/art/classes/illustrations.md).
//
//   node tools/art/intro-chalk.mjs                  write images/intro/intro-2.png and intro-2-portrait.png
//   node tools/art/intro-chalk.mjs --check          regenerate in memory, fail if a committed file differs
//   node tools/art/intro-chalk.mjs --review <dir>   also write the native board and a x4 close-up
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { decodePng, encodePng, scaleNearest, crop, pixelSha256, parseColour } from "./lib/png.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCE = { set: "intro-v1", id: "beat2-c", n: 0 };
const BOARD = "#2d3a37"; // the take's flat board colour: chalk only ever replaces this colour
const CHALK = parseColour("#f1ecd8"); // cream chalk
const CHALK_DIM = parseColour("#c4cbbb"); // thinner chalk, mixed in for a hand-drawn grain
const SMUDGE = parseColour("#34423e"); // old, half-erased chalk
const SCALE = 3;
const PORTRAIT = { x: 28, y: 0, width: 228, height: 172 }; // keeps the robot and the equations in frame
export const OUTPUTS = { landscape: "images/intro/intro-2.png", portrait: "images/intro/intro-2-portrait.png" };

// ---------------------------------------------------------------- glyphs
// Rows top to bottom; `top` is the row of the first string, where row 0 is the
// cap height and the baseline sits under row 6 (so x-height is rows 2-6 and
// descenders are rows 7-8). Strings are drawn with "1"/"#".
const G = {
  H: { top: 0, rows: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"] },
  L: { top: 0, rows: ["1000", "1000", "1000", "1000", "1000", "1000", "1111"] },
  Hhat: { top: -3, rows: ["00100", "01010", "00000", "10001", "10001", "10001", "11111", "10001", "10001", "10001"] },
  p: { top: 2, rows: ["1110", "1001", "1001", "1001", "1110", "1000", "1000"] },
  pdot: { top: 0, rows: ["0100", "0000", "1110", "1001", "1001", "1001", "1110", "1000", "1000"] },
  q: { top: 2, rows: ["0111", "1001", "1001", "1001", "0111", "0001", "0001"] },
  qdot: { top: 0, rows: ["0010", "0000", "0111", "1001", "1001", "1001", "0111", "0001", "0001"] },
  e: { top: 2, rows: ["0110", "1001", "1111", "1000", "0111"] },
  i: { top: 0, rows: ["1", "0", "1", "1", "1", "1", "1"] },
  t: { top: 0, rows: ["010", "010", "111", "010", "010", "010", "001"] },
  d: { top: 0, rows: ["0001", "0001", "0111", "1001", "1001", "1001", "0111"] },
  x: { top: 2, rows: ["10001", "01010", "00100", "01010", "10001"] },
  hbar: { top: 0, rows: ["01000", "11100", "01000", "01110", "01001", "01001", "01001"] },
  partial: { top: 0, rows: ["01110", "00001", "00001", "01111", "10001", "10001", "01110"] },
  psi: { top: 0, rows: ["00100", "00100", "10101", "10101", "10101", "01110", "00100", "00100"] },
  pi: { top: 2, rows: ["11111", "01010", "01010", "01010", "01001"] },
  one: { top: 0, rows: ["010", "110", "010", "010", "010", "010", "111"] },
  zero: { top: 0, rows: ["0110", "1001", "1001", "1001", "1001", "1001", "0110"] },
  eq: { top: 3, rows: ["11111", "00000", "11111"] },
  minus: { top: 4, rows: ["11111"] },
  plus: { top: 2, rows: ["00100", "00100", "11111", "00100", "00100"] },
  cdot: { top: 4, rows: ["1"] },
  integral: { top: -2, rows: ["0011", "0100", "0100", "0100", "0100", "0100", "0100", "0100", "0100", "0100", "1000"] },
  // superscript / limit size (bottom-aligned when raised)
  si: { top: 0, rows: ["1", "0", "1", "1", "1"] },
  spi: { top: 1, rows: ["1111", "0101", "0101", "0101"] },
  sx: { top: 2, rows: ["101", "010", "101"] },
  stwo: { top: 0, rows: ["110", "001", "010", "100", "111"] },
  sminus: { top: 2, rows: ["11"] },
  sinf: { top: 2, rows: ["01010", "10101", "01010"] },
};

// ---------------------------------------------------------------- layout
// A box is { w, asc, desc, pix: [[x, y]] } with y relative to the baseline
// (negative is up) and x from the box's left edge.
function glyph(name) {
  const g = G[name];
  if (!g) throw new Error(`no glyph ${name}`);
  const pix = [];
  g.rows.forEach((row, r) => [...row].forEach((c, x) => c === "1" && pix.push([x, g.top + r - 7])));
  const w = Math.max(...g.rows.map((r) => r.length));
  return { w, asc: 7 - g.top, desc: Math.max(0, g.top + g.rows.length - 7), pix };
}

function row(items, gap = 1) {
  const pix = [];
  let x = 0;
  let asc = 0;
  let desc = 0;
  items.forEach((it, k) => {
    if (typeof it === "number") { x += it; return; }
    for (const [px, py] of it.pix) pix.push([x + px, py]);
    x += it.w + (k < items.length - 1 && typeof items[k + 1] !== "number" ? gap : 0);
    asc = Math.max(asc, it.asc);
    desc = Math.max(desc, it.desc);
  });
  return { w: x, asc, desc, pix };
}

const AXIS = 3; // fraction bar: the middle of the x-height (row 4)
function frac(num, den) {
  const w = Math.max(num.w, den.w) + 2;
  const pix = [];
  for (let x = 0; x < w; x += 1) pix.push([x, -AXIS - 1]);
  const nx = Math.floor((w - num.w) / 2);
  const dx = Math.floor((w - den.w) / 2);
  const nBase = -AXIS - 1 - 2 - num.desc; // one clear row above the bar
  const dBase = -AXIS - 1 + 2 + den.asc; // one clear row below the bar
  for (const [x, y] of num.pix) pix.push([nx + x, nBase + y]);
  for (const [x, y] of den.pix) pix.push([dx + x, dBase + y]);
  return { w, asc: -(nBase - num.asc), desc: dBase + den.desc, pix };
}

function raise(box, by) {
  return { w: box.w, asc: box.asc + by, desc: Math.max(0, box.desc - by), pix: box.pix.map(([x, y]) => [x, y - by]) };
}

function sqrt(inner) {
  // a check-mark radical and an overbar one row above the radicand
  const top = -inner.asc - 2;
  const pix = [[0, -3], [1, -2], [2, -1], [2, 0], [3, -2], [3, -3], [3, -4], [3, -5]];
  for (let y = -6; y >= top + 1; y -= 1) pix.push([4, y]);
  for (let x = 4; x < 4 + inner.w + 3; x += 1) pix.push([x, top]);
  for (const [x, y] of inner.pix) pix.push([6 + x, y]);
  return { w: inner.w + 7, asc: -top, desc: inner.desc, pix };
}

function integral(lo, hi) {
  const s = glyph("integral");
  const pix = [...s.pix];
  for (const [x, y] of hi.pix) pix.push([5 + x, -9 - hi.desc + y + 0]);
  for (const [x, y] of lo.pix) pix.push([3 + x, 4 + lo.asc - 2 + y]);
  return { w: 5 + Math.max(hi.w, lo.w - 2), asc: Math.max(s.asc, 9 + hi.asc), desc: Math.max(s.desc, 4 + lo.desc), pix };
}

const g = glyph;
const sp = (n) => n;

// The board, written in the order a scholar would: Hamilton's mechanics (as in
// the 2012 original), Euler's identity, Schrodinger's equation, the Gaussian
// integral the robot has just written, and a phase-space portrait of the
// harmonic oscillator (clockwise orbits in the q-p plane).
export function equations() {
  const hamiltonian = row([g("H"), sp(3), g("eq"), sp(3), g("p"), g("cdot"), g("qdot"), sp(3), g("minus"), sp(3), g("L")]);
  const qdot = row([g("qdot"), sp(2), g("eq"), sp(2), frac(row([g("partial"), g("H")]), row([g("partial"), g("p")]))]);
  const pdot = row([g("pdot"), sp(2), g("eq"), sp(2), g("minus"), sp(1), frac(row([g("partial"), g("H")]), row([g("partial"), g("q")]))]);
  const euler = row([g("e"), raise(row([g("si"), g("spi")]), 2), sp(3), g("plus"), sp(3), g("one"), sp(3), g("eq"), sp(3), g("zero")]);
  const schrodinger = row([g("i"), g("hbar"), sp(1), frac(row([g("partial"), g("psi")]), row([g("partial"), g("t")])), sp(2), g("eq"), sp(2), g("Hhat"), g("psi")]);
  const gauss = row([
    integral(row([g("sminus"), g("sinf")]), g("sinf")),
    sp(1), g("e"), raise(row([g("sminus"), g("sx"), raise(g("stwo"), 2)]), 2), sp(2), g("d"), g("x"),
    sp(3), g("eq"), sp(3), sqrt(g("pi")),
  ]);
  // scale 2 = the main derivation in big chalk; scale 1 = side notes
  return [
    { box: hamiltonian, x: 36, base: 30, scale: 2 },
    { box: qdot, x: 128, base: 72, scale: 2 },
    { box: pdot, x: 128, base: 116, scale: 2 },
    { box: euler, x: 134, base: 21, scale: 1 },
    { box: schrodinger, x: 200, base: 49, scale: 1 },
    { box: gauss, x: 188, base: 25, scale: 1 },
  ];
}

// phase portrait: axes with arrowheads, two nested orbits with a direction arrow, labels
function diagram() {
  const pix = [];
  const ox = 224;
  const oy = 94;
  for (let x = ox - 26; x <= ox + 28; x += 1) pix.push([x, oy]);
  for (let y = oy - 24; y <= oy + 22; y += 1) pix.push([ox, y]);
  pix.push([ox + 27, oy - 1], [ox + 26, oy - 2], [ox + 27, oy + 1], [ox + 26, oy + 2]); // q arrow
  pix.push([ox - 1, oy - 23], [ox - 2, oy - 22], [ox + 1, oy - 23], [ox + 2, oy - 22]); // p arrow
  const ellipse = (a, b) => {
    const seen = new Set();
    for (let k = 0; k < 720; k += 1) {
      const t = (k / 720) * Math.PI * 2;
      const x = Math.round(ox + a * Math.cos(t));
      const y = Math.round(oy - b * Math.sin(t));
      const key = `${x},${y}`;
      if (!seen.has(key)) { seen.add(key); pix.push([x, y]); }
    }
  };
  ellipse(20, 14);
  ellipse(10, 7);
  // clockwise arrowheads on the orbits' tops (moving right, as q' = p, p' = -q)
  pix.push([ox - 5, oy - 16], [ox - 6, oy - 17], [ox - 5, oy - 12], [ox - 6, oy - 11]);
  pix.push([ox - 4, oy - 9], [ox - 5, oy - 10], [ox - 4, oy - 5], [ox - 5, oy - 4]);
  // labels
  const q = glyph("q");
  for (const [x, y] of q.pix) pix.push([ox + 24 + x, oy + 9 + y]);
  const p = glyph("p");
  for (const [x, y] of p.pix) pix.push([ox + 5 + x, oy - 19 + y]);
  return pix;
}

// half-erased smears: long faint strokes like a board that has been wiped
function smudges() {
  const out = [];
  const strokes = [[34, 42, 150, 3], [126, 26, 70, 2], [196, 118, 60, 3], [100, 60, 20, 2]];
  for (const [x0, y0, len, h] of strokes)
    for (let x = 0; x < len; x += 1) for (let y = 0; y < h; y += 1) if (((x * 7 + y * 13) % 5) !== 0) out.push([x0 + x, y0 + y + Math.round(Math.sin(x / 9))]);
  return out;
}

// ---------------------------------------------------------------- render
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

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function board() {
  const img = master();
  const board = parseColour(BOARD);
  const isBoard = (x, y) => {
    const k = (y * img.width + x) * 4;
    return img.data[k] === board[0] && img.data[k + 1] === board[1] && img.data[k + 2] === board[2];
  };
  const inside = (x, y) => x >= 0 && y >= 0 && x < img.width && y < img.height;
  const smudged = new Set();
  const chalked = new Set();
  for (const [x, y] of smudges()) {
    if (!inside(x, y) || !isBoard(x, y)) continue;
    img.data.set(SMUDGE, (y * img.width + x) * 4);
    smudged.add(y * img.width + x);
  }
  const random = rng(20120);
  const missed = [];
  const chalk = (x, y) => {
    const k = y * img.width + x;
    if (chalked.has(k)) return;
    if (!inside(x, y) || !(isBoard(x, y) || smudged.has(k))) { missed.push([x, y]); return; }
    img.data.set(random() < 0.2 ? CHALK_DIM : CHALK, k * 4);
    chalked.add(k);
  };
  for (const { box, x, base, scale } of equations())
    for (const [px, py] of box.pix)
      for (let j = 0; j < scale; j += 1) for (let i = 0; i < scale; i += 1) chalk(x + px * scale + i, base + py * scale + j);
  for (const [x, y] of diagram()) chalk(x, y);
  // every chalk pixel must land on the clean board (or on a smudge): nothing is drawn over the robot or the frame
  if (missed.length) throw new Error(`chalk off the board at ${missed.slice(0, 8).map((p) => p.join(",")).join(" ")}${missed.length > 8 ? " ..." : ""}`);
  return img;
}

export function buildFiles() {
  const native = board();
  return {
    [OUTPUTS.landscape]: scaleNearest(native, SCALE),
    [OUTPUTS.portrait]: scaleNearest(crop(native, PORTRAIT.x, PORTRAIT.y, PORTRAIT.width, PORTRAIT.height), SCALE),
    native,
  };
}

function main(argv) {
  const check = argv.includes("--check");
  const reviewAt = argv.indexOf("--review");
  const { native, ...files } = buildFiles();
  const bad = [];
  for (const [rel, raster] of Object.entries(files)) {
    const full = path.join(ROOT, rel);
    let same = false;
    try { same = pixelSha256(decodePng(fs.readFileSync(full))) === pixelSha256(raster); } catch {}
    if (check) { if (!same) bad.push(`${rel} differs from the generator`); }
    else if (!same) { fs.writeFileSync(full, encodePng(raster)); console.log(`wrote ${rel} (${raster.width}x${raster.height})`); }
  }
  if (check) {
    if (bad.length) {
      console.error(`intro-chalk --check FAILED:\n  ${bad.join("\n  ")}\nRegenerate with: node tools/art/intro-chalk.mjs`);
      process.exit(1);
    }
    console.log(`intro-chalk --check OK (${Object.keys(files).length} files)`);
  }
  if (reviewAt >= 0) {
    const dir = path.resolve(argv[reviewAt + 1]);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "intro-chalk-native.png"), encodePng(native));
    fs.writeFileSync(path.join(dir, "intro-chalk-x4-board.png"), encodePng(scaleNearest(crop(native, 28, 0, 246, 134), 4)));
    console.log(`review images in ${dir}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
