// Level selector (moved unchanged from TuringScenes.js; the Toybox redo is tg-84y.2).
// Drawn for 1024x768; the UI kit fits it into the portrait layout with a stage viewport.
TuringScenes.add(function(Q) {
	Q.scene("level selector", function(stage){
		Q.touch(Q.SPRITE_UI, [0]); //only stage 1 -> controls
		var unavailableColor = "rgba(0,0,0,0)";
		var availableColor = "rgba(100,255,0,0.2)";
		var finishedColor = "rgba(150,255,0,0)";
		var unavailableTextColor = "rgba(0,255, 0, 0.25)";
		var availableTextColor = "#00FF00";
		var finishedTextColor = "#00FF00";
		var unavailableStroke = "rgba(0,255, 0, 0.25)";
		var availableStroke = "#00FF00";
		var finishedStroke = "#00FF00";

		var nr = 0;

		stage.insert(new Q.Sprite({x: 512, y: 384, asset : "greenscreen.png"}));
		var statuses = t.GameSaver.loadLevelStatuses();
		for(var name in statuses){
			var available = true;
			//var name = t.Levels.levels[i].name;
			var levStat = statuses[name];
			var color = availableColor;
			var textColor = availableTextColor;
			var strokeColor = availableStroke;
			if(levStat>0||levStat===0){
				color = finishedColor;
				textColor = finishedTextColor;
				strokeColor = finishedStroke;

			} else {
				var required = t.Levels.levels[name].required;
				if(required){
					for(var re in required){
						if(statuses[required[re]]===false) {
							available = false;
							color = unavailableColor;
							textColor = unavailableTextColor;
							strokeColor = unavailableStroke;
						}
					}
				}
			}

			var butX = t.Levels.levels[name].x||100+200*(nr%5);
			var butY = t.Levels.levels[name].y||60+70*(nr-nr%5)/5;
			var butW = t.Levels.levels[name].w||120;
			var levelButton = stage.insert(new Q.UI.Button({x:  butX, y: butY, w: butW, h: 40,
				fill: color,
				border : 3,
				frame : 1,
				stroke : strokeColor,
				z: 3}));
			levelButton.insert(new Q.UI.Text({label : name, "color" : textColor, family : "monospace", size : 15}));
			if(levStat){
				var gwiazdka1 = levStat>1;
				var gwiazdka2 = levStat>2;
				var gwiazdka3 = levStat>3;

				if(gwiazdka1) levelButton.insert(new Q.Sprite({asset : "greencapacitor.png", x:-25, y: 20, scale : 1}));
				if(gwiazdka2) levelButton.insert(new Q.Sprite({asset : "greenintegratedcircuit.png", x:-0, y: 20, scale : 1}));
				if(gwiazdka3) levelButton.insert(new Q.Sprite({asset : "greencoil.png", x:25, y: 20, scale : 1}));
			}

			if(available)
				levelButton.on("click", function(level){
					return function(){
						console.log(level.name);
						var Q = window.Q;
						t.Levels.currentLevel = level;
						Q.clearStages();
						Q.stageScene('level', 0,{sort: true});
						Q.stageScene('controls',1);
					};
				}(t.Levels.levels[name]));
			nr++;
		}

		var creditsButton = stage.insert(new Q.UI.Button({x:  236, y: 700, w: 220, h: 60,
				fill: finishedColor,
				border : 3,
				frame : 1,
				stroke : finishedStroke,
				z: 3}));
		creditsButton.insert(new Q.UI.Text({label : "About", "color" : finishedTextColor, family : "monospace", size : 35}));
		creditsButton.on("click", function(){
			Q.clearStages();
			Q.stageScene("about");
		});
	}, {sort : true});
});
