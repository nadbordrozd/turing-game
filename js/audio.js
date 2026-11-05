// Sound effects: t.Sfx.play(name, {volume}), muted(), setMuted(bool), toggle(), names().
//
// Web Audio: every file is fetched and decoded once at load, then played from
// memory, so playback is low latency and the same sound can overlap itself.
// A per-sound throttle drops repeats that arrive faster than THROTTLE_MS so
// rapid triggers do not stack into a loud smear. The context starts
// suspended and is resumed on the first user gesture (browsers require it);
// play() before that is a silent no-op. Mute is kept in localStorage.
// Without Web Audio, or when a file cannot be fetched (the game opened from
// file://), it falls back to <audio> elements; with neither it does nothing.
//
// The shipped mp3s are the untouched ElevenLabs takes (sfx.mjs validate checks
// their hashes), so each sound plays only its trimmed window at a gain that
// matches loudness across the set. Those numbers are measured by
// tools/art/sfx-levels.mjs from audio/sfx/mix.json; see docs/audio/SFX.md.
(function (global) {
  "use strict";

  var t = (global.t = global.t || {});

  // BEGIN generated mix (node tools/art/sfx-levels.mjs --write)
  // name: [file, start s, end s, gain dB]; measured from the shipped files.
  var MIX = {
    "bump": ["sounds/bump.mp3", 0, 0.36, -3.3],
    "zap": ["sounds/zap.mp3", 0, 0.4, -11.9],
    "drown": ["sounds/drown.mp3", 0, 0.6, -2.4],
    "lava": ["sounds/lava.mp3", 0, 0.58, -8.4],
    "ice": ["sounds/ice.mp3", 0, 0.8, -3.5],
    "pickup": ["sounds/pickup.mp3", 0, 0.42, -13.5],
    "dot": ["sounds/dot.mp3", 0.005, 0.085, -12.4],
    "exit": ["sounds/exit.mp3", 0, 0.95, 1.5],
    "fail": ["sounds/fail.mp3", 0, 0.48, -14.9],
    "tile-pick": ["sounds/tile-pick.mp3", 0.2, 0.29, -11.2],
    "tile-drop": ["sounds/tile-drop.mp3", 0.085, 0.2, -1.7],
    "tile-rotate": ["sounds/tile-rotate.mp3", 0.015, 0.06, -0.3],
    "click": ["sounds/click.mp3", 0, 0.16, -13],
    "scan": ["sounds/scan.mp3", 0, 0.45, -7.5],
    "unlock": ["sounds/unlock.mp3", 0, 0.85, -5],
    "fanfare": ["sounds/fanfare.mp3", 0, 1.68, -3.7]
  };
  // END generated mix

  var STORAGE_KEY = "turing.sfx.muted";
  var THROTTLE_MS = 70;
  var MAX_VOICES = 12;

  var ctx = null;
  var master = null;
  var buffers = {};
  var failed = {};
  var lastPlayed = {};
  var voices = [];
  var muted = readMuted();

  function readMuted() {
    try {
      return global.localStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function writeMuted(value) {
    try {
      global.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch (e) {
      /* private mode or blocked storage: mute just is not remembered */
    }
  }

  function now() {
    return global.performance && global.performance.now ? global.performance.now() : new Date().getTime();
  }

  function dbToGain(db) {
    return Math.pow(10, db / 20);
  }

  function createContext() {
    try {
      var Ctor = global.AudioContext || global.webkitAudioContext;
      if (!Ctor) return null;
      var c = new Ctor();
      master = c.createGain();
      master.gain.value = 1;
      master.connect(c.destination);
      return c;
    } catch (e) {
      return null;
    }
  }

  function load(name) {
    var file = MIX[name][0];
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", global.versionedUrl ? global.versionedUrl(file) : file, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = function () {
        if (xhr.status && (xhr.status < 200 || xhr.status >= 300)) {
          failed[name] = true;
          return;
        }
        decode(name, xhr.response);
      };
      xhr.onerror = function () {
        failed[name] = true;
      };
      xhr.send();
    } catch (e) {
      failed[name] = true;
    }
  }

  function decode(name, data) {
    if (!data) {
      failed[name] = true;
      return;
    }
    var ok = function (buffer) {
      buffers[name] = buffer;
    };
    var bad = function () {
      failed[name] = true;
    };
    try {
      // Callback form for older Safari; newer browsers also return a promise.
      var p = ctx.decodeAudioData(data, ok, bad);
      if (p && typeof p.then === "function") p.then(ok, bad);
    } catch (e) {
      failed[name] = true;
    }
  }

  function resume() {
    if (!ctx) return;
    try {
      if (ctx.state === "suspended" && ctx.resume) {
        var p = ctx.resume();
        if (p && typeof p.then === "function") p.then(removeUnlock, function () {});
      }
      // iOS unlocks output only after something is started inside a gesture.
      var silent = ctx.createBufferSource();
      silent.buffer = ctx.createBuffer(1, 1, 22050);
      silent.connect(ctx.destination);
      silent.start ? silent.start(0) : silent.noteOn(0);
    } catch (e) {
      /* nothing to do: sounds stay silent */
    }
    if (ctx.state === "running") removeUnlock();
  }

  var GESTURES = ["pointerdown", "mousedown", "touchstart", "touchend", "keydown"];

  function addUnlock() {
    for (var i = 0; i < GESTURES.length; i += 1) {
      global.addEventListener(GESTURES[i], resume, true);
    }
  }

  function removeUnlock() {
    for (var i = 0; i < GESTURES.length; i += 1) {
      global.removeEventListener(GESTURES[i], resume, true);
    }
  }

  function stopAll() {
    for (var i = 0; i < voices.length; i += 1) {
      try {
        voices[i].stop(0);
      } catch (e) {
        /* already finished */
      }
    }
    voices = [];
  }

  function playBuffer(name, volume) {
    var m = MIX[name];
    var start = m[1];
    var dur = Math.max(0.01, m[2] - m[1]);
    var level = dbToGain(m[3]) * volume;
    var at = ctx.currentTime;
    var src = ctx.createBufferSource();
    var gain = ctx.createGain();
    src.buffer = buffers[name];
    // A few ms of fade in (when the window starts mid-file) and out, so the
    // trimmed edges never click.
    var fadeIn = start > 0 ? 0.003 : 0;
    var fadeOut = Math.min(0.03, dur * 0.2);
    gain.gain.setValueAtTime(fadeIn ? 0 : level, at);
    if (fadeIn) gain.gain.linearRampToValueAtTime(level, at + fadeIn);
    gain.gain.setValueAtTime(level, at + dur - fadeOut);
    gain.gain.linearRampToValueAtTime(0, at + dur);
    src.connect(gain);
    gain.connect(master);
    if (voices.length >= MAX_VOICES) {
      try {
        voices.shift().stop(0);
      } catch (e) {
        /* already finished */
      }
    }
    voices.push(src);
    src.onended = function () {
      var i = voices.indexOf(src);
      if (i >= 0) voices.splice(i, 1);
      try {
        gain.disconnect();
      } catch (e) {
        /* already disconnected */
      }
    };
    src.start(at, start, dur);
    return true;
  }

  function playElement(name, volume) {
    var m = MIX[name];
    try {
      var el = new global.Audio(m[0]);
      el.volume = Math.max(0, Math.min(1, dbToGain(m[3]) * volume));
      el.currentTime = m[1];
      var p = el.play();
      if (p && typeof p.then === "function") p.then(null, function () {});
      global.setTimeout(function () {
        try {
          el.pause();
        } catch (e) {
          /* gone */
        }
      }, Math.max(10, (m[2] - m[1]) * 1000));
      return true;
    } catch (e) {
      return false;
    }
  }

  function play(name, opts) {
    try {
      if (muted || !MIX.hasOwnProperty(name)) return false;
      var volume = opts && typeof opts.volume === "number" ? Math.max(0, opts.volume) : 1;
      var stamp = now();
      if (lastPlayed[name] !== undefined && stamp - lastPlayed[name] < THROTTLE_MS) return false;
      if (ctx && buffers[name]) {
        if (ctx.state !== "running") return false;
        lastPlayed[name] = stamp;
        return playBuffer(name, volume);
      }
      if ((!ctx || failed[name]) && global.Audio) {
        lastPlayed[name] = stamp;
        return playElement(name, volume);
      }
      return false; // still decoding
    } catch (e) {
      return false;
    }
  }

  function setMuted(value) {
    muted = !!value;
    writeMuted(muted);
    if (muted) stopAll();
    return muted;
  }

  t.Sfx = {
    play: play,
    muted: function () {
      return muted;
    },
    setMuted: setMuted,
    toggle: function () {
      return setMuted(!muted);
    },
    names: function () {
      return Object.keys(MIX);
    },
  };

  ctx = createContext();
  if (ctx) {
    for (var name in MIX) {
      if (MIX.hasOwnProperty(name)) load(name);
    }
    addUnlock();
  }
})(typeof window !== "undefined" ? window : this);
