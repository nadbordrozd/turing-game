#!/usr/bin/env node
// Renders the end-level crowd as the game places it: every entry of
// t.EndLevelRobots.data ([image, x, y, z]; x/y are the sprite centre, as a
// Quintus Sprite draws it) on the landscape, sorted by z then list order.
// Zero dependencies; used to review placement without running the game.
//
//   node tools/art/freed-preview.mjs <out.png> [--count N] [--scale S] [--bg images/freed/landscape.png]
//
// --count N draws only the first N robots (what a player with 3(N-1) points sees).
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { composite, decodePng, encodePng, scaleNearest } from "./lib/png.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const out = args.find((a) => a.endsWith(".png") && !a.startsWith("--"));
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
if (!out) {
  console.error("usage: freed-preview.mjs <out.png> [--count N] [--scale S] [--bg <png>]");
  process.exit(2);
}

const sandbox = { t: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "EndLevelRobots.js"), "utf8"), sandbox);
const data = sandbox.t.EndLevelRobots.data;
const count = Math.min(data.length, Number(opt("count", data.length)));
const scale = Number(opt("scale", 1));
const bg = decodePng(fs.readFileSync(path.join(root, opt("bg", "images/freed/landscape.png"))));

const items = data.slice(0, count).map(([asset, x, y, z], order) => ({ asset, x, y, z, order }));
items.sort((a, b) => a.z - b.z || a.order - b.order);
for (const item of items) {
  const sprite = decodePng(fs.readFileSync(path.join(root, "images", item.asset)));
  composite(bg, sprite, Math.round(item.x - sprite.width / 2), Math.round(item.y - sprite.height / 2));
}
fs.writeFileSync(out, encodePng(scale > 1 ? scaleNearest(bg, scale) : bg));
console.log(`wrote ${out}: ${items.length} of ${data.length} robot(s) on ${bg.width}x${bg.height}${scale > 1 ? ` x${scale}` : ""}`);
