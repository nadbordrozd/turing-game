#!/usr/bin/env node
// Retro skin page background (bead tg-wtv.8): a dark printed-circuit-board
// texture, near-black green fibreglass with faint copper-free traces, pads and
// vias, tileable, low contrast, so the coloured windows sit on a "desk" with
// some texture (the Toybox wood plays the same part). Deterministic and
// dependency-free: a seeded router lays octilinear traces on a toroidal grid,
// then every pixel is shaded from its distance to them (4x4 supersampled
// edges), so the tile wraps seamlessly in both directions.
//
//   node tools/art/retro-pcb.mjs                write images/retro/pcb.png
//   node tools/art/retro-pcb.mjs --check        fail if the committed file differs from a fresh render
//   node tools/art/retro-pcb.mjs --preview F    also write F: a 3x3 tiling, then 3x of one tile
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { blank, encodePng, decodePng, pixelSha256, parseColour, scaleNearest, composite } from "./lib/png.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = "images/retro/pcb.png";

export const N = 256; // tile side, px
const CELL = 8; // routing grid pitch, px
const G = N / CELL; // grid cells per side
const SEED = 20121113;

// Low contrast on purpose: the windows carry the colour, this is the desk.
export const PCB = {
  base: "#07130d", // fibreglass under the solder mask
  weave: "#0a1811", // the glass weave, a faint cross-hatch
  trace: "#0f2618", // a trace under the mask
  traceEdge: "#133020", // its lit edge
  pad: "#16341f", // pads and via rings (no copper shine: still under the mask)
  hole: "#030805", // drilled hole
  silk: "#1c3a2a", // a few faint silkscreen ticks
};
const C = Object.fromEntries(Object.entries(PCB).map(([k, v]) => [k, parseColour(v)]));

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
const mod = (a, n) => ((a % n) + n) % n;
const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

/** Routes traces on the toroidal grid: each a polyline of grid points that
 *  never reuses a cell (nor touches one diagonally across another trace). */
function route() {
  const rand = rng(SEED);
  const used = new Uint8Array(G * G);
  const at = (x, y) => used[mod(y, G) * G + mod(x, G)];
  const take = (x, y) => { used[mod(y, G) * G + mod(x, G)] = 1; };
  const traces = [];
  for (let attempt = 0; attempt < 400 && traces.length < 46; attempt += 1) {
    let x = Math.floor(rand() * G), y = Math.floor(rand() * G);
    if (at(x, y)) continue;
    let d = Math.floor(rand() * 4) * 2 + (rand() < 0.25 ? 1 : 0);
    const pts = [[x, y]];
    take(x, y);
    const len = 4 + Math.floor(rand() * 14);
    for (let s = 0; s < len; s += 1) {
      if (s > 1 && rand() < 0.22) d = mod(d + (rand() < 0.5 ? 1 : -1), 8);
      const [dx, dy] = DIRS[d];
      const nx = x + dx, ny = y + dy;
      // diagonal moves must not cut between two used cells
      if (at(nx, ny) || (dx && dy && (at(x + dx, y) || at(x, y + dy)))) break;
      x = nx; y = ny;
      take(x, y);
      pts.push([x, y]);
    }
    if (pts.length < 4) continue;
    traces.push({ pts, ends: [rand() < 0.6 ? "via" : "pad", rand() < 0.5 ? "via" : "pad"], wide: rand() < 0.25 });
  }
  // a few lone vias and pad pairs (component footprints) in free cells
  const extras = [];
  for (let k = 0; k < 60 && extras.length < 22; k += 1) {
    const x = Math.floor(rand() * G), y = Math.floor(rand() * G);
    if (at(x, y) || at(x + 1, y)) continue;
    take(x, y);
    if (rand() < 0.5) { take(x + 1, y); extras.push({ kind: "pair", x, y }); }
    else extras.push({ kind: "via", x, y });
  }
  return { traces, extras };
}

function sdSeg(px, py, ax, ay, bx, by) {
  const pax = px - ax, pay = py - ay, bax = bx - ax, bay = by - ay;
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  return Math.hypot(pax - bax * h, pay - bay * h);
}
/** Shortest wrapped offset, so distances are measured on the torus. */
const wrap = (d) => d - N * Math.round(d / N);

export function render() {
  const { traces, extras } = route();
  // segments and features in px, centred on cells
  const segs = [], vias = [], pads = [];
  const px = ([gx, gy]) => [gx * CELL + CELL / 2, gy * CELL + CELL / 2];
  for (const t of traces) {
    const half = t.wide ? 1.6 : 1.0;
    for (let i = 0; i + 1 < t.pts.length; i += 1) {
      const [ax, ay] = px(t.pts[i]);
      const [bx, by] = [ax + (t.pts[i + 1][0] - t.pts[i][0]) * CELL, ay + (t.pts[i + 1][1] - t.pts[i][1]) * CELL];
      segs.push({ ax, ay, bx, by, half });
    }
    const ends = [t.pts[0], t.pts[t.pts.length - 1]];
    ends.forEach((e, i) => {
      const [cx, cy] = px(e);
      if (t.ends[i] === "via") vias.push({ cx, cy, r: 2.8 });
      else pads.push({ cx, cy, hw: 2.5, hh: 2.5 });
    });
  }
  for (const e of extras) {
    const [cx, cy] = px([e.x, e.y]);
    if (e.kind === "via") vias.push({ cx, cy, r: 2.4 });
    else { pads.push({ cx, cy, hw: 2, hh: 3 }); pads.push({ cx: cx + CELL, cy, hw: 2, hh: 3 }); }
  }
  const shade = (x, y) => {
    for (const v of vias) {
      const r = Math.hypot(wrap(x - v.cx), wrap(y - v.cy));
      if (r < v.r * 0.45) return C.hole;
      if (r < v.r) return C.pad;
    }
    for (const p of pads) if (Math.abs(wrap(x - p.cx)) < p.hw && Math.abs(wrap(y - p.cy)) < p.hh) return C.pad;
    let best = Infinity, bh = 1;
    for (const s of segs) {
      // translate the point next to the segment's start, on the torus
      const ox = s.ax + wrap(x - s.ax), oy = s.ay + wrap(y - s.ay);
      const d = sdSeg(ox, oy, s.ax, s.ay, s.bx, s.by) - s.half;
      if (d < best) { best = d; bh = s.half; }
    }
    if (best <= -0.6 * bh + 0.2) return C.trace;
    if (best <= 0) return C.traceEdge;
    // glass weave: a faint 4 px cross-hatch, broken so it reads as texture
    const wx = mod(x, 4) < 1, wy = mod(y, 4) < 1;
    return (wx !== wy) && mod(Math.floor(x / 4) + Math.floor(y / 4), 3) !== 0 ? C.weave : C.base;
  };
  const img = blank(N, N);
  const SS = 4;
  for (let y = 0; y < N; y += 1)
    for (let x = 0; x < N; x += 1) {
      const c0 = shade(x + 0.5, y + 0.5);
      const c1 = shade(x + 0.05, y + 0.05), c2 = shade(x + 0.95, y + 0.95);
      let r = c0[0], g = c0[1], b = c0[2];
      if (c1 !== c0 || c2 !== c0) {
        r = g = b = 0;
        for (let sy = 0; sy < SS; sy += 1)
          for (let sx = 0; sx < SS; sx += 1) {
            const c = shade(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
            r += c[0]; g += c[1]; b += c[2];
          }
        r = Math.round(r / (SS * SS)); g = Math.round(g / (SS * SS)); b = Math.round(b / (SS * SS));
      }
      img.data.set([r, g, b, 255], (y * N + x) * 4);
    }
  // a few silkscreen ticks: short dashes beside pads (component outlines)
  const rand = rng(SEED + 1);
  for (let k = 0; k < 10; k += 1) {
    const x0 = Math.floor(rand() * N), y0 = Math.floor(rand() * N), w = 6 + Math.floor(rand() * 10), vert = rand() < 0.5;
    for (let i = 0; i < w; i += 1) {
      const x = mod(vert ? x0 : x0 + i, N), y = mod(vert ? y0 + i : y0, N), o = (y * N + x) * 4;
      const cur = img.data.subarray(o, o + 3);
      if (cur[1] < C.trace[1]) img.data.set([C.silk[0], C.silk[1], C.silk[2], 255], o);
    }
  }
  return img;
}

function main() {
  const argv = process.argv.slice(2);
  const img = render();
  const file = path.join(ROOT, OUT);
  if (argv.includes("--check")) {
    if (!fs.existsSync(file)) { console.error(`retro-pcb --check FAIL: ${OUT} missing`); process.exit(1); }
    const a = pixelSha256(decodePng(fs.readFileSync(file))), b = pixelSha256(img), c = pixelSha256(render());
    if (b !== c) { console.error("retro-pcb --check FAIL: two renders differ"); process.exit(1); }
    if (a !== b) { console.error(`retro-pcb --check FAIL: ${OUT} differs from a fresh render (run node tools/art/retro-pcb.mjs)`); process.exit(1); }
    console.log(`retro-pcb --check OK ${OUT} ${N}x${N} ${b.slice(0, 12)}`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, encodePng(img));
  console.log(`wrote ${OUT} ${N}x${N} ${pixelSha256(img).slice(0, 12)}`);
  const pi = argv.indexOf("--preview");
  if (pi >= 0) {
    const sheet = blank(N * 3 + N * 3 + 16, N * 3, [0, 0, 0, 255]);
    for (let j = 0; j < 3; j += 1) for (let i = 0; i < 3; i += 1) composite(sheet, img, i * N, j * N);
    composite(sheet, scaleNearest(img, 3), N * 3 + 16, 0);
    fs.writeFileSync(path.resolve(argv[pi + 1]), encodePng(sheet));
    console.log(`preview ${argv[pi + 1]}`);
  }
}
main();
