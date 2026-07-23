;Quintus.TuringScenes = function(Q) {

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
		creditsButton.insert(new Q.UI.Text({label : "Vanity", "color" : finishedTextColor, family : "monospace", size : 35}));
		creditsButton.on("click", function(){
			Q.clearStages();
			Q.stageScene("credits");
		});
	}, {sort : true});
	
	//stage 0
	Q.scene("level",function(stage) {
		Q.touch(Q.SPRITE_UI, [0,1]); //only stage 1 -> controls
		console.log('setting level scene');
		var bg = stage.insert(new Q.Sprite({type: Q.SPRITE_NONE, asset : 'motherboard.png', x: Q.width/2, y: Q.height/2}));
		t.Levels.setLevel(stage);

		t.TuringTable.callbacksUntilCallback = 0;
		t.Selector.displayMe(stage);
				if(t.Levels.currentLevel.beforePlayLimit) t.Levels.currentLevel.beforePlayLimit();
	}, {sort : true});
	
	//stage 1
	Q.scene("controls", function(stage){
		t.Controls.displayMe(stage);
		t.Controls.animationIsPlaying = false;
		t.Controls.toDoAfterAnimationStops = false;
	});
	
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

	//stage 4
	Q.scene("popup",function(stage) {
		Q.touch(Q.SPRITE_UI, [4]); //only stage 1 -> controls
		var container = stage.insert(new Q.UI.Container({
			x: 160, y: 160, z: 1, fill: "rgb(255,255,0)"
		}));
		if(stage.options.set) stage.options.set(container);



		//var actualHelp = container.insert(new Q.Sprite({x: stage.options.imgX||200, y: stage.options.imgY||50,
		//	asset : stage.options.img||'stepHelp.png'})); 
		var exitButton = container.insert(new Q.UI.Button({x: 570, 
			y: -30, scale:0.5, sheet:'exitButton'},
			function(){
				Q.touch(Q.SPRITE_UI, [0,1]); //only stage 1 -> controls
				Q.clearStage(4);
			}));
			container.fit(10);
	});
	

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
	
	
	Q.scene("credits",function(stage) {
		stage.insert(new Q.Sprite({x: 512, y: 384, asset : "greenscreen.png"}));
		//var obrazek = stage.insert(new Q.Sprite({asset : "intro1.png", x: 512, y: 384}));
		stage.insert(new Q.UI.Text({x: 512, y: 260, "color" : "#00FF00", family : "monospace", size : 22, label:
				"My name is Nadbor Drozd, I'm a physicist-turned-programmer and a\n"+
				"problem solving afficionado. If you have any suggestions, complaints,\n"+
				"bug reports on Turing - feel free to email me at nadbordrozd@gmail.com\n"+
				"Also - I'm always on the lookout for new interesting projects in math,\n"+
				"physics, machine learning, data mining, video games, programming,\n"+
				"education - so if you have one of these lying around - let me know.\n"+
				"And now - credit, where credit is due. Great thanks to:\n"+
				"- Pascal Rettig - creator of the game engine Quintus, who responds\n"+
				"to all questions with speed and competence\n"+
				"- Nicholas Feinberg - with his awesome Manufactoria - the game that\n"+
				"inspired me to make Turing. Go play it now, it's brilliant.\n"+
				"- The guys at robozzle.com - another direct inspiration\n"+
				"- Bartek Stodulski from Laboratorium EE - on whose dime I had worked on\n"+
				"an early version of Turing\n"+
				"- My wonderful wife Ola and daughter Lucy without whom this game\n"+
				"would have been finished 3 months earlier"
				
				
			}));
		//var muka = prompt("Saved Game", t.GameSaver.allToString());
		var gamesavetext = $("#gamesave");

		var cont = stage.insert(new Q.UI.Container({x: 800, y: 600, stroke: "rgb(0,255,0)", border: 2, frame: 1}));
		var lucy = cont.insert(new Q.UI.Button({asset : "lucydesk.png"}, 
			function(){
					//gamesavetext[0].innerHTML = t.GameSaver.allToString();
					//selectText("gamesave");
				//var a = prompt("To transfer your game progress top another browser - copy this string and paste it on the other browser.", t.GameSaver.allToString());
				//if(a!==null) t.GameSaver.resetFromString(a);
			})
		);
		cont.fit(2);
		
				var unavailableColor = "rgba(0,0,0,0)";
		var availableColor = "rgba(150,255,0,0)";
		var finishedColor = "rgba(150,255,0,0)";
		var unavailableTextColor = "rgba(0,255, 0, 0.25)";
		var availableTextColor = "#00FF00";
		var finishedTextColor = "#00FF00";
		var unavailableStroke = "rgba(0,255, 0, 0.25)";
		var availableStroke = "#00FF00";
		var finishedStroke = "#00FF00";
		var backButton = stage.insert(new Q.UI.Button({x:  256, y: 610, w: 220, h: 60, 
				fill: "rgba(150,255,0,0.2)",
				w : 250,
				h: 170, 
				border : 3,
				frame : 1,
				stroke : "#00FF00",
				z: 3}));
		backButton.insert(new Q.UI.Text({label : "back to\nthe game", "color" : "#00FF00", family : "monospace", size : 40}));
		backButton.on("click", function(){
			gamesavetext[0].innerHTML = "";
			Q.clearStages();
			Q.stageScene("level selector");
		});
	});
	
	
	//stage 5
	Q.scene("help",function(stage) {
		stage.insert(new Q.Rectangle({x : 512, y: 384, w : 1024, h : 768, color: "black",  opacity : 0.5, z :0}));
		stage.insert(new Q.Sprite({x:512, y: 384, asset : 'helpKalka.png'}));
		var helpFill = "rgba(211,211,211,1)";
		var helpStroke = "#00FF00";
		var helpColor = "#00FF00";
		var helpBorder = 2;
		var helpRadius = 10;
		var helpTextColor = "#FFFF00";
		var helpInstruction = function(xx, yy, labellabel){
			var box = stage.insert(new Q.UI.Container({x: xx, y : yy, //w: 102, h: 76, 
				fill : "#000000", stroke : "#00FF00", border : 2, radius : 10, z : 2}));
				box.insert(new Q.UI.Text({label : labellabel, size : 22,
				color:"#00FF00",
				family : "Candara"}));
			box.fit(10);
		}
		Q.touch(Q.SPRITE_UI, [5]); //only stage 1 -> controls
		//var obrazek = stage.insert(new Q.Sprite({asset : "intro1.png", x: 512, y: 384, opacity : 0.3}));

		
		helpInstruction(259, 654, "This is the robot's CPU. Instructions\n"+
									"that you put here will be carried out\n"+
									"by the robot.");
		
		helpInstruction(820, 640, "This is the robot's cell. Help him\n"+
								  "escape by programming his CPU");
								  
		helpInstruction(620, 240, "These are control buttons -\n"+
								  "- play, pause, next, stop, slower, faster.");
								  
		helpInstruction(220, 220, "Each of these instructions makes\n"+
								  "the robot perform a simple task\n"+
								  "- like moving or turining around.\n"+
								  "Drag one to the CPU and press\n"+
								  "play to see the effect"); 
								  
		helpInstruction(670, 60, "This button will take you back\n"+
								  "to level selection screen"); 
								  
		helpInstruction(900, 340, "You can bring back this\n"+
								  "instruction at any time\n"+
								  "by clicking here"); 
			
		var exitButton = stage.insert(new Q.UI.Button({x: 512, w: 152, h: 253, fill : "rgba(0,0,0,1)", 
			stroke : "#00FF00", color : "#00FF00", border : 2, radius : 10,  
			y: 384},
			function(){
				Q.clearStage(5);
				Q.touch(Q.SPRITE_UI, [0,1]);
			}));
			exitButton.insert(new Q.Sprite({sheet : "greenXButton"}));
		exitButton.fit(20);
	});
	
	
	
	
};