# Sound effects

`js/audio.js` (loaded by `index.html` right after `oaevil.js`) exposes:

```js
t.Sfx.play(name, { volume: 0.8 }); // true if it started; volume 0..1, default 1
t.Sfx.muted();                      // boolean
t.Sfx.setMuted(true);               // persisted in localStorage "turing.sfx.muted"
t.Sfx.toggle();                     // flips mute, returns the new state
t.Sfx.names();                      // the sound names below
```

- Web Audio, each file fetched and decoded once at load; overlapping playback
  is fine (at most 12 voices, the oldest is cut).
- A sound repeated within 70 ms is dropped, so rapid triggers do not stack.
- Browsers keep audio locked until the first click, tap or key press; the
  module resumes the context on that gesture. Calls before it are silent
  no-ops, as are unknown names and calls while muted.
- Without Web Audio, or when the mp3s cannot be fetched (page opened from
  `file://`), it falls back to `<audio>` elements; with neither it does nothing.
- UI sounds (`click`, `tile-*`) are played by `js/ui` (tg-84y.5). Gameplay
  sounds go through `t.RobotSfx` in `RobotTable.js` (tg-84y.7): `bump`, `scan`
  (detector tiles, at 0.7), `zap`/`drown`/`lava` when the death starts, `fail`
  once per run (after a death animation, or when the program stops without
  escaping), `dot` per part and `pickup` for the last one, `exit`, `ice`
  (0.5 when ice cracks, full when it breaks) and `unlock` when a trap turns
  into the exit hatch. Steps and turns are silent. `scan`, `bump` and `dot`
  are spaced at least 0.25 / 0.12 / 0.06 s apart so fast playback does not
  turn into a buzz.

## Names

| Name          | When                                             | Sounds like                                  | Plays  |
| ------------- | ------------------------------------------------ | -------------------------------------------- | ------ |
| `bump`        | robot walks into a wall                          | low thump with a short falling boing         | 0.36 s |
| `zap`         | robot electrocuted                               | bright crackle, short buzzy hum              | 0.40 s |
| `drown`       | robot falls in water                             | four quick bubbly bloops                     | 0.60 s |
| `lava`        | robot hits lava                                  | short sizzle that fizzles out                | 0.58 s |
| `ice`         | ice cracks / robot falls through                 | crisp crack, then a falling whistle          | 0.80 s |
| `pickup`      | robot picks up a part                            | fast sparkly rising glissando                | 0.42 s |
| `dot`         | a dot is eaten                                   | one tiny soft pop                            | 0.08 s |
| `exit`        | exit reached / level complete                    | rising toy-xylophone arpeggio                | 0.95 s |
| `fail`        | run failed                                       | gentle wah-wah stepping down                 | 0.48 s |
| `tile-pick`   | a program tile is picked up                      | hollow plastic tock                          | 0.09 s |
| `tile-drop`   | a program tile is dropped into place             | firm plastic clack                           | 0.12 s |
| `tile-rotate` | a tile is rotated                                | single ratchet tick                          | 0.05 s |
| `click`       | generic UI button                                | soft pop                                     | 0.16 s |
| `scan`        | the conditional (wall in front?) instruction runs | two rising chirps, boop-beep                | 0.45 s |
| `unlock`      | a robot is freed / unlocked                      | ascending bell arpeggio with sparkle         | 0.85 s |
| `fanfare`     | first finish of the "just give up" level         | multi-note toy fanfare with drum hits        | 1.68 s |

Suggested use: not every move gets a sound. Steps, turns and ordinary
instruction ticks stay silent; `scan` only for the conditional instruction.

## Files and levels

- Prompts, records and verdicts: `audio/sfx/{prompts,records,verdicts}.json`,
  generated with `node tools/art/sfx.mjs` (see `docs/art/PIPELINE.md`).
- Shipped files: `sounds/<name>.mp3` (ElevenLabs `mp3_44100_128`, stereo,
  about 250 KB in all). They are byte-identical to the accepted takes, which
  `node tools/art/sfx.mjs validate` checks.
- Because the files stay untouched, trimming and loudness matching happen at
  playback: each sound plays only its window, with a short fade at cut
  edges, at a per-sound gain. The windows and per-sound offsets live in
  `audio/sfx/mix.json`; `node tools/art/sfx-levels.mjs --write` measures the
  files with ffmpeg (loudest 100 ms of the K-weighted signal, target -16,
  sample peak capped at -1 dBFS) and writes the table into `js/audio.js`;
  `--check` fails when the table is stale; `--envelope <name>` prints a 10 ms
  envelope for choosing a window.
- Level hierarchy: gameplay events at the target, `fanfare` +2 dB, `scan`
  -5 dB, `dot` -7 dB, tile and UI clicks -7 to -9 dB.

To replace a sound: raise `takes` (or change the prompt) in
`audio/sfx/prompts.json`, `generate --only <name>`, review, `accept`, then
adjust its window in `mix.json` and rerun `sfx-levels.mjs --write`.
