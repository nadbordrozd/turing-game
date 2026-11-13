// Per-skin asset variants (epic tg-wtv): which files a skin swaps for its
// own. Keys are the paths the game loads (as Q.load and versionedUrl see
// them: "images/...", "data/..."); values are the skin's file. A key ending
// in "/" maps a whole folder. Anything not listed loads the shared (toybox)
// file. Retro art lives under images/retro/ and data/retro/.
t.Skin.register("retro", {
	// "images/intro/intro-1.png": "images/retro/intro/intro-1.png",
});
