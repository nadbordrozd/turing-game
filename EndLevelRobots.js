// End-level screen: the robots freed so far stand beside the main robot on
// the landscape (js/scenes/end-level.js, t.EndLevel.freed). Entry 0 is the
// main robot (the player robot's design) and is always shown; one more robot
// per 3 points: entry i (i >= 1) is freed at 3*i points. Each entry is
// [image, x, y, z]: x/y are the sprite centre in the 1024x768 screen, z the
// draw order (farther back = higher on screen = lower z).
// Original Toybox robots from art/sets/freed-v2 (bead tg-vy4.21) and
// art/sets/freed-v1 (main robot, giant-c, helper-c; bead tg-vy4.17); placement
// preview: node tools/art/freed-layout.mjs (regenerates this file), then
// node tools/art/freed-preview.mjs <out.png> [--count N]
t.EndLevelRobots = {};
t.EndLevelRobots.background = "freed/landscape.png";
t.EndLevelRobots.data = [ // image, x, y, z-index
  ["freed/robot-00.png",    512, 654, 26], // main robot, always shown: hero-a (116x162)
  ["freed/robot-01.png",    600, 704, 28], // freed at 3 points: costume-a (72x104)
  ["freed/robot-02.png",    412, 731, 28], // freed at 6 points: puppy-c (58x66)
  ["freed/robot-03.png",    700, 721, 28], // freed at 9 points: beetle-b (96x82)
  ["freed/robot-04.png",    348, 659, 23], // freed at 12 points: rover-c (100x94)
  ["freed/robot-05.png",    640, 629, 22], // freed at 15 points: android-a (56x142)
  ["freed/robot-06.png",    428, 645, 22], // freed at 18 points: typist-a (58x102)
  ["freed/robot-07.png",    742, 643, 23], // freed at 21 points: diver-a (88x126)
  ["freed/robot-08.png",    196, 583, 16], // freed at 24 points: maid-a (76x114)
  ["freed/robot-09.png",    838, 641, 22], // freed at 27 points: arcade-a (68x122)
  ["freed/robot-10.png",    518, 411, 16], // freed at 30 points: ladybug-a (42x30)
  ["freed/robot-11.png",    562, 573, 16], // freed at 33 points: chef-a (78x134)
  ["freed/robot-12.png",    806, 703, 28], // freed at 36 points: fire-a (84x122)
  ["freed/robot-13.png",    160, 674, 28], // freed at 39 points: giant-c (152x176)
  ["freed/robot-14.png",    296, 718, 28], // freed at 42 points: octosub-a (104x92)
  ["freed/robot-15.png",    260, 646, 22], // freed at 45 points: mime-b (64x108)
  ["freed/robot-16.png",    694, 585, 17], // freed at 48 points: steam-a (70x122)
  ["freed/robot-17.png",    250, 350, 12], // freed at 51 points: balloon-a (66x120)
  ["freed/robot-18.png",    870, 587, 15], // freed at 54 points: owl-a (72x94)
  ["freed/robot-19.png",    460, 579, 15], // freed at 57 points: greenhouse-a (88x106)
  ["freed/robot-20.png",    950, 660, 23], // freed at 60 points: lander-a (98x96)
  ["freed/robot-21.png",     58, 688, 27], // freed at 63 points: helper-c (90x128)
  ["freed/robot-22.png",    364, 568, 16], // freed at 66 points: samurai-a (86x136)
  ["freed/robot-23.png",    766, 576, 16], // freed at 69 points: band-b (100x128)
  ["freed/robot-24.png",    920, 722, 29], // freed at 72 points: plough-b (80x88)
  ["freed/robot-25.png",    104, 577, 16], // freed at 75 points: knight-a (90x134)
  ["freed/robot-26.png",    282, 562, 15], // freed at 78 points: fortune-a (76x136)
  ["freed/robot-27.png",    820, 366, 11], // freed at 81 points: satellite-a (98x68)
  ["freed/robot-28.png",    966, 570, 16], // freed at 84 points: mainframe-b (96x132)
  ["freed/robot-29.png",    160, 513, 10], // freed at 87 points: golem-a (126x142)
  ["freed/robot-30.png",    860, 521, 11], // freed at 90 points: sumo-c (144x134)
  ["freed/robot-31.png",    406, 514, 10], // freed at 93 points: excavator-c (140x128)
  ["freed/robot-32.png",    630, 470, 11]  // freed at 96 points: kaiju-a (186x240)
];

t.EndLevelRobots.images = [t.EndLevelRobots.background];
for (var i in t.EndLevelRobots.data)
	t.EndLevelRobots.images.push(t.EndLevelRobots.data[i][0]);
