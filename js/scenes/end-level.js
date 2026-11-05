// End-of-level screen on stage 2 (moved unchanged from TuringScenes.js; the Toybox redo is tg-84y.9).
// Drawn for 1024x768 over the game screen, so the kit hides the HTML layers while it shows.
TuringScenes.add(function(Q) {
	t.UI.scene("endLevel", {covers: true});
	//stage 2
	Q.scene('endLevel',function(stage) {
	t.GameSaver.saveLevelStatus(t.Levels.currentLevel.name, stage.options.result+1);
	l.log("t", "touch na 2");
	Q.touch(Q.SPRITE_UI, [2]); //only stage 2 -> this one
	var bg = stage.insert(new Q.Sprite({type: Q.SPRITE_NONE, asset : 'levelend.png', x: Q.width/2, y: Q.height/2}));
	var toLevelSelect = stage.insert(new Q.UI.Button({ x: 590, y: 230, fill: "rgba(0,255,0,0.4)", font :  "26px monospace",
	                                    border : 3, stroke : "rgb(0,255,0)", label: "Continue" }));

	var totalPoints = 0;
	for(var i in t.Levels.levels){
			var name = t.Levels.levels[i].name;
			var levStat = t.GameSaver.loadLevelStatus(name);
			if(levStat) totalPoints+=levStat;
	}

	for(var i in t.EndLevelRobots.data){
		if(totalPoints<i*3+3) break;
		var endrobo = t.EndLevelRobots.data[i];
		var robopic = stage.insert(new Q.Sprite({asset: endrobo[0], x: endrobo[1], y : endrobo[2], z: endrobo[3]}));
	}

	var totalSteps = stage.options.totalSteps||34;
	var totalParts = stage.options.totalParts||19;
	var gwiazdka1 = stage.options.result>0;
	var gwiazdka2 = stage.options.result>1;
	var gwiazdka3 = stage.options.result>2;
	//font-family: "Lucida Console", "Lucida Sans Typewriter", Monaco, "Bitstream Vera Sans Mono", monospace;
	var backButton = stage.insert(new Q.UI.Button({ x: 740, y: 230, fill: "rgba(255,255,0,0.4)",
			border : 2, stroke :  "rgb(255, 255, 0)",
                                           label: "Go back", z : 1000, font : "26px monospace"}));
	var victory = stage.insert(new Q.UI.Text({x:360, y: 30, z : 1000,
                                        label: "You have escaped. This time.", family : "monospace", size : 35, color : "b" }));
	var totParts = stage.insert(new Q.UI.Text({x:300, y:90, label: "Total instructions used:    "+totalParts, family : "monospace", size : 25,z : 1000}));
	var totSteps = stage.insert(new Q.UI.Text({x:300, y:140, label: "       Total time taken:    "+totalSteps, family : "monospace", size : 25,z : 1000}));

	//stage.insert(new Q.Sprite({x:600, y: 160, scale : 0.5, sheet : gwiazdka1 ? 'capacitor': 'capacitorBW'}));
	stage.insert(new Q.Sprite({x:650, y: 120, scale : 0.5, asset : gwiazdka1 ? 'capacitor.png': 'capacitorBW.png',z : 1000}));
	//stage.insert(new Q.Sprite({x:700, y: 160, scale : 0.5, sheet : gwiazdka2 ? 'integratedCircuit': 'integratedCircuitBW'}));
	stage.insert(new Q.Sprite({x:740, y: 120, scale : 0.5, asset : gwiazdka2 ? "integratedcircuit.png": "integratedcircuitBW.png",z : 1000}));
	stage.insert(new Q.Sprite({x:850, y: 120, scale : 0.5, asset : gwiazdka3 ? 'coil.png': 'coilBW.png',z : 1000}));
	//stage.insert(new Q.Sprite({x:800, y: 160, scale : 0.5, sheet : gwiazdka3 ? 'coil': 'coilBW'}));

  toLevelSelect.on("click",function() {
    Q.clearStages();
    Q.stageScene('level selector');
	l.log("t", "touch na 0");
	Q.touch(Q.SPRITE_UI, [0]); //only stage 1 -> controls
  });
  backButton.on("click",function() {
    Q.clearStage(2);
	l.log("t", "touch na 0 i 1");
	Q.touch(Q.SPRITE_UI, [0,1]); //only stage 1 -> controls
  });

  //box.fit(20);
}, {sort: true});
});
