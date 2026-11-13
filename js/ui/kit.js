// Toybox UI kit: the stage that holds the Quintus canvas and two HTML layers,
// responsive layout modes, and small builders for cards, buttons, pixel text,
// icons and popups. API: docs/ui/UI_KIT.md. Styles: css/toybox.css.
//
// Layering inside #tg-stage (all in logical canvas pixels, scaled as a whole):
//   #tg-under  card backgrounds, drawn below the canvas
//   canvas     the Quintus game (transparent where nothing is drawn)
//   #tg-over   text, buttons and other HTML above the canvas
//   #tg-modal  HTML popups and overlays above everything
(function () {
  "use strict";

  var UI = {};
  t.UI = UI;

  // ---- breakpoints (shared by every screen) ----
  UI.breakpoints = {
    // window aspect (width / height) below which the portrait layout is used
    portraitBelow: 0.8,
    landscape: { w: 1024, h: 768 },
    portrait: { w: 540, minH: 900, maxH: 1300 },
    // the size legacy (not yet responsive) scenes are drawn for
    legacy: { w: 1024, h: 768 },
  };

  UI.mode = "landscape";
  UI.w = 1024;
  UI.h = 768;
  UI.scale = 1; // CSS px per logical px
  UI.kx = UI.ky = 1; // backing-store px per logical px

  var listeners = {};
  UI.on = function (evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); };
  UI.off = function (evt, fn) {
    var l = listeners[evt]; if (!l) return;
    var i = l.indexOf(fn); if (i >= 0) l.splice(i, 1);
  };
  UI.emit = function (evt, data) {
    (listeners[evt] || []).slice().forEach(function (fn) { fn(data); });
  };

  function viewportSize() {
    var vv = window.visualViewport;
    return { w: vv ? vv.width : window.innerWidth, h: vv ? vv.height : window.innerHeight };
  }

  UI.modeFor = function (w, h) {
    return w / h < UI.breakpoints.portraitBelow ? "portrait" : "landscape";
  };

  // The logical size a screen gets by default in a mode for the current window.
  UI.defaultSize = function (mode) {
    var b = UI.breakpoints;
    if ((mode || UI.mode) === "landscape") return { w: b.landscape.w, h: b.landscape.h };
    var v = viewportSize();
    var h = Math.round(b.portrait.w * v.h / v.w);
    return { w: b.portrait.w, h: Math.max(b.portrait.minH, Math.min(b.portrait.maxH, h)) };
  };

  // Play a sound effect if the audio module (js/audio.js) is loaded.
  UI.sfx = function (name) { if (t.Sfx && t.Sfx.play) t.Sfx.play(name); };

  // ---- DOM helpers ----
  UI.el = function (tag, cls, parent, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  UI.place = function (e, r) {
    e.style.left = r.x + "px";
    e.style.top = r.y + "px";
    if (r.w !== undefined) e.style.width = r.w + "px";
    if (r.h !== undefined) e.style.height = r.h + "px";
    return e;
  };

  // ---- pixel font (5x7, from tools/art/lib/font.mjs) and 9x9 icons ----
  var G = {
    A: "01110 10001 10001 11111 10001 10001 10001", B: "11110 10001 10001 11110 10001 10001 11110",
    C: "01110 10001 10000 10000 10000 10001 01110", D: "11110 10001 10001 10001 10001 10001 11110",
    E: "11111 10000 10000 11110 10000 10000 11111", F: "11111 10000 10000 11110 10000 10000 10000",
    G: "01110 10001 10000 10111 10001 10001 01111", H: "10001 10001 10001 11111 10001 10001 10001",
    I: "01110 00100 00100 00100 00100 00100 01110", J: "00111 00010 00010 00010 00010 10010 01100",
    K: "10001 10010 10100 11000 10100 10010 10001", L: "10000 10000 10000 10000 10000 10000 11111",
    M: "10001 11011 10101 10101 10001 10001 10001", N: "10001 10001 11001 10101 10011 10001 10001",
    O: "01110 10001 10001 10001 10001 10001 01110", P: "11110 10001 10001 11110 10000 10000 10000",
    Q: "01110 10001 10001 10001 10101 10010 01101", R: "11110 10001 10001 11110 10100 10010 10001",
    S: "01111 10000 10000 01110 00001 00001 11110", T: "11111 00100 00100 00100 00100 00100 00100",
    U: "10001 10001 10001 10001 10001 10001 01110", V: "10001 10001 10001 10001 10001 01010 00100",
    W: "10001 10001 10001 10101 10101 10101 01010", X: "10001 10001 01010 00100 01010 10001 10001",
    Y: "10001 10001 01010 00100 00100 00100 00100", Z: "11111 00001 00010 00100 01000 10000 11111",
    0: "01110 10001 10011 10101 11001 10001 01110", 1: "00100 01100 00100 00100 00100 00100 01110",
    2: "01110 10001 00001 00010 00100 01000 11111", 3: "11111 00010 00100 00010 00001 10001 01110",
    4: "00010 00110 01010 10010 11111 00010 00010", 5: "11111 10000 11110 00001 00001 10001 01110",
    6: "00110 01000 10000 11110 10001 10001 01110", 7: "11111 00001 00010 00100 01000 01000 01000",
    8: "01110 10001 10001 01110 10001 10001 01110", 9: "01110 10001 10001 01111 00001 00010 01100",
    " ": "00000 00000 00000 00000 00000 00000 00000", "-": "00000 00000 00000 11111 00000 00000 00000",
    _: "00000 00000 00000 00000 00000 00000 11111", ".": "00000 00000 00000 00000 00000 01100 01100",
    ",": "00000 00000 00000 00000 01100 00100 01000", ":": "00000 01100 01100 00000 01100 01100 00000",
    "#": "01010 01010 11111 01010 11111 01010 01010", "/": "00001 00010 00010 00100 01000 01000 10000",
    "(": "00010 00100 01000 01000 01000 00100 00010", ")": "01000 00100 00010 00010 00010 00100 01000",
    "?": "01110 10001 00001 00010 00100 00000 00100", $: "00100 01111 10100 01110 00101 11110 00100",
    "+": "00000 00100 00100 11111 00100 00100 00000", "=": "00000 00000 11111 00000 11111 00000 00000",
    "'": "00100 00100 01000 00000 00000 00000 00000", "!": "00100 00100 00100 00100 00100 00000 00100",
    "<": "00010 00100 01000 10000 01000 00100 00010", ">": "01000 00100 00010 00001 00010 00100 01000",
    "*": "00000 00100 10101 01110 10101 00100 00000", "&": "01100 10010 10100 01000 10101 10010 01101",
    "@": "01110 10001 10111 10101 10111 10000 01110", "%": "11001 11010 00010 00100 01000 01011 10011",
  };
  UI.ICONS = {
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
    close: ["110000011", "111000111", "011101110", "001111100", "000111000", "001111100", "011101110", "111000111", "110000011"],
    undo: ["001100000", "011100000", "111111110", "111111111", "011100011", "001100011", "000000011", "011111111", "011111110"],
    sound: ["000010000", "000110010", "111110001", "111110101", "111110101", "111110101", "111110001", "000110010", "000010000"],
    mute: ["000010000", "000110000", "111110000", "111110101", "111110010", "111110101", "111110000", "000110000", "000010000"],
    music: ["000111111", "000111111", "000100001", "000100001", "000100001", "000100001", "011100111", "111101111", "011100111"],
    "music-off": ["000110000", "000111000", "000101100", "000100100", "000100000", "011100101", "111100010", "111100101", "011000000"],
    info: ["000110000", "000110000", "000000000", "001110000", "000110000", "000110000", "000110000", "000110000", "001111000"],
    check: ["000000000", "000000011", "000000111", "000001110", "110011100", "111111000", "011110000", "001100000", "000000000"],
    look: ["111111111", "100000001", "101100001", "100000001", "101111001", "100000001", "111111111", "000111000", "011111110"],
  };

  var SVGNS = "http://www.w3.org/2000/svg";
  function bitmapSvg(rows, cellW, scale, cls) {
    var h = rows.length, w = rows[0].length, d = "";
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) if (rows[y].charAt(x) === "1") d += "M" + x + " " + y + "h1v1h-1z";
    }
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("width", w * scale);
    svg.setAttribute("height", h * scale);
    svg.setAttribute("class", cls);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("shape-rendering", "crispEdges");
    var path = document.createElementNS(SVGNS, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
    return svg;
  }

  // Pixel-font text as inline SVG (scales crisply with the stage).
  UI.px = function (text, scale) {
    var chars = String(text).toUpperCase().split("");
    var rows = ["", "", "", "", "", "", ""];
    chars.forEach(function (ch, i) {
      var g = (G[ch] || G["?"]).split(" ");
      for (var y = 0; y < 7; y++) rows[y] += g[y] + (i < chars.length - 1 ? "0" : "");
    });
    if (!rows[0]) rows = ["0", "0", "0", "0", "0", "0", "0"];
    var svg = bitmapSvg(rows, 6, scale || 2, "tb-px");
    svg.setAttribute("role", "img");
    svg.removeAttribute("aria-hidden");
    svg.setAttribute("aria-label", text);
    return svg;
  };
  UI.pxWidth = function (text, scale) { return (String(text).length * 6 - 1) * (scale || 2); };
  UI.icon = function (name, scale) { return bitmapSvg(UI.ICONS[name], 9, scale || 3, "tb-icon"); };

  // A button: {label, px (pixel-text scale, else plain text), icon, iconScale, cls, title, onClick}
  UI.button = function (o, parent) {
    var b = UI.el("button", "tb-btn " + (o.cls || ""), parent);
    b.type = "button";
    if (o.icon) b.appendChild(UI.icon(o.icon, o.iconScale || 3));
    if (o.label) {
      if (o.px) b.appendChild(UI.px(o.label, o.px));
      else UI.el("span", "", b, o.label);
    }
    if (o.small) UI.el("small", "", b, o.small);
    var name = o.title || o.label;
    if (name) { b.title = name; b.setAttribute("aria-label", name); }
    if (o.onClick) b.addEventListener("click", function (e) {
      if (b.disabled) return;
      if (o.sound !== false) UI.sfx(o.sound || "click");
      o.onClick(e);
    });
    return b;
  };
  UI.tag = function (text, cls, parent) {
    var tg = UI.el("div", "tb-tag " + (cls || ""), parent);
    tg.appendChild(UI.px(text, 2));
    return tg;
  };

  // A card: background in the under-layer, content box in the over-layer, same rect.
  UI.card = function (r, cls, o) {
    o = o || {};
    var bg = UI.place(UI.el("div", "tb-card " + (cls || ""), UI.under), r);
    var el = UI.place(UI.el("div", "tb-content " + (o.contentCls || ""), UI.over), r);
    if (o.tag) UI.tag(o.tag, o.tagCls, el);
    return { bg: bg, el: el, rect: r };
  };

  // ---- modal stack (HTML popups, help overlay) with focus trap ----
  var modals = [];
  UI.modalOpen = function () { return modals.length > 0; };
  UI.openModal = function (node, o) {
    o = o || {};
    var m = { node: node, onClose: o.onClose, prevFocus: document.activeElement };
    modals.push(m);
    UI.modal.appendChild(node);
    UI.over.classList.add("tg-dimmed");
    var f = node.querySelector("[autofocus]") || node.querySelector("button, a[href]");
    if (f) setTimeout(function () { f.focus(); }, 0);
    m.close = function () {
      var i = modals.indexOf(m);
      if (i < 0) return;
      modals.splice(i, 1);
      if (node.parentNode) node.parentNode.removeChild(node);
      if (!modals.length && !canvasModals) UI.over.classList.remove("tg-dimmed");
      if (m.prevFocus && m.prevFocus.focus) try { m.prevFocus.focus(); } catch (e) {}
      if (m.onClose) m.onClose();
    };
    return m;
  };
  UI.closeModal = function () { if (modals.length) modals[modals.length - 1].close(); };

  // Popup card: {title, body (node or text), actions:[{label, cls, onClick}], w, x, y, onClose, backdropCloses}
  UI.popup = function (o) {
    var wrap = UI.el("div", "tb-modal-wrap");
    wrap.style.position = "absolute";
    wrap.style.inset = "0";
    var back = UI.el("div", "tb-backdrop", wrap);
    var box = UI.el("div", "tb-popup", wrap);
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    var w = Math.min(o.w || 460, UI.w - 32);
    box.style.width = w + "px";
    box.style.left = (o.x !== undefined ? o.x : (UI.w - w) / 2) + "px";
    if (o.title) { UI.tag(o.title, o.tagCls || "", box); box.setAttribute("aria-label", o.title); }
    if (o.body) {
      if (typeof o.body === "string") UI.el("p", "", box, o.body);
      else box.appendChild(o.body);
    }
    var m;
    if (o.actions && o.actions.length) {
      var row = UI.el("div", "tb-actions", box);
      o.actions.forEach(function (a) {
        UI.button({ label: a.label, cls: a.cls, onClick: function () { m.close(); if (a.onClick) a.onClick(); } }, row);
      });
    }
    UI.button({ icon: "close", iconScale: 2, cls: "sm round tb-close tomato", title: "Close", onClick: function () { m.close(); } }, box);
    if (o.backdropCloses !== false) back.addEventListener("click", function () { m.close(); });
    m = UI.openModal(wrap, { onClose: o.onClose });
    // vertical placement once the browser has measured the box
    var hgt = box.offsetHeight;
    box.style.top = (o.y !== undefined ? o.y : Math.max(24, (UI.h - hgt) / 2)) + "px";
    m.box = box;
    return m;
  };

  // A popup whose content is drawn in the canvas (Quintus stage) dims the HTML above it.
  var canvasModals = 0;
  UI.canvasModal = function (on) {
    canvasModals = Math.max(0, canvasModals + (on ? 1 : -1));
    if (canvasModals || modals.length) UI.over.classList.add("tg-dimmed");
    else UI.over.classList.remove("tg-dimmed");
  };

  document.addEventListener("keydown", function (e) {
    if (!modals.length) return;
    var top = modals[modals.length - 1];
    if (e.key === "Escape") { e.preventDefault(); top.close(); return; }
    if (e.key === "Tab") {
      var f = top.node.querySelectorAll("button:not([disabled]), a[href]");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!top.node.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });

  // ---- coordinates ----
  // Client (CSS) coordinates to logical canvas coordinates.
  UI.toLogical = function (clientX, clientY) {
    var r = UI.stageEl.getBoundingClientRect();
    return { x: (clientX - r.left) * UI.w / r.width, y: (clientY - r.top) * UI.h / r.height };
  };

  // ---- sizing ----
  UI.setSize = function (w, h) {
    UI.w = w; UI.h = h;
    var Q = UI.Q;
    Q.width = w; Q.height = h; Q.cssWidth = w; Q.cssHeight = h;
    Q.el.style.width = w + "px";
    Q.el.style.height = h + "px";
    UI.stageEl.style.width = w + "px";
    UI.stageEl.style.height = h + "px";
    UI.fit();
  };

  // A scene declared {scroll: true} that is taller than the window at full
  // width is fitted to the window width and the page scrolls vertically
  // (portrait only: landscape screens always fit the window).
  UI.scrollable = false;
  UI.scrolling = false;
  UI.fit = function () {
    var v = viewportSize();
    var s = Math.min(v.w / UI.w, v.h / UI.h);
    var scroll = UI.scrollable && UI.mode === "portrait" && UI.h * v.w / UI.w > v.h + 1;
    if (scroll) s = v.w / UI.w;
    UI.scale = s;
    var st = UI.stageEl.style;
    st.transform = "scale(" + s + ")";
    st.left = scroll ? "0px" : Math.round((v.w - UI.w * s) / 2) + "px";
    st.top = scroll ? "0px" : Math.round((v.h - UI.h * s) / 2) + "px";
    if (scroll !== UI.scrolling) {
      UI.scrolling = scroll;
      document.documentElement.classList.toggle("tg-scroll", scroll);
      if (!scroll) window.scrollTo(0, 0);
    }
    document.body.style.height = scroll ? Math.ceil(UI.h * s) + "px" : "";
    var dpr = window.devicePixelRatio || 1;
    var k = Math.min(s * dpr, 4096 / UI.w, 4096 / UI.h);
    var bw = Math.max(1, Math.round(UI.w * k)), bh = Math.max(1, Math.round(UI.h * k));
    var c = UI.Q.el;
    if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; }
    UI.kx = bw / UI.w; UI.ky = bh / UI.h;
  };

  // ---- scenes: which layouts each Quintus scene supports ----
  // decl: {responsive: true} for scenes that lay themselves out in both modes;
  // otherwise the scene is drawn for 1024x768 and fitted with a stage viewport.
  // covers: true hides the HTML layers while the (canvas) scene is shown.
  // restage: function to rebuild the screen after a mode change.
  var decls = {};
  UI.scene = function (name, decl) { decls[name] = decl || {}; };
  UI.sceneDecl = function (name) { return decls[name] || {}; };
  UI.base = null; // {name, options} of the scene on stage 0
  var covering = {};

  function sceneName(Q, scene) {
    if (typeof scene === "string") return scene;
    for (var n in Q.scenes) if (Q.scenes[n] === scene) return n;
    return "";
  }

  UI.clearScreen = function () {
    UI.under.innerHTML = "";
    UI.over.innerHTML = "";
    while (modals.length) modals[modals.length - 1].close();
    UI.modal.innerHTML = "";
    canvasModals = 0;
    covering = {};
    UI.under.classList.remove("tg-covered");
    UI.over.classList.remove("tg-covered", "tg-dimmed");
    UI.over.className = "tg-layer";
    UI.emit("screenclear");
  };

  function updateCover() {
    var any = false;
    for (var k in covering) if (covering[k]) any = true;
    UI.under.classList.toggle("tg-covered", any);
    UI.over.classList.toggle("tg-covered", any);
  }

  function fitLegacy(stage) {
    var L = UI.breakpoints.legacy;
    if (UI.w === L.w && UI.h === L.h) return;
    stage.add("viewport");
    stage.viewport.scale = Math.min(UI.w / L.w, UI.h / L.h);
    stage.centerOn(L.w / 2, L.h / 2);
  }

  function wrapQuintus(Q) {
    var origStage = Q.stageScene, origClear = Q.clearStage, origClearAll = Q.clearStages;
    Q.stageScene = function (scene, num, options) {
      var name = sceneName(Q, scene);
      var decl = UI.sceneDecl(name);
      var idx = typeof num === "number" ? num : (num && typeof num === "object" ? (num.stage || 0) : 0);
      if (idx === 0) {
        UI.clearScreen();
        UI.base = { name: name, num: num, options: options };
        var wasScrollable = UI.scrollable;
        UI.scrollable = !!decl.scroll;
        var d = UI.defaultSize();
        if (!decl.responsive) d = UI.mode === "landscape" ? UI.breakpoints.legacy : d;
        if (d.w !== UI.w || d.h !== UI.h) UI.setSize(d.w, d.h);
        else if (wasScrollable !== UI.scrollable) UI.fit();
      }
      var legacy = !decl.responsive, saveW = Q.width, saveH = Q.height;
      if (legacy) { Q.width = UI.breakpoints.legacy.w; Q.height = UI.breakpoints.legacy.h; }
      var stage;
      try { stage = origStage.apply(Q, arguments); }
      finally { if (legacy) { Q.width = saveW; Q.height = saveH; } }
      if (legacy && stage) fitLegacy(stage);
      if (decl.covers && idx > 0) {
        covering[idx] = true; updateCover();
        // wash out whatever the overlay does not cover (portrait bands)
        if (stage && Q.Dimmer) stage.insert(new Q.Dimmer({ alpha: 0.9, z: -1000 }));
      }
      UI.emit("staged", { name: name, num: idx, stage: stage });
      return stage;
    };
    Q.clearStage = function (num) {
      var r = origClear.apply(Q, arguments);
      if (covering[num]) { covering[num] = false; updateCover(); }
      UI.emit("stagecleared", { num: num });
      return r;
    };
    Q.clearStages = function () {
      var r = origClearAll.apply(Q, arguments);
      covering = {}; updateCover();
      UI.emit("stagecleared", { num: "all" });
      return r;
    };
    // Every frame starts from the backing-store scale, so sprites draw in logical px.
    Q.clear = function () {
      var c = Q.ctx;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = 1;
      c.clearRect(0, 0, Q.el.width, Q.el.height);
      c.setTransform(UI.kx, 0, 0, UI.ky, 0, 0);
    };
  }

  // Rebuild the base screen after the layout mode changed.
  UI.restage = function () {
    var b = UI.base;
    if (!b) return;
    var decl = UI.sceneDecl(b.name);
    if (decl.restage) { decl.restage(); return; }
    UI.Q.clearStages();
    UI.Q.stageScene(b.name, b.num, b.options);
  };

  var resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var v = viewportSize();
      var m = UI.modeFor(v.w, v.h);
      if (m !== UI.mode) {
        UI.mode = m;
        document.body.classList.toggle("tg-portrait", m === "portrait");
        UI.emit("modechange", m);
        UI.restage();
      } else UI.fit();
    }, 120);
  }

  // ---- loading card ----
  var loadEl = null, loadBar = null;
  UI.loading = function (progress) {
    if (!loadEl) {
      loadEl = UI.el("div", "tb-popup tb-loading", UI.modal);
      loadEl.appendChild(UI.px("Turing", 6));
      UI.el("div", "gs-hint", loadEl, "Warming up the robots...").style.marginTop = "10px";
      var bar = UI.el("div", "tb-bar", loadEl);
      loadBar = UI.el("i", "", bar);
    }
    loadBar.style.width = Math.round(Math.max(0, Math.min(1, progress)) * 100) + "%";
  };
  UI.loaded = function () {
    if (loadEl && loadEl.parentNode) loadEl.parentNode.removeChild(loadEl);
    loadEl = null;
  };

  // ---- init: call right after Q.setup() ----
  UI.init = function (Q) {
    UI.Q = Q;
    document.body.classList.add("tg");
    var stage = UI.el("div", "", document.body);
    stage.id = "tg-stage";
    UI.stageEl = stage;
    UI.under = UI.el("div", "tg-layer", stage); UI.under.id = "tg-under";
    stage.appendChild(Q.el);
    UI.over = UI.el("div", "tg-layer", stage); UI.over.id = "tg-over";
    UI.modal = UI.el("div", "tg-layer", stage); UI.modal.id = "tg-modal";
    if (Q.wrapper && Q.wrapper !== stage && Q.wrapper.parentNode) Q.wrapper.parentNode.removeChild(Q.wrapper);
    Q.wrapper = stage;
    Q.el.style.boxShadow = "none";
    var v = viewportSize();
    UI.mode = UI.modeFor(v.w, v.h);
    document.body.classList.toggle("tg-portrait", UI.mode === "portrait");
    wrapQuintus(Q);
    var d = UI.defaultSize();
    UI.setSize(d.w, d.h);
    window.addEventListener("resize", onResize);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", onResize);
    // the canvas never shows a context menu (right-click rotates tiles)
    Q.el.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    return UI;
  };
})();
