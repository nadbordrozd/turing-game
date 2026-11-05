

t.Levels.addLevel({
	name : "for",
	set : function(that){
		that.resetTables([8,8],[10,10]);
		t.Selector.setBasicOperators();
		t.Levels.showColors(["Red", "Blue"]);
		//t.RobotTable.resetCountersAndStuff = function(){
		//	this.setCounter("Red", 0);
		//}
		{
					that.set(1, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(1, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(1, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(1, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(1, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(1, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(1, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(1, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(1, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(2, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(2, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(2, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(3, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(3, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(3, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(3, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(3, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(3, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(3, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(4, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(4, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(4, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));

					that.set(4, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(4, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(5, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(5, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(5, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(5, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(5, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(5, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(6, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(6, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(6, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(6, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(7, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(7, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(7, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(7, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(7, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(7, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(7, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(7, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(8, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(8, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(9, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(9, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(9, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(9, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(9, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(9, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(9, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(9, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(9, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
					that.set(9, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		}
		this.setRobotTable(that);
	},
	x : 108,
	y: 605,
	setRobotTable : function(that){
		that.setRobot(0,0,0);
		that.set(4, 5, t.Obstacles.End, 0);
		t.RobotTable.setCounter("Red", 9);
		t.RobotTable.setCounterLabel("Red", 9);
		t.RobotTable.setCounter("Blue", 0);
		t.RobotTable.setCounterLabel("Blue", 0);
	},
	text : "If only there was a way to repeat with a decreasing number of steps...",
	required : ["*"],
	times : [60, 75, 135] // calibrated: best found B = 53 steps (docs/levels/CALIBRATION.md)
});