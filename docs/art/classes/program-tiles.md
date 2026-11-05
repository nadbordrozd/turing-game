# Program tiles asset contract

Status: v1 (2026-11-05, bead tg-vy4.2). It follows the approved Toybox direction in
[`../ART_DIRECTION.md`](../ART_DIRECTION.md).

## Inventory

| Sheet name | Frames | Animation (`script.js`) | What |
| --- | ---: | --- | --- |
| `conveyor` | 25 | `conveyorMations` | the belt alone (GOTO) |
| `stepForward` | 25 | `stepForwardMations` | belt + blue arrows sliding above and below |
| `cwrotator` | 50 | `cwRotatorMations` | belt + magenta circular arrow spinning clockwise |
| `ccwrotator` | 50 | `ccwRotatorMations` | belt + orange circular arrow spinning counter-clockwise |
| `emptyOperator` | 1 | `emptyMation` | empty board panel |

These are drawn by `tools/art/tiles/program-tiles.mjs` (no PixelLab) into
`images/tiles/program-tiles.png` + `data/program-tiles.json`. `script.js`
loads both and calls a second `Q.compileSheets` after the old atlas, so these
entries replace the same names from `images/sprytszyt.png` (which is left
untouched). The detector, magic detector and counter tiles still come from
the old atlas.

## Geometry

- 50×50 tiles that point east at angle 0. The game rotates them in 90° steps
  and draws them at scale 0.9 on a 47 px pitch with 2 px black gaps.
- Everything that must survive rotation is symmetric about the centre line
  y = 24.5. Light comes from straight above: highlights sit on the centre of a
  shape and the rims are even. There is no directional highlight.
- **Belt** (identical on every program tile), rows 16–33 (18 px), full width:

  | Rows | Colour |
  | --- | --- |
  | 16, 19, 30, 33 | outline `#2a2335` |
  | 17, 32 | rail light `#c9d0d6` |
  | 18, 31 | rail mid `#8b93a3` |
  | 20, 29 | belt edge `#3a3f5c` |
  | 21–28 | belt `#4a5175` |

  Chevrons are `#f6c445`, 4 px thick, with a `#e09b2d` trailing column, and
  span rows 20–29 with the tip on rows 24–25. A belt joint line `#40466a`
  sits half a period behind each tip.
- **Period** 25 px, two chevrons per tile. The period divides 50, so column 49
  of one tile runs straight into column 0 of the next.
- **Motion:** 1 px east per frame, so the offset is `frame mod 25`. Each tile's
  frame count is a multiple of 25, so frame N equals frame 0. All tiles use
  the same belt function and offset, so a step or rotator next to a conveyor
  reads as one belt. The generator's self-check enforces this.
- **Speed:** `rate` is 0.08. Quintus' anim step adds dt twice, so a frame
  lasts 0.04 s, which gives 25 px/s, the original belt's speed.
- **Phase:** `Q.syncTileAnimation` (`utilitySprites.js`) sets each tile's
  frame from `Date.now()`, so every tile on the board shows the same frame.
- **Floor:** `#a3d9b1` with a 1 px rim `#86c49a` and four 2×2 corner studs
  `#93cea5`. It sits under every program tile.

## Overlays

- **Step:** sky-blue arrows (`#9be6f7` centre line, `#37bfe5`, `#2786b5` rim,
  dark outline) on the lanes centred on rows 8 and 41. Each arrow is 15 px
  long with an 11 px head and a 5 px shaft. The period is 25 and the arrows
  slide 1 px per frame with the belt. They wrap across tile edges, so a row
  of step tiles forms one lane, and next to other tiles they clip at the edge.
- **Rotators:** a two-arc circular arrow, rasterised every frame from polar
  geometry and never from a rotated bitmap. The centre radius is 15.5 and the
  band is 6 px wide; each arc spans 110° and ends in an 8.5 px head 13 px
  wide. The arrow turns half a revolution per loop (it has two-fold
  symmetry): 50 frames, 3.6° per frame, 2 s per loop. Clockwise uses
  magenta `#f27a9b` / `#d73960` / `#9a3256` with heads leading clockwise;
  counter-clockwise uses orange `#fbb466` / `#e9852c` / `#b0561c` with heads
  leading counter-clockwise.
- Every symbol has a 1 px `#2a2335` outline (8-neighbourhood).

## Readability

Check at 1× and in the generator's game-view approximation (0.9 scale,
smoothed, 2 px gaps). Features are at least 2 px wide, because 1 px detail
shimmers when the canvas downsamples.

## Regenerate

```sh
node tools/art/tiles/program-tiles.mjs                 # writes the PNG + JSON
node tools/art/tiles/program-tiles.mjs --check         # fails if committed files differ
node tools/art/tiles/program-tiles.mjs --check --review .orchestration/sheets --tag program-tiles-v1
```

If you change a frame count here, change it in `script.js` too.

## Acceptance

- `--check` passes; the self-check covers the shared belt edges, periodicity
  and loop closure.
- On the contact sheet's board mock, belts join with no seam, and arrows read
  at 1×.
