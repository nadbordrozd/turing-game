#!/usr/bin/env node
// Screenshots of every screen in one skin, a pixel diff of two shot folders,
// and a contact sheet (tg-wtv.1). Headless Chrome, always muted
// (--mute-audio, and sound and music muted in localStorage); nothing is
// played through: each screen is a hand-built state (staged scene, stored
// solution placed tile by tile, a few single steps).
//
// Needs Google Chrome and a static server for the repo, e.g.
//   python3 -m http.server 8000 --bind 127.0.0.1
//
//   node tools/ui/skin-shots.mjs shots --url http://127.0.0.1:8000/ --skin retro --out DIR
//        [--only chooser,level] [--sizes desktop,mobile] [--hide CSS-selector]
//   node tools/ui/skin-shots.mjs diff BEFORE_DIR AFTER_DIR --out DIR
//   node tools/ui/skin-shots.mjs sheet DIR --out FILE.png [--cols 4] [--scale 0.4]
//
// Shots run with prefers-reduced-motion and a frozen clock (Date and
// performance.now pinned just before the capture), so two runs of the same
// build give identical pixels. Zero dependencies (CDP over Node's WebSocket).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { decodePng, encodePng, blank, composite, fillRect } from '../art/lib/png.mjs';
import { drawText } from '../art/lib/font.mjs';

const SIZES = { desktop: { width: 1440, height: 900, mobile: false }, mobile: { width: 390, height: 844, mobile: true } };
const LEVEL = '*2'; // two counters (Red, Blue), Blue has a target
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function args(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    else o._.push(argv[i]);
  }
  return o;
}

// ---------- screens: [name, needs a chosen skin?, steps run in the page] ----------
const freezeJs = `(function(){
  var RD = Date, T = 1767225600000;
  function FD(){ if(arguments.length){ var a=[null].concat([].slice.call(arguments)); return new (Function.prototype.bind.apply(RD, a))(); } return new RD(T); }
  FD.now = function(){ return T; }; FD.UTC = RD.UTC; FD.parse = RD.parse; FD.prototype = RD.prototype;
  window.Date = FD;
  performance.now = function(){ return 100000; };
  if (window.spa && spa.p) spa.p.angle = 0; // the program marker spins with accumulated dt
  // looping sprite animations also run on accumulated dt: show their first frame
  (window.Q && Q.stages || []).forEach(function(st){ if (st && st.items) st.items.forEach(function(it){
    var p = it.p, a = p && p.animation && p.sprite && Q.animation(p.sprite, p.animation);
    if (a && a.loop !== false && !a.next) { p.animationFrame = 0; p.animationTime = 0; p.frame = a.frames[0]; }
  }); });
  return true;
})()`;
const playLevel = `(function(){
  var name = ${JSON.stringify(LEVEL)};
  t.LevelSelector.play(name);
  return true;
})()`;
const placeSolution = (grid) => `(function(){
  var grid = ${JSON.stringify(grid)}, tt = t.TuringTable, DIR = {'>':0,'^':1,'<':2,'v':3};
  for (var y = 0; y < grid.length; y++) { var row = grid[y].trim().split(/\\s+/);
    for (var x = 0; x < row.length; x++) { var c = row[x];
      var op = c === '.' ? t.Operators.Empty : t.Operators.nameToOp[c.slice(0, -1)];
      tt.setTile(x, y, {what: op, angle: c === '.' ? 0 : DIR[c.slice(-1)]}); } }
  return true;
})()`;
const progress = `(function(){
  var n = 0; for (var k in t.Levels.levels) { if (n < 9) t.GameSaver.saveLevelStatus(k, (n % 4) + 1); n++; }
  return true;
})()`;

function screens(sol) {
  const step = { eval: 't.Controls.buttons.step.click(), true', wait: 1600 };
  return [
    ['chooser', { chosen: false, steps: [] }],
    ['intro', { steps: [{ wait: 600 }] }],
    ['selector', { steps: [{ eval: progress }, { eval: 'Q.clearStages(), Q.stageScene("level selector"), true', wait: 900 }] }],
    ['level', { steps: [{ eval: playLevel, wait: 700 }, { eval: placeSolution(sol.grid), wait: 300 }, step, step, step, step, step, step, step,
      { eval: 'var tg = t.RobotTable.counterPanel.target(); t.RobotTable.counterPanel.set(tg.color, tg.value), true', wait: 400 }] }],
    // mid-run (tg-wtv.8): the program running at normal speed, captured in motion.
    // Timing-dependent, so not pixel-stable between runs: review only, not for skin diffs.
    ['run', { steps: [{ eval: playLevel, wait: 700 }, { eval: placeSolution(sol.grid), wait: 300 },
      { eval: 't.Controls.buttons.play.click(), true', wait: 2300 }] }],
    ['popup', { steps: [{ eval: playLevel, wait: 700 }, { eval: placeSolution(sol.grid), wait: 300 }, { freeze: true }, { eval: 't.TileExplain.open([t.Operators.nameToOp["mRed"]]), true', wait: 900 }] }],
    ['help', { steps: [{ eval: playLevel, wait: 700 }, { eval: placeSolution(sol.grid), wait: 300 }, { eval: 't.HelpOverlay.show(), true', wait: 600 }] }],
    ['about', { steps: [{ eval: 'Q.clearStages(), Q.stageScene("about"), true', wait: 900 }] }],
    ['endlevel', { steps: [{ eval: progress }, { eval: playLevel, wait: 700 }, { eval: placeSolution(sol.grid), wait: 300 },
      { eval: 'Q.stageScene("endLevel", 2, {result: 2, totalSteps: 23, totalParts: 2}), true', wait: 4500 }] }],
  ];
}

async function shots(o) {
  const url = o.url || 'http://127.0.0.1:8000/';
  const skin = o.skin || 'toybox';
  const out = path.resolve(o.out || 'shots');
  fs.mkdirSync(out, { recursive: true });
  const only = o.only ? String(o.only).split(',') : null;
  const sizes = String(o.sizes || 'desktop,mobile').split(',');
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
  const sols = JSON.parse(fs.readFileSync(path.join(root, 'tools/levels/solutions/solutions.json'), 'utf8'));
  const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tg-shots-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(chrome, ['--headless=new', '--mute-audio', '--autoplay-policy=user-gesture-required', '--no-first-run',
    '--no-default-browser-check', '--hide-scrollbars', '--disable-gpu', '--force-color-profile=srgb', '--disable-partial-raster', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
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
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === 'page'); } catch {}
    }
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } });
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    for (const sizeName of sizes) {
      const sz = SIZES[sizeName];
      await send('Emulation.setDeviceMetricsOverride', { width: sz.width, height: sz.height, deviceScaleFactor: 1, mobile: sz.mobile });
      await send('Emulation.setTouchEmulationEnabled', { enabled: sz.mobile });
      for (const [name, sc] of screens(sols[LEVEL])) {
        if (only && !only.includes(name)) continue;
        const chosen = sc.chosen !== false;
        // fresh storage for each screen: muted, every tile seen, the skin (or none)
        const seen = ['Step', 'ClockwiseRotator', 'CounterClockwiseRotator', 'Conveyor', 'Detector', 'DetectMagic', 'Plus', 'Minus'];
        const init = `(function(){ try {
          localStorage.clear();
          localStorage.setItem('turing.sfx.muted', '1'); localStorage.setItem('turing.music.muted', '1');
          localStorage.setItem('turing.tilesSeen', ${JSON.stringify(JSON.stringify(seen))});
          ${chosen ? `localStorage.setItem('turing.skin', ${JSON.stringify(skin)});` : ''}
        } catch (e) {} })();`;
        const { identifier } = await send('Page.addScriptToEvaluateOnNewDocument', { source: init });
        await send('Page.navigate', { url: 'about:blank' });
        await sleep(100);
        await send('Page.navigate', { url });
        let ok = false;
        for (let i = 0; i < 150 && !ok; i++) { await sleep(200); ok = await evaluate('!!(window.t && t.UI && t.UI.base && window.Q && Q.stageScene)').catch(() => false); }
        if (!ok) throw new Error(`${name}: the game did not start`);
        await sleep(700);
        await evaluate('t.Sfx && t.Sfx.setMuted && t.Sfx.setMuted(true), t.Music && t.Music.setMuted && t.Music.setMuted(true), true').catch(() => {});
        for (const s of sc.steps) {
          if (s.freeze) { await evaluate(freezeJs); await sleep(200); }
          if (s.eval) await evaluate(s.eval);
          if (s.wait) await sleep(s.wait);
          if (s.log) console.log(`  ${name}: ${JSON.stringify(await evaluate(s.log))}`);
        }
        if (o.hide) await evaluate(`(function(){ var s = document.createElement('style'); s.textContent = ${JSON.stringify(o.hide)} + '{display:none !important}'; document.head.appendChild(s); return true; })()`);
        if (!sc.steps.some((s) => s.freeze)) await evaluate(freezeJs);
        await sleep(400);
        // whole page (the selector and about scroll on a phone)
        const m = await send('Page.getLayoutMetrics');
        const h = Math.min(4000, Math.ceil(m.cssContentSize ? m.cssContentSize.height : sz.height));
        const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: h > sz.height,
          clip: { x: 0, y: 0, width: sz.width, height: Math.max(sz.height, h), scale: 1 } });
        const file = path.join(out, `${skin}-${sizeName}-${name}.png`);
        fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
        console.log(`shot ${path.relative(process.cwd(), file)}`);
        await send('Page.removeScriptToEvaluateOnNewDocument', { identifier });
      }
    }
  } catch (e) { console.error(e); code = 1; }
  finally { try { ws && ws.close(); } catch {} proc.kill(); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} }
  return code;
}

// ---------- diff: same file names (skin prefix ignored) ----------
function diff(o) {
  const [a, b] = o._;
  const out = path.resolve(o.out || 'diff');
  fs.mkdirSync(out, { recursive: true });
  const key = (f) => f.replace(/^[a-z]+-/, '');
  const bFiles = new Map(fs.readdirSync(b).filter((f) => f.endsWith('.png')).map((f) => [key(f), f]));
  const lines = [];
  let bad = 0;
  for (const fa of fs.readdirSync(a).filter((f) => f.endsWith('.png')).sort()) {
    const fb = bFiles.get(key(fa));
    if (!fb) { lines.push(`MISSING ${key(fa)}`); bad++; continue; }
    const A = decodePng(fs.readFileSync(path.join(a, fa))), B = decodePng(fs.readFileSync(path.join(b, fb)));
    if (A.width !== B.width || A.height !== B.height) { lines.push(`SIZE    ${key(fa)}: ${A.width}x${A.height} vs ${B.width}x${B.height}`); bad++; continue; }
    let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    const vis = blank(A.width, A.height);
    for (let i = 0, p = 0; i < A.data.length; i += 4, p++) {
      const same = A.data[i] === B.data[i] && A.data[i + 1] === B.data[i + 1] && A.data[i + 2] === B.data[i + 2] && A.data[i + 3] === B.data[i + 3];
      const g = Math.round((A.data[i] + A.data[i + 1] + A.data[i + 2]) / 3 * 0.35 + 150);
      if (same) { vis.data.set([g, g, g, 255], i); continue; }
      n++; const x = p % A.width, y = Math.floor(p / A.width);
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      vis.data.set([255, 0, 200, 255], i);
    }
    if (n) { bad++; fs.writeFileSync(path.join(out, 'diff-' + key(fa)), encodePng(vis)); }
    lines.push(n ? `DIFF    ${key(fa)}: ${n} px in ${x0},${y0} .. ${x1},${y1}` : `same    ${key(fa)}`);
  }
  const report = lines.join('\n') + '\n';
  fs.writeFileSync(path.join(out, 'diff.txt'), report);
  process.stdout.write(report);
  return bad ? 1 : 0;
}

// ---------- contact sheet ----------
function sheet(o) {
  const dir = o._[0];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
  const cols = Number(o.cols || 4), scale = Number(o.scale || 0.4);
  const imgs = files.map((f) => ({ f, img: decodePng(fs.readFileSync(path.join(dir, f))) }));
  const cellW = Math.round(1440 * scale), maxH = 900;
  const thumbs = imgs.map(({ f, img }) => {
    const s = Math.min(cellW / img.width, Math.min(maxH, img.height * cellW / img.width) / img.height);
    const w = Math.max(1, Math.round(img.width * s)), h = Math.max(1, Math.round(img.height * s));
    const t = blank(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const sx = Math.min(img.width - 1, Math.floor(x / s)), sy = Math.min(img.height - 1, Math.floor(y / s));
      t.data.set(img.data.subarray((sy * img.width + sx) * 4, (sy * img.width + sx) * 4 + 4), (y * w + x) * 4);
    }
    return { f, t };
  });
  const pad = 16, label = 22, rows = Math.ceil(thumbs.length / cols);
  const rowH = []; for (let r = 0; r < rows; r++) rowH.push(Math.max(...thumbs.slice(r * cols, r * cols + cols).map((x) => x.t.height)) + label + pad);
  const W = cols * (cellW + pad) + pad, H = rowH.reduce((a, b) => a + b, 0) + pad;
  const outImg = blank(W, H, [24, 24, 28, 255]);
  let y = pad;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const it = thumbs[r * cols + c]; if (!it) continue;
      const x = pad + c * (cellW + pad);
      drawText(outImg, it.f.replace(/\.png$/, ''), x, y + 4, [230, 230, 230, 255], 2);
      fillRect(outImg, x - 1, y + label - 1, it.t.width + 2, it.t.height + 2, [90, 90, 100, 255]);
      composite(outImg, it.t, x, y + label);
    }
    y += rowH[r];
  }
  fs.writeFileSync(path.resolve(o.out || 'sheet.png'), encodePng(outImg));
  console.log(`sheet ${o.out} (${thumbs.length} shots)`);
  return 0;
}

const o = args(process.argv.slice(3));
const cmd = process.argv[2];
const code = cmd === 'shots' ? await shots(o) : cmd === 'diff' ? diff(o) : cmd === 'sheet' ? sheet(o) : (console.error('usage: shots | diff | sheet (see the header)'), 2);
process.exit(code);
