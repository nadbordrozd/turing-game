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

Since tg-di9 every belt tile is drawn in **two layers**: a belt underlay
(floor + belt, opaque) chosen by the tile's join, and the tile's symbol on
transparent ground on top, both at the same global frame (each modulo its own
length). This lets a step, rotator or counter bend and merge exactly like a
plain belt without an atlas sheet per tile and per join. `Operators.js` gives
each operator `sheet` (its default underlay), `belt` (`"line"` or `"branch"`),
`symbol`, and for the step `symbolFor` (symbol per underlay);
`ProgTile.draw` and `t.UI.drawTile` (`js/ui/tiles.js`) draw the layers.

Belt underlays. Keys name the fed inputs with the tile pointing east:
**B** behind (west), **L** left (north), **R** right (south); branch tiles
**W** behind, **E** far side, and the empty key when neither feeds them.

| Sheet name | Key | Frames | Animation | What |
| --- | --- | ---: | --- | --- |
| `conveyor` | B | 20 | `conveyorMations` | straight belt (also the default when nothing feeds the tile) |
| `conveyorFromLeft` | L | 20 | `conveyorMations` | corner: enters from the left side and turns to exit forward |
| `conveyorFromRight` | R | 20 | `conveyorMations` | the mirror image: enters from the right side |
| `conveyorFromBoth` | LR | 20 | `conveyorMations` | T: both side arcs meet on the centre line and exit forward |
| `conveyorJoinLeft` | BL | 20 | `conveyorMations` | straight belt with the left arc merging into it |
| `conveyorJoinRight` | BR | 20 | `conveyorMations` | straight belt with the right arc merging into it |
| `conveyorJoinBoth` | BLR | 20 | `conveyorMations` | straight belt with both arcs merging |
| `branchBare` | (none) | 20 | `detectorMations` | the outgoing belts alone: a full belt north–south running outwards from under the hub, no incoming stub (nothing feeds the tile; also the default) |
| `branch` | W | 20 | `detectorMations` | the same plus a half belt in from the west (behind) |
| `branchFromFar` | E | 20 | `detectorMations` | a half belt in from the east (far side) instead |
| `branchFromBoth` | WE | 20 | `detectorMations` | both half belts |

Symbols (transparent ground):

| Sheet name | Frames | Animation | What |
| --- | ---: | --- | --- |
| `stepForwardSymbol` | 60 | `stepForwardMations` | sky-blue arrows sliding in both side lanes (joins B) |
| `stepForwardSymbolSouth` / `…North` | 60 | `stepForwardMations` | one lane only: a left (right) arc takes the other lane (joins L, BL / R, BR) |
| `stepForwardSymbolInline` | 60 | `stepForwardMations` | both lanes taken (LR, BLR): one arrow on the centre line in the west half, nudging forward |
| `cwrotatorSymbol`, `ccwrotatorSymbol` | 60 | `cwRotatorMations`, `ccwRotatorMations` | two-arc arrow turning, magenta / orange |
| `incrementer<Colour>Symbol` | 60 | `incrementerMations<Colour>` | pulsing plus in the counter colour, cream glyph; sized so joins show between its arms |
| `detectorSymbol` | 1 | `detectorMations` | hub + brick wall icons north, struck-out walls south |
| `magicDetectorSymbol` | 1 | `magicMation` | hub + sparkling blue tile icons north, struck-out tiles south |
| `decrementer<Colour>Symbol` | 1 | `decrementerMations<Colour>` | glyph hub, `0` rings north, `−` bars south |

Whole tiles: `emptyOperator` (1 frame, `emptyMation`, the empty board panel)
and `startTile` (1 frame, `startTileMation`, green double chevron beside the
board's entry, transparent ground).

`<Colour>` is Red, Blue, Green, Purple, Yellow, Pink. The old composite
sheets (`stepForward`, `cwrotator`, `incrementerRed`, `detector`, …) are no
longer in this atlas; only the 2012 atlas still has entries of those names.
Each layout entry in `data/program-tiles.json` records its `frames`.

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
- **Atlas gutter (tg-oyv):** frames are not packed edge to edge. Each frame
  has a 2 px border that repeats its edge pixels, and layout entries record
  `cols` and `spacing` (4 px between frame rects; Quintus' `SpriteSheet`
  steps by `tilew + spacing`). The game scales tiles by non-integer factors
  with smoothing on, and bilinear filtering reads past a frame's rect: packed
  edge to edge, that pulled in the next animation frame and drew a faint line
  at tile edges that changed with the animation. The game also snaps each
  tile to whole device pixels (`t.UI.drawLayers`), so neighbouring tiles meet
  without a half-covered pixel letting the board show through the seam.
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
  coordinate is the angle mapped to 0–40.5 (three chevron periods, against
  four on a straight tile). The arc's centre line is 42.4 units long, so
  chevrons keep their spacing and speed through the bend within 5%, and both
  openings sit on a whole period, in phase with straight belts.
- **T and merges:** every join uses the same two quarter circles. In a T
  each point shows the arc whose centre line is nearer; on y = 27 both arcs
  have the same along and across coordinates, so the seam is continuous and
  the two inner rails close into a Y. With a behind input, side arcs tuck
  under the straight main line, which is drawn on top (its rails stay whole).
- **Symbols over joins:** rotators and pluses sit centred over the belt as
  before, so arcs pass under them like the straight belt does. The step's
  arrows sit beside the belt, so they keep only the lanes no arc runs through;
  with both lanes taken a single arrow rides the centre line in the west half,
  stopping short of a T's arcs. `--check` proves the step never touches a
  side arc and that no symbol covers a belt opening its joins use.
- **Incrementer plus** (tg-y68): arm half-length 14, arm half-width 6,
  corner radius 2.5, glyph radius 4.6, plus the 1 unit outline (`PLUS` in
  the generator). It was 19 / 7.5 / 3 / 5.4 in v2: that plus spanned 40 of
  54 units and hid most of a corner or merge belt, so in the L, R, T and
  merge joins only the tile edges showed belt. Now it spans 30 units, about
  the decrementer hub's 28.6, so the two read as a pair (same colour, glyph
  and footprint); a corner's chevrons run in the gap between two arms and a
  T's arcs show all the way to the centre line. Arms and glyph shrink
  together: half-width 6 is the slimmest that keeps the glyph (about 9 px
  at 54 px, 6 CSS px on a 375 px phone) clear of the arm's dark rim; 5.5
  with glyph 4.3 was tried and the square, triangle and heart touched the
  rim. The pulse is unchanged (scale 1 → 0.9 → 1).
- **Branches** (detector, magic detector, decrementers): a full belt
  north–south with chevrons running outwards from the centre, always, and a
  hub disc (radius 13.3 + outline) over the centre. Since tg-amy the incoming
  belt is not part of the tile: a half belt in from the west (behind) or the
  east (far side) appears only when that side feeds the tile, and with
  neither the outgoing belts stand alone (`branchBare`). Both outgoing halves
  start at the centre line under the hub, so they look the same with or
  without a stub, and an unfed side is plain floor (`--check` proves it).
  Icons sit in the four 18×18 corners: the north pair marks the branch taken
  when the condition holds, the south pair the other.
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

The game has no notion of corners, so `TuringTable.beltSheet` picks the
underlay from the neighbours. For every single-exit tile (GOTO, step,
rotators, incrementers) it collects which of behind, left and right feed it
(none counts as behind) and looks the set up in `TuringTable.LINE_SHEETS`;
for branch tiles (detectors, decrementers) it checks behind and the far side
(`BRANCH_SHEETS`): each one that feeds the tile adds its incoming stub, and
with neither the tile shows only its outgoing belts (none does *not* count
as behind here, unlike single-exit tiles). A tile pointing into a branch's
outgoing side gets no stub: only behind and the far side have one. Branch
tiles feed their two side exits; every other tile feeds forward; the start
feeds the first cell of the middle row. `Operators.js` gives branch tiles the
unfed `branchBare` as `sheet`, so the tray and the tile under the finger show
no stub either.
`refreshBeltJoins` runs after every board change (load, drop, rotate, clear)
and sets each tile's underlay and symbol (`ProgTile.setBelt`).

While a tile is dragged or hovered over a cell, `TuringTable.previewJoins`
gives the underlays the drop would produce: the ghost shows its own join, and
a neighbouring belt tile that would change is drawn that way under it. The
explainer's belt loop uses `TuringTable.lineSheet`, and its branch demos
`BRANCH_SHEETS.W` (the marker comes in from behind). During a run the
program-counter marker follows the arc it actually travels
(`TuringTable.bendsAt`, `flowPath`, `Q.Spark.follow`): entering through a
side opening it runs along that side's arc and rests at its middle; entering
from behind it goes straight to the centre, even where side arcs merge in.
At a branch tile the marker always moves straight, centre to edge, so it
does not depend on which stubs are drawn.
All of this is display only; the rules, step counts and scores are unchanged.

## Readability

Check at 1× and 4× on the contact sheet, and the board mock on light and dark.
Icons are at least 12 px; glyphs about 9 px on the incrementer plus and 12 px on the decrementer hub (at 54 px).

## Regenerate

```sh
node tools/art/tiles/program-tiles.mjs                 # writes the PNG + JSON (54 px)
node tools/art/tiles/program-tiles.mjs --check         # fails if committed files differ
node tools/art/tiles/program-tiles.mjs --check --review .orchestration/sheets --tag program-tiles-v2
node tools/art/tiles/program-tiles.mjs --size 108 --review /tmp/x   # other sizes: review only (--write to ship)
```

`--check` also reads `script.js` and fails if any tile's animation there has
a different frame count or rate than the atlas. `--review` writes the atlas
contact sheet, the board mock (`-seam`), a merges board (`-merges`: T,
merges, side-fed step, turn and counter, a far-side branch feed), a branches
board (`-branches`: conditionals fed by nothing, from behind, from the far
side and from both) and every join of every tile at 3× (`-variants`; branch
tiles alone in `-branch-variants`).

## Acceptance

- `--check` passes: timings match `script.js`, every belt opening of every
  underlay matches the plain conveyor's (exactly for straight belts, within
  anti-aliasing for arcs and branches), loops close, symbols leave the
  openings their joins use clear, the step's arrows never touch an arc,
  a branch's unfed sides are bare floor, and in the shipped PNG every frame
  sits at its JSON rect (Quintus' frame maths) with its edge pixels
  repeated in the 2 px gutter around it.
- On the board mock, belts join with no seam, corners and branches follow the
  flow, and every symbol reads at 1×.

## Retro skin (tg-wtv.2, readability pass tg-wtv.8)

`node tools/art/tiles/program-tiles.mjs --style retro` draws the same
sheets, frame counts, timings, joins and atlas layout in the "retro hacker
chic" look (epic tg-wtv) into `images/retro/tiles/program-tiles.png` +
`data/retro/program-tiles.json`; the game swaps only the URLs
(`js/skin-variants.js`).

Since tg-wtv.8 the board is a circuit board, not an oscilloscope (the first
version drew belts, grid, chevrons and symbols all in one phosphor green and
was hard to read mid-run). Palette `RETRO_BOARD`:

- floor: deep teal solder mask `#0c2a33`, a faint silkscreen rim `#16404b`
  and small corner pads `#2b6571` that join into a pad grid;
- belts: copper traces, a `#4f3319` band with `#a66a30` edges and pale tinned
  chevrons `#d8b27c` at the Toybox chevron positions (continuous and in phase
  through corners, Ts and merges; where a side arc merges, the main line's
  edge opens and the arc's chevrons fade out before it). Mid brightness on
  purpose: belts are clearly quieter than the instructions;
- instructions: solid parts with a 1 unit dark outline `#041014`, a 1 unit
  darker rim and a flat fill, no glow; each kind its own colour: step pale
  ice-cyan `#a9ecfb`, turn right pink `#ff7cc8`, turn left phosphor green
  `#86f26c`, wall sensor red-orange `#ff6a4a` (bricks; struck-out icons grey
  `#5d6f75` with a red-orange slash), magic sensor aqua `#3fe8c8`; the two
  sensors' hubs have a pale neutral ring `#d4dde0`, a decrementer's hub a ring
  in its counter colour;
- counters keep their glyphs and meaning colours (Red `#ff5c50`, Blue
  `#58a6ff`, Green `#a6ff3c`, Purple `#c08aff`, Yellow `#ffe45a`, Pink
  `#ff78d4`): the incrementer a solid plus with the glyph cut out dark;
- the program marker (drawn by the game, `Q.RoboFx.drawReticle`, tokens
  `marker*` in `js/skin.js`) is a hot white-yellow ring with yellow ticks
  and a glow: the brightest thing on the board.

`RETRO` (the phosphor palette) stays for the part icons
(`tools/art/part-icons.mjs`). `--check` runs every self-check above on both styles,
re-renders frames fresh (determinism) and requires the retro layout JSON to
equal Toybox's; `--style retro --review <dir>` writes the retro review sheets.
