// Credits screen (moved unchanged from TuringScenes.js; becomes "About" in tg-84y.8).
TuringScenes.add(function(Q) {
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
});
