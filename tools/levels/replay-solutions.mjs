#!/usr/bin/env node
// Replays every stored level solution with the game's own logic (see
// harness.mjs) and checks that it still finishes and scores 3 parts.
//
// Solutions live in tools/levels/solutions/solutions.json:
//   { "<level name>": { "steps": B, "variants": n, "solution": "...", "grid": ["s> . .", ...] } }
// For levels with several start variants the game reports the steps of the
// variant it plays last, which depends on earlier runs; the replay plays the
// program from every possible starting variant and uses the worst (maximum).
//
// Fails when a solution no longer wins, scores below 3, or its step count
// differs from the recorded "steps" (the calibration in docs/levels/CALIBRATION.md
// would then be stale). Levels without a stored solution are listed.
// Usage: node tools/levels/replay-solutions.mjs [level name ...]
import fs from 'node:fs';
import path from 'node:path';
import { root, play, levelNames } from './harness.mjs';

const file = path.join(root, 'tools/levels/solutions/solutions.json');
const solutions = JSON.parse(fs.readFileSync(file, 'utf8'));
const only = process.argv.slice(2);
const names = only.length ? only : levelNames();
let failures = 0;
const missing = [];
for (const name of names) {
  const sol = solutions[name];
  if (!sol) { missing.push(name); continue; }
  let r;
  try { r = play(name, sol.grid); } catch (e) { console.log(`FAIL ${name}: ${e.message}`); failures++; continue; }
  const problems = [];
  if (!r.won) problems.push(`did not finish (${r.ends.join(', ')})`);
  else {
    if (r.score !== 3) problems.push(`scores ${r.score}, expected 3 (steps ${r.steps})`);
    if (r.steps !== sol.steps) problems.push(`steps ${r.steps}, recorded ${sol.steps}`);
  }
  if (problems.length) { failures++; console.log(`FAIL ${name}: ${problems.join('; ')}`); }
  else console.log(`ok   ${name}: ${r.steps} steps, 3 parts${r.variants > 1 ? ` (worst of ${r.variants} variants)` : ''}`);
}
for (const name of Object.keys(solutions)) if (!names.includes(name) && !only.length) { console.log(`FAIL ${name}: no such level`); failures++; }
if (missing.length) console.log(`no stored solution: ${missing.map((n) => JSON.stringify(n)).join(', ')}`);
console.log(failures ? `replay-solutions: ${failures} failure(s)` : `replay-solutions: OK (${names.length - missing.length} solutions)`);
process.exit(failures ? 1 : 0);
