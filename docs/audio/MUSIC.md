# Music

The score depends on the skin (`js/skin.js`, token `music`):

| Skin | Score | How it plays |
| --- | --- | --- |
| toybox (default) | **"Clockwork Puzzle"** (bead tg-4iy.6) | one track, looping |
| retro | **"Hypnotic Loop"** then **"Terminal Bleeps"** (bead tg-wtv.7) | a playlist: one after the other, alternating forever |

All three are the user's own tracks, made by the user for Turing. Each skin
only ever fetches its own files: retro never requests
`clockwork-puzzle.m4a`, toybox never requests the retro tracks.

## Playback (`js/music.js`)

Loaded by `index.html` right after `js/audio.js`:

```js
t.Music.play();          // wanted on (default); starts once a gesture has happened
t.Music.stop();          // pause and rewind; nothing restarts it until play()
t.Music.muted();         // boolean
t.Music.setMuted(true);  // persisted in localStorage "turing.music.muted"
t.Music.toggle();        // flips mute, returns the new state
t.Music.volume = 0.5;    // 0..1, default 0.7 (about -3 dB); "turing.music.volume"
t.Music.load();          // fetch the file without playing (returns the <audio>)
t.Music.duck(1.7);       // lower to 30 % for that many seconds
t.Music.playing();       // boolean
t.Music.tracks();        // this skin's track list, e.g. ["music/clockwork-puzzle.m4a"]
t.Music.track();         // the track playing (or next to play)
```

- The track list is `t.Skin.token("music")`, read once at load (js/skin.js
  loads first; without it the toybox list is used).
- One `<audio>` element (`preload="auto"`) streams
  `versionedUrl(<current track>)`; a track is never decoded into Web Audio
  memory. With one track the element has `loop` set. With several, `loop`
  is off and each `ended` points the same element at the next file and plays
  it, wrapping to the first after the last. Only the current track's file is
  fetched; the next one is requested when the current one ends. If a track
  ends while the score cannot play (muted, stopped, tab hidden), the switch
  waits and the next file is fetched only when playback resumes.
- Browsers block autoplay, so it starts on the first click, tap or key press,
  with a 1.5 s fade-in. If play() is refused it waits for the next gesture.
- It plays across every screen: no scene touches it, so scene changes never
  restart it or skip a playlist track. It pauses when the tab is hidden and fades back in when the tab
  is visible again.
- Its mute is separate from the sound effects (`turing.sfx.muted`). While it
  is muted the file is not downloaded at all. Muting fades out over 0.35 s.
- `t.Sfx.play("fanfare")` ducks the music for the fanfare's 1.7 s
  (music.js wraps `t.Sfx.play`).
- iOS ignores `<audio>` volume, so there the track plays at its file level
  (-20 LUFS, below) without fades. Mute and pause still work. The playlist
  advance reuses the element the first gesture unlocked; if a browser refuses
  that play() the score waits for the next gesture, as at start.

The Music toggle (note icon, `music` / `music-off` in `t.UI.ICONS`) sits next
to the Sound toggle in the game header (landscape: labelled "Music" / "Off";
portrait: icon only) and in the level selector header. The help overlay lists
it. The About screen has no audio controls.

## Files

| File | What |
| --- | --- |
| `music/clockwork-puzzle.m4a` | toybox score: AAC-LC, 48 kHz stereo, 160 kb/s target (165 kb/s measured), 208.6 s, 4.35 MB, index at the front so it streams |
| `music/hypnotic-loop.m4a` | retro score, track 1: AAC-LC, 48 kHz stereo, 167 kb/s measured, 249.6 s, 5.26 MB |
| `music/terminal-bleeps.m4a` | retro score, track 2: AAC-LC, 48 kHz stereo, 168 kb/s measured, 249.9 s, 5.31 MB |
| `audio/music/records.json` | provenance: source file name, path, sha256, size, duration and loudness; the exact ffmpeg command; ffmpeg version; output sha256, size, codec, bitrate and loudness |
| `tools/art/music.mjs` | `build`, `measure`, `validate` (zero dependencies; build and measure need ffmpeg) |

Sources (16-bit PCM, 48 kHz stereo; they stay outside the repository and are
only read):

| Source | Duration | Bytes | sha256 |
| --- | --- | --- | --- |
| `~/Downloads/Clockwork Puzzle.wav` | 208.6 s | 40 065 040 | `75096004bbfe0abd4b7639038527e817a05af34ef611e61f79719755b35a4abe` |
| `~/Downloads/Hypnotic Loop.wav` | 249.6 s | 47 937 018 | `23f4803f7ab9d212291a5be49d92493c10cc2a06532b859c52325f54ee94ce07` |
| `~/Downloads/Terminal Bleeps.wav` | 249.9 s | 47 990 778 | `863f5b4e6792a2f503aa52acc49654ba0a418b03436dda0b1d4725f6eb2d693f` |

Why AAC in .m4a: AAC sounds better than mp3 at the same bitrate, it is what the user's click sound already uses (`sounds/click.m4a`), and
`<audio>` plays AAC in current Chrome, Edge, Safari (macOS and iOS) and
Firefox. The tiny gap an `<audio loop>` leaves at the wrap is not audible:
the track ends on a decay to about -45 dB. The same holds for the retro
playlist switch (the next file starts after a short load): Hypnotic Loop's
last second peaks at -49 dB, Terminal Bleeps' at -51 dB.

## Loudness

The sound effects are levelled so their loudest 100 ms reach -16 LUFS
(`docs/audio/SFX.md`). The source track is -15.2 LUFS integrated (LRA 2.6 LU,
true peak -3.5 dBTP), as loud as the effects. `build` applies one static
gain (-4.8 dB, no compression) to bring the file to -20 LUFS: measured
-20.1 LUFS integrated, LRA 2.5 LU, true peak -8.2 dBTP. Played at the default
volume 0.7 (-3.1 dB) that is about -23 LUFS, roughly 7 dB under the effects.

The retro tracks get the same treatment, so switching skins or tracks keeps
the level:

| Track | Source | Gain | Result |
| --- | --- | --- | --- |
| Hypnotic Loop | -13.2 LUFS, LRA 4.8 LU, TP -3.4 dBTP | -6.8 dB | -20.0 LUFS, LRA 4.8 LU, TP -9.3 dBTP |
| Terminal Bleeps | -13.5 LUFS, LRA 7.5 LU, TP -4.3 dBTP | -6.5 dB | -20.1 LUFS, LRA 7.5 LU, TP -9.2 dBTP |

Exact command (from the record):

```sh
ffmpeg -nostdin -v error -y -i '<source>' -map 0:a:0 -af volume=-4.8dB \
  -c:a aac -b:a 160k -ar 48000 -ac 2 -map_metadata -1 -fflags +bitexact \
  -flags:a +bitexact -movflags +faststart -f ipod music/clockwork-puzzle.m4a
```

With the same ffmpeg build (9.0.2 here) it gives byte-identical output.

## Replacing or adding a track

```sh
node tools/art/music.mjs build clockwork-puzzle "/path/to/New Track.wav" \
  --note "user-supplied, made by the user for Turing"    # --target -20 --bitrate 160k are the defaults
node tools/art/music.mjs measure    # check LUFS / true peak / duration
node tools/art/music.mjs validate   # shipped file matches its record
node tools/bump-version.mjs         # new ?v= so players fetch the new file
```

`build` overwrites `music/<id>.m4a` and its record. A track with a new id
also needs adding to the skin's `music` list in `js/skin.js` (one entry
loops; several play in turn). Do not play the result on the
build machine during checks; listen in the game yourself.
