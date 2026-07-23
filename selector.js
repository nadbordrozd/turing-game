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
	createAndInsertSelectee : function(operator, x, y, container, stage){
		var selectee = stage.insert(new Q.SelectorTile({'x': x, 'y': y, parent: this.container, 
			desiredHeight: 40, "stage" : stage,
			'operator' : operator, rotationAngle : 0}));
		this.operatorSprites.push(selectee);
		return selectee;
	},
	displayMe : function(stage){  //'rgba(100, 20, 250, 0.5)'
		this.operatorSprites = [];
		this.container = stage.insert(new Q.UI.Container({
			x:170, y: 80, w: 300, h: 100, fill : 'rgba(0, 255, 0, 0.5)', z : 1
			}));
		var shift = -2;
		var vert = 0;
		for(var i in this.currentOperators){
					if(shift>2) {
				shift = -2;  
				vert+=50;
				this.container.p.h+=50;
			}
			this.createAndInsertSelectee(this.currentOperators[i], shift*50, vert, this.container, stage);
			shift++;

		}
		
	},
	disableTouch : function(){
		for(var i in this.operatorSprites) this.operatorSprites[i].type = Q.SPRITES_NONE;
	},
	enableTouch : function(){
		for(var i in this.operatorSprites) this.operatorSprites[i].type = Q.SPRITES_UI;
	}
}