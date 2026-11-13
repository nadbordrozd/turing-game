#!/usr/bin/env node
// Focused unit check for the counter dial "matched" state (tg-9jf).
//
// Levels whose goal is a counter value open the escape hatch from
// onCounterUpdated (TrappedChest <-> End). For the dial display they also
// declare counterTarget() -> {color, value} for the current variant. This
// check proves the two agree, for every such level and every variant, with a
// stubbed t.RobotTable (no play-through):
//   - every level with onCounterUpdated declares counterTarget, and the
//     target colour is one of the level's counters;
//   - stepping onto the target (+1 from below, -1 from above) swaps in End;
//   - stepping off it (+1 or -1) swaps TrappedChest back;
//   - any other +1/-1 move away from the target leaves the board alone.
// Usage: node tools/levels/counter-targets.mjs
import { loadGame, openLevel } from './harness.mjs';

const game = loadGame();
const { t } = game;
const O = t.Obstacles;
let failures = 0, checks = 0;
const fail = (msg) => { failures++; console.error('FAIL ' + msg); };

// Stub board: only what onCounterUpdated touches.
const realRT = t.RobotTable;
const rt = {
  counters: {},
  table: null,
  swaps: [],
  swapTile(x, y, oldContent, newContent) { this.table[x][y] = newContent; this.swaps.push(newContent.what); },
};
t.RobotTable = rt;

// Run onCounterUpdated for a counter move from `before` to `before + diff`;
// returns the swapped-in obstacle or null.
function move(level, color, before, diff) {
  rt.counters = { Red: 0, Blue: 0, Yellow: 0, Pink: 0 };
  rt.counters[color] = before + diff;
  rt.table = [[{}, {}], [{}, { what: O.Empty }]];
  rt.swaps = [];
  const step = {};
  level.onCounterUpdated(color, diff, step);
  checks++;
  if (rt.swaps.length > 1) fail(`${level.name}: ${rt.swaps.length} swaps in one update`);
  if (rt.swaps.length && !step.swapTile) fail(`${level.name}: swapped without recording step.swapTile`);
  return rt.swaps.length ? rt.swaps[0] : null;
}
const nameOf = (what) => (what === O.End ? 'End' : what === O.TrappedChest ? 'TrappedChest' : what ? 'other' : 'nothing');

const levels = Object.values(t.Levels.levels);
const inScope = levels.filter((l) => l.onCounterUpdated || l.counterTarget);
for (const level of inScope) {
  if (!level.onCounterUpdated || !level.counterTarget) {
    fail(`${level.name}: has ${level.onCounterUpdated ? 'onCounterUpdated' : 'counterTarget'} without the other`);
    continue;
  }
  // which counters the level shows: run set() against the real table
  t.RobotTable = realRT;
  openLevel(game, level.name);
  const shown = Object.keys(realRT.counters);
  t.RobotTable = rt;

  const n = level.alternatives ? level.alternatives.length : 1;
  const saved = level.current;
  const summary = [];
  for (let k = 0; k < n; k++) {
    if (level.alternatives) level.current = k;
    const target = level.counterTarget();
    const tag = `${level.name} variant ${k}`;
    if (!target || typeof target.color !== 'string' || !Number.isInteger(target.value) || target.value < 0) {
      fail(`${tag}: bad counterTarget ${JSON.stringify(target)}`);
      continue;
    }
    if (!shown.includes(target.color)) fail(`${tag}: target colour ${target.color} is not a counter of the level (${shown})`);
    const { color, value } = target;
    summary.push(`${color}=${value}`);
    const expect = (got, want, what) => { if (got !== want) fail(`${tag}: ${what} swapped ${nameOf(got)}, expected ${nameOf(want)}`); };
    // onto the target
    expect(move(level, color, value - 1, +1), O.End, `${value - 1} -> ${value}`);
    expect(move(level, color, value + 1, -1), O.End, `${value + 1} -> ${value}`);
    // off the target
    expect(move(level, color, value, +1), O.TrappedChest, `${value} -> ${value + 1}`);
    if (value > 0) expect(move(level, color, value, -1), O.TrappedChest, `${value} -> ${value - 1}`);
    // elsewhere: no swap
    for (const v of [value + 2, value + 5, value - 2, value - 5]) {
      if (v < 0) continue;
      expect(move(level, color, v, +1), null, `${v} -> ${v + 1}`);
      if (v > 0) expect(move(level, color, v, -1), null, `${v} -> ${v - 1}`);
    }
    // other counters never open the hatch, even when they show the target value
    for (const other of shown.filter((c) => c !== color)) {
      rt.counters = { Red: 0, Blue: 0, Yellow: 0, Pink: 0 };
      rt.counters[color] = value + 3;
      rt.counters[other] = value;
      rt.table = [[{}, {}], [{}, { what: O.Empty }]];
      rt.swaps = [];
      level.onCounterUpdated(other, +1, {});
      checks++;
      if (rt.swaps.length) fail(`${tag}: ${other} reaching ${value} swapped ${nameOf(rt.swaps[0])}`);
    }
  }
  level.current = saved;
  console.log(`ok ${level.name.padEnd(10)} ${n} variant(s): ${summary.join(', ')}`);
}
t.RobotTable = realRT;

if (!inScope.length) fail('no counter-target levels found');
console.log(`${inScope.length} levels, ${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
