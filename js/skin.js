// Skins (epic tg-wtv): the same game in two looks, "toybox" (the default) and
// "retro" (green-on-black terminal). Loaded first in index.html, right after
// the version script, so <html data-skin> is set before the first paint and
// every asset URL can be mapped per skin. Docs: docs/ui/UI_KIT.md ("Skins").
//
//   t.Skin.id                 "toybox" | "retro" for this page load
//   t.Skin.chosen             true once the player picked a look (or ?skin=)
//   t.Skin.set(id, {returnTo}) save the choice; reloads when the look changes
//   t.Skin.takeReturn()       the scene a look change asked to reopen, once
//   t.Skin.register(id, map)  add asset variants: {"images/a.png": "images/retro/a.png"}
//   t.Skin.variants           {toybox: {...}, retro: {...}} path -> skin path
//   t.Skin.asset(url)         url mapped through this skin's variants (?v= kept)
//   t.Skin.token(name)        a canvas / JS colour or value for this skin
//   t.Skin.color(name)        alias of token, for colours
//   t.Skin.rgb(name)          "r,g,b" of a colour token, for rgba() with alpha
//   t.Skin.font(css)          a canvas font string in this skin's type
//
// CSS: toybox tokens live on :root in css/toybox.css; retro overrides them
// under :root[data-skin="retro"] in css/retro.css. Canvas code cannot read
// CSS cheaply every frame, so its colours are the tokens below (keep them in
// step with the CSS). ?skin=retro or ?skin=toybox in the URL picks a look for
// one page load without saving it.
(function(global) {
  "use strict";
  var t = (global.t = global.t || {});
  var KEY = "turing.skin";
  var RETURN_KEY = "turing.skin.return";	// sessionStorage, one reload only
  var IDS = ["toybox", "retro"];

  function read() {
    try { return global.localStorage.getItem(KEY); } catch(e) { return null; }
  }
  function write(id) {
    try { global.localStorage.setItem(KEY, id); return true; } catch(e) { return false; }
  }
  function valid(id) { return IDS.indexOf(id) >= 0; }

  var forced = null;
  try {
    var m = /[?&]skin=([a-z]+)/.exec(global.location.search);
    if(m && valid(m[1])) forced = m[1];
  } catch(e) {}
  var saved = read();
  var id = forced || (valid(saved) ? saved : "toybox");

  // ---- canvas / JS tokens (CSS has its own, same values) ----
  var MONO = '"SF Mono", Menlo, Consolas, "Liberation Mono", "Courier New", monospace';
  var TOKENS = {
    toybox: {
      ink: "#2a2335",            // line art and text on canvas
      casing: "#2a2335",         // dark outline under a bright stroke
      sun: "#f6c445",            // highlight fill (marker, lit exits, arrows)
      tomato: "#ec5b45",         // selected tray tile ring
      cream: "#fff4dc",          // light ring / text on a coloured chip
      board: "#a3d9b1",          // program board (.gs-board-frame)
      boardHalo: "rgba(255,255,255,0.35)",
      window: "#f7e7c6",         // robot window (.gs-win)
      lcd: "#2a2335",            // counter LCD face
      lcdBezel: "#3b3349",
      exitOff: "rgba(42,35,53,0.35)",
      labelOff: "rgba(42,35,53,0.7)",
      panelWash: "rgba(255,244,220,0.32)",
      dropWash: "rgba(255,244,220,0.55)",
      dragShadow: "rgba(42,35,53,0.35)",
      dim: "#2a2335",            // canvas wash behind overlays (Q.Dimmer)
      markerHalo: "rgba(255,244,220,0.9)",
      markerLine: "rgb(42,35,53)",
      markerStar: "rgb(246,196,69)",
      markerStarLine: "rgb(42,35,53)",
      markerDot: "rgb(255,255,255)",
      lineArt: false,            // code-drawn effects: toy fills (false) or phosphor line art (true)
      // robot sense / bump effects (utilitySprites.js Q.RoboFx)
      fxWall: "#ec5b45", fxClear: "#58d68d", fxMagic: "#4fb4ff", fxPlain: "#fff1c9", fxSpark: "#ffffff",
      // counter dials (game meaning: keep the six apart)
      counters: {
        Red: { chip: "#ec5b45", lcd: "#ff7a63" }, Blue: { chip: "#2d86b5", lcd: "#7fd6f7" },
        Green: { chip: "#5fae7b", lcd: "#a3d9b1" }, Purple: { chip: "#9b6bd6", lcd: "#c9a6f2" },
        Yellow: { chip: "#d89a2b", lcd: "#f6c445" }, Pink: { chip: "#e0607f", lcd: "#f7a3bd" }
      },
      confetti: ["#ec5b45", "#5ec4ee", "#f6c445", "#a3d9b1", "#9b6bd6", "#f27a9b"],
      themeColor: "#e6bf86",
      // the score (js/music.js): one track loops, several play in turn forever
      music: ["music/clockwork-puzzle.m4a"],
      mono: MONO
    },
    retro: {
      ink: "#33ff66",
      casing: "#030805",
      sun: "#ffb000",
      tomato: "#ffb000",
      cream: "#b6ffc8",
      board: "#0c2a33",          // solder mask (tools/art/tiles/program-tiles.mjs RETRO_BOARD.mask)
      boardHalo: "rgba(120,220,240,0.10)",
      window: "#1a2634",         // robot cell floor (tools/art/tiles/robot-cell.mjs RETRO.floor)
      lcd: "#05080b",
      lcdBezel: "#2b3a4a",
      exitOff: "rgba(51,255,102,0.30)",
      labelOff: "rgba(51,255,102,0.55)",
      panelWash: "rgba(51,255,102,0.06)",
      dropWash: "rgba(51,255,102,0.18)",
      dragShadow: "rgba(51,255,102,0.55)",
      dim: "#010402",
      // the program marker: the brightest thing on the board (hot white-yellow)
      markerHalo: "rgba(4,16,20,0.88)",
      markerLine: "#fff6c8",
      markerStar: "#ffd23a",
      markerStarLine: "#041014",
      markerDot: "#ffffff",
      lineArt: true,
      fxWall: "#ff5c4d", fxClear: "#33ff66", fxMagic: "#4cc8ff", fxPlain: "#b6ffc8", fxSpark: "#e8ffee",
      // tinted phosphors: dark chip, the colour in the text and the digits
      counters: {
        Red: { chip: "#2b0c09", lcd: "#ff5c4d", text: "#ff5c4d" },
        Blue: { chip: "#062130", lcd: "#4cc8ff", text: "#4cc8ff" },
        Green: { chip: "#062a11", lcd: "#33ff66", text: "#33ff66" },
        Purple: { chip: "#1f0f30", lcd: "#c48bff", text: "#c48bff" },
        Yellow: { chip: "#2a2205", lcd: "#ffe14a", text: "#ffe14a" },
        Pink: { chip: "#2e0b1d", lcd: "#ff7ab8", text: "#ff7ab8" }
      },
      confetti: ["#33ff66", "#b6ffc8", "#ffb000", "#22c94f", "#4cc8ff", "#33ff66"],
      themeColor: "#07130d",
      music: ["music/hypnotic-loop.m4a", "music/terminal-bleeps.m4a"],
      mono: MONO
    }
  };

  function hexRgb(c) {
    var h = /^#([0-9a-f]{6})$/i.exec(c);
    if(h) { var v = parseInt(h[1], 16); return ((v >> 16) & 255) + "," + ((v >> 8) & 255) + "," + (v & 255); }
    var r = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(c);
    return r ? r[1] + "," + r[2] + "," + r[3] : "0,0,0";
  }

  // path -> skin path; keys ending in "/" map a whole folder
  var variants = { toybox: {}, retro: {} };

  function splitUrl(url) {
    var i = url.search(/[?#]/);
    return i < 0 ? { path: url, rest: "" } : { path: url.slice(0, i), rest: url.slice(i) };
  }
  // A same-origin absolute URL becomes a path relative to the page.
  function relPath(path) {
    if(!/^[a-z]+:\/\//i.test(path)) return { pre: "", path: path.replace(/^\.\//, "") };
    try {
      var base = global.location.href.replace(/[?#].*$/, "").replace(/[^\/]*$/, "");
      if(path.indexOf(base) === 0) return { pre: base, path: path.slice(base.length) };
    } catch(e) {}
    return null;
  }

  var Skin = t.Skin = {
    ids: IDS.slice(),
    names: { toybox: "Toybox", retro: "Retro hacker chic" },
    KEY: KEY,
    id: id,
    chosen: !!forced || valid(saved),
    forced: !!forced,
    variants: variants,

    // Save the look. Changing it reloads the page (assets and styles are
    // per page load); keeping it just records the choice. Returns true when
    // a reload is on its way. opts.returnTo: the scene to open after the
    // reload (read once by script.js through takeReturn()).
    set: function(next, opts) {
      if(!valid(next)) return false;
      write(next);
      Skin.chosen = true;
      if(next === Skin.id && !Skin.forced) return false;
      if(opts && opts.returnTo) try { global.sessionStorage.setItem(RETURN_KEY, opts.returnTo); } catch(e) {}
      try {
        var url = global.location.href.replace(/([?&])skin=[a-z]+&?/, "$1").replace(/[?&]$/, "");
        if(url !== global.location.href) global.location.replace(url);
        else global.location.reload();
      } catch(e) {}
      return true;
    },
    // The scene a look change asked to come back to, once; null otherwise.
    takeReturn: function() {
      try {
        var s = global.sessionStorage.getItem(RETURN_KEY);
        global.sessionStorage.removeItem(RETURN_KEY);
        return s || null;
      } catch(e) { return null; }
    },

    register: function(skin, map) {
      var v = variants[skin] = variants[skin] || {};
      for(var k in map) if(Object.prototype.hasOwnProperty.call(map, k)) v[k.replace(/^\.\//, "")] = map[k];
      return v;
    },

    asset: function(url) {
      var v = variants[Skin.id];
      if(!url || !v || /^(data|blob):/.test(url)) return url;
      var s = splitUrl(url), r = relPath(s.path);
      if(!r) return url;
      var to = Object.prototype.hasOwnProperty.call(v, r.path) ? v[r.path] : null;
      if(to === null) {
        var best = "";
        for(var k in v) if(k.charAt(k.length - 1) === "/" && r.path.indexOf(k) === 0 && k.length > best.length) best = k;
        if(best) to = v[best] + r.path.slice(best.length);
      }
      return to === null ? url : r.pre + to + s.rest;
    },

    token: function(name) {
      var own = TOKENS[Skin.id] || TOKENS.toybox;
      return Object.prototype.hasOwnProperty.call(own, name) ? own[name] : TOKENS.toybox[name];
    },
    color: function(name) { return Skin.token(name); },
    rgb: function(name) { return hexRgb(String(Skin.token(name))); },
    // canvas font: toybox keeps the string as written, retro swaps in monospace
    font: function(css) {
      if(Skin.id === "toybox") return css;
      var m = /^(.*?\d+(?:\.\d+)?px(?:\/\S+)?)\s/.exec(css);
      return m ? m[1] + " " + MONO : css;
    },
    tokens: TOKENS
  };

  // every asset URL goes through the skin, then gets its ?v= (index.html)
  var versioned = global.versionedUrl;
  if(typeof versioned === "function" && !versioned.skinAware) {
    global.versionedUrl = function(url) { return versioned(Skin.asset(url)); };
    global.versionedUrl.skinAware = true;
  }

  // before the first paint: the look, and the browser chrome colour
  var root = global.document && global.document.documentElement;
  if(root) {
    root.setAttribute("data-skin", id);
    try {
      var meta = global.document.querySelector('meta[name="theme-color"]');
      if(meta && id !== "toybox") meta.setAttribute("content", TOKENS[id].themeColor);
    } catch(e) {}
  }
})(window);
