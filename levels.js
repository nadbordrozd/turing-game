t.Levels = {
	u : {},   		//utils
	currentLevel: undefined,
	showColors : function(colorList){
		t.RobotTable.addCounters(colorList);
		t.Selector.addColoredOperators(colorList);
	},
	hideColors : function(){
		for(var colo in t.OperatorUtils.colors){
			$("."+t.OperatorUtils.colors[colo].decrementer.name).hide();
			$("."+t.OperatorUtils.colors[colo].incrementer.name).hide();
		}
	},
	display : function(){
		var d = $("<div>Level selector</div>");
		d.addClass("levelselector");
		return d;
	}(),
	obstacle : {what: t.Obstacles.Obstacle},
	chest : {what : t.Obstacles.End},
	levels : {},
	selected : undefined,
	currentAlternative : 0,
	set : function(x, y, what, angle, dot){
		var til = {"what" : what};
		if(dot) til.dot = true;
		if(angle) til.angle = angle;
		t.RobotTable.setTile(x,y,til);
	},
	addDot : function(x,y){
		t.RobotTable.addDot2(x,y);
	},
	hasAlternatives : function(){
		return this.selected.alternatives!==undefined;
	}, 
	numberOfAlternatives : function(){
		return this.currentLevel.alternatives.length;
	},
	
	nextAlternative : function(){
		this.currentLevel.current++;
		if(this.currentLevel.current===this.currentLevel.alternatives.length) this.currentLevel.current = 0;
	},
	
	
	setRobot : function(x, y, angle){
		t.RobotTable.setRobot(x,y,angle);
	},
	
	resetRobotTable : function(){
		if(this.hasAlternatives()){
			this.selected.alternatives[this.currentAlternative].setRobotTable(this);
		} else 
		this.selected.setRobotTable(this);
	},
	
	//resetRobot : function(){
		//if(this.selected.setRobot) { this.selected.setRobot(this);}
		//else t.RobotTable.setPosition();
	//},
		
	resetTables : function(dturing, drobot){
		if(!t.stages) t.stages = [];
		t.stages.push(this.stage);
		t.TuringTable.displayMe(this.stage, dturing);
		t.RobotTable.displayMe(this.stage, drobot);
		/*
		$(".ttable").remove();
		$(".rtable").remove();
		t.TuringTable.init(dturing);
		t.RobotTable.init(drobot);
		$("body").append(t.TuringTable.getDisplay());
		$("body").append(t.RobotTable.getDisplay());
		*/
	},
	
	// Scoring is by execution time (steps) only; the number of instruction
	// tiles used does not count. level.times = [t3, t2, t1] holds the maximum
	// step counts that earn 3, 2 and 1 parts; any slower finish earns 0.
	// level.alwaysFull = true gives 3 parts for any finish.
	scoreByTime : function(level, moves){
		if(level.alwaysFull) return 3;
		var tm = level.times;
		if(!tm) return 3;
		if(moves<=tm[0]) return 3;
		if(moves<=tm[1]) return 2;
		if(moves<=tm[2]) return 1;
		return 0;
	},

	// Called as level.getResult(parts, moves); parts is ignored.
	defaultGetResult : function(parts, moves){
		return t.Levels.scoreByTime(this, moves);
	},

	addLevel : function(level){
		level.getResult = this.defaultGetResult;
		this.levels[level.name] = level;
		var lehe = $("<p>"+level.name+"</p>");
		level.label = lehe;
		lehe.addClass("levelname");
		this.display.append(lehe);
		lehe.mousedown(function(){
			t.Levels.setLevel(level.name);
		});
	}, 
	
	setLevel : function(stage){
		this.stage = stage;
		var l = this.currentLevel;
		l.set(this);
	},
}



t.Levels.addLevel({
	name: "start here",
	set : function(that){
		that.resetTables([1,1],[2,1]);
		t.RobotTable.printtable();
		
		t.RobotTable.printtable();
		t.Selector.setBasicOperators();
		this.setRobotTable(that);
	},
	setRobotTable : function(that){
		that.setRobot(0,0,0);
		that.set(0,1,t.Obstacles.End);
	}, 
	times : [2, 4, 6], // calibrated: best found B = 1 steps (docs/levels/CALIBRATION.md)
	x : 100, 
	y: 60,
	text : "Help the robot escape its cell: place a Step Forward tile on its circuit board (green), then press Play."
});

t.Levels.addLevel({
	name: "chaining",
	set : function(that){
		that.resetTables([4,4],[5,5]);
		t.Selector.setBasicOperators();
		this.setRobotTable(that);
	},
	setRobotTable : function(that){
		that.setRobot(2,0,0);
		that.set(2,4,t.Obstacles.End);
	}, 
	times : [5, 7, 9], // calibrated: best found B = 4 steps (docs/levels/CALIBRATION.md)
	x : 300,
	y : 60,
	required : ["start here"],
	text: "One step won't do this time. Place several instructions in a row and the program runs through each of them in turn."
});

t.Levels.addLevel({
	name : "De revolutionibus",
	set : function(that){
		that.resetTables([5,5],[3,3]);
		t.Selector.setBasicOperators();
		this.setRobotTable(that);
	},
	setRobotTable : function(that){
		that.setRobot(1,0,0);
		that.set(0,2,t.Obstacles.End);
	}, 
	times : [5, 7, 9], // calibrated: best found B = 4 steps (docs/levels/CALIBRATION.md)
	x: 500,
	y: 60, 
	w: 200, 
	required : ["chaining"],
	text: "This robot can't move sideways. To go left it has to turn left first, then step forward."
});



t.Levels.addLevel({
	name : "bend it",
	set : function(that){
		that.resetTables([5,5],[5,5]);
		t.Selector.setBasicOperators();
		this.setRobotTable(that);
	},
	setRobotTable : function(that){
		that.setRobot(2,0,0);
		that.set(0,4,t.Obstacles.End);
	}, 
	times : [8, 10, 16], // calibrated: best found B = 7 steps (docs/levels/CALIBRATION.md)
	x : 700,
	y: 60, 
	texty : 17,
	required : ["De revolutionibus"],
	text: "Use the whole board: the black arrowheads on a tile show where the program goes next. Rotate a tile to change its path."
});

t.Levels.addLevel({
	name: "hedge",
	set : function(that){
		that.resetTables([5,5],[5,5]);
		that.set(3,0,t.Obstacles.Obstacle);
		that.set(3,1,t.Obstacles.Obstacle);
		that.set(3,2,t.Obstacles.Obstacle);
		t.Selector.setBasicOperators();
		this.setRobotTable(that);
	},
	setRobotTable : function(that){
		that.set(4,0,t.Obstacles.End);
		that.setRobot(2,0,0);
	}, 
	times : [11, 14, 23], // calibrated: best found B = 10 steps (docs/levels/CALIBRATION.md)
	x : 900, 
	y: 60,
	required : ["bend it"],
	text : "The faster the robot gets out, the better your score - and the more robots you rescue."
});

t.Levels.addLevel({
	name: "resistors",
	set : function(that){
		that.resetTables([5,5],[4,4]);
		this.setRobotTable(that);
		t.Selector.setBasicOperators();
	},
	setRobotTable : function(that){
		that.setRobot(1,0,0);
		t.RobotTable.dotsRemaining = 4;
		that.set(1,1,t.Obstacles.Empty, 0, true);
		that.set(1,2,t.Obstacles.Empty, 0, true);
		that.set(2,1,t.Obstacles.Empty, 0, true);
		that.set(2,2,t.Obstacles.Empty, 0, true);
	}, 
	x: 700,
	y: 130,
	times : [7, 9, 14], // calibrated: best found B = 6 steps (docs/levels/CALIBRATION.md)
	required : ["bend it"],
	text : "No hatch this time: grab all four parts to win."
});

t.Levels.addLevel({
	name: "more resistors",
	set : function(that){
		that.resetTables([5,5],[5,5]);
		this.setRobotTable(that);
		t.Selector.setBasicOperators();
	},
	setRobotTable : function(that){
		that.setRobot(2,0,0);
		t.RobotTable.dotsRemaining = 5;
		that.set(4,0,t.Obstacles.Empty, 0, true);
		that.set(2,2,t.Obstacles.Empty, 0, true);
		that.set(1,4,t.Obstacles.Empty, 0, true);
		that.set(3,3,t.Obstacles.Empty, 0, true);
		that.set(0,0,t.Obstacles.Empty, 0, true);
	}, 
	times : [23, 30, 50], // calibrated: best found B = 21 steps (docs/levels/CALIBRATION.md)
	x: 900, 
	y: 130,
	w : 145,
	required : ["resistors"],
	text : "Choose your path carefully if you want to fit all the instruction tiles on the board."
});

t.Levels.addLevel({
	name: "out of reach",
	set : function(that){
		that.resetTables([2,1],[9,9]);
		t.Selector.setStepAndMove();
		this.setRobotTable(that);
	},
	setRobotTable : function(that){
		that.set(4,8,t.Obstacles.End);
		that.setRobot(4,0,0);
	}, 
	times : [9, 12, 18], // calibrated: best found B = 8 steps (docs/levels/CALIBRATION.md)
	x: 500, 
	y: 130,
	required : ["resistors"],
	text : "Long, repetitive walks are what programs are for. Point the flow back to an earlier tile to make a loop."
});

t.Levels.addLevel({
	name: "stairs",
	set : function(that){
		that.resetTables([3,3],[9,9]);	
		this.setRobotTable(that);
		t.Selector.setBasicOperators();
	},
	setRobotTable : function(that){
		that.setRobot(0,0,0);
		for(var i=1; i<9; i++){
			that.set(i,i, t.Obstacles.Empty, 0, true);
			that.set(i-1,i, t.Obstacles.Empty, 0, true);
		}
		t.RobotTable.dotsRemaining = 16;
	}, 
	times : [33, 45, 70], // calibrated: best found B = 31 steps (docs/levels/CALIBRATION.md)
	x : 251,
	y: 123,
	required : ["out of reach"],
	text : "Step, turn, step, turn... sounds like a job for a loop."
});

t.Levels.addLevel({
	name: "conditionals",
	set : function(that){
		that.resetTables([3,3],[10,10]);
		for(var i=0; i<8; i++) that.set(4,i,t.Obstacles.Obstacle);
		for(var i=0; i<9; i++) that.set(6,i,t.Obstacles.Obstacle);
		for(var i=0; i<4; i++) that.set(i,7,t.Obstacles.Obstacle);
		for(var i=0; i<7; i++) that.set(i,9,t.Obstacles.Obstacle);
		this.setRobotTable(that);
		t.Selector.setDefaultOperators();
	},
	setRobotTable : function(that){
		that.set(0,8,t.Obstacles.End);
		that.setRobot(5,0,0);
	},
	times : [19, 26, 45], // calibrated: best found B = 18 steps (docs/levels/CALIBRATION.md)
	x : 510, 
	y: 288,
	required : ["out of reach"],
	text : "The conditional tile does one thing if there's a wall in front of the robot and another if there isn't - perfect for \"go until you hit a wall\"."
	
});



t.Levels.addLevel({
	name : "spiral",
	set : function(that){
		that.resetTables([5,5],[9,9]);
		for(var i=8; i>0; i--){that.set(i,1,t.Obstacles.Obstacle);}
		for(var i=2; i<8; i++){that.set(1,i,t.Obstacles.Obstacle);}
		for(var i=2; i<8; i++){that.set(i,7,t.Obstacles.Obstacle);}
		for(var i=6; i>2; i--){that.set(7,i,t.Obstacles.Obstacle);}
		for(var i=7; i>2; i--){that.set(i,3,t.Obstacles.Obstacle);}
		for(var i=4; i<6; i++){that.set(3,i,t.Obstacles.Obstacle);}
		for(var i=4; i<6; i++){that.set(i,5,t.Obstacles.Obstacle);}
		
		this.setRobotTable(that);
		t.Selector.setDefaultOperators();
	},
	setRobotTable : function(that){
	that.set(4, 4,t.Obstacles.End);
		that.setRobot(8,0,3);
	},
	times : [85, 110, 180], // calibrated: best found B = 78 steps (docs/levels/CALIBRATION.md)
	x : 408, 
	y: 214,
	required : ["conditionals"],
	text : "This one's easier than you think"
});

t.Levels.addLevel({
	name : "zigzag",
	set : function(that){
		that.resetTables([5,5],[9,9]);
		for(var i=8; i>0; i--){that.set(i,1,t.Obstacles.Obstacle);}
		for(var i=0; i<8; i++){that.set(i,3,t.Obstacles.Obstacle);}
		for(var i=8; i>0; i--){that.set(i,5,t.Obstacles.Obstacle);}
		for(var i=0; i<8; i++){that.set(i,7,t.Obstacles.Obstacle);}
		
		that.setRobot(8,0,3);
		t.Selector.setDefaultOperators();
	},
	setRobotTable: function(that){
	that.set(0, 8,t.Obstacles.End);
		that.setRobot(8,0,3);
	},
	required : ["conditionals"],
	times : [105, 140, 220], // calibrated: best found B = 97 steps (docs/levels/CALIBRATION.md)
	x : 719,
	y : 323,
	text : "Left to right, right to left, all the way down."
});


t.Levels.addLevel({
	name : "anywhere",
	set : function(that){
		that.resetTables([6,6],[7,7]);
		this.setRobotTable(that);
		t.Selector.setDefaultOperators();
	},
	setRobotTable: function(that){
		for(var i =0; i<7; i++)
			for(var j=0; j<7; j++){
				if(i!==0||j!==0) that.addDot(i,j);
			}
		that.setRobot(0,0,0);
		t.RobotTable.dotsRemaining = 48;
	},
	times : [65, 85, 135], // calibrated: best found B = 60 steps (docs/levels/CALIBRATION.md)
	x : 803,
	y: 382,
	required : ["conditionals"],
	text: "A dot on every tile. Leave no tile unvisited."
});


t.Levels.addLevel({
	name : "way out",
	set : function(that){
		that.resetTables([6,6],[7,7]);
		this.setRobotTable(that);
		t.Selector.setDefaultOperators();
	},
	setRobotTable: function(that){
		for(var i=0; i<7; i++)
			for(var j=0; j<7; j++){
				if(Math.abs(3-i)+Math.abs(3-j)>=4) that.set(i,j,t.Obstacles.Obstacle);
				if(Math.abs(3-i)+Math.abs(3-j)===3) that.addDot(i,j);
			}
		that.setRobot(3,3,0);
		t.RobotTable.dotsRemaining = 12;
	},
	x : 643,
	y: 239,
	required : ["conditionals"],
	times : [60, 80, 125], // calibrated: best found B = 55 steps (docs/levels/CALIBRATION.md)
	text : "How would you instruct a robot to find an exit from a circular room?"
});


t.Levels.addLevel({
	name : "goodwin",
	set : function(that){
		that.resetTables([4,4],[6,6]);
		this.setRobotTable(that);
		t.Selector.setBasicOperators();
	},
	setRobotTable: function(that){
		t.RobotTable.dotsRemaining = 8;
		that.set(0,1,t.Obstacles.Empty,0, true);
		that.set(1,2,t.Obstacles.Empty,0, true);
		that.set(4,0,t.Obstacles.Empty,0, true);
		that.set(3,1,t.Obstacles.Empty,0, true);
		that.set(4,3,t.Obstacles.Empty,0, true);
		that.set(5,4,t.Obstacles.Empty,0, true);
		that.set(2,4,t.Obstacles.Empty, 0, true);
		that.set(1,5,t.Obstacles.Empty,0, true);
		that.setRobot(2,2,0);	
	},
	x : 200,
	y: 200,
	required : ["out of reach"],
	times : [30, 40, 65], // calibrated: best found B = 28 steps (docs/levels/CALIBRATION.md)
	text : "At this point you don't need tips anymore."
});

t.Levels.addLevel({
	name : "your ad here",
	set : function(that){
		that.resetTables([4,4],[6,6]);
		this.setRobotTable(that);
		t.Selector.setBasicOperators();
	},
	setRobotTable: function(that){
		t.RobotTable.dotsRemaining = 19;
		that.set(0,2,t.Obstacles.Empty,0, true);
		that.set(0,3,t.Obstacles.Empty,0, true);
		that.set(0,4,t.Obstacles.Empty,0, true);
		that.set(1,0,t.Obstacles.Empty,0, true);
		that.set(1,1,t.Obstacles.Empty,0, true);
		that.set(1,4,t.Obstacles.Empty,0, true);
		that.set(1,5,t.Obstacles.Empty,0, true);
		that.set(2,0,t.Obstacles.Empty,0, true);
		that.set(2,5,t.Obstacles.Empty,0, true);
		that.set(3,0,t.Obstacles.Empty,0, true);
		that.set(3,5,t.Obstacles.Empty,0, true);
		that.set(4,0,t.Obstacles.Empty,0, true);
		that.set(4,1,t.Obstacles.Empty,0, true);
		that.set(4,4,t.Obstacles.Empty,0, true);
		that.set(4,5,t.Obstacles.Empty,0, true);
		that.set(5,1,t.Obstacles.Empty,0, true);
		that.set(5,2,t.Obstacles.Empty,0, true);
		that.set(5,3,t.Obstacles.Empty,0, true);
		that.set(5,4,t.Obstacles.Empty,0, true);
		that.setRobot(0,1,0);	
	},
	x: 110,
	y: 152, 
	required : ["out of reach"],
	times : [31, 45, 70], // calibrated: best found B = 29 steps (docs/levels/CALIBRATION.md)
	text: "Getting the hang of it yet?"
});



t.Levels.addLevel({
	name : "hobbit:",
	set : function(that){
		that.resetTables([5,5],[9,9]);
		this.setRobotTable(that);
		t.Selector.setDefaultOperators();
	},
	setRobotTable: function(that){
		that.set(0,1,t.Obstacles.Empty, 0, true);
		t.RobotTable.dotsRemaining = 64;
		for(var i=0; i<9; i++)
			for(var j=0; j<9; j++)
				if((i%2)*(j%2)===1) that.set(i,j,t.Obstacles.Obstacle);
				else if(i+j>0) that.set(i,j,t.Obstacles.Empty,0, true);
		that.setRobot(0,0,0);	
	},
	x : 728,
	y : 432,
	required : ["anywhere"],
	times : [335, 445, 715], // calibrated: best found B = 317 steps (docs/levels/CALIBRATION.md)
	text: "Yes, it can be done."
});