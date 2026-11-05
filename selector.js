// The tile tray: which instructions a level offers, and their canvas tiles.
// Picking, dragging and placing them is handled by t.TileInput (js/ui/tile-input.js).
t.Selector = {
	currentOperators : {},
	operatorSprites : [],
	addOperator : function(op){ this.currentOperators[op.name] = op;},
	addOperators : function(ops){for(var i in ops) this.currentOperators[ops[i].name] = ops[i];},
	setStepOperator : function(){
		this.currentOperators = {};
		this.addOperator(t.Operators.Step);
	},
	setBasicOperators : function(){
		this.currentOperators = {};
		this.addOperators(this.basicOperators);
	},
	setDefaultOperators : function(){
		this.currentOperators = {};
		this.addOperators(this.basicOperators);
		this.addOperator(t.Operators.Detector);
	},
	addColoredOperators : function(colors){
		for(var i in colors){
			this.addOperator(t.OperatorUtils.colors[colors[i]].incrementer);
			this.addOperator(t.OperatorUtils.colors[colors[i]].decrementer);
		}
	},
	addMagic : function(){
		this.addOperator(t.Operators.DetectMagic);
	},
	setStepAndMove : function(){
		this.currentOperators = {};
		this.addOperator(t.Operators.Step);
		this.addOperator(t.Operators.Conveyor);
	},
	basicOperators : [t.Operators.Step, t.Operators.Conveyor, t.Operators.ClockwiseRotator,t.Operators.CounterClockwiseRotator],
	// The tray's operators in display order.
	operatorList : function(){
		var list = [];
		for(var i in this.currentOperators) list.push(this.currentOperators[i]);
		return list;
	},
	// slots: [{cx, cy, size}] in logical px, one per operator (from the game screen layout)
	displayMe : function(stage, slots){
		this.operatorSprites = [];
		var ops = this.operatorList();
		for(var i = 0; i < ops.length && i < slots.length; i++){
			this.operatorSprites.push(stage.insert(new Q.ProgTile({x: slots[i].cx, y: slots[i].cy,
				pitch: slots[i].size, operator: ops[i], rotationAngle: 0, z: 2})));
		}
	}
}
