t.RobotTable = {
	position : [0,0],
	roboPic : "robot.png",
	dotsRemaining : 0,					//valid in levels with the eat the dots mechanic
	roboangle :0,
    unitwidth : 50,
    interval : 2,
	ended : false,
	init : function(n, m){
		this.roboangle = 0;
		this.robodisplayangle = 0;
		this.n = typeof n !== 'undefined' ? n : 7;
		this.m = typeof m !== 'undefined' ? m : this.n;
		this.table = [];
		for(var i=0; i<this.n; i++){
			this.table.push([]);
			for(var j=0; j<m; j++) this.table[i].push({what : t.Obstacles.Empty, angle: 0});
		}
		var tt = this.table;
		//this.position[0] = (n-n%2)/2;
		//this.position[1]=0;
		this.counterUpdated = false;
		this.resetCountersAndStuff = function(){}
	},
	
	resetCountersAndStuff : function(){},
	direction : function(){
		return t.Operators.r([0,1],this.roboangle)
	},
	
	
	resetTable : function(){
		for(var i=0; i<this.n; i++){
			for(var j=0; j<this.m; j++) {
			console.log("a");
				this.table[i][j]={what : t.Obstacles.Empty, angle: 0};
				this.styleATile(i,j,this.table[i][j]);
			}
		}
	},
	
     
        
	styleATile : function(x, y, content){
		if(!content.angle) content.angle = 0;
        var tile = this.display1.children[this.m*y+x];
		var options = {'asset' : content.what.img};
		if(content.what.sprite) options.sprite = content.what.sprite;
		if(content.what.sheet) options.sheet = content.what.sheet;
		tile.set(options);
		if(options.sprite) {
			tile.play();			//TODO WTF did I have to add this line?! - without it
			//when the trapped hatch turned into normal exit hatch it would 
			//disappear instead. no clue
			tile.play("default");
		}
		if(content.dot) tile.addDot();
		else tile.removeDot();
		tile.setAngle(content.angle);
    },	
		
	addDot : function(x, y){
		this.table[x][y].dot = true;
	},
	addDot2 : function(x, y){
		this.table[x][y].dot = true;
		this.display1.tiles[x][y].addDot();
	},
        
	swapTile : function(x, y, oldContent, newContent){
		this.table[x][y] = newContent;
	},
	
	setAngle : function(angle){
		this.roboangle = angle;
		this.robodisplayangle = angle;
		this.updateAngle();
	},


	setTile : function(x, y, content){
		this.table[x][y] = content;
		this.styleATile(x,y,content);
	},	
	
	displayMe : function(stage, dimensions){
		console.log(dimensions);
		this.init(dimensions[0], dimensions[1]);
		var wid = this.unitwidth;
        var inter = this.interval;
		var totWid = (this.m)*(wid+inter)+inter;
		var totHei = (this.n)*(wid+inter)+inter;
		// at (0,0): the game screen moves and scales it into the cell window (t.GameScreen.build)
		this.display1 = new Q.Rectangle({x: 0, y: 0, w: totWid, h: totHei, 'type': Q.SPRITE_NONE,
							color: t.Skin.color("casing"), wid : this.unitwidth, interval: this.interval});
		rt=this.display1;								
		this.display1.tiles = {};
		stage.insert(this.display1);
		for(var i=0; i<this.n; i++){
			this.display1.tiles[i] ={};
			for(var j=0; j<this.m; j++){
				var tile = new Q.RobotTableTile({x: (wid+inter)*j+inter-totWid/2+wid/2, 
					y: (wid+inter)*i+inter-totHei/2+wid/2, asset: this.table[i][j].what.img, 
					rotationAngle : this.table[i][j].angle, 'type': Q.SPRITE_NONE});
				var scale = wid/tile.asset().height;
				tile.set({'scale' : scale});
				this.display1.tiles[i][j] = stage.insert(tile, this.display1);
				if(this.table[i][j].dot) {console.log('aycarramba'); tile.addDot();}
			}
		}
		this.robo = new Q.PlayerRobo({x: (inter+wid)*this.position[0]+inter-totWid/2+wid/2, 
			y: (inter+wid)*this.position[1]+inter-totHei/2+wid/2, 'type': Q.SPRITE_NONE});
		
		stage.insert(this.robo, this.display1);
		return this.display1;
	},
        	
	isMagic: function(){
		var px = this.position[0];
		var py = this.position[1];
		var tile = this.table[px][py];
		return (tile.what === t.Obstacles.Dif);
	},
	
	isObstacleInFront : function(){
		var px = this.position[0];
		var py = this.position[1];
		var dx = this.direction()[0];
		var dy = this.direction()[1];	
		var fromTile = this.table[px][py];
		var vec = t.Operators.r([dx, dy], -fromTile.angle);
		try{
			if(px+dx<0||dx+px>=this.m||py+dy<0||py+dy>=this.n
				||(this.table[px+dx][py+dy].what === t.Obstacles.Obstacle)) return true;
		}
		catch(err){
			console.log(err);
			console.log(px+"  "+py+"     "+dx+"  "+dy+"       "+this.n+"  "+this.m);
			console.log(this.table[px+dx][py+dy]);
			throw "kupa";
		}
		if(fromTile.what===t.Obstacles.Wall)
			if(vec[0]>0) return true;
		if(fromTile.what===t.Obstacles.Tunnel)
			if(vec[0]!==0) return true;
		if(fromTile.what===t.Obstacles.Corner)
			if(vec[0]>0||vec[1]>0) return true;
		if(fromTile.what===t.Obstacles.DeadEnd)
			if(vec[0]>0||vec[1]!==0) return true;
		return false;
	},
		
	
	rotate : function(angle){
		this.roboangle +=angle;
	},
	
	wait : function(){
		t.Animator.pushRobomation({});
	},
	
	pri : function(){
		console.log("k¹ty "+this.roboangle+"  "+this.robodisplayangle);
	},

	canMove : function(fromTile, d){
		var angle = fromTile.angle;
		var vec = t.Operators.r(d, -fromTile.angle);
		if(fromTile.what===t.Obstacles.Wall)
			if(vec[0]>0) return false;
		if(fromTile.what===t.Obstacles.Tunnel)
			if(vec[0]!==0) return false;
		if(fromTile.what===t.Obstacles.Corner)
			if(vec[0]>0||vec[1]>0) return false;
		if(fromTile.what===t.Obstacles.DeadEnd)
			if(vec[0]>0||vec[1]!==0) return false;
		return true;
	},
	setRobot : function(x, y, angle){
		var wid = this.unitwidth;
        var inter = this.interval;
		var totWid = (this.m)*(wid+inter)+inter;
		var totHei = (this.n)*(wid+inter)+inter;
		this.position = [x,y];
		this.roboangle = angle;
		this.robo.play('default');
		this.robo.p.x = (inter+wid)*this.position[0]+inter-totWid/2+wid/2; 
		this.robo.p.y = (inter+wid)*this.position[1]+inter-totHei/2+wid/2;
		this.robo.p.angle = -angle*90;
		this.robo.p.scale = 1;
		this.robo.reset();
		t.RobotSfx.runStart();
	},

	animateMove : function(vec, callback){
		this.robo.move(vec[0]*(this.unitwidth+this.interval),
			vec[1]*(this.unitwidth+this.interval), t.TuringTable.stepTime, callback);
		//this.robot.css({"top" : "+="+vec[1]*(this.unitwidth+this.interval), "left" : "+="+vec[0]*(this.unitwidth+this.interval)});
	},
	animateRotate : function(angle, callback){
		this.robo.rotate(-angle*90, t.TuringTable.stepTime, callback);
		//this.robodisplayangle+=angle;
		//this.updateAngle();
	},
	animateIncrement : function(color, callback){
		this.counterPanel.increment(color, callback);
	},
	animateDecrement : function(color, callback){
		this.counterPanel.decrement(color, callback);
	},
	animateEatDot : function(coor, callback, lastOne){
		t.RobotSfx.play(lastOne ? 'pickup' : 'dot');
		this.display1.tiles[coor[1]][coor[0]].removeDot(callback);
	}, 
	animateVictory : function(callback){
		t.RobotSfx.play('exit');
		if(this.table[this.position[0]][this.position[1]].what!==t.Obstacles.End)
			this.robo.disappear(callback);
		else 
		this.display1.tiles[this.position[1]][this.position[0]].playAnimation("open",
			function(){
				t.RobotTable.robo.disappear(callback);
			}
		);
		//this.robo.p.scale =0.4;
		//this.robo.rotate(10000, 10, callback);
		
		
	},
	animateWait : function(){console.error('wainting');},
	animateDrown : function(callback){
		t.RobotSfx.play('drown');
		this.robo.drown(t.RobotSfx.failAfter(callback));
	},
	animateWallBump : function(dir, callback){
		t.RobotSfx.play('bump');
		this.robo.wallBump(dir, t.TuringTable.stepTime, callback);
	},
	animateSense : function(sense, callback){	//sense = {kind: 'wall'|'magic', result: bool}
		t.RobotSfx.play('scan');
		this.robo.sense(sense, t.TuringTable.stepTime, callback);
	},

	animateDrownInLava : function(callback){
		t.RobotSfx.play('lava');
		this.robo.drownInLava(t.RobotSfx.failAfter(callback));
	},
	animateElectrocute : function(callback){
		t.RobotSfx.play('zap');
		this.robo.electrocute(t.RobotSfx.failAfter(callback));
	},
	animateSwapTile : function(x, y, oldContent, newContent, callback){
		var what = newContent && newContent.what;
		if(what === t.Obstacles.CrackedIce) t.RobotSfx.play('ice', {volume : 0.5});	//cracks
		else if(what === t.Obstacles.Water) t.RobotSfx.play('ice');	//breaks
		else if(what === t.Obstacles.End) t.RobotSfx.play('unlock');	//trap disarmed
		this.styleATile(x,y,newContent);
		callback();
	},
    moveForward : function(step){
		var px = this.position[0];
		var py = this.position[1];
		var dx = this.direction()[0];
		var dy = this.direction()[1];
		var curr = this.table[px][py];
		
		if(this.isObstacleInFront()){
			step.wallBump = [this.direction()[0]*4, this.direction()[1]*4];
			return false;
		} 
		if(this.table[px+dx][py+dy].dot){
			this.dotsRemaining--;
			this.table[px+dx][py+dy].dot = false;
			step.dotEaten = [px+dx, py+dy];
			if(this.dotsRemaining===0){
				step.end = 'victory';
				t.TuringTable.saveNumberOfStepsAndParts();
			}
		} 
		if(this.table[px+dx][py+dy].what===t.Obstacles.End) {
			step.end = 'victory';
			t.TuringTable.saveNumberOfStepsAndParts();
		} else  
		if(this.table[px+dx][py+dy].what===t.Obstacles.TrappedChest) {
			step.end = "electro";
			t.TuringTable.gameon = false;
		} else 
		if(this.table[px+dx][py+dy].what===t.Obstacles.Lava) {
			step.end = "lava";
			t.TuringTable.gameon = false;
		} else 
		if(this.table[px+dx][py+dy].what===t.Obstacles.Water) {
			step.end = "drowned";
			t.TuringTable.gameon = false;
		}
		if(curr.what===t.Obstacles.Ice){
			t.RobotTable.swapTile(px,py,this.table[px][py],{what: t.Obstacles.CrackedIce, angle: 0});
			step.swapTile = {x: px, y: py, oldContent : this.table[px][py], newContent : {what : t.Obstacles.CrackedIce, angle : 0}};
		} else 
		if(curr.what===t.Obstacles.CrackedIce){
			t.RobotTable.swapTile(px,py,this.table[px][py],{what: t.Obstacles.Water, angle: 0});
			step.swapTile = {x: px, y: py, oldContent : this.table[px][py], newContent : {what : t.Obstacles.Water, angle : 0}};
		}		
        this.position[0]+=this.direction()[0];
        this.position[1]+=this.direction()[1];
		return true;
    },
	
	currentTile : function(){
		if(this.position[0]<0||this.position[1]<0||this.position[0]>=this.n||this.position[1]>=this.n) return t.Operators.Empty;
		return this.table[this.position[0]][this.position[1]].what;
	},
	
	printtable : function(){
		for(var i=0; i<this.table.length; i++){
			var s ="";
			for(var j=0; j<this.table[i].length; j++)
				s+="0";
		}
	},
	
	saveLabirynthAsString : function(){
		var ret = "";
		var angle;
		for(var i=0; i<this.n; i++)
			for(var j=0; j<this.n; j++){
				angle = this.table[i][j].angle;
				angle = angle >=0 ? angle%4 : -((-angle)%4);
				if(this.table[i][j].what===t.Obstacles.Obstacle) ret+="that.set("+i+", "+j+", t.Obstacles.Obstacle, "+angle; else
				if(this.table[i][j].what===t.Obstacles.Wall) ret+="that.set("+i+", "+j+", t.Obstacles.Wall, "+angle; else 
				if(this.table[i][j].what===t.Obstacles.Tunnel) ret+="that.set("+i+", "+j+", t.Obstacles.Tunnel, "+angle; else 
				if(this.table[i][j].what===t.Obstacles.Corner) ret+="that.set("+i+", "+j+", t.Obstacles.Corner, "+angle; else 
				if(this.table[i][j].what===t.Obstacles.DeadEnd) ret+="that.set("+i+", "+j+", t.Obstacles.DeadEnd, "+angle; else
				if(this.table[i][j].what===t.Obstacles.Ice) ret+="that.set("+i+", "+j+", t.Obstacles.Ice, "+angle; else 
				if(this.table[i][j].what===t.Obstacles.Dif) ret+="that.set("+i+", "+j+", t.Obstacles.Dif, "+angle; else 
				if(this.table[i][j].what===t.Obstacles.Empty) ret+="that.set("+i+", "+j+", t.Obstacles.Empty, "+angle; else 
				if(this.table[i][j].what===t.Obstacles.End) ret+="that.set("+i+", "+j+", t.Obstacles.End, "+angle; else 
				if(this.table[i][j].what===t.Obstacles.CrackedIce) ret+="that.set("+i+", "+j+", t.Obstacles.CrackedIce, "+angle; else
				if(this.table[i][j].what===t.Obstacles.Lava) ret+="that.set("+i+", "+j+", t.Obstacles.Lava, t.Levels.u.randInt(4)"; 	
				else console.log(this.table[i][j].what);
				if(this.table[i][j].dot) ret+=", true";
				ret += ");\n";
			}
		return ret;
	},
	setCounterLabels : function(counters, labels){
		for(var i in counters){
			if(typeof labels[i]==="number")
				this.counterPanel.set(counters[i], labels[i]);
			else
				this.counterPanel.setCounterLabel(counters[i], labels[i]);
		}
	},
	setCounterLabel : function(counter, label){
		if(typeof label==="number")
			this.counterPanel.set(counter, label);
		else
			this.counterPanel.setCounterLabel(counter, label);
	},
	addCounters: function(whichOnes){
		this.counters = {};
		for(var i in whichOnes) this.counters[whichOnes[i]] = 0;
		// HTML dials on the game screen (js/scenes/level.js), same API as Q.CounterPanel
		this.counterPanel = new t.CounterDials(whichOnes);
	},
	incrementCounter : function(i){
		this.counters[i]++;
	},
	decrementCounter : function(i){
		if(this.counters[i]===0) {
			return false;
		}
		this.counters[i]--;
		return true;
	},
	setCounter : function(color, number){
		this.counters[color] = number;
	},
	printLab : function(){
		for(var i=0; i<this.n; i++){
			var s = "";
			for(var j=0; j<this.m; j++){
				s+=this.table[i][j].what===t.Obstacles.Empty?'_':1;
			}
			console.log(s);
		}
	}
	
	
}

// Gameplay sounds (names in docs/audio/SFX.md). Plain steps and turns are
// silent. Sounds that can repeat every step are spaced out at fast playback
// speeds; 'fail' plays at most once per run (setRobot starts a run).
t.RobotSfx = {
	minGap : {scan : 0.25, bump : 0.12, dot : 0.06},	//seconds of real time
	volume : {scan : 0.7},
	last : {},
	failed : false,
	play : function(name, opts){
		var now = Date.now()/1000;
		if(this.minGap[name] && this.last[name] && now-this.last[name] < this.minGap[name]) return false;
		this.last[name] = now;
		if(!opts && this.volume[name]) opts = {volume : this.volume[name]};
		if(!t.Sfx || !t.Sfx.play) return false;
		return t.Sfx.play(name, opts);
	},
	runStart : function(){ this.failed = false; },
	fail : function(){
		if(this.failed) return;
		this.failed = true;
		this.play('fail');
	},
	failAfter : function(callback){		//wraps a death animation's callback
		return function(){
			t.RobotSfx.fail();
			if(callback) callback();
		};
	}
};
