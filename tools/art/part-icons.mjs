#!/usr/bin/env node
// Retro part reward icons (tg-wtv.4): capacitor, integrated circuit and coil
// as phosphor line art on a dark fill, in the retro hacker chic look of the
// program tiles (tools/art/tiles/program-tiles.mjs, RETRO palette). Drawn in
// code, deterministic and dependency-free; this file is the source of truth
// for images/retro/parts/*.png. Toybox keeps its own icons (images/*.png);
// js/skin-variants.js maps them to these in the retro skin.
//
//   node tools/art/part-icons.mjs                write the nine icons
//   node tools/art/part-icons.mjs --check        fail if a committed icon differs from a fresh render
//   node tools/art/part-icons.mjs --review DIR   also write DIR/part-icons-retro.png (native and 4x, light and dark)
//
// Variants, as the game names them:
//   <part>.png        earned: phosphor lines, amber accents, soft glow (96 px)
//   <part>BW.png      not earned: dim green lines, no accent, no glow (96 px)
//   green<part>.png   the level selector's small set: earned look (48 px)
// Shapes are signed-distance functions in design units (100 per icon side);
// each pixel averages SS x SS samples.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { blank, encodePng, parseColour, scaleNearest, composite, fillRect } from "./lib/png.mjs";
import { drawText } from "./lib/font.mjs";
import { RETRO } from "./tiles/program-tiles.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = "images/retro/parts";
const U = 100; // design units per side
const SS = 6; // samples per axis
const PARTS = ["capacitor", "integratedcircuit", "coil"];

const hex = (h) => parseColour(h);
const INK = {
  earned: { line: hex(RETRO.phosphor), accent: hex(RETRO.amber), hi: hex(RETRO.bright), fill: hex(RETRO.bg), glow: 0.45 },
  off: { line: hex(RETRO.dim), accent: hex(RETRO.dim), hi: hex(RETRO.dim), fill: hex(RETRO.bg), glow: 0 },
};
// stroke half-width and glow reach in output pixels, per icon size
const PX = { 96: { half: 1.3, reach: 4 }, 48: { half: 0.85, reach: 2.5 } };

// ---------------------------------------------------------------- distance functions
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
const sdCircle = (px, py, r) => Math.hypot(px, py) - r;
// approximate ellipse distance (good enough for thin strokes)
function sdEllipse(px, py, rx, ry) {
  const k0 = Math.hypot(px / rx, py / ry), k1 = Math.hypot(px / (rx * rx), py / (ry * ry));
  return k1 === 0 ? -Math.min(rx, ry) : (k0 * (k0 - 1)) / k1;
}

// ---------------------------------------------------------------- shapes
// A shape: { sd(x, y) signed distance in units, fill?: rgb, line?: rgb, w?: stroke width scale, solid?: true (filled with line colour) }
function capacitor(ink) {
  const cx = 50, top = 16, bot = 80, hw = 21;
  const body = (x, y) => sdRoundBox(x - cx, y - (top + bot) / 2, hw, (bot - top) / 2, 7);
  const lid = (x, y) => sdEllipse(x - cx, y - (top + 6), hw - 1.5, 6);
  const vent = (x, y) => Math.min(sdSegment(x, y, cx - 7, top + 6, cx + 7, top + 6), sdSegment(x, y, cx, top + 3.5, cx, top + 8.5));
  // the polarity stripe down the right side, in the amber accent
  const stripe = (x, y) => Math.min(sdSegment(x, y, 61, top + 15, 61, bot - 4), sdSegment(x, y, 67.5, top + 14, 67.5, bot - 6));
  const legs = (x, y) => Math.min(sdSegment(x, y, 41, bot, 41, 92), sdSegment(x, y, 59, bot, 59, 92));
  return [
    { sd: legs, line: ink.line },
    { sd: body, fill: ink.fill, line: ink.line },
    { sd: lid, line: ink.line },
    { sd: vent, line: ink.hi, w: 0.8 },
    { sd: stripe, line: ink.accent, w: 0.8 },
  ];
}

function coil(ink, n) {
  const cx = 50, cy = 50, R = 41, r = 17, N = n < 96 ? 12 : 18; // fewer turns when small
  const ring = (x, y) => Math.max(sdCircle(x - cx, y - cy, R), -sdCircle(x - cx, y - cy, r));
  const outer = (x, y) => sdCircle(x - cx, y - cy, R);
  const inner = (x, y) => sdCircle(x - cx, y - cy, r);
  const turns = (x, y) => {
    let d = Infinity;
    for (let i = 0; i < N; i += 1) {
      const a0 = (i / N) * Math.PI * 2, a1 = a0 + 0.22; // the wire leans as it wraps
      d = Math.min(d, sdSegment(x, y, cx + Math.cos(a0) * (r + 2.5), cy + Math.sin(a0) * (r + 2.5), cx + Math.cos(a1) * (R - 2.5), cy + Math.sin(a1) * (R - 2.5)));
    }
    return d;
  };
  return [
    { sd: ring, fill: ink.fill },
    { sd: turns, line: ink.accent, w: 0.9 },
    { sd: outer, line: ink.line },
    { sd: inner, line: ink.line },
  ];
}

function integratedcircuit(ink) {
  const cx = 50, cy = 50, h = 25;
  const pins = (x, y) => {
    let d = Infinity;
    for (let i = 0; i < 5; i += 1) {
      const o = -16 + i * 8;
      d = Math.min(d,
        sdSegment(x, y, cx + o, cy - h, cx + o, cy - h - 10), sdSegment(x, y, cx + o, cy + h, cx + o, cy + h + 10),
        sdSegment(x, y, cx - h, cy + o, cx - h - 10, cy + o), sdSegment(x, y, cx + h, cy + o, cx + h + 10, cy + o));
    }
    return d;
  };
  const body = (x, y) => sdRoundBox(x - cx, y - cy, h, h, 3);
  const notch = (x, y) => sdCircle(x - (cx - 16), y - (cy - 16), 2.6);
  // the little robot face on the die (as on the Toybox chip)
  const head = (x, y) => sdRoundBox(x - cx, y - (cy + 3), 10, 7.5, 2);
  const antenna = (x, y) => Math.min(sdSegment(x, y, cx, cy - 4.5, cx, cy - 10), sdCircle(x - cx, y - (cy - 11.5), 1.6));
  const eyes = (x, y) => Math.min(sdCircle(x - (cx - 4.5), y - (cy + 1.5), 1.7), sdCircle(x - (cx + 4.5), y - (cy + 1.5), 1.7));
  const mouth = (x, y) => sdSegment(x, y, cx - 4, cy + 6.5, cx + 4, cy + 6.5);
  return [
    { sd: pins, line: ink.line },
    { sd: body, fill: ink.fill, line: ink.line },
    { sd: notch, line: ink.line, w: 0.8 },
    { sd: head, line: ink.accent, w: 0.9 },
    { sd: antenna, line: ink.accent, w: 0.9 },
    { sd: eyes, solid: true, line: ink.accent },
    { sd: mouth, line: ink.accent, w: 0.8 },
  ];
}

const DRAW = { capacitor, integratedcircuit, coil };

// ---------------------------------------------------------------- rasteriser
function over(dst, rgb, a) {
  // dst: [r, g, b, a] straight alpha, composited in place
  const oa = a + dst[3] * (1 - a);
  if (oa <= 0) return;
  for (let i = 0; i < 3; i += 1) dst[i] = (rgb[i] * a + dst[i] * dst[3] * (1 - a)) / oa;
  dst[3] = oa;
}

function sample(shapes, x, y, upp, px, glow) {
  const c = [0, 0, 0, 0];
  for (const s of shapes) {
    const d = s.sd(x, y);
    if (s.fill && d <= 0) over(c, s.fill, 0.94);
    if (!s.line) continue;
    const half = px.half * (s.w ?? 1) * upp;
    const e = s.solid ? d : Math.abs(d) - half;
    if (e <= 0) over(c, s.line, 1);
    else if (glow > 0) {
      const reach = px.reach * upp;
      if (e < reach) over(c, s.line, glow * (1 - e / reach) ** 2);
    }
  }
  return c;
}

export function renderIcon(part, variant) {
  const n = variant === "green" ? 48 : 96;
  const ink = variant === "off" ? INK.off : INK.earned;
  const shapes = DRAW[part](ink, n);
  const px = PX[n], upp = U / n; // units per pixel
  const img = blank(n, n);
  for (let py = 0; py < n; py += 1)
    for (let qx = 0; qx < n; qx += 1) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy += 1)
        for (let sx = 0; sx < SS; sx += 1) {
          const c = sample(shapes, (qx + (sx + 0.5) / SS) * upp, (py + (sy + 0.5) / SS) * upp, upp, px, ink.glow);
          r += c[0] * c[3]; g += c[1] * c[3]; b += c[2] * c[3]; a += c[3];
        }
      const out = a === 0 ? [0, 0, 0, 0] : [Math.round(r / a), Math.round(g / a), Math.round(b / a), Math.round((255 * a) / (SS * SS))];
      img.data.set(out, (py * n + qx) * 4);
    }
  return img;
}

/** Every shipped icon: [repo path, raster]. */
export function icons() {
  const list = [];
  for (const part of PARTS) {
    list.push([`${OUT_DIR}/${part}.png`, renderIcon(part, "earned")]);
    list.push([`${OUT_DIR}/${part}BW.png`, renderIcon(part, "off")]);
    list.push([`${OUT_DIR}/green${part}.png`, renderIcon(part, "green")]);
  }
  return list;
}

function reviewSheet(list) {
  const Z = 4, pad = 12, label = 14;
  const cells = list.map(([file, img]) => ({ name: path.basename(file, ".png"), img, big: scaleNearest(img, img.width === 48 ? Z * 2 : Z) }));
  const cellW = Math.max(...cells.map((c) => c.big.width + c.img.width + pad));
  const cellH = Math.max(...cells.map((c) => c.big.height)) + label + pad;
  const cols = 3, rows = Math.ceil(cells.length / cols);
  const W = pad + cols * (cellW + pad), Hh = pad + rows * cellH;
  const out = blank(W * 2, Hh, [0, 0, 0, 0]);
  fillRect(out, 0, 0, W, Hh, [236, 226, 204, 255]);
  fillRect(out, W, 0, W, Hh, [5, 11, 7, 255]);
  for (let half = 0; half < 2; half += 1)
    cells.forEach((c, i) => {
      const x = half * W + pad + (i % cols) * (cellW + pad), y = pad + Math.floor(i / cols) * cellH;
      drawText(out, c.name.toUpperCase(), x, y, half ? [180, 255, 200, 255] : [40, 35, 50, 255], 1);
      composite(out, c.img, x, y + label);
      composite(out, c.big, x + c.img.width + pad, y + label);
    });
  return out;
}

function main(argv) {
  const list = icons();
  if (argv.includes("--check")) {
    const bad = [];
    for (const [file, img] of list) {
      const p = path.join(ROOT, file);
      if (!fs.existsSync(p) || !fs.readFileSync(p).equals(encodePng(img))) bad.push(file);
    }
    if (bad.length) {
      console.error(`part-icons: out of date (run node tools/art/part-icons.mjs):\n  ${bad.join("\n  ")}`);
      process.exit(1);
    }
    console.log(`part-icons: ${list.length} icons match a fresh render`);
    return;
  }
  fs.mkdirSync(path.join(ROOT, OUT_DIR), { recursive: true });
  for (const [file, img] of list) {
    fs.writeFileSync(path.join(ROOT, file), encodePng(img));
    console.log(`wrote ${file} (${img.width}x${img.height})`);
  }
  const i = argv.indexOf("--review");
  if (i >= 0 && argv[i + 1]) {
    const dir = path.resolve(argv[i + 1]);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "part-icons-retro.png"), encodePng(reviewSheet(list)));
    console.log(`review sheet ${path.join(dir, "part-icons-retro.png")}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
