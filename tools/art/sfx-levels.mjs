#!/usr/bin/env node
// Loudness and trim table for the accepted sound effects.
//
// The accepted takes stay byte-identical to their recorded ElevenLabs output
// (sfx.mjs validate checks that), so trimming and loudness matching happen at
// playback time: js/audio.js plays each file from `start` to `end` with a
// per-sound gain. This tool measures the shipped files with ffmpeg and writes
// that table into js/audio.js between the "generated mix" markers.
//
//   node tools/art/sfx-levels.mjs              # print the table
//   node tools/art/sfx-levels.mjs --write      # rewrite the block in js/audio.js
//   node tools/art/sfx-levels.mjs --check      # exit 1 if js/audio.js is stale
//   node tools/art/sfx-levels.mjs --envelope <id>  # 10 ms peak envelope, to pick trims
//
// audio/sfx/mix.json: { "target": -16, "ceiling": -1,
//   "sounds": { "<id>": { "start": 0, "end": 0.3, "offsetDb": -6 } } }
// start/end are seconds in the file (omitted: detected from the envelope).
// Loudness is the loudest 100 ms window of the K-weighted signal (BS.1770
// filters, ungated), which tracks how loud a short effect feels better than
// integrated LUFS does. gain = target + offsetDb - loudness, capped so the
// sample peak stays under `ceiling` dBFS. Needs ffmpeg on PATH; nothing plays.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fail, loadConfig, parseArgs, readJson } from "./lib/common.mjs";

const RATE = 48000;
const cfg = loadConfig();
const mixFile = path.join(cfg.sfxDir, "mix.json");
const audioJs = path.join(cfg.root, "js", "audio.js");
const BEGIN = "// BEGIN generated mix (node tools/art/sfx-levels.mjs --write)";
const END = "// END generated mix";

const db = (x) => (x > 0 ? 20 * Math.log10(x) : -120);
const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;

function decode(file) {
  const out = execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-i", file, "-af", "pan=mono|c0=0.5*c0+0.5*c1", "-ar", String(RATE), "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
  return new Float32Array(out.buffer, out.byteOffset, out.byteLength / 4);
}

function biquad(x, b, a) {
  const y = new Float64Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i += 1) {
    const v = b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}

// BS.1770 K-weighting at 48 kHz: high shelf, then high pass.
const kWeight = (x) => biquad(biquad(x, [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]), [1, -2, 1], [1, -1.99004745483398, 0.99007225036621]);

function envelope(x, frame = RATE / 100) {
  const env = [];
  for (let i = 0; i < x.length; i += frame) {
    let p = 0;
    for (let j = i; j < Math.min(i + frame, x.length); j += 1) p = Math.max(p, Math.abs(x[j]));
    env.push(db(p));
  }
  return env;
}

function measure(id, spec, file) {
  const x = decode(file);
  const full = x.length / RATE;
  let peak = 0;
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  const env = envelope(x);
  const top = db(peak);
  const onset = env.findIndex((e) => e > top - 40);
  let last = env.length - 1;
  while (last > 0 && env[last] < top - 50) last -= 1;
  const start = spec.start ?? Math.max(0, onset / 100 - 0.002);
  const end = Math.min(full, spec.end ?? (last + 1) / 100 + 0.02);
  const seg = x.subarray(Math.floor(start * RATE), Math.ceil(end * RATE));
  let segPeak = 0;
  for (const v of seg) segPeak = Math.max(segPeak, Math.abs(v));
  const k = kWeight(seg);
  const win = RATE / 10;
  let sum = 0, best = 0, total = 0;
  for (let i = 0; i < k.length; i += 1) {
    sum += k[i] * k[i];
    total += k[i] * k[i];
    if (i >= win) sum -= k[i - win] * k[i - win];
    best = Math.max(best, sum / Math.min(i + 1, win));
  }
  const loud = -0.691 + 10 * Math.log10(best || 1e-12);
  const lufsSeg = -0.691 + 10 * Math.log10(total / Math.max(1, k.length) || 1e-12);
  const want = mix.target + (spec.offsetDb ?? 0) - loud;
  const gainDb = Math.min(want, mix.ceiling - db(segPeak));
  return { id, file: rel(file), full, start, end, peakDb: db(segPeak), loud, lufsSeg, gainDb, capped: gainDb < want };
}

const rel = (f) => path.relative(cfg.root, f).split(path.sep).join("/");

const args = parseArgs(process.argv.slice(2), ["write", "check"]);
const mix = readJson(mixFile);
mix.target ??= -16;
mix.ceiling ??= -1;
const sounds = readJson(path.join(cfg.sfxDir, "prompts.json")).sounds.filter((s) => s.output);

if (args.envelope) {
  const s = sounds.find((x) => x.id === args.envelope) ?? fail(`no sound ${args.envelope}`);
  const env = envelope(decode(path.join(cfg.root, s.output)));
  env.forEach((e, i) => console.log(`${(i / 100).toFixed(2)}s ${e.toFixed(1).padStart(6)} dB ${"#".repeat(Math.max(0, Math.round((e + 60) / 2)))}`));
  process.exit(0);
}

const rows = sounds.map((s) => measure(s.id, mix.sounds?.[s.id] ?? {}, path.join(cfg.root, s.output)));
console.log("id            file length  play window     peak(seg)  loud100ms  LUFS(seg)  gain    peak after");
for (const r of rows) {
  console.log(`${r.id.padEnd(13)} ${r.full.toFixed(2)}s  ${r.start.toFixed(3)}-${r.end.toFixed(3)}s  ${r.peakDb.toFixed(1).padStart(6)} dB  ${r.loud.toFixed(1).padStart(6)}     ${r.lufsSeg.toFixed(1).padStart(6)}    ${(r.gainDb >= 0 ? "+" : "") + r.gainDb.toFixed(1)} dB  ${(r.peakDb + r.gainDb).toFixed(1)} dB${r.capped ? " (peak-capped)" : ""}`);
}

const block = [
  BEGIN,
  "  // name: [file, start s, end s, gain dB]; measured from the shipped files.",
  "  var MIX = {",
  ...rows.map((r, i) => `    ${JSON.stringify(r.id)}: [${JSON.stringify(r.file)}, ${round(r.start, 3)}, ${round(r.end, 3)}, ${round(r.gainDb, 1)}]${i < rows.length - 1 ? "," : ""}`),
  "  };",
  `  ${END}`,
].join("\n");

if (args.write || args.check) {
  const src = fs.readFileSync(audioJs, "utf8");
  const a = src.indexOf(BEGIN);
  const b = src.indexOf(END);
  if (a < 0 || b < 0) fail(`${rel(audioJs)} has no generated mix markers`);
  const lineStart = src.lastIndexOf("\n", a) + 1;
  const next = src.slice(0, lineStart) + "  " + block + src.slice(b + END.length);
  if (args.check) {
    if (next !== src) fail(`${rel(audioJs)} mix table is stale: run node tools/art/sfx-levels.mjs --write`);
    console.log(`ok: ${rel(audioJs)} mix table matches ${rows.length} sound(s)`);
  } else {
    fs.writeFileSync(audioJs, next);
    console.log(`wrote ${rows.length} sound(s) into ${rel(audioJs)}`);
  }
}
