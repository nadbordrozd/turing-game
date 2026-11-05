t.TuringTable = {
	current : [0,0],
    unitwidth : 54,	//board pitch: tiles join edge to edge (contract with the program-tiles atlas)
    interval : 0,
    dotheight: 4,
    dotwidth: 4,
    gameon : false,
	stepTime : 0.4, //in seconds
	defaultStepTime : 0.4,
	stepTimeFactor : 1,
	slower : function(){
		if(this.stepTimeFactor>16) return;
		this.stepTimeFactor*=2;
		this.stepTime = this.stepTimeFactor*this.defaultStepTime;
	},
	faster : function(){
		if(this.stepTimeFactor*16<1) return;
		this.stepTimeFactor/=2;
		this.stepTime = this.stepTimeFactor*this.defaultStepTime;	
	},
	init : function(ymax, xmax){
		this.ymax = typeof ymax !== 'undefined' ? ymax : 7;
		this.xmax = typeof xmax !== 'undefined' ? xmax : this.ymax;
		this.table = [];
		var tab = t.GameSaver.loadTuringTable();
		if(tab){
			this.table = tab;
		} else 
		for(var i=0; i<this.xmax; i++){
			this.table.push([]);
			for(var j=0; j<ymax; j++) this.table[i].push({what : t.Operators.Empty, angle: 0});
		}

	},
	
	clearTable : function(){	//dziala tylko dla kwadratowej
		for(var i=0; i<this.xmax; i++){
			for(var j=0; j<this.ymax; j++) {
				this.table[i][j]={what : t.Operators.Empty, angle: 0};
				this.styleATile(i,j,this.table[i][j]);
			}
		}
	},
	
	resetDot : function(x,y){	
		var wid = this.unitwidth;
        var inter = this.interval;
		var totWid = (this.xmax)*(wid+inter)+inter;
		var totHei = (this.ymax)*(wid+inter)+inter;
		this.current[1] = y||(this.ymax-this.ymax%2)/2;
		//this.current[0]=x||0;
		this.current[0]=x||(-1);
		this.nosteps = 0;
		this.steps.empty();
		this.howItEnded = false;
		this.dot.setPos((inter+wid)*this.current[0]+inter-totWid/2+wid/2,
			(inter+wid)*this.current[1]+inter-totHei/2+wid/2);
		this.dot.p.opacity =1;
	},
	firstStep : function(){
		
	},
	print : function(){
		var f = function(op){
			if(op===t.Operators.Empty) return "0"; else return "!";
		}
		var aux="";
		for(var y=0; y<this.ymax; y++){
			aux = "";
			for(var x=0; x<this.xmax; x++)	aux+=f(this.table[x][y].what)+" ";
		
		}
	},
    updateTile : function(x, y, newContent){
		l.log('rota',"updated  "+ x+"  "+y+"   "+newContent);
		for(var i in newContent)
			this.table[x][y][i] = newContent[i];
		this.refreshBeltJoins();
	},
	createTile : function(x, y, content){
		var stage = this.display1.stage;
		var wid = this.unitwidth;
        var inter = this.interval;
		var totWid = (this.xmax)*(wid+inter)+inter;
		var totHei = (this.ymax)*(wid+inter)+inter;
		if(content) this.table[x][y] = content;
		else var content = this.table[x][y];
		// tiles live inside the board container, so moving the board moves them
		var tile = stage.insert(new Q.ProgTile({"x": (wid+inter)*x+inter-totWid/2+wid/2,
					"y": (wid+inter)*y+inter-totHei/2+wid/2, pitch : wid,
					rotationAngle : content.angle, operator: content.what, z: 2,
					tablePosX : x, tablePosY : y}), this.display1);
		this.display1.tiles[x][y] = tile;
		this.refreshBeltJoins();
	},
	clear : function(){
		for(var i=0; i<t.TuringTable.xmax; i++)
			for(var j=0; j<	t.TuringTable.ymax; j++){
				t.TuringTable.setTile(i,j, {angle : 0, what : t.Operators.Empty});
			}
		t.GameSaver.saveTuringTable();
	},
	setTile : function(x,y, content){
		this.styleATile(x,y,content);
		this.table[x][y] = content;
		this.refreshBeltJoins();
	},
	// Belt joins: a GOTO (conveyor) tile fed from its side shows a corner belt
	// (sheets conveyorFromLeft / conveyorFromRight in images/tiles/program-tiles.png)
	// so the belt follows the flow. Purely cosmetic; the rules are unchanged.
	exitsOf : function(cell){
		var op = cell && cell.what;
		if(!op || op === t.Operators.Empty) return [];
		var branch = op === t.Operators.Detector || op === t.Operators.DetectMagic ||
			t.OperatorUtils.isDecrementer(op);
		var dirs = branch ? [[0,-1],[0,1]] : [[1,0]];
		return dirs.map(function(d){ return t.Operators.r(d, cell.angle||0); });
	},
	feeds : function(x, y, tx, ty){	//does the cell at x,y send the program to tx,ty?
		var startY = (this.ymax-this.ymax%2)/2;
		if(x === -1 && y === startY) return tx === 0 && ty === startY;	//the start, left of the board
		if(x<0 || y<0 || x>=this.xmax || y>=this.ymax) return false;
		var exits = this.exitsOf(this.table[x][y]);
		for(var i=0; i<exits.length; i++)
			if(x+exits[i][0] === tx && y+exits[i][1] === ty) return true;
		return false;
	},
	beltSheet : function(x, y){
		var cell = this.table[x][y];
		if(cell.what !== t.Operators.Conveyor) return cell.what.sheet;
		var a = cell.angle||0;
		var f = t.Operators.r([1,0], a), l = t.Operators.r([0,-1], a), r = t.Operators.r([0,1], a);
		if(this.feeds(x-f[0], y-f[1], x, y)) return "conveyor";
		var fromLeft = this.feeds(x+l[0], y+l[1], x, y);
		var fromRight = this.feeds(x+r[0], y+r[1], x, y);
		if(fromLeft && !fromRight) return "conveyorFromLeft";
		if(fromRight && !fromLeft) return "conveyorFromRight";
		return "conveyor";
	},
	refreshBeltJoins : function(){
		if(!this.display1 || !this.display1.tiles || !this.table) return;
		for(var x=0; x<this.xmax; x++)
			for(var y=0; y<this.ymax; y++){
				var tile = this.display1.tiles[x] && this.display1.tiles[x][y];
				var cell = this.table[x] && this.table[x][y];
				if(tile && cell && cell.what === t.Operators.Conveyor) tile.p.sheet = this.beltSheet(x, y);
			}
	},
	styleATile : function(x, y, content){
     	if(!content.angle) content.angle = 0;
        var tileToStyle = this.display1.tiles[x][y];
		//tileToStyle.set({'asset' : content.what.img});
		tileToStyle.setOperator(content.what);
		tileToStyle.setAngle(content.angle);
   
    },	
 
	// The board is a container at (0,0); the game screen moves it into place
	// (t.GameScreen.build) once the whole level is set up.
	displayMe : function(stage, dimensions){
		this.init(dimensions[0], dimensions[1]);
		var wid = this.unitwidth;
        var inter = this.interval;
		var totWid = (this.xmax)*(wid+inter)+inter;
		var totHei = (this.ymax)*(wid+inter)+inter;
		this.display1 = new Q.Rectangle({x: 0, y: 0, w: totWid, h: totHei, type: Q.SPRITE_NONE,
						wid : this.unitwidth, interval: this.interval, color : "#a3d9b1", sort : true});
		var display1 = this.display1;
		display1.tiles = new Array(this.xmax);
		for(var i=0; i<this.xmax; i++) display1.tiles[i] = new Array(this.ymax);
		stage.insert(this.display1);
		for(var i=0; i<this.ymax; i++){
			for(var j=0; j<this.xmax; j++){
				this.createTile(j, i);
			}
		}
		this.dot = stage.insert(new Q.Spark({x: (inter+wid)*this.current[0]+inter-totWid/2+wid/2,
			y: (inter+wid)*this.current[1]+inter-totHei/2+wid/2, desiredHeight : wid,
			'type': Q.SPRITE_NONE}), this.display1);
		this.resetDot();
		return this.display1;
	},

	// Board cell under a point in stage coordinates, or false.
	cellAt : function(px, py, slack){
		if(!this.display1) return false;
		var wid = this.unitwidth + this.interval;
		var x0 = this.display1.p.x - this.display1.p.w/2;
		var y0 = this.display1.p.y - this.display1.p.h/2;
		var fx = (px - x0)/wid, fy = (py - y0)/wid, s = (slack||0)/wid;
		if(fx < -s || fy < -s || fx >= this.xmax + s || fy >= this.ymax + s) return false;
		return {x: Math.max(0, Math.min(this.xmax-1, Math.floor(fx))),
			y: Math.max(0, Math.min(this.ymax-1, Math.floor(fy)))};
	},
	// Centre of a board cell in stage coordinates.
	cellCenter : function(x, y){
		var wid = this.unitwidth + this.interval;
		return {x: this.display1.p.x - this.display1.p.w/2 + (x+0.5)*wid,
			y: this.display1.p.y - this.display1.p.h/2 + (y+0.5)*wid};
	},

	move : function(vec){
		this.current[0]+=vec[0];
		this.current[1]+=vec[1];
	},
    
	saveNumberOfStepsAndParts : function(){
		l.err("error", "asfsdfasfdasfS");
		//throw("skad");
		this.totalSteps = this.steps.length;
		var parts = 0;
		for(var i=0; i<this.ymax; i++)
			for(var j=0; j<this.xmax; j++)
				if(this.table[j][i].what!==t.Operators.Empty) parts++;
		this.totalParts = parts;
	},
	maxSteps : 5000,
	nosteps: 0,

	
/*
	all of the attributes are optional
	step = { !end : idle, stepLimit, water, electro, lava, 
				victoryAllDots, victoryHatch 
			  roboMotion : [int, int]
			  roboTation : int
			  turingMotion : [int, int]
			  ateAScrew : true
			  wallBump : [int, int]
			  wallDetect : true
			
			  increment : color
			  decrement : color
			  
			  swapTile : {x:int, y:int, oldContent:content, newContent:content}

*/
	steps : t.Dequeue.create(),
	howItEnded : false,
	stepForward : function(){			//takes one turingstep and pushes it to the queue
	///////////////******
		if(this.howItEnded) {
			var step = {ultimateEnd : this.howItEnded};
			this.steps.addLast(step);
			return step;
		}
		//////////////*  
		this.nosteps++;
		if(this.nosteps===1){
			var step = {};
			t.Operators.Conveyor.operate(0, step);
			this.steps.addLast(step);
			return step;
		}
		var step = {};
		var c0 = this.current[0];
		var c1 = this.current[1];
		//console.log('c0 = '+c0+"  c1 = "+c1+"   xmax = "+this.xmax+"   ymax = "+this.ymax);
		if(c0<0||c0>=this.xmax||c1<0||c1>=this.ymax){
	
			step.ultimateEnd = 'idle'; 
			this.howItEnded = "idle";
			this.steps.addLast(step);
			return step;
		} else 
		if(this.nosteps>t.TuringTable.maxSteps) {
			l.err("end", "koniec z wyczerpania");
			step.ultimateEnd = 'stepLimit';
			this.howItEnded = step.ultimateEnd;
			this.steps.addLast(step);
			return step;
		}
        var aux = this.table[this.current[0]][this.current[1]];
        aux.what.operate(aux.angle, step);
		this.steps.addLast(step);
		if(step.end) this.howItEnded = step.end;
		
		return step;
	},
	stepBackwards : function(){
		var step = this.steps.pollLast();
		
	},
	callbacksUntilCallback : 0, //uruchamiam kilka animacji z ktorych kazda musi sie skonczyc, 
								//uruchamiam callback dopiero kiedy wszysktie sie skoncza
								//kazda animacja po skonczeniu zmniejsza licznik callbackow o 1
	callbackCallbacker : function(callback){
		t.TuringTable.callbacksUntilCallback++;
		//console.log('inside callback callbacker');
		return function(){
			//console.log('inside callback wrapper');
			t.TuringTable.callbacksUntilCallback--;
			if(t.TuringTable.callbacksUntilCallback===0) {
				t.Controls.animationIsPlaying = false;
			
				callback();
			}
		}
	},
	animate : function(step, callback){
		t.Controls.animationIsPlaying = true; //przynajniej jedna z opcji turingMotion, roboMotion itd. musi wyst¹piæ or else

		globalny = step;
		if(step.turingMotion) this.animateMove(step.turingMotion, this.callbackCallbacker(callback));
		if(step.roboMotion) t.RobotTable.animateMove(step.roboMotion, this.callbackCallbacker(callback));
		if(step.wallBump) t.RobotTable.animateWallBump(step.wallBump, this.callbackCallbacker(callback));
		if(step.roboTation) t.RobotTable.animateRotate(step.roboTation, this.callbackCallbacker(callback));
		if(step.dotEaten) t.RobotTable.animateEatDot(step.dotEaten, this.callbackCallbacker(callback));
		//if(step.end) this.animateEnd(this.callbackCallbacker(callback), step.end);
		if(step.ultimateEnd) this.animateEnd(this.callbackCallbacker(callback), step.ultimateEnd);
		//if(step.end) this.howItEnded = step.end;
		if(step.increment) t.RobotTable.animateIncrement(step.increment, this.callbackCallbacker(callback));
		else 
		if(step.decrement) t.RobotTable.animateDecrement(step.decrement, this.callbackCallbacker(callback));
		if(step.swapTile) {
			t.RobotTable.animateSwapTile(step.swapTile.x, 
				step.swapTile.y, step.swapTile.oldContent, step.swapTile.newContent, 
				this.callbackCallbacker(callback));
		}
	},
	reverseAnimate : function(step){
		if(step.turingMotion) this.animateMove([-step.turingMotion[0], -step.turingMotion[1]]);
		if(step.roboMotion) t.RobotTable.animateMove([-step.roboMotion[0],-step.roboMotion[1]]);
		if(step.roboTation) t.RobotTable.animateRotate(-step.roboTation);
	},
	animateMove : function(vector, callback){

		this.dot.move(vector[0]*(this.unitwidth+this.interval), vector[1]*(this.unitwidth+this.interval), this.stepTime, callback);
	},
	animateIdle : function(callback) {
		t.TuringTable.dot.dieSlowly(callback);
	},
	animateEnd : function(callback, end){
		if(end==="idle") t.TuringTable.animateIdle(callback); else 
		if(end==="stepLimit") t.TuringTable.animateIdle(callback); else 
		if(end==='victory') t.RobotTable.animateVictory(callback); else
		if(end==='lava') t.RobotTable.animateDrownInLava(callback); else
		if(end==="drowned") t.RobotTable.animateDrown(callback);
		else if(end=="electro") t.RobotTable.animateElectrocute(callback);
		else callback();
	},
	getString : function(){
		var ret = "";
		for(var i in t.TuringTable.table){
			for(var j in t.TuringTable.table[i])
				ret+= t.TuringTable.table[i][j].name+",";
				ret+="#";
		}
		return ret;
	},
	tiredDot : function(){},
	robotKilledDot : function(){}
	/**/
}