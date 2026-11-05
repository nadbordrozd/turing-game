# Art Direction

**Status: approved 2026-11-05 ("Toybox pixel").** The user reviewed the
`explore-v1` sheet and asked to keep iterating on the tiles. Production art
follows this file and the class files.

This file is the single shared direction for every visual asset. Class files
under [`classes/`](classes/) add constraints for one class (units, tiles, UI,
...) and may specialise, never contradict, this file. How assets are made is
in [PIPELINE.md](PIPELINE.md).

## 1. The style in one paragraph

Chunky, friendly pixel art like a cosy toy box: a bright but not neon palette
(warm tomato red, sky blue, sunny yellow, mint green, cream), soft two-tone
shading, rounded cartoon shapes with a dark outline, big clear shapes and few
details, readable at a glance at 50 px. Flat, straight-on views only: the
board is a square grid, never isometric or three-quarter. (From `explore-v1`,
concept C; references `toybox-robot-a#0` for palette and `toybox-step-a#0`
for the arrow.)

## 2. Shared rules for every asset

- Camera: straight top-down for tiles, straight front view for the robot. No
  isometric, no three-quarter, no perspective.
- Light: tiles are rotated by the game in 90° steps, so tile shading must look
  right in all four rotations: light from straight above (centre highlight,
  even rim), never a baked top-left highlight.
- Outline: dark (not pure black) 1 px outline on symbols and characters.
- Palette: the five base hues above plus neutrals; the six counter colours
  (red, blue, green, purple, yellow, pink) each also get a glyph or shape cue.

## 3. Geometry and resolution

- Board tiles and the robot are 50×50 in the game; frame counts and sheet
  layout are set by `data/sprites.json` and the `Q.animations` table in
  `script.js`. Program tiles are 54×54 (board pitch 54 at scale 1, no gaps),
  anti-aliased, and keep the 2012 frame counts and rates.
- Program (instruction) tiles: every tile carries the same belt across its
  middle, edge to edge, so neighbouring tiles join into one continuous belt;
  the instruction symbol sits on top of the belt. Belts animate (they scroll in
  the direction of flow) and must stay in phase across tiles. See
  `classes/program-tiles.md`.
- Terrain: lava, water and ice keep the user's hand-drawn originals for now
  (they join seamlessly and animate; PixelLab could not match that in
  `explore-v1`).
- Robot: front view, symmetric, feet at the bottom edge (it walks towards its
  feet), transparent background; the game rotates it at runtime.

## 4. Decisions

| Date | Decision | Evidence |
| ---- | -------- | -------- |
| 2026-11-05 | Toybox pixel is the direction | user: "keep iterating on the tiles" after `explore-v1` (`.orchestration/sheets/explore-v1.png`) |
| 2026-11-05 | Animated, joinable program tiles (belt, rotators, step) are drawn by a checked-in deterministic generator, not PixelLab | user: tiles must animate and join like one long belt; PixelLab gives single stills with no seamless edges |
| 2026-11-05 | Lava, water and ice stay as the user drew them for now | user: "maybe keep the lava as it is"; 6 failed lava takes in `explore-v1` |
| 2026-11-05 | Robot is a straight front view, never isometric | user: "the game grid is square, not isometric diamond" |
| 2026-11-05 | Program tiles are anti-aliased (smooth edges, sub-pixel motion), pre-rendered at the 2012 frame counts and rates (rotators 60 frames, 3° each) | user: v1 arrows "look a bit pixelated"; "the motion should be just as smooth as before" (tg-vy4.15) |
