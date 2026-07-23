t.Controls = {
	animationIsPlaying : false,
	toDoAfterAnimationStops: false, 	//callback for when play or stop is clicked during animation
	displayMe : function(stage){
		var container = stage.insert(new Q.UI.Container({
		w : 650, h : 285,
		x:685, y: 40, z: 1, fill: "rgba(140,0,255,.5)"
		}));
		var tt=t.TuringTable;
		
		var afterAnimationCheck = function(){
			if(tt.steps.isEmpty()) {
				if(tt.howItEnded === 'victory'){
					Q.clearStage(5);  //kliruje helpa
					Q.stageScene("endLevel",2, {totalParts : tt.totalParts,
								totalSteps : tt.totalSteps,
								result : t.Levels.currentLevel
								.getResult(tt.totalParts, tt.totalSteps)});
				}
				else {
					l.log("t", "wlaczam touch na stage 0 i 1 ");
					Q.touch(Q.SPRITE_UI, [0,1]); //stage 1 and 2
				}
				return true;
			}
		}
		
		var playVirtually = function(){
			Q.touch(Q.SPRITE_UI, [1]); //only stage 1 -> controls
			t.Levels.currentLevel.setRobotTable(t.Levels);
			if(t.Levels.currentLevel.beforePlayInit) t.Levels.currentLevel.beforePlayInit();
			t.TuringTable.resetDot();
			var noste = 0;
			while(tt.stepForward().ultimateEnd===undefined){noste++;}
		}
		
		var playAlternativesVirtually = function(){
			Q.touch(Q.SPRITE_UI, [1]); //only stage 1 -> controls
			t.Levels.currentLevel.setRobotTable(t.Levels);		
			var noal = t.Levels.numberOfAlternatives();
			var counter = 0; 
			var lost = false;
			while(noal>counter&&!lost){
				counter++;
				t.Levels.nextAlternative();
				tt.resetDot();
				t.Levels.currentLevel.setRobotTable(t.Levels);

				while(tt.stepForward().ultimateEnd===undefined){}
				if(tt.steps.peekLast().ultimateEnd!=="victory") lost = true;
			}
			if(t.Levels.currentLevel.beforePlayInit) t.Levels.currentLevel.beforePlayInit();
		}
		
		var playFunction = 	function(){
			if(!tt.steps.length) playVirtually();
			var animate = function(){
				//t.Controls.animationIsPlaying = false;
				if(t.Controls.toDoAfterAnimationStops) {
					var pom = t.Controls.toDoAfterAnimationStops;
					t.Controls.toDoAfterAnimationStops = false;
					pom();
					} else { 
					if(afterAnimationCheck()) return;
				//	t.Controls.animationIsPlaying = true;
					tt.animate(tt.steps.pollFirst(), animate);
				}
			}
			animate();
			
		};
		
		var pausefunction = function(){
			if(t.Controls.animationIsPlaying)
			t.Controls.toDoAfterAnimationStops = afterAnimationCheck;
		}
		
		var singlestepfunction = function(){
			if((!tt.steps.length)&&(!t.Controls.animationIsPlaying)){ if(t.Levels.currentLevel.alternatives) playAlternativesVirtually(); else playVirtually();}
			if(t.Controls.animationIsPlaying){
				t.Controls.toDoAfterAnimationStops = afterAnimationCheck;
			} else {
				tt.animate(t.TuringTable.steps.pollFirst(), afterAnimationCheck);
			}
		}

		
		var playAlternatives = function(){
			if(!tt.steps.length) playAlternativesVirtually();
			var animate = function(){
				if(t.Controls.toDoAfterAnimationStops) {
					var pom = t.Controls.toDoAfterAnimationStops;
					t.Controls.toDoAfterAnimationStops = false;
					pom();
					} else { 
					if(afterAnimationCheck()) return;
					tt.animate(tt.steps.pollFirst(), animate);
				}
			}
			animate();
		};
		
		var leftmost = -250;
		var dist = 70;
		var playButton = container.insert(new Q.UI.Button({x : leftmost, y: 100, 
			scale: 0.6, 'sheet': 'playButton'},
			function(){
				console.log(JSON.stringify(t.GameSaver.levelToShorthand(t.GameSaver.loadTuringTable())));
				var whatToPlay = playFunction;
				if(t.Levels.currentLevel.alternatives) whatToPlay = playAlternatives;
				t.highlighter.unhighlight();
				t.TuringTable.disableTouch();
				if(t.Controls.animationIsPlaying){
					t.Controls.toDoAfterAnimationStops = whatToPlay;
				} else whatToPlay();
			}));
		var pauseButton = container.insert(new Q.UI.Button({x : leftmost+dist, y: 100, 
			scale: 0.6, 'sheet': 'pauseButton'},pausefunction));
		var singlestepButton = container.insert(new Q.UI.Button({x : leftmost+2*dist, y: 100, 
			scale: 0.6, 'sheet': 'singleStepButton'},singlestepfunction));
			
		var stopButton = container.insert(new Q.UI.Button({x: leftmost+3*dist, y: 100,
			scale : 0.6, 'sheet': 'stopButton'},
			function(){
				t.highlighter.unhighlight();
				if(t.Controls.animationIsPlaying)
					t.Controls.toDoAfterAnimationStops = function(){
						t.TuringTable.resetDot();
						t.Levels.currentLevel.setRobotTable(t.Levels);
						Q.touch(Q.SPRITE_UI, [0,1]); //aktywuje touch 
						//console.error("wlaczam touch z powrotem");
					}; else {
					Q.touch(Q.SPRITE_UI, [0,1]);
					t.TuringTable.resetDot();
					t.Levels.currentLevel.setRobotTable(t.Levels);
					}
			}));
			




		
		var menuButton = container.insert(new Q.UI.Button({x: 280, y: 0,
			scale : 0.6, 'sheet' : 'menuButton'},
			function(){
				Q.clearStages();
				Q.stageScene('level selector');
			}));
			
		var helpButton = container.insert(new Q.UI.Button({x: 280, y: 100,
			scale : 0.6, sheet : 'yellowHelpButton'},
			function(){
				Q.stageScene('help', 5);
			}));
		//	font-family: Candara, Calibri, Segoe, "Segoe UI", Optima, Arial, sans-serif;
			//font-family: "Courier New", Courier, "Lucida Sans Typewriter", "Lucida Typewriter", monospace;
//font-family: "Lucida Sans Typewriter", "Lucida Console", Monaco, "Bitstream Vera Sans Mono", monospace;
		var speedometer = container.insert(new Q.UI.Text({x:leftmost+6*dist, y: 100, family : "Courier New",
                                        label: "x16", color:"#FFFF00", scale: 1.4 }));
			
		var updateSpeedLabel = function(){
			var stepTime = t.TuringTable.stepTimeFactor;
			var lab = stepTime<=1 ? "x"+(1/stepTime) : "1/"+stepTime;
			speedometer.p.label = lab;
		}
		updateSpeedLabel();
		var fasterButton = container.insert(new Q.UI.Button({x : leftmost+5*dist, y: 100,
			scale: 0.6, 'sheet': 'fasterButton'}, 
			function(){
				t.TuringTable.faster();
				updateSpeedLabel();
			}
		));
		
		var slowerButton = container.insert(new Q.UI.Button({x : leftmost+4*dist, y: 100,
			scale: 0.6, 'sheet': 'slowerButton'}, 
			function(){
				t.TuringTable.slower();
				updateSpeedLabel();
			}
		));
			
	

									
		//var title = container.insert(new Q.UI.Text({x:0, y: -20,
        //                                label: t.Levels.currentLevel.name, color:"#FFFF00", scale: 1.5 }));
		var lev = t.Levels.currentLevel;
		
		var levelText = container.insert(new Q.UI.Text({x:lev.textx||-40, y:lev.texty||23, color:"#FFFF00", scale: 0.85,
			family : "Candara, Arial", label : t.Levels.currentLevel.text||"TODO: text na temat tego \nlewelu krowa krowa krowa krwoa"}));
		
		//container.fit(1);
	}
}