// Shared helpers for the UI mockups in this folder (design comps, not game code).
// - pixel font: the 5x7 bitmap font from tools/art/lib/font.mjs, drawn to <canvas>
// - pixel icons: 9x9 bitmaps for the transport/menu buttons
// - tiles: real game art (new program tiles, robot c, old atlas) as CSS sprites,
//   animated in phase like Q.syncTileAnimation does in the game.
(function () {
  "use strict";
  const ROOT = "../../../";

  // ---- pixel font (copied from tools/art/lib/font.mjs) ----
  const G = {
    A: "01110 10001 10001 11111 10001 10001 10001",
    B: "11110 10001 10001 11110 10001 10001 11110",
    C: "01110 10001 10000 10000 10000 10001 01110",
    D: "11110 10001 10001 10001 10001 10001 11110",
    E: "11111 10000 10000 11110 10000 10000 11111",
    F: "11111 10000 10000 11110 10000 10000 10000",
    G: "01110 10001 10000 10111 10001 10001 01111",
    H: "10001 10001 10001 11111 10001 10001 10001",
    I: "01110 00100 00100 00100 00100 00100 01110",
    J: "00111 00010 00010 00010 00010 10010 01100",
    K: "10001 10010 10100 11000 10100 10010 10001",
    L: "10000 10000 10000 10000 10000 10000 11111",
    M: "10001 11011 10101 10101 10001 10001 10001",
    N: "10001 10001 11001 10101 10011 10001 10001",
    O: "01110 10001 10001 10001 10001 10001 01110",
    P: "11110 10001 10001 11110 10000 10000 10000",
    Q: "01110 10001 10001 10001 10101 10010 01101",
    R: "11110 10001 10001 11110 10100 10010 10001",
    S: "01111 10000 10000 01110 00001 00001 11110",
    T: "11111 00100 00100 00100 00100 00100 00100",
    U: "10001 10001 10001 10001 10001 10001 01110",
    V: "10001 10001 10001 10001 10001 01010 00100",
    W: "10001 10001 10001 10101 10101 10101 01010",
    X: "10001 10001 01010 00100 01010 10001 10001",
    Y: "10001 10001 01010 00100 00100 00100 00100",
    Z: "11111 00001 00010 00100 01000 10000 11111",
    0: "01110 10001 10011 10101 11001 10001 01110",
    1: "00100 01100 00100 00100 00100 00100 01110",
    2: "01110 10001 00001 00010 00100 01000 11111",
    3: "11111 00010 00100 00010 00001 10001 01110",
    4: "00010 00110 01010 10010 11111 00010 00010",
    5: "11111 10000 11110 00001 00001 10001 01110",
    6: "00110 01000 10000 11110 10001 10001 01110",
    7: "11111 00001 00010 00100 01000 01000 01000",
    8: "01110 10001 10001 01110 10001 10001 01110",
    9: "01110 10001 10001 01111 00001 00010 01100",
    " ": "00000 00000 00000 00000 00000 00000 00000",
    "-": "00000 00000 00000 11111 00000 00000 00000",
    _: "00000 00000 00000 00000 00000 00000 11111",
    ".": "00000 00000 00000 00000 00000 01100 01100",
    ",": "00000 00000 00000 00000 01100 00100 01000",
    ":": "00000 01100 01100 00000 01100 01100 00000",
    "#": "01010 01010 11111 01010 11111 01010 01010",
    "/": "00001 00010 00010 00100 01000 01000 10000",
    "(": "00010 00100 01000 01000 01000 00100 00010",
    ")": "01000 00100 00010 00010 00010 00100 01000",
    "?": "01110 10001 00001 00010 00100 00000 00100",
    $: "00100 01111 10100 01110 00101 11110 00100",
    "+": "00000 00100 00100 11111 00100 00100 00000",
    "=": "00000 00000 11111 00000 11111 00000 00000",
    "'": "00100 00100 01000 00000 00000 00000 00000",
    "!": "00100 00100 00100 00100 00100 00000 00100",
    "<": "00010 00100 01000 10000 01000 00100 00010",
    ">": "01000 00100 00010 00001 00010 00100 01000",
    "*": "00000 00100 10101 01110 10101 00100 00000",
    "&": "01100 10010 10100 01000 10101 10010 01101",
    "@": "01110 10001 10111 10101 10111 10000 01110",
    "%": "11001 11010 00010 00100 01000 01011 10011",
  };
  const GLYPHS = {};
  for (const ch in G) GLYPHS[ch] = G[ch].split(" ");

  function bitmapCanvas(rows, scale, color) {
    const h = rows.length, w = rows[0].length;
    const c = document.createElement("canvas");
    c.width = w * scale; c.height = h * scale;
    const g = c.getContext("2d");
    g.fillStyle = color;
    rows.forEach((row, y) => [...row].forEach((b, x) => { if (b === "1") g.fillRect(x * scale, y * scale, scale, scale); }));
    return c;
  }

  function pxText(text, scale, color) {
    const chars = [...text.toUpperCase()];
    const c = document.createElement("canvas");
    c.width = Math.max(1, (chars.length * 6 - 1) * scale);
    c.height = 7 * scale;
    const g = c.getContext("2d");
    g.fillStyle = color;
    chars.forEach((ch, i) => {
      const rows = GLYPHS[ch] || GLYPHS["?"];
      rows.forEach((row, y) => [...row].forEach((b, x) => {
        if (b === "1") g.fillRect((i * 6 + x) * scale, y * scale, scale, scale);
      }));
    });
    return c;
  }

  // ---- 9x9 pixel icons ----
  const ICONS = {
    play: ["100000000", "111000000", "111110000", "111111100", "111111111", "111111100", "111110000", "111000000", "100000000"],
    pause: ["111000111", "111000111", "111000111", "111000111", "111000111", "111000111", "111000111", "111000111", "111000111"],
    step: ["100000011", "110000011", "111000011", "111100011", "111110011", "111100011", "111000011", "110000011", "100000011"],
    stop: ["111111111", "111111111", "111111111", "111111111", "111111111", "111111111", "111111111", "111111111", "111111111"],
    slower: ["000010001", "000110011", "001110111", "011111111", "111111111", "011111111", "001110111", "000110011", "000010001"],
    faster: ["100010000", "110011000", "111011100", "111111110", "111111111", "111111110", "111011100", "110011000", "100010000"],
    help: ["011111100", "110000110", "000000110", "000001100", "000011000", "000110000", "000110000", "000000000", "000110000"],
    levels: ["110110110", "110110110", "000000000", "110110110", "110110110", "000000000", "110110110", "110110110", "000000000"],
    back: ["000100000", "001100000", "011111111", "111111111", "011111111", "001100000", "000100000", "000000000", "000000000"],
    trash: ["001111100", "111111111", "000000000", "011111110", "010101010", "010101010", "010101010", "010101010", "001111100"],
    start: ["110000000", "011000000", "001100000", "000110000", "000011000", "000110000", "001100000", "011000000", "110000000"],
    lock: ["001111100", "010000010", "010000010", "111111111", "111101111", "111000111", "111101111", "111111111", "000000000"],
  };

  // ---- sprite sources ----
  const NEW = ROOT + "images/tiles/program-tiles.png"; // 1250x350, data/program-tiles.json
  const OLD = ROOT + "images/sprytszyt.png"; // 2000x1830, data/sprites.json
  const SHEETS = {
    // new Toybox program tiles: [sy, frames, perRow]
    conveyor: { src: NEW, w: 1250, h: 350, sx: 0, sy: 0, frames: 25 },
    step: { src: NEW, w: 1250, h: 350, sx: 0, sy: 50, frames: 25 },
    cw: { src: NEW, w: 1250, h: 350, sx: 0, sy: 100, frames: 50 },
    ccw: { src: NEW, w: 1250, h: 350, sx: 0, sy: 200, frames: 50 },
    empty: { src: NEW, w: 1250, h: 350, sx: 0, sy: 300, frames: 1 },
    // old atlas (frame 0 only)
    incRed: { src: OLD, w: 2000, h: 1830, sx: 0, sy: 450, frames: 1, old: true },
    decRed: { src: OLD, w: 2000, h: 1830, sx: 1000, sy: 500, frames: 1, old: true },
    detector: { src: OLD, w: 2000, h: 1830, sx: 1000, sy: 100, frames: 1, old: true },
    obstacle: { src: OLD, w: 2000, h: 1830, sx: 1650, sy: 50, frames: 1, old: true },
    hatch: { src: OLD, w: 2000, h: 1830, sx: 0, sy: 1110, frames: 1, old: true },
    trap: { src: OLD, w: 2000, h: 1830, sx: 0, sy: 1260, frames: 1, old: true },
    floor: { src: ROOT + "images/robotile.png", w: 50, h: 50, sx: 0, sy: 0, frames: 1, old: true },
    robot: { src: ROOT + "art/sets/robot-v1/game/robot-front-c-50.png", w: 50, h: 50, sx: 0, sy: 0, frames: 1 },
  };
  const DIR = { E: 0, S: 90, W: 180, N: 270 };
  const animated = [];

  function tile(kind, size, dir) {
    const s = SHEETS[kind];
    const k = size / 50;
    const el = document.createElement("div");
    el.className = "tile tile-" + kind + (s.old ? " old-art" : "");
    el.style.width = el.style.height = size + "px";
    el.style.backgroundImage = "url(" + s.src + ")";
    el.style.backgroundSize = s.w * k + "px " + s.h * k + "px";
    el.style.imageRendering = Number.isInteger(k) || k < 1 ? "pixelated" : "auto";
    if (dir) el.style.transform = "rotate(" + DIR[dir] + "deg)";
    el._s = s; el._k = k;
    setFrame(el, 0);
    if (s.frames > 1) animated.push(el);
    return el;
  }
  function setFrame(el, f) {
    const s = el._s, k = el._k;
    const fr = f % s.frames;
    const x = s.sx + (fr % 25) * 50, y = s.sy + Math.floor(fr / 25) * 50;
    el.style.backgroundPosition = -x * k + "px " + -y * k + "px";
  }
  // one global clock: 0.04 s per frame (see docs/art/classes/program-tiles.md)
  function tick() {
    const F = Math.floor(Date.now() / 40);
    for (const el of animated) setFrame(el, F);
  }
  const still = /[?&]still\b/.test(location.search);
  if (!still) setInterval(tick, 40);

  // ---- board / world builders ----
  // program: list of [x, y, kind, dir]
  function board(el, n, size, program) {
    el.style.position = "relative";
    el.style.width = el.style.height = n * size + "px";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const t = tile("empty", size);
      t.style.position = "absolute"; t.style.left = x * size + "px"; t.style.top = y * size + "px";
      el.appendChild(t);
    }
    for (const [x, y, kind, dir] of program) {
      const t = tile(kind, size, dir);
      t.style.position = "absolute"; t.style.left = x * size + "px"; t.style.top = y * size + "px";
      t.dataset.cell = x + "," + y;
      el.appendChild(t);
    }
  }
  // cells: rows of chars: . floor, # obstacle, H hatch, T trap, R robot on floor
  function world(el, rows, size) {
    el.style.position = "relative";
    el.style.width = rows[0].length * size + "px";
    el.style.height = rows.length * size + "px";
    rows.forEach((row, y) => [...row].forEach((c, x) => {
      const place = (kind) => {
        const t = tile(kind, size);
        t.style.position = "absolute"; t.style.left = x * size + "px"; t.style.top = y * size + "px";
        el.appendChild(t);
        return t;
      };
      place(c === "#" ? "obstacle" : c === "H" ? "hatch" : c === "T" ? "trap" : "floor");
      if (c === "R") place("robot").classList.add("robot");
    }));
  }

  // ---- auto-render [data-px] and [data-icon] ----
  function render(root) {
    root.querySelectorAll("[data-px]").forEach((el) => {
      const scale = +el.dataset.px || 2;
      const color = el.dataset.color || getComputedStyle(el).color;
      const text = el.textContent.trim();
      el.setAttribute("aria-label", text);
      el.textContent = "";
      el.appendChild(pxText(text, scale, color));
    });
    root.querySelectorAll("[data-icon]").forEach((el) => {
      const scale = +el.dataset.scale || 2;
      const color = el.dataset.color || getComputedStyle(el).color;
      el.appendChild(bitmapCanvas(ICONS[el.dataset.icon], scale, color));
    });
    root.querySelectorAll("[data-tile]").forEach((el) => {
      const [kind, size, dir] = el.dataset.tile.split(" ");
      el.appendChild(tile(kind, +size, dir));
    });
  }

  window.Comp = { pxText, bitmapCanvas, ICONS, tile, board, world, render, ROOT };
})();
