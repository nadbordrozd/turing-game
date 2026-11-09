# Terrain (robot cell) asset contract

Status: v1 (2026-11-05, bead tg-vy4.16). It follows the approved Toybox direction in
[`../ART_DIRECTION.md`](../ART_DIRECTION.md). The user asked for a new look for
the robot's cell with "no need to anchor to that garish purple"; lava stays the
original 2012 art.

## Inventory

Everything below is written by `tools/art/tiles/robot-cell.mjs` (no PixelLab for
terrain). Sheet entries go into the override atlas
`images/tiles/robot-cell.png` + `data/robot-cell.json`; `script.js` compiles it
after `images/sprytszyt.png`, so these names replace the old atlas entries
(which stay untouched). Loose PNGs are replaced in place at their old sizes.

| Name | Where | Frames | What |
| --- | --- | ---: | --- |
| `player` | atlas | 32 | the robot and its death frames (see `characters.md`) |
| `obstacle` | atlas, `images/obstacle.png` | 1 | 2x2-stud toy brick filling the tile |
| `wall`, `corner`, `deadend`, `tunnel` | atlas | 1 | sand floor with slate rails on E; E+S; N+E+S; E+W |
| `magicTile` | atlas | 1 | floor with an inset cyan pad and a four-point star (cyan matches the magic detector) |
| `exitHatch` | atlas | 21 | round hatch, yellow six-blade iris; frame 0 closed, opens to a dark hole with a mint rim |
| `electricTrap` | atlas | 21 | the same hatch, iris greyed, with white/sky-blue arcs re-rolled every frame |
| floor | `images/robotile.png` | 1 | sand play-mat panel |
| ice, cracked ice, water | `images/ice.png`, `crackedIce.png`, `water.png` | 1 | pale ice with pinwheel glints; the same with cracks and a hole; deep blue with crests |
| dots | `images/resistor1.png` .. `resistor5.png` | 1 | toy resistors (pastel body, three bands, silver leads) at five angles, old canvas sizes |
| `lava` | atlas (frames copied byte for byte from the old atlas `lava` in `images/sprytszyt.png`) | 40 | **unchanged** 2012 art, only repacked with the gutter (tg-iex) |

Not redrawn: `startTile` (no level uses it), `spark` (program-side help
animation), and the unused `*Mini` and big icon sheets in `data/sprites.json`.

## Geometry

- 50×50 tiles, drawn by the game at scale 1 on a 52 px pitch over a black
  rectangle, so there are 2 px black gaps between tiles.
- **Atlas gutter (tg-iex, as tg-oyv for the program tiles):** atlas frames
  are not packed edge to edge. Each frame sits in a 60 px cell at offset 4,
  and the rest of the cell (4 px before, 6 px after) repeats its edge pixels;
  layout entries record `cols`, `frames` and `spacing` (10 px between frame
  rects; Quintus' `SpriteSheet` steps by `tilew + spacing`). The robot window
  is drawn at `worldScale` × the canvas' device-pixel scale with smoothing on,
  and filtering reads past a frame's rect: packed edge to edge, a wall pulled
  in its atlas neighbour's outline and a hatch, trap, robot or lava frame its
  next frame, a faint line at the cell's edge. Bilinear filtering reads one
  texel past the rect (a 2 px gutter measured clean down to 0.3×); frame rects
  also start on a 4 px grid with at least 4 px of extrusion as a margin for
  renderers that downscale through mipmaps (level 2: 4×4 blocks), so no filter
  tap leaves the frame's cell down to quarter size. The game also snaps each static cell (`Q.RobotTableTile`) to
  whole device pixels (`t.UI.snapToPixels`), so cell edges are crisp against
  the gaps; the robot, which moves and turns between cells, is not snapped.
- Levels rotate walls, ice, lava and even floor tiles (`angle`, sometimes
  random), so every tile reads the same in all four rotations: light comes from
  straight above, rims are even, and ice glints are a four-fold pinwheel.
- **Rails** (walls) are 8 px thick, flush with the tile edge and run edge to
  edge, so rails on neighbouring tiles line up across the gap. Profile from the
  edge inwards: outline, dark, mid, light, light, mid, dark, outline. Where two
  rails meet in one tile the nearer rail wins per pixel (a mitred, picture-frame
  corner). Studs sit every 25 px along a rail (the period divides the tile).
- Rail sides at angle 0 copy the old art and the movement rules in
  `RobotTable.js` (`canMove`): wall E; corner E+S; dead end N+E+S; tunnel E+W.
- **Water** is a 25 px lattice of crests with no rim, so water tiles join.
- **Hatch**: rim ring r 17–21.5 with eight bolts; the iris has six spiral blades
  (`theta * 6 / 2π + r / 7`), and the aperture opens with a smoothstep over 20
  frames while the blades turn 1.4 rad.
- **Electric trap**: arcs between two rim points by four levels of midpoint
  displacement, a white 1 px core with a sky-blue halo, seeded per frame.

## Palette

Outline `#2a2335` (shared with the program tiles). Floor `#ecd6a6`, edge
`#e2c78f`, rim `#c9a96e`, studs `#dcbf86`. Rails and bricks `#3e4677` /
`#5a67a6` / `#7f8dcc` / `#aab5ea`. Hatch rim `#6f7690` / `#9aa1ba` / `#c9cedd`;
iris `#f6c445` / `#fbd96e` / `#d9962b`; hole `#1d1730` with `#3c8f6a` rim.
Magic `#2aa2c0` / `#5fd3e6` / `#a8eef6` with a `#fff6c8` star. Ice `#d4f0fb` /
`#b5e2f5` / `#f4fcff`, cracks `#3f7fb6`. Water `#3e95db` / `#2f7cc6`, crests
`#8fd0f5` / `#e1f5ff`. The full table is `PALETTE` in the generator.

The sand floor was chosen so that the robot (red body, cream head, sky visor),
slate walls, cyan magic pads, pale ice, blue water and the black-and-amber lava
all contrast with it; it is warm, unlike the mint program board.

## Reward part icons

The three "stars" (capacitor, integrated circuit, coil) come from PixelLab set
`art/sets/parts-v1` (fragment `class-parts`, Pixen, `view: side`,
`direction: south`, low detail, black outline).

| File | From | Notes |
| --- | --- | --- |
| `images/capacitor.png`, `integratedcircuit.png`, `coil.png` | `capacitor-a#0`, `chip-a#0`, `coil-a#0` | cropped to content, two-ring sunny "sticker" halo, scaled ×2 (the game draws them at 0.5), centred on the old canvas size |
| `images/capacitorBW.png`, `integratedcircuitBW.png`, `coilBW.png` | the same takes | greyscale, alpha 150, no halo; **now the same canvas size as the colour icon** (was smaller), so a greyed slot is the same size as an earned one |
| `images/greencapacitor.png` (18×24), `greenintegratedcircuit.png` (24×22), `greencoil.png` (24×24) | `capacitor-mini-b#0`, `chip-mini-a#0`, `coil-mini-a#0` | their own 24 px takes, cropped by `bake`; full colour now (the green CRT look is gone), names kept |

What worked: "tall narrow ... about two thirds as wide as it is tall" for the
mini capacitor; a plain "fat ring ... round hole" for the mini coil. What did
not: the first mini capacitor came out as a squat bucket; asking for windings
on a 24 px coil gave noisy concentric stripes.

## Robot cell review

```sh
node tools/art/tiles/robot-cell.mjs                    # writes every file above
node tools/art/tiles/robot-cell.mjs --check            # fails if a committed file differs, an atlas frame lacks its gutter or lava differs from sprytszyt.png
node tools/art/tiles/robot-cell.mjs --check --review .orchestration/sheets --tag robot-cell-v1
```

The review sheets are: every frame at 1× on floor and dark and ×3
(`-frames`), the icons at game size and file size (`-icons`), and mocks of real
levels built by running the level files against a stub (`-levels`: tunnel,
labirynth, ring of fire; `-levels2`: some flag?, just give up, P).

## Acceptance

- `--check` passes and `node tools/art/studio-art.mjs validate` passes.
- On the level mocks and in the browser, rails line up across tiles, lava sits
  next to the floor without a seam colour clash, and the robot reads in all four
  rotations.
