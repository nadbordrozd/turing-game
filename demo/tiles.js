// Program tiles demo: the original 2012 frames and the v2 frames now in the
// game, side by side on the same little board. No Quintus, no gameplay.
//
// Timing facts reproduced here:
// - The Quintus anim step (lib/quintus_anim.js) adds dt twice, so one frame
//   lasts rate/2. Every program tile uses rate 0.05: 25 ms per frame (40 fps).
// - The game reads each tile's frame from one clock (Q.syncTileAnimation in
//   utilitySprites.js): frame = floor(now / 25 ms) % frames. Both columns use it.
// - Original: 50 px frames drawn at scale 0.9 (45 px) on a 47 px pitch with
//   2 px gaps. v2: 54 px frames drawn at scale 1 on a 54 px pitch, no gaps.
(function () {
  "use strict";

  var FRAME_MS = 500 * 0.05; // 25 ms
  var ORIG_FRAMES = {
    conveyor: 20, stepForward: 60, cwrotator: 60, ccwrotator: 60, detector: 20, magicDetector: 20,
    emptyOperator: 1, startTile: 1,
  };
  // v2 tiles are layered (tools/art/tiles/program-tiles.mjs TILES): a belt
  // underlay for the join (LINE / BRANCH sheets by join key) and a symbol on
  // top, each at the global frame mod its own length (json[sheet].frames).
  var LINE = { B: "conveyor", L: "conveyorFromLeft", R: "conveyorFromRight" };
  var V2_SYMBOL = { stepForward: "stepForwardSymbol", cwrotator: "cwrotatorSymbol", ccwrotator: "ccwrotatorSymbol",
    detector: "detectorSymbol", magicDetector: "magicDetectorSymbol" };
  var BRANCH = { detector: 1, magicDetector: 1 };
  ["Red", "Blue", "Green", "Purple", "Yellow", "Pink"].forEach(function (c) {
    ORIG_FRAMES["incrementer" + c] = 60; ORIG_FRAMES["decrementer" + c] = 20;
    V2_SYMBOL["incrementer" + c] = "incrementer" + c + "Symbol"; V2_SYMBOL["decrementer" + c] = "decrementer" + c + "Symbol";
    BRANCH["decrementer" + c] = 1;
  });
  function v2Layers(tile, key) {
    if (tile === "emptyOperator" || tile === "startTile") return [tile];
    var under = BRANCH[tile] ? "branch" : LINE[key || "B"];
    var sym = tile === "stepForward" ? { L: "stepForwardSymbolSouth", R: "stepForwardSymbolNorth" }[key] || V2_SYMBOL[tile] : V2_SYMBOL[tile];
    return sym ? [under, sym] : [under];
  }
  // The 2012 atlas spells one incrementer differently.
  var ORIG_NAME = { incrementerPurple: "incerementerPurple" };

  // Measured speeds (tile widths per second, and degrees per second).
  var SPEEDS = {
    orig: { belt: (13 / 50) / (20 * 0.025), rot: 3 / 0.025, step: 1 / (60 * 0.025) },
    v2: { belt: 0.25 / (20 * 0.025), rot: 3 / 0.025, step: 1 / (60 * 0.025) },
  };

  // The board from tools/art/tiles/program-tiles.mjs (MOCK): [col, row, tile, quarter turns clockwise,
  // join key]. The game picks the joins itself (TuringTable.beltSheet) from what feeds each tile;
  // the keys here are the ones program-tiles.mjs joinKey derives for this board.
  var COLS = 7, ROWS = 5;
  var CELLS = [
    [0, 0, "conveyor", 0], [1, 0, "stepForward", 0], [2, 0, "conveyor", 1, "R"],
    [2, 1, "conveyor", 2, "R"], [1, 1, "ccwrotator", 2], [0, 1, "stepForward", 2],
    [0, 2, "conveyor", 0], [1, 2, "stepForward", 0], [2, 2, "cwrotator", 0], [3, 2, "incrementerRed", 0], [4, 2, "detector", 0],
    [4, 1, "conveyor", 0, "R"], [5, 1, "ccwrotator", 0], [6, 1, "conveyor", 0],
    [4, 3, "conveyor", 0, "L"], [5, 3, "decrementerBlue", 0],
    [5, 2, "conveyor", 0, "R"], [6, 2, "incrementerYellow", 0],
    [5, 4, "conveyor", 0, "L"], [6, 4, "magicDetector", 0],
    [0, 4, "decrementerGreen", 1], [1, 4, "incrementerPurple", 3, "L"], [2, 4, "decrementerPink", 0], [3, 4, "startTile", 0],
  ];
  var GRID = (function () {
    var g = [];
    for (var j = 0; j < ROWS; j += 1) for (var i = 0; i < COLS; i += 1) g.push([i, j, "emptyOperator", 0]);
    CELLS.forEach(function (c) { g[c[1] * COLS + c[0]] = c; });
    return g;
  })();

  var state = { scale: 1, playing: true, simMs: 0, lastTs: null, res: "game" };
  var assets = {};
  var columns = [
    { id: "orig", tile: 45, pitch: 47, gap: 2, s: 0.9, frames: ORIG_FRAMES, img: "origImg", json: "origJson", bg: "#000" },
    { id: "v2", tile: 54, pitch: 54, gap: 0, s: 1, img: "v2Img", json: "v2Json", bg: "#a3d9b1" },
  ];

  function size(c) {
    var k = state.scale;
    return { w: (COLS * c.pitch + c.gap) * k, h: (ROWS * c.pitch + c.gap) * k };
  }

  function sizeCanvases() {
    var res = state.res === "sharp" ? window.devicePixelRatio || 1 : 1;
    columns.forEach(function (c) {
      var L = size(c);
      c.canvas.width = Math.round(L.w * res);
      c.canvas.height = Math.round(L.h * res);
      c.canvas.style.width = L.w + "px";
      c.canvas.style.height = L.h + "px";
      c.res = res;
    });
  }

  /** One frame as Quintus draws it: centre, rotate, scale, drawImage at -size/2. */
  function drawTile(ctx, img, sheet, frame, cx, cy, s, quarter) {
    var cols = sheet.w / sheet.tilew;
    var fx = (frame % cols) * sheet.tilew + (sheet.sx || 0);
    var fy = Math.floor(frame / cols) * sheet.tileh + (sheet.sy || 0);
    ctx.save();
    ctx.translate(cx, cy);
    if (quarter) ctx.rotate((quarter * Math.PI) / 2);
    ctx.scale(s, s);
    ctx.drawImage(img, fx, fy, sheet.tilew, sheet.tileh, -sheet.tilew / 2, -sheet.tileh / 2, sheet.tilew, sheet.tileh);
    ctx.restore();
  }

  function render() {
    var total = Math.floor(state.simMs / FRAME_MS);
    columns.forEach(function (c) {
      var ctx = c.ctx, k = state.scale;
      ctx.setTransform(c.res, 0, 0, c.res, 0, 0);
      ctx.imageSmoothingEnabled = true; // the game never changes the default
      var L = size(c);
      ctx.fillStyle = c.bg;
      ctx.fillRect(0, 0, L.w, L.h);
      var img = assets[c.img], json = assets[c.json];
      GRID.forEach(function (cell) {
        var cx = (c.gap + cell[0] * c.pitch + c.tile / 2) * k;
        var cy = (c.gap + cell[1] * c.pitch + c.tile / 2) * k;
        if (cell[2] === "startTile") drawTile(ctx, img, json.emptyOperator, 0, cx, cy, c.s * k, 0);
        if (c.id === "orig") {
          var name = ORIG_NAME[cell[2]] || cell[2];
          drawTile(ctx, img, json[name], total % ORIG_FRAMES[cell[2]], cx, cy, c.s * k, cell[3]);
        } else {
          v2Layers(cell[2], cell[4]).forEach(function (s) {
            drawTile(ctx, img, json[s], total % json[s].frames, cx, cy, c.s * k, cell[3]);
          });
        }
      });
    });
    return total;
  }

  var readouts = {};
  var lastReadout = 0, lastTotal = 0, lastTs = 0, fps = NaN;
  function updateReadouts(ts, total) {
    if (ts - lastReadout < 500) return;
    if (lastReadout && state.playing) fps = ((total - lastTotal) * 1000) / (ts - lastTs);
    lastReadout = ts; lastTs = ts; lastTotal = total;
    columns.forEach(function (c) {
      var sp = SPEEDS[c.id];
      readouts[c.id].innerHTML =
        "anim fps   <b>" + (isNaN(fps) ? "…" : fps.toFixed(1)) + "</b>  (25 ms frames)" + (state.playing ? "" : "   (paused)") + "\n" +
        "rotators   <b>" + sp.rot.toFixed(0) + " °/s</b>  (3° per frame, 60 frames per loop)\n" +
        "belt       <b>" + sp.belt.toFixed(2) + " tiles/s</b>  (" + (c.id === "orig" ? "13 px period, 20 frames" : "4 chevrons per tile, 20 frames") + ")\n" +
        "step       <b>" + sp.step.toFixed(2) + " tiles/s</b>  (60 frames per tile)";
    });
  }

  function frame(ts) {
    if (state.lastTs === null) state.lastTs = ts;
    var dt = ts - state.lastTs;
    state.lastTs = ts;
    if (state.playing) state.simMs += dt;
    updateReadouts(ts, render());
    window.requestAnimationFrame(frame);
  }

  function pressGroup(groupId, attr, value) {
    document.querySelectorAll("#" + groupId + " button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute(attr) === String(value)));
    });
  }

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
    });
    window.__demo = { state: state, columns: columns };
  }

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
    assets = { origImg: r[0], origJson: r[1], v2Img: r[2], v2Json: r[3] };
    columns.forEach(function (c) {
      c.canvas = document.getElementById("c-" + c.id);
      c.ctx = c.canvas.getContext("2d");
      readouts[c.id] = document.getElementById("r-" + c.id);
    });
    wire();
    sizeCanvases();
    window.requestAnimationFrame(frame);
  }).catch(function (e) {
    document.querySelector(".columns").textContent = "Failed to load tiles: " + e.message + ". Serve the repository root over HTTP (python3 -m http.server).";
    throw e;
  });
})();
