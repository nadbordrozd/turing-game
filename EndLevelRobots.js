t.EndLevelRobots = {};
t.EndLevelRobots.data = [  //image, x, y, z-index
["myrobo.png",          520, 425, 3 ],
["aibo.png",            610, 510, 3],
["mechagodzilla.png",   224, 276, 0],
["securiton.png",       900, 381, 2],
["asimo.png",           700, 426, 7],
["turret.png",          355, 568, 5 ],
['bender.png',          236, 415, 3],
["dalek.png",           80, 412, 2],
["marsrover.png",       786, 527, 4],
["cylon.png",           676, 348, 7],
["r2d2.png",            200, 652, 6 ],
["awesomo.png",         910, 628, 4 ],
["tachikoma.png",       148, 366, 1],
["pris.png",            590, 374, 1],
["scv.png",             886, 480, 3 ],
["lostinspacerobot.png",320, 350, 2 ],
["claptrap.png",        460, 560, 5 ],
["wheatley.png",        420, 670, 6],
["kitt.png",            530, 337, 0],
["marvin.png",          800, 640, 6 ],
["partyrock.png",       420, 325, 0],
["robotchicken.png",    625, 665, 6],
["sojourner.png",       300, 504, 4 ],
["roomba.png",          320, 673, 7 ],
["wall-e.png",          640, 578, 4],
["Canti.png",           382, 435, 3 ],
["jetsons.png",         112, 556, 6],
["ed209.png",           800, 370, 1],
["crowtrobot.png",      80,  660, 7],
["geth.png",            447, 400, 1],
["optimusPrime.png",    926, 287, 0],
["eve.png", 			960, 560, 4],
["darpadog.png", 		620, 430, 2]
]

t.EndLevelRobots.images =[];
for(var i in t.EndLevelRobots.data) 
	t.EndLevelRobots.images.push(t.EndLevelRobots.data[i][0]);