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
	
	addLevel : function(level){
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
	getResult : function(parts, moves){
		return 3;
	},
	x : 100, 
	y: 60,
	text : "Program the robot to help it escape from its cell.\n"+
		   "Place the Step Forward instruction on the robot's\n"+
		   "circuit board (green) to make it move to the\n"+
		   "escape hatch. Press \"play\" when you are done.\n"
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
	getResult : function(parts, moves){
		var su = parts+moves;
		if(su===6) return 3;
		else if(su<9) return 2;
		else if(su<14) return 1;
		else return 0;
	}, 
	x : 300,
	y : 60,
	required : ["start here"],
	text: "This time a single step won't do. You can make the\n"+
		  "robot move multiple times by placing instructions \n"+
		  "one after another so that the program passes \n"+
		  "through each of them.\n"
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
	getResult : function(parts, moves){
		var su = parts+moves;
		if(su===8) return 3;
		else if(su<13) return 2;
		else if(su<16) return 1;
		else return 0;
	},
	x: 500,
	y: 60, 
	w: 200, 
	required : ["chaining"],
	text: "This simple robot can't move sideways. To move one tile\n"+
		  "to the left, it will have to first turn left and then\n"+
		  "step forward. To achieve this, you will have to place turn\n"+
		  "and step instructions on the board in the right order.\n"
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
	getResult : function(parts, moves){
		var su = parts+moves;
		if(su<=12) return 3;
		else if(su<15) return 2;
		else if(su<25) return 1;
		else return 0;
	},
	x : 700,
	y: 60, 
	texty : 17,
	required : ["De revolutionibus"],
	text: "Don't put all your instructions in single line. Use the\n"+
		  "whole board. Black arrowheads on an instruction tile\n"+
		  "indicate, where the program will flow next. By rotating\n"+
		  "the tile you can make it take any path you want."
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
	getResult : function(parts, moves){
		var su = parts+moves;
		if(su<=18) return 3;
		else if(su<21) return 2;
		else if(su<27) return 1;
		else return 0;
	},
	x : 900, 
	y: 60,
	required : ["bend it"],
	text : "Try to finish levels using as few instructions and\n"+
		   "as few steps as possible to get better scores and\n"+
		   "rescue more robots!\n"
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
	getResult : function(parts, moves){	
		var su = parts+moves;
		if(parts<=3) return 3;
		else if(parts<=6) return 2;
		else if(su<=parts<=9) return 1;
		else return 0;
	},
	required : ["bend it"],
	text : "Collect all the scattered parts to\n"+
		   "macgyver yourself out of this one."
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
	getResult : function(parts, moves){	
		var su = parts+moves;
		if(su<=39) return 3;
		else if(su<47) return 2;
		else if(su<60) return 1;
		else return 0;
	},
	x: 900, 
	y: 130,
	w : 145,
	required : ["resistors"],
	text : "Choose your path carefully if you want to\n"+
		   "fit all the instruction tiles on the board."
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
	getResult : function(parts, moves){  10
		var su = parts+moves;
		if(su<=10) return 3;
		else if(su<18) return 2;
		else if(su<32) return 1;
		else return 0;
	},
	x: 500, 
	y: 130,
	required : ["resistors"],
	text : "You don't have to do long, repetitive\n"+
		   "tasks manually - that's what programs\n"+
		   "are for. Just loop the instructions"
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
	getResult : function(parts, moves){
		var su = parts+moves;
		if(su<=35) return 3;
		else if(su<40) return 2;
		else if(su<50) return 1;
		else return 0;
	},
	x : 251,
	y: 123,
	required : ["out of reach"],
	text : "Go on - loop it. Loop like the wind!"
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
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(su<=31) return 3;
		else if(su<50) return 2;
		else if(su<70) return 1;
		else return 0;
	}, 
	x : 510, 
	y: 288,
	required : ["out of reach"],
	text : "Conditional instruction lets the robot do one thing\n"+
		   "in case there's a wall in front of it or another -\n"+
		   "if there's not. With it you can effectively tell the\n"+
		   "robot to \"go forward\" until you hit a wall."
	
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
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(su<=115) return 3;
		else if(su<145) return 2;
		else if(su<180) return 1;
		else return 0;
	},
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
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(su<=107) return 3;
		else if(su<120) return 2;
		else if(su<160) return 1;
		else return 0;
	},
	x : 719,
	y : 323,
	text : "ERROR exec.FunctionTask: create function:\n"+
			"java.lang.ClassNotFoundException: turing.RoboAnimator\n"+
			"at java.net.URLClassLoader$1.run(URLClassLoader.java:366)\n"+
			"... just kiddin"
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
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(su<=112) return 3;
		else if(su<130) return 2;
		else if(su<160) return 1;
		else return 0;
	},
	x : 803,
	y: 382,
	required : ["conditionals"],
	text: "Go on - eat the dots. Like the\n"+
		  "gluttonous little robo-pacman you are."
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
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(parts<=11) return 3;
		else if(parts<16) return 2;
		else if(su<23) return 1;
		else return 0;
	}, 
	text : "How would you instruct a robot to find\n"+
		   "an exit from a circular room?"
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
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(su<=53) return 3;
		else if(su<63) return 2;
		else if(su<73) return 1;
		else return 0;
	}, 
	text : "At this point you don't need\n"+
		   "tips anymore."
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
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(parts<=8) return 3;
		else if(parts<12) return 2;
		else if(parts<16) return 1;
		else return 0;
	},
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
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(parts<=15) return 3;
		else if(parts<25) return 2;
		else if(parts<30) return 1;
		else return 0;
	},
	text: "Yes, it can be done."
});