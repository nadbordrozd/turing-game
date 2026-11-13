// Per-skin asset variants (epic tg-wtv): which files a skin swaps for its
// own. Keys are the paths the game loads (as Q.load and versionedUrl see
// them: "images/...", "data/..."); values are the skin's file. A key ending
// in "/" maps a whole folder. Anything not listed loads the shared (toybox)
// file. Retro art lives under images/retro/ and data/retro/.
//
// Quintus' asset keys stay the bare names ("tiles/program-tiles.png"): only
// the URL changes, so Q.compileSheets, Q.sheet and Q.asset calls do not.
t.Skin.register("retro", {
	// Canvas atlases (tg-wtv.2), drawn by tools/art/tiles/program-tiles.mjs and
	// tools/art/tiles/robot-cell.mjs (`--style retro`) with the same sheet
	// names, frame counts, timings and atlas layout as Toybox (their --check
	// proves the layout JSON is identical), so swapping the URLs is enough.
	// program board tiles
	"images/tiles/program-tiles.png": "images/retro/tiles/program-tiles.png",
	"data/program-tiles.json": "data/retro/program-tiles.json",
	// robot window atlas: robot, walls, block, hatch, trap, magic tile, lava
	"images/tiles/robot-cell.png": "images/retro/tiles/robot-cell.png",
	"data/robot-cell.json": "data/retro/robot-cell.json",
	// robot window images loaded on their own (obstacles.js, script.js,
	// utilitySprites.js addDot): floor, ice, cracked ice, water, block, dots
	"images/robotile.png": "images/retro/robotile.png",
	"images/obstacle.png": "images/retro/obstacle.png",
	"images/ice.png": "images/retro/ice.png",
	"images/crackedIce.png": "images/retro/crackedIce.png",
	"images/water.png": "images/retro/water.png",
	"images/resistor1.png": "images/retro/resistor1.png",
	"images/resistor2.png": "images/retro/resistor2.png",
	"images/resistor3.png": "images/retro/resistor3.png",
	"images/resistor4.png": "images/retro/resistor4.png",
	"images/resistor5.png": "images/retro/resistor5.png",

	// Part reward icons (tg-wtv.4), drawn by tools/art/part-icons.mjs: earned,
	// not earned (BW) and the level selector's small set (green*). Used by the
	// game screen's goals and LAST RUN, the end-level panel and the selector.
	"images/capacitor.png": "images/retro/parts/capacitor.png",
	"images/integratedcircuit.png": "images/retro/parts/integratedcircuit.png",
	"images/coil.png": "images/retro/parts/coil.png",
	"images/capacitorBW.png": "images/retro/parts/capacitorBW.png",
	"images/integratedcircuitBW.png": "images/retro/parts/integratedcircuitBW.png",
	"images/coilBW.png": "images/retro/parts/coilBW.png",
	"images/greencapacitor.png": "images/retro/parts/greencapacitor.png",
	"images/greenintegratedcircuit.png": "images/retro/parts/greenintegratedcircuit.png",
	"images/greencoil.png": "images/retro/parts/greencoil.png"
});
