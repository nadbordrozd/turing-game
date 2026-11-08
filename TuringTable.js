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
	// Belt joins: every belt tile shows the belt its neighbours make, so the
	// belt follows the flow. A single-exit tile (GOTO, step, rotators, +1) is
	// described by which of behind / left / right feed it (nothing feeding it
	// counts as behind): one side alone is a corner, both sides a T, a side
	// with behind a merge into the straight belt. A branch tile (detectors, -1)
	// also takes a stub from its far side. The tile's symbol is drawn over that
	// underlay (Operators.js; tools/art/tiles/program-tiles.mjs draws both).
	// Purely cosmetic; the rules are unchanged.
	LINE_SHEETS : {B: "conveyor", L: "conveyorFromLeft", R: "conveyorFromRight", LR: "conveyorFromBoth",
		BL: "conveyorJoinLeft", BR: "conveyorJoinRight", BLR: "conveyorJoinBoth"},
	BRANCH_SHEETS : {W: "branch", E: "branchFromFar", WE: "branchFromBoth"},
	lineSheet : function(behind, left, right){	//underlay of a single-exit tile fed from these sides
		return this.LINE_SHEETS[(behind ? "B" : "") + (left ? "L" : "") + (right ? "R" : "") || "B"];
	},
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
		var cell = this.table[x][y], op = cell.what;
		if(!op.belt) return op.sheet;
		var a = cell.angle||0;
		var f = t.Operators.r([1,0], a), l = t.Operators.r([0,-1], a), r = t.Operators.r([0,1], a);
		var behind = this.feeds(x-f[0], y-f[1], x, y);
		if(op.belt === "branch"){
			var far = this.feeds(x+f[0], y+f[1], x, y);
			return this.BRANCH_SHEETS[(behind ? "W" : "") + (far ? "E" : "") || "W"];
		}
		return this.lineSheet(behind, this.feeds(x+l[0], y+l[1], x, y), this.feeds(x+r[0], y+r[1], x, y));
	},
	refreshBeltJoins : function(){
		if(!this.display1 || !this.display1.tiles || !this.table) return;
		for(var x=0; x<this.xmax; x++)
			for(var y=0; y<this.ymax; y++){
				var tile = this.display1.tiles[x] && this.display1.tiles[x][y];
				var cell = this.table[x] && this.table[x][y];
				if(tile && cell && cell.what.belt) tile.setBelt(this.beltSheet(x, y));
			}
	},
	// Drag/hover preview: the belt sheets that cell x,y and its neighbours would
	// show if x,y held `content`. Returns [{x, y, what, angle, sheet}] for x,y
	// itself and for each neighbouring belt tile whose underlay would change.
	previewJoins : function(x, y, content){
		var old = this.table[x][y], out = [];
		this.table[x][y] = content;
		try {
			var near = [[0,0],[1,0],[-1,0],[0,1],[0,-1]];
			for(var i=0; i<near.length; i++){
				var nx = x+near[i][0], ny = y+near[i][1];
				if(nx<0 || ny<0 || nx>=this.xmax || ny>=this.ymax) continue;
				var cell = this.table[nx][ny], sheet = this.beltSheet(nx, ny);
				var tile = this.display1.tiles[nx] && this.display1.tiles[nx][ny];
				if(i === 0 || (cell.what.belt && tile && tile.p.sheet !== sheet))
					out.push({x: nx, y: ny, what: cell.what, angle: cell.angle||0, sheet: sheet});
			}
		} finally { this.table[x][y] = old; }
		return out;
	},
	// The side arcs the belt at x,y shows, in board-local px (none when it is
	// straight or a branch): quarter circles from a side opening (at(0)) to the
	// exit (at(1)). A corner has one, a T or a three-way merge two.
	bendsAt : function(x, y){
		if(x<0 || y<0 || x>=this.xmax || y>=this.ymax) return [];
		var tile = this.display1.tiles[x] && this.display1.tiles[x][y], cell = this.table[x][y];
		if(!tile || cell.what.belt !== "line") return [];
		var key = "";
		for(var k in this.LINE_SHEETS) if(this.LINE_SHEETS[k] === tile.p.sheet) key = k;
		var a = cell.angle||0, half = (this.unitwidth+this.interval)/2, c = this.cellLocal(x, y);
		var f = t.Operators.r([1,0], a), out = [];
		var arc = function(sd){
			var k = {x: c.x+(f[0]+sd[0])*half, y: c.y+(f[1]+sd[1])*half};
			return {
				entry: {x: c.x+sd[0]*half, y: c.y+sd[1]*half}, exit: {x: c.x+f[0]*half, y: c.y+f[1]*half},
				len: Math.PI*half/2,
				at: function(s){
					var p = Math.cos(s*Math.PI/2), q = Math.sin(s*Math.PI/2);
					return {x: k.x-(f[0]*p+sd[0]*q)*half, y: k.y-(f[1]*p+sd[1]*q)*half};
				}
			};
		};
		if(key.indexOf("L") >= 0) out.push(arc(t.Operators.r([0,-1], a)));
		if(key.indexOf("R") >= 0) out.push(arc(t.Operators.r([0,1], a)));
		return out;
	},
	cellLocal : function(x, y){	//centre of a cell in board-local px (the dot's frame)
		var wid = this.unitwidth, inter = this.interval;
		return {x: (wid+inter)*x+inter-((this.xmax)*(wid+inter)+inter)/2+wid/2,
			y: (wid+inter)*y+inter-((this.ymax)*(wid+inter)+inter)/2+wid/2};
	},
	// The marker's route for one move by `vector` from where it stands: through
	// the shared edge, along the arc it actually travels on either side. Into a
	// tile, that is the arc whose side opening is the shared edge (a belt fed
	// from behind is entered straight, even where side arcs merge into it); out
	// of a tile, the arc whose middle the marker rests on (an arc's resting
	// point is its middle). Null when both halves are straight (the plain
	// centre-to-centre move).
	flowPath : function(vector){
		var pitch = this.unitwidth+this.interval, d = this.dot.p;
		var o = this.cellLocal(0, 0);
		var sx = Math.round((d.x-o.x)/pitch), sy = Math.round((d.y-o.y)/pitch);
		var a = this.cellLocal(sx, sy), b = this.cellLocal(sx+vector[0], sy+vector[1]);
		var e = {x: (a.x+b.x)/2, y: (a.y+b.y)/2};
		var near = function(p, q){ return Math.abs(p.x-q.x) < 1 && Math.abs(p.y-q.y) < 1; };
		var pick = function(bends, test){
			for(var i=0; i<bends.length; i++) if(test(bends[i])) return bends[i];
			return null;
		};
		var leg = function(bend){	//curve from the bend's middle to the shared edge, or null
			return bend && {s0: 0.5, s1: near(bend.entry, e) ? 0 : 1, len: bend.len/2, bend: bend};
		};
		var out = leg(pick(this.bendsAt(sx, sy), function(bd){
			return near({x: d.x, y: d.y}, bd.at(0.5)) && (near(bd.exit, e) || near(bd.entry, e));
		}));
		var ahead = this.bendsAt(sx+vector[0], sy+vector[1]);
		var inn = leg(pick(ahead, function(bd){ return near(bd.entry, e); }) ||
			pick(ahead, function(bd){ return near(bd.exit, e); }));
		if(!out && !inn) return null;
		var start = {x: d.x, y: d.y}, end = inn ? inn.bend.at(0.5) : b;
		var l1 = out ? out.len : Math.hypot(e.x-start.x, e.y-start.y);
		var l2 = inn ? inn.len : Math.hypot(end.x-e.x, end.y-e.y);
		return {len: l1+l2, at: function(dist){
			var k;
			if(dist < l1){
				k = l1 ? dist/l1 : 1;
				return out ? out.bend.at(out.s0+(out.s1-out.s0)*k) : {x: start.x+(e.x-start.x)*k, y: start.y+(e.y-start.y)*k};
			}
			k = l2 ? Math.min(1, (dist-l1)/l2) : 1;
			return inn ? inn.bend.at(inn.s1+(inn.s0-inn.s1)*k) : {x: e.x+(end.x-e.x)*k, y: e.y+(end.y-e.y)*k};
		}};
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
			  sense : {kind : 'wall'|'magic', result : bool}	(detector tiles; animation only)
			
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
		if(step.sense) t.RobotTable.animateSense(step.sense, this.callbackCallbacker(callback));
		if(step.dotEaten) t.RobotTable.animateEatDot(step.dotEaten, this.callbackCallbacker(callback), step.end === 'victory');
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
		var path = this.flowPath(vector);	//follows bent belts; display only
		if(path) this.dot.follow(path, this.stepTime, callback);
		else this.dot.move(vector[0]*(this.unitwidth+this.interval), vector[1]*(this.unitwidth+this.interval), this.stepTime, callback);
	},
	animateIdle : function(callback) {
		t.TuringTable.dot.dieSlowly(callback);
	},
	animateEnd : function(callback, end){
		if(end==="idle"||end==="stepLimit") { t.RobotSfx.fail(); t.TuringTable.animateIdle(callback); } else 
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