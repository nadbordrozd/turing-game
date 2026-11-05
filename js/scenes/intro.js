// Intro pictures (moved unchanged from TuringScenes.js; the Toybox redo is tg-84y.8).
TuringScenes.add(function(Q) {
	Q.scene("intro",function(stage) {
		var obrazek = stage.insert(new Q.Sprite({asset : "intro1.png", x: 512, y: 384}));
		var nr =0;
		//var actualHelp = container.insert(new Q.Sprite({x: stage.options.imgX||200, y: stage.options.imgY||50,
		//	asset : stage.options.img||'stepHelp.png'}));
		var exitButton = stage.insert(new Q.UI.Button({x: 512, w: 1024, h: 768, //fill : "rgba(0,0,0,0)",
		//	stroke : "#00FF00", color : "#00FF00", border : 2, asset: "greenarrow.png", radius : 10,
			y: 384},
			function(){
				nr++;
				if(nr==1) obrazek.p.asset = "intro2.png"; else
				if(nr==2) obrazek.p.asset = "intro3.png";
				else {
					Q.clearStages();
					Q.stageScene("level selector");
				}
			}));
		exitButton.fit(20);
	});
});
