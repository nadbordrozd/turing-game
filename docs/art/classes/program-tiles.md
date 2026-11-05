# Program tiles asset contract

Status: v2 (2026-11-05, bead tg-vy4.15). It replaces v1 (tg-vy4.2) and follows the
approved Toybox direction in [`../ART_DIRECTION.md`](../ART_DIRECTION.md), with one
specialisation: program tiles are drawn **anti-aliased**, not as hard pixel art
(the user found v1 "a bit pixelated"; the 2012 arrows looked smoother).

## Inventory

Every tile on the program board. All are drawn by
`tools/art/tiles/program-tiles.mjs` (no PixelLab) into
`images/tiles/program-tiles.png` + `data/program-tiles.json`. `script.js`
compiles that atlas after `images/sprytszyt.png`, so these names replace the
2012 entries of the same name (the old atlas is left untouched).

| Sheet name | Frames | Animation (`script.js`) | What |
| --- | ---: | --- | --- |
| `conveyor` | 20 | `conveyorMations` | the belt alone (GOTO) |
| `conveyorFromLeft` | 20 | `conveyorMations` | GOTO belt entering from the tile's left side (north at angle 0) and turning to exit forward |
| `conveyorFromRight` | 20 | `conveyorMations` | the mirror image: enters from the right side (south at angle 0) |
| `stepForward` | 60 | `stepForwardMations` | belt + sky-blue arrows sliding above and below |
| `cwrotator` | 60 | `cwRotatorMations` | belt + magenta two-arc arrow turning clockwise |
| `ccwrotator` | 60 | `ccwRotatorMations` | belt + orange two-arc arrow turning counter-clockwise |
| `detector` | 20 | `detectorMations` | branch: brick wall icons north (wall ahead), struck-out walls south |
| `magicDetector` | 20 | `magicMation` | branch: sparkling blue tile icons north (on a blue tile), struck-out tiles south |
| `incrementer<Colour>` | 60 | `incrementerMations<Colour>` | belt + pulsing plus in the counter colour, cream glyph in the middle |
| `decrementer<Colour>` | 20 | `decrementerMations<Colour>` | branch: `0` rings north (counter is zero), `−` bars south (decrement), glyph hub |
| `emptyOperator` | 1 | `emptyMation` | empty board panel |
| `startTile` | 1 | `startTileMation` | green double chevron beside the board's entry (transparent ground) |

`<Colour>` is Red, Blue, Green, Purple, Yellow, Pink. The game asks for
`incrementerPurple`; the 2012 atlas spelled it `incerementerPurple`, so the
purple incrementer had no art until v2.

## Counter colours and glyphs

Each counter colour has a glyph so colour is never the only cue. The glyph
sits in cream on the incrementer's plus and on the decrementer's hub. UI that
shows counters (the cipher locks) should use the same pairs.

| Colour | Base / light / dark | Glyph |
| --- | --- | --- |
| Red | `#e5533d` / `#f78a72` / `#a33427` | circle |
| Blue | `#3f7fdc` / `#79aef0` / `#2a5aa3` | square |
| Green | `#36a852` / `#7ad98b` / `#21753a` | triangle |
| Purple | `#8b5cd6` / `#b996ec` / `#5c3b99` | diamond |
| Yellow | `#f5bf2a` / `#ffe07d` / `#b8860f` | star |
| Pink | `#f272ad` / `#fbb0d2` / `#b6457c` | heart |

## Geometry

- Frames are 54×54 px (`--size`, default 54), drawn by the game at scale 1 on
  a 54 px board pitch with no gaps (contract with the UI shell). Shapes are
  defined in design units, 54 per tile side, so other sizes scale cleanly.
- Tiles point east at angle 0; the game rotates them in 90° steps. Everything
  is symmetric about the centre line y = 27 and lit from straight above.
- **Rendering:** every shape is a signed-distance function. A pixel whose
  corners and centre agree takes that colour; any other pixel is the average
  of 8×8 samples. Edges are anti-aliased and sub-pixel motion is smooth.
- **Belt** (shared by every belt tile), by distance |v| from its centre line:
  `#4a5175` belt to 4, `#3a3f5c` edge to 5, `#2a2335` outline to 6, `#8b93a3`
  rail to 7, `#c9d0d6` rail light to 9, outline to 10 (20 px wide, rows 17–36).
  Chevrons `#f6c445` with a `#e09b2d` trailing unit, 4 units thick, spanning
  |v| < 5. **Period** 13.5 units: four chevrons per tile, so belts join tile to tile.
- **Corners:** a quarter circle of radius 27 about the corner between the
  entry and exit edges; the across coordinate is the radius, the along
  coordinate is the angle mapped to 0–54, so chevrons stay in phase with
  straight belts at both openings.
- **Branches** (detector, magic detector, decrementers): a half belt in from
  the west, a full belt north–south with chevrons running outwards, and a hub
  disc (radius 13.3 + outline) hiding the crossing. Icons sit in the four
  18×18 corners: the north pair marks the branch taken when the condition
  holds, the south pair the other.
- **Floor:** `#a3d9b1`, 1 px rim `#86c49a`, four 2×2 corner studs `#93cea5`.
- Every symbol has a 1 unit `#2a2335` outline; larger symbols also have a
  1 unit dark inner rim.

## Timing (the 2012 game's, `git show 8a9315e:script.js`)

All program tiles animate at `rate: 0.05`. Quintus' anim step adds dt twice,
so a frame lasts rate/2 = 25 ms (40 fps). `Q.syncTileAnimation`
(`utilitySprites.js`) reads every tile's frame from one clock, so all tiles
show the same global frame and belts stay in phase.

| Motion | Frames | Per frame | Speed |
| --- | ---: | --- | --- |
| Belt chevrons | 20 per period | 0.675 px | 0.50 tiles/s (2012: 13 px period on 50 px tiles, 0.52 tiles/s; not seamless) |
| Rotators | 60 per loop | 3° | 120°/s; the arrow is two-fold symmetric, so 60 frames turn it 180° and the loop closes (as in 2012) |
| Step arrows | 60 per tile | 0.9 px | 0.67 tiles/s (2012: same) |
| Incrementer pulse | 60 | — | scale 1 → 0.9 → 1 once per 1.5 s (2012: a 60-frame fade) |

Every animated frame count is a multiple of 20, so frame N of any tile has
the same belt offset as frame N mod 20 of the conveyor.

## Belt joins in the game

The game has no notion of corners, so `TuringTable.beltSheet` picks one from
the neighbours: a GOTO tile fed from behind (or by nothing) is straight; fed
only from its left or only from its right side it shows
`conveyorFromLeft` / `conveyorFromRight`. Branch tiles feed their two side
exits; every other tile feeds forward; the start feeds the first cell of the
middle row. `refreshBeltJoins` runs after every board change. Only GOTO tiles
turn corners; a step, rotator or counter entered from the side still shows a
straight belt.

## Readability

Check at 1× and 4× on the contact sheet, and the board mock on light and dark.
Icons are at least 12 px; glyphs about 10 px.

## Regenerate

```sh
node tools/art/tiles/program-tiles.mjs                 # writes the PNG + JSON (54 px)
node tools/art/tiles/program-tiles.mjs --check         # fails if committed files differ
node tools/art/tiles/program-tiles.mjs --check --review .orchestration/sheets --tag program-tiles-v2
node tools/art/tiles/program-tiles.mjs --size 108 --review /tmp/x   # other sizes: review only (--write to ship)
```

`--check` also reads `script.js` and fails if any tile's animation there has
a different frame count or rate than the atlas.

## Acceptance

- `--check` passes: timings match `script.js`, every belt opening of every
  tile matches the plain conveyor's (exactly for straight belts, within
  anti-aliasing for corners and branches), and loops close.
- On the board mock, belts join with no seam, corners and branches follow the
  flow, and every symbol reads at 1×.
