# Level time calibration

Per-level step thresholds for scoring (bead tg-84y.10). Scoring is by
execution time only: `level.times = [t3, t2, t1]` are the most steps that
still earn 3, 2 and 1 parts; a slower finish earns 0. "just give up" is
`alwaysFull` (3 parts for any finish) and has no thresholds.

## How steps are counted

The game scores `tt.totalSteps`, saved by `TuringTable.saveNumberOfStepsAndParts`
at the moment the winning move is computed: it is the number of program steps
already queued, i.e. the entry step onto the board plus every tile executed
before the winning one. Goto and conditional tiles cost a step like any other
tile; a wall bump costs a step.

Levels with several start variants (`level.alternatives`: the counter levels)
play every variant in turn, starting after `level.current` and wrapping round,
and the score uses the steps of the variant played **last**. Which one that is
depends on history: a fresh page starts with `current = 0`, so variant 0 is
scored, but a run that fails part-way leaves `current` advanced, and the next
successful run is scored on a different variant. Calibration therefore uses
the **worst** (maximum) step count over all variants. The per-variant numbers
are listed below. Randomness in the level files (`randInt`) only picks the
rotation of lava and ice sprites; it does not affect play.

## Method

Every solution was played with the game's own logic files:

- `tools/levels/harness.mjs` loads `TuringTable.js`, `RobotTable.js`,
  `Operators.js`, `controls.js`, `levels*.js` and friends into a Node sandbox
  with only the display layer stubbed, opens the level with
  `t.Levels.setLevel`, places tiles with `TuringTable.setTile` and presses the
  real Run handler from `controls.js`.
- `tools/levels/browser-check.mjs` repeats every solution in the real page in
  headless Chrome (`--mute-audio`, game sound muted) through
  `t.LevelSelector.play`, `setTile` and a click on the Run button, and reads
  the `totalSteps` the game passes to `getResult`. On 2026-11-05 all stored
  solutions gave the same step counts in the browser as in the harness.

Solutions were found by hand design plus three helpers (not committed, the
results are): a BFS over robot moves for the shortest walk (a lower bound on
B, since every robot action costs one step), an enumeration of
"prefix + loop" programs made only of step/turn tiles, and a local search
that mutates tiles on the board and keeps changes that still win in fewer
steps. Where a straight line of tiles fits on the board it is optimal.

Thresholds from the best step count found, B:

- t3 = ceil(1.05 B), never below B;
- t2 = 1.4 B;
- t1 = 2.25 B ("for": 2.5 B, see notes);
- values of 40 and up are rounded up to a multiple of 5, and each tier keeps at
  least 2 steps over the one before (tiny levels).

## Replaying

```sh
node tools/levels/replay-solutions.mjs          # every stored solution still wins, scores 3, same B
node tools/levels/check-levels.mjs              # times well-formed and monotone
python3 -m http.server 8000 --bind 127.0.0.1 &  # then, optionally, in the real game:
node tools/levels/browser-check.mjs --url http://127.0.0.1:8000/
```

Solutions are stored in `tools/levels/solutions/solutions.json`, one grid per
level, top row first. Each cell is `.` (empty) or an instruction shortname
followed by its arrow: `>` `^` `<` `v` (tile angle 0 to 3). Shortnames are the
game's own: `s` step, `C` goto, `cw` turn right, `cc` turn left, `d` wall
detector, `dm` colour detector, `pRed`/`mRed` plus/minus for a colour. A
branch tile (`d`, `dm`, `m<Colour>`) whose arrow points `>` sends the program
up (left of the arrow) on "yes" (wall ahead / on a coloured tile / counter is
0) and down (right of the arrow) on "no" (the counter is then decremented).
The program enters the board at the left edge of the middle row.

## Results

B is the worst-case step count of the best program found; times are [t3, t2, t1].

| Level | B | Times | Variants | Solution |
|---|---|---|---|---|
| `start here` | 1 | [2, 4, 6] | 1 | One Step tile. |
| `chaining` | 4 | [5, 7, 9] | 1 | Four Step tiles in a row. |
| `De revolutionibus` | 4 | [5, 7, 9] | 1 | Step, step, turn right, step. |
| `bend it` | 7 | [8, 10, 16] | 1 | Straight line: 4 steps, turn right, 2 steps, bent along the board. |
| `hedge` | 10 | [11, 14, 23] | 1 | Straight line: 3 steps, left, 2 steps, left, 3 steps. |
| `resistors` | 6 | [7, 9, 14] | 1 | Straight line around the 2x2 block of parts. |
| `more resistors` | 21 | [23, 30, 50] | 1 | 21-tile straight line (shortest walk found by BFS) snaked over the board. |
| `out of reach` | 8 | [9, 12, 18] | 1 | Two Step tiles pointing at each other: a loop of steps. |
| `stairs` | 31 | [33, 45, 70] | 1 | A 4-tile loop: step, left, step, right. |
| `conditionals` | 18 | [19, 26, 45] | 1 | Found by local search: a 3-step loop guarded by a wall detector; on a wall, turn right and run 3 extra steps on the way back into the loop. |
| `spiral` | 78 | [85, 110, 180] | 1 | Wall follower (go until wall, turn left) with multi-step blocks, polished by local search. |
| `zigzag` | 97 | [105, 140, 220] | 1 | Corridor follower (step until wall; turn left, or right twice if left is blocked), polished by local search. |
| `anywhere` | 60 | [65, 85, 135] | 1 | An 18-tile loop that snakes two columns per lap (S x6, L, S, L, S x6, R, S, R); every step is a robot action (48 moves + 12 turns). |
| `way out` | 55 | [60, 80, 125] | 1 | Three steps to the bottom tip, then a 14-tile loop (bump, turn round, staircase S R S L S R S L S R S) that walks one quarter of the diamond per lap. |
| `goodwin` | 28 | [30, 40, 65] | 1 | Prefix SSSRSR, then an 8-tile loop SSSSLSRR (the dots repeat with 4-fold symmetry); 28 = shortest walk. |
| `your ad here` | 29 | [31, 45, 70] | 1 | An 8-tile loop: 3 steps, left, step, right, step, left. |
| `hobbit:` | 317 | [335, 445, 715] | 1 | Two steps, then a 10-tile loop S S S R S S L S S L (found by enumerating prefix+loop programs); laps sweep the pillar grid diagonally. |
| `tunnel` | 173 | [185, 245, 390] | 1 | Corridor follower (step; at a wall turn left, else right), polished by local search. |
| `labirynth` | 443 | [470, 625, 1000] | 1 | Right-hand wall follower, polished by local search. |
| `++` | 6 | [7, 9, 14] | 1 | Five Plus Red tiles, then a step. |
| `--` | 17 | [18, 24, 39] | 4 | Two Minus Red tiles pointing at each other (1 step per decrement); either one steps out when Red is 0. Steps = Red + 2. |
| `:=` | 32 | [34, 45, 75] | 5 | 2-tile loop Minus Red / Plus Blue; step out when Red is 0. Steps = 2\*Red + 2. |
| `*2` | 32 | [34, 45, 75] | 4 | 6-tile loop: (Minus Red, Plus Blue, Plus Blue) twice; either Minus Red steps out at 0. Steps = 3\*Red + 2. |
| `+` | 22 | [24, 31, 50] | 5 | Loop Minus Red / Plus Yellow, a goto, then loop Minus Blue / Plus Yellow, step. Steps = 2\*(Red+Blue) + 4. |
| `*` | 79 | [85, 115, 180] | 5 | Outer loop on Blue; inner 4-tile loops move Red into Yellow+Pink, then Pink into Yellow+Red on the next pass (no copy-back). |
| `/2` | 23 | [25, 33, 55] | 4 | 6-tile loop: (Minus Red, Minus Red, Plus Blue) twice; Red is even so only the first Minus of each pair can find 0. Steps = 1.5\*Red + 2. |
| `!` | - | [600, 900, 1400] (provisional) | 5 | not solved in this pass |
| `Euclid` | - | [150, 220, 320] (provisional) | 5 | not solved in this pass |
| `/` | 116 | [125, 165, 265] | 5 | Repeated subtraction: each pass checks Red (stop at 0), then moves the divisor between Blue and Pink while taking one from Red per unit (4-tile loops), and adds one to Yellow. |
| `Fibonacci` | 108 | [115, 155, 245] | 5 | Blue := 1, then Red-1 phases that rotate the largest of Blue/Yellow/Pink into the other two (4-tile loops); when Red runs out, move the result into Blue (clearing it first if needed) and step. |
| `Counting steps` | 69 | [75, 100, 160] | 1 | First leg: wall-detector loop that counts its steps with Plus Red; second leg: Minus Red loop spends the count; third leg: plain step loop to the hatch (polished by local search). |
| `hobbit harder` | - | [250, 350, 499] (provisional) | 1 | not solved in this pass |
| `vertigo` | 11 | [12, 16, 25] | 1 | Found by local search: step, turn left, a 6-step loop east along row 1 with a wall detector at its foot; it ends at the hatch in 11 steps (shortest walk is 10). |
| `some flag?` | - | [150, 220, 320] (provisional) | 1 | not solved in this pass |
| `just give up` | 243 | always 3 | 1 | A 10-tile loop S S S L S S L S S L (found by enumerating prefix+loop programs); one-sided walls and bumps steer it through all five parts. |
| `ring of fire` | 113 | [120, 160, 255] | 1 | Found by local search from an empty board: wall-detector loop that circles inside the lava ring. |
| `P` | - | [357, 400, 460] (provisional) | 1 | not solved in this pass |
| `warm-up` | 44 | [50, 65, 100] | 1 | Three steps to the centre, then a 12-tile loop R S S S S S R R S S S S: each lap turns right at the centre, runs out to an arm end (the fifth step bumps the edge), turns round and runs back. |
| `Z(2)` | - | [80, 120, 180] (provisional) | 1 | not solved in this pass |
| `for` | 53 | [60, 75, 135] | 1 | 53-tile straight line (shortest walk) snaked over the 8x8 board; no counters needed. |
| `giftwrapped` | 90 | [95, 130, 205] | 1 | Found by local search from an empty board: wall and colour detectors steer it round the ribbon. |
| `x` | 58 | [65, 85, 135] | 1 | Found by local search from an empty board: colour-detector loop. |
| `no turn sign` | 26 | [28, 37, 60] | 1 | A 12-tile loop S S L S S S S L S S S L (found by enumerating prefix+loop programs). |
| `detector` | 17 | [18, 24, 39] | 1 | Found by local search: colour-detector loop. |
| `robozzle` | - | [80, 120, 180] (provisional) | 1 | not solved in this pass |

## Notes and oddities

- **Unsolved in this pass (times still PROVISIONAL, no stored solution):**
  `!`, `Euclid`, `hobbit harder`, `some flag?`, `P`, `Z(2)`, `robozzle`.
  The local search found a 764-step robozzle program (not stored: it would
  make the thresholds far too lenient); a proper colour-detector spiral
  should be much faster.
- **Weak B (likely beatable by a strong player, so the thresholds are on the
  lenient side):** `labirynth` (443; the shortest walk is 107 moves, but the
  maze is irregular and the board only 6x6), `tunnel` (173; walk 69),
  `hobbit:` (317), `zigzag` (97; walk 56), `spiral` (78; walk 56), `*`, `/`,
  `Fibonacci` (4-tile loops; 6-tile unrolled loops would save about a
  quarter), `Counting steps` (69; walk 31).
- **Near-optimal:** every level where B equals the shortest walk (the BFS
  lower bound): start here, chaining, De revolutionibus, bend it, hedge,
  resistors, more resistors, out of reach, stairs, goodwin, your ad here,
  anywhere (snake), for. `vertigo` is 11 against a walk of 10.
- **"for" is a straight line.** The 8x8 board holds the whole 53-move walk,
  so the fastest program uses no counters at all. A counter-loop solution
  (the level's hint) costs roughly 3 steps per move, about 150 to 200 steps,
  which scores 0 with t1 = 135 (2.5 B). Widen t1 if the counter solution
  should still earn a part.
- **Variant-dependent scores.** On the counter levels the score depends on
  which variant ran last (see "How steps are counted"): for `--` the same
  program reports 3, 4, 7 or 17 steps. Calibrating on the worst case means a
  fresh player (scored on variant 0) is judged leniently. A follow-up could
  make the game score the maximum over variants, which is what the thresholds
  assume.
- **zigzag hides its hatch until the first run.** Its `set` does not call
  `setRobotTable`, so the exit hatch at (0, 8) is only placed when Run (or
  Stop) resets the cell.
- **Walls are one-sided.** Wall, tunnel, corner and dead-end tiles only block
  moves *out of* the tile they are on; a robot can enter them from any side.
  Several fast solutions (vertigo, just give up) rely on this.

## Solutions

The same grids as `tools/levels/solutions/solutions.json`.

### `start here`

B = 1. One Step tile.

```text
s>
```

### `chaining`

B = 4. Four Step tiles in a row.

```text
. . . .
. . . .
s> s> s> s>
. . . .
```

### `De revolutionibus`

B = 4. Step, step, turn right, step.

```text
. . . . .
. . . . .
s> s> cw> s> .
. . . . .
. . . . .
```

### `bend it`

B = 7. Straight line: 4 steps, turn right, 2 steps, bent along the board.

```text
. . . . s>
. . . . s^
s> s> s> s> cw^
. . . . .
. . . . .
```

### `hedge`

B = 10. Straight line: 3 steps, left, 2 steps, left, 3 steps.

```text
. s> s< s< cc<
. . . . s^
s> s> s> cc> s^
. . . . .
. . . . .
```

### `resistors`

B = 6. Straight line around the 2x2 block of parts.

```text
. . . . .
. . . . s>
s> s> cc> s> cc^
. . . . .
. . . . .
```

### `more resistors`

B = 21. 21-tile straight line (shortest walk found by BFS) snaked over the board.

```text
. . cw> s> cwv
. . s^ cw< sv
s> s> s> s^ sv
sv s< s< cc< s<
cc> s> s> s> s>
```

### `out of reach`

B = 8. Two Step tiles pointing at each other: a loop of steps.

```text
sv
s^
```

### `stairs`

B = 31. A 4-tile loop: step, left, step, right.

```text
cwv s< .
s> cc^ .
. . .
```

### `conditionals`

B = 18. Found by local search: a 3-step loop guarded by a wall detector; on a wall, turn right and run 3 extra steps on the way back into the loop.

```text
s> sv cc^
s^ dv cwv
s^ s< s<
```

### `spiral`

B = 78. Wall follower (go until wall, turn left) with multi-step blocks, polished by local search.

```text
sv s< C^ C> cwv
sv s^ cc< s> dv
s> s> d> s< .
d> s> s> s^ cc<
C> . . cwv s^
```

### `zigzag`

B = 97. Corridor follower (step until wall; turn left, or right twice if left is blocked), polished by local search.

```text
Cv C> d^ cc< cw<
s> sv C< d^ C>
sv s< ccv . .
cc> d< s< dv s^
cw> cw> s^ d^ Cv
```

### `anywhere`

B = 60. An 18-tile loop that snakes two columns per lap (S x6, L, S, L, S x6, R, S, R); every step is a robot action (48 moves + 12 turns).

```text
sv s< s< s< s< cc<
s> cwv . . . s^
cwv s< . . . cc^
s> s> s> s> s> s^
. . . . . .
. . . . . .
```

### `way out`

B = 55. Three steps to the bottom tip, then a 14-tile loop (bump, turn round, staircase S R S L S R S L S R S) that walks one quarter of the diamond per lap.

```text
. sv cw< s< cc< s<
. cc> s> cwv . cw^
. . . sv . s^
s> s> s> s> cw> cw^
. . . . . .
. . . . . .
```

### `goodwin`

B = 28. Prefix SSSRSR, then an 8-tile loop SSSSLSRR (the dots repeat with 4-fold symmetry); 28 = shortest walk.

```text
ccv s< s< s<
s> cw> cw> s^
s> s> sv cw^
. . cw> s^
```

### `your ad here`

B = 29. An 8-tile loop: 3 steps, left, step, right, step, left.

```text
. . . .
ccv s< cw< s<
s> s> s> cc^
. . . .
```

### `hobbit:`

B = 317. Two steps, then a 10-tile loop S S S R S S L S S L (found by enumerating prefix+loop programs); laps sweep the pillar grid diagonally.

```text
. sv cc< s< s<
. s> ccv . cw^
s> s> s> s> s^
. . . . .
. . . . .
```

### `tunnel`

B = 173. Corridor follower (step; at a wall turn left, else right), polished by local search.

```text
. . cc< d< s^
cwv s> C< C^ cw<
s> cc> s> ccv s^
cc> d^ sv sv C<
cw< cw^ s< cw< cw^
```

### `labirynth`

B = 443. Right-hand wall follower, polished by local search.

```text
cw> . C> C> cwv sv
cc^ sv . sv d^ ccv
s> cwv d> cc^ C^ .
s^ Cv dv cc< d< cc<
s< s> cw^ d< C< ccv
dv cwv ccv C^ . C^
```

### `++`

B = 6. Five Plus Red tiles, then a step.

```text
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
pRed> pRed> pRed> pRed> pRed> s> . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
```

### `--`

B = 17 (worst of 4 variants; per variant [7,4,3,17]). Two Minus Red tiles pointing at each other (1 step per decrement); either one steps out when Red is 0. Steps = Red + 2.

```text
. . . . . . . .
. . . . . . . .
. . . . . . . .
s> . . . . . . .
mRed> . . . . . . .
mRed< . . . . . . .
s> . . . . . . .
. . . . . . . .
```

### `:=`

B = 32 (worst of 5 variants; per variant [22,10,14,6,32]). 2-tile loop Minus Red / Plus Blue; step out when Red is 0. Steps = 2\*Red + 2.

```text
. . . . . . . .
. . . . . . . .
. . . . . . . .
s> . . . . . . .
mRed> . . . . . . .
pBlue^ . . . . . . .
. . . . . . . .
. . . . . . . .
```

### `*2`

B = 32 (worst of 4 variants; per variant [11,17,23,32]). 6-tile loop: (Minus Red, Plus Blue, Plus Blue) twice; either Minus Red steps out at 0. Steps = 3\*Red + 2.

```text
. . . . . . . .
. . . . . . . .
. . s> . . . . .
pBlue> pBlue> mRed> . . . . .
mRed< pBlue< pBlue< . . . . .
s> . . . . . . .
. . . . . . . .
. . . . . . . .
```

### `+`

B = 22 (worst of 5 variants; per variant [16,16,14,14,22]). Loop Minus Red / Plus Yellow, a goto, then loop Minus Blue / Plus Yellow, step. Steps = 2\*(Red+Blue) + 4.

```text
. . . . . . . .
. . . . . . . .
. . . . . . . .
pYellowv . . . . . . .
mRed< s> . . . . . .
C> mBlue> . . . . . .
. pYellow^ . . . . . .
. . . . . . . .
```

### `*`

B = 79 (worst of 5 variants; per variant [47,55,43,79,71]). Outer loop on Blue; inner 4-tile loops move Red into Yellow+Pink, then Pink into Yellow+Red on the next pass (no copy-back).

```text
. . . . . . . .
. . . . . . . .
Cv C< C< . . . . .
Cv s> C^ C< . . . .
C> mBlue> mBlue^ mPink> C< . . .
pYellowv mRedv C^ pYellow> pRed^ . . .
pPink> C^ . . . . . .
. . . . . . . .
```

### `/2`

B = 23 (worst of 4 variants; per variant [11,8,17,23]). 6-tile loop: (Minus Red, Minus Red, Plus Blue) twice; Red is even so only the first Minus of each pair can find 0. Steps = 1.5\*Red + 2.

```text
. . . . . . . .
. . . . . . . .
. . s> . . . . .
mRed^ pBlue> mRed> . . . . .
mRed< pBlue< mRedv . . . . .
s> . . . . . . .
. . . . . . . .
. . . . . . . .
```

### `/`

B = 116 (worst of 5 variants; per variant [116,32,24,70,46]). Repeated subtraction: each pass checks Red (stop at 0), then moves the divisor between Blue and Pink while taking one from Red per unit (4-tile loops), and adds one to Yellow.

```text
. . . . . . . .
. . . . . . . .
. . . . Cv pBlue< . .
s> Cv C< pYellow< mPink^ mRed< . .
mRed> C< . mPink^ pBlue^ . . .
mBlue> pYellow> C> mRed< . . . .
pPink> mBlue> C< s> . . . .
. mRed^ pPink^ . . . . .
```

### `Fibonacci`

B = 108 (worst of 5 variants; per variant [108,30,32,59,102]). Blue := 1, then Red-1 phases that rotate the largest of Blue/Yellow/Pink into the other two (4-tile loops); when Red runs out, move the result into Blue (clearing it first if needed) and step.

```text
. . . . . . . s>
. . pYellowv pBlue< . C> mBluev mPink>
. . C> mPink< mRedv C> C^ pBlue^
. . s> Cv C^ Cv pBlue<  .
pBlue> mRed^ mRed> C< C^ mYellow^ pPink^ .
. pYellowv mBluev C> C> mRed< . .
. pPink> C^ . s> mYellow^ pBlue< .
. . . . . . . .
```

### `Counting steps`

B = 69. First leg: wall-detector loop that counts its steps with Plus Red; second leg: Minus Red loop spends the count; third leg: plain step loop to the hatch (polished by local search).

```text
s> mRedv cc> sv
cwv cc^ C^ s^
s> d> C< C<
C> s> pRed^ C^
```

### `vertigo`

B = 11. Found by local search: step, turn left, a 6-step loop east along row 1 with a wall detector at its foot; it ends at the hatch in 11 steps (shortest walk is 10).

```text
cc> s> sv
s> cc^ sv
d< s< s<
```

### `just give up`

B = 243. A 10-tile loop S S S L S S L S S L (found by enumerating prefix+loop programs); one-sided walls and bumps steer it through all five parts.

```text
. . . . . .
. . . . . .
ccv s< s< cc< s< .
s> s> s> cc> s^ .
. . . . . .
. . . . . .
```

### `ring of fire`

B = 113. Found by local search from an empty board: wall-detector loop that circles inside the lava ring.

```text
C> cc> cw^ d^
. ccv dv ccv
d^ Cv s^ ccv
ccv s> cw^ s<
```

### `warm-up`

B = 44. Three steps to the centre, then a 12-tile loop R S S S S S R R S S S S: each lap turns right at the centre, runs out to an arm end (the fifth step bumps the edge), turns round and runs back.

```text
cwv cw< s< s< s<
s> s> s> sv s^
s> s> s> cw> s^
. . . . .
. . . . .
```

### `for`

B = 53. 53-tile straight line (shortest walk) snaked over the 8x8 board; no counters needed.

```text
s> s> s> s> s> cc> s> sv
s^ sv s< s< s< s< cc< sv
cc^ s> s> s> cc> sv s^ sv
s^ s< s< s< s< s< s^ sv
s> s> s> s> s> s> s^ ccv
sv s< s< cc< s< s< s< s<
cc> s> s> cc> s> . . .
. . . . . . . .
```

### `giftwrapped`

B = 90. Found by local search from an empty board: wall and colour detectors steer it round the ribbon.

```text
d< . dm< s> C<
cwv s> dmv cc> sv
cc> cc^ . cc> sv
dv cc^ dmv dm> s<
dv . s^ C< C>
```

### `x`

B = 58. Found by local search from an empty board: colour-detector loop.

```text
cw> sv dmv s>
dm^ sv s< dm<
s^ dm^ cw^ ccv
cw> s> C^ .
```

### `no turn sign`

B = 26. A 12-tile loop S S L S S S S L S S S L (found by enumerating prefix+loop programs).

```text
sv s< sv s<
ccv s^ cc< s^
s> s> cc> s^
. . . .
```

### `detector`

B = 17. Found by local search: colour-detector loop.

```text
sv cw< s<
s> dm> s^
. s> s^
```
