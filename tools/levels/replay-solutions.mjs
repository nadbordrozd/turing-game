#!/usr/bin/env node
// Replays every stored level solution with the game's own logic (see
// harness.mjs) and checks that it still finishes and scores 3 parts.
//
// Solutions live in tools/levels/solutions/solutions.json:
//   { "<level name>": { "steps": B, "variants": n, "perVariant": [...], "solution": "...", "grid": ["s> . .", ...],
//                       "alt": [{ "steps": n, "parts": p, "solution": "...", "grid": [...] }] } }
// "alt" (optional) holds extra evidence programs, e.g. a slower but natural
// solution that must still earn "parts" parts.
// For levels with several start variants the game scores the worst variant
// (most steps); the replay plays the program from every possible starting
// variant and checks that each run reports that same number.
//
// Fails when a solution no longer wins, scores below 3 (an alt: below its
// "parts"), or its step count
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
    if (!r.deterministic) problems.push(`score depends on history: ${r.runs.map((x) => x.steps).join(',')}`);
  }
  if (problems.length) { failures++; console.log(`FAIL ${name}: ${problems.join('; ')}`); }
  else console.log(`ok   ${name}: ${r.steps} steps, 3 parts${r.variants > 1 ? ` (worst of ${r.variants} variants ${JSON.stringify(r.perVariant)})` : ''}`);
  for (const [i, alt] of (sol.alt || []).entries()) {
    const a = play(name, alt.grid);
    const bad = !a.won ? `did not finish (${a.ends.join(', ')})` : a.steps !== alt.steps ? `steps ${a.steps}, recorded ${alt.steps}`
      : a.score !== alt.parts ? `scores ${a.score}, expected ${alt.parts}` : '';
    if (bad) { failures++; console.log(`FAIL ${name} alt ${i}: ${bad}`); }
    else console.log(`ok   ${name} alt ${i}: ${a.steps} steps, ${a.score} part${a.score === 1 ? '' : 's'}`);
  }
}
for (const name of Object.keys(solutions)) if (!names.includes(name) && !only.length) { console.log(`FAIL ${name}: no such level`); failures++; }
if (missing.length) console.log(`no stored solution: ${missing.map((n) => JSON.stringify(n)).join(', ')}`);
console.log(failures ? `replay-solutions: ${failures} failure(s)` : `replay-solutions: OK (${names.length - missing.length} solutions)`);
process.exit(failures ? 1 : 0);
