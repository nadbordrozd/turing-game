# Music

The game score is **"Clockwork Puzzle"**, the user's own track, made by the
user for Turing (bead tg-4iy.6). One track loops for the whole session.

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
```

- One `<audio>` element (`loop`, `preload="auto"`) streams
  `versionedUrl("music/clockwork-puzzle.m4a")`; the 208 s track is never
  decoded into Web Audio memory.
- Browsers block autoplay, so it starts on the first click, tap or key press,
  with a 1.5 s fade-in. If play() is refused it waits for the next gesture.
- It plays across every screen: no scene touches it, so scene changes never
  restart it. It pauses when the tab is hidden and fades back in when the tab
  is visible again.
- Its mute is separate from the sound effects (`turing.sfx.muted`). While it
  is muted the file is not downloaded at all. Muting fades out over 0.35 s.
- `t.Sfx.play("fanfare")` ducks the music for the fanfare's 1.7 s
  (music.js wraps `t.Sfx.play`).
- iOS ignores `<audio>` volume, so there the track plays at its file level
  (-20 LUFS, below) without fades. Mute and pause still work.

The Music toggle (note icon, `music` / `music-off` in `t.UI.ICONS`) sits next
to the Sound toggle in the game header (landscape: labelled "Music" / "Off";
portrait: icon only) and in the level selector header. The help overlay lists
it. The About screen has no audio controls.

## Files

| File | What |
| --- | --- |
| `music/clockwork-puzzle.m4a` | the shipped derivative: AAC-LC, 48 kHz stereo, 160 kb/s target (165 kb/s measured), 208.6 s, 4.35 MB, index at the front so it streams |
| `audio/music/records.json` | provenance: source file name, path, sha256, size, duration and loudness; the exact ffmpeg command; ffmpeg version; output sha256, size, codec, bitrate and loudness |
| `tools/art/music.mjs` | `build`, `measure`, `validate` (zero dependencies; build and measure need ffmpeg) |

Source: `~/Downloads/Clockwork Puzzle.wav`, 16-bit PCM, 48 kHz stereo,
208.6 s, 40 065 040 bytes, sha256
`75096004bbfe0abd4b7639038527e817a05af34ef611e61f79719755b35a4abe`. It stays
outside the repository and is only read.

Why AAC in .m4a: AAC sounds better than mp3 at the same bitrate, it is what the user's click sound already uses (`sounds/click.m4a`), and
`<audio>` plays AAC in current Chrome, Edge, Safari (macOS and iOS) and
Firefox. The tiny gap an `<audio loop>` leaves at the wrap is not audible:
the track ends on a decay to about -45 dB.

## Loudness

The sound effects are levelled so their loudest 100 ms reach -16 LUFS
(`docs/audio/SFX.md`). The source track is -15.2 LUFS integrated (LRA 2.6 LU,
true peak -3.5 dBTP), as loud as the effects. `build` applies one static
gain (-4.8 dB, no compression) to bring the file to -20 LUFS: measured
-20.1 LUFS integrated, LRA 2.5 LU, true peak -8.2 dBTP. Played at the default
volume 0.7 (-3.1 dB) that is about -23 LUFS, roughly 7 dB under the effects.

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
also needs `SRC` in `js/music.js` changed. Do not play the result on the
build machine during checks; listen in the game yourself.
