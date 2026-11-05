// End-level screen: the robots freed so far stand beside the main robot on
// the landscape (js/scenes/end-level.js, t.EndLevel.freed). Entry 0 is the
// main robot (the player robot's design) and is always shown; one more robot
// per 3 points: entry i (i >= 1) is freed at 3*i points. Each entry is
// [image, x, y, z]: x/y are the sprite centre in the 1024x768 screen, z the
// draw order (farther back = higher on screen = lower z).
// Original Toybox robots from art/sets/freed-v1 (bead tg-vy4.17); placement
// preview: node tools/art/freed-layout.mjs (regenerates this file), then
// node tools/art/freed-preview.mjs <out.png> [--count N]
t.EndLevelRobots = {};
t.EndLevelRobots.background = "freed/landscape.png";
t.EndLevelRobots.data = [ // image, x, y, z-index
  ["freed/robot-00.png",    512, 654, 26], // main robot, always shown: hero-a (116x162)
  ["freed/robot-01.png",    600, 727, 27], // freed at 3 points: wheelcube-a (44x42)
  ["freed/robot-02.png",    404, 700, 26], // freed at 6 points: spider-a (104x84)
  ["freed/robot-03.png",    432, 540, 17], // freed at 9 points: drone-a (76x80)
  ["freed/robot-04.png",    640, 634, 21], // freed at 12 points: tvhead-a (90x112)
  ["freed/robot-05.png",    722, 693, 27], // freed at 15 points: digger-a (122x118)
  ["freed/robot-06.png",    356, 616, 19], // freed at 18 points: unicycle-a (72x112)
  ["freed/robot-07.png",    288, 723, 28], // freed at 21 points: crab-a (104x66)
  ["freed/robot-08.png",    762, 589, 17], // freed at 24 points: snowman-a (80x126)
  ["freed/robot-09.png",    262, 559, 16], // freed at 27 points: stilts-c (62x166)
  ["freed/robot-10.png",    850, 687, 26], // freed at 30 points: windup-a (88x102)
  ["freed/robot-11.png",    566, 568, 14], // freed at 33 points: dish-a (84x108)
  ["freed/robot-12.png",    458, 552, 14], // freed at 36 points: rocket-a (64x128)
  ["freed/robot-13.png",    160, 674, 28], // freed at 39 points: giant-c (152x176)
  ["freed/robot-14.png",    652, 496, 12], // freed at 42 points: jelly-a (64x80)
  ["freed/robot-15.png",    872, 578, 16], // freed at 45 points: pogo-a (62x128)
  ["freed/robot-16.png",    300, 635, 21], // freed at 48 points: headphones-b (70x110)
  ["freed/robot-17.png",    958, 709, 28], // freed at 51 points: walker4-b (106x94)
  ["freed/robot-18.png",    958, 598, 17], // freed at 54 points: bird-b (72x108)
  ["freed/robot-19.png",    384, 546, 11], // freed at 57 points: mailbox-a (64x92)
  ["freed/robot-20.png",    704, 554, 12], // freed at 60 points: mushroom-b (64x84)
  ["freed/robot-21.png",     58, 688, 27], // freed at 63 points: helper-c (90x128)
  ["freed/robot-22.png",     86, 605, 17], // freed at 66 points: gardener-c (74x90)
  ["freed/robot-23.png",    812, 520, 10], // freed at 69 points: accordion-a (62x124)
  ["freed/robot-24.png",    226, 522, 10], // freed at 72 points: lighthouse-a (60x116)
  ["freed/robot-25.png",    512, 531, 9], // freed at 75 points: kettle-b (78x70)
  ["freed/robot-26.png",    300, 523, 9], // freed at 78 points: umbrella-b (52x94)
  ["freed/robot-27.png",    628, 527, 8], // freed at 81 points: cart-b (64x66)
  ["freed/robot-28.png",    988, 532, 8], // freed at 84 points: tank-a (64x60)
  ["freed/robot-29.png",    140, 542, 9], // freed at 87 points: trike-a (60x64)
  ["freed/robot-30.png",    432, 526, 8], // freed at 90 points: bug-b (60x60)
  ["freed/robot-31.png",    724, 430, 6], // freed at 93 points: cloud-b (66x52)
  ["freed/robot-32.png",    330, 428, 4]  // freed at 96 points: lantern-a (42x64)
];

t.EndLevelRobots.images = [t.EndLevelRobots.background];
for (var i in t.EndLevelRobots.data)
	t.EndLevelRobots.images.push(t.EndLevelRobots.data[i][0]);
