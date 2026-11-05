# Characters asset contract

Status: draft (2026-11-05), under the approved "Toybox pixel" direction in
[`../ART_DIRECTION.md`](../ART_DIRECTION.md). First set: `art/sets/robot-v1`
(bead tg-vy4.7).

## Inventory

| Asset | Native size | Where the game loads it |
| ----- | ----------- | ----------------------- |
| Player robot | 50×50 per frame, 40 frames in one row (2000×50) | `player` in `data/sprites.json` (`images/sprytszyt.png`, sx 0, sy 50); frame 0 is the idle robot, the rest are the death and drown animations (`playerMations` in `script.js`) |

The new robot is not wired in yet: the death and drown frames must be redrawn
to match it first (follow-up work).

## Geometry

- Straight front view: the robot faces the viewer, head at the top, feet at
  the bottom. Never isometric, three-quarter, side profile or top-down.
- The game rotates the sprite in 90° steps and the robot walks towards its
  feet, so the design must read in all four rotations: the feet are the
  "front" of the robot on the board.
- Generate at 48×48 (Pixen sides must be multiples of 4), then pad to 50×50
  anchored bottom-centre (`pad {width: 50, height: 50, anchor: "bottom"}`).
  The original frame 0 occupies x5-46, y3-47 of its 50×50 cell.
- Left/right symmetric; transparent background; nothing around the
  character (no ground plate, floor or shadow).

## Readability

- The face (eyes, visor) must read at 1× on light and dark.
- The silhouette should fill most of the cell height (about 43-46 px of 50).
- Keep shading two-tone and close to flat: the game rotates the sprite, so a
  strong baked top-left light turns into a bottom-left light when rotated.

## Recipe

- Endpoint `create-image-pixen`, options `view: "side"`, `direction:
  "south"`, `outline: "single color black outline"`, `detail: "low detail"`,
  `noBackground: true`; fragments `style` + `class-characters`.
- Subject phrasing that worked: "straight front view, facing the viewer, flat
  2D, like a character standing upright seen from the front, not isometric.
  Perfectly symmetric left and right", then head, body, arms and legs in that
  order with their colours, "feet resting on the bottom edge of the canvas".
- Worked: 3 of 3 seeds (4701-4703) came back front-on and symmetric.
- Did not work (`explore-v1`): `view: "high top-down"` with `direction:
  "east"` always gave isometric or three-quarter robots.
- Pixen leaves 1-3 px under the feet; it does not draw claw hands when asked
  for "claw hands" (it draws mitts or boxy hands).

## Acceptance

- Front-on, mirror-symmetric alpha mask (about 99% or better).
- Head and face readable at 1×; two arms, two legs, feet at the bottom.
- No ground plate, shadow or semi-transparent pixels.
- Reviewed on the contact sheet (native and ×4, light and dark) and on a
  rotation sheet (0/90/180/270 on a mid-grey 50×50 tile).
