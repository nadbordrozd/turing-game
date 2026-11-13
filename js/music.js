// Game score: t.Music.play(), stop(), muted(), setMuted(bool), toggle(),
// load(), duck(seconds), playing(), tracks(), track(), volume (0..1, get/set).
//
// The tracks come from the skin (t.Skin.token("music"): toybox
// music/clockwork-puzzle.m4a, retro music/hypnotic-loop.m4a then
// music/terminal-bleeps.m4a). One <audio> element streams the current track
// (versioned URL), so a track is never decoded into memory. A single track
// loops; several play in turn forever, each `ended` moving the element to the
// next file (only the current file is fetched). It starts on the first click,
// tap or key press (browsers block autoplay before one) with a 1.5 s fade-in
// and then plays across every screen: nothing in the scenes touches it, so
// scene changes never restart it. It pauses while the tab is hidden and fades
// back in when it is visible again. The mute and volume are kept in
// localStorage, separate from the sound effects ("turing.music.*"). While
// muted the file is not even downloaded (load() fetches it anyway).
// t.Sfx 'fanfare' ducks the music for its length. iOS ignores element volume,
// so there the track plays at its file level (normalised to -20 LUFS, see
// docs/audio/MUSIC.md) without fades. Loaded right after js/audio.js.
(function (global) {
  "use strict";

  var t = (global.t = global.t || {});
  var DEFAULT_TRACKS = ["music/clockwork-puzzle.m4a"];
  var TRACKS = playlist();
  var MUTE_KEY = "turing.music.muted";
  var VOLUME_KEY = "turing.music.volume";
  var DEFAULT_VOLUME = 0.7; // about -3 dB: the score sits under the effects
  var FADE_IN = 1.5;
  var FADE_OUT = 0.35;
  var DUCK_LEVEL = 0.3;
  var TICK_MS = 40;

  var el = null;
  var failed = false;
  var wanted = true; // play() / stop() intent; the score is on by default
  var unlocked = false; // a user gesture has happened
  var muted = read(MUTE_KEY) === "1";
  var volume = clamp(parseFloat(read(VOLUME_KEY)), DEFAULT_VOLUME);
  var fade = 0, fadeTo = 0, fadeRate = 0; // envelope 0..1, per second
  var duckGain = 1, duckUntil = 0;
  var timer = null;
  var pending = null; // play() promise in flight
  var track = 0; // index into TRACKS
  var stale = false; // the element still holds the track before `track`

  // the skin's track list (js/skin.js loads first); the toybox score otherwise
  function playlist() {
    var list = null;
    try {
      list = t.Skin && t.Skin.token ? t.Skin.token("music") : null;
    } catch (e) {
      list = null;
    }
    var out = [];
    if (list && list.length) for (var i = 0; i < list.length; i += 1) if (typeof list[i] === "string" && list[i]) out.push(list[i]);
    return out.length ? out : DEFAULT_TRACKS.slice();
  }

  function url(path) {
    return global.versionedUrl ? global.versionedUrl(path) : path;
  }

  function read(key) {
    try {
      return global.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function write(key, value) {
    try {
      global.localStorage.setItem(key, value);
    } catch (e) {
      /* private mode or blocked storage: not remembered */
    }
  }

  function clamp(v, fallback) {
    return typeof v === "number" && isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;
  }

  function now() {
    return global.performance && global.performance.now ? global.performance.now() / 1000 : new Date().getTime() / 1000;
  }

  function element() {
    if (el || failed || !global.Audio) return el;
    try {
      el = new global.Audio();
      el.loop = TRACKS.length === 1;
      el.preload = "auto";
      el.volume = 0;
      el.addEventListener("error", function () {
        failed = true;
      });
      if (TRACKS.length > 1) el.addEventListener("ended", next);
      el.src = url(TRACKS[track]);
    } catch (e) {
      el = null;
      failed = true;
    }
    return el;
  }

  // Point the element at the current track if it still holds the old one.
  function cue() {
    if (!el || !stale) return;
    stale = false;
    try {
      el.src = url(TRACKS[track]);
    } catch (e) {
      failed = true;
    }
  }

  // A playlist track ended: on to the next one. If the score cannot play
  // right now (muted, stopped, hidden) the file is fetched only when it can.
  function next() {
    track = (track + 1) % TRACKS.length;
    stale = true;
    if (muted || !wanted || !unlocked || hidden() || failed) return;
    cue();
    start();
  }

  function apply() {
    if (!el) return;
    try {
      el.volume = Math.max(0, Math.min(1, volume * fade * duckGain));
    } catch (e) {
      /* read-only volume (iOS) */
    }
  }

  function tick() {
    var dt = TICK_MS / 1000;
    if (fade < fadeTo) fade = Math.min(fadeTo, fade + fadeRate * dt);
    else if (fade > fadeTo) fade = Math.max(fadeTo, fade - fadeRate * dt);
    var duckTarget = now() < duckUntil ? DUCK_LEVEL : 1;
    if (duckGain > duckTarget) duckGain = Math.max(duckTarget, duckGain - dt / 0.15);
    else if (duckGain < duckTarget) duckGain = Math.min(duckTarget, duckGain + dt / 0.8);
    apply();
    if (fade === 0 && fadeTo === 0 && el && !el.paused) {
      try {
        el.pause();
      } catch (e) {
        /* gone */
      }
    }
    if (fade === fadeTo && duckGain === duckTarget && duckTarget === 1) {
      global.clearInterval(timer);
      timer = null;
    }
  }

  function ramp(to, seconds) {
    fadeTo = to;
    fadeRate = seconds > 0 ? 1 / seconds : 1000;
    if (!timer) timer = global.setInterval(tick, TICK_MS);
  }

  function hidden() {
    return global.document && global.document.visibilityState === "hidden";
  }

  // Start (or keep) playing when everything allows it.
  function start() {
    if (muted || !wanted || !unlocked || hidden() || failed) return false;
    var a = element();
    if (!a) return false;
    cue();
    ramp(1, FADE_IN);
    if (!a.paused || pending) return true;
    try {
      var p = a.play();
      if (p && typeof p.then === "function") {
        pending = p;
        p.then(
          function () {
            pending = null;
            removeUnlock();
          },
          function () {
            // blocked (no gesture yet) or interrupted: retry on the next gesture
            pending = null;
            unlocked = false;
            fade = fadeTo = 0;
            addUnlock();
          }
        );
      } else removeUnlock();
    } catch (e) {
      return false;
    }
    return true;
  }

  function halt(seconds) {
    if (!el) return;
    if (seconds > 0 && !el.paused) ramp(0, seconds);
    else {
      fade = fadeTo = 0;
      apply();
      try {
        el.pause();
      } catch (e) {
        /* gone */
      }
    }
  }

  var GESTURES = ["pointerdown", "mousedown", "touchend", "keydown"];
  var listening = false;

  function onGesture() {
    unlocked = true;
    // muted or stopped: later starts come from the toggle (itself a gesture)
    if (!start() && !pending) removeUnlock();
  }

  function addUnlock() {
    if (listening) return;
    listening = true;
    for (var i = 0; i < GESTURES.length; i += 1) global.addEventListener(GESTURES[i], onGesture, true);
  }

  function removeUnlock() {
    if (!listening) return;
    listening = false;
    for (var i = 0; i < GESTURES.length; i += 1) global.removeEventListener(GESTURES[i], onGesture, true);
  }

  function setMuted(value) {
    muted = !!value;
    write(MUTE_KEY, muted ? "1" : "0");
    if (muted) halt(FADE_OUT);
    else {
      // the toggle click is itself a gesture
      unlocked = true;
      start();
    }
    return muted;
  }

  t.Music = {
    play: function () {
      wanted = true;
      return start();
    },
    stop: function () {
      wanted = false;
      halt(0);
      if (el) {
        try {
          el.currentTime = 0;
        } catch (e) {
          /* not seekable yet */
        }
      }
    },
    muted: function () {
      return muted;
    },
    setMuted: setMuted,
    toggle: function () {
      return setMuted(!muted);
    },
    // fetch the file without playing it
    load: function () {
      var a = element();
      cue();
      if (a && a.readyState === 0 && a.load) a.load();
      return a;
    },
    // lower the score for a moment (e.g. under a fanfare)
    duck: function (seconds) {
      duckUntil = Math.max(duckUntil, now() + Math.max(0, seconds || 0));
      if (!timer) timer = global.setInterval(tick, TICK_MS);
    },
    playing: function () {
      return !!(el && !el.paused);
    },
    // the skin's track list and the one playing (or next to play)
    tracks: function () {
      return TRACKS.slice();
    },
    track: function () {
      return TRACKS[track];
    },
  };
  Object.defineProperty(t.Music, "volume", {
    enumerable: true,
    get: function () {
      return volume;
    },
    set: function (v) {
      volume = clamp(Number(v), volume);
      write(VOLUME_KEY, String(volume));
      apply();
    },
  });

  // Duck under the fanfare (js/audio.js has no hooks, so wrap play()).
  if (t.Sfx && typeof t.Sfx.play === "function") {
    var sfxPlay = t.Sfx.play;
    t.Sfx.play = function (name, opts) {
      var ok = sfxPlay.apply(this, arguments);
      if (ok && name === "fanfare") t.Music.duck(1.7);
      return ok;
    };
  }

  if (global.document && global.document.addEventListener) {
    global.document.addEventListener("visibilitychange", function () {
      if (hidden()) halt(0);
      else start();
    });
  }

  if (!muted) element(); // start buffering so the first gesture plays at once
  addUnlock();
})(typeof window !== "undefined" ? window : this);
