# Class: retro intro and victory screen (retro skin)

Specialises the retro direction of epic `tg-wtv` (phosphor green on
near-black) for the intro and the end-level screen. Bead `tg-wtv.3`.

## User-supplied legacy art (`art/sets/retro-legacy`)

- The user's own 2012 originals, restored byte-identical from
  `git show 8a9315e:images/<name>`: `intro1-3.png` (1026x768) and the 33
  hand-drawn robots listed in `8a9315e:EndLevelRobots.js`.
- Recorded like the user's click sound (`audio/sfx/records.json`
  `click#import`): each record is `"imported": true` with its source and
  sha256, endpoint `imported`, no PixelLab call and no cost. Masters are the
  restored bytes; outputs copy them unchanged to `images/retro/` and
  `images/retro/robots/`, so `validate` hash-checks them.
- Never regenerate, redraw or upscale these. New robots only on the user's
  request.

## Intro

- The three original screens, letterboxed on black (`object-fit: contain`,
  smooth scaling) in both layouts; no portrait crops.
- The narration is drawn into the pictures, so the page text is kept for
  screen readers only (not shown twice). The text in the pictures has the
  2012 wording, including the typo "endavour" on screen 2.

## Victory backdrop (`art/sets/retro-victory-v1`)

- Fragment `class-retro-backdrop`: green-screen terminal at night, only
  near-black and phosphor greens, thin glowing lines, mostly dark and low in
  contrast so the colourful cut-out robots stand out.
- 512x384 Pixen take scaled x2 nearest to `images/retro/victory-bg.png`
  (1024x768). Accepted `bg-hills-a#0`: contour-line hills, distant city
  lights, a perspective-grid plain from the horizon (y 496) down.

## Crowd layout

`node tools/art/retro-freed-layout.mjs` writes `js/skins/retro-robots.js`
from the 2012 layout: same robots, same unlock order, x kept, feet mapped
from the 2012 range (y 377-760) onto the backdrop's ground (y 528-762),
z from the feet, native size. A few robots are nudged (see `NUDGE`) so none
is buried or under the desktop result card. `--check` verifies the file,
`--preview out.png [--count N]` renders the crowd without the game.
