# Class: retro intro and victory screen (retro skin)

Specialises the retro direction of epic `tg-wtv` (phosphor green on
near-black) for the intro and the end-level screen. Beads `tg-wtv.3`
(first pass) and `tg-wtv.5` (real-world backdrop, perspective crowd).

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

## What the end-level UI leaves visible

Measured in headless Chrome (tg-wtv.5), in the landscape's 1024x768
coordinates:

- Desktop (landscape, any window): the landscape fills the screen; the
  result card covers x 212-812, y 26-380 (plus a 6 px shadow), the same with
  or without the Next level button. Everything else is visible: the sky
  beside the card, the strip between the card and the horizon, all of the
  ground.
- Portrait mobile: the whole landscape is shown, scaled to the screen width,
  in a frame above the card, so the whole sky is visible.

## Victory backdrop (`art/sets/retro-victory-v2`)

- The user (tg-wtv.5): the freed robots are free in the real world, not in
  cyberspace; the starfield sky was boring. Keep v1's palette.
- Fragment `class-retro-world`: a real place outdoors at night as an old
  green-screen computer would draw it; only near-black and phosphor greens;
  dark silhouettes with thin glowing edges; seen from a standing person's eye
  height; mostly dark so the colourful robots stand out. Its negative list
  bans grid floors, Tron and cyberspace cues, starfields and the moon.
- 512x384 Pixen take scaled x2 nearest to `images/retro/victory-bg.png`.
  Accepted `bg-road-c#0`: a straight country road to a glowing city on the
  horizon, power-line poles, open field on the left, trees on the right,
  green-rimmed clouds across the sky, a few sparse stars. Five other takes
  rejected (see `verdicts.json`): too little ground (horizon at 72-78%) or
  mint/teal greens instead of phosphor green.
- The horizon is the road's vanishing point, y 493 (least-squares fit of
  both road edges).
- `art/sets/retro-victory-v1` (the grid-floor hills, `class-retro-backdrop`)
  stays recorded but no longer has an output.

## Crowd layout: one camera, real heights

`node tools/art/retro-freed-layout.mjs` writes `js/skins/retro-robots.js`.

- One camera at eye height `CAMERA_H` = 1.6 m above flat ground, looking
  level, so its horizon is the backdrop's (y 493). A robot of real height
  H m whose feet stand d = y_feet - 493 px below the horizon is
  h = H * d / 1.6 px tall. The same rule holds for every robot, so giants
  stand right on the horizon (mechagodzilla's feet are 5 px below it),
  person-sized robots have their heads at the horizon wherever they stand,
  and small robots come forward.
- Each robot gets a real height H with a one-line reason in the tool, an x
  and a scale s; its feet follow from the rule. h and the feet are measured
  on the opaque part of the sprite (alpha >= 128), not its padded box.
  Scales are mostly below 1; upscaling never goes past 1.25 (only KITT and
  Optimus Prime are at 1.25).
- KITT is drawn in 3/4 view, so its H (1.45 m) is the 1.26 m roof plus the
  foreshortened bonnet and roof. The Roomba's H (0.2 m) comes from its width:
  80 px = 0.34 m.
- Same robots and unlock order as 2012; x loosely kept, moved for depth
  and legibility (the car is on the road, the giants by the open field
  and the trees). z follows the feet.
- `--check` fails unless the file is current and, read back from the file:
  every robot's feet are within 1 px of where the rule puts them, no scale
  is above 1.25, no robot behind another is drawn over it, feet are on the
  visible ground, and every robot keeps at least 50% of its opaque pixels
  visible with the whole crowd shown, both on desktop (outside the card)
  and on portrait. `--table` prints the table below; `--preview out.png
  [--count N] [--card]` renders the crowd without the game.
- Known compromise: Optimus Prime's feet (y 542) are 8 px behind the base
  of the nearest tree on the right, but he is drawn over it; at that
  distance they read as standing side by side.

| # | robot | H (m) | scale | feet y | d (px) |
| --- | --- | --- | --- | --- | --- |
| 0 | myrobo | 1.2 | 0.90 | 731 | 238 |
| 1 | aibo | 0.28 | 0.40 | 758 | 265 |
| 2 | mechagodzilla | 60 | 1.00 | 498 | 5 |
| 3 | securiton | 2.2 | 0.75 | 595 | 102 |
| 4 | asimo | 1.3 | 0.60 | 627 | 134 |
| 5 | turret | 1.05 | 1.00 | 639 | 146 |
| 6 | bender | 1.8 | 0.85 | 624 | 131 |
| 7 | dalek | 1.65 | 0.80 | 653 | 160 |
| 8 | marsrover | 1.5 | 0.55 | 571 | 78 |
| 9 | cylon | 2.1 | 0.70 | 590 | 97 |
| 10 | r2d2 | 1.09 | 0.90 | 724 | 231 |
| 11 | awesomo | 1 | 0.90 | 627 | 134 |
| 12 | tachikoma | 2.6 | 0.55 | 565 | 72 |
| 13 | pris | 1.75 | 0.90 | 618 | 125 |
| 14 | scv | 3 | 0.85 | 555 | 62 |
| 15 | lostinspacerobot | 1.9 | 0.80 | 619 | 126 |
| 16 | claptrap | 1.2 | 0.75 | 646 | 153 |
| 17 | wheatley | 0.45 | 0.55 | 737 | 244 |
| 18 | kitt | 1.45 | 1.25 | 596 | 103 |
| 19 | marvin | 1.35 | 0.85 | 672 | 179 |
| 20 | partyrock | 1.8 | 0.70 | 595 | 102 |
| 21 | robotchicken | 0.45 | 0.50 | 753 | 260 |
| 22 | sojourner | 0.55 | 0.45 | 707 | 214 |
| 23 | roomba | 0.2 | 0.69 | 759 | 266 |
| 24 | wall-e | 0.6 | 0.60 | 693 | 200 |
| 25 | Canti | 2.2 | 0.60 | 582 | 89 |
| 26 | jetsons | 1.4 | 1.00 | 680 | 187 |
| 27 | ed209 | 2.1 | 0.70 | 577 | 84 |
| 28 | crowtrobot | 0.75 | 0.60 | 747 | 254 |
| 29 | geth | 2 | 0.75 | 610 | 117 |
| 30 | optimusPrime | 9 | 1.25 | 542 | 49 |
| 31 | eve | 1.2 | 0.90 | 677 | 184 |
| 32 | darpadog | 1 | 0.70 | 631 | 138 |
