# Level time calibration

Per-level step thresholds for scoring (beads tg-84y.10, round 1, and
tg-84y.15, round 2). Scoring is by execution time only: `level.times =
[t3, t2, t1]` are the most steps that still earn 3, 2 and 1 parts; a slower
finish earns 0. "just give up" is `alwaysFull` (3 parts for any finish) and
has no thresholds. Every level now has a stored, replayed solution; none is
provisional.

## How steps are counted

The game scores `tt.totalSteps`, saved by `TuringTable.saveNumberOfStepsAndParts`
at the moment the winning move is computed: it is the number of program steps
already queued, i.e. the entry step onto the board plus every tile executed
before the winning one. Goto and conditional tiles cost a step like any other
tile; a wall bump costs a step.

Levels with several start variants (`level.alternatives`: the counter levels)
play every variant in turn and stop at the first one that fails (that run is
the one animated). When every variant wins, the run is scored on the **worst**
variant: the most steps over all variants of that run, lowest variant index on
a tie (`playAlternativesVirtually` in `controls.js`, since round 2). That
variant is then replayed, so the animation, the "Last run" card and the
end-of-level card all show the scored number, and the score no longer depends
on which variant ran before (round 1 scored the variant that happened to run
last, so the same `--` program could report 3, 4, 7 or 17 steps). After a run
`TuringTable.variantSteps[i]` holds the steps of variant `i`. Randomness in
the level files (`randInt`) only picks the rotation of lava and ice sprites;
it does not affect play.

## Method

Every solution was played with the game's own logic files:

- `tools/levels/harness.mjs` loads `TuringTable.js`, `RobotTable.js`,
  `Operators.js`, `controls.js`, `levels*.js` and friends into a Node sandbox
  with only the display layer stubbed, opens the level with
  `t.Levels.setLevel`, places tiles with `TuringTable.setTile` and presses the
  real Run handler from `controls.js`. On a level with variants it presses Run
  once from every starting variant and checks that all runs report the same
  steps.
- `tools/levels/browser-check.mjs` repeats every solution in the real page in
  headless Chrome (`--mute-audio`, game sound muted) through
  `t.LevelSelector.play`, `setTile` and a click on the Run button, from every
  starting variant, and reads the `totalSteps` the game passes to
  `getResult`. On 2026-11-05 (round 2) all stored solutions gave the same
  step counts in the browser as in the harness, independent of the starting
  variant.

Solutions were found by hand design plus helpers (not committed, the results
are): a BFS over robot moves for the shortest walk (a lower bound on B for
robot levels, since every robot action costs one step); an enumeration of
"prefix + loop" programs of step and turn tiles; an enumeration of detector
policies `loop { X; detector ? Y : Z }` (X, Y, Z short strings of step and
turn tiles) simulated on the game's `RobotTable`; a placer that embeds a flow
graph of tiles on the board (goto chains routed through free cells); and a
local search (simulated annealing over the board, scored by the game) used
from an empty board and to polish the other results. Where a straight line of
tiles fits on the board it is optimal. On a grid every closed loop of tiles
has even length, so a 3-tile counter loop needs a goto (4 steps per unit);
unrolling it to a 6-tile ring of two copies (3 steps per unit) was the main
gain on the counter levels in round 2. A branch tile in such a ring must sit on
a corner of the ring (its two exits are opposite each other), unless one exit
is never taken.

The counter levels are calibrated on **general** programs that would work for
any input. A program specialised to the five fixed variants can be much
faster (for `!`, counting out each variant's answer directly would take about
150 steps against 673); that would make the thresholds unreachable for anyone
who actually computes the factorial, so it is not used as B.

Thresholds from the best step count found, B:

- t3 = ceil(1.05 B), never below B;
- t2 = 1.4 B;
- t1 = 2.25 B ("for": widened to 240, see notes);
- values of 40 and up are rounded up to a multiple of 5, and each tier keeps at
  least 2 steps over the one before (tiny levels).

## Replaying

```sh
node tools/levels/replay-solutions.mjs          # every stored solution still wins, scores 3, same B, history-independent
node tools/levels/check-levels.mjs              # times well-formed and monotone
python3 -m http.server 8000 --bind 127.0.0.1 &  # then, optionally, in the real game:
node tools/levels/browser-check.mjs --url http://127.0.0.1:8000/
```

Solutions are stored in `tools/levels/solutions/solutions.json`, one grid per
level, top row first, with `perVariant` steps for the counter levels and an
optional `alt` list of extra evidence programs (each with the parts it must
earn; `replay-solutions` checks those too). Each cell is `.` (empty) or an
instruction shortname followed by its arrow: `>` `^` `<` `v` (tile angle 0
to 3). Shortnames are the game's own: `s` step, `C` goto, `cw` turn right,
`cc` turn left, `d` wall detector, `dm` colour detector, `pRed`/`mRed`
plus/minus for a colour. A branch tile (`d`, `dm`, `m<Colour>`) whose arrow
points `>` sends the program up (left of the arrow) on "yes" (wall ahead / on
a coloured tile / counter is 0) and down (right of the arrow) on "no" (the
counter is then decremented). The program enters the board at the left edge
of the middle row.

## Results

B is the step count of the best program found (on counter levels: of its
worst variant, which is what the game scores); times are [t3, t2, t1].

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
| `spiral` | 70 | [75, 100, 160] | 1 | Found by enumerating detector policies: 4 steps; if a wall is ahead turn left, else 4 more steps and turn left. |
| `zigzag` | 56 | [60, 80, 130] | 1 | The shortest walk as a 24-tile loop: 8 steps, left, 2 steps, left, 8 steps, right, 2 steps, right. 56 = shortest walk. |
| `anywhere` | 60 | [65, 85, 135] | 1 | An 18-tile loop that snakes two columns per lap (S x6, L, S, L, S x6, R, S, R); every step is a robot action (48 moves + 12 turns). |
| `way out` | 55 | [60, 80, 125] | 1 | Three steps to the bottom tip, then a 14-tile loop (bump, turn round, staircase S R S L S R S L S R S) that walks one quarter of the diamond per lap. |
| `goodwin` | 28 | [30, 40, 65] | 1 | Prefix SSSRSR, then an 8-tile loop SSSSLSRR (the dots repeat with 4-fold symmetry); 28 = shortest walk. |
| `your ad here` | 29 | [31, 45, 70] | 1 | An 8-tile loop: 3 steps, left, step, right, step, left. |
| `hobbit:` | 173 | [185, 245, 390] | 1 | Detector policy from enumeration (4 steps; wall ahead? R S S : S L L S L), then polished by local search. |
| `tunnel` | 159 | [170, 225, 360] | 1 | Corridor follower (step; at a wall turn left, else right), polished by local search. |
| `labirynth` | 338 | [355, 475, 765] | 1 | Left-hand wall follower as a 6-tile loop (two copies of: wall ahead? turn right : step, turn left), polished by local search. |
| `++` | 6 | [7, 9, 14] | 1 | Five Plus Red tiles, then a step. |
| `--` | 17 | [18, 24, 39] | 4 | Two Minus Red tiles pointing at each other (1 step per decrement); either one steps out when Red is 0. Steps = Red + 2. |
| `:=` | 32 | [34, 45, 75] | 5 | 2-tile loop Minus Red / Plus Blue; step out when Red is 0. Steps = 2\*Red + 2. |
| `*2` | 32 | [34, 45, 75] | 4 | 6-tile loop: (Minus Red, Plus Blue, Plus Blue) twice; either Minus Red steps out at 0. Steps = 3\*Red + 2. |
| `+` | 22 | [24, 31, 50] | 5 | Loop Minus Red / Plus Yellow, a goto, then loop Minus Blue / Plus Yellow, step. Steps = 2\*(Red+Blue) + 4. |
| `*` | 60 | [65, 85, 135] | 5 | Outer loop on Blue; 6-tile unrolled inner loops move Red into Yellow+Pink, then Pink into Yellow+Red on the next pass (3 steps per unit instead of 4). |
| `/2` | 23 | [25, 33, 55] | 4 | 6-tile loop: (Minus Red, Minus Red, Plus Blue) twice; Red is even so only the first Minus of each pair can find 0. Steps = 1.5\*Red + 2. |
| `!` | 673 | [710, 945, 1515] | 5 | General factorial: Blue := 1, k := Red - 2 (Red = 1 steps out at once). Each stage moves Blue into Yellow, then for every unit of Yellow adds 2 + k to Blue (two Plus Blue tiles, then a 4-tile loop that moves k between Red and Pink adding one each time); k := k - 1 and the next stage, until k runs out. Not specialised to the five variants. |
| `Euclid` | 162 | [175, 230, 365] | 5 | Subtractive Euclid with fixed roles: a 6-tile loop (two copies of: Minus Red, Minus Blue, Plus Yellow) runs Red and Blue down together while Yellow counts. When Red runs out (Blue not yet), Blue's extra decrement is undone and Yellow is moved into Red; when Blue runs out, Yellow is moved into Blue and the loop resumes after its Minus Red. When both run out together, Yellow holds the gcd: step. |
| `/` | 98 | [105, 140, 225] | 5 | Repeated subtraction as before (each pass checks Red, moves the divisor between Blue and Pink taking one from Red per unit, adds one to Yellow), with the transfer loops unrolled to 6 tiles (3 steps per unit instead of 4). |
| `Fibonacci` | 108 | [115, 155, 245] | 5 | Blue := 1, then Red-1 phases that rotate the largest of Blue/Yellow/Pink into the other two (4-tile loops); when Red runs out, move the result into Blue (clearing it first if needed) and step. |
| `Counting steps` | 69 | [75, 100, 160] | 1 | First leg: wall-detector loop that counts its steps with Plus Red; second leg: Minus Red loop spends the count; third leg: plain step loop to the hatch (polished by local search). |
| `hobbit harder` | 327 | [345, 460, 740] | 1 | Found by local search from an empty board (a detector-policy enumeration finds 462), then polished by local search seeded with that result. |
| `vertigo` | 11 | [12, 16, 25] | 1 | Found by local search: step, turn left, a 6-step loop east along row 1 with a wall detector at its foot; it ends at the hatch in 11 steps (shortest walk is 10). |
| `some flag?` | 166 | [175, 235, 375] | 1 | Turn left, then a 42-tile loop (41 actions and a goto): it covers one 5x5 quadrant along an Euler path of its corridor lattice (one corridor doubled) and crosses the cracked ice into the next quadrant. The quadrants are 90-degree rotations of each other, so the same loop sweeps all four; the first quadrant is finished on the fifth lap. |
| `just give up` | 243 | always 3 | 1 | A 10-tile loop S S S L S S L S S L (found by enumerating prefix+loop programs); one-sided walls and bumps steer it through all five parts. |
| `ring of fire` | 113 | [120, 160, 255] | 1 | Found by local search from an empty board: wall-detector loop that circles inside the lava ring. |
| `P` | 457 | [480, 640, 1030] | 1 | Found by local search from an empty board, then polished by local search seeded with that result. |
| `warm-up` | 44 | [50, 65, 100] | 1 | Three steps to the centre, then a 12-tile loop R S S S S S R R S S S S: each lap turns right at the centre, runs out to an arm end (the fifth step bumps the edge), turns round and runs back. |
| `Z(2)` | 83 | [90, 120, 190] | 1 | Found by local search from an empty board, then polished by local search seeded with that result (shortest walk 54). |
| `for` | 53 | [60, 75, 240] | 1 | 53-tile straight line (shortest walk) snaked over the 8x8 board; no counters needed. |
| `giftwrapped` | 90 | [95, 130, 205] | 1 | Found by local search from an empty board: wall and colour detectors steer it round the ribbon. |
| `x` | 58 | [65, 85, 135] | 1 | Found by local search from an empty board: colour-detector loop. |
| `no turn sign` | 26 | [28, 37, 60] | 1 | A 12-tile loop S S L S S S S L S S S L (found by enumerating prefix+loop programs). |
| `detector` | 17 | [18, 24, 39] | 1 | Found by local search: colour-detector loop. |
| `robozzle` | 527 | [555, 740, 1190] | 1 | Colour-detector policy found by enumeration: S L S S; on a coloured tile? L S S R : L S L S S. |

## Round 2 changes (tg-84y.15)

| Level | Round 1 B, times | Round 2 B, times | How |
|---|---|---|---|
| `!` | -, [600, 900, 1400] provisional | 673, [710, 945, 1515] | hand design |
| `Euclid` | -, [150, 220, 320] provisional | 162, [175, 230, 365] | hand design (unrolled ring + move-back loops) |
| `hobbit harder` | -, [250, 350, 499] provisional | 327, [345, 460, 740] | local search |
| `some flag?` | -, [150, 220, 320] provisional | 166, [175, 235, 375] | hand design (rotational quadrant loop) |
| `P` | -, [357, 400, 460] provisional | 457, [480, 640, 1030] | local search |
| `Z(2)` | -, [80, 120, 180] provisional | 83, [90, 120, 190] | local search |
| `robozzle` | -, [80, 120, 180] provisional | 527, [555, 740, 1190] | policy enumeration + placer |
| `labirynth` | 443, [470, 625, 1000] | 338, [355, 475, 765] | unrolled wall follower + local search |
| `tunnel` | 173, [185, 245, 390] | 159, [170, 225, 360] | local search polish |
| `hobbit:` | 317, [335, 445, 715] | 173, [185, 245, 390] | policy enumeration + local search |
| `zigzag` | 97, [105, 140, 220] | 56, [60, 80, 130] | shortest walk as a loop |
| `spiral` | 78, [85, 110, 180] | 70, [75, 100, 160] | policy enumeration |
| `*` | 79, [85, 115, 180] | 60, [65, 85, 135] | unrolled inner loops |
| `/` | 116, [125, 165, 265] | 98, [105, 140, 225] | unrolled transfer loops |
| `for` | 53, [60, 75, 135] | 53, [60, 75, 240] | t1 widened for the counter-loop program (216 steps, stored as alt) |

## Notes and oddities

- **General programs only on counter levels.** The local search, run from a
  correct Euclid program, found a 66-step board that wins all five variants
  but fails 100 of 196 other input pairs (it relies on the fixed numbers). It
  was rejected; B = 162 is a general program, checked on every pair from 1 to
  14. The `!`, `/` and `*` programs were checked the same way (factorial of 1
  to 6, every quotient and product up to 6 x 6 or 7 x 6).
- **Likely still beatable (thresholds on the lenient side):** `labirynth`
  (338; the shortest walk is 107, but the maze is irregular and the board only
  6x6), `robozzle` (527 for 120 dots), `P`, `hobbit harder` and `Z(2)` (local
  search results; `Z(2)` walk 54), `tunnel` (159; walk 69), `hobbit:` (173),
  `!` (673; a second stage block that alternates the accumulator between Blue
  and Yellow would save the 172 steps spent moving Blue back into Yellow, but
  does not fit the board next to the first one), `Fibonacci` (108; its three
  4-tile transfer loops could be unrolled to 6-tile rings like `*` and `/`,
  roughly 15% faster, not done in this pass), `Counting steps` (69; walk 31).
- **Near-optimal:** every level where B equals the shortest walk (the BFS
  lower bound): start here, chaining, De revolutionibus, bend it, hedge,
  resistors, more resistors, out of reach, stairs, goodwin, your ad here,
  anywhere (snake), for, zigzag. `vertigo` is 11 against a walk of 10.
- **"for" is a straight line, and the hint still earns a part.** The 8x8
  board holds the whole 53-move walk, so the fastest program uses no counters
  at all. The counter-loop program the level text hints at (walk Red steps
  while moving Red into Blue, turn, drop one, walk back the other way) takes
  216 steps; t1 is widened from 135 to 240 so it earns 1 part with room for a
  less tidy layout. It is stored as `alt` evidence in `solutions.json`.
- **zigzag showed its hatch only after the first run** (its `set` placed the
  robot itself and never called `setRobotTable`). Fixed in round 2: `set`
  now calls `setRobotTable`, like every other level.
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

B = 70. Found by enumerating detector policies: 4 steps; if a wall is ahead turn left, else 4 more steps and turn left.

```text
. . . . .
s> s> sv . .
s^ cc< d^ sv .
cc^ s< s< s< .
. . . . .
```

### `zigzag`

B = 56. The shortest walk as a 24-tile loop: 8 steps, left, 2 steps, left, 8 steps, right, 2 steps, right. 56 = shortest walk.

```text
cc> s> s> cc> sv
s^ s< s< s< sv
s> s> s> s^ sv
cw^ cwv s< sv s<
s^ s< s^ s< .
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

B = 173. Detector policy from enumeration (4 steps; wall ahead? R S S : S L L S L), then polished by local search.

```text
sv s> dv Cv C>
s> sv s< s< cc<
s^ s> s> s> d>
. s^ cw< cwv s<
s^ C< s^ cw< .
```

### `tunnel`

B = 159. Corridor follower (step; at a wall turn left, else right), polished by local search.

```text
cw> cw> sv s> s^
d> cw< d^ sv cw^
s> d> s^ d< cwv
s< s^ C^ cc< d>
C< s< cw> cc< Cv
```

### `labirynth`

B = 338. Left-hand wall follower as a 6-tile loop (two copies of: wall ahead? turn right : step, turn left), polished by local search.

```text
C^ s< . . cw< sv
cw> d^ sv d> d> d^
cwv cc^ ccv cw< cw< d^
sv s^ sv C^ C> cw^
sv d< cw< s< cw< cc>
s> cc^ cc^ cc^ C< C<
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

B = 60 (worst of 5 variants; per variant [55,42,35,60,55]). Outer loop on Blue; 6-tile unrolled inner loops move Red into Yellow+Pink, then Pink into Yellow+Red on the next pass (3 steps per unit instead of 4).

```text
C> C> C> C> C> Cv . .
C^ . . . s> Cv . .
C^ pPinkv pYellow< mRedv mBlue> C< . .
C^ mRed^ pYellow> pPink^ Cv . . .
C> mBlue< . . Cv . . .
C^ s> pRedv pYellow< mPinkv Cv . .
C^ C< mPink^ pYellow> pRed^ Cv . .
C^ C< C< C< C< C< . .
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

### `!`

B = 673 (worst of 5 variants; per variant [147,45,19,7,673]). General factorial: Blue := 1, k := Red - 2 (Red = 1 steps out at once). Each stage moves Blue into Yellow, then for every unit of Yellow adds 2 + k to Blue (two Plus Blue tiles, then a 4-tile loop that moves k between Red and Pink adding one each time); k := k - 1 and the next stage, until k runs out. Not specialised to the five variants.

```text
. . . . . . . .
. . . s> . . . .
mRed^ C> C> mRed> . pYellowv . .
C^ pBluev pPink< C> C> mBlue< mRedv s>
pBlue^ C> mRed< pBlue< pBlue< mYellowv C^ .
. Cv mYellow^ pBlue> pBlue> mPink> C< .
s> mPink^ mBlue> . . pRed> pBlue^ .
. . pYellow^ . . . . .
```

### `Euclid`

B = 162 (worst of 5 variants; per variant [70,106,162,110,52]). Subtractive Euclid with fixed roles: a 6-tile loop (two copies of: Minus Red, Minus Blue, Plus Yellow) runs Red and Blue down together while Yellow counts. When Red runs out (Blue not yet), Blue's extra decrement is undone and Yellow is moved into Red; when Blue runs out, Yellow is moved into Blue and the loop resumes after its Minus Red. When both run out together, Yellow holds the gcd: step.

```text
. . . . . . . .
. . . . . . . pRedv
. pBlue> mYellowv Cv s> mBlue^ pBlue> mYellow<
. . C^ mBlue^ pYellow> mRed> C< C<
C> C> C> mRed< pYellow< mBluev Cv .
. mYellow> pBlue< mBluev s> C^ mYellow^ pBlue<
. pRed^ . . . . . .
. . . . . . . .
```

### `/`

B = 98 (worst of 5 variants; per variant [98,42,26,78,60]). Repeated subtraction as before (each pass checks Red, moves the divisor between Blue and Pink taking one from Red per unit, adds one to Yellow), with the transfer loops unrolled to 6 tiles (3 steps per unit instead of 4).

```text
C> C> C> C> Cv s> . .
C^ pPinkv mRedv mBluev pYellow> mRed> . .
C^ mBlue^ mRed^ pPink^ pBluev mPinkv . .
mBlue^ pPink^ . . Cv . . .
mRed< pYellow< . . Cv . . .
s> C^ pBluev mRedv mPinkv Cv . .
. C^ mPink^ mRed^ pBlue^ Cv . .
. C^ C< C< C< C< . .
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

### `hobbit harder`

B = 327. Found by local search from an empty board (a detector-policy enumeration finds 462), then polished by local search seeded with that result.

```text
C^ s> dv cc> d^ sv dv
. s^ dv cwv sv cw< .
dv s^ cc^ sv dv ccv .
sv s^ s^ cw< s< cc< s<
s> s^ cc< cc^ s> cw< d<
. cwv s> s< . cc< .
d< dv . C^ cc< cc> ccv
```

### `vertigo`

B = 11. Found by local search: step, turn left, a 6-step loop east along row 1 with a wall detector at its foot; it ends at the hatch in 11 steps (shortest walk is 10).

```text
cc> s> sv
s> cc^ sv
d< s< s<
```

### `some flag?`

B = 166. Turn left, then a 42-tile loop (41 actions and a goto): it covers one 5x5 quadrant along an Euler path of its corridor lattice (one corridor doubled) and crosses the cracked ice into the next quadrant. The quadrants are 90-degree rotations of each other, so the same loop sweeps all four; the first quadrant is finished on the fifth lap.

```text
. . . . cc> s> s> ccv
. . . . s^ s< cc< sv
. . . . . . s^ sv
. . . . . . s^ sv
cc> s> s> cw> s> s> cw^ sv
cw> C^ sv s< cw< s< s< cw<
s^ s< s> s> cw> s> s> ccv
. cw^ s< s< s< s< s< s<
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

### `P`

B = 457. Found by local search from an empty board, then polished by local search seeded with that result.

```text
ccv C< ccv cc^ s^ dv
s> dm< C> dm> . dmv
dm^ s^ dm^ s< cw< s<
sv cc> sv dv cw> C^
sv s^ cw> dm< cc< s<
cc> s^ s^ cw< C^ cw^
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

### `Z(2)`

B = 83. Found by local search from an empty board, then polished by local search seeded with that result (shortest walk 54).

```text
C< cw> cwv cwv d> cc^
cc> d> sv cc> s> cwv
d> s> s> d> cwv d>
s^ cw< sv s< cw< s<
ccv s^ dv cc^ s< C^
s< . dv cc< cc< cc<
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

Also stored: The hinted counter-loop program: walk Red steps while moving Red into Blue (4-tile loop), turn left, drop one, walk Blue steps moving it back into Red, turn left, drop one, repeat. 216 steps, 1 part.

```text
. . . . . . . .
. . . . . . . .
. C> C> Cv mRedv cc< . .
C> C^ sv mRedv ccv C^ . .
C^ . pBlue> C^ mBlue^ mBlue> C< .
. . . . . s> pRed^ .
. . . . . . . .
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

### `robozzle`

B = 527. Colour-detector policy found by enumeration: S L S S; on a coloured tile? L S S R : L S L S S.

```text
sv cc< s< cc<
sv s> s> dm<
s> cc^ sv cc<
C^ cw< s< .
```
