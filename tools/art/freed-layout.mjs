#!/usr/bin/env node
// Places the end-level crowd from art/sets/freed-v1/layout.json:
//   { "landscape": {take, crop}, "robots": [[ref, x, groundY, lift?], ...] }
// (index 0 = main robot, then unlock order; ref = a recipe id in freed-v1 or
// "<set>:<id>" for another set, e.g. "freed-v2:kaiju-a"; groundY = where the
// feet touch the meadow, lift = how far a hovering robot floats above it).
// Rewrites the outputs[] of every set it uses (each accepted master cropped to
// its alpha bounds and scaled x2; the landscape stays in freed-v1) and
// EndLevelRobots.js (sprite centre x/y, z from groundY). Then run
// `node tools/art/studio-art.mjs bake freed-v1` (and bake each other set) and
// tools/art/freed-preview.mjs.
//
//   node tools/art/freed-layout.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { alphaBounds, decodePng } from "./lib/png.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const layout = JSON.parse(fs.readFileSync(path.join(repo, "art/sets/freed-v1/layout.json"), "utf8"));
const HOME_SET = "freed-v1";
const recipesFile = (set) => path.join(repo, "art/sets", set, "recipes.json");
const S = 2;
const outputsBySet = { [HOME_SET]: [] };
const outputs = outputsBySet[HOME_SET];
const rows = [];
const ls = layout.landscape;
outputs.push({ path: "images/freed/landscape.png", from: `${ls.take}`, steps: [...(ls.crop ? [{ op: "crop", x: 0, y: 0, width: 512, height: 384 }] : []), { op: "scale", factor: 2 }], width: 1024, height: 768 });
layout.robots.forEach(([ref, x, ground, lift = 0], i) => {
  const [set, id] = ref.includes(":") ? ref.split(":") : [HOME_SET, ref];
  const master = path.join(repo, "art/masters", set, `${id}-0.png`);
  const b = alphaBounds(decodePng(fs.readFileSync(master)));
  const w = b.width * S, h = b.height * S;
  const name = `robot-${String(i).padStart(2, "0")}.png`;
  (outputsBySet[set] ??= []).push({ path: `images/freed/${name}`, from: `${id}#0`, steps: [{ op: "crop", x: b.x, y: b.y, width: b.width, height: b.height }, { op: "scale", factor: S }], width: w, height: h });
  const z = Math.max(1, Math.round((ground - 480) / 10));
  rows.push({ name, id, x, y: Math.round(ground - lift - h / 2), z, w, h });
});
for (const [set, list] of Object.entries(outputsBySet)) {
  const recipes = JSON.parse(fs.readFileSync(recipesFile(set), "utf8"));
  recipes.outputs = list;
  fs.writeFileSync(recipesFile(set), JSON.stringify(recipes, null, 2) + "\n");
}
const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
const lines = rows.map((r, i) => `  [${pad(`"freed/${r.name}",`, 24)}${String(r.x).padStart(4)}, ${String(r.y).padStart(3)}, ${r.z}], // ${i === 0 ? "main robot, always shown" : `freed at ${3 * i} points`}: ${r.id} (${r.w}x${r.h})`);
lines[lines.length - 1] = lines[lines.length - 1].replace("],", "] ");
const js = `// End-level screen: the robots freed so far stand beside the main robot on
// the landscape (js/scenes/end-level.js, t.EndLevel.freed). Entry 0 is the
// main robot (the player robot's design) and is always shown; one more robot
// per 3 points: entry i (i >= 1) is freed at 3*i points. Each entry is
// [image, x, y, z]: x/y are the sprite centre in the 1024x768 screen, z the
// draw order (farther back = higher on screen = lower z).
// Original Toybox robots from art/sets/freed-v2 (bead tg-vy4.21) and
// art/sets/freed-v1 (main robot, giant-c, helper-c; bead tg-vy4.17); placement
// preview: node tools/art/freed-layout.mjs (regenerates this file), then
// node tools/art/freed-preview.mjs <out.png> [--count N]
t.EndLevelRobots = {};
t.EndLevelRobots.background = "freed/landscape.png";
t.EndLevelRobots.data = [ // image, x, y, z-index
${lines.join("\n")}
];

t.EndLevelRobots.images = [t.EndLevelRobots.background];
for (var i in t.EndLevelRobots.data)
	t.EndLevelRobots.images.push(t.EndLevelRobots.data[i][0]);
`;
fs.writeFileSync(path.join(repo, "EndLevelRobots.js"), js);
console.log(rows.map((r) => `${r.name} ${r.id} ${r.w}x${r.h} x${r.x} y${r.y} z${r.z}`).join("\n"));
