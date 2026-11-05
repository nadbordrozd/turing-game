l = new function(){
	loglevels = {};
	this.loguj = function(logLevelID){
		loglevels[logLevelID] = true;
	}
	this.nieloguj = function(logLevelID){
		loglevels[logLevelID] = false;
	}
	this.log = function(logLevelID, string){
		if(loglevels[logLevelID]) console.log(string);
	}
	this.err = function(logLevelID, string){
		if(loglevels[logLevelID]) console.error(string);
	}
	this.loguj("error");
}();

f = function(){
  Q.clearStages();
  Q.stageScene("endLevel", {result : 3});
}
//l.loguj('t');

window.addEventListener('load',function(e) {
  // Set up a standard Quintus instance with only the 
  // Sprites and Scene module (for the stage support) loaded.
  var Q = window.Q = Quintus().include("Sprites, Scenes, 2D, Input, Touch, UI, Anim")
							.include("TuringScenes, TuringSprites")
                              .setup({ width: 1024, height: 768 });
							Q.touch(Q.SPRITE_UI);

							  
							  

	var krowa = $("<div></div>");
	krowa.addClass("krowa");
    $('canvas').append(krowa);
	var c = $('canvas')[0];
	context=c.getContext("2d");
	var drawLoadBar = function(progress){
		context.fillStyle = "#000000";
		context.fillRect(150, 450, 724, 60);
		context.fillStyle = "rgba(255, 255, 255, 0.3)";
		context.fillRect(150, 450, 724, 60);
		context.fillStyle = "#FFFFFF";
		context.fillRect(150, 450, 724*progress, 60);
		context.font="35px monospace";
		context.strokeText("Loading...",420,490);
	}
	var img=document.getElementById("loadingscreen");
	context.drawImage(img,0,0);
	var imagesToLoad = [ "resistor1.png", "resistor2.png", "resistor3.png", 'resistor4.png','resistor5.png','sprites.json', "greenscreen.png",
		'enemy.png', 'robot.png', 'helpKalka.png',
		'motherboard.png',  "highlight.png",
		'sprytszyt.png','obstacle.png',
		'tiles/program-tiles.png', 'program-tiles.json',
		'robotile.png', 'strzalka.png', 'levelend.png', "intro1.png", "intro2.png", "intro3.png",
		"coil.png", "integratedcircuit.png", 'capacitor.png',
		"coilBW.png", "integratedcircuitBW.png", 'capacitorBW.png',
		"greencoil.png", "greenintegratedcircuit.png", "greencapacitor.png",
		"lucydesk.png", "greenarrow.png"
		].concat(t.EndLevelRobots.images);

	for(var i in t.Operators){
		if(t.Operators[i].img!==undefined) imagesToLoad.push(t.Operators[i].img);
	}
	for(var i in t.Obstacles){
		if(t.Obstacles[i].img!==undefined) imagesToLoad.push(t.Obstacles[i].img);
	}
  

	var pom = function(n){
		var mopo = [];
		for(var i=0; i<n; i++) mopo.push(i);
		return mopo;
	}
	Q.animations('LavaNimationSheet', {
		"default" : { frames: pom(40), rate: 0.1, loop: true}
	});
	Q.animations('playerMations', {
		"default" : { frames: [0], rate: 0},
		"toYellow" : {frames: [1,2,3,4], rate : 0.05, next : "flicker"},
		"flicker" : {frames: [5,6,5,6,5,6,5,6,5,6,5,6], rate: 0.2, next: "toDead"},
		"toDead" : {frames: [7,8,9,10,11], rate: 0.05, loop: false, trigger : "died"},
		"drownInLava" : {frames: [12,13,14,15,16,17,18,19, 20, 21], rate: 0.35,  loop:false,
			trigger : "died"},
		"drown" : {frames: [23,24,25,26,27,28,29,30, 31], rate: 0.35,  loop:false,
			trigger : "died"}
	});
	var tempo =  0.05;
	// Program tiles from tools/art/tiles/program-tiles.mjs: the belt moves 1 px
	// per frame with a 25 px period. Quintus' anim step adds dt twice, so a
	// frame lasts rate/2 s: 0.08 gives 25 px/s, the old belt's speed.
	var beltTempo = 0.08;
	Q.animations('conveyorMations', {
		"default" : {frames: pom(25), rate: beltTempo, loop: true}
	});
	Q.animations('cwRotatorMations', {
		"default" : {frames: pom(50), rate: beltTempo, loop: true}
	});
	Q.animations('ccwRotatorMations', {
		"default" : {frames: pom(50), rate: beltTempo, loop: true}
	});
	Q.animations('stepForwardMations', {
		"default" : {frames: pom(25), rate: beltTempo, loop: true}
	});
	Q.animations('detectorMations', {
		"default" : {frames: pom(20), rate: tempo, loop: true}
	});
	Q.animations("magicMation", {
		"default" : {frames: pom(20), rate: tempo, loop: true}
	});
	Q.animations("magicTileMation", {
		"default" : {frames: [0], rate: 0}
	});
	Q.animations('sparkMations' ,{
		"default" : {frames: pom(29), rate: 0.1, loop: true}
	});
	Q.animations("emptyMation",{
		"default" : {frames : [0], rate : 0.1, loop: true}
	});
	Q.animations("exitHatchOpening",{
		"default" : {frames : [0], rate : 0},
		"open" : {frames : pom(21), rate : 0.15, loop: false, trigger : "finished"}
	});
	Q.animations("electricTrapNimation",{
		"default" : {frames : pom(21), rate : 0.15}
	});
	Q.animations("startTileMation",{
		"default" : {frames : [0], rate : 0}
	});
	for(var i in t.OperatorUtils.colors){
		Q.animations("incrementerMations"+i,{
			"default" : {frames : pom(60), rate : tempo, loop: true}
		});
		Q.animations("decrementerMations"+i,{
			"default" : {frames : pom(20), rate : 0.05, loop: true}
		});
	}
	




	Q.load(imagesToLoad,function() {
		console.log('loadimages');
		// this will create the sprite sheet lava
		Q.compileSheets("sprytszyt.png","sprites.json");
		// Redrawn program tiles replace the atlas entries of the same name.
		Q.compileSheets("tiles/program-tiles.png","program-tiles.json");
		Q.input.keyboardControls();
		//Q.stageScene("level selector");
		Q.stageScene("intro");
	}, {
			progressCallback: function(loaded,total) {
				//var element = document.getElementById("loading_progress");
				//element.style.width = Math.floor(loaded/total*100) + "%";
				drawLoadBar(loaded/total);
			}
		}
	
	);

});