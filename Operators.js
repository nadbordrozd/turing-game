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
// Display: a belt tile is drawn in two layers (images/tiles/program-tiles.png,
// tools/art/tiles/program-tiles.mjs): `sheet` is its default belt underlay,
// which TuringTable.beltSheet swaps for the join its neighbours make
// (belt: "line" for single-exit tiles, "branch" for detectors and
// decrementers), and `symbol` is drawn on top; `symbolFor` overrides the
// symbol per underlay. Display only: the rules ignore these fields.
t.Operators.Conveyor = {
	sprite: "conveyorMations",
	sheet: "conveyor",
	belt: "line",
	name: "Conveyor",
	shortname : "C",
    operate : function(angle, step){
		t.TuringTable.move(t.Operators.r([1,0],angle));
		step.turingMotion = t.Operators.r([1,0], angle);
		return {turingMotion : t.Operators.r([1,0],angle)};
	}
}

t.Operators.ClockwiseRotator = {
    //img : "cwrotator.png",
	sprite: "cwRotatorMations",
	sheet: "conveyor",
	belt: "line",
	symbol: "cwrotatorSymbol",
	name : "ClockwiseRotator",
	shortname : "cw",
	operate : function(angle, step){
		t.TuringTable.move(t.Operators.r([1,0],angle));
		t.RobotTable.rotate(-1);
		step.roboTation = -1;
		step.turingMotion = t.Operators.r([1,0],angle);
    }
}

t.Operators.CounterClockwiseRotator = {
  //  img : "ccwrotator.png",
	sprite: "ccwRotatorMations",
	sheet: "conveyor",
	belt: "line",
	symbol: "ccwrotatorSymbol",
	name: "CounterClockwiseRotator",
	shortname : "cc",
	operate : function(angle, step){
		t.RobotTable.rotate(1);
		t.TuringTable.move(t.Operators.r([1,0],angle));
		step.roboTation = 1;
		step.turingMotion = t.Operators.r([1,0],angle);
	}
}

t.Operators.Step = {
  //  img : "step.png",
	sprite: "stepForwardMations",
	sheet: "conveyor",
	belt: "line",
	symbol: "stepForwardSymbol",
	// the arrows keep to the side lanes no arc runs through
	symbolFor: {conveyorFromLeft: "stepForwardSymbolSouth", conveyorJoinLeft: "stepForwardSymbolSouth",
		conveyorFromRight: "stepForwardSymbolNorth", conveyorJoinRight: "stepForwardSymbolNorth",
		conveyorFromBoth: "stepForwardSymbolInline", conveyorJoinBoth: "stepForwardSymbolInline"},
	name : "Step", 
	shortname : "s",
    operate : function(angle, step){
       // t.TuringTable.shift(t.Operators.r([1,0],angle));
		t.TuringTable.move(t.Operators.r([1,0],angle));
		if(t.RobotTable.moveForward(step)) step.roboMotion = t.RobotTable.direction();
		step.turingMotion = t.Operators.r([1,0], angle);
		//return {roboMotion : t.RobotTable.direction(), turingMotion : t.Operators.r([1,0],angle)};
        //t.RobotTable.moveForward();
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
	sheet: "branch",
	belt: "branch",
	symbol: "detectorSymbol",
	name: "Detector",
	shortname : "d", 
    operate : function(angle, step){
		var blocked = t.RobotTable.isObstacleInFront();
		step.sense = {kind : 'wall', result : blocked};	//drives the sensing animation only
		if(blocked){
			step.turingMotion = t.Operators.r([0,-1],angle);
			t.TuringTable.move(t.Operators.r([0,-1],angle));
		} else {
			step.turingMotion = t.Operators.r([0,1],angle);		 
			t.TuringTable.move(t.Operators.r([0,1],angle));
        }
    }
}


t.Operators.DetectMagic = {
  //  img : "detectMagic.png",
	name: "DetectMagic",
	shortname : "dm",
	sprite : "magicMation", 
	sheet : "branch",
	belt : "branch",
	symbol : "magicDetectorSymbol",
    operate : function(angle, step){
		var aux = {};
		var magic = t.RobotTable.isMagic();
		step.sense = {kind : 'magic', result : magic};	//drives the sensing animation only
		if(magic){
			step.turingMotion = t.Operators.r([0,-1],angle);
			t.TuringTable.move(t.Operators.r([0,-1],angle));
		} else {
			step.turingMotion = t.Operators.r([0,1],angle);
			t.TuringTable.move(t.Operators.r([0,1],angle));
		}
	   return aux;
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
		sheet : "conveyor",
		belt : "line",
		symbol : "incrementer"+i+"Symbol"
	}
	t.Operators["Plus"+i] = t.OperatorUtils.colors[i].incrementer;
	
	t.OperatorUtils.colors[i].decrementer = {
		sprite : "decrementerMations"+i,
		sheet : "branch",
		belt : "branch",
		symbol : "decrementer"+i+"Symbol",
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
		}(i)
		
		
		
		
	}
	t.Operators["Minus"+i] = t.OperatorUtils.colors[i].decrementer;
}

// The symbol layer drawn over `beltSheet` (an underlay sheet name), or null.
t.OperatorUtils.symbolSheet = function(operator, beltSheet){
	if(!operator) return null;
	return (operator.symbolFor && operator.symbolFor[beltSheet]) || operator.symbol || null;
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

t.Operators.nameToOp = {};
for(var i in t.Operators){
	var op  = t.Operators[i];
	if(op.shortname){
		t.Operators.nameToOp[op.shortname] = op;
	}
}