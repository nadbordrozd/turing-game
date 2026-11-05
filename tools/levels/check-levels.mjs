#!/usr/bin/env node
// Zero-dependency check of the level definitions.
// Loads levels.js and levelsdata*.js (in index.html order) into a sandbox with
// stub `t`, `Q` and `$`, then asserts the scoring and text rules:
//   - every level has times = [t3, t2, t1] with t3 <= t2 <= t1
//   - getResult(parts, moves) is monotone (non-increasing) in moves and
//     ignores parts
//   - "just give up" returns 3 for any number of moves
//   - every level has non-empty text
// Usage: node tools/levels/check-levels.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const files = ['levels.js', 'levelsdata.js', 'levelsdata3.js', 'levelsdata2.js', 'levelsdata4.js'];

// A permissive stub: any property is another stub, calling it returns a stub.
const stub = () => new Proxy(function () {}, {
  get: (o, k) => (k === Symbol.toPrimitive ? () => 0 : k in o ? o[k] : stub()),
  apply: () => stub(),
  construct: () => stub(),
});
const jq = () => {
  const o = {};
  for (const m of ['addClass', 'append', 'mousedown', 'hide', 'show', 'css']) o[m] = () => o;
  return o;
};
const t = { Obstacles: stub(), RobotTable: stub(), Selector: stub(), TuringTable: stub(), OperatorUtils: { colors: {} } };
const ctx = vm.createContext({ t, Q: stub(), $: jq, console, l: { log() {}, err() {} } });
for (const f of files) {
  // Some sources are ISO-8859-1; latin1 decoding keeps every byte.
  vm.runInContext(fs.readFileSync(path.join(root, f), 'latin1'), ctx, { filename: f });
}

const levels = t.Levels.levels;
const names = Object.keys(levels);
const failures = [];
const fail = (name, msg) => failures.push(`${JSON.stringify(name)}: ${msg}`);
const MOVES = [0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
const PARTS = [0, 1, 5, 20, 64];

if (names.length === 0) failures.push('no levels loaded');
for (const name of names) {
  const lv = levels[name];
  const tm = lv.times;
  if (!Array.isArray(tm) || tm.length !== 3 || !tm.every(Number.isFinite)) {
    fail(name, `times must be [t3, t2, t1] numbers, got ${JSON.stringify(tm)}`);
  } else if (!(tm[0] <= tm[1] && tm[1] <= tm[2])) {
    fail(name, `times not ordered t3<=t2<=t1: ${JSON.stringify(tm)}`);
  }
  if (typeof lv.getResult !== 'function') {
    fail(name, 'no getResult');
  } else {
    const probe = [...MOVES, ...(Array.isArray(tm) ? tm.flatMap((x) => [x - 1, x, x + 1]) : [])]
      .filter((m) => m >= 0)
      .sort((a, b) => a - b);
    let prev = Infinity;
    for (const m of probe) {
      const r = lv.getResult(PARTS[0], m);
      if (![0, 1, 2, 3].includes(r)) fail(name, `getResult(_, ${m}) = ${r}, expected 0-3`);
      if (r > prev) fail(name, `getResult not monotone: moves ${m} gives ${r} > ${prev}`);
      prev = r;
      for (const p of PARTS) {
        const rp = lv.getResult(p, m);
        if (rp !== r) fail(name, `getResult depends on parts: (${p}, ${m}) = ${rp} vs ${r}`);
      }
    }
    if (Array.isArray(tm) && !lv.alwaysFull) {
      if (lv.getResult(0, tm[0]) !== 3) fail(name, 'moves == t3 should score 3');
      if (lv.getResult(0, tm[2] + 1) !== 0) fail(name, 'moves > t1 should score 0');
    }
  }
  if (typeof lv.text !== 'string' || lv.text.trim() === '') fail(name, 'empty text');
}

const giveUp = levels['just give up'];
if (!giveUp) failures.push('"just give up" level missing');
else {
  if (giveUp.alwaysFull !== true) failures.push('"just give up" must have alwaysFull: true');
  for (const m of [...MOVES, 4999, 5001, 1e6]) {
    if (giveUp.getResult(0, m) !== 3) failures.push(`"just give up" getResult(_, ${m}) != 3`);
  }
}

if (failures.length) {
  console.error(`check-levels: ${failures.length} failure(s)`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log(`check-levels: OK (${names.length} levels)`);
