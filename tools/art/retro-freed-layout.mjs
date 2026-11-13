#!/usr/bin/env node
// Retro skin end-level crowd (beads tg-wtv.3, tg-wtv.5): the user's
// hand-drawn 2012 robots (art/sets/retro-legacy, images/retro/robots/) on the
// generated phosphor-green night landscape (art/sets/retro-victory-v2,
// images/retro/victory-bg.png). Writes js/skins/retro-robots.js.
//
// Perspective (tg-wtv.5): one camera at CAMERA_H metres above flat ground,
// looking level, so the ground's horizon is the backdrop's horizon line
// HORIZON. A robot of real height H metres whose feet stand d = y_feet -
// HORIZON pixels below the horizon is h = H * d / CAMERA_H pixels tall on
// screen (the same rule for every robot). So giants stand just below the
// horizon (mechagodzilla's feet are 5 px below it and it still towers over
// the hills), a 1.8 m android's head sits just above the horizon wherever it
// stands, and small robots fill the foreground. Each robot is scaled by s
// (smooth scaling; downscaling preferred, never above MAX_UPSCALE) and its
// feet follow from the rule. h and the feet are measured on the opaque part
// of the sprite (alpha >= 128), not its padded box.
//
// The robots keep the 2012 unlock order (git show 8a9315e:EndLevelRobots.js);
// x loosely follows the 2012 x, moved where depth or legibility needs it.
// z follows the feet (lower on screen = in front).
//
// What the end-level UI leaves visible (measured in headless Chrome,
// tg-wtv.5): on desktop the landscape fills the 1024x768 screen and the result
// card covers CARD (x 212-812, y 26-380, plus its 6 px drop shadow); on
// portrait mobile the whole landscape is shown, scaled, above the card.
//
//   node tools/art/retro-freed-layout.mjs            write js/skins/retro-robots.js
//   node tools/art/retro-freed-layout.mjs --check    file current + perspective + visibility
//   node tools/art/retro-freed-layout.mjs --table    H, scale, feet, visibility per robot
//   node tools/art/retro-freed-layout.mjs --preview out.png [--count N] [--card]
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { decodePng, encodePng } from "./lib/png.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(root, "js/skins/retro-robots.js");
const BACKGROUND = "retro/victory-bg.png";
const W = 1024, H_SCREEN = 768;
const HORIZON = 493; // vanishing point of the road edges in bg-road-c (least-squares fit, 1024x768)
const CAMERA_H = 1.6; // metres: a standing person's eye height
const MAX_UPSCALE = 1.25;
const CARD = { x0: 212, y0: 26, x1: 812, y1: 386 }; // desktop result card + shadow
const MIN_VISIBLE = 0.5; // share of each robot's opaque pixels left visible
const FEET_TOLERANCE = 1; // px between the written feet and the rule's feet

// Unlock order (2012). H: real height in metres of what the sprite shows,
// with the reason. x: sprite centre. s: scale of the hand-drawn sprite.
const ROBOTS = [
  { img: "myrobo.png", H: 1.2, x: 500, s: 0.9, why: "the player's robot; no canon size, drawn as a chest-high service robot" },
  { img: "aibo.png", H: 0.28, x: 600, s: 0.4, why: "Sony AIBO ERS-7 is 28 cm tall" },
  { img: "mechagodzilla.png", H: 60, x: 105, s: 1.0, why: "Kiryu (Godzilla Against Mechagodzilla, 2002) is 60 m tall" },
  { img: "securiton.png", H: 2.2, x: 905, s: 0.75, why: "Fallout: New Vegas securitron, a screen on a wheel a head taller than a person" },
  { img: "asimo.png", H: 1.3, x: 860, s: 0.6, why: "Honda ASIMO (2011) is 1.30 m" },
  { img: "turret.png", H: 1.05, x: 405, s: 1.0, why: "Portal sentry turret, about hip height on its tripod" },
  { img: "bender.png", H: 1.8, x: 218, s: 0.85, why: "Futurama's Bender, about Fry's height" },
  { img: "dalek.png", H: 1.65, x: 80, s: 0.8, why: "Doctor Who Dalek props are about 1.6-1.7 m" },
  { img: "marsrover.png", H: 1.5, x: 990, s: 0.55, why: "NASA Spirit/Opportunity rover, 1.5 m to the top of its camera mast" },
  { img: "cylon.png", H: 2.1, x: 595, s: 0.7, why: "Battlestar Galactica (2004) Centurion, about 2.1 m" },
  { img: "r2d2.png", H: 1.09, x: 330, s: 0.9, why: "Star Wars R2-D2 is 1.09 m" },
  { img: "awesomo.png", H: 1.0, x: 975, s: 0.9, why: "South Park AWESOM-O: Cartman (a fourth grader) in a cardboard box" },
  { img: "tachikoma.png", H: 2.6, x: 148, s: 0.55, why: "Ghost in the Shell Tachikoma, a spider tank about 2.6 m tall" },
  { img: "pris.png", H: 1.75, x: 520, s: 0.9, why: "Blade Runner's Pris, a human-sized replicant (Daryl Hannah is 1.78 m)" },
  { img: "scv.png", H: 3.0, x: 330, s: 0.85, why: "StarCraft SCV, a worker in a mech suit about 3 m tall" },
  { img: "lostinspacerobot.png", H: 1.9, x: 310, s: 0.8, why: "Lost in Space B-9 robot, about 1.9 m" },
  { img: "claptrap.png", H: 1.2, x: 470, s: 0.75, why: "Borderlands Claptrap, about 1.2 m with its antenna" },
  { img: "wheatley.png", H: 0.45, x: 420, s: 0.55, why: "Portal 2 Wheatley, a personality core the size of a beach ball" },
  { img: "kitt.png", H: 1.45, x: 705, s: 1.25, why: "Knight Rider KITT, a 1982 Trans Am: roof 1.26 m; the 3/4 view adds bonnet and roof depth" },
  { img: "marvin.png", H: 1.35, x: 790, s: 0.85, why: "Hitchhiker's Guide (2005) Marvin, a small suit with a big head" },
  { img: "partyrock.png", H: 1.8, x: 545, s: 0.7, why: "the Party Rock Anthem shuffle robot, a dancer in a box head" },
  { img: "robotchicken.png", H: 0.45, x: 660, s: 0.5, why: "Robot Chicken's cyborg chicken, a chicken-sized bird" },
  { img: "sojourner.png", H: 0.55, x: 870, s: 0.45, why: "Mars Pathfinder Sojourner: a 30 cm body, the drawn whip antenna about as tall again" },
  { img: "roomba.png", H: 0.2, x: 330, s: 0.7, why: "Roomba, a 34 cm disc 9 cm high seen from above: 80 px wide = 0.34 m puts the 48 px drawing at 0.2 m" },
  { img: "wall-e.png", H: 0.6, x: 600, s: 0.6, why: "WALL-E is about knee-high to a person, half EVE's height" },
  { img: "Canti.png", H: 2.2, x: 382, s: 0.6, why: "FLCL Canti, a head taller than the adults around him" },
  { img: "jetsons.png", H: 1.4, x: 150, s: 1.0, why: "The Jetsons' Rosie, shorter than the adults she serves" },
  { img: "ed209.png", H: 2.1, x: 820, s: 0.7, why: "RoboCop ED-209; the full-size prop is about 2.1 m" },
  { img: "crowtrobot.png", H: 0.75, x: 80, s: 0.6, why: "MST3K Crow T. Robot, a 0.6 m puppet drawn on its stand" },
  { img: "geth.png", H: 2.0, x: 430, s: 0.75, why: "Mass Effect geth trooper, a little taller than a person" },
  { img: "optimusPrime.png", H: 9, x: 840, s: 1.25, why: "Transformers (2007) Optimus Prime is about 9 m" },
  { img: "eve.png", H: 1.2, x: 930, s: 0.9, why: "WALL-E's EVE, about 1.2 m" },
  { img: "darpadog.png", H: 1.0, x: 620, s: 0.7, why: "Boston Dynamics BigDog, about 1 m tall" },
];

const sprites = new Map();
const sprite = (name) => {
  if (!sprites.has(name)) {
    const img = decodePng(fs.readFileSync(path.join(root, "images/retro/robots", name)));
    let top = img.height, bottom = -1;
    for (let y = 0; y < img.height; y++)
      for (let x = 0; x < img.width; x++)
        if (img.data[(y * img.width + x) * 4 + 3] >= 128) { if (y < top) top = y; bottom = y; }
    sprites.set(name, { img, w: img.width, h: img.height, top, bottom: bottom + 1 });
  }
  return sprites.get(name);
};

// Box size from the scale; feet from the rule; box centre from the feet.
const rows = ROBOTS.map((r, i) => {
  const sp = sprite(r.img);
  const w = Math.round(sp.w * r.s), h = Math.round(sp.h * r.s);
  const sy = h / sp.h;
  const hOpaque = sy * (sp.bottom - sp.top);
  const feet = HORIZON + CAMERA_H * hOpaque / r.H;
  const y = Math.round(feet - sy * sp.bottom + h / 2);
  return { ...r, i, w, h, y };
});
const feetOf = (r) => { const sp = sprite(r.img); return r.y - r.h / 2 + (r.h / sp.h) * sp.bottom; };
const byFeet = [...rows].sort((a, b) => feetOf(a) - feetOf(b) || a.i - b.i);
byFeet.forEach((r, k) => { r.z = k + 1; });

const pad = (s, n) => s.padEnd(n);
const lines = rows.map((r) => `  [${pad(`"retro/robots/${r.img}",`, 39)}${String(r.x).padStart(4)}, ${String(r.y).padStart(3)}, ${String(r.z).padStart(2)}, ${String(r.w).padStart(3)}, ${String(r.h).padStart(3)}]${r.i === rows.length - 1 ? " " : ","} // ${r.i === 0 ? "main robot, always shown" : `freed at ${3 * r.i} points`}`);
const js = `// Retro skin end-level crowd (beads tg-wtv.3, tg-wtv.5): the user's
// hand-drawn 2012 robots on the phosphor-green night landscape. Read by
// js/scenes/end-level.js when t.Skin.id is "retro"; same unlock order and
// rules as EndLevelRobots.js (entry 0 always shown, entry i freed at 3*i
// points). Each entry is [image, x, y, z, w, h]: x/y the sprite centre in the
// 1024x768 landscape, z the draw order, w/h the drawn size (each robot is
// scaled so its height fits its feet in one camera's perspective; these
// images are not in the preloader, so the scene cannot ask Q.asset for size).
// Generated by node tools/art/retro-freed-layout.mjs (heights and reasons there).
t.EndLevelRobotsRetro = {
	background: "${BACKGROUND}",
	data: [ // image, x, y, z, w, h
${lines.join("\n")}
	]
};
`;

// Opaque mask of every robot at its drawn size, painted back to front; then
// the share of each robot's pixels nobody in front covers, on the full screen
// (portrait) and outside the result card (desktop).
function visibility(data) {
  const owner = new Int16Array(W * H_SCREEN).fill(-1);
  const total = new Array(data.length).fill(0);
  const order = data.map((d, i) => ({ d, i })).sort((a, b) => a.d[3] - b.d[3] || a.i - b.i);
  for (const { d, i } of order) {
    const sp = sprite(path.basename(d[0]));
    const [x, y, w, h] = [d[1], d[2], d[4], d[5]];
    const x0 = x - w / 2, y0 = y - h / 2;
    for (let Y = Math.max(0, Math.floor(y0)); Y < Math.min(H_SCREEN, Math.ceil(y0 + h)); Y++)
      for (let X = Math.max(0, Math.floor(x0)); X < Math.min(W, Math.ceil(x0 + w)); X++) {
        const sx = Math.floor((X + 0.5 - x0) * sp.w / w), syy = Math.floor((Y + 0.5 - y0) * sp.h / h);
        if (sx < 0 || syy < 0 || sx >= sp.w || syy >= sp.h || sp.img.data[(syy * sp.w + sx) * 4 + 3] < 128) continue;
        total[i]++;
        owner[Y * W + X] = i;
      }
  }
  const full = new Array(data.length).fill(0), desk = new Array(data.length).fill(0);
  for (let p = 0; p < owner.length; p++) {
    const i = owner[p];
    if (i < 0) continue;
    full[i]++;
    const X = p % W, Y = (p / W) | 0;
    if (!(X >= CARD.x0 && X < CARD.x1 && Y >= CARD.y0 && Y < CARD.y1)) desk[i]++;
  }
  return data.map((d, i) => ({ portrait: full[i] / total[i], desktop: desk[i] / total[i] }));
}

// Re-read a written data table and check every rule against it.
function verify(data) {
  const errors = [];
  if (data.length !== ROBOTS.length) errors.push(`expected ${ROBOTS.length} robots, found ${data.length}`);
  const vis = visibility(data);
  data.forEach((d, i) => {
    const r = ROBOTS[i], name = path.basename(d[0]);
    if (!r || r.img !== name) { errors.push(`entry ${i}: ${name} is not ${r?.img} (unlock order)`); return; }
    const sp = sprite(name);
    const [x, y, z, w, h] = d.slice(1);
    const sx = w / sp.w, sy = h / sp.h;
    if (Math.abs(sx - sy) > 0.02) errors.push(`${name}: aspect changed (${sx.toFixed(3)} x ${sy.toFixed(3)})`);
    if (sy > MAX_UPSCALE + 0.005) errors.push(`${name}: scaled x${sy.toFixed(2)} > ${MAX_UPSCALE}`);
    const feet = y - h / 2 + sy * sp.bottom;
    const hOpaque = sy * (sp.bottom - sp.top);
    const want = HORIZON + CAMERA_H * hOpaque / r.H;
    if (Math.abs(feet - want) > FEET_TOLERANCE)
      errors.push(`${name}: feet at y ${feet.toFixed(1)}, perspective puts them at ${want.toFixed(1)} (h ${hOpaque.toFixed(1)} px, H ${r.H} m)`);
    if (feet <= HORIZON || feet > H_SCREEN) errors.push(`${name}: feet at y ${feet.toFixed(1)} not on the visible ground (${HORIZON}-${H_SCREEN})`);
    if (vis[i].desktop < MIN_VISIBLE) errors.push(`${name}: only ${(100 * vis[i].desktop).toFixed(0)}% visible on desktop (card and robots in front)`);
    if (vis[i].portrait < MIN_VISIBLE) errors.push(`${name}: only ${(100 * vis[i].portrait).toFixed(0)}% visible on portrait`);
  });
  const zs = data.map((d) => d[3]);
  const feetOrder = data.map((d, i) => ({ i, f: d[2] - d[5] / 2 + (d[5] / sprite(path.basename(d[0])).h) * sprite(path.basename(d[0])).bottom }));
  for (const a of feetOrder) for (const b of feetOrder)
    if (a.f < b.f - 0.5 && zs[a.i] > zs[b.i]) errors.push(`${path.basename(data[a.i][0])} is drawn over ${path.basename(data[b.i][0])} but stands behind it`);
  return { errors, vis };
}

const readData = () => {
  const sandbox = { t: {} };
  new Function("t", fs.readFileSync(OUT, "utf8"))(sandbox.t);
  return sandbox.t.EndLevelRobotsRetro.data;
};

// Smooth (bilinear, premultiplied) scaling, as the browser draws these sprites.
function drawScaled(dst, src, x0, y0, w, h) {
  for (let Y = Math.max(0, Math.floor(y0)); Y < Math.min(dst.height, Math.ceil(y0 + h)); Y++)
    for (let X = Math.max(0, Math.floor(x0)); X < Math.min(dst.width, Math.ceil(x0 + w)); X++) {
      const u = (X + 0.5 - x0) * src.width / w - 0.5, v = (Y + 0.5 - y0) * src.height / h - 0.5;
      const ux = Math.floor(u), vy = Math.floor(v), fx = u - ux, fy = v - vy;
      const acc = [0, 0, 0, 0];
      for (const [dx, dy, wt] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]]) {
        const sx = Math.min(src.width - 1, Math.max(0, ux + dx)), sy = Math.min(src.height - 1, Math.max(0, vy + dy));
        const o = (sy * src.width + sx) * 4, a = src.data[o + 3] / 255;
        acc[0] += src.data[o] * a * wt; acc[1] += src.data[o + 1] * a * wt; acc[2] += src.data[o + 2] * a * wt; acc[3] += a * wt;
      }
      if (acc[3] <= 0) continue;
      const o = (Y * dst.width + X) * 4, a = acc[3];
      for (let c = 0; c < 3; c++) dst.data[o + c] = Math.round(acc[c] + dst.data[o + c] * (1 - a));
      dst.data[o + 3] = 255;
    }
}

const args = process.argv.slice(2);
if (args.includes("--check")) {
  const fails = [];
  if (!fs.existsSync(OUT)) fails.push("js/skins/retro-robots.js is missing: run node tools/art/retro-freed-layout.mjs");
  else {
    if (fs.readFileSync(OUT, "utf8") !== js) fails.push("js/skins/retro-robots.js is stale: run node tools/art/retro-freed-layout.mjs");
    fails.push(...verify(readData()).errors); // the rules, on what the game reads
  }
  if (fails.length) { for (const f of fails) console.log(`FAIL ${f}`); process.exit(1); }
  console.log(`ok: js/skins/retro-robots.js is current; ${rows.length} robots obey h/(y_feet-${HORIZON}) = H/${CAMERA_H} within ${FEET_TOLERANCE} px, scale <= ${MAX_UPSCALE}, each >= ${100 * MIN_VISIBLE}% visible on desktop and portrait`);
} else if (args.includes("--table")) {
  const data = rows.map((r) => [r.img, r.x, r.y, r.z, r.w, r.h]);
  const { vis } = verify(data);
  console.log("| # | robot | H (m) | scale | h (px) | feet y | d = feet - horizon | visible desktop / portrait | why H |");
  console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  rows.forEach((r, i) => {
    const sp = sprite(r.img), sy = r.h / sp.h, f = feetOf(r);
    console.log(`| ${i} | ${r.img.replace(".png", "")} | ${r.H} | ${sy.toFixed(2)} | ${(sy * (sp.bottom - sp.top)).toFixed(0)} | ${f.toFixed(0)} | ${(f - HORIZON).toFixed(0)} | ${(100 * vis[i].desktop).toFixed(0)}% / ${(100 * vis[i].portrait).toFixed(0)}% | ${r.why} |`);
  });
} else if (args.includes("--preview")) {
  const out = args[args.indexOf("--preview") + 1];
  const countAt = args.indexOf("--count");
  const count = countAt >= 0 ? Number(args[countAt + 1]) : rows.length;
  const bg = decodePng(fs.readFileSync(path.join(root, "images", BACKGROUND)));
  const items = rows.slice(0, count).sort((a, b) => a.z - b.z || a.i - b.i);
  for (const r of items) drawScaled(bg, sprite(r.img).img, r.x - r.w / 2, r.y - r.h / 2, r.w, r.h);
  if (args.includes("--card")) // the desktop card's outline, for composing
    for (let X = CARD.x0; X < CARD.x1; X++) for (let Y = CARD.y0; Y < CARD.y1; Y++)
      if (X < CARD.x0 + 2 || X >= CARD.x1 - 2 || Y < CARD.y0 + 2 || Y >= CARD.y1 - 2) bg.data.set([255, 255, 255, 255], (Y * W + X) * 4);
  fs.writeFileSync(out, encodePng(bg));
  console.log(`wrote ${out}: ${items.length} robot(s)`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, js);
  console.log(`wrote ${path.relative(root, OUT)}: ${rows.length} robots`);
}
