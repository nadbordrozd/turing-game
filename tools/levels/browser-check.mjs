#!/usr/bin/env node
// Cross-checks stored solutions in the real game: headless Chrome (muted),
// the game's own page, LevelSelector.play, TuringTable.setTile for every
// cell, then a click on the Run button; reads the totalSteps the game passes
// to getResult. Compares with the harness numbers in solutions.json.
// Needs Google Chrome and a static server for the repo, e.g.
//   python3 -m http.server 8000 --bind 127.0.0.1
// Usage: node tools/levels/browser-check.mjs [--url http://127.0.0.1:8000/] [level ...]
// Zero dependencies (Chrome DevTools Protocol over Node's built-in WebSocket).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { root } from './harness.mjs';

const args = process.argv.slice(2);
let url = 'http://127.0.0.1:8000/';
const ui = args.indexOf('--url');
if (ui >= 0) { url = args[ui + 1]; args.splice(ui, 2); }
const sols = JSON.parse(fs.readFileSync(path.join(root, 'tools/levels/solutions/solutions.json'), 'utf8'));
const names = args.length ? args : Object.keys(sols);
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tg-check-'));
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, ['--headless=new', '--mute-audio', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400));
  return r.result.value;
};
let code = 0;
try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {}
  }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } });
  await send('Runtime.enable');
  await send('Page.navigate', { url });
  for (let i = 0; i < 100; i++) { await sleep(200); if (await evaluate('!!(window.t && t.LevelSelector && t.Levels && window.Q && Q.stageScene)')) break; }
  await sleep(1000);
  await evaluate('t.Sfx && t.Sfx.setMuted && t.Sfx.setMuted(true), true');
  for (const name of names) {
    const sol = sols[name]; if (!sol) continue;
    const res = await evaluate(`(function(){
      var name = ${JSON.stringify(name)}, grid = ${JSON.stringify(sol.grid)};
      var lev = t.Levels.levels[name], n = lev.alternatives ? lev.alternatives.length : 1, out = [];
      var DIR = {'>':0,'^':1,'<':2,'v':3};
      for (var k = 0; k < n; k++) {
        if (lev.alternatives) lev.current = k;
        // as the level scene's restage does: drop the previous run's animation
        t.Controls.toDoAfterAnimationStops = false;
        t.Controls.animationIsPlaying = false;
        t.TuringTable.steps.empty();
        t.LevelSelector.play(name);
        var tt = t.TuringTable;
        for (var y = 0; y < grid.length; y++) { var row = grid[y].trim().split(/\\s+/);
          for (var x = 0; x < row.length; x++) { var c = row[x];
            var op = c === '.' ? t.Operators.Empty : t.Operators.nameToOp[c.slice(0, -1)];
            tt.setTile(x, y, {what: op, angle: c === '.' ? 0 : DIR[c.slice(-1)]}); } }
        tt.totalSteps = undefined;
        t.Controls.buttons.play.click();
        out.push({end: tt.howItEnded, steps: tt.totalSteps, score: tt.howItEnded === 'victory' ? lev.getResult(tt.totalParts, tt.totalSteps) : null});
        t.Controls.toDoAfterAnimationStops = false;
      }
      return out;
    })()`);
    const won = res.every((r) => r.end === 'victory');
    // the game scores the worst variant whatever variant ran before, so every
    // run (one per starting variant) must report the same steps
    const worst = won ? Math.max(...res.map((r) => r.steps)) : null;
    const same = won && res.every((r) => r.steps === worst);
    const ok = won && same && worst === sol.steps;
    if (!ok) code = 1;
    console.log(`${ok ? 'ok  ' : 'DIFF'} ${name}: browser ${won ? worst : res.map((r) => r.end).join(',')} steps, harness ${sol.steps}${res.length > 1 ? ' runs from each starting variant ' + JSON.stringify(res.map((r) => r.steps)) : ''}`);
  }
} catch (e) { console.error(e); code = 1; }
finally { try { ws && ws.close(); } catch {} proc.kill(); }
process.exit(code);
