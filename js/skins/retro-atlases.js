// Retro skin, canvas art (tg-wtv.2): Toybox asset path -> retro asset path.
// The retro files are drawn by tools/art/tiles/program-tiles.mjs and
// tools/art/tiles/robot-cell.mjs (`--style retro`) with the same sheet names,
// frame counts, timings and atlas layout as Toybox (their --check proves the
// layout JSON is identical), so swapping the URLs is all the game needs.
//
// Paths are as Q.assetUrl builds them (Q.options.imagePath "images/" or
// dataPath "data/" + the bare asset name), before ?v= cache-busting. Quintus'
// asset keys stay the bare names ("tiles/program-tiles.png"), so
// Q.compileSheets, Q.sheet and Q.asset calls do not change.
//
// Not included from index.html yet: it is wired in once the skin system
// (tg-wtv.1, js/skin.js, t.Skin.variants) is published. It only defines the
// table, and merges it into t.Skin.variants.retro when that exists.
(function (global) {
	var t = global.t = global.t || {};
	t.RetroAtlases = {
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
		"images/resistor5.png": "images/retro/resistor5.png"
	};
	var variants = t.Skin && t.Skin.variants;
	if (variants) {
		variants.retro = variants.retro || {};
		for (var k in t.RetroAtlases) if (Object.prototype.hasOwnProperty.call(t.RetroAtlases, k)) variants.retro[k] = t.RetroAtlases[k];
	}
})(window);
