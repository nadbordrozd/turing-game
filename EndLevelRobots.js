// End-level screen: the robots freed so far stand beside the main robot on
// the landscape. One robot per 3 points: entry i shows from 3*i+3 points
// (TuringScenes.js 'endLevel'). Entry 0 is the main robot (the player robot's
// design). Each entry is [image, x, y, z]: x/y are the sprite centre in the
// 1024x768 screen, z the draw order (farther back = higher on screen = lower z).
// Original Toybox robots from art/sets/freed-v1 (bead tg-vy4.17); placement
// preview: node tools/art/freed-layout.mjs (regenerates this file), then
// node tools/art/freed-preview.mjs <out.png> [--count N]
t.EndLevelRobots = {};
t.EndLevelRobots.background = "freed/landscape.png";
t.EndLevelRobots.data = [ // image, x, y, z-index
  ["freed/robot-00.png",    512, 654, 26], // main robot, shown from 3 points: hero-a (116x162)
  ["freed/robot-01.png",    600, 727, 27], // unlocked at 6 points: wheelcube-a (44x42)
  ["freed/robot-02.png",    404, 700, 26], // unlocked at 9 points: spider-a (104x84)
  ["freed/robot-03.png",    432, 540, 17], // unlocked at 12 points: drone-a (76x80)
  ["freed/robot-04.png",    640, 634, 21], // unlocked at 15 points: tvhead-a (90x112)
  ["freed/robot-05.png",    722, 693, 27], // unlocked at 18 points: digger-a (122x118)
  ["freed/robot-06.png",    356, 616, 19], // unlocked at 21 points: unicycle-a (72x112)
  ["freed/robot-07.png",    288, 723, 28], // unlocked at 24 points: crab-a (104x66)
  ["freed/robot-08.png",    762, 589, 17], // unlocked at 27 points: snowman-a (80x126)
  ["freed/robot-09.png",    262, 559, 16], // unlocked at 30 points: stilts-c (62x166)
  ["freed/robot-10.png",    850, 687, 26], // unlocked at 33 points: windup-a (88x102)
  ["freed/robot-11.png",    566, 568, 14], // unlocked at 36 points: dish-a (84x108)
  ["freed/robot-12.png",    458, 552, 14], // unlocked at 39 points: rocket-a (64x128)
  ["freed/robot-13.png",    160, 674, 28], // unlocked at 42 points: giant-c (152x176)
  ["freed/robot-14.png",    652, 496, 12], // unlocked at 45 points: jelly-a (64x80)
  ["freed/robot-15.png",    872, 578, 16], // unlocked at 48 points: pogo-a (62x128)
  ["freed/robot-16.png",    300, 635, 21], // unlocked at 51 points: headphones-b (70x110)
  ["freed/robot-17.png",    958, 709, 28], // unlocked at 54 points: walker4-b (106x94)
  ["freed/robot-18.png",    958, 598, 17], // unlocked at 57 points: bird-b (72x108)
  ["freed/robot-19.png",    384, 546, 11], // unlocked at 60 points: mailbox-a (64x92)
  ["freed/robot-20.png",    704, 554, 12], // unlocked at 63 points: mushroom-b (64x84)
  ["freed/robot-21.png",     58, 688, 27], // unlocked at 66 points: helper-c (90x128)
  ["freed/robot-22.png",     86, 605, 17], // unlocked at 69 points: gardener-c (74x90)
  ["freed/robot-23.png",    812, 520, 10], // unlocked at 72 points: accordion-a (62x124)
  ["freed/robot-24.png",    226, 522, 10], // unlocked at 75 points: lighthouse-a (60x116)
  ["freed/robot-25.png",    512, 531, 9], // unlocked at 78 points: kettle-b (78x70)
  ["freed/robot-26.png",    300, 523, 9], // unlocked at 81 points: umbrella-b (52x94)
  ["freed/robot-27.png",    628, 527, 8], // unlocked at 84 points: cart-b (64x66)
  ["freed/robot-28.png",    988, 532, 8], // unlocked at 87 points: tank-a (64x60)
  ["freed/robot-29.png",    140, 542, 9], // unlocked at 90 points: trike-a (60x64)
  ["freed/robot-30.png",    432, 526, 8], // unlocked at 93 points: bug-b (60x60)
  ["freed/robot-31.png",    724, 430, 6], // unlocked at 96 points: cloud-b (66x52)
  ["freed/robot-32.png",    330, 428, 4]  // unlocked at 99 points: lantern-a (42x64)
];

t.EndLevelRobots.images = [t.EndLevelRobots.background];
for (var i in t.EndLevelRobots.data)
	t.EndLevelRobots.images.push(t.EndLevelRobots.data[i][0]);
