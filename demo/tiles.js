// Program tiles demo (bead tg-vy4.11): the original 2012 frames, the v1
// frames now in the game, and a candidate drawn live with vector shapes,
// side by side on the same little board. No Quintus, no gameplay.
//
// Timing facts reproduced here:
// - The Quintus anim step (lib/quintus_anim.js) adds dt twice, so one frame
//   lasts rate/2. The original used rate 0.05, so 0.025 s per frame (40 fps).
//   It was stepped per requestAnimationFrame, with dt capped at 100 ms.
// - v1 uses rate 0.08 and Q.syncTileAnimation (utilitySprites.js), so
//   frame = floor(now / (500 * 0.08)) % n, which is 0.04 s per frame (25 fps).
// - The game draws a 50 px frame at scale 0.9 (45 px) on a 47 px pitch with
//   default canvas image smoothing, rotated in 90° steps.
(function () {
  "use strict";

  // ------------------------------------------------------------ constants
  var ORIG_RATE = 0.05; // Quintus rate; a frame lasts rate / 2
  var V1_FRAME_MS = 500 * 0.08; // syncTileAnimation: 40 ms per frame
  var ORIG_FRAMES = { conveyor: 20, stepForward: 60, cwrotator: 60, ccwrotator: 60, emptyOperator: 1 };
  var V1_FRAMES = { conveyor: 25, stepForward: 25, cwrotator: 50, ccwrotator: 50, emptyOperator: 1 };
  // Measured from the original atlas: the belt chevrons repeat every 13 px
  // and move 0.65 px per frame (20 frames per period). The rotator arrow is
  // two-fold symmetric and turns 180° in 60 frames, so 3° per frame.
  var ORIG_DEG_PER_FRAME = 3;
  var ORIG_BELT_PX_PER_FRAME = 13 / 20;
  var V1_DEG_PER_FRAME = 180 / 50;
  var V1_BELT_PX_PER_FRAME = 1;
  // Smooth candidate: the original's visible speeds, from the clock.
  var SMOOTH_DEG_PER_S = ORIG_DEG_PER_FRAME / (ORIG_RATE / 2); // 120°/s
  var SMOOTH_BELT_PX_PER_S = ORIG_BELT_PX_PER_FRAME / (ORIG_RATE / 2); // 26 px/s

  // The board: a row pointing east (0°) with a vertical belt pointing south
  // (90° clockwise) crossing it at column 3. Empty cells are null.
  var BOARD_COLS = 6;
  var BOARD_ROWS = 5;
  var CELLS = [
    [0, 2, "conveyor", 0], [1, 2, "stepForward", 0], [2, 2, "cwrotator", 0],
    [3, 2, "conveyor", 0], [4, 2, "ccwrotator", 0], [5, 2, "conveyor", 0],
    [3, 0, "conveyor", 90], [3, 1, "stepForward", 90], [3, 3, "cwrotator", 90], [3, 4, "conveyor", 90],
  ];
  function boardCells() {
    var grid = [];
    for (var j = 0; j < BOARD_ROWS; j += 1)
      for (var i = 0; i < BOARD_COLS; i += 1) grid.push([i, j, "emptyOperator", 0]);
    CELLS.forEach(function (c) { grid[c[1] * BOARD_COLS + c[0]] = c; });
    return grid;
  }
  var GRID = boardCells();

  // ------------------------------------------------------------ Toybox palette (tools/art/tiles/program-tiles.mjs)
  var P = {
    outline: "#2a2335", floor: "#a3d9b1", floorRim: "#86c49a", floorDot: "#93cea5",
    railLight: "#c9d0d6", railMid: "#8b93a3", beltEdge: "#3a3f5c", belt: "#4a5175", beltJoint: "#40466a",
    chevron: "#f6c445", chevronShade: "#e09b2d",
    stepLight: "#9be6f7", step: "#37bfe5", stepDark: "#2786b5",
    cw: ["#f27a9b", "#d73960", "#9a3256"], ccw: ["#fbb466", "#e9852c", "#b0561c"],
  };

  // ------------------------------------------------------------ vector shapes, in 50×50 tile units
  // Each shape copies the v1 generator's continuous geometry (the region its
  // pixel centres sample), so the candidate matches the v1 look closely.
  var PERIOD = 25;
  var RING = { rc: 15.5, half: 3, headHalf: 6.5, arc: (110 * Math.PI) / 180, headLen: 8.5 };
  var HEAD_ANG = RING.headLen / RING.rc;

  function chevronPath(back) {
    // Leading-edge chevron ">" spanning rows 20..30, tip at y = 25.
    var p = new Path2D();
    p.moveTo(6.5, 20); p.lineTo(11.5, 25); p.lineTo(6.5, 30);
    p.lineTo(6.5 + back, 30); p.lineTo(11.5 + back, 25); p.lineTo(6.5 + back, 20);
    p.closePath();
    return p;
  }
  var CHEVRON = chevronPath(4);
  var CHEVRON_SHADE = chevronPath(1);

  var STEP_ARROW = (function () {
    var p = new Path2D();
    p.moveTo(0, -2.5); p.lineTo(8, -2.5); p.lineTo(8, -5.5); p.lineTo(15.4, 0);
    p.lineTo(8, 5.5); p.lineTo(8, 2.5); p.lineTo(0, 2.5); p.closePath();
    return p;
  })();

  function ringPaths(dir) {
    // Two arcs, 180° apart, centred on (25, 25), tail at angle k·π, head leading in `dir`.
    var shape = new Path2D();
    var light = new Path2D();
    var a = function (t) { return dir * t; };
    var pt = function (path, r, t, move) {
      var x = 25 + r * Math.cos(a(t)), y = 25 + r * Math.sin(a(t));
      if (move) path.moveTo(x, y); else path.lineTo(x, y);
    };
    var STEPS = 10;
    for (var k = 0; k < 2; k += 1) {
      var t0 = k * Math.PI, t1 = t0 + RING.arc;
      pt(shape, RING.rc + RING.half, t0, true);
      shape.arc(25, 25, RING.rc + RING.half, a(t0), a(t1), dir < 0);
      for (var j = 0; j <= STEPS; j += 1) {
        var s = (j / STEPS) * RING.headLen;
        pt(shape, RING.rc + RING.headHalf * (1 - s / (RING.headLen + 0.5)), t1 + s / RING.rc);
      }
      for (j = STEPS; j >= 0; j -= 1) {
        s = (j / STEPS) * RING.headLen;
        pt(shape, RING.rc - RING.headHalf * (1 - s / (RING.headLen + 0.5)), t1 + s / RING.rc);
      }
      shape.arc(25, 25, RING.rc - RING.half, a(t1), a(t0), dir > 0);
      shape.closePath();
      pt(light, RING.rc, t0, true);
      light.arc(25, 25, RING.rc, a(t0), a(t1 + HEAD_ANG), dir < 0);
    }
    return { shape: shape, light: light };
  }
  var RING_CW = ringPaths(1);
  var RING_CCW = ringPaths(-1);

  /** Outline 1 px outside, base fill, dark 1 px inner rim, then `inner()` (clipped). */
  function shaded(ctx, path, base, dark, inner) {
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = P.outline;
    ctx.stroke(path);
    ctx.save();
    ctx.clip(path);
    ctx.fillStyle = base;
    ctx.fill(path);
    ctx.strokeStyle = dark;
    ctx.stroke(path);
    if (inner) inner();
    ctx.restore();
  }

  var BELT_ROWS = [
    [16, 1, "outline"], [17, 1, "railLight"], [18, 1, "railMid"], [19, 1, "outline"],
    [20, 1, "beltEdge"], [21, 8, "belt"], [29, 1, "beltEdge"],
    [30, 1, "outline"], [31, 1, "railMid"], [32, 1, "railLight"], [33, 1, "outline"],
  ];

  function smoothFloor(ctx) {
    ctx.fillStyle = P.floor;
    ctx.fillRect(0, 0, 50, 50);
    ctx.strokeStyle = P.floorRim;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 49, 49);
    ctx.fillStyle = P.floorDot;
    ctx.fillRect(3, 3, 2, 2); ctx.fillRect(45, 3, 2, 2); ctx.fillRect(3, 45, 2, 2); ctx.fillRect(45, 45, 2, 2);
  }

  function smoothBelt(ctx, offset) {
    BELT_ROWS.forEach(function (r) { ctx.fillStyle = P[r[2]]; ctx.fillRect(0, r[0], 50, r[1]); });
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 20, 50, 10);
    ctx.clip();
    for (var k = -1; k <= 2; k += 1) {
      var x0 = offset + k * PERIOD;
      ctx.fillStyle = P.beltJoint;
      ctx.fillRect(x0 + 1, 21, 1, 8);
      ctx.translate(x0, 0);
      ctx.fillStyle = P.chevron;
      ctx.fill(CHEVRON);
      ctx.fillStyle = P.chevronShade;
      ctx.fill(CHEVRON_SHADE);
      ctx.translate(-x0, 0);
    }
    ctx.restore();
  }

  function smoothStepArrows(ctx, offset) {
    [8.5, 41.5].forEach(function (cy) {
      for (var k = -1; k <= 1; k += 1) {
        ctx.save();
        ctx.translate(offset + k * PERIOD + 4, cy);
        shaded(ctx, STEP_ARROW, P.step, P.stepDark, function () {
          ctx.fillStyle = P.stepLight;
          ctx.fillRect(0, -0.6, 16, 1.2);
        });
        ctx.restore();
      }
    });
  }

  function smoothRotator(ctx, phase, cw) {
    var ring = cw ? RING_CW : RING_CCW;
    var col = cw ? P.cw : P.ccw;
    ctx.save();
    ctx.translate(25, 25);
    ctx.rotate(cw ? phase : -phase);
    ctx.translate(-25, -25);
    shaded(ctx, ring.shape, col[1], col[2], function () {
      ctx.strokeStyle = col[0];
      ctx.lineWidth = 2.4;
      ctx.stroke(ring.light);
    });
    ctx.restore();
  }

  /** One smooth tile centred at (cx, cy); s = screen px per tile unit; rot in degrees clockwise. */
  function drawSmoothTile(ctx, name, cx, cy, s, rot, offset, phase) {
    ctx.save();
    ctx.translate(cx, cy);
    if (rot) ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(s, s);
    ctx.translate(-25, -25);
    ctx.beginPath();
    ctx.rect(0, 0, 50, 50);
    ctx.clip();
    smoothFloor(ctx);
    if (name !== "emptyOperator") {
      smoothBelt(ctx, offset);
      if (name === "stepForward") smoothStepArrows(ctx, offset);
      else if (name === "cwrotator") smoothRotator(ctx, phase, true);
      else if (name === "ccwrotator") smoothRotator(ctx, phase, false);
    }
    ctx.restore();
  }

  /** One bitmap frame as Quintus draws it: centre, rotate, scale, drawImage at -25. */
  function drawBitmapTile(ctx, img, sheet, frame, cx, cy, s, rot) {
    var cols = sheet.w / sheet.tilew;
    var fx = (frame % cols) * sheet.tilew + (sheet.sx || 0);
    var fy = Math.floor(frame / cols) * sheet.tileh + (sheet.sy || 0);
    ctx.save();
    ctx.translate(cx, cy);
    if (rot) ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(s, s);
    ctx.drawImage(img, fx, fy, sheet.tilew, sheet.tileh, -25, -25, sheet.tilew, sheet.tileh);
    ctx.restore();
  }

  // ------------------------------------------------------------ state
  var state = { scale: 1, gaps: true, res: "game", playing: true, simMs: 0, lastTs: null };
  var origAnim = { time: 0, total: 0, changed: true }; // one Quintus anim state; frame = total % n

  /** lib/quintus_anim.js step, verbatim in effect: dt is added twice. */
  function quintusStep(dt) {
    origAnim.time += dt;
    if (origAnim.changed) {
      origAnim.changed = false;
    } else {
      origAnim.time += dt;
      if (origAnim.time > ORIG_RATE) {
        var stepped = Math.floor(origAnim.time / ORIG_RATE);
        origAnim.time -= stepped * ORIG_RATE;
        origAnim.total += stepped;
      }
    }
  }

  function Meter() { this.samples = []; }
  Meter.prototype.push = function (t, v) {
    this.samples.push({ t: t, v: v });
    while (this.samples.length > 2 && t - this.samples[1].t >= 1000) this.samples.shift();
  };
  Meter.prototype.rate = function (key) {
    var s = this.samples;
    if (s.length < 2) return NaN;
    var a = s[0], b = s[s.length - 1];
    var dt = (b.t - a.t) / 1000;
    return dt > 0.25 ? (b.v[key] - a.v[key]) / dt : NaN;
  };
  Meter.prototype.reset = function () { this.samples = []; };

  var columns = [
    { id: "orig", canvas: null, ctx: null, meter: new Meter(), changes: 0, lastFrame: -1, drawMs: 0 },
    { id: "v1", canvas: null, ctx: null, meter: new Meter(), changes: 0, lastFrame: -1, drawMs: 0 },
    { id: "smooth", canvas: null, ctx: null, meter: new Meter(), changes: 0, lastFrame: -1, drawMs: 0 },
  ];
  var assets = {};

  function layout() {
    var tile = 45 * state.scale;
    var gap = state.gaps ? 2 * state.scale : 0;
    var pitch = tile + gap;
    return {
      tile: tile, gap: gap, pitch: pitch, s: 0.9 * state.scale,
      w: BOARD_COLS * pitch + gap, h: BOARD_ROWS * pitch + gap,
    };
  }

  function sizeCanvases() {
    var L = layout();
    var res = state.res === "sharp" ? window.devicePixelRatio || 1 : 1;
    columns.forEach(function (c) {
      c.canvas.width = Math.round(L.w * res);
      c.canvas.height = Math.round(L.h * res);
      c.canvas.style.width = L.w + "px";
      c.canvas.style.height = L.h + "px";
      c.res = res;
    });
  }

  function forEachCell(L, fn) {
    GRID.forEach(function (c) {
      var cx = L.gap + c[0] * L.pitch + L.tile / 2;
      var cy = L.gap + c[1] * L.pitch + L.tile / 2;
      fn(c[2], cx, cy, c[3]);
    });
  }

  function clear(c, L) {
    var ctx = c.ctx;
    ctx.setTransform(c.res, 0, 0, c.res, 0, 0);
    ctx.imageSmoothingEnabled = true; // the game never changes the default
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, L.w, L.h);
  }

  function render() {
    var L = layout();
    var t = state.simMs / 1000;

    // Original: pre-drawn frames, Quintus-stepped.
    var c = columns[0], t0 = performance.now();
    clear(c, L);
    forEachCell(L, function (name, cx, cy, rot) {
      drawBitmapTile(c.ctx, assets.origImg, assets.origJson[name], origAnim.total % ORIG_FRAMES[name], cx, cy, L.s, rot);
    });
    c.drawMs = performance.now() - t0;

    // v1: pre-drawn frames, synced to the clock.
    var v1Total = Math.floor(state.simMs / V1_FRAME_MS);
    c = columns[1]; t0 = performance.now();
    clear(c, L);
    forEachCell(L, function (name, cx, cy, rot) {
      drawBitmapTile(c.ctx, assets.v1Img, assets.v1Json[name], v1Total % V1_FRAMES[name], cx, cy, L.s, rot);
    });
    c.drawMs = performance.now() - t0;

    // Smooth: drawn from the clock.
    var offset = (SMOOTH_BELT_PX_PER_S * t) % PERIOD;
    var phase = ((SMOOTH_DEG_PER_S * t) % 360) * (Math.PI / 180);
    c = columns[2]; t0 = performance.now();
    clear(c, L);
    forEachCell(L, function (name, cx, cy, rot) {
      drawSmoothTile(c.ctx, name, cx, cy, L.s, rot, offset, phase);
    });
    c.drawMs = performance.now() - t0;

    return { origTotal: origAnim.total, v1Total: v1Total, t: t };
  }

  function fmt(n, d) { return isNaN(n) ? "  …" : n.toFixed(d); }

  function measure(ts, r) {
    var cols = [
      { c: columns[0], total: r.origTotal, deg: r.origTotal * ORIG_DEG_PER_FRAME, belt: r.origTotal * ORIG_BELT_PX_PER_FRAME },
      { c: columns[1], total: r.v1Total, deg: r.v1Total * V1_DEG_PER_FRAME, belt: r.v1Total * V1_BELT_PX_PER_FRAME },
      { c: columns[2], total: null, deg: SMOOTH_DEG_PER_S * r.t, belt: SMOOTH_BELT_PX_PER_S * r.t },
    ];
    cols.forEach(function (x) {
      var c = x.c;
      if (x.total === null) c.changes += 1; // a new image on every display frame
      else if (x.total !== c.lastFrame) { c.changes += 1; c.lastFrame = x.total; }
      c.meter.push(ts, { changes: c.changes, deg: x.deg, belt: x.belt });
    });
  }

  var readoutEls = {};
  var lastReadout = 0;
  function updateReadouts(ts) {
    if (ts - lastReadout < 250) return;
    lastReadout = ts;
    var perFrame = { orig: ORIG_DEG_PER_FRAME + "° / frame", v1: V1_DEG_PER_FRAME + "° / frame", smooth: "continuous" };
    columns.forEach(function (c) {
      var paused = state.playing ? "" : "   (paused)";
      readoutEls[c.id].innerHTML =
        "anim fps   <b>" + fmt(c.meter.rate("changes"), 1) + "</b>" + (c.id === "smooth" ? "  (= display refresh)" : "") + paused + "\n" +
        "rotators   <b>" + fmt(c.meter.rate("deg"), 1) + " °/s</b>  (" + perFrame[c.id] + ")\n" +
        "belt       <b>" + fmt(c.meter.rate("belt"), 1) + " px/s</b>  (50 px tile units; ×0.9 on screen at 1×)\n" +
        "draw (CPU) " + c.drawMs.toFixed(2) + " ms for " + GRID.length + " tiles";
    });
  }

  function frame(ts) {
    if (state.lastTs === null) state.lastTs = ts;
    var dtMs = ts - state.lastTs;
    state.lastTs = ts;
    if (state.playing) {
      state.simMs += dtMs;
      quintusStep(Math.min(dtMs, 100) / 1000); // Q.options.frameTimeLimit = 100 ms
    }
    var r = render();
    if (state.playing) measure(ts, r);
    updateReadouts(ts);
    window.requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------ benchmark: 64 tiles, game size
  function bench() {
    var out = document.getElementById("bench-out");
    out.textContent = "Benchmarking…";
    setTimeout(function () {
      var cv = document.createElement("canvas");
      cv.width = 1024; cv.height = 768;
      var ctx = cv.getContext("2d", { willReadFrequently: false });
      var names = ["conveyor", "stepForward", "cwrotator", "ccwrotator"];
      var place = function (k) { return [100 + (k % 8) * 47, 100 + Math.floor(k / 8) * 47, (k % 4) * 90]; };
      var run = function (draw) {
        var i, N = 240;
        for (i = 0; i < 30; i += 1) draw(i);
        ctx.getImageData(0, 0, 1, 1);
        var t0 = performance.now();
        for (i = 0; i < N; i += 1) { draw(i); ctx.getImageData(0, 0, 1, 1); } // readback forces the GPU to finish
        return (performance.now() - t0) / N;
      };
      var bg = function () { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 1024, 768); };
      var base = run(bg);
      var bitmap = run(function (i) {
        bg();
        for (var k = 0; k < 64; k += 1) {
          var p = place(k), n = names[k % 4];
          drawBitmapTile(ctx, assets.v1Img, assets.v1Json[n], i % V1_FRAMES[n], p[0], p[1], 0.9, p[2]);
        }
      });
      var smooth = run(function (i) {
        bg();
        var t = i / 60;
        var off = (SMOOTH_BELT_PX_PER_S * t) % PERIOD, ph = (SMOOTH_DEG_PER_S * t * Math.PI) / 180;
        for (var k = 0; k < 64; k += 1) { var p = place(k); drawSmoothTile(ctx, names[k % 4], p[0], p[1], 0.9, p[2], off, ph); }
      });
      var res = {
        baselineMs: +base.toFixed(3), bitmapMs: +bitmap.toFixed(3), smoothMs: +smooth.toFixed(3),
        bitmapNetMs: +(bitmap - base).toFixed(3), smoothNetMs: +(smooth - base).toFixed(3),
      };
      window.__benchResult = res;
      out.textContent =
        "64 tiles on a 1024×768 canvas, per frame (each with a 1 px readback to force the GPU to finish): " +
        "clear only " + res.baselineMs + " ms; bitmap tiles " + res.bitmapMs + " ms (+" + res.bitmapNetMs + "); " +
        "smooth vector tiles " + res.smoothMs + " ms (+" + res.smoothNetMs + "). A 60 Hz frame is 16.7 ms.";
    }, 30);
  }

  // ------------------------------------------------------------ controls
  function pressGroup(groupId, attr, value) {
    document.querySelectorAll("#" + groupId + " button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute(attr) === String(value)));
    });
  }

  function resetMeters() { columns.forEach(function (c) { c.meter.reset(); }); }

  function wire() {
    document.querySelectorAll("#scale-group button").forEach(function (b) {
      b.addEventListener("click", function () {
        state.scale = Number(b.getAttribute("data-scale"));
        pressGroup("scale-group", "data-scale", state.scale);
        sizeCanvases();
      });
    });
    document.querySelectorAll("#res-group button").forEach(function (b) {
      b.addEventListener("click", function () {
        state.res = b.getAttribute("data-res");
        pressGroup("res-group", "data-res", state.res);
        sizeCanvases();
      });
    });
    var play = document.getElementById("play");
    play.addEventListener("click", function () {
      state.playing = !state.playing;
      play.textContent = state.playing ? "Pause" : "Play";
      if (state.playing) resetMeters(); // keep the last readings on screen while paused
    });
    var gaps = document.getElementById("gaps");
    gaps.addEventListener("click", function () {
      state.gaps = !state.gaps;
      gaps.textContent = state.gaps ? "Gaps on" : "Gaps off";
      gaps.setAttribute("aria-pressed", String(state.gaps));
      sizeCanvases();
    });
    document.getElementById("bench").addEventListener("click", bench);
    window.addEventListener("resize", function () { if (state.res === "sharp") sizeCanvases(); });
    window.__demo = { state: state, bench: bench, columns: columns };
  }

  // ------------------------------------------------------------ boot
  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("could not load " + src)); };
      img.src = src;
    });
  }
  function loadJson(src) {
    return fetch(src).then(function (r) {
      if (!r.ok) throw new Error("could not load " + src + " (" + r.status + ")");
      return r.json();
    });
  }

  Promise.all([
    loadImage("../images/sprytszyt.png"), loadJson("../data/sprites.json"),
    loadImage("../images/tiles/program-tiles.png"), loadJson("../data/program-tiles.json"),
  ]).then(function (r) {
    assets = { origImg: r[0], origJson: r[1], v1Img: r[2], v1Json: r[3] };
    columns.forEach(function (c) {
      c.canvas = document.getElementById("c-" + c.id);
      c.ctx = c.canvas.getContext("2d");
      readoutEls[c.id] = document.getElementById("r-" + c.id);
    });
    wire();
    sizeCanvases();
    window.requestAnimationFrame(frame);
  }).catch(function (e) {
    document.querySelector(".columns").textContent = "Failed to load tiles: " + e.message + ". Serve the repository root over HTTP (python3 -m http.server).";
    throw e;
  });
})();
