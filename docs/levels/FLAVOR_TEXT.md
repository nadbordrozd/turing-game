# Level flavor text

Rewrite of the per-level `text` shown above the board (bead tg-84y.6).
Rules: mechanic explanations stay accurate (tightened where long), fine lines
are kept, cringe lines are replaced with something short and light-hearted.
Explicit `\n` line breaks were dropped everywhere: the new UI wraps the text
in a one- or two-line header. In the "Old text" column a ` / ` marks where an
old line break was.

Verdicts: **kept** (wording unchanged apart from dropped line breaks),
**tightened** (same meaning, shorter), **replaced** (new line).

| Level | File | Verdict | Old text | New text | Reason |
|---|---|---|---|---|---|
| start here | levels.js | tightened | Program the robot to help it escape from its cell. / Place the Step Forward instruction on the robot's / circuit board (green) to make it move to the / escape hatch. Press "play" when you are done. / | Help the robot escape its cell: place a Step Forward tile on its circuit board (green), then press Play. | Mechanic explanation; shortened to two lines. |
| chaining | levels.js | tightened | This time a single step won't do. You can make the / robot move multiple times by placing instructions  / one after another so that the program passes  / through each of them. / | One step won't do this time. Place several instructions in a row and the program runs through each of them in turn. | Mechanic explanation; shortened. |
| De revolutionibus | levels.js | tightened | This simple robot can't move sideways. To move one tile / to the left, it will have to first turn left and then / step forward. To achieve this, you will have to place turn / and step instructions on the board in the right order. / | This robot can't move sideways. To go left it has to turn left first, then step forward. | Mechanic explanation; shortened. |
| bend it | levels.js | tightened | Don't put all your instructions in single line. Use the / whole board. Black arrowheads on an instruction tile / indicate, where the program will flow next. By rotating / the tile you can make it take any path you want. | Use the whole board: the black arrowheads on a tile show where the program goes next. Rotate a tile to change its path. | Mechanic explanation (arrowheads, rotation); shortened. |
| hedge | levels.js | replaced | Try to finish levels using as few instructions and / as few steps as possible to get better scores and / rescue more robots! / | The faster the robot gets out, the better your score - and the more robots you rescue. | Advised using few instructions; scoring is now by speed only. |
| resistors | levels.js | replaced | Collect all the scattered parts to / macgyver yourself out of this one. | No hatch this time: grab all four parts to win. | "macgyver yourself" quip; now states the real goal (collect all four parts, no hatch). |
| more resistors | levels.js | kept | Choose your path carefully if you want to / fit all the instruction tiles on the board. | kept | Useful hint, fine as is. |
| out of reach | levels.js | tightened | You don't have to do long, repetitive / tasks manually - that's what programs / are for. Just loop the instructions | Long, repetitive walks are what programs are for. Point the flow back to an earlier tile to make a loop. | Loop explanation kept; now says how to make a loop. |
| stairs | levels.js | replaced | Go on - loop it. Loop like the wind! | Step, turn, step, turn... sounds like a job for a loop. | "Loop like the wind!" was cringe; short loop hint instead. |
| conditionals | levels.js | tightened | Conditional instruction lets the robot do one thing / in case there's a wall in front of it or another - / if there's not. With it you can effectively tell the / robot to "go forward" until you hit a wall. | The conditional tile does one thing if there's a wall in front of the robot and another if there isn't - perfect for "go until you hit a wall". | Mechanic explanation; shortened. |
| spiral | levels.js | kept | This one's easier than you think | kept | Short and light. |
| zigzag | levels.js | replaced | ERROR exec.FunctionTask: create function: / java.lang.ClassNotFoundException: turing.RoboAnimator / at java.net.URLClassLoader$1.run(URLClassLoader.java:366) / ... just kiddin | Left to right, right to left, all the way down. | Fake Java stack trace joke; replaced with a short line about the zigzag. |
| anywhere | levels.js | replaced | Go on - eat the dots. Like the / gluttonous little robo-pacman you are. | A dot on every tile. Leave no tile unvisited. | "gluttonous little robo-pacman" was cringe; states the goal (dot on every tile). |
| way out | levels.js | kept | How would you instruct a robot to find / an exit from a circular room? | kept | A good puzzle prompt. |
| goodwin | levels.js | kept | At this point you don't need / tips anymore. | kept | Short and light. |
| your ad here | levels.js | kept | Getting the hang of it yet? | kept | Short and light. |
| hobbit: | levels.js | kept | Yes, it can be done. | kept | Short and light. |
| tunnel | levelsdata.js | kept | Just a single route - how hard / could it be? | kept | Short and light. |
| labirynth | levelsdata.js | replaced | How sweet would it be to have the digging wand / from ADOM right now? Come to think of it -  / - being able to program your ADOM character / would be even better. | A proper maze. Collect all eight dots to get out. | Forced ADOM reference; states the goal (eight dots). |
| ++ | levelsdata.js | tightened | To disarm the trap, set the red cipher lock to 5 / using the Plus One instruction. Once the lock / is set, the trap will turn off and you will be  / able to move to the escape hatch | To disarm the trap, set the red lock to 5 with the Plus One tile, then head for the escape hatch. | Mechanic explanation; shortened. |
| -- | levelsdata.js | tightened | Red=0 clears the way. You must set the lock / to 0, no matter what number it shows at the / beginning. | Set the red lock to 0 to clear the way, whatever number it starts on. | Mechanic explanation; shortened. |
| := | levelsdata.js | tightened | Blue := Red. I.e. set the blue lock to / whatever number the red one comes with. / Feel free to modify the red lock's number. | Blue := Red. Set the blue lock to whatever number the red one starts with. Changing red along the way is fine. | Mechanic explanation; shortened. |
| *2 | levelsdata.js | tightened | Blue = Red*2. Set the blue to twice the / number on the red one. | Blue := Red * 2. Set blue to twice the number on red. | Mechanic explanation; consistent := notation. |
| + | levelsdata.js | kept | Yellow := Red + Blue | kept | Task statement, already minimal. |
| * | levelsdata.js | kept | Yellow = Red * Blue | kept | Task statement, already minimal. |
| /2 | levelsdata.js | kept | Blue := Red / 2 | kept | Task statement, already minimal. |
| ! | levelsdata.js | kept | Blue := Red!   (factorial) | kept | Task statement, already minimal. |
| Euclid | levelsdata.js | kept | Yellow := gcd(Blue, Red)  (greatest common divisor) | kept | Task statement, already minimal. |
| / | levelsdata.js | kept | Yellow := Red/Blue | kept | Task statement, already minimal. |
| Fibonacci | levelsdata.js | tightened | First Fibonacci number is 1, second - also 1. Every / following Fibonacci number is the sum of the previous / two. The sequence goes 1, 1, 2, 3, 5, 8, 13, 21,...  / Take Red as n and output n-th Fibonacci number on Blue | Fibonacci: 1, 1, 2, 3, 5, 8, 13... each number is the sum of the two before it. Take Red as n and put the n-th number on Blue. | Task explanation; shortened. |
| Counting steps | levelsdata.js | kept | What it says on the tin | kept | Short; the level name says what to do. |
| for | levelsdata2.js | kept | If only there was a way to repeat / with a decreasing number of steps... | kept | Good hint, light. |
| hobbit harder | levelsdata3.js | kept | I'm not sure about this one myself | kept | Short and light. |
| vertigo | levelsdata3.js | replaced | If you've made it this far, you are the kind of / person who would get addicted to projecteuler.net. / Try it - it's an awesome addiction. | Deep breath. Don't look down. | Project Euler plug; short line playing on the name. |
| some flag? | levelsdata3.js | kept | A triple loop is in order / ... / or is it? | kept | Fine; line breaks dropped. |
| just give up | levelsdata3.js | kept | Go on. No one will blame you. | kept | Fits the deliberately obscure level. |
| ring of fire | levelsdata3.js | replaced | Don't fall into | A ring of lava all around. Keep your circuits cool. | Truncated song reference ("Don't fall into"). |
| P | levelsdata3.js | replaced | As opposed to C and T | Plenty of dots, plenty of lava. Choose your route wisely. | Obscure "C and T" joke; short line about the level. |
| warm-up | levelsdata3.js | replaced | The only reason for this description is / - javascript insists on treating an / empty string as a falsy value | A warm-up, quite literally. Mind the lava. | Meta joke about JavaScript falsy strings. |
| Z(2) | levelsdata3.js | replaced | The simplest non-trivial group | No dots this time, just a long, twisty walk past the lava. | Group-theory reference; short line about the level. |
| giftwrapped | levelsdata4.js | kept | Another simple one | kept | Short and light. |
| x | levelsdata4.js | replaced | Some of the levels at robozzle.com are / really ingenious - check them out | X marks the spot. | robozzle.com plug (credit stays on the robozzle level); playful line, the colored tiles form an X. |
| no turn sign | levelsdata4.js | kept | Easy to invent, harder to solve | kept | Short and light. |
| detector | levelsdata4.js | tightened | New conditional instruction: / this one checks whether the robot / stands on a special colored tile. | New conditional: this one checks whether the robot is standing on a colored tile. | Mechanic explanation; shortened. |
| robozzle | levelsdata4.js | replaced | This level was shamelessly ripped off / of robozzle.com. And they have metric / shitload more of this stuff - check it out. | Borrowed with admiration from robozzle.com - it has plenty more puzzles like this one. | Profanity; kept the credit to robozzle.com in a friendlier line. |

Totals: 45 levels; kept 20, tightened 12, replaced 13.

## Scoring note

Scoring is now by execution time only (`t.Levels.scoreByTime` in `levels.js`):
each level's `times: [t3, t2, t1]` are the maximum step counts for 3, 2 and 1
parts, and `just give up` has `alwaysFull: true`. The calibration bead
(tg-84y.10) set `times` from played solutions; see
[CALIBRATION.md](CALIBRATION.md). Levels it did not solve still carry
`// PROVISIONAL` values. `node tools/levels/check-levels.mjs` checks the
rules.
