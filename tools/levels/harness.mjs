// Headless harness that plays a level with the game's own logic files.
//
// It loads the real rules (Dequeue, Storage, TuringTable, RobotTable,
// Operators, selector, obstacles, controls, levels*.js) into a Node vm
// sandbox. Only the display layer (Quintus sprites, the HTML UI kit, sound)
// is stubbed. A run goes through the real Run button handler of controls.js
// (t.Controls.displayMe builds the deck; its "play" onClick runs the program
// virtually, exactly as in the browser), so the step count is the one the
// game passes to level.getResult(parts, tt.totalSteps).
//
// Programs are grids of tokens, one row per board row (top row first):
//   "."            empty
//   <op><dir>      an instruction; <op> is the game's own shortname
//                  (s step, C goto, cw turn right, cc turn left, d wall
//                  detector, dm colour detector, pRed / mRed plus / minus for
//                  a colour, ...) and <dir> the tile angle: > (0) ^ (1) < (2) v (3)
//                  or the digit 0-3.
// A plain tile sends the program towards its arrow. A branch tile (d, dm,
// m<Color>) with arrow > sends it up (left of the arrow) on "yes" (wall ahead /
// on a coloured tile / counter is 0) and down (right of the arrow) on "no"
// (the counter is then decremented).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// index.html order for the logic files we need.
const FILES = ['program.js', 'oaevil.js', 'Dequeue.js', 'Storage.js', 'config.js', 'TuringTable.js',
  'RobotTable.js', 'Operators.js', 'selector.js', 'obstacles.js', 'controls.js',
  'levels.js', 'levelsdata.js', 'levelsdata3.js', 'levelsdata2.js', 'levelsdata4.js'];
// Some sources are ISO-8859-1 (latin1 keeps every byte); strip a UTF-8 BOM.
const SOURCES = FILES.map((f) => [f, fs.readFileSync(path.join(root, f), 'latin1').replace(/^\xEF\xBB\xBF/, '')]);

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

export const DIRS = { '>': 0, '^': 1, '<': 2, v: 3, 0: 0, 1: 1, 2: 2, 3: 3 };
const ARROW = ['>', '^', '<', 'v'];

// A fresh copy of the game for one level (no state leaks between levels).
export function loadGame() {
  const store = new Map();
  const localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  const quiet = { log() {}, warn() {}, error() {}, info() {} };
  const ctx = vm.createContext({
    Q: stub(), $: jq, console: quiet, l: { log() {}, err() {} },
    window: { localStorage }, document: stub(), Math, JSON, Object, Array,
  });
  for (const [f, src] of SOURCES) vm.runInContext(src, ctx, { filename: f });
  const t = vm.runInContext('t', ctx);
  // Display layer stubs: the HTML UI kit and game screen used by controls.js.
  const buttons = {};
  t.UI = {
    card: () => ({ el: stub() }), place: (e) => e, el: () => stub(), px: () => stub(), emit() {},
    button: (opts) => { buttons[opts.title] = opts; return { disabled: false }; },
  };
  t.GameScreen = { layout: { deck: { w: 400, h: 200 }, mode: 'landscape' }, updateScore() {}, fillScore() {} };
  t.TileInput = { cancel() {} };
  t.HelpOverlay = { close() {} };
  t.CounterDials = function () { return stub(); };
  t.Sfx = { play() { return false; }, muted: true };
  return { t, ctx, buttons };
}

export function levelNames() {
  const { t } = loadGame();
  return Object.keys(t.Levels.levels);
}

export function parseGrid(t, rows) {
  const ops = t.Operators.nameToOp;
  return rows.map((row, y) => row.trim().split(/\s+/).map((tok, x) => {
    if (tok === '.') return null;
    const m = /^([A-Za-z]+)([><^v0-3])$/.exec(tok);
    if (!m || !ops[m[1]]) throw new Error(`bad token ${JSON.stringify(tok)} at row ${y} col ${x}`);
    return { what: ops[m[1]], angle: DIRS[m[2]] };
  }));
}

export function formatGrid(t) {
  const tt = t.TuringTable;
  const rows = [];
  for (let y = 0; y < tt.ymax; y++) {
    const r = [];
    for (let x = 0; x < tt.xmax; x++) {
      const c = tt.table[x][y];
      r.push(c.what === t.Operators.Empty ? '.' : c.what.shortname + ARROW[((c.angle % 4) + 4) % 4]);
    }
    rows.push(r.join(' '));
  }
  return rows;
}

// Open the level as the game screen does (t.Levels.setLevel -> level.set).
export function openLevel(game, name) {
  const { t } = game;
  const level = t.Levels.levels[name];
  if (!level) throw new Error(`no level ${JSON.stringify(name)}`);
  t.Levels.currentLevel = level;
  t.Levels.selected = level;
  t.Levels.setLevel(stub());
  t.TuringTable.callbacksUntilCallback = 0;
  return level;
}

// Place the program with the board's own setTile.
export function placeGrid(game, rows) {
  const { t } = game;
  const tt = t.TuringTable;
  const grid = parseGrid(t, rows);
  if (grid.length !== tt.ymax) throw new Error(`program has ${grid.length} rows, board has ${tt.ymax}`);
  for (let y = 0; y < tt.ymax; y++) {
    if (grid[y].length !== tt.xmax) throw new Error(`row ${y} has ${grid[y].length} cells, board has ${tt.xmax}`);
    for (let x = 0; x < tt.xmax; x++) {
      const c = grid[y][x];
      tt.setTile(x, y, c ? { what: c.what, angle: c.angle } : { what: t.Operators.Empty, angle: 0 });
    }
  }
}

// Press Run once (controls.js "play"); returns what the game would score.
export function pressRun(game) {
  const { t, buttons } = game;
  const tt = t.TuringTable;
  t.Controls.animationIsPlaying = false;
  t.Controls.toDoAfterAnimationStops = false;
  tt.steps.empty();
  tt.totalSteps = undefined;
  if (!buttons['Run the program']) t.Controls.displayMe(stub());
  buttons['Run the program'].onClick();
  const level = t.Levels.currentLevel;
  const end = tt.howItEnded;
  const won = end === 'victory';
  return { won, end, steps: won ? tt.totalSteps : null, score: won ? level.getResult(tt.totalParts, tt.totalSteps) : null };
}

// Play a program. For levels with start variants the game plays every
// variant and reports the steps of the one played last, which depends on
// level.current (left over from earlier runs); so run once from each possible
// starting `current` and report the maximum the game could show.
export function play(name, rows) {
  const game = loadGame();
  const level = openLevel(game, name);
  placeGrid(game, rows);
  const n = level.alternatives ? level.alternatives.length : 1;
  const runs = [];
  for (let k = 0; k < n; k++) {
    if (level.alternatives) level.current = k;
    const r = pressRun(game);
    r.current = k;
    runs.push(r);
  }
  const won = runs.every((r) => r.won);
  const steps = won ? Math.max(...runs.map((r) => r.steps)) : null;
  return {
    won, steps, variants: n, runs,
    score: won ? level.getResult(0, steps) : null,
    ends: [...new Set(runs.map((r) => r.end))],
  };
}

// ASCII picture of the robot cell for a level (variant `current`).
export function describeLevel(name, current = 0) {
  const game = loadGame();
  const { t } = game;
  const level = t.Levels.levels[name];
  if (level.alternatives) level.current = current;
  openLevel(game, name);
  if (level.alternatives) level.setRobotTable(t.Levels);
  const rt = t.RobotTable, tt = t.TuringTable, O = t.Obstacles;
  const sym = new Map([[O.Empty, '.'], [O.Obstacle, '#'], [O.End, 'E'], [O.TrappedChest, 'T'], [O.Lava, '~'],
    [O.Ice, 'i'], [O.CrackedIce, 'k'], [O.Water, 'w'], [O.Dif, '*'], [O.Wall, 'W'], [O.Tunnel, 'U'],
    [O.Corner, 'L'], [O.DeadEnd, 'D']]);
  const lines = [];
  const rows = rt.n, cols = rt.m;
  for (let y = 0; y < rows; y++) {
    let s = '';
    for (let x = 0; x < cols; x++) {
      const c = rt.table[x] && rt.table[x][y];
      if (!c) { s += ' ?? '; continue; }
      let ch = sym.get(c.what) || '?';
      if (rt.position[0] === x && rt.position[1] === y) ch = 'R' + 'v>^<'[((rt.roboangle % 4) + 4) % 4];
      else ch = ch + (['W', 'U', 'L', 'D'].includes(ch) ? (c.angle % 4 + 4) % 4 : (c.dot ? 'o' : ' '));
      s += ch + ' ';
    }
    lines.push(s);
  }
  const ops = t.Selector.operatorList().map((o) => o.shortname);
  return {
    board: `${tt.xmax}x${tt.ymax} (start row ${(tt.ymax - tt.ymax % 2) / 2})`, cell: `${cols}x${rows}`,
    ops, dots: rt.dotsRemaining, counters: rt.counters, alternatives: level.alternatives, lines,
  };
}
