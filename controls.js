// Transport deck of the main game screen: play, pause, step, stop, slower,
// faster. The playback logic is unchanged from the original game; only the
// buttons are now Toybox HTML (UI kit) instead of canvas sprites.
t.Controls = {
	animationIsPlaying : false,
	toDoAfterAnimationStops: false, 	//callback for when play or stop is clicked during animation
	lastRun : null,		//{steps, end, parts} of the last finished run, for the "Last run" card
	stepsShown : 0,		//steps animated in the current run
	displayMe : function(stage){
		var UI = t.UI, GS = t.GameScreen, L = GS.layout;
		var tt=t.TuringTable;
		var controls = this;
		this.lastRun = null;

		var finishRun = function(){
			var end = tt.howItEnded || "idle";
			var run = {end : end, steps : end === "victory" && tt.totalSteps !== undefined ? tt.totalSteps : controls.stepsShown};
			if(end === "victory"){
				var lev = t.Levels.currentLevel;
				var res = lev.getResult ? lev.getResult(tt.totalParts, tt.totalSteps) : undefined;
				if(typeof res === "number") run.parts = res;
			}
			controls.lastRun = run;
			GS.updateScore();
			UI.emit("run:end", run);
		};

		var afterAnimationCheck = function(){
			if(tt.steps.isEmpty()) {
				finishRun();
				if(tt.howItEnded === 'victory'){
					if(t.HelpOverlay) t.HelpOverlay.close();
					Q.stageScene("endLevel",2, {totalParts : tt.totalParts,
								totalSteps : tt.totalSteps,
								result : t.Levels.currentLevel
								.getResult(tt.totalParts, tt.totalSteps)});
				}
				return true;
			}
		}

		var animateStep = function(step, callback){
			if(!step.ultimateEnd || step.turingMotion || step.roboMotion) controls.stepsShown++;
			tt.animate(step, callback);
		}

		var playVirtually = function(){
			t.Levels.currentLevel.setRobotTable(t.Levels);
			if(t.Levels.currentLevel.beforePlayInit) t.Levels.currentLevel.beforePlayInit();
			t.TuringTable.resetDot();
			controls.stepsShown = 0;
			var noste = 0;
			while(tt.stepForward().ultimateEnd===undefined){noste++;}
		}

		var playAlternativesVirtually = function(){
			t.Levels.currentLevel.setRobotTable(t.Levels);
			var noal = t.Levels.numberOfAlternatives();
			var counter = 0;
			var lost = false;
			controls.stepsShown = 0;
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
				if(t.Controls.toDoAfterAnimationStops) {
					var pom = t.Controls.toDoAfterAnimationStops;
					t.Controls.toDoAfterAnimationStops = false;
					pom();
					} else {
					if(afterAnimationCheck()) return;
					animateStep(tt.steps.pollFirst(), animate);
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
				animateStep(t.TuringTable.steps.pollFirst(), afterAnimationCheck);
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
					animateStep(tt.steps.pollFirst(), animate);
				}
			}
			animate();
		};

		var play = function(){
			var whatToPlay = playFunction;
			if(t.Levels.currentLevel.alternatives) whatToPlay = playAlternatives;
			t.TileInput.cancel();
			if(t.Controls.animationIsPlaying){
				t.Controls.toDoAfterAnimationStops = whatToPlay;
			} else whatToPlay();
		};

		var stop = function(){
			if(t.Controls.animationIsPlaying)
				t.Controls.toDoAfterAnimationStops = function(){
					t.TuringTable.resetDot();
					t.Levels.currentLevel.setRobotTable(t.Levels);
				}; else {
				t.TuringTable.resetDot();
				t.Levels.currentLevel.setRobotTable(t.Levels);
				}
		};

		// ---- the deck ----
		var card = UI.card(L.deck, "deck");
		var portrait = L.mode === "portrait";
		var row = UI.place(UI.el("div", "gs-deck-row", card.el), {x: portrait ? 12 : 18, y: portrait ? 12 : 14,
			w: L.deck.w - (portrait ? 24 : 36) - 6});
		var b = this.buttons = {};
		b.play = UI.button({cls: "tomato big gs-run", icon: "play", iconScale: 3, label: "Run", px: 3, title: "Run the program", onClick: play}, row);
		b.pause = UI.button({cls: "sq", icon: "pause", iconScale: 3, title: "Pause", onClick: pausefunction}, row);
		b.step = UI.button({cls: "sq", icon: "step", iconScale: 3, title: "Next step", onClick: singlestepfunction}, row);
		b.stop = UI.button({cls: "sq", icon: "stop", iconScale: 2, title: "Stop and reset", onClick: stop}, row);
		UI.el("div", "sep", row);
		var speed = UI.el("div", "gs-speed", row);
		b.slower = UI.button({cls: "sq sky", icon: "slower", iconScale: 3, title: "Slower", onClick: function(){
			t.TuringTable.slower();
			updateSpeedLabel();
		}}, speed);
		var pill = UI.el("div", "tb-pill", speed);
		pill.setAttribute("aria-live", "polite");
		b.faster = UI.button({cls: "sq sky", icon: "faster", iconScale: 3, title: "Faster", onClick: function(){
			t.TuringTable.faster();
			updateSpeedLabel();
		}}, speed);

		var updateSpeedLabel = function(){
			var stepTime = t.TuringTable.stepTimeFactor;
			var lab = stepTime<=1 ? "x"+(1/stepTime) : "1/"+stepTime;
			pill.innerHTML = "";
			pill.appendChild(UI.px(lab, 3));
			pill.title = "Speed " + lab;
			b.slower.disabled = t.TuringTable.stepTimeFactor>16;
			b.faster.disabled = t.TuringTable.stepTimeFactor*16<1;
		}
		updateSpeedLabel();

		if(portrait){
			// second row: the last run and the part targets
			var score = UI.place(UI.el("div", "gs-score", card.el), {x: 14, y: 14 + 58 + 12, w: L.deck.w - 28 - 6, h: L.deck.h - 14 - 58 - 12 - 14 - 6});
			GS.fillScore(score, t.Levels.currentLevel, true);
		}
		this._state = null;
		this.refreshButtons();
	},

	refreshButtons : function(){
		var b = this.buttons;
		if(!b || !b.play) return;
		var tt = t.TuringTable;
		var running = this.animationIsPlaying && !this.toDoAfterAnimationStops;
		var state = (running ? "r" : "") + (tt.steps.isEmpty() ? "" : "p");
		if(state === this._state) return;
		this._state = state;
		b.play.disabled = running;
		b.pause.disabled = !running;
	}
}
