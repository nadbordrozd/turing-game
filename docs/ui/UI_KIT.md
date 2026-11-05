# Toybox UI kit

The shared screen shell for every Turing screen (bead tg-84y.5). Code:
`js/ui/kit.js` (stage, layouts, builders), `css/toybox.css` (tokens and
components), `js/ui/tiles.js` (canvas sprites), `js/ui/tile-input.js` (tile
interaction). The look follows `docs/ui/mockups/main-b-toybox.html` and
`docs/art/ART_DIRECTION.md`; there is no CRT or green-screen styling.

## Stage and layers

`t.UI.init(Q)` (called in `script.js` right after `Q.setup`) moves the Quintus
canvas into `#tg-stage` and adds HTML layers. Everything inside the stage is in
**logical canvas pixels**; the stage is scaled as a whole to fit the window, so
screens never need media queries.

| Layer | z | Holds |
| --- | --- | --- |
| `t.UI.under` (`#tg-under`) | below the canvas | card backgrounds |
| canvas | | the Quintus game; transparent where nothing is drawn |
| `t.UI.over` (`#tg-over`) | above the canvas | text, buttons; `pointer-events: none` except buttons and links |
| `t.UI.modal` (`#tg-modal`) | top | HTML popups and overlays |

The canvas backing store is `logical size x stage scale x devicePixelRatio`
(capped at 4096 px), and `Q.clear` resets the transform each frame, so sprites
keep drawing in logical pixels and stay sharp. Quintus touch input
(`lib/quintus_touch.js`, pointer events) and `t.UI.toLogical(clientX,
clientY)` map through `getBoundingClientRect`, so taps land correctly at any
scale.

## Breakpoints and modes

`t.UI.breakpoints`:

- `portraitBelow: 0.8` - a window with width / height below this uses the
  **portrait** layout, otherwise **landscape**.
- `landscape: {w: 1024, h: 768}` - logical size of landscape screens.
- `portrait: {w: 540, minH: 900, maxH: 1300}` - portrait screens are 540 wide
  and as tall as the window's aspect asks, within those limits.
- `legacy: {w: 1024, h: 768}` - what not-yet-responsive scenes are drawn for.

`t.UI.mode` is `"landscape"` or `"portrait"`; `t.UI.defaultSize(mode)` gives
the logical size for the current window; `t.UI.setSize(w, h)` changes it (a
screen may grow its height when its content needs more room; the stage is
then letterboxed). When a resize crosses the breakpoint the kit emits
`"modechange"` and restages the current base screen.

## Declaring a scene

```js
TuringScenes.add(function(Q) {          // js/scenes/<name>.js, listed in index.html
  t.UI.scene("my screen", {responsive: true, restage: function(){ ... }});
  Q.scene("my screen", function(stage) { ... });
});
```

- `responsive: true`: the scene lays itself out from `t.UI.w`, `t.UI.h` and
  `t.UI.mode`. Without it the scene is treated as legacy 1024x768 and, in
  portrait, fitted into the canvas with a Quintus stage viewport (touch
  still maps correctly).
- `covers: true`: an overlay scene on stage > 0 that hides the screen below
  (for example `endLevel`). The kit hides the HTML layers while it is shown and
  washes out the rest of the canvas.
- `restage`: how to rebuild the screen after a mode change (default: stage
  the same scene again).
- `scroll: true`: in portrait, a screen taller than the window (after
  `t.UI.setSize`) is fitted to the window width and the page scrolls
  (`t.UI.scrolling`, class `tg-scroll` on `<html>`; the canvas lets touches
  through so a drag scrolls). Landscape screens always fit the window.

Staging a scene on stage 0 clears all three HTML layers (`"screenclear"`
event), so each screen builds its HTML in its scene function.

## Builders

| Call | Makes |
| --- | --- |
| `t.UI.card(rect, cls, {tag, tagCls})` | card background in `under` plus a content box in `over`, same rect; returns `{bg, el, rect}`. Classes: `sun`, `sky`, `tomato`, `mint` (default cream). |
| `t.UI.button({label, px, icon, iconScale, cls, title, small, onClick, sound}, parent)` | a `<button class="tb-btn">`; `px` renders the label in the pixel font at that scale. Classes: `sq`, `sm`, `tall`, `big`, `round`, `sky`, `sun`, `mint`, `tomato`. Clicking plays `"click"` unless `sound: false`. |
| `t.UI.tag(text, cls, parent)` | the little pixel-font label that sits on a card's top edge |
| `t.UI.px(text, scale)` | pixel-font text (5x7 font from `tools/art/lib/font.mjs`) as inline SVG; `t.UI.pxWidth(text, scale)` measures it |
| `t.UI.icon(name, scale)` | 9x9 pixel icon as inline SVG: `play pause step stop slower faster help levels back trash start lock close undo info sound mute music music-off check` |
| `t.UI.el(tag, cls, parent, text)`, `t.UI.place(el, {x, y, w, h})` | DOM helpers |
| `t.UI.popup({title, body, actions, w, onClose})` | an HTML popup card with backdrop and close button |
| `t.UI.openModal(node, {onClose})` | shows any node in the modal layer with a focus trap; Escape closes the top modal; returns `{close}` |
| `t.UI.loading(p)`, `t.UI.loaded()` | the loading card |
| `t.UI.sfx(name)` | `t.Sfx.play(name)` when the audio module is loaded |
| `t.UI.on/off/emit(event, fn)` | small event bus (`modechange`, `screenclear`, `staged`, `stagecleared`, `run:end`, `tile:*`) |

Keyboard: every control is a real `<button>` (Tab, Enter, Space work);
modals trap focus and close on Escape.

Canvas helpers (`js/ui/tiles.js`): `Q.ProgTile` (a program tile on a `pitch`
grid, frame scaled to `pitch / frame width`), `Q.TileOverlay`, `Q.Dimmer`,
`t.UI.drawTile(ctx, op, angle, cx, cy, size, alpha)`.

## Main game screen

`js/scenes/level.js` (`t.GameScreen`) computes one layout per level from
the board size, world size, number of tray tiles and counters, then places the
board (54 px pitch, tiles edge to edge at scale 1), scales the robot cell
to fit its window, and builds the header, tray, mat, cell, counters and "Last
run" card. The deck is built by `controls.js`. `t.GameScreen.layout` holds
every rect; `t.GameScreen.targets()` is what the help overlay points at.

Tile interaction (`js/ui/tile-input.js`): tap a tray tile to select it, then
tap a cell to place it; or drag it onto the board (ghost and snap highlight;
on touch the tile floats above the finger). Tap a placed tile to turn it
clockwise (right-click: anticlockwise). Drag a placed tile to move it; drag it
off the board or onto the trash, or long-press it, to remove it. A long press on
a tray tile (touch) or its "?" badge opens its explainer. Undo button or
Ctrl/Cmd+Z. Editing is locked while a program runs or is paused. Events
`tile:select`, `tile:pick`, `tile:place`, `tile:rotate`, `tile:remove`,
`tile:undo`, `tile:clear`, `tile:locked` are emitted for feedback hooks.

## Tile explainers

`js/ui/tile-explainers.js` (`t.TileExplain`, bead tg-84y.14) replaces the 2012
`helperOptions` demos. Each tile type has an HTML card in the modal layer: a
title tag, a looping demo in its own canvas, the key point (a pale sun strip)
and one or two short sentences. The texts follow `operate()` in `Operators.js`.

| Tile | Demo |
| --- | --- |
| Step, Turn right, Turn left | the tile in all four orientations, the program marker passing through each, and below each a robot window where the robot does the same thing (steps towards its feet, or turns) |
| Belt (goto) | a 3x2 loop of belts (corners as `TuringTable.beltSheet` picks them) with the marker going round; the robot waits |
| Wall ahead?, On a blue tile? | both outcomes side by side, with the robot's sense animation (`Q.RoboFx`) and the exit the program takes lit |
| +1 | the marker passes through and the counter dial counts up |
| -1 | counter at 0 (the program takes the 0 side, the dial stays 0) next to counter above 0 (it counts down and the program takes the minus side) |

- `t.TileExplain.open(ops, {index, auto, fromPress})`: one page per operator,
  with Back / Next tile and dots when there are several; `auto` adds a "New
  tile" tag. Escape, the close button or a tap on the backdrop closes it.
- Discoverability: a "?" badge on every tray tile (a real button, so Tab and
  Enter work), a long press on a tray tile on touch, the "Tile guide" button in
  the help overlay (`openAll`: every tile type on the tray), and auto-open.
- Auto-open: `t.GameScreen.build` calls `forLevel(ops)`; tile types not in
  localStorage `turing.tilesSeen` open on one paged card. Families: operator
  names, with every colour's +1 as `Plus` and -1 as `Minus`. Opening a card in
  any way marks its types as seen.
- Landscape cards are 760 wide with the demo drawn at 1.25x; portrait cards are
  520 wide at 1x. A layout-mode change reopens the card on the same page.
- `prefers-reduced-motion: reduce` draws one still frame (where the marker
  leaves, the robot's start as a ghost, the turn arrow, the lit exit).

## End-level screen

`js/scenes/end-level.js` (`t.EndLevel`), staged on stage 2 after a victory
with `{result, totalSteps, totalParts}` (`totalParts` is ignored). It is all
HTML in the modal layer (`.el-*` in `css/toybox.css`); the stage only keeps tile
input locked. Landscape: the 1024x768 meadow fills the screen and the result
card sits in the sky. Portrait: the meadow in a framed card (whole width, so
every robot stays visible) above the result card.

- Saves `result + 1` as the level status, then compares points (sum of
  statuses) before and after: robots freed by this finish drop in with a
  sparkle, a "New!" tag and the `unlock` sound; the main robot hops. Entry 0
  is always shown, entry i from `3 * i` points (`t.EndLevel.freed`).
- Card: level tag, title by parts, a hint with the next step target, steps,
  the three parts with their `level.times` targets, "N / 32 robots freed" with
  a bar, and Back to board (also Escape), Level select, Next level (the next
  playable level in order; hidden when there is none).
- A level with `alwaysFull` (`just give up`) shows a celebration popup with
  the `fanfare` sound the first time it is finished on this device
  (localStorage `turing.celebrated.<level name>`). The `exit` sound is played
  by the robot feedback (tg-84y.7) when the robot reaches the hatch, not here.
- A layout-mode change restages the game screen and puts the result screen
  back without replaying the entrance.

## Level selector

`js/scenes/level-selector.js` (`t.LevelSelector`). Tracks are configured in
`GROUPS` by their first level(s); every other level joins the track of its
single requirement, and a level with several requirements goes to the Finale.
Inside a track the child that leads to the most levels is the main path and
the rest branch off. Landscape packs each track into a left-to-right tree
(`ARRANGE` places the tracks; the logical size grows only if they do not fit
1024x768); portrait shows each track as an indented list and scrolls
(`scroll: true`). Node states: open (cream), solved (mint, parts earned),
locked (dashed; clicking explains what opens it), and the suggested next level
(sun, "NEXT"): the first open level in level order.
