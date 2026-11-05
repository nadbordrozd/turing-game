# Illustrations asset contract

Status: draft (2026-11-05), under the approved "Toybox pixel" direction in
[`../ART_DIRECTION.md`](../ART_DIRECTION.md). First set: `art/sets/intro-v1`
(bead tg-vy4.18).

## Inventory

| Asset | Native size | Game file |
| ----- | ----------- | --------- |
| Intro beat 1: robot butler serves a top-hatted gentleman | 300×172 | `images/intro/intro-1.png` (900×516), `intro-1-portrait.png` (684×516) |
| Intro beat 2: robot at a chalkboard of equations | 300×172 | `images/intro/intro-2.png`, `intro-2-portrait.png` |
| Intro beat 3: robots behind prison bars, the middle one defiant | 300×172 | `images/intro/intro-3.png`, `intro-3-portrait.png` |

The old CRT intro (`images/intro1.png`..`intro3.png`, text baked in) stays
until the intro screen is rebuilt (tg-84y.8); the new images carry no text.

## Geometry

- Generate at 300×172 (Pixen sides are multiples of 4) and scale ×3
  nearest-neighbour to 900×516 for an illustration area of about 900×520.
- Portrait layouts use a 228×172 crop (×3 = 684×516, about 4:3) chosen per
  image in `outputs[]` so the main subject stays in frame.
- Opaque background filling the canvas; straight-on, eye-level, side-on
  scene. No text, captions or speech bubbles.

## Readability

- Characters are big and central; the story beat reads at native size.
- The intro robot is one character in every beat and keeps the original
  intro's design language: cream head shaped like an upside-down trapezoid
  (flowerpot) with a red rim, a small sky-blue visor with round eyes below
  it, yellow-ball antenna, rounded tomato-red box body, grey segmented stick
  arms with grey hands, thin grey legs.

## Recipe

- Endpoint `create-image-pixen`, `noBackground: false`, options `view:
  "side"`, `outline: "single color black outline"`, `detail: "medium
  detail"`; fragments `style` + `class-illustrations`.
- Spell the robot out in full in every subject (head, visor, eyes, antenna,
  body, arms, hands, legs, with colours). "Grey hands" must be explicit or
  Pixen gives mint-green or yellow mitts.
- Say "ONE tray, ONE glass" and "seen from head to knees, close together in
  the centre": the first take doubled the prop and cropped both characters.
- Chalkboard maths comes out as nonsense glyphs, which reads fine as maths.

## Acceptance

- Same robot on-model across the set (head shape, visor, colours, hands).
- No text, no frame or border, no watermark.
- Reviewed native and ×2/×3 on light and dark, and the portrait crop
  checked by eye.
