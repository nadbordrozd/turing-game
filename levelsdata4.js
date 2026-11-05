t.Levels.addLevel({
	name : "giftwrapped",
	set : function(that){
		t.Selector.setDefaultOperators();
		t.Selector.addMagic();
		that.resetTables([5,5],[9,9]);
		this.setRobotTable(that);
	},
	setRobotTable: function(that){
		that.setRobot(2,1,1);
		t.RobotTable.dotsRemaining = 12;
		that.set(0, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 1, t.Obstacles.Dif, 0, true);
		that.set(1, 2, t.Obstacles.Empty, 0);
		that.set(1, 3, t.Obstacles.Empty, 0);
		that.set(1, 4, t.Obstacles.Dif, 0, true);
		that.set(1, 5, t.Obstacles.Empty, 0);
		that.set(1, 6, t.Obstacles.Empty, 0);
		that.set(1, 7, t.Obstacles.Dif, 0, true);
		that.set(1, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 1, t.Obstacles.Empty, 0);
		that.set(2, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 4, t.Obstacles.Empty, 0);
		that.set(2, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 7, t.Obstacles.Empty, 0);
		that.set(2, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 1, t.Obstacles.Empty, 0);
		that.set(3, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 4, t.Obstacles.Empty, 0, true);
		that.set(3, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 7, t.Obstacles.Empty, 0);
		that.set(3, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 1, t.Obstacles.Dif, 0, true);
		that.set(4, 2, t.Obstacles.Empty, 0);
		that.set(4, 3, t.Obstacles.Empty, 0, true);
		that.set(4, 4, t.Obstacles.Obstacle, 0);
		that.set(4, 5, t.Obstacles.Empty, 0, true);
		that.set(4, 6, t.Obstacles.Empty, 0);
		that.set(4, 7, t.Obstacles.Dif, 0, true);
		that.set(4, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 1, t.Obstacles.Empty, 0);
		that.set(5, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 4, t.Obstacles.Empty, 0, true);
		that.set(5, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 7, t.Obstacles.Empty, 0);
		that.set(5, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 1, t.Obstacles.Empty, 0);
		that.set(6, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 4, t.Obstacles.Empty, 0);
		that.set(6, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 7, t.Obstacles.Empty, 0);
		that.set(6, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 1, t.Obstacles.Dif, 0, true);
		that.set(7, 2, t.Obstacles.Empty, 0);
		that.set(7, 3, t.Obstacles.Empty, 0);
		that.set(7, 4, t.Obstacles.Dif, 0, true);
		that.set(7, 5, t.Obstacles.Empty, 0);
		that.set(7, 6, t.Obstacles.Empty, 0);
		that.set(7, 7, t.Obstacles.Dif, 0, true);
		that.set(7, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));		
	},
	x: 877,
	y : 483,
	text : "Another simple one",
	required : ["detector"],
	times : [95, 130, 205] // calibrated: best found B = 90 steps (docs/levels/CALIBRATION.md)
});

t.Levels.addLevel({
	name : "x",
	set : function(that){		
		t.Selector.setBasicOperators();
		t.Selector.addMagic();
		that.resetTables([4,4],[7,7]);
		this.setRobotTable(that);
	},
	setRobotTable: function(that){
		that.setRobot(3,3,0);
		t.RobotTable.dotsRemaining = 20;
		that.set(0, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 1, t.Obstacles.Empty, 0, true);
		that.set(1, 2, t.Obstacles.Empty, 0, true);
		that.set(1, 3, t.Obstacles.Empty, 0, true);
		that.set(1, 4, t.Obstacles.Empty, 0, true);
		that.set(1, 5, t.Obstacles.Empty, 0, true);
		that.set(1, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 1, t.Obstacles.Empty, 0, true);
		that.set(2, 2, t.Obstacles.Dif, 0);
		that.set(2, 3, t.Obstacles.Empty, 0, true);
		that.set(2, 4, t.Obstacles.Dif, 0);
		that.set(2, 5, t.Obstacles.Empty, 0, true);
		that.set(2, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 1, t.Obstacles.Empty, 0, true);
		that.set(3, 2, t.Obstacles.Empty, 0, true);
		that.set(3, 3, t.Obstacles.Dif, 0);
		that.set(3, 4, t.Obstacles.Empty, 0, true);
		that.set(3, 5, t.Obstacles.Empty, 0, true);
		that.set(3, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 1, t.Obstacles.Empty, 0, true);
		that.set(4, 2, t.Obstacles.Dif, 0);
		that.set(4, 3, t.Obstacles.Empty, 0, true);
		that.set(4, 4, t.Obstacles.Dif, 0);
		that.set(4, 5, t.Obstacles.Empty, 0, true);
		that.set(4, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 1, t.Obstacles.Empty, 0, true);
		that.set(5, 2, t.Obstacles.Empty, 0, true);
		that.set(5, 3, t.Obstacles.Empty, 0, true);
		that.set(5, 4, t.Obstacles.Empty, 0, true);
		that.set(5, 5, t.Obstacles.Empty, 0, true);
		that.set(5, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
	},
	x : 882,
	y: 533,
	text : "X marks the spot.",
	required : ["detector"],
	times : [65, 85, 135] // calibrated: best found B = 58 steps (docs/levels/CALIBRATION.md)
});




t.Levels.addLevel({
	name : "no turn sign",
	set : function(that){
		t.Selector.setBasicOperators();
		t.Selector.addMagic();
		that.resetTables([4,4],[7,7]);
		this.setRobotTable(that);
	},
	setRobotTable: function(that){
		that.setRobot(0,0,0);
		t.RobotTable.dotsRemaining = 6;
		that.set(0, 0, t.Obstacles.Empty, 0);
		that.set(0, 1, t.Obstacles.Empty, 0);
		that.set(0, 2, t.Obstacles.Empty, 0, true);
		that.set(0, 3, t.Obstacles.Empty, 0);
		that.set(0, 4, t.Obstacles.Empty, 0);
		that.set(0, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 6, t.Obstacles.Empty, 0);
		that.set(1, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 1, t.Obstacles.Empty, 0);
		that.set(1, 2, t.Obstacles.Empty, 0);
		that.set(1, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 4, t.Obstacles.Empty, 0);
		that.set(1, 5, t.Obstacles.Empty, 0);
		that.set(1, 6, t.Obstacles.Dif, 0);
		that.set(2, 0, t.Obstacles.Empty, 0, true);
		that.set(2, 1, t.Obstacles.Empty, 0);
		that.set(2, 2, t.Obstacles.Dif, 0);
		that.set(2, 3, t.Obstacles.Dif, 0);
		that.set(2, 4, t.Obstacles.Empty, 0, true);
		that.set(2, 5, t.Obstacles.Empty, 0);
		that.set(2, 6, t.Obstacles.Empty, 0);
		that.set(3, 0, t.Obstacles.Dif, 0);
		that.set(3, 1, t.Obstacles.Empty, 0);
		that.set(3, 2, t.Obstacles.Empty, 0, true);
		that.set(3, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 4, t.Obstacles.Empty, 0);
		that.set(3, 5, t.Obstacles.Empty, 0);
		that.set(3, 6, t.Obstacles.Empty, 0);
		that.set(4, 0, t.Obstacles.Empty, 0);
		that.set(4, 1, t.Obstacles.Empty, 0, true);
		that.set(4, 2, t.Obstacles.Empty, 0);
		that.set(4, 3, t.Obstacles.Empty, 0);
		that.set(4, 4, t.Obstacles.Dif, 0);
		that.set(4, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 6, t.Obstacles.Empty, 0);
		that.set(5, 0, t.Obstacles.Empty, 0);
		that.set(5, 1, t.Obstacles.Empty, 0);
		that.set(5, 2, t.Obstacles.Empty, 0, true);
		that.set(5, 3, t.Obstacles.Empty, 0);
		that.set(5, 4, t.Obstacles.Empty, 0);
		that.set(5, 5, t.Obstacles.Empty, 0);
		that.set(5, 6, t.Obstacles.Empty, 0);
		that.set(6, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 1, t.Obstacles.Empty, 0);
		that.set(6, 2, t.Obstacles.Empty, 0);
		that.set(6, 3, t.Obstacles.Dif, 0);
		that.set(6, 4, t.Obstacles.Empty, 0);
		that.set(6, 5, t.Obstacles.Empty, 0);
		that.set(6, 6, t.Obstacles.Empty, 0);
	},
	x : 562, 
	y: 692,
	text : "Easy to invent, harder to solve",
	required : ["Fibonacci", "robozzle"],
	times : [28, 37, 60] // calibrated: best found B = 26 steps (docs/levels/CALIBRATION.md)
});


t.Levels.addLevel({
	name : "detector",
	set : function(that){
		t.Selector.setBasicOperators();
		t.Selector.addMagic();
		that.resetTables([3,3],[7,7]);
		this.setRobotTable(that);
	},
	showMagic : true,
	setRobotTable: function(that){
		that.setRobot(3,0,0);
		for(var i =0; i<7; i++)
			for(var j=0; j<7; j++)
				if(i!==1&&i!=3&&(i!==2||j!==5))
					that.set(i,j, t.Obstacles.Lava, 0);
		that.set(3,5, t.Obstacles.Dif, 0);
		that.set(1,5, t.Obstacles.Dif, 0);
		that.set(1,0, t.Obstacles.End, 0);
		that.set(1,6, t.Obstacles.Lava, 0);
		that.set(3,6, t.Obstacles.Lava, 0);
	},
	x : 687,
	y: 485,
	text : "New conditional: this one checks whether the robot is standing on a colored tile.",
	required : ["spiral"],
	times : [18, 24, 39] // calibrated: best found B = 17 steps (docs/levels/CALIBRATION.md)
});

t.Levels.addLevel({
	name : "robozzle",
	set : function(that){
		t.Selector.setBasicOperators();
		t.Selector.addMagic();
		that.resetTables([4,4],[11,11]);
		this.setRobotTable(that);
	},
	showMagic : true,
	setRobotTable: function(that){
		that.setRobot(6,5,0);
		t.RobotTable.dotsRemaining = 120;
		that.set(0, 0, t.Obstacles.Dif, 0, true);
		that.set(0, 1, t.Obstacles.Dif, 0, true);
		that.set(0, 2, t.Obstacles.Dif, 0, true);
		that.set(0, 3, t.Obstacles.Dif, 0, true);
		that.set(0, 4, t.Obstacles.Dif, 0, true);
		that.set(0, 5, t.Obstacles.Dif, 0, true);
		that.set(0, 6, t.Obstacles.Dif, 0, true);
		that.set(0, 7, t.Obstacles.Dif, 0, true);
		that.set(0, 8, t.Obstacles.Dif, 0, true);
		that.set(0, 9, t.Obstacles.Dif, 0, true);
		that.set(0, 10, t.Obstacles.Dif, 0, true);
		that.set(1, 0, t.Obstacles.Dif, 0, true);
		that.set(1, 1, t.Obstacles.Empty, 0, true);
		that.set(1, 2, t.Obstacles.Empty, 0, true);
		that.set(1, 3, t.Obstacles.Empty, 0, true);
		that.set(1, 4, t.Obstacles.Empty, 0, true);
		that.set(1, 5, t.Obstacles.Empty, 0, true);
		that.set(1, 6, t.Obstacles.Empty, 0, true);
		that.set(1, 7, t.Obstacles.Empty, 0, true);
		that.set(1, 8, t.Obstacles.Empty, 0, true);
		that.set(1, 9, t.Obstacles.Empty, 0, true);
		that.set(1, 10, t.Obstacles.Dif, 0, true);
		that.set(2, 0, t.Obstacles.Dif, 0, true);
		that.set(2, 1, t.Obstacles.Empty, 0, true);
		that.set(2, 2, t.Obstacles.Empty, 0, true);
		that.set(2, 3, t.Obstacles.Empty, 0, true);
		that.set(2, 4, t.Obstacles.Empty, 0, true);
		that.set(2, 5, t.Obstacles.Empty, 0, true);
		that.set(2, 6, t.Obstacles.Empty, 0, true);
		that.set(2, 7, t.Obstacles.Empty, 0, true);
		that.set(2, 8, t.Obstacles.Dif, 0, true);
		that.set(2, 9, t.Obstacles.Dif, 0, true);
		that.set(2, 10, t.Obstacles.Dif, 0, true);
		that.set(3, 0, t.Obstacles.Dif, 0, true);
		that.set(3, 1, t.Obstacles.Empty, 0, true);
		that.set(3, 2, t.Obstacles.Empty, 0, true);
		that.set(3, 3, t.Obstacles.Empty, 0, true);
		that.set(3, 4, t.Obstacles.Empty, 0, true);
		that.set(3, 5, t.Obstacles.Empty, 0, true);
		that.set(3, 6, t.Obstacles.Empty, 0, true);
		that.set(3, 7, t.Obstacles.Dif, 0, true);
		that.set(3, 8, t.Obstacles.Dif, 0, true);
		that.set(3, 9, t.Obstacles.Empty, 0, true);
		that.set(3, 10, t.Obstacles.Dif, 0, true);
		that.set(4, 0, t.Obstacles.Dif, 0, true);
		that.set(4, 1, t.Obstacles.Empty, 0, true);
		that.set(4, 2, t.Obstacles.Empty, 0, true);
		that.set(4, 3, t.Obstacles.Empty, 0, true);
		that.set(4, 4, t.Obstacles.Empty, 0, true);
		that.set(4, 5, t.Obstacles.Empty, 0, true);
		that.set(4, 6, t.Obstacles.Dif, 0, true);
		that.set(4, 7, t.Obstacles.Dif, 0, true);
		that.set(4, 8, t.Obstacles.Empty, 0, true);
		that.set(4, 9, t.Obstacles.Empty, 0, true);
		that.set(4, 10, t.Obstacles.Dif, 0, true);
		that.set(5, 0, t.Obstacles.Dif, 0, true);
		that.set(5, 1, t.Obstacles.Empty, 0, true);
		that.set(5, 2, t.Obstacles.Empty, 0, true);
		that.set(5, 3, t.Obstacles.Empty, 0, true);
		that.set(5, 4, t.Obstacles.Empty, 0, true);
		that.set(5, 5, t.Obstacles.Dif, 0, true);
		that.set(5, 6, t.Obstacles.Dif, 0, true);
		that.set(5, 7, t.Obstacles.Empty, 0, true);
		that.set(5, 8, t.Obstacles.Empty, 0, true);
		that.set(5, 9, t.Obstacles.Empty, 0, true);
		that.set(5, 10, t.Obstacles.Dif, 0, true);
		that.set(6, 0, t.Obstacles.Dif, 0, true);
		that.set(6, 1, t.Obstacles.Empty, 0, true);
		that.set(6, 2, t.Obstacles.Empty, 0, true);
		that.set(6, 3, t.Obstacles.Empty, 0, true);
		that.set(6, 4, t.Obstacles.Dif, 0, true);
		that.set(6, 5, t.Obstacles.Empty, 0);
		that.set(6, 6, t.Obstacles.Empty, 0, true);
		that.set(6, 7, t.Obstacles.Empty, 0, true);
		that.set(6, 8, t.Obstacles.Empty, 0, true);
		that.set(6, 9, t.Obstacles.Empty, 0, true);
		that.set(6, 10, t.Obstacles.Dif, 0, true);
		that.set(7, 0, t.Obstacles.Dif, 0, true);
		that.set(7, 1, t.Obstacles.Empty, 0, true);
		that.set(7, 2, t.Obstacles.Empty, 0, true);
		that.set(7, 3, t.Obstacles.Dif, 0, true);
		that.set(7, 4, t.Obstacles.Dif, 0, true);
		that.set(7, 5, t.Obstacles.Empty, 0, true);
		that.set(7, 6, t.Obstacles.Empty, 0, true);
		that.set(7, 7, t.Obstacles.Empty, 0, true);
		that.set(7, 8, t.Obstacles.Empty, 0, true);
		that.set(7, 9, t.Obstacles.Empty, 0, true);
		that.set(7, 10, t.Obstacles.Dif, 0, true);
		that.set(8, 0, t.Obstacles.Dif, 0, true);
		that.set(8, 1, t.Obstacles.Empty, 0, true);
		that.set(8, 2, t.Obstacles.Dif, 0, true);
		that.set(8, 3, t.Obstacles.Dif, 0, true);
		that.set(8, 4, t.Obstacles.Empty, 0, true);
		that.set(8, 5, t.Obstacles.Empty, 0, true);
		that.set(8, 6, t.Obstacles.Empty, 0, true);
		that.set(8, 7, t.Obstacles.Empty, 0, true);
		that.set(8, 8, t.Obstacles.Empty, 0, true);
		that.set(8, 9, t.Obstacles.Empty, 0, true);
		that.set(8, 10, t.Obstacles.Dif, 0, true);
		that.set(9, 0, t.Obstacles.Dif, 0, true);
		that.set(9, 1, t.Obstacles.Empty, 0, true);
		that.set(9, 2, t.Obstacles.Dif, 0, true);
		that.set(9, 3, t.Obstacles.Empty, 0, true);
		that.set(9, 4, t.Obstacles.Empty, 0, true);
		that.set(9, 5, t.Obstacles.Empty, 0, true);
		that.set(9, 6, t.Obstacles.Empty, 0, true);
		that.set(9, 7, t.Obstacles.Empty, 0, true);
		that.set(9, 8, t.Obstacles.Empty, 0, true);
		that.set(9, 9, t.Obstacles.Empty, 0, true);
		that.set(9, 10, t.Obstacles.Dif, 0, true);
		that.set(10, 0, t.Obstacles.Dif, 0, true);
		that.set(10, 1, t.Obstacles.Dif, 0, true);
		that.set(10, 2, t.Obstacles.Dif, 0, true);
		that.set(10, 3, t.Obstacles.Dif, 0, true);
		that.set(10, 4, t.Obstacles.Dif, 0, true);
		that.set(10, 5, t.Obstacles.Dif, 0, true);
		that.set(10, 6, t.Obstacles.Dif, 0, true);
		that.set(10, 7, t.Obstacles.Dif, 0, true);
		that.set(10, 8, t.Obstacles.Dif, 0, true);
		that.set(10, 9, t.Obstacles.Dif, 0, true);
		that.set(10, 10, t.Obstacles.Dif, 0, true);
	},
	x : 586,
	y: 539,
	text : "Borrowed with admiration from robozzle.com - it has plenty more puzzles like this one.",
	required : ["detector"],
	times : [555, 740, 1190] // calibrated: best found B = 527 steps (docs/levels/CALIBRATION.md)
});