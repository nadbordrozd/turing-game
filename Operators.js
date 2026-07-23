t.Operators = {};
t.OperatorUtils = {};

//angle = 1 -> means 90 counterclockwise, 2 means 180 counterclockwise 
t.Operators.r = function(vec, angle){
		if(angle<0) angle = 4-((-angle)%4);
		if(angle%4===1) return [vec[1],-vec[0]]; else
		if(angle%4===2) return [-vec[0],-vec[1]]; else
		if(angle%4===3) return [-vec[1], vec[0]]; else
		if(angle%4===0) return [vec[0],vec[1]]; else{
		throw "invalid angle value";
	}
	
}

//by default (angle = 0) all operators point east or [1,0]
t.Operators.Conveyor = {
	sprite: "conveyorMations",
	sheet: "conveyor",
	name: "Conveyor",
	shortname : "C",
    operate : function(angle, step){
		t.TuringTable.move(t.Operators.r([1,0],angle));
		step.turingMotion = t.Operators.r([1,0], angle);
		return {turingMotion : t.Operators.r([1,0],angle)};
	},
	helperOptions : {
		tile: t.Operators.Conveyor,
		set : function(container){
			t.OperatorUtils.set4(container, t.Operators.Conveyor);
			var opis = container.insert(new Q.UI.Text({x:270, y:100, scale : 0.9, w: 100, 
					label: "GOTO tile helps control the program's flow. \n"+
					"It means that it doesn't do anything\n"+
					"on its own but it directs the program  \n"+
					"to other useful instructions"}));
		}
	}
}

t.Operators.ClockwiseRotator = {
    //img : "cwrotator.png",
	sprite: "cwRotatorMations",
	sheet: "cwrotator",
	name : "ClockwiseRotator",
	shortname : "cw",
	operate : function(angle, step){
		t.TuringTable.move(t.Operators.r([1,0],angle));
		t.RobotTable.rotate(-1);
		step.roboTation = -1;
		step.turingMotion = t.Operators.r([1,0],angle);
    },
	helperOptions : {
		tile: t.Operators.ClockwiseRotator,
		set : function(container){
			t.OperatorUtils.set4(container, t.Operators.ClockwiseRotator);
			var wid = t.RobotTable.unitwidth;
			var roboTile = container.insert(new Q.RobotTableTile({x : 460, y: 0,
				asset: 'robotile.png'
			}));
			var strzalka = container.insert(new Q.Sprite({x:350, y: 0, asset : 'strzalka.png'}));
			var robot = container.insert(new Q.PlayerRobo({x: 460, y: 0}));
			var rotuj  = function(){
				robot.setAngle(0);
				robot.rotate(90, 1, rotuj);
			}
			rotuj();
			var opis = container.insert(new Q.UI.Text({x:270, y:100, scale : 0.9, w: 100, 
					label: "Tells the robot to turn right -\n"+
						"i.e. to rotate by 90 degrees clockwise"}));
		}
	}
}

t.Operators.CounterClockwiseRotator = {
  //  img : "ccwrotator.png",
	sprite: "ccwRotatorMations",
	sheet: "ccwrotator",
	name: "CounterClockwiseRotator",
	shortname : "cc",
	operate : function(angle, step){
		t.RobotTable.rotate(1);
		t.TuringTable.move(t.Operators.r([1,0],angle));
		step.roboTation = 1;
		step.turingMotion = t.Operators.r([1,0],angle);
	},
	helperOptions : {
		tile: t.Operators.CounterClockwiseRotator,
		set : function(container){
			t.OperatorUtils.set4(container, t.Operators.CounterClockwiseRotator);
			var wid = t.RobotTable.unitwidth;
			var roboTile = container.insert(new Q.RobotTableTile({x : 460, y: 0,
				asset: 'robotile.png'
			}));
			var strzalka = container.insert(new Q.Sprite({x:350, y: 0, asset : 'strzalka.png'}));
			var robot = container.insert(new Q.PlayerRobo({x: 460, y: 0}));
			var rotuj  = function(){
				robot.setAngle(0);
				robot.rotate(-90, 1, rotuj);
			}
			rotuj();
			var opis = container.insert(new Q.UI.Text({x:270, y:100, scale : 0.9, w: 100, 
					label: "Tells the robot to turn left -\n"+
						"i.e. to rotate by 90 degrees counter-clockwise"}));
		}
	}
}

t.Operators.Step = {
  //  img : "step.png",
	sprite: "stepForwardMations",
	sheet: "stepForward",
	name : "Step", 
	shortname : "s",
    operate : function(angle, step){
       // t.TuringTable.shift(t.Operators.r([1,0],angle));
		t.TuringTable.move(t.Operators.r([1,0],angle));
		if(t.RobotTable.moveForward(step)) step.roboMotion = t.RobotTable.direction();
		step.turingMotion = t.Operators.r([1,0], angle);
		//return {roboMotion : t.RobotTable.direction(), turingMotion : t.Operators.r([1,0],angle)};
        //t.RobotTable.moveForward();
    }  ,
	helperOptions : {
		tile: t.Operators.Step,
		set : function(container){
			t.OperatorUtils.set4(container, t.Operators.Step);
			var wid = t.RobotTable.unitwidth;
			var roboTile = container.insert(new Q.RobotTableTile({x : 460, y: 0,
				asset: 'robotile.png'
			}));
			var strzalka = container.insert(new Q.Sprite({x:350, y: 0, asset : 'strzalka.png'}));
			var robot = container.insert(new Q.PlayerRobo({x: 460, y: -wid/2}));
			var ruszaj  = function(){
				robot.setPos(460, -wid/2);
				robot.move(0, wid, 1, ruszaj);
			}
			ruszaj();
			var opis = container.insert(new Q.UI.Text({x:270, y:100, scale : 0.9, w: 100, 
					label: "Tells the robot to move forward by one tile\n"+
						"The robot moves in the same direction\n"+
						"(towards its feet) regardless of the\n"+
						"orientation of the Step Tile"}));
		}
	}
}

t.Operators.Empty = {
	sprite : 'emptyMation',
	sheet : 'emptyOperator',
	name: "Empty",
	shortname : "e",
    operate : function(angle, step){
		step.ultimateEnd = 'idle';
       // t.TuringTable.gameon=false;
    }  
}

t.Operators.Detector = {
  //  img : "detector.png",
	sprite: "detectorMations",
	sheet: "detector",
	name: "Detector",
	shortname : "d", 
    operate : function(angle, step){
		if(t.RobotTable.isObstacleInFront()){
			step.turingMotion = t.Operators.r([0,-1],angle);
			t.TuringTable.move(t.Operators.r([0,-1],angle));
		} else {
			step.turingMotion = t.Operators.r([0,1],angle);		 
			t.TuringTable.move(t.Operators.r([0,1],angle));
        }
    },
	helperOptions : {
		tile: t.Operators.Step,
		set : function(container){
			var wid = t.RobotTable.unitwidth;
			var inter = t.RobotTable.interval;
			var iftile1 = container.insert(new Q.ShowTile({'x' : 40, 'y': 0, 
				desiredHeight : wid, operator : t.Operators.Detector,
				rotationAngle : 0}));
			var spark1 = container.insert(new Q.Spark({'x':40, 'y' : 0})); 
			var move1 = function(){
				spark1.setPos(40, 0);
				spark1.move(0,-wid, 1, move1);
			}
			move1();
			var roboTile1 = container.insert(new Q.RobotTableTile({x : 120, y: 0,
				asset: 'robotile.png'
			}));
			var wallTile = container.insert(new Q.RobotTableTile({x :120 +wid+inter, y:0,
				asset : 'obstacle.png'}));
						
			var robot1 = container.insert(new Q.PlayerRobo({x: 120, y: 0, angle : 270}));
			
			
			var iftile2 = container.insert(new Q.ShowTile({'x' : 340, 'y': 0, 
				desiredHeight : wid, operator : t.Operators.Detector,
				rotationAngle : 0}));
			var spark2 = container.insert(new Q.Spark({'x':340, 'y' : 0})); 
			var move2 = function(){
				spark2.setPos(340, 0);
				spark2.move(0,wid, 1, move2);
			}
			move2();
			var roboTile2 = container.insert(new Q.RobotTableTile({x : 420, y: 0,
				asset: 'robotile.png'
			}));
			var notWallTile = container.insert(new Q.RobotTableTile({x :420 +wid+inter, y:0,
				asset : 'robotile.png'}));
			var robot1 = container.insert(new Q.PlayerRobo({x: 420, y: 0, angle : 270}));
			
			var opis = container.insert(new Q.UI.Text({x:270, y:100, scale : 0.9, w: 100, 
					label: "Checks whether there is an obstacle in\n"+
						   "front of the robot. Directs the program's\n"+
						   "flow one way if there is or the other -\n"+
						   "if not. \n"}));
		}
	}
}


t.Operators.DetectMagic = {
  //  img : "detectMagic.png",
	name: "DetectMagic",
	shortname : "dm",
	sprite : "magicMation", 
	sheet : "magicDetector", 
    operate : function(angle, step){
		var aux = {};
		if(t.RobotTable.isMagic()){
			step.turingMotion = t.Operators.r([0,-1],angle);
			t.TuringTable.move(t.Operators.r([0,-1],angle));
		} else {
			step.turingMotion = t.Operators.r([0,1],angle);
			t.TuringTable.move(t.Operators.r([0,1],angle));
		}
	   return aux;
    },
	helperOptions : {
		tile: t.Operators.Step,
		set : function(container){
			var wid = t.RobotTable.unitwidth;
			var inter = t.RobotTable.interval;
			var iftile1 = container.insert(new Q.ShowTile({'x' : 40, 'y': 0, 
				desiredHeight : wid, operator : t.Operators.DetectMagic,
				rotationAngle : 0}));
			var spark1 = container.insert(new Q.Spark({'x':40, 'y' : 0})); 
			var move1 = function(){
				spark1.setPos(40, 0);
				spark1.move(0,-wid, 1, move1);
			}
			move1();
			var roboTile1 = container.insert(new Q.RobotTableTile({x : 120, y: 0,
				sprite: t.Obstacles.Dif.sprite, sheet : t.Obstacles.Dif.sheet
			}));
						
			var robot1 = container.insert(new Q.PlayerRobo({x: 120, y: 0, angle : 0}));
			
			
			var iftile2 = container.insert(new Q.ShowTile({'x' : 340, 'y': 0, 
				desiredHeight : wid, operator : t.Operators.DetectMagic,
				rotationAngle : 0}));
			var spark2 = container.insert(new Q.Spark({'x':340, 'y' : 0})); 
			var move2 = function(){
				spark2.setPos(340, 0);
				spark2.move(0,wid, 1, move2);
			}
			move2();
			var roboTile2 = container.insert(new Q.RobotTableTile({x : 420, y: 0,
				asset: 'robotile.png'
			}));
			var robot1 = container.insert(new Q.PlayerRobo({x: 420, y: 0, angle : 0}));
			
			var opis = container.insert(new Q.UI.Text({x:270, y:100, scale : 0.9, w: 100, 
					label: "Checks whether the robot stands on a blue\n"+
						   "tile. Directs the program's flow one way\n"+
						   "or the other - accordingly.\n"}));
		}
	}  
}


t.OperatorUtils.colors={Red : {}, Blue : {}, Green : {}, Purple : {}, Yellow : {}, Pink : {}};
for(var i in t.OperatorUtils.colors){
	t.OperatorUtils.colors[i].incrementer = {
		name : "Plus"+i,
		shortname : "p"+i,
		operate : function(kolor){
			return function(angle, step){
				step.turingMotion = t.Operators.r([1,0], angle);
				t.TuringTable.move(t.Operators.r([1,0],angle));
				t.RobotTable.incrementCounter(kolor);
				step.increment = kolor;
				if(t.Levels.currentLevel.onCounterUpdated) t.Levels.currentLevel.onCounterUpdated(kolor, 1, step);
			}
		}(i),
		sprite : "incrementerMations"+i,
		sheet : "incrementer"+i, 
		helperOptions : {
			set : function(){var j=i; return function(container){
					var wid = t.TuringTable.unitwidth; 
					var licznik = container.insert(new Q.CounterPanel({colors: [j], "stage" : container.stage, 
						x: 400, y: 0}), container);
					var op = t.OperatorUtils.colors[j].incrementer;
					var tile1 = container.insert(new Q.ShowTile({'x' : 0, 'y': 0, 
						desiredHeight : wid, operator : op,
						rotationAngle : 0}));
					var spark1 = container.insert(new Q.Spark({x: 0-wid/2, y: 0,
						'type': Q.SPRITE_NONE}));
					var move1 = function(){
						spark1.setPos(0-wid/2, 0);
						spark1.move(wid, 0,1, move1);
					}
					move1();
					
					var tile2 = container.insert(new Q.ShowTile({'x' : 80, 'y': 0, 
						desiredHeight : wid, operator : op,
						rotationAngle : 3}));
					var spark2 = container.insert(new Q.Spark({x: 80, y: 0-wid/2,
						'type': Q.SPRITE_NONE}));
					var move2 = function(){
						spark2.setPos(80, 0-wid/2);
						spark2.move(0, wid,1, move2);
					}
					move2();
					
					var tile3 = container.insert(new Q.ShowTile({'x' : 160, 'y': 0, 
						desiredHeight : wid, operator : op,
						rotationAngle : 2}));
					var spark3 = container.insert(new Q.Spark({x: 160+wid/2, y: 0,
						'type': Q.SPRITE_NONE}));
					var move3 = function(){
						spark3.setPos(160+wid/2, 0);
						spark3.move(-wid, 0,1, move3);
					}
					move3();
					
					var tile4 = container.insert(new Q.ShowTile({'x' : 240, 'y': 0, 
						desiredHeight : wid, operator : op,
						rotationAngle : 1}));
					var spark4 = container.insert(new Q.Spark({x: 240, y: wid/2,
						'type': Q.SPRITE_NONE}));
					var wartosc = 0;
					var move4 = function(){
						spark4.setPos(240, wid/2);
						spark4.move(0, -wid,1, move4);
						licznik.setCounterLabel(j, (wartosc++%100)+"");
						
					}
					move4();
					var opis = container.insert(new Q.UI.Text({x:270, y:100, scale : 0.9, w: 100, 
					label: "Increments "+j+" cipher lock by one\n"}));
				}
			}()
		}
	}
	t.Operators["Plus"+i] = t.OperatorUtils.colors[i].incrementer;
	
	t.OperatorUtils.colors[i].decrementer = {
		sprite : "decrementerMations"+i,
		sheet : "decrementer"+i,
		//img : "minus"+i+".png",
		name : "Minus"+i,
		shortname : "m"+i,
		operate : function(kolor){
			return function(angle, step){
				console.log("decrementing from "+t.RobotTable.counters[kolor]);
				if(!t.RobotTable.decrementCounter(kolor)){
					step.turingMotion = t.Operators.r([0,-1],angle);
					t.TuringTable.move(t.Operators.r([0,-1],angle));
				}	else	{
					step.turingMotion = t.Operators.r([0,1],angle);
					step.decrement = kolor;
					t.TuringTable.move(t.Operators.r([0,1],angle));
					if(t.Levels.currentLevel.onCounterUpdated) t.Levels.currentLevel.onCounterUpdated(kolor, -1, step);
				}
			}
		}(i),
		helperOptions : {
			set : function(){var j = i; return function(container){
					var wid = t.RobotTable.unitwidth;
					var inter = t.RobotTable.interval;
					var licznik1 = container.insert(new Q.CounterPanel({colors: [j], "stage" : container.stage, 
						x: 100, y: 0}), container);
					var licznik2 = container.insert(new Q.CounterPanel({colors: [j], "stage" : container.stage, 
						x: 400, y: 0}), container);
					
					var iftile1 = container.insert(new Q.ShowTile({'x' : 40, 'y': 0, 
						desiredHeight : wid, operator : t.OperatorUtils.colors[j].decrementer,
						rotationAngle : 0}));
					var spark1 = container.insert(new Q.Spark({'x':40, 'y' : 0})); 
					var warto = 99;
					var move1 = function(){
						spark1.setPos(40, 0);
						spark1.move(0,-wid, 1, move1);
						licznik2.setCounterLabel(j, warto--+"");
						if(warto==0) warto=99;
					}
					move1();

					
					var iftile2 = container.insert(new Q.ShowTile({'x' : 340, 'y': 0, 
						desiredHeight : wid, operator : t.OperatorUtils.colors[j].decrementer,
						rotationAngle : 0}));
					var spark2 = container.insert(new Q.Spark({'x':340, 'y' : 0})); 
					var move2 = function(){
						spark2.setPos(340, 0);
						spark2.move(0,wid, 1, move2);
					}
					move2();

					var opis = container.insert(new Q.UI.Text({x:270, y:140, scale : 0.9, w: 100, 
							label: "This conditional instruction checks whether\n"+
								   j+"cipher lock shows 0. Directs the program's\n"+
								   "flow one way - if it does or the other - if not.\n"+
								   "Additionally, if the number is >0 it gets\n"+
								   "decremented by 1."}));
				}
			}()
		}
		
		
		
		
	}
	t.Operators["Minus"+i] = t.OperatorUtils.colors[i].decrementer;
}

t.OperatorUtils.isDecrementer = function(operator){
	for(var i in t.OperatorUtils.colors){
		if(operator === t.OperatorUtils.colors[i].decrementer) return i;
	}
	return false;
}
t.OperatorUtils.isIncrementer = function(operator){
	for(var i in t.OperatorUtils.colors){
		if(operator === t.OperatorUtils.colors[i].incrementer) return i;
	}
	return false;
}

t.OperatorUtils.set4 = function(container, op){
		var wid = t.TuringTable.unitwidth; 
		var tile1 = container.insert(new Q.ShowTile({'x' : 0, 'y': 0, 
			desiredHeight : wid, operator : op,
			rotationAngle : 0}));
		var spark1 = container.insert(new Q.Spark({x: 0-wid/2, y: 0,
			'type': Q.SPRITE_NONE}));
		var move1 = function(){
			spark1.setPos(0-wid/2, 0);
			spark1.move(wid, 0,1, move1);
		}
		move1();
		
		var tile2 = container.insert(new Q.ShowTile({'x' : 80, 'y': 0, 
			desiredHeight : wid, operator : op,
			rotationAngle : 3}));
		var spark2 = container.insert(new Q.Spark({x: 80, y: 0-wid/2,
			'type': Q.SPRITE_NONE}));
		var move2 = function(){
			spark2.setPos(80, 0-wid/2);
			spark2.move(0, wid,1, move2);
		}
		move2();
		
		var tile3 = container.insert(new Q.ShowTile({'x' : 160, 'y': 0, 
			desiredHeight : wid, operator : op,
			rotationAngle : 2}));
		var spark3 = container.insert(new Q.Spark({x: 160+wid/2, y: 0,
			'type': Q.SPRITE_NONE}));
		var move3 = function(){
			spark3.setPos(160+wid/2, 0);
			spark3.move(-wid, 0,1, move3);
		}
		move3();
		
		var tile4 = container.insert(new Q.ShowTile({'x' : 240, 'y': 0, 
			desiredHeight : wid, operator : op,
			rotationAngle : 1}));
		var spark4 = container.insert(new Q.Spark({x: 240, y: wid/2,
			'type': Q.SPRITE_NONE}));
		var move4 = function(){
			spark4.setPos(240, wid/2);
			spark4.move(0, -wid,1, move4);
		}
		move4();	
}

t.Operators.nameToOp = {};
for(var i in t.Operators){
	var op  = t.Operators[i];
	if(op.shortname){
		t.Operators.nameToOp[op.shortname] = op;
	}
}