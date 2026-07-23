t.Levels.addLevel({
	name : "tunnel",
	set : function(that){
		that.resetTables([5,5],[8,8]);
		t.Selector.setDefaultOperators();
		this.setRobotTable(that);
	},
	setRobotTable : function(that){
		that.setRobot(3,0,0);
		that.set(0, 0, t.Obstacles.Obstacle, 0);
		that.set(0, 1, t.Obstacles.Obstacle, 0);
		that.set(0, 2, t.Obstacles.Obstacle, 0);
		that.set(0, 3, t.Obstacles.Obstacle, 0);
		that.set(0, 4, t.Obstacles.Obstacle, 0);
		that.set(0, 5, t.Obstacles.Obstacle, 0);
		that.set(0, 6, t.Obstacles.Obstacle, 0);
		that.set(0, 7, t.Obstacles.Obstacle, 0);
		that.set(1, 0, t.Obstacles.Obstacle, 0);
		that.set(1, 1, t.Obstacles.Corner, 2);
		that.set(1, 2, t.Obstacles.Tunnel, 0);
		that.set(1, 3, t.Obstacles.Tunnel, 0);
		that.set(1, 4, t.Obstacles.Tunnel, 0);
		that.set(1, 5, t.Obstacles.Tunnel, 0);
		that.set(1, 6, t.Obstacles.Corner, 3);
		that.set(1, 7, t.Obstacles.Obstacle, 0);
		that.set(2, 0, t.Obstacles.Obstacle, 0);
		that.set(2, 1, t.Obstacles.Corner, 1);
		that.set(2, 2, t.Obstacles.Tunnel, 0);
		that.set(2, 3, t.Obstacles.Corner, 3);
		that.set(2, 4, t.Obstacles.Obstacle, 0);
		that.set(2, 5, t.Obstacles.Corner, 2);
		that.set(2, 6, t.Obstacles.Corner, 0);
		that.set(2, 7, t.Obstacles.Obstacle, 0);
		that.set(3, 0, t.Obstacles.Tunnel, 0);
		that.set(3, 1, t.Obstacles.Corner, 3);
		that.set(3, 2, t.Obstacles.Corner, 2);
		that.set(3, 3, t.Obstacles.Corner, 0);
		that.set(3, 4, t.Obstacles.Obstacle, 0);
		that.set(3, 5, t.Obstacles.Corner, 1);
		that.set(3, 6, t.Obstacles.Tunnel, 0);
		that.set(4, 0, t.Obstacles.Corner, 2);
		that.set(4, 1, t.Obstacles.Corner, 0);
		that.set(4, 2, t.Obstacles.Corner, 1);
		that.set(4, 3, t.Obstacles.Corner, 3);
		that.set(4, 4, t.Obstacles.Obstacle, 0);
		that.set(4, 5, t.Obstacles.Corner, 2);
		that.set(4, 6, t.Obstacles.Tunnel, 0);
		that.set(4, 7, t.Obstacles.Corner, 3);
		that.set(5, 0, t.Obstacles.Tunnel, 1);
		that.set(5, 1, t.Obstacles.Corner, 2);
		that.set(5, 2, t.Obstacles.Corner, 3);
		that.set(5, 3, t.Obstacles.Corner, 1);
		that.set(5, 4, t.Obstacles.Tunnel, 0);
		that.set(5, 5, t.Obstacles.Corner, 0);
		that.set(5, 6, t.Obstacles.Obstacle, 0);
		that.set(5, 7, t.Obstacles.Tunnel, 3);
		that.set(6, 0, t.Obstacles.Tunnel, 1);
		that.set(6, 1, t.Obstacles.Tunnel, 1);
		that.set(6, 2, t.Obstacles.Corner, 1);
		that.set(6, 3, t.Obstacles.Tunnel, 2);
		that.set(6, 4, t.Obstacles.Tunnel, 2);
		that.set(6, 5, t.Obstacles.Corner, 3);
		that.set(6, 6, t.Obstacles.Obstacle, 0);
		that.set(6, 7, t.Obstacles.Tunnel, 3);
		that.set(7, 0, t.Obstacles.Corner, 1);
		that.set(7, 1, t.Obstacles.Corner, 0);
		that.set(7, 2, t.Obstacles.Obstacle, 0);
		that.set(7, 3, t.Obstacles.Obstacle, 0);
		that.set(7, 4, t.Obstacles.Obstacle, 0);
		that.set(7, 5, t.Obstacles.Corner, 1);
		that.set(7, 6, t.Obstacles.Tunnel, 2);
		that.set(7, 7, t.Obstacles.Corner, 0);
		that.set(3, 7, t.Obstacles.End, 0);
	},
	x : 778,
	y: 206,
	text: "Just a single route - how hard\n"+
		  "could it be?",
	required : ["way out"],
	getResult : function(parts, moves){ 	
		if(parts<=9) return 3;
		else if(parts<13) return 2;
		else if(parts<20) return 1;
		else return 0;
	}
});


t.Levels.addLevel({
	name : "labirynth",
	set: function(that){
		that.resetTables([6,6],[9,9]);
		t.Selector.setDefaultOperators();
		this.setRobotTable(that);
	},
	setRobotTable : function(that){
		t.RobotTable.dotsRemaining = 8;
		that.set(0, 0, t.Obstacles.DeadEnd, 1, true);
		that.set(0, 1, t.Obstacles.Wall, 2);
		that.set(0, 2, t.Obstacles.Tunnel, 2);
		that.set(0, 3, t.Obstacles.Tunnel, 2);
		that.set(0, 4, t.Obstacles.Corner, 3);
		that.set(0, 5, t.Obstacles.DeadEnd, 1);
		that.set(0, 6, t.Obstacles.Wall, 2);
		that.set(0, 7, t.Obstacles.Wall, 2);
		that.set(0, 8, t.Obstacles.DeadEnd, 3);
		that.set(1, 0, t.Obstacles.DeadEnd, 2);
		that.set(1, 1, t.Obstacles.Wall, 1);
		that.set(1, 2, t.Obstacles.Tunnel, 0);
		that.set(1, 3, t.Obstacles.Corner, 3);
		that.set(1, 4, t.Obstacles.Corner, 1, true);
		that.set(1, 5, t.Obstacles.Tunnel, 2);
		that.set(1, 6, t.Obstacles.Corner, 0);
		that.set(1, 7, t.Obstacles.Tunnel, 3);
		that.set(1, 8, t.Obstacles.DeadEnd, 2, true);
		that.set(2, 0, t.Obstacles.Tunnel, 3);
		that.set(2, 1, t.Obstacles.Corner, 1);
		that.set(2, 2, t.Obstacles.Corner, 3);
		that.set(2, 3, t.Obstacles.Tunnel, 1);
		that.set(2, 4, t.Obstacles.Corner, 2);
		that.set(2, 5, t.Obstacles.Corner, 3);
		that.set(2, 6, t.Obstacles.Corner, 2);
		that.set(2, 7, t.Obstacles.Corner, 0);
		that.set(2, 8, t.Obstacles.Tunnel, 1);
		that.set(3, 0, t.Obstacles.Wall, 1);
		that.set(3, 1, t.Obstacles.Tunnel, 0, true);
		that.set(3, 2, t.Obstacles.Corner, 0);
		that.set(3, 3, t.Obstacles.Tunnel, 1);
		that.set(3, 4, t.Obstacles.Tunnel, 1);
		that.set(3, 5, t.Obstacles.Tunnel, 1);
		that.set(3, 6, t.Obstacles.Wall, 1);
		that.set(3, 7, t.Obstacles.Tunnel, 0);
		that.set(3, 8, t.Obstacles.Corner, 0);
		that.set(4, 0, t.Obstacles.Corner, 1);
		that.set(4, 1, t.Obstacles.Tunnel, 0);
		that.set(4, 2, t.Obstacles.Wall, 2);
		that.set(4, 3, t.Obstacles.Wall, 0);
		that.set(4, 4, t.Obstacles.Corner, 0);
		that.set(4, 5, t.Obstacles.Wall, 1);
		that.set(4, 6, t.Obstacles.Corner, 0);
		that.set(4, 7, t.Obstacles.DeadEnd, 1, true);
		that.set(4, 8, t.Obstacles.Corner, 3);
		that.set(5, 0, t.Obstacles.Corner, 2);
		that.set(5, 1, t.Obstacles.Tunnel, 0);
		that.set(5, 2, t.Obstacles.Wall, 0);
		that.set(5, 3, t.Obstacles.Corner, 3);
		that.set(5, 4, t.Obstacles.Corner, 2);
		that.set(5, 5, t.Obstacles.Empty, 0);
		that.set(5, 6, t.Obstacles.DeadEnd, 3, true);
		that.set(5, 7, t.Obstacles.Corner, 2);
		that.set(5, 8, t.Obstacles.Wall, 3);
		that.set(6, 0, t.Obstacles.Tunnel, 3);
		that.set(6, 1, t.Obstacles.Corner, 2);
		that.set(6, 2, t.Obstacles.Tunnel, 2);
		that.set(6, 3, t.Obstacles.Wall, 3);
		that.set(6, 4, t.Obstacles.Tunnel, 1);
		that.set(6, 5, t.Obstacles.Corner, 1);
		that.set(6, 6, t.Obstacles.Tunnel, 2);
		that.set(6, 7, t.Obstacles.Wall, 3);
		that.set(6, 8, t.Obstacles.Tunnel, 1);
		that.set(7, 0, t.Obstacles.Tunnel, 3);
		that.set(7, 1, t.Obstacles.Tunnel, 1);
		that.set(7, 2, t.Obstacles.DeadEnd, 1);
		that.set(7, 3, t.Obstacles.Wall, 0);
		that.set(7, 4, t.Obstacles.Corner, 0);
		that.set(7, 5, t.Obstacles.Corner, 2);
		that.set(7, 6, t.Obstacles.Tunnel, 2);
		that.set(7, 7, t.Obstacles.Corner, 0);
		that.set(7, 8, t.Obstacles.Tunnel, 1);
		that.set(8, 0, t.Obstacles.DeadEnd, 0);
		that.set(8, 1, t.Obstacles.Corner, 1);
		that.set(8, 2, t.Obstacles.Tunnel, 2, true);
		that.set(8, 3, t.Obstacles.Tunnel, 2);
		that.set(8, 4, t.Obstacles.Tunnel, 2);
		that.set(8, 5, t.Obstacles.Wall, 0);
		that.set(8, 6, t.Obstacles.DeadEnd, 3);
		that.set(8, 7, t.Obstacles.DeadEnd, 1);
		that.set(8, 8, t.Obstacles.Corner, 0, true);
		that.setRobot(5,0,0);
	},
	x: 900,
	y : 254,
	text: "How sweet would it be to have the digging wand\n"+
	      "from ADOM right now? Come to think of it - \n"+
		  "- being able to program your ADOM character\n"+
		  "would be even better.",
	required : ["tunnel"],
	getResult : function(parts, moves){ 	
		if(parts<=12) return 3;
		else if(parts<17) return 2;
		else if(parts<22) return 1;
		else return 0;
	}
});

t.Levels.u.setTable1 = function(that){
	that.set(0, 0, t.Obstacles.Obstacle);
	that.set(0, 1, t.Obstacles.Obstacle);
	that.set(0, 2, t.Obstacles.Obstacle);
	that.set(1, 2, t.Obstacles.Obstacle);
	that.set(2, 2, t.Obstacles.Obstacle);
	that.set(2, 1, t.Obstacles.Obstacle);
	that.set(2, 0, t.Obstacles.Obstacle);
	that.set(1, 1, t.Obstacles.TrappedChest);
	that.setRobot(1,0,0);
}
t.Levels.addLevel({
	name : "++",
	set : function(that){
		that.resetTables([8,8],[3,3]);
		t.Selector.setStepAndMove();
		t.Levels.showColors(["Red"]);
		this.setRobotTable(that);
	},
	setRobotTable: function(that){
		that.setRobot(1,0,0);
		t.Levels.u.setTable1(that);
		t.RobotTable.setCounter("Red", 0);
		t.RobotTable.setCounterLabel("Red", "0");
	},
	beforePlayInit: function(){
		t.RobotTable.setCounterLabels(["Red"], [0]);
	},
	onCounterUpdated : function(color, diff, step){
		if(t.RobotTable.counters["Red"]===5) {
			var old = t.RobotTable.table[1][1];
			var newCon = {what: t.Obstacles.End, angle: 0};
			t.RobotTable.swapTile(1,1,old, newCon );
			step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon}; 
		} else {
			if(t.RobotTable.counters["Red"]-diff=="5"){
				var old = t.RobotTable.table[1][1];
				var newCon = {what: t.Obstacles.TrappedChest, angle: 0};
				t.RobotTable.swapTile(1,1,old, newCon );
				step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon};
			}
		}
	},
	x : 307,
	y: 328,
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(parts<=6) return 3;
		else if(parts<8) return 2;
		else if(parts<10) return 1;
		else return 0;
	}, 
	required : ["conditionals"],
	text : "To disarm the trap, set the red cipher lock to 5\n"+
		   "using the Plus One instruction. Once the lock\n"+
		   "is set, the trap will turn off and you will be \n"+
		   "able to move to the escape hatch"  
});

t.Levels.addLevel({
	name : "--",
	set : function(that){
		that.resetTables([8,8],[3,3]);
		t.Selector.setStepAndMove();
		t.Levels.showColors(["Red"]);
		this.setRobotTable(that);
	},
	current : 0, 
	alternatives : [5,2,1,15],
	setRobotTable : function(that){
		that.setRobot(1,0,0);
		t.Levels.u.setTable1(that);
		t.RobotTable.setCounter("Red", this.alternatives[this.current]);
		t.RobotTable.setCounterLabel("Red", "X");
	},
	beforePlayInit : function(){
		t.RobotTable.setCounterLabel("Red", this.alternatives[this.current]);
	},
	onCounterUpdated : function(color, diff, step){
		if(t.RobotTable.counters["Red"]===0) {
			var old = t.RobotTable.table[1][1];
			var newCon = {what: t.Obstacles.End, angle: 0};
			t.RobotTable.swapTile(1,1,old, newCon );
			step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon}; 
		} else {
			if(t.RobotTable.counters["Red"]-diff==0){
				var old = t.RobotTable.table[1][1];
				var newCon = {what: t.Obstacles.TrappedChest, angle: 0};
				t.RobotTable.swapTile(1,1,old, newCon );
				step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon};
			}
		}
	},
	x : 274,
	y: 395,
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(parts<=3) return 3;
		else if(parts<6) return 2;
		else if(parts<9) return 1;
		else return 0;
	},
	required : ["++"],
	text : "Red=0 clears the way. You must set the lock\n"+
		   "to 0, no matter what number it shows at the\n"+
		   "beginning."
});

t.Levels.addLevel({
	name : ":=",
	set : function(that){
		that.resetTables([8,8],[3,3]);
		t.Selector.setStepAndMove();
		t.Levels.showColors(["Red", "Blue"]);
		this.setRobotTable(that);
	},
	current : 0, 
	alternatives : [10,4,6,2,15],
	setRobotTable : function(that){
		that.setRobot(1,0,0);
		t.Levels.u.setTable1(that);
		t.RobotTable.setCounter("Red", this.alternatives[this.current]);
		t.RobotTable.setCounterLabel("Red", "X");
		t.RobotTable.setCounter("Blue", 0);
		t.RobotTable.setCounterLabel("Blue", 0);
	},
	beforePlayInit : function(){
		t.RobotTable.setCounterLabel("Red", this.alternatives[this.current]);
	},
	onCounterUpdated : function(color, diff, step){
		if(t.RobotTable.counters["Blue"]===this.alternatives[this.current]) {
			var old = t.RobotTable.table[1][1];
			var newCon = {what: t.Obstacles.End, angle: 0};
			t.RobotTable.swapTile(1,1,old, newCon );
			step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon}; 
		} else {
			if(t.RobotTable.counters["Blue"]-diff===this.alternatives[this.current]){
				var old = t.RobotTable.table[1][1];
				var newCon = {what: t.Obstacles.TrappedChest, angle: 0};
				t.RobotTable.swapTile(1,1,old, newCon );
				step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon};
			}
		}
	},
	x: 132,
	y: 365,
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(parts<=3) return 3;
		else if(parts<6) return 2;
		else if(parts<9) return 1;
		else return 0;
	},
	required : ["--"],
	text : "Blue := Red. I.e. set the blue lock to\n"+
		   "whatever number the red one comes with.\n"+
		   "Feel free to modify the red lock's number."
});



t.Levels.addLevel({
	name : "*2",
	set : function(that){
		that.resetTables([8,8],[3,3]);
		t.Levels.u.setTable1(that);
		t.Selector.setStepAndMove();
		t.Levels.showColors(["Red", "Blue"]);
		this.setRobotTable(that);
	},
	alternatives : [3,5,7,10],
	current : 0,
	setRobotTable : function(that){
		that.setRobot(1,0,0);
		t.Levels.u.setTable1(that);
		t.RobotTable.setCounter("Red", this.alternatives[this.current]);
		t.RobotTable.setCounterLabel("Red", "X");
		t.RobotTable.setCounter("Blue", 0);
		t.RobotTable.setCounterLabel("Blue", 0);
	},
	beforePlayInit : function(){
		t.RobotTable.setCounterLabel("Red", this.alternatives[this.current]);
	},
	onCounterUpdated : function(color, diff, step){
		if(t.RobotTable.counters["Blue"]===2*this.alternatives[this.current]) {
			var old = t.RobotTable.table[1][1];
			var newCon = {what: t.Obstacles.End, angle: 0};
			t.RobotTable.swapTile(1,1,old, newCon );
			step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon}; 
		} else {
			if(t.RobotTable.counters["Blue"]-diff===2*this.alternatives[this.current]){
				var old = t.RobotTable.table[1][1];
				var newCon = {what: t.Obstacles.TrappedChest, angle: 0};
				t.RobotTable.swapTile(1,1,old, newCon );
				step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon};
			}
		}
	},
	x: 427,
	y: 406,
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(parts<=5) return 3;
		else if(parts<8) return 2;
		else if(parts<10) return 1;
		else return 0;
	},
	required : ["--"],
	text : "Blue = Red*2. Set the blue to twice the\n"+
	       "number on the red one."
});

t.Levels.addLevel({
	name : "+",
	set : function(that){
		that.resetTables([8,8],[3,3]);
		t.Selector.setStepAndMove();
		t.Levels.showColors(["Red", "Blue", "Yellow"]);
		this.setRobotTable(that);
	},
	current : 0,
	alternatives : [[4, 2], [3,3], [1, 4], [5,0], [7,2]],
	beforePlayInit : function(){
		t.RobotTable.setCounterLabel("Red", this.alternatives[this.current][0]);
		t.RobotTable.setCounterLabel("Blue", this.alternatives[this.current][1]);	
	},
	setRobotTable : function(that){
		that.setRobot(1,0,0);
		t.Levels.u.setTable1(that);
		t.RobotTable.setCounter("Red", this.alternatives[this.current][0]);
		t.RobotTable.setCounterLabel("Red", "X");
		t.RobotTable.setCounter("Blue", this.alternatives[this.current][1]);
		t.RobotTable.setCounterLabel("Blue", "X");
		t.RobotTable.setCounter("Yellow", 0);
		t.RobotTable.setCounterLabel("Yellow", 0);
	},
	onCounterUpdated : function(color, diff, step){
		if(t.RobotTable.counters["Yellow"]===this.alternatives[this.current][0]+this.alternatives[this.current][1]) {
			var old = t.RobotTable.table[1][1];
			var newCon = {what: t.Obstacles.End, angle: 0};
			t.RobotTable.swapTile(1,1,old, newCon );
			step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon}; 
		} else {
			if(t.RobotTable.counters["Yellow"]-diff===this.alternatives[this.current][0]+this.alternatives[this.current][1]){
				var old = t.RobotTable.table[1][1];
				var newCon = {what: t.Obstacles.TrappedChest, angle: 0};
				t.RobotTable.swapTile(1,1,old, newCon );
				step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon};
			}
		}
	},
	x : 290, 
	y: 460,
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(parts<=6) return 3;
		else if(parts<10) return 2;
		else if(parts<14) return 1;
		else return 0;
	},
	required : ["--"],
	text : "Yellow := Red + Blue"
});

t.Levels.addLevel({
	name : "*",
	set : function(that){
		that.resetTables([8,8],[3,3]);
		t.Selector.setStepAndMove();
		t.Levels.showColors(["Red", "Blue", "Yellow", "Pink"]);
		this.setRobotTable(that);
	},
	current : 0,
	alternatives : [[4, 2], [3,3], [1, 4], [5,3], [7,2]],
	beforePlayInit : function(){
		t.RobotTable.setCounterLabel("Red", this.alternatives[this.current][0]);
		t.RobotTable.setCounterLabel("Blue", this.alternatives[this.current][1]);	
	},
	setRobotTable : function(that){
		that.setRobot(1,0,0);
		t.Levels.u.setTable1(that);
		t.RobotTable.setCounter("Red", this.alternatives[this.current][0]);
		t.RobotTable.setCounterLabel("Red", "X");
		t.RobotTable.setCounter("Blue", this.alternatives[this.current][1]);
		t.RobotTable.setCounterLabel("Blue", "X");
		t.RobotTable.setCounter("Yellow", 0);
		t.RobotTable.setCounterLabel("Yellow", 0);
		t.RobotTable.setCounter("Pink", 0);
		t.RobotTable.setCounterLabel("Pink", 0);
	},
	onCounterUpdated : function(color, diff, step){
		if(t.RobotTable.counters["Yellow"]===this.alternatives[this.current][0]*this.alternatives[this.current][1]) {
			var old = t.RobotTable.table[1][1];
			var newCon = {what: t.Obstacles.End, angle: 0};
			t.RobotTable.swapTile(1,1,old, newCon );
			step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon}; 
		} else {
			if(t.RobotTable.counters["Yellow"]-diff===this.alternatives[this.current][0]*this.alternatives[this.current][1]){
				var old = t.RobotTable.table[1][1];
				var newCon = {what: t.Obstacles.TrappedChest, angle: 0};
				t.RobotTable.swapTile(1,1,old, newCon );
				step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon};
			}
		}
	},
	x : 255,
	y: 550,
	turingX : 250,
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(parts<=8) return 3;
		else if(parts<12) return 2;
		else if(parts<20) return 1;
		else return 0;
	},
	required : ["+"],
	text : "Yellow = Red * Blue"
});

t.Levels.addLevel({
	name : "/2",
	set : function(that){
		that.resetTables([8,8],[3,3]);
		t.Selector.setStepAndMove();
		t.Levels.showColors(["Red", "Blue"]);
		this.setRobotTable(that);
	},
	alternatives : [6,4,10,14],
	current : 0,
	setRobotTable : function(that){
		that.setRobot(1,0,0);
		t.Levels.u.setTable1(that);
		t.RobotTable.setCounter("Red", this.alternatives[this.current]);
		t.RobotTable.setCounterLabel("Red", "X");
		t.RobotTable.setCounter("Blue", 0);
		t.RobotTable.setCounterLabel("Blue", 0);
	},
	beforePlayInit : function(){
		t.RobotTable.setCounterLabel("Red", this.alternatives[this.current]);
	},
	onCounterUpdated : function(color, diff, step){
		if(t.RobotTable.counters["Blue"]===this.alternatives[this.current]/2) {
			var old = t.RobotTable.table[1][1];
			var newCon = {what: t.Obstacles.End, angle: 0};
			t.RobotTable.swapTile(1,1,old, newCon );
			step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon}; 
		} else {
			if(t.RobotTable.counters["Blue"]-diff===this.alternatives[this.current]/2){
				var old = t.RobotTable.table[1][1];
				var newCon = {what: t.Obstacles.TrappedChest, angle: 0};
				t.RobotTable.swapTile(1,1,old, newCon );
				step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon};
			}
		}
	},
	x : 128,
	y : 436, 
	
	getResult : function(parts, moves){ 	
		var su = parts+moves;
		if(parts<=5) return 3;
		else if(parts<10) return 2;
		else if(parts<14) return 1;
		else return 0;
	}, 
	required : ["--"],
	text : "Blue := Red / 2" 
});


t.Levels.u.factorial = function(n){
	if(n>1) return t.Levels.u.factorial(n-1)*n;
	else return 1;
}
t.Levels.addLevel({
	name : "!",
	set : function(that){
		that.resetTables([8,8],[3,3]);
		t.Selector.setStepAndMove();
		t.Levels.showColors(["Red", "Blue", "Yellow", "Pink"]);
		this.setRobotTable(that);
	},
	current : 0,
	alternatives : [[4, 24], [3, 6], [2,2], [1,1], [5,120]],
	beforePlayInit : function(){
		t.RobotTable.setCounterLabel("Red", this.alternatives[this.current][0]);
	},
	setRobotTable : function(that){
		that.setRobot(1,0,0);
		t.Levels.u.setTable1(that);
		t.RobotTable.setCounter("Red", this.alternatives[this.current][0]);
		t.RobotTable.setCounterLabel("Red", "X");
		t.RobotTable.setCounter("Blue", 0);
		t.RobotTable.setCounterLabel("Blue", 0);
		t.RobotTable.setCounter("Yellow", 0);
		t.RobotTable.setCounterLabel("Yellow", 0);
		t.RobotTable.setCounter("Pink", 0);
		t.RobotTable.setCounterLabel("Pink", 0);
	},
	onCounterUpdated : function(color, diff, step){
		if(t.RobotTable.counters["Blue"]===this.alternatives[this.current][1]) {
			var old = t.RobotTable.table[1][1];
			var newCon = {what: t.Obstacles.End, angle: 0};
			t.RobotTable.swapTile(1,1,old, newCon );
			step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon}; 
		} else {
			if(t.RobotTable.counters["Blue"]-diff===this.alternatives[this.current][1]){
				var old = t.RobotTable.table[1][1];
				var newCon = {what: t.Obstacles.TrappedChest, angle: 0};
				t.RobotTable.swapTile(1,1,old, newCon );
				step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon};
			}
		}
	},
	x : 400,
	y: 628,
	getResult : function(parts, moves){ 		
		var su = parts+moves;			//TODO lepsze liczby
		return 3;
	},
	required : ["*"],
	text : "Blue := Red!   (factorial)"
});

t.Levels.u.gcd = function(a,b){
	if(!(a>0)) return undefined;
	else if(!(b>0)) return undefined;
	var pom = function(x,y){
		if(x>y) return pom(x-y,y);
		else if(y>x) return pom(y-x,x);
		else return x;
	}
	return pom(a,b);
}

t.Levels.addLevel({
	name : "Euclid",
	set : function(that){
		that.resetTables([8,8],[3,3]);
		t.Selector.setStepAndMove();
		t.Levels.showColors(["Red", "Blue", "Yellow"]);
		this.setRobotTable(that);
	},
	current : 0,
	alternatives : [[4, 12, 4], [12, 9, 3], [20, 15, 5], [7, 10, 1], [6, 4, 2]],
	beforePlayInit : function(){
		t.RobotTable.setCounterLabel("Red", this.alternatives[this.current][0]);
		t.RobotTable.setCounterLabel("Blue", this.alternatives[this.current][1]);
	},
	setRobotTable : function(that){
		that.setRobot(1,0,0);
		t.Levels.u.setTable1(that);
		t.RobotTable.setCounter("Red", this.alternatives[this.current][0]);
		t.RobotTable.setCounterLabel("Red", "X");
		t.RobotTable.setCounter("Blue", this.alternatives[this.current][1]);
		t.RobotTable.setCounterLabel("Blue", "X");
		t.RobotTable.setCounter("Yellow", 0);
		t.RobotTable.setCounterLabel("Yellow", 0);
	},
	onCounterUpdated : function(color, diff, step){
		if(t.RobotTable.counters["Yellow"]===this.alternatives[this.current][2]) {
			var old = t.RobotTable.table[1][1];
			var newCon = {what: t.Obstacles.End, angle: 0};
			t.RobotTable.swapTile(1,1,old, newCon );
			step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon}; 
		} else {
			if(t.RobotTable.counters["Yellow"]-diff===this.alternatives[this.current][2]){
				var old = t.RobotTable.table[1][1];
				var newCon = {what: t.Obstacles.TrappedChest, angle: 0};
				t.RobotTable.swapTile(1,1,old, newCon );
				step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon};
			}
		}
	},
	x : 113, 
	y: 527,
	getResult : function(parts, moves){ 		
		var su = parts+moves;			
		if(parts<=13) return 3;
		else if(parts<20) return 2;
		else if(parts<30) return 1;
		else return 0;
	},
	required : ["+"],
	text : "Yellow := gcd(Blue, Red)  (greatest common divisor)"
});

t.Levels.addLevel({
	name : "/",
	set : function(that){
		that.resetTables([8,8],[3,3]);
		t.Levels.u.setTable1(that);
		t.Selector.setStepAndMove();
		t.Levels.showColors(["Red", "Blue", "Yellow", "Pink"]);
		this.setRobotTable(that);
	},
	current : 0,
	alternatives : [[24, 4, 6], [6,3, 2], [5,5,1], [15, 5, 3], [9, 3, 3]],
	beforePlayInit : function(){
		t.RobotTable.setCounterLabel("Red", this.alternatives[this.current][0]);
		t.RobotTable.setCounterLabel("Blue", this.alternatives[this.current][1]);
	},
	setRobotTable : function(that){
		that.setRobot(1,0,0);
		t.RobotTable.setTile(1,1,{what : t.Obstacles.TrappedChest, angle: 0});
		t.RobotTable.setCounter("Red", this.alternatives[this.current][0]);
		t.RobotTable.setCounterLabel("Red", "X");
		t.RobotTable.setCounter("Blue", this.alternatives[this.current][1]);
		t.RobotTable.setCounterLabel("Blue", "X");
		t.RobotTable.setCounter("Yellow", 0);
		t.RobotTable.setCounterLabel("Yellow", 0);
		t.RobotTable.setCounter("Pink", 0);
		t.RobotTable.setCounterLabel("Pink", 0);
	},
	onCounterUpdated : function(color, diff, step){
		if(t.RobotTable.counters["Yellow"]===this.alternatives[this.current][2]) {
			var old = t.RobotTable.table[1][1];
			var newCon = {what: t.Obstacles.End, angle: 0};
			t.RobotTable.swapTile(1,1,old, newCon );
			step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon}; 
		} else {
			if(t.RobotTable.counters["Yellow"]-diff===this.alternatives[this.current][2]){
				var old = t.RobotTable.table[1][1];
				var newCon = {what: t.Obstacles.TrappedChest, angle: 0};
				t.RobotTable.swapTile(1,1,old, newCon );
				step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon};
			}
		}
	},
	text : "Yellow := Red/Blue",
	x:  400,
	y: 567,
	required : ["*"],
	getResult : function(parts, moves){ 		
		var su = parts+moves;			
		if(su<=181) return 3;
		else if(su<200) return 2;
		else if(parts<230) return 1;
		else return 0;
	}
});

t.Levels.u.fibo = function(n){
	var memo = {};
	memo[0] = 0;
	memo[1] = 1;
	var fib = function(i){
		if(memo.hasOwnProperty(i)) return memo[i];
		var ret = fib(i-1) + fib(i-2);
		memo[i] = ret;
		return ret;
	}
	return fib;
}();
t.Levels.addLevel({
	name : "Fibonacci",
	set : function(that){
		that.resetTables([8,8],[3,3]);
		t.Levels.u.setTable1(that);
		t.Selector.setStepAndMove();
		t.Levels.showColors(["Red", "Blue", "Yellow", "Pink"]);
		this.setRobotTable(that);
	},
	current : 0,
	alternatives : [[7, t.Levels.u.fibo(7)], [3, t.Levels.u.fibo(3)], [4, t.Levels.u.fibo(4)], [5, t.Levels.u.fibo(5)], [6, t.Levels.u.fibo(6)]],
	beforePlayInit : function(){
		t.RobotTable.setCounterLabel("Red", this.alternatives[this.current][0]);
	},
	setRobotTable : function(that){
		that.setRobot(1,0,0);
		t.RobotTable.setTile(1,1,{what : t.Obstacles.TrappedChest, angle: 0});
		t.RobotTable.setCounter("Red", this.alternatives[this.current][0]);
		t.RobotTable.setCounterLabel("Red", "X");
		t.RobotTable.setCounter("Blue", 0);
		t.RobotTable.setCounterLabel("Blue", 0);
		t.RobotTable.setCounter("Yellow", 0);
		t.RobotTable.setCounterLabel("Yellow", 0);
		t.RobotTable.setCounter("Pink", 0);
		t.RobotTable.setCounterLabel("Pink", 0);
	},
	onCounterUpdated : function(color, diff, step){
		if(t.RobotTable.counters["Blue"]===this.alternatives[this.current][1]) {
			var old = t.RobotTable.table[1][1];
			var newCon = {what: t.Obstacles.End, angle: 0};
			t.RobotTable.swapTile(1,1,old, newCon );
			step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon}; 
		} else {
			if(t.RobotTable.counters["Blue"]-diff===this.alternatives[this.current][1]){
				var old = t.RobotTable.table[1][1];
				var newCon = {what: t.Obstacles.TrappedChest, angle: 0};
				t.RobotTable.swapTile(1,1,old, newCon );
				step.swapTile = {"x":1, "y":1, "oldContent" : old, "newContent": newCon};
			}
		}
	},
	x : 443, 
	y: 500,
	text : "First Fibonacci number is 1, second - also 1. Every\n"+
		   "following Fibonacci number is the sum of the previous\n"+
		   "two. The sequence goes 1, 1, 2, 3, 5, 8, 13, 21,... \n"+
		   "Take Red as n and output n-th Fibonacci number on Blue", 
	texty : 10,
	required : ["+"],
	getResult : function(parts, moves){ 		
		var su = parts+moves;			
		if(parts<=11) return 3;
		else if(parts<15) return 2;
		else if(parts<20) return 1;
		else return 0;
	}
});

t.Levels.u.randInt = function(n){
	var x = Math.random();
	x *= n;
	for(var i=0; i<n; i++){
		if(x<=i+1) return i;
	}
}
t.Levels.addLevel({
	name : "Counting steps",
	set : function(that){
		that.resetTables([4,4],[11,11]);
		t.Selector.setDefaultOperators();
		t.Levels.showColors(["Red"]);
		//t.RobotTable.resetCountersAndStuff = function(){
		//	this.setCounter("Red", 0);
		//}
		
		for(var x=1; x<9; x++)
			for(var y=0; y<10; y++)
				that.set(x,y,t.Obstacles.Lava,t.Levels.u.randInt(4));
		for(var y=0; y<11; y++)
			that.set(10,y,t.Obstacles.Lava,t.Levels.u.randInt(4));
		this.setRobotTable(that);
	},
	setRobotTable : function(that){
		that.setRobot(0,0,0);
		that.set(9,0,t.Obstacles.End);
		t.RobotTable.setCounter("Red", 0);
		t.RobotTable.setCounterLabel("Red", 0);
	},
	robotTableX : 670,
	x : 253,
	y: 627,
	w: 140,
	text : "What it says on the tin",
	required : ["*"],
	getResult : function(parts, moves){
		var su = parts+moves;
		if(parts<11) return 3;
		else if(parts<15) return 2;
		else if(su<20) return 1;
		else return 0;
	}
});