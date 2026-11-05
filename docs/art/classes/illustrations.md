# Illustrations asset contract

Status: draft (2026-11-05), under the approved "Toybox pixel" direction in
[`../ART_DIRECTION.md`](../ART_DIRECTION.md). First set: `art/sets/intro-v1`
(bead tg-vy4.18); v2 of slides 1 and 2 in the same set (tg-vy4.20).

## Inventory

| Asset | Native size | Game file |
| ----- | ----------- | --------- |
| Intro beat 1: small robot butler serves a towering top-hatted gentleman (`beat1-ai#0`) | 300×172 | `images/intro/intro-1.png` (900×516), `intro-1-portrait.png` (684×516) |
| Intro beat 2: robot at a chalkboard of real equations (`beat2-c#0` + `tools/art/intro-chalk.mjs`) | 300×172 | `images/intro/intro-2.png`, `intro-2-portrait.png` |
| Intro beat 3: robots behind prison bars, the middle one defiant | 300×172 | `images/intro/intro-3.png`, `intro-3-portrait.png` |

The old CRT intro (`images/intro1.png`..`intro3.png`, text baked in) stays
until the intro screen is rebuilt (tg-84y.8); the new images carry no text.

## Geometry

- Generate at 300×172 (Pixen sides are multiples of 4) and scale ×3
  nearest-neighbour to 900×516 for an illustration area of about 900×520.
- Portrait layouts use a 228×172 crop (×3 = 684×516, about 4:3) chosen per
  image in `outputs[]` (beat 2: in `intro-chalk.mjs`) so the main subject stays in frame.
- Opaque background filling the canvas; straight-on, eye-level, side-on
  scene. No text, captions or speech bubbles.

## Readability

- Characters are big and central; the story beat reads at native size.
- The intro robot is one character in every beat and keeps the original
  intro's design language: cream head shaped like an upside-down trapezoid
  (flowerpot) with a red rim, a small sky-blue visor with round eyes below
  it, yellow-ball antenna, rounded tomato-red box body, grey segmented stick
  arms with grey hands, thin grey legs.
- The robot's face is calm and neutral: round eyes and a small flat mouth,
  no smile (user, tg-vy4.20). In beat 1 the robot is clearly smaller than
  the gentleman (its head at his chest): servile, not his equal.

## Recipe

- Endpoint `create-image-pixen`, `noBackground: false`, options `view:
  "side"`, `outline: "single color black outline"`, `detail: "medium
  detail"`; fragments `style` + `class-illustrations`.
- Spell the robot out in full in every subject (head, visor, eyes, antenna,
  body, arms, hands, legs, with colours). "Grey hands" must be explicit or
  Pixen gives mint-green or yellow mitts.
- Say "ONE tray, ONE glass" and "seen from head to knees, close together in
  the centre": the first take doubled the prop and cropped both characters.
- Pixen cannot write: chalkboard maths comes out as nonsense glyphs, which
  the user rejected. Ask for a "completely clean and empty" board (negatives:
  writing, equations, chalk marks) and draw the maths with
  `tools/art/intro-chalk.mjs`: a tiny hand-made pixel glyph set (H, L, p, q,
  q̇, ṗ, ∂, ψ, ħ, Ĥ, π, ∫, √, ...) chalked at native resolution onto the
  board colour only (it fails if a stroke would touch the robot or the
  frame), main derivation at 2× (2-px strokes), side notes at 1×. Content:
  Hamilton's mechanics as in the 2012 original (H = p·q̇ − L, q̇ = ∂H/∂p,
  ṗ = −∂H/∂q), Euler's identity, Schrödinger's equation, the Gaussian
  integral and a phase-space portrait of the harmonic oscillator. The
  master stays the recorded take; `--check` re-derives the game files and
  runs in the integrator's art gate.
- Size relations: "fat-cat" is drawn literally (a cat). Say "wide shot,
  both seen in full from head to feet", "a huge portly HUMAN gentleman",
  "a tiny robot, half his height", and "ONE tray ... the only drink in the
  picture", or Pixen hands him a second glass. Flowerpot head and a single
  antenna still miss often: about 1 in 30 takes had everything (beat1-ai).
- Small fixes to an otherwise right take (the beat-1 mouth's 1-px upturn)
  are recorded `edits` steps in `outputs[]`, never changes to the master.

## Acceptance

- Same robot on-model across the set (head shape, visor, colours, hands).
- No text, no frame or border, no watermark.
- Reviewed native and ×2/×3 on light and dark, and the portrait crop
  checked by eye.
- Chalk maths is real and correct, legible at the 900×516 display and in the
  portrait crop, and every board element stays inside the portrait crop.
