t.Levels.addLevel({
	name : "hobbit harder",
	set : function(that){
		that.resetTables([7,7],[10,10]);
		this.setRobotTable(that);
		t.Selector.setDefaultOperators();
	},
	setRobotTable: function(that){
		that.set(0,1,t.Obstacles.Empty, 0, true);
		var dodo = 0;
		for(var i=0; i<10; i++)
			for(var j=0; j<10; j++){
				if(i+j===0) continue;
				if(i%2===0)	{that.set(i,j, t.Obstacles.Empty, 0, true); dodo++}
			    else if(((i%4-1)/2+j)%2===0) {that.set(i,j, t.Obstacles.Empty, 0, true); dodo++}
				else that.set(i,j, t.Obstacles.Obstacle);
			}
		t.RobotTable.dotsRemaining = dodo;	
		that.setRobot(0,0,0);
		
	},
	x: 909, 
	y: 432,
	w: 130,
	text : "I'm not sure about this one myself",
	required : ["hobbit:"],
	getResult : function(parts, moves){
		if(parts<=27) return 3; else 
		if(parts<=40) return 2; else 
		if(moves<500) return 1; else
		return 0;
	}
});


t.Levels.addLevel({
	name : "vertigo",
	set : function(that){
		t.Selector.setDefaultOperators();
		that.resetTables([3,3],[11,11]);
		this.setRobotTable(that);
	},
	setRobotTable: function(that){
		that.setRobot(0,0,0);
		that.set(0, 5, t.Obstacles.Wall, 3);
		that.set(0, 9, t.Obstacles.Corner, 2);
		that.set(1, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 2, t.Obstacles.Corner, 0);
		that.set(2, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 6, t.Obstacles.Wall, 2);
		that.set(3, 8, t.Obstacles.Wall, 3);
		that.set(4, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 4, t.Obstacles.Wall, 2);
		that.set(4, 7, t.Obstacles.Wall, 3);
		that.set(6, 0, t.Obstacles.End, 0);
		that.set(6, 2, t.Obstacles.Wall, 1);
		that.set(6, 6, t.Obstacles.Wall, 1);
		that.set(6, 8, t.Obstacles.Wall, 0);
		that.set(7, 3, t.Obstacles.Obstacle, 0);
		that.set(7, 4, t.Obstacles.Wall, 1);
		that.set(7, 10, t.Obstacles.Wall, 0);
		that.set(8, 3, t.Obstacles.Wall, 2);
		that.set(8, 4, t.Obstacles.Wall, 3);
		that.set(9, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 3, t.Obstacles.Wall, 1);
		that.set(9, 7, t.Obstacles.Wall, 0);
		that.set(10, 5, t.Obstacles.Corner, 1);
		that.set(10, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
	},
	x: 711, 
	y: 661, 
	"text" : "If you've made it this far, you are the kind of\n"+
	         "person who would get addicted to projecteuler.net.\n"+
			 "Try it - it's an awesome addiction.",
	required : ["Fibonacci", "robozzle"],
	getResult : function(parts, moves){ 
		return 3;
	}
});

t.Levels.addLevel({
	name : "some flag?",
	set : function(that){
	t.RobotTable.roboPic = "robot.png";
		t.Selector.setDefaultOperators();
		that.resetTables([8,8],[11,11]);
		this.setRobotTable(that);
	},
	setRobotTable: function(that){
		that.setRobot(0,0,0);
		t.RobotTable.dotsRemaining = 83;
		for(var i=0; i<5; i++)
			for(var j=0; j<5; j++){
				that.set(i+6,j,t.Obstacles.Empty,0,true);
				that.set(i,j+6,t.Obstacles.Empty,0,true);
				that.set(i+6,j+6,t.Obstacles.Empty,0,true);
				that.set(i,j,t.Obstacles.Empty,0,true);
			}
		that.set(0,0, t.Obstacles.Empty);
		for(var i=1; i<5; i+=2)
			for(var j=1; j<5; j+=2){
				that.set(i,j,t.Obstacles.Lava);
				that.set(i+6,j,t.Obstacles.Lava);
				that.set(i,j+6,t.Obstacles.Lava);
				that.set(i+6,j+6,t.Obstacles.Lava);
			}
			
		for(var i=0; i<11; i++){
			that.set(5,i,t.Obstacles.CrackedIce,t.Levels.u.randInt(4) );
			that.set(i,5,t.Obstacles.CrackedIce, t.Levels.u.randInt(4));
		}
	},
	x : 863, 
	y: 622,
	robotTableX : 725,
	text: "A triple loop is in order\n"+
		  "...\n"+
		  "or is it?",
	required : ["Fibonacci", "robozzle"],
	getResult : function(parts, moves){ //TODO
		if(parts<19) return 3; else
		if(parts<30) return 2; else 
		if(parts<40) return 1; else 
		return 0;
	}
});

t.Levels.addLevel({
	name : "just give up",
	//forward forward forward left forward forward left forward forward left repeat
	set : function(that){
	t.RobotTable.roboPic = "robot.png";
		t.Selector.setBasicOperators();
		that.resetTables([6,6],[11,11]);
		this.setRobotTable(that);
	},
	setRobotTable: function(that){
		that.setRobot(5,0,0);
		t.RobotTable.dotsRemaining = 5;
		that.set(0, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 4, t.Obstacles.Wall, 3);
		that.set(0, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 6, t.Obstacles.Wall, 3);
		that.set(0, 10, t.Obstacles.Wall, 0, true);
		that.set(1, 1, t.Obstacles.Obstacle, 0);
		that.set(1, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 7, t.Obstacles.Wall, 2);
		that.set(1, 9, t.Obstacles.Wall, 0);
		that.set(1, 10, t.Obstacles.Obstacle, 0);
		//that.set(2, 3, t.Obstacles.Ice, 0);
		that.set(2, 1, t.Obstacles.Ice, t.Levels.u.randInt(4), true);
		that.set(2, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 0, t.Obstacles.Wall, 2);
		that.set(3, 4, t.Obstacles.Wall, 3);
		that.set(3, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 6, t.Obstacles.Obstacle, 0);
		that.set(3, 10, t.Obstacles.Wall, 0);
		that.set(4, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 1, t.Obstacles.Obstacle, 0);
		that.set(4, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 6, t.Obstacles.CrackedIce, 0);
		that.set(4, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 4, t.Obstacles.CrackedIce, 0, true);
		that.set(5, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 8, t.Obstacles.Empty, 0);
		that.set(5, 9, t.Obstacles.Wall, 0);
		that.set(5, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 6, t.Obstacles.Wall, 3);
		that.set(6, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 1, t.Obstacles.Wall, 2);
		that.set(7, 5, t.Obstacles.Tunnel, 0);
		that.set(7, 8, t.Obstacles.Wall, 0);
		that.set(7, 10, t.Obstacles.Empty, 0, true);
		that.set(8, 0, t.Obstacles.Obstacle, 0);
		that.set(8, 2, t.Obstacles.Obstacle, 0);
		that.set(8, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 6, t.Obstacles.Corner, 0);
		that.set(8, 10, t.Obstacles.Obstacle, 0);
		that.set(9, 0, t.Obstacles.CrackedIce, 0, true);
		that.set(9, 5, t.Obstacles.Wall, 2);
		that.set(9, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 2, t.Obstacles.Wall, 1);
		that.set(10, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 4, t.Obstacles.Obstacle, 0);
		that.set(10, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 7, t.Obstacles.Wall, 1);
		that.set(10, 9, t.Obstacles.Wall, 1);
		that.set(10, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
	},
	x : 841,
	y: 693,
	getResult : function(parts, moves){
		return 3;
	},
	required : ["Fibonacci", "robozzle"],
	text : "Go on. No one will blame you."
});


t.Levels.addLevel({
	name : "ring of fire",
	set : function(that){
		t.Selector.setDefaultOperators();
		that.resetTables([4,4],[11,11]);
		this.setRobotTable(that);
	},
	setRobotTable: function(that){
		that.setRobot(5,0,0);
		t.RobotTable.dotsRemaining = 19;
		that.set(6,1, t.Obstacles.Empty, 1, true);
		that.set(7,2, t.Obstacles.Empty, 1, true);
		that.set(8,3, t.Obstacles.Empty, 1, true);
		that.set(9,4, t.Obstacles.Empty, 1, true);
		that.set(9,6, t.Obstacles.Empty, 1, true);
		that.set(8,7, t.Obstacles.Empty, 1, true);
		that.set(7,8, t.Obstacles.Empty, 1, true);
		that.set(6,9, t.Obstacles.Empty, 1, true);
		that.set(4,9, t.Obstacles.Empty, 1, true);
		that.set(3,8, t.Obstacles.Empty, 1, true);
		that.set(2,7, t.Obstacles.Empty, 1, true);
		that.set(1,6, t.Obstacles.Empty, 1, true);
		that.set(1,4, t.Obstacles.Empty, 1, true);
		that.set(2,3, t.Obstacles.Empty, 1, true);
		that.set(3,2, t.Obstacles.Empty, 1, true);
		that.set(4,1, t.Obstacles.Empty, 1, true);
		that.set(0, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 5, t.Obstacles.Wall, 2, true);
		that.set(0, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 0, t.Obstacles.Wall, 1);
		that.set(5, 10, t.Obstacles.Wall, 3, true);
		that.set(6, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 5, t.Obstacles.Wall, 0, true);
		that.set(10, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
	},
	x : 909, 
	y: 327,
	text: "Don't fall into",
	required : ["anywhere"],
	getResult : function(parts, moves){ 
		var suma = parts+moves;
		if(suma<=124)return 3;
		if(suma<=130) return 2;
		if(suma<=155) return 1;
		return 0;
	}
});




t.Levels.addLevel({
	name : "P",
	set : function(that){
		t.Selector.setDefaultOperators();
		t.Selector.addMagic();
		that.resetTables([6,6],[11,11]);
		this.setRobotTable(that);
	},
	setRobotTable: function(that){
		that.setRobot(1,0,0);
		t.RobotTable.dotsRemaining = 46;
		that.set(0, 0, t.Obstacles.Dif, 0);
		that.set(0, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 4, t.Obstacles.Dif, 0);
		that.set(0, 5, t.Obstacles.Dif, 0);
		that.set(0, 6, t.Obstacles.Dif, 0);
		that.set(0, 7, t.Obstacles.Dif, 0);
		that.set(0, 8, t.Obstacles.Dif, 0);
		that.set(0, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 1, t.Obstacles.Empty, 0, true);
		that.set(1, 2, t.Obstacles.Empty, 0, true);
		that.set(1, 3, t.Obstacles.Dif, 0);
		that.set(1, 4, t.Obstacles.Empty, 0, true);
		that.set(1, 5, t.Obstacles.Empty, 0, true);
		that.set(1, 6, t.Obstacles.Empty, 0, true);
		that.set(1, 7, t.Obstacles.Empty, 0, true);
		that.set(1, 8, t.Obstacles.Empty, 0, true);
		that.set(1, 9, t.Obstacles.Dif, 0);
		that.set(1, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 2, t.Obstacles.Empty, 0, true);
		that.set(2, 3, t.Obstacles.Dif, 0);
		that.set(2, 4, t.Obstacles.Empty, 0, true);
		that.set(2, 5, t.Obstacles.Corner, 0);
		that.set(2, 6, t.Obstacles.DeadEnd, 0);
		that.set(2, 7, t.Obstacles.Corner, 1);
		that.set(2, 8, t.Obstacles.Empty, 0, true);
		that.set(2, 9, t.Obstacles.Dif, 0);
		that.set(2, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 0, t.Obstacles.Empty, 0);
		that.set(3, 1, t.Obstacles.Empty, 0, true);
		that.set(3, 2, t.Obstacles.Empty, 0, true);
		that.set(3, 3, t.Obstacles.Dif, 0);
		that.set(3, 4, t.Obstacles.Empty, 0, true);
		that.set(3, 5, t.Obstacles.Corner, 3);
		that.set(3, 6, t.Obstacles.DeadEnd, 2);
		that.set(3, 7, t.Obstacles.Corner, 2);
		that.set(3, 8, t.Obstacles.Empty, 0, true);
		that.set(3, 9, t.Obstacles.Empty, 0, true);
		that.set(3, 10, t.Obstacles.Dif, 0);
		that.set(4, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 1, t.Obstacles.Empty, 0, true);
		that.set(4, 2, t.Obstacles.Dif, 0);
		that.set(4, 3, t.Obstacles.Dif, 0);
		that.set(4, 4, t.Obstacles.Empty, 0, true);
		that.set(4, 5, t.Obstacles.Empty, 0, true);
		that.set(4, 6, t.Obstacles.Empty, 0, true);
		that.set(4, 7, t.Obstacles.Wall, 3);
		that.set(4, 8, t.Obstacles.Corner, 1);
		that.set(4, 9, t.Obstacles.Empty, 0, true);
		that.set(4, 10, t.Obstacles.Dif, 0);
		that.set(5, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 1, t.Obstacles.Empty, 0, true);
		that.set(5, 2, t.Obstacles.Empty, 0, true);
		that.set(5, 3, t.Obstacles.Empty, 0, true);
		that.set(5, 4, t.Obstacles.Dif, 0);
		that.set(5, 5, t.Obstacles.Dif, 0);
		that.set(5, 6, t.Obstacles.Empty, 0, true);
		that.set(5, 7, t.Obstacles.Wall, 3);
		that.set(5, 8, t.Obstacles.Corner, 2);
		that.set(5, 9, t.Obstacles.Empty, 0, true);
		that.set(5, 10, t.Obstacles.Dif, 0);
		that.set(6, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 1, t.Obstacles.Wall, 0);
		that.set(6, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 3, t.Obstacles.Empty, 0, true);
		that.set(6, 4, t.Obstacles.Dif, 0);
		that.set(6, 5, t.Obstacles.Dif, 0);
		that.set(6, 6, t.Obstacles.Empty, 0, true);
		that.set(6, 7, t.Obstacles.Wall, 1);
		that.set(6, 8, t.Obstacles.Empty, 0, true);
		that.set(6, 9, t.Obstacles.Empty, 0, true);
		that.set(6, 10, t.Obstacles.Dif, 0);
		that.set(7, 0, t.Obstacles.Empty, 0);
		that.set(7, 1, t.Obstacles.Empty, 0, true);
		that.set(7, 2, t.Obstacles.Empty, 0, true);
		that.set(7, 3, t.Obstacles.Empty, 0, true);
		that.set(7, 4, t.Obstacles.Empty, 0, true);
		that.set(7, 5, t.Obstacles.Empty, 0, true);
		that.set(7, 6, t.Obstacles.Empty, 0, true);
		that.set(7, 7, t.Obstacles.Wall, 3);
		that.set(7, 8, t.Obstacles.Empty, 0, true);
		that.set(7, 9, t.Obstacles.Dif, 0);
		that.set(7, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 1, t.Obstacles.Empty, 0, true);
		that.set(8, 2, t.Obstacles.Dif, 0);
		that.set(8, 3, t.Obstacles.Dif, 0);
		that.set(8, 4, t.Obstacles.Empty, 0, true);
		that.set(8, 5, t.Obstacles.Empty, 0);
		that.set(8, 6, t.Obstacles.Empty, 0);
		that.set(8, 7, t.Obstacles.Empty, 0);
		that.set(8, 8, t.Obstacles.Empty, 0, true);
		that.set(8, 9, t.Obstacles.Empty, 0, true);
		that.set(8, 10, t.Obstacles.Dif, 0);
		that.set(9, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 1, t.Obstacles.Empty, 0, true);
		that.set(9, 2, t.Obstacles.Empty, 0, true);
		that.set(9, 3, t.Obstacles.Empty, 0, true);
		that.set(9, 4, t.Obstacles.Empty, 0, true);
		that.set(9, 5, t.Obstacles.Wall, 3);
		that.set(9, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 7, t.Obstacles.Empty, 0);
		that.set(9, 8, t.Obstacles.Corner, 1);
		that.set(9, 9, t.Obstacles.Empty, 0, true);
		that.set(9, 10, t.Obstacles.Empty, 0, true);
		that.set(10, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 1, t.Obstacles.Empty, 0);
		that.set(10, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 5, t.Obstacles.Empty, 0);
		that.set(10, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 7, t.Obstacles.Empty, 0);
		that.set(10, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 9, t.Obstacles.Empty, 0);
		that.set(10, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
	},
	x : 140,
	y : 287,
	text : "As opposed to C and T",
	required : ["Z(2)"],
	getResult : function(parts, moves){ 
		var suma = parts+moves;
		if(suma<=357)return 3;
		if(suma<=400) return 2;
		if(suma<=460) return 1;
		return 0;
	}
});


t.Levels.addLevel({
	name : "warm-up",
	set : function(that){
		t.Selector.setDefaultOperators();
		t.Selector.addMagic();
		that.resetTables([5,5],[9,9]);
		this.setRobotTable(that);
	},
	setRobotTable: function(that){
		that.setRobot(4,1,0);
		t.RobotTable.dotsRemaining = 4;
		that.set(0, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 4, t.Obstacles.Empty, 0, true);
		that.set(0, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 4, t.Obstacles.Empty, 0);
		that.set(1, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 4, t.Obstacles.Empty, 0);
		that.set(2, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 4, t.Obstacles.Empty, 0);
		that.set(3, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 0, t.Obstacles.Empty, 0, true);
		that.set(4, 1, t.Obstacles.Empty, 0);
		that.set(4, 2, t.Obstacles.Empty, 0);
		that.set(4, 3, t.Obstacles.Empty, 0);
		that.set(4, 4, t.Obstacles.Dif, 0);
		that.set(4, 5, t.Obstacles.Empty, 0);
		that.set(4, 6, t.Obstacles.Empty, 0);
		that.set(4, 7, t.Obstacles.Empty, 0);
		that.set(4, 8, t.Obstacles.Empty, 0, true);
		that.set(5, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 4, t.Obstacles.Empty, 0);
		that.set(5, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 4, t.Obstacles.Empty, 0);
		that.set(6, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 4, t.Obstacles.Empty, 0);
		that.set(7, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 4, t.Obstacles.Empty, 0, true);
		that.set(8, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
	},
	x: 730,
	y: 588,
	text: "The only reason for this description is\n"+
	      "- javascript insists on treating an\n"+
		  "empty string as a falsy value",
	required : ["detector"],
	getResult : function(parts, moves){ 
		var suma = parts+moves;
		if(suma<=73)return 3;
		if(suma<=95) return 2;
		if(suma<=122) return 1;
		return 0;
	}
});

t.Levels.addLevel({
	name : "Z(2)",
	set : function(that){
		t.Selector.setDefaultOperators();
		that.resetTables([6,6],[11,11]);
		this.setRobotTable(that);
	},
	setRobotTable: function(that){
		that.setRobot(0,0,0);
		that.set(0, 0, t.Obstacles.Empty, 0);
		that.set(0, 1, t.Obstacles.Empty, 0);
		that.set(0, 2, t.Obstacles.Empty, 0);
		that.set(0, 3, t.Obstacles.Obstacle, 0);
		that.set(0, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(0, 9, t.Obstacles.End, 0);
		that.set(0, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 2, t.Obstacles.Empty, 0);
		that.set(1, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 6, t.Obstacles.Obstacle, 0);
		that.set(1, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(1, 9, t.Obstacles.Empty, 0);
		that.set(1, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 0, t.Obstacles.Obstacle, 0);
		that.set(2, 1, t.Obstacles.Empty, 0);
		that.set(2, 2, t.Obstacles.Wall, 0);
		that.set(2, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(2, 6, t.Obstacles.Empty, 0);
		that.set(2, 7, t.Obstacles.Empty, 0);
		that.set(2, 8, t.Obstacles.Empty, 0);
		that.set(2, 9, t.Obstacles.Empty, 0);
		that.set(2, 10, t.Obstacles.Obstacle, 0);
		that.set(3, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 1, t.Obstacles.Empty, 0);
		that.set(3, 2, t.Obstacles.Wall, 2);
		that.set(3, 3, t.Obstacles.Empty, 0);
		that.set(3, 4, t.Obstacles.Obstacle, 0);
		that.set(3, 5, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 6, t.Obstacles.Empty, 0);
		that.set(3, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(3, 10, t.Obstacles.Obstacle, 0);
		that.set(4, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 1, t.Obstacles.Obstacle, 0);
		that.set(4, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 3, t.Obstacles.Empty, 0);
		that.set(4, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(4, 5, t.Obstacles.Obstacle, 0);
		that.set(4, 6, t.Obstacles.Empty, 0);
		that.set(4, 7, t.Obstacles.Empty, 0);
		that.set(4, 8, t.Obstacles.Empty, 0);
		that.set(4, 9, t.Obstacles.Empty, 0);
		that.set(4, 10, t.Obstacles.Empty, 0);
		that.set(5, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 3, t.Obstacles.Empty, 0);
		that.set(5, 4, t.Obstacles.Wall, 1);
		that.set(5, 5, t.Obstacles.Empty, 0);
		that.set(5, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(5, 10, t.Obstacles.Empty, 0);
		that.set(6, 0, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 3, t.Obstacles.Empty, 0);
		that.set(6, 4, t.Obstacles.Wall, 0);
		that.set(6, 5, t.Obstacles.Empty, 0);
		that.set(6, 6, t.Obstacles.Empty, 0);
		that.set(6, 7, t.Obstacles.Empty, 0);
		that.set(6, 8, t.Obstacles.Wall, 3);
		that.set(6, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(6, 10, t.Obstacles.Empty, 0);
		that.set(7, 0, t.Obstacles.Empty, 0);
		that.set(7, 1, t.Obstacles.Empty, 0);
		that.set(7, 2, t.Obstacles.Empty, 0);
		that.set(7, 3, t.Obstacles.Empty, 0);
		that.set(7, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 5, t.Obstacles.Empty, 0);
		that.set(7, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 8, t.Obstacles.Empty, 0);
		that.set(7, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(7, 10, t.Obstacles.Empty, 0);
		that.set(8, 0, t.Obstacles.Empty, 0);
		that.set(8, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 3, t.Obstacles.Obstacle, 0);
		that.set(8, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 5, t.Obstacles.Empty, 0);
		that.set(8, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 7, t.Obstacles.Wall, 1);
		that.set(8, 8, t.Obstacles.Wall, 0);
		that.set(8, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(8, 10, t.Obstacles.Empty, 0);
		that.set(9, 0, t.Obstacles.Empty, 0);
		that.set(9, 1, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 2, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 3, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 4, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 5, t.Obstacles.Empty, 0);
		that.set(9, 6, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(9, 7, t.Obstacles.Wall, 0);
		that.set(9, 8, t.Obstacles.Wall, 2);
		that.set(9, 9, t.Obstacles.Empty, 0);
		that.set(9, 10, t.Obstacles.Empty, 0);
		that.set(10, 0, t.Obstacles.Empty, 0);
		that.set(10, 1, t.Obstacles.Empty, 0);
		that.set(10, 2, t.Obstacles.Empty, 0);
		that.set(10, 3, t.Obstacles.Empty, 0);
		that.set(10, 4, t.Obstacles.Empty, 0);
		that.set(10, 5, t.Obstacles.Empty, 0);
		that.set(10, 6, t.Obstacles.Obstacle, 0);
		that.set(10, 7, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 8, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 9, t.Obstacles.Lava, t.Levels.u.randInt(4));
		that.set(10, 10, t.Obstacles.Lava, t.Levels.u.randInt(4));
	},
	x : 284,
	y: 257,
	text : "The simplest non-trivial group",
	required : ["spiral"],
	getResult : function(parts, moves){ 
		var suma = parts+moves;
		if(parts<=7)return 3;
		if(parts<=10) return 2;
		if(parts<=16) return 1;
		return 0;
	}
});
